# Cadre UI implementation

Reference: [Inspire / 22:22](https://www.figma.com/design/fXFO5EO3RhzHUZ0Ee5Lu7X/Inspire?node-id=22-22).

Implemented in the shared editor, used by both web and MVP applications.
The original Timeless Grotesk fonts, logo, and UI vectors are local assets.
At the reference 1440 × 1188 viewport, the header is 64 px, the side panels are
280 px wide at x16 and x1144, and the editable blue artboard is 800 × 450 at x320/y225.
The selected canvas ratio is 16:9 so the actual canvas matches the reference rectangle.

- Header actions and PNG export follow the same rounded neutral surfaces.
- Correct device images for Burgundy, Glacier Blue, Black, and Silver.
- Empty canvas supports upload, paste, drop, and a sample entry point.
- A single active edit tool: drag rotates; Command/Control-drag moves; Shift adds precision.
- Animate opens motion settings and timeline; exporting captures the selected still frame.
- Background controls support solid colors, custom hex values, gradients, and preset colors.
- Angle gallery uses eight renders without visible text, with accessible names/tooltips.
- Screen fit, Details, Detail UI, and permanent canvas footnotes were removed.
- Existing automatic image fitting, project files, and local draft storage remain supported.
- Empty-state persistence is an optional field, compatible with earlier project versions.
- The original blue preview below Shadow links to Background. The Zoom navigator repositions
  the model by pointer or arrow keys; double-click centers it.

Validation: TypeScript (web and MVP), 26 existing unit tests, production MVP build,
and `scripts/check-cadre-ui.mjs`. Browser evidence is in `docs/evidence/cadre`.
Run the browser check with a local web server on port 3000, or set `CADRE_TEST_URL`
to the production MVP static server. It uses a fresh disposable Chrome profile.

Local environment: initial startup was delayed by iCloud placeholder dependencies and
Turbopack caches. Dependency files were hydrated. Old generated caches were backed up
under `/tmp/cadre-next-dev-cache-backup` and `/tmp/cadre-next-mvp-cache-backup`.
Duplicate generated MVP type files were backed up under `/tmp/cadre-generated-type-duplicates`.
