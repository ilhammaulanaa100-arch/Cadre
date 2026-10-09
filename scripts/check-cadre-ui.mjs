import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'docs/evidence/cadre');
const baseUrl = process.env.CADRE_TEST_URL ?? 'http://127.0.0.1:3000/';
const profile = await mkdtemp(join(tmpdir(), 'cadre-ui-'));
const downloads = join(profile, 'downloads');
await mkdir(output, { recursive: true });
await mkdir(downloads);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--disable-background-networking','--disable-extensions','--disable-sync','--enable-webgl','--ignore-gpu-blocklist','--no-first-run','--remote-debugging-port=9335',`--user-data-dir=${profile}`,baseUrl], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let target;
  for (let i=0;i<100;i++) {
    try { target = (await (await fetch('http://127.0.0.1:9335/json/list')).json()).find(p=>p.type==='page'); if(target) break; } catch {}
    await delay(150);
  }
  assert(target, 'Chrome opened');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=> {socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({data})=> {const result=JSON.parse(data);if(!result.id)return;const callback=pending.get(result.id);pending.delete(result.id);result.error?callback.reject(result.error):callback.resolve(result.result);});
  const send = (method,params={})=>new Promise((resolve,reject)=> {const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate = async expression => {const response=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(response.exceptionDetails)throw Error(JSON.stringify(response.exceptionDetails));return response.result.value;};
  const wait = async expression => {for(let i=0;i<240;i++){if(await evaluate(expression))return;await delay(250);}throw Error(`Timed out: ${expression}`);};
  const click = async selector => {await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await delay(180);};
  const input = async (label,value) => {await evaluate(`(() => {const el=document.querySelector('input[aria-label=${JSON.stringify(label)}]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.blur();})()`);await delay(180);};
  const shot = async name => {await delay(300);const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(data,'base64'));};
  const draft = async () => {await delay(900);return evaluate(`new Promise((resolve,reject)=> {const r=indexedDB.open('forma-local-drafts');r.onsuccess=()=> {const db=r.result;const q=db.transaction('drafts').objectStore('drafts').get('current');q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=()=>reject(q.error);};})`);};
  for(let i=0;i<180;i++) { try { const response=await fetch(baseUrl); if(response.ok)break; } catch {} await delay(500); }
  await send('Page.navigate',{url:baseUrl});
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1188,deviceScaleFactor:1,mobile:false});
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  await wait(`!!document.querySelector('.canvas-empty .sample-button') && !document.querySelector('.sample-button').disabled`);
  await evaluate('document.fonts.ready');
  assert(await evaluate(`document.fonts.check('14px "Timeless Grotesk"')`),'Original font loaded');
  assert(await evaluate(`document.querySelector('[data-testid=export]').disabled`),'Empty canvas cannot export');
  assert(await evaluate(`!['Screen fit','Details','Detail UI'].some(s=>Array.from(document.querySelectorAll('h2,button')).some(e=>e.textContent===s))`),'Removed controls');
  await shot('01-empty');
  await click('.sample-button');
  await wait(`document.querySelector('[data-testid=export]').disabled===false`);
  await shot('02-editor');
  const geometry=await evaluate(`Object.fromEntries(['.topbar','.library','.inspector','.artboard'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{x:r.x,y:r.y,width:r.width,height:r.height}]}))`);
  assert.equal(geometry['.library'].width,280);assert.equal(geometry['.inspector'].x,1144);assert.equal(geometry['.artboard'].width,800);assert.equal(geometry['.artboard'].height,450);
  const assets=await evaluate(`Array.from(document.querySelectorAll('img[src^="/ui/cadre/"]')).filter(e=>e.getClientRects().length).map(e=>({src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))`);
  assert(assets.every(a=>a.loaded),'All Figma assets loaded');
  for(const finish of ['Glacier Blue','Silver','Black','Burgundy']) {await click(`button[aria-label="${finish} device style"]`);assert(await evaluate(`document.querySelector('button[aria-label="${finish} device style"]').getAttribute('aria-pressed')==='true'`));}
  await click('#background-tab');await input('Background hex color','#f5f5f5');await click('#mockup-tab');
  await click('.ratio-picker button:first-child');
  // Capture the real device at every preset angle for the image-only gallery.
  const presets=[['Straight on','front'],['Perspective','perspective'],['Lean back','lean'],['Back view','back'],['Left buttons','left-side'],['Right buttons','right-side'],['Floating','floating'],['Landscape','landscape']];
  const previews=join(root,'assets/devices/iphone-18-pro-max/previews');await mkdir(previews,{recursive:true});
  for(const [name,file] of presets) {
    await click(`button[aria-label="${name}"]`);await delay(200);
    const data=await evaluate(`(async()=>{const src=await window.__mockup3dCaptureProof();const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=320;c.height=320;c.getContext('2d').drawImage(image,0,0,320,320);return c.toDataURL('image/png').split(',')[1];})()`);
    await writeFile(join(previews,file+'.png'),Buffer.from(data,'base64'));
    if(process.env.CADRE_TEST_URL)await copyFile(join(previews,file+'.png'),join(root,`apps/mvp/out/devices/iphone-18-pro-max/previews/${file}.png`));
    for(const app of ['web','mvp'])await copyFile(join(previews,file+'.png'),join(root,`apps/${app}/public/devices/iphone-18-pro-max/previews/${file}.png`));
  }
  await evaluate(`document.querySelectorAll('.preset-preview img').forEach(img=>img.src=img.src.split('?')[0]+'?v='+Date.now())`);
  assert(await evaluate(`Array.from(document.querySelectorAll('.preset')).every(e=>!e.textContent.trim())`),'Presets have images only');
  await click('#background-tab');await input('Background hex color','#769cb4');await click('#mockup-tab');await click('.ratio-picker button:nth-child(3)');await click('button[aria-label="Perspective"]');
  const before=await draft();
  const center=await evaluate(`(()=>{const r=document.querySelector('.artboard').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  async function drag(modifiers) {await send('Input.dispatchMouseEvent',{type:'mousePressed',...center,button:'left',clickCount:1,modifiers});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:center.x+40,y:center.y+20,button:'left',buttons:1,modifiers});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:center.x+40,y:center.y+20,button:'left',clickCount:1,modifiers});}
  await drag(0);const rotated=await draft();assert.notDeepEqual(rotated.singleSlot.angles,before.singleSlot.angles);assert.deepEqual(rotated.singleSlot.position,before.singleSlot.position);
  await drag(4);const moved=await draft();assert.deepEqual(moved.singleSlot.angles,rotated.singleSlot.angles);assert.notDeepEqual(moved.singleSlot.position,rotated.singleSlot.position);
  await click('.header-actions button:first-child');
  const reset=await draft();assert.deepEqual(reset.singleSlot.position,[0,0]);assert.deepEqual(reset.singleSlot.angles,[0,0,0]);
  await input('Scale',120);assert.equal((await draft()).singleSlot.scale,1.2);
  const file=await send('DOM.getDocument');const fileNode=await send('DOM.querySelector',{nodeId:file.root.nodeId,selector:'input[accept="image/png,image/jpeg,image/webp"]'});
  await send('DOM.setFileInputFiles',{nodeId:fileNode.nodeId,files:[join(root,'assets/fixtures/screens/dashboard-dark.png')]});await wait(`!document.querySelector('[data-testid=export]').disabled`);
  assert.equal((await draft()).singleSlot.imageName,'dashboard-dark.png');
  await input('Scale',100);
  await click('.animate-button');await click('.motion-options button:nth-child(2)');await click('.animation-settings .primary');
  await delay(500);assert(await evaluate(`Number(document.querySelector('.timeline-scrubber').value)>0`));
  await shot('03-animate');await click('.animation-settings .primary');
  await click('[data-testid=export]');assert(await evaluate(`document.querySelector('dialog').open`));await shot('04-export');
  await click('.export-dialog .primary');
  let downloaded=[];for(let i=0;i<100;i++){downloaded=await readdir(downloads);if(downloaded.some(f=>f.endsWith('.png')))break;await delay(100);}
  const png=await readFile(join(downloads,downloaded.find(f=>f.endsWith('.png'))));assert.equal(png.readUInt32BE(16),1920);assert.equal(png.readUInt32BE(20),1080);
  await click('.transform-button');await click('.header-actions button:nth-child(2)');await delay(500);
  const projectName=(await readdir(downloads)).find(f=>f.endsWith('.forma.json'));assert(projectName,'Project saved');
  await click('.header-actions button:first-child');await click('button[aria-label="Perspective"]');await delay(4500);
  await shot('05-final');
  // Reopen the exported project and verify persisted image/scale survive import.
  await send('Page.enable');
  const importedDialog=new Promise(resolve=>{const listener=({data})=>{const event=JSON.parse(data);if(event.method==='Page.javascriptDialogOpening'){socket.removeEventListener('message',listener);resolve();}};socket.addEventListener('message',listener);});
  const projectDoc=await send('DOM.getDocument');const projectInput=await send('DOM.querySelector',{nodeId:projectDoc.root.nodeId,selector:'input[aria-label="Open project file"]'});
  await send('DOM.setFileInputFiles',{nodeId:projectInput.nodeId,files:[join(downloads,projectName)]});await importedDialog;await send('Page.handleJavaScriptDialog',{accept:true});
  await wait(`!!document.querySelector('[data-testid=export]') && !document.querySelector('[data-testid=export]').disabled`);
  assert.equal((await draft()).singleSlot.imageName,'dashboard-dark.png');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await click('.animate-button');
  assert(await evaluate(`document.querySelector('.timeline').getBoundingClientRect().bottom<=900`),'Timeline stays within smaller desktop');
  await click('button[aria-label="Clear canvas"]');assert((await draft()).canvasEmpty);await send('Page.reload');await wait(`!!document.querySelector('.sample-button') && !document.querySelector('.sample-button').disabled`);assert(await evaluate(`!!document.querySelector('.canvas-empty')`));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);assert(await evaluate('document.documentElement.scrollWidth <= 390'),'No mobile horizontal overflow');await shot('06-mobile');
  const result={status:'passed',geometry,assets,checks:['Figma layout geometry and original font/assets','empty state and persistence','all four finishes','eight image-only preset renders','drag rotates','Command-drag moves without rotating','reset pose','scale','media upload','animate view and playback','PNG export 1920 × 1080','project save and reopen','900px desktop timeline','mobile layout']};
  await writeFile(join(output,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
} finally {socket?.close();chrome.kill('SIGTERM');await delay(600);await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});}
