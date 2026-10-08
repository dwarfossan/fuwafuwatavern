import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {bootReady} from './boot.mjs';
const browser=await chromium.launch();try{
const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
const r=await p.evaluate(()=>{
 const b=B(),u=b.units.find(u=>u.id==='fox');b.flowEpoch++;b.phase='combat';b.turn=b.units.indexOf(u);b.busy=false;b.groundClockAt=null;b.def.blocks=[];b.def.elev=[];u.x=10;u.y=10;u.mods.DEX=u.mods.CON=0;u.hp=u.maxHp=100;
 const old=Math.random,out=[],calls=[],save=saveRoll;saveRoll=(u,s,dc,...a)=>{calls.push([s,dc]);return save(u,s,dc,...a);};
 for(const [kind,k] of [['fire','burning'],['charged','paralyzed'],['ice','prone'],['poisonSwamp','poisoned']]){
  const set=()=>{u.statuses=[];b.exploreIceTried={};b.groundEffects={};b.def.blocks=[];if(kind==='poisonSwamp')b.def.blocks=[{kind,x:10,y:10,dc:13}];else b.groundEffects['10,10']={kind,x:10,y:10,left:6000};};
  set();Math.random=()=>.99;const pass=groundEnter(u,{}),avoided=!has(u,k);
  set();Math.random=()=>0;groundEnter(u,{});const applied=has(u,k)?.via==='ground';u.x=9;
  for(let n=0;n<4;n++)groundStatusSave(u);const stays=!!has(u,k),noCounter=stTurns(has(u,k))===null;
  Math.random=()=>.99;groundStatusSave(u);const clear=!has(u,k);out.push({k,avoided,applied,stays,noCounter,clear});u.x=10;
 }
 saveRoll=save;Math.random=()=>0;u.statuses=[];b.def.blocks=[];b.groundEffects={'10,10':{x:10,y:10,kind:'charged',left:6000}};groundEnter(u);beginTurn(u);const startKeeps=has(u,'paralyzed')?.via==='ground'&&b.skipTurn;
 const next=nextTurn;nextTurn=()=>{};endTurn();const endFails=!!has(u,'paralyzed');Math.random=()=>.99;endTurn();const endClears=!has(u,'paralyzed');nextTurn=next;
 u.statuses=[];b.phase='explore';b.groundEffects={'10,10':{x:10,y:10,kind:'charged',left:6000}};Math.random=()=>0;groundEnter(u);groundAdvance(24000);const terrainGone=!groundAt(10,10),notTimer=!!has(u,'paralyzed');Math.random=()=>.99;groundAdvance(6000);const pulseClear=!has(u,'paralyzed');
 addStatus(u,'prone',{via:'ground',dc:13});b.phase='combat';beginTurn(u);const proneKeeps=!!hasVia(u,'prone','ground');u.statuses=[];addStatus(u,'prone',{});beginTurn(u);const normalProneClears=!has(u,'prone');addStatus(u,'paralyzed',{});beginTurn(u);const normalParaClears=!has(u,'paralyzed');
 Math.random=old;u.statuses=[];u.x=10;u.y=10;u.hp=u.maxHp=100;b.units.filter(v=>v.side==='foe').forEach(v=>{v.x=1;v.y=1;});b.phase='explore';b.exploreSolo='fox';b.leader='fox';b.exploreStopped=false;b.exploreGoal=null;b.exploreIceTried={};b.busy=false;b.result=null;b.menu=null;b.info=null;b.panel=null;b.critOn=null;b.groundPulse=0;b.groundClockAt=null;b.groundEffects={'11,10':{x:11,y:10,kind:'charged',left:6000}};b.def.blocks=[{kind:'water',x:11,y:10}];centerCam(10,10,true);Math.random=()=>0;refreshBattle();
 return {out,calls,startKeeps,endFails,endClears,terrainGone,notTimer,pulseClear,proneKeeps,normalProneClears,normalParaClears};
});
for(const row of r.out)for(const [key,v] of Object.entries(row))if(key!=='k')assert(v,`${row.k}:${key}`);
assert(r.calls.some(([s,dc])=>s==='DEX'&&dc===13));assert(r.calls.some(([s,dc])=>s==='CON'&&dc===13));for(const [k,v] of Object.entries(r))if(!['out','calls'].includes(k))assert(v,k);
await p.waitForTimeout(300);const bb=await p.locator('#board-floor polygon.tile[data-tile="11,10"]').boundingBox();assert(bb);await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForFunction(()=>!!has(B().units.find(u=>u.id==='fox'),'paralyzed')&&!B().busy);
await p.evaluate(()=>{B().info='fox';B().infoPage='status';refreshBattle();});await p.locator('[data-statustip][aria-label="麻痺"]').tap();assert.match(await p.locator('.status-pop').innerText(),/回合結束體質豁免 DC 13/);
if(process.env.REVIEW_SHOT)await p.screenshot({path:process.env.REVIEW_SHOT});
await p.evaluate(()=>{const u=B().units.find(u=>u.id==='fox');Math.random=()=>.99;groundStatusSave(u);B().info=null;B().statusTip=null;refreshBattle();});assert(!await p.evaluate(()=>!!has(B().units.find(u=>u.id==='fox'),'paralyzed')));
if(process.env.REVIEW_SHOT)await p.screenshot({path:process.env.REVIEW_SHOT.replace('.png','-recovered.png')});
assert.deepEqual(errors,[]);console.log('✓ 四種地面先豁免、失敗持續／成功解除、回合結束、地面消失不解狀態、探索六秒、非地面照舊、手機走入與恢復');
}finally{await browser.close();}
