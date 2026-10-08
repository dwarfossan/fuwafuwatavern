// 升階效果（熟練格規格第八節，大爺 10-02 做）：只有多傷害、多目標、多持續時間；範圍招範圍固定
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
 await pg.waitForFunction(()=>B()&&B().units.length,null,{timeout:60000});
 const r=await pg.evaluate(()=>{
  endTurn=()=>{}; nextTurn=()=>{};
  const b=B(), U=id=>b.units.find(v=>v.id===id), foes=b.units.filter(v=>v.side==='foe');
  const def=key=>SKILL_GROUPS.flatMap(g=>g.skills).find(s=>s.id===key);
  const impl=key=>{ for(const g of SKILL_GROUPS){ const i=g.skills.findIndex(s=>s.id===key); if(i>=0) return SKILL_IMPL[g.id][i]; } };
  const hitAll=()=>{ window.__atk=attackRoll; attackRoll=()=>({hit:true,crit:false}); window.__wa=weaponAttack; };
  const reset=()=>{ foes.forEach(f=>{f.statuses=[];f.hp=99;f.maxHp=99;f.dead=false;f.down=false;}); b.units.filter(v=>v.side==='pc').forEach(p=>{p.statuses=[];p.hp=99;p.down=false;}); };
  const out={};
  // 資料：範圍招不再寫「範圍多 1 圈」；撞倒、擊退、閃身刺改成預設的多武器骰
  out.noRange = SKILL_GROUPS.flatMap(g=>g.skills).every(s=>!/範圍往外多/.test(s.up||''));
  out.defaults = ['topple','knockback','dash_stab'].every(k=>!def(k).up);
  // 擺位：嬌嬌旁邊一隻哥布林
  const u=U('tiger'), f=foes[0]; reset(); f.x=u.x+1; f.y=u.y; foes.slice(1).forEach((g,i)=>{g.x=u.x+5+i; g.y=u.y+5;});
  hitAll();
  // 破甲 升 2 階：AC −2，撐 3 輪
  b.up=2; impl('sunder').run(u,f); const ac=f.statuses.find(s=>s.k==='acDown');
  out.sunder={n:ac.n||0,left:ac.left}; expire('end',u.id); expire('end',u.id); out.sunderAfter2=!!has(f,'acDown'); expire('end',u.id); out.sunderAfter3=!!has(f,'acDown');
  // 扎腿 升 1 階：撐 2 輪
  reset(); b.up=1; impl('hamstring').run(U('raccoon'),f); out.ham=f.statuses.find(s=>s.k==='slowed')?.left;
  // 震暈：豁免難度不變、升 1 階撐 2 輪
  reset(); let dcSeen=null; const sr=saveRoll; saveRoll=(t,st,dc)=>{dcSeen=dc;return false;}; b.up=1; impl('daze').run(u,f);
  out.daze={dc:dcSeen===dcOf(u,'STR'), left:f.statuses.find(s=>s.k==='dazed')?.left};
  // 撞倒：豁免難度不變
  reset(); dcSeen=null; b.up=2; impl('topple').run(u,f); out.toppleDC=dcSeen===dcOf(u,weaponStat(u));
  // 震地 升 2 階：範圍還是 1 圈；豁免失敗的受 2 顆武器骰
  reset(); const far=foes[1]; far.x=u.x+2; far.y=u.y; let rolls=0; const dr=dmgRoll; dmgRoll=(...a)=>{rolls++;return dr(...a);};
  b.up=2; impl('quake').run(u); out.quake={near:!!has(f,'prone'), far:!!has(far,'prone'), rolls, hurt:f.hp<99};
  // 箭雨 升 1 階：半徑 1；失敗的受 2 顆武器骰
  reset(); const w=U('wolf'); rolls=0; far.x=f.x+2; far.y=f.y; b.up=1; impl('arrow_rain').run(w,{x:f.x,y:f.y}); out.rain={rolls, far:far.hp<99, near:f.hp<99};
  dmgRoll=dr; saveRoll=sr;
  // 擊退 升 2 階：只推 1 格
  reset(); const ox=f.x; b.up=2; impl('knockback').run(u,f); out.push=Math.abs(f.x-ox)+Math.abs(f.y-(u.y));
  // 守護：所有貼身隊友；升 1 階撐 2 輪，每輪擋一次
  reset(); attackRoll=window.__atk; b.up=1; const g=U('tiger'), a1=U('fox'), a2=U('wolf');
  a1.x=g.x; a1.y=g.y+1; a2.x=g.x; a2.y=g.y-1; f.x=a1.x+1; f.y=a1.y;
  impl('shield_guard').run(g); out.guard={both:!!hasVia(a1,'dodge','guard') && !!hasVia(a2,'dodge','guard'), left:hasVia(a1,'dodge','guard')?.left};
  attackRoll(f,a1,{}); out.guard.afterHit=!!hasVia(a1,'dodge','guard') && hasVia(a1,'dodge','guard').spent===true;
  expire('start',g.id); out.guard.round2=!!hasVia(a1,'dodge','guard') && !hasVia(a1,'dodge','guard').spent;
  attackRoll(f,a1,{}); expire('start',g.id); out.guard.gone=!hasVia(a1,'dodge','guard');
  out.guardDef={name:def('shield_guard').name, tier:def('shield_guard').tier, free:!!def('shield_guard').free};
  b.up=0; return out;
 });
 assert(r.noRange);assert(r.defaults);ok('資料：沒有「範圍多 1 圈」；撞倒、擊退、閃身刺＝多武器骰');
 assert.equal(r.sunder.n,0);assert.equal(r.sunder.left,2);assert(r.sunderAfter2);assert(!r.sunderAfter3);ok('破甲升 2 階：AC −2、撐 3 輪');
 assert.equal(r.ham,1);ok('扎腿升 1 階：多 1 輪');
 assert(r.daze.dc);assert.equal(r.daze.left,1);ok('震暈：豁免難度不變、升 1 階多 1 輪');
 assert(r.toppleDC);ok('撞倒：豁免難度不變（升階改成多武器骰）');
 assert(r.quake.near);assert(!r.quake.far);assert.equal(r.quake.rolls,2);assert(r.quake.hurt);ok('震地升 2 階：範圍還是 1 圈、倒地的多受 2 顆武器骰');
 assert.equal(r.rain.rolls,2);assert(!r.rain.far);assert(r.rain.near);ok('箭雨升 1 階：範圍不變、失敗的受 2 顆武器骰');
 assert.equal(r.push,1);ok('擊退升 2 階：還是推 1 格');
 assert(r.guard.both);assert.equal(r.guard.left,1);assert(r.guard.afterHit);assert(r.guard.round2);assert(r.guard.gone);
 assert.deepEqual(r.guardDef,{name:'守護',tier:1,free:true});ok('守護：一階、免費動作、所有貼身隊友；升 1 階撐 2 輪、每輪擋一次');
 const rest=await pg.evaluate(()=>{const b=B();const u=b.units.find(v=>v.id==='fox');u.level=5;u.slots=slotMax(u).map(()=>0);u.slots[1]=1;
   const was=b.result;b.result='win';takeRest('short');const a=JSON.stringify(state.proficiency.fox);
   u.learned=[{key:'x',name:'測試'}];eraseNote(u,'x');syncLearnedState();const e=JSON.stringify(state.proficiency.fox);b.result=was;return {a,e};});
 assert.equal(rest.a,'[2,3,1]');assert.equal(rest.e,'[2,3,1]');ok('休息、擦筆記後熟練格照實保存（10-03 修：以前會變 undefined）');
 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
