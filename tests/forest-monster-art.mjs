import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs/promises';
const shots=process.env.FOREST_SHOTS||'/tmp/forest-review';await fs.mkdir(shots,{recursive:true});const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.abort());await p.goto('file://'+path.resolve('index.html')+'#town');await p.waitForFunction(()=>typeof B==='function'&&!document.body.classList.contains('image-boot'));
 await p.evaluate(()=>{
  const parse=s=>{const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('invalid svg');return d;};
  for(const k of ['boar','forest_wolf','mantrap']){
   const look=MONSTER_LOOK[k];parse(look.face);
   for(const face of [-1,1])for(const pose of [{},{walking:true},{anim:{k:'punch',el:200}},{anim:{k:'hurt',el:200}},{down:true},{prone:true}]){
    const d=parse(dollSVG({look,x:0,y:0,w:140,face,...pose}));if(d.documentElement.getAttribute("data-monster")!==k)throw Error('missing monster');if(k!=='mantrap'&&d.querySelectorAll('.forest-leg').length!==4)throw Error('missing legs');
   }
  }
  window.nextTurn=()=>{};startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.tut=-1;b.turn=0;b.round=1;b.moveLeft=6;b.freeUsed=0;state.page='battle';const u=b.units.find(v=>v.side==='foe');u.statuses=[];u.weapon=null;u.armor=null;u.shield=false;render();const floor=document.getElementById('board-floor');
  for(const k of ['boar','forest_wolf','mantrap']){u.look=k;refreshBattle();if(!document.querySelector(`.token [data-monster="${k}"]`))throw Error('battle missing '+k);b.info=u.id;refreshBattle();if(!document.querySelector(`.foe-view [data-monster="${k}"]`))throw Error('status card missing '+k);b.info=null;}
  if(floor!==document.getElementById('board-floor'))throw Error('floor changed');
  const look=MONSTER_LOOK.mantrap;if(dollSVG({look,x:0,y:0,w:140})===dollSVG({look,x:0,y:0,w:140,anim:{k:'punch',el:200}}))throw Error('missing bite');
  window.__forestUnit=u;
 });await p.waitForTimeout(700);await p.evaluate(()=>{const u=window.__forestUnit;B().info=null;u.x=4;u.y=4;u.look='mantrap';u.name='食人草（外觀測試）';u.anim={k:'punch',t:Date.now()};refreshBattle();centerCam(4,5);});await p.waitForTimeout(100);await p.screenshot({path:shots+'/battle.png'});
 await p.evaluate(()=>{
  const base={x:0,y:0,w:145};const cards=[['野豬','boar',{}],['野豬走動','boar',{walking:true}],['森林狼','forest_wolf',{}],['狼受傷','forest_wolf',{anim:{k:'hurt',el:220}}],['食人草 Boss','mantrap',{}],['張嘴咬人','mantrap',{anim:{k:'punch',el:200}}]];
  document.getElementById('app').innerHTML=`<section class="forest-preview"><h1>森林怪物</h1><p>外觀暫定・體型與數值尚未設定</p><div>${cards.map(([title,k,pose])=>`<figure>${dollSVG({...base,look:MONSTER_LOOK[k],...pose})}<figcaption>${title}</figcaption></figure>`).join('')}</div><footer>${['boar','forest_wolf','mantrap'].map(k=>MONSTER_LOOK[k].face).join('')}</footer></section>`;
  const s=document.createElement('style');s.textContent='.forest-preview{padding:16px;background:#24212a;min-height:844px;color:#f7ead5;font-family:sans-serif}.forest-preview h1{font-size:24px;margin:0}.forest-preview p{font-size:13px;margin:8px 0 16px}.forest-preview>div{display:grid;grid-template-columns:1fr 1fr;gap:12px}.forest-preview figure{margin:0;background:#38313e;border:2px solid #6c5c66;border-radius:14px;text-align:center;padding:8px 0}.forest-preview figure>svg{height:156px}.forest-preview figcaption{font-size:13px}.forest-preview footer{display:flex;justify-content:center;gap:12px;margin-top:12px}.forest-preview footer svg{width:76px;height:76px}';document.head.append(s);
 });await p.screenshot({path:shots+'/preview.png'});assert.deepEqual(errors,[]);console.log('✓ 三隻森林怪物SVG／頭像、左右、行走／攻擊／受傷／倒下、四足與食人草張嘴，實際戰場／共用狀態卡／地板保留；390×844截圖');
}finally{await br.close();}
