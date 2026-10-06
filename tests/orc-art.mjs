// 歐克只新增外觀；使用現有裝備、動作、狀態卡與战場分層。
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
const shots=process.env.ORC_SHOTS||'/tmp/orc-review';await fs.mkdir(shots,{recursive:true});
const browser=await chromium.launch();
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.abort());
 await p.goto('file://'+path.resolve('index.html')+'#town');
 await p.waitForFunction(()=>typeof B==='function'&&!document.body.classList.contains('image-boot'));
 const result=await p.evaluate(()=>{
  const parse=s=>{const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('invalid SVG');return d;};
  for(const s of [MONSTER_LOOK.orc.face,MONSTER_LOOK.orc.head,MONSTER_LOOK.orc.headHurt])parse(s);
  if(MONSTER_LOOK.orc.head===MONSTER_LOOK.goblin.head||MONSTER_LOOK.orc.headHurt===MONSTER_LOOK.orc.head)throw Error('missing distinct body/hurt');
  window.nextTurn=()=>{};startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.tut=-1;b.turn=0;b.round=1;b.moveLeft=6;b.actionUsed=false;b.freeUsed=0;
  const u=b.units.find(v=>v.side==='foe');u.look='orc';u.name='歐克（外觀測試）';u.weapon=ITEMS.find(i=>i.n==='長劍');u.armor=ITEMS.find(i=>i.n==='皮甲');u.shield=true;u.statuses=[];u.x=4;u.y=4;
  for(const v of b.units)if(v!==u&&v.side==='foe')v.fled=true;
  state.page='battle';render();centerCam(4,5);
  const floor=document.getElementById('board-floor');
  const gear=dollGear(u),normal=parse(unitDoll(u,false));
  if(!normal.querySelector('[data-monster="orc"]')||!normal.querySelector('.dl-arm path')||!normal.querySelector('.dl-gear-body path'))throw Error('missing shared gear');
  for(const k of ['slash','smash','shoot','hurt']){u.anim={k,t:Date.now()};refreshBattle();const d=document.querySelector(`.token[data-moving-unit="${u.id}"] .act-${k}`);if(!d)throw Error('missing '+k);}
  u.anim=null;b.phase='explore';u.exploreWalking=true;if(!parse(unitDoll(u,false)).querySelector('.act-walk'))throw Error('missing walk');u.exploreWalking=false;b.phase='combat';
  u.hp=0;u.down=true;if(!parse(unitDoll(u,false)).querySelector('.dl-down [data-monster="orc"]'))throw Error('missing down');u.hp=u.maxHp;u.down=false;
  u.statuses=[{k:'prone',dur:2}];if(!parse(unitDoll(u,false)).querySelector('.dl-prone'))throw Error('missing prone');u.statuses=[];refreshBattle();
  if(document.getElementById('board-floor')!==floor)throw Error('floor recreated');
  window.__orc=u;
  // 每件现有护甲用相同锚点；武器直接来自 ITEM_RAW。
  let armors=0;for(const it of ITEMS.filter(i=>i.type==='armor')){parse(dollSVG({look:MONSTER_LOOK.orc,armor:it.base||it.n,x:0,y:0,w:140}));armors++;}
  return {main:gear.main,off:gear.off,armors};
 });
 assert.equal(result.main,'sword');assert.equal(result.off,'shield');assert(result.armors>=12);
 await p.waitForTimeout(700);await p.screenshot({path:shots+'/battle.png'});
 await p.evaluate(()=>{
  const base={look:MONSTER_LOOK.orc,x:0,y:0,w:145};
  const gear=name=>equipmentArtKey(ITEMS.find(i=>i.n===name));
  const cards=[['歐克本體',{...base}],['長劍＋盾／皮甲',{...base,main:gear('長劍'),off:'shield',armor:'皮甲'}],['巨劍／鏈甲',{...base,main:gear('巨劍'),armor:'鏈甲'}],['短弓／皮甲',{...base,main:gear('短弓'),armor:'皮甲'}],['受傷',{...base,main:gear('長劍'),armor:'皮甲',anim:{k:'hurt',el:250}}],['倒下',{...base,main:gear('長劍'),armor:'皮甲',down:true,w:100,y:25}]];
  document.getElementById('app').innerHTML=`<section class="orc-preview"><h1>歐克外觀測試</h1><p>裝備使用現有 SVG · 外觀暫定</p><div>${cards.map(([title,o])=>`<figure>${dollSVG(o)}<figcaption>${title}</figcaption></figure>`).join('')}</div><footer>正面頭像 ${MONSTER_LOOK.orc.face}</footer></section>`;
  const s=document.createElement('style');s.textContent='.orc-preview{padding:16px;background:#24212a;min-height:844px;color:#f7ead5;font-family:sans-serif}.orc-preview h1{font-size:24px;margin:0}.orc-preview p{font-size:13px;margin:8px 0 16px}.orc-preview>div{display:grid;grid-template-columns:1fr 1fr;gap:12px}.orc-preview figure{margin:0;background:#38313e;border:2px solid #6c5c66;border-radius:14px;text-align:center;padding:8px 0}.orc-preview figure>svg{height:156px}.orc-preview figcaption{font-size:13px}.orc-preview footer{display:flex;align-items:center;gap:20px;margin-top:12px}.orc-preview footer svg{width:76px;height:76px}';document.head.append(s);
 });
 await p.screenshot({path:shots+'/preview.png'});
 assert.deepEqual(errors,[]);console.log('✓ 歐克正面／側臉／受傷SVG，現有長劍盾與全部護甲，戰場攻擊／受傷／倒下與分層；390×844截圖');
}finally{await browser.close();}
