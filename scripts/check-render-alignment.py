from pathlib import Path
from PIL import Image, ImageChops, ImageStat

root = Path(__file__).resolve().parent.parent
evidence = root / "docs/evidence/t4-04"
canonical = Image.open(evidence / "orientation-canonical.png").convert("RGB")
assert canonical.size == (320, 180), "JPEG EXIF orientation was not applied"
expected = [((25, 25), (74, 184, 121)), ((295, 25), (226, 74, 73)), ((25, 155), (240, 192, 68)), ((295, 155), (76, 140, 227))]
for position, reference in expected:
    actual = canonical.getpixel(position)
    assert all(abs(a - b) <= 4 for a, b in zip(actual, reference)), f"Canonical color changed at {position}: {actual}"

for prefix in ["", "orientation-"]:
    preview = Image.open(evidence / ("preview-proxy.png" if not prefix else "orientation-preview.png")).convert("RGB")
    full = Image.open(evidence / ("render-full.png" if not prefix else "orientation-render.png")).convert("RGB")
    assert preview.size == full.size == (1200, 1200)
    difference = ImageChops.difference(preview, full)
    mean_error = sum(ImageStat.Stat(difference).mean) / 3
    assert mean_error < 0.5, f"Proxy/full mismatch for {prefix or 'fixture'}: {mean_error}"
    print(f"{prefix or 'fixture'} mean absolute RGB difference: {mean_error:.4f}/255")
