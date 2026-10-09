import { sceneDocumentSchema, type SceneDocument } from "@mockup-3d/contracts";
import { categoryProofManifest, iphone18Finishes, iphone18ProMaxManifest, iphoneDuoManifest } from "@mockup-3d/catalog";

export type SavedSlot = {
  deviceId: string;
  deviceStyle: string;
  imageId: string;
  imageName: string;
  angles: [number, number, number];
  position: [number, number];
  scale: number;
  fit: "fill" | "fit";
  crop: [number, number];
  padding: string;
};

export type SavedDraft = {
  version: 3;
  canvasEmpty?: boolean;
  scene: SceneDocument;
  mockupChoice: "iphone-18-pro-max" | "iphone-duo" | "legacy-two-phone";
  template: "single" | "duo";
  selectedIndex: 0 | 1;
  duoInitialized: boolean;
  singleSlot: SavedSlot;
  duoSlots: [SavedSlot, SavedSlot];
  duoOuterSlot?: SavedSlot;
  duoInnerSlot?: SavedSlot;
  duoFoldAngle?: number;
  imageName: string;
  angles: [number, number, number];
  crop: [number, number];
  format: "1:1" | "4:3" | "16:9" | "9:16";
};

type LegacyDraft = Pick<SavedDraft, "scene" | "imageName" | "angles" | "crop" | "format"> & { version: 1 };
type PreviousDraft = Omit<SavedDraft, "version" | "mockupChoice"> & { version: 2 };

const databaseName = "forma-local-drafts";
const draftKey = "current";
const fixtureImageId = "fixture-screen-main";
const manifests = [iphone18ProMaxManifest, iphoneDuoManifest, categoryProofManifest("tablet"), categoryProofManifest("laptop")];

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Local storage transaction was cancelled."));
    transaction.onerror = () => reject(transaction.error ?? new Error("Local storage transaction failed."));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("drafts");
      database.createObjectStore("images");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage is unavailable."));
    request.onblocked = () => reject(new Error("Local storage is blocked by another tab."));
  });
}

function validSlot(value: unknown): value is SavedSlot {
  if (!value || typeof value !== "object") return false;
  const slot = value as Partial<SavedSlot>;
  const manifest = manifests.find(item => item.deviceId === slot.deviceId);
  const pair = (item: unknown, low: number, high: number) =>
    Array.isArray(item) && item.length === 2 && item.every(number => typeof number === "number" && Number.isFinite(number) && number >= low && number <= high);
  return !!manifest &&
    (manifest.deviceId === iphone18ProMaxManifest.deviceId
      ? iphone18Finishes.some(finish => finish.id === slot.deviceStyle)
      : manifest.deviceId === iphoneDuoManifest.deviceId
      ? iphoneDuoManifest.materialVariants.some(finish => finish.id === slot.deviceStyle)
      : slot.deviceStyle === "neutral") &&
    typeof slot.imageId === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slot.imageId) &&
    typeof slot.imageName === "string" && slot.imageName.length <= 255 &&
    Array.isArray(slot.angles) && slot.angles.length === 3 && slot.angles.every(number => typeof number === "number" && Number.isFinite(number) && Math.abs(number) <= 180) &&
    pair(slot.position, -100, 100) && typeof slot.scale === "number" && Number.isFinite(slot.scale) && slot.scale >= 0.4 && slot.scale <= 1.6 &&
    (slot.fit === "fill" || slot.fit === "fit") && pair(slot.crop, 0, 1) &&
    typeof slot.padding === "string" && /^#[0-9a-fA-F]{6}$/.test(slot.padding);
}

function validLegacy(value: unknown): value is LegacyDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<LegacyDraft>;
  const parsed = sceneDocumentSchema.safeParse(draft.scene);
  if (!parsed.success || draft.version !== 1 || parsed.data.instances.length !== 1) return false;
  const instance = parsed.data.instances[0]!;
  const manifest = manifests.find(item => item.deviceId === instance.deviceId);
  return !!manifest && instance.deviceVersion === manifest.version && instance.screen.imageRef.kind === "local" &&
    typeof draft.imageName === "string" && draft.imageName.length <= 255 &&
    Array.isArray(draft.angles) && draft.angles.length === 3 && draft.angles.every(number => typeof number === "number" && Number.isFinite(number) && Math.abs(number) <= 180) &&
    Array.isArray(draft.crop) && draft.crop.length === 2 && draft.crop.every(number => typeof number === "number" && number >= 0 && number <= 1) &&
    ["1:1", "4:3", "16:9", "9:16"].includes(draft.format ?? "");
}

function migrateLegacy(draft: LegacyDraft): SavedDraft {
  const instance = draft.scene.instances[0]!;
  const singleSlot: SavedSlot = {
    deviceId: instance.deviceId,
    deviceStyle: instance.materialVariantId,
    imageId: instance.screen.imageRef.kind === "local" ? instance.screen.imageRef.blobId : fixtureImageId,
    imageName: draft.imageName,
    angles: draft.angles,
    position: [instance.transform.position[0] * 1000, instance.transform.position[1] * 1000],
    scale: instance.transform.scale[0],
    fit: instance.screen.fit,
    crop: draft.crop,
    padding: instance.screen.paddingColor,
  };
  const duoSlot = { ...singleSlot, deviceId: iphone18ProMaxManifest.deviceId, deviceStyle: "burgundy" };
  return { ...draft, version: 3, mockupChoice: "iphone-18-pro-max", template: "single", selectedIndex: 0, duoInitialized: false, singleSlot, duoSlots: [{ ...duoSlot }, { ...duoSlot }] };
}

function validDraftStructure(value: unknown): value is SavedDraft | PreviousDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<SavedDraft | PreviousDraft>;
  const parsed = sceneDocumentSchema.safeParse(draft.scene);
  if (!parsed.success || (draft.version !== 2 && draft.version !== 3) || (draft.template !== "single" && draft.template !== "duo") ||
      (draft.selectedIndex !== 0 && draft.selectedIndex !== 1) || typeof draft.duoInitialized !== "boolean" || !validSlot(draft.singleSlot) ||
      !Array.isArray(draft.duoSlots) || draft.duoSlots.length !== 2 || !draft.duoSlots.every(validSlot) ||
      !["1:1", "4:3", "16:9", "9:16"].includes(draft.format ?? "")) return false;
  if (draft.canvasEmpty !== undefined && typeof draft.canvasEmpty !== "boolean") return false;
  if (draft.duoOuterSlot !== undefined && !validSlot(draft.duoOuterSlot)) return false;
  if (draft.duoInnerSlot !== undefined && !validSlot(draft.duoInnerSlot)) return false;
  if (draft.duoFoldAngle !== undefined && (typeof draft.duoFoldAngle !== "number" || !Number.isFinite(draft.duoFoldAngle) || draft.duoFoldAngle < 0 || draft.duoFoldAngle > 180)) return false;
  if (draft.version === 3 && draft.mockupChoice === "iphone-duo" && draft.duoOuterSlot && draft.duoInnerSlot) {
    const instance = parsed.data.instances[0];
    const inner = instance?.additionalScreens?.[0];
    return draft.template === "single" && !!instance && parsed.data.instances.length === 1 &&
      draft.duoOuterSlot.deviceId === iphoneDuoManifest.deviceId && draft.duoInnerSlot.deviceId === iphoneDuoManifest.deviceId &&
      instance.deviceId === iphoneDuoManifest.deviceId && instance.deviceVersion === iphoneDuoManifest.version &&
      instance.materialVariantId === draft.duoOuterSlot.deviceStyle &&
      instance.screen.surfaceId === "outer-screen" && instance.screen.imageRef.kind === "local" && instance.screen.imageRef.blobId === draft.duoOuterSlot.imageId &&
      inner?.surfaceId === "inner-screen" && inner.imageRef.kind === "local" && inner.imageRef.blobId === draft.duoInnerSlot.imageId &&
      instance.foldAngleDegrees === draft.duoFoldAngle;
  }
  const slots = draft.template === "single" ? [draft.singleSlot] : draft.duoSlots;
  if (parsed.data.instances.length !== slots.length || (draft.template === "single" && draft.selectedIndex !== 0)) return false;
  if (parsed.data.templateId !== (draft.template === "single" ? "single-device" : "iphone-duo")) return false;
  return slots.every((slot, index) => {
    const instance = parsed.data.instances[index]!;
    const manifest = manifests.find(item => item.deviceId === slot.deviceId);
    return instance.deviceId === slot.deviceId && instance.deviceVersion === manifest?.version &&
      instance.materialVariantId === slot.deviceStyle && instance.screen.imageRef.kind === "local" &&
      instance.screen.imageRef.blobId === slot.imageId;
  });
}

function validDraft(value: unknown): value is SavedDraft {
  if (!validDraftStructure(value) || value.version !== 3) return false;
  return (value.mockupChoice === "iphone-18-pro-max" || value.mockupChoice === "iphone-duo") && value.template === "single" ||
    value.mockupChoice === "legacy-two-phone" && value.template === "duo";
}

function migrateDraft(value: unknown): SavedDraft | null {
  if (validDraft(value)) return value;
  if (validDraftStructure(value) && value.version === 2) return { ...value, version: 3,
    mockupChoice: value.template === "duo" ? "legacy-two-phone" : "iphone-18-pro-max" };
  return validLegacy(value) ? migrateLegacy(value) : null;
}

function imageIds(draft: SavedDraft): Set<string> {
  return new Set([draft.singleSlot, ...draft.duoSlots, draft.duoOuterSlot, draft.duoInnerSlot].filter((slot): slot is SavedSlot => !!slot).map(slot => slot.imageId).filter(id => id !== fixtureImageId));
}

type ProjectArchive = {
  kind: "forma-project";
  version: 1;
  draft: SavedDraft;
  images: Record<string, { type: string; data: string }>;
};

const imageTypes = ["image/png", "image/jpeg", "image/webp"];
const maxProjectBytes = 96 * 1024 * 1024;

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Image could not be included in the project file."));
    reader.readAsDataURL(blob);
  });
}

export async function createProjectFile(draft: SavedDraft, imageBlobs: Record<string, Blob>): Promise<Blob> {
  if (!validDraft(draft)) throw new Error("Current project cannot be backed up.");
  const images: ProjectArchive["images"] = {};
  for (const id of imageIds(draft)) {
    const blob = imageBlobs[id];
    if (!(blob instanceof Blob) || !imageTypes.includes(blob.type) || blob.size > 64 * 1024 * 1024) {
      throw new Error("A project image is missing or invalid.");
    }
    images[id] = { type: blob.type, data: await readDataUrl(blob) };
  }
  const archive: ProjectArchive = { kind: "forma-project", version: 1, draft, images };
  const file = new Blob([JSON.stringify(archive)], { type: "application/json" });
  if (file.size > maxProjectBytes) throw new Error("Project file is too large to back up.");
  return file;
}

export async function readProjectFile(file: File): Promise<{ draft: SavedDraft; imageBlobs: Record<string, Blob> }> {
  if (file.size > maxProjectBytes) throw new Error("Project file is too large.");
  let raw: unknown;
  try { raw = JSON.parse(await file.text()); }
  catch { throw new Error("Project file is not valid JSON."); }
  if (!raw || typeof raw !== "object") throw new Error("Project file is invalid.");
  const archive = raw as Partial<ProjectArchive>;
  const draft = migrateDraft(archive.draft);
  if (archive.kind !== "forma-project" || archive.version !== 1 || !draft ||
      !archive.images || typeof archive.images !== "object" || Array.isArray(archive.images)) {
    throw new Error("Project file is damaged or incompatible.");
  }
  const ids = imageIds(draft);
  if (Object.keys(archive.images).length !== ids.size) throw new Error("Project images are incomplete.");
  const imageBlobs: Record<string, Blob> = {};
  for (const id of ids) {
    const image = archive.images[id];
    if (!image || !imageTypes.includes(image.type) || typeof image.data !== "string" ||
        !image.data.startsWith(`data:${image.type};base64,`)) throw new Error("Project image is invalid.");
    const encoded = image.data.slice(image.data.indexOf(",") + 1);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0 || encoded.length > 90 * 1024 * 1024) {
      throw new Error("Project image is damaged.");
    }
    const binary = atob(encoded);
    if (binary.length > 64 * 1024 * 1024) throw new Error("Project image is too large.");
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    imageBlobs[id] = new Blob([bytes], { type: image.type });
  }
  return { draft, imageBlobs };
}

export async function loadLocalDraft(): Promise<{ draft: SavedDraft; imageBlobs: Record<string, Blob> } | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(["drafts", "images"], "readonly");
    const done = transactionDone(transaction);
    const raw = await requestResult(transaction.objectStore("drafts").get(draftKey));
    if (raw === undefined) { await done; return null; }
    const draft = migrateDraft(raw);
    if (!draft || !validDraft(draft)) throw new Error("Saved draft is incompatible or damaged.");
    const imageBlobs: Record<string, Blob> = {};
    for (const id of imageIds(draft)) {
      const blob = await requestResult(transaction.objectStore("images").get(id));
      if (!(blob instanceof Blob) || blob.size > 64 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(blob.type)) {
        throw new Error("The saved image is missing or damaged.");
      }
      imageBlobs[id] = blob;
    }
    await done;
    return { draft, imageBlobs };
  } finally { database.close(); }
}

export async function saveLocalDraft(draft: SavedDraft, imageBlobs: Record<string, Blob>): Promise<void> {
  if (!validDraft(draft)) throw new Error("Current scene cannot be saved.");
  const database = await openDatabase();
  try {
    const transaction = database.transaction(["drafts", "images"], "readwrite");
    const done = transactionDone(transaction);
    void done.catch(() => {});
    const draftStore = transaction.objectStore("drafts");
    const imageStore = transaction.objectStore("images");
    const previousRaw = await requestResult(draftStore.get(draftKey));
    const previous = migrateDraft(previousRaw);
    const currentIds = imageIds(draft);
    for (const id of currentIds) {
      const blob = imageBlobs[id];
      if (blob) imageStore.put(blob, id);
      else if (!(await requestResult(imageStore.get(id)) instanceof Blob)) throw new Error("The current image is unavailable for saving.");
    }
    draftStore.put(draft, draftKey);
    if (previous) for (const id of imageIds(previous)) if (!currentIds.has(id)) imageStore.delete(id);
    await done;
  } finally { database.close(); }
}

export async function clearLocalDraft(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(["drafts", "images"], "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore("drafts").clear();
    transaction.objectStore("images").clear();
    await done;
  } finally { database.close(); }
}
