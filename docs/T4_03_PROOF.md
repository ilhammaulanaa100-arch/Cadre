# T4-03 — local render worker proof

30 September 2026. Render surface internal di `/internal/render` memakai `MockupCanvas` dari paket renderer yang sama dengan editor. Halaman ini hanya tersedia saat proses web dijalankan dengan `FORMA_INTERNAL_RENDER=1`; deployment web biasa memberikan 404. Worker Node membuka halaman tersebut di Chromium headless pada loopback, mengirim snapshot `SceneDocument` dan gambar lokal yang sudah di-resolve, lalu menyimpan PNG pada dimensi yang diminta.

Kontrak proof: `initialize` memvalidasi scene, ID/versi device, variant dan screen surface; gambar hanya berupa PNG/JPEG/WebP tertanam; asset model dipilih dari katalog lokal, bukan URL bebas dari job. Sesudah semua model siap, `renderAt(time, width, height)` memakai evaluasi waktu absolut dan `capturePng` renderer bersama. Worker memeriksa header dimensi PNG dan mencatat bytes serta SHA-256. `dispose` melepas scene. Input output dibatasi 4096 px per sisi. Server dan Chrome hanya berjalan di loopback pada proof ini.

Cara mengulang setelah `pnpm build`:

```sh
FORMA_INTERNAL_RENDER=1 pnpm --filter @mockup-3d/web start --hostname 127.0.0.1 --port 3001
node scripts/check-local-worker.mjs
```

Hasil: [Single PNG](evidence/t4-03/single.png) dan [Duo PNG](evidence/t4-03/duo.png), keduanya 1200 × 1200. Single 684,198 byte; Duo 554,731 byte. Kedua file dibuka dan diperiksa visual: model utuh, gambar layar terbaca, dan crop device kanan berbeda. SHA-256 tercatat di output `scripts/check-local-worker.mjs`. Typecheck, unit tests dan production build dijalankan setelah implementasi.

Ini proof render lokal, belum worker queue produksi. Belum ada upload privat, otorisasi, kuota, retry/cancel, ataupun benchmark host. T4-04 berikutnya menguji keselarasan preview dan output, normalisasi gambar/warna, serta pin versi asset/renderer; T4-05 mengukur compute dan biaya.
