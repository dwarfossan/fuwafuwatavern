import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs/promises';
const shots=process.env.WEAPON_SHOTS||'/tmp/weapon-review';await fs.mkdir(shots,{recursive:true});const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('fuwa-help-seen','{"shop":1,"battle":1}');}catch{}});await p.goto('file://'+path.resolve('index.html')+'#town');await p.waitForFunction(()=>typeof B==='function'&&!document.body.classList.contains('image-boot'));
 const r=await p.evaluate(()=>{
  const parse=s=>{const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('SVG');return d;};
  window.nextTurn=()=>{};startBattle('ambush');B().turn=0;
  const weapons=ITEMS.filter(it=>it.type==='weapon'&&!it.noShop),keys=weapons.map(equipmentArtKey);
  if(new Set(keys).size!==weapons.length)throw Error('duplicate weapon keys');
  const originals=JSON.stringify(weapons);
  for(const it of weapons){
   const key=equipmentArtKey(it),meta=HELD[key];if(!ITEM_RAW[key]||!ITEM_ART[key]||!meta)throw Error('missing '+it.n);
   parse(`<svg xmlns="http://www.w3.org/2000/svg">${ITEM_RAW[key]}</svg>`);parse(iconSVG(key,36));
   for(const face of [-1,1]){const d=parse(dollSVG({id:'fox',color:CRITTERS[0].color,main:key,face,x:0,y:0,w:140}));if(!d.querySelector('.dl-arm path'))throw Error('missing held '+it.n);const hands=d.querySelectorAll('.dl-arm circle');if(meta.two&&hands.length<2)throw Error('missing support '+it.n);}
   if(equipmentArtKey({...it,n:'魔法測試',base:it.n})!==key)throw Error('base lost '+it.n);
   if(projArtKey(it)!==key)throw Error('throw art '+it.n);
   if(!dropSVG({item:it,group:groupOf(it).id,x:2,y:2,fx:2,fy:2,t:Date.now()-1000}).includes(ITEM_RAW[key]))throw Error('ground art '+it.n);
   if(!itemCardHTML(it).includes(ITEM_ART[key]))throw Error('item info '+it.n);
  }
  if(JSON.stringify(weapons)!==originals)throw Error('item rules modified');
  state.page='shop';state.shopContext='smith';state.shopCat='軍用近戰';state.battle=null;render();
  return {count:weapons.length,distinct:new Set(weapons.map(it=>ITEM_RAW[equipmentArtKey(it)])).size};
 });assert.equal(r.count,r.distinct);
 await p.locator('[data-iteminfo]').filter({hasText:'巨斧'}).first().tap();assert(await p.locator('.modal-back').count());await p.screenshot({path:shots+'/shop.png'});
 await p.evaluate(()=>{
  state.modal=null;window.nextTurn=()=>{};startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.turn=0;b.tut=-1;b.round=1;b.moveLeft=6;b.freeUsed=0;
  const u=b.units.find(v=>v.side==='pc'),weapon=ITEMS.find(i=>i.n==='巨斧');u.weapon=weapon;u.focus=null;u.shield=false;u.offhand=null;u.x=4;u.y=4;state.page='battle';render();centerCam(4,5);
  const html=StatusCard.render(u,b,true),root=document.createElement('div');root.innerHTML=html;if(!root.querySelector('[data-gearslot="weapon1"] [data-weapon-art="greataxe"]'))throw Error('status slot wrong');if(!root.querySelector('.dl-arm [data-weapon-art="greataxe"]'))throw Error('status doll wrong');
  const foe=b.units.find(v=>v.side==='foe');foe.weapon=weapon;foe.dead=true;foe.fled=false;b.result='win';b.loot=null;
  if(!battleLootHTML().includes(ITEM_ART.greataxe))throw Error('loot wrong');b.result=null;refreshBattle();
 });await p.waitForTimeout(700);await p.screenshot({path:shots+'/battle.png'});
 await p.evaluate(()=>{
  const preferred=['巨劍','巨斧','巨錘','戰斧','戰鎬','鏈枷'],weapons=ITEMS.filter(it=>it.type==='weapon'&&!it.noShop),ordered=[...preferred.map(n=>weapons.find(i=>i.n===n)),...weapons.filter(it=>!preferred.includes(it.n))];
  document.getElementById('app').className='wrap';document.getElementById('app').style.padding='0';
  document.getElementById('app').innerHTML=`<section class="weapon-preview"><h1>共用武器外觀</h1><p>圖示與手持使用同一份SVG・造型暫定</p><div>${ordered.map(it=>{const key=equipmentArtKey(it);return `<figure><div>${iconSVG(key,45)}${dollSVG({id:'fox',color:CRITTERS[0].color,main:key,x:0,y:0,w:95})}</div><figcaption>${it.n}</figcaption></figure>`;}).join('')}</div></section>`;
  const s=document.createElement('style');s.textContent='.weapon-preview{padding:16px;background:#24212a;min-height:844px;color:#f7ead5;font-family:sans-serif}.weapon-preview h1{font-size:24px;margin:0}.weapon-preview p{font-size:12px;margin:8px 0 16px}.weapon-preview>div{display:grid;grid-template-columns:1fr 1fr;gap:14px}.weapon-preview figure{margin:0;background:#38313e;border:2px solid #6c5c66;border-radius:14px;padding:14px 3px;text-align:center;height:211px;box-sizing:border-box}.weapon-preview figure>div{display:flex;align-items:center;justify-content:center;height:153px}.weapon-preview figcaption{font-size:16px;margin-top:10px}';document.head.append(s);
 });await p.evaluate(()=>{document.querySelector('.weapon-preview').classList.add('first-page');const s=document.createElement('style');s.textContent='.weapon-preview.first-page figure:nth-child(n+7){display:none}';document.head.append(s);});await p.screenshot({path:shots+'/preview.png'});await p.evaluate(()=>document.querySelector('.weapon-preview').classList.remove('first-page'));const all=await p.screenshot({path:shots+'/all.png',fullPage:true});assert(all.readUInt32BE(20)>3000,'all weapons screenshot must include full gallery');assert.deepEqual(errors,[]);console.log(`✓ ${r.count}普通武器一物一圖；魔法base、左右手持／雙手、商店點卡、狀態卡、戰利品、掉落與投擲共用，物品規則不變；390×844截圖`);
}finally{await br.close();}
