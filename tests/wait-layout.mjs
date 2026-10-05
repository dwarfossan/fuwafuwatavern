import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
const browser=await chromium.launch();
try{
 for(const patched of [false,true]){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  if(!patched)await page.route('**/css/style.css',async route=>route.fulfill({contentType:'text/css',body:(await fs.readFile('css/style.css','utf8')).replace('.battle .order:not(.explore-order){height:46px}','')}));
  await page.goto('file://'+path.resolve('index.html')+'#battle?seed=123&phase=combat');
  const results=await page.evaluate(async()=>{
   const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.explorationMap=false;
   b.units.sort((a,c)=>(a.side==='pc'?0:1)-(c.side==='pc'?0:1));
   b.turn=0;b.busy=false;b.result=null;b.tut=-1;
   beginTurn(cur());refreshBattle();await new Promise(r=>setTimeout(r,650));
   const results=[];
   for(let turn=0;turn<3;turn++){
    const measure=()=>{const r=document.querySelector('.board-wrap').getBoundingClientRect();return {y:r.y,height:r.height};};
    const before=measure(),from=cur().id;
    document.querySelector('[data-cmd="wait"]').click();
    const frames=[];
    for(let i=0;i<24;i++){await new Promise(r=>requestAnimationFrame(r));frames.push(measure());}
    results.push({from,to:cur().id,maxShift:Math.max(...frames.map(f=>Math.abs(f.y-before.y))),maxResize:Math.max(...frames.map(f=>Math.abs(f.height-before.height)))});
   }
   return results;
  });
  console.log(patched?'修改後':'原版',JSON.stringify(results));
  if(patched){assert(results.every(r=>r.maxShift===0&&r.maxResize===0));await page.screenshot({path:'/tmp/wait-layout-fixed.png'});}
  else assert(results.some(r=>r.maxShift>0),'原版必須重現待機版面位移');
  await page.close();
 }
}finally{await browser.close();}
