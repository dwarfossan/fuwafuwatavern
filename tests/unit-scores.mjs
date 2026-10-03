import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const browser=await chromium.launch();try{
const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
const r=await p.evaluate(()=>{
 startBattle('ambush',false,'explore');const b=B(),u=b.units.find(v=>v.id==='fox');
 const original={goblin:{STR:-1,DEX:2,CON:0,INT:0,WIS:-1,CHA:-1},goblin_archer:{STR:-1,DEX:2,CON:0,INT:0,WIS:-1,CHA:-1},goblin_shaman:{STR:-1,DEX:2,CON:0,INT:0,WIS:2,CHA:0}};
 const balance=Object.entries(original).every(([k,mods])=>JSON.stringify(abilityMods(ENEMIES[k]))===JSON.stringify(mods));
 const merchant=b.units.find(v=>v.side==='npc');const npc=merchant&&Object.values(merchant.scores).every(n=>n===10)&&Object.values(merchant.mods).every(n=>n===0);
 const existingNoPassive=Object.values(ENEMIES).every(e=>!e.passives?.length);
 const base=ENEMIES.goblin;ENEMIES.score_fixture={...base,scores:{...base.scores,STR:13,WIS:13},passives:['darkvision']};
 const def={...b.def,foes:[{type:'score_fixture',x:10,y:10}],npcs:[],blocks:[],elev:[]};BATTLES.score_fixture=def;
 startBattle('score_fixture',false,'explore');const e=B().units.find(v=>v.side==='foe'),it=makeItem(ITEMS.find(x=>x.n==='薩滿圖騰'),false);e.weapon=e.focus=null;e.shield=false;
 const high=canPick(e,it);B().drops=[{x:e.x,y:e.y,item:it,name:it.n,from:'fox'}];const picked=pickUp(e)&&e.focus===it;
 e.focus=null;e.scores.WIS=12;e.mods=abilityMods(e);const low=!canPick(e,it)&&equip(e,it)===false;
 e.scores.WIS=13;e.mods=abilityMods(e);const bothOne=e.mods.WIS===1;
 const armor={type:'armor',str:13};const armor13=!equipmentRequirement(armor,k=>abilityScore(e,k));e.scores.STR=12;const armor12=!!equipmentRequirement(armor,k=>abilityScore(e,k));
 const passive=darkvisionRange(e)===12&&!unitSkills(e).some(isPassiveSkill);e.activeSkills=[];const passiveOff=darkvisionRange(e)===0;
 const player=B().units.find(v=>v.id==='fox');const playerScores=Object.keys(player.scores).length===6&&ABILITIES.every(a=>player.mods[a.k]===modOf(abilityScore(player,a.k)));
 delete ENEMIES.score_fixture;delete BATTLES.score_fixture;startBattle('ambush',false,'explore');B().units.filter(v=>v.side==='foe').forEach(v=>{v.statuses=[];v.x=1;v.y=1;});beginExplore();refreshBattle();
 return {balance,npc,existingNoPassive,high,picked,low,bothOne,armor13,armor12,passive,passiveOff,playerScores};
});
for(const [key,value] of Object.entries(r))assert(value,key);
// Mobile inspection uses the existing unit/status UI; no new enemy panel.
await p.locator('[data-explore-unit="fox"]').tap();await p.evaluate(()=>{const b=B();b.info=b.units.find(v=>v.side==='foe'&&v.type==='goblin_shaman').id;refreshBattle();});
assert.match(await p.locator('.status-abilities').innerText(),/感知/);assert.equal(await p.evaluate(()=>B().units.find(v=>v.type==='goblin_shaman').mods.WIS),2);
await p.waitForTimeout(200);if(process.env.REVIEW_SHOT)await p.screenshot({path:process.env.REVIEW_SHOT});
assert.deepEqual(errors,[]);console.log('✓ 完整六圍與舊調整值一致、13可撿12不可、重甲13邊界、怪物被動共用及手機原狀態卡');
}finally{await browser.close();}
