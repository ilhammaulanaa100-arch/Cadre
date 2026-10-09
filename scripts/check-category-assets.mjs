import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixtures = {
  tablet: { hash: "8dcea638107fbce9b63c0f5c86ac95e6f717f081cd5e4d99ddc11e08cf02622e", width: 0.162, height: 0.233, bytes: 45520 },
  laptop: { hash: "dedb374cc465da8a5de4f4f97bb302fd88e31384dadb4b6f4b737f97736ec4a5", width: 0.280, height: 0.1575, bytes: 83728 },
};

function assert(ok, message) { if (!ok) throw new Error(message); }

for (const [name, expected] of Object.entries(fixtures)) {
  const bytes = readFileSync(join(root, "assets/fixtures/models", `${name}-dev.glb`));
  assert(bytes.toString("ascii", 0, 4) === "glTF", `${name}: not a GLB`);
  assert(bytes.length === expected.bytes, `${name}: byte count changed`);
  assert(createHash("sha256").update(bytes).digest("hex") === expected.hash, `${name}: hash changed`);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
  const binaryStart = 20 + jsonLength + 8;
  const screen = gltf.nodes.find(node => node.name === "Screen");
  assert(screen, `${name}: missing Screen node`);
  const primitive = gltf.meshes[screen.mesh].primitives[0];
  assert(gltf.materials[primitive.material].name === "ScreenMaterial", `${name}: wrong screen material`);
  const position = gltf.accessors[primitive.attributes.POSITION];
  const width = position.max[0] - position.min[0];
  const height = position.max[1] - position.min[1];
  assert(Math.abs(width - expected.width) < 0.00001 && Math.abs(height - expected.height) < 0.00001, `${name}: screen geometry changed`);
  assert(Math.abs((position.max[0] + position.min[0]) / 2) < 0.002, `${name}: screen pivot shifted`);
  assert(Math.abs((position.max[1] + position.min[1]) / 2) < 0.002, `${name}: screen pivot shifted`);
  const uv = gltf.accessors[primitive.attributes.TEXCOORD_0];
  const view = gltf.bufferViews[uv.bufferView];
  const offset = binaryStart + (view.byteOffset ?? 0) + (uv.byteOffset ?? 0);
  const stride = view.byteStride ?? 8;
  const corners = Array.from({ length: uv.count }, (_, index) => [bytes.readFloatLE(offset + index * stride), bytes.readFloatLE(offset + index * stride + 4)]);
  assert(corners.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1), `${name}: UV outside 0–1`);
  assert(new Set(corners.map(([u]) => Math.round(u))).size === 2 && new Set(corners.map(([, v]) => Math.round(v))).size === 2, `${name}: UV does not cover full screen`);
  console.log(`${name}: GLB ${bytes.length} bytes, screen ${width.toFixed(3)} × ${height.toFixed(4)} m, UV 0–1, SHA-256 pinned`);
}
