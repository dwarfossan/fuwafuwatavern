import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
pg.on('pageerror',e=>errors.push(e.message));
async function fixture(){await pg.goto('about:blank');await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await pg.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));await pg.evaluate(()=>{const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.def.blocks=[];b.def.elev=[];delete b.def._h;b.groundEffects={};b.units.filter(u=>u.side==='foe').forEach((u,i)=>{u.x=1;u.y=1+i;u.statuses=[];});exploreParty().forEach((u,i)=>{u.x=15;u.y=15+i;u.statuses=[];});b.exploreSolo='fox';b.busy=false;b.exploreStopped=false;b.exploreRest=false;b.info=null;refreshBattle();centerCam(15,15);window.__floor=document.getElementById('board-floor').firstElementChild;});}
try{
 await fixture();await pg.evaluate(()=>exploreMove(17.27,15.18));await pg.waitForFunction(()=>exploreUnit().x>15.1&&exploreUnit().x<16);
 const moving=await pg.evaluate(()=>({x:exploreUnit().x,y:exploreUnit().y,walking:exploreUnit().exploreWalking,hop:exploreUnit().anim?.k,foot:document.querySelector('.act-walk .dl-foot-left')!==null,floor:window.__floor===document.getElementById('board-floor').firstElementChild}));
 assert(!Number.isInteger(moving.x));assert(moving.walking&&moving.foot&&moving.floor);assert.notEqual(moving.hop,'hop');
 await pg.waitForFunction(()=>!B().busy);assert.deepEqual(await pg.evaluate(()=>[exploreUnit().x,exploreUnit().y]),[17.27,15.18]);
  if(process.env.EXPLORE_SHOTS){await pg.evaluate(()=>{const u=exploreUnit();centerCam(u.x,u.y);});await pg.screenshot({path:process.env.EXPLORE_SHOTS+'/continuous.png'});}
 await pg.evaluate(()=>{const u=exploreUnit();window.__pre={x:u.x,y:u.y};enterExploreCombat(null,true);window.nextTurn=()=>{};window.endTurn=()=>{};});
 assert(await pg.evaluate(()=>B().phase==='combat'&&B().units.every(u=>Number.isInteger(u.x)&&Number.isInteger(u.y))));
 assert(await pg.evaluate(()=>{const units=B().units.filter(u=>!u.dead&&!u.fled);return new Set(units.map(u=>`${u.x},${u.y}`)).size===units.length;}));
 assert(await pg.evaluate(()=>B().units.filter(u=>u.side==='pc'&&!u.dead&&!u.fled).every(u=>Math.hypot(u.x-window.__pre.x,u.y-window.__pre.y)<1.5)));
 if(process.env.EXPLORE_SHOTS)await pg.screenshot({path:process.env.EXPLORE_SHOTS+'/aligned.png'});
 // Shared same-cell exploration positions stay independent until alignment.
 await fixture();assert(await pg.evaluate(()=>{const [a,c]=exploreParty();a.x=15.1;a.y=15.1;c.x=15.49;c.y=15.49;return explorePositionClear(a,a.x,a.y);}));
 assert(await pg.evaluate(()=>{const u=exploreUnit();return !!document.querySelector(`.hud[data-explore-body="${u.id}"]`);}));
 await pg.evaluate(()=>enterExploreCombat(null,true));assert(await pg.evaluate(()=>{const p=exploreParty();return new Set(p.map(u=>`${u.x},${u.y}`)).size===p.length;}));
 // Continuous sampling cannot tunnel through solid corners or hidden units.
 await fixture();assert(await pg.evaluate(()=>{const u=exploreUnit();B().def.blocks=[{x:16,y:15,kind:'tree'}];return !exploreSegmentClear(u,u,{x:17,y:15});}));
 assert(await pg.evaluate(()=>{const b=B(),u=exploreUnit(),e=b.units.find(u=>u.side==='foe');b.def.blocks=[];e.x=16;e.y=15;e.statuses=[{k:'hidden',val:30}];return !exploreSegmentClear(u,u,{x:17,y:15});}));
 // Trap is resolved upon entering its region, before reaching its center.
 await fixture();await pg.evaluate(()=>{Math.random=()=>0;exploreUnit().hp=exploreUnit().maxHp;B().def.blocks=[{x:16,y:15,kind:'trap'}];exploreMove(17.2,15);});await pg.waitForFunction(()=>B().exploreStopReason==='trap');
 assert(await pg.evaluate(()=>exploreUnit().x>=15.5&&exploreUnit().x<16));assert(await pg.evaluate(()=>B().def.blocks[0].triggered&&!B().busy));
 // Ground status stops the same continuous movement, not a new implementation of saves.
 await fixture();await pg.evaluate(()=>{Math.random=()=>0;B().groundEffects={'16,15':{x:16,y:15,kind:'charged',left:6000}};exploreMove(17.2,15);});await pg.waitForFunction(()=>!B().busy);
 assert(await pg.evaluate(()=>has(exploreUnit(),'paralyzed')&&exploreUnit().x<16));
 // Enemy detection interrupts between centers; combat freezes positions and aligns once.
 await fixture();await pg.evaluate(()=>{const e=B().units.find(u=>u.side==='foe');e.x=21;e.y=15;e.type='goblin';exploreMove(18.3,15);});await pg.waitForFunction(()=>B().phase==='combat');
 assert(await pg.evaluate(()=>B().units.every(u=>Number.isInteger(u.x)&&Number.isInteger(u.y))));const frozen=await pg.evaluate(()=>B().units.find(u=>u.id==='fox').x);await pg.waitForTimeout(400);assert.equal(await pg.evaluate(()=>B().units.find(u=>u.id==='fox').x),frozen);
 assert.deepEqual(errors,[]);console.log('✓ 探索真小數位置／踏步／分層、同格獨立身體、就近唯一佔位、障礙與隱藏單位碰撞、跨格陷阱／地面／偵測中斷');
}finally{await br.close();}
