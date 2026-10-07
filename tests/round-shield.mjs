import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('fuwa-help-seen','{"shop":1,"battle":1}')}catch{}});
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 const item=await p.evaluate(()=>{state.battle=null;state.page='shop';state.shopActive=2;state.shopCat='盾牌';state.inv.wolf=[];state.gold.wolf=100*GP;render();return ITEMS.find(i=>i.n==='盾牌');});
 await p.locator(`[data-buy="${item.id}"]`).tap();
 assert.equal(await p.evaluate(()=>invItems('wolf')[0].n),'盾牌');
 assert.equal(await p.evaluate(()=>state.gold.wolf),90*100);
 await p.locator(`.shop-list [data-iteminfo="${item.id}"]`).tap();
 assert.equal(await p.locator('.md-sk').count(),0);assert.equal(await p.locator('.md-head svg').count(),1);
 assert(await p.evaluate(()=>!itemCardHTML(ITEMS.find(i=>i.n==='盾牌')).includes('data-skinfo')));

 const r=await p.evaluate(()=>{const it=invItems('wolf')[0];state.inv.wolf=[];state.inv.fox=[it.id];Equipment.set('fox',{off:it.id});const u={id:'fox',side:'pc',scores:abilityScores('fox'),mods:abilityMods('fox'),statuses:[],...Equipment.read('fox')};const raw=ITEM_RAW.round_shield;return {equipped:Equipment.shieldItem(u).id===it.id,off:dollGear(u).off,svg:dollSVG({id:'fox',...dollGear(u),face:1}).includes(raw),xml:!new DOMParser().parseFromString(iconSVG('round_shield',38),'image/svg+xml').querySelector('parsererror'),grants:it.grants||[],ordinary:it.ac===2&&!it.rarity,acGain:acOfUnit(u)-acOfUnit({...u,shield:false})};});
 assert(r.equipped&&r.svg&&r.xml&&r.ordinary);assert.equal(r.acGain,2);assert.equal(r.off,'round_shield');assert.deepEqual(r.grants,[]);const extra=await p.evaluate(()=>{
  const base=ITEMS.find(i=>i.n==='盾牌'),metal=makeItem(base,false,'tiger'),wood=makeItem(base,false,'wolf');
  const enemy=makeItem(base,false,ENEMIES.goblin);state.inv.tiger=[metal.id];state.inv.wolf=[wood.id];Equipment.set('tiger',{off:metal.id});Equipment.set('wolf',{off:wood.id});
  const gallery=[['嬌嬌',metal],['香香',wood]].map(([name,it])=>`<section><h2>${name}的盾牌</h2>${dollSVG({id:name==='嬌嬌'?'tiger':'wolf',main:'sword',off:equipmentArtKey(it),face:1,w:150})}${itemCardHTML(it)}</section>`).join('');
  document.body.className='';document.body.innerHTML=`<main style="padding:16px">${gallery}</main>`;
  return {names:[metal.n,wood.n,enemy.n],arts:[metal.art,wood.art,enemy.art],instances:metal.id!==wood.id,templates:ITEMS.filter(i=>i.type==='shield').length};
 });assert.deepEqual(extra.names,['盾牌','盾牌','盾牌']);assert.deepEqual(extra.arts,['shield','round_shield','round_shield']);assert(extra.instances);assert.equal(extra.templates,1);
 if(process.env.SHIELD_SHOT)await p.screenshot({path:process.env.SHIELD_SHOT,fullPage:true});
 assert.deepEqual(errors,[]);console.log('✓ 背景配發盾牌、轉交保留造型；普通圓木盾手機購買、扣款、無附帶技能、共用裝備實例與手持SVG；普通盾牌技能卡修正');
}finally{await br.close();}
