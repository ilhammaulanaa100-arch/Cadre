# iPhone 18 Pro Max · Forma

Reference reconstruction for screen-design previews. Created with Blender 5.2.2;
90 mesh objects, editable Blender scenes and a self-contained glTF 2 binary.

## Deliverables

- `iphone-18-pro-max.blend`: Burgundy, Glacier Blue, Silver and Black scenes. Meshes and finish materials are editable; the source screenshot is packed.
- `iphone-18-pro-max.glb`: Burgundy base, meters, Y-up, front +Z. Studio lights/cameras are excluded.
- `iphone-18-pro-max-proxy.glb`: browser preview model derived from the full GLB. Embedded normal and sample-screen images are removed; all mesh, transform, UV and screen accessor bytes remain identical.
- `proxy-info.json`: pinned source/proxy hashes and byte count.
- `renders/`: transparent Cycles PNGs, 900 × 1100. Four finishes front/back, plus Burgundy orthographic front/back and button-side views. An additional 560 × 744 detail render matches the framing of the September 29 close-up.
- `asset-info.json`: generated SHA-256, byte count, material palettes and screen dimensions.
- `../../../scripts/generate-iphone18.py`: repeatable Blender source. `../../../scripts/generate-iphone-proxy.mjs` derives the preview model.

## Source and accuracy

Checked September 28, 2026: [Apple technical specifications](https://www.apple.com/iphone-18-pro/specs/)
list 163.4 × 78.0 × 8.75 mm, a 6.9-inch display and 1320 × 2868 pixels.
Checked September 29, 2026: [Apple Indonesia](https://www.apple.com/id/iphone-18-pro/)
lists Burgundi, Biru Gletser, Perak and Hitam. The editor labels these Burgundy,
Glacier Blue, Silver and Black. These replace the earlier Coffee/Purple concepts;
Burgundy is unchanged. Material RGB values are visual estimates, not Apple color specifications.

The three user-supplied reference images disagree about the front camera. This model
follows images 1–2: centered, reduced Dynamic Island; the original color direction from image 3 has been superseded by the official lineup. The punch-hole shown in image 3 is not used.

The body dimensions and screen pixel ratio are source-based. Bezel/corner radii,
13.5 mm island width, lens positions/diameters, camera plateau, button sizes/positions,
antenna seams, grille and logo are visual estimates. No manufacturer CAD or measured
orthographic blueprints were supplied. This is not an exact engineering replica.
The 73 mm screen width is a modeling estimate. Finishes are sampled visually, not
colorimetrically calibrated. The emblem is an authored approximation.

## Forma integration

Forma opens this device by default. `Screen` is a rounded UV-mapped mesh with a
1320:2868 aspect ratio. The screen texture is replaced locally when the user uploads,
drops or pastes a PNG, JPEG or WebP. Dynamic Island/front camera remain physical
occluders over that screenshot. There is no automatic status-bar padding; supply a
full-device screenshot with its own safe area.

The renderer applies the palettes from `asset-info.json` by named material slot:
`FrameMetal`, `BackGlass`, `CameraDeck`, `LensRing`, `AppleInlay`, `PanelSeam`, `AntennaPolymer`. Screen colors remain
unlit, sRGB and untone-mapped in the web preview/export. Blender uses AgX studio
lighting, so offline render highlights will differ from the interactive renderer.

Seven angle presets include straight-on, back, left buttons and right buttons.
All existing crop, fit, background, scale, turntable and PNG-export controls remain
available. Browser drafts remain local and can be restored after reload.

## Rebuild and verify

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/generate-iphone18.py
node scripts/generate-iphone-proxy.mjs
node scripts/sync-fixtures.mjs
node scripts/check-iphone18-asset.mjs
node scripts/check-proxy-asset.mjs
pnpm typecheck
pnpm test
pnpm build
```

With Forma running at `http://localhost:3000`, `node scripts/check-iphone18.mjs`
exercises the editor in a temporary headless Chrome profile and writes PNG evidence into
`docs/evidence/iphone-18/`. macOS must permit Blender Metal initialization and Chrome.
Use `pnpm dev` to start Forma if the local server is not already running.

## Rear revision 1.1.0

The September 29 close-up prompted a rebuild of the camera enclosure, lens
assemblies, flash, rear glass seam, emblem and button placement. See
[`docs/IPHONE18_REAR_REVIEW.md`](../../../docs/IPHONE18_REAR_REVIEW.md) for the
measured comparison and remaining estimation limits. The GLB includes the grain
normal texture and transmissive optical covers used by the real-time renderer.
