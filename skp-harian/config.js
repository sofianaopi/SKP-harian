/* =====================================================================
   PENGATURAN KONEKSI DATABASE — isi sekali setelah membuat proyek Supabase
   Supabase: Project Settings -> API (atau "API Keys")
   ===================================================================== */
window.SKP_CONFIG = {
  // Project URL, contoh: 'https://abcdefghijkl.supabase.co'
  SUPABASE_URL: 'https://pfxlxpdgdftswvbxpdqc.supabase.co/rest/v1/',

  // Kunci publik: "anon public" (eyJ...) atau "publishable" (sb_publishable_...)
  // Kunci ini memang boleh terlihat publik; keamanan data dijaga aturan di setup.sql.
  // JANGAN PERNAH memasukkan "service_role" / "secret" key di sini.
  SUPABASE_ANON_KEY: 'https://pfxlxpdgdftswvbxpdqc.supabase.co/rest/v1/',

  // Akhiran alamat email internal untuk login NIP (tidak perlu email sungguhan).
  // Jangan diubah setelah ada pegawai yang terdaftar.
  EMAIL_DOMAIN: 'pegawai.skpharian.id',

  // Ditampilkan di halaman login
  NAMA_INSTANSI: 'BPS Kota Kendari'
};
