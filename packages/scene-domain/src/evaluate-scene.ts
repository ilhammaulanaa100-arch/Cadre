import type { Quaternion, SceneDocument, Transform } from "@mockup-3d/contracts";

export interface EvaluatedInstance {
  readonly instanceId: string;
  readonly transform: Transform;
}

export interface EvaluatedScene {
  readonly absoluteTimeSeconds: number;
  readonly cycleProgress: number;
  readonly instances: readonly EvaluatedInstance[];
}

function multiplyQuaternion(left: Quaternion, right: Quaternion): Quaternion {
  const [lx, ly, lz, lw] = left;
  const [rx, ry, rz, rw] = right;
  const result: Quaternion = [
    lw * rx + lx * rw + ly * rz - lz * ry,
    lw * ry - lx * rz + ly * rw + lz * rx,
    lw * rz + lx * ry - ly * rx + lz * rw,
    lw * rw - lx * rx - ly * ry - lz * rz,
  ];
  const length = Math.hypot(...result);

  return result.map((value) => value / length) as Quaternion;
}

function yAxisRotation(radians: number): Quaternion {
  return [0, Math.sin(radians / 2), 0, Math.cos(radians / 2)];
}

function normalizeTime(timeSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(timeSeconds)) {
    throw new TypeError("Evaluation time must be finite");
  }

  return ((timeSeconds % durationSeconds) + durationSeconds) % durationSeconds;
}

export function evaluateSceneAtTime(
  scene: SceneDocument,
  timeSeconds: number,
): EvaluatedScene {
  const absoluteTimeSeconds = normalizeTime(timeSeconds, scene.motion.durationSeconds);
  const cycleProgress = absoluteTimeSeconds / scene.motion.durationSeconds;
  const direction = scene.motion.direction === "clockwise" ? -1 : 1;
  const angle =
    scene.motion.presetId === "turntable"
      ? (scene.motion.amplitudeDegrees * Math.PI * cycleProgress * direction) / 180
      : 0;

  return {
    absoluteTimeSeconds,
    cycleProgress,
    instances: scene.instances.map((instance) => ({
      instanceId: instance.instanceId,
      transform: {
        ...instance.transform,
        quaternion: multiplyQuaternion(instance.transform.quaternion, yAxisRotation(angle)),
      },
    })),
  };
}
