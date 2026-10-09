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
- The first browser attempt could load the page but could not create a WebGL context in the connected Chrome session. A later headless Chrome run on the host with software WebGL completed the current asset check below.

## Browser QA — 9 October 2026

- `FORMA_TEST_PORT=3030 node scripts/check-duo-editor.mjs` passed against a freshly built static MVP served locally. The script now starts from the empty editor, chooses Duo, checks closed/open controls, exports three real 1920 × 1080 PNGs, uploads a different image to the inner screen and exports it, reloads the Duo draft, and switches back to the single iPhone.
- [Open](qa-open-export.png), [seated](qa-seated-export.png), [closed](qa-closed-export.png), and [custom inner screen](qa-custom-inner-export.png) are actual browser downloads, not Blender renders. [Export metadata and hashes](qa-exports.json) confirm distinct outputs. Editor screenshots for the three poses are also saved here.
- Visual inspection found that the initial straight-on seated view showed the back of one half and overly blurred both screens. The editor now angles the camera during the fold, while the screen shader keeps its blur near the crease. The final [seated export](qa-seated-export.png) shows both panels and readable design details. Open and closed exports remain readable, and the custom inner image spans the connected display. A narrow center seam remains visible in the open pose.

## Remaining check

Review the center seam at final visual polish, then test real screenshots and exports on Safari, Firefox, and at least one physical mobile device. A beta user should complete the flow without guidance before public release.
