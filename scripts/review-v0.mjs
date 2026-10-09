import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir, cpus, platform, arch, totalmem } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const evidence = join(root, "docs/evidence/t3-07");
await mkdir(evidence, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), "forma-v0-review-"));
const downloads = await mkdtemp(join(tmpdir(), "forma-v0-download-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-background-networking", "--disable-extensions", "--no-first-run",
  "--window-size=1440,1000", "--remote-debugging-port=9341", `--user-data-dir=${profile}`,
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
    const response = await fetch("http://127.0.0.1:9341/json/list");
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
  await send("Performance.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  const editorReady = () => evaluate("document.querySelector('[data-testid=export]')?.disabled === false && document.querySelector('.local-status')?.textContent.includes('Saved in this browser')");
  await waitFor(editorReady, "initial editor ready");
  const readyMs = await evaluate("performance.now()");
  const userAgent = await evaluate("navigator.userAgent");
  const metrics = async () => {
    await send("HeapProfiler.collectGarbage");
    const values = (await send("Performance.getMetrics")).metrics;
    const byName = Object.fromEntries(values.map(item => [item.name, item.value]));
    return { jsHeapUsedBytes: Math.round(byName.JSHeapUsedSize ?? 0), domNodes: Math.round(byName.Nodes ?? 0), documents: Math.round(byName.Documents ?? 0) };
  };
  const baselineMemory = await metrics();
  const checks = [];
  const capture = async (name, width, height) => {
    await waitFor(editorReady, `${name} render ready`);
    const result = await evaluate("(async () => { const start = performance.now(); const data = await window.__mockup3dCaptureProof(); return { data, durationMs: performance.now() - start }; })()");
    const png = Buffer.from(result.data.split(",")[1], "base64");
    if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) throw new Error(`${name}: PNG dimensions mismatch`);
    await writeFile(join(evidence, `${name}.png`), png);
    return { file: `${name}.png`, width, height, bytes: png.length, sha256: createHash("sha256").update(png).digest("hex"), captureMs: Math.round(result.durationMs) };
  };
  checks.push({ scenario: "existing dark fixture, portrait screenshot", png: await capture("dark-fixture", 1200, 1200), memory: await metrics() });

  const uploadSynthetic = async (name, width, height, theme) => {
    await evaluate(`(async () => {
      const canvas = document.createElement('canvas'); canvas.width=${width}; canvas.height=${height};
      const ctx = canvas.getContext('2d');
      const light = ${JSON.stringify(theme)} === 'light';
      ctx.fillStyle = light ? '#f8fafc' : '#101827'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = light ? '#172033' : '#eaf0fa'; ctx.font = 'bold 42px Arial'; ctx.fillText('Project Overview', 65, 105);
      ctx.font = '24px Arial'; ctx.fillStyle = light ? '#57647a' : '#a9b7cf'; ctx.fillText('Summary · 12 September', 65, 155);
      const cardWidth = canvas.width - 130;
      for (let row=0; row<8; row++) {
        const y=210+row*175;
        ctx.fillStyle = light ? '#ffffff' : '#1d293b'; ctx.fillRect(65,y,cardWidth,145);
        ctx.fillStyle = light ? '#1b2841' : '#e6edfa'; ctx.font = 'bold 24px Arial'; ctx.fillText('Section ' + (row+1),95,y+41);
        ctx.font = '16px Arial'; ctx.fillStyle = light ? '#526176' : '#a4b4cb';
        ctx.fillText('Small interface text · item ' + (row+1) + ' · 02:45 PM',95,y+78);
        ctx.fillText('Secondary detail with 123,456 data points',95,y+110);
      }
      if (${JSON.stringify(theme)} === 'landscape') {
        ctx.fillStyle='#4d7ced'; ctx.fillRect(canvas.width-410,210,300,630);
        ctx.fillStyle='white'; ctx.font='bold 50px Arial'; ctx.fillText('CHART',canvas.width-390,290);
      }
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], ${JSON.stringify(name)} + '.png', {type:'image/png'});
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector('input[type=file]'); input.files = transfer.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));
    })()`);
    await waitFor(() => evaluate(`document.querySelector('.image-info strong')?.textContent === ${JSON.stringify(name + ".png")} && document.querySelector('[data-testid=export]')?.disabled === false`), `${name} upload`);
  };

  await uploadSynthetic("light-portrait", 900, 1950, "light");
  checks.push({ scenario: "synthetic light portrait with small text", png: await capture("light-portrait", 1200, 1200), memory: await metrics() });
  await uploadSynthetic("dark-dense", 1170, 2532, "dark");
  checks.push({ scenario: "synthetic dark portrait with dense text", png: await capture("dark-dense", 1200, 1200), memory: await metrics() });
  await uploadSynthetic("landscape", 1600, 900, "landscape");
  await evaluate("([...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Fit image')).click()");
  await evaluate("([...document.querySelectorAll('.ratio-picker button')].find(button => button.textContent.trim() === '16:9')).click()");
  await waitFor(() => evaluate("document.querySelector('.ratio-picker button[aria-pressed=true]')?.textContent.trim() === '16:9'"), "landscape output ratio");
  const landscape = await capture("landscape-fit", 1920, 1080);
  checks.push({ scenario: "synthetic landscape screenshot fitted to phone, 16:9 output", png: landscape, memory: await metrics() });

  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  await evaluate("document.querySelector('[data-testid=export]').click()");
  await waitFor(() => evaluate("document.querySelector('dialog')?.open"), "export dialog");
  await evaluate("([...document.querySelectorAll('dialog button')].find(button => button.textContent.includes('Download PNG'))).click()");
  const filename = await waitFor(async () => (await readdir(downloads)).find(file => file.endsWith(".png")), "actual PNG download");
  const downloaded = await readFile(join(downloads, filename));
  if (createHash("sha256").update(downloaded).digest("hex") !== landscape.sha256) throw new Error("Downloaded PNG differs from captured composition.");

  const finalMemory = await metrics();
  const assetBytes = {
    modelGlb: (await stat(join(root, "assets/devices/iphone-18-pro-max/iphone-18-pro-max.glb"))).size,
    defaultScreenshot: (await stat(join(root, "assets/fixtures/screens/dashboard-dark.png"))).size,
  };
  const report = {
    environment: { platform: platform(), arch: arch(), cpu: cpus()[0]?.model, totalMemoryBytes: totalmem(), browser: userAgent, viewport: "1440x960", build: "Next.js production", sampleCount: 1 },
    initialReadyMs: Math.round(readyMs),
    assetBytes,
    baselineMemory,
    checks,
    finalMemory,
    downloadedPngMatchesCaptured: true,
    caveats: ["Synthetic UI images are technical edge cases, not real user screenshots.", "JS heap metrics exclude GPU memory and other Chrome processes.", "Headless Chrome timings on one machine are not user-facing performance targets."],
  };
  await writeFile(join(evidence, "technical-checks.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  socket.close();
} finally {
  chrome.kill();
  await Promise.all([rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }), rm(downloads, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })]);
}
