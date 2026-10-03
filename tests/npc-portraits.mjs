import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"shop":1}'));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await p.evaluate(()=>{state.modal=null;state.page='town';state.townPlace=null;state.supplierSeen=true;render();});
 for(const [place,id] of [['inn','mira'],['smith','bronn'],['guild','ada'],['items','lilianna']]){
  await p.locator(`[data-town-place="${place}"]`).tap();assert.equal(await p.locator(`.town-owner [data-portrait="${id}"].npc-half`).count(),1);
  await p.waitForFunction(()=>Array.from(document.querySelectorAll('.town-owner img')).every(i=>i.complete&&i.naturalWidth>0));
  const r=await p.evaluate(()=>{const root=document.querySelector('.town-owner .portrait'),base=root.querySelector('.pt-base'),styles=[];for(const f of NPC_EXPRESSIONS){setPortraitFace(root,f);styles.push(root.querySelector('.pt-sheet').style.backgroundPosition);}return {unique:new Set(styles).size,baseSame:root.querySelector('.pt-base')===base,overflow:getComputedStyle(root).overflow,ratio:root.offsetWidth/root.offsetHeight};});
  assert.equal(r.unique,12);assert(r.baseSame);assert.equal(r.overflow,'hidden');assert(r.ratio>1,'半身視窗不得顯示全身');
  await p.evaluate(()=>{const p=townPlace(),root=document.querySelector('.town-owner .portrait');setPortraitFace(root,PORTRAITS[p.portrait].def);});
  if(process.env.NPC_SHOTS)await p.screenshot({path:path.join(process.env.NPC_SHOTS,place+'.png')});
  if(['smith','items'].includes(place)){await p.locator('#townAction').tap();assert.equal(await p.locator(`.quip-face [data-portrait="${id}"].npc-head`).count(),1);await p.evaluate(()=>leaveTownShop());}
  await p.locator('#townStreet').tap();
 }
 for(const id of ['lilianna','mira','ada','bronn']){
  await p.evaluate(id=>{SCENES.npcReview={bg:'town',actors:[id],script:[{who:id,text:'立繪驗收',face:'normal'},{who:id,text:'表情驗收',face:'surprised'}],next:['townBack','返回']};state.page='story';state.scene='npcReview';state.line=0;render();},id);
  assert.equal(await p.locator('.actor .npc-half').count(),1);await p.locator('#stage').tap();assert.equal(await p.locator('.actor .pt-sheet').getAttribute('data-face'),'surprised');
  if(process.env.NPC_SHOTS)await p.screenshot({path:path.join(process.env.NPC_SHOTS,'story-'+id+'.png')});
 }
 assert.deepEqual(errors,[]);console.log('✓ 四位NPC半身、48種表情、底圖不換、手機進店／購物／劇情換臉');
}finally{await br.close();}
