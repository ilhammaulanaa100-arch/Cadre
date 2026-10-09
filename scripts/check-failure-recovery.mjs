import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = 9342;
const root = await mkdtemp(join(tmpdir(), "forma-recovery-check-"));
const downloads = join(root, "downloads");
await mkdir(downloads);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  `--remote-debugging-port=${port}`, `--user-data-dir=${join(root, "profile")}`, "http://127.0.0.1:3000/",
], { stdio: "ignore" });

async function waitFor(callback, label) {
  for (let attempt = 0; attempt < 160; attempt++) {
    const result = await callback().catch(() => null);
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 125));
  }
  throw new Error(`Timed out: ${label}`);
}

try {
  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    return (await response.json()).find(item => item.type === "page" && item.url.startsWith("http://127.0.0.1:3000"));
  }, "Chrome page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (!message.id) return;
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
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
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  await waitFor(() => evaluate("document.querySelector('.local-status')?.textContent.includes('Saved in this browser') && !document.querySelector('[data-testid=export]')?.disabled"), "editor ready");

  // Force a real IndexedDB write failure and verify the user can retry it.
  await evaluate("window.__originalPut = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function(...args) { if (this.name === 'drafts') throw new DOMException('Disk full', 'QuotaExceededError'); return window.__originalPut.apply(this, args); }; document.querySelector('.ratio-picker button:nth-child(2)').click()");
  await waitFor(() => evaluate("document.querySelector('.draft-error')?.textContent.includes('Penyimpanan browser penuh') && document.querySelector('.draft-error button')?.textContent === 'Retry save'"), "quota warning");
  await evaluate("IDBObjectStore.prototype.put = window.__originalPut; document.querySelector('.draft-error button').click()");
  await waitFor(() => evaluate("document.querySelector('.local-status')?.textContent.includes('Saved in this browser') && document.querySelector('.ratio-picker [aria-pressed=true]')?.textContent.trim() === '4:3'"), "storage retry");

  // A failed canvas capture must leave the export dialog open for a second try.
  await evaluate("window.__originalToDataURL = HTMLCanvasElement.prototype.toDataURL; HTMLCanvasElement.prototype.toDataURL = function() { throw new DOMException('Capture failed', 'InvalidStateError'); }; document.querySelector('[data-testid=export]').click()");
  await evaluate("document.querySelector('.export-dialog .primary').click()");
  await waitFor(() => evaluate("document.querySelector('.export-dialog')?.open && document.querySelector('.export-error')?.textContent.includes('Draft tetap aman')"), "export retry message");
  await evaluate("HTMLCanvasElement.prototype.toDataURL = window.__originalToDataURL; document.querySelector('.export-dialog .primary').click()");
  await waitFor(async () => (await readdir(downloads)).some(name => name.endsWith(".png")), "PNG after retry");
  await waitFor(() => evaluate("!document.querySelector('.export-dialog')?.open"), "export dialog closed");

  // Simulate the browser's context-loss event and verify a fresh renderer starts.
  await evaluate("document.querySelector('.render-canvas canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true }))");
  await waitFor(() => evaluate("document.querySelector('.canvas-error')?.textContent.includes('Koneksi grafis terputus') && document.querySelector('[data-testid=export]')?.disabled"), "GPU loss warning");
  await evaluate("document.querySelector('.canvas-error button').click()");
  await waitFor(() => evaluate("!document.querySelector('.canvas-error') && !document.querySelector('[data-testid=export]')?.disabled"), "GPU retry");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const narrow = await waitFor(() => evaluate("({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, save: !!document.querySelector('[title=\"Download project and images\"]'), open: !!document.querySelector('[title=\"Open a saved Forma project\"]') })"), "narrow layout");
  if (narrow.scrollWidth > narrow.width || !narrow.save || !narrow.open) throw new Error(`Narrow layout overflow: ${JSON.stringify(narrow)}`);
  console.log(JSON.stringify({ status: "passed", storageRetry: true, exportRetry: true, gpuRetry: true, narrow }));
  socket.close();
} finally {
  chrome.kill();
  await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
