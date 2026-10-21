// 森林（10-21）：大地圖點森林進去、每區都走得到、四個調查點（成功的效果）、德魯伊敲暈後講話、石碑祝福、打完奇美拉給 ★★★ 報酬、再進去只有野獸
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {noLuck} from './boot.mjs';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('fuwa-help-seen','{"shop":1,"map":1}');window.NO_AFTER_TALK=true;});
 await p.goto('file://'+path.resolve('index.html')+'#town');await p.locator('[data-town-place]').first().waitFor();await noLuck(p);
 // 大地圖：站在森林上點森林＝進去
 await p.evaluate(()=>{state.forest=null;state.location='forest';state.mapSel='forest';state.page='map';render();enterWorldLocation();});
 const r0=await p.evaluate(()=>{const b=B(),fox=b.units.find(u=>u.id==='fox'),paths=reachable({...fox,x:37,y:13},100000);
  const can=(x,y)=>[...paths.keys()].some(k=>{const [a,c]=k.split(',').map(Number);return Math.max(Math.abs(a-x),Math.abs(c-y))<=1;});
  return {phase:b.phase,forest:!!b.def.forest,reach:[can(28,13),can(17,12),can(6,14),can(2,2),can(5,17),can(8,4)],clues:b.def.blocks.filter(o=>o.kind==='clue').length,names:b.units.filter(u=>u.side==='foe').map(u=>u.name)};});
 assert.equal(await p.evaluate(()=>B().units.filter(u=>u.side==='foe'&&!foeHid(u)).length),0,'一進去：還沒看到的敵人都不顯示（10-21）');
 assert.ok(await p.evaluate(()=>document.querySelectorAll('.tree-see-through').length>0),'樹後面有人：樹變半透明');
 assert.equal(r0.phase,'explore');assert.ok(r0.forest);assert.deepEqual(r0.reach,[true,true,true,true,true,true],'每一區都走得到（不靠捷徑）');assert.equal(r0.clues,4);assert.ok(!r0.names.some(n=>/undefined/.test(n)),r0.names.join());
 const tp=(x,y)=>p.evaluate(({x,y})=>{const b=B(),u=exploreUnit();exploreParty().forEach(v=>{v.x=x;v.y=y;});b.exploreStopped=false;b.busy=false;refreshBattle();},{x,y});
 const inv=clue=>p.evaluate(async clue=>{const b=B(),o=b.def.blocks.find(q=>q.clue===clue);b.exploreObject=o;const r=Math.random;Math.random=()=>.95;try{await exploreInteract('investigate');}finally{Math.random=r;}return forestState().clues[clue];},clue);
 const clear=(sq,ko)=>p.evaluate(async({sq,ko})=>{const b=B(),es=b.units.filter(v=>v.squad===sq&&!v.dead),e0=es[0];exploreParty().forEach(v=>{v.x=e0.x+2;v.y=e0.y;});
  if(b.phase!=='combat')enterExploreCombat(e0.id,true);await new Promise(r=>setTimeout(r,500));const pc=b.units.find(isPcCritter),bless=b.units.filter(isPcCritter).every(v=>!!has(v,'blessed'));
  for(const v of b.units.filter(v=>v.side==='foe'&&v.combatActive&&!v.dead)){if(ko&&v.type===ko){state.knockout={[pc.id]:true};b.meleeBy={a:pc.id,t:v.id};}else{state.knockout={};b.meleeBy=null;}hurt(v,999,'鈍擊',pc);}
  b.meleeBy=null;state.knockout={};checkResult();await new Promise(r=>setTimeout(r,1500));return {phase:b.phase,result:b.result,bless,bubbles:(b.bubbles||[]).map(x=>x.text||x.t)};},{sq,ko});
 assert.equal((await clear(1)).phase,'explore','打完狼回到探索');
 await tp(29,13);assert.equal(await inv('marks'),'ok');assert.ok(await p.evaluate(()=>B().def.blocks.filter(o=>o.kind==='trap').every(o=>o.found)),'獵人記號：陷阱全部標出來');
 await tp(31,11);assert.equal(await inv('map'),'ok');assert.ok(await p.evaluate(()=>B().def.blocks.filter(o=>o.shortcut).every(o=>o.kind==='bush')),'地圖：捷徑的密林變草叢');
 assert.ok(await p.evaluate(()=>!exploreObjectAt(31,11)),'調查過的不再跳選單');
 assert.equal((await clear(2)).phase,'explore');
 const dr=await clear(3,'forest_druid');assert.ok(dr.bubbles.some(t=>/不是盜獵的/.test(t)),'德魯伊被敲暈：醒來講話 '+dr.bubbles.join('／'));
 await tp(6,17);assert.equal(await inv('stele'),'ok');
 await tp(7,4);assert.equal(await inv('bones'),'ok');
 const g0=await p.evaluate(()=>state.gold.fox);
 const boss=await clear(4);assert.ok(boss.bless,'石碑：打奇美拉時全隊祝福');assert.equal(boss.result,'win');
 const w=await p.evaluate(g0=>({gold:(state.gold.fox-g0)/GP,item:B().questReward?.item,cleared:forestState().cleared}),g0);
 assert.equal(w.gold,100);assert.ok(w.item,'★★★ 給魔法物品');assert.ok(w.cleared);
 const again=await p.evaluate(()=>{finishQuest();const loc=state.location;enterForest();const b=B();return {loc,types:[...new Set(b.units.filter(u=>u.side==='foe').map(u=>u.type))].sort(),done:b.def.blocks.filter(o=>o.kind==='clue').every(o=>o.done),noReward:b.def.noReward};});
 assert.equal(again.loc,'forest');assert.deepEqual(again.types,['boar','forest_wolf','giant_spider']);assert.ok(again.done&&again.noReward);
 assert.deepEqual(errors,[]);
 console.log('✓ 森林：進去、每區走得到、四個調查點、德魯伊敲暈講話、石碑祝福、奇美拉 ★★★ 報酬、再來只有野獸');
}finally{await br.close();}
