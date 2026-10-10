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
  // 資料：範圍招不再寫「範圍多 1 圈」
  out.noRange = SKILL_GROUPS.flatMap(g=>g.skills).every(s=>!/範圍往外多/.test(s.up||''));
  // 擺位：嬌嬌旁邊一隻哥布林
  const u=U('tiger'), f=foes[0]; reset(); f.x=u.x+1; f.y=u.y; foes.slice(1).forEach((g,i)=>{g.x=u.x+5+i; g.y=u.y+5;});
  hitAll();
  // 破甲 升 2 階：AC −2，撐 3 輪
  b.up=2; impl('sunder').run(u,f); const ac=f.statuses.find(s=>s.k==='acDown');
  out.sunder={n:ac.n||0,left:ac.left}; expire('end',u.id); expire('end',u.id); out.sunderAfter2=!!has(f,'acDown'); expire('end',u.id); out.sunderAfter3=!!has(f,'acDown');
  // 扎腿 升 1 階：撐 2 輪
  reset(); b.up=1; impl('hamstring').run(U('raccoon'),f); out.ham=f.statuses.find(s=>s.k==='slowed')?.left;
  // 10-10 震暈、撞倒、震地、箭雨、擊退刪了（舊技能整理）
  // 10-09 守護改成戰士風格被動，改由 tests/guard.mjs 驗
  b.up=0; return out;
 });
 assert(r.noRange);ok('資料：沒有「範圍多 1 圈」');
 assert.equal(r.sunder.n,0);assert.equal(r.sunder.left,2);assert(r.sunderAfter2);assert(!r.sunderAfter3);ok('破甲升 2 階：AC −2、撐 3 輪');
 assert.equal(r.ham,1);ok('扎腿升 1 階：多 1 輪');
 const rest=await pg.evaluate(()=>{const b=B();const u=b.units.find(v=>v.id==='fox');u.level=5;u.slots=slotMax(u).map(()=>0);u.slots[1]=1;
   const was=b.result;b.result='win';takeRest('short');const a=JSON.stringify(state.proficiency.fox);
   u.learned=[{key:'x',name:'測試'}];eraseNote(u,'x');syncLearnedState();const e=JSON.stringify(state.proficiency.fox);b.result=was;return {a,e};});
 assert.equal(rest.a,'[2,3,1]');assert.equal(rest.e,'[2,3,1]');ok('休息、擦筆記後熟練格照實保存（10-03 修：以前會變 undefined）');
 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
