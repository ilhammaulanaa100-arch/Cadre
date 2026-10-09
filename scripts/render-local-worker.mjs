import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Development proof only. Start the built web app on loopback with
// FORMA_INTERNAL_RENDER=1, then run: node scripts/render-local-worker.mjs job.json output.png
const [jobPath, outputPath] = process.argv.slice(2);
const startedAt = performance.now();
if (!jobPath || !outputPath) throw new Error("Usage: node scripts/render-local-worker.mjs job.json output.png");
const job = JSON.parse(await readFile(resolve(jobPath), "utf8"));
const { scene, images, rendererRelease, width = 1200, height = 1200, timeSeconds = scene?.frame?.playheadSeconds } = job;
if (!scene || !images || typeof images !== "object" || ![width, height].every(value => Number.isInteger(value) && value > 0 && value <= 4096)) throw new Error("Invalid local render job");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(await readFile(join(root, "packages/catalog/src/render-release.json"), "utf8"));
if (rendererRelease !== release.rendererRelease) throw new Error(`Renderer release mismatch: expected ${release.rendererRelease}`);
const assetHashes = {};
for (const instance of scene.instances ?? []) {
  const asset = release.assets[instance.deviceId];
  if (!asset || asset.version !== instance.deviceVersion) throw new Error(`Unpinned asset ${instance.deviceId}@${instance.deviceVersion}`);
  const bytes = await readFile(join(root, asset.path));
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== asset.sha256) throw new Error(`Asset bytes changed: ${instance.deviceId}`);
  if (asset.previewPath) {
    const proxyHash = createHash("sha256").update(await readFile(join(root, asset.previewPath))).digest("hex");
    if (proxyHash !== asset.previewSha256) throw new Error(`Preview asset bytes changed: ${instance.deviceId}`);
  }
  assetHashes[instance.deviceId] = actualHash;
}
const imageData = {};
for (const [id, path] of Object.entries(images)) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || typeof path !== "string") throw new Error("Invalid image reference");
  const extension = extname(path).toLowerCase();
  const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" }[extension];
  if (!mime) throw new Error(`Unsupported image file ${path}`);
  const buffer = await readFile(resolve(path));
  if (buffer.length > 64 * 1024 * 1024) throw new Error(`Image ${id} exceeds 64 MiB`);
  imageData[id] = `data:${mime};base64,${buffer.toString("base64")}`;
}
const preparedAt = performance.now();

const baseUrl = process.env.FORMA_RENDER_URL ?? "http://127.0.0.1:3001";
const url = new URL("/internal/render", baseUrl);
if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Render surface must run on loopback");
const response = await fetch(url);
if (!response.ok) throw new Error(`Internal render surface returned HTTP ${response.status}; start the built web app with FORMA_INTERNAL_RENDER=1`);
const serverCheckedAt = performance.now();

const profile = await mkdtemp(`${tmpdir()}/forma-worker-`);
const debugPort = 9400 + Math.floor(Math.random() * 500);
const chromePath = process.env.FORMA_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const backend = process.env.FORMA_RENDER_BACKEND ?? "default";
if (!["default", "swiftshader"].includes(backend)) throw new Error("Unsupported render backend");
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  "--enable-webgl", "--ignore-gpu-blocklist", `--remote-debugging-port=${debugPort}`,
  ...(backend === "swiftshader" ? ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] : []),
  `--user-data-dir=${profile}`, "--window-size=1400,1400", url.href,
], { stdio: "ignore" });
let socket;
try {
  const waitFor = async (check, label, timeoutMs = 30000) => {
    const stop = Date.now() + timeoutMs;
    while (Date.now() < stop) {
      const value = await check().catch(() => null);
      if (value) return value;
      await new Promise(resolve => setTimeout(resolve, 125));
    }
    throw new Error(`Timed out waiting for ${label}`);
  };
  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    return (await response.json()).find(page => page.type === "page" && page.url.startsWith(url.href));
  }, "Chrome page");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const result = JSON.parse(String(data));
    const task = pending.get(result.id);
    if (!task) return;
    pending.delete(result.id);
    if (result.error) task.reject(new Error(result.error.message)); else task.resolve(result.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  await send("Runtime.enable");
  await waitFor(() => evaluate("Boolean(window.__formaRenderSurface)"), "render surface script");
  const browserReadyAt = performance.now();
  await evaluate(`window.__formaRenderSurface.initialize(${JSON.stringify({ scene, images: imageData, rendererRelease, colorPipeline: release.colorPipeline, assetHashes })})`);
  const sceneReadyAt = performance.now();
  const actualRenderer = await evaluate(`(() => { const gl=document.querySelector('canvas')?.getContext('webgl2'); const ext=gl?.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? 'unavailable'; })()`);
  const dataUrl = await evaluate(`window.__formaRenderSurface.renderAt(${JSON.stringify(timeSeconds)},${width},${height})`);
  const renderedAt = performance.now();
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) throw new Error("Renderer returned no PNG");
  const png = Buffer.from(dataUrl.slice("data:image/png;base64,".length), "base64");
  if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) throw new Error("PNG dimensions differ from the job");
  await writeFile(resolve(outputPath), png);
  console.log(JSON.stringify({ output: resolve(outputPath), bytes: png.length, sha256: createHash("sha256").update(png).digest("hex"), instances: scene.instances.length, backend, actualRenderer,
    timingsMs: { prepare: Math.round(preparedAt - startedAt), serverCheck: Math.round(serverCheckedAt - preparedAt), chromeStart: Math.round(browserReadyAt - serverCheckedAt), sceneLoad: Math.round(sceneReadyAt - browserReadyAt), capture: Math.round(renderedAt - sceneReadyAt), beforeCleanup: Math.round(performance.now() - startedAt) } }));
  await evaluate("window.__formaRenderSurface.dispose()");
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill();
    await new Promise(resolve => chrome.once("exit", resolve));
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
