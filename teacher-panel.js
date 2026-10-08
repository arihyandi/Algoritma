/* ==========================================================================
   PANEL GURU: rekap siswa di perangkat ini + unduh file Excel (.xlsx)
   --------------------------------------------------------------------------
   - Membaca daftar pemain, progres tiap pemain, dan log aktivitas yang
     disimpan app.js di perangkat ini (localStorage).
   - Dikunci dengan PIN guru. PIN tidak disimpan apa adanya, hanya sidik
     (hash SHA-256) nya, baik di config.js maupun di perangkat.
   - File .xlsx dibuat langsung di browser tanpa library dari internet,
     sehingga tetap bisa dipakai di lab komputer yang offline.
   Dimuat SETELAH app.js karena memakai fungsi & data dari app.js.
   ========================================================================== */

const TEACHER_PIN_KEY = 'algoquest_teacher_pin_hash_v1';
const TEACHER_PIN_SALT = 'algoquest-guru:';
const MIN_TEACHER_PIN_LENGTH = 6;
let teacherUnlocked = false;

/* ---------- SHA-256 (untuk PIN guru) ---------- */
function sha256Hex(message) {
    const bytes = new TextEncoder().encode(message);
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bitLength = bytes.length * 8;
    const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000));
    view.setUint32(padded.length - 4, bitLength >>> 0);
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let offset = 0; offset < padded.length; offset += 64) {
        for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
            const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
            h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) >>> 0; });
    }
    return H.map(v => v.toString(16).padStart(8, '0')).join('');
}

function hashTeacherPin(pin) {
    return sha256Hex(TEACHER_PIN_SALT + pin);
}

// PIN from config.js (berlaku di semua perangkat) takes priority over a PIN set on this device
function getTeacherPinHash() {
    const config = window.ALGOQUEST_CONFIG || {};
    const fromConfig = typeof config.TEACHER_PIN_HASH === 'string' ? config.TEACHER_PIN_HASH.trim().toLowerCase() : '';
    if (/^[0-9a-f]{64}$/.test(fromConfig)) return fromConfig;
    try {
        const local = localStorage.getItem(TEACHER_PIN_KEY) || '';
        return /^[0-9a-f]{64}$/.test(local) ? local : '';
    } catch (e) {
        return '';
    }
}

/* ---------- Pengumpulan data siswa di perangkat ini ---------- */
function formatDateTimeId(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function collectStudentRecords() {
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
    const totalPatterns = Object.keys(PATTERN_LEVELS).length;
    const log = readStoredJSON(ACTIVITY_LOG_KEY, []);
    const logList = Array.isArray(log) ? log : [];
    const asArray = v => (Array.isArray(v) ? v : []);

    return getKnownPlayers().map(p => {
        const progress = readStoredJSON(`${STORAGE_KEY}_${p.id}`, {}) || {};
        const maze = countCompleted(asArray(progress.completedLevels), 1, TOTAL_MAZE_LEVELS);
        const puzzle = countCompleted(asArray(progress.completedPuzzleLevels), 1, totalPuzzles);
        const pola = countCompleted(asArray(progress.completedPatternLevels), 1, totalPatterns);
        const entries = logList.filter(e => e && e.id === p.id);
        const lastActive = entries.length ? entries[entries.length - 1].waktu : p.registeredAt;
        const certName = typeof progress.playerName === 'string' && progress.playerName !== 'Nama Peserta' ? progress.playerName : '';
        return {
            nama: p.name,
            kelas: p.kelas,
            maze, puzzle, pola,
            total: maze + puzzle + pola,
            kuis: typeof progress.lastQuizScore === 'number' ? progress.lastQuizScore : null,
            lulus: progress.mazeQuizCompleted === true,
            sertifikat: certName,
            pertamaMain: p.registeredAt,
            terakhirAktif: lastActive
        };
    }).sort((a, b) => a.kelas.localeCompare(b.kelas, 'id', { numeric: true }) || a.nama.localeCompare(b.nama, 'id'));
}

function getTeacherTotals() {
    const mazeTotal = TOTAL_MAZE_LEVELS;
    const puzzleTotal = Object.keys(PUZZLE_LEVELS).length;
    const polaTotal = Object.keys(PATTERN_LEVELS).length;
    return { mazeTotal, puzzleTotal, polaTotal, allTotal: mazeTotal + puzzleTotal + polaTotal, kuisTotal: QUIZ_QUESTIONS.length };
}

/* ---------- Pembuat file .xlsx (ZIP tanpa kompresi + SpreadsheetML) ---------- */
const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
    const encoder = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    files.forEach(file => {
        const name = encoder.encode(file.name);
        const data = encoder.encode(file.content);
        const crc = crc32(data);
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0x0800, true); // UTF-8 file names
        local.setUint16(8, 0, true);      // stored (no compression)
        local.setUint32(14, crc, true);
        local.setUint32(18, data.length, true);
        local.setUint32(22, data.length, true);
        local.setUint16(26, name.length, true);
        parts.push(new Uint8Array(local.buffer), name, data);

        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(8, 0x0800, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, data.length, true);
        entry.setUint32(24, data.length, true);
        entry.setUint16(28, name.length, true);
        entry.setUint32(42, offset, true);
        central.push(new Uint8Array(entry.buffer), name);
        offset += 30 + name.length + data.length;
    });
    const centralSize = central.reduce((sum, p) => sum + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    const all = parts.concat(central, [new Uint8Array(end.buffer)]);
    const out = new Uint8Array(all.reduce((sum, p) => sum + p.length, 0));
    let pos = 0;
    all.forEach(p => { out.set(p, pos); pos += p.length; });
    return out;
}

function xmlEscape(value) {
    return String(value)
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function columnLetter(index) {
    let s = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
}

// rows[0] is the header row; numbers become numeric cells so Excel can sort/sum them
function buildSheetXml(rows, widths) {
    const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
    const body = rows.map((row, r) => {
        const cells = row.map((value, c) => {
            const ref = columnLetter(c) + (r + 1);
            const style = r === 0 ? ' s="1"' : '';
            if (typeof value === 'number' && isFinite(value)) return `<c r="${ref}"${style}><v>${value}</v></c>`;
            return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value == null ? '' : value)}</t></is></c>`;
        }).join('');
        return `<row r="${r + 1}">${cells}</row>`;
    }).join('');
    const lastRef = columnLetter(Math.max(rows[0].length - 1, 0)) + Math.max(rows.length, 1);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
        `<cols>${cols}</cols><sheetData>${body}</sheetData><autoFilter ref="A1:${lastRef}"/></worksheet>`;
}

function buildXlsx(sheets) {
    const sheetEntries = sheets.map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('');
    const definedNames = sheets.map((s, i) => {
        const lastRef = '$' + columnLetter(s.rows[0].length - 1) + '$' + Math.max(s.rows.length, 1);
        return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlEscape(s.name)}'!$A$1:${lastRef}</definedName>`;
    }).join('');
    const workbookRels = sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
    const overrides = sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const files = [
        { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + overrides + '</Types>' },
        { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
        { name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheetEntries + '</sheets><definedNames>' + definedNames + '</definedNames></workbook>' },
        { name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + workbookRels + '</Relationships>' },
        { name: 'xl/styles.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF04387A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }
    ];
    sheets.forEach((s, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, content: buildSheetXml(s.rows, s.widths) }));
    return buildZip(files);
}

function buildTeacherWorkbook() {
    const t = getTeacherTotals();
    const records = collectStudentRecords();
    const rekapRows = [[
        'No', 'Nama', 'Kelas', `Maze (dari ${t.mazeTotal})`, `Teka-Teki (dari ${t.puzzleTotal})`, `Pola (dari ${t.polaTotal})`,
        `Total Level (dari ${t.allTotal})`, 'Persentase (%)', `Nilai Kuis (dari ${t.kuisTotal})`, 'Lulus Kuis',
        'Nama di Sertifikat', 'Pertama Main', 'Terakhir Aktif'
    ]];
    records.forEach((r, i) => rekapRows.push([
        i + 1, r.nama, r.kelas, r.maze, r.puzzle, r.pola, r.total,
        Math.round((r.total / t.allTotal) * 100), r.kuis === null ? '-' : r.kuis, r.lulus ? 'Ya' : 'Belum',
        r.sertifikat || '-', formatDateTimeId(r.pertamaMain), formatDateTimeId(r.terakhirAktif)
    ]));

    const log = readStoredJSON(ACTIVITY_LOG_KEY, []);
    const logRows = [['Waktu', 'Nama', 'Kelas', 'Aktivitas', 'Detail', 'Maze', 'Teka-Teki', 'Pola']];
    (Array.isArray(log) ? log : []).forEach(e => {
        if (!e) return;
        logRows.push([formatDateTimeId(e.waktu), e.nama || '', e.kelas || '', e.aktivitas || '', e.detail || '',
            Number(e.maze) || 0, Number(e.puzzle) || 0, Number(e.pola) || 0]);
    });

    return buildXlsx([
        { name: 'Rekap Siswa', rows: rekapRows, widths: [5, 28, 9, 13, 16, 13, 18, 14, 17, 11, 26, 18, 18] },
        { name: 'Log Aktivitas', rows: logRows, widths: [18, 28, 9, 28, 24, 8, 11, 8] }
    ]);
}

function downloadTeacherWorkbook() {
    const bytes = buildTeacherWorkbook();
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const today = new Date();
    const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap-Siswa-AlgoQuest-${stamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/* ---------- Tampilan Panel Guru ---------- */
const teacherDom = {
    page: document.getElementById('teacher-page'),
    lockView: document.getElementById('teacher-lock-form'),
    setupView: document.getElementById('teacher-setup-form'),
    dashboard: document.getElementById('teacher-dashboard'),
    pinInput: document.getElementById('teacher-pin-input'),
    pinError: document.getElementById('teacher-pin-error'),
    newPin: document.getElementById('teacher-new-pin'),
    newPinRepeat: document.getElementById('teacher-new-pin-repeat'),
    setupError: document.getElementById('teacher-setup-error'),
    configHint: document.getElementById('teacher-config-hint'),
    configHash: document.getElementById('teacher-config-hash'),
    stats: document.getElementById('teacher-stats'),
    classFilter: document.getElementById('teacher-class-filter'),
    tableBody: document.getElementById('teacher-table-body'),
    emptyNote: document.getElementById('teacher-empty-note')
};
let teacherReturnScreen = 'landing-page';

function openTeacherPanel() {
    const active = document.querySelector('.view-screen.active');
    if (active && active.id !== 'teacher-page') teacherReturnScreen = active.id;
    renderTeacherPanel();
    showScreen('teacher-page');
}

function renderTeacherPanel() {
    const hasPin = !!getTeacherPinHash();
    teacherDom.setupView.classList.toggle('hidden', hasPin || teacherUnlocked);
    teacherDom.lockView.classList.toggle('hidden', !hasPin || teacherUnlocked);
    teacherDom.dashboard.classList.toggle('hidden', !teacherUnlocked);
    teacherDom.pinError.classList.add('hidden');
    teacherDom.setupError.classList.add('hidden');
    teacherDom.pinInput.value = '';
    if (teacherUnlocked) renderTeacherDashboard();
}

function renderTeacherDashboard() {
    const t = getTeacherTotals();
    const records = collectStudentRecords();
    const classes = [...new Set(records.map(r => r.kelas))];

    const selected = teacherDom.classFilter.value;
    teacherDom.classFilter.innerHTML = '';
    [['', 'Semua Kelas'], ...classes.map(k => [k, `Kelas ${k}`])].forEach(([value, label]) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.innerText = label;
        teacherDom.classFilter.appendChild(opt);
    });
    teacherDom.classFilter.value = classes.includes(selected) ? selected : '';

    const shown = records.filter(r => !teacherDom.classFilter.value || r.kelas === teacherDom.classFilter.value);
    const passed = shown.filter(r => r.lulus).length;
    teacherDom.stats.innerText = `${shown.length} siswa · ${classes.length} kelas · ${passed} lulus kuis`;

    teacherDom.tableBody.innerHTML = '';
    shown.forEach((r, i) => {
        const tr = document.createElement('tr');
        [
            i + 1, r.nama, r.kelas, `${r.maze}/${t.mazeTotal}`, `${r.puzzle}/${t.puzzleTotal}`, `${r.pola}/${t.polaTotal}`,
            `${Math.round((r.total / t.allTotal) * 100)}%`, r.kuis === null ? '-' : `${r.kuis}/${t.kuisTotal}`,
            r.lulus ? '✅ Ya' : 'Belum', r.sertifikat || '-', formatDateTimeId(r.terakhirAktif)
        ].forEach(value => {
            const td = document.createElement('td');
            td.innerText = value; // innerText: student names are never parsed as HTML
            tr.appendChild(td);
        });
        teacherDom.tableBody.appendChild(tr);
    });
    teacherDom.emptyNote.classList.toggle('hidden', shown.length > 0);
}

function setupTeacherPanel() {
    document.querySelectorAll('.open-teacher-panel').forEach(btn => btn.addEventListener('click', () => {
        synth.playClick();
        openTeacherPanel();
    }));

    document.getElementById('teacher-back-btn').addEventListener('click', () => {
        synth.playClick();
        showScreen(teacherReturnScreen);
    });

    document.getElementById('teacher-lock-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (hashTeacherPin(teacherDom.pinInput.value) === getTeacherPinHash()) {
            synth.playSuccess();
            teacherUnlocked = true;
            renderTeacherPanel();
        } else {
            synth.playWrong();
            teacherDom.pinError.innerText = 'PIN salah. Coba lagi.';
            teacherDom.pinError.classList.remove('hidden');
            teacherDom.pinInput.value = '';
        }
    });

    document.getElementById('teacher-setup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = teacherDom.newPin.value;
        let error = '';
        if (pin.length < MIN_TEACHER_PIN_LENGTH) error = `PIN minimal ${MIN_TEACHER_PIN_LENGTH} karakter.`;
        else if (pin !== teacherDom.newPinRepeat.value) error = 'Kedua PIN tidak sama.';
        if (error) {
            synth.playWrong();
            teacherDom.setupError.innerText = error;
            teacherDom.setupError.classList.remove('hidden');
            return;
        }
        const hash = hashTeacherPin(pin);
        try {
            localStorage.setItem(TEACHER_PIN_KEY, hash);
        } catch (err) {}
        teacherDom.configHash.innerText = `TEACHER_PIN_HASH: '${hash}'`;
        teacherDom.configHint.classList.remove('hidden');
        teacherDom.newPin.value = '';
        teacherDom.newPinRepeat.value = '';
        synth.playSuccess();
        teacherUnlocked = true;
        renderTeacherPanel();
    });

    document.getElementById('teacher-download-btn').addEventListener('click', () => {
        synth.playClick();
        downloadTeacherWorkbook();
    });

    document.getElementById('teacher-lock-btn').addEventListener('click', () => {
        synth.playClick();
        teacherUnlocked = false;
        teacherDom.configHint.classList.add('hidden');
        renderTeacherPanel();
    });

    teacherDom.classFilter.addEventListener('change', renderTeacherDashboard);
}

window.addEventListener('DOMContentLoaded', setupTeacherPanel);
