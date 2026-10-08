// 抗性／免疫：傷害面板、實際扣血與專注皆使用結算後傷害。
import {chromium} from 'playwright';
import {bootReady} from './boot.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(page);
 const result=await page.evaluate(()=>{
  const b=B(),u=b.units.find(u=>u.side==='pc');
  b.units.filter(u=>u.side==='foe').forEach(u=>u.dead=true);b.busy=false;b.exploreStopped=false;
  const f=b.def.foes[0],e=ENEMIES[f.type];
  const defaultEmpty=b.units.filter(u=>u.side==='foe').every(u=>!u.resistances.length&&!u.damageImmunities.length);
  const amounts=[];
  u.hp=u.maxHp=100;u.resistances=['火焰','火焰'];u.damageImmunities=[];
  for(const [n,type] of [[7,'火焰'],[7,'穿刺'],[1,'火焰']]){const before=u.hp;hurt(u,n,type,null);amounts.push(before-u.hp);}
  u.damageImmunities=['火焰'];startConc(u,'bless','祝福');
  panelStart('抗性驗收');panelRow('atk',u,[20],20,20,'hit',u);b._pend=[{sides:6,v:6}];
  const before=u.hp;hurt(u,99,'火焰',null);
  const immune={hp:u.hp===before,conc:!!concOf(u),dmg:b.panel.rows.at(-1).dmg,faces:b.panel.rows.at(-1).faces};
  b.panel=null;u.resistances=['穿刺'];u.damageImmunities=[];
  const split=[damageAfterResistance(u,7,'穿刺'),damageAfterResistance(u,7,'揮砍')];
  // 資料載入與覆寫只用 fixture，還原後不改既有敵人。
  e.resistances=['火焰'];e.damageImmunities=['寒冷'];f.resistances=[];
  startBattle(b.id,false,'explore');const loaded=B().units.find(v=>v.id==='foe0');
  const copied=[loaded.resistances,loaded.damageImmunities];delete e.resistances;delete e.damageImmunities;delete f.resistances;
  startBattle(b.id,false,'explore');B().units.filter(v=>v.side==='foe').forEach(v=>v.dead=true);B().busy=false;B().info=null;B().panel=null;beginExplore();const p=exploreUnit();p.hp=p.maxHp=30;p.resistances=['火焰'];hurt(p,7,'火焰',null);p.damageImmunities=['火焰'];hurt(p,7,'火焰',null);refreshBattle();
  return {defaultEmpty,amounts,immune,split,copied};
 });
 assert(result.defaultEmpty);assert.deepEqual(result.amounts,[3,7,0]);
 assert(result.immune.hp&&result.immune.conc);assert.equal(result.immune.dmg,0);assert.deepEqual(result.immune.faces,[{sides:6,v:6}]);
 assert.deepEqual(result.split,[3,7]);assert.deepEqual(result.copied,[[],['寒冷']]);
 // 實際觸控頭像切換個體，檢查既有三行紀錄顯示減傷原因。
 await page.locator('[data-explore-unit="fox"]').tap();
 assert.equal(await page.evaluate(()=>B().exploreSolo),'fox');
 assert.match(await page.locator('#logOpen').innerText(),/抗性：7 → 3/);
 assert.match(await page.locator('#logOpen').innerText(),/免疫：7 → 0/);
 if(process.env.REVIEW_SHOT)await page.screenshot({path:process.env.REVIEW_SHOT});
 assert.deepEqual(errors,[]);
 console.log('✓ 抗性不疊加、奇數取整、免疫優先、原始物理類型、面板與專注、資料覆寫、390×844 觸控紀錄');
} finally {await browser.close();}
