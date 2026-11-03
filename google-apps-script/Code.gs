/**
 * SKP HARIAN — Penyimpan dokumen Bukti Dukung ke Google Drive
 * ------------------------------------------------------------
 * Dipasang SEKALI oleh admin di script.google.com (lihat PANDUAN-GOOGLE-DRIVE.txt).
 * Cara kerja:
 *   - Aplikasi SKP Harian mengirim dokumen Word (.docx) + token sesi login pegawai.
 *   - Skrip memeriksa token ke Supabase (pegawai harus terdaftar & aktif).
 *   - Dokumen disimpan ke: FOLDER INDUK / "<NIP baru> - <Nama>" / "<Periode>" / file.docx
 *   - Dokumen dibagikan sesuai AKSES di bawah, lalu link-nya dikirim balik ke aplikasi.
 */

// ====== ISI 3 BARIS INI ======
var SUPABASE_URL = 'https://ISI_PROJECT.supabase.co';   // sama dengan SUPABASE_URL di config.js (tanpa /rest/v1/)
var SUPABASE_ANON_KEY = 'ISI_ANON_KEY';                 // kunci anon/publishable (BUKAN service_role)
var FOLDER_INDUK_ID = 'ISI_ID_FOLDER_DRIVE';            // ID folder Google Drive tujuan
// Siapa yang bisa membuka link dokumen:
//   'ANYONE_WITH_LINK'  = siapa pun yang punya link (paling mudah dibagikan)
//   'DOMAIN_WITH_LINK'  = hanya akun di domain kantor yang punya link (akun Google Workspace)
//   'PRIVATE'           = tidak dibagikan otomatis
var AKSES = 'ANYONE_WITH_LINK';
// ==============================

var MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    var peg = cekPegawai_(req.token);
    var induk = DriveApp.getFolderById(FOLDER_INDUK_ID);
    if (req.aksi === 'ping') {
      return balas_({ ok: true, folder: induk.getName(), folderUrl: peg.peran === 'admin' ? induk.getUrl() : null, nama: peg.nama });
    }
    if (peg.peran === 'admin') throw new Error('Akun admin tidak menyimpan dokumen kegiatan');
    if (req.aksi === 'simpan') {
      if (!req.data || !req.nama) throw new Error('Data dokumen kosong');
      var namaFile = bersihNama_(req.nama);
      if (!/\.docx$/i.test(namaFile)) namaFile += '.docx';
      var fPeg = ambilFolder_(induk, bersihNama_((peg.nip_baru || peg.nip) + ' - ' + peg.nama));
      var fPer = ambilFolder_(fPeg, bersihNama_(req.periode || 'Tanpa periode'));
      // Ganti dokumen lama dengan nama yang sama (mis. dibuat ulang setelah kegiatan ditambah)
      var lama = fPer.getFilesByName(namaFile);
      while (lama.hasNext()) lama.next().setTrashed(true);
      var blob = Utilities.newBlob(Utilities.base64Decode(req.data), MIME_DOCX, namaFile);
      var file = fPer.createFile(blob);
      if (AKSES !== 'PRIVATE') {
        try { file.setSharing(DriveApp.Access[AKSES], DriveApp.Permission.VIEW); }
        catch (errBagi) { /* kebijakan domain bisa melarang berbagi publik; file tetap tersimpan */ }
      }
      return balas_({ ok: true, id: file.getId(), url: file.getUrl(), nama: namaFile, ukuran: file.getSize(), folderUrl: fPer.getUrl() });
    }
    if (req.aksi === 'hapus') {
      var f = DriveApp.getFileById(req.id);
      // hanya boleh menghapus file di dalam folder milik pegawai ini
      var fPeg2 = ambilFolder_(induk, bersihNama_((peg.nip_baru || peg.nip) + ' - ' + peg.nama), true);
      if (!fPeg2 || !diDalam_(f, fPeg2.getId())) throw new Error('Dokumen ini bukan milik Anda');
      f.setTrashed(true);
      return balas_({ ok: true });
    }
    throw new Error('Perintah tidak dikenal');
  } catch (err) {
    return balas_({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet() {
  return balas_({ ok: true, info: 'Penyimpan dokumen SKP Harian aktif. Gunakan dari aplikasi SKP Harian.' });
}

/** Periksa token login Supabase dan ambil data pegawai yang masuk. */
function cekPegawai_(token) {
  if (!token) throw new Error('Belum masuk');
  var h = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token };
  var base = SUPABASE_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
  var r = UrlFetchApp.fetch(base + '/auth/v1/user', { headers: h, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Sesi login tidak valid atau sudah berakhir. Silakan keluar lalu masuk lagi.');
  var user = JSON.parse(r.getContentText());
  var p = UrlFetchApp.fetch(base + '/rest/v1/pegawai?select=id,nama,nip,nip_baru,peran,aktif&id=eq.' + encodeURIComponent(user.id), { headers: h, muteHttpExceptions: true });
  if (p.getResponseCode() !== 200) throw new Error('Gagal membaca data pegawai (' + p.getResponseCode() + ')');
  var rows = JSON.parse(p.getContentText());
  if (!rows.length) throw new Error('Akun belum terdaftar sebagai pegawai');
  if (!rows[0].aktif) throw new Error('Akun dinonaktifkan');
  return rows[0];
}

function ambilFolder_(induk, nama, jangkanBuat) {
  var it = induk.getFoldersByName(nama);
  if (it.hasNext()) return it.next();
  return jangkanBuat ? null : induk.createFolder(nama);
}
function diDalam_(file, folderId) {
  var ps = file.getParents();
  while (ps.hasNext()) if (ps.next().getId() === folderId) return true;
  // file berada di subfolder periode: periksa satu tingkat ke atas
  ps = file.getParents();
  while (ps.hasNext()) { var p2 = ps.next().getParents(); while (p2.hasNext()) if (p2.next().getId() === folderId) return true; }
  return false;
}
function bersihNama_(s) { return String(s || '').replace(/[\\\/:*?"<>|#%]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150); }
function balas_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Jalankan sekali dari editor (pilih fungsi "uji" lalu Run) untuk memberi izin akses Drive & internet. */
function uji() {
  var f = DriveApp.getFolderById(FOLDER_INDUK_ID);
  Logger.log('Folder induk: ' + f.getName() + ' — ' + f.getUrl());
  UrlFetchApp.fetch(SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/health', { headers: { apikey: SUPABASE_ANON_KEY }, muteHttpExceptions: true });
  Logger.log('Siap. Lanjutkan dengan Deploy > New deployment > Web app.');
}
