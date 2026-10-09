import type { z } from "zod";

import {
  deviceManifestSchema,
  sceneDocumentSchema,
  type DeviceManifest,
  type SceneDocument,
} from "./schemas";

export type ContractErrorCode =
  | "DEVICE_MANIFEST_INVALID"
  | "INVALID_JSON"
  | "SCENE_INVALID"
  | "SCENE_VERSION_UNSUPPORTED";

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path: string;
}

export interface ValidationFailure {
  readonly ok: false;
  readonly error: {
    readonly code: ContractErrorCode;
    readonly message: string;
    readonly issues: readonly ValidationIssue[];
  };
}

export interface ValidationSuccess<T> {
  readonly ok: true;
  readonly value: T;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function pathToString(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "$";
  }

  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }

    return `${result}.${String(segment)}`;
  }, "$");
}

function toFailure(
  code: ContractErrorCode,
  message: string,
  issues: readonly z.core.$ZodIssue[],
): ValidationFailure {
  return {
    ok: false,
    error: {
      code,
      message,
      issues: issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: pathToString(issue.path),
      })),
    },
  };
}

export function validateSceneDocument(input: unknown): ValidationResult<SceneDocument> {
  const result = sceneDocumentSchema.safeParse(input);

  return result.success
    ? { ok: true, value: result.data }
    : toFailure("SCENE_INVALID", "Scene document validation failed", result.error.issues);
}

export function validateDeviceManifest(input: unknown): ValidationResult<DeviceManifest> {
  const result = deviceManifestSchema.safeParse(input);

  return result.success
    ? { ok: true, value: result.data }
    : toFailure(
        "DEVICE_MANIFEST_INVALID",
        "Device manifest validation failed",
        result.error.issues,
      );
}

export function deserializeSceneDocument(serialized: string): ValidationResult<SceneDocument> {
  let input: unknown;

  try {
    input = JSON.parse(serialized) as unknown;
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_JSON",
        message: "Scene document is not valid JSON",
        issues: [{ code: "invalid_json", message: "Invalid JSON", path: "$" }],
      },
    };
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "schemaVersion" in input &&
    input.schemaVersion !== 1
  ) {
    return {
      ok: false,
      error: {
        code: "SCENE_VERSION_UNSUPPORTED",
        message: "Scene document schema version is not supported",
        issues: [
          {
            code: "unsupported_version",
            message: "Only scene schema version 1 is supported",
            path: "$.schemaVersion",
          },
        ],
      },
    };
  }

  return validateSceneDocument(input);
}

export function serializeSceneDocument(scene: SceneDocument): string {
  return JSON.stringify(sceneDocumentSchema.parse(scene));
}
