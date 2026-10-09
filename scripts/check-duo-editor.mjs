import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const profile = await mkdtemp(join(tmpdir(), "forma-duo-check-"));
const downloads = join(profile, "downloads");
const evidence = new URL("../docs/evidence/iphone-duo/", import.meta.url);
await mkdir(downloads);
const port = 9345;
const serverPort = Number(process.env.FORMA_TEST_PORT ?? 3000);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  "--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, `http://localhost:${serverPort}/`,
], { stdio: "ignore" });

async function waitFor(check, label, attempts = 120) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const value = await check().catch(() => null);
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 125));
  }
  throw new Error(`Timed out: ${label}`);
}

try {
  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    return (await response.json()).find(item => item.type === "page" && item.url.startsWith(`http://localhost:${serverPort}`));
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
    const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  await waitFor(() => evaluate("document.querySelector('.sample-button') && !document.querySelector('.sample-button').disabled"), "editor ready");
  await evaluate("document.querySelector('.sample-button').click()");
  await waitFor(() => evaluate("document.querySelector('[data-testid=export]')?.disabled === false"), "initial preview");
  await evaluate("document.querySelector('.device-card').click()");
  await waitFor(() => evaluate("document.querySelector('.mockup-picker')?.open"), "picker opened");
  const options = await evaluate("[...document.querySelectorAll('.mockup-options button')].map(button => button.textContent)");
  if (options.length !== 2 || !options[1].includes("One foldable device")) throw new Error(`Incorrect picker: ${options}`);
  await evaluate("document.querySelector('.mockup-options button:nth-child(2)').click()");
  await waitFor(() => evaluate("document.querySelector('.render-canvas canvas') && document.querySelector('[data-testid=export]')?.disabled === false"), "Duo render");
  if (await evaluate("document.querySelectorAll('.instance-picker button').length !== 2")) throw new Error("Outer/inner selection missing");
  await evaluate("[...document.querySelectorAll('section.control-section')].find(section => section.querySelector('h2')?.textContent === 'iPhone Duo')?.querySelectorAll('.segmented')[1]?.querySelectorAll('button')[0]?.click()");
  await waitFor(() => evaluate("document.querySelector('input[aria-label=\"Fold angle\"]')?.value === '0'"), "Closed pose");
  await evaluate("[...document.querySelectorAll('section.control-section')].find(section => section.querySelector('h2')?.textContent === 'iPhone Duo')?.querySelectorAll('.segmented')[1]?.querySelectorAll('button')[2]?.click()");
  await waitFor(() => evaluate("document.querySelector('input[aria-label=\"Fold angle\"]')?.value === '180'"), "Open pose");
  const exports = [];
  for (const [name, index, angle] of [["open", 2, 180], ["seated", 1, 95], ["closed", 0, 0]]) {
    if (name !== "open") {
      await evaluate(`[...document.querySelectorAll('section.control-section')].find(section => section.querySelector('h2')?.textContent === 'iPhone Duo')?.querySelectorAll('.segmented')[1]?.querySelectorAll('button')[${index}]?.click()`);
      await waitFor(() => evaluate(`document.querySelector('input[aria-label="Fold angle"]')?.value === '${angle}'`), `${name} pose`);
    }
    await waitFor(() => evaluate("!!document.querySelector('[aria-label=\"Play opening animation\"]') && document.querySelector('[data-testid=export]')?.disabled === false"), `${name} render ready`);
    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(new URL(`qa-${name}-editor.png`, evidence), Buffer.from(screenshot.data, "base64"));
    const before = new Set(await readdir(downloads));
    await evaluate("document.querySelector('[data-testid=export]').click(); document.querySelector('.export-dialog .primary').click()");
    const downloaded = await waitFor(async () => {
      const names = (await readdir(downloads)).filter(item => item.endsWith(".png") && !before.has(item));
      for (const item of names) if ((await stat(join(downloads, item))).size > 1000) return item;
      return null;
    }, `${name} PNG download`, 480).catch(async error => {
      const state = await evaluate("({ dialog: document.querySelector('.export-dialog')?.open, error: document.querySelector('.export-error')?.textContent, busy: document.querySelector('.export-dialog .primary')?.textContent })");
      throw new Error(`${error.message}; ${JSON.stringify(state)}; files=${JSON.stringify(await readdir(downloads))}`);
    });
    const bytes = await readFile(join(downloads, downloaded));
    if (bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" || bytes.readUInt32BE(16) !== 1920 || bytes.readUInt32BE(20) !== 1080) throw new Error(`Invalid ${name} PNG: ${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}, ${bytes.length} bytes`);
    await copyFile(join(downloads, downloaded), new URL(`qa-${name}-export.png`, evidence));
    await rm(join(downloads, downloaded));
    exports.push({ pose: name, angle, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  }
  if (new Set(exports.map(item => item.sha256)).size !== 3) throw new Error("Fold poses produced identical PNG exports");
  await evaluate("[...document.querySelectorAll('section.control-section')].find(section => section.querySelector('h2')?.textContent === 'iPhone Duo')?.querySelectorAll('.segmented')[1]?.querySelectorAll('button')[2]?.click()");
  await waitFor(() => evaluate("document.querySelector('input[aria-label=\"Fold angle\"]')?.value === '180'"), "reopened pose");
  await evaluate("document.querySelector('[aria-label=\"Inner screen\"]').click()");
  await evaluate(`(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 600;
    const context = canvas.getContext('2d'); context.fillStyle = '#ed2c91'; context.fillRect(0, 0, 900, 600);
    context.fillStyle = '#ffffff'; context.font = 'bold 100px sans-serif'; context.fillText('INNER QA', 100, 325);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'inner-qa.png', { type: 'image/png' }));
    const input = document.querySelector('input[type=file][accept*=image]'); input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor(() => evaluate("document.querySelector('[aria-label=\"Inner screen\"]')?.getAttribute('aria-pressed') === 'true' && document.querySelector('.media-thumbnail') && document.querySelector('[data-testid=export]')?.disabled === false"), "separate inner upload");
  await waitFor(() => evaluate("!!document.querySelector('[aria-label=\"Play opening animation\"]')"), "inner render ready");
  await evaluate("document.querySelector('[data-testid=export]').click(); document.querySelector('.export-dialog .primary').click()");
  const innerDownload = await waitFor(async () => (await readdir(downloads)).find(item => item.endsWith(".png")), "custom inner PNG", 480);
  const innerBytes = await readFile(join(downloads, innerDownload));
  const customInnerHash = createHash("sha256").update(innerBytes).digest("hex");
  if (customInnerHash === exports[0].sha256) throw new Error("Separate inner upload did not change the open PNG");
  await copyFile(join(downloads, innerDownload), new URL("qa-custom-inner-export.png", evidence));
  await waitFor(() => evaluate("document.querySelector('.local-status')?.textContent?.includes('Saved in this browser')"), "Duo draft saved");
  await send("Page.reload", { ignoreCache: true });
  await waitFor(() => evaluate("document.querySelector('.device-card strong')?.textContent === 'iPhone Duo' && document.querySelector('[aria-label=\"Inner screen\"]')?.getAttribute('aria-pressed') === 'true' && !!document.querySelector('.media-thumbnail') && !!document.querySelector('.render-canvas canvas') && document.querySelector('[data-testid=export]')?.disabled === false"), "Duo inner draft restored");
  await evaluate("document.querySelector('.device-card').click()");
  await waitFor(() => evaluate("document.querySelector('.mockup-picker')?.open"), "picker reopened");
  await evaluate("document.querySelector('.mockup-options button:nth-child(1)').click()");
  await waitFor(() => evaluate("document.querySelector('.device-card strong')?.textContent === 'Iphone 18 ProMax' && document.querySelector('[data-testid=export]')?.disabled === false"), "iPhone preview restored");
  await writeFile(new URL("qa-exports.json", evidence), JSON.stringify({ status: "passed", exports, customInnerHash }, null, 2) + "\n");
  console.log("iPhone Duo: fold poses, separate inner upload, four real PNG exports, draft persistence, and iPhone return verified.");
  socket.close();
} finally {
  chrome.kill("SIGTERM");
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
