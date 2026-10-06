// 套組、彈袋、火槍（大爺 10-03）：套組視同帶著內容物、有背包的能放背包欄；投石索／吹箭筒／火槍／手槍靠彈袋；商店照賣單項
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=n=>console.log('✓ '+n);
try{
 const pg=await br.newPage({viewport:{width:390,height:844}});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg.waitForFunction(()=>B()&&B().units.length,null,{timeout:60000});
 const r=await pg.evaluate(()=>{
  const I=n=>ITEMS.find(i=>i.n===n), out={};
  const shop=ITEMS.filter(i=>i.cat==='冒險用品'&&!i.noShop).map(i=>i.n);
  out.singles=['背包','睡袋','繩索（50 呎）','火把','口糧（1 天）','水袋','火絨盒','箭袋','矢匣','彈袋','醫療包','材料包'].every(n=>shop.includes(n));
  out.packs=['探險者套組','地城探險者套組','竊賊套組','外交官套組','藝人套組','祭司套組','學者套組'].every(n=>shop.includes(n));
  const ex=[I('探險者套組')];
  out.rope=hasGear(ex,'繩索（50 呎）')&&hasGear(ex,'火把')&&!hasGear(ex,'鐵撬')&&hasGear([I('地城探險者套組')],'鐵撬')&&hasGear([I('繩索（50 呎）')],'繩索（50 呎）');
  out.bag=isBag(I('探險者套組'))&&!isBag(I('外交官套組'))&&bestBag([I('外交官套組'),I('探險者套組')])===I('探險者套組');
  out.descOk=/內含：背包、睡袋/.test(I('探險者套組').desc);
  const u=B().units.find(v=>v.side==='pc'); u.backpack=[]; syncBattleBag(u);
  const shoot=n=>{u.weapon=I(n); return hasAmmoFor(u);};
  out.noPouch=['投石索','吹箭筒','火槍','手槍'].map(shoot);
  u.backpack=[I('彈袋')]; syncBattleBag(u); out.withPouch=['投石索','吹箭筒','火槍','手槍'].map(shoot);
  out.bowStill=(u.backpack=[I('箭袋')],syncBattleBag(u),shoot('長弓'));
  out.gun=[I('火槍'),I('手槍')].map(w=>[w.dmg,w.cost/GP,w.wt,w.props.join('|'),w.mastery,groupOf(w).id]);
  // 開槍：動作換 fire、子彈、槍口白煙（10-03）
  const b=B(), f=b.units.find(v=>v.side==='foe'&&!v.dead&&!foeHid(v)); u.weapon=I('火槍'); u.backpack=[I('彈袋')]; syncBattleBag(u);
  const sk=unitSkills(u)[0]; out.fireAnim=skillAnim(u,sk,f); const n=(b.fx||[]).length; launch(u,f,'fire'); out.bullet=b.proj.slice(-1)[0].kind; out.smoke=(b.fx||[]).slice(n).some(x=>x.kind==='smoke');
  out.skills=unitSkills(u).map(s=>s.key)[0]; out.art=[iconSVG('firearm',20).length>200, iconSVG('pistol',20).length>200, dollGear({weapon:I('手槍')}).main];
  return out;});
 assert(r.singles&&r.packs);ok('商店照賣單項，七種套組也都有');
 assert(r.rope&&r.descOk);ok('套組視同帶著內容物（探險者有繩索、火把；地城探險者才有鐵撬），說明寫清楚');
 assert(r.bag);ok('有背包的套組能放背包欄（外交官套組沒有背包）');
 assert.deepEqual(r.noPouch,[false,false,false,false]);assert.deepEqual(r.withPouch,[true,true,true,true]);assert(r.bowStill);ok('投石索、吹箭筒、火槍、手槍靠彈袋；弓照舊靠箭袋');
 assert.deepEqual(r.gun,[['1d12 穿刺',500,10,'彈藥 40/120|裝填|雙手','緩速 Slow','firearm'],['1d10 穿刺',250,3,'彈藥 30/90|裝填','困擾 Vex','firearm']]);ok('火槍、手槍照 SRD 5.2，火槍類');
 assert.equal(r.fireAnim,'fire');assert.equal(r.bullet,'bullet');assert(r.smoke);assert.equal(r.skills,'firearm_0');assert.deepEqual(r.art,[true,true,'pistol']);ok('開槍：動作、子彈、槍口白煙；火槍、手槍有自己的圖');
 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
