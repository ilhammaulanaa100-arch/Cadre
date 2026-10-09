import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const directory = join(root, "assets/devices/iphone-18-pro-max");
const full = await readFile(join(directory, "iphone-18-pro-max.glb"));
if (full.readUInt32LE(0) !== 0x46546c67 || full.readUInt32LE(4) !== 2) throw new Error("Invalid source GLB");
const jsonLength = full.readUInt32LE(12);
const json = JSON.parse(full.subarray(20, 20 + jsonLength).toString());
const binHeader = 20 + jsonLength;
const binLength = full.readUInt32LE(binHeader);
const bin = full.subarray(binHeader + 8, binHeader + 8 + binLength);
const imageViews = new Set((json.images ?? []).map(image => image.bufferView));
if (imageViews.size !== 2) throw new Error("Expected two embedded image bufferViews");
const oldToNew = new Map();
const chunks = [];
const views = [];
let offset = 0;
for (const [index, view] of json.bufferViews.entries()) {
  if (imageViews.has(index)) continue;
  const bytes = bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
  const padding = (4 - offset % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  oldToNew.set(index, views.length);
  views.push({ ...view, byteOffset: offset });
  chunks.push(bytes);
  offset += bytes.length;
}
for (const accessor of json.accessors) {
  if (accessor.bufferView !== undefined) accessor.bufferView = oldToNew.get(accessor.bufferView);
  if (accessor.sparse) throw new Error("Sparse accessors need an explicit proxy transform");
}
for (const material of json.materials) {
  delete material.normalTexture;
  delete material.emissiveTexture;
}
json.bufferViews = views;
json.images = [];
json.textures = [];
json.samplers = [];
json.buffers[0].byteLength = offset;
const jsonBytes = Buffer.from(JSON.stringify(json));
const jsonPadding = (4 - jsonBytes.length % 4) % 4;
const binary = Buffer.concat(chunks);
const binPadding = (4 - binary.length % 4) % 4;
const total = 12 + 8 + jsonBytes.length + jsonPadding + 8 + binary.length + binPadding;
const result = Buffer.alloc(total);
result.writeUInt32LE(0x46546c67, 0);
result.writeUInt32LE(2, 4);
result.writeUInt32LE(total, 8);
result.writeUInt32LE(jsonBytes.length + jsonPadding, 12);
result.writeUInt32LE(0x4e4f534a, 16);
jsonBytes.copy(result, 20);
result.fill(0x20, 20 + jsonBytes.length, 20 + jsonBytes.length + jsonPadding);
const binStart = 20 + jsonBytes.length + jsonPadding;
result.writeUInt32LE(binary.length + binPadding, binStart);
result.writeUInt32LE(0x004e4942, binStart + 4);
binary.copy(result, binStart + 8);
const path = join(directory, "iphone-18-pro-max-proxy.glb");
await writeFile(path, result);
const info = {
  sourceSha256: createHash("sha256").update(full).digest("hex"),
  sha256: createHash("sha256").update(result).digest("hex"),
  bytes: result.length,
  removedImages: imageViews.size,
  meshCount: json.meshes.length,
};
await writeFile(join(directory, "proxy-info.json"), JSON.stringify(info, null, 2) + "\n");
console.log(JSON.stringify(info));
