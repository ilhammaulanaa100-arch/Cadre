import { describe, expect, it } from "vitest";
import { validateDeviceManifest, validateSceneDocument } from "@mockup-3d/contracts";
import { categoryProofManifest, categoryProofScene, categoryProofs } from "../src";

describe.each(["tablet", "laptop"] as const)("%s development fixture", category => {
  it("has a valid, versioned manifest and scene with matching screen dimensions", () => {
    const manifest = categoryProofManifest(category);
    const scene = categoryProofScene(category);
    expect(validateDeviceManifest(manifest).ok).toBe(true);
    expect(validateSceneDocument(scene).ok).toBe(true);
    expect(scene.instances[0]?.deviceId).toBe(manifest.deviceId);
    expect(scene.instances[0]?.deviceVersion).toBe(manifest.version);
    expect(manifest.screenSurfaces[0]?.aspectRatio).toBeCloseTo(
      categoryProofs[category].screenPixels.width / categoryProofs[category].screenPixels.height,
      5,
    );
  });
});
