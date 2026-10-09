# T4-01 — tablet/laptop development proof

29 September 2026. T4-01 membuktikan pipeline asset lintas kategori dengan geometri generik buatan proyek. Keduanya hanya fixture teknis, bukan model tablet/laptop komersial siap katalog.

| Fixture | Asset | Layar | Hasil |
|---|---|---|---|
| Tablet | `assets/fixtures/models/tablet-dev.glb` · 45,520 byte | 1620 × 2330, mesh `Screen` | [PNG 1200 × 1200](evidence/t4-01/tablet-dev.png) |
| Laptop | `assets/fixtures/models/laptop-dev.glb` · 83,728 byte | 1600 × 900, mesh `Screen` | [PNG 1200 × 1200](evidence/t4-01/laptop-dev.png) |

Asset dibuat dengan `scripts/generate-category-fixtures.py` di Blender 5.2.2 LTS. Manifest katalog mengikat ID/version, bounds, rasio layar, nama mesh/material, ukuran dan SHA-256 GLB. `scripts/sync-fixtures.mjs` menyalinnya ke public path development. Editor sekarang memilih iPhone/tablet/laptop; ukuran canvas screenshot dan Fit/Fill berasal dari device aktif. Scene snapshot, model URL dan camera framing ikut berganti, sedangkan gambar/background tetap. Draft satu device pulih setelah reload. Renderer menerima nama screen node dari manifest.

Pemeriksaan: `node scripts/check-category-assets.mjs` lulus hash, ukuran, posisi screen, material dan cakupan UV 0–1. `pnpm typecheck`, 22 unit test, dan `pnpm build` lulus. `FORMA_TEST_PORT=3001 node scripts/check-category-editor.mjs` pada build produksi lokal/Headless Chrome lulus preview, capture PNG 1200 × 1200, dan restore draft untuk kedua kategori. Laptop diuji dengan screenshot landscape sintetis 1600 × 900; tablet dengan fixture dashboard portrait. PNG dibuka dan diperiksa visual: konten layar tidak mirror, device utuh, dan pivot/framing layak untuk proof. Framing laptop dikoreksi setelah render awal memperlihatkan bagian bawah terpotong.

Yang belum dibuktikan di T4-01: kualitas model final, proxy/full alignment, duo/per-instance state, render worker, dan benchmark compute. T3-07 tetap terbuka untuk uji pengguna tanpa panduan dan keputusan visual akhir.
