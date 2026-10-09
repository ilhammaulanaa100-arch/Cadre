import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirname, join as joinPath } from "node:path";
import { fileURLToPath } from "node:url";

const root = joinPath(dirname(fileURLToPath(import.meta.url)), "..");
const evidence = joinPath(root, "docs/evidence/t4-01");
const profile = await mkdtemp(join(tmpdir(), "forma-category-check-"));
const port = 9344;
const serverPort = Number(process.env.FORMA_TEST_PORT ?? 3000);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  "--enable-webgl", "--ignore-gpu-blocklist", `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, "--window-size=1440,960", `http://127.0.0.1:${serverPort}/`,
], { stdio: "ignore" });

async function waitFor(callback, label) {
  for (let attempt = 0; attempt < 120; attempt++) {
    const value = await callback().catch(() => null);
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 125));
  }
  throw new Error(`Timed out: ${label}`);
}

try {
  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    return (await response.json()).find(item => item.type === "page" && item.url.startsWith(`http://127.0.0.1:${serverPort}`));
  }, "Chrome page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const reply = JSON.parse(String(data));
    const task = pending.get(reply.id);
    if (!task) return;
    pending.delete(reply.id);
    if (reply.error) task.reject(new Error(reply.error.message)); else task.resolve(reply.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send("Runtime.enable");
  await mkdir(evidence, { recursive: true });
  await waitFor(() => evaluate("document.querySelector('[data-testid=export]')?.disabled === false"), "iPhone preview");

  for (const name of ["tablet-dev", "laptop-dev"]) {
    await evaluate(`(() => { const select = document.querySelector('#device-picker'); select.value = '${name}'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await waitFor(() => evaluate(`document.querySelector('#device-picker')?.value === '${name}' && document.querySelector('[data-testid=export]')?.disabled === false`), `${name} preview`);
    if (name === "laptop-dev") {
      await evaluate(`(async () => {
        const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 900;
        const ctx = canvas.getContext('2d');
        const fill = ctx.createLinearGradient(0, 0, 1600, 900); fill.addColorStop(0, '#111c33'); fill.addColorStop(1, '#28395c');
        ctx.fillStyle = fill; ctx.fillRect(0, 0, 1600, 900);
        ctx.fillStyle = '#dfeaff'; ctx.font = 'bold 66px Arial'; ctx.fillText('Category proof', 100, 160);
        ctx.font = '38px Arial'; ctx.fillText('Landscape screenshot · 1600 × 900', 100, 225);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#3562d8','#6b57ca','#248b98'][i]; ctx.fillRect(100 + i * 475, 340, 425, 320); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 48px Arial'; ctx.fillText('LEFT', 145, 520); ctx.fillText('CENTER', 620, 520); ctx.fillText('RIGHT', 1095, 520);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'landscape-proof.png', { type: 'image/png' });
        const transfer = new DataTransfer(); transfer.items.add(file);
        const input = document.querySelector('input[type=file]'); input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await waitFor(() => evaluate("document.querySelector('.image-info strong')?.textContent === 'landscape-proof.png' && document.querySelector('[data-testid=export]')?.disabled === false"), "landscape image ready");
    }
    const image = await evaluate("window.__mockup3dCaptureProof?.()");
    if (!image?.startsWith("data:image/png;base64,")) throw new Error(`${name}: PNG capture failed`);
    const png = Buffer.from(image.split(",")[1], "base64");
    if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 1200) throw new Error(`${name}: wrong PNG dimensions`);
    await writeFile(join(evidence, `${name}.png`), png);
    await waitFor(() => evaluate(`(async () => { const db = await new Promise((resolve, reject) => { const r = indexedDB.open('forma-local-drafts'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); const value = await new Promise((resolve, reject) => { const r = db.transaction('drafts').objectStore('drafts').get('current'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); db.close(); return value?.scene?.instances?.[0]?.deviceId === '${name}'; })()`), `${name} draft save`);
    await send("Page.reload", { ignoreCache: true });
    await waitFor(() => evaluate(`document.querySelector('#device-picker')?.value === '${name}' && document.querySelector('[data-testid=export]')?.disabled === false`), `${name} restore`);
    console.log(`${name}: preview ready, 1200×1200 PNG captured, draft restored`);
  }
  socket.close();
} finally {
  chrome.kill("SIGTERM");
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
