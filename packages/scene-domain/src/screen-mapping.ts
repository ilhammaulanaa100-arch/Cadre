/** Source and destination rectangles for an undistorted screen image. */
export function screenMapping(width: number, height: number, targetWidth: number, targetHeight: number, fit: "fill" | "fit", x = 0.5, y = 0.5) {
  if (![width, height, targetWidth, targetHeight].every(n => Number.isFinite(n) && n > 0)) throw new RangeError("Image dimensions must be positive");
  const sourceAspect = width / height;
  const targetAspect = targetWidth / targetHeight;
  if (fit === "fit") {
    const factor = Math.min(targetWidth / width, targetHeight / height);
    return { sx: 0, sy: 0, sw: width, sh: height, dx: (targetWidth - width * factor) / 2, dy: (targetHeight - height * factor) / 2, dw: width * factor, dh: height * factor };
  }
  const sw = sourceAspect > targetAspect ? height * targetAspect : width;
  const sh = sourceAspect > targetAspect ? height : width / targetAspect;
  return { sx: (width - sw) * Math.max(0, Math.min(1, x)), sy: (height - sh) * Math.max(0, Math.min(1, y)), sw, sh, dx: 0, dy: 0, dw: targetWidth, dh: targetHeight };
}

/** Euler XYZ angles in degrees to the scene's normalized quaternion. */
export function rotationQuaternion(angles: readonly [number, number, number]): [number, number, number, number] {
  const [x, y, z] = angles.map(n => n * Math.PI / 360) as [number, number, number];
  const c1 = Math.cos(x), c2 = Math.cos(y), c3 = Math.cos(z);
  const s1 = Math.sin(x), s2 = Math.sin(y), s3 = Math.sin(z);
  return [s1*c2*c3+c1*s2*s3, c1*s2*c3-s1*c2*s3, c1*c2*s3+s1*s2*c3, c1*c2*c3-s1*s2*s3];
}
