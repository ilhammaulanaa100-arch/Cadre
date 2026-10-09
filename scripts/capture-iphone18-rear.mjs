import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "docs", "evidence", "iphone-18/editor-export.png");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9335;
const profile = await mkdtemp(join(tmpdir(), "mockup3d-chrome-"));

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
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
    "--window-size=1440,1000",
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
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  const evaluate = async expression => {
    const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async expression => {
    for (let i=0; i<480; i++) {
      if (await evaluate(expression)) return;
      await new Promise(resolve => setTimeout(resolve,125));
    }
    throw new Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText')}`);
  };
  const click = async text => {
    await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label') || b.textContent.trim())===${JSON.stringify(text)}); if(!b) throw new Error('Button missing'); b.click(); })()`);
    await new Promise(resolve=>setTimeout(resolve,120));
  };
  const setInput = async (label, value) => {
    await evaluate(`(() => { const input=document.querySelector('input[aria-label="${label}"],select[aria-label="${label}"]'); const prototype=input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(input,${JSON.stringify(String(value))}); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await new Promise(resolve=>setTimeout(resolve,150));
  };
  const capture = async (name, width, height) => {
    await wait(`(() => {const r=document.querySelector('.artboard').getBoundingClientRect();return r.height>0 && Math.abs(r.width/r.height-${width/height})<0.005;})()`);
    const ratio = await evaluate(`(() => {const r=document.querySelector('.artboard').getBoundingClientRect();return r.width/r.height;})()`);
    if (Math.abs(ratio-width/height)>0.005) throw new Error('Preview aspect differs from export: '+ratio+' '+await evaluate(`JSON.stringify({style:document.querySelector('.artboard').getAttribute('style'),stage:document.querySelector('.stage').getBoundingClientRect().toJSON(),board:document.querySelector('.artboard').getBoundingClientRect().toJSON()})`));
    const dataUrl = await evaluate('window.__mockup3dCaptureProof()');
    const png = Buffer.from(dataUrl.split(',')[1], 'base64');
    if (png.readUInt32BE(16)!==width || png.readUInt32BE(20)!==height) throw new Error('PNG dimensions mismatch');
    await writeFile(join(root,'docs/evidence',name),png);
    return createHash('sha256').update(png).digest('hex');
  };
  await wait(`typeof window.__mockup3dCaptureProof==='function' && document.querySelector('[data-testid="export"]')?.disabled===false`);
  await mkdir(join(root, 'docs/evidence/iphone-18-official-colors'), {recursive:true});
  await click('Back view');
  await click('Background'); await click('Solid');
  await setInput('Background hex color','#f5f5f7');
  await evaluate(`document.querySelector('input[aria-label="Background hex color"]').blur()`);
  await click('Mockup');
  for (const finish of ['Burgundy','Glacier Blue','Silver','Black']) {
    await click(finish + ' device style');
    await capture('iphone-18-official-colors/' + finish.toLowerCase().replaceAll(' ', '-') + '-web.png',1200,1200);
  }
  await click('Burgundy device style');
  await setInput('Turn Y',155);
  await setInput('Tilt X',-7);
  await capture('iphone-18-official-colors/three-quarter-web.png',1200,1200);
  const screenshot=await cdp.send('Page.captureScreenshot',{format:'png'});
  await writeFile(join(root,'docs/evidence/iphone-18-official-colors/forma-ui.png'),Buffer.from(screenshot.data,'base64'));
  console.log('Rear views captured');
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
