import { describe, expect, it } from "vitest";
import { createPngExportIntent, resolveUploadedImages, sceneDocumentSchema, type SceneDocument } from "../src";

const fixture = sceneDocumentSchema.parse({
  schemaVersion: 1, draftId: "018f47a4-7b5f-7d60-9f52-751d7c29a201", revision: 0,
  templateId: "single-device", templateVersion: "1.0.0",
  instances: [{
    instanceId: "device-primary", deviceId: "phone", deviceVersion: "1.0.0", materialVariantId: "neutral",
    transform: { position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] },
    screen: { surfaceId: "main-screen", imageRef: { kind: "local", blobId: "screen-main" },
      fit: "fill", cropRect: { x: 0, y: 0, width: 1, height: 1 }, paddingColor: "#000000" },
  }],
  camera: { presetId: "front", projection: "perspective", position: [0, 0, 1], target: [0, 0, 0], fovDegrees: 32 },
  appearance: { background: { kind: "solid", color: "#ffffff" }, lightingPresetId: "studio", lightingPresetVersion: "1.0.0" },
  motion: { presetId: "turntable", presetVersion: 1, durationSeconds: 4, amplitudeDegrees: 30, direction: "clockwise" },
  frame: { playheadSeconds: 0 },
});

describe("dual export contract", () => {
  it("freezes the browser export scene and validates output size", () => {
    const source = structuredClone(fixture);
    const intent = createPngExportIntent(source, 1200, 1200);
    source.frame.playheadSeconds = 2;
    expect(intent.scene.frame.playheadSeconds).not.toBe(2);
    expect(() => createPngExportIntent(source, 0, 1200)).toThrow();
  });

  it("maps a shared local image once without changing the saved draft", () => {
    const draft = structuredClone(fixture) as SceneDocument;
    draft.instances.push({ ...structuredClone(draft.instances[0]!), instanceId: "device-secondary" });
    const original = structuredClone(draft);
    const blobId = draft.instances[0]!.screen.imageRef;
    if (blobId.kind !== "local") throw new Error("Fixture needs a local image");
    const assetId = "018f47a4-7b5f-7d60-9f52-751d7c29a202";
    const resolved = resolveUploadedImages(draft, { [blobId.blobId]: assetId });
    expect(resolved.instances.map(instance => instance.screen.imageRef)).toEqual([
      { kind: "uploaded", assetId },
      { kind: "uploaded", assetId },
    ]);
    expect(draft).toEqual(original);
    expect(() => resolveUploadedImages(draft, {})).toThrow(/Missing uploaded asset/);
    expect(() => resolveUploadedImages(draft, { [blobId.blobId]: "invalid" })).toThrow();
  });
});
