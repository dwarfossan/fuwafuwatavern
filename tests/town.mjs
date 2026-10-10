import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const shot=async name=>{if(process.env.TOWN_SHOTS){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.target?.classList?.contains('enter')).map(a=>a.finished)));await page.screenshot({path:path.join(process.env.TOWN_SHOTS,name)});}};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"map":1,"shop":1}'));
 await page.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await page.waitForFunction(()=>!document.body.classList.contains('image-boot'));
 await page.evaluate(()=>{state.modal=null;state.page='story';state.scene='prologue';state.line=0;render();});
 const opening=await page.evaluate(()=>{const a=document.querySelector('.stage').getBoundingClientRect(),p=document.querySelector('.party').getBoundingClientRect();return {width:a.width,height:a.height,gap:p.top-a.bottom,partyWidth:p.width};});
 await shot('opening-layout.png');
 await page.evaluate(()=>{
  startBattle('ambush');const b=B();b.result='win';b.busy=false;
  b.units.filter(u=>u.side==='pc').forEach(u=>{u.slots=[0];u.pendingLearned=[];});
  b.units.find(u=>u.id==='fox').pendingLearned=[{key:'burning_hands',name:'燃燒之手',lv:1,from:'測試'}];
  leaveBattleTo('caravan');state.caravan={pick:'wolf',ok:true};state.location='town';state.townFounded=true;state.supplierSeen=true;state.page='town';render();
 });
 assert.equal(await page.locator('[data-town-place]').count(),4);
 assert.equal(await page.locator('#board-floor').count(),0);
 assert.equal(await page.evaluate(()=>B()),null);
 await shot('town-street.png');
 await page.evaluate(()=>{state.innNightDone=true;});   // 這支測四店照常進出；進城第一晚的強制長休另在 quick-town 驗
 for(const id of ['inn','smith','guild','items']){
  await page.locator(`[data-town-place="${id}"]`).tap();
  assert.equal(await page.locator('.town-page .portrait').count(),1);assert.equal(await page.locator('.town-interior').count(),0);
  assert.equal(await page.locator('#board-floor').count(),0);
  assert.equal(await page.locator('.npc-space').count(),0);
  assert.equal(await page.locator('.party .pf').count(),4);
  const layout=await page.evaluate(()=>{const a=document.querySelector('.stage').getBoundingClientRect(),p=document.querySelector('.party').getBoundingClientRect(),d=document.querySelector('.dialog').getBoundingClientRect();return {width:a.width,height:a.height,gap:p.top-a.bottom,partyWidth:p.width,order:d.bottom<=p.top};});
  assert(layout.order);delete layout.order;assert.deepEqual(layout,opening);
  await page.locator('.party [data-info="fox"]').tap();assert.equal(await page.locator('.modal').count(),1);await page.locator('.md-x').tap();
  await shot(`town-${id}.png`);
  // 對話：自我介紹逐句點完回到話題列，不聊了回到原本按鈕
  await page.locator('#townTalk').tap();
  await page.locator('[data-talk-topic="intro"]').tap();
  const intro=await page.evaluate(i=>TOWN_TALK[i].intro,id);
  assert.equal(await page.locator('.town-dialog p').textContent(),intro[0]);
  for(let k=0;k<intro.length;k++)await page.locator('#townTalkNext').tap();
  assert.equal(await page.locator('[data-talk-topic]').count(),3);
  await page.locator('#townTalkClose').tap();
  assert.equal(await page.locator('#townAction').count(),1);
  if(id==='inn'){
   await page.locator('#townAction').tap();
   assert.equal(await page.locator('[data-restpick="fox:burning_hands"]').count(),1);
   await page.locator('#shortRest').tap();
   assert.equal(await page.evaluate(()=>state.shortRestsUsed),1);
   assert.deepEqual(await page.evaluate(()=>state.proficiency.fox),[1]);
   assert(await page.evaluate(()=>state.learned.fox.some(n=>n.key==='burning_hands')));
   assert.equal(await page.evaluate(()=>state.townRest.units.find(u=>u.id==='fox').pendingLearned.length),0);
   await page.locator('#shortRest').tap();assert(await page.locator('#shortRest').isDisabled());
   await page.locator('#longRest').tap();
   assert.deepEqual(await page.evaluate(()=>[state.page,state.scene]),['story','innRest']);await page.evaluate(()=>{state.page='town';state.townPlace='inn';state.townPanel='rest';render();});   // 10-10：長休後先看旅店 CG（按鈕流程在 quick-town 驗）
   assert.equal(await page.evaluate(()=>state.shortRestsUsed),0);
   assert.deepEqual(await page.evaluate(()=>state.proficiency.fox),[2]);
   assert.equal(await page.evaluate(()=>state.retriesLeft),3);
   assert.equal(await page.evaluate(()=>B()),null);
   await shot('town-rest.png');
  }else if(id==='guild'){
   await page.locator('#townAction').tap();assert(await page.locator('.quest-board').isVisible());
  }else{
   await page.locator('#townAction').tap();
   const cats=await page.locator('[data-cat]').allTextContents();
   assert.deepEqual(cats,id==='smith'?['簡易近戰','簡易遠程','軍用近戰','軍用遠程','護甲','盾牌']:['法器','道具','冒險用品','魔法物品']);
   assert.equal(await page.locator('#depart').count(),0);assert.equal(await page.locator('#backStory').count(),0);
   const wanted=id==='smith'?'匕首':'奧術法杖';
   await page.evaluate(()=>{state.gold.fox=1000*GP;state.inv.fox=[];for(const k of ['INT','WIS','CHA'])state.rolls.fox[k]=[6,6,6,6];render();});
   const item=page.locator('.item').filter({has:page.locator('.it-name',{hasText:wanted})}).first();
   await item.locator('[data-buy]').tap();
   assert(await page.evaluate(n=>invItems('fox').some(i=>i.n===n),wanted));
   if(id==='items')assert(await page.evaluate(()=>['INT','WIS','CHA'].includes(invItems('fox').find(i=>i.n==='奧術法杖').stat)));
   assert.equal(await page.evaluate(()=>takeRest('short',{},state.townRest)),false);
   await shot(`town-${id}-shop.png`);
   await page.locator('#leaveTownShop').tap();assert.equal(await page.evaluate(()=>state.page),'town');
  }
  await page.locator('#townStreet').tap();
 }
 await page.locator('#townMap').tap();if(await page.evaluate(()=>state.page!=='map'))await page.locator('#townMap').tap();await page.locator('#enterTown').tap();
 assert.equal(await page.evaluate(()=>state.page),'town');assert.equal(await page.locator('[data-town-place]').count(),4);
 assert.deepEqual(errors,[]);
 console.log('✓ four graphical venues, shops buy with fixed focus, inn shared rest and notes, map return, no combat timers/errors');
}finally{await browser.close();}
