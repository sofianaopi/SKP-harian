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
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeGx4cGRnZGZ0c3d2YnhwZHFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzY2NTI2OCwiZXhwIjoyMTA5MjQxMjY4fQ.9I4NX0z5VnldxI02jfmXFToxgFVVtwpaX3fvN6GWr0g',

  // Akhiran alamat email internal untuk login NIP (tidak perlu email sungguhan).
  // Jangan diubah setelah ada pegawai yang terdaftar.
  EMAIL_DOMAIN: 'pegawai.skpharian.id',

  // Ditampilkan di halaman login
  NAMA_INSTANSI: 'BPS Kota Kendari'
};
