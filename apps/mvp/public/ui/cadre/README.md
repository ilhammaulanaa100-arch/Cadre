# Cadre UI assets

Source: Figma Inspire, file `fXFO5EO3RhzHUZ0Ee5Lu7X`, frame `22:22`.
Retrieved 2026-10-08 using Figma design context. Original SVGs are unmodified.

- `cadre.svg`: header logo, 22:48
- `device-burgundy.png`: original burgundy render used in picker and finish tile
- `transform.svg`, `animate.svg`: bottom editing tools
- `chevron.svg`, `plus-circle.svg`: picker and upload control
- `light-halo.svg`, `sun.svg`: background preview control
- `zoom-line-v.svg`, `zoom-line-h.svg`, `zoom-mask.svg`, `zoom-point.svg`: navigator layers

Fonts in `assets/fonts` are the user's locally installed Timeless Grotesk Regular and Light.
Runtime copies for both applications are maintained by `scripts/sync-fixtures.mjs`.

The three other device finishes use the project's matching device renders. Angle
thumbnails are generated from the working 3D renderer by `scripts/check-cadre-ui.mjs`.
