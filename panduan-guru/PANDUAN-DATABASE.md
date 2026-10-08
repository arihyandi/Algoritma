# Panduan Data Siswa untuk Guru – AlgoQuest

Setiap siswa **mengisi nama dan kelas** sebelum bermain. Ada dua cara bagi guru untuk melihat siapa saja yang sudah mengerjakan:

| | **Pilihan A – Panel Guru + Excel** (disarankan) | **Pilihan B – Google Spreadsheet otomatis** |
|---|---|---|
| Perlu internet / akun Google | ❌ Tidak | ✅ Ya |
| Perlu pemasangan | Tidak, langsung bisa dipakai | Sekali, sekitar 10 menit |
| Data yang terlihat | Siswa yang bermain **di perangkat itu** | Semua siswa, dari perangkat mana pun |
| Hasil | File **.xlsx** yang diunduh dari game | Spreadsheet yang terisi otomatis |

Kedua pilihan bisa dipakai bersamaan.

---

# Pilihan A – Panel Guru + Unduh Excel (tanpa internet)

1. Buka game, lalu klik **🔒 Panel Guru**. Tombolnya ada di bawah formulir data diri dan di bagian bawah menu utama.
2. **Pertama kali:** buat **PIN Guru** (minimal 6 karakter). Simpan PIN ini, dan jangan beritahukan kepada siswa.
3. Masukkan PIN untuk membuka rekap siswa di perangkat tersebut:
   - Tabel berisi nama, kelas, Maze x/25, Teka-Teki x/25, Pola x/50, persentase, nilai kuis, status lulus, sertifikat, dan waktu terakhir aktif.
   - Bisa disaring per kelas.
4. Klik **⬇️ Unduh Rekap (.xlsx)**. File `Rekap-Siswa-AlgoQuest-TANGGAL.xlsx` berisi dua lembar:
   - **Rekap Siswa**: satu baris per siswa, diurutkan per kelas dan nama, dengan filter siap pakai.
   - **Log Aktivitas**: setiap kejadian beserta waktunya (mendaftar, level selesai, kuis, sertifikat, reset).
5. Klik **🔒 Kunci** sebelum meninggalkan komputer.

**Untuk lab komputer:** data tersimpan di masing-masing komputer. Buka Panel Guru di setiap komputer, unduh rekapnya, lalu gabungkan di Excel (salin baris dari tiap file ke satu lembar).

**PIN yang sama untuk semua komputer (opsional):** setelah membuat PIN, Panel Guru menampilkan satu baris seperti `TEACHER_PIN_HASH: '...'`. Tempelkan baris itu ke file [`config.js`](../config.js) di GitHub. Setelah itu semua perangkat memakai PIN tersebut, dan siswa tidak bisa membuat PIN sendiri. Yang disimpan hanya *sidik* (hash) PIN, bukan PIN-nya.

> ⚠️ **Batasan keamanan:** karena game berjalan di browser tanpa server, PIN ini adalah pengaman dasar agar siswa tidak iseng membuka rekap. Siswa yang paham teknik pemrograman tetap bisa membaca data di browser perangkat yang ia pakai. Data siswa yang tersimpan hanya nama, kelas, dan progres game.

---

# Pilihan B – Google Spreadsheet otomatis

Dengan pilihan ini, progres setiap siswa otomatis tercatat di **Google Spreadsheet milik guru**, dari perangkat mana pun termasuk HP siswa di rumah.

- ✅ **Hanya guru yang bisa melihat data**, karena spreadsheet tersimpan di Google Drive guru. Pastikan "Akses umum" spreadsheet diatur ke **Dibatasi**.
- ✅ Game hanya bisa **mengirim** data, tidak bisa membaca daftar siswa lain.

## Langkah B1 – Buat Google Spreadsheet

1. Buka <https://sheets.google.com> dan login dengan akun Google Bapak/Ibu.
2. Klik **Kosong** (Blank) untuk membuat spreadsheet baru.
3. Beri nama, misalnya **Data Siswa AlgoQuest**.
4. Klik **Bagikan**, lalu pastikan **Akses umum** diatur ke **Dibatasi**. Akun sekolah kadang otomatis memberi akses ke seluruh domain sekolah.

## Langkah B2 – Pasang skrip

1. Di spreadsheet tersebut, klik menu **Ekstensi → Apps Script**.
2. Hapus semua kode yang ada di editor (`function myFunction() {...}`).
3. Buka file [`google-apps-script.gs`](google-apps-script.gs) di repo ini, salin **seluruh isinya**, lalu tempelkan ke editor.
4. Klik ikon **💾 Simpan**.
5. Di atas editor, pilih fungsi **`setup`** pada daftar fungsi, lalu klik **▶ Jalankan**.
   - Google akan meminta izin. Klik **Tinjau izin**, pilih akun Bapak/Ibu, lalu klik **Lanjutan → Buka (tidak aman)** → **Izinkan**.
     Peringatan ini wajar karena skrip dibuat sendiri, bukan dari Google.
6. Kembali ke spreadsheet. Sekarang ada dua lembar baru: **Rekap Siswa** dan **Log Aktivitas**.

## Langkah B3 – Terbitkan sebagai Web App

1. Di editor Apps Script, klik tombol biru **Terapkan (Deploy) → Deployment baru**.
2. Klik ikon ⚙️ di samping "Pilih jenis", lalu pilih **Aplikasi web**.
3. Isi pengaturannya:
   - **Deskripsi:** AlgoQuest
   - **Jalankan sebagai:** **Saya** (email Bapak/Ibu)
   - **Siapa yang memiliki akses:** **Siapa saja** (Anyone)
     > Pengaturan ini diperlukan agar game siswa bisa *mengirim* data tanpa login Google.
     > Siswa **tidak** bisa melihat isi spreadsheet, karena URL ini hanya menerima data.
4. Klik **Terapkan**, lalu **salin URL Aplikasi web** (berawalan `https://script.google.com/macros/s/.../exec`).

## Langkah B4 – Tempelkan URL ke game

1. Buka file [`config.js`](../config.js) di repo GitHub, lalu klik ikon ✏️ (Edit).
2. Tempelkan URL di antara tanda petik:
   ```js
   window.ALGOQUEST_CONFIG = {
       SHEET_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec'
   };
   ```
3. Klik **Commit changes**. Dalam 1–2 menit situs game akan diperbarui.

Selesai! Coba buka game, isi nama dan kelas, lalu selesaikan satu level. Data akan muncul di spreadsheet.

---

## Membaca data di spreadsheet

**Lembar "Rekap Siswa"** berisi satu baris per siswa yang selalu diperbarui ke progres terbaru.

| Kolom | Isi |
|---|---|
| Nama, Kelas | Data diri yang diisi siswa |
| Maze, Teka-Teki, Pola | Jumlah level selesai, misalnya `12 / 25` |
| Total Level | Gabungan ketiga mode, dari 100 level |
| Nilai Kuis, Lulus Kuis | Nilai kuis terakhir dan status kelulusan (minimal 3 dari 5) |
| Nama di Sertifikat | Terisi jika siswa sudah mengklaim sertifikat |
| Pertama Main, Terakhir Aktif | Kapan siswa mulai dan terakhir bermain |

**Lembar "Log Aktivitas"** mencatat setiap kejadian beserta waktunya: mendaftar, menyelesaikan level, mengerjakan kuis, mengklaim sertifikat, dan mereset progres.

**Tips:**
- Klik **Data → Buat filter** untuk menyaring per kelas atau mengurutkan berdasarkan progres.
- Ingin membagikan ke rekan guru? Gunakan tombol **Bagikan** di spreadsheet, dan beri akses hanya kepada guru.
- Jangan membagikan spreadsheet kepada siswa.

## Pertanyaan umum

**Apakah game tetap jalan jika internet sekolah mati?**
Ya. Progres tetap tersimpan di perangkat, dan laporan yang gagal terkirim disimpan lalu dikirim ulang otomatis saat ada internet.

**Satu komputer lab dipakai banyak siswa?**
Aman. Setiap siswa menekan **🔁 Ganti Pemain** di menu utama, lalu mengisi namanya. Progres setiap siswa tersimpan terpisah. Siswa yang pernah bermain di komputer itu cukup memilih namanya dari daftar.

**Siswa salah menulis nama?**
Minta siswa menekan **Ganti Pemain** dan mendaftar dengan nama yang benar. Baris lama di spreadsheet boleh dihapus.

**Mengubah skrip setelah diterbitkan?**
Setiap kali mengubah kode di Apps Script, pilih **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**, agar URL yang sama memakai kode terbaru.

**Belum ingin memakai Google Spreadsheet?**
Biarkan `SHEET_URL` kosong (`''`). Tidak ada data yang dikirim ke internet, dan guru tetap bisa memakai **Pilihan A (Panel Guru + Excel)**.

**Lupa PIN Guru?**
Jika PIN diatur di `config.js`, buat PIN baru di perangkat yang belum punya PIN (atau minta bantuan teknisi), lalu ganti baris `TEACHER_PIN_HASH` di `config.js`. Jika PIN hanya diatur di perangkat, PIN bisa direset dengan menghapus data situs (*Clear site data*) di browser. Cara ini juga menghapus progres siswa di perangkat itu, jadi unduh rekapnya terlebih dahulu.
