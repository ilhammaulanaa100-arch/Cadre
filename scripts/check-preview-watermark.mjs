import { spawn } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const profile = await mkdtemp(join(tmpdir(), "forma-watermark-check-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  "--window-size=1440,1000", "--remote-debugging-port=9340", `--user-data-dir=${profile}`,
  "http://127.0.0.1:3000/",
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
    const response = await fetch("http://127.0.0.1:9340/json/list");
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await waitFor(() => evaluate("document.querySelector('[data-testid=export]')?.disabled === false && document.querySelector('.canvas-topline')?.textContent.includes('Clean preview')"), "clean preview");
  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(join(process.cwd(), "docs/evidence/t3-06-watermark-preview.png"), Buffer.from(screenshot.data, "base64"));
  const canvasBefore = await evaluate("document.querySelector('.render-canvas canvas')?.toDataURL('image/png')");
  const dataUrl = await evaluate("window.__mockup3dCaptureProof()");
  const canvasAfter = await evaluate("document.querySelector('.render-canvas canvas')?.toDataURL('image/png')");
  if (canvasBefore !== canvasAfter) throw new Error("Preview changed after clean PNG capture.");
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 1200) throw new Error("Export dimensions mismatch.");
  await writeFile(join(process.cwd(), "docs/evidence/t3-06-watermark-clean-png.png"), png);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await waitFor(() => evaluate("(() => { const rect = document.querySelector('.artboard')?.getBoundingClientRect(); return rect && rect.width > 0 && Math.abs(rect.width / rect.height - 1) < 0.01; })()"), "narrow preview layout");
  const narrow = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(join(process.cwd(), "docs/evidence/t3-06-watermark-narrow.png"), Buffer.from(narrow.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await waitFor(() => evaluate("document.querySelector('.artboard')?.getBoundingClientRect().width > 600"), "desktop artboard restored");
  await evaluate("document.getElementById('background-tab').click(); [...document.querySelectorAll('#background-panel button')].find(button => button.textContent.trim() === 'Solid').click()");
  for (const [name, color, rgb] of [["light", "#ffffff", "rgb(255, 255, 255)"], ["dark", "#25262d", "rgb(37, 38, 45)"]]) {
    await evaluate(`document.querySelector('[aria-label="Background ${color}"]').click()`);
    await waitFor(() => evaluate(`getComputedStyle(document.querySelector('.artboard')).backgroundColor === '${rgb}'`), `${name} background`);
    await new Promise(resolve => setTimeout(resolve, 350));
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(join(process.cwd(), `docs/evidence/t3-07/watermark-${name}-background.png`), Buffer.from(screenshot.data, "base64"));
  }
  console.log("Clean preview desktop/narrow/light/dark screenshots and clean PNG captured.");
  socket.close();
} finally {
  chrome.kill();
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
