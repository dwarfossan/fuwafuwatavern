import assert from 'node:assert/strict';
import {bootReady} from './boot.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const root=process.cwd();
const server=http.createServer(async(req,res)=>{
 try{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 const body=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/index.html`;
const browser=await chromium.launch();
try{
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('**/assets/**',async route=>{await new Promise(r=>setTimeout(r,route.request().url().includes('/brun/sheet.webp')?900:300));await route.continue();});
 await p.goto(base+'#town');await bootReady(p);
 await p.locator('[data-town-place="smith"]').click();
 await p.waitForFunction(()=>document.querySelector('.actor .pt-base').naturalWidth>0);
 assert(await p.locator('.actor .portrait').evaluate(el=>{const imgs=[...el.querySelectorAll('img')];return imgs.every(i=>i.complete&&i.naturalWidth)?el.classList.contains('portrait-ready'):imgs.every(i=>getComputedStyle(i).visibility==='hidden');}),'四店圖片準備完整才顯示，尚未準備完整時不得露出無臉人物');
 await p.waitForFunction(()=>document.querySelector('.actor .portrait').classList.contains('portrait-ready'));
 await p.screenshot({path:'/tmp/brun-verified.png'});
 assert(await p.locator('.brun-features img').evaluate(i=>i.complete&&i.naturalWidth>0));
 console.log('PASS 布隆：延遲圖片載入後底圖與表情一起顯示；截圖 /tmp/brun-verified.png');
 for(const scene of ['prologue','farewell']){
 await p.evaluate(scene=>{state.page='story';state.starterStyle={};state.scene=scene;state.line=0;render();},scene);
 await p.evaluate(()=>prepareStoryImages());
 const failures=[];
 for(let n=1;;n++){
  const count=await p.evaluate(()=>SCENES[state.scene].script.length);if(n>=count)break;
  if(await p.locator('[data-style-pick]').count())await p.locator('[data-style-pick]').first().click();   // 10-10 起始風格：停在選項時點第一個
  else await p.locator('#stage').click({position:{x:30,y:40}});
  await p.waitForFunction(n=>state.line===n,n);
  const unloaded=await p.locator('.portrait img,.c-head').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));
  if(unloaded.length)failures.push({n,unloaded});
 }
 assert.deepEqual(failures,[]);
 await p.screenshot({path:`/tmp/${scene}-verified.png`});
 console.log(`PASS ${scene}：300ms 素材延遲下逐句實際點擊，換句後零未載入立繪／表情`);
 }
 await p.goto(base+'?battle=1#battle?seed=123&phase=combat');await bootReady(p);
 const frames=await p.evaluate(async()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.explorationMap=false;b.units.sort((a,c)=>(a.side==='pc'?0:1)-(c.side==='pc'?0:1));b.turn=0;b.busy=false;b.result=null;b.tut=-1;beginTurn(cur());refreshBattle();await new Promise(r=>setTimeout(r,250));await Promise.all(document.querySelector('.page').getAnimations().map(a=>a.finished));   // 10-08：開機後才進戰場，先等頁面進場淡入（.page.enter 0.45s 位移）結束再量
  const sample=()=>{const w=document.querySelector('.board-wrap').getBoundingClientRect();return {y:w.y,h:w.height};};
  const result=[sample()];document.querySelector('[data-cmd="wait"]').click();
  for(let i=0;i<20;i++){await new Promise(r=>requestAnimationFrame(r));result.push(sample());}return result;
 });
 assert(frames.every(f=>f.y===frames[0].y&&f.h===frames[0].h),JSON.stringify(frames));
 console.log('PASS 待機：相同固定場／玩家回合操作，21 幀戰場頂端與高度完全相同');
}finally{await browser.close();await new Promise(r=>server.close(r));}
