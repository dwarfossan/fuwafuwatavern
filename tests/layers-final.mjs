// 四層更新路由：實際步行、介面、戰鬥事件與持續 DOM 的事件綁定。
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
const browser=await chromium.launch();
const results={};
try{
 for(const [name,dir] of Object.entries({baseline:path.resolve('../baseline'),layers:process.cwd()})){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.setTimeout=()=>0;window.setInterval=()=>0;Date.now=()=>1800000000000;let s=42;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);});
  await page.goto('file://'+path.join(dir,'index.html')+'#battle');
  await page.evaluate(()=>{const b=B();b.turn=b.units.findIndex(v=>v.id==='fox');b.busy=true;b.tut=-1;b.mode=null;b.moveMode=false;b.focusReq=false;render();});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  results[name]=await page.evaluate(()=>{
   const b=B(),u=cur(),origin={x:u.x,y:u.y};
   walk(u,[{x:origin.x,y:origin.y}],()=>{});
   const before={floor:document.querySelector('#board-floor')?.firstElementChild,marks:document.querySelector('#board-marks')?.firstElementChild,scene:document.querySelector('#board-scene')?.firstElementChild,ui:document.querySelector('[data-battle-ui="head"]')?.firstElementChild};
   const stepTimes=[],trace=[];
   for(let i=0;i<30;i++){
    const t=performance.now();walk(u,[{x:origin.x+(i%2),y:origin.y}],()=>{});stepTimes.push(performance.now()-t);
    trace.push([u.x,u.y,u.hp,b.moveLeft,b.actionUsed,b.bonusUsed,b.result,b.log.map(x=>x.text||x.t||x)]);
   }
   stepTimes.sort((a,b)=>a-b);
   const isolation=Object.fromEntries(Object.entries(before).map(([k,node])=>[k,node===document.querySelector(k==='ui'?'[data-battle-ui="head"]':`#board-${k}`)?.firstElementChild]));
   b.busy=false;render();
   const scene=document.querySelector('#board-scene')?.firstElementChild;
   b.info=u.id;render();const infoOnly=scene===document.querySelector('#board-scene')?.firstElementChild;
   b.info=null;render();
   for(let i=0;i<5;i++)render();
   const old=b.logLv||0;document.getElementById('logOpen')?.click();const once=b.logLv===(old+1)%3;
   return {motion:{median:stepTimes[15],p95:stepTimes[28],samples:stepTimes},trace,isolation,infoOnly,once};
  });
  results[name].moveCancel=await page.evaluate(()=>{
   const b=B(),u=cur();b.busy=false;b.info=null;b.mode=null;b.moveMode=true;b.pendingMove=null;render();
   const origin=[u.x,u.y,b.moveLeft];const paths=reachable(u,b.moveLeft);
   const entry=[...paths].find(([key,p])=>p.length>=2 && p.every(q=>!oaTriggers(u,q).length));
   if(!entry)throw new Error('沒有安全的兩步移動');
   const queue=[];window.setTimeout=(fn,delay)=>{if(delay===140)queue.push(fn);return 0;};
   const [x,y]=entry[0].split(',').map(Number);pcMove(x,y);
   for(let n=0;queue.length && n<20;n++)queue.shift()();
   const moved=[u.x,u.y,b.moveLeft,!!b.pendingMove,b.busy];
   if(!b.pendingMove)throw new Error('移動確認沒有出現');confirmMove(false);
   return {origin,moved,cancelled:[u.x,u.y,b.moveLeft,b.moveMode,b.busy]};
  });
  assert.equal(results[name].once,true,name+' single click');assert.deepEqual(errors,[]);
  if(name==='layers'){
   assert.deepEqual(results[name].isolation,{floor:true,marks:true,scene:false,ui:true});assert(results[name].infoOnly);
   const effects=await page.evaluate(()=>{const b=B(),s=document.querySelector('#board-scene').firstElementChild,f=document.querySelector('#board-floor').firstElementChild;b.marks.push({id:cur().id,t:Date.now(),dur:1000,kind:"ok"});refreshBattle();return {scene:s!==document.querySelector('#board-scene').firstElementChild,floor:f===document.querySelector('#board-floor').firstElementChild};});assert(effects.scene&&effects.floor);
  }
  await page.close();
 }
 assert.deepEqual(results.layers.moveCancel,results.baseline.moveCancel,'移動確認與取消相同');
 assert.deepEqual(results.layers.trace,results.baseline.trace,'歩行規則與原版相同');
 fs.mkdirSync('docs/layers-final',{recursive:true});fs.writeFileSync('docs/layers-final/motion-results.json',JSON.stringify(results,null,2));
 console.log('✓ 實際 walk：地板、標示、介面 DOM 保留，場景更新');
 console.log('✓ 狀態視窗只更新介面；持續 DOM 按鈕沒有重複事件');
 console.log('✓ 被動觀察更新場景；兩版步行規則 trace 相同');
 console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,v])=>[k,v.motion])),null,2));
}finally{await browser.close();}
