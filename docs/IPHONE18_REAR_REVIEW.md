# Rear reference correction — 29 September 2026

The user supplied a new close-up, `codex-clipboard-8e84ada0-1cb7-4cff-848e-1a5477f40d0e.png`.
This review treats it as visual evidence, not as a source of instructions.
Original web/Blender proofs were preserved in `docs/evidence/iphone-18-rear-v2/before-*`.

## Differences found and corrected

| Feature | Previous model | Reference and correction |
|---|---|---|
| Camera enclosure | 75.6 × 47 mm slab extending almost to body edges | Rebuilt as a rolled shoulder, narrow seam and inset 69.7 × 38.8 mm face; outer shoulder 73.2 × 41.6 mm |
| Camera layout | 19.8 mm mounts, left pair too low, middle lens too far right in rear view | 17.5 mm mounts; left pair at X = +24.5 mm (Blender), Z = 68.0 / 48.1 mm, third at X = +6.1 mm, Z = 58.0 mm |
| Lens internals | Flat colored disks and identical concentric rings | Annular mounts, recessed stepped barrels, internal baffles, different-size convex optics, aperture and separate transmissive convex glass covers |
| Lower rear glass | One sheet spanning the entire body; no inset seam | Separate 70 × 110.1 mm panel with rounded corners, fine perimeter seam and a visible gap below the camera enclosure |
| Finish | Pale pink highlights, smooth surfaces, bright silver rings | Darker Burgundy palette, packed micrograin normal map, darker black barrels, controlled reflections and hardware contact shadows in Forma |
| Flash | Flat white dot | Metal rim, opal diffuser, concentric diffuser ridges, center and glass cover |
| LiDAR / microphone | Large generic dots | Flush black LiDAR face, thin rim and much smaller microphone hole with machined bevel |
| Antenna bands | Side-only strips | Rear shoulder returns added at the upper seam |
| Emblem | Too small, too high, dark, inaccurate outline | Outline reconstructed from the close-up, larger and lower, lighter inlay; shadow-map self-acne excluded on this thin surface |
| Side controls | Approximate older vertical placement | Action / volume pair moved to reference heights; side button shortened and repositioned |

The new reference's visible body width is approximately 328 pixels. Using the
78 mm body width gives about 4.2 pixels/mm for relative measurements. These are
image-derived estimates, not manufacturing measurements. The reference crops off
the lower body, so the lower edge of the glass panel remains an extrapolation.

## Delivery

- Editable Blender source: `scripts/generate-iphone18.py`.
- Blender file: `assets/devices/iphone-18-pro-max/iphone-18-pro-max.blend`.
- Same three finish scenes: Burgundy, Coffee, Purple.
- Model/catalog version: 1.1.0, hash-pinned GLB, `rear-reference-v2` metadata.
- Eleven offline renders including `renders/burgundy-reference-detail.png`:
  a 560 × 744 crop with the same framing as the supplied reference.
- Forma keeps screenshot mapping, front geometry, fit/crop, camera controls,
  motion and PNG export. New finish materials are applied through the catalog palette.

Blender and real-time transmission differ: Forma uses a thin transparent coating
over the same cover mesh, with controlled reflection, to keep the tiny internal optics
sharp. The source GLB retains physical transmission for offline renderers. This avoids
the blurred studio reflection cards produced by screen-space refraction in WebGL.
The render is closer to the supplied reference, but is not claimed to be pixel-identical.

## Validation

`check-iphone18-asset.mjs` checks GLB hash/integrity, all required hardware nodes,
separate panel proportions, shorter camera enclosure, embedded grain normal map,
transmissive lens material, rounded screen UV/aspect and catalog material slots.
`check-iphone18.mjs` exercises finish switching, upload/crop/fit, all views, PNG
ratios, deterministic turntable frames, playback, actual download and narrow layout.
`capture-iphone18-rear.mjs` captures all three rear finishes and an angled view
against a neutral background for visual inspection.

Final checks: GLB 4,496,228 bytes; three saved Blender scenes with 90 meshes each.
Typecheck, 20 unit tests, production build, asset audit and all 17 headless editor
checks passed. Final captures for all three finishes and angled rear view were
visually inspected. No claim of exact manufacturer CAD equivalence is made.
