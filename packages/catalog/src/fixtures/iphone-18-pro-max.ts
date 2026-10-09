import { deviceManifestSchema, sceneDocumentSchema } from "@mockup-3d/contracts";
import { iphone17ProMaxSceneFixture } from "./iphone-17-pro-max";
import asset from "../../../../assets/devices/iphone-18-pro-max/asset-info.json";
import proxy from "../../../../assets/devices/iphone-18-pro-max/proxy-info.json";

export const iphone18Finishes = [
  { id: "burgundy", label: "Burgundy", color: "#63333f" },
  { id: "glacier-blue", label: "Glacier Blue", color: "#8c9eaf" },
  { id: "silver", label: "Silver", color: "#bfc2c4" },
  { id: "black", label: "Black", color: "#292a2c" },
] as const;

export const iphone18ProMaxManifest = deviceManifestSchema.parse({
  schemaVersion: 1,
  deviceId: "iphone-18-pro-max",
  version: "1.2.0",
  displayName: "iPhone 18 Pro Max",
  category: "smartphone",
  lifecycleStatus: "ready",
  coordinateSystem: "y-up",
  unitMeters: 1,
  frontDirection: [0, 0, 1],
  bounds: { min: [-0.0396, -0.0819, -0.0095], max: [0.0396, 0.0819, 0.0053] },
  screenSurfaces: [{ surfaceId: "main-screen", nodeName: "Screen", materialName: "ScreenMaterial", aspectRatio: 1320 / 2868 }],
  materialVariants: iphone18Finishes.map(({ id, label }) => ({ id, label })),
  compatibleMotionPresetIds: ["none", "turntable"],
  previewAsset: { path: "/devices/iphone-18-pro-max/iphone-18-pro-max-proxy.glb", sha256: proxy.sha256, bytes: proxy.bytes },
});

export const iphone18ProMaxAssets = {
  modelPath: `/devices/iphone-18-pro-max/iphone-18-pro-max-proxy.glb?v=${proxy.sha256.slice(0, 12)}`,
  screenshotPath: "/fixtures/screens/dashboard-dark.png",
} as const;

export const iphone18ProMaxScene = sceneDocumentSchema.parse({
  ...iphone17ProMaxSceneFixture,
  instances: [{
    ...iphone17ProMaxSceneFixture.instances[0],
    deviceId: iphone18ProMaxManifest.deviceId,
    deviceVersion: iphone18ProMaxManifest.version,
    materialVariantId: "burgundy",
  }],
});

export const iphone18MaterialPalettes = asset.palettes;
