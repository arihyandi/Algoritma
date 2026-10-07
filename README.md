# AlgoQuest – Petualangan Belajar Algoritma

Game edukasi berbasis web untuk mengenalkan **dasar algoritma dan berpikir komputasional** kepada siswa. Siswa membantu *Albi si Robot* menyelesaikan misi menggunakan blok-blok instruksi.

Tidak perlu instalasi, server, atau koneksi internet (kecuali untuk memuat font). Cukup buka `index.html` di browser.

## Mode Permainan

| Mode | Jumlah Level | Konsep yang Dilatih |
|---|---|---|
| 🗺️ **Labirin (Maze)** | 10 | Sekuensial, Perulangan (Loop, termasuk loop bersarang), Kondisional (Jika–Maka), Debugging |
| 🧩 **Teka-Teki (Puzzle)** | 10 | Menyusun urutan langkah algoritma kehidupan sehari-hari |
| 🎨 **Pengenalan Pola** | 50 | Pola warna, angka, huruf, dan logika (Pemula → Legenda) |
| 🏆 **Kuis & Sertifikat** | 5 soal | Terbuka setelah semua mode selesai. Lulus jika **minimal 3 dari 5** jawaban benar |

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

- `LEVELS` – level Maze (peta, dinding, ubin sensor, blok yang boleh dipakai, batas blok).
- `QUIZ_QUESTIONS` – soal kuis (`correct` = indeks jawaban benar, dimulai dari 0).
- `QUIZ_PASS_SCORE` – nilai minimal kelulusan kuis.
- `PUZZLE_LEVELS` – soal puzzle (`correctOrder` = urutan benar; `altOrders` = urutan alternatif yang juga diterima, opsional).
- `PATTERN_LEVELS` – soal pola (`correctIndex` = indeks jawaban benar pada `options`).
