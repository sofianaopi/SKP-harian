// TAMBAHAN untuk Code.gs yang sudah terpasang (fitur: dokumen RK sama digabung ke dokumen ke-1)
// Tempel blok di bawah ini di dalam fungsi doPost, TEPAT SEBELUM baris:   if (req.aksi === 'hapus') {
// Lalu: Deploy -> Manage deployments -> ikon pensil -> Version: New version -> Deploy.
// Opsional (agar link dokumen tidak berubah setelah digabung): di editor Apps Script klik
// Services (+) -> pilih "Drive API" -> Add.
    if (req.aksi === 'ambil' || req.aksi === 'perbarui') {
      // dokumen ke-1 (RK sama) dibuka / ditimpa saat kegiatan baru digabung ke dalamnya
      var fA = DriveApp.getFileById(req.id);
      var fPegA = ambilFolder_(induk, bersihNama_((peg.nip_baru || peg.nip) + ' - ' + peg.nama), true);
      if (!fPegA || !diDalam_(fA, fPegA.getId())) throw new Error('Dokumen ini bukan milik Anda');
      if (fA.isTrashed()) throw new Error('Dokumen lama sudah dihapus (ada di sampah Drive)');
      if (req.aksi === 'ambil') return balas_({ ok: true, id: fA.getId(), nama: fA.getName(), data: Utilities.base64Encode(fA.getBlob().getBytes()) });
      if (!req.data) throw new Error('Data dokumen kosong');
      var blobB = Utilities.newBlob(Utilities.base64Decode(req.data), MIME_DOCX, fA.getName());
      var hasilB = null;
      try {   // link tetap sama bila layanan lanjutan "Drive API" diaktifkan (Services → Drive API)
        if (typeof Drive !== 'undefined' && Drive.Files) { Drive.Files.update({}, fA.getId(), blobB); hasilB = DriveApp.getFileById(fA.getId()); }
      } catch (errUp) { hasilB = null; }
      if (!hasilB) {   // tanpa Drive API: buat file baru di folder yang sama, file lama ke sampah (link berganti)
        var folderB = fA.getParents().next();
        hasilB = folderB.createFile(blobB);
        if (AKSES !== 'PRIVATE') { try { hasilB.setSharing(DriveApp.Access[AKSES], DriveApp.Permission.VIEW); } catch (errBagi2) { } }
        fA.setTrashed(true);
      }
      return balas_({ ok: true, id: hasilB.getId(), url: hasilB.getUrl(), nama: hasilB.getName(), ukuran: hasilB.getSize() });
    }
