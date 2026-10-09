# Dua jalur export: MVP Rp0 dan backend saat dibutuhkan

Keputusan 30 September 2026: MVP pertama memakai browser untuk mengolah screenshot, menyimpan draft di IndexedDB, dan mengunduh PNG bersih. Pengguna tidak perlu login. Tidak ada auth, database, storage, queue, atau worker cloud yang dijalankan untuk MVP ini. Biaya infrastruktur aplikasi yang berbayar tidak menjadi prasyarat; pilihan hosting statis dan batas paket gratis tetap harus diperiksa sebelum publikasi. Pengembangan, perangkat, domain khusus, dan operasional bukan otomatis gratis.

Jalur backend yang pernah dirancang tetap menjadi fase pertumbuhan, bukan syarat MVP. Proof render lokal T4-03–05 dipertahankan sebagai bukti teknis. Belum ada endpoint export publik, akun, kuota, atau worker produksi.

Target build terpisah `apps/mvp` mengimpor editor/style dari `apps/web`, memakai `output: "export"`, dan menghasilkan `apps/mvp/out` untuk hosting file statis. Jalankan `pnpm build:mvp`; `apps/web` tetap untuk development dan proof worker. Salinan asset publik MVP dibuat oleh `scripts/sync-fixtures.mjs`; model full tidak disalin. Build statis awal menghasilkan hanya route `/` dan `/_not-found`, tanpa route `/internal/render`.

Pemeriksaan lokal 30 September 2026: build statis lulus, output sekitar 17 MB, tidak memuat model full atau route render internal. Saat disajikan sebagai file statis ke Chrome, editor menghasilkan PNG 1200 × 1200 yang dibuka dan diperiksa visual. Ini memverifikasi jalur dasar; pengujian perangkat/browser lain dan kesiapan rilis belum selesai.

| Bagian | MVP browser | Fase backend |
|---|---|---|
| Editor | `MockupEditor` dan `SceneDocument` v1 | Editor dan scene yang sama |
| Screenshot | Blob lokal di IndexedDB | Upload privat; `local blobId` dipetakan ke `uploaded assetId` |
| Render PNG | `MockupCanvas.capturePng` pada perangkat pengguna | Queue → worker Chromium → artifact privat |
| Hasil submit | PNG siap diunduh | ID job; client memantau status dan mengunduh artifact setelah siap |
| Akun/kuota | Tidak ada; kuota tidak diklaim aman | Session, ownership dan kuota ditegakkan server |
| Biaya render | Ditanggung perangkat pengguna | Ditanggung infrastruktur operator, perlu budget dan batas kapasitas |

## Kontrak perpindahan

`PngExportIntent` v1 memuat salinan scene beserta format dan dimensi output. `createPngExportIntent` memvalidasi dan menyalin scene agar perubahan editor berikutnya tidak mengubah permintaan yang sedang berjalan. `PngExporter.submit` menyediakan batas antarmuka: hasil `ready` untuk browser dan `queued` untuk backend kelak. MVP mengikatnya ke `browserPngExporter`; jalur server belum dapat dipilih oleh pengguna.

Saat backend diaktifkan, client mengunggah setiap blob lokal yang dipakai scene, menunggu status `ready`, lalu memanggil `resolveUploadedImages` untuk membuat **salinan** scene dengan asset ID. Blob dan draft lokal asli tidak diubah; jika upload/login gagal, pengguna tetap bisa lanjut mengedit dan export lokal. ID yang sama dipakai ulang untuk screenshot yang dipakai di dua instance. API memvalidasi ulang scene, ownership asset, model/release, dimensi, kebijakan, dan kuota; data dari browser tidak menjadi sumber hak akses. Setelah job diterima, server menyimpan snapshot dan idempotency key sebelum queue. Renderer worker menggunakan `SceneDocument` dan paket `render-scene` yang sama, dengan model full sesuai release yang dipin.

## Batas MVP dan pemicu migrasi

- Draft otomatis tetap berada pada browser dan perangkat itu. Pengguna kini dapat mengunduh file project `.forma.json` beserta gambar dan membukanya lagi secara manual; data browser yang dihapus sebelum backup tetap tidak dapat dipulihkan.
- Browser dengan GPU lemah atau memori kecil mungkin gagal export besar. Tidak ada fallback server otomatis sampai backend aktif.
- PNG lokal bersih dapat dibuat berulang kali. Watermark preview hanya petunjuk tampilan; bukan kontrol akses yang aman.
- Full model/asset yang dikirim ke browser dapat disalin. Bila perlindungan asset diperlukan, audit paket statis dan pindahkan asset full ke worker sebelum rilis dengan klaim privasi itu.
- Mulai jalur backend bila volume pengguna, kegagalan export lokal, kebutuhan sinkronisasi, kebutuhan kontrol akses/kuota, atau kualitas render konsisten membenarkan biaya. Ukur jumlah export, durasi, memori, dan kebutuhan support dahulu; pilih provider/budget setelah data cukup.

## Gerbang rilis

MVP Rp0 boleh diuji publik setelah kualitas asset/UI, pengujian lintas browser, aksesibilitas, privasi lokal, lisensi, dan hosting statis diverifikasi. Syarat lama `PUB-03` sampai `PUB-09` pada PRD berlaku untuk **rilis backend terkelola**, bukan untuk MVP browser. Jangan mengklaim login, kuota, private output, atau anti-copy pada MVP browser. Tahap 5 backend dan validasi VM T4-05 ditunda sampai jalur server dipilih; proof yang sudah ada tetap disimpan.
