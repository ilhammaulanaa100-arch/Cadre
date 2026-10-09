# T3-07 — review V0 teknis

29 September 2026; diperbarui 7 Oktober 2026. Status: **V0 internal diterima pemilik produk** setelah ia menyatakan sudah mencoba dan hasilnya oke. Audit teknis dan satu uji screenshot nyata selesai. Detail langkah, waktu, dan perangkat pada percobaan pemilik produk tidak dicatat, sehingga ini bukan bukti uji beta pengguna baru tanpa panduan. Review ini memisahkan fungsi editor, mutu hasil, dan klaim performa. Model aktif adalah iPhone 18 Pro Max 1.2.0; PRD awal menyebut iPhone 17 Pro Max sebelum arahan model baru.

## Lingkungan dan bukti

- Apple M2, RAM 8 GB, macOS arm64; Headless Chrome 154; viewport 1440 × 960. App dijalankan dari build produksi lokal `next start`. Satu sesi pengukuran; bukan benchmark lintas perangkat/browser.
- `scripts/review-v0.mjs` menjalankan empat kasus: fixture gelap bawaan dan tiga gambar UI sintetis (terang portrait dengan teks kecil, gelap portrait dengan teks padat, landscape dalam mode Fit). Keempat PNG dan metrik ada di [`evidence/t3-07/`](evidence/t3-07/technical-checks.json). Gambar sintetis menguji wiring/rasio, bukan pengganti screenshot user.
- File unduhan PNG aktual identik secara SHA-256 dengan capture komposisi landscape yang dipilih. Pemeriksaan sebelumnya juga mencakup upload invalid, crop, pose, motion, draft reload, watermark, dan viewport 390 px; lihat `scripts/check-iphone18.mjs`, `scripts/check-local-draft.mjs`, dan `scripts/check-preview-watermark.mjs`.
- `pnpm test`: 20/20 lulus. `pnpm typecheck`: lulus. `node scripts/check-iphone18-asset.mjs`: integrity, hash, 90 mesh, UV, material slots dan embedded texture lulus. Production build sudah lulus pada T3-06 dan dipakai untuk sesi ini.
- Atas arahan user, satu screenshot pekerjaan nyata **Additional Rava 3.png** (804 × 1896) diuji melalui `scripts/check-user-sample.mjs`. Sumber tetap di Downloads; empat PNG turunan disimpan lokal di `evidence/t3-07/private/` yang diabaikan Git. File unduhan aktual identik dengan capture perspektif yang dipilih.

## Hasil ukur awal

| Ukuran | Hasil |
|---|---:|
| GLB aktif | 4,442,824 byte |
| Screenshot fixture bawaan | 1,260,612 byte; 851 × 1848 px |
| Navigasi hingga editor siap dan draft lokal terbaca | 1,540 ms |
| Capture PNG 1200 × 1200 (3 kasus) | 40–51 ms |
| Capture PNG 1920 × 1080 (landscape) | 62 ms |
| JS heap setelah GC, awal → sesudah 4 kasus | 9.60 → 10.33 MB |

Angka heap hanya proses JavaScript halaman; tidak mencakup GPU, texture WebGL, atau seluruh proses Chrome. Satu sesi terlalu sedikit untuk target latensi/memori produksi. Rincian setiap kasus dan hash file tercatat di `technical-checks.json`.

## Matriks kebutuhan V0

| ID | Penilaian | Bukti / batas |
|---|---|---|
| V0-01 model dan readiness | Sebagian | iPhone 18 Pro Max tampil dan asset valid. Jika model gagal, UI hanya menyarankan reload; tombol retry belum ada. Nama model berubah dari PRD awal. |
| V0-02 input gambar | Lulus teknis | PNG/JPEG/WebP lokal; invalid dan corrupt tidak mengganti gambar aktif. Bukti regresi browser sebelumnya. |
| V0-03 layar, fill/fit, crop | Lulus teknis | Orientasi tidak mirror/stretch; landscape Fit benar secara geometri. Keterbacaan landscape pada layar ponsel rendah. |
| V0-04 pose dan framing | Lulus teknis | Drag, preset, posisi, scale, reset dan transform scene yang sama untuk preview/PNG. |
| V0-05 rasio dan background | Lulus teknis | 1:1, 4:3, 16:9, 9:16; solid/gradient masuk PNG. |
| V0-06 motion | Sebagian | Still/Turntable, pause/scrub/durasi dan frame deterministik lulus. Float/Gentle Tilt dari PRD belum ada. |
| V0-07 PNG frame terpilih | Lulus untuk prototype | Dimensi file benar dan unduhan aktual identik dengan capture. Export publik dengan akun/kuota belum dibangun. |
| V0-08 ganti gambar | Lulus teknis | Upload mempertahankan pose/posisi/background; crop dapat diatur ulang. |
| V0-09 restore lokal | Lulus inti, QA sebagian | Scene dan blob pulih setelah reload; gambar hilang menghasilkan pesan dan opsi draft baru. Jalur kegagalan kuota storage belum dipaksa dalam browser QA. Undo/redo sudah dihapus dari kebutuhan. |
| V0-10 pemulihan error | Sebagian | Input invalid, draft rusak, dan export gagal memberi pesan. Model/GPU gagal belum punya retry dalam editor; kasus context loss belum diuji. |
| V0-11 watermark preview | Lulus teknis; review visual pending | Pola terlihat melintasi device pada latar putih, gelap, gradient dan viewport sempit; PNG lokal bersih. Intensitas pada latar gelap perlu persetujuan visual. |
| V0-12 fondasi katalog | Sebagian | Manifest dan versi asset ada. Ukuran layar 1320 × 2868 serta beberapa pilihan device masih hardcoded di UI, sehingga perlu digeneralisasi sebelum katalog lintas device. |

## Catatan mutu visual

- **Interaksi editor:** upload → atur pose/latar/rasio → export dapat diselesaikan secara otomatis dengan file nyata; ini belum membuktikan bahwa pengguna baru dapat melakukannya tanpa panduan.
- **Screenshot dan layar:** fixture gelap bawaan 851 × 1848 diperbesar ke target texture 1320 × 2868, sehingga teks kecil tampak lembut. Dua kasus teks kecil sintetis juga sukar dibaca pada PNG 1200 px. Screenshot landscape dalam mode Fit menjadi strip horizontal kecil di layar ponsel; hasilnya sesuai rasio sumber, tetapi kurang berguna untuk presentasi. Tablet/laptop pada tahap 4 dapat menjadi pilihan komposisi yang lebih sesuai.
- **Model/material/cahaya:** depan, bingkai, kamera belakang dan empat finish ter-render konsisten dengan asset aktif. Ini rekonstruksi visual, bukan CAD resmi. Kesesuaian bentuk, warna dan pencahayaan dengan referensi akhir masih memerlukan persetujuan visual pengguna; jangan satukan dengan kelulusan interaksi.
- **Watermark:** terbaca pada latar terang/gelap dan melintasi hasil. Pada latar gelap tulisan cukup menonjol sehingga sebagian UI layar tertutup; intensitas akhir perlu review desain.

## Hasil screenshot Rava 3

Sumber 804 × 1896 berasio 0,424, lebih sempit dari permukaan layar model (1320 ÷ 2868 = 0,460). **Fill** harus memotong sekitar 8% tinggi gambar secara keseluruhan: status bar bagian atas hilang dan tombol Save mendekati tepi bawah. **Fit** mempertahankan status bar, semua field dan tombol Save, tetapi padding gelap default terlihat sebagai garis di sisi kiri/kanan. Mengubah **Padding color** ke putih menyatukan tepi dengan latar screenshot dan memberi hasil paling rapi. Output depan dan perspektif 1200 × 1200 diperiksa visual; urutan elemen, orientasi, warna ungu tombol, dan teks utama tetap benar. Teks kecil sedikit lembut pada perspektif karena sumber hanya 804 px lebar dan diproyeksikan ke layar miring.

PNG yang direkomendasikan untuk file ini: `evidence/t3-07/private/rava3-fit-white-front.png` atau `rava3-fit-white-perspective.png`. Ini hasil lokal, tidak ditambahkan sebagai asset katalog proyek.

Perbandingan tambahan memakai output 9:16 (1080 × 1920). Dengan Fit + padding putih, device mengisi bidang lebih besar dan teks UI terlihat lebih jelas daripada output persegi. `rava3-fit-white-front-portrait.png` paling cocok untuk menilai detail layar; `rava3-fit-white-perspective-portrait.png` memberi kedalaman 3D dengan sedikit penurunan keterbacaan. PNG portrait aktual yang diunduh identik dengan capture yang diuji.

Rekomendasi produk dari kasus ini: pilih **Fit** otomatis untuk gambar yang rasionya berbeda nyata dari layar, lalu samakan padding dengan warna tepi gambar atau beri kontrol yang lebih jelas. Tambahkan preset komposisi **Detail layar** (front + output portrait) dan pertahankan perspektif untuk gambar presentasi. Jangan mengubah sumber gambar secara diam-diam; user tetap dapat memilih Fill/crop bila memang ingin memenuhi layar.

### Perbaikan diterapkan

Upload kini memilih **Fit** ketika rasio sumber berbeda lebih dari 3% dari layar model; gambar dengan rasio dekat tetap memakai **Fill**. Saat Fit dipilih, editor menyampel warna di kedua tepi gambar dan memakai warna itu sebagai padding jika konsisten. Pilihan Fill/Fit dan warna padding tetap dapat diubah manual. Preset **Detail UI** mengatur front view, posisi tengah, skala 100%, Fit, dan output 9:16 dalam satu klik.

Uji browser produksi dengan `scripts/check-user-sample.mjs` membuktikan Rava 3 (804 × 1896) otomatis Fit dengan padding `#FFFFFF`, sedangkan Rava 4 (804 × 1748) otomatis Fill. Mengubah padding Rava 3 secara manual juga mengubah PNG. PNG Detail UI Rava 3 berukuran 1080 × 1920, seluruh form dan tombol Save terlihat, dan SHA-256 file unduhan sama dengan frame yang diuji. Hasilnya tersimpan lokal di `evidence/t3-07/private/smart-rava3-fit-white-front-portrait.png` dan sampel pembanding `smart-rava4-auto-default-front.png` (keduanya diabaikan Git).

## Keputusan penutupan V0 internal dan tindak lanjut

Pada 7 Oktober pemilik produk menyatakan sudah mencoba editor dan hasilnya oke. Ini menutup penerimaan alur dan visual V0 internal; catatan visual di atas tetap menjadi masukan polish, bukan blocker untuk melanjutkan MVP browser. Preview kini bersih dan watermark berlaku pada aksi Copy image, sehingga catatan lama tentang watermark preview menggambarkan implementasi saat review awal.

Uji pengguna baru tanpa panduan dipindah ke QA beta sebelum rilis publik: minta minimal satu calon pengguna menyelesaikan upload → komposisi → PNG, lalu catat waktu, kebingungan, bantuan, dan kecocokan hasil. Float/Gentle Tilt serta tombol retry tetap backlog penyempurnaan; generalisasi dimensi/device telah dikerjakan saat perluasan kategori tahap 4.

Satu screenshot nyata dipakai untuk uji hasil ini sesuai arahan user; paket 3–5 contoh dari rencana awal tidak dijadikan syarat tambahan untuk permintaan ini.

Tidak ada klaim bahwa rilis publik, keamanan export, benchmark worker, atau kualitas katalog final sudah lulus.
