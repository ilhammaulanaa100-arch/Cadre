import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "docs", "evidence", "t3-04-editor-export.png");
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
    for (let i=0; i<160; i++) {
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
  const screenshot = await cdp.send('Page.captureScreenshot', {format:'png'});
  await writeFile(join(root,'docs/evidence/t3-04-editor-ui.png'),Buffer.from(screenshot.data,'base64'));
  const initialHash = await capture('t3-04-editor-export.png',1200,1200);
  await click('Straight on');
  await setInput('Turn Y',25);
  await setInput('Position X',8);
  const angleBefore = await evaluate(`document.querySelector('input[aria-label="Turn Y"]').value`);
  await evaluate(`(async () => {
    const c=document.createElement('canvas');c.width=1200;c.height=800;const ctx=c.getContext('2d');
    ctx.fillStyle='#ef615a';ctx.fillRect(0,0,600,800);ctx.fillStyle='#537ee8';ctx.fillRect(600,0,600,800);
    ctx.fillStyle='white';ctx.font='bold 85px sans-serif';ctx.fillText('LEFT',60,200);ctx.fillText('RIGHT',680,200);ctx.fillText('TOP ↑',380,100);ctx.fillText('BOTTOM',390,710);
    const blob=await new Promise(r=>c.toBlob(r));const dt=new DataTransfer();dt.items.add(new File([blob],'landscape-test.png',{type:'image/png'}));
    const input=document.querySelector('input[type=file]');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await wait(`document.querySelector('.image-info strong').textContent==='landscape-test.png' && !document.querySelector('[data-testid="export"]').disabled`);
  if(await evaluate(`document.querySelector('input[aria-label="Turn Y"]').value`)!==angleBefore) throw new Error('Upload changed pose');
  if(await evaluate(`document.querySelector('input[aria-label="Position X"]').value`)!=='8') throw new Error('Upload changed position');
  await setInput('Crop horizontal',0);
  const leftHash=await capture('t3-04-crop-left.png',1200,1200);
  await setInput('Crop horizontal',100);
  const rightHash=await capture('t3-04-crop-right.png',1200,1200);
  if(leftHash===rightHash) throw new Error('Crop had no effect');
  await click('Fit image');
  await click('Straight on');
  await setInput('Position X',0);
  await capture('t3-04-fit-screen.png',1200,1200);
  await evaluate(`(() => {const dt=new DataTransfer();dt.items.add(new File(['invalid'],'bad.txt',{type:'text/plain'})); const input=document.querySelector('input[type=file]');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await wait(`!!document.querySelector('[role=alert]')`);
  if(await evaluate(`document.querySelector('.image-info strong').textContent`)!=='landscape-test.png') throw new Error('Invalid upload replaced image');
  await evaluate(`(() => {const dt=new DataTransfer();dt.items.add(new File(['broken image'],'bad.png',{type:'image/png'})); const input=document.querySelector('input[type=file]');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await wait(`document.querySelector('[role=alert]')?.textContent.includes('tidak bisa dibaca')`);
  if(await evaluate(`document.querySelector('.image-info strong').textContent`)!=='landscape-test.png') throw new Error('Corrupt image replaced screen');
  await click('16:9');
  await capture('t3-04-landscape.png',1920,1080);
  await click('9:16');
  await capture('t3-04-portrait.png',1080,1920);
  await click('1:1');
  await click('Background');
  await click('Solid');
  const bounds=await evaluate(`(() => {const r=document.querySelector('.artboard').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await setInput('Background hex color','#123456');
  await wait(`document.querySelector('input[aria-label="Background hex color picker"]').value==='#123456'`);
  await evaluate(`document.querySelector('input[aria-label="Background hex color"]').focus()`);
  await setInput('Background hex color','ABC');
  await evaluate(`document.querySelector('input[aria-label="Background hex color"]').blur()`);
  await wait(`document.querySelector('input[aria-label="Background hex color"]').value==='#AABBCC' && document.querySelector('input[aria-label="Background hex color picker"]').value==='#aabbcc'`);
  await evaluate(`document.querySelector('input[aria-label="Background hex color"]').focus()`);
  await setInput('Background hex color','#ZZZZZZ');
  await evaluate(`document.querySelector('input[aria-label="Background hex color"]').blur()`);
  await wait(`document.querySelector('input[aria-label="Background hex color"]').value==='#AABBCC'`);
  const scaleBeforeWheel=Number(await evaluate(`document.querySelector('input[aria-label="Scale"]').value`));
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',...bounds,deltaX:0,deltaY:-80});
  await wait(`Number(document.querySelector('input[aria-label="Scale"]').value)>${scaleBeforeWheel}`);
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',...bounds,deltaX:0,deltaY:-2000,modifiers:2});
  await wait(`document.querySelector('input[aria-label="Scale"]').value==='160'`);
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',...bounds,deltaX:0,deltaY:2000,modifiers:2});
  await wait(`document.querySelector('input[aria-label="Scale"]').value==='40'`);
  await setInput('Scale',100);
  await wait(`document.querySelector('input[aria-label="Scale"]').value==='100'`);
  const rotateBounds=await evaluate(`(() => {const r=document.querySelector('.artboard').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...rotateBounds,button:'left',clickCount:1});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rotateBounds.x+80,y:rotateBounds.y+40,button:'left',buttons:1});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rotateBounds.x+80,y:rotateBounds.y+40,button:'left',clickCount:1});
  await wait(`Number(document.querySelector('input[aria-label="Turn Y"]').value)>0`);
  await click('Move');
  const moveBounds=await evaluate(`(() => {const r=document.querySelector('.artboard').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...moveBounds,button:'left',clickCount:1});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:moveBounds.x+40,y:moveBounds.y,button:'left',buttons:1});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:moveBounds.x+40,y:moveBounds.y,button:'left',clickCount:1});
  await wait(`Number(document.querySelector('input[aria-label="Position X"]').value)>0`);
  await click('Reset view');
  await wait(`document.querySelector('input[aria-label="Position X"]').value==='0' && document.querySelector('input[aria-label="Turn Y"]').value==='0'`);
  await click('Animate');
  await click('Turntable');
  await setInput('Motion duration',6);
  await wait(`document.querySelector('input[aria-label="Timeline playhead"]').max==='6'`);
  await setInput('Timeline playhead',0);
  const turntableStartHash=await capture('t3-05-turntable-start.png',1200,1200);
  await setInput('Timeline playhead',3);
  const turntableMidHash=await capture('t3-05-turntable-mid.png',1200,1200);
  if(turntableStartHash===turntableMidHash) throw new Error('Turntable playhead did not change the rendered frame');
  await setInput('Timeline playhead',0);
  if(await capture('t3-05-turntable-loop.png',1200,1200)!==turntableStartHash) throw new Error('Turntable evaluation drifted at the same playhead');
  await evaluate(`document.querySelector('[aria-label="Play animation"]').click()`);
  await wait(`Number(document.querySelector('input[aria-label="Timeline playhead"]').value)>.15`);
  await setInput('Turn Y',15);
  await wait(`!!document.querySelector('[aria-label="Play animation"]')`);
  const pausedAt=Number(await evaluate(`document.querySelector('input[aria-label="Timeline playhead"]').value`));
  await new Promise(resolve=>setTimeout(resolve,300));
  const pausedAfter=Number(await evaluate(`document.querySelector('input[aria-label="Timeline playhead"]').value`));
  if(Math.abs(pausedAfter-pausedAt)>.01) throw new Error('Editing the base pose did not pause playback');
  await setInput('Timeline playhead',1.5);
  const selectedFrameHash=await capture('t3-05-selected-frame.png',1200,1200);
  const motionScreenshot = await cdp.send('Page.captureScreenshot', {format:'png'});
  await writeFile(join(root,'docs/evidence/t3-05-motion-ui.png'),Buffer.from(motionScreenshot.data,'base64'));
  await evaluate(`document.querySelector('[data-testid="export"]').click()`);
  await wait(`document.querySelector('dialog').open`);
  if(!await evaluate(`document.querySelector('dialog').textContent.includes('Turntable · 1.50s')`)) throw new Error('Export dialog omitted selected frame');
  if(await capture('t3-05-export-dialog-frame.png',1200,1200)!==selectedFrameHash) throw new Error('Export dialog changed the selected frame');
  await evaluate(`document.querySelector('[aria-label="Close export"]').click()`);
  await wait(`!document.querySelector('dialog').open`);
  const downloads = await mkdtemp(join(tmpdir(),'mockup3d-download-'));
  try {
    await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
    await evaluate(`document.querySelector('[data-testid="export"]').click()`);
    await click('Download PNG');
    let files=[];
    for(let i=0;i<80;i++) { files=await readdir(downloads); if(files.some(f=>f.endsWith('.png'))) break; await new Promise(r=>setTimeout(r,125)); }
    const filename=files.find(f=>f.endsWith('.png'));
    if(!filename) throw new Error('Download did not produce a PNG');
    const png=await readFile(join(downloads,filename));
    if(png.readUInt32BE(16)!==1200 || png.readUInt32BE(20)!==1200) throw new Error('Downloaded PNG dimensions mismatch');
    if(createHash('sha256').update(png).digest('hex')!==selectedFrameHash) throw new Error('Downloaded PNG did not match the selected frame');
  } finally { await rm(downloads,{recursive:true,force:true}); }
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await new Promise(r=>setTimeout(r,400));
  if(await evaluate('document.documentElement.scrollWidth>window.innerWidth')) throw new Error('Narrow layout overflows');
  await capture('t3-04-narrow-export.png',1200,1200);
  const mobile = await cdp.send('Page.captureScreenshot',{format:'png'});
  await writeFile(join(root,'docs/evidence/t3-04-narrow-ui.png'),Buffer.from(mobile.data,'base64'));
  const result={status:'passed' , checks:['initial renderer ready','upload preserves transform','landscape crop edges change output','fit mapping','invalid and corrupt uploads preserve image','three PNG aspect ratios','manual 3/6-digit hex background','invalid hex rollback','trackpad wheel updates scale','scale clamps to inspector range','pointer rotate','pointer move','reset','turntable scrub changes frame','absolute playhead is deterministic','play advances absolute time','pose edit pauses playback','export dialog preserves selected frame','downloaded PNG','preview/export aspect parity','narrow layout'],initialHash,turntableStartHash,turntableMidHash};
  await writeFile(join(root,'docs/evidence/t3-05-checks.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
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
