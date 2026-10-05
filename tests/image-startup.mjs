import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=path.resolve(process.argv[2]||'.'),current=root===process.cwd();
const server=http.createServer(async(req,res)=>{try{const file=path.join(root,new URL(req.url,'http://localhost').pathname),body=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');if(file.endsWith('.webp'))await new Promise(r=>setTimeout(r,350+body.length/102.4));res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/index.html`,br=await chromium.launch();
try{
 const out=[];
 for(const hash of ['', '#ambush','#town']){
  const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let requests=[],errors=[];p.on('request',r=>{if(/(mira|brun|ada|liliana)(_noface|\/sheet)\.webp$/.test(r.url()))requests.push(r.url())});p.on('pageerror',e=>errors.push(e.message));const start=performance.now();await p.goto(url+hash,{waitUntil:'domcontentloaded'});
  if(current){await p.locator('.image-startup').waitFor();assert(await p.locator('.image-startup progress').isVisible());await p.screenshot({path:'/tmp/image-startup-'+(hash.slice(1)||'cover')+'.png'});}
  const selector=hash==='#town'?'[data-town-place]':hash==='#ambush'?'#stage':'.cover-party';await p.locator(selector).first().waitFor();const initial=Math.round(performance.now()-start);
  if(hash==='#town'){
   const before=requests.length,places=[];
   for(const place of ['inn','smith','guild','items']){const box=await p.locator(`[data-town-place="${place}"]`).boundingBox();const at=performance.now();await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await p.locator('.actor .portrait').waitFor();const immediately=await p.locator('.actor .portrait').evaluate(e=>({ready:e.classList.contains('portrait-ready'),decoded:[...e.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth)}));await p.waitForFunction(()=>document.querySelector('.actor .portrait').classList.contains('portrait-ready'));places.push({place,ms:Math.round(performance.now()-at),...immediately});if(current)assert.deepEqual(immediately,{ready:true,decoded:true});await p.screenshot({path:'/tmp/image-startup-ready-'+(current?'after-':'before-')+place+'.png'});await p.locator('#townStreet').tap();}
   const after=requests.length;if(current)assert.equal(after,before,'首次點四店不得再下載NPC素材');out.push({hash,initial,places,extraImageRequests:after-before});
  }else{
   const imgs=hash==='#ambush'?'.scene-bg img,.party img':'.cover-party';const ready=await p.locator(imgs).evaluateAll(is=>is.every(i=>i.complete&&i.naturalWidth));if(current)assert(ready,'首屏出現即全部圖片可顯示');if(hash==='')assert(!requests.some(u=>u.includes('/faces/')),'封面不下載整組表情或城鎮圖');let roll;
   if(hash===''){const at=performance.now();await p.locator('#start').tap();await p.locator('#next').waitFor();const headsReady=await p.locator('.c-head').evaluateAll(is=>is.length&&is.every(i=>i.complete&&i.naturalWidth));if(current)assert(headsReady,'首次擲屬性畫面頭像已解碼');roll={ms:Math.round(performance.now()-at),headsReady};}
   out.push({hash:hash||'cover',initial,ready,roll});
  }
  assert.deepEqual(errors,[]);await p.close();
 }
 if(current){
  const town=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await town.goto(url+'#battle?phase=explore');await town.locator('#board-floor').waitFor();await town.evaluate(()=>quickTown());
  assert.equal(await town.locator('[data-town-place][aria-busy="true"]').count(),4,'正常流程首次进城須先準備圖片');
  assert(await town.locator('[data-town-place="inn"]').isDisabled());
  await town.locator('[data-town-place="inn"]').tap();
  assert(await town.locator('.actor .portrait').evaluate(el=>el.classList.contains('portrait-ready')&&[...el.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth)),'完成前不開店，打開時兩圖皆就緒');
  await town.close();console.log('PASS 正常流程首次進城：逐店準備，未完成不可進店，完成後開店立即顯圖');
  const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),held=[];
  await p.route('**/party_heads.webp',route=>{held.push(route);});
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.locator('.image-startup').waitFor();
  await p.locator('.image-error-message').waitFor({timeout:12000});
  assert.match(await p.locator('.image-error-message').textContent(),/逾時/);assert.equal(await p.locator('.image-startup').count(),0);
  await p.unroute('**/party_heads.webp');await Promise.allSettled(held.map(route=>route.abort()));
  await p.locator('.image-error-message').tap();await p.waitForFunction(()=>document.querySelector('.cover-party').naturalWidth>0);
  assert(await p.locator('.cover-party').isVisible());assert.equal(await p.locator('.image-error-message,.image-loading-message').count(),0);
  await p.screenshot({path:'/tmp/image-startup-timeout-recovered.png'});await p.close();
  console.log('PASS 首次下載無回應：8秒後有可見逾時重試，恢復後圖片正常，不永久鎖住啟動');
 }
 console.log(JSON.stringify(out));
}finally{await br.close();await new Promise(r=>server.close(r));}
