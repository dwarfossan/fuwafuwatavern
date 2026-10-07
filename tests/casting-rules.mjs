import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const browser=await chromium.launch();try{
const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
const checks=await p.evaluate(()=>{
 startBattle('ambush');const b=B(),u=b.units.find(v=>v.id==='fox');b.flowEpoch=(b.flowEpoch||0)+1;b.turn=b.units.indexOf(u);b.busy=false;b.tut=-1;b.actionUsed=b.freeUsed=false;
 u.weapon=u.focus=u.offhand2=null;u.shield=false;u.mods={STR:0,DEX:0,CON:0,INT:1,WIS:4,CHA:2};u.backpack=[];u.slots=[2];
 const r={stat:spellStat(u),noFocus:skillReqMet(u,learnedSkillByKey('magic_missile')),components:componentProblem(u,learnedSkillByKey('magic_missile')),dc:dcOf(u,spellStat(u))};
 u.learned=[{key:'magic_missile',name:'魔法飛彈'},{key:'mage_armor',name:'法師護甲'}];u.activeSkills=['magic_missile','mage_armor'];
 for(const k of ['INT','WIS','CHA'])state.rolls.fox[k]=[2,2,2,2];state.gold.fox=100*GP;u.scores=abilityScores("fox");
 const it=makeItem({...ITEMS.find(it=>it.n==='薩滿圖騰')},false);r.fixed=it.stat;r.block=blockReason('fox',it);r.pickBlocked=!canPick(u,it);u.backpack=[it];r.equipBlocked=!equipItemAt(u,'bag:0','weapon1');
 state.rolls.fox.WIS=[4,4,5,1];u.scores=abilityScores("fox");r.pickAllowed=canPick(u,it);r.equipAllowed=equipItemAt(u,'bag:0','weapon1');r.same=u.weapon===it&&it.stat==='WIS';
 u.weapon=null;u.focus=null;u.backpack=[ITEMS.find(it=>it.n==='材料包')];u.statuses=[];u.shield=false;b.menu='act';refreshBattle();return r;
});
assert.equal(checks.stat,'WIS');assert.equal(checks.dc,14);assert(checks.noFocus);assert.equal(checks.components,'');assert.equal(checks.fixed,'WIS');assert.match(checks.block,/需要感知 13/);assert(checks.pickBlocked&&checks.equipBlocked&&checks.pickAllowed&&checks.equipAllowed&&checks.same);
await p.locator('[data-cmd="skills"]').tap();assert(!await p.locator('[data-skill="mage_armor"]').isDisabled());await p.locator('[data-skill="mage_armor"]').tap();assert(await p.evaluate(()=>!!has(cur(),'mageArmor')));
await p.waitForTimeout(300);if(process.env.REVIEW_SHOT)await p.screenshot({path:process.env.REVIEW_SHOT});
const learned=await p.evaluate(()=>{
 const b=B(),u=b.units.find(v=>v.id==='fox'),e=b.units.find(v=>v.side==='foe');b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.actionUsed=b.freeUsed=false;u.dead=false;u.pendingLearned=[];e.weapon=null;e.focus=null;e.statuses=[];e.dead=e.down=false;e.mods.INT=3;e.shield=false;
 const old=Math.random;Math.random=()=>.99;
 doSkill(e,learnedSkillByKey('shocking_grasp'),u);
 b.actionUsed=b.freeUsed=false;doSkill(e,focusCantripSkill(SKILL_GROUPS.find(g=>g.id==='healing_book')),u);
 Math.random=old;
 return {keys:u.pendingLearned.map(n=>n.key),card:skillCardHTML('healing_book',-1,null,u),canonical:!!learnedSkillByKey('totem_fire_bolt'),foeFixed:b.units.filter(v=>v.side==='foe'&&v.focus?.n==='薩滿圖騰').every(v=>v.focus.stat==='WIS')};
});
assert(learned.keys.includes('shocking_grasp'));assert(learned.keys.includes('healing_book_cantrip'));assert.match(learned.card,/聖火術/);assert.match(learned.card,/光耀/);assert(learned.canonical&&learned.foeFixed);assert.deepEqual(errors,[]);console.log('✓ 無法器施法、最高施法屬性、13門檻、固定怪物法器、附帶戲法觀察及共用技能卡、手機施放');
}finally{await browser.close();}
