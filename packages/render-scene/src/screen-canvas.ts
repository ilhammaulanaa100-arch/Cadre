import type { SceneDocument } from "@mockup-3d/contracts";

type Screen = SceneDocument["instances"][number]["screen"];

/** Paint the scene's canonical normalized crop into the device's screen texture. */
export function createScreenCanvas(image: CanvasImageSource & { readonly width: number; readonly height: number }, width: number, height: number, screen: Pick<Screen, "cropRect" | "fit" | "paddingColor">): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { colorSpace: "srgb" });
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.fillStyle = screen.paddingColor;
  context.fillRect(0, 0, width, height);
  const crop = screen.cropRect;
  const sx = crop.x * image.width, sy = crop.y * image.height;
  const sw = crop.width * image.width, sh = crop.height * image.height;
  if (screen.fit === "fit") {
    const factor = Math.min(width / sw, height / sh);
    const dw = sw * factor, dh = sh * factor;
    context.drawImage(image, sx, sy, sw, sh, (width - dw) / 2, (height - dh) / 2, dw, dh);
  } else {
    context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  }
  return canvas;
}
