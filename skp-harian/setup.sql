-- =====================================================================
--  SKP HARIAN — skema database Supabase
--  Jalankan SEKALI di Supabase: menu SQL Editor -> New query -> tempel -> Run.
--  Aman dijalankan ulang (tidak menghapus data yang sudah ada).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- TABEL ----------
create table if not exists public.pegawai (
  id             uuid primary key references auth.users(id) on delete cascade,
  nip            text not null unique,
  nama           text not null,
  jabatan        text,
  unit           text,
  kota           text,
  atasan_nama    text,
  atasan_nip     text,
  atasan_jabatan text,
  peran          text not null default 'pegawai' check (peran in ('pegawai', 'admin')),
  aktif          boolean not null default true,
  dibuat         timestamptz not null default now()
);

create table if not exists public.rk (            -- Rencana Kinerja milik tiap pegawai
  id           text primary key,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nama         text not null default '',
  indikator    text,                               -- Indikator Kinerja Individu (IKI)
  satuan       text,
  target       numeric not null default 0,         -- target per bulan
  target_bulan jsonb not null default '{}'::jsonb, -- target khusus per bulan {"2026-11": 5}
  urutan       int not null default 0
);
create index if not exists rk_user on public.rk(user_id);

create table if not exists public.kegiatan (     -- catatan kegiatan harian
  id      text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tanggal date not null,
  jam     text,
  teks    text not null default '',
  rk_id   text references public.rk(id) on delete set null,
  jumlah  int not null default 1,
  foto    jsonb not null default '[]'::jsonb,     -- daftar id foto di Storage
  dibuat  bigint
);
create index if not exists kegiatan_user_tgl on public.kegiatan(user_id, tanggal);

create table if not exists public.pengaturan (   -- pengaturan kantor (mis. kop surat)
  key   text primary key,
  value jsonb
);

-- ---------- FUNGSI BANTU ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pegawai where id = auth.uid() and peran = 'admin' and aktif);
$$;

create or replace function public.is_pegawai() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pegawai where id = auth.uid() and aktif);
$$;

create or replace function public.ada_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pegawai where peran = 'admin');
$$;

-- Admin pertama: hanya bisa dipakai selama belum ada admin sama sekali
create or replace function public.daftar_admin_pertama(p_nip text, p_nama text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Belum masuk'; end if;
  perform pg_advisory_xact_lock(7471);
  if exists (select 1 from public.pegawai where peran = 'admin') then
    raise exception 'Admin sudah ada. Minta admin menambahkan akun Anda.';
  end if;
  insert into public.pegawai (id, nip, nama, peran) values (auth.uid(), trim(p_nip), trim(p_nama), 'admin');
end $$;

-- Admin mengganti password pegawai
create or replace function public.admin_set_password(p_id uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin yang boleh mengganti password pegawai'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'Password minimal 6 karakter'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where id = p_id;
end $$;

-- Admin menghapus pegawai (akun login + semua datanya)
create or replace function public.admin_hapus_pegawai(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin yang boleh menghapus pegawai'; end if;
  if p_id = auth.uid() then raise exception 'Admin tidak dapat menghapus akunnya sendiri'; end if;
  delete from auth.users where id = p_id;
end $$;

-- Lindungi kolom penting: pegawai biasa tidak bisa mengubah NIP, peran, atau status aktif
create or replace function public.pegawai_jaga() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  if not public.is_admin() then
    new.nip := old.nip; new.peran := old.peran; new.aktif := old.aktif;
  elsif new.id = auth.uid() and (new.peran <> 'admin' or not new.aktif) then
    raise exception 'Admin tidak dapat menurunkan peran atau menonaktifkan akunnya sendiri';
  end if;
  if new.nip is distinct from old.nip then   -- NIP dipakai untuk login: ikut perbarui akun
    select regexp_replace(new.nip, '\s', '', 'g') || '@' || split_part(email, '@', 2) into v_email from auth.users where id = new.id;
    update auth.users set email = v_email, updated_at = now() where id = new.id;
    update auth.identities set identity_data = jsonb_set(identity_data, '{email}', to_jsonb(v_email))
     where user_id = new.id and provider = 'email';
  end if;
  return new;
end $$;
drop trigger if exists pegawai_jaga on public.pegawai;
create trigger pegawai_jaga before update on public.pegawai for each row execute function public.pegawai_jaga();

revoke execute on function public.admin_set_password(uuid, text) from public, anon;
revoke execute on function public.admin_hapus_pegawai(uuid) from public, anon;
revoke execute on function public.daftar_admin_pertama(text, text) from public, anon;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
grant execute on function public.admin_hapus_pegawai(uuid) to authenticated;
grant execute on function public.daftar_admin_pertama(text, text) to authenticated;
grant execute on function public.ada_admin() to anon, authenticated;

-- ---------- ATURAN AKSES (Row Level Security) ----------
alter table public.pegawai    enable row level security;
alter table public.rk         enable row level security;
alter table public.kegiatan   enable row level security;
alter table public.pengaturan enable row level security;

-- pegawai: tiap orang melihat & mengubah profilnya sendiri; admin mengelola semua
drop policy if exists pegawai_baca  on public.pegawai;
drop policy if exists pegawai_tambah on public.pegawai;
drop policy if exists pegawai_ubah  on public.pegawai;
drop policy if exists pegawai_hapus on public.pegawai;
create policy pegawai_baca   on public.pegawai for select to authenticated using (id = auth.uid() or public.is_admin());
create policy pegawai_tambah on public.pegawai for insert to authenticated with check (public.is_admin());
create policy pegawai_ubah   on public.pegawai for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy pegawai_hapus  on public.pegawai for delete to authenticated using (public.is_admin() and id <> auth.uid());

-- rk & kegiatan: HANYA pemiliknya (admin pun tidak bisa melihat pekerjaan pegawai lain)
drop policy if exists rk_milik_sendiri on public.rk;
create policy rk_milik_sendiri on public.rk for all to authenticated
  using (user_id = auth.uid() and public.is_pegawai()) with check (user_id = auth.uid() and public.is_pegawai());
drop policy if exists kegiatan_milik_sendiri on public.kegiatan;
create policy kegiatan_milik_sendiri on public.kegiatan for all to authenticated
  using (user_id = auth.uid() and public.is_pegawai()) with check (user_id = auth.uid() and public.is_pegawai());

-- pengaturan kantor: semua pegawai membaca, hanya admin yang mengubah
drop policy if exists pengaturan_baca on public.pengaturan;
drop policy if exists pengaturan_admin on public.pengaturan;
create policy pengaturan_baca  on public.pengaturan for select to authenticated using (true);
create policy pengaturan_admin on public.pengaturan for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- PENYIMPANAN FOTO BUKTI ----------
insert into storage.buckets (id, name, public) values ('bukti', 'bukti', false) on conflict (id) do nothing;
drop policy if exists bukti_milik_sendiri on storage.objects;
create policy bukti_milik_sendiri on storage.objects for all to authenticated
  using (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text and public.is_pegawai())
  with check (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text and public.is_pegawai());

-- Selesai. Lanjutkan langkah berikutnya di PANDUAN.txt.
