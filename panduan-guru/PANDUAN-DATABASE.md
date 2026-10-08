# Panduan Database Guru – AlgoQuest

Dengan fitur ini, setiap siswa **mengisi nama dan kelas** sebelum bermain. Progres mereka otomatis tercatat di **Google Spreadsheet milik Bapak/Ibu**.

- ✅ **Hanya guru yang bisa melihat data.** Spreadsheet tersimpan di Google Drive Bapak/Ibu dan bersifat pribadi.
- ✅ Game hanya bisa **mengirim** data. Tidak ada cara bagi siswa untuk membuka daftar siswa lain dari dalam game.
- ✅ Gratis, tanpa server. Cukup akun Google (akun sekolah atau pribadi).

Pemasangan dilakukan **sekali saja** dan memakan waktu sekitar 10 menit.

---

## Langkah 1 – Buat Google Spreadsheet

1. Buka <https://sheets.google.com> dan login dengan akun Google Bapak/Ibu.
2. Klik **Kosong** (Blank) untuk membuat spreadsheet baru.
3. Beri nama, misalnya **Data Siswa AlgoQuest**.

## Langkah 2 – Pasang skrip

1. Di spreadsheet tersebut, klik menu **Ekstensi → Apps Script**.
2. Hapus semua kode yang ada di editor (`function myFunction() {...}`).
3. Buka file [`google-apps-script.gs`](google-apps-script.gs) di repo ini, salin **seluruh isinya**, lalu tempelkan ke editor.
4. Klik ikon **💾 Simpan**.
5. Di atas editor, pilih fungsi **`setup`** pada daftar fungsi, lalu klik **▶ Jalankan**.
   - Google akan meminta izin. Klik **Tinjau izin**, pilih akun Bapak/Ibu, lalu klik **Lanjutan → Buka (tidak aman)** → **Izinkan**.
     Peringatan ini wajar karena skrip dibuat sendiri, bukan dari Google.
6. Kembali ke spreadsheet. Sekarang ada dua lembar baru: **Rekap Siswa** dan **Log Aktivitas**.

## Langkah 3 – Terbitkan sebagai Web App

1. Di editor Apps Script, klik tombol biru **Terapkan (Deploy) → Deployment baru**.
2. Klik ikon ⚙️ di samping "Pilih jenis", lalu pilih **Aplikasi web**.
3. Isi pengaturannya:
   - **Deskripsi:** AlgoQuest
   - **Jalankan sebagai:** **Saya** (email Bapak/Ibu)
   - **Siapa yang memiliki akses:** **Siapa saja** (Anyone)
     > Pengaturan ini diperlukan agar game siswa bisa *mengirim* data tanpa login Google.
     > Siswa **tidak** bisa melihat isi spreadsheet, karena URL ini hanya menerima data.
4. Klik **Terapkan**, lalu **salin URL Aplikasi web** (berawalan `https://script.google.com/macros/s/.../exec`).

## Langkah 4 – Tempelkan URL ke game

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

**Belum ingin memakai database?**
Biarkan `SHEET_URL` kosong (`''`). Halaman data diri tetap muncul, tetapi tidak ada data yang dikirim ke mana pun.
