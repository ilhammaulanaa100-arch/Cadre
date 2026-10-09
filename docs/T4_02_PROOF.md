# T4-02 — duo template proof

29 September 2026. Editor kini mempunyai template Single dan iPhone Duo. Duo menampilkan dua instance iPhone 18 Pro Max dalam scene yang sama, dengan kamera, background, format output, lighting dan waktu motion bersama. Device 1/2 dipilih dari panel Mockup; gambar, Fit/Fill, crop, padding, style, pose, posisi dan scale masing-masing terpisah. PNG memakai renderer scene yang sama dengan preview.

State Single dan Duo disimpan bersama dalam IndexedDB. Dua screenshot Duo dapat memakai Blob berbeda; draft juga menyimpan komposisi Single yang sedang tidak terlihat. Pergantian template mempertahankan keduanya. Reload memulihkan template, device terpilih dan semua gambar. Draft Single lama versi 1 dimigrasikan saat dibaca; tidak ditimpa sebelum validasi berhasil. Autosave tetap debounce 600 ms dengan status Saving/Saved di UI.

**Bukti:** [PNG Duo 1200 × 1200](evidence/t4-02/duo.png) dan [preview 390 px](evidence/t4-02/duo-narrow.png). Gambar sintetis biru/oranye yang berbeda dipetakan ke masing-masing layar; crop kiri/kanan tampak berbeda pada PNG. `FORMA_TEST_PORT=3001 node scripts/check-duo-editor.mjs` pada build produksi lokal/Headless Chrome memeriksa dua image reference dan cropRect yang berbeda dalam SceneDocument, perubahan byte PNG ketika hanya crop device kedua diubah, tiga Blob tersimpan, Single tablet kembali setelah berganti template, Duo/selection pulih setelah reload, draft v1 lama dibuka, serta lebar 390 px tanpa overflow horizontal. PNG dan preview dibuka serta diperiksa visual. Uji single tablet/laptop T4-01 diulang dan tetap lulus.

`pnpm typecheck`, `pnpm test`, dan `pnpm build` lulus. Evaluator waktu mempunyai test dua instance yang membuktikan identitas, posisi dan base pose tetap terpisah saat Turntable.

**Batas:** Duo saat ini template dua iPhone; pemilihan model lain per instance dan polish komposisi katalog berada di tahap 6. Bayangan per instance belum digeneralisasi, sehingga kontrol Shadow disembunyikan pada Duo. Render worker/server belum ada; itu T4-03. Review pengguna dan keputusan visual T3-07 masih terbuka.
