import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const br=await chromium.launch();
try{
 const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await pg.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 const r=await pg.evaluate(async()=>{
  const b=B(),u=b.units.find(v=>v.id==='fox');b.flowEpoch=(b.flowEpoch||0)+1;b.phase='combat';b.turn=b.units.indexOf(u);b.busy=true;b.exploreMoveId=(b.exploreMoveId||0)+1;b.exploreGoal=null;b.exploreStopped=true;b.tut=-1;b.groundEffects={};b.def.blocks=[{x:11,y:10,kind:'bush'},{x:12,y:10,kind:'water'},{x:13,y:10,kind:'water'}];u.x=10;u.y=10;u.statuses=[];centerCam(11,10,false);
  const floor=document.querySelector('#board-floor');
  b.impact=launch(u,{x:11,y:10},'cast');
  groundReact(11,10,'火焰');groundReact(12,10,'寒冷');groundReact(13,10,'閃電');
  for(const k of ['burning','restrained','paralyzed','poisoned','bleed'])addStatus(u,k);
  b.impact=0;refreshBattle();
  const snap=()=>({ground:document.querySelectorAll('.ground-effect').length,burn:!!document.querySelector('.fx-burn'),body:document.querySelectorAll('[data-body-status]').length});
  const before=snap();await new Promise(r=>setTimeout(r,Math.max(0,Math.max(b.impactEnd,...u.statuses.map(s=>s.visualAt),...Object.values(b.groundEffects).map(f=>f.visualAt))-Date.now())+150));const after=snap();
  u.statuses=[];groundAdvance(18000,true);refreshBattle();const cleared=snap();
  return {before,after,cleared,floorSame:floor===document.querySelector('#board-floor')};
 });
 assert.deepEqual(r.before,{ground:0,burn:false,body:0});
 assert.deepEqual(r.after,{ground:3,burn:true,body:4});
 assert.deepEqual(r.cleared,{ground:0,burn:false,body:0});assert(r.floorSame);
 assert.deepEqual(errors,[]);
 if(process.env.REVIEW_SHOT)await pg.screenshot({path:process.env.REVIEW_SHOT});
 console.log('✓ 光球抵達才顯示火／冰／電與身上狀態，期限到移除整個地面圖形並保留地板');
}finally{await br.close();}
