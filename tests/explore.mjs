import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html');
const shot=async n=>{if(process.env.EXPLORE_SHOTS)await pg.screenshot({path:process.env.EXPLORE_SHOTS+'/'+n+'.png'});};
try{
 await pg.goto('file://'+root+'#battle?seed=123');assert.equal(await pg.evaluate(()=>B().phase),'explore');assert(await pg.evaluate(()=>B().units.filter(u=>u.side!=='npc').every(u=>u.init===0)),'探索入場不擲先攻');
 await pg.evaluate(()=>{B().info=exploreUnit().id;refreshBattle();});assert(!(await pg.evaluate(()=>/undefined/.test(document.querySelector('.bt-me')?.closest('div')?.parentElement?.textContent||document.body.textContent))),'探索狀態卡不能有 undefined');await pg.evaluate(()=>{B().info=null;refreshBattle();});
 await pg.waitForTimeout(500);const round=await pg.evaluate(()=>B().round);await pg.waitForTimeout(1000);assert.equal(await pg.evaluate(()=>B().round),round);
 await pg.evaluate(()=>{window.__layers=['board-floor','board-marks','board-scene'].map(id=>document.getElementById(id));window.__floor=document.getElementById('board-floor').firstElementChild;});
 await shot('group');
 // 同一隨機場中選一條足夠長、沒敵人偵測的路，真觸控點地板。
 const dest=await pg.evaluate(()=>{const b=B(),u=exploreUnit();centerCam(u.x,u.y);const r=document.querySelector('.board-wrap').getBoundingClientRect(),z=camZoom();for(const [k,p] of reachable(u,10000)){if(p.length<7)continue;const [x,y]=k.split(',').map(Number);if(p.some(q=>b.units.some(e=>e.side==='foe'&&dist(e,q)<=ENEMIES[e.type].detectRange+1)))continue;const a=iso(x,y),cx=r.left+b.cam.x+a.x*z,cy=r.top+b.cam.y+(a.y+TH/2)*z;if(document.elementFromPoint(cx,cy)?.closest('[data-tile]')?.dataset.tile===k)return {x,y,cx,cy};}return null;});
 assert(dest,'超過戰棋移動上限的可見安全格');const before=await pg.evaluate(()=>exploreParty().map(p=>[p.id,p.x,p.y]));
 await pg.evaluate(()=>exploreMove(20,17));await pg.waitForFunction(()=>!B().busy);
 const after=await pg.evaluate(()=>exploreParty().map(p=>[p.id,p.x,p.y]));
 assert.notDeepEqual(after.find(p=>p[0]==='fox'),before.find(p=>p[0]==='fox'),'目前探索角色會移動');
 assert.deepEqual(after.filter(p=>p[0]!=='fox'),before.filter(p=>p[0]!=='fox'),'未選取三隻不跟隨');
 assert(await pg.evaluate(()=>document.getElementById('board-floor').firstElementChild===window.__floor));
 assert(await pg.evaluate(()=>window.__layers.every((e,i)=>e===document.getElementById(['board-floor','board-marks','board-scene'][i]))));await shot('group-move');
 const handoff=await pg.evaluate(()=>[exploreUnit().x,exploreUnit().y]);await pg.locator('[data-explore-unit="raccoon"]').click();assert.equal(await pg.evaluate(()=>B().exploreSolo),'raccoon');assert.deepEqual(await pg.evaluate(()=>[exploreUnit().x,exploreUnit().y]),handoff,'切角色在目前探索位置接手');await shot('individual');
 const others=await pg.evaluate(()=>exploreParty().filter(p=>p.id!=='raccoon').map(p=>[p.id,p.x,p.y]));
 await pg.evaluate(()=>{const u=exploreUnit(),p=[...reachable(u,10000).values()].find(p=>p.length===1);exploreMove(p[0].x,p[0].y);});await pg.waitForFunction(()=>!B().busy);
 assert.deepEqual(await pg.evaluate(()=>exploreParty().filter(p=>p.id!=='raccoon').map(p=>[p.id,p.x,p.y])),others);
 // 偵測規則用精確位置 fixture（保留隨機圖格式）；遮擋與潛行對抗逐項驗。
 await pg.evaluate(()=>{const b=B();b.def.blocks=[];b.def.elev=[];delete b.def._h;exploreParty().forEach((p,i)=>{p.x=19;p.y=17+i;p.statuses=[];});b.units.filter(p=>p.side==='foe').forEach((e,i)=>{e.x=1;e.y=2+i;e.statuses=[];});const e=b.units.find(p=>p.side==='foe');e.type='goblin';e.x=10;e.y=17;b.leader='fox';b.turn=b.units.findIndex(p=>p.id==='fox');b.exploreSolo=null;b.exploreStopped=false;exploreDetect();refreshBattle();centerCam(16,17);});
 await pg.evaluate(()=>{const p=B().units.find(p=>p.id==='fox');p.x=16;exploreDetect();refreshBattle();});assert.equal(await pg.evaluate(()=>B().exploreMarks.fox),1);await shot('yellow');
 await pg.evaluate(()=>{const b=B(),p=B().units.find(p=>p.id==='fox');p.x=15;b.def.blocks=[{x:12,y:17,kind:'tree'}];exploreDetect();refreshBattle();});assert.equal(await pg.evaluate(()=>B().exploreStopped),false,'樹擋偵測');
 await pg.evaluate(()=>{B().def.blocks=[{x:15,y:17,kind:'bush'}];const p=B().units.find(p=>p.id==='fox');p.mods.DEX=4;Math.random=()=>.99;});await pg.locator('[data-explore-cmd="hide"]').click();assert(await pg.evaluate(()=>isHid(B().units.find(p=>p.id==='fox'))));assert.equal(await pg.evaluate(()=>B().exploreStopped),false);await shot('sneak');
 await pg.evaluate(()=>{const b=B();b.info=b.units.find(p=>p.side==='foe').id;refreshBattle();});assert((await pg.evaluate(()=>exploreWatchCells().size))>0);await shot('range');
 await pg.evaluate(()=>{B().exploreSneak=false;refreshBattle();});assert.equal(await pg.evaluate(()=>exploreWatchCells().size),0);
 await pg.evaluate(()=>{const b=B(),p=B().units.find(p=>p.id==='fox');b.info=null;p.statuses=[];exploreDetect();refreshBattle();});assert.equal(await pg.evaluate(()=>B().exploreStopped),true);assert.equal(await pg.evaluate(()=>B().exploreMarks.fox),2);assert.equal(await pg.evaluate(()=>B().phase),'combat','紅警示已接戰棋');await shot('red-stop');
 const stopBefore=await pg.evaluate(()=>exploreParty().map(p=>[p.x,p.y]));await pg.evaluate(()=>exploreMove(20,20));assert.deepEqual(await pg.evaluate(()=>exploreParty().map(p=>[p.x,p.y])),stopBefore);
 // 隱藏敵人格不洩漏到尋路，仍由我方偵測決定何時現身。
 const hidden=await pg.evaluate(()=>{const b=B(),p=B().units.find(p=>p.id==='fox'),e=b.units.find(u=>u.side==='foe');b.phase='explore';b.exploreStopped=false;b.exploreSolo='fox';e.x=p.x+2;e.y=p.y;e.statuses=[{k:'hidden',val:13,roll:13}];b.def.blocks=[{x:e.x,y:e.y,kind:'bush'}];p.mods.WIS=3;const allowed=reachable(p,10000).has(`${e.x},${e.y}`);exploreDetect();return {allowed,revealed:!isHid(e)};});assert(hidden.allowed);assert(hidden.revealed);
 assert.deepEqual(errs,[]);console.log('✓ 同頁四層、無回合、單人探索移動、切角色原地接手、潛行、偵測與停下、隱藏格察覺');
}catch(e){console.log(await pg.evaluate(()=>({busy:B()?.busy,stop:B()?.exploreStopped,steps:B()?.exploreSteps,pcs:exploreParty().map(p=>[p.id,p.x,p.y]),log:B()?.log.slice(-3)})));throw e;}finally{await br.close();}
