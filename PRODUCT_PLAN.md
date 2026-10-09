**Rencana produk — Screenshot → Mockup 3D Device → PNG / Video**

**Revisi keputusan 30 September 2026:** MVP pertama ditargetkan tanpa biaya layanan berbayar. Export PNG bersih berjalan lokal di browser tanpa login dan tanpa kuota server; draft serta screenshot tetap lokal. Akun, kuota, storage privat, queue, dan worker menjadi fase backend terkelola ketika kebutuhan/anggaran sudah ada. Target 10 model dan syarat login/kuota di bawah adalah target **rilis backend terkelola**, bukan penghalang MVP browser. [Rancangan dua jalur](docs/architecture/DUAL_EXPORT_PATH.md) dan [status terbaru](PROJECT_STATUS.md) mengatur perpindahannya.

Versi 0.6 · 28 September 2026 · Revisi: Shots menjadi acuan UX terbaru, dengan UI light ala Apple dan tab Mockup/Background; konfigurasi editor tetap dimajukan ke tahap 3. Tetap: v0 satu device, publik minimal 10 model lintas kategori dan duo, login saat export, PNG standar bersih dengan kuota, watermark preview, dan fondasi monetisasi. Dokumen arah produk; progres implementasi dan pengujian aktual mengikuti PROJECT_STATUS.md.

Tujuan: user memasukkan screenshot, mendapat komposisi device yang sudah bagus, mengatur pose atau animasi, lalu mengunduh hasil yang siap dipakai. V0 memvalidasi iPhone 17 Pro Max; katalog publik mencakup smartphone, tablet, laptop, dan komposisi duo. Kualitas UI editor dan kualitas hasil render dinilai secara terpisah.

Arah product plan ini telah disetujui user. Requirement tahap pertama diturunkan ke [PRD v0](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PRD_V0.md>), dengan [brief persiapan desain dan aset](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PREPARATION_BRIEF.md>). Detail yang masih ditandai usulan/belum diputuskan tetap terbuka.

Arahan terbaru 28 September: user menegaskan editor tempat mengatur posisi, angle, upload gambar, dan konfigurasi lain sebelum export. Struktur UI dan interaksi editor dikerjakan pada tahap 3. Rincian audit, urutan kerja, dan acceptance terbaru ada di [Editor plan](docs/EDITOR_PLAN.md). Ini menggantikan instruksi lama menunda coding/seluruh visual. [Project status](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PROJECT_STATUS.md>) menjadi sumber progres resmi; [Architecture](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/ARCHITECTURE.md>) merinci baseline teknis. Shell UI sementara boleh dipakai untuk proof, sementara penerimaan visual final tetap menunggu review.

**1. Status keputusan dan asumsi**

| Keputusan | Status | Dasar / usulan |
|---|---|---|
| Produk berupa web editor | Ditetapkan user | Upload screenshot, rotate device, pilih animasi, export |
| Device v0 internal | Ditetapkan user | iPhone 17 Pro Max untuk validasi kualitas dan kelayakan |
| Device saat rilis publik | Ditetapkan user | Minimal 10 model device berbeda; warna/finish tidak dihitung sebagai device baru |
| Implementasi sekarang | Ditetapkan user 28 September | Lanjutkan editor konfigurasi dan pertajam rencana dari progres nyata |
| Pengguna utama | Ditetapkan user | UI/UX designer untuk portfolio dan presentasi |
| Format export | Ditetapkan user | PNG dahulu; export video pada fase berikutnya |
| Platform awal | Usulan | Editor desktop; browser/hardware support matrix divalidasi sebelum rilis |
| Aset | Usulan | Blender sebagai sumber; GLB sebagai distribusi web |
| Login | Ditetapkan user 30 September | MVP browser tidak perlu login; rilis backend terkelola meminta login saat export server |
| Proteksi | Ditetapkan user, dengan batas teknis | Watermark dan pencegahan akses file export sebelum berhak; screenshot/rekaman layar tidak dapat dijamin terblokir oleh web |
| Monetisasi | Arah dari user | Siapkan Free/Pro; video menjadi kandidat fitur subscription |
| Penyimpanan | Usulan | Draft guest lokal; upload privat saat export yang membutuhkan server; cloud project library belum wajib |
| PNG Free setelah login | Fase backend terkelola | PNG standar bersih dengan kuota server; jumlah kuota dan definisi ukuran standar masih terbuka |
| Jenis katalog | Ditetapkan user | Campuran smartphone, tablet, dan laptop; juga iPhone duo dan komposisi lain |
| iPhone duo | Interpretasi kerja | Template dua iPhone dalam satu scene; baseline minimal 10 model device tetap terpisah dari jumlah template |
| Arah UI | Ditetapkan user 28 September | UX Shots, tema light ala Apple, tab Mockup/Background; canvas dominan, media kiri, komposisi/preset kanan, Animate membuka timeline, export setelah preview |
| Kualitas render | Belum diputuskan | Memerlukan referensi hasil mockup; usulan awal studio lighting lembut dengan screenshot terbaca jelas |
| Bujet, tim, tanggal rilis | Belum diputuskan | Estimasi milestone masih indikatif |

Seluruh angka batas dan target di dokumen ini adalah usulan untuk divalidasi, bukan benchmark yang sudah tercapai. Jawaban user dapat mengubah scope dan arsitektur.

**2. Tahap produk dan scope rilis backend terkelola**

V0 adalah validasi internal dengan satu iPhone 17 Pro Max. MVP browser dapat dirilis lebih dahulu setelah gate kualitas/operasionalnya lulus. Setelah itu katalog dapat diperluas sampai minimal 10 untuk rilis backend terkelola. Export lokal MVP tidak dipublikasikan sebagai sistem export terlindungi.

Baseline minimal 10 berarti 10 model yang sudah lulus QA dan dapat dipilih/dipreview pada launch; thumbnail, finish warna, atau komposisi ulang tidak dihitung sebagai model baru. User menambahkan cakupan smartphone, tablet, laptop, dan iPhone duo. Kita membedakan device fisik dan template: satu model dapat dipakai oleh template single atau duo. Usulan awal: semua 10 model dan template duo dapat dicoba serta dipakai untuk PNG standar sesuai kuota. Model spesifik masih perlu dipilih.

| Area | Masuk rilis publik pertama | Ditunda |
|---|---|---|
| Device | Minimal 10 model lintas smartphone/tablet/laptop; device picker; template single dan iPhone duo | Scene bebas dengan banyak device, articulated/foldable motion |
| Input | PNG/JPEG/WebP statis; satu gambar per device instance; duo boleh memakai gambar sama atau berbeda | Video layar, HEIC, GIF animasi, impor URL |
| Mapping layar | Fill/crop, fit dengan padding, reposition, reset | Penyuntingan isi screenshot |
| Pose | Drag untuk rotate, preset front/three-quarter, reset, kontrol angka sederhana | Editor scene 3D umum |
| Komposisi | Template single dan duo, zoom/scale, posisi sederhana, rasio 1:1, 16:9, 9:16 | Layer teks, sticker, layout banyak halaman, lebih dari dua device per scene |
| Tampilan | Satu studio lighting yang terkurasi, pilihan warna/gradient background | Shader editor, lingkungan custom, efek kompleks |
| Motion | Float, gentle tilt, turntable; preview, pause, scrub; durasi awal 5 detik | Keyframe editor, motion path custom, audio |
| Export | PNG standar bersih lewat login dan pemeriksaan hak/kuota di server | MP4, GIF, video transparan; resolusi premium sesuai fase berbayar |
| Preview | Resolusi terbatas dan watermark pada hasil render | Jaminan anti-screenshot atau DRM untuk PNG |
| Account | Login saat export, logout, pemulihan draft, akses akun dasar | Organisasi/team dan kolaborasi |
| Monetisasi | Entitlement dan pencatatan kuota sejak awal | Checkout/subscription aktif setelah fitur berbayar siap dan paket diputuskan |
| Project | Autosave lokal, restore, reset; kepemilikan job export di server | Cloud project library dan sinkronisasi lintas perangkat |

Usulan ukuran awal: 1080×1080, 1920×1080, dan 1080×1920. PNG transparan berguna untuk portfolio/presentasi, tetapi masuk scope final hanya setelah material kaca dan shadow lulus uji alpha. Kebutuhan resolusi PNG yang lebih tinggi ditentukan dari contoh penggunaan nyata.

Rilis backend terkelola membutuhkan minimal 10 device, login saat export, proteksi akses export, dan PNG sesuai policy Free yang dipilih. MVP browser dapat memiliki katalog lebih kecil yang dinyatakan jujur. Rotate dan pilihan animasi tetap mengikuti ide awal; animasi berupa preview, dengan frame yang dipause dapat diekspor sebagai PNG. UI menyebutnya “Preview gerak” dan “Export PNG” agar tidak menjanjikan video. Tiga preset sederhana adalah batas usulan; editor keyframe tidak diperlukan.

**3. User flow dari awal sampai selesai**

1. Guest membuka editor tanpa login dan melihat contoh iPhone dengan komposisi siap pakai. User bisa memasukkan screenshot atau mencoba contoh bawaan. Di dekat Export terlihat penjelasan singkat bahwa login diperlukan untuk mengunduh.
2. User memilih template single atau duo lalu drag-and-drop atau memilih file. Validasi format, ukuran file, dimensi pixel, dan kemampuan decode dilakukan sebelum mengganti screenshot yang sedang aktif. Pada duo, pilihan “Device 1/Device 2” memperjelas layar yang sedang diedit; tersedia gunakan gambar yang sama untuk keduanya.
3. Screenshot langsung muncul di layar device terpilih. Bila rasio berbeda, default memakai fill dengan crop yang terlihat di preview; user bisa reposition atau memilih fit. Gambar tidak diregangkan.
4. User memilih device dari katalog, rasio canvas, background, pose, dan framing. Preview memiliki watermark yang menutupi sebagian area hasil dengan tetap menjaga kegunaan editor. Pergantian device mempertahankan screenshot instance itu, tetapi crop/fit ditinjau ulang sesuai rasio layar baru. Background/camera berlaku untuk scene; screenshot/crop/pose berlaku per device.
5. User memilih Still, Float, Gentle tilt, atau Turntable. Thumbnail menjelaskan gerak; playback dapat dipause dan discrub. Turntable memperlihatkan belakang device sehingga tidak selalu cocok untuk menonjolkan screenshot.
6. User mengklik Export PNG. Sistem mempause preview dan menyimpan draft, file screenshot, device/version, playhead, serta intent export lokal. Jika belum login, tampil modal login. Supabase Auth menjadi baseline; Google dan email link adalah kandidat metode yang dikonfigurasi serta diuji pada tahap akun.
7. Setelah login, user kembali ke komposisi yang sama dan melanjutkan export. Jika login dibatalkan/gagal, draft tetap tersedia. Fallback redirect harus bisa memulihkan draft; jangan hanya menyimpannya dalam memori tab.
8. Server memeriksa identitas, kepemilikan asset, format/resolusi/device yang diizinkan, dan kuota. Jika fitur berbayar sudah tersedia dan pilihan user memerlukannya, tampil upgrade dengan opsi kembali ke export Free. Login tidak otomatis berarti berlangganan.
9. User melanjutkan export; UI menjelaskan screenshot akan diproses privat di server. Screenshot diunggah melalui jalur terbatas, lalu server membuat job dari snapshot scene. Policy server menentukan watermark output, bukan flag yang dikirim browser.
10. User melihat progress, dapat retry/cancel sesuai status job, lalu mengunduh PNG melalui pemeriksaan akses. Salinan file final bersih baru dikirim setelah user berhak. Draft lokal tetap tersedia untuk mengedit lagi; akun tidak otomatis berarti project telah tersinkron ke cloud.

Usulan aturan interaksi: drag memutar device terpilih dan mengubah base pose. Pada duo ada pilihan perangkat yang jelas dan preset komposisi yang menjaga jarak/overlap; tanpa selection gizmo di hasil export. Kamera/framing disimpan terpisah. Mengedit pose saat playback mempause animasi; preset motion diterapkan relatif terhadap base pose. Scrub hanya mengubah waktu preview, tidak menulis pose dasar baru. Usulan laptop awal memakai sudut engsel tetap; rotasi menggerakkan seluruh model, bukan membuka/menutup layar.

State yang wajib dirancang: loading model, empty, uploading/decoding, ready, crop adjustment, playing, guest preview, login required/in progress/cancelled/failed, draft restored, upload for export, quota exhausted, export queued/rendering/succeeded/failed/cancelled, link expired, session expired, unsupported input, low resolution, GPU/context error, autosave gagal, dan missing asset. Upgrade/payment pending/gagal muncul saat billing aktif; state video ditambahkan pada fase video.

**4. Workflow kita sebagai pembuat produk**

Urutan kerja: product plan/PRD → arsitektur/backend/kontrak/struktur file → v0 satu device dengan UI sementara → proof lintas kategori dan server render → akun/export terkontrol → katalog minimal 10 dan desain final → beta/rilis publik → Pro/video. Referensi serta wireframe visual disiapkan menjelang desain final; tidak menjadi syarat proof teknis.

Bagian planning historis di bawah tetap menjadi konteks. Per 28 September implementasi editor telah berjalan; status dan urutan terbaru mengikuti PROJECT_STATUS.md dan docs/EDITOR_PLAN.md.

| Tahap review | Hasil yang dibawa untuk dinilai | Keputusan yang diambil |
|---|---|---|
| Brief | Satu halaman: user, penggunaan, input/output, perbedaan v0 dan public launch, policy Free | Produk apa yang dibangun |
| Arah desain | Dua alternatif tampilan editor pada layar yang sama | Satu arah visual yang dikembangkan |
| Wireframe | Flow guest → edit → login → restore → export, beserta state gagal | Kontrol, login gate, dan navigasi sudah dapat dipahami |
| Bukti teknis | Model di browser, screenshot terpasang, PNG, dan preview motion | Kualitas dan performa browser layak untuk MVP |
| Desain final | Editor berisi render nyata, komponen dan state lengkap | Detail yang menjadi acuan implementasi |
| Beta | Sepuluh device, akun, hak export/kuota, watermark, hasil file | Semua syarat public launch terpenuhi |

Review sebaiknya membahas satu kategori per putaran: layout, detail visual, interaksi, atau render. Catat keputusan, alasan, dan perubahan scope. Pilihan kecil yang tidak mengubah arah dapat dikerjakan berdasarkan acuan yang sudah dipilih.

Setiap pekerjaan development nantinya mempunyai tujuan user, kontrak teknis, batas scope, kondisi selesai, dependency, dan bukti berupa preview/file hasil. Acuan desain final ditambahkan saat jalur visual dimulai; proof memakai UI sementara. Ini mengurangi pekerjaan berdasarkan prompt yang terlalu umum.

**5. Membuat standar UI yang bisa diterjemahkan**

Referensi UI yang sudah diberikan: Figma dan Lottie, dengan karakter clean, rapi, tetapi tetap punya identitas. “Lottie” belum merujuk layar/produk spesifik; LottieFiles atau Lottie Creator dapat menjadi kandidat referensi saat membuat board. Ini belum berarti pilihan teknologi Lottie untuk motion 3D.

Interpretasi desain awal yang akan ditunjukkan untuk review:

| Preferensi | Terjemahan ke rancangan |
|---|---|
| Clean | Canvas dominan, surface netral, satu accent utama, kontrol yang relevan saja |
| Rapi | Grid spacing konsisten, alignment label/input jelas, kelompok pengaturan mudah dibaca |
| Punya karakter | Typography, thumbnail preset, pilihan accent, icon, dan microinteraction yang konsisten |
| Familiar bagi designer | Shortcut, nilai angka, reset, dan inspector kontekstual; undo/redo dikeluarkan dari scope atas arahan user |

Dua eksplorasi yang diusulkan: A memakai panel kompak dengan fokus presisi; B memakai preset card lebih visual dan ruang lebih lega. Keduanya memakai flow yang sama, sehingga review dapat fokus pada perbedaan gaya. Warna, font, dan detail final ditetapkan setelah contoh layar ditampilkan.

Dokumentasi resmi memperlihatkan pola canvas dengan area kontrol di [Figma](https://help.figma.com/hc/en-us/articles/360039831974-Explore-the-navigation-bar-and-left-sidebar) dan editor motion pada [Lottie Creator](https://docs.lottiefiles.com/en/creator). Layout di bawah merupakan usulan untuk kebutuhan produk ini, bukan klaim bahwa user ingin menyalin semua kontrol referensi.

Lengkapi dua kumpulan referensi:

| Kumpulan | Jumlah awal | Keterangan yang berguna |
|---|---|---|
| UI editor | 2–3 referensi | Kepadatan panel, typography, warna, ukuran kontrol, cara memilih preset |
| Output mockup | 2–3 referensi | Pose, proporsi, ketajaman, material, cahaya, shadow, framing |
| Motion | 1–2 klip dari referensi output | Bagian waktu yang disukai, speed, easing, jarak gerak, loop |
| Anti-referensi | 1–2 contoh | Hal yang terasa salah: crowded, terlalu mengilap, teks kecil, gerak berlebihan |

Contoh feedback presisi: “Gue suka spacing dan ukuran panel dari A; preview dominan seperti B; material matte dari C; jangan banyak garis pemisah seperti D.” Kata seperti premium atau clean tetap perlu contoh visual.

Usulan layout editor: top bar berisi nama project, status akun, dan Export; panel kiri berisi device/template picker, screenshot, dan preset motion; canvas besar di tengah; panel kanan berisi pengaturan untuk scene atau instance terpilih; bagian bawah canvas berisi play/pause dan scrub. Pada duo, label Device 1/Device 2 memperjelas target edit. Tampilkan status watermark dan kebutuhan login secara ringkas. Pada layar desktop sempit, gabungkan panel agar canvas tetap berguna. Layout ini masih hipotesis yang diuji lewat wireframe. Undo/redo dikeluarkan dari scope atas arahan user 29 September 2026.

Urutan desain: reference board → dua style direction → pilih satu → wireframe flow → desain editor dengan screenshot nyata → komponen/token → seluruh state → prototype klik. Pilih light atau dark sebagai satu arah awal; tidak perlu membangun dua tema sekaligus.

Output desain yang diperlukan: file desain yang bisa diedit, font dan lisensinya, token warna/spacing/radius, ukuran panel, komponen button/slider/input/tab/preset card/device picker, aturan responsive desktop, focus dan keyboard state, empty/loading/error state, login modal/draft restore, export modal/progress/success/kuota, serta contoh motion. Saat berbayar aktif tambahkan pricing/upgrade, payment pending/failure, billing management/cancel, dan status subscription.

Tiga acuan hasil untuk QA: satu render frontal dengan UI berteks kecil, satu three-quarter yang menunjukkan material dan shadow, serta satu preview loop lima detik. Pada MVP, bukti export berupa PNG; klip video menjadi acuan fase berikutnya. Keindahan editor dan hasil export diberi penilaian terpisah.

**6. Blender, MCP, dan GLB**

Rekomendasi: simpan sumber yang dapat diedit sebagai `.blend`, gunakan `.glb` untuk renderer, dan simpan konfigurasi project terpisah. Pada pendekatan proteksi hybrid, browser menerima model preview yang disederhanakan, sementara asset render kualitas penuh berada di storage privat untuk worker. GLB membungkus data model dan texture bawaan dalam satu file; sistem material glTF berbeda dari Blender sehingga material perlu diperiksa setelah export. Dasar format: [Blender glTF manual](https://docs.blender.org/manual/id/5.0/addons/import_export/scene_gltf2.html).

MCP dipakai sebagai sarana mengoperasikan Blender dalam workflow pembuatan aset, sesuai kemampuan integrasi yang nanti dipilih. Integrasi Blender MCP belum diverifikasi atau disiapkan pada sesi ini. MCP tidak menjadi dependency user ketika memakai editor.

Alur aset: kumpulkan referensi device → periksa atau buat model → rapikan mesh/material/UV → save `.blend` → export GLB → buka di renderer web → bandingkan dengan acuan → optimalkan → versioning. Model awal dapat dibuat sendiri, dibeli dengan hak penggunaan yang sesuai, atau dipesan; model yang sudah baik biasanya mengurangi waktu modeling dibanding memulai dari prompt kosong. Kualitas tetap perlu inspeksi manusia.

Screenshot user ditempel sebagai texture layar saat aplikasi berjalan. Tidak perlu mengedit atau mengekspor ulang GLB setiap kali user mengganti gambar. Motion sederhana sebaiknya didefinisikan di aplikasi supaya pose, durasi, dan export menggunakan logika yang sama. Animasi GLB dapat dipertimbangkan kemudian untuk gerak yang lebih kompleks.

Kontrak aset yang harus disepakati sebelum modeling:

| Item | Spesifikasi / pemeriksaan |
|---|---|
| Root/pivot | Satu root device, pivot di tengah, orientasi depan/atas terdokumentasi |
| Unit/transform | Skala konsisten, transform dibersihkan, hasil konversi sumbu ke glTF diverifikasi |
| Mesh layar | Terpisah dengan material terpisah; nama seperti `Screen_Display` dicatat di manifest per device, tidak di-hardcode dalam editor |
| UV layar | Area screenshot 0–1, orientasi benar, tidak mirror/stretch, area terlihat terdokumentasi |
| Body dan detail | Bentuk cocok dengan referensi masing-masing model; v0 memakai iPhone 17 Pro Max; bentuk laptop/tablet tidak disamakan dengan ponsel |
| Material | Material web yang didukung; texture procedural dibake bila perlu; kaca tidak menutupi keterbacaan |
| Mask layar | Bentuk sudut, cutout, dan area terlihat khusus per model; Dynamic Island hanya pada model yang memilikinya; uji elemen sistem agar tidak terjadi duplikasi |
| Lighting | Setup lighting dan environment web dikurasi terpisah dari file kerja Blender |
| Ukuran | Usulan budget awal GLB ≤10 MB; jumlah polygon/material ditentukan lewat profiling, bukan angka yang dianggap universal |
| Hak penggunaan | Simpan asal dan lisensi model, texture, HDRI, dan font; periksa hak distribusi ke browser serta penggunaan output komersial |
| Paket serah terima | `.blend`, GLB preview dan render, manifest versi/nama mesh/rasio layar/bounds/preset kamera, texture sumber, bukti lisensi, preview dari renderer web |

Asset yang disajikan ke browser dapat diambil oleh client. Jangan merancang perlindungan bisnis dengan asumsi GLB tidak bisa diunduh. Ketentuan untuk model dan brand diperiksa pada asset yang benar-benar dipilih.

**7. Technical architecture**

Rekomendasi public launch: editor interaktif di browser dengan model preview dan watermark; auth, hak akses, kuota, serta export final di server. Backend diperlukan sebelum publik, meskipun output awal hanya PNG. Renderer berbagi scene schema dan evaluator motion, tetapi asset kualitas penuh serta keputusan membuka akses berada di server.

| Lapisan | Usulan | Tanggung jawab |
|---|---|---|
| UI aplikasi | React + TypeScript | Panel, input, interaksi, aksesibilitas, state user |
| Renderer | Three.js; React Three Fiber bila memakai React | Model, camera, material, lighting, render |
| Scene document | Konfigurasi berseri dengan versi schema, daftar device instances | Sumber keadaan project, termasuk single/duo, yang dapat disimpan dan diputar ulang |
| Motion evaluator | Fungsi scene berdasarkan waktu absolut | Pose pada setiap frame untuk preview dan export |
| Device catalog | Metadata per model dan template komposisi terpisah | Mengembangkan katalog tanpa mengganti logika editor |
| Asset loading | GLB preview publik; GLB render/environment penuh privat | Lazy loading model terpilih, caching versi, resource disposal |
| Image processing | Decode, normalisasi orientasi/warna, crop | Membuat texture screenshot tanpa distorsi |
| Preview | Resolusi terbatas, model proxy, watermark dalam komposisi pixel | Interaksi responsif; deterrent, bukan batas keamanan terhadap client yang dimodifikasi |
| Auth | Penyedia identitas terkelola + session server | Login saat export, logout, callback, pemulihan draft |
| Export API | Validasi scene, ownership, entitlement, dan quota | Membuat job idempotent hanya untuk permintaan yang diizinkan |
| Queue + render worker | Renderer web pada server dengan versi yang dipin | PNG final tanpa watermark bagi user yang berhak; video ditambahkan nanti |
| Database | User, job, kepemilikan asset, policy, usage ledger | Status akun, audit pemakaian, transaksi kuota |
| Object storage privat | Screenshot input, asset render, PNG output | TTL/penghapusan dan delivery terkontrol |
| Download gateway | Endpoint yang memeriksa session dan pemilik artifact | Mengirim file yang sudah diizinkan; tidak membuat file kebal disalin setelah diterima |
| Penyimpanan lokal | IndexedDB untuk metadata + blob | Autosave dan restore di browser yang sama |
| Hosting | CDN untuk app/preview + backend dan worker | Pisahkan asset publik dan privat; ukur kebutuhan GPU/CPU worker |
| Billing fase berikutnya | Payment provider + webhook + entitlement mapping | Aktivasi/perubahan/pencabutan fitur berbayar dari status pembayaran server |
| Observability | Error dan metrik tanpa isi screenshot | Menilai kegagalan, waktu export, kemampuan browser |

React Three Fiber adalah renderer React untuk Three.js, dan Three.js mempunyai GLTFLoader untuk glTF 2.0. Dasar pilihan: [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction) dan [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html). Baseline teknis kini Next.js untuk web/API, Supabase untuk auth/Postgres/storage/PGMQ, serta worker Node/Chromium terpisah. Rincian dan sumber ada di Architecture. Host compute dan pembayaran belum dipilih; keputusan mengikuti proof server render, biaya, serta negara badan usaha/payment eligibility.

Scene renderer harus berbagi konfigurasi, framing, dan evaluator motion untuk preview serta export. Model proxy dan penuh harus mempunyai transform, area layar, dan silhouette yang selaras. Detail editor seperti selection outline, kontrol, dan grid tidak masuk output. Full-quality shader/texture yang ingin dilindungi jangan dikirim ke client sebelum aksesnya diizinkan.

Auth saja tidak cukup: semua request pembuatan job, status job, upload, cancel, dan download memeriksa hak user di server. Jangan percaya parameter browser seperti `isPro`, `watermark=false`, harga, atau remaining quota. Validasi semua device instance, screenshot reference, jumlah instance, dimensi, dan parameter scene; worker memakai asset ID dari katalog, bukan mengambil URL/file path arbitrer yang dikirim client. Prinsip otorisasi: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

Usulan delivery awal: download melalui endpoint terautentikasi agar penerbitan file dapat memeriksa pemilik setiap kali. Presigned URL pendek menjadi pilihan optimasi jika bandwidth gateway mahal, tetapi URL tersebut adalah bearer link yang dapat dibagikan/dipakai ulang selama masih berlaku. Jangan menyebut presigned URL otomatis sekali pakai. [AWS presigned URL FAQ](https://docs.aws.amazon.com/prescriptive-guidance/latest/presigned-url-best-practices/faq.html).

Server render memerlukan antrean, rate limit per akun dan lapisan anti-abuse, timeout, retry terbatas, serta lifecycle file. Ukur biaya/latensi sejak proof PNG; browser headless tidak otomatis mendapatkan GPU memadai. Blender server rendering dapat dievaluasi jika renderer web tidak memenuhi kualitas, dengan konsekuensi menyelaraskan ulang preview/output.

**8. Data model konseptual**

Ini entitas logis; draft lokal dan resource server memiliki tanggung jawab berbeda. Subscription belum perlu aktif saat launch Free, tetapi policy fitur/kuota sudah dipakai sejak awal.

| Entitas | Data penting | Lokasi / tanggung jawab |
|---|---|---|
| User | ID, auth subject/provider, account status, created time | Database; dasar kepemilikan |
| DeviceAsset | ID, category, version, preview URL/hash, private render key, screen mapping, bounds, orientasi, camera presets, lisensi, readiness | Manifest/catalog; private render key tidak diekspos ke client |
| SceneTemplate | ID + version, slot device yang kompatibel, layout, default camera/motion | Single, iPhone duo; terpisah dari model fisik |
| ScreenshotAsset | ID, owner ID, MIME, dimensi, byte size, hash, storage key, expiry | Blob lokal saat guest; object privat setelah upload export |
| Project / Draft | ID, schema version, created/updated time, scene document, local blob references | IndexedDB; owner metadata/snapshot server saat export; bukan otomatis cloud library |
| Scene document | Daftar device instances, template/version, background, camera, lighting/version, aspect, motion, playhead | Snapshot serializable; tidak berisi runtime object GPU |
| DeviceInstance | Instance ID, device/version, screenshot reference, crop/fit, transform/pose, material variant | Satu atau dua instance per scene pada scope awal |
| MotionPreset | ID + version, default duration, parameter, aturan loop | Katalog preset produk |
| Plan / EntitlementPolicy | Policy version, fitur, batas resolusi, watermark output, quota/cycle, device/template access | Konfigurasi server; Free sejak launch, Pro saat diluncurkan |
| ExportTask | ID, owner, idempotency key, scene snapshot/hash, policy snapshot, status/progress/error, retry count, quota reservation, timestamps | Database; worker hanya menjalankan job tervalidasi |
| ExportArtifact | ID, job/owner ID, private storage key, format/dimensi, byte size, expiresAt, policy saat dibuat | Storage privat + database |
| UsageLedger | Account, billing/quota period, job ID, unit, reserved/consumed/released, unique operation key | Transaksi server untuk menghindari race atau double-charge |
| Subscription | Account, provider/customer/subscription IDs, plan, status, periode, cancel-at-period-end | Ditambahkan ketika billing aktif |
| BillingEvent | Provider event ID unik, received/processed time, status | Dedup webhook, retry, dan rekonsiliasi billing |

Relasi: project berisi scene; scene berisi satu/dua device instance; setiap instance merujuk satu model/version dan screenshot. Dua instance boleh memakai screenshot yang sama. User memiliki upload, job, dan artifact. Setiap export memakai snapshot immutable seluruh scene dan policy, sehingga edit berikutnya tidak mengubah pekerjaan yang sedang berjalan.

Pisahkan konfigurasi permanen dari UI sementara: panel yang terbuka, hover, selection, dan status drag tidak harus menjadi bagian scene. Playhead terpilih disimpan agar frame export dapat dipulihkan. Undo/redo tidak direncanakan sesuai arahan user.

Sebelum redirect login, simpan semua blob screenshot, scene version, instance selection, dan intent export ke IndexedDB. Setelah login, pulihkan draft, lalu buat upload/job dengan owner dari session server; jangan menerima owner ID dari client sebagai bukti kepemilikan. Multi-tab atau double-click tidak boleh menggandakan job/kuota.

Autosave lokal dapat gagal karena kuota atau data browser dihapus; berikan status dan pemulihan yang jelas. Usulan TTL awal untuk export tanpa cloud-save: screenshot server dihapus 24 jam setelah job terminal dan PNG disimpan 7 hari, lalu dihapus; angka ini perlu ditetapkan sebelum rilis dan ditampilkan ke user. Jangan menghapus asset yang masih direferensikan job aktif/retry. Cloud-save nanti mempunyai policy berbeda dan pilihan eksplisit. Isi screenshot, token auth, serta signed URL tidak masuk analytics/log biasa.

**9. Rendering pipeline**

Pipeline aset: Blender source → mesh/material/UV bersih → GLB preview dan GLB render versioned → pemeriksaan keselarasan pada browser/worker → catalog entry berstatus ready. Muat hanya model yang dipilih; jangan mengunduh semua 10 model saat editor dibuka.

Pipeline screenshot: file lokal → validasi byte dan pixel count → decode → normalisasi orientasi dan warna → crop/fit per instance → texture layar → scene. Usulan batas awal per input 15 MB dan 24 megapixel, lalu diuji termasuk total memori duo. Saat export, server memvalidasi ulang format, ukuran, dimensi, ownership dan hasil decode; validasi client hanya membantu UX.

Pipeline preview: scene + waktu absolut → pose semua instance → screenshot, camera, lighting, background → render terbatas → compositing watermark ke pixel preview. Watermark melintasi area mockup dan tidak hanya berada di sudut yang mudah dipotong. Pola/intensitas ditinjau untuk keseimbangan proteksi dan keterbacaan. Compositing dalam client menghambat salin biasa, tetapi dapat dilewati oleh client yang dimodifikasi; lihat bagian 13.

Pipeline PNG publik: freeze scene/playhead → login bila perlu → restore draft → server cek akses dan upload privat → validasi snapshot → reserve quota secara atomik + buat job idempotent → worker mengambil asset privat → render PNG pada ukuran yang diizinkan → simpan artifact privat → commit usage → download terautentikasi. Output Free standar bersih sesuai keputusan user. Background masuk renderer output, bukan hanya CSS.

Quota hanya dikonsumsi setelah artifact berhasil dibuat dan dapat diakses. Job gagal/cancel sebelum berhasil melepas reservasi; retry internal memakai job/reservasi sama. Re-download artifact yang masih berlaku tidak memakai kuota baru. Reconciler memulihkan reservasi jika worker mati. Kuota adalah per output scene, bukan otomatis per device dalam duo; batas biaya dapat berubah lewat policy yang jelas.

Pipeline MP4 berbayar nanti memperluas job server: cek entitlement video dan unit pemakaian → frame ke-i pada waktu i/fps → render → encode + mux → artifact privat. Klip lima detik pada 30 fps berisi 150 frame; jangan menambahkan duplikat frame awal di akhir loop. Proses bertahap, batasi antrean/resource, dan sediakan progress/cancel/retry. Encoder server dipilih setelah benchmark. Jika memakai WebCodecs pada worker, tetap perlu muxer dan pengelolaan frame. [WebCodecs guide](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Using_the_WebCodecs_API).

Dengan export server, browser user tidak wajib menyediakan encoder MP4. Playback hasil MP4 tetap diuji pada target browser dan aplikasi pemutar. Export bersih via encoder client tidak menjadi jalur terlindungi dalam rencana publik ini.

Warna screenshot diuji dengan swatch, teks kecil, dan gambar terang/gelap. Atur input/output color space dengan benar; material layar dibuat agar grading dan cahaya body tidak mengubah isi screenshot secara berlebihan. Color management yang salah dapat membuat hasil terlalu gelap/terang. [Three.js color management](https://threejs.org/manual/pages/color-management.html).

Preview dan export harus cocok dalam framing, crop, dan motion, meskipun preview ber-watermark dan dibatasi kualitasnya. Perbedaan proxy/full model tidak boleh mengubah komposisi yang dipilih user. MP4 terkompresi nanti tidak dijanjikan identik pixel demi pixel dengan PNG; output lintas GPU dibandingkan dengan toleransi yang disepakati.

**10. Risiko dan cara mengujinya**

| Risiko | Dampak | Validasi / mitigasi | Kapan |
|---|---|---|---|
| Standar visual belum eksplisit | Revisi berulang | Referensi beranotasi dan tiga hasil acuan | Sebelum desain final |
| Bagus di Blender, berbeda di web | Janji kualitas gagal | Review model/material/cahaya dalam renderer target | Bukti teknis awal |
| Device tidak akurat | Produk terasa murah | Cocokkan bentuk depan, kamera belakang, sisi, bezel | Asset review |
| UV/crop/island bermasalah | Screenshot rusak atau tertutup | Set screenshot berbagai rasio, terang/gelap, elemen sistem | Mapping layar |
| Warna atau tulisan berubah | Tidak cocok untuk presentasi UI | Bandingkan swatch dan teks pada PNG hasil nyata; MP4 diuji pada fase video | Bukti teknis + QA |
| Encoder video server gagal/tidak cocok | User gagal export video kelak | Benchmark encoding serta playback MP4 pada perangkat target | Awal fase video |
| Memori/export crash | Project/hasil hilang | Batas input/output, cleanup, error/retry; antrean frame terbatas untuk video | Export prototype |
| Animasi preview/export berbeda | Hasil mengecewakan | Evaluator waktu bersama dan scene snapshot | Core scene |
| Transisi loop tersentak | Motion terlihat buruk | Cek sambungan frame terakhir ke awal dan kecepatan gerak | Motion QA |
| GLB atau HDRI terlalu berat | Loading/interaksi lambat | Budget asset, profiling, optimasi dengan perbandingan kualitas | Asset + beta |
| Hak asset tidak sesuai | Asset perlu diganti | Periksa lisensi untuk penggunaan aktual dan delivery client | Sebelum memilih asset |
| Data screenshot sensitif | Kepercayaan user turun | Proses lokal sebagai default; upload server hanya pada alur yang jelas | Arsitektur |
| Autosave lokal hilang | User kehilangan pekerjaan | Copy yang jelas, penanganan kuota/error; pertimbangkan backup project setelah MVP | Editor core |
| Server render mahal | Margin buruk | Ukur detik render, biaya/job, ukuran output, TTL, retry rate | Sebelum public launch |
| Watermark dianggap anti-screenshot mutlak | Ekspektasi proteksi keliru | Dokumentasikan batas client; hanya akses artifact resmi yang dijamin oleh otorisasi server | Brief + QA |
| Watermark mudah dicrop atau merusak preview | Hasil bisa diambil atau editor tidak berguna | Pola di area hasil, uji keterbacaan, jangan hanya badge sudut/CSS overlay | Desain + proof preview |
| Login menghilangkan pekerjaan guest | Drop-off export tinggi | Persist semua blob dan state sebelum OAuth/redirect; uji cancel, error, popup blocked | Auth integration |
| Endpoint export dilewati / asset user lain diakses | Kuota/paywall atau privasi bocor | Auth/ownership/policy server pada setiap resource dan request | Sebelum public launch |
| Klik ganda/retry menghabiskan kuota | User dirugikan | Idempotency + transaksi reservation/commit/release | Export integration |
| Sepuluh model tidak konsisten | Mutu katalog turun | Manifest standar, preview/render alignment, QA per model dan kategori | Catalog expansion |
| Duo menyebabkan clipping, crop salah, atau boros memori | Template tidak bisa dipakai | State per instance, framing gabungan, uji dua screenshot berbeda | Scene core + beta |
| Status pembayaran terlambat/tidak urut | Akses Pro salah | Verified webhook, dedup, fetch status terkini, rekonsiliasi | Saat billing aktif |
| Scope melebar | Rilis mundur | Setiap tambahan diberi dampak terhadap milestone | Sepanjang proyek |

**11. Milestone dan kondisi selesai**

Estimasi lama 15–29 hari kerja / 4–8 minggu untuk satu device tanpa akun/backend tidak lagi menjadi estimasi public launch. Scope baru mencakup katalog lintas kategori, duo, login, kuota, dan server render. Jadwal perlu memasukkan produksi serta pemeriksaan aset, bukan hanya coding.

| Tahap | Pekerjaan | Deliverable dan kondisi selesai |
|---|---|---|
| 1/8 — Product plan dan PRD | Scope v0/publik, user flow, requirements, Free dan arah Pro | Arah diterima user; angka dan keputusan terbuka tercatat |
| 2/8 — Arsitektur dan persiapan teknis | Backend, kontrak scene/data/API, render pipeline, struktur file, backlog | Spesifikasi konsisten dan pekerjaan coding pertama jelas |
| 3/8 — V0 internal | iPhone 17 Pro Max, upload/crop, pose, motion, PNG lokal, draft recovery | Flow teknis berjalan dan hasil diperiksa; penerimaan visual final boleh tetap pending |
| 4/8 — Proof lintas kategori dan server | Tablet, laptop, duo, proxy/full alignment, PNG worker | Screen mapping/framing konsisten; biaya dan latensi awal diukur |
| 5/8 — Akun dan backend publik | Login/restore, upload privat, queue, ownership, Free policy, kuota, download, lifecycle | User berhak mendapat PNG bersih; race/retry/cancel tidak menggandakan konsumsi |
| 6/8 — Katalog dan penyempurnaan editor | Minimal 10 model, duo, thumbnail, metadata; acuan visual dan UI final | Seluruh model/komposisi lulus QA; desain dan state editor lengkap |
| 7/8 — Beta dan rilis publik | Uji user, browser/hardware, beban/biaya, akses, lifecycle, deployment | Semua release gate di bawah lulus |
| 8/8 — Pro dan video | Proof MP4, unit biaya, paket/harga, checkout/webhook/portal, entitlement | Fitur berbayar bekerja sebelum checkout dibuka; pembayaran dan akses diuji |

Urutan dan backlog resmi ada di [Implementation roadmap](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/IMPLEMENTATION_ROADMAP.md>). Produksi katalog dapat berjalan beriringan setelah kontrak aset tahap 4 stabil, agar kesalahan UV/framing tidak diperbanyak. Rilis publik ada di akhir tahap 7; tahap 8 adalah kelanjutan monetisasi. Perubahan urutan komersialisasi dicatat sebagai perubahan scope.

Untuk budgeting waktu saja, rentang kasar public launch 6–12 minggu masih hipotesis bila ada engineer berpengalaman dan dukungan aset/desain, serta model bisa didapat dengan kualitas/hak yang sesuai. Modeling banyak device dari nol, solo sambil belajar, atau preview sepenuhnya di server dapat melampaui rentang ini. Jadwal baru dikunci setelah proof tahap 4 dan estimasi produksi katalog; belum ada janji tanggal.

Milestone dan estimasi di bagian ini berasal dari planning awal. Beberapa pekerjaan tahap 3 sudah selesai; lihat status aktual pada PROJECT_STATUS.md.

Usulan kriteria rilis:

- Minimal 10 model device siap pakai lintas kategori, ditambah template duo; seluruhnya memiliki screenshot mapping, framing, versi, dan pemeriksaan lisensi.
- Setidaknya 4 dari 5 designer uji dapat menyelesaikan edit → login → PNG tanpa dibimbing. Ukur waktu mengedit dan waktu login/export secara terpisah agar hambatan auth terlihat.
- Output memenuhi tiga contoh kualitas yang telah dipilih; screenshot tidak stretch/mirror dan teks kecil tetap terbaca pada ukuran output yang dijanjikan.
- PNG memiliki ukuran dan aspect benar, cocok dengan pose/playhead yang dipilih, serta dapat dibuka di aplikasi gambar dan dimasukkan ke workflow portfolio/presentasi.
- Semua kasus prioritas lulus: upload invalid, crop per device, duo dua gambar, ganti model, login batal/redirect, reload draft, session expired, kuota habis, double-click, export gagal/retry, serta renderer tidak tersedia.
- Preview normal ber-watermark sebelum dan sesudah login; PNG standar bersih hanya pada alur export yang diizinkan. Client dimodifikasi tidak dijadikan klaim lulus anti-screenshot.
- Request tanpa login, owner mismatch, parameter Pro palsu, ID asset/job user lain, atau kuota habis ditolak. Artifact privat tidak bocor melalui endpoint/status/log/cache publik. Re-download valid tidak memotong kuota lagi.
- Usulan target preview minimal 30 fps pada laptop acuan, termasuk duo. Ukur waktu antre dan render PNG secara terpisah; tetapkan target persentil ke-95 serta biaya per export dari proof tahap 4 sebelum launch.
- Tiga export berturut-turut tidak menyebabkan kenaikan resource tanpa batas; tidak ada kehilangan project pada kegagalan export.
- Uji loop motion yang kompatibel, serta framing pada rasio 1:1, 16:9, 9:16 untuk tiap kategori dan duo. Laptop tidak diwajibkan mendukung preset yang secara visual tidak cocok; kompatibilitas preset tertulis di katalog.
- Policy ukuran PNG, kuota/reset, watermark, masa simpan file, dan penggunaan server dijelaskan pada UI. Checkout belum aktif untuk fitur yang belum tersedia.

Angka performa baru bermakna setelah laptop, browser/version, resolusi, network, dan asset uji ditentukan. Catat hasil serta keterbatasan, bukan hanya status lulus/gagal.

**12. Yang perlu disiapkan user**

| Prioritas | Yang disiapkan | Bentuk praktis |
|---|---|---|
| Sudah ada | Target user dan penggunaan utama | UI/UX designer untuk portfolio dan presentasi |
| Sudah ada | Batas tahap produk | V0 satu iPhone; publik minimal 10 model; smartphone/tablet/laptop dan template duo |
| Sudah ada | Login dan Free | Guest bisa edit; export wajib login; PNG standar bersih dengan kuota |
| Sudah ada, perlu dipertajam saat desain | Referensi UI editor | Figma dan Lottie: clean, rapi, punya karakter; pilih layar dan detail favorit |
| Sekarang | Referensi hasil dan animasi | 2–3 link/gambar/klip + detail kualitas yang dicari |
| PNG sudah dipilih; detail berikutnya | Policy Free/Pro | Definisi ukuran standar, jumlah kuota/reset, transparansi premium atau standar |
| Sebelum desain detail | Screenshot nyata untuk mencoba produk | 3–5 gambar: terang, gelap, teks kecil, rasio berbeda, elemen sistem |
| Sebelum memilih asset | Daftar 10 model dan jalur asset | Prioritas model, contoh single/duo, buat/beli/commission, budget per aset dan total |
| Sebelum public launch | Batas operasional | Budget render/storage per bulan dan per user Free, masa simpan file |
| Sebelum jadwal final | Kapasitas kerja | Siapa mengerjakan desain/3D/dev, jam per minggu, target tanggal |
| Sebelum uji teknis | Browser dan laptop target | Perangkat sendiri serta perangkat user utama |
| Sebelum desain final | Identitas brand bila tersedia | Nama, logo, font, warna, bahasa UI; working name cukup di awal |

Tidak perlu menyiapkan seluruh teknologinya sendiri. Input yang paling berharga dari user adalah contoh kualitas, konteks penggunaan, batas scope, dan prioritas saat ada tradeoff.

Form ringkas untuk melanjutkan:

- User utama dan tujuan hasilnya: UI/UX designer untuk portfolio dan presentasi.
- Referensi UI + hal yang disukai: Figma dan Lottie; clean, rapi, tetap punya karakter.
- Referensi render/motion + hal yang disukai: …
- Hal yang tidak boleh muncul: …
- Export wajib: PNG standar bersih setelah login, dengan kuota; video menyusul. Detail resolusi/transparansi/kuota: …
- Katalog: minimal 10 model smartphone/tablet/laptop + template iPhone duo. Daftar model prioritas: …
- Asset yang sudah ada / budget asset: …
- Waktu yang tersedia dan target rilis: …

Paket arsitektur tahap 2 sudah ditulis. Langkah berikutnya adalah proof teknis satu device pada tahap 3 saat masuk development. Reference board, wireframe, dan standar visual rinci mengikuti prioritas baru menjelang tahap penyempurnaan editor. Status aktual mengikuti Project status.

**13. Proteksi preview, screenshot, dan penyalinan PNG**

Permintaan anti-screenshot diterjemahkan sebagai menghambat pengambilan hasil bersih dan melindungi akses export resmi. Web biasa tidak dapat menjamin blok screenshot OS, screen recording, foto layar, atau client yang dikendalikan user. Browser sendiri menyediakan capture screenshot, dan canvas memiliki API untuk membuat file gambar. [Chrome DevTools capture](https://developer.chrome.com/docs/devtools/device-mode#capture-a-screenshot), [Canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).

| Sasaran | Pendekatan | Batas sebenarnya |
|---|---|---|
| Screenshot biasa tetap membawa watermark | Watermark menyatu pada pixel tampilan, melintasi area hasil | Dapat dicrop/diedit; tidak membuat screenshot mustahil |
| Mengurangi salin preview melalui UI biasa | Jangan menyediakan PNG/blob bersih di guest; tanpa fitur Copy image bersih | Client dapat dibaca/dimodifikasi; preview yang terlihat tetap bisa ditangkap |
| Mencegah download artifact resmi sebelum berhak | Auth/ownership/entitlement/quota di server; storage privat | Melindungi artifact resmi, bukan mencegah render ulang dari data yang tersedia |
| Menahan kualitas penuh sebelum akses | Browser hanya menerima proxy; full asset/texture di server | Proxy masih dapat diekstrak atau dirender ulang; penurunan kualitas tidak boleh menyesatkan preview |
| Mengurangi pembagian URL | Gateway terautentikasi atau URL singkat sesuai kebutuhan | File yang sudah sah diunduh dapat disalin dan dibagikan |

Jangan mengandalkan disable right-click, blok keyboard, deteksi DevTools, CSS overlay, obfuscation, atau CORS sebagai proteksi utama. Menonaktifkan klik kanan juga mengganggu interaksi browser dan aksesibilitas tanpa menjamin keamanan. Watermark client yang menyatu pada pixel lebih baik terhadap pengambilan biasa daripada overlay CSS, tetapi code/shader tetap dapat diubah. Screenshot yang diunggah user juga tetap milik/tersedia pada user, sehingga tidak bisa disembunyikan darinya.

Ada dua pilihan tingkat proteksi:

- Rekomendasi hybrid: interaksi 3D lokal dengan proxy dan watermark, final render privat di server. UX cepat dan biaya preview rendah; user teknis tetap bisa menghasilkan gambar tanpa watermark dari proxy. Risiko sisa ini harus diterima secara eksplisit dalam spesifikasi produk, bukan disembunyikan.
- Bila model/raw render tidak boleh tersedia di client: preview dirender/di-stream dari server, watermark sudah menyatu sebelum frame dikirim, full asset tidak pernah dikirim. Ini memperkuat kendali terhadap pengambilan model/layer bersih, tetapi menambah latensi, biaya setiap sesi guest, dan risiko penyalahgunaan render. Screenshot/video dari stream yang terlihat tetap mungkin; watermark tetap dapat diedit. Evaluasi jalur ini pada tahap 4 jika tingkat proteksi tersebut dibutuhkan.

Setelah user berhak dan menerima PNG bersih, kemampuan menyimpan/menyalin file adalah fungsi utama produk untuk portfolio/presentasi. Tidak ada janji bahwa PNG sah itu tidak dapat disalin. Definisi “tidak bisa copy PNG” pada rencana ini adalah tidak ada akses tanpa izin ke file export bersih resmi, dengan batas preview di atas.

**14. Monetisasi dan hak akses**

Keputusan yang sudah dipilih user: PNG standar bersih setelah login, dengan kuota. Preview tetap ber-watermark; login dan pembayaran adalah dua hal berbeda. Jumlah kuota, resolusi standar, harga, serta batas video belum diputuskan.

| Kemampuan | Guest | Free terdaftar | Pro — usulan fase berbayar |
|---|---|---|---|
| Coba katalog dan template | Ya, preview ber-watermark | Ya, preview ber-watermark | Ya, preview ber-watermark; output final bersih |
| PNG standar | Login saat export | Bersih dengan kuota | Bersih, kuota lebih besar |
| PNG resolusi tinggi | Tidak | Upgrade ketika tersedia | Ya, setelah kualitas tervalidasi |
| PNG transparan | Preview opsi bila berguna | Usulan premium; belum dikunci | Kandidat fitur Pro |
| Video | Preview motion | Preview motion | Export video dengan allowance/unit yang jelas |
| Cloud project library, batch, template tambahan | Belum masuk tahap awal | Diputuskan kemudian | Kandidat nilai tambah setelah core stabil |

Semua 10 model dan duo sebagai akses PNG standar adalah usulan katalog awal, bukan fitur yang diam-diam dikunci di balik paket. Nilai Pro berasal dari kebutuhan output lanjutan dan efisiensi kerja. Jangan menawarkan checkout video sebelum export video siap dipakai. Launch Free boleh mendahului billing, dengan entitlement policy yang sudah digunakan server.

Quota policy: usulan reset per bulan, sisa kuota ditampilkan sebelum export; angka ditentukan dari biaya PNG dan uji penggunaan. Perhitungan berlaku pada job berhasil, bukan jumlah klik download. Upgrade tidak boleh menggandakan sisa kuota secara tak sengaja. Abuse protection memakai kombinasi verifikasi akun, rate limit, dan batas concurrency; IP saja tidak cukup untuk identitas atau menolak seluruh jaringan bersama.

Pro memakai subscription sebagai hipotesis utama, dengan allowance video yang jelas. Hindari janji unlimited sebelum biaya terukur. Satuan video dapat berbasis detik hasil dengan bobot resolusi/fps; tabel konversi ditampilkan ke user. Top-up atau paket sekali beli dapat dievaluasi setelah ada bukti kebutuhan designer yang sesekali memakai produk.

Penetapan harga memerlukan data: biaya render rata-rata dan persentil tinggi, jumlah export per user, storage/egress, retry rate, pembayaran, support, serta konversi guest → login → export → paid. Biaya serving preview juga dihitung bila memakai server streaming. Jangan menentukan harga hanya dari durasi klip atau jumlah model tanpa mengukur pemakaian.

Billing nanti: hosted checkout → server memverifikasi event pembayaran → update subscription/entitlement → akses Pro. Halaman redirect “sukses” dari browser tidak cukup untuk membuka hak. Tangani renewal, payment failed/pending, cancel-at-period-end, expired, refund/dispute, event duplikat dan tidak berurutan; rekonsiliasi dengan status provider terkini. Hak job yang sudah disetujui disimpan sebagai snapshot; downgrade membatasi job baru, sementara download artifact lama mengikuti ownership dan masa simpan. Webhook subscription dan feature entitlement didokumentasikan, misalnya, oleh [Stripe](https://docs.stripe.com/billing/subscriptions/webhooks); provider belum dipilih.

**15. Katalog lintas device dan template duo**

Usulan pembagian awal untuk memilih 10 model: enam smartphone termasuk iPhone 17 Pro Max dan beberapa pilihan Android/iPhone lain, dua tablet, serta dua laptop. Ini pembagian slot untuk perencanaan, bukan daftar model yang sudah disetujui. Gunakan kebutuhan screenshot user, ketersediaan aset, hak penggunaan, dan kualitas sebagai dasar pemilihan.

Model fisik mempunyai metadata screen aspect/mask, screen mesh/UV, orientation, bounds, camera presets, material variants, dan motion compatibility. Template komposisi mempunyai slot instance, transform relatif, camera, lighting, dan batas overlap. Sebuah model baru ditambahkan lewat asset + manifest + QA; editor tidak mempunyai cabang khusus untuk tiap nama model.

Scope duo awal: dua iPhone dari model katalog yang kompatibel, satu atau dua screenshot, crop/pose per device, background/camera bersama, preset layout, dan scene framing otomatis. Pengguna dapat mengganti screenshot satu layar tanpa mengganti layar lain. Satu final PNG dihitung satu export standar selama policy tersebut berlaku.

Untuk tablet uji portrait/landscape dan screenshot berbeda rasio. Untuk laptop gunakan pose engsel terbuka yang tetap pada fase awal; penempatan layar mengikuti model, bukan bidang layar ponsel yang diskalakan. Animasi buka-tutup engsel, foldable, dan scene dengan lebih dari dua perangkat menjadi scope tambahan yang perlu dinilai sendiri.

QA per model mencakup sumber/lisensi, nama/versi asset, orientasi/crop/cutout, warna/ketajaman, lighting/shadow, ukuran download, memory, dan keselarasan preview dengan final. QA per template mencakup visibility dua layar, clipping/overlap, pilihan instance, ketahanan saat ganti rasio canvas, restore setelah login, serta motion/export dari snapshot scene yang sama.
