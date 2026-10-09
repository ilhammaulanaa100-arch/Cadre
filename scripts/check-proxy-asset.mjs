import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "assets/devices/iphone-18-pro-max");
const info = JSON.parse(await readFile(join(dir, "proxy-info.json"), "utf8"));
const full = await readFile(join(dir, "iphone-18-pro-max.glb"));
const proxy = await readFile(join(dir, "iphone-18-pro-max-proxy.glb"));
const decode = buffer => {
  assert.equal(buffer.readUInt32LE(0), 0x46546c67);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  const jsonLength = buffer.readUInt32LE(12);
  const document = JSON.parse(buffer.subarray(20, 20 + jsonLength));
  const binStart = 20 + jsonLength;
  return { document, bin: buffer.subarray(binStart + 8, binStart + 8 + buffer.readUInt32LE(binStart)) };
};
const a = decode(full), b = decode(proxy);
const hash = data => createHash("sha256").update(data).digest("hex");
assert.equal(hash(full), info.sourceSha256);
assert.equal(hash(proxy), info.sha256);
assert.equal(proxy.length, info.bytes);
assert(proxy.length < full.length);
assert.deepEqual(b.document.nodes, a.document.nodes);
assert.deepEqual(b.document.meshes, a.document.meshes);
assert.equal(b.document.accessors.length, a.document.accessors.length);
for (let index = 0; index < a.document.accessors.length; index++) {
  const source = a.document.accessors[index], target = b.document.accessors[index];
  const { bufferView: sourceView, ...sourceMeta } = source;
  const { bufferView: targetView, ...targetMeta } = target;
  assert.deepEqual(targetMeta, sourceMeta, `Accessor ${index} metadata changed`);
  const x = a.document.bufferViews[sourceView], y = b.document.bufferViews[targetView];
  assert.equal(x.byteLength, y.byteLength, `Accessor ${index} length changed`);
  assert(a.bin.subarray(x.byteOffset, x.byteOffset + x.byteLength).equals(b.bin.subarray(y.byteOffset, y.byteOffset + y.byteLength)), `Accessor ${index} geometry changed`);
}
assert.equal(b.document.images.length, 0);
assert.equal(b.document.textures.length, 0);
assert.equal(b.document.nodes.filter(node => node.name === "Screen").length, 1);
try { await stat(join(root, "apps/web/public/devices/iphone-18-pro-max/iphone-18-pro-max.glb")); throw new Error("Full GLB is in the public directory"); }
catch (error) { if (error.code !== "ENOENT") throw error; }
console.log(JSON.stringify({ result: "passed", fullBytes: full.length, proxyBytes: proxy.length, savedPercent: Number(((1 - proxy.length / full.length) * 100).toFixed(1)), accessors: a.document.accessors.length }));
