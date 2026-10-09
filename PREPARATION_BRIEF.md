**Brief persiapan — Desain, aset 3D, dan mulai development**

Versi 0.2 · 24 September 2026 · Rencana persiapan sebelum coding, setelah product plan dan PRD diterima user. Berdasarkan [PRD v0](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PRD_V0.md>) dan [product plan](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PRODUCT_PLAN.md>). Baru berupa rencana dan worksheet; board referensi, wireframe, desain visual, prototype klik, dan model 3D belum dibuat.

Tujuan dokumen ini adalah membuat input berikutnya mudah dikumpulkan dan menjelaskan siapa menyiapkan apa. Referensi UI dan referensi hasil mockup ditinjau terpisah.

**Perubahan prioritas dari user:** acuan visual disesuaikan belakangan. Saat ini fokus tahap 2/8, arsitektur/backend/struktur file. Urutan P1–P8 di bawah adalah kelompok persiapan, bukan nomor progres proyek; P1/P3/P4 visual tidak menjadi blocker proof teknis. Status resmi ada di [Project status](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/PROJECT_STATUS.md>). Spesifikasi teknis yang sudah disiapkan ada di [Architecture](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/ARCHITECTURE.md>), [System contracts](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/SYSTEM_CONTRACTS.md>), dan [Repository blueprint](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/REPOSITORY_BLUEPRINT.md>).

**Kelompok persiapan; urutan aktual mengikuti Project status**

Product plan menjelaskan arah; PRD menjelaskan kebutuhan dan kriteria selesai. Persiapan menerjemahkan keduanya menjadi kontrak aset/sistem, alur interaksi, struktur kode, serta urutan pekerjaan. Acuan visual menyusul sesuai perubahan prioritas di atas.

| Tahap | Pekerjaan dan hasil yang disiapkan | Ketergantungan | Yang perlu dinilai user |
|---|---|---|---|
| P1 — Acuan visual | Dua board beranotasi: UI editor dan hasil mockup | Referensi dari user atau hasil kurasi berikutnya | Kualitas/gaya yang ingin dicapai dan yang tidak disukai |
| P2 — Flow dan screen/state map | Peta langkah, struktur pengaturan, daftar layar/state internal dan publik | PRD; dapat berjalan saat P1 dirapikan | Langkah terasa masuk akal, kontrol utama mudah ditemukan |
| P3 — Wireframe | Layout sederhana editor, crop, export, dan flow login publik | P2 | Hierarki, posisi kontrol, ruang canvas, langkah export |
| P4 — Arah visual dan prototype klik | Dua alternatif satu layar → satu arah terpilih → komponen inti dan prototype | P1 + P3; asset sementara boleh diberi label | Spacing, typography, karakter, keterbacaan, kemudahan flow |
| P5 — Aset dan spesifikasi 3D | Brief model, jalur memperoleh/membuat, file sumber/uji, manifest dan rencana QA | PRD untuk kontrak teknis; referensi visual menyusul | Material final belakangan; source/model/pemetaan layar untuk proof |
| P6 — Spesifikasi interaksi dan teknis v0 | Aturan gesture/state, scene/asset contract, keputusan renderer/export, daftar eksperimen | PRD + kontrak P5; UI sementara untuk proof | Tradeoff yang memengaruhi produk; detail rutin disiapkan asisten |
| P7 — QA dan paket uji | Fixture screenshot, hardware/browser acuan, mapping requirement ke skenario | PRD + P4/P5/P6 sesuai bagian | Bukti apa yang dianggap memenuhi standar |
| P8 — Backlog dan kickoff | Pekerjaan kecil berurutan, dependency, acceptance, bukti demo tiap bagian | PRD, P5, P6, P7; visual tidak menghalangi proof teknis | Prioritas milestone dan hasil yang akan ditunjukkan |

P5 adalah jalur aset terpisah yang dapat berjalan bersamaan dengan desain. P6/P7 disiapkan bertahap agar tidak menunggu seluruh UI selesai. Tidak perlu membuat semua dokumen menjadi file terpisah: satu file desain dapat menampung board/flow/wireframe/prototype; brief ini menampung rujukan dan keputusan; spesifikasi teknis/backlog ditulis ketika isinya sudah konkret.

**P1 — Menentukan acuan visual**

Pisahkan selera terhadap editor dari selera terhadap output. Dari Figma/Lottie, ambil contoh panel, hierarki, density, typography, pemilihan preset, dan empty state. Untuk output, pilih contoh material body, lighting, refleksi layar, shadow, komposisi, dan gerak. Pilih juga satu contoh yang tidak diinginkan agar batas selera lebih jelas.

Setiap referensi diberi catatan “ambil bagian ini”, “hindari bagian ini”, dan alasan. Hasil tahap ini adalah brief visual singkat: tiga sampai lima prinsip serta contoh gambar yang menjelaskannya. Contoh prinsip: screenshot harus tetap terbaca, refleksi tidak menutupi isi, canvas mendapat ruang utama, dan accent digunakan secara konsisten. Ini masih usulan hingga dicocokkan dengan referensi.

Selesai ketika kita dapat membandingkan dua rancangan dan menjelaskan pilihan dengan contoh yang sama. Nilai seperti premium/clean tidak berdiri sendiri tanpa rujukan. Pilihan warna/font dapat dibawa dalam P4; nama/brand final tidak perlu menahan wireframe.

**P2 — Menjelaskan flow, struktur pengaturan, dan state**

Buat dua flow yang diberi label jelas: v0 internal upload → edit → PNG; serta publik guest → pilih device/template → edit → export → login → restore → pemeriksaan kuota → PNG bersih. Flow publik ditinjau sejak desain agar editor dapat diperluas, sementara implementasi login tetap pada milestone publik.

Susun struktur kontrol: Device/Template, Screenshot, Pose/Composition, Background, Motion, Export. Ini daftar kelompok, bukan keputusan bahwa semuanya harus menjadi tab. Tentukan mana tindakan utama, mana pengaturan lanjutan, serta mana berlaku pada scene atau device terpilih. Pada duo, pergantian target Device 1/Device 2 harus jelas.

Daftar state mencakup upload salah, loading model, crop berbeda rasio, playing/paused, export berlangsung/gagal, draft tersimpan/gagal, login dibatalkan, session expired, kuota habis, dan hasil tersedia. Keluaran: flow diagram, screen/state map, dan aturan pemulihan. Selesai ketika jalur normal dan jalur gagal punya tujuan yang jelas tanpa membuat user kehilangan pekerjaan.

**P3 — Menyusun wireframe**

Gambar layout dengan warna netral dan isi realistis: editor awal, setelah upload, pengaturan crop, motion paused, export, serta modal login/kuota untuk flow publik. Pakai screenshot contoh agar proporsi ruang dinilai berdasarkan isi sebenarnya. Tinjau desktop utama dan versi lebih sempit, tanpa menganggap mobile editor masuk scope.

Periksa seberapa besar canvas tersisa, posisi Export, jumlah kontrol yang terlihat, kejelasan crop vs rotate, serta tempat menjelaskan watermark. Bila sebuah panel penuh, gunakan kelompok/progressive disclosure yang dapat diuji, bukan mengecilkan semua label.

Keluaran: wireframe beranotasi dan walkthrough urutan tindakan. Selesai ketika user bisa menunjuk lokasi tindakan utama dan flow tidak memerlukan penjelasan tentang cara kerja 3D. Pemilihan font/warna akhir dilakukan pada tahap visual berikutnya.

**P4 — Memilih gaya dan membuat prototype klik**

Buat dua alternatif pada layar editor yang sama dengan screenshot dan pose yang sama. Perbandingan fokus pada gaya: alternatif A panel lebih kompak; B preset lebih visual dan ruang lebih lega. Setelah satu arah dipilih, rapikan typography, warna, spacing, radius, icon, button/input/slider/tab/preset card, focus/disabled/loading states, dan cara menampilkan watermark.

Bangun prototype klik di tool desain yang dipilih untuk mencoba flow upload, pengaturan, export/login, cancel, dan kembali mengedit. Prototype menggunakan simulasi interaksi: belum membuktikan rotate 3D, upload asli, keamanan, performa, atau hasil PNG. Labeli render/gambar placeholder agar tidak disangka hasil engine yang sudah tercapai.

Keluaran sebelum implementasi UI final pada tahap 6: arah visual terpilih, layar inti, komponen minimum, dan prototype flow. Ini tidak menjadi syarat coding proof teknis tahap 3. Review flow bisa dilakukan pada sedikitnya satu orang selain pembuat, lalu diperluas pada beta. Selesai ketika arahnya sesuai selera user dan hierarki/interaksi utama jelas; desain memakai hasil render nyata dari proof browser.

**P5 — Menyiapkan aset 3D**

Rinci spesifikasi model di brief aset di bawah, lalu pilih jalur: membuat lewat Blender/MCP sesuai ketertarikan awal user, mengadaptasi model yang sudah ada, atau bantuan artist. Nilai source yang tersedia, hak penggunaan, budget, dan akurasi referensi sebelum memilih. Pemilihan jalur bukan janji hasil satu prompt; integrasi MCP perlu diverifikasi terpisah.

Jika membuat model, bagi pemeriksaan menjadi bentuk utama → detail hardware → layar/UV → material → export. Gunakan versi file agar revisi dapat dibandingkan. Keluaran yang dibutuhkan untuk proof: satu model uji iPhone 17 Pro Max, sumber/asalnya, metadata screen/pivot/bounds, serta GLB yang dapat dicoba nanti. Kualitas final web diperiksa pada development pertama; status aset sebelumnya “siap diuji”, bukan “lulus browser”.

Siapkan aturan katalog lintas kategori sejak sekarang: identitas model, screen mapping, camera defaults, compatible motion, dan versi. Produksi seluruh 10 model dan template duo diperluas setelah contoh lintas kategori terbukti. Desktop/laptop tidak diperlakukan sebagai iPhone yang diperbesar.

**P6 — Menulis spesifikasi interaksi dan teknis yang diperlukan v0**

Spesifikasi interaksi mengunci hubungan tindakan dan hasil. Contoh dari PRD: rotate mengubah base pose device; camera/framing terpisah; mengubah pose mempause motion; export mengambil frame yang dipilih; mengganti screenshot mempertahankan komposisi. Undo/redo kemudian dikeluarkan dari scope atas arahan user. Untuk detail baru seperti batas sudut, nilai default, shortcut, dan durasi transisi, tandai usulan sampai diuji lewat desain/proof.

Spesifikasi teknis menjelaskan UI state vs scene state, asset catalog/manifest, pemetaan screenshot, evaluator motion berbasis waktu, render PNG, serta penyimpanan draft lokal. Scene memakai daftar instance walau v0 hanya satu. Hubungkan keputusan ini ke requirement, misalnya scene snapshot untuk V0-07 dan metadata model untuk V0-12.

Catat juga batas yang harus dipertahankan menuju publik: auth/ownership/kuota pada server, preview ber-watermark, asset render privat, export server, serta dukungan duo. Kontrak publik ini disiapkan secara konseptual; pemilihan payment provider dan detail billing tidak menghambat proof lokal.

Keluaran: spesifikasi singkat, tabel kontrak data/aset, keputusan beserta alasan, dan daftar eksperimen. Eksperimen pertama meliputi kesesuaian material dari GLB, pemetaan layar, ketajaman/warna PNG, dan respons interaksi. Eksperimen ini baru dijalankan pada development; dokumentasi tidak dianggap bukti bahwa performa atau proteksi sudah lolos.

**P7 — Menyiapkan QA dan bukti kualitas**

Gunakan paket screenshot S-01 sampai S-05 di bawah. Catat laptop, OS, browser/version, asset version, dan ukuran output. Tautkan requirement ke skenario: V0-03 diuji dengan beda rasio dan crop; V0-07 dibandingkan dengan frame pause; V0-09 diuji lewat reload dan kegagalan penyimpanan; PUB-03 nanti memakai login cancel/redirect.

Tetapkan cara menilai visual: perbandingan referensi, tampilan PNG pada ukuran sebenarnya, dan daftar masalah seperti teks blur, warna berubah, screen mirror, bezel clipping, atau shadow yang tidak sesuai. Target performa tetap hipotesis sampai perangkat acuan ditentukan dan diukur.

Keluaran: matrix requirement → scenario → fixture → expected result → tempat bukti. Pada tahap ini kolom hasil belum diisi. Rencana QA dipakai untuk memilih pemeriksaan yang bermakna saat implementasi, bukan kewajiban membuat test otomatis untuk setiap detail kosmetik.

**P8 — Mengubah persiapan menjadi backlog**

Setiap pekerjaan mempunyai tujuan, requirement terkait, dependency, batas scope, dan bukti selesai. Contoh urutan awal:

| Urutan | Hasil yang dibangun pada fase coding nanti | Requirement terkait | Bukti demo |
|---|---|---|---|
| 1 | Satu model, satu screenshot contoh, satu pose, satu PNG | Bagian awal V0-01/02/03/07/12 | Browser render dan file PNG yang dapat dibandingkan |
| 2 | Upload/crop dan pose/framing dapat diedit | V0-02/03/04/05/08 | Screenshot berbeda rasio tetap benar |
| 3 | Preview motion dan export frame terpilih | V0-06/07 | Pause/scrub konsisten dengan PNG |
| 4 | Restore, error recovery, watermark preview | V0-09/10/11 | Reload/gagal input tidak menghilangkan draft |
| 5 | Review keseluruhan v0 dan catat keputusan kualitas | Semua V0 requirement | Paket hasil, pengukuran, dan tindakan berikutnya |

Pekerjaan pertama adalah sebagian kecil flow untuk membuktikan risiko utama. Keberhasilannya tidak berarti semua V0 requirement telah selesai. Rencana publik tetap mengikuti milestone product plan setelah validasi internal.

**Cara review agar keputusan tidak berulang**

Review dikelompokkan pada empat hasil: acuan visual, flow/wireframe, arah UI, dan kualitas aset/output. User memilih arah dan tradeoff yang berpengaruh; asisten menjaga konsistensi detail rutin berdasarkan keputusan tersebut. Catat keputusan, alasan, contoh rujukan, serta apa yang masih terbuka. Sebutan “disetujui” hanya berlaku pada hal yang memang sudah dipilih, bukan seluruh angka/fitur yang masih berupa usulan.

Saat sebuah input belum ada, lanjutkan pekerjaan yang tidak bergantung padanya dan beri label placeholder/asumsi. Contoh: flow login dapat disusun sebelum provider auth dipilih; penilaian material final perlu referensi hasil. Ini bukan permintaan approval per langkah kecil atau alasan untuk menghentikan persiapan lain.

**Yang paling berguna dari user sekarang**

1. Dua atau tiga contoh hasil mockup yang disukai. Sertakan alasan: material, cahaya, shadow, pose, framing, atau keterbacaan layar.
2. Tiga sampai lima screenshot nyata untuk pengujian. Gambar terang, gelap, teks kecil, serta rasio berbeda akan membantu.
3. Satu atau dua contoh layar/detail dari Figma/Lottie yang dimaksud. Nama produk sudah cukup sebagai titik awal, lalu kita tunjuk bagian yang disukai.
4. Informasi aset yang sudah ada, preferensi membuat/membeli model, budget aset, dan laptop/browser yang biasa dipakai.

Tidak perlu menyiapkan akun hosting/payment atau membeli seluruh 10 model sekarang. Daftar model publik disusun setelah kontrak aset lintas kategori terbukti. Harga Pro dan batas video menunggu hasil biaya render.

**Worksheet referensi visual**

| ID | Kategori | Link/nama/file dari user | Bagian yang dipertahankan | Bagian yang tidak diinginkan |
|---|---|---|---|---|
| UI-01 | UI editor | Figma; layar spesifik belum dipilih | Clean, rapi, punya karakter | Belum ditentukan |
| UI-02 | UI editor | Lottie; layar/produk spesifik belum dipilih | Clean, rapi, punya karakter | Belum ditentukan |
| OUT-01 | Hasil mockup | Belum diisi | Lighting/material/pose: … | … |
| OUT-02 | Hasil mockup | Belum diisi | Framing/ketajaman/shadow: … | … |
| OUT-03 | Motion, opsional pada input awal | Belum diisi | Gerak/easing/tempo: … | … |

Contoh anotasi berguna: “Highlight metal di sisi kiri terasa pas; layar tetap terang dan terbaca; shadow lembut. Jangan pakai refleksi yang menutupi teks.” Untuk UI: “Suka kelompok pengaturannya, tetapi ukuran label perlu lebih besar.”

Tiga kata arah yang sudah tersedia: clean, rapi, berkarakter. Penerjemahan awal: canvas dominan, hirarki kontrol jelas, spacing/alignment konsisten, accent/typography/thumbnail preset yang punya identitas. Warna dan font final belum ditentukan.

**Brief desain UI**

Pengguna adalah designer; tindakan utama upload, mengatur komposisi, dan export harus ditemukan tanpa pengetahuan 3D. Kontrol teknis seperti UV, encoder, storage, atau nama mesh tidak muncul pada flow normal.

Layar utama yang perlu dirancang:

- Editor awal dengan contoh device dan tindakan upload.
- Editor setelah screenshot dimasukkan, termasuk crop/fit dan pose.
- Pemilihan device/template serta target Device 1/Device 2 pada duo untuk tahap publik.
- Preview motion, pause/scrub, dan frame yang akan diekspor.
- Export PNG, kebutuhan login, login dibatalkan/gagal, draft dipulihkan, render/progress, hasil, dan kuota habis.
- Error state utama dan dukungan desktop sempit; output model 3D tidak boleh tertutup panel tanpa kontrol yang masuk akal.

Dua arah visual membandingkan layar dan isi yang sama: A dengan panel lebih kompak untuk presisi; B dengan preset card dan ruang lebih lega. Review fokus pada hierarchy, spacing, typography, contrast, kepadatan, dan karakter. Ini dua eksplorasi untuk memilih satu arah, bukan rencana membangun dua tema.

Serah terima desain: flow beranotasi, wireframe, arah visual terpilih, aturan layout, komponen/token, seluruh state penting, serta prototype klik. Desain export publik harus menjelaskan login dan watermark sejak awal; login tidak menghilangkan pekerjaan user. Keputusan dibuat setelah contoh terlihat, tanpa perlu meminta konfirmasi untuk setiap detail kecil yang mengikuti acuan.

**Brief aset v0 untuk Blender**

| Area | Kebutuhan untuk iPhone 17 Pro Max |
|---|---|
| Tujuan | Model untuk web interaktif dan PNG, mengikuti referensi OUT yang akan dipilih |
| Geometri | Proporsi dan bentuk device cocok; layar, body, serta detail relevan dapat diidentifikasi |
| Layar | Mesh/material terpisah; UV benar dan terdokumentasi; screenshot tidak stretch/mirror; mask/cutout sesuai model |
| Transform | Unit/orientasi konsisten, pivot rotasi jelas, bounds untuk framing tersedia |
| Material | Dapat dipakai renderer target; evaluasi di browser; texture procedural yang diperlukan disiapkan untuk export |
| Kualitas | Detail cukup pada resolusi output acuan; lighting/refleksi menjaga screenshot terbaca |
| File kerja | Sumber `.blend`, texture sumber, GLB versi uji, manifest, asal/lisensi aset |
| Perluasan | Metadata layar/framing per model; siapkan kemungkinan GLB proxy dan full untuk fase publik |
| QA | Front/three-quarter/samping/belakang, screenshot terang/gelap, teks kecil, warna, preview vs PNG |

Alur persiapan MCP: tentukan model/source → verifikasi integrasi Blender yang akan digunakan → pastikan scene dapat dibaca dan perubahan dapat diperiksa → simpan versi sumber → export → review di browser. Belum ada pemasangan MCP atau penggunaan Blender pada tahap dokumen ini. Kemampuan tool harus diverifikasi sebelum mengandalkan prompt untuk otomatisasi.

Prompt modeling nantinya merujuk brief ini dan referensi terpilih; satu perintah “buat iPhone realistis” belum cukup untuk menjamin screen mapping, akurasi, atau hasil browser. Tugas dapat dibagi menjadi geometri, layar/UV, material, export, dan QA dengan hasil yang dapat diperiksa tiap tahap.

**Paket screenshot uji**

| Fixture | Isi | Hal yang diperiksa |
|---|---|---|
| S-01 | UI terang | White point, bezel/corner, shadow/refleksi |
| S-02 | UI gelap | Black level, keterbacaan teks, detail layar |
| S-03 | UI dengan teks kecil | Ketajaman PNG dan texture sampling |
| S-04 | Screenshot dengan rasio berbeda | Crop/fit/reposition tanpa distorsi |
| S-05 | Warna kuat atau swatch + elemen sistem | Konsistensi warna dan interaksi mask/cutout |

Satu gambar boleh memenuhi lebih dari satu kategori. Gunakan screenshot yang boleh dipakai untuk pengujian dan catat apakah boleh ditampilkan pada demo. Penggunaan file untuk QA tidak otomatis berarti boleh dipublikasikan sebagai contoh produk.

**Pembagian pekerjaan**

| Pekerjaan | Peran user | Pekerjaan yang dapat disiapkan asisten |
|---|---|---|
| Standar visual | Memberi referensi dan memilih arah berdasarkan contoh | Menganotasi pola, menyusun brief, alternatif visual, dan kriteria review |
| PRD | Mengoreksi kebutuhan yang tidak sesuai | Menjaga requirement, acceptance, scope, dan daftar keputusan |
| Aset | Menentukan preferensi jalur/budget, memberi source bila ada | Menulis spesifikasi, menilai kandidat dan hasil, menguraikan pekerjaan Blender |
| UX | Menilai kemudahan alur dan detail yang penting | Flow, wireframe, error/recovery states, desain berdasarkan arah terpilih |
| Implementasi mendatang | Menentukan prioritas saat ada tradeoff produk | Technical proof, integrasi, QA, dan hasil reviewable setelah masuk tahap development |

**Kondisi siap memasuki coding v0**

| Perlu siap untuk pekerjaan pertama | Bukti yang dipegang |
|---|---|
| Target pemeriksaan teknis | Screenshot uji, crop/warna/framing/output yang dapat diperiksa; acuan estetika final menyusul |
| Flow editor | Flow PRD dan aturan interaksi utama; shell fungsional sementara memadai untuk proof |
| Arah UI | Figma/Lottie tetap arah; pemilihan visual detail ditunda, bukan syarat memulai proof |
| Aset untuk proof | Model uji/source yang jelas, GLB/metadata siap dicoba; belum diklaim lulus browser |
| Rencana teknis | Kontrak scene/asset, strategi texture dan PNG, daftar eksperimen |
| Cara menilai hasil | Acceptance PRD, perangkat acuan, scenario/fixture, dan bukti yang akan dikumpulkan |
| Urutan pengerjaan | Pekerjaan pertama beserta dependency dan definisi selesai |

Coding belum dimulai dalam sesi ini. Prototype klik adalah artefak desain; proof GLB → browser → PNG adalah coding pertama dan dihitung sebagai development. Tidak mensyaratkan hasil pengujian browser sebelum prototype browser tersebut dibuat.

Setelah proof pertama tersedia, kita menilai material, warna, ketajaman, dan performa; memperbaiki aset/renderer yang diperlukan; lalu memperbarui desain detail dengan render nyata. Sesudah v0 selesai, lanjut ke tablet/laptop/duo, akun/kuota/server export, katalog minimal 10 model, beta, dan public launch sesuai product plan.

Yang dapat ditetapkan menjelang fase publik: daftar final 10 model, ukuran/kuota Free, batas transparansi, lifecycle file, budget worker, dan detail kebijakan. Supabase sudah menjadi baseline auth/database/storage; konfigurasi layanan belum dibuat. Arah/model data yang mendukungnya disiapkan sekarang. Harga dan allowance video ditetapkan sebelum fitur berbayar aktif, setelah biaya serta kualitasnya diketahui.

Langkah paling dekat mengikuti Project status: paket arsitektur tahap 2 sudah ditulis, berikutnya tahap 3 scaffold minimal dan proof screenshot → iPhone → PNG ketika coding dimulai. Input visual tidak diminta sebagai prasyarat; pekerjaan desain detail kembali pada tahap penyempurnaan sebelum publik.
