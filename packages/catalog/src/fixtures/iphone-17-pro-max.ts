import {
  deviceManifestSchema,
  sceneDocumentSchema,
  type DeviceManifest,
  type SceneDocument,
} from "@mockup-3d/contracts";

export const iphone17ProMaxManifestFixture: DeviceManifest = deviceManifestSchema.parse({
  schemaVersion: 1,
  deviceId: "iphone-17-pro-max",
  version: "0.1.0",
  displayName: "iPhone 17 Pro Max (metadata fixture)",
  category: "smartphone",
  lifecycleStatus: "ready",
  coordinateSystem: "y-up",
  unitMeters: 1,
  frontDirection: [0, 0, 1],
  bounds: {
    min: [-0.04, -0.085, -0.005],
    max: [0.04, 0.085, 0.005],
  },
  screenSurfaces: [
    {
      surfaceId: "main-screen",
      nodeName: "Screen",
      materialName: "ScreenMaterial",
      aspectRatio: 0.462,
    },
  ],
  materialVariants: [
    { id: "neutral", label: "Original" },
    { id: "silver", label: "Silver" },
    { id: "graphite", label: "Graphite" },
  ],
  compatibleMotionPresetIds: ["none", "turntable"],
  previewAsset: {
    path: "/fixtures/models/iphone-17-pro-max-dev.glb",
    sha256: "7534e52ca53ef8c95a0d883e8d8402a70d4d905f0a0da4e482aba735384ee0c5",
    bytes: 410420,
  },
});

export const iphone17ProMaxFixtureAssets = {
  modelPath: "/fixtures/models/iphone-17-pro-max-dev.glb?v=7534e52c",
  screenshotPath: "/fixtures/screens/dashboard-dark.png",
  screenshotSha256: "9aa730eada63416b0393e00c23c59c2ba55b3867981c267e9b8da6b0b83495ab",
  screenshotDimensions: { width: 851, height: 1848 },
} as const;

export const iphone17ProMaxSceneFixture: SceneDocument = sceneDocumentSchema.parse({
  schemaVersion: 1,
  draftId: "018f47a4-7b5f-7d60-9f52-751d7c29a201",
  revision: 0,
  templateId: "single-device",
  templateVersion: "1.0.0",
  instances: [
    {
      instanceId: "device-primary",
      deviceId: iphone17ProMaxManifestFixture.deviceId,
      deviceVersion: iphone17ProMaxManifestFixture.version,
      materialVariantId: "neutral",
      transform: {
        position: [0, 0, 0],
        quaternion: [0, 0, 0, 1],
        scale: [1, 1, 1],
      },
      screen: {
        surfaceId: "main-screen",
        imageRef: { kind: "local", blobId: "fixture-screen-main" },
        fit: "fill",
        cropRect: { x: 0, y: 0, width: 1, height: 1 },
        paddingColor: "#000000",
      },
    },
  ],
  camera: {
    presetId: "front-three-quarter",
    projection: "perspective",
    position: [0.18, 0.06, 0.32],
    target: [0, 0, 0],
    fovDegrees: 32,
  },
  appearance: {
    background: { kind: "solid", color: "#ececf1" },
    lightingPresetId: "studio-soft",
    lightingPresetVersion: "1.0.0",
    shadow: { presetId: "soft", opacity: 0.45 },
  },
  motion: {
    presetId: "turntable",
    presetVersion: 1,
    durationSeconds: 4,
    amplitudeDegrees: 30,
    direction: "clockwise",
  },
  frame: { playheadSeconds: 0 },
});
