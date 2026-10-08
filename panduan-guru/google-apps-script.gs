/**
 * AlgoQuest – Database Guru (Google Apps Script)
 * ------------------------------------------------
 * Skrip ini dipasang di Google Spreadsheet MILIK GURU (Ekstensi → Apps Script).
 * Game AlgoQuest mengirim ringkasan progres siswa ke sini, lalu skrip menulisnya
 * ke dua lembar:
 *   1. "Rekap Siswa"    – satu baris per siswa, selalu diperbarui ke progres terbaru
 *   2. "Log Aktivitas"  – catatan setiap kejadian (daftar, menyelesaikan level, kuis, ...)
 *
 * Keamanan:
 *   - Skrip hanya MENERIMA data (doPost). Tidak ada fungsi yang mengirim data siswa
 *     keluar, sehingga daftar siswa hanya bisa dilihat di spreadsheet ini.
 *   - Semua teks dibersihkan dan dibatasi panjangnya; teks yang diawali = + - @
 *     diberi tanda petik agar tidak dijalankan sebagai rumus spreadsheet.
 *
 * Langkah pemasangan lengkap: lihat panduan-guru/PANDUAN-DATABASE.md
 */

const SHEET_REKAP = 'Rekap Siswa';
const SHEET_LOG = 'Log Aktivitas';

const REKAP_HEADERS = [
  'ID Pemain', 'Nama', 'Kelas', 'Maze', 'Teka-Teki', 'Pola', 'Total Level',
  'Nilai Kuis', 'Lulus Kuis', 'Nama di Sertifikat', 'Pertama Main', 'Terakhir Aktif', 'Aktivitas Terakhir'
];
const LOG_HEADERS = ['Waktu', 'Nama', 'Kelas', 'Aktivitas', 'Detail', 'Maze', 'Teka-Teki', 'Pola', 'ID Pemain'];

/** Jalankan SEKALI dari editor Apps Script untuk menyiapkan kedua lembar. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEET_REKAP, REKAP_HEADERS);
  ensureSheet_(ss, SHEET_LOG, LOG_HEADERS);
  ss.setSpreadsheetTimeZone('Asia/Jakarta');
}

/** Membuka URL Web App di browser hanya menampilkan pesan, bukan data siswa. */
function doGet() {
  return ContentService.createTextOutput(
    'Database AlgoQuest aktif. Data siswa hanya dapat dilihat oleh guru di Google Spreadsheet.'
  );
}

/** Menerima laporan progres dari game. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const report = sanitizeReport_(data);
    if (!report) return json_({ ok: false, error: 'data tidak valid' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rekap = ensureSheet_(ss, SHEET_REKAP, REKAP_HEADERS);
    const log = ensureSheet_(ss, SHEET_LOG, LOG_HEADERS);
    const now = new Date();

    upsertRekap_(rekap, report, now);
    log.appendRow([now, report.nama, report.kelas, report.aktivitas, report.detail,
      report.mazeText, report.puzzleText, report.polaText, report.id]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function upsertRekap_(sheet, r, now) {
  const lastRow = sheet.getLastRow();
  let rowIndex = -1;
  if (lastRow >= 2) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === r.id) { rowIndex = i + 2; break; }
    }
  }
  const firstSeen = rowIndex > 0 ? sheet.getRange(rowIndex, 11).getValue() || now : now;
  const row = [
    r.id, r.nama, r.kelas, r.mazeText, r.puzzleText, r.polaText, r.totalText,
    r.kuisText, r.lulusKuis ? 'Ya' : 'Belum', r.sertifikat, firstSeen, now, r.aktivitas
  ];
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function sanitizeReport_(d) {
  const id = clean_(d.id, 64);
  const nama = clean_(d.nama, 40);
  const kelas = clean_(d.kelas, 15);
  if (!id || !nama || !kelas || !/^[A-Za-z0-9-]+$/.test(id)) return null;

  const mazeTotal = num_(d.mazeTotal, 1, 200, 25);
  const puzzleTotal = num_(d.puzzleTotal, 1, 200, 25);
  const polaTotal = num_(d.polaTotal, 1, 500, 50);
  const kuisTotal = num_(d.kuisTotal, 1, 100, 5);
  const maze = num_(d.maze, 0, mazeTotal, 0);
  const puzzle = num_(d.puzzle, 0, puzzleTotal, 0);
  const pola = num_(d.pola, 0, polaTotal, 0);
  const hasKuis = d.kuis !== null && d.kuis !== undefined && d.kuis !== '';
  const kuis = hasKuis ? num_(d.kuis, 0, kuisTotal, 0) : null;

  return {
    id, nama, kelas,
    mazeText: maze + ' / ' + mazeTotal,
    puzzleText: puzzle + ' / ' + puzzleTotal,
    polaText: pola + ' / ' + polaTotal,
    totalText: (maze + puzzle + pola) + ' / ' + (mazeTotal + puzzleTotal + polaTotal),
    kuisText: kuis === null ? '-' : kuis + ' / ' + kuisTotal,
    lulusKuis: d.lulusKuis === true,
    sertifikat: clean_(d.sertifikat, 40),
    aktivitas: clean_(d.aktivitas, 60) || 'Aktivitas',
    detail: clean_(d.detail, 80)
  };
}

function clean_(value, maxLength) {
  let s = String(value === null || value === undefined ? '' : value)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // cegah teks dijalankan sebagai rumus
  return s;
}

function num_(value, min, max, fallback) {
  const n = Math.floor(Number(value));
  return isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#04387a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
