/* ======================== 戰鬥引擎：規則與流程（不碰畫面） ========================
   命中 = d20 + 屬性調整值 + 2 ≥ AC；豁免 DC = 8 + 2 + 屬性調整值；1 級生命值 = 保存的 1d10 + 體質調整值（最低1）
   距離用切比雪夫距離（斜走也算 1 格） */

// ---------- 骰子 ----------
// 所有規則骰都走 diceRand：反應／好運「快照重跑」時只重播規則骰，台詞、骰子動畫等其他亂數不影響（10-09：以前整個 Math.random 重播，
// 機器忙時台詞冷卻依時間多抽一次亂數，重跑就錯位，重擲拿到舊的骰）
let diceRand = () => Math.random();
function rollDice(expr){           // "2d6+3" → {total, rolls, mod}
  const m = String(expr).match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if(!m) return {total:+expr||0, rolls:[], mod:+expr||0};
  const rolls = Array.from({length:+m[1]}, ()=>1+Math.floor(diceRand()*+m[2]));
  const mod = +(m[3]||0);
  const b = typeof B==="function" && B();                        // 骰子面板：擲出來的骰先放著，誰受了傷害就算誰那一列的（hurt 裡分）
  if(b && b.panel && !b._noCap) (b._pend = b._pend || []).push(...rolls.map(v=>({sides:+m[2], v})));
  return {total: rolls.reduce((a,b)=>a+b,0)+mod, rolls, mod};
}
const d20 = () => 1+Math.floor(diceRand()*20);
// 距離（D&D 方格，2026-10-01 加入高度）：水平兩軸加上高度差，取最大。一層＝5 呎＝一格
//   所以近戰（觸及 1）只打得到高度差一層以內的人；差兩層手就搆不到
//   大型以上佔多格（大爺 10-20）：從兩邊最近的那兩格算
const dist = (a,b) => { const na = footOf(a), nb = footOf(b);
  return Math.max(Math.max(0, a.x-(b.x+nb-1), b.x-(a.x+na-1)), Math.max(0, a.y-(b.y+nb-1), b.y-(a.y+na-1)), Math.abs(hAt(a.x,a.y)-hAt(b.x,b.y))); };
const sgn = v => v>0?1:v<0?-1:0;

// ---------- 建立戰鬥 ----------
// 重新挑戰（大爺 10-02）：輸掉後可以從開戰前重打，三次用完只剩「傳送回酒館」，長休回滿
//   開戰時把會被戰鬥改到的 state 存起來；重新挑戰先還原再開戰，所以道具、熟練格、這場理解的招都回到開戰前
const RETRY_MAX = 3;
const SNAP_KEYS = ["startingGear","xp","level","gold","inv","learned","activeSkills","proficiency","shortRestsUsed","scout","equipmentItems","equipmentSerial","focusItems","focusSerial","shopFocusStock","magicItems","market","stress","steed"];
function snapBattle(id){ state.battleSnap = {id, data: JSON.parse(JSON.stringify(Object.fromEntries(SNAP_KEYS.map(k=>[k, state[k] ?? null]))))}; }
function retryBattle(){
  const s = state.battleSnap; if(!s || state.retriesLeft <= 0) return;
  state.retriesLeft--;
  Object.entries(JSON.parse(JSON.stringify(s.data))).forEach(([k,v])=>{ state[k] = v; });
  if(s.battle){state.battle=JSON.parse(JSON.stringify(s.battle));delete B().def._h;B().flowEpoch=(B().flowEpoch||0)+1;refreshBattle.keys=null;nextTurn();refreshBattle();}
  else startBattle(s.id, true);
}
// 傳送回酒館：回到大地圖、站在酒館（代價還沒定，先不扣東西）
function teleportHome(){
  changeStressAll(v=>v + STRESS.teleport);   // 全隊昏迷、被詛咒傳回酒館的代價：壓力上升（大爺 10-11）
  state.battle = null; state.scout = null; state.travel = null; state.mapSel = null;
  state.location = "tavern"; state.page = "map"; render(); window.scrollTo(0,0);
}
// 打贏後接劇情：熟練格、筆記存回去，戰鬥收掉（計時器都會檢查 B()，不會再動）
function leaveBattleTo(scene){
  queueAfterTalk(B());   // 戰後閒聊（10-11）
  if(scene==="questDone"){ finishQuest(); return; }   // 委託打完回大地圖（10-10，js/quests.js）
  if(B()?.id==="worldMimic"){
    if(B().result!=="win"||scene!=="worldChest"||state.worldChest?.status!=="fighting")return;
    syncLearnedState();state.worldChest.status="defeated";state.battle=null;state.scout=null;
    state.page="story";state.scene="worldChest";state.line=0;state.info=null;render();window.scrollTo(0,0);return;
  }
  syncLearnedState();
  // 商隊進城後整理同一場理解的招式；保留休息資料，不讓戰場計時器繼續。
  if(scene==="caravan"){
    state.townRest=JSON.parse(JSON.stringify(B()));
    state.townRest.busy=false;state.townRest.exploreStopped=false;
  }
  state.battle = null; state.scout = null;
  state.page = "story"; state.scene = scene; state.line = 0; state.info = null; state.caravan = {};
  render(); window.scrollTo(0,0);
}
function startBattle(id, retry=false, phase="combat"){
  if(!retry) snapBattle(id);
  const def = BATTLES[id];
  nightLighting(def);   // 晚上：外面的戰場變微光（10-29）
  const units = [];
  CRITTERS.forEach((c,i)=>{
    const scores = abilityScores(c.id), mods = abilityMods({scores});
    const lv = critterLevel(c.id), hp = maxHpAt(lv, mods.CON, c.id);   // 每升一級 +5＋體質（大爺 10-04）
    units.push({
      id:c.id, side:"pc", name:c.name, color:c.color,
      x:def.party[i][0], y:def.party[i][1], hp, maxHp:hp, scores, mods, level:lv, xp:critterXP(c.id),
      ...Equipment.read(c.id),items:[],
      speed:6, statuses:mealStatus(c.id), learned:raceFreeNotes(state.learned&&state.learned[c.id]?state.learned[c.id]:starterNotes(c.id)).map(x=>({...x})), activeSkills:raceFreeKeys(state.activeSkills&&state.activeSkills[c.id]?state.activeSkills[c.id]:raceFreeNotes(state.learned&&state.learned[c.id]?state.learned[c.id]:starterNotes(c.id)).slice(0,5).map(x=>x.key)), down:false, face:1, oaUsed:false
    });
  });
  def.foes.forEach((f,i)=>{
    const e = ENEMIES[f.type], inv = retry && state.battleSnap.foeGear ? state.battleSnap.foeGear[i] : (f.gear || e.gear).map(n=>ITEMS.find(it=>it.n===n)).filter(Boolean).map(it=>makeItem(it,false,e));
    if(!retry){ for(const d of e.drops||[]) if(Math.random()<d.chance){ const it=ITEMS.find(x=>x.n===d.n); if(it) inv.push(makeItem(it,false,e)); } }   // 機率掉落（韁繩，10-20）：開戰就放進背包，重新挑戰照同一份
    if(!retry)(state.battleSnap.foeGear ||= [])[i]=inv;
    const weapon = inv.find(it=>it.type==="weapon") || null;
    units.push({
      id:"foe"+i, side:"foe", trapCharges:f.trapCharges??0, squad:f.squad, type:f.type, rarity:f.rarity, name:e.name+(f.type==="world_mimic"||def.quest&&def.foes.length===1?"":def.dungeon?(def.foes.filter(g=>g.type===f.type).length>1?"ABCDEFGH"[def.foes.slice(0,i).filter(g=>g.type===f.type).length]:""):"ABCDEFGH"[i]), look:e.look, natural:e.natural||null, special:e.special||null,
      x:f.x, y:f.y, hp:e.hp, maxHp:e.hp, scores:{...e.scores}, mods:abilityMods(e), baseAc:e.ac, testSkill:f.testSkill||null, testSkillUsed:false,
      resistances:[...(f.resistances ?? e.resistances ?? [])], damageImmunities:[...(f.damageImmunities ?? e.damageImmunities ?? [])], vulnerabilities:[...(e.vulnerabilities||[])],
      weapon, focus: inv.find(it=>it.type==="focus") || null, shield: inv.some(it=>it.type==="shield"), armor:inv.find(it=>it.type==="armor")||null, spare:[], items:[], backpackEquip:bestBag(inv), backpack:inv.filter(it=>(it.type==="gear" && it!==bestBag(inv)) || it.type==="consumable"),
      born: weapon ? weapon.n : null,                 // 開場拿的武器（台詞用：「拿棍子的倒了」）
      learned:(e.passives||[]).map(key=>({key,name:learnedSkillByKey(key)?.def.name||key,from:e.name})), activeSkills:[...(e.passives||[])], spellKeys:e.spells?[...e.spells]:null,
      speed:e.speed, statuses:[], level:e.level||1, down:false, face:-1, oaUsed:false
    });
    if(f.grudge){ applyGrudgeUnit(units[units.length-1], f.grudge); orcGrudgeUnit(units[units.length-1]); }   // 回來報仇的（10-21，js/grudge.js）
    // 騎乘出場（10-20）：坐騎是同一格的另一個敵人，騎士掛在牠身上
    if(e.mount && f.onFoot){ const r = units[units.length-1]; r.look = e.lookOnFoot || r.look; r.speed = e.speedOnFoot ?? r.speed; }   // 馬在毛毛們手上：用走的來（死亡騎士，10-23）
    else if(e.mount){ const m = ENEMIES[e.mount], r = units[units.length-1];
      if(r.squad===undefined) r.squad = r.id;   // 騎士和坐騎同一小隊：探索切戰棋一起加入
      units.push({
        id:r.id+"m", side:"foe", squad:r.squad, type:e.mount, name:m.name+r.name.slice(e.name.length), look:m.look, natural:m.natural||null, special:m.special||null,
        x:f.x, y:f.y, hp:m.hp, maxHp:m.hp, scores:{...m.scores}, mods:abilityMods(m), baseAc:m.ac, testSkill:null, testSkillUsed:false,
        resistances:[...(m.resistances||[])], damageImmunities:[...(m.damageImmunities||[])], vulnerabilities:[...(m.vulnerabilities||[])],
        weapon:null, focus:null, shield:false, armor:null, spare:[], items:[], backpackEquip:null, backpack:[], born:null,
        learned:[], activeSkills:[], speed:m.speed, statuses:[], level:m.level||1, down:false, face:-1, oaUsed:false, riderId:r.id
      });
      r.mountId = r.steedId = r.id+"m";   // steedId：自己的坐騎，摔下來之後還認得
    }
  });
  if(!retry){
    for(const k of ["equipmentItems","equipmentSerial","focusItems","focusSerial"])state.battleSnap.data[k]=JSON.parse(JSON.stringify(state[k]??null)); }
  scaleFoes(units);   // 怪物跟著毛毛們的等級浮動（10-29，js/scaling.js）
  // NPC：站在戰場上、不參與先攻、不行動（行為之後跟劇情一起定）
  (def.npcs||[]).forEach((n,i)=>{
    const d = NPCS[n.type];
    units.push({
      id:"npc"+i, side:"npc", type:n.type, name:d.name, look:d.look,
      x:n.x, y:n.y, hp:d.hp, maxHp:d.hp, scores:{...d.scores}, mods:abilityMods(d), baseAc:d.ac,
      weapon:null, focus:null, shield:false, armor:null, spare:[], items:[], backpack:[], backpackEquip:null,
      speed:d.speed, statuses:[], level:1, down:false, face:n.face||1, oaUsed:false, slots:[0]
    });
  });
  units.filter(u=>u.side==="pc").forEach(u=>{ u.born = u.weapon ? u.weapon.n : null; syncBattleBag(u); });
  units.forEach(u=>{
    // 熟練格：我方接著上一場剩下的（舊存檔存的是點數、不是格子，就當全滿），敵人每場滿格
    const max = slotMax(u), saved = state.proficiency[u.id];
    if(u.side==="pc") u.slots = max.map((m,i)=>Array.isArray(saved) ? Math.min(m, saved[i] ?? m) : m);
    else if(u.side==="foe") u.slots = max;
  });
  // 開場就躲好的敵人（例如草叢裡的哥布林薩滿）：擲 d20 + 敏捷，沒過 HIDE_DC 就沒躲好、開場就看得到
  //   劇情裡先做過被動察覺（state.scout）：沿用同一個躲藏數字；沒躲好或有人察覺到就直接現形
  const scout = state.scout && state.scout.battle===id ? state.scout.foes : null;
  def.foes.forEach((f,i)=>{ if(!f.hidden) return;
    const u = units.find(v=>v.id==="foe"+i), sc = scout && scout[i];
    if(sc && sc.spotted.length){ u.revealedBy = sc.spotted; return; }
    const roll = sc ? sc.roll : d20(), hide = sc ? sc.hide : roll + u.mods.DEX;
    if(hide >= HIDE_DC) u.statuses.push({k:"hidden", val: hide, roll}); });
  // 先攻：d20 + 敏捷調整值，高的先
  // NPC 不擲先攻，排在最後，輪到時直接跳過
  units.forEach(u=> u.init = u.side==="npc" ? -Infinity : phase==="explore" ? 0 : d20() + u.mods.DEX + Math.random()*.1);
  units.sort((a,b)=>b.init-a.init);
  units.forEach(initStress);                        // 壓力（10-10）：帶上存著的值
  state.battle = {
    id, def, phase, units, turn:-1, round:0, log:[], mode:null, result:null,
    tut: def.tutorial ? 0 : -1, busy:false
  };
  fixFootprints();                                   // 多格單位挪到放得下的地方（10-20）
  syncBGM();
  units.filter(u=>u.revealedBy).forEach(u=>blog(`${u.name}躲在草叢裡，但已經被${u.revealedBy.map(id=>CRITTERS.find(c=>c.id===id).name).join("、")}發現了！`));
  if(phase==="explore")blog(EXPLORE_UI.enter);else blog(`戰鬥開始！先攻順序：${units.filter(u=>u.side!=="npc" && !foeHid(u) && !u.riderId).map(u=>u.name).join("、")}`);   // 躲著的敵人不列（大爺 10-02：拿掉 ???）
  if(phase!=="explore") passivePocket();          // 開場看得到的敵人：先比一次被動感知；探索地圖等第一次被看到（markSeenFoes，10-28）
  if(phase==="explore")beginExplore();else nextTurn();
}

const B = () => state.battle;
// 戰鬥用計時器：排的時候記下是哪一場。時間到發現已經換了一場（重新挑戰）或戰鬥不在了（傳送回酒館）就不跑
// （10-02：輸掉後馬上按重新挑戰，上一場排好的換回合跑進新的一場，第一隻被跳過）。js/battle/flow.js 的計時器都用這個
function later(fn, ms){ const b=B(),epoch=b?.flowEpoch||0;return setTimeout(()=>{if(b&&B()===b&&(b.flowEpoch||0)===epoch)fn();},ms); }
const mapCell = n => B()?.phase==="explore" ? Math.round(n) : n;
const unitsAt = (x,y) => B().units.filter(u=>!u.dead && !u.fled && covers(u, mapCell(x), mapCell(y)));
// 同一格騎著馬的：預設是騎士；選目標時選了坐騎（B().pickId）就回坐騎（騎乘，10-20）
const unitAt = (x,y) => { const l = unitsAt(x,y), p = B().pickId && l.find(u=>u.id===B().pickId); return p || l.find(u=>u.mountId) || l[0]; };
// 地形：solid 擋路；cover 攻擊線經過時給的掩護（.5 半掩護 AC+2、.75 四分之三 AC+5）；
//       cost 走進去要花幾格移動；hide 站在裡面時遠程攻擊他有劣勢（被遮蔽）
const TERRAIN = {
  poisonSwamp:{name:"毒沼",solid:false}, water:{name:"水面",solid:false}, oil:{name:"油",solid:false},
  chest: {name:"寶箱",solid:true,cover:.5},
  powderBarrel: {name:"火藥桶",solid:true,cover:.5},
  door: {name:"門",solid:true,cover:.75},
  doorOpen: {name:"門",solid:false},
  trap: {name:"陷阱",solid:false},
  wagon: {name:"馬車", solid:true,  cover:.75},
  crate: {name:"箱子", solid:true,  cover:.5},
  tree:  {name:"樹",   solid:true,  cover:.75},
  stream:{name:"溪流", solid:true},                    // 森林的溪（10-21）：走不過去、不擋視線
  ford:  {name:"淺灘", solid:false, cost:2},           // 踩石頭過溪，難走
  log:   {name:"倒木", solid:false},                   // 倒下的大樹，捷徑
  clue:  {name:"可疑的東西", solid:true, cover:.5},     // 調查點（智力檢定）
  rock:  {name:"岩壁", solid:true, cover:1},           // 洞窟（10-21）
  mist:  {name:"霧", solid:true},                     // 森林的霧（10-22）：過不去、不擋視線
  rubble:{name:"塌方", solid:true, cover:1},
  gravel:{name:"碎石路", solid:false, cost:2},
  brazier:{name:"火盆", solid:true, cover:.25},
  tomb:  {name:"墓碑", solid:true, cover:.5},           // 墓地（10-28）
  bush:  {name:"草叢", solid:false, cost:2, hide:true}
};
const terrainAt = (x,y) => { const o = B().def.blocks.find(b=>b.x===mapCell(x)&&b.y===mapCell(y)); return o ? TERRAIN[o.kind] : null; };
const blocked = (x,y) => { const d=B().def; if(x<0||y<0||x>=d.w||y>=d.h) return true; const t = terrainAt(x,y); return !!(t && t.solid); };
const moveCost = (x,y) => (terrainAt(x,y)||{}).cost || 1;
/* ---------- 高度（大爺 2026-10-01，照 SRD 5.2 簡化） ----------
   戰場資料 elev：[{x0,y0,x1,y1,h}] 矩形區域的高度（層），重疊取高；沒寫的格子高度 0。一層＝5 呎
   爬：往上一層多花 1 格移動（SRD：爬 1 呎花 2 呎），不花動作
   往下：一層直接走下去不多花；兩層以上照爬的算（慢慢爬下去）。被推下兩層以上才是跌落
   跌落：每 10 呎（兩層）1d6 鈍擊，並倒地
   高處不另外加命中或傷害，好處來自地形本身（近戰搆不到、掩護看直線經過的高度） */
const HZ = 40;   // 畫面上一層的高度（像素）
function hAt(x, y){
  const b = B(); if(!b) return 0; const d = b.def;
  if(!d._h){ d._h = new Map(); (d.elev||[]).forEach(r=>{ for(let i=r.x0;i<=r.x1;i++) for(let j=r.y0;j<=r.y1;j++){ const k=`${i},${j}`; d._h.set(k, Math.max(d._h.get(k)||0, r.h)); } }); }
  return d._h.get(`${mapCell(x)},${mapCell(y)}`) || 0;
}
const climbCost = (fx,fy,x,y) => { const dh = hAt(x,y) - hAt(fx,fy); return dh > 0 ? dh : dh <= -2 ? -dh : 0; };
const stepCost = (fx,fy,x,y) => moveCost(x,y) + climbCost(fx,fy,x,y);
// 多格的（10-21）：身體跨在不同高度上＝照最高的那格站（畫面、爬升都照這個）；難走的地形看整塊裡最難走的那格
const bodyH = (n, x, y) => { let h = 0; for(let i=0;i<n;i++) for(let j=0;j<n;j++) h = Math.max(h, hAt(mapCell(x)+i, mapCell(y)+j)); return h; };
function stepCostU(u, fx, fy, x, y){
  const n = u ? footOf(u) : 1; if(n<=1) return stepCost(fx,fy,x,y);
  let mc = 0; for(let i=0;i<n;i++) for(let j=0;j<n;j++) mc = Math.max(mc, moveCost(mapCell(x)+i, mapCell(y)+j));
  const dh = bodyH(n,x,y) - bodyH(n,fx,fy);
  return mc + (dh > 0 ? dh : dh <= -2 ? -dh : 0);
}

// ---------- 掩護與遮蔽 ----------
// 從攻擊者中心畫線到目標中心，看中間經過的格子：地形給的掩護、或擋在中間的「攻擊者的敵方」角色（半掩護）。
// 攻擊者自己的同伴不會擋。取經過的東西裡最好的掩護。回傳 {v:0|.5|.75, by:"箱子"...}
//   高度（2026-10-01）：線從攻擊者出手的高度（站的層 + .8）直直連到目標身體中間（層 + .5）。
//   經過的格子，東西的頂端比線在那裡的高度還低，線就從上面過去、不算掩護；地面本身比線高（斷層）就是四分之三掩護
const COVER_TOP = {wagon:1.5, crate:1, chest:1, door:3, tree:3, tomb:1};   // 地形物件高出地面幾層；角色算 1 層
// 多格的（10-21，SRD）：攻擊者挑自己身體的任一格、對準目標身體的任一格，取最有利（掩護最少）的那條線
function coverOf(a, t){
  if(footOf(a)===1 && footOf(t)===1) return coverLine(a, t, a.x, a.y, t.x, t.y);
  let best = null;
  for(const ca of cellsOf(a)) for(const ct of cellsOf(t)){
    const c = coverLine(a, t, ca.x, ca.y, ct.x, ct.y);
    if(!best || c.v < best.v) best = c;
    if(!best.v) return best;
  }
  return best;
}
function coverLine(a, t, ax, ay, tx, ty){
  const n = Math.max(1, Math.max(Math.abs(Math.round(tx)-Math.round(ax)), Math.abs(Math.round(ty)-Math.round(ay)))) * 6, seen = new Set();
  const hOf = (v, x, y) => footOf(v)>1 ? bodyH(footOf(v), v.x, v.y) : hAt(x,y);   // 多格的照身體最高那格（10-21）
  const za = hOf(a,ax,ay) + .8, zt = hOf(t,tx,ty) + .5, pair = new Set([a, t, mountOf(a), riderOf(a), mountOf(t), riderOf(t)].filter(Boolean));
  const own = (x,y) => (x===Math.round(ax)&&y===Math.round(ay)) || (x===Math.round(tx)&&y===Math.round(ty)) || covers(a,x,y) || covers(t,x,y);
  let best = {v:0, by:""};
  for(let i=1;i<n;i++){
    const x = Math.round(ax + (tx-ax)*i/n), y = Math.round(ay + (ty-ay)*i/n), k = `${x},${y}`;
    if(seen.has(k) || own(x,y)) continue;
    seen.add(k);
    const z = za + (zt-za)*i/n, g = hAt(x,y);
    if(g > z && best.v < .75) best = {v:.75, by:"斷層"};
    const o = B().def.blocks.find(q=>q.x===x&&q.y===y), ter = o && TERRAIN[o.kind];
    if(ter && ter.cover > best.v && g + (COVER_TOP[o.kind]||1) > z) best = {v:ter.cover, by:ter.name};
    const v = unitAt(x,y);
    if(v && !pair.has(v) && v.side!==a.side && !v.down && best.v < .5 && g + 1 > z) best = {v:.5, by:v.name};
  }
  for(let i=1;i<=n;i++){const x=Math.round(ax+(tx-ax)*i/n),y=Math.round(ay+(ty-ay)*i/n);if(groundAt(x,y)?.kind==="steam"&&best.v<.5)best={v:.5,by:"蒸氣"};}
  return best;
}
const coverAC = c => c.v>=.75 ? 5 : c.v>=.5 ? 2 : 0;
const coverName = c => c.v>=.75 ? "四分之三掩護" : c.v>=.5 ? "半掩護" : "";
// 夾擊（D&D DMG 的選用規則）：你和一名隊友都貼著同一個敵人、站在牠的正對面兩側 → 近戰攻擊牠有優勢。敵我都適用
// 多格的（10-21）：看站在牠身體的哪一側（左／中／右 × 上／中／下），隊友要在正對面那一側
function flankMate(a, t){
  if(dist(a,t)!==1) return null;
  const n = footOf(t), x0 = mapCell(t.x), y0 = mapCell(t.y), side = (v, x1) => v < x1 ? -1 : v > x1 + n - 1 ? 1 : 0;
  const sx = side(mapCell(a.x), x0), sy = side(mapCell(a.y), y0);
  return B().units.find(v=>v!==a && v.side===a.side && !v.down && !v.dead && dist(v,t)===1 && side(mapCell(v.x), x0)===-sx && side(mapCell(v.y), y0)===-sy) || null;
}
// 站在草叢裡：遠程攻擊他有劣勢
const hidden = t => !!(terrainAt(t.x,t.y)||{}).hide;
const inCombat=u=>!u.fled&&(!B().explorationMap||B().phase!=="combat"||u.combatActive);
const alive = side => B().units.filter(u=>u.side===side && !u.down && !u.dead && inCombat(u));
// ---------- 昏迷（大爺 10-09，取代死亡豁免）----------
// HP 歸零＝昏迷：不擲骰、輪不到她；隊友「協助」（醫療檢定）或被治療才醒；戰鬥結束仍昏迷的自動醒、1 血（wakeAfterBattle）。
// 昏迷時被打不會死也沒懲罰（敵人 AI 照舊不打倒地的）；四隻都昏迷＝輸（checkResult）。拿掉個別傳送。
function wakeAfterBattle(){
  const b = B(); if(!b) return;
  b.units.filter(u=>isPcCritter(u) && !u.dead && u.down).forEach(u=>{ u.hp = 1; u.down = false; blog(`${u.name}醒過來了（生命 1）`, "heal"); });
}

// ---------- 潛行與察覺（SRD 5.2 的躲藏；檢定直接用六圍，沒有技能熟練） ----------
// 能躲：站在草叢裡，或每隻看得到你的敵人跟你之間都有四分之三掩護（樹、篷車），而且旁邊沒有敵人
// 潛行：d20 + 敏捷 ≥ 13（SRD 是 15 含熟練 +2，這裡沒有熟練所以降 2）；穿重甲有劣勢。擲出來的數字＝別人要找到你的難度
// 沒過 13＝沒躲好（敵人開場躲著、劇情伏擊也一樣，不會被拉到 13）
// 躲好：敵人不能選你當目標；你攻擊有優勢，出手就現身；走出藏身處被看到、被察覺到也會現身
// 察覺（大爺 10-02 統一成 D&D）：回合開始時，自己移動格數內躲著的敵人，用被動感知（10＋感知，不擲骰）比他潛行擲的數字
//   想主動找就用「搜索」（免費動作，d20＋感知，6 格內躲著的一起找，js/battle/flow.js 的 doSearch）
const HIDE_DC = 13;
const isHid = u => !!has(u,"hidden");
// 敵對：雙方陣營不同、而且都不是 NPC。NPC（商人等）站在戰場上但不屬於任何一方，不能被當成目標、也不會攻擊人
// 玩家操作的單位：小傢伙、而且沒有失控（失控的由 AI 接手，10-10）
const playerControlled = u => !!u && u.side==="pc" && !u.frenzy;
// 我方的小傢伙（不含叫出來的坐騎 steed，10-20）：經驗、壓力、小筆記、熟練格、輸贏判定只算她們
const isPcCritter = u => !!u && u.side==="pc" && !u.steed;
const hostile = (a, b) => a.side!==b.side && a.side!=="npc" && b.side!=="npc" && inCombat(a) && inCombat(b);
const sideColor = v => v.side==="pc" ? v.color : v.side==="npc" ? "#c9b7a6" : "#e0766e";
// 探索地圖還沒看到過的敵人（大爺 10-21）：任何一隻毛毛看到過一次（察覺範圍＋視線，躲著的要被動感知贏）才畫、才列；開戰被叫進來的也算看到
const foeUnseen = u => !!(u.side==="foe" && !u.seen && !u.combatActive && B()?.explorationMap);
const foeHid = u => u.side==="foe" && (isHid(u) || foeUnseen(u));   // 玩家看不到的敵人
function markSeenFoes(){
  const b = B(); if(!b || !b.explorationMap) return;
  const pcs = b.phase==="explore" ? [exploreUnit()].filter(Boolean) : b.units.filter(u=>isPcCritter(u) && !u.dead && !u.down);
  let fresh = false;
  b.units.forEach(e=>{ if(e.side!=="foe" || e.seen) return;
    if(e.combatActive || e.dead || pcs.some(p=>exploreAware(p, e))){ e.seen = true; fresh = true; } });
  if(fresh) passivePocket();   // 第一次被看到才比被動感知（10-28：開場就比會把還沒看到的敵人寫進紀錄）
}
const nameFor = u => foeHid(u) ? "？？？" : u.name;
const watchers = u => B().units.filter(v=>!v.fled&&v.side!==u.side&&v.side!=="npc"&&u.side!=="npc"&&!v.down&&!v.dead&&!isHid(v)&&(!B().explorationMap||(dist(v,u)<=(v.side==="foe"?ENEMIES[v.type].detectRange:senseRange(v))&&exploreSight(v,u))));
const concealed = u => hidden(u) || watchers(u).every(v=>coverOf(v,u).v >= .75);
function hideBlock(u){                                           // 不能躲的原因；null＝可以躲
  if(isHid(u)) return "已經躲好了";
  if(watchers(u).some(v=>dist(v,u)<=1)) return "敵人就在旁邊";
  if(!concealed(u)) return "要在草叢裡或樹、篷車後面";
  return null;
}
function tryHide(u){
  const dis = !!(u.armor && u.armor.stealth), r1 = d20(), r2 = dis ? d20() : r1, r = Math.min(r1, r2);
  const total = r + u.mods.DEX, ok = total >= HIDE_DC;
  blog(`　潛行：d20=${r}${dis?`（重甲鏗鏘作響，劣勢 ${r1}/${r2}）`:""}${fmtN(u.mods.DEX)} = ${total} ${ok?"≥":"<"} ${HIDE_DC} → ${ok?"躲好了":"沒躲好"}`, ok?"skill":"miss", ok?"躲好了":"沒躲好");
  if(ok) addStatus(u, "hidden", {val:total, roll:r});
  return ok;
}
function reveal(u, why){
  if(!isHid(u)) return;
  u.statuses = u.statuses.filter(s=>s.k!=="hidden");
  if(why) blog(`　${u.name}${why}`, "skill");
  if(u.side==="foe") passivePocket();             // 躲著的敵人現身：這時才第一次被看到
}
// 看得到多遠（大爺 10-21）：沒躲著的東西，視線沒被擋就看 12 格（跟黑暗視覺一樣）；找躲著的人、陷阱、地上的東西還是照察覺範圍
const SIGHT_RANGE = 12;
const senseRange = u => Math.max(0, u.speed - (u.statuses.some(s=>s.k==="slowed" && !s.stop) ? 2 : 0));   // 察覺範圍＝移動速度
function perceive(u){
  groundDetect(u);
  B().units.filter(v=>hostile(v,u) && !v.dead && !v.down && isHid(v) && dist(u,v)<=senseRange(u)).forEach(v=>{
    const total = passivePer(u), need = has(v,"hidden").val, ok = total >= need;
    // 我方沒找到躲著的敵人時不寫紀錄，不然等於告訴玩家附近有東西
    if(ok || v.side==="pc") blog(`${u.name}察覺：被動感知 10${fmtN(u.mods.WIS)} = ${total} ${ok?"≥":"<"} ${need} → ${ok?`發現了${v.name}！`:`沒發現${v.name}`}`, ok?"skill":"miss", ok?"發現了！":"沒發現");
    if(ok){ panelStart(`${u.name}【察覺】`); stealthRow(v, u, true); panelEnd(); obsMark(u, "ok");
            reveal(v); fxFloat(v, POP_TEXT.spotted, "dmg"); sfx("alert"); }
  });
}
// ---------- 潛行對決的演出（大爺 10-02：DM 明著骰給你看）----------
// 骰子面板一列攤完：左邊躲的人擲的潛行骰，右邊找的人的被動感知（骰子停在 10，不滾）
// 一次比大小只佔一列（大爺 10-02：以前拆兩列，偷襲變三列把標題擠出畫面）
// 被找到：當場演（perceive）。沒被找到：什麼都不演，等躲的人自己出手時才補演（sneakShow），讓玩家看到「牠就是擲得比你高」
function stealthRow(h, p, ok){
  const s = has(h,"hidden"), roll = s.roll ?? s.val;
  // 列名用短的（手機上名字欄只放得下 3 個字）：誰躲看面板標題和紀錄，誰找寫在右邊的被動感知底下
  panelRow("chk", {id:h.id+"~hide", name:"潛行"}, [roll], roll, s.val, "hide").vs = {name:p.name, n:passivePer(p), res: ok ? "found" : "fail"};
}
// 從藏身處出手：在這個動作的骰子面板最前面補一列（潛行骰對對面最高的被動感知），對面每隻頭上跳 ?
// 補的那列往前挪，後面攻擊那列的時間跟平常一樣，不會比出手晚
function sneakShow(u){
  const s = has(u,"hidden");
  if(!s) return;
  const opp = B().units.filter(v=>hostile(v,u) && !v.dead && !v.down).sort((a,c)=>passivePer(c)-passivePer(a));
  if(!opp.length) return;
  stealthRow(u, opp[0], false);                    // 第一次 panelRow 才會開出這個動作的面板
  const p = B().panel, n = 1;
  p.rows.forEach(r=>r.t -= n*ROW_GAP); p.t0 -= n*ROW_GAP;
  // ? 馬上跳、很快收掉：出手後還可能有觀察學習的 ! ?，不要疊在一起
  opp.forEach(v=>(B().marks = B().marks || []).push({id:v.id, kind:"sneak", t:Date.now(), dur:OBS_DUR.sneak}));
  blog(`　${u.name}潛行 ${s.val}，比${opp.map(v=>`${v.name} ${passivePer(v)}`).join("、")}都高，沒人發現`, "miss");
}
// ---------- 感知：看穿敵人身上帶的東西（大爺 10-02，照 D&D）----------
// 被動感知＝10＋感知調整值，不擲骰：敵人第一次被看到時，小傢伙們各自跟 DC 比，夠高的就看穿
// 主動搜索＝d20＋感知：免費動作，6 格內看得到的敵人（js/battle/flow.js 的 doSearch）
// 敵人藏東西的 DC＝10＋敏捷調整值＋2（低階怪的熟練加值）
// 看穿了、或打倒之後，那隻的背包就能打開；整場戰鬥小傢伙們共用
const passivePer = u => 10 + u.mods.WIS;
const pocketDC = v => 10 + v.mods.DEX + 2;
const SEARCH_RANGE = 6;
const pocketKnown = v => v.side==="foe" && (v.dead || !!(B().pocketSeen||{})[v.id]);
function markPocket(v){ (B().pocketSeen = B().pocketSeen || {})[v.id] = true; }
function passivePocket(){
  const b = B(), pcs = b.units.filter(u=>isPcCritter(u) && !u.dead && !u.down);
  b.units.filter(v=>v.side==="foe" && !v.dead && !foeHid(v) && !pocketKnown(v)).forEach(v=>{
    const who = pcs.filter(u=>passivePer(u) >= pocketDC(v));
    if(!who.length) return;
    markPocket(v);
    blog(`${who.map(u=>u.name).join("、")}看穿了${v.name}身上帶的東西`, "skill");
    blog(`　被動感知 ${who.map(u=>`${u.name} ${passivePer(u)}`).join("、")} ≥ DC ${pocketDC(v)}`);
  });
}
// 有人走動之後：躲著的人如果被看到了（走出草叢或掩護、敵人繞到旁邊）就現身
function checkExposure(){
  B().units.forEach(u=>groundDetect(u));
  B().units.forEach(v=>{ if(isHid(v) && !v.dead && !v.down && (B().explorationMap?watchers(v).some(u=>exploreAware(u,v)):!concealed(v))) reveal(v, "被看到了，現身！"); });
}
// 災禍術：攻擊和豁免 −1d4，直到施法的薩滿倒下
const baned = u => { const s = has(u,"bane"); return !!(s && B().units.some(v=>v.id===s.src && !v.dead && !v.down)); };
const cur = () => B().units[B().turn];
// 面向目標（畫面上的左右）
function faceTo(u, t){ const sx = (t.y-t.x)-(u.y-u.x); if(sx) u.face = sx>0 ? 1 : -1; }   // 畫面 x＝y−x（10-21 左右對調）
// 動作與打中時間：施放技能時設定 B().impact，這段時間後傷害數字、受傷、特效才出現
const impactAt = () => Date.now() + (B().impact||0);

// ---------- 飛行物：弓弩射箭、投擲武器、法術光球 ----------
// 出手（DOLL_IMPACT）時從攻擊者手上飛出，飛到目標才算打中；回傳「打中時間」給 B().impact
const PROJ_OF = {shoot:"arrow", fire:"bullet", throw:"thrown", cast:"magic"};
// thing：丟出去的物品（道具）；沒給而且是投擲動作，就用手上的武器
function launch(a, t, k, delay=0, thing=null){
  const b = B(), release = DOLL_IMPACT[k] || 0, kind = PROJ_OF[k];
  const isPoint = t && t.x!==undefined && !t.side;           // 範圍法術點地板
  const foeTarget = t && t.side && hostile(t,a);
  if(!kind || !t || t===a || !(foeTarget || isPoint)) return release + delay;
  const flight = 450;                                         // 飛行時間固定 0.45 秒（大爺：原本 1 秒太慢）
  const glow = GLOW[(a.focus && groupOf(a.focus) || {}).id] || "#b9a0ff";
  const throwArt = kind==="thrown" ? projArtKey(thing || a.weapon) : null;
  (b.proj = b.proj || []).push({kind, fx:a.x, fy:a.y, tx:t.x, ty:t.y, face:a.face||1, t:Date.now()+release+delay, dur:kind==="bullet" ? 160 : flight, glow, art:throwArt});
  if(kind==="bullet"){   // 開槍：先瞄準（目標身上出現瞄準圈），槍口火光＋白煙（10-03）；子彈飛很快
    (b.fx = b.fx || []).push({x:t.x, y:t.y, kind:"aim", t:Date.now()+delay, dur:release+120});
    (b.fx = b.fx || []).push({x:a.x, y:a.y, kind:"smoke", face:a.face||1, t:Date.now()+release+delay, dur:1300});
    b.impactEnd = Math.max(b.impactEnd||0, Date.now() + release + delay + 160);
    return release + delay + 160;
  }
  b.impactEnd = Math.max(b.impactEnd||0, Date.now() + release + delay + flight);
  return release + delay + flight;
}
function fxHit(t, kind){ (B().fx = B().fx || []).push({x:t.x, y:t.y, kind, t:impactAt()}); }
const FX_OF_TYPE = {"寒冷":"spark", "閃電":"spark", "毒素":"spark", "揮砍":"slash", "穿刺":"pierce", "鈍擊":"burst", "火焰":"fire", "力場":"spark", "光耀":"spark", "流血":"pierce", "強酸":"spark", "死靈":"spark"};
// 戰鬥紀錄：t 全文（開頭全形空白＝細節），cls 顏色，s 給縮小條用的短結果（例如「命中」「8 點穿刺」）
// at：這行在畫面上成立的時間（打中那一刻）。縮小條、紀錄面板到了這個時間才顯示，骰子還在滾時不會先劇透結果
function blog(t, cls="", s=""){ B().log.push({t, cls, s, at: Date.now() + (B().impact||0)}); if(B().log.length>400) B().log.shift(); }
const logDue = l => !l.at || l.at <= Date.now() + 30;

// ---------- 狀態效果 ----------
// {k, src, via, until:"start"|"end"|"battle", of:unitId, val, left}
// via＝哪一種來源（同一個狀態可能由不同招式造成，例如束縛有網子、擒抱）；同狀態＋同來源＋同 via 才互相取代
function addStatus(u, k, o={}){ u.statuses = u.statuses.filter(s=>!(s.k===k && s.src===o.src && s.via===o.via)); u.statuses.push({k, visualAt:impactAt(), ...o}); }
const has = (u,k) => u.statuses.find(s=>s.k===k);

// ---------- 專注（SRD 5.2，大爺 10-03）----------
// 同時只能專注一個法術；再開一個專注法術，前一個就結束。受傷要過體質豁免 DC＝傷害的一半（最少 10、最多 30），
// 失敗、倒下就中斷，這個法術掛在別人身上的效果（src＝施法者）全部消失。專注法術：祝福術、災禍術、狩印
const CONC_EFFECTS = ["blessed", "bane", "marked"];
const concOf = u => has(u, "conc");
function startConc(u, key, name){ endConc(u, concOf(u) ? "改專注別的法術" : ""); addStatus(u, "conc", {key, name}); }
function endConc(u, why){
  const c = concOf(u); if(!c) return;
  u.statuses = u.statuses.filter(s=>s.k!=="conc");
  B().units.forEach(v=>{ v.statuses = v.statuses.filter(s=>!(CONC_EFFECTS.includes(s.k) && s.src===u.id)); });
  if(why) blog(`　${u.name}的專注中斷（${why}）：【${c.name}】的效果消失了`, "miss");
}
function concCheck(t, n){
  if(!concOf(t) || t.hp<=0 || t.dead) return;
  const dc = Math.min(30, Math.max(10, Math.floor(n/2)));
  blog(`　${t.name}受傷，要維持專注：`);
  if(!saveRoll(t, "CON", dc)) endConc(t, "受傷沒撐住");
}
const hasVia = (u,k,via) => u.statuses.find(s=>s.k===k && s.via===via);
// left＝還要多撐幾輪（升階「多 1 輪」）：時間到了先扣 left，扣完才拿掉；守護那種每輪擋一次的，新的一輪重新能擋
function expire(when, unitId){
  B().units.forEach(u=> u.statuses = u.statuses.filter(s=>{
    if(!(s.until===when && s.of===unitId)) return true;
    if(s.left > 0){ s.left--; s.spent = false; return true; }
    return false;
  }));
}

// ---------- 數值 ----------
function acOfUnit(u){
  let ac;
  if(u.side!=="pc" || u.steed) ac = u.baseAc;                 // 敵人、NPC 的 AC 照屬性表
  else if((has(u,"mageArmor") || passiveSkills(u).some(s=>s.key==="mage_armor")) && (!u.armor || u.armor.cloth)) ac = 13 + u.mods.DEX + (u.shield?2:0);
  else ac = armorAC(u.armor, u.shield, u.mods.DEX);   // 身上現在穿的（戰鬥中可以換裝）
  // 破甲（含劈盾）：同名不疊加，取降最多的；破甲升階每高一階再 −1；劈盾那種只在有拿盾時算
  ac -= u.statuses.filter(s=>s.k==="acDown" && (!s.shield || u.shield)).reduce((m,s)=>Math.max(m, 2 + (s.n||0)), 0);
  if(has(u,"shieldSpell")) ac += 5;
  if(mealOf(u)==="berry") ac += 1;   // 露營料理：野莓派（10-10）
  return ac;
}
// 武器用哪個屬性：彈藥武器用敏捷；靈巧取高；其餘用力量
function weaponStat(u){
  const w = u.weapon; if(!w) return u.natural?.stat || "STR";   // 怪物天生攻擊（10-10）
  if((w.props||[]).some(p=>p.startsWith("彈藥"))) return "DEX";
  if((w.props||[]).includes("靈巧")) return u.mods.DEX>u.mods.STR ? "DEX" : "STR";
  return "STR";
}
function weaponDie(u){
  if(!u.weapon) return null;
  const v = (u.weapon.props||[]).find(p=>p.startsWith("多用"));
  if(v && !u.shield) return v.split(" ")[1];      // 沒拿盾就雙手握，用多用傷害骰
  return u.weapon.dmg.split(" ")[0];
}
const dmgType = u => u.weapon ? u.weapon.dmg.split(" ")[1] : u.natural ? u.natural.dmg.split(" ")[1] : "鈍擊";
const reachOf = u => u.weapon && (u.weapon.props||[]).includes("觸及") ? 2 : 1;
function rangeOf(u){        // 遠程或投擲的射程（格）
  if(!u.weapon) return 0;
  const r = (u.weapon.props||[]).find(p=>p.startsWith("彈藥")||p.startsWith("投擲"));
  return r ? Math.floor(+r.split(" ")[1].split("/")[0]/5) : 0;
}
const isRanged = u => !!(u.weapon && (u.weapon.props||[]).some(p=>p.startsWith("彈藥")));
const spellStat = u => ["INT","WIS","CHA"].reduce((best,k)=>(u.mods[k]||0)>(u.mods[best]||0)?k:best,"INT");
const dcOf = (u, stat) => 8 + 2 + u.mods[stat] + (u.scaleHit||0);   // 浮動（10-29）

// ---------- 攻擊與傷害 ----------
function saveRoll(t, stat, dc, source=null){
  const frz = stat==="DEX" && !!has(t,"frozen");      // 凍結：敏捷豁免有劣勢
  let r1 = d20(), r2 = frz ? d20() : null;
  let r = frz ? Math.min(r1, r2) : r1, bonus = (t.mods[stat]||0)+(stat==="DEX"&&source?coverAC(coverOf(source,t)):0)+(mealOf(t)==="soup"?1:0), extra = 0;   // 香草湯：豁免 +1
  B()._noCap = true;                               // 祝福、災禍的 1d4 不是傷害骰
  if(has(t,"blessed")) extra = rollDice("1d4").total;
  const bane = baned(t) ? rollDice("1d4").total : 0;
  B()._noCap = false;
  let total = r + bonus + extra - bane;
  let ok = total >= dc;
  if(!ok && luckHook(t, "豁免", {r, total, dc, stat})){ r1 = d20(); r2 = frz ? d20() : null; r = frz ? Math.min(r1, r2) : r1; total = r + bonus + extra - bane; ok = total >= dc; }   // 好運
  panelRow("save", t, frz ? [r1, r2] : [r], r, total, ok ? "save" : "fail");   // 骰子面板：豁免一列
  blog(`　${t.name} ${ABILITIES.find(a=>a.k===stat).n}豁免：d20=${r}${frz?`（凍結劣勢 ${r1}/${r2}）`:""}${fmtN(bonus)}${extra?` +祝福${extra}`:""}${bane?` −災禍${bane}`:""} = ${total} ${ok?"≥":"<"} DC ${dc} → ${ok?"成功":"失敗"}`, ok?"":"hit", `${t.name}${ok?"擋住了":"豁免失敗"}`);
  return ok;
}
const fmtN = n => n>=0 ? ` +${n}` : ` −${-n}`;

// ---------- 骰子面板（參考索拉塔）：戰場上方中央，攻擊骰＋傷害骰 ----------
// 每個動作一個面板（招式、丟道具、戰技；藉機攻擊這種動作外的擲骰各自一個），每次擲骰一列：
//   攻擊列：d20 → 大字總和（HIT 綠／MISS 灰／CRITICAL! 金／擲出 1 紅）；命中才有傷害骰，比 d20 晚 0.25 秒開始滾（不用等 d20 演完）
//   豁免列：d20 → 大字總和（SAVE／FAIL），這個目標受的傷害（例如燃燒之手）也記在同一列
// 先擲骰、再出招：用招式時 d20 先滾 DICE_TUMBLE 停住，角色 DICE_LEAD 才開始動作
// 動作外的擲骰（藉機攻擊、反擊、阻截）沒有先擲的時間，面板直接在打中那一刻顯示結果
// 停留（大爺定的）：不看秒數，一直留著，直到下一次擲骰換掉、我方按待機結束回合、或點一下面板收起來
const DICE_TUMBLE = 550, DICE_LEAD = 650, DMG_OFF = 250, ROW_GAP = 150;
// 動作開始：記下標題（「嬌嬌【斬擊】」）；真的有擲骰才換掉上一個面板，補血、舉盾這種不擲骰的不會把上一個清掉
function panelStart(label){ const b = B(); b.act = {label, t0:Date.now()}; b._pend = []; }
function panelEnd(){ const b = B(); b.act = null; b._pend = []; }
function panelRow(kind, t, rolls, used, total, res, a){
  const b = B(), now = Date.now();
  if(b.act && (!b.panel || b.panel.act !== b.act)){ // 這個動作第一次擲骰：開新面板
    b.panel = {label: b.act.label, t0: b.act.t0, rows:[], act: b.act};
  } else if(!b.act){                                // 動作外的擲骰（藉機攻擊、反擊、阻截）：自己一個面板，直接在打中那一刻落定
    b.panel = {label: a ? `${a.name}攻擊` : `${t.name}豁免`, t0: impactAt() - DICE_TUMBLE, rows:[], act:null};
    b._pend = [];
  }
  b.panelHidden = false;                            // 有新的擲骰：之前點掉的也重新出現
  const p = b.panel, i = p.rows.length;
  const row = {kind, tid:t.id, tname:t.name, rolls, used, total, res, faces:[], t: p.t0 + Math.min(i, 3)*ROW_GAP,
               flick:[0,1,2].map(()=>1 + Math.floor(Math.random()*20))};
  p.rows.push(row);
  return row;
}

// 攻擊擲骰：回傳 {hit, crit}
// 誰會守護 t：同陣營、帶守護、拿盾、沒倒、1 格內、這一輪還沒守護過 t（每輪＝守護者自己回合開始重置）
function guardOf(t){
  return B().units.find(g=>g!==t && g.side===t.side && !g.dead && !g.down && dist(g,t)<=1 && !(g.guarded||{})[t.id]
    && (g.shield || g.offhand2?.type==="shield") && passiveSkills(g).some(s=>s.key==="shield_guard"));
}
function attackRoll(a, t, o={}){
  let adv = 0;
  const melee = !o.ranged;
  B().meleeBy = melee ? {a:a.id, t:t.id} : null;   // 敲暈（10-21）：記住這一擊是不是近戰，hurt 歸零時看
  if(o.adv) adv++;
  if(o.dis) adv--;
  if(has(t,"prone")) adv += melee ? 1 : -1;
  if(has(a,"prone")) adv--;
  if(has(a,"aiming")) { adv++; a.statuses = a.statuses.filter(s=>s.k!=="aiming"); }   // 瞄準：這回合第一次攻擊優勢（用掉就沒）
  if(has(a,"sapped")) { adv--; a.statuses = a.statuses.filter(s=>s.k!=="sapped"); }   // 削弱：下次攻擊劣勢（用掉就沒）
  if(has(a,"poisoned")) adv--;                                         // 中毒：攻擊有劣勢
  if(passiveSkills(a).some(s=>s.key==="pack_tactics") && B().units.some(v=>v!==a && !hostile(v,a) && v.side===a.side && !v.dead && !v.down && dist(v,t)<=1)) adv++;   // 圍毆（10-21，SRD）
  if(passiveSkills(a).some(s=>s.key==="sun_sensitive") && (!B().def.lighting || B().def.lighting==="bright" || lightAt(a.x,a.y)==="bright" || lightAt(t.x,t.y)==="bright")) adv--;   // 怕陽光（10-21）：自己或目標在亮處
  if(B().def.lighting && B().def.lighting!=="bright"){                 // 黑暗（10-21，SRD）：看不見目標＝劣勢；目標看不見你＝優勢
    if(lightVision(a,t)==="blind") adv--;
    if(lightVision(t,a)==="blind") adv++; }
  // 閃避：打他有劣勢。守護給的閃避只擋第一次（用掉就沒），守護的人要還站在他旁邊
  { const dg = t.statuses.filter(s=>s.k==="dodge"), once = dg.filter(s=>s.once && !s.spent);
    let dis = dg.some(s=>!s.once);
    if(once.length){ once.forEach(s=>{ s.spent = true; }); t.statuses = t.statuses.filter(s=>!(once.includes(s) && !(s.left > 0)));   // 守護升階：這一輪擋過了，下一輪再擋
      const by = once.map(s=>B().units.find(v=>v.id===s.by)).find(v=>v && !v.down && !v.dead && dist(v,t)<=1);
      if(by){ dis = true; sfx("shield_block", B().impact||0); blog(`　${by.name}守護著${t.name}！（攻擊劣勢）`, "skill"); } }
    if(dis) adv--; }
  // 戰士風格：守護（大爺 10-09）：拿盾、周圍 1 格內的隊友（不含自己），每輪每人第一次被攻擊那一下劣勢
  { const g = guardOf(t); if(g){ (g.guarded ||= {})[t.id] = true; adv--; sfx("shield_block", B().impact||0); blog(`　${g.name}守護著${t.name}！（攻擊劣勢）`, "skill"); } }
  // 協助：下次攻擊優勢（困擾給的協助只對那個目標）
  const help = a.statuses.find(s=>s.k==="helped" && (!s.target || s.target===t.id));
  if(help){ adv++; a.statuses = a.statuses.filter(s=>s!==help); }
  if(o.ranged && !o.pointBlank && B().units.some(u=>hostile(u,a) && !u.down && !u.dead && !isHid(u) && dist(u,a)===1)) adv--;   // 貼身射擊劣勢（近射不算）
  const hideTxt = o.ranged && hidden(t) ? `${t.name}躲在草叢裡` : "";
  if(hideTxt) adv--;
  const sneak = isHid(a) ? `${a.name}從藏身處偷襲` : "";
  if(sneak) adv++;
  const mate = melee ? flankMate(a, t) : null;
  const flankTxt = mate ? `和${mate.name}夾擊${t.name}` : "";
  if(flankTxt) adv++;
  // 束縛（網子、擒抱）：打他有優勢、他攻擊有劣勢
  if(has(t,"restrained")) adv++;
  if(has(a,"restrained")) adv--;
  adv += frenzyAdv(a, t);   // 失控：嬌嬌魯莽打擊、默默高等隱形（stress.js）
  let r1 = d20(), r2 = d20();
  let r = adv>0 ? Math.max(r1,r2) : adv<0 ? Math.min(r1,r2) : r1;
  const bonus = (o.bonus||0) + (a.scaleHit||0);   // 浮動：等級高的怪物命中加值（10-29）
  B()._noCap = true;                               // 祝福、災禍的 1d4 不是傷害骰
  const bless = has(a,"blessed") ? rollDice("1d4").total : 0;
  const bane = baned(a) ? rollDice("1d4").total : 0;
  B()._noCap = false;
  let total = r + bonus + bless - bane;
  let ac = acOfUnit(t);
  const cov = coverOf(a, t), covAC = coverAC(cov);
  ac += covAC;
  let hit = r===20 || (r!==1 && total >= ac);
  // 好運：小傢伙攻擊沒中 → 問要不要重擲（優劣勢照舊兩顆取一）
  if(!hit && luckHook(a, "攻擊", {r, total, ac})){ r1 = d20(); r2 = d20(); r = adv>0 ? Math.max(r1,r2) : adv<0 ? Math.min(r1,r2) : r1; total = r + bonus + bless - bane; hit = r===20 || (r!==1 && total >= ac); }
  // 反應（大爺 10-09）：敵人命中小傢伙、她有保留的免費動作與反應技能時，暫停問玩家（見 reactionHook）
  const react = reactionHook(a, t, {r, total, ac});
  if(react==="shield"){ ac += 5; hit = r===20 || (r!==1 && total >= ac); }
  panelRow("atk", t, adv ? [r1, r2] : [r1], r, total, r===20 ? "crit" : hit ? "hit" : r===1 ? "fumble" : "miss", a);   // 沒中就不會擲傷害骰
  if(hit && r===20){ critMoment(t); stressOnCrit(a, t); funNote("crit", a, {t:t.name}); }
  if(r===1) funNote("fumble", a, {t:t.name});   // 戰後閒聊的笑點（10-11）
  // 狩印：打中自己標記的目標，這一擊多 1d6 力場（爆擊骰加倍）；傷害在 hurt 裡補上
  if(hit && t.statuses.some(s=>s.k==="marked" && s.src===a.id)) B().markHit = {a:a.id, t:t.id, crit:r===20};
  const advTxt = adv>0?`（優勢 ${r1}/${r2}）`:adv<0?`（劣勢 ${r1}/${r2}）`:"";
  if(!hit){ fxFloat(t, POP_TEXT.miss, "miss"); sfx("miss", B().impact||0); }
  const why = [sneak ? sneak+"（優勢）" : "", flankTxt ? flankTxt+"（優勢）" : "", covAC ? `${cov.by}擋著，${coverName(cov)} AC +${covAC}` : "", hideTxt ? hideTxt+"（劣勢）" : ""].filter(Boolean).join("；");
  if(why) blog(`　（${why}）`);
  blog(`　d20=${r}${advTxt}${fmtN(bonus)}${bless?` +祝福${bless}`:""}${bane?` −災禍${bane}`:""} = ${total} ${total>=ac?"≥":"<"} AC ${ac} → ${r===20?"爆擊！":hit?"命中":r===1?"大失手":"沒打中"}`, hit?"hit":"miss",
       r===20 ? "爆擊！" : hit ? "命中" : r===1 ? "大失手" : "沒中");
  if(sneak) reveal(a, "出手，現身了！");
  if(!hit) triggerCounterattack(t, a);
  return {hit, crit: r===20};
}

// ---------- 反應：保留免費動作（大爺 10-09） ----------
// 自己回合沒用完的免費動作留到敵人回合（u.reserveFree，endTurn 存、自己 beginTurn 清）。
// 敵人攻擊命中小傢伙、她有可用的反應時：整個敵方招式在快照上「先跑一次」，命中那刻丟出 REACT_PAUSE，
// 戰場還原成快照、跳出詢問；玩家選完用同一組骰子重跑，到同一次命中套上選擇（見 flow.js 的 foeSkillWithReactions）。
let REACT_RUN = null;   // {answers:[...], n:第幾次可反應的命中}
const REACT_SHIELD = "shield_spell", REACT_HALVE = "turn_danger";
function reactOptions(t){
  if(!t || t.side!=="pc" || t.frenzy || t.down || t.dead || !(t.reserveFree>0)) return [];   // 失控的 AI 接手，不問
  const out = [];
  const sh = activeLearnedSkills(t).find(s=>s.key===REACT_SHIELD);
  if(sh && !has(t,"shieldSpell") && tiersFor(t, sh).length && !componentProblem(t, sh)) out.push("shield");
  if(passiveSkills(t).some(s=>s.key===REACT_HALVE)) out.push("halve");
  return out;
}
// ---------- 好運（毛球族天生，大爺 10-09） ----------
// 每次長休後 2 顆；小傢伙的攻擊、豁免 d20 失敗時問要不要花 1 顆重擲、用新結果；用完不再問。
// 跟反應共用「快照重跑」：問的那刻丟出暫停，選完同一組骰子重跑到同一個地方。重跑中用掉的先記在 REACT_RUN.luck，
// 整個招式跑完才寫進 state.luckUsed（不然暫停、重跑會重複扣）。只在招式裡問（doSkill）；藉機攻擊、潛行等招式外的擲骰還不問（暫定）。
const LUCK_MAX = 2;
const luckLeft = u => isPcCritter(u) && !u.frenzy ? Math.max(0, LUCK_MAX + (mealOf(u)==="mushroom"?1:0) - ((state.luckUsed||{})[u.id]||0) - ((REACT_RUN?.luck||{})[u.id]||0)) : 0;
// 檢定也能用好運（10-20）：擲 d20＋調整值，沒過 DC 就問要不要花好運重擲；回傳最後採用的那次
function checkRoll(u, kind, mod, dc){
  let r = d20(), total = r + mod;
  if(total < dc && luckHook(u, kind, {r, total, dc})){ r = d20(); total = r + mod; }
  return {r, total, ok: total >= dc};
}
function luckHook(u, kind, info){
  if(!REACT_RUN || luckLeft(u)<=0) return false;
  const idx = REACT_RUN.n++, ans = REACT_RUN.answers[idx];
  if(ans===undefined) throw {reactPause:true, info:{luck:true, t:u.id, kind, left:luckLeft(u), ...info}};
  if(ans!=="luck") return false;
  REACT_RUN.luck[u.id] = (REACT_RUN.luck[u.id]||0) + 1; funNote("luck", u);
  blog(`　${u.name}用了一顆好運骰重擲！（剩 ${luckLeft(u)}）`, "skill", "好運！"); sfx("pop", B().impact||0);
  return true;
}
function reactionHook(a, t, roll){
  if(!REACT_RUN || !a || a.side!=="foe" || !t || t.side!=="pc") return null;
  const hit = roll.r===20 || (roll.r!==1 && roll.total >= roll.ac);
  if(!hit) return null;
  const opts = reactOptions(t); if(!opts.length) return null;
  const idx = REACT_RUN.n++, ans = REACT_RUN.answers[idx];
  if(ans===undefined) throw {reactPause:true, info:{a:a.id, t:t.id, r:roll.r, total:roll.total, ac:roll.ac, opts}};
  if(ans==="shield" && opts.includes("shield")){
    const sh = activeLearnedSkills(t).find(s=>s.key===REACT_SHIELD);
    t.reserveFree--; spendSlot(t, sh, lowestTier(t, sh));
    addStatus(t, "shieldSpell", {until:"start", of:t.id});
    blog(`　${t.name}施放護盾術！AC +5（${roll.ac} → ${roll.ac+5}）`, "skill", "護盾術！"); sfx("shield_block", B().impact||0);
    return "shield";
  }
  if(ans==="halve" && opts.includes("halve")){
    t.reserveFree--; t.halveFrom = a.id;
    blog(`　${t.name}化險：這次傷害減半`, "skill", "化險！");
    return "halve";
  }
  return null;
}

// 被動反擊：任何需要擲攻擊骰的敵方攻擊未命中，都能觸發一次正常攻擊。
// 反擊本身仍走 attackRoll，所以能和其他攻擊型技能互動，也能在失手時觸發對方的反擊。
function triggerCounterattack(t, a){
  if(!t || !a || t.dead || t.down || t.surprised || a.dead || a.down || !hostile(t,a)) return;
  if(!passiveSkills(t).some(s=>s.key==="counterattack")) return;
  const w=t.weapon;
  if(w && w.type!=="weapon") return;
  const range=w ? (isRanged(t)?rangeOf(t):reachOf(t)) : 1;
  if(dist(t,a)>range) return;
  if(w && ammoKind(w) && !hasAmmoFor(t)) return;
  blog(`　${t.name}抓住失手的空檔，反擊！`, "skill");
  faceTo(t,a);
  weaponAttack(t,a,{});
}

// 擲傷害：dice 可加倍（爆擊）
function dmgRoll(dice, mod, crit, extraDice=0){
  const m = dice.match(/^(\d+)d(\d+)$/);
  let n = +m[1] + extraDice; if(crit) n *= 2;
  return Math.max(0, rollDice(`${n}d${m[2]}`).total + mod);
}

// SRD 5.2.1 p17：同類抗性只減半一次、向下取整；傷害免疫優先。
// 使用原始傷害類型（穿刺等），不能用介面合併顯示的「物理」判斷。
function damageAfterResistance(t, n, type){
  n = Math.max(0, n);
  if((t.damageImmunities||[]).includes(type)) return 0;
  const m = [...(t.resistances||[]),...itemResistances(t)].includes(type) ? Math.floor(n/2) : n;
  return (t.vulnerabilities||[]).includes(type) ? m*2 : m;   // 易傷（SRD，10-20）：抗性之後再加倍
}
function hurt(t, n, type, src, hitSfx){
  if(t.worldObject){if(n>0&&!t.dead){t.dead=true;explodeBarrel(t.worldObject,src);}return;}
  if(n>0&&src?.side==="pc"&&t.side==="foe")engageExploreSquad(t,src);
  if(n>0 && src?.scaleDmg) n += src.scaleDmg;   // 浮動：等級高的怪物傷害加值（10-29）
  const raw = Math.max(0, n); n = damageAfterResistance(t, raw, type);
  if(raw>n && !t.down && !t.dead) blog(`　${t.name}的${dmgShown(type)}${(t.damageImmunities||[]).includes(type)?"免疫":"抗性"}：${raw} → ${n}`, "skill");
  if(raw<n && !t.down && !t.dead) blog(`　${t.name}怕${dmgShown(type)}（易傷）：${raw} → ${n}`, "skill");
  { const em = B().empower; if(em && src && src.id===em.by && n>0 && !em.hit.has(t.id)){ em.hit.add(t.id); n += em.bonus; blog(`　強化：+${em.bonus}`, "skill"); } }   // 法師風格：強化（戲法傷害加施法屬性）
  if(t.halveFrom && src && src.id===t.halveFrom && n>0){ const h=Math.floor(n/2); blog(`　化險：${n} → ${h}`, "skill"); n=h; }   // 化險：這次敵方招式的傷害減半（招式結束清掉）
  { const b = B(), row = b.panel && [...b.panel.rows].reverse().find(r=>r.tid===t.id);   // 骰子面板：傷害算給這個目標最近的那一列，連同剛擲的骰（0 點也算）
    if(row){ row.dmg = (row.dmg||0) + Math.max(0, n); row.type = type; row.faces.push(...(b._pend||[])); }
    b._pend = []; }
  if(n<=0 || t.down || t.dead) return;
  t.hp = Math.max(0, t.hp - n);
  if(t.hp===0) undeadFortitude(t, n, type);   // 殭屍：不死韌性（10-10，monster.js）
  reveal(t);
  if(type==="火焰" && has(t,"frozen")){ t.statuses = t.statuses.filter(s=>s.k!=="frozen"); blog(`　${t.name}被火一烤，解凍了！`, "skill"); }
  blog(`　${t.name}受到 ${n} 點${dmgShown(type)}傷害（${t.hp}/${t.maxHp}）`, "dmg", `${n} 點${dmgShown(type)}`);   // 揮砍、穿刺、鈍擊都顯示成物理（音效、特效照舊分）
  fxFloat(t, `-${n}`, "dmg");
  t.anim = {k:"hurt", t:impactAt()};
  fxHit(t, FX_OF_TYPE[type] || "burst");
  const at = B().impact||0;
  const sound = hitSfx===false ? null : (hitSfx || HIT_SFX[type] || "hit_blunt");
  if(sound) sfx(sound, at); sfx(t.side==="pc" ? "ouch_pc" : "ouch_foe", at);
  // 火焰護盾：近戰打中你的人受 1d6
  if(src && hostile(src,t) && has(t,"fireShield") && dist(src,t)<=1){
    const f = rollDice(`${1 + (has(t,"fireShield").n||0)}d6`).total;   // 升階：每高一階多 1d6（反燒的骰給攻擊者，沒有他的列就丟掉）
    blog(`　火焰護盾反燒 ${src.name}！`, "skill"); hurt(src, f, "火焰", null);
  }
  chickenOnHurt(t);   // 異界雞半血變回惡魔原形（10-23）
  if(t.hp>0) concCheck(t, n);
  else endConc(t, "倒下了");
  // 已經倒下的再被打（例如普攻打死後狩印、偷襲的追加傷害）不再觸發一次倒下：紀錄、音效、台詞只算一次（大爺 10-11 回報哥布林吐槽兩次）
  if(t.hp===0 && !(t.side==="foe" ? t.dead : t.down)){
    if(t.side==="foe" && t.type==="death_knight") dkRepel(t, at);   // 死亡騎士不會死、不會被敲暈（大爺 10-23）
    else if(t.side==="foe" && t.type==="chicken_demon") chickenRepel(t, at);   // 惡魔也是重要角色（失蹤的雞，10-23）
    else if(t.side==="foe" && t.type==="vampire") graveVampireRepel(t, at);    // 女吸血鬼：委託、墓地同一隻，化成蝙蝠飛走（10-28）
    else if(t.side==="foe" && t.type==="red_wyrmling") wyrmRepel(t, at);      // 紅龍幼龍：紅龍夫人的女兒，哭著飛走（10-28）
    else if(t.side==="foe" && koApplies(src, t)){ t.dead = true; t.ko = true; t.koBy = src.id; t.koType = type; t.deadAt = impactAt(); blog(KO_UI.knocked(t.name, src.name), "kill"); sfx("down", at + 250); }
    else if(t.side==="foe"){ t.dead = true; t.deadAt = impactAt(); blog(`${t.name}倒下了！`, "kill"); sfx("poof", at + 300);
      if(src && !B().units.some(v=>v.side==="foe" && !v.dead && !v.down && !v.fled)) funNote("lastKill", src, {t:t.name}); }
    else { t.down = true; t.statuses = []; funNote("down", t); blog(t.pet ? `${t.name}${OWLBEAR_STORY.pet.down}` : t.steed ? `${t.name}${MOUNT_UI.bones}` : t.side==="pc" ? `${t.name}昏迷了……` : `${t.name}倒下了……`, "kill"); sfx("down", at + 250); if(t.frenzy){ t.frenzy = null; t.svgMood = stressMood(t); } }
    stressOnDown(t, src); if(t.side==="pc") loseMeal(t);   // 生命歸零：料理效果消失
    checkGrapples(); checkMounts();
    if(t.side==="foe") owlbearOnDown(t, src);        // 梟熊寶寶劇情（10-21，js/owlbear-story.js）
    barkOn("down", t, at + 700);                     // 戰鬥台詞：倒下的 X_X 演完再講
    // 看得到的敵人全倒、還有躲著的（大爺 10-02）：小傢伙們覺得怪怪的，提示玩家去搜索。不講位置、不講是誰
    const b = B();
    if(t.side==="foe" && !b.units.some(v=>v.side==="foe" && !v.dead && !v.down && !foeHid(v))
       && b.units.some(v=>foeHid(v) && !v.dead && !v.down)) barkOn("hunch", t, at + 700 + BARK_MS);
  }
  // 狩印的追加傷害：同一擊打中、目標還站著才補
  const mh = B().markHit;
  if(mh && src && mh.a===src.id && mh.t===t.id){ B().markHit = null;
    if(!t.dead && !t.down){ const m = rollDice(mh.crit ? "2d6" : "1d6").total; blog(`　狩印追加：`, "skill"); hurt(t, m, "力場", null); } }
}
// 敲暈（大爺 10-21，SRD）：小傢伙打開「敲暈」開關，用近戰攻擊把敵人打到 0 血 → 牠昏過去、不會死。
// 遠程、法術、豁免型的傷害不算；失控時 AI 接手，不管開關。被敲暈的照「打倒」算：經驗、背包、輸贏都一樣，只是畫成躺著、不消失
const koOn = u => !!(isPcCritter(u) && state.knockout && state.knockout[u.id]);
const koApplies = (src, t) => !!(src && koOn(src) && !src.frenzy && B().meleeBy && B().meleeBy.a===src.id && B().meleeBy.t===t.id);
function heal(t, n){
  B()._pend = [];                                   // 補血的骰不是傷害骰
  n = Math.max(0, n);                         // 補血不會變成扣血
  const was = t.down, before = t.hp;
  t.hp = Math.min(t.maxHp, t.hp + n); if(t.hp>0){ t.down = false; }   // 被治療就醒（昏迷）
  if(t.hp>before) sfx("heal", B().impact||0);
  blog(`　${t.name}恢復 ${n} 點生命（${t.hp}/${t.maxHp}）${was?"，重新站起來了！":""}`, "heal", `${t.name} +${n}`);
  fxFloat(t, `+${n}`, "heal");
  fxHit(t, "heal");
}

// ---------- 擒抱（SRD 5.2） ----------
// 被抓住＝束縛（via:"grapple"，src＝抓他的人）：不能移動、打他有優勢、他攻擊有劣勢；一直持續到掙脫、抓的人倒下或兩人不相鄰。抓的人移動時拖著走，移動花費加倍。
// 體型（SRD 5.2，大爺 10-20）：擒抱、推開、推倒只能對「最多比自己大一級」的目標。佔格看下面的佔格段。
// 小傢伙們照毛球族（小型）；敵人照 ENEMIES 的 size，沒寫的是中型
const SIZES = ["微型","小型","中型","大型","巨型","超巨型"];
const sizeOf = u => isPcCritter(u) ? RACE.size : ((ENEMIES[u.type]||{}).size || "中型");
const sizeFits = (u, t) => SIZES.indexOf(sizeOf(t)) <= SIZES.indexOf(sizeOf(u)) + 1;
const grappled = t => hasVia(t,"restrained","grapple");
const grapplerOf = t => { const s = grappled(t); return s && B().units.find(v=>v.id===s.src); };
const victimsOf = u => B().units.filter(v=>!v.dead && (grappled(v)||{}).src===u.id);
// 能不能擒抱：拿雙手武器不行（敵我都一樣）；其餘要有一隻手空著（主手武器、盾、法器各佔一隻手）
const holdsTwoHanded = u => !!(u.weapon && u.weapon.props && u.weapon.props.includes("雙手"));
const freeHand = u => !holdsTwoHanded(u) && ((u.weapon?1:0) + (u.shield?1:0) + (u.offhand?1:0) + (u.focus?1:0) + (u.torch?1:0)) < 2;   // 火把也佔一隻手（10-21）
// 擒抱期間（抓人的、被抓的都算）不能用雙手武器
const inGrapple = u => !!grappled(u) || victimsOf(u).length > 0;
const twoHandLocked = u => holdsTwoHanded(u) && inGrapple(u);
// 這招是不是雙手武器給的
const fromTwoHanded = (u, sk) => !!(sk.def.turnLimit!=="offhand" && !sk.def.components && u.weapon && holdsTwoHanded(u) && groupOf(u.weapon)===sk.group);
function releaseGrapple(t, why){
  const g = grapplerOf(t);
  t.statuses = t.statuses.filter(s=>!(s.k==="restrained" && s.via==="grapple"));
  if(why) blog(`　${t.name}${why}`, "skill");
}
// ---------- 佔格（大爺 10-20，SRD）：大型 2×2、巨型 3×3、超巨型 4×4 ----------
// x,y 是錨點（x、y 最小的那一格），身體佔 x～x+n-1、y～y+n-1。騎著的騎士跟坐騎同一塊。
// 10-21 第三批：所有大型以上的怪物都佔多格（小傢伙們是小型，永遠 1 格）
const FOOTPRINT = {"大型":2, "巨型":3, "超巨型":4};
function footOf(u){
  if(!u || u.side===undefined || u.worldObject) return 1;
  if(u.mountId && B()){ const h = B().units.find(v=>v.id===u.mountId); if(h) return footOf(h); }
  if(isPcCritter(u)) return 1;
  return FOOTPRINT[sizeOf(u)] || 1;
}
const covers = (u, x, y) => { const n = footOf(u), ux = mapCell(u.x), uy = mapCell(u.y); return x>=ux && x<ux+n && y>=uy && y<uy+n; };
function cellsOf(u, x=u.x, y=u.y, n=footOf(u)){ const out = []; for(let i=0;i<n;i++) for(let j=0;j<n;j++) out.push({x:mapCell(x)+i, y:mapCell(y)+j}); return out; }
// 這個身體放在 (x,y) 放得下嗎：每一格都沒擋、沒有別人（自己和騎乘的另一半不算）
function fitsAt(u, x, y, n=footOf(u), ignore=null){
  const skip = new Set([u, ...(ignore || [mountOf(u), riderOf(u)])].filter(Boolean));
  return cellsOf(u, x, y, n).every(c=>!blocked(c.x,c.y) && !B().units.some(v=>!skip.has(v) && !v.dead && !v.fled && covers(v, c.x, c.y)));
}
// 從 (x,y) 往外找最近放得下的錨點
function freeSpotFor(u, x, y, r=4){
  for(let d=0; d<=r; d++) for(let ox=-d; ox<=d; ox++) for(let oy=-d; oy<=d; oy++){
    if(Math.max(Math.abs(ox),Math.abs(oy))!==d) continue;
    if(fitsAt(u, x+ox, y+oy)) return {x:x+ox, y:y+oy};
  }
  return null;
}
// 開戰時把多格單位挪到放得下的位置（地圖原本照 1 格擺）
function fixFootprints(){
  B().units.filter(u=>footOf(u)>1 && !u.dead && !mountOf(u)).forEach(u=>{
    if(fitsAt(u, u.x, u.y)) return;
    const p = freeSpotFor(u, u.x, u.y); if(!p) return;
    u.x = p.x; u.y = p.y; const r = riderOf(u); if(r){ r.x = u.x; r.y = u.y; }
  });
}
// 探索（連續座標）：(x,y) 有沒有碰到 v 的身體
const bodyHit = (v, x, y, pad=.55) => { const n = footOf(v); return x > v.x - pad && x < v.x + n - 1 + pad && y > v.y - pad && y < v.y + n - 1 + pad; };

// ---------- 騎乘（大爺 10-20，參考 SRD 5.2 騎乘戰鬥） ----------
// 騎著時騎士掛在坐騎身上、同一格，不另外佔格；騎士、坐騎各一條血。騎士的回合用坐騎的速度移動；
// 坐騎被騎著時不輪回合（受控坐騎只負責移動）、不藉機攻擊。任何一邊被推開、倒地、倒下或兩邊不在同一格 → 分開，
// 騎士摔下來倒地（落在旁邊的空格）。分開後坐騎是獨立的敵人；騎士在自己回合可以花一半移動重新騎上相鄰的坐騎。
const mountOf = u => u && u.mountId ? B().units.find(v=>v.id===u.mountId) || null : null;
const riderOf = h => h && h.riderId ? B().units.find(v=>v.id===h.riderId && v.mountId===h.id) || null : null;
const ridden = h => !!riderOf(h);
const mountPair = t => { const h = mountOf(t); if(h) return {rider:t, horse:h}; const r = riderOf(t); return r ? {rider:r, horse:t} : null; };
function syncMount(u){ const h = mountOf(u); if(h){ h.x = u.x; h.y = u.y; h.face = u.face; } }
function nearFree(x, y){
  for(let r=1;r<=2;r++) for(let ox=-r;ox<=r;ox++) for(let oy=-r;oy<=r;oy++){
    if(Math.max(Math.abs(ox),Math.abs(oy))!==r) continue;
    const nx=x+ox, ny=y+oy; if(!blocked(nx,ny) && !unitAt(nx,ny)) return {x:nx, y:ny};
  }
  return null;
}
function dismount(r, why){
  const h = mountOf(r); if(!h) return;
  delete r.mountId; delete h.riderId;
  const e = ENEMIES[r.type]; if(e && e.lookOnFoot){ r.look = e.lookOnFoot; r.speed = e.speedOnFoot ?? r.speed; }
  if(r.dead) return;
  if(r.x===h.x && r.y===h.y){ const p = nearFree(h.x, h.y); if(p){ r.x = p.x; r.y = p.y; } }   // 昏迷的小傢伙也要從馬背上滑下來，不能疊在同一格
  if(r.down) return;
  blog(`　${r.name}${why||"從"+h.name+"身上摔下來"}！`, "skill");
  knockProne(r);
}
function mountUp(r, h){
  r.mountId = h.id; h.riderId = r.id;
  const e = ENEMIES[r.type]; if(e && e.lookOnFoot) r.look = e.look;
  r.x = h.x; r.y = h.y; r.face = h.face;
}
// 推開、倒地、倒下、被拉開之後檢查：不在同一格、任一邊倒地／倒下／逃走 → 分開
function checkMounts(){
  if(B().holdMounts) return;   // 推撞騎乘的：先寫「被推開」再寫「摔下來」
  B().units.forEach(r=>{ const h = mountOf(r); if(!h) return;
    if(r.dead || r.down || h.dead || h.down || h.fled || r.fled || has(r,"prone") || has(h,"prone") || r.x!==h.x || r.y!==h.y) dismount(r); });
}
// 抓的人倒下、兩人不相鄰 → 自動鬆開
function checkGrapples(){
  B().units.forEach(t=>{ const g = grapplerOf(t); if(grappled(t) && (!g || g.dead || g.down || t.dead || dist(g,t)>1)) releaseGrapple(t, "掙脫了擒抱"); });
}

// ---------- 繳械（本作規則，參考 DMG 選用規則） ----------
// 攻擊者：攻擊檢定（跟他平常打人一樣的加值），目標拿雙手武器時攻擊者劣勢；目標：力量或敏捷檢定（挑高的）
// 成功：主要武器飛到 2 格外的地上；走到那格就自動撿回來
// 目標手上能被打掉的東西：武器，沒武器就法器（敵我一樣）
function disarmable(t){
  const it = t.weapon || t.focus;
  return it ? {item:it, group:groupOf(it).id, name:it.n} : null;
}
function atkBonusOf(a){ return a.mods[weaponStat(a)] + 2; }
// 找落點：從 t 往遠離 from 的方向找 2 格內沒擋住、沒掉東西的空地
function dropSpot(from, t){
  const dx = sgn(t.x-from.x) || 1, dy = sgn(t.y-from.y);
  const cands = [];
  for(let r=2;r>=1;r--) for(let ox=-r;ox<=r;ox++) for(let oy=-r;oy<=r;oy++){
    if(Math.max(Math.abs(ox),Math.abs(oy))!==r) continue;
    const x = t.x+ox, y = t.y+oy;
    if(blocked(x,y) || unitAt(x,y) || (B().drops||[]).some(d=>d.x===x&&d.y===y)) continue;
    cands.push({x, y, s: r*10 + ox*dx + oy*dy});      // 越遠、越朝被打飛的方向越好
  }
  cands.sort((a,c)=>c.s-a.s);
  return cands[0] || null;
}
function takeFrom(t,it){return Equipment.takeHeld(t,it);}
function equip(u,it){return Equipment.equipHeld(u,it);}
// 撿不撿得起來（敵我一樣）：武器欄／法器欄是空的，而且手夠（盾、法器、武器各佔一隻手，雙手武器佔兩隻）
// 哥布林撿到玲玲的法杖也照樣會用
function canPick(u, it){
  if(u.natural) return false;   // 用爪子、牙齒的怪物不撿武器（10-10）
  if(u.down || u.dead || equipmentRequirement(it,k=>abilityScore(u,k))) return false;
  if(inGrapple(u) && it.props && it.props.includes("雙手")) return false;   // 擒抱中撿不起雙手武器
  const hands = it2 => it2 ? (it2.props && it2.props.includes("雙手") ? 2 : 1) : 0;
  if(it.type==="focus") return !u.focus && hands(u.weapon) + (u.shield?1:0) + 1 <= 2;
  return !u.weapon && hands(it) + (u.shield?1:0) + (u.focus?1:0) <= 2;
}
function tryDisarm(a, t){
  const d = disarmable(t); if(!d) return false;
  const two = holdsTwoHanded(t), r1 = d20(), r2 = two ? d20() : r1, ar = Math.min(r1, r2), atk = ar + atkBonusOf(a);
  const s = t.mods.STR>=t.mods.DEX ? "STR" : "DEX";
  const tr = d20(), def = tr + t.mods[s];
  const ok = atk > def;
  blog(`　攻擊檢定 d20=${ar}${two?`（${t.name}雙手握緊，劣勢 ${r1}/${r2}）`:""}${fmtN(atkBonusOf(a))} = ${atk}　對　${t.name}${s==="STR"?"力量":"敏捷"} d20=${tr}${fmtN(t.mods[s])} = ${def} → ${ok?"打掉了！":"沒打掉"}`, ok?"hit":"miss", ok?"打掉了！":"沒打掉");
  if(!ok){ fxFloat(t, POP_TEXT.miss, "miss"); sfx("miss", B().impact||0); return false; }
  const spot = dropSpot(a, t);
  if(spot){
    takeFrom(t, d.item);
    (B().drops = B().drops || []).push({x:spot.x, y:spot.y, from:t.id, ...d, t:impactAt(), fx:t.x, fy:t.y});
    blog(`　${t.name}的${d.name}飛了出去！`, "skill");
  } else blog(`　${t.name}的${d.name}掉在腳邊被踩住了……（沒有地方可以飛）`, "skill");
  fxFloat(t, POP_TEXT.disarm, "dmg"); fxHit(t, "burst"); sfx("guard", B().impact||0); sfx("hit_blunt", B().impact||0);
  return !!spot;
}
// 走到有武器的格子：誰都能撿，只要手空得出來（原主、隊友、敵人都行）
function pickUp(u){
  const b = B(), i = (b.drops||[]).findIndex(d=>d.x===mapCell(u.x) && d.y===mapCell(u.y) && canPick(u, d.item));
  if(i<0) return false;
  const d = b.drops.splice(i,1)[0];
  equip(u, d.item);
  if(d.from!==u.id) funNote("pickup", u, {t:d.name});
  const whose = d.from===u.id ? "撿回了" : `撿起了${(B().units.find(v=>v.id===d.from)||{}).name||""}的`;
  blog(`${u.name}${whose}${d.name}！`, "skill"); sfx("pop");
  return true;
}

// ---------- 戰鬥台詞（資料在 data/barks.js） ----------
// 頭上跳氣泡框 BARK_MS 毫秒，紀錄也留一行；同一句一場只講一次
const BARK_MS = 1800;
function barkMatch(u, sel){
  if(!sel) return true;
  const holds = [u.weapon && u.weapon.n, u.focus && u.focus.n];
  return (!sel.side || u.side===sel.side) && (!sel.id || u.id===sel.id) && (!sel.type || u.type===sel.type)
      && (!sel.holds || holds.includes(sel.holds)) && (!sel.born || u.born===sel.born)
      && (sel.cranky===undefined || ((u.stress||0)>=STRESS.cranky)===sel.cranky);   // 壓力 75 以上換煩躁台詞（10-10）
}
function barkOn(ev, about, delay=0){
  const b = B(); b.barked = b.barked || [];
  // 符合的好幾組（例如每隻各一組）隨機挑一組講，不會永遠是排在前面的那隻
  const ok = BARKS.filter(r=>r.on===ev && barkMatch(about, r.about)).map(r=>({r,
    lines: r.lines.filter(l=>!b.barked.includes(l)),
    who: b.units.filter(v=>v!==about && !v.dead && !v.down && !v.steed && !foeHid(v) && barkMatch(v, r.speaker))})).filter(c=>c.lines.length && c.who.length);
  if(!ok.length) return;
  const c = ok[Math.floor(Math.random()*ok.length)];
  say(c.who[Math.floor(Math.random()*c.who.length)], c.lines[Math.floor(Math.random()*c.lines.length)], delay, c.r.lang);
}
// 聽不聽得懂：通用語大家都懂；其他語言由我方活著的角色做被動智力檢定（10 + 智力調整值 ≥ 語言難度，不擲骰），挑分數最高的
function understoodBy(lang){
  if(!lang || lang==="通用語") return {all:true};
  const dc = LANGS[lang] || 15;
  // 法師風格：博學（大爺 10-09 智力檢定優勢）：被動檢定的優勢照 D&D 算 +5
  const best = alive("pc").map(p=>({p, v:10 + p.mods.INT + (passiveSkills(p).some(s=>s.key==="lore")?5:0)})).sort((a,c)=>c.v-a.v)[0];
  return best && best.v >= dc ? {who:best.p, v:best.v, dc} : {v:best ? best.v : 0, dc};
}
function say(u, text, delay=0, lang=null){
  const b = B(), un = u.side==="pc" ? {all:true} : understoodBy(lang);   // 我方自己講的一定懂
  (b.barked = b.barked || []).push(text);
  const show = un.all || un.who;
  const bub = {id:u.id, text: show ? text : "（異族語）", sub: un.who ? `${lang}・${un.who.name}聽懂了` : "", t:Date.now()+delay, dur:BARK_MS};
  (b.bubbles = b.bubbles || []).push(bub);
  if(un.all) blog(`${u.name}：「${text}」`, "talk");
  else if(un.who) blog(`${u.name}說了一句${lang}（${un.who.name}聽懂了）。`, "talk");   // 台詞內容只放頭上泡泡，紀錄不重複（大爺 10-10）
  else blog(`${u.name}說了一句異族語。`, "talk");
  if(!un.all) blog(`　被動智力 ${un.v} ${un.who?"≥":"<"} ${lang} ${un.dc}${un.who?`，${un.who.name}聽得懂`:"，沒人聽得懂"}`);
  setTimeout(()=>{ if(B()===b) refreshBattle(); }, delay + 20);
}

// ---------- 爆擊慢動作 ----------
// 打中的那一刻：鏡頭往目標拉近、畫面閃白、跳出「CRITICAL!」、所有動畫放慢到 0.3 倍，約 1 秒後恢復
const CRIT_MS = 1000;
function critMoment(t){
  const b = B(), wait = b.impact || 0;
  b.impactEnd = Math.max(b.impactEnd||0, Date.now() + wait + CRIT_MS + 300);   // 敵人回合、我方選單都等慢動作演完
  sfx("crit", wait);
  setTimeout(()=>{
    if(B()!==b) return;
    if(!touches.size) centerCam(t.x, t.y - 1);    // 爆擊：先把被攻擊的那隻擺到畫面正中間，再以牠為中心拉近（大爺 10-02）
    b.critOn = {x:t.x, y:t.y};
    refreshBattle();
    document.getAnimations().forEach(a=>{ if(!/crit/.test(a.animationName||"")) a.playbackRate = .3; });
    setTimeout(()=>{
      if(B()!==b) return;
      b.critOn = null;
      document.getAnimations().forEach(a=>a.playbackRate = 1);
      document.querySelector(".crit-fx")?.remove();
      const svg = document.querySelector(".board");
      if(svg){ svg.classList.remove("crit-zoom"); svg.style.transition = "transform .3s ease-in"; }
    }, CRIT_MS);
  }, wait);
}

// 倒地：掛狀態＋在打中的那一刻播倒下去的動作
function knockProne(t){ addStatus(t, "prone", {}); funNote("prone", t); t.anim = {k:"fall", t:impactAt()}; if(mountPair(t)) checkMounts(); }

// 把 t 從 from 推開 n 格
function push(from, t, n){
  const dx = sgn(t.x-from.x), dy = sgn(t.y-from.y);
  for(let i=0;i<n;i++){
    const nx=t.x+dx, ny=t.y+dy, dh = hAt(nx,ny) - hAt(t.x,t.y), m = mountOf(t);
    if(!(m ? fitsAt(t, nx, ny, 1, []) : fitsAt(t, nx, ny)) || dh >= 2) break;   // 高兩層以上的山壁推不上去；被推下馬的騎士只看自己那一格（大爺 10-20）
    t.x=nx; t.y=ny;
    if(dh <= -2){ fall(t, -dh); break; }                     // 被推下高台
  }
  checkGrapples(); checkMounts();
}
// 跌落：每 10 呎（兩層）1d6 鈍擊，並倒地
function fall(t, levels){
  const n = Math.floor(levels/2); if(n<=0) return;
  blog(`　${t.name}從 ${levels*5} 呎高的地方摔下去！`, "skill");
  hurt(t, rollDice(`${n}d6`).total, "鈍擊");
  if(!t.dead && !t.down) knockProne(t);
}

// 俠盜風格：偷襲（大爺 10-09）：武器攻擊命中、目標 1 格內有攻擊者的隊友（沒倒）就多骰 d6；
// 骰數＝等級除以 2 進位（1 級 1d6、3 級 2d6，照 D&D）；每回合一次（任何人的回合都算一回合，反擊、藉機也可能用掉）
const turnKey = () => `${B().round}:${B().turn}`;
function sneakDice(a, t){
  if(!passiveSkills(a).some(s=>s.key==="sneak_attack") || a.sneakTurn===turnKey()) return 0;
  if(!B().units.some(p=>p!==a && p!==t && p.side===a.side && !p.dead && !p.down && dist(p,t)<=1)) return 0;
  return Math.ceil(levelOf(a)/2);
}
// 一次標準武器攻擊（敵我通用）。o: {adv, dis, hitMod, extraDice, noMod, mastery, double, autoCrit, bonusDmgDice, pointBlank, counter}
function weaponAttack(a, t, o={}){
  const w=o.weapon||a.weapon, view={...a,weapon:w};
  const stat = weaponStat(view), mod = a.mods[stat];
  const ranged = isRanged(view) || (o.thrown===true);
  const ak = ammoKind(w), loaded = a.loadedAmmo;
  if(ak && !hasAmmoFor(view)){ blog(`${a.name}沒有可用的彈藥！`, "miss"); return {hit:false, crit:false, noAmmo:true}; }
  if(ak && loaded && loaded.ammoFor===ak){
    // 特殊彈藥一旦射出，不論命中與否都消耗。具體附加效果由該道具資料之後接入。
    a.loadedAmmo=null; dropItem(a, loaded); blog(`　${a.name}使用${loaded.n}`, "skill");
  }
  const res = attackRoll(a, t, {bonus: mod + 2 + ((o.hitMod||0)+(w?.hitBonus||0)), adv:o.adv, dis:o.dis, ranged, pointBlank:o.pointBlank});
  const die = weaponDie(view) || "1d1";
  // 戰士風格：武器精通（大爺 10-09）：帶了才觸發專精；普攻、招式、連擊每一下都算；敵我一致
  const m = w && passiveSkills(a).some(s=>s.key==="weapon_mastery") ? w.mastery.split(" ")[0] : null;
  if(res.hit){
    const crit = res.crit || o.autoCrit || o.double;
    // 通用升階：施放中的人每高一階多 1 顆武器骰
    const upD = B().upBy===a.id && !o.counter ? (B().upDice||0) : 0;
    const nat = !w && a.natural;   // 怪物天生攻擊（10-10）：照天生攻擊的骰＋屬性
    let n = w ? dmgRoll(die, o.noMod?0:mod, crit, (o.extraDice||0) + upD) : nat ? dmgRoll(nat.dmg.split(" ")[0], o.noMod?0:mod, crit, (o.extraDice||0) + upD) : (o.noMod ? 1 : Math.max(1, 1 + a.mods.STR));
    if(o.bonusDmgDice) n += rollDice(o.bonusDmgDice).total;
    if(w?.dmgBonus) n += w.dmgBonus;   // +1 武器的傷害加值（10-10）
    if(mealOf(a)==="skewer") n += 1;   // 露營料理：烤肉串（10-10）
    const sd = sneakDice(a, t); if(sd){ a.sneakTurn = turnKey(); const extraSneak = dmgRoll(`${sd}d6`, 0, crit); n += extraSneak; blog(`　${skillLabel(learnedSkillByKey("sneak_attack").def)}：隊友在旁邊牽制，多 ${sd}d6（${extraSneak}）`, "skill"); }
    if(n<=0){ blog(`　打中了，但${t.name}不痛不癢（0 點）`, "miss", "不痛不癢"); fxFloat(t, "0", "miss"); }
    const extra=w?.extraDamage, arrowHit=["bow","crossbow"].includes(ak);
    hurt(t, n, dmgType(view), a, arrowHit ? (extra ? false : "arrow_hit") : null);
    if(extra){if(!t.dead && !t.down)hurt(t,extra.amount,extra.type,a);groundReact(t.x,t.y,extra.type);}
    if(m && !t.dead && !t.down) applyMastery(a, t, m, mod);
  } else if(m==="擦傷" && mod>0){
    blog(`　擦傷：沒打中也造成 ${mod} 點傷害`, "skill"); hurt(t, mod, dmgType(view), a);
  }
  return res;
}
function applyMastery(a, t, m, mod){
  switch(m){
    case "削弱": addStatus(t,"sapped",{until:"start", of:a.id}); blog(`　削弱：${t.name}下次攻擊有劣勢`,"skill"); break;
    case "緩速": addStatus(t,"slowed",{until:"start", of:a.id}); blog(`　緩速：${t.name}移動 −2 格`,"skill"); break;
    case "推擊": push(a,t,2); blog(`　推擊：${t.name}被推開`,"skill"); break;
    case "擊倒": if(!saveRoll(t,"CON",dcOf(a,weaponStat(a)))){ knockProne(t); blog(`　擊倒：${t.name}倒地！`,"skill"); } break;
    case "困擾": addStatus(a,"helped",{via:"vex", target:t.id, until:"end", of:a.id}); blog(`　困擾：${a.name}下次攻擊${t.name}有優勢`,"skill"); break;
    case "順劈": {
      const other = enemiesOf(a).find(e=>e!==t && dist(e,a)<=reachOf(a));
      if(other && !a._cleaved){ a._cleaved = true; blog(`　順劈：順勢砍向${other.name}`,"skill"); weaponAttack(a, other, {noMod:true}); }
      break; }
  }
}

// 中毒：大爺 10-03 定，傷害在回合開始；結束時體質豁免，沒過持續。
function poisonDamage(u){const po=has(u,"poisoned");if(!po||u.dead)return false;blog(`${u.name}中毒了……`,"dmg");hurt(u,rollDice(po.dice||"1d4").total,"毒素",null);return true;}
function poisonSave(u){const poisons=u.statuses.filter(s=>s.k==="poisoned");if(!poisons.length||u.dead)return false;panelStart(`${u.name}【解毒】`);const ok=saveRoll(u,"CON",Math.max(...poisons.map(s=>s.dc??13)));panelEnd();if(ok){u.statuses=u.statuses.filter(s=>s.k!=="poisoned");blog(`${u.name}體質豁免成功，解毒了。`,"skill");}return true;}

// 戰鬥以外的檢定也能用好運（大爺 10-10）：寶箱、探索開鎖／撬開／拆陷阱、商隊、露營。
// 失敗時跳出詢問框，回答前流程等著（呼叫的地方用 await）；用了才扣，長休回滿。戰鬥中招式以外的擲骰還不問
function askLuck(id, text){
  if(window.NO_LUCK_ASK) return Promise.resolve(false);   // 測試用：不跳詢問、直接當「不用」
  return new Promise(res=>{
    const c = CRITTERS.find(x=>x.id===id), el = document.createElement("div");
    el.className = "luck-ask";
    el.innerHTML = `<div class="luck-box" role="dialog" aria-live="assertive"><b>${c ? c.name : ""}：${text}</b><p>要用好運重擲嗎？（還剩 ${luckLeft({id, side:"pc"})} 顆）</p><div class="luck-btns"><button class="btn" data-luck="1">好運：重擲</button><button class="btn" data-luck="0">不用</button></div></div>`;
    el.addEventListener("click", ev=>{
      const v = ev.target.closest("[data-luck]")?.dataset.luck; if(v===undefined) return;
      el.remove();
      if(v==="1"){ (state.luckUsed ||= {})[id] = (state.luckUsed[id]||0) + 1; sfx("pop"); }
      res(v==="1");
    });
    document.body.appendChild(el);
  });
}
const luckReroll = async (id, text) => luckLeft({id, side:"pc"})>0 && await askLuck(id, text);
