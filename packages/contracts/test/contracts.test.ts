import { describe, expect, it } from "vitest";

import {
  deserializeSceneDocument,
  serializeSceneDocument,
  validateDeviceManifest,
  validateSceneDocument,
} from "../src";

const validScene = {
  schemaVersion: 1,
  draftId: "018f47a4-7b5f-7d60-9f52-751d7c29a201",
  revision: 0,
  templateId: "single-device",
  templateVersion: "1.0.0",
  instances: [
    {
      instanceId: "device-primary",
      deviceId: "iphone-17-pro-max",
      deviceVersion: "0.1.0",
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
  },
  motion: {
    presetId: "turntable",
    presetVersion: 1,
    durationSeconds: 4,
    amplitudeDegrees: 30,
    direction: "clockwise",
  },
  frame: { playheadSeconds: 0 },
} as const;

describe("scene document contract", () => {
  it("accepts a valid scene and round-trips it", () => {
    const validated = validateSceneDocument(validScene);
    expect(validated.ok).toBe(true);

    if (validated.ok) {
      expect(deserializeSceneDocument(serializeSceneDocument(validated.value))).toEqual(validated);
    }
  });

  it("returns safe field errors for an invalid scene", () => {
    const invalid = structuredClone(validScene) as Record<string, unknown>;
    invalid.instances = [
      {
        ...validScene.instances[0],
        screen: {
          ...validScene.instances[0].screen,
          cropRect: { x: 0.8, y: 0, width: 0.4, height: 1 },
        },
      },
    ];

    const result = validateSceneDocument(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SCENE_INVALID");
      expect(result.error.issues[0]?.path).toContain("cropRect");
      expect(JSON.stringify(result)).not.toContain("fixture-screen-main");
    }
  });

  it("keeps shadow and light position in the scene and validates their bounds", () => {
    const scene = structuredClone(validScene) as Record<string, unknown>;
    const appearance = scene.appearance as Record<string, unknown>;
    appearance.shadow = { presetId: "spread", opacity: 0.65, lightPosition: [-0.7, -0.6] };
    const valid = validateSceneDocument(scene);
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(deserializeSceneDocument(serializeSceneDocument(valid.value))).toEqual(valid);

    appearance.shadow = { presetId: "spread", opacity: 1.5 };
    const invalid = validateSceneDocument(scene);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.issues[0]?.path).toContain("shadow");
    appearance.shadow = { presetId: "spread", opacity: 0.65, lightPosition: [1.2, 0] };
    expect(validateSceneDocument(scene).ok).toBe(false);
  });

  it("keeps both foldable screen bindings and bounds the hinge angle", () => {
    const scene = structuredClone(validScene) as Record<string, any>;
    scene.templateId = "foldable-device";
    scene.instances[0].deviceId = "iphone-duo";
    scene.instances[0].screen.surfaceId = "outer-screen";
    scene.instances[0].additionalScreens = [{ ...scene.instances[0].screen, surfaceId: "inner-screen",
      imageRef: { kind: "local", blobId: "inner-design" } }];
    scene.instances[0].foldAngleDegrees = 95;
    const valid = validateSceneDocument(scene);
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(deserializeSceneDocument(serializeSceneDocument(valid.value))).toEqual(valid);
    scene.instances[0].foldAngleDegrees = 181;
    expect(validateSceneDocument(scene).ok).toBe(false);
  });

  it("rejects invalid JSON and unsupported schema versions explicitly", () => {
    const invalidJson = deserializeSceneDocument("{");
    expect(invalidJson.ok).toBe(false);
    if (!invalidJson.ok) {
      expect(invalidJson.error.code).toBe("INVALID_JSON");
    }

    const unsupported = deserializeSceneDocument(
      JSON.stringify({ ...validScene, schemaVersion: 2 }),
    );
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok) {
      expect(unsupported.error.code).toBe("SCENE_VERSION_UNSUPPORTED");
    }
  });
});

describe("device manifest contract", () => {
  it("requires an asset before a device can be ready", () => {
    const result = validateDeviceManifest({
      schemaVersion: 1,
      deviceId: "iphone-17-pro-max",
      version: "0.1.0",
      displayName: "Fixture",
      category: "smartphone",
      lifecycleStatus: "ready",
      coordinateSystem: "y-up",
      unitMeters: 1,
      frontDirection: [0, 0, 1],
      bounds: { min: [-1, -1, -1], max: [1, 1, 1] },
      screenSurfaces: [
        {
          surfaceId: "main-screen",
          nodeName: "Screen",
          materialName: "ScreenMaterial",
          aspectRatio: 0.462,
        },
      ],
      materialVariants: [{ id: "neutral", label: "Neutral" }],
      compatibleMotionPresetIds: ["none"],
      previewAsset: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEVICE_MANIFEST_INVALID");
      expect(result.error.issues[0]?.path).toBe("$.previewAsset");
    }
  });
});
