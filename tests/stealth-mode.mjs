import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch(),p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await p.evaluate(()=>{const b=B();b.flowEpoch++;b.def.blocks=[];b.def.elev=[];delete b.def._h;b.groundEffects={};b.busy=false;b.exploreStopped=false;b.leader='fox';b.exploreSolo='fox';b.turn=b.units.findIndex(u=>u.id==='fox');b.units.filter(u=>u.side==='pc').forEach((u,i)=>{u.x=18;u.y=17+i;u.hp=u.maxHp=50;u.down=u.dead=false;u.statuses=[];u.mods.DEX=4;});b.units.filter(u=>u.side==='foe').forEach((u,i)=>{u.x=1;u.y=2+i;u.statuses=[];u.type='goblin';u.mods.WIS=0;u.squad=Math.floor(i/2);});Math.random=()=>.99;refreshBattle();centerCam(18,17);});
 await p.locator('[data-explore-cmd="hide"]').tap();
 const appearance=()=>p.evaluate(()=>{const u=exploreUnit(),body=document.querySelector(`.token[data-explore-body="${u.id}"]`),hud=document.querySelector(`.hud[data-explore-body="${u.id}"]`);return {id:u.id,hidden:isHid(u),opacity:getComputedStyle(body.querySelector(':scope>svg')).opacity,eye:!!hud.querySelector('.hid-eye')};});
 assert((await appearance()).hidden);assert((await appearance()).id==='fox'&&(await appearance()).opacity==='0.5'&&(await appearance()).eye);
 await p.evaluate(()=>exploreMove(19,17));await p.waitForFunction(()=>!B().busy);
 assert((await appearance()).hidden,'走動後目前探索角色維持潛行');
 if(process.env.STEALTH_SHOT)await p.screenshot({path:process.env.STEALTH_SHOT});
 await p.evaluate(()=>{const b=B(),e=b.units.find(u=>u.side==='foe');e.x=12;e.y=17;b.info=e.id;refreshBattle();});
 await p.locator('[data-explore-cmd="combat"]').tap();assert.equal(await p.evaluate(()=>B().phase),'combat');assert(await p.evaluate(()=>B().manualCombat));assert.equal(await p.evaluate(()=>B().units.filter(u=>u.side==='foe'&&u.combatActive).length),0,'選到敵人也不拉進戰鬥');
 await p.evaluate(()=>{const b=B();b.flowEpoch++;b.turn=b.units.length-1;nextTurn();});assert.equal(await p.evaluate(()=>B().units.filter(u=>u.side==='foe'&&u.combatActive).length),0,'安靜切模式不觸發8格聽覺增援');
 await p.evaluate(()=>{const b=B(),u=b.units.find(u=>u.id==='fox');b.units.filter(v=>v.side==='pc'&&v!==u).forEach((v,i)=>{v.x=25;v.y=25+i;});b.turn=b.units.indexOf(u);b.busy=false;b.actionUsed=false;b.menu='act';u.weapon=null;u.focus=null;const e=b.units.find(u=>u.side==='foe');e.x=u.x+1;e.y=u.y;detectTurnEnemies();checkExposure();refreshBattle();});
 assert.equal(await p.evaluate(()=>B().units.filter(u=>u.side==='foe'&&u.combatActive).length),0,'隱藏檢定仍勝過被動感知');assert(await p.evaluate(()=>isHid(cur())));
 const key=await p.evaluate(()=>attackSkill(cur()).key);await p.locator(`[data-skill="${key}"]`).tap();
 const target=await p.evaluate(()=>{const e=B().units.find(u=>u.side==='foe'),a=validTarget(cur(),attackSkill(cur()),e.x,e.y);return {x:e.x,y:e.y,valid:!!a};});assert(target.valid,'可以主動攻擊未警戒者');
 await p.evaluate(({x,y})=>clickTile(x,y),target);assert.equal(await p.evaluate(()=>B().units.filter(u=>u.side==='foe'&&u.combatActive).length),2);assert.equal(await p.evaluate(()=>B().manualCombat),false);assert(await p.evaluate(()=>B().units.filter(u=>u.side==='foe'&&u.combatActive).every(u=>u.surprised)),'主動攻擊才按察覺判奇襲');
 await p.evaluate(()=>{const b=B();b.flowEpoch++;b.busy=false;beginExplore();b.units.filter(u=>u.side==='foe').forEach(u=>{u.x=1;u.y=1;u.combatActive=false;});const u=exploreUnit();reveal(u);const e=b.units.find(u=>u.side==='foe');e.x=u.x-2;e.y=u.y;enterExploreCombat(null,true);});assert.equal(await p.evaluate(()=>B().manualCombat),false,'真進視野才加入');
 assert.deepEqual(errors,[]);console.log('✓ 手機單人探索潛行後移動保留透明／眼睛、選敵切模式不開戰、無打鬥不聽覺增援、隱藏對抗、主動攻擊奇襲、視野觸發');
}finally{await br.close();}
