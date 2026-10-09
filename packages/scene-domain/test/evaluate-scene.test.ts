import { sceneDocumentSchema } from "@mockup-3d/contracts";
import { describe, expect, it } from "vitest";

import { evaluateSceneAtTime } from "../src";

const scene = sceneDocumentSchema.parse({
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
    presetId: "front",
    projection: "perspective",
    position: [0, 0, 1],
    target: [0, 0, 0],
    fovDegrees: 32,
  },
  appearance: {
    background: { kind: "solid", color: "#ffffff" },
    lightingPresetId: "studio-soft",
    lightingPresetVersion: "1.0.0",
  },
  motion: {
    presetId: "turntable",
    presetVersion: 1,
    durationSeconds: 4,
    amplitudeDegrees: 360,
    direction: "clockwise",
  },
  frame: { playheadSeconds: 0 },
});

describe("evaluateSceneAtTime", () => {
  it("produces the same result for the same absolute time", () => {
    expect(evaluateSceneAtTime(scene, 1)).toEqual(evaluateSceneAtTime(scene, 1));
  });

  it("wraps time by duration without accumulating frame deltas", () => {
    expect(evaluateSceneAtTime(scene, 1)).toEqual(evaluateSceneAtTime(scene, 5));
    expect(evaluateSceneAtTime(scene, -3)).toEqual(evaluateSceneAtTime(scene, 1));
  });

  it("evaluates the turntable preset from absolute cycle progress", () => {
    const evaluated = evaluateSceneAtTime(scene, 1);
    const quaternion = evaluated.instances[0]?.transform.quaternion;

    expect(evaluated.cycleProgress).toBe(0.25);
    expect(quaternion?.[1]).toBeCloseTo(-Math.SQRT1_2);
    expect(quaternion?.[3]).toBeCloseTo(Math.SQRT1_2);
  });

  it("applies motion relative to the authored base pose", () => {
    const posedScene = structuredClone(scene);
    posedScene.instances[0]!.transform.quaternion = [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)];

    expect(evaluateSceneAtTime(posedScene, 0).instances[0]!.transform.quaternion).toEqual(
      posedScene.instances[0]!.transform.quaternion,
    );
    expect(evaluateSceneAtTime(posedScene, 1).instances[0]!.transform.quaternion).not.toEqual(
      posedScene.instances[0]!.transform.quaternion,
    );
  });

  it("keeps still scenes on their authored pose at every playhead", () => {
    const stillScene = structuredClone(scene);
    stillScene.motion.presetId = "none";

    expect(evaluateSceneAtTime(stillScene, 0).instances).toEqual(
      evaluateSceneAtTime(stillScene, 2.5).instances,
    );
  });

  it("closes the loop exactly at the configured duration", () => {
    expect(evaluateSceneAtTime(scene, 0).instances).toEqual(
      evaluateSceneAtTime(scene, scene.motion.durationSeconds).instances,
    );
  });

  it("does not mutate the source scene", () => {
    const original = structuredClone(scene);
    evaluateSceneAtTime(scene, 2);
    expect(scene).toEqual(original);
  });

  it("keeps two instance identities, positions, and separate base poses through motion", () => {
    const duo = structuredClone(scene);
    duo.templateId = "iphone-duo";
    duo.instances.push(structuredClone(duo.instances[0]!));
    duo.instances[0]!.transform.position = [-0.05, 0, 0];
    duo.instances[1]!.instanceId = "device-secondary";
    duo.instances[1]!.transform.position = [0.05, 0, 0];
    duo.instances[1]!.transform.quaternion = [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)];
    const evaluated = evaluateSceneAtTime(duo, 1);
    expect(evaluated.instances.map(item => item.instanceId)).toEqual(["device-primary", "device-secondary"]);
    expect(evaluated.instances.map(item => item.transform.position)).toEqual([[-0.05, 0, 0], [0.05, 0, 0]]);
    expect(evaluated.instances[0]!.transform.quaternion).not.toEqual(evaluated.instances[1]!.transform.quaternion);
    expect(duo.instances[1]!.transform.quaternion).toEqual([0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)]);
  });

  it("rejects non-finite evaluation time", () => {
    expect(() => evaluateSceneAtTime(scene, Number.NaN)).toThrow(
      "Evaluation time must be finite",
    );
  });
});
