**Kontrak scene, data, API, dan job v1**

24 September 2026 · Spesifikasi sebelum coding. Nama field/route adalah rancangan, bukan endpoint atau database yang sudah tersedia. Nilai bisnis yang belum dipilih tetap berada pada policy server. Rujukan: [Architecture](</Users/aleph/Documents/ChatGPT/3D Builder - XXX/docs/architecture/ARCHITECTURE.md>).

**Keputusan MVP 30 September 2026:** `PngExportIntent` v1 (`scene`, PNG, dimensi) dipakai untuk export browser sekarang dan menjadi input sebelum validasi server nanti. `resolveUploadedImages` membuat salinan scene setelah seluruh blob lokal diunggah; draft asli tetap lokal. API, kuota, dan tabel server di bawah adalah kontrak fase backend terkelola, belum tersedia pada MVP. Lihat [Dua jalur export](DUAL_EXPORT_PATH.md).

**Scene document dan asset contract**

| Bagian | Data | Aturan |
|---|---|---|
| Scene identity | schemaVersion, draftId, revision, templateId/version | Schema eksplisit; template harus terdaftar; draftId client bukan bukti ownership |
| Instances | Daftar instanceId, deviceId/version, transform, materialVariantId, screen | V0 satu; single/duo publik maksimal dua sebagai policy awal; ID unik |
| Transform | position, quaternion, scale | Unit dan axis canonical; angka finite, scale positif, quaternion valid; batas scene dari server |
| Screen | surfaceId, imageRef, fit, cropRect, paddingColor | Satu surface aktif per instance pada scope awal; imageRef lokal saat guest dan upload asset ID saat export server |
| Crop | Rectangle sumber dinormalisasi terhadap gambar canonical; mode fill/fit | Tidak mirror/stretch; crop harus valid terhadap dimensi dan rasio surface; server menguji batas |
| Camera | presetId, projection, position/target atau parameter framing yang dinormalisasi | Satu kamera scene; framing memperhitungkan semua instance; parameter tervalidasi |
| Appearance | background, lightingPresetId/version | Warna/gradient dan preset yang diizinkan; tanpa arbitrary shader/URL |
| Motion | presetId/version, duration, amplitude/direction yang diizinkan | Waktu absolut; preset kompatibel dengan device/template; tidak menerima code user |
| Frame | playheadSeconds | PNG pada frame yang dipilih; snapshot menyimpan waktu itu |

Konvensi awal: glTF/world Y-up, satuan meter, orientasi model dinormalisasi melalui manifest; front direction dan asset scale terdokumentasi. Jangan menganggap semua model mempunyai pivot/tinggi yang sama. Screen crop tidak diukur dari panel UI pixel. Scene tidak menyimpan Three.js object, File/Blob, auth token, job status, URL download, selection, atau hover.

Draft lokal menyimpan scene plus blob map terpisah dan save state; export intent dibuat sebagai snapshot saat pengguna menekan Download. Serializer/migration bersifat eksplisit; scene schema yang tidak didukung ditolak dengan error yang bisa dipahami. Metadata publik model berisi ID/version/category, preview path/hash, screen mapping, bounds, variants dan compatible presets. Metadata privat berisi full asset key/hash dan kesiapan renderer; tidak dikirim oleh catalog endpoint.

Duo boleh memakai imageRef yang sama atau dua imageRef berbeda. Upload blob yang sama dapat digunakan ulang dalam akun yang sama; jangan melakukan dedup lintas akun yang membocorkan keberadaan isi milik orang lain. Mengubah model mempertahankan screenshot tetapi memvalidasi ulang crop dan compatible motion. Model/version yang tidak ready tidak dapat dipilih untuk export publik.

**Model data server**

| Entitas | Field kunci | Constraint / tanggung jawab |
|---|---|---|
| accounts | id = auth subject, status, createdAt | Account aktif diperlukan untuk upload/job/download |
| device_assets | id, category, lifecycle status | Identitas model; lifecycle draft/ready/retired |
| device_asset_versions | deviceId, version, public manifest, private manifest, content hashes | Unik device/version; immutable setelah dipakai job |
| scene_templates / motion_presets | id, version, compatible categories, defaults | Konfigurasi terversi, bukan arbitrary runtime code |
| uploaded_assets | id, ownerId, state, object keys, dimensions, bytes, hashes, timestamps/expiry | pending → validating → ready/rejected; hanya ready dapat masuk job |
| asset_validation_jobs | assetId unik, state, attempt/lease, fencing token, reason, timestamps | Complete membuat satu task queue validation; decode/normalisasi bounded; ready/rejected atomik dengan metadata asset |
| entitlement_policies | policyId/version, features, max output, quota units, watermark rules | Policy Free berlaku sebelum billing; browser tidak menulisnya |
| account_entitlements | accountId, policyId/version, effective times/source | Effective policy saat admission job |
| usage_periods | accountId, metric, periodStart/end, allowance, reserved, consumed | Unik account/metric/period; lock row saat admission/finalization; nilai tidak negatif |
| quota_reservations | jobId, periodId, units, state | Satu reservation per job; reserved/consumed/released |
| usage_events | operationKey, accountId, jobId, eventType, units, timestamp | Unik operationKey; ledger audit reserve/consume/release |
| export_jobs | id, ownerId, idempotencyKey, requestHash, scene/policy snapshot, rendererRelease, output, state, attempts, lease, progress/error | Unik owner/idempotencyKey; snapshot immutable setelah admission |
| job_asset_refs | jobId, assetId/version | Menahan input/model version selama job memerlukan resource |
| export_attempts | jobId, attemptNo, fencingToken, workerId, startedAt/heartbeat/endedAt, reason | Worker lama tidak dapat finalize attempt baru |
| export_artifacts | id, jobId, ownerId, objectKey/hash, dimensions, bytes, state, expiresAt | Maksimal satu artifact final per job untuk PNG awal; ready/deleting/deleted |
| subscriptions, billing_events | provider IDs, status/period, event ID unik | Fase 8; dedup dan rekonsiliasi provider |

Cloud project library bukan syarat awal. export_jobs menyimpan snapshot yang cukup untuk render/retry, tetapi akun tidak otomatis menyediakan cloud-save project lintas perangkat. Jika fitur itu ditambahkan, buat ownership/revision/lifecycle Project secara eksplisit.

Postgres menjadi pemilik transaksi kuota/job. Object storage tidak berada dalam transaksi SQL; upload artifact dahulu sebagai object privat per attempt, validasi keberadaannya, lalu commit metadata dan success secara atomik. Object tanpa referensi final dibersihkan oleh janitor. Tidak pernah memberi status succeeded hanya karena worker sempat mengirim progress 100%.

**API publik aplikasi — prefix /api/v1**

Semua route private memerlukan session terverifikasi dan pemeriksaan ownership. Status/error private tidak membocorkan ID atau metadata akun lain; resource bukan milik user dapat ditampilkan sebagai not found. Semua response private memakai no-store. Public catalog dapat di-cache berdasarkan version/ETag.

| Method dan route | Tujuan / input utama | Hasil dan akses |
|---|---|---|
| GET /catalog | Filter category/model/template | Manifest preview ready saja; guest boleh akses |
| GET /me | Tanpa owner dari client | Identitas akun, effective features, quota period/sisa; tanpa secret |
| POST /uploads | MIME/byte estimate/client upload key | Grant path baru milik akun + uploadId/expiry; limit server; idempotent pada retry yang sama |
| POST /uploads/{id}/complete | Konfirmasi upload object | Mulai/verifikasi validasi; 202 validating atau 200 ready/rejected; ownership wajib |
| GET /uploads/{id} | Poll kesiapan input | State, metadata canonical, dan grant sempit untuk preview input bila perlu; tanpa public source URL |
| DELETE /uploads/{id} | Hapus input yang tidak lagi dibutuhkan | Ref aktif dilindungi; delete request/deferred cleanup jika diperlukan |
| POST /exports | Scene snapshot + upload refs, format PNG, dimensions, idempotency key | 202 job/status path setelah admission dan reservation; server menetapkan owner/policy/release/watermark |
| GET /exports/{id} | Status job | State, stage, progress yang diketahui, retryable error, artifactId ketika ready |
| POST /exports/{id}/cancel | Permintaan cancel | Idempotent; accepted/requested atau terminal state yang sudah menang |
| POST /exports/{id}/retry | User mencoba lagi setelah terminal failure | Admission baru dengan key baru, parent job ID dan pemeriksaan kuota; retry internal berbeda dan memakai job yang sama |
| GET /artifacts/{id}/download | Artifact milik akun dan belum expired | Stream PNG sebagai attachment; re-download tidak memakai quota baru |
| POST /billing/checkout | Pilihan plan key server | Fase 8 saja; harga berasal dari server/provider, bukan angka client |
| POST /billing/portal | Session pemilik akun | Fase 8; URL pengelolaan subscription terbatas |
| POST /billing/webhook | Payload provider asli | Fase 8; signature verification/dedup; tidak memakai session browser |

Route login/callback/logout mengikuti integrasi auth terpilih di aplikasi. Callback memulihkan draft lokal dari identifier yang tervalidasi dan allowlist return path; input redirect tidak boleh menjadi open redirect. Update account deletion/support flow dipersiapkan sebelum publik, termasuk penghapusan upload dan artifact yang dimiliki.

Grant upload tidak membuktikan file aman/siap. Object awal tidak boleh di-overwrite setelah complete; asset canonical yang sudah ready memakai key/hash immutable. Validasi mencakup format nyata, decode, byte size, dimensi, total pixel, orientasi/warna, serta batas gabungan input duo. Grant yang dapat dipakai ulang tidak dapat mengganti canonical asset milik job yang telah diterima.

Upload complete mengubah state ke validating dan enqueue task validasi dalam transaksi; worker memproses queue validation terpisah, dengan lease/retry/fencing dan finalisasi idempotent. Browser mempoll GET upload sampai ready/rejected. Preview menggunakan canonical input yang akan dirender sebelum melanjutkan export. Task validasi tidak memakai quota PNG, tetapi dibatasi rate, concurrency, dan storage akun.

Format error: code stabil, pesan aman untuk user, retryable, requestId, dan field errors yang relevan. Kode awal: UNAUTHENTICATED, ACCOUNT_DISABLED, UPLOAD_INVALID, ASSET_NOT_READY, SCENE_INVALID, POLICY_DENIED, QUOTA_EXCEEDED, IDEMPOTENCY_CONFLICT, RENDER_FAILED, RESOURCE_EXPIRED. Auth 401, validation 400/422, policy 403, conflict 409, rate/quota 429 dengan detail/reset bila diketahui. Client tidak menampilkan stack trace atau private storage key.

**Idempotency dan kuota**

API mengikat idempotency key pada owner dan hash request canonical. Key sama + hash sama mengembalikan job yang sama, termasuk bila request pertama timeout. Key sama + hash berbeda menghasilkan conflict. Hash mencakup scene, referensi/version aset, format/dimensi dan frame, tidak mencakup token/URL sementara.

Admission membuat usage-period row jika belum ada dengan constraint unik; lock row tersebut; hitung allowance minus consumed minus reserved; validasi jumlah yang dibutuhkan; buat job/reservation/usage event dan queue message dalam satu transaksi. Semua check ownership/version yang memengaruhi admission diselesaikan atau diperiksa ulang di transaksi terkait.

Snapshot job mencatat periode/policy saat diterima. Job yang selesai melewati pergantian bulan mengonsumsi reservation periode asal; tidak mengecek counter baru lalu menghitung dua kali. Upgrade/downgrade mengubah admission baru sesuai effective policy, bukan menulis ulang history job. Allowance tidak dikirim client. Angka quota serta timezone/reset dipilih sebelum stage 5 siap publik; fixture development tidak menjadi paket komersial.

**Lifecycle job dan attempts**

| Transisi | Pelaku | Efek yang wajib konsisten |
|---|---|---|
| accepted → queued | Transaksi API | Snapshot, reservation, dan queue message tercatat bersama |
| queued/retry_wait → running | Worker claim | Lease/attempt/fencing token baru; reservation dipertahankan |
| running → retry_wait | Worker/reconciler untuk transient error | Backoff dan attempts terbatas; tidak memotong quota ulang |
| queued/retry_wait → cancelled | Cancel API via transaksi | Release reservation satu kali; message yang muncul lagi menjadi no-op |
| running → cancel requested | API mencatat intent | Worker tetap memegang resource sampai berhenti/finalisasi; jangan melepas reservation terlalu awal |
| running → cancelled | Worker/reconciler dengan fencing | Release reservation satu kali; temporary output tidak diterbitkan |
| running → succeeded | Worker finalization | Valid lease + no winning cancel; artifact metadata, quota consume, success di-commit bersama |
| running/retry_wait → failed | Failure final atau attempts habis | Release reservation; safe error; user dapat mencoba job baru |

accepted adalah hasil transaksi, bukan status publik terpisah yang bisa tertinggal tanpa enqueue. cancel requested disimpan sebagai flag/timestamp, bukan mengubah running menjadi status yang kehilangan lease. Transisi terminal tidak diulang untuk memotong/mengembalikan quota dua kali.

PGMQ message berisi jobId, schemaVersion, rendererRelease; tidak membawa screenshot, token, atau raw scene berukuran besar. Consumer menggunakan durable read dan visibility timeout. Heartbeat memperpanjang visibility dan lease; attempts lama dilarang commit melalui fencing token. Ack sesudah commit. Jika worker mati setelah commit sebelum ack, delivery berikutnya melihat terminal state lalu ack tanpa render ulang.

Object key per attempt menghindari worker lama menimpa file hasil attempt baru. Final artifact diterbitkan hanya melalui row committed; object attempt lain tidak memiliki route download user. Jika storage upload sukses tetapi transaksi gagal, finalisasi dapat diulang secara idempotent bila lease masih sah; jika tidak, orphan dibersihkan. Lease expiry dan queue visibility expiry direkonsiliasi tanpa melepas reservation jika retry yang sah masih berlangsung.

**Kontrak render surface internal**

Render surface menerima canonical scene, resolved asset map, renderer release, output dimensions, absolute time, serta render policy terpercaya dari worker. Resolver berbasis ID; tidak membuka arbitrary URL. Worker menyediakan resource lewat kanal internal/job-scoped tanpa mengirim storage credential ke halaman render.

Lifecycle: initialize → load assets → apply scene → ready → renderAt(time, output) → extract PNG → dispose. Nama tersebut kontrak konseptual, belum API implementasi. ready memastikan scene dan resource terpasang; hasil memuat dimensi, hash/bytes atau lokasi output internal, serta warning teknis yang aman. Error terklasifikasi memandu retry.

Editor dan surface memakai fungsi evaluate(scene, time) yang sama. Pixel ratio UI tidak menentukan resolusi output. Background, alpha policy, tone/color settings, dan device transform eksplisit. Render policy preview memakai watermark; policy output berasal dari entitlement server. Internal clean export lokal hanya tersedia untuk proof development dan tidak menjadi route/bundle fitur produksi yang membuka full assets.

**Skenario pemeriksaan kontrak yang wajib sebelum publik**

1. Dua POST export bersamaan dengan satu sisa quota: hanya satu admission berhasil.
2. POST sama diulang setelah timeout: job/reservation tetap satu; key sama dengan scene berbeda ditolak.
3. Worker mati sebelum upload output, setelah upload, dan sesudah DB commit: tidak ada artifact publik palsu atau konsumsi ganda.
4. Visibility timeout menyebabkan delivery ulang: fencing menolak commit worker yang sudah kehilangan lease.
5. Cancel dan success balapan: hanya satu terminal result/efek quota yang menang.
6. Input diganti setelah upload complete: canonical hash/key job tidak berubah; uploadId user lain ditolak untuk setiap instance.
7. User melewati UI dan mengirim resolusi Pro, instance ketiga, private URL, atau watermark=false: policy/schema server menolak atau mengabaikan flag tak sah.
8. Re-download sesudah quota habis masih bekerja untuk artifact sah yang belum expired; artifact akun lain ditolak.
9. Scene versi lama dan asset retired: hasil eksplisit; job accepted tetap memakai versi yang dipin selama retention, tanpa substitusi diam-diam.
10. Login redirect/cancel pada draft duo: kedua screenshot/crop/pose tetap pulih; tidak ada upload otomatis ke owner yang salah.

Ini rencana pengujian, belum hasil test. Rujukan behavior queue dan batas modul berada di Architecture; PRD tetap menentukan kebutuhan user dan scope.
