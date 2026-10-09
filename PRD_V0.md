**PRD v0 — Validasi internal mockup 3D iPhone**

**Revisi keputusan 30 September 2026:** selain V0 internal dan rilis backend terkelola yang dirancang di bawah, ada **MVP browser Rp0** sebagai rilis pertama. MVP ini memakai draft/gambar lokal dan PNG bersih tanpa login serta tanpa kuota server. Syarat `PUB-03` sampai `PUB-09` tetap menjadi acceptance untuk rilis backend terkelola, bukan gate MVP browser. MVP browser tetap perlu uji kualitas, lisensi asset, privasi lokal, lintas browser, dan hosting statis sebelum dirilis. [Batas dua jalur](docs/architecture/DUAL_EXPORT_PATH.md).

Versi 0.1 · 24 September 2026 · PRD diterima user sebagai dasar tahap berikutnya. Keputusan yang masih terbuka dan angka usulan tetap menunggu data/pilihan terkait. Belum ada implementasi, asset final, atau hasil pengujian.

Arahan terbaru: prioritaskan arsitektur/backend dan struktur file sebelum coding; acuan visual ditunda. Proof teknis dapat memakai UI sementara. Acceptance visual tetap dicatat terpisah dan tidak dianggap lolos sebelum ditinjau. Posisi proyek mengikuti [delapan tahap resmi](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PROJECT_STATUS.md>); rancangan teknis ada di [Architecture](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/ARCHITECTURE.md>).

Rujukan arah dan arsitektur: [Product plan](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PRODUCT_PLAN.md>). Persiapan visual dan aset: [Preparation brief](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PREPARATION_BRIEF.md>).

**Tujuan dan keputusan yang ingin dibuktikan**

V0 membantu kita memutuskan apakah screenshot yang dipasang pada iPhone 17 Pro Max terlihat cukup baik, mudah diatur di browser, dan menghasilkan PNG yang layak dipakai untuk portfolio/presentasi. Keberhasilan v0 menjadi dasar memperluas katalog dan membangun sistem publik.

Pengguna utama: UI/UX designer yang ingin menampilkan hasil desain tanpa menyusun scene 3D dari awal. Pekerjaan utama: “Gue punya screenshot, ingin menaruhnya pada device dengan komposisi bagus, lalu mendapatkan gambar yang siap dipakai.”

Tiga pertanyaan validasi: apakah hasil render memenuhi referensi visual; apakah alur upload–pose–PNG mudah dipahami; apakah fondasi asset dan scene dapat diperluas ke kategori lain tanpa menulis ulang editor.

**Batas tahap produk**

| Tahap | Yang dibuktikan / diselesaikan | Syarat penggunaan |
|---|---|---|
| V0 internal, fokus PRD ini | Satu iPhone 17 Pro Max, mapping screenshot, pose, komposisi, preview motion, PNG | Pengujian internal; export lokal diperbolehkan sebagai proof |
| MVP browser Rp0 | Editor, draft lokal, PNG bersih lokal tanpa login/kuota server | Gate kualitas, lisensi, privasi, browser, dan hosting statis harus lulus |
| Pengembangan backend terkelola | Contoh tablet/laptop, duo, model preview/full, server PNG, akun dan kuota | Beta privat; belum memenuhi syarat rilis backend |
| Rilis backend terkelola | Minimal 10 model lintas kategori + template duo, login saat export, PNG standar bersih dengan kuota, watermark preview | Seluruh PUB requirements di bawah harus lulus |
| Fase berbayar | Subscription dan fitur output lanjutan, terutama video | Harga/paket dan kualitas fitur divalidasi sebelum checkout aktif |

Login dan kuota wajib untuk rilis backend terkelola. MVP browser dapat dipakai publik tanpa keduanya, dengan penjelasan bahwa export lokal tidak memiliki kontrol akses atau kuota yang aman. Alur login dan pemulihan draft tetap dicakup pada rancangan backend. V0/MVP lokal tidak boleh dipasarkan sebagai export yang aksesnya terlindungi.

**Flow yang diuji pada v0**

1. Buka editor dengan iPhone dan komposisi contoh.
2. Pilih atau drag-and-drop screenshot; gambar menggantikan contoh setelah validasi berhasil.
3. Atur crop/fit, pose, zoom/posisi, background, dan aspect canvas.
4. Pilih still atau preset motion; pause/scrub untuk memilih frame.
5. Export PNG dari komposisi dan frame terpilih, lalu buka file hasilnya di aplikasi lain.
6. Ganti screenshot atau reload dan periksa pemulihan draft.

**Functional requirements v0**

Seluruh V0 requirements menjadi cakupan target v0. Pengerjaan dimulai dari jalur sederhana satu screenshot → satu pose → satu PNG, lalu diperluas sampai tabel terpenuhi. Detail angka yang masih berupa usulan dicatat pada register keputusan, bukan dianggap sudah dipilih user.

| ID | Kebutuhan | Kondisi selesai yang bisa diperiksa |
|---|---|---|
| V0-01 | Load satu model iPhone 17 Pro Max | Model tampil dengan orientasi benar; loading/error terlihat; retry tersedia jika load gagal |
| V0-02 | Input PNG/JPEG/WebP statis | File valid muncul pada layar; file rusak/tidak didukung ditolak dengan alasan; input gagal tidak mengganti screenshot aktif |
| V0-03 | Mapping layar dan crop/fit | Screenshot tidak terbalik, mirror, atau stretch; fill dapat direposition; fit menampilkan gambar penuh dengan padding; reset bekerja |
| V0-04 | Pose dan framing | Drag mengubah pose; tersedia front/three-quarter/reset; zoom/posisi mengubah komposisi secara konsisten; kamera dan pose device disimpan terpisah |
| V0-05 | Canvas dan background | Rasio 1:1, 16:9, 9:16 bisa dipilih; warna/gradient background ikut masuk PNG; framing tidak berubah tanpa penjelasan |
| V0-06 | Preview motion | Still, Float, Gentle Tilt, Turntable tersedia; play/pause/scrub bekerja; motion menggunakan base pose; perubahan pose saat playback mempause preview |
| V0-07 | PNG dari frame terpilih | Export membekukan scene dan playhead; PNG cocok dengan crop, pose, framing, dan background yang sedang dipilih; ukuran pixel sesuai opsi output |
| V0-08 | Ganti screenshot tanpa kehilangan komposisi | Mengganti gambar mempertahankan pose/camera/background; crop menyesuaikan rasio gambar baru dengan kontrol yang jelas |
| V0-09 | Restore lokal | Reload memulihkan screenshot dan scene; kegagalan autosave ditampilkan. Undo/redo dikeluarkan dari scope sesuai arahan user 29 September 2026. |
| V0-10 | State gagal yang dapat dipulihkan | Model gagal, input gagal, GPU/context error, dan PNG gagal mempunyai pesan serta tindakan lanjut; tidak diam-diam menghapus draft |
| V0-11 | Preview watermark untuk review | Pola watermark dapat dinilai pada layar terang/gelap dan beberapa background; batas proteksi client dinyatakan; watermark bukan klaim anti-screenshot |
| V0-12 | Fondasi katalog | Model dimuat lewat metadata asset; screen mapping, bounds, dan versi tidak di-hardcode pada komponen UI; scene memakai daftar instance walau v0 hanya satu |

V0-11 menguji tampilan watermark. File PNG internal untuk review boleh bersih agar kualitas dapat dinilai. Jalur internal tersebut tidak menggantikan pemeriksaan akses export publik.

Usulan konfigurasi uji awal: klip preview lima detik; PNG 1080×1080, 1920×1080, 1080×1920; satu studio lighting dan satu finish device. Ini fixture internal, bukan penetapan final resolusi/limit akun Free. Transparansi dapat diuji sebagai eksperimen terpisah dan tidak menahan validasi PNG opaque.

**Requirements rilis backend terkelola yang harus tetap dijaga**

Tabel ini mencatat syarat rilis yang diwarisi dari product plan. Detail implementasinya diturunkan setelah proof lintas kategori/server, tanpa mengubah scope v0 menjadi public launch.

| ID | Syarat publik | Bukti lulus |
|---|---|---|
| PUB-01 | Minimal 10 model smartphone/tablet/laptop | Sepuluh model siap dipilih dan digunakan, bukan placeholder atau variasi warna yang dihitung ulang |
| PUB-02 | Single dan iPhone duo | Duo memiliki dua instance dengan gambar/crop/pose masing-masing; bisa memakai screenshot sama atau berbeda; camera/background bersama |
| PUB-03 | Guest bebas mencoba, login saat export | Klik export guest memunculkan login; cancel/error/redirect tidak menghilangkan screenshot atau komposisi |
| PUB-04 | PNG standar bersih dengan kuota | Akun Free yang berhak mendapat PNG tanpa watermark; ukuran dan kuota/reset terlihat sebelum export |
| PUB-05 | Watermark preview dan kontrol akses | Preview normal ber-watermark; asset/file penuh privat; job/download diperiksa server; batas screenshot/client modification tidak disamarkan |
| PUB-06 | Kuota konsisten | Request duplikat tidak menggandakan job/pemakaian; gagal/cancel melepas reservasi; re-download artifact valid tidak memotong kuota baru |
| PUB-07 | Privacy dan kepemilikan | Upload server dijelaskan; user tidak dapat membaca job/file user lain; lifecycle file dan batas draft lokal jelas |
| PUB-08 | Hak fitur siap untuk monetisasi | Policy server memisahkan login, Free quota, dan Pro entitlement; browser tidak bisa membuka akses dengan flag sendiri |
| PUB-09 | Skenario recovery | Session expired, kuota habis, upload gagal, render gagal, cancel/retry, artifact expired, dan login redirect ditangani tanpa kehilangan draft |

PUB-05 melindungi akses ke artifact resmi. Preview yang berjalan pada client tetap dapat dimodifikasi atau direkonstruksi; arsitektur hybrid membawa risiko sisa tersebut. Preview dari server adalah opsi dengan biaya/latensi tambahan jika nanti diperlukan. Setelah PNG diterima secara sah, file dapat disalin untuk penggunaan normal.

**Kualitas dan cara mengukurnya**

| Area | Kriteria v0 | Cara mengumpulkan bukti |
|---|---|---|
| Fidelity device | Bentuk dan proporsi sesuai referensi yang dipilih | Tampilan depan, three-quarter, samping/belakang; review bersama |
| Screenshot | Tidak distorsi/mirror, teks kecil terbaca, warna tidak berubah tanpa maksud | Gambar terang, gelap, teks kecil, swatch warna, dan beda rasio pada PNG ukuran sebenarnya |
| Material/lighting | Memenuhi contoh visual yang disepakati dan menjaga layar terbaca | Bandingkan render browser/PNG dengan referensi beranotasi |
| Preview → PNG | Crop, pose, aspect, background, dan waktu motion sesuai | Bandingkan frame pause dengan file hasil; bandingkan komposisi, bukan pixel preview yang ber-watermark |
| Interaksi | Rotate dan scrub terasa responsif | Rekam hasil ukur pada laptop/browser yang disebutkan; target awal ≥30 fps masih perlu dikonfirmasi |
| Export | PNG selesai dan terbuka dengan dimensi benar | Catat waktu render, pixel dimensions, serta pembukaan di aplikasi gambar/presentasi |
| Ketahanan | Ganti screenshot dan export berulang tidak merusak scene | Uji tiga export berturut-turut dan restore setelah reload; catat error/resource yang terus meningkat |
| Kegunaan | Alur dapat dilakukan tanpa instruksi teknis | Uji tugas pada beberapa designer setelah proof teknis stabil; target publik 4/5 berhasil dari product plan |

Tidak ada hasil benchmark yang sudah tercapai. Laptop, browser/version, kondisi jaringan, fixture screenshot, dan asset version harus dicatat agar perbandingan bermakna.

**Bukti penyelesaian v0**

- Asset sumber, GLB versi uji, dan metadata layar/pivot/framing tersedia dengan asal aset tercatat.
- Editor internal dapat menjalankan flow v0 end-to-end; semua V0 requirements punya hasil pemeriksaan.
- PNG frontal dan three-quarter dengan screenshot nyata tersedia, ditambah bukti preview motion dari sesi internal.
- Hasil review kualitas, pengukuran awal, dan masalah yang belum selesai ditulis singkat.
- Keputusan sesudah review: lanjut ke lintas kategori/server, perbaiki asset/lighting tertentu, atau ubah pendekatan renderer berdasarkan bukti.

V0 selesai berarti siap mengambil keputusan tahap berikutnya; belum berarti produk siap publik. UI v0 cukup untuk menilai flow, sementara desain visual publik mengikuti brief dan contoh layar yang dipilih.

**Register keputusan yang masih terbuka**

| ID | Keputusan/input | Usulan atau status | Diperlukan sebelum |
|---|---|---|---|
| D-01 | Referensi hasil render | Ditunda sesuai arahan user; tidak menahan proof teknis | Acceptance visual tahap 6 sebelum publik |
| D-02 | Layar/detail UI favorit | Figma/Lottie tetap arah; detail ditunda | Desain final tahap 6 |
| D-03 | Aset iPhone 17 Pro Max | Blender sebagai sumber; pilihan buat/beli/commission dan budget belum ditetapkan | Produksi/perolehan aset |
| D-04 | Test hardware/browser dan screenshot | Perlu laptop acuan dan 3–5 screenshot | Benchmark dan acceptance kualitas |
| D-05 | Daftar 10 model | Campuran smartphone/tablet/laptop; model spesifik belum ditetapkan | Perolehan katalog publik; tidak menahan wireframe v0 |
| D-06 | Resolusi PNG Free, kuota dan reset | PNG bersih setelah login sudah dipilih; angka belum ditentukan | Implementasi policy publik; ditinjau terhadap biaya server |
| D-07 | Transparansi | Kandidat fitur Pro, belum diputuskan | Desain export/pricing publik |
| D-08 | Provider auth/server/storage dan lifecycle | Baseline Supabase untuk auth/Postgres/storage; compute worker dan lifecycle final setelah benchmark | Integrasi produksi tahap 5 |
| D-09 | Harga dan allowance Pro/video | Belum ditetapkan; ukur biaya dan kebutuhan user | Billing aktif |

Detail terbuka tidak dianggap sudah disetujui hanya karena memiliki usulan. Persiapan yang tidak bergantung padanya tetap berjalan. Product plan menyimpan arah produk; PRD menyimpan requirement/acceptance; preparation brief menyimpan input visual/aset. Perubahan scope ditulis pada requirement terkait agar ketiga dokumen tetap selaras.
