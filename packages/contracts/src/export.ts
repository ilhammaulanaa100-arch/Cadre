import { z } from "zod";
import { sceneDocumentSchema, type SceneDocument } from "./schemas";

export const pngExportIntentSchema = z.object({
  version: z.literal(1),
  scene: sceneDocumentSchema,
  output: z.object({
    format: z.literal("png"),
    width: z.number().int().min(1).max(8192),
    height: z.number().int().min(1).max(8192),
  }).strict(),
}).strict();

export type PngExportIntent = z.infer<typeof pngExportIntentSchema>;

export function createPngExportIntent(scene: SceneDocument, width: number, height: number): PngExportIntent {
  return pngExportIntentSchema.parse({
    version: 1,
    scene,
    output: { format: "png", width, height },
  });
}

// A server job only receives uploaded asset IDs. The browser draft remains intact
// until every local image has been uploaded and the new scene has been validated.
export function resolveUploadedImages(
  scene: SceneDocument,
  uploadedAssetIds: Readonly<Record<string, string>>,
): SceneDocument {
  const resolved = structuredClone(scene);
  for (const instance of resolved.instances) {
    const imageRef = instance.screen.imageRef;
    if (imageRef.kind !== "local") continue;
    const assetId = uploadedAssetIds[imageRef.blobId];
    if (!assetId) throw new Error(`Missing uploaded asset for local image ${imageRef.blobId}`);
    instance.screen.imageRef = { kind: "uploaded", assetId };
  }
  return sceneDocumentSchema.parse(resolved);
}
