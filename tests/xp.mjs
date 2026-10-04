// 經驗與升級（大爺 10-04）：打倒敵人照 SRD 平分、商隊護送完成升到等級 2、升級加生命 5＋體質、探索戰也給經驗
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html');
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
const ok=n=>console.log('✓ '+n);
try{
  await pg.goto('file://'+root+'#battle');await pg.waitForTimeout(500);
  // 門檻：照 SRD 5.2，299 還是 1、300 升 2、一次給很多可以連升
  const th=await pg.evaluate(()=>{state.xp={};state.level={};const a=gainXP(['fox'],299),l1=critterLevel('fox');const b=gainXP(['fox'],1),l2=critterLevel('fox');const c=gainXP(['fox'],600),l3=critterLevel('fox');state.xp={};state.level={};return {a,l1,b,l2,c,l3};});
  assert.deepEqual([th.l1,th.l2,th.l3],[1,2,3]);assert.equal(th.a.length,0);assert.deepEqual(th.b,[{id:'fox',from:1,to:2}]);ok('門檻照 SRD：299 還是等級 1、300 升等級 2、900 升等級 3');
  // 伏擊：四隻哥布林各 50，共 200，四小隻每隻 50；同一隻不重複算
  await pg.evaluate(()=>{state.xp={};state.level={};startBattle('ambush');});
  await pg.waitForFunction(()=>cur()&&cur().side==='pc'&&!B().busy,null,{timeout:60000});
  const amb=await pg.evaluate(()=>{B().units.filter(v=>v.side==='foe').forEach(v=>{v.dead=true;v.hp=0;});checkResult();awardBattleXP();return {xp:CRITTERS.map(c=>critterXP(c.id)),lv:CRITTERS.map(c=>critterLevel(c.id)),log:B().log.map(l=>l.text||l.t||l).join('|'),shown:B().units.filter(u=>u.side==='pc').map(u=>u.xp)};});
  assert.deepEqual(amb.xp,[50,50,50,50]);assert.deepEqual(amb.lv,[1,1,1,1]);assert.deepEqual(amb.shown,[50,50,50,50]);ok('伏擊打贏：4 隻×50＝200，每隻 50，狀態卡跟著更新；重算不會多給');
  // 商隊護送完成：每隻 +250 → 300，等級 2
  await pg.locator('#afterWin').click();
  while(await pg.evaluate(()=>!SCENES.caravan.script[state.line].choice)) await pg.locator('#stage').click();
  await pg.evaluate(()=>caravanPick('wolf',20));
  assert.deepEqual(await pg.evaluate(()=>CRITTERS.map(c=>[critterXP(c.id),critterLevel(c.id)])),[[300,2],[300,2],[300,2],[300,2]]);
  assert(await pg.evaluate(()=>SCENES.caravan.script.some(l=>/升到等級 2/.test(l.text))),'劇情有升級提示');ok('商隊護送完成：每隻 +250，打完商隊就等級 2，劇情有提示');
  // 沒打伏擊直接到商隊（測試入口）也保證升到 2
  const top=await pg.evaluate(()=>{state.xp={};state.level={};state.caravan=null;caravanPick('fox',20);return CRITTERS.map(c=>critterLevel(c.id));});
  assert.deepEqual(top,[2,2,2,2]);ok('沒拿到打怪經驗也補到門檻，一樣升等級 2');
  // 等級 2 開戰：生命＝8＋體質 ＋ 5＋體質；熟練格照等級 2（一階 ×3）
  const hp=await pg.evaluate(()=>{startBattle('ambush');return B().units.filter(u=>u.side==='pc').map(u=>({lv:u.level,hp:u.maxHp,want:Math.max(1,8+u.mods.CON)+Math.max(1,5+u.mods.CON),slots:slotMax(u)[0]}));});
  hp.forEach(h=>{assert.equal(h.lv,2);assert.equal(h.hp,h.want);assert.equal(h.slots,3);});ok('等級 2 開戰：生命 +5＋體質，熟練格一階 ×3');
  // 探索戰：打完回探索也給經驗
  await pg.goto('file://'+root+'#battle?seed=123');await pg.reload();await pg.waitForTimeout(600);
  const ex=await pg.evaluate(()=>{state.xp={};state.level={};const b=B();b.phase='combat';b.manualCombat=false;b.units.filter(u=>u.side==='pc').forEach(u=>u.combatActive=true);const fs=b.units.filter(u=>u.side==='foe');fs.forEach(v=>{v.dead=true;v.hp=0;v.combatActive=true;});const want=Math.floor(fs.reduce((a,u)=>a+(ENEMIES[u.type].xp||0),0)/4);checkResult();return {want,got:CRITTERS.map(c=>critterXP(c.id)),phase:B().phase};});
  assert(ex.want>0);assert.deepEqual(ex.got,[ex.want,ex.want,ex.want,ex.want]);assert.equal(ex.phase,'explore');ok('探索中的戰鬥打完回探索，也照 SRD 給經驗');
  assert.deepEqual(errs,[]);
}finally{await br.close();}
