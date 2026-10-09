**Blueprint struktur repositori v1**

24 September 2026 · Struktur di bawah adalah rancangan scaffold untuk fase coding. Saat dokumen ini dibuat, yang ada hanya dokumen Markdown; aplikasi, package manifest, lockfile, migration SQL, dan konfigurasi deploy belum dibuat. Path tree relatif terhadap workspace proyek. Semua dokumen lama tetap di lokasi semula agar link yang sudah dibagikan tetap berlaku.

**Struktur target**

```text
3D Builder - XXX/
  PRODUCT_PLAN.md
  PRD_V0.md
  PREPARATION_BRIEF.md
  PROJECT_STATUS.md
  docs/
    architecture/
      ARCHITECTURE.md
      SYSTEM_CONTRACTS.md
      REPOSITORY_BLUEPRINT.md
      IMPLEMENTATION_ROADMAP.md
    decisions/                  # Catatan keputusan baru setelah v1
    evidence/                   # Hasil ukur/review; tanpa data pribadi
    design/                     # Referensi dan UI, dikerjakan belakangan
  apps/
    web/
      src/
        app/
          (marketing)/
          editor/
          account/
          auth/callback/
          api/v1/
        features/
          editor/               # Layout, selection, editing state
          screenshots/          # File input, crop controls, decode preview
          catalog/              # Device dan template picker
          motion/               # Playback controls dan playhead
          exports/              # Intent, progress, download/retry UI
          auth/                 # Login/restore flow
          billing/              # Tahap 8; tidak dibuat lebih awal
        components/ui/          # Komponen visual; token mudah diganti
        lib/client/             # IndexedDB, API client, browser helpers
        lib/server/             # Session verification, request context
      public/                   # Asset web publik yang aman saja
    render-surface/
      src/                      # Halaman browser minimal untuk worker
    render-worker/
      src/
        queue/                  # Poll/claim, visibility, retry
        jobs/                   # PNG executor; video ditambah tahap 8
        browser/                # Chromium lifecycle dan internal surface
        assets/                 # Download/resolver privat job-scoped
        lifecycle/              # Heartbeat, cancel, finalize, reconciler
  packages/
    contracts/                  # Runtime schema, API payload, safe errors
    scene-domain/               # Scene command, transform, crop, motion time
    render-scene/               # Komponen 3D dan pipeline bersama
    catalog/                    # Manifest publik, template, fixture metadata
    server-core/                # Server-only use cases, policy, adapters
  supabase/
    migrations/                 # SQL schema/constraint/role/RPC/queue
    seed/                       # Fixture dev; bukan akun/data produksi
  assets/
    source/                     # Sumber Blender lokal/private, tidak ke CDN
    fixtures/                   # Model/screenshot non-sensitif untuk dev
    manifests/                  # Descriptor authoring; dipilah public/private
  tests/
    integration/                # Postgres, quota, storage, queue, worker
    e2e/                        # Guest/auth/export/recovery
    visual/                     # Acuan hasil dan toleransi yang disetujui
    fixtures/                   # Case invalid, beda rasio, scene single/duo
  infra/
    containers/                 # Web/worker build dan runtime
    environments/               # Konfigurasi non-secret local/staging/prod
  scripts/                      # Validasi catalog, asset packaging, dev helpers
  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
  tsconfig.base.json
  .env.example                  # Nama variable/placeholder, tanpa secret
  .gitignore
```

Tidak semua folder dibuat pada hari pertama. Scaffold awal tahap 3 hanya membuat web, contracts, scene-domain, render-scene, catalog, fixtures, dan konfigurasi workspace yang dipakai. Surface/worker/server-core/migrations mulai tahap 4/5; billing tahap 8. Struktur memungkinkan perluasan, tanpa package kosong atau abstraksi yang belum mempunyai consumer.

pnpm dipilih untuk workspace dan satu lockfile; versi toolchain/library yang kompatibel dipin saat implementasi. Fitur workspace dan local dependency protocol didokumentasikan oleh [pnpm](https://pnpm.io/). Tidak ada instalasi yang dilakukan pada sesi arsitektur ini.

**Aturan dependency**

| Modul | Boleh bergantung pada | Tidak boleh bergantung pada |
|---|---|---|
| contracts | Validator runtime kecil | Next, UI, database, credential, renderer GPU |
| scene-domain | contracts, utility math murni | React state, browser API, server-core, Supabase |
| catalog | contracts, metadata publik | Private storage keys, account policy rahasia |
| render-scene | contracts, scene-domain, Three/R3F | Next routing, auth, billing, DB, editor panel |
| server-core | contracts, scene-domain, backend adapters | UI React, DOM, render loop interaktif |
| web client | contracts, scene-domain, catalog, render-scene | server-core dan setiap secret/private manifest |
| web API | server-core, contracts | Render browser berat dalam request handler |
| render-surface | contracts, scene-domain, render-scene | Public API auth session, service key, panel editor |
| render-worker | server-core, contracts, build surface | Browser UI application state |

Scene domain adalah sumber perhitungan crop/pose/motion. Rendering memakai representasi scene yang sama tetapi dependency GPU tetap di render-scene. Resolver asset dipasok oleh host; komponen scene tidak mengetahui apakah sumbernya local fixture, public preview, atau storage privat worker.

API route tipis: parse request → verified context → use case server-core → safe response. Domain/use case tidak ditaruh seluruhnya dalam route handler. UI feature memanggil API client; tidak mengimpor tabel database. Enforce batas server/client melalui ekspor package yang jelas dan pemeriksaan import/build.

**Pengelolaan aset besar dan data pribadi**

Public preview siap distribusi dapat tinggal di object storage/CDN dengan hash dan versi; jangan memasukkan semua model ke initial JS bundle. Full GLB, HDRI privat, source `.blend`, screenshot user, PNG user, serta kredensial tidak masuk public/ atau package catalog publik.

Manifest asset dibagi menjadi descriptor publik dan private mapping pada proses packaging. Validasi bahwa nama screen mesh/material dan bounds cocok antara proxy/full. Source besar berada pada storage privat atau mekanisme versioning aset yang dipilih saat modeling; path assets/source adalah workspace authoring, bukan janji semua binary dicommit ke Git. Fixture yang masuk repo harus boleh digunakan serta tidak berisi data sensitif.

**Konfigurasi lingkungan**

| Kelompok | Contoh konfigurasi yang akan dibutuhkan | Batas |
|---|---|---|
| Browser public | App origin, Supabase URL dan publishable key, public catalog URL | Publishable key bukan izin menulis domain table; grants tetap membatasi |
| API private | Connection/role API DB, storage server credential, auth validation config, quota policy version | Hanya server; owner diambil dari verified session |
| Worker private | DB role worker, private storage access, queue/release ID, concurrency, timeout | Tidak ada browser client yang menerima credential ini |
| Billing private | Provider key dan webhook verification secret | Baru tahap 8 |
| Environment | local/staging/production, build release, logging settings | DB/bucket/key terpisah untuk staging dan production |

Semua nama env final ditulis di .env.example saat scaffold tanpa nilai nyata. Local file secret di-ignore; secret produksi dari mekanisme host. Jangan menggunakan prefix public untuk service/admin keys. Log tidak memuat env dump.

**Workflow source control dan perubahan**

Jika belum ada repository, inisialisasi dilakukan saat mulai scaffold. Branch pekerjaan memakai prefix codex/ sesuai lingkungan ini. Perubahan kecil mengikuti backlog dan menyertakan bukti yang relevan. Perubahan scene/API/schema diberi versi dan migration; perubahan database tidak diterapkan manual tanpa tersimpan sebagai migration.

Pin versi Next/React/R3F/Three, Node, pnpm, dan Chromium/Playwright yang kompatibel. Worker dan render-surface memakai rendererRelease yang sama; bundle web/API menetapkan release export yang didukung. CI memakai lockfile tetap. Hindari menentukan nomor versi dari perkiraan sebelum kompatibilitas build diuji.

**Rencana CI dan pemeriksaan**

- Tahap 3: typecheck, lint, unit penting pada crop/serialization/time evaluator, build, dan smoke screenshot → PNG.
- Tahap 4: manifest/version validation, single/duo fixtures, preview-versus-surface composition check.
- Tahap 5: migration/grants, session/ownership, quota contention, idempotency, queue replay, worker-kill/cancel tests, protected download.
- Tahap 6/7: catalog completeness, fixture visual, performance/memory, cleanup/backup restore, public bundle scan untuk private assets/secrets.
- Tahap 8: verified webhook, event order/duplicate handling, entitlement transitions, video frame/duration/compatibility.

Unit test ditempatkan dekat modul bila spesifik; skenario lintas modul di tests/integration atau tests/e2e. Jalankan pemeriksaan sesuai perubahan; tidak membuat snapshot setiap komponen UI kosmetik. Seluruhnya masih rencana; belum ada test yang dijalankan karena belum ada implementasi.

**Urutan file pertama saat coding dimulai**

1. Workspace/toolchain config dan web shell minimal.
2. contracts untuk SceneDocument/DeviceManifest dan safe validation errors.
3. catalog fixture iPhone dan scene-domain default scene/crop/time.
4. render-scene untuk load model, bind screenshot, apply camera/lighting, dan PNG proof.
5. Editor feature untuk upload/pose sederhana dan fixture pemeriksaan.

Data model dan kontrak API tidak diubah hanya untuk mengejar demo sesaat. Stub lokal diberi nama jelas dan tidak menjadi jalur produksi export tanpa pemeriksaan akses.
