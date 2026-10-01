// 冒煙測試：開遊戲、走劇情、跑戰鬥、檢查關鍵規則。有任何一項失敗就 exit 1。
// 用法：npm i playwright（第一次）→ node tests/smoke.mjs [index.html 的路徑，預設是 repo 根目錄的 index.html]
// 這份只能證明「沒壞」：每項規則抽幾個代表情況檢查，不是完整測試。
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(process.argv[2] || path.join(here, '..', 'index.html'));
const url = 'file://' + file;
let fails = 0, passes = 0;
const ok = (name, cond, info='') => { if(cond){ passes++; console.log('  ✓ ' + name); } else { fails++; console.log('  ✗ ' + name + (info ? '  → ' + info : '')); } };

const br = await chromium.launch();
async function open(hash='', viewport={width:1000, height:900}){
  const pg = await br.newPage({viewport});
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url + hash); await pg.waitForTimeout(800);
  return {pg, errs};
}
// 擲屬性（每隻擲骰＋自動分配）
async function rollAll(pg){
  await pg.click('#start');
  for(const i of [0,1,2,3]){ await pg.click(`[data-tab="${i}"]`); await pg.click('#rollAll'); await pg.waitForTimeout(60); await pg.click('#autoAssign'); await pg.waitForTimeout(60); }
}

// ---------- 1. 封面、擲屬性、序章 ----------
console.log('封面 → 擲屬性 → 序章');
{
  const {pg, errs} = await open();
  ok('從封面開始', await pg.evaluate(()=>state.page) === 'cover');
  await rollAll(pg);
  ok('四隻都分配完', await pg.evaluate(()=>CRITTERS.every(c=>ABILITIES.every(a=>state.slot[c.id] && state.slot[c.id][a.k]!==undefined))));
  await pg.click('#next'); await pg.waitForTimeout(200);
  ok('進入序章', await pg.evaluate(()=>state.page==='story' && state.scene==='prologue'));
  const stage = await pg.evaluate(()=>{ window.__st=document.getElementById('stage'); return true; });
  await pg.mouse.click(400, 60); await pg.waitForTimeout(150);
  ok('點對話框以外的地方也會推進', await pg.evaluate(()=>state.line) === 1);
  ok('換台詞不整頁重畫', await pg.evaluate(()=>window.__st===document.getElementById('stage')));
  const total = await pg.evaluate(()=>SCENES.prologue.script.length);
  for(let i=0;i<total;i++){ await pg.mouse.click(400, 60); await pg.waitForTimeout(40); }
  ok('序章最後一句「去看裝備」按鈕亮起', await pg.evaluate(()=>{ const b=document.getElementById('toShop'); return b && !b.disabled && b.textContent==='去看裝備'; }));
  await pg.click('#toShop'); await pg.waitForTimeout(200);
  ok('進入商店', await pg.evaluate(()=>state.page) === 'shop');
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

// ---------- 2. 大地圖旅行 → 伏擊劇情 → 察覺 → 戰鬥 ----------
console.log('大地圖 → 伏擊 → 戰鬥');
for(const spot of [true, false]){
  const {pg, errs} = await open();
  await rollAll(pg);
  await pg.evaluate(()=>{ CRITTERS.forEach(c=>{ state.gold[c.id]=100*GP; state.inv[c.id]=[]; }); state.page="map"; state.location="tavern"; state.travel={from:"tavern", to:"town", t:0, stop:.5, alert:false}; render(); startTravel(); });
  await pg.waitForTimeout(4300);
  ok(`旅行途中進入伏擊劇情（${spot?'有人察覺':'沒人察覺'}）`, await pg.evaluate(()=>state.page==='story' && state.scene==='ambush' && !!state.scout));
  const r = await pg.evaluate((spot)=>{
    const k = Object.keys(state.scout.foes)[0]; state.scout.foes[k].spotted = spot ? ["wolf"] : [];
    const s = SCENES.ambush.script; return {n:s.length, base:AMBUSH.length, shake:s.some(l=>l.shake), wolf:s.some(l=>l.who==='wolf' && l.text===SPOT_QUIP.wolf)};
  }, spot);
  ok('察覺的台詞與草叢晃動', spot ? (r.shake && r.wolf) : (!r.shake && r.n===r.base), JSON.stringify(r));
  await pg.evaluate(()=>{ state.line = SCENES.ambush.script.length-1; render(); });
  await pg.click('#toBattle'); await pg.waitForTimeout(500);
  const b = await pg.evaluate(()=>{ const sh=B().units.find(u=>u.type==='goblin_shaman'); return {hidden: !!sh.statuses.find(s=>s.k==='hidden'), npc: B().units.filter(u=>u.side==='npc').length}; });
  ok('薩滿：有人察覺就現形、沒人察覺就躲著', b.hidden === !spot, JSON.stringify(b));
  ok('戰場上有商人（NPC）', b.npc === 1);
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

// ---------- 3. 快速戰鬥跑幾回合 ----------
console.log('快速戰鬥');
{
  const {pg, errs} = await open('#battle');
  ok('#battle 直接進戰鬥', await pg.evaluate(()=>state.page==='battle' && !!B()));
  ok('回合順序沒有 NPC', await pg.evaluate(()=>document.querySelectorAll('.ord').length === B().units.filter(u=>u.side!=='npc').length));
  for(let i=0;i<30;i++){ const btn=pg.locator('button:has-text("待機")'); if(await btn.count()){ try{ await btn.first().click({timeout:400}); }catch{} } await pg.waitForTimeout(450); }
  const r = await pg.evaluate(()=>({round:B().round, npcHp:B().units.find(u=>u.side==='npc').hp}));
  ok('敵人會行動、回合會前進', r.round >= 2, JSON.stringify(r));
  ok('沒有人攻擊商人', r.npcHp === 4);
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

// ---------- 4. 規則 ----------
console.log('規則');
{
  const {pg, errs} = await open('#battle');
  const r = await pg.evaluate(()=>{
    const b=B(); window.nextTurn=()=>{}; window.aiTurn=()=>{};
    const U=id=>b.units.find(u=>u.id===id), tig=U('tiger'), wolf=U('wolf'), fox=U('fox');
    const g=b.units.find(u=>u.type==='goblin'), arc=b.units.find(u=>u.type==='goblin_archer'), npc=b.units.find(u=>u.side==='npc');
    b.units.forEach(u=>{ u.hp=u.maxHp; u.down=false; u.dead=false; u.statuses=u.statuses.filter(s=>s.k==='hidden'); });
    const o={};
    // 高度
    tig.x=10; tig.y=17; o.climb = reachable(tig,10).get('8,17')?.cost;
    tig.x=10; tig.y=21; o.step = reachable(tig,10).get('8,21')?.cost;
    tig.x=8; tig.y=21; o.down1 = reachable(tig,10).get('9,21')?.cost;
    tig.x=8; tig.y=18; g.x=9; g.y=18; o.distCliff = dist(tig,g);
    tig.x=7; tig.y=18; g.x=8; g.y=18; g.maxHp=99; g.hp=99; push(tig,g,1); o.fall = {pos:[g.x,g.y], dmg:99-g.hp, prone:!!has(g,'prone')};
    g.statuses=[]; g.x=9; g.y=18; tig.x=10; tig.y=18; push(tig,g,1); o.wall=[g.x,g.y];
    wolf.x=5; wolf.y=14; arc.x=5; arc.y=20; o.coverBehind = coverOf(wolf,arc).by;
    arc.x=5; arc.y=17; o.coverEdge = coverOf(wolf,arc).v;
    // NPC
    o.npcHostile = hostile(npc,g) || hostile(npc,tig) || enemiesOf(g).includes(npc) || enemiesOf(tig).includes(npc);
    o.foeHostile = hostile(g,tig);
    // 小筆記
    o.cap = [noteCap('fox'), noteCap('tiger'), notePages('fox'), notePages('raccoon')];
    o.starterLv = STARTER_NOTES.fox.every(n=>n.lv===1);
    // 嬌嬌減半（物理）
    const ax = unitSkills(tig).find(s=>s.def.pts===1 && isPhysicalSkill(s));
    o.half = ax ? [finalSkillCost(tig,ax,1), finalSkillCost(tig,ax,2), finalSkillCost(tig,ax,3), finalSkillCost(wolf,ax,2)] : null;
    // 投擲物圖樣
    o.proj = ['鍊金火','酸液瓶','網子','匕首'].map(n=>projArtKey(ITEMS.find(i=>i.n===n)));
    // 大地圖：方向、回程路線
    o.map = WORLD.locations.find(l=>l.id==='tavern').x > WORLD.locations.find(l=>l.id==='cave').x;
    const p1=roadPoint('tavern','town',.3), p2=roadPoint('town','tavern',.7); o.road = Math.abs(p1.x-p2.x)<1e-6 && Math.abs(p1.y-p2.y)<1e-6;
    // 戰場方向：四小隻在右、朝左
    o.dir = b.def.party.every(([x,y])=>x===15) && fox.face===-1;
    return o;
  });
  ok('爬兩層山壁花 4 格', r.climb===4, r.climb);
  ok('台階分兩次爬花 4 格', r.step===4, r.step);
  ok('往下一層不多花', r.down1===1, r.down1);
  ok('隔兩層高度差距離算 2', r.distCliff===2, r.distCliff);
  ok('推下 10 呎：1d6、倒地', r.fall.pos.join()==='9,18' && r.fall.dmg>=1 && r.fall.dmg<=6 && r.fall.prone, JSON.stringify(r.fall));
  ok('推不上兩層山壁', r.wall.join()==='9,18', r.wall);
  ok('台地後面有斷層掩護、邊緣沒有', r.coverBehind==='斷層' && r.coverEdge===0, `${r.coverBehind} / ${r.coverEdge}`);
  ok('NPC 不是任何人的敵人', r.npcHostile===false && r.foeHostile===true);
  ok('小筆記一頁 5 招：玲玲 3 頁 15 招、其他 2 頁 10 招', r.cap.join()==='15,10,3,2', r.cap);
  ok('起始技能記成 1 級', r.starterLv);
  ok('嬌嬌物理招減半進位（1→1、2→1、3→2），別人不減', r.half && r.half.join()==='1,1,2,2', r.half);
  ok('投擲物照物品換圖', r.proj.join()==='flask_fire,flask_acid,net,dagger', r.proj);
  ok('大地圖酒館在右、洞窟在左', r.map);
  ok('回程路線跟去程同一條路', r.road);
  ok('戰場四小隻在右、朝左', r.dir);

  // 觀察學習：DC 5＋怪物等級、向玲玲學用招式原本的等級
  const r2 = await pg.evaluate(()=>{
    const b=B(), U=id=>b.units.find(u=>u.id===id), ling=U('fox'), tig=U('tiger');
    const foe=b.units.find(u=>u.type==='goblin'); foe.level=7; b.observeRound=-1;
    const rnd=Math.random; Math.random=()=>0.999; observedSkill(foe,'t_key','測試招'); Math.random=rnd;
    const pend=ling.pendingLearned.find(x=>x.key==='t_key'); ling.learned.push({...pend});
    const at=tot=>{ const d=tot-(tig.mods.WIS||0); Math.random=()=>(d-1)/20+0.001; const k=learnFromLingling(tig,'t_key'); Math.random=rnd; tig.pendingLearned=[]; return k; };
    return {lv:pend.lv, dc11:at(11), dc12:at(12), mark:(b.marks||[]).some(m=>m.kind==='ok')};
  });
  ok('觀察成功記下怪物等級', r2.lv===7, r2.lv);
  ok('向玲玲學 DC＝5＋7：11 失敗、12 成功', r2.dc11===false && r2.dc12===true, JSON.stringify(r2));
  ok('觀察成功跳 ❗ 泡泡', r2.mark);

  // 頭上提示的縮放
  const r3 = await pg.evaluate(()=>{ const b=B(), zd=zoomDefault(); b.zoom=zd; const a=overlayK()*zd; b.zoom=.3; const c=overlayK()*.3; b.zoom=1.2; const d=overlayK()/(1/zd); return [a,c,d]; });
  ok('頭上提示：預設縮放跟以前一樣、縮小時最少 60%、放大跟著地圖', Math.abs(r3[0]-1)<1e-9 && Math.abs(r3[1]-.6)<1e-9 && Math.abs(r3[2]-1)<1e-9, r3);
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

await br.close();
console.log(`\n${passes} 項通過，${fails} 項失敗`);
process.exit(fails ? 1 : 0);
