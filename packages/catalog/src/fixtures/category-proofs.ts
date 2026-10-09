import { deviceManifestSchema, sceneDocumentSchema } from "@mockup-3d/contracts";
import { iphone17ProMaxSceneFixture } from "./iphone-17-pro-max";

// Generic, project-owned geometry for validating category contracts. These are
// development fixtures; neither is a catalog-ready commercial device.
export const categoryProofs = {
  tablet: {
    deviceId: "tablet-dev",
    displayName: "Generic tablet (development fixture)",
    category: "tablet",
    bounds: { min: [-0.089, -0.125, -0.0042], max: [0.089, 0.125, 0.0042] },
    screenPixels: { width: 1620, height: 2330 },
    sha256: "8dcea638107fbce9b63c0f5c86ac95e6f717f081cd5e4d99ddc11e08cf02622e",
    bytes: 45520,
  },
  laptop: {
    deviceId: "laptop-dev",
    displayName: "Generic laptop (development fixture)",
    category: "laptop",
    bounds: { min: [-0.152, -0.103, -0.004], max: [0.152, 0.096, 0.185] },
    screenPixels: { width: 1600, height: 900 },
    sha256: "dedb374cc465da8a5de4f4f97bb302fd88e31384dadb4b6f4b737f97736ec4a5",
    bytes: 83728,
  },
} as const;

export function categoryProofManifest(category: keyof typeof categoryProofs) {
  const proof = categoryProofs[category];
  return deviceManifestSchema.parse({
    schemaVersion: 1,
    deviceId: proof.deviceId,
    version: "0.1.0",
    displayName: proof.displayName,
    category: proof.category,
    lifecycleStatus: "ready",
    coordinateSystem: "y-up",
    unitMeters: 1,
    frontDirection: [0, 0, 1],
    bounds: proof.bounds,
    screenSurfaces: [{
      surfaceId: "main-screen",
      nodeName: "Screen",
      materialName: "ScreenMaterial",
      aspectRatio: proof.screenPixels.width / proof.screenPixels.height,
    }],
    materialVariants: [{ id: "neutral", label: "Neutral" }],
    compatibleMotionPresetIds: ["none", "turntable"],
    previewAsset: {
      path: `/fixtures/models/${proof.deviceId}.glb`,
      sha256: proof.sha256,
      bytes: proof.bytes,
    },
  });
}

export function categoryProofScene(category: keyof typeof categoryProofs) {
  const manifest = categoryProofManifest(category);
  const base = structuredClone(iphone17ProMaxSceneFixture);
  base.instances[0]!.deviceId = manifest.deviceId;
  base.instances[0]!.deviceVersion = manifest.version;
  base.instances[0]!.materialVariantId = "neutral";
  base.camera = {
    presetId: "category-front",
    projection: "perspective",
    position: category === "tablet" ? [0, 0, 0.53] : [0, 0, 0.95],
    target: category === "tablet" ? [0, 0, 0] : [0, -0.025, 0.08],
    fovDegrees: 32,
  };
  return sceneDocumentSchema.parse(base);
}
