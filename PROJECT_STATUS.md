**Status proyek — Mockup 3D Device**

**QA Duo 9 Oktober 2026 — tahap 7/8 mulai:** build statis MVP lulus. Chrome headless dengan software WebGL menghasilkan empat PNG aktual: pose open, seated, closed, dan layar dalam dengan gambar berbeda. Kontrol fold, simpan/reload draft, dan kembali ke iPhone tunggal lulus. [Bukti browser](docs/evidence/iphone-duo/PROOF.md). Temuan visual pose seated diperbaiki dengan kamera yang mengarah ke kedua panel saat melipat dan blur yang terbatas pada crease; hasil PNG sekarang menunjukkan gambar terbaca. Seam tipis di tengah pose open masih perlu polish. Safari, Firefox, perangkat fisik, dan beta pengguna baru belum diperiksa.

**iPhone Duo 9 Oktober 2026 — aset prosedural milik proyek (tahap 6/8 sebagian):** adaptasi geometri/tekstur/rig dari viewer publik diganti model Blender yang dibangun dari primitive dan morph animasi buatan proyek. Layar dalam adalah satu mesh tersambung; layar luar/dalam tetap dapat menerima gambar terpisah dan kontrol lipat memakai satu animasi. Starter screen memakai fixture dashboard fiktif, environment map dari viewer dihapus, dan semua thumbnail/render Duo dibuat ulang. Fidelity detail kamera, material, dan lipatan lebih sederhana. [Provenance dan batas visual](docs/evidence/iphone-duo/REFERENCE_COMPARISON.md); [bukti revisi](docs/evidence/iphone-duo/PROOF.md). Perubahan historis 7 Oktober di bawah telah digantikan oleh versi ini.

**Keputusan produk 30 September 2026:** MVP pertama ditargetkan tanpa pengeluaran layanan berbayar: draft dan screenshot lokal, PNG bersih dirender di browser, tanpa login atau kuota server. Arsitektur backend akun/queue/worker tetap disiapkan untuk fase pertumbuhan, tetapi tidak dijalankan sekarang. [Rancangan dua jalur](docs/architecture/DUAL_EXPORT_PATH.md) adalah acuan baru untuk batas rilis. Syarat login/kuota di bagian historis dokumen ini berlaku untuk rilis backend terkelola, bukan MVP browser.

**Pekerjaan arsitektur dua jalur:** kontrak `PngExportIntent` dan pemetaan imageRef lokal→uploaded sudah ada; editor memakai adapter export browser. `apps/mvp` menghasilkan build statis terpisah dari route worker internal. Verifikasi awal: unit test kontrak, typecheck, build app utama, dan build statis MVP lulus. Build statis disajikan lokal dan Chrome menghasilkan [PNG bukti 1200 × 1200](docs/evidence/current-render-proof.png); route render internal dan model full tidak masuk output statis. Pemilik produk menyatakan sudah mencoba dan hasilnya oke pada 7 Oktober; detail sesi tidak dicatat. Publikasi/hosting dan uji beta pengguna baru belum dilakukan.

Diperbarui 9 Oktober 2026. Sumber utama posisi pekerjaan; roadmap detail berada di [Implementation roadmap](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/IMPLEMENTATION_ROADMAP.md>).

**Posisi saat ini: tahap 4 dari 8, T4-01 sampai T4-04 selesai; T4-05 benchmark lokal selesai dan validasi VM Linux ditunda bersama jalur backend.** T3-07 ditutup untuk V0 internal setelah pemilik produk mencoba editor dan menerima hasilnya; uji beta pengguna baru tetap menjadi gerbang rilis publik. Editor menyediakan Single iPhone/tablet/laptop generik serta iPhone Duo sebagai satu perangkat lipat dengan gambar layar luar/dalam terpisah, preview bersih, copy ber-watermark, draft lokal, dan PNG frame terpilih. Worker render lokal sudah menghasilkan PNG; proxy/full iPhone dan normalisasi screenshot telah diperiksa. Queue, akun, backend publik, dan export video belum ada. Rincian: [Review T3-07](docs/T3_07_REVIEW.md), [Proof T4-01](docs/T4_01_PROOF.md), [Proof T4-02](docs/T4_02_PROOF.md), [Proof T4-03](docs/T4_03_PROOF.md), [Proof T4-04](docs/T4_04_PROOF.md), dan [Proof T4-05](docs/T4_05_PROOF.md).

| Tahap | Nama | Status | Bukti / syarat berikutnya |
|---|---|---|---|
| 1/8 | Product plan dan PRD | Selesai | User menerima arah produk dan PRD; nilai bisnis terbuka tetap tercatat |
| 2/8 | Arsitektur dan persiapan teknis | Selesai — dokumen | Architecture, contracts, repository blueprint, dan roadmap konsisten; implementasi dimulai terpisah pada tahap 3 |
| 3/8 | V0 teknis satu iPhone | Selesai untuk V0 internal — T3-01 sampai T3-07 | Audit teknis, screenshot nyata, dan penerimaan pemilik produk; uji beta pengguna baru di tahap 7 |
| 4/8 | Lintas kategori dan proof server | Proof lokal selesai; validasi VM Linux ditunda bersama backend | T4-01 sampai T4-04 dan benchmark lokal T4-05; VM dan biaya aktual saat jalur server diaktifkan |
| 5/8 | Akun dan backend terkelola | Ditunda sampai ada kebutuhan/anggaran | Login restore, upload privat, quota, queue, protected export |
| 6/8 | Katalog dan penyempurnaan editor | Sebagian: model Duo sudah terpasang | Minimal 10 model dan QA visual/final UI masih perlu dikerjakan |
| 7/8 | Beta dan rilis publik | Belum mulai | MVP browser: QA, lisensi, hosting statis; rilis backend: PUB requirements lama |
| 8/8 | Pro dan video | Belum mulai | Subscription dan MP4 siap sebelum checkout dibuka |

Rilis publik pertama tetap memerlukan gerbang kualitas dan operasional; jalur browser dapat dirilis tanpa menunggu tahap 5 backend dan target 10 model. Rilis backend terkelola mengikuti syarat PUB lama. Tahap 8 adalah kelanjutan produk berbayar. Nomor tahap tidak merepresentasikan persentase effort atau kode yang sudah selesai.

**Arahan terbaru yang berlaku**

- MVP browser tanpa login/kuota server dan tanpa layanan berbayar; PNG lokal bersih boleh digunakan. Jalur server disiapkan lewat kontrak scene/export yang sama dan diaktifkan kemudian berdasarkan kebutuhan dan anggaran.
- Arahan Shots terbaru: gunakan UX canvas dominan dengan media di kiri dan komposisi di kanan; UI light ala Apple; tab utama hanya **Mockup** dan **Background**. Implementasi dan gap tercatat di [Shots comparison](docs/SHOTS_COMPARISON.md).
- Follow-up Shots: tab Mockup kini mempunyai Style (Original/Silver/Graphite) dan Shadow (None/Soft/Spread/Hug) dengan opacity; keduanya terhubung ke scene/render preview dan PNG. Ini variasi satu fixture, belum katalog style lintas device.
- Arahan 28 September: user menginginkan workspace seperti Keynote/Rotato/Canva untuk konfigurasi 3D mockup sebelum export.
- UI editor dan interaksi konfigurasi dimajukan ke tahap 3. Ini menggantikan arahan lama menunda seluruh visual/coding; polish final dan katalog tetap tahap 6.
- V0 internal memakai iPhone 17 Pro Max. Publik minimal 10 model smartphone/tablet/laptop plus template iPhone duo.
- Guest boleh mencoba dan export PNG lokal pada MVP browser; login serta kuota server menjadi syarat rilis backend terkelola; preview/copy ber-watermark.
- Batas anti-screenshot/copy tetap jujur: server melindungi artifact resmi; preview client dapat diambil/dimodifikasi dan file yang sah diunduh dapat disalin.
- Video/Pro mengikuti roadmap; belum menetapkan harga, allowance, atau membuka pembayaran.
- Setiap update pekerjaan menyebut tahap X/8, hasil baru, berikutnya, dan kendala relevan.

**7 Oktober 2026 — backup project lokal untuk MVP browser:** tombol Save project mengunduh file `.forma.json` berisi komposisi Single/Duo dan gambar yang digunakan. Open project memvalidasi format, scene, semua gambar, dan kemampuan decode sebelum meminta konfirmasi untuk mengganti draft lokal. Impor berhasil menyimpan draft secara atomik lalu memuat ulang editor. Build statis MVP serta typecheck web/MVP lulus; uji Chrome pada build statis membuktikan backup 2.65 MB, file dengan gambar hilang ditolak tanpa mengubah komposisi, dan file valid memulihkan gambar, pose, serta rasio. Regresi IndexedDB lama juga lulus. Berikutnya: uji kegagalan storage/GPU/export dan QA lintas browser/perangkat. Fitur ini belum mengubah keputusan tanpa backend/akun.

**7 Oktober 2026 — pemulihan error dan preview:** autosave menampilkan pesan khusus saat kuota penyimpanan browser penuh dan menyediakan Retry save. Kegagalan export PNG kini tetap membuka dialog agar dapat dicoba lagi; draft tidak berubah. Kehilangan konteks WebGL atau error renderer menampilkan aksi untuk membuat ulang preview. `scripts/check-failure-recovery.mjs` memaksa ketiga kegagalan itu di Chrome pada build statis dan memverifikasi pemulihannya, lalu memeriksa lebar 390 px tanpa overflow. Regresi backup/restore project kembali lulus setelah perubahan autosave. Typecheck web, render-scene, MVP, dan build statis MVP lulus. Preview lokal dibuka untuk review. QA pada Safari/Firefox dan perangkat fisik, lisensi aset, serta pilihan hosting masih terbuka sebelum rilis publik.

**Paket hasil tahap 2**

| Dokumen | Isi |
|---|---|
| [Architecture](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/ARCHITECTURE.md>) | Next web/API, Supabase, shared renderer, worker/queue, deployment, lifecycle dan tradeoff |
| [System contracts](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/SYSTEM_CONTRACTS.md>) | Scene/data model, endpoints, auth/ownership, job states, quota/idempotency/retry |
| [Repository blueprint](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/REPOSITORY_BLUEPRINT.md>) | Folder target, batas imports, asset/secrets, lingkungan, CI, urutan scaffold |
| [Implementation roadmap](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/IMPLEMENTATION_ROADMAP.md>) | Delapan tahap, backlog dependency, bukti selesai, format laporan |

**Hasil nyata T3-01**

- Root workspace memakai pnpm 11.19.0 dengan satu lockfile, TypeScript 7.0.2, target Node 26.0.0 melalui `.node-version`, konfigurasi TypeScript strict bersama, ignore file, dan contoh environment lokal tanpa secret.
- `apps/web` adalah shell Next.js 16.3.6 + React 19.3.0 yang mengonsumsi langsung keempat package awal. Halaman `/` statis menjelaskan status proof; belum ada editor, auth, API, atau export.
- `packages/contracts`, `packages/scene-domain`, `packages/catalog`, dan `packages/render-scene` mempunyai export boundary dan typecheck sendiri. Dependency mengikuti arah blueprint: domain/catalog ke contracts, renderer ke contracts/domain, dan web ke keempatnya.
- `render-scene` menyiapkan dependency Three.js 0.186.0 dan React Three Fiber 9.8.0, tetapi belum berisi renderer; implementasi model/texture/camera baru masuk T3-03.
- `assets/fixtures` sudah disiapkan dengan aturan bahwa fixture harus non-sensitif dan mempunyai sumber/lisensi/checksum saat ditambahkan. Belum ada model atau screenshot yang diklaim sebagai fixture iPhone.

**Bukti pemeriksaan T3-01**

| Pemeriksaan | Hasil |
|---|---|
| `pnpm install` | Lulus; 6 workspace project terdeteksi dan `pnpm-lock.yaml` dibuat |
| `pnpm install --offline --frozen-lockfile` | Lulus; lockfile konsisten dan dependency lokal lengkap |
| `pnpm typecheck` | Lulus untuk contracts, scene-domain, catalog, render-scene, dan web |
| `pnpm build` | Lulus; Next.js production build mengompilasi dan mem-prerender `/` serta `/_not-found` |
| `git diff --check` | Lulus tanpa whitespace error |

Shell langsung menyediakan Node 26.0.0; executable pnpm terkelola pada lingkungan pemeriksaan memakai Node 24.19.0. `engines` karena itu menyatakan rentang kompatibel `>=24.19.0 <27`, sementara versi target repository tetap dipin pada 26.0.0. Kedua jalur menjalankan pemeriksaan di atas tanpa kegagalan.

**Hasil nyata T3-02**

- `packages/contracts` sekarang mendefinisikan schema runtime `SceneDocument` dan `DeviceManifest` versi 1 menggunakan Zod 4.6.5. Object asing, angka non-finite, quaternion/front-direction tidak ternormalisasi, scale non-positif, crop keluar batas, instance/surface/variant ID duplikat, playhead keluar durasi, dan manifest `ready` tanpa asset ditolak.
- Image reference dibatasi ke blob lokal atau uploaded asset ID; schema tidak menerima URL, shader, script, token, object Three.js, atau private storage key.
- Validator mengembalikan code stabil, path field, dan pesan aman tanpa memantulkan scene/input mentah. Deserializer membedakan JSON rusak, schema version yang belum didukung, dan scene invalid; serializer memvalidasi ulang sebelum menghasilkan JSON.
- `packages/scene-domain` mempunyai evaluator murni `evaluateSceneAtTime(scene, absoluteTime)` untuk preset `none`/`turntable`. Waktu di-wrap terhadap durasi dan quaternion hasil dinormalisasi tanpa memutasi scene sumber atau bergantung pada frame delta.
- `packages/catalog` menyediakan fixture manifest dan scene iPhone 17 Pro Max yang dapat dibaca tanpa UI. Pada akhir T3-02 manifest masih `draft`; T3-03 kemudian mempromosikannya ke `ready` khusus untuk development fixture setelah GLB dan checksum tersedia, bukan sebagai asset katalog final.
- Vitest 5.0.1 ditambahkan sebagai test runner; tidak ada renderer, upload, auth, API, cloud, atau backend yang ikut dibuat.

**Bukti pemeriksaan T3-02**

| Pemeriksaan | Hasil |
|---|---|
| `pnpm test` | Lulus: 3 test file, 11 unit test pada contracts, catalog fixture, dan evaluator waktu |
| `pnpm typecheck` | Lulus untuk seluruh 5 package/app yang mempunyai script typecheck |
| `pnpm build` | Lulus; shell Next.js tetap terkompilasi dan route `/` diprerender |
| `pnpm install --offline --frozen-lockfile` | Lulus; lockfile konsisten setelah penambahan Zod/Vitest |
| Audit import/scope + `git diff --check` | Lulus; dependency package mengikuti blueprint dan tidak ada dependency auth/cloud/backend publik |

**Hasil nyata T3-03**

- `assets/fixtures/models/iphone-17-pro-max-dev.glb` adalah geometri development buatan proyek lewat Blender 5.2.2 LTS. Dimensi luar 78.0 × 163.4 × 8.75 mm dan rasio display mengacu pada spesifikasi Apple; kamera, tombol, bevel, warna, dan material sengaja disederhanakan. Ini bukan model resmi Apple dan bukan fidelity katalog final.
- `assets/fixtures/screens/dashboard-dark.png` adalah screenshot dashboard fiktif non-sensitif yang dibuat khusus sebagai texture fixture dengan OpenAI built-in ImageGen. Provenance, batas penggunaan, dimensi, checksum, dan kontrak mesh dicatat di `assets/fixtures/README.md`.
- Manifest katalog sekarang mengikat GLB `ready` development fixture ke mesh `Screen`. `scripts/sync-fixtures.mjs` menyalin source asset ke public path pada `predev`/`prebuild`; salinan public tidak menjadi source of truth.
- `packages/render-scene` memuat GLB dan texture secara asynchronous, meng-clone scene, mengikat material layar sRGB, memasang camera rig dan lighting, memberi readiness eksplisit, serta menyediakan `capturePng({ width, height })` yang memvalidasi dimensi.
- Halaman `/` sekarang merupakan proof T3-03 dengan status loading/ready dan download PNG lokal. Upload, crop/fit editor, drag controls, pose editor, background/aspect controls, auth, API, dan cloud sengaja belum dibuat.
- `scripts/capture-render-proof.mjs` menjalankan proof lewat Chrome lokal dan menulis `docs/evidence/t3-03-iphone-proof.png`. Artifact 1200 × 1200 RGBA PNG tersebut dibuka dan diperiksa visual: handset utuh terlihat, texture dashboard berada di permukaan layar, dan sudut tiga-perempat serta pencahayaan terbaca.

**Bukti pemeriksaan T3-03**

| Pemeriksaan | Hasil |
|---|---|
| `node scripts/capture-render-proof.mjs` | Lulus; PNG 1200 × 1200, 453635 byte, SHA-256 `d0a09194bf7b0660e791c44e27b17bfa7f755445076e0feeafc954705b90a8b5` |
| Inspeksi visual `docs/evidence/t3-03-iphone-proof.png` | Lulus untuk wiring T3-03: model, texture layar, framing, dan lighting terlihat; fidelity final tetap pending |
| `pnpm test` | Lulus: 3 test file, 11 unit test |
| `pnpm typecheck` | Lulus untuk contracts, scene-domain, catalog, render-scene, dan web |
| `pnpm build` | Lulus; 2 fixture tersinkron dan route `/` serta `/_not-found` diprerender |
| `pnpm install --offline --frozen-lockfile` | Lulus; 6 workspace project, lockfile konsisten |
| `git diff --check` | Lulus tanpa whitespace error |

**Hasil nyata T3-04 — 28 September 2026**

- Halaman proof diganti workspace editor tiga panel: library/preset, canvas, inspector. Working name Forma belum menjadi keputusan brand final.
- Input PNG/JPEG/WebP lokal melalui picker/drop, dengan batas 15 MB/16 MP, validasi decode, penanganan upload bertumpuk, dan pesan resolusi kecil. File invalid/rusak tidak mengganti gambar aktif.
- Mapping fill dan fit memakai ukuran sumber asli, crop horizontal/vertikal, serta warna padding; gambar asimetris membuktikan orientasi dan rasio tidak berubah.
- Pose/posisi tidak lagi hardcoded di renderer. UI membentuk SceneDocument dengan quaternion/position/scale/background/crop dan image reference lokal. Screen canvas diturunkan dari sumber gambar; renderer dan export memakai transform yang sama.
- Drag rotate/move, empat preset angle, slider rotasi tiga sumbu/scale, angka posisi X/Y, dan reset. Upload baru mempertahankan transform dan tampilan scene.
- Background solid dan output 1:1 (1200×1200), 16:9 (1920×1080), 9:16 (1080×1920). ResizeObserver menjaga rasio artboard pada ruang yang tersedia. Dialog export menghasilkan file PNG aktual.
- Feedback 28 September: background menerima input hex manual 3/6 digit (dengan atau tanpa `#`) dan color picker tetap sinkron. Pinch/scroll trackpad di canvas mengubah state Scale yang sama dengan slider inspector, dibatasi 40–160%, sehingga preview dan export memakai nilai identik.
- Texture/material layar dibersihkan ketika berubah. Error renderer mempunyai fallback; UI menjelaskan sesi lokal hilang saat reload.
- Rencana diperbarui: struktur editor tidak lagi menunggu tahap 6. Timeline baru ditambahkan bersama implementasi motion; tidak ada tombol animasi palsu.

**Bukti pemeriksaan T3-04**

| Pemeriksaan | Hasil |
|---|---|
| `pnpm test` | Lulus: 4 test file, 16 test; termasuk mapping landscape/portrait, fill/fit, crop edges, invalid dimensions, normalisasi quaternion |
| `pnpm typecheck` | Lulus seluruh package/app |
| `pnpm build` | Lulus production build |
| `node scripts/check-editor.mjs` | Lulus: readiness, upload menjaga pose/posisi, crop mengubah output, fit, invalid/corrupt input, 3 ukuran PNG, input hex 3/6 digit dan rollback invalid, trackpad-scale sync dan clamp, pointer rotate/move, reset, dialog dan download PNG aktual, preview/export aspect, viewport sempit |
| Inspeksi visual | Workspace 1440×960 dan 390×844; PNG fit/aspect dengan label LEFT/RIGHT/TOP/BOTTOM terbaca tanpa mirror; fidelity device tetap belum final |
| Artifact | `docs/evidence/t3-04-editor-ui.png`, `t3-04-editor-export.png`, `t3-04-fit-screen.png`, variasi rasio/crop, `t3-04-checks.json` |

Uji browser dijalankan di Chrome lokal dengan server `http://localhost:3000`. Ini bukan benchmark performa atau sertifikasi lintas browser. Test awal menemukan rasio artboard bisa berubah karena batas tinggi flex; sizing diperbaiki dan diverifikasi ulang. Perlu menunggu layout stabil setelah resize viewport sebelum membandingkan dimensi.

**Hasil nyata T3-05 — 28 September 2026**

- Renderer memanggil `evaluateSceneAtTime` dari package domain menggunakan `scene.frame.playheadSeconds`. Preview dan capture PNG karena itu memakai evaluator dan scene document yang sama.
- Timeline menyediakan Still/Turntable, play/pause, scrub 0.01 detik, timecode, dan durasi 2–10 detik. Playback memakai waktu absolut dari `performance.now()`, bukan akumulasi delta transform.
- Turntable berputar 360° relatif terhadap quaternion pose dasar. Scrub atau pause tidak menulis ulang angle user; frame yang sama menghasilkan transform dan PNG yang sama.
- Mengedit angle, posisi, scale, preset, drag, trackpad scale, reset, atau upload mempause playback. Export juga mempause dan menampilkan preset serta playhead yang akan ditangkap.
- Dialog dan file PNG aktual mengambil frame terpilih. Hash file unduhan sama dengan capture frame sebelum export.
- Timeline responsif tetap dapat dipakai pada viewport 390 px; timecode/durasi sekunder disembunyikan agar scrubber dan play button tetap cukup lebar.

**Bukti pemeriksaan T3-05**

| Pemeriksaan | Hasil |
|---|---|
| `pnpm test` | Lulus: 4 test file, 19 test; tambahan membuktikan base pose relatif, Still stabil, dan loop tepat pada duration |
| `pnpm typecheck` | Lulus seluruh package/app |
| `pnpm build` | Lulus production build |
| `node scripts/check-editor.mjs` | Lulus: scrub mengubah frame, playhead absolut deterministik, playback maju, edit pose mempause, dialog menjaga frame, dan file PNG unduhan byte-for-byte sesuai selected frame; seluruh regression T3-04 juga lulus |
| Inspeksi visual | Timeline desktop dan viewport 390 px diperiksa; PNG frame 1.50 detik memperlihatkan orientasi Turntable sesuai preview |
| Artifact | `docs/evidence/t3-05-motion-ui.png`, `t3-05-turntable-start.png`, `t3-05-turntable-mid.png`, `t3-05-selected-frame.png`, `t3-05-export-dialog-frame.png`, `t3-05-checks.json` |

T3-05 mencakup preview motion dan export PNG pada playhead. Float/Gentle Tilt memerlukan penambahan kontrak motion dan tetap menjadi pekerjaan lanjutan; export MP4/video tetap tahap 8.

**Berikutnya**

Penyempurnaan setelah T3-05 sudah diterapkan: shell light, tab Mockup/Background, panel komposisi kanan, preset visual, timeline melalui Animate, focus mode, paste gambar, precision drag, background gradient dengan hex/angle/preset, serta PNG 4:3. Gradient terbukti masuk file PNG aktual. Follow-up Style/Shadow menambah pilihan finish device dan bayangan yang dirender di scene yang sama dengan PNG. Test 20/20, typecheck dan production build lulus; browser diperiksa pada desktop dan lebar 390 px. Detail dan batas verifikasi ada di [Shots comparison](docs/SHOTS_COMPARISON.md). Setelah itu, sebagian T3-06 dikerjakan pada 29 September sebagaimana dicatat di bawah.

T3-06: IndexedDB untuk scene + blob gambar, recovery setelah reload, dan kegagalan autosave yang terlihat sudah diterapkan. Gradient dan output ratio ikut pulih. Watermark dirender dalam pixel preview dan dikecualikan dari PNG lokal prototype. Undo/redo dihapus dari scope sesuai arahan user. T3-07 berikutnya meninjau usability, render fidelity, dan hasil ukur sebelum perluasan device/server.

**Keputusan terbuka menurut waktu kebutuhannya**

| Keputusan/input | Dibutuhkan |
|---|---|
| Laptop/browser acuan untuk proof dan pengukuran | T3-03–T3-04 |
| Kelas compute worker, GPU/software render, concurrency dan budget | Proof tahap 4 sebelum rollout tahap 5 |
| Kuota Free/reset, ukuran PNG, lifecycle dan batas storage | Tahap 5 sebelum publik |
| Daftar final 10 model, referensi visual dan final UI | Tahap 6 |
| Provider billing, harga, units/allowance video | Tahap 8 |

T3-05 tidak mempunyai blocker implementasi tersisa. Preview lokal membutuhkan proses `pnpm dev` aktif. Repository Git berada pada `main` tanpa baseline commit; file proyek masih untracked dari sesi sebelumnya. Tidak ada commit/publish/deployment pada sesi ini. Provider backend tetap rencana arsitektur. Belum ada benchmark worker, validasi layanan, atau asset katalog final.

## 29 September 2026 — iPhone 18 Pro Max reference device

Forma sekarang membuka model Blender iPhone 18 Pro Max sebagai device default.
Burgundy, Coffee, Purple tersedia melalui Style; Coffee/Purple merupakan custom
finish dari referensi pengguna. Model ini rekonstruksi visual, bukan CAD resmi atau
replika manufaktur 1:1. Referensi depan dipilih dari gambar 1–2 (Dynamic Island di
tengah), karena gambar 3 menunjukkan punch-hole yang bertentangan.

- Asset: `assets/devices/iphone-18-pro-max/iphone-18-pro-max.blend` (3 scene warna,
  masing-masing 73 mesh) dan GLB 4,002,792 byte.
- Sepuluh render Cycles transparan: tiap finish depan/belakang, serta Burgundy
  front/back flat dan dua sisi tombol. Thumbnail Style memakai render Blender.
- Layar rounded UV 1320 × 2868, bezel dan island terpisah, kamera berlapis,
  flash/LiDAR, action/volume/side/camera-control, antenna seams, USB-C dan grille.
- Preset tambahan Back view, Left buttons, Right buttons. Screenshot upload,
  crop/fit, rotasi, turntable, background dan export tetap melalui renderer Forma.
- Dokumentasi sumber, ukuran yang diperkirakan, regenerasi dan material:
  `assets/devices/iphone-18-pro-max/README.md`.

Validasi: `pnpm typecheck`, 20 unit tests dan production build lulus. GLB integrity,
hash, UV/aspect dan hardware nodes lulus `node scripts/check-iphone18-asset.mjs`.
File Blender dibuka kembali untuk memastikan ketiga scene tersimpan lengkap.
`node scripts/check-iphone18.mjs` lulus 17 pemeriksaan di Chrome headless, termasuk
warna berbeda, semua sisi, upload mempertahankan transform, crop/fit, invalid upload,
rasio PNG, turntable deterministik, playback, actual download byte-for-byte dan
layout 390 px. Bukti: `docs/evidence/iphone-18/motion-checks.json` dan PNG di folder
yang sama. Tes dijalankan headless agar input mouse pengguna tidak mengubah state
selama pengujian. Tidak ada perubahan pada status T3-06/persistence.

## 29 September 2026 — rear reference correction, asset 1.1.0

Follow-up gambar close-up menunjukkan perbedaan yang belum tertangani pada v1:
camera plateau terlalu besar, lensa masih flat, panel bawah tanpa seam, flash polos,
finishing pucat, serta bentuk/posisi logo. Geometri belakang sekarang direkonstruksi
ulang mengikuti proporsi gambar; analisis rinci ada di
`docs/IPHONE18_REAR_REVIEW.md`.

Ketiga scene Blender masing-masing berisi 90 mesh. GLB final 4,496,228 byte dengan
embedded micrograin normal map dan optical glass; palette menambah PanelSeam.
Forma memakai coating tipis pada kaca lensa untuk menjaga optik kecil tetap tajam,
dan menambahkan self-shadow pada hardware dengan pengecualian emblem tipis.
Bentuk depan dan screen mapping tetap dipertahankan. Tombol diselaraskan ulang
dengan posisi pada referensi belakang.

Bukti sebelum/sesudah dan capture tiga warna:
`docs/evidence/iphone-18-rear-v2/`. Render offline terbaru termasuk crop referensi
560 × 744 pada `assets/devices/iphone-18-pro-max/renders/burgundy-reference-detail.png`.
Aset lulus integrity/hash/UV/material/detail checks; file Blender dibuka ulang dan
ketiga scene terbukti lengkap. Typecheck, 20 unit tests, dan production build lulus.

Regresi browser pada aset final juga lulus seluruh 17 pemeriksaan, termasuk
actual PNG download yang identik dengan selected frame. Capture netral rear dari
tiga warna dan three-quarter sudah diperiksa di
`docs/evidence/iphone-18-rear-v2/`. Forma lokal ditampilkan pada Back view.

## 29 September 2026 — official color lineup, asset 1.2.0

Verified Apple Indonesia's iPhone 18 Pro page lists Burgundi, Biru Gletser,
Perak and Hitam: https://www.apple.com/id/iphone-18-pro/ . Coffee/Purple are
replaced by Glacier Blue, Silver and Black throughout the active Blender asset,
render previews and Forma Style selector. The four options use a 2-column grid.
Color values are visual PBR estimates; the official page does not specify RGB.
Antenna polymer now follows each finish. Burgundy's material properties and all
90 mesh bounds/counts were compared against the previous GLB and are unchanged.

The regenerated Blender file was reopened: all four scenes contain 90 meshes.
The generated GLB is 4,442,824 bytes. Asset integrity, named material slots,
exact four-color palette set, typecheck, 20 unit tests and production build pass.
All 17 browser regressions pass, including four distinct rendered finishes,
screenshot upload, crop/fit, motion and actual PNG download. Neutral rear views
and editor screenshot are in `docs/evidence/iphone-18-official-colors/`.
Obsolete Coffee/Purple previews were removed from active asset/public directories;
earlier review evidence is retained as historical context.

## 29 September 2026 — penyimpanan draft lokal

Arahan terbaru menghapus undo/redo dari rencana. Editor sekarang menyimpan scene,
rasio output, crop slider, sudut, nama gambar, dan file upload dalam IndexedDB
browser. Autosave berjalan setelah perubahan berhenti sejenak; playback aktif
tidak menulis setiap frame. Reload memulihkan komposisi dan gambar. Status
Saving/Saved/Save unavailable terlihat; draft yang rusak atau kehilangan gambar
tidak diam-diam ditimpa. User dapat memulai draft lokal baru setelah kegagalan
restore. Data tetap pada browser/perangkat yang sama dan dapat hilang jika data
site dibersihkan.

Typecheck dan production build lulus. Uji browser headless
`node scripts/check-local-draft.mjs` memeriksa upload, penyimpanan blob dan
pengaturan, pemulihan setelah reload, serta kasus file tersimpan yang hilang.

## 29 September 2026 — watermark preview, T3-06 selesai

Watermark berulang **FORMA PREVIEW** sekarang dirender sebagai lapisan pixel
di canvas Three.js, melintasi background dan device. Lapisan dinonaktifkan hanya
selama `capturePng`, kemudian dipulihkan, sehingga PNG lokal prototype bersih.
Ini deterrent visual pada preview; client yang dimodifikasi tetap dapat mengambil
render bersih, dan export publik belum diaktifkan.

`pnpm typecheck` dan `pnpm build` lulus. Uji Chrome headless
`node scripts/check-preview-watermark.mjs` menghasilkan screenshot desktop dan
390 px serta PNG bersih di `docs/evidence/t3-06-watermark-*`. Inspeksi visual
memastikan watermark terlihat pada area device dan tidak masuk PNG. Byte canvas
preview sebelum/sesudah capture sama, membuktikan watermark pulih setelah export.
T3-07 dimulai setelah pekerjaan ini, sebagaimana dicatat di bawah.

## 29 September 2026 — review T3-07 berjalan

[Review V0 teknis](docs/T3_07_REVIEW.md) mencatat hasil 20 unit test,
typecheck, asset audit, empat PNG kasus fixture/sintetis, file unduhan aktual,
serta ukuran asset, waktu siap, capture PNG dan JS heap pada Headless Chrome 154
di Apple M2. Hasil awal: editor siap 1.54 detik; capture PNG 40–62 ms;
GLB 4.44 MB; JS heap setelah GC 9.60 → 10.33 MB dalam satu sesi.
Interaksi inti lulus secara teknis. PRD masih mempunyai gap pada Float/Gentle
Tilt, retry untuk model/GPU gagal, dan dimensi/device yang hardcoded. Kualitas
teks kecil, screenshot landscape pada ponsel, model/lighting dan intensitas
watermark perlu penilaian visual. Satu screenshot nyata telah diuji atas arahan
user; uji pengguna tanpa panduan belum bisa dinyatakan selesai. Karena itu T3-07 dan
tahap 3 belum ditutup.

## 29 September 2026 — uji screenshot nyata Rava 3

Atas arahan user, `Additional Rava 3.png` (804 × 1896) diuji pada model aktif.
Fill memotong status bar dan mendekatkan tombol Save ke tepi bawah. Fit
mempertahankan seluruh isi; padding putih menghilangkan garis sisi gelap dan
menjadi rekomendasi untuk file ini. PNG depan dan perspektif 1200 × 1200
diinspeksi visual; file unduhan aktual identik dengan capture perspektif.
Perbandingan 9:16 (1080 × 1920) membuat teks layar lebih mudah dibaca;
front portrait direkomendasikan untuk detail UI, perspektif portrait untuk
presentasi. Rekomendasi UX: auto-Fit pada rasio sumber yang berbeda, padding
berdasarkan warna tepi gambar, dan preset komposisi detail layar.
Sumber tetap di Downloads; hasil turunan berada di folder evidence lokal yang
diabaikan Git. Rincian dan batas penilaian ada di [Review T3-07](docs/T3_07_REVIEW.md).

Perbaikan dari uji Rava telah diterapkan: Fit otomatis untuk rasio yang berbeda lebih dari 3%, padding mengikuti warna tepi yang konsisten, dan preset Detail UI (front, tengah, Fit, 9:16). Uji browser produksi pada Rava 3 dan Rava 4 lulus; hasil PNG dan file unduhan Rava 3 identik. T3-07 masih menunggu uji pengguna tanpa panduan dan keputusan visual akhir.

## 29 September 2026 — tahap 4/8 dimulai, T4-01

Tablet dan laptop generik milik proyek kini mempunyai GLB development, manifest ter-version dan hash-pinned, screen UV/material, serta kamera/framing awal. Editor memilih ketiga kategori; ukuran texture, Fit/Fill, model dan camera mengikuti device aktif, sementara gambar/background tetap. Draft tablet/laptop pulih setelah reload. Validasi asset, 22 unit test, typecheck, production build, dan proof browser PNG 1200 × 1200/restore lulus. Kedua PNG dibuka dan diperiksa; framing laptop diperbaiki setelah render awal terpotong. [Bukti lengkap](docs/T4_01_PROOF.md).

Tahap 4 berjalan dengan review T3-07 tetap terbuka, bukan penutupan otomatis tahap 3. Berikutnya T4-02 (dua instance dengan media/crop terpisah) dan T4-03 (surface/worker lokal). Fixture generik belum dihitung sebagai model katalog publik atau proof server.

## 29 September 2026 — T4-02 selesai

Template iPhone Duo kini merender dua instance dalam satu scene, dengan pilihan Device 1/2. Masing-masing menyimpan gambar, Fit/Fill, crop, style, pose, posisi dan scale; kamera/background/output/motion bersama. Single dan Duo mempunyai state terpisah yang tersimpan bersama di IndexedDB. Draft v1 Single dimigrasikan saat dibaca. PNG 1200 × 1200 memperlihatkan dua layar dengan gambar/crop berbeda; perubahan crop device kedua mengubah byte PNG. Proof browser produksi memverifikasi tiga Blob, ganti template, reload termasuk pilihan device aktif, dan layout 390 px. Regresi single tablet/laptop tetap lulus. Typecheck, 23 unit test, dan build lulus. [Bukti T4-02](docs/T4_02_PROOF.md).

Berikutnya T4-03: render-surface internal dan worker Node/Chromium lokal memakai renderer yang sama. T3-07 tetap menunggu uji pengguna dan keputusan visual.

## 29 September 2026 — preview bersih, copy ber-watermark

Atas masukan user, panel editor kini menampilkan render tanpa watermark. Tombol
`Copy image`, menu klik kanan pada canvas, dan Cmd/Ctrl+C saat canvas fokus
menyalin PNG ber-watermark ke clipboard. Export PNG lokal tetap bersih sesuai
prototipe saat ini. Screenshot dan screen capture atas panel yang bersih tidak
dapat diberi watermark secara paksa oleh aplikasi web; proteksi artifact resmi
tetap bergantung pada alur export server yang direncanakan pada tahap 5.
Typecheck dan production build lulus; aksi copy dan menu klik kanan diperiksa
di browser lokal. Tahap tetap 4/8, dengan T4-03 berikutnya dan review T3-07
masih terbuka.

## 30 September 2026 — T4-03 selesai

Render surface internal memakai paket `render-scene` yang sama dengan editor. Worker Node menjalankan Chromium lokal, menerima snapshot scene dan gambar yang sudah di-resolve, lalu menulis PNG. Proof Single dan Duo 1200 × 1200 lulus dan telah diperiksa visual; detail dan cara mengulang ada di [Bukti T4-03](docs/T4_03_PROOF.md). Jalur ini belum memakai queue/backend publik. Tahap tetap 4/8, dengan T4-04 (alignment dan canonical image/color) lalu T4-05 (benchmark compute) berikutnya. Review T3-07 tetap terbuka.

## 30 September 2026 — T4-04 selesai

Proxy iPhone sekarang 31.3% lebih kecil dari GLB penuh, dengan geometri/UV identik dan tekstur sumber yang tidak dibutuhkan preview dihapus. Model penuh tidak disalin ke direktori `public`; worker lokal memuatnya dari route internal. Editor dan worker menggambar gambar layar lewat fungsi yang sama. Upload dinormalisasi menjadi PNG sRGB dengan orientasi EXIF diterapkan. Release renderer, color pipeline dan SHA-256 asset dipin; worker menolak mismatch. Pada snapshot scene yang sama, PNG proxy dan full 1200 × 1200 mempunyai rata-rata selisih RGB 0.1496/255 per kanal, termasuk contoh JPEG yang diputar EXIF. Regresi Duo, typecheck, 23 unit test dan build lulus. [Bukti T4-04](docs/T4_04_PROOF.md). Tahap tetap 4/8; T4-05 (benchmark compute) berikutnya, sementara review T3-07 tetap terbuka.

## 30 September 2026 — T4-05 benchmark lokal, validasi VM masih terbuka

Benchmark production build/Chrome 154 di Mac M2 mengukur 5 Single dan 5 Duo default serta 3+3 dengan SwiftShader, ditambah pasangan paralel. Median total default 1.89 detik Single dan 1.60 detik Duo; software 11.81 dan 11.79 detik. RSS gabungan proses software satu job 1.35–1.62 GiB, dua job 2.68–2.71 GiB. Output software dibandingkan visual dengan default dan lulus. Rekomendasi sementara: worker staging 4 vCPU/8 GiB, satu slot aktif; dua slot hanya setelah uji VM Linux. Simulasi biaya worker always-on US$48–84/bulan menurut dua kelas VM DigitalOcean yang dicek, bukan biaya produk keseluruhan. [Bukti, data mentah dan batas](docs/T4_05_PROOF.md). Tahap 4 belum ditutup karena performa/keamanan/biaya pada kandidat host Linux belum divalidasi. T3-07 tetap terbuka.
