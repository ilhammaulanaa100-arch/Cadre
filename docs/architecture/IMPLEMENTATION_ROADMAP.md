**Roadmap implementasi dan bukti selesai — delapan tahap**

**Keputusan 30 September 2026:** MVP browser tanpa biaya layanan berbayar menjadi jalur rilis pertama. Export PNG lokal bersih tanpa login/kuota server diterima sementara. Tahap 5 backend ditunda sampai volume/kebutuhan dan anggaran membenarkan operasi server. Proof T4-03–05 dan kontrak dua jalur dipertahankan; [rancangan perpindahan](DUAL_EXPORT_PATH.md) menjelaskan batas teknis. Tahap 6/7 untuk MVP perlu evaluasi kualitas, lisensi, hosting statis, dan QA yang sesuai cakupan model yang benar-benar siap; target 10 model serta PUB-03–09 berlaku untuk rilis backend terkelola kemudian.

28 September 2026 · Arahan terbaru memajukan workspace editor dan konfigurasi ke tahap 3; [Editor plan](../EDITOR_PLAN.md) merinci acceptance. T3-01 sampai T3-05 sudah menghasilkan workspace, kontrak scene/device, editor statis, preview Still/Turntable, timeline, dan selected-frame PNG yang lulus test, typecheck, build, browser checks, serta inspeksi visual. [Project status](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PROJECT_STATUS.md>) adalah sumber status terbaru. Tahap adalah urutan milestone, bukan pembagian effort yang sama besar.

**Peta seluruh pekerjaan**

| Tahap | Hasil | Kondisi selesai |
|---|---|---|
| 1. Product plan dan PRD | Scope user, v0 vs publik, Free PNG dan arah Pro | Arah/requirements diterima user; keputusan numerik terbuka tercatat |
| 2. Arsitektur dan persiapan teknis | Backend, render/queue, data/API, struktur kode, backlog dan status | Paket spesifikasi konsisten dan pekerjaan coding pertama dapat diidentifikasi; bukan klaim layanan sudah bekerja |
| 3. V0 teknis satu iPhone | Satu device, screenshot, crop, pose, preview motion, PNG, restore | Flow internal berfungsi dan bukti teknis tersedia; review kualitas visual akhir tetap dicatat pending bila referensi ditunda |
| 4. Lintas kategori dan proof server | Contoh tablet/laptop, duo, shared renderer, PNG di worker | Per-instance crop/pose benar, renderer browser/worker selaras, biaya/latensi awal terukur |
| 5. Akun dan backend terkelola (ditunda) | Login restore, upload privat, ownership, quota, durable job, download | Alur guest → login → PNG bersih lulus termasuk race/retry/cancel dan privasi |
| 6. Katalog dan penyempurnaan editor | Minimal 10 model ready, single/duo, desain visual final | Semua model lulus QA; acuan visual yang ditunda diselesaikan dan diterapkan |
| 7. Beta dan rilis publik | QA lintas perangkat, lisensi, privasi, hosting, deployment; backend punya gate tersendiri | Gate MVP browser lulus; syarat PUB lama lulus sebelum rilis backend terkelola |
| 8. Pro dan video | Subscription, entitlement berbayar, MP4 server, allowance | Fitur siap sebelum checkout dibuka; pembayaran/akses/video tervalidasi |

Rilis MVP browser dapat dilakukan setelah gate tahap 7 yang relevan lulus tanpa menunggu tahap 5. Tahap 8 adalah kelanjutan monetisasi yang direncanakan. Penyelesaian delapan tahap tidak berarti produk berhenti memerlukan maintenance; scope tambahan mendapat backlog baru tanpa diam-diam mengubah milestone lama.

**Tahap 3 — V0 teknis, sedang dikerjakan**

| ID | Status | Pekerjaan | Dependency | Bukti selesai |
|---|---|---|---|---|
| T3-01 | Selesai 24 September 2026 | Scaffold workspace minimal, toolchain, web shell, boundaries package | Tahap 2 | `pnpm typecheck` dan `pnpm build` lulus; struktur mengikuti blueprint, tanpa auth/backend |
| T3-02 | Selesai 24 September 2026 | Scene schema, device manifest, fixtures, serializer, evaluator waktu | T3-01 | 11 unit test lulus; scene valid/invalid dan fixture metadata iPhone dibaca tanpa UI; fixture tidak mengklaim asset render siap |
| T3-03 | Selesai 24 September 2026 | Model loader, screen texture binding, camera/lighting, readiness, satu PNG lokal | T3-02 + development fixture buatan proyek | Texture contoh tampil pada mesh `Screen`; proof PNG 1200 × 1200 terbuka dan diperiksa visual; asset sengaja belum fidelity final |
| T3-04 | Selesai 28 September 2026 | Workspace editor, upload nyata, crop/fit, drag pose/posisi, scale/background/aspect, PNG lokal | T3-03 | Unit tests dan browser checks; upload mempertahankan transform, tiga rasio export, file unduhan dan visual PNG diperiksa |
| T3-05 | Selesai 28 September 2026 | Still/Turntable, play/pause, scrub/durasi, pause-on-edit, export frame yang dipilih | T3-04 | Evaluator absolut dipakai renderer; frame deterministik; file PNG unduhan sesuai selected frame |
| T3-05 UI follow-up | Selesai 28 September 2026 | Shots-inspired light workspace, Mockup/Background tabs, gradients, visual presets, focus mode, 4:3 PNG | T3-05 | [Comparison and verification](../SHOTS_COMPARISON.md); 19 tests, typecheck/build, browser check and gradient PNG |
| T3-06 | Selesai 29 September 2026 | Draft IndexedDB, recovery, status kegagalan autosave, watermark pada pixel preview. Undo/redo dihapus sesuai arahan user. | T3-04/05 | Reload memulihkan gambar, gradient dan output ratio; draft rusak tidak ditimpa; PNG prototype bersih; watermark bukan klaim anti-screenshot |
| T3-07 | Selesai untuk V0 internal 7 Oktober 2026 | Pemeriksaan V0 requirements dan hasil ukur | T3-03–06 | [Audit teknis](../T3_07_REVIEW.md), empat kasus sintetis/fixture, satu screenshot nyata, ukuran awal, serta pernyataan pemilik produk bahwa percobaan dan hasilnya oke; uji pengguna baru tanpa panduan menjadi QA beta tahap 7 |

Gunakan workspace editor tiga panel berdasarkan arahan terbaru. Struktur editor tidak lagi ditunda ke tahap 6. Jika model iPhone belum tersedia, placeholder boleh dipakai untuk menguji wiring T3-02/03, tetapi tidak memenuhi bukti model iPhone atau fidelity. Jangan menandai v0 penuh lulus hanya dari kotak generik. UI tahap 3 harus membuktikan alur konfigurasi; polish brand dan fidelity asset final tetap dinilai terpisah.

**Tahap 4 — membuktikan perluasan, dimulai 29 September 2026**

- T4-01: selesai untuk development fixture generik tablet dan laptop; manifest/GLB dipin, screen ratio/pivot/UV dan framing PNG diperiksa. [Bukti T4-01](../T4_01_PROOF.md). Model produksi tetap tahap 6.
- T4-02: selesai 29 September 2026 untuk template iPhone Duo; selection dan media/crop/pose per instance, kamera/background bersama, PNG dua device dan draft Single/Duo pulih setelah ganti template/reload. [Bukti T4-02](../T4_02_PROOF.md).
- T4-03: selesai 30 September 2026 untuk render-surface internal dan worker Node/Chromium lokal. Snapshot scene menghasilkan PNG Single/Duo 1200 × 1200 melalui paket renderer bersama. [Bukti T4-03](../T4_03_PROOF.md).
- T4-04: selesai 30 September 2026 untuk proxy/full iPhone, canonical screenshot/warna di Chromium, dan pin release/hash aset. [Bukti T4-04](../T4_04_PROOF.md). Pasangan asset tablet/laptop final tetap mengikuti QA katalog tahap 6.
- T4-05: benchmark lokal GPU/SwiftShader selesai 30 September 2026; kelas staging 4 vCPU/8 GiB dan concurrency awal satu slot dipilih sementara. [Bukti T4-05](../T4_05_PROOF.md). Validasi pada VM Linux kandidat, kapasitas/biaya aktual, dan p95 antrean masih terbuka sebelum tahap 4 ditutup.

Belum perlu menerima traffic publik atau memungut pembayaran. Hasil proof memandu pilihan compute produksi, policy output, dan target waktu. Asset yang sudah lulus kontrak dapat disiapkan untuk katalog berikutnya tanpa memperbanyak kesalahan yang belum diselesaikan.

**Tahap 5 — membuat akses publik berfungsi**

- T5-01: Supabase dev/staging, migrations/grants, akun, default Free entitlement, verified server session, origin/CSRF controls.
- T5-02: login/callback/logout dan pemulihan draft single/duo; OAuth provider dan email delivery diuji sesuai metode yang dipilih.
- T5-03: upload grant privat, validasi/normalisasi input, asset state dan cleanup, tanpa jalur arbitrary remote URL.
- T5-04: admission export atomik, quota period/reservation/ledger, idempotency, durable PGMQ queue.
- T5-05: worker claim/heartbeat/fencing, retry, cancel/finalize, orphan/reconciliation, renderer version matching.
- T5-06: status polling dan authenticated download, quota visibility, redownload tanpa pemakaian baru.
- T5-07: integration tests pada skenario di System Contracts, termasuk akun lain dan worker kill.

Sebelum tahap ini dinyatakan siap untuk publik, tetapkan ukuran PNG Free, jumlah quota/reset, batas storage, TTL, serta target antrean/render berdasarkan pengukuran. Fixture development dengan quota kecil hanya untuk test. Login berhasil tidak dianggap cukup untuk membuktikan keamanan endpoint atau konsistensi biaya.

**Tahap 6 — katalog dan standar visual**

Lengkapi minimal 10 model berbeda lintas kategori; warna atau layout tidak dihitung sebagai model baru. Finalisasi template duo dan motion compatibility. Device dan template picker, thumbnail, inspector, serta semua state UX memakai desain visual yang ditinjau pada tahap ini. Referensi UI Figma/Lottie dan output dikaji kembali tanpa mengubah scene/server contract hanya karena perubahan styling.

QA mencakup front/three-quarter, screenshot terang/gelap/teks kecil, rasio output, proxy/full alignment, memory, load size, framing duo, dan hak penggunaan asset. Setiap entry katalog mencatat readiness serta bukti; placeholder tidak boleh dipakai untuk memenuhi jumlah launch.

**Tahap 7 — rilis publik**

Uji designer menyelesaikan guest → login → export tanpa bantuan, termasuk retry dan kuota. Jalankan support matrix browser/hardware, beban antrean, resource leak, upload invalid, expiry, private download, backup/restore, cleanup, dan deployment rollback/drain. Periksa bundle/public storage agar tidak memuat full assets atau secret.

Pasang metrik/alert dan batas biaya. UI menjelaskan login, watermark, quota/reset, server processing, dan masa simpan hasil. Public launch mengikuti hasil nyata dan tidak dijanjikan hanya dari selesainya kode. Hosting/account deployment tidak dibuat pada tahap perencanaan ini.

**Tahap 8 — Pro dan video**

Proof MP4 server memakai scene/time evaluator yang sama, frame timestamps/duration benar, encoder terukur, progress/cancel/retry, dan pemutaran di aplikasi target. Tetapkan allowance/units/harga berdasarkan biaya dan kebutuhan. Pilih provider pembayaran yang sesuai badan usaha/market; bangun checkout/portal dan verified webhook dengan dedup/reconciliation.

Uji payment pending/failed, renewal, cancel-at-period-end, expired, refund/dispute, event tidak urut, serta akses Pro yang mengikuti status server. Video dibuat sebelum dijual. Free PNG bersih dengan kuota tetap sesuai keputusan produk; fitur berbayar menambah kemampuan yang dijanjikan.

**Format laporan progres setiap sesi kerja**

Gunakan: “Tahap X/8 — nama tahap. Sedang: pekerjaan saat ini. Selesai: hasil/bukti baru. Berikutnya: pekerjaan berikut. Kendala/keputusan: hanya yang relevan.” Saat berpindah tahap, sebutkan alasan dan bukti selesai. Perbarui PROJECT_STATUS.md setelah ada perubahan bermakna; jangan mengubah status tanpa bukti.

Status yang dipakai: belum mulai, sedang dikerjakan, selesai, atau menunggu input tertentu. Status dokumen berbeda dari status implementasi. Tidak mengubah jumlah tahap menjadi persentase kemajuan coding. Catat estimasi jika ada dasar; jangan menyatakan waktu/render quality yang belum diukur sebagai hasil.
