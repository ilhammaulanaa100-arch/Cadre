import { z } from "zod";

const finiteNumber = z.number().finite();
const normalizedNumber = finiteNumber.min(0).max(1);
const versionString = z.string().regex(/^\d+\.\d+\.\d+$/, "Expected a semantic version");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a lowercase slug");

export const vector3Schema = z.tuple([finiteNumber, finiteNumber, finiteNumber]);

export const quaternionSchema = z
  .tuple([finiteNumber, finiteNumber, finiteNumber, finiteNumber])
  .refine(
    ([x, y, zValue, w]) =>
      Math.abs(Math.hypot(x, y, zValue, w) - 1) <= 0.0001,
    "Quaternion must be normalized",
  );

export const transformSchema = z
  .object({
    position: vector3Schema,
    quaternion: quaternionSchema,
    scale: vector3Schema.refine(
      (scale) => scale.every((value) => value > 0),
      "Scale components must be positive",
    ),
  })
  .strict();

export const cropRectSchema = z
  .object({
    x: normalizedNumber,
    y: normalizedNumber,
    width: normalizedNumber.positive(),
    height: normalizedNumber.positive(),
  })
  .strict()
  .refine(
    ({ x, width }) => x + width <= 1,
    "Crop rectangle exceeds the horizontal source bounds",
  )
  .refine(
    ({ y, height }) => y + height <= 1,
    "Crop rectangle exceeds the vertical source bounds",
  );

const localImageRefSchema = z
  .object({
    kind: z.literal("local"),
    blobId: slug,
  })
  .strict();

const uploadedImageRefSchema = z
  .object({
    kind: z.literal("uploaded"),
    assetId: z.uuid(),
  })
  .strict();

export const imageRefSchema = z.discriminatedUnion("kind", [
  localImageRefSchema,
  uploadedImageRefSchema,
]);

export const screenBindingSchema = z
  .object({
    surfaceId: slug,
    imageRef: imageRefSchema,
    fit: z.enum(["fill", "fit"]),
    cropRect: cropRectSchema,
    paddingColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a six-digit hex color"),
  })
  .strict();

export const sceneInstanceSchema = z
  .object({
    instanceId: slug,
    deviceId: slug,
    deviceVersion: versionString,
    materialVariantId: slug,
    transform: transformSchema,
    screen: screenBindingSchema,
    additionalScreens: z.array(screenBindingSchema).max(2).optional(),
    foldAngleDegrees: finiteNumber.min(0).max(180).optional(),
  })
  .strict();

const perspectiveCameraSchema = z
  .object({
    presetId: slug,
    projection: z.literal("perspective"),
    position: vector3Schema,
    target: vector3Schema,
    fovDegrees: finiteNumber.gt(1).lt(179),
  })
  .strict();

const orthographicCameraSchema = z
  .object({
    presetId: slug,
    projection: z.literal("orthographic"),
    position: vector3Schema,
    target: vector3Schema,
    verticalSize: finiteNumber.positive(),
  })
  .strict();

export const cameraSchema = z.discriminatedUnion("projection", [
  perspectiveCameraSchema,
  orthographicCameraSchema,
]);

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a six-digit hex color");

const solidBackgroundSchema = z
  .object({
    kind: z.literal("solid"),
    color: colorSchema,
  })
  .strict();

const gradientBackgroundSchema = z
  .object({
    kind: z.literal("linear-gradient"),
    from: colorSchema,
    to: colorSchema,
    angleDegrees: finiteNumber,
  })
  .strict();

export const backgroundSchema = z.discriminatedUnion("kind", [
  solidBackgroundSchema,
  gradientBackgroundSchema,
]);

export const motionSchema = z
  .object({
    presetId: z.enum(["none", "turntable"]),
    presetVersion: z.literal(1),
    durationSeconds: finiteNumber.positive().max(60),
    amplitudeDegrees: finiteNumber.min(0).max(360),
    direction: z.enum(["clockwise", "counterclockwise"]),
  })
  .strict();

export const sceneDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    draftId: z.uuid(),
    revision: z.number().int().nonnegative(),
    templateId: slug,
    templateVersion: versionString,
    instances: z.array(sceneInstanceSchema).min(1).max(2),
    camera: cameraSchema,
    appearance: z
      .object({
        background: backgroundSchema,
        lightingPresetId: slug,
        lightingPresetVersion: versionString,
        shadow: z.object({ presetId: z.enum(["none", "soft", "spread", "hug"]), opacity: finiteNumber.min(0).max(1), lightPosition: z.tuple([finiteNumber.min(-1).max(1), finiteNumber.min(-1).max(1)]).optional() }).strict().optional(),
      })
      .strict(),
    motion: motionSchema,
    frame: z
      .object({
        playheadSeconds: finiteNumber.nonnegative(),
      })
      .strict(),
  })
  .strict()
  .refine(
    ({ instances }) => new Set(instances.map(({ instanceId }) => instanceId)).size === instances.length,
    { message: "Instance IDs must be unique", path: ["instances"] },
  )
  .refine(
    ({ instances }) => instances.every(({ screen, additionalScreens = [] }) => {
      const surfaces = [screen.surfaceId, ...additionalScreens.map(item => item.surfaceId)];
      return new Set(surfaces).size === surfaces.length;
    }),
    { message: "Screen surface IDs must be unique within an instance", path: ["instances"] },
  )
  .refine(
    ({ frame, motion }) => frame.playheadSeconds <= motion.durationSeconds,
    { message: "Playhead must not exceed motion duration", path: ["frame", "playheadSeconds"] },
  );

const boundsSchema = z
  .object({
    min: vector3Schema,
    max: vector3Schema,
  })
  .strict()
  .refine(
    ({ min, max }) => min.every((value, index) => value < (max[index] ?? value)),
    "Every minimum bound must be less than its maximum",
  );

const previewAssetSchema = z
  .object({
    path: z.string().regex(/^\/[^?#]+$/, "Expected a root-relative asset path"),
    sha256: z.string().regex(/^[0-9a-f]{64}$/, "Expected a lowercase SHA-256 hash"),
    bytes: z.number().int().positive(),
  })
  .strict();

export const deviceManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    deviceId: slug,
    version: versionString,
    displayName: z.string().trim().min(1).max(100),
    category: z.enum(["smartphone", "tablet", "laptop"]),
    lifecycleStatus: z.enum(["draft", "ready", "retired"]),
    coordinateSystem: z.literal("y-up"),
    unitMeters: finiteNumber.positive(),
    frontDirection: vector3Schema.refine(
      (direction) => Math.abs(Math.hypot(...direction) - 1) <= 0.0001,
      "Front direction must be normalized",
    ),
    bounds: boundsSchema,
    screenSurfaces: z
      .array(
        z
          .object({
            surfaceId: slug,
            nodeName: z.string().min(1),
            materialName: z.string().min(1),
            aspectRatio: finiteNumber.positive(),
          })
          .strict(),
      )
      .min(1),
    materialVariants: z
      .array(
        z
          .object({
            id: slug,
            label: z.string().trim().min(1),
          })
          .strict(),
      )
      .min(1),
    compatibleMotionPresetIds: z.array(z.enum(["none", "turntable"])).min(1),
    previewAsset: previewAssetSchema.nullable(),
  })
  .strict()
  .refine(
    ({ lifecycleStatus, previewAsset }) => lifecycleStatus !== "ready" || previewAsset !== null,
    { message: "A ready device requires a preview asset", path: ["previewAsset"] },
  )
  .refine(
    ({ screenSurfaces }) =>
      new Set(screenSurfaces.map(({ surfaceId }) => surfaceId)).size === screenSurfaces.length,
    { message: "Screen surface IDs must be unique", path: ["screenSurfaces"] },
  )
  .refine(
    ({ materialVariants }) =>
      new Set(materialVariants.map(({ id }) => id)).size === materialVariants.length,
    { message: "Material variant IDs must be unique", path: ["materialVariants"] },
  );

export type Vector3 = z.infer<typeof vector3Schema>;
export type Quaternion = z.infer<typeof quaternionSchema>;
export type Transform = z.infer<typeof transformSchema>;
export type SceneInstance = z.infer<typeof sceneInstanceSchema>;
export type SceneDocument = z.infer<typeof sceneDocumentSchema>;
export type DeviceManifest = z.infer<typeof deviceManifestSchema>;
