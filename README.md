# AlgoQuest – Petualangan Belajar Algoritma

Game edukasi berbasis web untuk mengenalkan **dasar algoritma dan berpikir komputasional** kepada siswa. Siswa membantu *Albi si Robot* menyelesaikan misi menggunakan blok-blok instruksi.

Tidak perlu instalasi, server, atau koneksi internet (kecuali untuk memuat font). Cukup buka `index.html` di browser.

## Mode Permainan

| Mode | Jumlah Level | Konsep yang Dilatih |
|---|---|---|
| 🗺️ **Labirin (Maze)** | 25 | Sekuensial, Perulangan (Loop, termasuk loop bersarang), Kondisional (Jika–Maka), Debugging |
| 🧩 **Teka-Teki (Puzzle)** | 25 | Menyusun urutan langkah algoritma, dari kegiatan sehari-hari hingga Bubble Sort, Pencarian Biner, dan FizzBuzz |
| 🎨 **Pengenalan Pola** | 50 | Pola berulang, deret bilangan & huruf, hingga Fibonacci, biner, dan look-and-say (Pemula → Master, 10 soal per tingkat) |
| 🏆 **Kuis & Sertifikat** | 5 soal | Terbuka setelah semua mode selesai. Lulus jika **minimal 3 dari 5** jawaban benar |

### Tingkat Kesulitan Maze & Puzzle

Setiap 5 level membentuk satu tingkat. Level berikutnya terbuka setelah level sebelumnya selesai.

| Tingkat | Level | Maze | Puzzle |
|---|---|---|---|
| 🌱 Pemula | 1 – 5 | Peta 6×6: sekuensial, loop, sensor, debugging | Urutan kegiatan harian, if-else dan loop sederhana |
| 📘 Dasar | 6 – 10 | Peta 6×6: kombinasi konsep | Login, telur rebus, pencarian linear |
| ⚙️ Menengah | 11 – 15 | Peta 7×7: rute panjang, pola keliling, sensor berulang | Else-if bertingkat, loop *selama*, variabel |
| 🚀 Mahir | 16 – 20 | Peta 7×7: **loop bersarang**, sensor rusak, lorong buntu | Kondisional di dalam loop, rata-rata, nilai terbesar |
| 👑 Master | 21 – 25 | Peta 8×8 penuh lorong buntu, gabungan semua konsep | ATM (if bersarang), Bubble Sort, tabel perkalian, Pencarian Biner, FizzBuzz |

### Tingkat Kesulitan Mode Pola (10 soal per tingkat)

| Tingkat | Soal | Konsep |
|---|---|---|
| 🌱 Pemula | 1 – 10 | Pola berulang A-B, A-B-C, A-A-B, rotasi panah, hitung maju/mundur, abjad |
| 📘 Dasar | 11 – 20 | Pola A-B-C-D, pola cermin, kelipatan, bilangan ganjil, fase bulan, pola dua atribut (bentuk + warna) |
| ⚙️ Menengah | 21 – 30 | Perkalian ×2 dan ×3, selisih bertambah, dua deret berselang, kuadrat, aturan bergantian, jam |
| 🚀 Mahir | 31 – 40 | Fibonacci, bilangan segitiga, prima, biner, kubik, dua operasi bergantian |
| 👑 Master | 41 – 50 | Pangkat 2, deret Lucas, faktorial, Tribonacci, huruf Fibonacci, look-and-say |

Setelah lulus kuis, siswa mengetik nama lengkap dan dapat **mencetak / menyimpan sertifikat sebagai PDF** (gunakan menu *Print → Save as PDF* di browser).

## Cara Menjalankan

**Di komputer lab (offline):**
1. Unduh repo ini (*Code → Download ZIP*) lalu ekstrak.
2. Klik dua kali `index.html` untuk membukanya di Chrome / Edge / Firefox.

**Online lewat GitHub Pages (agar siswa bisa membuka dari HP/rumah):**
1. Buka *Settings → Pages* pada repo ini.
2. Pada *Source*, pilih branch `main` dan folder `/ (root)`, lalu *Save*.
3. Setelah beberapa menit, game tersedia di `https://<username>.github.io/mini-game-2/`.

## Catatan untuk Guru

- **Progres tersimpan di browser** masing-masing perangkat (`localStorage`). Jika siswa berganti komputer atau menghapus data browser, progres akan mulai dari awal.
- Tombol **🔄 Reset Progres Game** di menu utama menghapus seluruh progres pada perangkat tersebut (berguna saat komputer lab dipakai bergantian).
- Urutan pilihan jawaban di Mode Pola **diacak** setiap kali level dibuka, sehingga siswa tidak bisa lulus hanya dengan menebak posisi.
- Di Mode Puzzle, beberapa soal menerima **lebih dari satu urutan yang logis** (misalnya mandi dan sarapan boleh ditukar).
- Di Mode Maze, blok **Ulangi** dapat dimasukkan ke dalam blok Ulangi lain (loop bersarang) sebagai materi pengayaan.
- Di perangkat layar sentuh, gunakan **ketuk** (bukan seret) untuk menambah blok, dan tombol ▲▼ untuk mengurutkan puzzle.

## Struktur File

```
index.html   Struktur halaman (menu, arena, kuis, sertifikat)
style.css    Tampilan, tata letak responsif, dan gaya cetak sertifikat
app.js       Logika game dan data soal
```

### Mengubah atau Menambah Soal

Semua data soal ada di bagian atas `app.js`:

- `LEVELS` – level Maze. Level 11–25 ditulis sebagai **peta teks** yang mudah diubah:
  `#` dinding, `.` lantai, `S` posisi awal Albi, `G` portal, `Y` sensor kuning (belok kanan), `P` sensor ungu (belok kiri).
  Atur juga `allowedBlocks` (blok yang tersedia) dan `maxBlocks` (batas blok).
- `QUIZ_QUESTIONS` – soal kuis (`correct` = indeks jawaban benar, dimulai dari 0).
- `QUIZ_PASS_SCORE` – nilai minimal kelulusan kuis.
- `PUZZLE_LEVELS` – soal puzzle (`correctOrder` = urutan benar; `altOrders` = urutan alternatif yang juga diterima, opsional). Awali teks dengan 2 spasi per tingkat untuk membuat indentasi (isi JIKA/Ulangi).
- `PATTERN_LEVELS` – soal pola (`correctIndex` = indeks jawaban benar pada `options`).
