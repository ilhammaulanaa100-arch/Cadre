import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidence = join(root, "docs/evidence/t4-04");
await mkdir(evidence, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), "forma-alignment-"));
const port = 9600 + Math.floor(Math.random() * 300);
const base = process.env.FORMA_RENDER_URL ?? "http://127.0.0.1:3001";
const chrome = spawn(process.env.FORMA_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  "--enable-webgl", "--ignore-gpu-blocklist", `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, "--window-size=1440,960", `${base}/`,
], { stdio: "ignore" });
let socket;
try {
  const waitFor = async (check, label) => {
    for (let attempt = 0; attempt < 160; attempt++) {
      const value = await check().catch(() => null);
      if (value) return value;
      await new Promise(resolve => setTimeout(resolve, 125));
    }
    throw new Error(`Timed out waiting for ${label}`);
  };
  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    return (await response.json()).find(page => page.type === "page" && page.url === `${base}/`);
  }, "editor page");
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
    const id = ++sequence; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  await send("Runtime.enable");
  await waitFor(() => evaluate("document.querySelector('[data-testid=export]')?.disabled === false"), "editor renderer");
  const dataUrl = await evaluate("window.__mockup3dCaptureProof()");
  await writeFile(join(evidence, "preview-proxy.png"), Buffer.from(dataUrl.split(",")[1], "base64"));
  const scene = await waitFor(() => evaluate(`(async () => {
    const db = await new Promise((resolve,reject) => { const request=indexedDB.open('forma-local-drafts'); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); });
    const draft=await new Promise((resolve,reject) => { const request=db.transaction('drafts','readonly').objectStore('drafts').get('current'); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); });
    db.close(); return draft?.scene ?? null;
  })()`), "saved scene");
  const release = JSON.parse(await readFile(join(root, "packages/catalog/src/render-release.json"), "utf8"));
  const job = join(evidence, "alignment-job.json");
  await writeFile(job, JSON.stringify({ rendererRelease: release.rendererRelease, scene,
    images: { "fixture-screen-main": "assets/fixtures/screens/dashboard-dark.png" }, width: 1200, height: 1200 }, null, 2));
  const output = join(evidence, "render-full.png");
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, "scripts/render-local-worker.mjs"), job, output], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = ""; child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(stderr || `Worker exited ${code}`)));
  });
  const source = (await readFile(join(evidence, "orientation-source.jpg"))).toString("base64");
  await evaluate(`(async () => {
    const blob = await (await fetch('data:image/jpeg;base64,${source}')).blob();
    const file = new File([blob], 'orientation-source.jpg', { type: 'image/jpeg' });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('input[type=file]'); input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  const normalized = await waitFor(() => evaluate(`(async () => {
    const db = await new Promise((resolve,reject) => { const request=indexedDB.open('forma-local-drafts'); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); });
    const draft=await new Promise((resolve,reject) => { const request=db.transaction('drafts','readonly').objectStore('drafts').get('current'); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); });
    if (draft?.singleSlot?.imageName !== 'orientation-source.jpg') { db.close(); return null; }
    const id=draft.singleSlot.imageId;
    const blob=await new Promise((resolve,reject) => { const request=db.transaction('images','readonly').objectStore('images').get(id); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); });
    db.close();
    if (!blob) return null;
    const data=await new Promise((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(reader.error); reader.readAsDataURL(blob); });
    return { scene:draft.scene, id, type:blob.type, data };
  })()`), "canonical uploaded image");
  if (normalized.type !== "image/png") throw new Error("Upload was not normalized to PNG");
  await writeFile(join(evidence, "orientation-canonical.png"), Buffer.from(normalized.data.split(",")[1], "base64"));
  await waitFor(() => evaluate("document.querySelector('[data-testid=export]')?.disabled === false"), "editor after upload");
  const orientedPreview = await evaluate("window.__mockup3dCaptureProof()");
  await writeFile(join(evidence, "orientation-preview.png"), Buffer.from(orientedPreview.split(",")[1], "base64"));
  const orientedJob = join(evidence, "orientation-job.json");
  await writeFile(orientedJob, JSON.stringify({ rendererRelease: release.rendererRelease, scene: normalized.scene,
    images: { [normalized.id]: "docs/evidence/t4-04/orientation-canonical.png" }, width: 1200, height: 1200 }, null, 2));
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, "scripts/render-local-worker.mjs"), orientedJob, join(evidence, "orientation-render.png")], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = ""; child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(stderr || `Worker exited ${code}`)));
  });
  console.log(JSON.stringify({ preview: join(evidence, "preview-proxy.png"), render: output, scene: job }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) { chrome.kill(); await new Promise(resolve => chrome.once("exit", resolve)); }
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
