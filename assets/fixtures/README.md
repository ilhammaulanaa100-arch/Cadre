# Development fixtures

Fixture di folder ini hanya untuk pengembangan dan bukti teknis lokal. Keduanya
non-sensitif, tidak memuat data pengguna, dan bukan asset katalog final.

## `models/iphone-17-pro-max-dev.glb`

- Sumber geometri: dibuat oleh proyek melalui
  `scripts/generate-iphone-fixture.py` menggunakan Blender 5.2.2 LTS.
- Referensi dimensi: spesifikasi teknis iPhone 17 Pro Max yang diterbitkan Apple
  (78.0 × 163.4 × 8.75 mm, display 2868 × 1320).
- Hak penggunaan: geometri dan script dibuat untuk repository ini; tidak berasal
  dari model 3D Apple atau pihak ketiga. Nama perangkat hanya mengidentifikasi
  target development fixture.
- Batasan: kamera, tombol, bevel, material, dan warna disederhanakan; tidak boleh
  dianggap sebagai fidelity produk atau asset launch.
- Kontrak renderer: glTF 2.0, Y-up, meter, mesh layar bernama `Screen`, material
  awal `ScreenMaterial`, dan custom property `surfaceId=main-screen`.
- SHA-256: `7534e52ca53ef8c95a0d883e8d8402a70d4d905f0a0da4e482aba735384ee0c5`
- Ukuran: 410420 byte.

## `screens/dashboard-dark.png`

- Sumber: dibuat khusus untuk repository ini dengan OpenAI built-in ImageGen,
  mode UI mockup.
- Ringkasan prompt: dashboard mobile fiktif bertema gelap, rasio 9:19.5,
  komponen analytics generik, tanpa frame perangkat, logo, watermark, merek,
  atau data personal.
- Hak penggunaan: output generatif proyek untuk development fixture lokal; tidak
  menyalin screenshot produk atau data pengguna pihak ketiga.
- SHA-256: `9aa730eada63416b0393e00c23c59c2ba55b3867981c267e9b8da6b0b83495ab`
- Dimensi: 851 × 1848 px, RGB PNG.

## `models/tablet-dev.glb` dan `models/laptop-dev.glb`

- Sumber geometri: dibuat oleh proyek melalui `scripts/generate-category-fixtures.py` dengan Blender 5.2.2 LTS; desain generik tanpa referensi merek/perangkat komersial tertentu.
- Hak penggunaan: geometri dan script dibuat untuk repository ini. Keduanya hanya development fixture dan tidak dihitung sebagai model katalog publik.
- Kontrak: glTF 2.0, Y-up, meter, mesh `Screen`, material `ScreenMaterial`, UV layar penuh 0–1, custom property `surfaceId=main-screen`.
- Tablet: body 178 × 250 × 7 mm; layar 162 × 233 mm; GLB 45,520 byte; SHA-256 `8dcea638107fbce9b63c0f5c86ac95e6f717f081cd5e4d99ddc11e08cf02622e`.
- Laptop: body display 302 × 191 mm dan base 304 × 188 mm; layar 280 × 157.5 mm; GLB 83,728 byte; SHA-256 `dedb374cc465da8a5de4f4f97bb302fd88e31384dadb4b6f4b737f97736ec4a5`.
- Asset, hash, ratio, pivot dan UV diperiksa oleh `scripts/check-category-assets.mjs`; framing dan texture dibuktikan di `docs/T4_01_PROOF.md`.

`scripts/sync-fixtures.mjs` menyalin source fixture ini ke
`apps/web/public/fixtures/` saat `predev` dan `prebuild`. Salinan public tersebut
diabaikan Git agar sumber asset hanya ada satu.
