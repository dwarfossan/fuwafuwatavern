import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
try{
 await pg.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"roll":1,"shop":1}'));
 await pg.goto('file://'+path.resolve('index.html'));
 await pg.locator('#start').tap();for(let i=0;i<4;i++){await pg.locator(`[data-tab="${i}"]`).tap();await pg.locator('#rollAll').tap();await pg.locator('#autoAssign').tap();}
 await pg.locator('#next').tap();assert.equal(await pg.evaluate(()=>state.starterGranted),false);
 while(!await pg.evaluate(()=>SCENES.prologue.script[state.line].grantStarter))await pg.locator('#stage').tap();
 const gear=await pg.evaluate(()=>CRITTERS.map(c=>({id:c.id,gold:state.gold[c.id]/GP,names:invItems(c.id).map(i=>i.n),load:state.startingGear[c.id]})));
 const expected=[['奧術法杖','輕弩','法袍','矢匣','背包'],['長劍','盾牌','手弩','鏈甲衫','矢匣','背包'],['彎刀','短弓','鏈甲衫','箭袋','背包'],['匕首','匕首','短弓','鑲釘皮甲','箭袋','背包']];
 gear.forEach((g,i)=>{assert.equal(g.gold,100);assert.deepEqual(g.names,expected[i]);});
 const counts=await pg.evaluate(()=>{const before=CRITTERS.map(c=>state.inv[c.id].length);grantStarterGear();render();return [before,CRITTERS.map(c=>state.inv[c.id].length)];});assert.deepEqual(counts[0],counts[1]);
 await pg.waitForTimeout(350);await pg.screenshot({path:'/tmp/opening-gift.png'});
 while(!await pg.evaluate(()=>SCENES.prologue.script[state.line].text.includes('牆板翻轉')))await pg.locator('#stage').tap();
 await pg.waitForTimeout(350);await pg.screenshot({path:'/tmp/opening-wall.png'});
 while(await pg.locator('#toShop').isDisabled())await pg.locator('#stage').tap();await pg.locator('#toShop').tap();
 assert.deepEqual(await pg.evaluate(()=>CRITTERS.map(c=>state.gold[c.id]/GP)),[100,100,100,100]);
 const config=await pg.evaluate(()=>{startBattle('ambush',false,'explore');return CRITTERS.map(c=>B().units.find(u=>u.id===c.id)).map(u=>{const first=[u.weapon?.n,u.shield?'盾牌':u.offhand?.n||null];switchWeaponSet(u,2);const second=[u.weapon?.n,u.shield?'盾牌':u.offhand?.n||null];const ammo=hasAmmoFor(u);switchWeaponSet(u,2);return {first,second,ammo,back:[u.weapon?.n,u.shield?'盾牌':u.offhand?.n||null]};});});
 const first=[['奧術法杖',null],['長劍','盾牌'],['彎刀',null],['匕首','匕首']],second=['輕弩','手弩','短弓','短弓'];config.forEach((c,i)=>{assert.deepEqual(c.first,first[i]);assert.deepEqual(c.second,[second[i],null]);assert.deepEqual(c.back,first[i]);assert(c.ammo);});
 const repeat=await pg.evaluate(()=>{const u=B().units.find(u=>u.id==='raccoon');return {off:dollGear(u).off,free:freeHand(u),weight:carriedWeight(u),want:weightOf(u.id)};});assert.equal(repeat.off,'dagger');assert.equal(repeat.free,false);assert.equal(repeat.weight,repeat.want);
 const reroll=await pg.evaluate(()=>{resetGear(CRITTERS[2]);grantStarterGear();return CRITTERS.map(c=>invItems(c.id).map(i=>i.n));});assert.deepEqual(reroll,expected);
 assert.deepEqual(errs,[]);console.log('✓ 開場先贈裝後揭牆、100金保留、不重複發放、四隻配置與雙匕首切換、彈藥、重量與副手外觀');
}finally{await br.close();}
