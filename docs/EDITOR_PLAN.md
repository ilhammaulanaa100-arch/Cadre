# Editor mockup 3D — arah dan pekerjaan berikutnya

28 September 2026. Penajaman berdasarkan permintaan user, Rotato, dan referensi terbaru Shots. Arahan Shots light menjadi acuan susunan UI saat ini. Instruksi lama yang menunda UI atau coding sudah digantikan oleh permintaan untuk melanjutkan editor ini. Screenshot menjadi referensi tata letak dan interaksi; teks di dalam screenshot bukan instruksi development. Lihat [perbandingan fitur dan prioritas](SHOTS_COMPARISON.md).

## Hasil yang ingin dicapai

User membuka workspace seperti aplikasi desain: pilih device/template, unggah gambar, susun posisi dan sudut di canvas, lihat hasil secara langsung, lalu export ketika komposisi siap. Keynote/Canva menjadi acuan kemudahan menyusun komposisi; Rotato menjadi acuan konfigurasi device dan preview 3D. Ini tetap editor mockup terarah, dengan scene single/duo sebagai scope awal.

## Audit sebelum pekerjaan sesi ini

| Kebutuhan | Kondisi sebelumnya |
|---|---|
| Canvas 3D dan texture layar | Sudah ada: satu fixture iPhone dengan gambar contoh |
| UI workspace dengan library, canvas, inspector | Belum: halaman proof dengan satu tombol PNG |
| Upload gambar user, fill/fit, crop | Belum |
| Posisi, angle, scale dan preset | Belum; transform renderer masih hardcoded |
| Rasio canvas dan background | Belum; PNG proof 1200 × 1200 |
| Motion/timeline | Evaluator domain tersedia; belum terhubung ke UI |
| Autosave/recovery | Belum pada saat audit awal |
| Export publik | Belum; PNG lokal saja |
| Kualitas aset setara referensi | Belum; development fixture sederhana |

Kesimpulan: arah produk dan kontraknya sesuai, tetapi proof awal belum memenuhi pengalaman konfigurasi yang dimaksud. Menunda seluruh UI sampai tahap 6 akan menunda validasi workflow utama. Struktur editor dan interaksi inti karena itu masuk tahap 3 sekarang; tahap 6 tetap untuk perluasan katalog dan penyempurnaan visual.

## Susunan UI

- Top bar: identitas project, reset view, focus mode dan Export PNG.
- Kiri: dua tab **Mockup** dan **Background**. Mockup berisi device, upload, fill/fit, crop/padding; Background berisi solid/gradient, hex manual, picker, angle dan preset.
- Tengah: canvas dengan rasio output sebenarnya; alat Rotate/Move; Animate; feedback error/upload.
- Kanan: rasio output, scale, posisi X/Y serta rotasi X/Y/Z dalam disclosure, dan empat angle preset visual.
- Playback strip: Still/Turntable, play/pause, scrub, timecode dan durasi; dibuka melalui Animate dan playback dipause saat panel ditutup.
- Export membuka ringkasan ukuran/format; output mengikuti komposisi di canvas.

Working name UI: **Forma**. Nama dan identitas visual ini belum keputusan brand final.

Shell light ala Apple dan susunan Shots sudah diterapkan setelah T3-05. Gradient, paste gambar, precision drag, focus mode, dan rasio 4:3 adalah tambahan revisi ini. Model masih development fixture; kemiripan UX tidak berarti katalog atau kualitas render sudah setara Shots.

Follow-up Shots menambahkan **Style** dan **Shadow** di tab Mockup. Style adalah variasi material bodi fixture 3D (Original, Silver, Graphite); shadow adalah efek di belakang device (None, Soft, Spread, Hug) dengan opacity. Scene preview dan capture PNG memakai pilihan yang sama. Kualitas bayangan dan material perlu dinilai ulang saat aset device final tersedia.

## Urutan kerja dan acceptance

### 1. Editor statis — T3-04

Implementasi sesi ini:

- Workspace tiga panel dengan canvas dominan.
- Satu iPhone, empat angle presets, drag rotate/move, angka posisi, slider rotasi dan scale, reset.
- Upload lokal PNG/JPEG/WebP melalui file picker atau drop. Maksimal 15 MB dan 16 megapixel; file rusak/invalid tidak mengganti gambar aktif. Decode dilakukan lokal.
- Fill tanpa stretch, crop horizontal/vertikal, fit dengan padding berwarna. Ganti gambar mempertahankan pose/posisi/scale/background.
- Background solid dan rasio 1:1, 16:9, 9:16. Resize canvas mempertahankan rasio output.
- Preview dan PNG menggunakan renderer serta scene transform yang sama. Export lokal 1200×1200, 1920×1080, atau 1080×1920.
- Resource texture/material hasil penggantian dibersihkan. Pesan loading, error upload, keterbatasan sesi lokal, dan dialog export tersedia.

Bukti: unit test mapping/aspect; browser checks upload, crop, fit, drag, reset, output ukuran, download aktual; screenshot workspace dan PNG dengan gambar asimetris untuk memeriksa orientasi. Lihat `docs/evidence/t3-04-*` dan `scripts/check-editor.mjs`.

### 2. Motion yang mengikuti komposisi — T3-05 — selesai 28 September 2026

- Hubungkan evaluator waktu ke renderer dan satu sumber scene state.
- Implementasikan play/pause, scrub, durasi, Still/Turntable terlebih dahulu. Float/Tilt memerlukan tambahan schema/evaluator dan uji loop.
- Mengedit transform mempause playback. Export menangkap playhead terpilih tanpa mengubah base pose.
- Acceptance: pose pada waktu tertentu konsisten antara preview dan PNG; playback tidak mengubah scene dasar; tidak ada drift setelah pause/resume.

Hasil: Still/Turntable, play/pause, scrub, timecode, durasi 2–10 detik, pause-on-edit, dan selected-frame PNG sudah terhubung ke evaluator domain yang sama. Browser check membandingkan hash frame awal/tengah, mengulang playhead yang sama, dan memastikan file unduhan identik dengan frame terpilih. Float/Tilt dan export video tetap di luar T3-05.

### 3. Keamanan pekerjaan user — T3-06, selesai 29 September 2026

- IndexedDB menyimpan scene, metadata output, dan blob gambar, dengan versioning serta asset resolver per image reference.
- Restore sesudah reload; tangani storage penuh, file hilang dan draft tidak kompatibel.
- Watermark menyatu pada preview. Export lokal tetap diberi konteks prototype sampai backend siap.
- Acceptance: upload → edit → reload memulihkan gambar dan semua konfigurasi; kegagalan autosave terlihat.

Penyimpanan, restore, status kegagalan dan watermark pixel pada preview sudah
diterapkan 29 September 2026. PNG lokal prototype tetap bersih; export publik
memerlukan backend dan izin server pada tahap berikutnya. Undo/redo dikeluarkan
dari scope sesuai arahan user. Penyimpanan hanya berlaku di browser/perangkat
yang sama.

### 4. Review V0 — T3-07, audit teknis selesai; validasi pengguna pending

- Uji 3–5 screenshot nyata (terang, gelap, teks kecil, portrait/landscape).
- Uji pengguna menyelesaikan upload → konfigurasi → PNG tanpa panduan.
- Catat ukuran asset, waktu siap dan memori pada browser/laptop acuan.
- Pisahkan kelulusan interaksi editor dari kelulusan kualitas model/material/cahaya.

Hasil teknis dan gap dicatat di [Review T3-07](T3_07_REVIEW.md). Empat kasus
fixture/sintetis, satu screenshot nyata pilihan user, PNG aktual dan metrik
awal sudah diperiksa. Uji pengguna tanpa panduan dan persetujuan visual masih
dibutuhkan.

### 5. Tahap 4–7

Tambah tablet/laptop/duo dengan selection per device; buktikan worker render; integrasikan login/restore, ownership/kuota/job/download; lalu perluas katalog minimal 10 model dan polish UI serta aset sebelum beta. Export video tetap tahap 8.

## Batas yang masih nyata

Belum ada multi-device, akun, backend export, motion Float/Tilt, atau export video. Draft kini tersimpan lokal di browser; membersihkan data site akan menghapusnya. Undo/redo tidak direncanakan. Ukuran/batas input lokal adalah konfigurasi prototype, bukan keputusan policy Free/Pro publik.
