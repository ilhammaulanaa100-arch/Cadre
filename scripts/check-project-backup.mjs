import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = 9341;
const root = await mkdtemp(join(tmpdir(), "forma-project-check-"));
const downloads = join(root, "downloads");
const { mkdir } = await import("node:fs/promises");
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
  const setProjectInput = async path => {
    const { root: document } = await send("DOM.getDocument");
    const { nodeId } = await send("DOM.querySelector", { nodeId: document.nodeId, selector: 'input[aria-label="Open Forma project file"]' });
    if (!nodeId) throw new Error("Project input missing.");
    await send("DOM.setFileInputFiles", { files: [path], nodeId });
  };
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  await waitFor(() => evaluate("document.querySelector('.local-status')?.textContent.includes('Saved in this browser') && !document.querySelector('[title=\"Download project and images\"]')?.disabled"), "editor ready");
  await evaluate(`(async () => {
    const blob = await (await fetch('/fixtures/screens/dashboard-dark.png')).blob();
    const file = new File([blob], 'backup-test.png', { type: 'image/png' });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('input[accept="image/png,image/jpeg,image/webp"]');
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor(() => evaluate("document.querySelector('.image-info strong')?.textContent === 'backup-test.png'"), "image upload");
  await evaluate("document.querySelector('.ratio-picker button:nth-child(2)').click(); document.querySelector('[aria-label=\"Back view\"]').click()");
  await waitFor(() => evaluate("document.querySelector('.ratio-picker [aria-pressed=true]')?.textContent.trim() === '4:3' && document.querySelector('[aria-label=\"Back view\"]')?.getAttribute('aria-pressed') === 'true'"), "composition updated");
  await evaluate("document.querySelector('[title=\"Download project and images\"]').click()");
  const filename = await waitFor(async () => (await readdir(downloads)).find(name => name.endsWith(".forma.json")), "project download");
  const archivePath = join(downloads, filename);
  const archive = JSON.parse(await readFile(archivePath, "utf8"));
  if (archive.kind !== "forma-project" || archive.draft.format !== "4:3" || archive.draft.angles[1] !== 180 || Object.keys(archive.images).length !== 1) {
    throw new Error("Downloaded project is incomplete.");
  }
  await evaluate("document.querySelector('.ratio-picker button:nth-child(1)').click(); window.confirm = () => true");
  await waitFor(() => evaluate("document.querySelector('.local-status')?.textContent.includes('Saved in this browser')"), "changed draft saved");
  const invalidPath = join(root, "invalid.forma.json");
  await writeFile(invalidPath, JSON.stringify({ ...archive, images: {} }));
  await setProjectInput(invalidPath);
  await waitFor(() => evaluate("document.querySelector('.feedback')?.textContent.includes('Project images are incomplete')"), "invalid project rejected");
  if (await evaluate("document.querySelector('.ratio-picker [aria-pressed=true]')?.textContent.trim()") !== "1:1") throw new Error("Invalid file changed the draft.");
  await setProjectInput(archivePath);
  await waitFor(() => evaluate("document.querySelector('.ratio-picker [aria-pressed=true]')?.textContent.trim() === '4:3' && document.querySelector('.image-info strong')?.textContent === 'backup-test.png' && document.querySelector('[aria-label=\"Back view\"]')?.getAttribute('aria-pressed') === 'true'"), "project restored");
  console.log(JSON.stringify({ status: "passed", archiveBytes: (await readFile(archivePath)).length, invalidFileRejected: true, restored: true }));
  socket.close();
} finally {
  chrome.kill();
  await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
