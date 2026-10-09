import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "docs", "evidence", "current-render-proof.png");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9333;
const profile = await mkdtemp(join(tmpdir(), "mockup3d-chrome-"));

const chrome = spawn(
  chromePath,
  [
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--enable-webgl",
    "--hide-scrollbars",
    "--ignore-gpu-blocklist",
    "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-position=50,50",
    "--window-size=1000,800",
    "http://localhost:3000/",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let chromeErrors = "";
chrome.stderr.on("data", (chunk) => {
  chromeErrors = `${chromeErrors}${String(chunk)}`.slice(-8000);
});

async function findPageTarget() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find(
        (target) => target.type === "page" && target.url.startsWith("http://localhost:3000"),
      );
      if (page) return page;
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }

  throw new Error("Timed out waiting for the renderer page");
}

async function connectCdp(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (!message.id) return;
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  });

  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { reject, resolve }));
    },
  };
}

try {
  const target = await findPageTarget();
  const cdp = await connectCdp(target.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");

  let ready = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const result = await cdp.send("Runtime.evaluate", {
      expression:
        "typeof window.__mockup3dCaptureProof === 'function' && document.querySelector('[data-testid=export]')?.disabled === false",
      returnByValue: true,
    });
    ready = result.result.value === true;
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  if (!ready) {
    const diagnostics = await cdp.send("Runtime.evaluate", {
      expression: `JSON.stringify({
        body: document.body?.innerText,
        canvases: document.querySelectorAll('canvas').length,
        captureType: typeof window.__mockup3dCaptureProof,
        resources: performance.getEntriesByType('resource')
          .map(({ name, transferSize }) => ({ name, transferSize }))
          .filter(({ name }) => name.includes('fixtures')),
        title: document.title
      })`,
      returnByValue: true,
    });
    throw new Error(
      `Renderer did not become ready\n${diagnostics.result.value}\n${chromeErrors}`,
    );
  }

  const captured = await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression: "window.__mockup3dCaptureProof()",
    returnByValue: true,
  });
  if (captured.exceptionDetails) {
    throw new Error(
      `Renderer capture threw an exception: ${JSON.stringify(captured.exceptionDetails)}`,
    );
  }

  const dataUrl = captured.result.value;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
    throw new Error("Renderer returned an invalid PNG data URL");
  }

  const png = Buffer.from(dataUrl.slice("data:image/png;base64,".length), "base64");
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== 1200 || height !== 1200) {
    throw new Error(`Expected 1200x1200 PNG, received ${width}x${height}`);
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, png);
  console.log(
    JSON.stringify({
      bytes: png.byteLength,
      height,
      output,
      sha256: createHash("sha256").update(png).digest("hex"),
      width,
    }),
  );
  cdp.close();
} finally {
  chrome.kill("SIGTERM");
  await new Promise((resolve) => {
    chrome.once("exit", resolve);
    setTimeout(resolve, 2000);
  });
  await rm(profile, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 }).catch(
    () => undefined,
  );
}
