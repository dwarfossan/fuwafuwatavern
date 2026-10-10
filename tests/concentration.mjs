// 專注、狩印、商隊報酬道具（10-03）：專注同時一個、受傷豁免、倒下中斷；狩印打中多傷害、目標倒下免費改標；點心＝短休；次元背包負重 2 倍
import {chromium} from 'playwright';
import {bootReady} from './boot.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=n=>console.log('✓ '+n);
try{
 const pg=await br.newPage({viewport:{width:390,height:844}});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');await bootReady(pg);
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg.waitForFunction(()=>cur()&&cur().side==='pc'&&!cur().down&&!cur().dead&&!B().busy,null,{timeout:60000});
 const r=await pg.evaluate(()=>{
  const b=B(), u=cur(), out={};
  if(u.down||u.dead)throw Error("專注驗收必須由清醒施法者開始");
  b.units.filter(v=>v.side==='pc').forEach(v=>{v.statuses=[];});
  u.weapon=ITEMS.find(i=>i.n==='非凡長弓'); u.level=1; u.slots=slotMax(u).slice();
  const f=b.units.find(v=>v.side==='foe'&&!v.dead&&!foeHid(v)); f.hp=f.maxHp=200;
  const hm=unitSkills(u).find(s=>s.key==='hunters_mark');
  out.has=!!hm; out.free=hm.def.free;
  const s0=slotsOf(u)[0]; doSkill(u,hm,f); out.spent=s0-slotsOf(u)[0]; out.freeUsed=b.freeUsed; out.action=!!b.actionUsed;
  out.conc=(concOf(u)||{}).key; out.marked=f.statuses.some(s=>s.k==='marked'&&s.src===u.id);
  // 打中：用 attackRoll 結果打一發
  let extra=0; for(let i=0;i<30 && !extra;i++){ const n0=b.log.length; const r=attackRoll(u,f,{bonus:50,ranged:true}); if(r.hit){ hurt(f,1,'穿刺',u); extra=b.log.slice(n0).some(l=>l.t.includes('狩印追加'))?1:0; } b.markHit=null; }
  out.extra=extra;
  // 目標倒下 → 免費改標
  f.hp=1; hurt(f,5,'穿刺',null); const g=b.units.find(v=>v.side==='foe'&&!v.dead&&!foeHid(v)&&v!==f);
  u.slots=slotsOf(u).map(()=>0); out.remark=remarkFree(u,hm)&&skillReady(u,hm);
  // 專注：受傷豁免、倒下中斷、換專注
  u.hp=u.maxHp=500; out.dcLog=null; const n1=b.log.length; hurt(u,40,'穿刺',g); out.dcLog=b.log.slice(n1).some(l=>/體質豁免.*DC 20/.test(l.t));
  const fox=b.units.find(v=>v.side==='pc'&&v!==u); fox.statuses=[];
  learnedSkillByKey('bless').impl.run(fox); out.blessed=b.units.filter(v=>has(v,'blessed')).length>0; out.foxConc=(concOf(fox)||{}).key;
  if(g){ SKILL_IMPL.hunter[0].run(fox,g); } out.swap=(concOf(fox)||{}).key==='hunters_mark' && !b.units.some(v=>has(v,'blessed'));
  fox.hp=1; hurt(fox,9,'穿刺',null); out.downEnds=!concOf(fox) && !b.units.some(v=>v.statuses.some(s=>s.k==='marked'&&s.src===fox.id));
  // 點心
  u.slots=slotMax(u).map(()=>0); snackRest(u); out.snack=slotsOf(u).every((n,i)=>n===Math.ceil(slotMax(u)[i]/2));
  // 次元背包
  const id=u.id; state.inv[id]=[]; const c0=capOf(id); state.inv[id].push(ITEMS.find(i=>i.n==='次元背包').id); out.cap=capOf(id)/c0;
  out.shop=ITEMS.filter(i=>['非凡長弓','次元背包','點心'].includes(i.n)).every(i=>i.noShop);
  return out;});
 assert(r.has&&r.free);assert.equal(r.spent,1);assert(r.freeUsed&&!r.action);ok('非凡長弓給狩印：一階、免費動作');
 assert.equal(r.conc,'hunters_mark');assert(r.marked);assert.equal(r.extra,1);ok('狩印：專注、標記，打中多一段力場傷害');
 assert(r.remark);ok('標記的目標倒下：沒格子也能免費改標');
 assert(r.dcLog);ok('專注：受 40 傷害要過體質豁免 DC 20');
 assert(r.blessed&&r.foxConc==='bless');assert(r.swap);ok('祝福術是專注；改專注狩印，祝福消失');
 assert(r.downEnds);ok('倒下：專注中斷，印記消失');
 assert(r.snack);ok('點心：熟練格每階回一半');
 assert.equal(r.cap,2);assert(r.shop);ok('次元背包負重 2 倍；三樣報酬商店不賣');
 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
