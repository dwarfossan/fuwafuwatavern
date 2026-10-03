import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];pg.on('pageerror',e=>errors.push(e.message));
try{
 await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await pg.evaluate(()=>{const b=B();b.def.blocks=[];b.def.elev=[];delete b.def._h;b.def.lighting='bright';b.groundEffects={};b.info=null;b.exploreSneak=false;b.exploreStopped=false;b.exploreSolo='fox';b.leader='fox';b.turn=b.units.findIndex(u=>u.id==='fox');
  exploreParty().forEach((u,i)=>{u.x=17;u.y=20+i;u.statuses=[];u.hp=u.maxHp;u.down=false;b.def.blocks.push({x:u.x,y:u.y,kind:'bush'});});
  const foes=b.units.filter(u=>u.side==='foe');foes.forEach(u=>{u.statuses=[];u.type='goblin';u.dead=false;u.down=false;u.fled=false;});
  foes[0].x=6;foes[0].y=8;foes[1].x=4;foes[1].y=17;foes[2].x=19;foes[2].y=2;foes[2].statuses=[{k:'hidden',val:30}];foes[3].x=19;foes[3].y=6;foes[3].dead=true;foes[3].deadAt=0;
  b.def.blocks.push({x:8,y:8,kind:'tree'},{x:19,y:2,kind:'bush'});refreshBattle();centerCam(9,12);Math.random=()=>.99;
 });
 assert.equal(await pg.evaluate(()=>exploreWatchCells().size),0);await pg.locator('[data-explore-cmd="hide"]').tap();
 assert(await pg.evaluate(()=>B().exploreSneak&&B().info===null&&isHid(exploreUnit())));
 assert(await pg.evaluate(()=>{const s=exploreWatchCells();return s.has('6,8')&&s.has('4,17')&&!s.has('19,2')&&!s.has('19,6')&&!s.has('10,8');}),'兩隻可見敵人都顯示，隱藏／死亡／樹後不顯示');
 assert(await pg.evaluate(()=>document.querySelector('#board-floor [data-tile="6,8"]').getAttribute('fill').includes('#cbb668')));
 if(process.env.EXPLORE_SHOTS)await pg.screenshot({path:process.env.EXPLORE_SHOTS+'/watch-all.png'});
 await pg.evaluate(()=>{const b=B();window.__cells=[...exploreWatchCells()].sort();window.__floor=document.getElementById('board-floor').firstElementChild;const e=b.units.find(u=>u.side==='foe');b.info=e.id;refreshBattle();b.info=null;refreshBattle();});
 assert(await pg.evaluate(()=>document.getElementById('board-floor').firstElementChild===window.__floor),'選取／關卡片不重畫地板');
 await pg.evaluate(()=>exploreMove(19.2,20.1));await pg.waitForFunction(()=>B().busy&&exploreUnit().x>17.3);
 assert.deepEqual(await pg.evaluate(()=>[...exploreWatchCells()].sort()),await pg.evaluate(()=>window.__cells));assert(await pg.evaluate(()=>document.getElementById('board-floor').firstElementChild===window.__floor),'移動時範圍持續顯示且地板不逐幀重畫');
 if(process.env.EXPLORE_SHOTS)await pg.screenshot({path:process.env.EXPLORE_SHOTS+'/watch-walking.png'});
 await pg.waitForFunction(()=>!B().busy);
 // Enemy visibility/life, position, obstacles and lighting invalidate the original floor layer.
 assert(await pg.evaluate(()=>{const b=B(),e=b.units.filter(u=>u.side==='foe')[1];e.down=true;refreshBattle();return !exploreWatchCells().has('4,17')&&window.__floor!==document.getElementById('board-floor').firstElementChild;}));
 assert(await pg.evaluate(()=>{const b=B(),e=b.units.find(u=>u.side==='foe');e.x=10;e.y=8;b.def.blocks=b.def.blocks.filter(o=>o.kind!=='tree');refreshBattle();return exploreWatchCells().has('15,8');}));
 assert(await pg.evaluate(()=>{const b=B(),e=b.units.find(u=>u.side==='foe');e.fled=true;refreshBattle();return exploreWatchCells().size===0;}));
 assert(await pg.evaluate(()=>{const b=B(),e=b.units.find(u=>u.side==='foe');e.fled=false;e.statuses=[{k:'hidden',val:30}];refreshBattle();return exploreWatchCells().size===0;}));
 assert(await pg.evaluate(()=>{const b=B(),e=b.units.find(u=>u.side==='foe');e.statuses=[];b.def.lighting='dark';refreshBattle();return !exploreWatchCells().has('15,8');}));
 await pg.locator('[data-explore-cmd="hide"]').tap();assert.equal(await pg.evaluate(()=>exploreWatchCells().size),0);
 await pg.evaluate(()=>{B().exploreSneak=true;enterExploreCombat(null,true);});assert.equal(await pg.evaluate(()=>exploreWatchCells().size),0);
 assert.deepEqual(errors,[]);console.log('✓ 手機潛行自動顯示多敵人、隱藏／倒下／死亡／離場不洩漏、遮擋／光照、選取及移動持續顯示、地板獨立更新、停潛行／切戰棋移除');
}finally{await br.close();}
