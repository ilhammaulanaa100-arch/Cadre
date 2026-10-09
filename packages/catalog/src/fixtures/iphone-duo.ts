import { deviceManifestSchema } from "@mockup-3d/contracts";
import asset from "../../../../assets/devices/iphone-duo/asset-info.json";

export const iphoneDuoManifest = deviceManifestSchema.parse({
  schemaVersion: 1,
  deviceId: "iphone-duo",
  version: "2.0.0",
  displayName: "iPhone Duo",
  category: "smartphone",
  lifecycleStatus: "ready",
  coordinateSystem: "y-up",
  unitMeters: 1,
  frontDirection: [0, 0, 1],
  bounds: { min: [-0.0823, -0.0589, -0.00565], max: [0.0823, 0.0589, 0.00565] },
  screenSurfaces: [
    { surfaceId: "outer-screen", nodeName: "ScreenOuter", materialName: "ScreenOuterMaterial", aspectRatio: 1398 / 2034 },
    { surfaceId: "inner-screen", nodeName: "ScreenInner", materialName: "ScreenInnerMaterial", aspectRatio: 2670 / 1878 },
  ],
  materialVariants: [
    { id: "night-sky", label: "Night Sky" },
    { id: "star-white", label: "Star White" },
  ],
  compatibleMotionPresetIds: ["none", "turntable"],
  previewAsset: { path: "/devices/iphone-duo/iphone-duo.glb", sha256: asset.sha256, bytes: asset.bytes },
});

export const iphoneDuoAssets = {
  modelPath: `/devices/iphone-duo/iphone-duo.glb?v=${asset.sha256.slice(0, 12)}`,
  outerPixels: { width: 1398, height: 2034 },
  innerPixels: { width: 2670, height: 1878 },
} as const;
