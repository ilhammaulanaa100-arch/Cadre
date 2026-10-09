/** Decode source orientation and color through the browser, then store sRGB PNG pixels. */
export async function canonicalizeImage(blob: Blob): Promise<Blob> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(blob.type)) throw new Error("Unsupported image format");
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image", colorSpaceConversion: "default" });
  try {
    if (bitmap.width <= 0 || bitmap.height <= 0 || bitmap.width * bitmap.height > 16_000_000) throw new Error("Image exceeds 16 megapixels");
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { colorSpace: "srgb" });
    if (!context) throw new Error("Canvas 2D is unavailable");
    context.drawImage(bitmap, 0, 0);
    const result = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG normalization failed")), "image/png"));
    if (result.size > 64 * 1024 * 1024) throw new Error("Normalized image exceeds 64 MiB");
    return result;
  } finally {
    bitmap.close();
  }
}
