"use client";

import { categoryProofManifest, iphone18MaterialPalettes, iphone18ProMaxManifest, renderRelease } from "@mockup-3d/catalog";
import { sceneDocumentSchema, type SceneDocument } from "@mockup-3d/contracts";
import { MockupCanvas, canonicalizeImage, createScreenCanvas, type MockupCanvasHandle, type RenderModelInput } from "@mockup-3d/render-scene";
import { useCallback, useRef, useState } from "react";

type RenderInput = {
  scene: SceneDocument;
  images: Record<string, string>;
  rendererRelease: string;
  colorPipeline: string;
  assetHashes: Record<string, string>;
};
type LoadedRender = { scene: SceneDocument; models: RenderModelInput[] };

declare global {
  interface Window {
    __formaRenderSurface?: {
      initialize(input: unknown): Promise<void>;
      renderAt(timeSeconds: number, width: number, height: number): Promise<string>;
      dispose(): void;
    };
  }
}

const manifests = {
  "iphone-18-pro-max": iphone18ProMaxManifest,
  "tablet-dev": categoryProofManifest("tablet"),
  "laptop-dev": categoryProofManifest("laptop"),
} as const;

function decodeImage(src: string): Promise<HTMLImageElement> {
  if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) {
    throw new Error("The render surface accepts only embedded PNG, JPEG, or WebP images");
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode a screenshot"));
    image.src = src;
  });
}

async function loadRender(input: unknown): Promise<LoadedRender> {
  if (!input || typeof input !== "object") throw new Error("Missing render input");
  const payload = input as Partial<RenderInput>;
  if (payload.rendererRelease !== renderRelease.rendererRelease || payload.colorPipeline !== renderRelease.colorPipeline) throw new Error("Renderer/color release mismatch");
  const scene = sceneDocumentSchema.parse(payload.scene);
  if (!payload.images || typeof payload.images !== "object") throw new Error("Missing image map");
  const models = await Promise.all(scene.instances.map(async instance => {
    const manifest = manifests[instance.deviceId as keyof typeof manifests];
    if (!manifest || manifest.version !== instance.deviceVersion || !manifest.previewAsset) throw new Error(`Unsupported device ${instance.deviceId}@${instance.deviceVersion}`);
    const releaseAsset = renderRelease.assets[instance.deviceId as keyof typeof renderRelease.assets];
    if (!releaseAsset || payload.assetHashes?.[instance.deviceId] !== releaseAsset.sha256) throw new Error(`Asset hash mismatch for ${instance.deviceId}`);
    if (manifest.previewAsset.sha256 !== ("previewSha256" in releaseAsset ? releaseAsset.previewSha256 : releaseAsset.sha256)) throw new Error(`Preview asset mismatch for ${instance.deviceId}`);
    if (!manifest.materialVariants.some(variant => variant.id === instance.materialVariantId)) throw new Error(`Unsupported finish ${instance.materialVariantId}`);
    if (instance.screen.surfaceId !== manifest.screenSurfaces[0]?.surfaceId) throw new Error("Unsupported screen surface");
    if (instance.screen.imageRef.kind !== "local") throw new Error("This local proof requires resolved local images");
    const source = payload.images![instance.screen.imageRef.blobId];
    if (!source) throw new Error(`Missing image ${instance.screen.imageRef.blobId}`);
    const canonical = await canonicalizeImage(await (await fetch(source)).blob());
    const image = await decodeImage(await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(canonical);
    }));
    const aspect = manifest.screenSurfaces[0].aspectRatio;
    const width = instance.deviceId === "iphone-18-pro-max" ? 1320 : instance.deviceId === "tablet-dev" ? 1620 : 1600;
    const height = Math.round(width / aspect);
    const canvas = createScreenCanvas(image, width, height, instance.screen);
    return {
      instanceId: instance.instanceId,
      modelUrl: `${"renderPath" in releaseAsset ? releaseAsset.renderPath : manifest.previewAsset.path}?v=${releaseAsset.sha256.slice(0, 12)}`,
      screenNodeName: manifest.screenSurfaces[0].nodeName,
      screenCanvas: canvas,
      materialPalette: instance.deviceId === "iphone-18-pro-max" ? iphone18MaterialPalettes[instance.materialVariantId as keyof typeof iphone18MaterialPalettes] : undefined,
    } satisfies RenderModelInput;
  }));
  return { scene, models };
}

export function RenderSurface() {
  const renderer = useRef<MockupCanvasHandle>(null);
  const loaded = useRef<LoadedRender | null>(null);
  const ready = useRef(false);
  const [view, setView] = useState<LoadedRender | null>(null);
  const [captureScene, setCaptureScene] = useState<SceneDocument | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const handleReady = useCallback(() => { ready.current = true; pending.current?.(); pending.current = null; }, []);

  if (typeof window !== "undefined") {
    window.__formaRenderSurface = {
      async initialize(input) {
        ready.current = false;
        const next = await loadRender(input);
        loaded.current = next;
        setCaptureScene(next.scene);
        setView(next);
        await new Promise<void>((resolve, reject) => {
          const timer = window.setTimeout(() => { pending.current = null; reject(new Error("Renderer asset load timed out")); }, 30000);
          pending.current = () => { window.clearTimeout(timer); resolve(); };
        });
      },
      async renderAt(timeSeconds, width, height) {
        if (!ready.current || !loaded.current || !renderer.current) throw new Error("Renderer is not ready");
        if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > loaded.current.scene.motion.durationSeconds) throw new Error("Invalid frame time");
        if (![width, height].every(value => Number.isInteger(value) && value > 0 && value <= 4096)) throw new Error("Invalid output dimensions");
        const nextScene = { ...loaded.current.scene, frame: { playheadSeconds: timeSeconds } };
        setCaptureScene(nextScene);
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const blob = await renderer.current.capturePng({ width, height });
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      },
      dispose() { ready.current = false; loaded.current = null; setView(null); setCaptureScene(null); },
    };
  }

  return <main style={{ margin: 0, width: "100vw", height: "100vh" }}>
    {view && captureScene && <MockupCanvas document={captureScene} models={view.models} onReady={handleReady} ref={renderer} className="render-surface-canvas" />}
    <style>{`html,body{margin:0;overflow:hidden}.render-surface-canvas,.render-surface-canvas>div{width:100vw;height:100vh}`}</style>
  </main>;
}
