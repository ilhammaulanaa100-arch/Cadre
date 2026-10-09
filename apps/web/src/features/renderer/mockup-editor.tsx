"use client";

import { categoryProofManifest, categoryProofs, iphone18ProMaxAssets, iphone18ProMaxManifest, iphone18ProMaxScene, iphone18Finishes, iphone18MaterialPalettes, iphoneDuoAssets, iphoneDuoManifest } from "@mockup-3d/catalog";
import { createPngExportIntent, type DeviceManifest, type SceneDocument } from "@mockup-3d/contracts";
import { MockupCanvas, canonicalizeImage, createScreenCanvas, type MockupCanvasHandle, type RenderModelInput } from "@mockup-3d/render-scene";
import { rotationQuaternion, screenMapping } from "@mockup-3d/scene-domain";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode, type SetStateAction } from "react";
import { clearLocalDraft, createProjectFile, loadLocalDraft, readProjectFile, saveLocalDraft, type SavedDraft, type SavedSlot } from "./local-draft";
import { browserPngExporter } from "./png-exporter";

type Angles = [number, number, number];
type Background = SceneDocument["appearance"]["background"];
type ShadowPreset = "none" | "soft" | "spread" | "hug";
const presets: { name: string; angles: Angles; className: string }[] = [
  { name: "Straight on", angles: [0, 0, 0], className: "front" },
  { name: "Perspective", angles: [8, -28, -6], className: "perspective" },
  { name: "Lean back", angles: [24, 18, 12], className: "lean" },
  { name: "Back view", angles: [0, 180, 0], className: "back" },
  { name: "Left buttons", angles: [0, 82, 0], className: "left-side" },
  { name: "Right buttons", angles: [0, -82, 0], className: "right-side" },
  { name: "Floating", angles: [-12, -24, -22], className: "floating" },
  { name: "Landscape", angles: [0, 0, 90], className: "landscape" },
];
const formats = { "1:1": [1200,1200], "4:3": [1600,1200], "16:9": [1920,1080], "9:16": [1080,1920] } as const;
const colors = ["#769cb4", "#ffffff", "#f1efeb", "#e9e7f1", "#dcebe4", "#25262d"];
const gradients = [
  { name: "Daybreak", from: "#f8e4d7", to: "#d4d6f2", angle: 135 },
  { name: "Glacier", from: "#eef4fc", to: "#a7bde0", angle: 155 },
  { name: "Sage", from: "#f0f1da", to: "#a8c4b9", angle: 135 },
  { name: "Rose", from: "#fde8e3", to: "#d6a6c8", angle: 135 },
  { name: "Electric", from: "#ff794f", to: "#8150f4", angle: 135 },
  { name: "Midnight", from: "#444968", to: "#171925", angle: 150 },
];
const styles = [iphone18Finishes[0], iphone18Finishes[1], iphone18Finishes[3], iphone18Finishes[2]];
const shadowPresets: { id: ShadowPreset; label: string }[] = [
  { id: "none", label: "None" },
  { id: "spread", label: "Spread" },
  { id: "hug", label: "Hug" },
];
const clampScale = (value: number) => Math.max(0.4, Math.min(1.6, value));
type DeviceId = "iphone-18-pro-max" | "iphone-duo" | "tablet-dev" | "laptop-dev";
type DeviceStyle = (typeof styles)[number]["id"] | "night-sky" | "star-white" | "neutral";
type SlotState = Omit<SavedSlot, "deviceId" | "deviceStyle"> & { deviceId: DeviceId; deviceStyle: DeviceStyle; image: HTMLImageElement | null; imageBlob: Blob | null };
type Template = "single" | "duo";
const fixtureImageId = "fixture-screen-main";
function defaultSlot(): SlotState {
  return { deviceId: "iphone-18-pro-max", deviceStyle: "burgundy", image: null, imageBlob: null,
    imageName: "Studio sample", imageId: fixtureImageId, angles: [8, -28, -6], position: [0, 0], scale: 1,
    fit: "fill", crop: [0.5, 0.5], padding: "#101116" };
}
function defaultDuoSlot(): SlotState {
  return { ...defaultSlot(), deviceId: "iphone-duo", deviceStyle: "star-white", angles: [0, 0, 0], fit: "fit" };
}
function savedSlot(slot: SlotState): SavedSlot {
  const { image: _image, imageBlob: _imageBlob, ...saved } = slot;
  return saved;
}
const devices: Record<DeviceId, { manifest: DeviceManifest; screenPixels: { width: number; height: number }; modelPath: string }> = {
  "iphone-18-pro-max": { manifest: iphone18ProMaxManifest, screenPixels: { width: 1320, height: 2868 }, modelPath: iphone18ProMaxAssets.modelPath },
  "iphone-duo": { manifest: iphoneDuoManifest, screenPixels: iphoneDuoAssets.outerPixels, modelPath: iphoneDuoAssets.modelPath },
  "tablet-dev": { manifest: categoryProofManifest("tablet"), screenPixels: categoryProofs.tablet.screenPixels, modelPath: `/fixtures/models/tablet-dev.glb?v=${categoryProofs.tablet.sha256.slice(0, 12)}` },
  "laptop-dev": { manifest: categoryProofManifest("laptop"), screenPixels: categoryProofs.laptop.screenPixels, modelPath: `/fixtures/models/laptop-dev.glb?v=${categoryProofs.laptop.sha256.slice(0, 12)}` },
};
const formatTime = (value: number) => value.toFixed(2) + "s";
const backgroundCss = (value: Background) => value.kind === "solid" ? value.color : "linear-gradient(" + value.angleDegrees + "deg," + value.from + "," + value.to + ")";

function parseHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(raw)) return "#" + raw.toLowerCase();
  if (/^[0-9a-f]{3}$/i.test(raw)) return "#" + raw.split("").map(char => char + char).join("").toLowerCase();
  return null;
}

function Icon({ name, size = 18 }: { name: "upload" | "export" | "rotate" | "move" | "reset" | "expand" | "play" | "pause" | "layers" | "close" | "chevron"; size?: number }) {
  const paths = {
    upload: "M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4",
    export: "M12 15V3m-5 5 5-5 5 5M4 15v6h16v-6",
    rotate: "M20 10a8 8 0 1 0-2 8M20 4v6h-6",
    move: "M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4",
    reset: "M4 9a8 8 0 1 1 2 10M4 3v6h6",
    expand: "M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5",
    play: "m8 5 11 7-11 7Z",
    pause: "M8 5v14M16 5v14",
    layers: "m12 3 9 5-9 5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
    close: "m6 6 12 12M6 18 18 6",
    chevron: "m6 9 6 6 6-6",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState(value.toUpperCase());
  const cancel = useRef(false);
  const original = useRef(value);
  useEffect(() => setDraft(value.toUpperCase()), [value]);
  function commit() {
    if (cancel.current) { cancel.current = false; return; }
    const parsed = parseHex(draft);
    if (parsed) onChange(parsed);
    setDraft((parsed ?? value).toUpperCase());
  }
  return <div className="color-field">
    <label className="color-chip" style={{ background: value }}><input type="color" aria-label={label + " picker"} value={value} onChange={event => onChange(event.target.value)} /></label>
    <input aria-label={label} className="hex-input" value={draft} maxLength={7} spellCheck={false}
      onFocus={() => { original.current = value; }}
      onChange={event => {
        const text = event.target.value.toUpperCase(); setDraft(text);
        if (/^#?[0-9A-F]{6}$/.test(text)) onChange(parseHex(text)!);
      }}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") { cancel.current = true; onChange(original.current); setDraft(original.current.toUpperCase()); event.currentTarget.blur(); }
      }}
    /><span className="color-format">HEX</span>
  </div>;
}

function Slider({ label, value, min, max, unit = "", step = 1, onChange }: { label: string; value: number; min: number; max: number; unit?: string; step?: number; onChange: (value: number) => void }) {
  return <label className="slider-field" style={{ "--progress": ((value - min) / (max - min) * 100) + "%" } as CSSProperties}><span>{label}<output>{Math.round(value * 10) / 10}{unit}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}

class RendererBoundary extends Component<{ children: ReactNode; onFailure: () => void; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <div className="canvas-error" role="alert"><p>Preview 3D gagal dimuat.</p><button onClick={this.props.onRetry}>Coba lagi</button></div> : this.props.children; }
}

function storageErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Penyimpanan browser penuh. Unduh Save project, kosongkan ruang browser, lalu pilih Retry save.";
  }
  return error instanceof Error ? error.message : "Draft could not be saved.";
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gambar tidak bisa dibaca. Coba PNG, JPEG, atau WebP lain."));
    image.src = url;
  });
}

function suggestedScreenFit(image: HTMLImageElement, screenAspect: number): "fill" | "fit" {
  return Math.abs(image.naturalWidth / image.naturalHeight / screenAspect - 1) > 0.03 ? "fit" : "fill";
}

function suggestedPaddingColor(image: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = 48; canvas.height = 48;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  try {
    context.drawImage(image, 0, 0, 48, 48);
    const pixels = context.getImageData(0, 0, 48, 48).data;
    const locations = [5, 13, 24, 35, 43].flatMap(y => [[0, y], [47, y]]);
    const samples = locations.map(([x, y]) => Array.from(pixels.slice((y! * 48 + x!) * 4, (y! * 48 + x!) * 4 + 3)));
    const median = [0, 1, 2].map(channel => samples.map(sample => sample[channel]!).sort((a, b) => a - b)[4]!);
    if (samples.some(sample => sample.some((value, channel) => Math.abs(value - median[channel]!) > 20))) return null;
    return "#" + median.map(value => value.toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}

declare global { interface Window { __mockup3dCaptureProof?: () => Promise<string>; } }

export function MockupEditor() {
  const renderer = useRef<MockupCanvasHandle>(null);
  const editorRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const backgroundPreviewRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const settingsScroll = useRef<HTMLDivElement>(null);
  const mockupPicker = useRef<HTMLDetailsElement>(null);
  const exportDialog = useRef<HTMLDialogElement>(null);
  const [stageSize, setStageSize] = useState({ width: 480, height: 480 });
  const [tab, setTab] = useState<"mockup" | "background">("mockup");
  const [focusMode, setFocusMode] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const [commandHeld, setCommandHeld] = useState(false);
  const [template, setTemplate] = useState<Template>("single");
  const [mockupChoice, setMockupChoice] = useState<SavedDraft["mockupChoice"]>("iphone-18-pro-max");
  const [selectedIndex, setSelectedIndex] = useState<0 | 1>(0);
  const [singleSlot, setSingleSlot] = useState<SlotState>(defaultSlot);
  const [duoSlots, setDuoSlots] = useState<[SlotState, SlotState]>(() => [defaultSlot(), defaultSlot()]);
  const [duoOuterSlot, setDuoOuterSlot] = useState<SlotState>(defaultDuoSlot);
  const [duoInnerSlot, setDuoInnerSlot] = useState<SlotState>(defaultDuoSlot);
  const [duoFoldAngle, setDuoFoldAngle] = useState(180);
  const [isFolding, setIsFolding] = useState(false);
  const foldAnimation = useRef<number | null>(null);
  function stopFold() {
    if (foldAnimation.current !== null) cancelAnimationFrame(foldAnimation.current);
    foldAnimation.current = null;
    setIsFolding(false);
  }
  function changeFold(value: number) { stopFold(); setDuoFoldAngle(value); }
  function animateFold(target: number, replay = false) {
    stopFold();
    const from = replay ? 0 : duoFoldAngle;
    if (replay) setDuoFoldAngle(0);
    const durationMs = replay ? 2200 : Math.max(450, Math.abs(target - from) * 9);
    const started = performance.now();
    setIsFolding(true);
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      const eased = t * t * (3 - 2 * t);
      setDuoFoldAngle(t === 1 ? target : Math.round((from + (target - from) * eased) * 100) / 100);
      if (t < 1) foldAnimation.current = requestAnimationFrame(tick);
      else { foldAnimation.current = null; setIsFolding(false); }
    };
    foldAnimation.current = requestAnimationFrame(tick);
  }
  useEffect(() => () => { if (foldAnimation.current !== null) cancelAnimationFrame(foldAnimation.current); }, []);
  const [duoInitialized, setDuoInitialized] = useState(false);
  const activeSlot = mockupChoice === "iphone-duo" ? (selectedIndex === 0 ? duoOuterSlot : duoInnerSlot) : template === "single" ? singleSlot : duoSlots[selectedIndex];
  const { image, imageBlob, imageName, imageId, fit, crop, padding, deviceId } = activeSlot;
  const { angles, position, scale, deviceStyle } = mockupChoice === "iphone-duo" ? duoOuterSlot : activeSlot;
  function updateSlot<K extends keyof SlotState>(key: K, action: SetStateAction<SlotState[K]>) {
    const mutate = (slot: SlotState): SlotState => ({ ...slot, [key]: typeof action === "function" ? (action as (value: SlotState[K]) => SlotState[K])(slot[key]) : action });
    if (mockupChoice === "iphone-duo") (selectedIndex === 0 ? setDuoOuterSlot : setDuoInnerSlot)(mutate);
    else if (template === "single") setSingleSlot(mutate);
    else setDuoSlots(current => current.map((slot, index) => index === selectedIndex ? mutate(slot) : slot) as [SlotState, SlotState]);
  }
  const setImage = (value: SetStateAction<SlotState["image"]>) => updateSlot("image", value);
  const setImageBlob = (value: SetStateAction<SlotState["imageBlob"]>) => updateSlot("imageBlob", value);
  const setImageName = (value: SetStateAction<SlotState["imageName"]>) => updateSlot("imageName", value);
  const setImageId = (value: SetStateAction<SlotState["imageId"]>) => updateSlot("imageId", value);
  const setAngles = (value: SetStateAction<SlotState["angles"]>) => mockupChoice === "iphone-duo" ? setDuoOuterSlot(slot => ({ ...slot, angles: typeof value === "function" ? value(slot.angles) : value })) : updateSlot("angles", value);
  const setPosition = (value: SetStateAction<SlotState["position"]>) => mockupChoice === "iphone-duo" ? setDuoOuterSlot(slot => ({ ...slot, position: typeof value === "function" ? value(slot.position) : value })) : updateSlot("position", value);
  const setScale = (value: SetStateAction<SlotState["scale"]>) => mockupChoice === "iphone-duo" ? setDuoOuterSlot(slot => ({ ...slot, scale: typeof value === "function" ? value(slot.scale) : value })) : updateSlot("scale", value);
  const setFit = (value: SetStateAction<SlotState["fit"]>) => updateSlot("fit", value);
  const setCrop = (value: SetStateAction<SlotState["crop"]>) => updateSlot("crop", value);
  const setPadding = (value: SetStateAction<SlotState["padding"]>) => updateSlot("padding", value);
  const setDeviceStyle = (value: SetStateAction<SlotState["deviceStyle"]>) => mockupChoice === "iphone-duo" ? setDuoOuterSlot(slot => ({ ...slot, deviceStyle: typeof value === "function" ? value(slot.deviceStyle) : value })) : updateSlot("deviceStyle", value);
  const [shadowPreset, setShadowPreset] = useState<ShadowPreset>("none");
  const [shadowOpacity, setShadowOpacity] = useState(55);
  const [lightPosition, setLightPosition] = useState<[number, number]>([-0.55, -0.55]);
  const lightDrag = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const previewDirty = useRef(true);
  const [backgroundPreviewImage, setBackgroundPreviewImage] = useState("");
  const [background, setBackground] = useState<Background>({ kind: "solid", color: "#769cb4" });
  const [format, setFormat] = useState<keyof typeof formats>("16:9");
  const [motionPreset, setMotionPreset] = useState<"none" | "turntable">("none");
  const [duration, setDuration] = useState(4);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [message, setMessage] = useState("");
  const [previewFailure, setPreviewFailure] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [copyMenu, setCopyMenu] = useState<{ x: number; y: number } | null>(null);
  const [draftStatus, setDraftStatus] = useState<"loading" | "saving" | "saved" | "error">("loading");
  const [draftError, setDraftError] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const importingProject = useRef(false);
  const uploadSequence = useRef(0);
  const playheadRef = useRef(0);
  const drag = useRef<{ x: number; y: number; angles: Angles; position: [number, number] } | null>(null);
  const [width, height] = formats[format];
  const device = devices[deviceId];
  const { width: screenWidth, height: screenHeight } = mockupChoice === "iphone-duo" && selectedIndex === 1 ? iphoneDuoAssets.innerPixels : device.screenPixels;
  const boardWidth = Math.min(stageSize.width, stageSize.height * width / height);
  const handleReady = useCallback(() => setReady(true), []);
  function retryPreview() { setReady(false); setPreviewFailure(false); setRenderAttempt(attempt => attempt + 1); }
  const backdrop = backgroundCss(background);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { setCommandHeld(event.metaKey || event.ctrlKey); if (event.key === "Escape" && !document.fullscreenElement) setFocusMode(false); };
    const onBlur = () => { setCommandHeld(false); drag.current = null; };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", onBlur);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); window.removeEventListener("blur", onBlur); };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const closePicker = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mockupPicker.current?.open) mockupPicker.current.open = false;
    };
    document.addEventListener("keydown", closePicker);
    return () => document.removeEventListener("keydown", closePicker);
  }, []);

  useEffect(() => {
    if (!isPlaying || motionPreset === "none") return;
    const startedAt = performance.now() - playheadRef.current * 1000;
    let frame = 0;
    const tick = (now: number) => {
      playheadRef.current = ((now - startedAt) / 1000) % duration;
      setPlayhead(playheadRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, isPlaying, motionPreset]);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const saved = await loadLocalDraft();
        if (!active) return;
        const fallback = await decodeImage(iphone18ProMaxAssets.screenshotPath);
        const decodedById: Record<string, HTMLImageElement> = { [fixtureImageId]: fallback };
        if (saved) for (const [id, blob] of Object.entries(saved.imageBlobs)) {
          const url = URL.createObjectURL(blob);
          try { decodedById[id] = await decodeImage(url); }
          finally { URL.revokeObjectURL(url); }
        }
        if (!active || uploadSequence.current !== 0) return;
        if (saved) {
          const { draft, imageBlobs } = saved;
          setCanvasEmpty(draft.canvasEmpty ?? false);
          const hydrate = (slot: SavedSlot): SlotState => ({ ...slot, deviceId: slot.deviceId as DeviceId, deviceStyle: slot.deviceStyle as DeviceStyle,
            image: decodedById[slot.imageId] ?? fallback, imageBlob: imageBlobs[slot.imageId] ?? null });
          setSingleSlot(hydrate(draft.singleSlot));
          setDuoSlots([hydrate(draft.duoSlots[0]), hydrate(draft.duoSlots[1])]);
          setDuoOuterSlot(draft.duoOuterSlot ? hydrate(draft.duoOuterSlot) : { ...defaultDuoSlot(), image: fallback });
          setDuoInnerSlot(draft.duoInnerSlot ? hydrate(draft.duoInnerSlot) : { ...defaultDuoSlot(), image: fallback });
          setDuoFoldAngle(draft.duoFoldAngle ?? 180);
          setTemplate(draft.template);
          setMockupChoice(draft.mockupChoice);
          setSelectedIndex(draft.selectedIndex);
          setDuoInitialized(draft.duoInitialized);
          setShadowPreset(draft.scene.appearance.shadow?.presetId === "soft" ? "spread" : draft.scene.appearance.shadow?.presetId ?? "none");
          setShadowOpacity((draft.scene.appearance.shadow?.opacity ?? 0.45) * 100);
          setLightPosition(draft.scene.appearance.shadow?.lightPosition ?? [-0.55, -0.55]);
          setBackground(draft.scene.appearance.background);
          setFormat(draft.format);
          setMotionPreset(draft.scene.motion.presetId);
          setDuration(draft.scene.motion.durationSeconds);
          playheadRef.current = draft.scene.frame.playheadSeconds;
          setPlayhead(playheadRef.current);
          setMessage("Your local draft was restored.");
        } else {
          setSingleSlot(slot => ({ ...slot, image: fallback }));
          setDuoSlots(slots => slots.map(slot => ({ ...slot, image: fallback })) as [SlotState, SlotState]);
          setDuoOuterSlot(slot => ({ ...slot, image: fallback }));
          setDuoInnerSlot(slot => ({ ...slot, image: fallback }));
        }
        setDraftStatus("saved");
        setAutosaveEnabled(true);
      } catch (err) {
        if (!active || uploadSequence.current !== 0) return;
        const detail = err instanceof Error ? err.message : "Local draft could not be opened.";
        setDraftError(detail);
        setDraftStatus("error");
        try { const fallback = await decodeImage(iphone18ProMaxAssets.screenshotPath); setSingleSlot(slot => ({ ...slot, image: fallback })); setDuoSlots(slots => slots.map(slot => ({ ...slot, image: fallback })) as [SlotState, SlotState]); setDuoOuterSlot(slot => ({ ...slot, image: fallback })); setDuoInnerSlot(slot => ({ ...slot, image: fallback })); }
        catch (imageError) { setError(imageError instanceof Error ? imageError.message : "Sample image could not be loaded."); }
      } finally { if (active) setDraftLoaded(true); }
    }
    void restore();
    return () => { active = false; };
  }, []);

  // A native non-passive listener keeps trackpad pinch inside the editor.
  useEffect(() => {
    const board = artboardRef.current;
    if (!board) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setIsPlaying(false);
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? board.clientHeight : 1);
      setScale(current => clampScale(current * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002))));
    };
    board.addEventListener("wheel", wheel, { passive: false });
    return () => board.removeEventListener("wheel", wheel);
  }, [mockupChoice, template, selectedIndex]);

  const visibleSlots = useMemo(() => mockupChoice === "iphone-duo" ? [duoOuterSlot] : template === "single" ? [singleSlot] : duoSlots, [mockupChoice, duoOuterSlot, template, singleSlot, duoSlots]);
  const screenSlots = useMemo(() => mockupChoice === "iphone-duo" ? [duoOuterSlot, duoInnerSlot] : visibleSlots, [mockupChoice, duoOuterSlot, duoInnerSlot, visibleSlots]);
  const primaryScreenSlot = screenSlots[0];
  const secondaryScreenSlot = screenSlots[1];
  const screenEntries = useMemo(() => screenSlots.map((slot, index) => {
    if (!slot.image) return null;
    const pixels = mockupChoice === "iphone-duo" && index === 1 ? iphoneDuoAssets.innerPixels : devices[slot.deviceId].screenPixels;
    const mapping = screenMapping(slot.image.naturalWidth, slot.image.naturalHeight, pixels.width, pixels.height, slot.fit, ...slot.crop);
    const canvas = createScreenCanvas(slot.image, pixels.width, pixels.height, {
      fit: slot.fit, paddingColor: slot.padding,
      cropRect: { x: mapping.sx / slot.image.naturalWidth, y: mapping.sy / slot.image.naturalHeight,
        width: mapping.sw / slot.image.naturalWidth, height: mapping.sh / slot.image.naturalHeight },
    });
    return { mapping, canvas };
  }), [mockupChoice,
    primaryScreenSlot?.image, primaryScreenSlot?.deviceId, primaryScreenSlot?.fit, primaryScreenSlot?.padding, primaryScreenSlot?.crop[0], primaryScreenSlot?.crop[1],
    secondaryScreenSlot?.image, secondaryScreenSlot?.deviceId, secondaryScreenSlot?.fit, secondaryScreenSlot?.padding, secondaryScreenSlot?.crop[0], secondaryScreenSlot?.crop[1]]);
  const mapping = screenEntries[mockupChoice === "iphone-duo" || template === "duo" ? selectedIndex : 0]?.mapping ?? null;
  const screenCanvas = screenEntries[mockupChoice === "iphone-duo" || template === "duo" ? selectedIndex : 0]?.canvas ?? null;
  const thumbnail = useMemo(() => {
    if (!screenCanvas) return "";
    const canvas = document.createElement("canvas"); canvas.width = 138; canvas.height = Math.round(138 * screenHeight / screenWidth);
    canvas.getContext("2d")!.drawImage(screenCanvas, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
  }, [screenCanvas, screenWidth, screenHeight]);

  const scene = useMemo<SceneDocument>(() => {
    const base = structuredClone(iphone18ProMaxScene);
    const foldReveal = Math.sin(duoFoldAngle * Math.PI / 180);
    base.motion = { ...base.motion, presetId: motionPreset, durationSeconds: duration, amplitudeDegrees: motionPreset === "turntable" ? 360 : 0 };
    base.frame.playheadSeconds = playhead;
    base.templateId = mockupChoice === "iphone-duo" ? "foldable-device" : template === "duo" ? "iphone-duo" : "single-device";
    base.camera = { presetId: "editor-front", projection: "perspective", position: mockupChoice === "iphone-duo" ? [0.29 * foldReveal, 0, 0.28 + 0.08 * Math.sin(duoFoldAngle * Math.PI / 360) - 0.17 * foldReveal] : template === "duo" ? [0, 0, 0.43] : deviceId === "iphone-18-pro-max" ? [0, 0, 0.36] : deviceId === "tablet-dev" ? [0, 0, 0.53] : [0, 0, 0.95], target: deviceId === "laptop-dev" && template === "single" ? [0, -0.025, 0.08] : [0, 0, 0], fovDegrees: 32 };
    base.appearance.background = background;
    base.appearance.shadow = template === "duo" ? { presetId: "none", opacity: 0, lightPosition } : { presetId: shadowPreset, opacity: shadowOpacity / 100, lightPosition };
    base.instances = visibleSlots.map((slot, index) => {
      const instance = structuredClone(base.instances[0]!);
      const entry = screenEntries[index];
      const duoOffset = template === "duo" ? (index === 0 ? -0.05 : 0.05) : 0;
      const duoScale = template === "duo" ? 0.78 : 1;
      instance.instanceId = index === 0 ? "device-primary" : "device-secondary";
      instance.deviceId = slot.deviceId;
      instance.deviceVersion = devices[slot.deviceId].manifest.version;
      instance.materialVariantId = slot.deviceStyle;
      instance.transform = { position: [slot.position[0] / 1000 + duoOffset, slot.position[1] / 1000, index === 0 && template === "duo" ? -0.004 : 0], quaternion: rotationQuaternion(slot.angles), scale: [slot.scale * duoScale, slot.scale * duoScale, slot.scale * duoScale] };
      instance.screen.imageRef = { kind: "local", blobId: slot.imageId };
      instance.screen.fit = slot.fit; instance.screen.paddingColor = slot.padding;
      if (slot.image && entry) instance.screen.cropRect = { x: entry.mapping.sx / slot.image.naturalWidth, y: entry.mapping.sy / slot.image.naturalHeight, width: entry.mapping.sw / slot.image.naturalWidth, height: entry.mapping.sh / slot.image.naturalHeight };
      if (mockupChoice === "iphone-duo") {
        instance.screen.surfaceId = "outer-screen";
        instance.foldAngleDegrees = duoFoldAngle;
        const inner = screenEntries[1];
        instance.additionalScreens = [{ surfaceId: "inner-screen", imageRef: { kind: "local", blobId: duoInnerSlot.imageId }, fit: duoInnerSlot.fit,
          paddingColor: duoInnerSlot.padding,
          cropRect: duoInnerSlot.image && inner ? { x: inner.mapping.sx / duoInnerSlot.image.naturalWidth, y: inner.mapping.sy / duoInnerSlot.image.naturalHeight,
            width: inner.mapping.sw / duoInnerSlot.image.naturalWidth, height: inner.mapping.sh / duoInnerSlot.image.naturalHeight } : { x: 0, y: 0, width: 1, height: 1 } }];
      }
      return instance;
    });
    return base;
  }, [visibleSlots, screenEntries, template, mockupChoice, duoFoldAngle, duoInnerSlot, background, deviceId, shadowPreset, shadowOpacity, lightPosition, duration, motionPreset, playhead]);
  function currentDraft(): SavedDraft {
    return { version: 3, canvasEmpty, scene, template, mockupChoice, selectedIndex: template === "single" && mockupChoice !== "iphone-duo" ? 0 : selectedIndex,
      singleSlot: savedSlot(singleSlot), duoSlots: duoSlots.map(savedSlot) as [SavedSlot, SavedSlot],
      duoOuterSlot: savedSlot(duoOuterSlot),
      duoInnerSlot: savedSlot(duoInnerSlot),
      duoFoldAngle,
      duoInitialized, imageName, angles, crop, format };
  }
  function currentImageBlobs(): Record<string, Blob> {
    const blobs: Record<string, Blob> = {};
    for (const slot of [singleSlot, ...duoSlots, duoOuterSlot, duoInnerSlot]) if (slot.imageBlob) blobs[slot.imageId] = slot.imageBlob;
    return blobs;
  }
  function saveCurrentDraft(isCurrent: () => boolean = () => true) {
    setDraftStatus("saving");
    const draft = currentDraft();
    const imageBlobs = currentImageBlobs();
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => saveLocalDraft(draft, imageBlobs));
    void saveQueue.current.then(() => {
      if (isCurrent()) { setDraftStatus("saved"); setDraftError(""); }
    }).catch(err => {
      if (isCurrent()) { setDraftStatus("error"); setDraftError(storageErrorMessage(err)); }
    });
  }
  const duoScreenBindings = useMemo(() => screenEntries[1] ? { ScreenInner: screenEntries[1].canvas } : undefined, [screenEntries]);
  const renderModels = useMemo<RenderModelInput[]>(() => visibleSlots.flatMap((slot, index): RenderModelInput[] => {
    const entry = screenEntries[index];
    if (!entry) return [];
    const source = devices[slot.deviceId];
    if (mockupChoice === "iphone-duo") {
      const inner = screenEntries[1];
      if (!inner) return [];
      return [{ instanceId: "device-primary", modelUrl: source.modelPath, screenNodeName: "ScreenOuter", screenCanvas: entry.canvas,
        additionalScreenCanvases: duoScreenBindings, foldAngleDegrees: duoFoldAngle }];
    }
    return [{ instanceId: index === 0 ? "device-primary" : "device-secondary", modelUrl: source.modelPath,
      screenNodeName: source.manifest.screenSurfaces[0]!.nodeName, screenCanvas: entry.canvas,
      materialPalette: slot.deviceId === "iphone-18-pro-max" ? iphone18MaterialPalettes[slot.deviceStyle as keyof typeof iphone18MaterialPalettes] : undefined }];
  }), [visibleSlots, screenEntries, mockupChoice, duoFoldAngle, duoScreenBindings]);

  useEffect(() => { previewDirty.current = true; }, [scene, renderModels]);
  useEffect(() => {
    if (canvasEmpty || !ready || previewFailure || renderModels.length !== visibleSlots.length) return;
    let cancelled = false;
    let capturing = false;
    previewDirty.current = true;
    const refresh = async () => {
      if (!previewDirty.current || capturing || !renderer.current) return;
      previewDirty.current = false;
      capturing = true;
      try {
        const blob = await renderer.current.capturePng({ width: 320, height: Math.round(320 * height / width) });
        if (!cancelled) setBackgroundPreviewImage(URL.createObjectURL(blob));
      } catch { /* The main canvas remains usable if the small preview fails. */ }
      finally { capturing = false; }
    };
    // Throttle captures instead of debouncing: the shadow stays live during a drag.
    const interval = window.setInterval(() => { void refresh(); }, 80);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [canvasEmpty, ready, previewFailure, width, height, renderModels.length, visibleSlots.length]);
  useEffect(() => () => { if (backgroundPreviewImage) URL.revokeObjectURL(backgroundPreviewImage); }, [backgroundPreviewImage]);

  useEffect(() => {
    if (!draftLoaded || !autosaveEnabled || screenSlots.some(slot => !slot.image) || isPlaying || isFolding) return;
    let current = true;
    setDraftStatus("saving");
    const timer = window.setTimeout(() => {
      if (importingProject.current) return;
      saveCurrentDraft(() => current);
    }, 600);
    return () => { current = false; window.clearTimeout(timer); };
  }, [draftLoaded, autosaveEnabled, scene, template, mockupChoice, selectedIndex, singleSlot, duoSlots, duoInitialized, imageName, angles, crop, format, isPlaying, isFolding, visibleSlots, canvasEmpty]);

  async function downloadProject() {
    setProjectBusy(true); setError(""); setMessage("");
    try {
      const file = await createProjectFile(currentDraft(), currentImageBlobs());
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "forma-project-" + new Date().toISOString().slice(0, 10) + ".forma.json";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Project file downloaded with its images. Keep it somewhere safe.");
    } catch (err) { setError(err instanceof Error ? err.message : "Project backup failed."); }
    finally { setProjectBusy(false); }
  }

  async function importProject(file?: File) {
    if (!file) return;
    setProjectBusy(true); setError(""); setMessage("");
    try {
      const imported = await readProjectFile(file);
      for (const blob of Object.values(imported.imageBlobs)) {
        const url = URL.createObjectURL(blob);
        try {
          const image = await decodeImage(url);
          if (image.naturalWidth * image.naturalHeight > 16000000) throw new Error("A project image exceeds 16 megapixels.");
        } finally { URL.revokeObjectURL(url); }
      }
      if (!window.confirm("Replace the current local draft with this project? Download a backup first if you want to keep it.")) return;
      importingProject.current = true;
      setAutosaveEnabled(false);
      await saveQueue.current.catch(() => {});
      await saveLocalDraft(imported.draft, imported.imageBlobs);
      window.location.reload();
    } catch (err) {
      if (importingProject.current) { importingProject.current = false; setAutosaveEnabled(true); }
      setError(err instanceof Error ? err.message : "Project import failed. Your current draft is unchanged.");
    } finally { setProjectBusy(false); }
  }

  const capture = useCallback(async () => {
    if (!renderer.current || !ready) throw new Error("Preview belum siap.");
    return renderer.current.capturePng({ width, height });
  }, [ready, width, height]);
  async function copyImage() {
    setCopyMenu(null);
    setError("");
    if (!renderer.current || !ready) { setError("Tunggu sampai preview siap."); return; }
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setError("Browser ini tidak mendukung copy gambar. Gunakan Export PNG.");
      return;
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": renderer.current.capturePng({ width, height, watermark: true }) })]);
      setMessage("Watermarked PNG copied to clipboard.");
    } catch {
      setError("Gagal menyalin gambar. Izinkan akses clipboard atau gunakan Export PNG.");
    }
  }
  useEffect(() => {
    window.__mockup3dCaptureProof = async () => {
      const blob = await capture();
      return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
    };
    return () => { delete window.__mockup3dCaptureProof; };
  }, [capture]);

  async function useDuoReferenceScreens() {
    const sequence = ++uploadSequence.current;
    setUploading(true); setError("");
    try {
      const screens = await Promise.all((["outer", "inner"] as const).map(async name => {
        const response = await fetch(`/devices/iphone-duo/textures/reference-${name}.png`);
        if (!response.ok) throw new Error("Reference screen could not be loaded");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        try { return { image: await decodeImage(url), imageBlob: blob, imageId: "screen-" + crypto.randomUUID(), imageName: `Reference ${name} display` }; }
        finally { URL.revokeObjectURL(url); }
      }));
      if (sequence !== uploadSequence.current) return;
      setDuoOuterSlot(slot => ({ ...slot, ...screens[0]!, fit: "fill", crop: [0.5, 0.5] }));
      setDuoInnerSlot(slot => ({ ...slot, ...screens[1]!, fit: "fill", crop: [0.5, 0.5] }));
      setMessage("Reference screens applied. Both displays can still use your own designs.");
    } catch (err) { if (sequence === uploadSequence.current) setError(err instanceof Error ? err.message : "Could not load reference screens"); }
    finally { if (sequence === uploadSequence.current) setUploading(false); }
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!draftLoaded) { setError("Tunggu sampai draft lokal selesai diperiksa."); return; }
    setIsPlaying(false); setError(""); setMessage(""); setUploading(false);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Gunakan gambar PNG, JPEG, atau WebP."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("Ukuran file maksimal 15 MB."); return; }
    const sequence = ++uploadSequence.current;
    setUploading(true);
    let url: string | null = null;
    try {
      const canonical = await canonicalizeImage(file);
      url = URL.createObjectURL(canonical);
      const decoded = await decodeImage(url);
      if (sequence !== uploadSequence.current) return;
      if (decoded.naturalWidth * decoded.naturalHeight > 16000000) throw new Error("Gambar maksimal 16 megapixel.");
      const suggestedFit = suggestedScreenFit(decoded, screenWidth / screenHeight);
      const suggestedPadding = suggestedFit === "fit" ? suggestedPaddingColor(decoded) : null;
      setCanvasEmpty(false); setReady(false); setImage(decoded); setImageBlob(canonical); setImageName(file.name); setImageId("screen-" + crypto.randomUUID()); setCrop([0.5, 0.5]);
      setFit(suggestedFit);
      setPadding(suggestedPadding ?? "#101116");
      setDraftLoaded(true); setAutosaveEnabled(true);
      setMessage(suggestedFit === "fit" ? "Image added. Your full design is visible." : decoded.naturalWidth < 924 ? "Image added. A higher resolution will give a sharper export." : "Image added. Your composition is preserved.");
    } catch (err) { if (sequence === uploadSequence.current) setError(err instanceof Error ? err.message : "Upload gagal."); }
    finally { if (url) URL.revokeObjectURL(url); if (sequence === uploadSequence.current) setUploading(false); }
  }
  async function download() {
    setBusy(true); setError(""); setExportError("");
    try {
      const intent = createPngExportIntent(scene, width, height);
      const result = await browserPngExporter((exportWidth, exportHeight) => {
        if (!renderer.current || !ready) throw new Error("Preview belum siap.");
        return renderer.current.capturePng({ width: exportWidth, height: exportHeight });
      }).submit(intent);
      if (result.kind !== "ready") throw new Error("Export queued without a download handler.");
      const { blob } = result;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "mockup-" + width + "x" + height + ".png"; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      exportDialog.current?.close(); setMessage("PNG exported. Make something else?");
    } catch {
      setExportError("PNG gagal dibuat. Draft tetap aman. Coba lagi; jika berulang, gunakan ukuran lain atau Retry preview.");
    }
    finally { setBusy(false); }
  }
  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
    const precision = event.shiftKey ? 0.2 : 1;
    if (!event.metaKey && !event.ctrlKey) setAngles([Math.max(-85, Math.min(85, drag.current.angles[0] + dy * 0.4 * precision)), Math.max(-180, Math.min(180, drag.current.angles[1] + dx * 0.4 * precision)), drag.current.angles[2]]);
    else {
      const units = 2 * 360 * Math.tan(16 * Math.PI / 180) / event.currentTarget.clientHeight * precision;
      setPosition([Math.max(-100, Math.min(100, drag.current.position[0] + dx * units)), Math.max(-100, Math.min(100, drag.current.position[1] - dy * units))]);
    }
  }
  function setPlayheadValue(value: number) { playheadRef.current = Math.max(0, Math.min(duration, value)); setPlayhead(playheadRef.current); }
  function resetPose() { setIsPlaying(false); setAngles([0, 0, 0]); setPosition([0, 0]); setScale(1); setPlayheadValue(0); }
  function selectPreset(preset: typeof presets[number]) { setIsPlaying(false); setPlayheadValue(0); setAngles([...preset.angles]); }
  function selectTab(next: typeof tab) { setTab(next); if (settingsScroll.current) settingsScroll.current.scrollTop = 0; }
  function selectTemplate(next: Template) {
    if (next === template) return;
    setIsPlaying(false);
    setReady(false);
    if (next === "duo" && !duoInitialized) {
      const first: SlotState = { ...singleSlot, deviceId: "iphone-18-pro-max", deviceStyle: "burgundy",
        fit: singleSlot.image ? suggestedScreenFit(singleSlot.image, 1320 / 2868) : "fill",
        angles: [6, -18, -4], position: [0, 0], scale: 1 };
      setDuoSlots([first, { ...first, angles: [6, 18, 4] }]);
      setDuoInitialized(true);
    }
    setTemplate(next);
    setSelectedIndex(0);
    setMessage(next === "duo" ? "Duo template ready. Select a device to give it a separate image and crop." : "Single template restored.");
  }
  function chooseMockup(next: "iphone-18-pro-max" | "iphone-duo") {
    stopFold();
    setCanvasEmpty(false);
    if (mockupPicker.current) mockupPicker.current.open = false;
    if (next === mockupChoice) return;
    setIsPlaying(false);
    setReady(false);
    setMockupChoice(next);
    if (next === "iphone-duo" && duoOuterSlot.imageId === fixtureImageId && duoInnerSlot.imageId === fixtureImageId) void useDuoReferenceScreens();
    if (template !== "single") setTemplate("single");
    setSelectedIndex(0);
    if (next === "iphone-18-pro-max" && singleSlot.deviceId !== "iphone-18-pro-max") {
      setSingleSlot(slot => ({ ...slot, deviceId: "iphone-18-pro-max", deviceStyle: "burgundy",
        angles: [8, -28, -6], fit: slot.image ? suggestedScreenFit(slot.image, 1320 / 2868) : "fill", crop: [0.5, 0.5] }));
      setShadowPreset("soft");
    }
    setMessage(next === "iphone-duo" ? "iPhone Duo siap. Atur sudut lipat dan desain layar luar/dalam." : "iPhone 18 Pro Max dipilih.");
  }
  function presetImage(className: string) {
    if (mockupChoice === "iphone-duo") return "/devices/iphone-duo/previews/" + (className === "landscape" ? "front" : className) + ".png";
    return "/devices/iphone-18-pro-max/previews/" + className + ".png";
  }
  async function useSample() {
    setError("");
    try {
      const sample = await decodeImage(iphone18ProMaxAssets.screenshotPath);
      setImage(sample); setImageBlob(null); setImageId(fixtureImageId); setImageName("Studio sample"); setCrop([0.5, 0.5]);
      setCanvasEmpty(false); setReady(false);
    } catch { setError("The sample could not be loaded. Try uploading your own design."); }
  }
  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (editorRef.current?.requestFullscreen) {
      try { await editorRef.current.requestFullscreen(); setFocusMode(true); }
      catch { setFocusMode(value => !value); }
    } else setFocusMode(value => !value);
  }
  useEffect(() => {
    const onFullscreen = () => setFocusMode(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);
  function openAnimation() { setAnimateOpen(true); setIsPlaying(false); }
  function leaveAnimation() { setAnimateOpen(false); setIsPlaying(false); }
  function moveFromNavigator(event: PointerEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setIsPlaying(false);
    setPosition([Math.max(-100, Math.min(100, (event.clientX - box.left - box.width / 2) / box.width * 200)), Math.max(-100, Math.min(100, -(event.clientY - box.top - box.height / 2) / box.height * 200))]);
  }
  function moveLight(event: PointerEvent<HTMLButtonElement>) {
    const preview = backgroundPreviewRef.current;
    const drag = lightDrag.current;
    if (!preview || !drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const box = preview.getBoundingClientRect();
    const inset = event.currentTarget.offsetWidth / 2 + 4;
    const x = Math.max(-1, Math.min(1, (event.clientX - drag.offsetX - box.left - preview.clientLeft - inset) / Math.max(1, preview.clientWidth - inset * 2) * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - drag.offsetY - box.top - preview.clientTop - inset) / Math.max(1, preview.clientHeight - inset * 2) * 2 - 1));
    setIsPlaying(false);
    setLightPosition([x, y]);
  }
  function startLightDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    const box = event.currentTarget.getBoundingClientRect();
    lightDrag.current = { pointerId: event.pointerId, offsetX: event.clientX - box.left - box.width / 2, offsetY: event.clientY - box.top - box.height / 2 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPlaying(false);
  }
  function endLightDrag(event: PointerEvent<HTMLButtonElement>) {
    if (lightDrag.current?.pointerId !== event.pointerId) return;
    lightDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <section ref={editorRef} className={"editor" + (focusMode ? " editor--focus" : "") + (animateOpen ? " editor--animate" : "")} aria-label="3D mockup editor"
    onPaste={event => {
      if (event.target instanceof HTMLElement && event.target.closest("input,textarea,[contenteditable=true]")) return;
      const file = Array.from(event.clipboardData.items).find(item => item.type.startsWith("image/"))?.getAsFile();
      if (file) { event.preventDefault(); void upload(file); }
    }}>
    <header className="topbar">
      <div className="brand"><img src="/ui/cadre/cadre.svg" alt="Cadre" /></div>
      <div className="header-actions"><button onClick={resetPose} title="Reset position, angle and scale"><Icon name="reset" /><span>Reset</span></button><button disabled={!draftLoaded || projectBusy || uploading} onClick={() => void downloadProject()} title="Download project and images"><Icon name="export" /><span>Save</span></button><button disabled={!draftLoaded || projectBusy || uploading} onClick={() => projectInput.current?.click()} title="Open a saved project"><Icon name="upload" /><span>Open</span></button><button className="icon-button" aria-label={focusMode ? "Exit full screen" : "Full screen"} aria-pressed={focusMode} onClick={() => void toggleFullscreen()}><Icon name="expand" /></button></div>
      <button className="export-button" data-testid="export" disabled={canvasEmpty || !ready || uploading} onClick={() => { setIsPlaying(false); setExportError(""); exportDialog.current?.showModal(); }}><Icon name="export" /><span>Export</span><small>PNG</small></button>
    </header>

    <aside className="library panel">
      <div className="editor-tabs" role="tablist" aria-label="Editor settings">
        {(["mockup", "background"] as const).map((item, index) => <button key={item} id={item + "-tab"} role="tab" aria-selected={tab === item} aria-controls={item + "-panel"} tabIndex={tab === item ? 0 : -1} onClick={() => selectTab(item)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "mockup" : event.key === "End" ? "background" : index === 0 ? "background" : "mockup";
          selectTab(next); document.getElementById(next + "-tab")?.focus();
        }}>{item === "mockup" ? "Mockup" : "Background"}</button>)}
      </div>
      <div className="panel-scroll" ref={settingsScroll}>
        <div id="mockup-panel" role="tabpanel" aria-labelledby="mockup-tab" hidden={tab !== "mockup"}>
          <details className="mockup-picker" ref={mockupPicker}>
            <summary className="device-card"><img className="device-card-image" src={mockupChoice === "iphone-duo" ? "/devices/iphone-duo/previews/back.png" : "/ui/cadre/device-burgundy.png"} alt="" /><span className="device-card-copy"><strong>{mockupChoice === "iphone-duo" ? "iPhone Duo" : mockupChoice === "legacy-two-phone" ? "Two-phone project" : "Iphone 18 ProMax"}</strong></span><img src="/ui/cadre/chevron.svg" alt="" /></summary>
            <div className="mockup-options" role="group" aria-label="Choose mockup">
              {(["iphone-18-pro-max", "iphone-duo"] as const).map(option => <button key={option} type="button" aria-pressed={mockupChoice === option} onClick={() => chooseMockup(option)}><span className={"device-mini" + (option === "iphone-duo" ? " device-mini--fold" : "")}><i /></span><span><strong>{option === "iphone-18-pro-max" ? "iPhone 18 Pro Max" : "iPhone Duo"}</strong><small>{option === "iphone-18-pro-max" ? "Single device" : "One foldable device"}</small></span><span className="mockup-option-check">{mockupChoice === option ? "✓" : ""}</span></button>)}
            </div>
          </details>
          {mockupChoice === "iphone-duo" && <><section className="control-section"><h2>iPhone Duo</h2><div className="segmented instance-picker" aria-label="Duo screen selection"><button aria-label="Outer screen" aria-pressed={selectedIndex === 0} onClick={() => setSelectedIndex(0)}>Outer screen</button><button aria-label="Inner screen" aria-pressed={selectedIndex === 1} onClick={() => setSelectedIndex(1)}>Inner screen</button></div><Slider label="Fold angle" value={duoFoldAngle} min={0} max={180} unit="°" onChange={changeFold} /><div className="segmented"><button onClick={() => animateFold(0)}>Closed</button><button onClick={() => animateFold(95)}>Seated</button><button onClick={() => animateFold(180)}>Open</button></div><div className="duo-fold-actions"><button className="text-button" aria-label={isFolding ? "Pause fold animation" : "Play opening animation"} onClick={() => isFolding ? stopFold() : animateFold(180, true)}>{isFolding ? "Pause opening" : "Play opening"}</button><button className="text-button" disabled={uploading} onClick={() => void useDuoReferenceScreens()}>Use reference screens</button></div></section><section className="control-section"><h2>Finish</h2><div className="segmented"><button aria-pressed={deviceStyle === "night-sky"} onClick={() => setDeviceStyle("night-sky")}>Night Sky</button><button aria-pressed={deviceStyle === "star-white"} onClick={() => setDeviceStyle("star-white")}>Star White</button></div></section></>}
          {mockupChoice === "legacy-two-phone" && <section className="control-section"><h2>Legacy composition</h2><div className="segmented instance-picker" aria-label="Legacy device selection"><button aria-label="Device 1" aria-pressed={selectedIndex === 0} onClick={() => setSelectedIndex(0)}>Device 1</button><button aria-label="Device 2" aria-pressed={selectedIndex === 1} onClick={() => setSelectedIndex(1)}>Device 2</button></div></section>}
          <section className="control-section media-section"><div className="section-heading"><h2>Media</h2>{!canvasEmpty && <button className="text-button" aria-label="Clear canvas" onClick={() => { setCanvasEmpty(true); setReady(false); setIsPlaying(false); setAnimateOpen(false); }}>Remove</button>}</div>
            <button className="upload-card" disabled={uploading || !draftLoaded} onClick={() => fileInput.current?.click()}
              onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(event.dataTransfer.files[0]); }}>
              <span className="media-tile">{!canvasEmpty && thumbnail ? <img src={thumbnail} className="media-thumbnail" alt="Current screen design" /> : <img src="/ui/cadre/plus-circle.svg" alt="" />}</span>
              <small>{uploading ? "Adding your media…" : "Drop media or choose to upload"}</small>
            </button>
            <input ref={fileInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
          </section>
          {deviceId === iphone18ProMaxManifest.deviceId && <section className="control-section"><h2>Style</h2><div className="finish-grid">{styles.map(style => <button key={style.id} className="finish-option" aria-label={style.label + " device style"} aria-pressed={deviceStyle === style.id} onClick={() => { setIsPlaying(false); setDeviceStyle(style.id); }}><span className="finish-preview"><img src={style.id === "burgundy" ? "/ui/cadre/device-burgundy.png" : "/devices/iphone-18-pro-max/renders/" + style.id + "-back.png"} alt="" /></span><span>{style.label}</span></button>)}</div></section>}
          {template === "single" && deviceId === iphone18ProMaxManifest.deviceId && <section className="control-section"><h2>Shadow</h2><div className="shadow-grid">{shadowPresets.map(preset => <button key={preset.id} className={"shadow-option shadow-" + preset.id} aria-label={preset.label + " shadow"} aria-pressed={shadowPreset === preset.id} onClick={() => { setIsPlaying(false); setShadowPreset(preset.id); }}><span className="shadow-preview"><i /></span><span>{preset.label}</span></button>)}</div><Slider label="Opacity" value={shadowOpacity} min={0} max={100} unit="%" onChange={value => { setIsPlaying(false); setShadowOpacity(value); }} /></section>}
          <div className="background-preview" ref={backgroundPreviewRef} style={{ background: backdrop, aspectRatio: `${width} / ${height}` }} aria-label="Canvas and light direction preview">
            {!canvasEmpty && backgroundPreviewImage && <img className="background-preview-image" src={backgroundPreviewImage} alt="Current mockup and shadow" draggable={false} />}
            <button type="button" className="sun-marker"
              style={{ left: `calc(20px + (100% - 40px) * ${(lightPosition[0] + 1) / 2})`, top: `calc(20px + (100% - 40px) * ${(lightPosition[1] + 1) / 2})` }}
              aria-label="Light position. Drag to change shadow direction" title="Drag to change light direction" draggable={false}
              onDragStart={event => event.preventDefault()} onPointerDown={startLightDrag} onPointerMove={moveLight}
              onPointerUp={endLightDrag} onPointerCancel={endLightDrag} onLostPointerCapture={endLightDrag}
              onKeyDown={event => {
                const offsets: Record<string, [number, number]> = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] };
                const offset = offsets[event.key];
                if (offset) {
                  event.preventDefault();
                  setIsPlaying(false);
                  setLightPosition(([x, y]) => [Math.max(-1, Math.min(1, x + offset[0])), Math.max(-1, Math.min(1, y + offset[1]))]);
                }
              }}><img className="sun-icon" src="/ui/cadre/sun.svg" alt="" draggable={false} /></button>
          </div>
        </div>
        <div id="background-panel" role="tabpanel" aria-labelledby="background-tab" hidden={tab !== "background"}>
          <section className="control-section first-section"><h2>Background</h2><div className="segmented">
            <button aria-pressed={background.kind === "solid"} onClick={() => setBackground({ kind: "solid", color: background.kind === "solid" ? background.color : background.from })}>Solid</button>
            <button aria-pressed={background.kind === "linear-gradient"} onClick={() => setBackground(background.kind === "linear-gradient" ? background : { kind: "linear-gradient", from: background.color, to: "#d4d6f2", angleDegrees: 135 })}>Gradient</button>
          </div>
          {background.kind === "solid" ? <><div className="color-control"><span>Color</span><ColorField label="Background hex color" value={background.color} onChange={color => setBackground({ kind: "solid", color })} /></div><div className="swatches">{colors.map(color => <button key={color} style={{ background: color }} aria-label={"Background " + color} aria-pressed={background.color === color} onClick={() => setBackground({ kind: "solid", color })}>{background.color === color ? "✓" : ""}</button>)}</div></>
            : <><div className="color-control"><span>From</span><ColorField label="Gradient start color" value={background.from} onChange={from => setBackground({ ...background, from })} /></div><div className="color-control"><span>To</span><ColorField label="Gradient end color" value={background.to} onChange={to => setBackground({ ...background, to })} /></div><Slider label="Gradient angle" value={background.angleDegrees} min={0} max={360} unit="°" onChange={angleDegrees => setBackground({ ...background, angleDegrees })} /></>}
          </section>
          <section className="control-section"><h2>Color stories</h2><div className="gradient-grid">{gradients.map(gradient => <button className="gradient-preset" key={gradient.name} aria-label={"Apply " + gradient.name + " background"} onClick={() => setBackground({ kind: "linear-gradient", from: gradient.from, to: gradient.to, angleDegrees: gradient.angle })}><span style={{ background: "linear-gradient(" + gradient.angle + "deg," + gradient.from + "," + gradient.to + ")" }} /><small>{gradient.name}</small></button>)}</div></section>
          <p className="panel-note">Your background is included in the PNG.</p>
        </div>
      </div>
      <div className={"local-status local-status--" + draftStatus} aria-live="polite"><span />Local draft <small>{draftStatus === "loading" ? "Checking saved work…" : draftStatus === "saving" ? "Saving…" : draftStatus === "saved" ? "Saved in this browser" : "Save unavailable"}</small></div>
      {draftStatus === "error" && <div className="draft-error" role="alert"><p>{draftError}</p>{autosaveEnabled ? <button onClick={() => saveCurrentDraft()}>Retry save</button> : <button onClick={() => { void clearLocalDraft().then(() => { setAutosaveEnabled(true); setDraftError(""); setDraftStatus("saving"); }).catch(err => setDraftError(storageErrorMessage(err))); }}>Start a new local draft</button>}</div>}
    </aside>

    <div className="workspace">
      <div className="stage" ref={stageRef} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(event.dataTransfer.files[0]); }}>
        <div className={"artboard" + (commandHeld ? " artboard--move" : "")} ref={artboardRef} style={{ width: boardWidth, height: boardWidth * height / width, background: backdrop }}
          onPointerDown={event => { setCopyMenu(null); if (event.button !== 0 || canvasEmpty || animateOpen) return; setIsPlaying(false); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, angles: [...angles], position: [...position] }; }}
          onPointerMove={movePointer} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
          onContextMenu={event => { event.preventDefault(); const bounds = event.currentTarget.closest(".workspace")!.getBoundingClientRect(); setCopyMenu({ x: event.clientX - bounds.left, y: event.clientY - bounds.top }); }}
          onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") { event.preventDefault(); void copyImage(); } }}
          tabIndex={0}
          aria-label="Mockup canvas. Drag to rotate. Hold Command or Control and drag to move. Pinch to scale.">
          {canvasEmpty ? <div className="canvas-empty"><span className="empty-art"><Icon name="layers" size={32} /></span><h1>Your next perspective.</h1><p>Drop your design to bring it to life.</p><button disabled={!draftLoaded || uploading} onPointerDown={event => event.stopPropagation()} onClick={() => fileInput.current?.click()}><Icon name="upload" size={16} />Upload media</button><button className="sample-button" disabled={!draftLoaded} onPointerDown={event => event.stopPropagation()} onClick={() => void useSample()}>Try with a sample</button></div> : renderModels.length === visibleSlots.length ? (previewFailure ? <div className="canvas-error" role="alert"><p>Koneksi grafis terputus. Draft tetap aman.</p><button onClick={retryPreview}>Retry preview</button></div> : <RendererBoundary key={renderAttempt} onFailure={() => setReady(false)} onRetry={retryPreview}><MockupCanvas className="render-canvas" document={scene} models={renderModels} onReady={handleReady} onContextLost={() => { setReady(false); setPreviewFailure(true); }} ref={renderer} /></RendererBoundary>) : <div className="canvas-loading">Preparing your studio…</div>}
        </div>
      </div>
      {copyMenu && <div className="canvas-copy-menu" style={{ left: copyMenu.x, top: copyMenu.y }}><button onClick={() => void copyImage()} disabled={!ready}>Copy image with watermark</button></div>}
      <div className="canvas-bottom"><div className="canvas-toolbar" aria-label="Canvas tools"><button className="transform-button" aria-label="Edit mockup: drag to rotate, Command-drag to move" title="Drag to rotate · ⌘ / Ctrl + drag to move" aria-pressed={!animateOpen} onClick={leaveAnimation}><img src="/ui/cadre/transform.svg" alt="" /></button><button className="animate-button" disabled={canvasEmpty} aria-pressed={animateOpen} aria-expanded={animateOpen} aria-controls="motion-timeline" onClick={openAnimation}><img src="/ui/cadre/animate.svg" alt="" />Animate</button></div></div>
      <section id="motion-timeline" className="timeline" aria-label="Motion timeline" hidden={!animateOpen}>
        <div className="motion-picker segmented"><button aria-pressed={motionPreset === "none"} onClick={() => { setIsPlaying(false); setMotionPreset("none"); setPlayheadValue(0); }}>Still</button><button aria-pressed={motionPreset === "turntable"} onClick={() => { setIsPlaying(false); setMotionPreset("turntable"); }}>Turntable</button></div>
        <button className="play-button" aria-label={isPlaying ? "Pause animation" : "Play animation"} disabled={!ready || motionPreset === "none"} onClick={() => { if (!isPlaying && playhead >= duration) setPlayheadValue(0); setIsPlaying(!isPlaying); }}><Icon name={isPlaying ? "pause" : "play"} size={16} /></button>
        <output className="timecode" aria-label="Current playhead">{formatTime(playhead)}</output>
        <input className="timeline-scrubber" aria-label="Timeline playhead" type="range" min={0} max={duration} step={0.01} disabled={motionPreset === "none"} value={playhead} onChange={event => { setIsPlaying(false); setPlayheadValue(Number(event.target.value)); }} />
        <label className="duration-field"><span>Duration</span><select aria-label="Motion duration" value={duration} onChange={event => { const next = Number(event.target.value); setIsPlaying(false); setDuration(next); playheadRef.current = Math.min(playheadRef.current, next); setPlayhead(playheadRef.current); }}>{[2, 3, 4, 5, 6, 8, 10].map(value => <option key={value} value={value}>{value}s</option>)}</select></label>
      </section>
      <div className="feedback" aria-live="polite">{error ? <p role="alert" className="error">{error}</p> : message ? <p>{message}</p> : null}</div>
    </div>

    <aside className="inspector panel"><div className="panel-scroll">
      {animateOpen ? <div className="animation-settings"><div className="section-heading"><h2>Animate</h2><button className="text-button" onClick={leaveAnimation}>Done</button></div><section className="control-section"><h2>Motion</h2><div className="motion-options">{(["none", "turntable"] as const).map(motion => <button key={motion} aria-pressed={motionPreset === motion} onClick={() => { setIsPlaying(false); setMotionPreset(motion); setPlayheadValue(0); }}><span className={"motion-preview motion-preview--" + motion}><img src={presetImage("perspective")} alt="" /></span><span>{motion === "none" ? "Still" : "Turntable"}</span></button>)}</div></section><section className="control-section"><h2>Timing</h2><Slider label="Duration" value={duration} min={2} max={10} unit="s" onChange={value => { setDuration(value); setPlayheadValue(0); setIsPlaying(false); }} /><p className="panel-note">A complete 360° rotation. Export captures the current frame as a PNG.</p></section><button className="primary" disabled={!ready || motionPreset === "none"} onClick={() => setIsPlaying(!isPlaying)}><Icon name={isPlaying ? "pause" : "play"} />{isPlaying ? "Pause preview" : "Play preview"}</button></div> : <>

      <section className="control-section first-section"><h2>Canvas Size</h2><div className="ratio-picker" aria-label="Canvas ratio">{Object.keys(formats).map(ratio => <button key={ratio} aria-pressed={format === ratio} onClick={() => setFormat(ratio as keyof typeof formats)}><span className="ratio-icon-wrap"><span className={"ratio-icon ratio-" + ratio.replace(":", "-")} /></span>{ratio}</button>)}</div></section>
      <section className="control-section"><h2>Zoom</h2>
        <button className="zoom-navigator" aria-label="Canvas position navigator" title="Drag to position · Double-click to center" style={{ background: backdrop }} onDoubleClick={() => setPosition([0, 0])} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); moveFromNavigator(event); }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveFromNavigator(event); }} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={event => { const offsets: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }; const offset = offsets[event.key]; if (offset) { event.preventDefault(); setPosition(p => [Math.max(-100, Math.min(100, p[0] + offset[0])), Math.max(-100, Math.min(100, p[1] + offset[1]))]); } }}>
          <img className="zoom-line-v" src="/ui/cadre/zoom-line-v.svg" alt="" /><img className="zoom-line-h" src="/ui/cadre/zoom-line-h.svg" alt="" /><img className="zoom-mask" src="/ui/cadre/zoom-mask.svg" alt="" /><img className="zoom-point" src="/ui/cadre/zoom-point.svg" alt="" style={{ left: `calc(50% + ${position[0] / 2}% - 4px)`, top: `calc(50% - ${position[1] / 2}% - 4px)` }} />
        </button>
        <Slider label="Scale" value={scale * 100} min={40} max={160} unit="%" onChange={value => { setIsPlaying(false); setScale(value / 100); }} />
      </section>
      <section className="control-section"><h2>Angle &amp; Presets</h2><div className="preset-grid">{presets.map(preset => <button key={preset.name} aria-label={preset.name} title={preset.name} aria-pressed={angles.every((angle, index) => angle === preset.angles[index])} className="preset" onClick={() => selectPreset(preset)}><span className="preset-preview"><img src={presetImage(preset.className)} alt="" /></span></button>)}</div></section>
      </>}
    </div></aside>

    <input ref={projectInput} className="visually-hidden" type="file" accept=".json,.forma.json,application/json" aria-label="Open project file" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void importProject(file); }} />
    <dialog ref={exportDialog} className="export-dialog"><div className="section-heading"><h2>Export your mockup</h2><button className="icon-button" aria-label="Close export" disabled={busy} onClick={() => exportDialog.current?.close()}><Icon name="close" /></button></div><p>PNG image · {width} × {height} px</p><div className="export-summary"><span>Composition</span><strong>Current canvas & angle</strong><span>Frame</span><strong>{motionPreset === "none" ? "Still" : "Turntable · " + formatTime(playhead)}</strong><span>Style</span><strong>{mockupChoice === "iphone-duo" ? iphoneDuoManifest.materialVariants.find(style => style.id === deviceStyle)?.label : styles.find(style => style.id === deviceStyle)?.label}</strong><span>Shadow</span><strong>{shadowPresets.find(preset => preset.id === shadowPreset)?.label}{shadowPreset !== "none" ? " · " + shadowOpacity + "%" : ""}</strong><span>Background</span><strong>{background.kind === "solid" ? "Solid color" : "Gradient"}</strong></div><p className="export-note">PNG dibuat di browser ini. Tidak perlu akun; draft dan gambar tetap tersimpan di browser ini.</p>{exportError && <p className="export-error" role="alert">{exportError}</p>}<button className="primary" disabled={busy} onClick={() => void download()}>{busy ? "Rendering…" : "Download PNG"}<Icon name="export" size={16} /></button></dialog>
  </section>;
}
