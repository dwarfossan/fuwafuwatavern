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
  return out;});
 assert(r.singles&&r.packs);ok('商店照賣單項，七種套組也都有');
 assert(r.rope&&r.descOk);ok('套組視同帶著內容物（探險者有繩索、火把；地城探險者才有鐵撬），說明寫清楚');
 assert(r.bag);ok('有背包的套組能放背包欄（外交官套組沒有背包）');
 assert.deepEqual(r.noPouch,[false,false,false,false]);assert.deepEqual(r.withPouch,[true,true,true,true]);assert(r.bowStill);ok('投石索、吹箭筒、火槍、手槍靠彈袋；弓照舊靠箭袋');
 assert.deepEqual(r.gun,[['1d12 穿刺',500,10,'彈藥 40/120|裝填|雙手','緩速 Slow','crossbow'],['1d10 穿刺',250,3,'彈藥 30/90|裝填','困擾 Vex','crossbow']]);ok('火槍、手槍照 SRD 5.2，技能先借弩類');
 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
