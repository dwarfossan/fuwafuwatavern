import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=process.cwd();
const server=http.createServer(async(req,res)=>{try{const file=path.join(root,new URL(req.url,'http://localhost').pathname),body=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');res.setHeader('Cache-Control','no-store');if(file.endsWith('.webp'))await new Promise(r=>setTimeout(r,100));res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/index.html`,browser=await chromium.launch();
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const requests=[],errors=[];p.on('request',r=>{if(/\.webp(?:\?|$)/.test(r.url()))requests.push(r.url());});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"roll":1,"shop":1}'));
 let fail=true;await p.route('**/assets/portraits/merchant.webp*',route=>fail?route.abort():route.continue());
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.locator('.cover-loading').waitFor();assert(await p.locator('#start').isDisabled());assert.equal(await p.locator('.cover-party img').count(),4);
 await p.waitForFunction(()=>[...document.querySelectorAll('.cover-party img')].every(i=>i.complete&&i.naturalWidth));
 assert.equal(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(0, 0, 0)');
 // Ignore rocking transform while measuring the reserved box coordinates.
 await p.addStyleTag({content:'.cover-party img{animation:none!important}'});const before=await p.locator('.cover-party').boundingBox();await p.screenshot({path:'/tmp/startup-black-heads.png'});
 // 10-09 分段讀取：封面只等四頭像＋四張正常臉，商人圖失敗也不擋封面
 await p.locator('.cover:not(.cover-loading)').waitFor();assert(await p.locator('#start').isEnabled());assert.equal(await p.locator('.image-startup').count(),0);assert.deepEqual(await p.locator('.cover-party').boundingBox(),before,'頭像原位揭示首頁');
 assert(await p.evaluate(()=>COVER_IMAGES().every(src=>entryDecodedImages.get(src)?.naturalWidth)));const coverCount=await p.evaluate(()=>COVER_IMAGES().length);
 await p.waitForTimeout(550);await p.screenshot({path:'/tmp/startup-home-ready.png'});
 // 背景讀完（商人圖失敗）後，擲完屬性按下一步：補等畫面顯示失敗與重試
 const total=await p.evaluate(()=>gameImageSources().length);
 await p.locator('#start').tap();await p.locator('#next').waitFor();for(let i=0;i<4;i++){await p.locator(`[data-tab="${i}"]`).tap();await p.locator('#rollAll').tap();await p.locator('#autoAssign').tap();}
 await p.waitForFunction(t=>entryDecodedImages.size>=t-1&&entryImageFailures.size>0,total,{timeout:60000});
 await p.locator('#next').tap();await p.locator('#retryImages:not([hidden])').waitFor();assert.match(await p.locator('.image-startup label').textContent(),/失敗/);assert.equal(await p.locator('progress').evaluate(e=>e.value),total-1,'失敗圖片不可計為完成');assert.equal(await p.locator('#stage').count(),0,'沒讀完不進劇情');
 await p.screenshot({path:'/tmp/startup-gate-fail.png'});
 const count=requests.length;fail=false;await p.locator('#retryImages').tap();await p.locator('#stage').waitFor();
 assert.equal(requests.length-count,1,'只重新下載失敗圖');assert(await p.evaluate(()=>gameImageSources().every(src=>entryDecodedImages.get(src)?.complete&&entryDecodedImages.get(src)?.naturalWidth)));
 const after=requests.length;
 for(const scene of ['prologue','farewell','ambush','caravan','townArrival','townSupplier']){
  await p.evaluate(async scene=>{state.page='story';state.scene=scene;state.line=0;render();for(let i=0;i<SCENES[scene].script.length;i++){state.line=i;await prepareStoryImages();render();}},scene);
 }
 await p.evaluate(()=>quickTown());
 for(const place of ['inn','smith','guild','items']){await p.locator(`[data-town-place="${place}"]`).tap();assert(await p.locator('.actor .portrait').evaluate(e=>e.classList.contains('portrait-ready')));await p.evaluate(()=>{state.supplierSeen=true;});await p.locator('#townStreet').tap();}
 await p.waitForTimeout(250);assert.equal(requests.length,after,'預載完成後劇情全句／四店／送貨不可再下載圖片');assert.deepEqual(errors,[]);
 await p.close();
 for(const hash of ['#town','#ambush','#battle?phase=explore']){const q=await browser.newPage({viewport:{width:390,height:844}});await q.goto(url+hash);await q.locator(hash==='#town'?'[data-town-place]':hash==='#ambush'?'#stage':'#board-floor').first().waitFor();assert(await q.evaluate(()=>gameImageSources().every(src=>entryDecodedImages.has(src))));await q.close();}
 console.log(`PASS：黑底四頭原位讀取、封面只等 ${coverCount} 張、其餘背景讀、進劇情前補等（${total} 張）、失敗僅重試缺圖、六劇情全句／四店零追加下載、三個快速入口一致`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
