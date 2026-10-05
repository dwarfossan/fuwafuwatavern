import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve(process.argv[2]||'.');
const targets=/\/(portraits\/(party_heads|mira_noface|ada_noface|brun_noface|liliana_noface)|scenes\/caravan_encounter|faces\/(mira|ada|brun|liliana)\/sheet)\.webp$/;
const server=http.createServer(async(req,res)=>{try{
 const file=path.join(root,new URL(req.url,'http://localhost').pathname);const body=await fs.readFile(file);
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webp')?'image/webp':'application/octet-stream');
 // 100 KiB/s，每份圖片120ms延遲；所有版本採完全相同冷快取條件。
 if(targets.test(file))await new Promise(r=>setTimeout(r,120+body.length/102.4));res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/index.html`;
const br=await chromium.launch();
try{
 const results=[];for(const kind of ['cover','ambush','inn','smith','guild','items']){
  const ctx=await br.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',route=>route.request().url().startsWith(url.split('/index.html')[0])?route.continue():route.abort());
  const start=performance.now();await p.goto(url+(kind==='cover'?'':kind==='ambush'?'#ambush':'#town'),{waitUntil:'domcontentloaded'});
  let at=start,selector=kind==='cover'?'.cover-party':kind==='ambush'?'.scene-bg img':'.actor .portrait img';
  if(!['cover','ambush'].includes(kind)){at=performance.now();await p.locator(`[data-town-place="${kind}"]`).tap();}
  await p.waitForFunction(sel=>{const imgs=[...document.querySelectorAll(sel)];return imgs.length&&imgs.every(i=>i.complete&&i.naturalWidth>0);},selector);
  await p.locator(selector).evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  if(!['cover','ambush'].includes(kind))assert(await p.locator('.actor .portrait').evaluate(el=>el.classList.contains('portrait-ready')));
  const elapsed=Math.round(performance.now()-at);
  const timing=await p.locator(selector).evaluateAll(imgs=>imgs.map(i=>{const e=performance.getEntriesByName(i.src).at(-1);return {start:Math.round(e.startTime),duration:Math.round(e.duration)};}));
  const bytes=await p.locator(selector).evaluateAll(imgs=>imgs.reduce((sum,i)=>sum+(performance.getEntriesByName(i.src).at(-1)?.decodedBodySize||0),0));
  await p.screenshot({path:`/tmp/image-first-${path.basename(root)}-${kind}.png`});assert.deepEqual(errors,[]);
  if(root===process.cwd())assert(bytes<(['cover','ambush'].includes(kind)?80000:200000),kind+' 首次圖片量超標');
  await ctx.close();results.push({kind,ms:elapsed,bytes,timing});
 }console.log(JSON.stringify(results));
}finally{await br.close();await new Promise(r=>server.close(r));}
