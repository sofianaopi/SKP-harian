# DESIGN.md — SAKTI (Sahabat Kinerja Terintegrasi), BPS Kota Kendari

**Arah:** kantor statistik yang rapi dan tenang. Data lebih penting daripada hiasan: satu warna biru untuk aksi, satu hijau untuk "Catat", sisanya netral. Tampilannya harus nyaman dibaca pimpinan di HP kecil, tanpa terasa penuh.

Token ada di `tema.css`. Halaman memakai **nama token** (`var(--…)`), tidak menulis nilai mentah.

## 1. Warna

| Token | Nilai | Peran |
|---|---|---|
| `--n-0` | `#FFFFFF` | Permukaan kartu, input, topbar |
| `--n-25` | `#F6F8FB` | Latar halaman, kepala tabel |
| `--n-50` | `#EEF2F6` | Isian halus, hover baris & tombol sekunder |
| `--n-100` | `#E2E7EE` | Garis kartu & pemisah |
| `--n-200` | `#CBD3DD` | Garis input & tombol sekunder |
| `--n-500` | `#6B7686` | Placeholder, ikon nonaktif (4,6:1) |
| `--n-600` | `#556274` | Teks sekunder, label, keterangan (6,2:1) |
| `--n-800` | `#1F2A37` | Teks utama (14,5:1) |
| `--n-900` | `#0F1722` | Judul, toast |
| `--biru-50` | `#EAF2FB` | Latar terpilih, ikon KPI, info |
| `--biru-100` | `#D3E5F7` | Garis fokus lembut, batang grafik pasif |
| `--biru-600` | `#155EA8` | **Primer:** tombol utama, tautan, menu aktif (6,6:1) |
| `--biru-700` | `#0F4C8A` | Hover/tekan tombol utama |
| `--biru-900` | `#0B2F55` | Sidebar, kotak sapaan (hero) |
| `--hijau-50` | `#E6F5EF` | Latar "Catat", status sudah mengisi |
| `--hijau-600` | `#087F5B` | **Aksen tunggal:** Catat Kegiatan (menu, header obrolan, tombol kirim) (5,0:1) |
| `--hijau-700` | `#066A4C` | Hover/tekan aksen |
| `--sukses` / `--sukses-bg` | `#166534` / `#E8F6EE` | Berhasil, naik, sudah |
| `--peringatan` / `--peringatan-bg` | `#B45309` / `#FEF3E2` | Perlu perhatian, belum ber-RK |
| `--bahaya` / `--bahaya-bg` | `#B42318` / `#FDEDEC` | Error, hapus, tidak aktif |

**Warna data** (hanya grafik & penanda bidang, bukan tombol): `--data-1` `#155EA8`, `--data-2` `#0A8F6A`, `--data-3` `#D9772B`, `--data-4` `#7A5AC8`, `--data-5` `#C2417A`, `--data-6` `#2E9BB8`.

**Pengecualian:** layar Kuis BerAKHLAK memakai palet permainannya sendiri (ungu, merah, biru, kuning, hijau), hanya di dalam layar kuis.

Mode gelap: belum dipakai. Semua token netral sudah diberi nama agar mode gelap cukup menimpa nilainya nanti.

## 2. Tipografi

- **Huruf:** Plus Jakarta Sans (variabel, disimpan sendiri di `fonts/`, lisensi OFL), cadangan: sistem. Satu keluarga untuk semua.
- **Angka:** `font-variant-numeric: tabular-nums` untuk tabel, KPI, dan jam.

| Token | Ukuran / tinggi baris | Peran |
|---|---|---|
| `--t-xs` | 12 / 16 | Badge, label kecil, keterangan grafik |
| `--t-sm` | 13 / 18 | Kepala tabel, info tambahan, tab |
| `--t-ui` | 14 / 20 | Isi tabel, menu, tombol |
| `--t-body` | 16 / 24 | Paragraf, input (16 px di HP agar tidak di-zoom) |
| `--t-h4` | 17 / 24 | Judul kartu |
| `--t-h3` | 20 / 28 | Judul bagian, judul topbar |
| `--t-h2` | 26 / 34 | Judul halaman, sapaan |
| `--t-angka` | 32 / 38 | Angka KPI |

Bobot: 400 isi, 500 menu, 600 label & tombol, 700 judul, 800 angka KPI. Panjang baris paragraf maks. 70 karakter.

## 3. Jarak

Skala 4: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40.
- Padding halaman: 28 desktop, 16 HP. Lebar isi maks. 1240 px.
- Kartu: padding 20 (HP 16), jarak antarkartu 20 (HP 12).
- Jarak antarbagian halaman: 24.

## 4. Bentuk & kedalaman

- Radius: `--r-sm` 6 (badge kotak, centang), `--r-md` 10 (tombol, input, item menu), `--r-lg` 14 (kartu, modal, hero), `--r-full` 999 (pill, avatar).
- Bayangan: `--sh-1` `0 1px 2px rgba(15,23,34,.05)` untuk kartu (kartu terutama dibatasi garis `--n-100`); `--sh-2` `0 12px 32px rgba(15,23,34,.16)` untuk menu, modal, toast. Tidak ada bayangan lain.
- Tanpa glassmorphism, tanpa gradasi dekoratif. Kotak sapaan memakai warna solid `--biru-900`.

## 5. Komponen

**Prinsip kedalaman: yang timbul berarti bisa diklik.**
- Tombol dan kontrol tampak timbul seperti tuts kalkulator: gradasi tipis dari atas, kilau 1 px di tepi atas, dan "bibir" 2 px di bawah (`--n-300` untuk tombol putih, `--biru-800` untuk biru, `--hijau-800` untuk hijau).
- Saat ditekan, tombol turun 2 px dan bibirnya hilang. Pilihan yang sedang aktif (bulan/triwulan, durasi kuis, halaman tabel) tampak **tertekan**.
- Kolom isian tampak cekung (bayangan dalam 1 px).
- Kartu isi tetap **datar**, hanya bergaris, supaya tombol mudah dikenali.
- Label memakai huruf kalimat biasa, bukan kapital semua: kepala tabel, grup menu, label formulir.


- **Tombol** tinggi 40 (HP 44), radius `--r-md`, teks 14/600.
  - *Utama* `--biru-600` → hover `--biru-700`.
  - *Sekunder* putih, garis `--n-200`, hover `--n-50`.
  - *Senyap* tanpa garis, teks `--biru-600`, hover `--biru-50`.
  - *Bahaya* teks `--bahaya`; konfirmasi hapus berlatar `--bahaya`.
  - *Catat* `--hijau-600`.
  - Fokus: cincin `0 0 0 3px rgba(21,94,168,.28)`. Nonaktif: opasitas .5.
- **Input/select** tinggi 40 (HP 44), garis `--n-200`, radius `--r-md`. Fokus: garis `--biru-600` dan cincin fokus. Placeholder `--n-500`.
- **Kartu** `--n-0`, garis `--n-100`, `--r-lg`, tanpa bayangan.
- **Kartu KPI** ikon dalam kotak `--biru-50` dengan ikon `--biru-600`, satu warna untuk semua KPI. Tren naik/turun memakai pill sukses/bahaya.
- **Badge/pill** 12/600, radius penuh, pasangan warna teks + latar semantik.
- **Tabel** kepala 13/600 huruf biasa `--n-600` di `--n-25`; baris 14; hover `--n-25`. Kolom angka rata kanan.
- **Navigasi**
  - *Sidebar* `--biru-900`, item 14/500 putih 78%; aktif berlatar putih dengan teks `--biru-700`; "Catat Kegiatan" berlatar `--hijau-600`.
  - *Menu bawah (HP)* putih; yang aktif `--biru-600` dengan garis 3 px di atas.
- **Topbar** putih, garis bawah `--n-100`, judul 20/700.
- **Toast** `--n-900`, teks putih, `--r-md`, `--sh-2`.

## 6. Ikon & gambar

- Satu set ikon garis 2 px (gaya Lucide), 20 px di navigasi, 18 px di kartu, warna `currentColor`.
- Emoji tidak dipakai sebagai ikon di tombol dan menu. Pengecualian: layar kuis dan medali juara.
- Foto: hanya foto bukti kegiatan, sudut `--r-md`.
- Logo: logo SAKTI/BPS di sidebar dan layar masuk; ilustrasi tidak dipakai.

## 7. Gerak (animasi)

Gerak hanya untuk memberi arti: menunjukkan apa yang baru muncul, apa yang berubah, dan bahwa tombol sudah ditekan. Tidak ada animasi dekoratif yang berulang terus.

| Token | Nilai | Peran |
|---|---|---|
| `--dur-1` | 120 ms | Tekan tombol, ikon menu bawah |
| `--dur-2` | 200 ms | Hover, warna, modal muncul |
| `--dur-3` | 320 ms | Halaman & kartu masuk |
| `--dur-4` | 700 ms | Bar kemajuan terisi, angka KPI menghitung naik |
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | Gerak masuk (cepat lalu melambat) |
| `--ease-io` | `cubic-bezier(.4,0,.2,1)` | Perubahan warna/keadaan |

- **Pindah halaman:** bagian yang dibuka naik 8 px sambil memudar masuk.
- **Kartu:** muncul bertahap, jeda 50 ms antar kartu, maks. 200 ms.
- **Bar kemajuan:** terisi dari kiri.
- **Angka KPI:** menghitung naik ±0,7 detik, tetapi tidak dihitung ulang kalau nilainya sama dengan tampilan sebelumnya.
- **Tombol:** turun 2 px saat ditekan, seperti tuts yang benar-benar ditekan.
- **Modal & menu ⋮:** muncul dengan geser dan memudar.
- **Baris tabel tidak dianimasikan**, supaya tidak berkedip saat mengetik di kolom cari.
- **Aksesibilitas:** bila perangkat diatur "kurangi gerakan" (`prefers-reduced-motion`), semua animasi mati dan angka langsung tampil final.
- Layar kuis punya gerak permainan sendiri (podium, konfeti) dan hanya berlaku di sana.
