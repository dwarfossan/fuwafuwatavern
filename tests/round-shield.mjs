import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('fuwa-help-seen','{"shop":1,"battle":1}')}catch{}});
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 const item=await p.evaluate(()=>{state.battle=null;state.page='shop';state.shopActive=0;state.shopCat='盾牌';state.inv.fox=[];state.gold.fox=100*GP;render();return ITEMS.find(i=>i.n==='圓木盾');});
 await p.locator(`[data-buy="${item.id}"]`).tap();
 assert.equal(await p.evaluate(()=>invItems('fox')[0].n),'圓木盾');
 assert.equal(await p.evaluate(()=>state.gold.fox),90*100);
 await p.locator(`.shop-list [data-iteminfo="${item.id}"]`).tap();
 assert.equal(await p.locator('.md-sk').count(),0);assert.equal(await p.locator('.md-head svg').count(),1);
 assert(await p.evaluate(()=>!itemCardHTML(ITEMS.find(i=>i.n==='盾牌')).includes('data-skinfo')));
 if(process.env.SHIELD_SHOT){await p.waitForTimeout(700);await p.screenshot({path:process.env.SHIELD_SHOT});}
 const r=await p.evaluate(()=>{const it=invItems('fox')[0];Equipment.set('fox',{off:it.id});const u={id:'fox',side:'pc',scores:abilityScores('fox'),mods:abilityMods('fox'),statuses:[],...Equipment.read('fox')};const raw=ITEM_RAW.round_shield;return {equipped:Equipment.shieldItem(u).id===it.id,off:dollGear(u).off,svg:dollSVG({id:'fox',...dollGear(u),face:1}).includes(raw),xml:!new DOMParser().parseFromString(iconSVG('round_shield',38),'image/svg+xml').querySelector('parsererror'),grants:it.grants||[],ordinary:it.ac===2&&!it.rarity,acGain:acOfUnit(u)-acOfUnit({...u,shield:false})};});
 assert(r.equipped&&r.svg&&r.xml&&r.ordinary);assert.equal(r.acGain,2);assert.equal(r.off,'round_shield');assert.deepEqual(r.grants,[]);assert.deepEqual(errors,[]);console.log('✓ 普通圓木盾手機購買、扣款、無附帶技能、共用裝備實例與手持SVG；普通盾牌技能卡修正');
}finally{await br.close();}
