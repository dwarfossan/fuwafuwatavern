// 壓力第一批（大爺 10-10）：加減、50 換臉、100 失控（紅光＋晃動、AI 接手、不打隊友）、回神豁免、戰鬥結束、休息、回酒館、存檔快照
import {chromium} from 'playwright';
import {bootReady,noLuck} from './boot.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const shots=process.env.STRESS_SHOTS||'';
const br=await chromium.launch();
const ok=n=>console.log('✓ '+n);
try{
 const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');await bootReady(pg);
 await pg.evaluate(()=>{state.stress={fox:0,tiger:0,wolf:0,raccoon:0};startBattle("ambush");});
 await noLuck(pg);
 await pg.waitForFunction(()=>cur()&&cur().side==='pc'&&!B().busy,null,{timeout:60000});
 await pg.evaluate(()=>{ endTurn=()=>{}; nextTurn=()=>{}; B().tut=-1; });

 // 事件加減
 const r=await pg.evaluate(()=>{
  const b=B(),U=id=>b.units.find(v=>v.id===id),pcs=b.units.filter(v=>v.side==='pc'),foe=b.units.find(v=>v.side==='foe'&&!v.dead);
  pcs.forEach(p=>{p.statuses=[];p.hp=p.maxHp=99;p.down=false;setStress(p,0);});
  const out={};
  // 被爆擊 +5（強制 d20=20）
  const rnd=Math.random;Math.random=()=>.999;attackRoll(foe,U('tiger'),{bonus:0});Math.random=rnd;
  out.crit=U('tiger').stress;
  // 昏迷：自己 +15、清醒的隊友各 +10
  pcs.forEach(p=>setStress(p,0));U('wolf').hp=1;hurt(U('wolf'),5,'穿刺',foe);
  out.down=pcs.map(p=>[p.id,p.stress]);U('wolf').down=false;U('wolf').hp=99;
  // 打倒／爆擊減壓：每場最多 −10
  setStress(U('fox'),50);for(let i=0;i<5;i++)stressRelief(U('fox'),'測試');out.relief=U('fox').stress;
  // 50 換臉
  setStress(U('raccoon'),49);out.mood49=U('raccoon').svgMood||'normal';setStress(U('raccoon'),50);out.mood50=U('raccoon').svgMood;
  out.state=state.stress.raccoon;
  out.snapKey=SNAP_KEYS.includes('stress');
  return out;});
 assert.equal(r.crit,5);ok('被爆擊 +5');
 assert.deepEqual(Object.fromEntries(r.down),{fox:10,tiger:10,wolf:15,raccoon:10});ok('昏迷：自己 +15、看到的隊友各 +10');
 assert.equal(r.relief,40);ok('爆擊／打倒敵人減壓每場最多 −10');
 assert.equal(r.mood49,'normal');assert.equal(r.mood50,'stressed');assert.equal(r.state,50);ok('壓力 50 換壓力臉，數值存在 state.stress');
 assert(r.snapKey);ok('重新挑戰的快照包含壓力');

 // 畫面：50 的臉出現在頭像列
 await pg.evaluate(()=>refreshBattle());
 assert(await pg.locator('.ord [data-critter="raccoon"] [data-expression="stressed"]').count()>=1);ok('頭像列換成壓力臉');

 // 失控：到 100 → 紅光、晃動、嬌嬌額頭「王」、玩家不能操作
 const f=await pg.evaluate(()=>{
  const b=B(),t=b.units.find(v=>v.id==='tiger');setStress(t,95);addStress(t,5,'測試');refreshBattle();
  const turnWas=b.turn;b.turn=b.units.indexOf(t);refreshBattle();
  const out={frenzy:!!t.frenzy,mood:t.svgMood,controlled:playerControlled(t),
   ord:!!document.querySelector('.ord.frenzy'),shake:!!document.querySelector('.token[data-moving-unit="tiger"] .frenzy-shake'),
   glow:!!document.querySelector('.token[data-moving-unit="tiger"] .frenzy-glow'),
   king:[...document.querySelectorAll('.ord.frenzy [data-critter="tiger"] path')].some(p=>(p.getAttribute('d')||'').startsWith('M41 25H59')),
   dock:!!document.querySelector('.bt-dock .mn-b'),hud:document.querySelector('.bt-hud b')?.textContent||''};
  battleCmd('move');out.menu=b.menu;b.turn=turnWas;return out;});
 assert(f.frenzy);assert.equal(f.mood,'frenzy');assert.equal(f.controlled,false);ok('壓力 100 失控，玩家不能操作');
 assert(f.ord&&f.shake&&f.glow);ok('頭像列紅光、棋子晃動與紅底圈');
 assert(f.king);ok('嬌嬌失控額頭變「王」');
 assert(!f.dock);assert.match(f.hud,/失控中/);assert.notEqual(f.menu,'move');ok('失控時沒有指令列、標題寫失控中、指令不收');
 if(shots){await pg.waitForTimeout(700);await pg.screenshot({path:shots+'/frenzy.png'});}

 // AI 接手：失控的嬌嬌自己行動、只打敵人、不打隊友
 const ai=await pg.evaluate(async()=>{
  const b=B(),t=b.units.find(v=>v.id==='tiger'),pcs=b.units.filter(v=>v.side==='pc'&&v!==t);
  const e=b.units.filter(v=>v.side==='foe'&&!v.dead&&!foeHid(v))[0];e.hp=e.maxHp=99;
  const free=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).find(p=>!unitAt(p.x,p.y)&&!blocked(p.x,p.y));
  t.x=free.x;t.y=free.y;const hp0=pcs.map(p=>p.hp),foes=b.units.filter(v=>v.side==='foe'),fhp=foes.map(v=>v.hp+(v.dead?0:0));
  let ended=false;endTurn=()=>{ended=true;};
  const n0=b.log.length;b.turn=b.units.indexOf(t);beginTurn(t);b.busy=false;const rnd=Math.random;Math.random=()=>.95;aiTurn(t);
  for(let i=0;i<60&&!ended;i++)await new Promise(r=>setTimeout(r,100));
  Math.random=rnd;
  return {ended,foeHurt:foes.some((v,i)=>v.hp<fhp[i])||b.log.slice(n0).some(l=>/^嬌嬌(使用|推|擒抱|繳械)/.test(l.t)),alliesSame:pcs.every((p,i)=>p.hp===hp0[i])};});
assert(ai.ended);assert(ai.foeHurt);assert(ai.alliesSame);ok('失控由 AI 接手：對敵人出手、不打隊友，回合自己結束');

 // 第二批：四招失控技能（直接驗規則，不重開瀏覽器）
 const sk2=await pg.evaluate(async()=>{
  const b=B(),U=id=>b.units.find(v=>v.id===id),out={};
  const wait=async()=>{for(let i=0;i<60&&b.busy;i++)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,300));};
  endTurn=()=>{};later=(fn)=>{};   // 只看這一下，不接後面的流程
  const tig=U('tiger'),rac=U('raccoon'),foe=b.units.find(v=>v.side==='foe'&&!v.dead);
  [tig,rac].forEach(u=>{setStress(u,100);startFrenzy(u);});
  out.adv=[frenzyAdv(tig,foe),frenzyAdv(foe,tig),frenzyAdv(rac,foe),frenzyAdv(foe,rac)];
  [tig,rac].forEach(u=>endFrenzy(u,'測試'));
  // 香香：鎖定一招、不花格子
  const w=U('wolf');w.hp=99;w.down=false;w.statuses=[];w.slots=slotMax(w).slice();w.learned=[{key:'hamstring',name:'扎腿'}];w.activeSkills=['hamstring'];
  const e=b.units.filter(v=>v.side==='foe'&&!v.dead&&!foeHid(v))[0];e.hp=e.maxHp=99;
  const free=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).find(p=>!unitAt(p.x,p.y)&&!blocked(p.x,p.y));w.x=free.x;w.y=free.y;
  setStress(w,100);startFrenzy(w);b.turn=b.units.indexOf(w);beginTurn(w);b.busy=false;
  const s0=slotsOf(w)[0];frenzyTurn(w);await wait();
  out.wolf={lock:w.frenzy.lock?.key,slots:s0-slotsOf(w)[0]};endFrenzy(w,'測試');
  // 嬌嬌：挑生命最多的
  const foes=seenFoes(tig);foes.forEach((v,i)=>v.hp=10+i);const big=foes.at(-1);
  setStress(tig,100);startFrenzy(tig);out.tigerLog=(()=>{const n0=b.log.length;b.turn=b.units.indexOf(tig);beginTurn(tig);b.busy=false;frenzyTurn(tig);return b.log.slice(n0).some(l=>l.t.includes('衝向最兇的'+big.name));})();
  endFrenzy(tig,'測試');
  // 煩躁台詞：75 以上才配 cranky
  setStress(w,74);const c74=barkMatch(w,{id:'wolf',cranky:true});setStress(w,75);out.cranky=[c74,barkMatch(w,{id:'wolf',cranky:true}),barkMatch(w,{id:'wolf',cranky:false})];
  const fox=U('fox'),ally=U('wolf');Object.assign(e,{hp:99,dead:false,down:false});Object.assign(ally,{dead:false,down:false});setStress(fox,100);startFrenzy(fox);out.foxAoe=spellCaught(fox,[ally,e]).map(v=>v.side);endFrenzy(fox,'測試');out.foxAoeCalm=spellCaught(fox,[ally,e]).map(v=>v.side);
  return out;});
 assert.deepEqual(sk2.foxAoe,['foe']);assert.deepEqual(sk2.foxAoeCalm,['pc','foe']);ok('玲玲效率至上：失控時範圍法術不打自己人（平常會）');
 assert.deepEqual(sk2.adv,[1,1,1,-1]);ok('嬌嬌魯莽打擊：攻擊優勢、被打優勢；默默高等隱形：攻擊優勢、被打劣勢');
 assert.equal(sk2.wolf.lock,'hamstring');assert.equal(sk2.wolf.slots,0);ok('香香同一招到底：鎖定扎腿，不花熟練格');
 assert(sk2.tigerLog);ok('嬌嬌衝向生命最多的敵人');
 assert.deepEqual(sk2.cranky,[false,true,false]);ok('壓力 75 以上換煩躁台詞');
 // 回神：豁免成功→壓力 50；連續失敗第 3 回合一定回神
 const rec=await pg.evaluate(()=>{
  const b=B(),t=b.units.find(v=>v.id==='tiger');const out={};
  const rnd=Math.random;Math.random=()=>.999;frenzyTurnEnd(t);Math.random=rnd;out.saved=[!t.frenzy,t.stress];
  setStress(t,100);startFrenzy(t);Math.random=()=>0;frenzyTurnEnd(t);out.r1=!!t.frenzy;frenzyTurnEnd(t);out.r2=!!t.frenzy;frenzyTurnEnd(t);out.r3=[!!t.frenzy,t.stress];Math.random=rnd;
  // 協助過：多擲一次（優勢）
  setStress(t,100);startFrenzy(t);const fox=b.units.find(v=>v.id==='fox');fox.x=t.x+1;fox.y=t.y;
  t.frenzy.helped=true;let n=0;const sr=saveRoll;saveRoll=(...a)=>{n++;return false;};frenzyTurnEnd(t);saveRoll=sr;out.helpedRolls=n;
  // 戰鬥結束：還在失控的自動回神、每隻 +5
  const before=b.units.filter(v=>v.side==='pc').map(v=>v.stress);stressBattleEnd();
  out.end=[!t.frenzy,b.units.filter(v=>v.side==='pc').map((v,i)=>v.stress-(v===t?50:before[i]))];
  return out;});
 assert.deepEqual(rec.saved,[true,50]);ok('感知豁免成功回神，壓力降到 50');
 assert(rec.r1&&rec.r2);assert.deepEqual(rec.r3,[false,50]);ok('連續失敗，第 3 回合結束一定回神');
 assert.equal(rec.helpedRolls,2);ok('被隊友協助過：回神豁免擲兩次（優勢）');
 assert(rec.end[0]);assert(rec.end[1].every(d=>d===5));ok('戰鬥結束：失控的回神、每隻 +5');

 // 戰鬥外：休息、回酒館、狀態卡快照
 const out=await pg.evaluate(()=>{
  state.stress={fox:60,tiger:100,wolf:5,raccoon:40};const o={};
  restStress('short');o.short={...state.stress};restStress('long');o.long={...state.stress};
  state.stress.fox=70;const bk=state.battle,tr=state.townRest;state.battle=null;state.townRest=null;o.snap=critterStatusUnit('fox').svgMood;state.battle=bk;state.townRest=tr;
  tavernStress();o.tavern=Object.values(state.stress);return o;});
 assert.deepEqual(out.short,{fox:50,tiger:90,wolf:0,raccoon:30});assert.deepEqual(out.long,{fox:20,tiger:60,wolf:0,raccoon:0});ok('短休 −10、長休 −30（不會低於 0）');
 assert.equal(out.snap,'stressed');ok('劇情／城鎮狀態卡也照壓力換臉');
 assert(out.tavern.every(v=>v===0));ok('回到大爺的酒館壓力歸零');
 // 測試戰鬥（#battle 隨機場）的齒輪有「壓力拉到 95」；救援商隊沒有
 assert.equal(await pg.locator('[data-system-action="stressTest"]').count(),0);
 const p2=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p2.on('pageerror',e=>errors.push(e.message));
 await p2.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');await bootReady(p2);
 await p2.waitForFunction(()=>B()&&B().id==='random');
 await p2.locator('[data-system-menu]').first().tap();await p2.locator('[data-system-action="stressTest"]').tap();
 assert.deepEqual(await p2.evaluate(()=>B().units.filter(isCritter).map(u=>u.stress)),[95,95,95,95]);ok('測試戰鬥齒輪：壓力拉到 95');
 assert.deepEqual(errors,[]);ok('沒有錯誤');
}finally{await br.close();}
