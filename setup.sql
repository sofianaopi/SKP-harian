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

alter table public.pegawai add column if not exists nip_baru text;   -- NIP 18 digit (tampil di dokumen)
comment on column public.pegawai.nip is 'Username login: NIP lama (9 digit) untuk pegawai, atau nama pengguna untuk admin';

create table if not exists public.jenis_kegiatan (   -- daftar jenis kegiatan per bidang (dipakai bersama)
  id      text primary key,
  bidang  text not null check (bidang in ('Sosial', 'Distribusi', 'Produksi', 'Nerwilis', 'IPDS', 'TU')),
  nama    text not null,
  urutan  int not null default 0,
  dibuat_oleh uuid default auth.uid() references auth.users(id) on delete set null,
  dibuat  timestamptz not null default now()
);
create unique index if not exists jenis_kegiatan_unik on public.jenis_kegiatan (bidang, lower(nama));

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
alter table public.rk add column if not exists bidang text;   -- bidang yang mengerjakan RK ini
alter table public.rk add column if not exists bersama boolean not null default false;   -- RK dari admin: tampil untuk semua pegawai
create index if not exists rk_bersama on public.rk(bersama) where bersama;

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
alter table public.kegiatan add column if not exists bidang text;
alter table public.kegiatan add column if not exists gabung text;   -- uraian gabungan: kegiatan berulang dengan kalimat berbeda tampil sebagai satu uraian di dokumen
alter table public.kegiatan add column if not exists jenis_id text references public.jenis_kegiatan(id) on delete set null;

create table if not exists public.dokumen (       -- dokumen Bukti Dukung yang disimpan ke Google Drive
  id        text primary key,
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bidang    text,
  periode   text,
  nama_file text not null,
  drive_id  text,
  url       text not null,
  ukuran    bigint,
  dibuat    timestamptz not null default now()
);
create index if not exists dokumen_user on public.dokumen(user_id, dibuat desc);

create table if not exists public.laporan_dinas (  -- Laporan Perjalanan Dinas (fitur tambahan): pengawasan / pendataan lapangan
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  jenis       text not null default 'Pengawasan Lapangan',
  nomor_st    text,
  tanggal_st  date,
  periode     text,
  tempat      text,
  tanggal_lap date,
  jabatan     text,
  ketua       text,
  isi         jsonb not null default '[]'::jsonb,   -- [{kegiatanId, tanggal, uraian, masalah, solusi, fotoIds}]
  dibuat      timestamptz not null default now(),
  diubah      timestamptz not null default now()
);
create index if not exists laporan_dinas_user on public.laporan_dinas(user_id, diubah desc);

create table if not exists public.kegiatan_ringkas (   -- ringkasan kegiatan yang sudah diarsipkan ke Google Drive
  user_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  jumlah  int  not null default 0,   -- jumlah kegiatan pada tanggal itu yang sudah diarsipkan
  foto    int  not null default 0,   -- jumlah foto bukti yang ikut diarsipkan
  primary key (user_id, tanggal)
);

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
    new.nip := old.nip; new.nip_baru := old.nip_baru; new.peran := old.peran; new.aktif := old.aktif;
  elsif new.id = auth.uid() and (new.peran <> 'admin' or not new.aktif) then
    raise exception 'Admin tidak dapat menurunkan peran atau menonaktifkan akunnya sendiri';
  end if;
  if new.nip is distinct from old.nip then   -- username (NIP lama) dipakai untuk login: ikut perbarui akun
    select lower(regexp_replace(new.nip, '[^A-Za-z0-9._-]', '', 'g')) || '@' || split_part(email, '@', 2) into v_email from auth.users where id = new.id;
    update auth.users set email = v_email, updated_at = now() where id = new.id;
    update auth.identities set identity_data = jsonb_set(identity_data, '{email}', to_jsonb(v_email))
     where user_id = new.id and provider = 'email';
  end if;
  return new;
end $$;
drop trigger if exists pegawai_jaga on public.pegawai;
create trigger pegawai_jaga before update on public.pegawai for each row execute function public.pegawai_jaga();

-- Rekap untuk monitoring admin: HANYA angka (jumlah kegiatan, hari terisi, foto), bukan isi pekerjaan
create or replace function public.admin_rekap(p_dari date, p_sampai date, p_hari_ini date)
returns table (id uuid, nama text, nip text, nip_baru text, jabatan text, unit text, aktif boolean,
               jumlah_kegiatan bigint, hari_terisi bigint, jumlah_foto bigint, terakhir date, isi_hari_ini boolean)
language sql stable security definer set search_path = public as $$
  with semua as (   -- kegiatan yang masih ada + ringkasan kegiatan yang sudah diarsipkan ke Drive
    select user_id, tanggal, 1::bigint as jml, jsonb_array_length(foto)::bigint as ft from public.kegiatan
    union all
    select user_id, tanggal, jumlah::bigint, foto::bigint from public.kegiatan_ringkas where jumlah > 0
  )
  select p.id, p.nama, p.nip, p.nip_baru, p.jabatan, p.unit, p.aktif,
         coalesce(sum(s.jml) filter (where s.tanggal between p_dari and p_sampai), 0)::bigint,
         count(distinct s.tanggal) filter (where s.tanggal between p_dari and p_sampai),
         coalesce(sum(s.ft) filter (where s.tanggal between p_dari and p_sampai), 0)::bigint,
         max(s.tanggal),
         coalesce(bool_or(s.tanggal = p_hari_ini), false)
    from public.pegawai p
    left join semua s on s.user_id = p.id
   where p.peran = 'pegawai' and public.is_admin()
   group by p.id
   order by p.nama;
$$;
revoke execute on function public.admin_rekap(date, date, date) from public, anon;
grant execute on function public.admin_rekap(date, date, date) to authenticated;

-- Arsipkan kegiatan (setelah tersimpan di Google Drive): catat ringkasan per tanggal lalu hapus barisnya, dalam satu transaksi
create or replace function public.arsipkan_kegiatan(p_ids text[]) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_pegawai() then raise exception 'Tidak diizinkan'; end if;
  insert into public.kegiatan_ringkas (user_id, tanggal, jumlah, foto)
    select user_id, tanggal, count(*), coalesce(sum(jsonb_array_length(foto)), 0)
      from public.kegiatan where id = any(p_ids) and user_id = auth.uid()
     group by user_id, tanggal
  on conflict (user_id, tanggal) do update
    set jumlah = public.kegiatan_ringkas.jumlah + excluded.jumlah, foto = public.kegiatan_ringkas.foto + excluded.foto;
  delete from public.kegiatan where id = any(p_ids) and user_id = auth.uid();
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.arsipkan_kegiatan(text[]) from public, anon;
grant execute on function public.arsipkan_kegiatan(text[]) to authenticated;

revoke execute on function public.admin_set_password(uuid, text) from public, anon;
revoke execute on function public.admin_hapus_pegawai(uuid) from public, anon;
revoke execute on function public.daftar_admin_pertama(text, text) from public, anon;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
grant execute on function public.admin_hapus_pegawai(uuid) to authenticated;
grant execute on function public.daftar_admin_pertama(text, text) to authenticated;
grant execute on function public.ada_admin() to anon, authenticated;

-- Ganti nama bidang pekerjaan di semua data (kegiatan, RK, arsip dokumen) — hanya admin
create or replace function public.admin_ganti_bidang(p_lama text, p_baru text) returns json
language plpgsql security definer set search_path = public as $$
declare n_keg int; n_rk int; n_dok int;
begin
  if not public.is_admin() then raise exception 'Hanya admin yang boleh mengganti nama bidang'; end if;
  if coalesce(trim(p_baru), '') = '' then raise exception 'Nama bidang baru kosong'; end if;
  update public.kegiatan set bidang = trim(p_baru) where bidang = p_lama; get diagnostics n_keg = row_count;
  update public.rk       set bidang = trim(p_baru) where bidang = p_lama; get diagnostics n_rk = row_count;
  update public.dokumen  set bidang = trim(p_baru) where bidang = p_lama; get diagnostics n_dok = row_count;
  return json_build_object('kegiatan', n_keg, 'rk', n_rk, 'dokumen', n_dok);
end $$;
revoke execute on function public.admin_ganti_bidang(text, text) from public, anon;
grant execute on function public.admin_ganti_bidang(text, text) to authenticated;

-- ---------- ATURAN AKSES (Row Level Security) ----------
alter table public.pegawai    enable row level security;
alter table public.rk         enable row level security;
alter table public.kegiatan   enable row level security;
alter table public.pengaturan enable row level security;
alter table public.jenis_kegiatan enable row level security;
alter table public.dokumen    enable row level security;
alter table public.kegiatan_ringkas enable row level security;

-- pegawai: tiap orang melihat & mengubah profilnya sendiri; admin mengelola semua
drop policy if exists pegawai_baca  on public.pegawai;
drop policy if exists pegawai_tambah on public.pegawai;
drop policy if exists pegawai_ubah  on public.pegawai;
drop policy if exists pegawai_hapus on public.pegawai;
create policy pegawai_baca   on public.pegawai for select to authenticated using (id = auth.uid() or public.is_admin());
create policy pegawai_tambah on public.pegawai for insert to authenticated with check (public.is_admin());
create policy pegawai_ubah   on public.pegawai for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy pegawai_hapus  on public.pegawai for delete to authenticated using (public.is_admin() and id <> auth.uid());

-- rk: RK pribadi hanya pemiliknya; RK "bersama" dibuat admin dan dibaca semua pegawai
drop policy if exists rk_milik_sendiri on public.rk;
drop policy if exists rk_baca on public.rk;
drop policy if exists rk_tambah on public.rk;
drop policy if exists rk_ubah on public.rk;
drop policy if exists rk_hapus on public.rk;
create policy rk_baca   on public.rk for select to authenticated
  using (public.is_pegawai() and (user_id = auth.uid() or bersama));
create policy rk_tambah on public.rk for insert to authenticated
  with check (user_id = auth.uid() and public.is_pegawai() and (not bersama or public.is_admin()));
create policy rk_ubah   on public.rk for update to authenticated
  using ((user_id = auth.uid() and public.is_pegawai() and not bersama) or (bersama and public.is_admin()))
  with check (user_id = auth.uid() and public.is_pegawai() and (not bersama or public.is_admin()));
create policy rk_hapus  on public.rk for delete to authenticated
  using ((user_id = auth.uid() and public.is_pegawai() and not bersama) or (bersama and public.is_admin()));
-- kegiatan: HANYA pemiliknya (admin pun tidak bisa melihat pekerjaan pegawai lain)
drop policy if exists kegiatan_milik_sendiri on public.kegiatan;
create policy kegiatan_milik_sendiri on public.kegiatan for all to authenticated
  using (user_id = auth.uid() and public.is_pegawai()) with check (user_id = auth.uid() and public.is_pegawai());

-- jenis kegiatan: semua pegawai membaca & menambah; admin atau pembuatnya yang mengubah/menghapus
drop policy if exists jenis_baca on public.jenis_kegiatan;
drop policy if exists jenis_tambah on public.jenis_kegiatan;
drop policy if exists jenis_ubah on public.jenis_kegiatan;
drop policy if exists jenis_hapus on public.jenis_kegiatan;
create policy jenis_baca   on public.jenis_kegiatan for select to authenticated using (public.is_pegawai());
create policy jenis_tambah on public.jenis_kegiatan for insert to authenticated with check (public.is_pegawai() and (dibuat_oleh = auth.uid() or public.is_admin()));
create policy jenis_ubah   on public.jenis_kegiatan for update to authenticated using (public.is_admin() or dibuat_oleh = auth.uid()) with check (public.is_admin() or dibuat_oleh = auth.uid());
create policy jenis_hapus  on public.jenis_kegiatan for delete to authenticated using (public.is_admin() or dibuat_oleh = auth.uid());

-- dokumen (link Google Drive): hanya pemiliknya
alter table public.laporan_dinas enable row level security;
drop policy if exists laporan_dinas_milik_sendiri on public.laporan_dinas;
create policy laporan_dinas_milik_sendiri on public.laporan_dinas for all to authenticated
  using (user_id = auth.uid() and public.is_pegawai()) with check (user_id = auth.uid() and public.is_pegawai());
drop policy if exists dokumen_milik_sendiri on public.dokumen;
create policy dokumen_milik_sendiri on public.dokumen for all to authenticated
  using (user_id = auth.uid() and public.is_pegawai()) with check (user_id = auth.uid() and public.is_pegawai());

-- ringkasan arsip: pegawai hanya membaca miliknya (diisi lewat fungsi arsipkan_kegiatan)
drop policy if exists ringkas_baca on public.kegiatan_ringkas;
create policy ringkas_baca on public.kegiatan_ringkas for select to authenticated using (user_id = auth.uid());

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

-- Muat ulang daftar tabel di server API agar tabel/kolom baru langsung dikenali
notify pgrst, 'reload schema';

-- Selesai. Lanjutkan langkah berikutnya di PANDUAN.txt.
