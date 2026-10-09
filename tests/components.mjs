import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {bootReady} from './boot.mjs';
const br=await chromium.launch();try{
const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];pg.on('pageerror',e=>errors.push(e.message));
await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(pg);
await pg.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
const checks=await pg.evaluate(()=>{
 startBattle('ambush');const b=B(),u=b.units.find(x=>x.id==='fox');b.flowEpoch=(b.flowEpoch||0)+1;b.turn=b.units.indexOf(u);b.busy=false;b.menu='act';b.tut=-1;b.actionUsed=b.freeUsed=false;u.armor=null;u.weapon=makeItem(ITEMS.find(i=>i.n==='火焰法球'));u.focus=null;u.shield=true;u.offhand2=null;for(const key of ['magic_missile','fire_shield']){if(!u.learned.some(n=>n.key===key))u.learned.push({key,name:learnedSkillByKey(key).def.name});if(!u.activeSkills.includes(key))u.activeSkills.push(key);}u.activeSkills=['magic_missile','fire_shield','healing_word','bless'];u.slots=[2];
 const skill=name=>({def:{components:SPELL_COMPONENTS[name]}}),out={};
 out.vs=componentProblem(u,skill('魔法飛彈'));out.vsm=componentProblem(u,skill('火焰護盾'));out.v=componentProblem(u,skill('治癒真言'));
 u.silenced=true;out.silence=componentProblem(u,skill('治癒真言'));u.silenced=false;u.gagged=true;out.gag=componentProblem(u,skill('治癒真言'));u.gagged=false;
 u.shield=false;u.backpack=[];out.costMissing=componentProblem(u,skill('祝福術'));u.backpack=[ITEMS.find(i=>i.n==='聖徽')];out.costPresent=componentProblem(u,skill('祝福術'));
 const material={def:{components:{s:true,m:{name:'測試材料'}}}};u.focus=null;u.weapon=ITEMS.find(i=>i.n==='巨劍');out.twohand=componentProblem(u,skill('魔法飛彈'));u.backpack=[ITEMS.find(i=>i.n==='材料包')];out.pouch=componentProblem(u,material);
 u.weapon=makeItem(ITEMS.find(i=>i.n==='火焰法球'));u.shield=true;u.statuses=[{k:'hidden',val:20}];const before=u.slots.slice();doSkill(u,learnedSkillByKey('magic_missile'),b.units.find(x=>x.side==='foe'));out.failedNoCost=JSON.stringify(before)===JSON.stringify(u.slots)&&!!has(u,'hidden')&&!b.actionUsed;
 refreshBattle();return out;
});
assert.equal(checks.vs,'需要空出一隻手');assert.equal(checks.vsm,'');assert.equal(checks.v,'');assert.equal(checks.silence,'無法發聲');assert.equal(checks.gag,'無法發聲');assert.equal(checks.costMissing,'缺少聖徽');assert.equal(checks.costPresent,'');assert.equal(checks.twohand,'');assert.equal(checks.pouch,'');assert(checks.failedNoCost);
await pg.locator('[data-cmd="skills"]').tap();assert(await pg.locator('[data-skill="magic_missile"]').isDisabled());assert.match(await pg.locator('[data-skill="magic_missile"]').innerText(),/需要空出一隻手/);assert(!await pg.locator('[data-skill="fire_shield"]').isDisabled());
await pg.waitForTimeout(400);if(process.env.REVIEW_SHOT)await pg.screenshot({path:process.env.REVIEW_SHOT});
await pg.locator('[data-skill="fire_shield"]').tap();assert(await pg.evaluate(()=>!!has(cur(),'fireShield')));assert(await pg.evaluate(()=>!has(cur(),'hidden')&&cur().shield));
assert.deepEqual(errors,[]);console.log('✓ 聲、勢、一般材、標價材、法器手、空手、雙手武器、材料包、無效施法不扣格不現身、手機禁用提示與合法施法');
}finally{await br.close();}
