import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const profile = await mkdtemp(join(tmpdir(), "forma-duo-check-"));
const port = 9345;
const serverPort = Number(process.env.FORMA_TEST_PORT ?? 3000);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-extensions", "--disable-background-networking", "--no-first-run",
  "--enable-webgl", "--ignore-gpu-blocklist", `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, `http://localhost:${serverPort}/`,
], { stdio: "ignore" });

async function waitFor(check, label) {
  for (let attempt = 0; attempt < 120; attempt++) {
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
  await waitFor(() => evaluate("document.querySelector('[data-testid=export]')?.disabled === false"), "initial preview");
  await evaluate("document.querySelector('.device-card').click()");
  await waitFor(() => evaluate("document.querySelector('.mockup-picker')?.open"), "picker opened");
  const options = await evaluate("[...document.querySelectorAll('.mockup-options button')].map(button => button.textContent)");
  if (options.length !== 2 || !options[1].includes("One foldable device")) throw new Error(`Incorrect picker: ${options}`);
  await evaluate("document.querySelector('.mockup-options button:nth-child(2)').click()");
  await waitFor(() => evaluate("document.querySelector('.render-canvas canvas') && document.querySelector('[data-testid=export]')?.disabled === false"), "Duo render");
  if (await evaluate("document.querySelectorAll('.instance-picker button').length !== 2")) throw new Error("Outer/inner selection missing");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Closed')?.click()");
  await waitFor(() => evaluate("document.querySelector('input[aria-label=\"Fold angle\"]')?.value === '0'"), "Closed pose");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Open')?.click()");
  await waitFor(() => evaluate("document.querySelector('input[aria-label=\"Fold angle\"]')?.value === '180'"), "Open pose");
  await waitFor(() => evaluate("document.querySelector('.local-status')?.textContent?.includes('Saved in this browser')"), "Duo draft saved");
  await send("Page.reload", { ignoreCache: true });
  await waitFor(() => evaluate("document.querySelector('.device-card strong')?.textContent === 'iPhone Duo' && !!document.querySelector('.render-canvas canvas') && document.querySelector('[data-testid=export]')?.disabled === false"), "Duo restored");
  await evaluate("document.querySelector('.device-card').click()");
  await waitFor(() => evaluate("document.querySelector('.mockup-picker')?.open"), "picker reopened");
  await evaluate("document.querySelector('.mockup-options button:nth-child(1)').click()");
  await waitFor(() => evaluate("document.querySelector('.device-card strong')?.textContent === 'iPhone 18 Pro Max' && document.querySelector('[data-testid=export]')?.disabled === false"), "iPhone preview restored");
  console.log("iPhone Duo: one foldable renderer, hinge poses, draft persistence, and iPhone return verified.");
  socket.close();
} finally {
  chrome.kill("SIGTERM");
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
