/* ==========================================================================
   PENGATURAN DATABASE GURU
   Tempelkan URL Web App Google Apps Script milik guru di bawah ini
   (lihat panduan-guru/PANDUAN-DATABASE.md). Biarkan kosong ('') jika
   belum dipakai: game tetap berjalan, hanya tidak mengirim data.
   Catatan: URL ini hanya bisa MENGIRIM data. Data siswa hanya bisa
   dilihat oleh guru di Google Spreadsheet miliknya sendiri.
   ========================================================================== */
window.ALGOQUEST_CONFIG = {
    SHEET_URL: '',

    // PIN Panel Guru untuk SEMUA perangkat (opsional). Isi dengan baris yang
    // ditampilkan Panel Guru setelah membuat PIN. Yang disimpan hanya sidik
    // (hash) PIN, bukan PIN-nya. Kosong = PIN dibuat di masing-masing perangkat.
    TEACHER_PIN_HASH: ''
};
