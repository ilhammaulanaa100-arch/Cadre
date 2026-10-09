# iPhone Duo procedural asset proof — 9 October 2026

## Replacement

- `scripts/generate-iphone-duo.py` builds the chassis, camera details, hinge, UVs, two display meshes, and fold morphs from project code. It does not import the prior downloaded viewer files.
- The new GLB is 1,994,168 bytes. Its glTF JSON has `ScreenOuter`, one connected `ScreenInner` with two morph targets, and one animation with left-pivot translation/rotation plus inner-screen weights. The asset hash is recorded in `asset-info.json`.
- Starter plates are copies of the fictional project dashboard fixture. The previous viewer-derived environment map and pre-blurred plates have been removed. Runtime fixture sync clears old Duo output before copying the new asset.
- The old viewer-derived source generator was removed. Raw viewer downloads remain only in the ignored local `reference-source/` directory and are not required by the new generator.

## Visual proof

Blender 5.2.2 regenerated the editable `.blend`, five proof renders, and seven angle thumbnails. `renders/open-front.png` shows the connected open display; `renders/half-open-side.png` shows the screen bending with the chassis; `renders/closed-back.png` shows the exterior. These were inspected after generation. The detail and reflection fidelity is visibly simpler than the previous adaptation.

## Checks

- Vitest: 26 tests passed in 6 files.
- TypeScript checks passed for contracts, scene-domain, catalog, render-scene, web, and MVP.
- Static MVP production build succeeded and generated `/` plus `/_not-found`.
- Runtime static output contains the new GLB, previews, and starter plates; it does not contain the removed environment map or raw viewer downloads.
- Headless Chrome and the connected Chrome session could load the page, but WebGL context creation failed in this Mac session before the preview could initialize. Browser interaction and PNG export were therefore not verified in this revision. The earlier browser proof applies to the previous asset only.

## Remaining check

On a browser with WebGL available, verify closed, midway, and open poses; separate outer/inner uploads; draft reload; and a selected-frame PNG. Inspect the PNG for seams and clipping before publication.
