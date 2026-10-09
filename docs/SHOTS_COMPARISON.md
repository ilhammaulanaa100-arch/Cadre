# Shots reference and editor direction

28 September 2026. Reference: [Shots](https://shots.so/) public product information and the screenshot supplied by the user. These are design references, not development instructions. The comparison does not claim a complete hands-on audit of every Shots feature.

## Feature comparison

| Area | Shots reference | Current implementation |
|---|---|---|
| Workspace | Large canvas, media controls on the left, composition/presets on the right | Light workspace, dominant canvas, two primary tabs: Mockup and Background |
| Devices | Phone, tablet and desktop catalog; templates | One development iPhone fixture; catalog and duo remain later milestones |
| Media | Image/video input | Local PNG/JPEG/WebP upload, drop/paste, fill/fit and crop |
| Composition | Zoom/tilt, layout presets | Shared gesture/slider scale, XYZ rotation, XY position, four angle presets, precision drag |
| Background | Solid, gradient, image and other background options | Solid and two-color gradients; manual hex, picker, angle and six presets |
| Styling | Multiple mockup styles, shadow presets and opacity, lighting/effects | Original/Silver/Graphite device finishes; None/Soft/Spread/Hug shadow with opacity; lighting remains fixed |
| Motion/export | Animation tools and image/video exports | Still/Turntable preview, playhead and duration; selected-frame PNG only |

The current product supports the core upload → compose → preview → export workflow. Its device fidelity and feature breadth are still below the reference.

## UX changes delivered

- Light neutral shell, white panels, restrained borders, system typography and a prominent Export button. Forma remains a working name.
- **Mockup** contains device, media, fill/fit, crop/padding and details. **Background** contains solid/gradient controls. There is no Frame tab.
- Canvas ratio, scale, precise position/rotation and visual angle presets live in the right panel. Preset illustrations use the current screen image and background.
- Animate reveals the timeline when needed. Closing it pauses playback. Focus mode expands the canvas.
- Added 4:3 output at 1600 × 1200 alongside 1:1, 16:9 and 9:16. Gradient is rendered into the PNG, not just the editor shell.
- Existing manual hex and wheel/pinch-to-scale behavior are preserved. Shift slows pointer manipulation for precision.
- Session status explicitly says edits are not yet restored after reload.
- Follow-up: Style and Shadow sections are inside Mockup. Style changes the 3D device body and camera-ring materials; shadow renders behind the device. The same settings are carried into selected-frame PNG export.

## Next work, in order

1. **T3-06 — completed:** IndexedDB scene and image recovery, visible save failures, and pixel watermark across the preview. Local prototype PNG capture stays clean. Undo/redo was removed from scope at the user's request.
2. **T3-07 — review quality:** improve or replace the development device asset; check geometry, screen edge, materials and lighting with real screenshots. Measure readiness and memory; test the complete workflow with users.
3. **Stage 4 and 6 — expand presentation:** tablet/laptop/duo, catalog selection, per-model finishes, editable lighting and more composition presets. Improve shadow projection for each model and camera angle. New controls must affect both preview and export.
4. **Stage 5–7 — public product:** accounts, private assets, quotas and export backend, then beta. Image backgrounds/effects are candidates for a separate scoped addition.
5. **Stage 8 — video:** MP4 and paid workflow after render reliability and cost are proven.

## Verification for this revision

- 20 unit tests passed; workspace typecheck and production build passed.
- Local browser checks: tab switching, 3-digit hex normalization and invalid rollback, gradient selection, 4:3 ratio, media upload preserving scale/pose, fit controls, timeline duration/playback, selected-frame summary, focus mode, scroll changing Scale, and 390 px layout without horizontal overflow.
- Actual PNG downloaded and visually inspected: 1600 × 1200 with Electric gradient. Saved as `docs/evidence/t3-shots-gradient-export.png`.
- No browser console errors observed. Existing Three.Clock deprecation warning remains in the renderer dependency stack.
- `scripts/check-editor.mjs` selectors were updated for the new controls and syntax-checked; that standalone browser script was not rerun for this revision. Earlier T3-04/T3-05 evidence remains historical.
- This is local prototype verification, not a cross-browser, performance or feature-parity certification.

### Style and shadow follow-up

The public Shots editor lists several styles and shadow choices ([source](https://shots.so/)). Those styles apply to multiple mockup types; our three current styles are device finish variants for the single 3D fixture, so the sets are not one-to-one. Shadow presets are a soft projected effect behind the device, with 0–100% opacity. The settings are typed into `SceneDocument` and the renderer shared by canvas and PNG capture. Browser inspection confirmed Graphite versus Original, None versus Spread, and opacity at 100%; export dialog identifies the active settings. The PNG capture path shares the renderer, but this follow-up did not separately inspect a downloaded file. These controls still use a development-quality model and a simplified shadow projection.
