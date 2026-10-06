import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs/promises';
const shots=process.env.MONSTER_SHOTS||'/tmp/dragon-review';await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch();
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.abort());
 await p.goto('file://'+path.resolve('index.html')+'#town');await p.waitForFunction(()=>typeof B==='function'&&!document.body.classList.contains('image-boot'));
 await p.evaluate(()=>{
  const parse=s=>{const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('invalid svg');return d;};
  if(parse(dollSVG({look:MONSTER_LOOK.dragon,x:0,y:0,w:140})).querySelectorAll('.dragon-leg').length!==4)throw Error('four legs required');
  for(const [key,look]of Object.entries(MONSTER_LOOK)){if(look.face)parse(look.face);if(look.head)parse(look.head);}
  for(const key of ['face','head','headHurt'])if(parse(MONSTER_LOOK.orc_captain[key]).querySelectorAll('[data-eye-patch="right"]').length!==1)throw Error('eye patch '+key);
  for(const face of [-1,1])for(const down of [false,true])for(const look of [MONSTER_LOOK.orc_captain,MONSTER_LOOK.dragon])parse(dollSVG({look,face,down,x:0,y:0,w:140,main:'sword',off:'shield',armor:'皮甲'}));
  window.nextTurn=()=>{};startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.def=JSON.parse(JSON.stringify(b.def));delete b.def._h;b.def.blocks=[];b.def.heights=[];b.busy=false;b.tut=-1;b.turn=0;b.round=1;b.moveLeft=6;b.freeUsed=0;
  const u=b.units.find(v=>v.side==='foe'),t=b.units.find(v=>v.side==='pc');u.look='dragon';u.name='小龍（外觀測試）';u.statuses=[];u.x=4;u.y=4;u.weapon=null;u.armor=null;u.shield=false;t.x=7;t.y=4;t.hp=t.maxHp;t.statuses=[];
  for(const v of b.units)if(v!==u&&v!==t)v.fled=true;
  b.def.blocks=[{x:7,y:4,kind:'bush'}];state.page='battle';render();centerCam(6,5);
  window.__dragon=u;window.__target=t;window.__hits=0;window.__hp=t.hp;window.__floor=document.getElementById('board-floor');
  if(dragonBreath(u,u,{range:3}))throw Error('zero direction accepted');
  if(dragonBreath(u,t,{range:0}))throw Error('zero range accepted');
  if(!dragonBreath(u,t,{range:3,onImpact:tiles=>{window.__hits++;if(!tiles.some(q=>q.x===t.x&&q.y===t.y))throw Error('target outside cone');hurt(t,1,'火焰',u);tiles.forEach(q=>groundReact(q.x,q.y,'火焰'));}}))throw Error('breath rejected');
  if(dragonBreath(u,t,{range:3}))throw Error('busy duplicate accepted');
 });
 await p.waitForTimeout(850);assert.equal(await p.evaluate(()=>window.__hits),0);assert.equal(await p.evaluate(()=>window.__target.hp),await p.evaluate(()=>window.__hp));assert.equal(await p.evaluate(()=>!!groundAt(7,4)),false);
 assert(await p.locator('.dragon-breath path').count()>0);assert.equal(await p.locator('.dragon .act-breath .dragon-jaw').count(),1);
 await p.screenshot({path:shots+'/breath.png'});
 await p.waitForFunction(()=>window.__hits===1&&!B().busy);assert.equal(await p.evaluate(()=>window.__hits),1);assert(await p.evaluate(()=>window.__target.hp<window.__hp));assert.equal(await p.evaluate(()=>groundAt(7,4)?.kind),'fire');assert.equal(await p.evaluate(()=>window.__floor===document.getElementById('board-floor')),true);
 await p.screenshot({path:shots+'/impact.png'});
 await p.evaluate(()=>{
  B().info=window.__dragon.id;refreshBattle();if(!document.querySelector('.foe-view [data-monster=dragon]'))throw Error('shared status card missing dragon');B().info=null;window.__target.x=1;window.__cancelHits=0;dragonBreath(window.__dragon,window.__target,{range:3,onImpact:()=>window.__cancelHits++});if(window.__dragon.face!==-1||B().fx.at(-1).face!==-1)throw Error('left facing breath');B().flowEpoch++;B().busy=false;window.__dragon.anim=null;refreshBattle();
 });await p.waitForTimeout(1650);assert.equal(await p.evaluate(()=>window.__cancelHits),0);
 await p.evaluate(()=>{
  const base={x:0,y:0,w:148,face:1},captain=MONSTER_LOOK.orc_captain,dragon=MONSTER_LOOK.dragon;
  const cards=[['獨眼隊長',{...base,look:captain,main:'sword',off:'shield',armor:'皮甲'}],['隊長受傷',{...base,look:{...captain,head:captain.headHurt},main:'sword',off:'shield',armor:'皮甲'}],['小龍',{...base,look:dragon}],['張嘴吐息',{...base,look:dragon,anim:{k:'breath',el:900}}],['小龍受傷',{...base,look:dragon,anim:{k:'hurt',el:250}}],['小龍倒下',{...base,look:dragon,down:true,w:80,x:20,y:25}]];
  document.getElementById('app').innerHTML=`<section class="monster-preview"><h1>獨眼隊長與小龍</h1><p>簡單上色・粗框線・外觀暫定</p><div>${cards.map(([title,o])=>`<figure>${dollSVG(o)}<figcaption>${title}</figcaption></figure>`).join('')}</div><footer>${captain.face}${dragon.face}</footer></section>`;
  const s=document.createElement('style');s.textContent='.monster-preview{padding:16px;background:#24212a;min-height:844px;color:#f7ead5;font-family:sans-serif}.monster-preview h1{font-size:24px;margin:0}.monster-preview p{font-size:13px;margin:8px 0 16px}.monster-preview>div{display:grid;grid-template-columns:1fr 1fr;gap:12px}.monster-preview figure{margin:0;background:#38313e;border:2px solid #6c5c66;border-radius:14px;text-align:center;padding:8px 0}.monster-preview figure>svg{height:156px}.monster-preview figcaption{font-size:13px}.monster-preview footer{display:flex;justify-content:center;gap:24px;margin-top:12px}.monster-preview footer svg{width:76px;height:76px}';document.head.append(s);
 });await p.waitForTimeout(150);await p.screenshot({path:shots+'/preview.png'});
 assert.deepEqual(errors,[]);console.log('✓ 隊長三視圖同眼眼罩、共用裝備；小龍左右／倒下SVG；吐息抵達前零傷害／零燃燒、抵達一次命中／原地面反應、重複與舊回合取消、手機截圖');
}finally{await browser.close();}
