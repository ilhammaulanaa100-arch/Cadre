import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = 9339;
const profile = await mkdtemp(join(tmpdir(), "forma-draft-check-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "http://127.0.0.1:3000/",
], { stdio: "ignore" });

async function waitFor(callback, label) {
  for (let attempt = 0; attempt < 120; attempt++) {
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
  const ready = () => evaluate("document.querySelector('.local-status')?.textContent.includes('Saved in this browser') && document.querySelector('[data-testid=export]')?.disabled === false");
  await send("Runtime.enable");
  await waitFor(ready, "initial draft ready");
  await evaluate(`(async () => {
    const blob = await (await fetch('/fixtures/screens/dashboard-dark.png')).blob();
    const file = new File([blob], 'recovery-test.png', { type: 'image/png' });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('input[type=file]'); input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor(() => evaluate("document.querySelector('.image-info strong')?.textContent === 'recovery-test.png'"), "image upload");
  await evaluate(`(() => {
    document.querySelector('.ratio-picker button:nth-child(2)').click();
    document.querySelector('[aria-label="Black device style"]').click();
    document.querySelector('[aria-label="Back view"]').click();
    document.querySelector('[role=tab][id=background-tab]').click();
    document.querySelector('[aria-label="Apply Electric background"]').click();
  })()`);
  await waitFor(ready, "draft autosave");
  const before = await evaluate(`(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('forma-local-drafts'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const tx = db.transaction(['drafts','images'], 'readonly');
    const read = (store, key) => new Promise((resolve, reject) => { const r = tx.objectStore(store).get(key); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const draft = await read('drafts','current');
    const image = await read('images',draft.scene.instances[0].screen.imageRef.blobId);
    db.close();
    return { format: draft.format, style: draft.scene.instances[0].materialVariantId, angle: draft.angles[1], background: draft.scene.appearance.background, imageName: draft.imageName, imageBytes: image?.size };
  })()`);
  if (before.format !== "4:3" || before.style !== "black" || before.angle !== 180 || before.background?.from !== "#ff794f" || before.imageName !== "recovery-test.png" || !before.imageBytes) {
    throw new Error(`Saved draft mismatch: ${JSON.stringify(before)}`);
  }
  await send("Page.reload", { ignoreCache: true });
  await waitFor(() => evaluate("document.querySelector('.feedback')?.textContent.includes('restored') && document.querySelector('.image-info strong')?.textContent === 'recovery-test.png' && document.querySelector('.local-status')?.textContent.includes('Saved in this browser')"), "draft restored after reload");
  const after = await evaluate(`({ ratio: document.querySelector('.ratio-picker [aria-pressed=true]')?.textContent.trim(), style: document.querySelector('.finish-option[aria-pressed=true]')?.getAttribute('aria-label'), background: document.querySelector('.artboard')?.style.background, back: document.querySelector('[aria-label="Back view"]')?.getAttribute('aria-pressed') })`);
  if (after.ratio !== "4:3" || after.style !== "Black device style" || !after.background.includes("rgb(255, 121, 79)") || after.back !== "true") {
    throw new Error(`Restored editor mismatch: ${JSON.stringify(after)}`);
  }
  await evaluate(`(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('forma-local-drafts'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const tx = db.transaction(['drafts','images'], 'readwrite');
    const draft = await new Promise((resolve, reject) => { const r = tx.objectStore('drafts').get('current'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    tx.objectStore('images').delete(draft.scene.instances[0].screen.imageRef.blobId);
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    db.close();
  })()`);
  await send("Page.reload", { ignoreCache: true });
  await waitFor(() => evaluate("document.querySelector('.local-status')?.textContent.includes('Save unavailable') && document.querySelector('.draft-error')?.textContent.includes('missing or damaged')"), "missing image warning");
  await evaluate("document.querySelector('.draft-error button').click()");
  await waitFor(ready, "new draft saved after reset");
  console.log(JSON.stringify({ status: "passed", saved: before, restored: after, missingImageRecovery: "passed" }, null, 2));
  socket.close();
} finally {
  chrome.kill();
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
