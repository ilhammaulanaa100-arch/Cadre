import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const sourcePath = process.argv[2];
const outputName = process.argv[3] ?? "user-sample";
if (!sourcePath || !/^[a-z0-9-]+$/.test(outputName)) throw new Error("Usage: node scripts/check-user-sample.mjs <PNG path> [output-name]");
const source = await readFile(sourcePath);
const profile = await mkdtemp(join(tmpdir(), "forma-user-sample-"));
const downloads = await mkdtemp(join(tmpdir(), "forma-user-download-"));
const evidence = join(process.cwd(), "docs/evidence/t3-07/private");
await mkdir(evidence, { recursive: true });
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-background-networking", "--disable-extensions", "--no-first-run",
  "--window-size=1440,1000", "--remote-debugging-port=9342", `--user-data-dir=${profile}`,
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
    const response = await fetch("http://127.0.0.1:9342/json/list");
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
  const ready = () => evaluate("document.querySelector('[data-testid=export]')?.disabled === false");
  await waitFor(ready, "editor ready");
  await evaluate("([...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Straight on')).click()");
  const imageBase64 = source.toString("base64");
  const filename = basename(sourcePath);
  await evaluate(`(() => {
    const binary=atob(${JSON.stringify(imageBase64)});
    const bytes=Uint8Array.from(binary, char => char.charCodeAt(0));
    const transfer=new DataTransfer();
    transfer.items.add(new File([bytes], ${JSON.stringify(filename)}, {type:'image/png'}));
    const input=document.querySelector('input[type=file]');
    input.files=transfer.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(() => evaluate(`document.querySelector('.image-info strong')?.textContent === ${JSON.stringify(filename)} && document.querySelector('[data-testid=export]')?.disabled === false`), "user screenshot upload");
  const dimensions = await evaluate("document.querySelector('.image-info small')?.textContent");
  const sourceWidth = source.readUInt32BE(16), sourceHeight = source.readUInt32BE(20);
  const expectedFit = Math.abs(sourceWidth / sourceHeight / (1320 / 2868) - 1) > 0.03 ? "fit" : "fill";
  const actualFit = await evaluate("[...document.querySelectorAll('.segmented button[aria-pressed=true]')].find(button => ['Fit image','Fill screen'].includes(button.textContent.trim()))?.textContent.trim()");
  if (actualFit !== (expectedFit === "fit" ? "Fit image" : "Fill screen")) throw new Error(`Auto fit mismatch: expected ${expectedFit}, got ${actualFit}`);
  const autoPadding = expectedFit === "fit" ? await evaluate("document.querySelector('input[aria-label=" + JSON.stringify("Padding color") + "]')?.value") : null;
  if (outputName.includes("rava3") && autoPadding !== "#FFFFFF") throw new Error(`Expected white padding for Rava 3, got ${autoPadding}`);
  const capture = async (suffix, width = 1200, height = 1200) => {
    const dataUrl = await evaluate("window.__mockup3dCaptureProof()");
    const png = Buffer.from(dataUrl.split(",")[1], "base64");
    if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) throw new Error("PNG dimensions mismatch.");
    const path = join(evidence, `${outputName}-${suffix}.png`);
    await writeFile(path, png);
    return { path, width, height, bytes: png.length, sha256: createHash("sha256").update(png).digest("hex") };
  };
  const autoDefault = await capture("auto-default-front");
  await evaluate("([...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Fill screen')).click()");
  await waitFor(() => evaluate("[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Fill screen' && button.getAttribute('aria-pressed') === 'true')"), "fill mode");
  const fill = await capture("fill-front");
  await evaluate("([...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Fit image')).click()");
  await waitFor(() => evaluate("[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Fit image' && button.getAttribute('aria-pressed') === 'true')"), "fit mode");
  const fit = await capture("fit-front");
  await evaluate(`(() => {
    const input=document.querySelector('input[aria-label="Padding color picker"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'#101116');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(() => evaluate("document.querySelector('input[aria-label=" + JSON.stringify("Padding color") + "]')?.value === '#101116'"), "custom screen padding");
  const fitCustomPadding = await capture("fit-custom-padding-front");
  if (outputName.includes("rava3") && fitCustomPadding.sha256 === fit.sha256) throw new Error("Manual padding override did not change the Rava 3 PNG.");
  await evaluate(`(() => {
    const input=document.querySelector('input[aria-label="Padding color picker"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'#ffffff');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(() => evaluate("document.querySelector('input[aria-label=" + JSON.stringify("Padding color") + "]')?.value === '#FFFFFF'"), "white screen padding");
  const fitWhite = await capture("fit-white-front");
  await evaluate("([...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Perspective')).click()");
  await waitFor(() => evaluate("document.querySelector('[aria-label=Perspective]')?.getAttribute('aria-pressed') === 'true'"), "perspective pose");
  const perspective = await capture("fit-white-perspective");
  await evaluate("([...document.querySelectorAll('.ratio-picker button')].find(button => button.textContent.trim() === '9:16')).click()");
  await waitFor(() => evaluate("document.querySelector('.ratio-picker button[aria-pressed=true]')?.textContent.trim() === '9:16'"), "portrait output ratio");
  const portraitPerspective = await capture("fit-white-perspective-portrait", 1080, 1920);
  await evaluate(`document.querySelector('[aria-label="Detail UI preset"]').click()`);
  await waitFor(() => evaluate(`document.querySelector('[aria-label="Detail UI preset"]')?.getAttribute('aria-pressed') === 'true'`), "detail UI preset");
  await new Promise(resolve => setTimeout(resolve, 300));
  const portraitFront = await capture("fit-white-front-portrait", 1080, 1920);
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  await evaluate("document.querySelector('[data-testid=export]').click()");
  await waitFor(() => evaluate("document.querySelector('dialog')?.open"), "export dialog");
  await evaluate("([...document.querySelectorAll('dialog button')].find(button => button.textContent.includes('Download PNG'))).click()");
  const downloadedName = await waitFor(async () => (await readdir(downloads)).find(file => file.endsWith(".png")), "PNG download");
  const downloaded = await readFile(join(downloads, downloadedName));
  if (createHash("sha256").update(downloaded).digest("hex") !== portraitFront.sha256) throw new Error("Downloaded PNG differs from selected preview frame.");
  console.log(JSON.stringify({ source: filename, sourceDimensions: dimensions, sourceBytes: source.length, expectedFit, actualFit, autoPadding, autoDefault, fill, fit, fitCustomPadding, fitWhite, perspective, portraitPerspective, portraitFront, downloadedPngMatches: true }, null, 2));
  socket.close();
} finally {
  chrome.kill();
  await Promise.all([rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }), rm(downloads, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })]);
}
