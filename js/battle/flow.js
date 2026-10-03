/* ======================== 回合流程、移動、敵人 AI ======================== */

function nextTurn(){
  const b = B();
  if(b.phase==="explore")return;
  if(checkResult()) return;
  do {
    b.turn++;
    if(b.turn >= b.units.length){b.turn=0;b.round++;groundAdvance(6000,true);exploreReinforcements();}
  } while(b.units[b.turn].dead || (b.units[b.turn].down && b.units[b.turn].side!=="pc") || b.units[b.turn].side==="npc" || !inCombat(b.units[b.turn]));   // 倒下的四小隻照樣輪到：擲死亡豁免
  if(b.turn===0 || b.round===0){ if(b.round===0) b.round=1; }
  const u = cur();
  beginTurn(u);
  if(u.surprised){b.moveLeft=0;b.actionUsed=true;b.freeUsed=true;b.busy=true;blog(`${u.name}：${EXPLORE_COMBAT.surprised}`);refreshBattle();later(()=>{u.surprised=false;b.busy=false;poisonSave(u);if(!checkResult())nextTurn();},1100);return;}
  // 倒下的四小隻：擲死亡豁免；擲到 20 醒過來就照常行動
  if(u.side==="pc" && u.down && !u.dead && deathSave(u)!=="up"){ refreshBattle(); later(()=>{ poisonSave(u);if(!checkResult()) nextTurn(); }, 1500); return; }
  // 回合一開始就倒下（例如流血）：直接換下一個
  if(u.dead || u.down){ refreshBattle(); later(()=>{ poisonSave(u);if(!checkResult()) nextTurn(); }, 900); return; }
  // 麻痺：跳過這回合（回合結束的東西照樣算）
  if(B().skipTurn){ B().busy = true; refreshBattle(); later(()=>{ if(!B()) return; B().busy = false; if(!checkResult() && cur()===u) endTurn(); }, 1100); return; }
  if(u.side==="pc") sfx("turn");
  refreshBattle();
  if(u.side==="foe") later(()=>aiTurn(u), foeHid(u) ? 0 : 650);   // 躲著的不停頓，不然停一下就等於告訴玩家有東西
}

function beginTurn(u){
  const b = B();
  u.shockNoOA=false;
  expire("start", u.id);
  u._cleaved = false;
  b.mode = null; b.up = 0; b.tier = 0; b.actionUsed = false; b.movedThisTurn = false; b.freeUsed = false;
  u.oaUsed = false;                         // 藉機攻擊每輪一次，輪到自己時恢復
  b.menu = null; b.moveMode = false; b.info = null; b.pendingMove = null;
  b.focusReq = true;                        // 鏡頭滑到這隻身上（敵人只在畫面外時才跟過去）
  b.dazed = !!has(u,"dazed");
  let mv = u.speed;
  if(has(u,"prone")){ mv = Math.floor(mv/2); u.statuses = u.statuses.filter(s=>s.k!=="prone"); u.anim = {k:"getup", t:Date.now()}; sfx("swing"); blog(`${u.name}從地上爬起來（移動減半）`); }
  // 緩速（含釘住）：同名不疊加，取扣最多的（扎腿升階多扣）；釘住那種＝移動歸零
  { const sl = u.statuses.filter(s=>s.k==="slowed");
    if(sl.length) mv = sl.some(s=>s.stop) ? 0 : Math.max(0, mv - Math.max(...sl.map(s=>2 + (s.n||0)))); }
  if(has(u,"restrained") || has(u,"frozen")) mv = 0;   // 束縛（網子、擒抱）、凍結：不能移動
  // 燃燒：回合開始受 1d4 火焰，直到花動作撲滅
  if(has(u,"burning")){ blog(`${u.name}身上著火了！`, "dmg"); hurt(u, rollDice("1d4").total, "火焰", null); }
  // 流血：回合開始受 1d4，次數用完就止血
  const bl = has(u,"bleed");
  if(bl){ blog(`${u.name}流血中……`, "dmg"); hurt(u, rollDice("1d4").total, "流血", null);
    bl.n--; if(bl.n<=0) u.statuses = u.statuses.filter(s=>s!==bl); }
  // 毒沼仍是來源；傷害與解毒沿用同一套中毒規則。
  groundPoison(u);poisonDamage(u);
  // 麻痺：這一回合整個跳過（只有一回合）
  b.skipTurn = !u.down && !u.dead && !!has(u,"paralyzed");
  if(b.skipTurn){ u.statuses = u.statuses.filter(s=>s.k!=="paralyzed"); }
  b.moveLeft = mv; b.baseMove = mv;
  if(!foeHid(u)) blog(`— ${u.name}的回合 —`, "turn");   // 躲著的敵人回合不提（大爺 10-02：拿掉 ???）
  if(b.skipTurn) blog(`${u.name}全身麻痺，這回合動不了！`, "dmg");
  if(!u.down) perceive(u);                  // 昏過去的不會察覺
}

function endTurn(){
  const b = B();
  if(!b || b.result) return;                 // 傳送回酒館後戰鬥已經不在：還沒跑完的計時器直接收掉
  const u = cur();
  if(u.side==="pc") b.panel = null;                 // 骰子面板：我方按待機（結束回合）才消失
  poisonSave(u);
  expire("end", u.id);
  b.mode = null;
  if(b.tut===2) b.tut = 3; else if(b.tut===3) b.tut = 4;
  nextTurn();
}

function checkResult(){
  const b = B();
  if(!b || b.result) return true;            // 戰鬥已經不在（傳送回酒館）＝結束了
  if(b.explorationMap&&!b.units.some(u=>u.side==="pc"&&!u.dead)){b.result="lose";blog("四隻都被卡姆傳送回酒館了……","kill");refreshBattle();return true;}
  if(b.explorationMap&&!alive("foe").length){if(!alive("pc").length)return false;if(!b.manualCombat){finishExploreCombat();return true;}return false;}
  if(!alive("foe").length){ b.result = "win"; blog("勝利！哥布林全被打倒了！", "kill"); sfx("win", 900); refreshBattle(); return true; }
  if(!b.units.some(u=>u.side==="pc" && !u.dead)){ b.result = "lose"; blog("四隻都被卡姆傳送回酒館了……", "kill"); sfx("lose", 900); refreshBattle(); return true; }   // 倒下還在擲死亡豁免的不算輸
  return false;
}

// ---------- 移動 ----------
const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
// 從 u 出發、花費 max 格移動以內能到的格子：Map("x,y" → 路徑)，路徑.cost＝要花的移動（草叢一格算 2）
function reachable(u, max){
  groundKnown(u);
  const drag = victimsOf(u).length ? 2 : 1;          // 拖著被抓住的人：每格花費加倍
  const start = `${u.x},${u.y}`, best = new Map([[start, 0]]), paths = new Map([[start, []]]);
  const open = [[0, u.x, u.y]];
  while(open.length){
    open.sort((a,b)=>a[0]-b[0]);
    const [c, x, y] = open.shift();
    if(c > best.get(`${x},${y}`)) continue;
    for(const [dx,dy] of DIRS){
      const nx=x+dx, ny=y+dy, k=`${nx},${ny}`;
      if(B().phase==="explore"&&B().exploreGoal&&B().exploreGoal.id!==u.id&&nx===B().exploreGoal.x&&ny===B().exploreGoal.y)continue;
      if(groundAvoid(u,nx,ny)||blocked(nx,ny) || (unitAt(nx,ny) && !(bExploreHidden(unitAt(nx,ny))))) continue;
      const nc = c + stepCost(x,y,nx,ny)*drag;
      if(nc > max || (best.has(k) && best.get(k) <= nc)) continue;
      best.set(k, nc);
      const np = [...paths.get(`${x},${y}`), {x:nx,y:ny}]; np.cost = nc;
      paths.set(k, np); open.push([nc, nx, ny]);
    }
  }
  paths.delete(start);
  return paths;
}
const bExploreHidden=u=>B().phase==="explore" && isHid(u) && u.side==="foe";
// 路徑只走到花得起的地方（from：出發的位置，算爬升用）
function trimPath(path, budget, drag=1, from){
  const out = []; let c = 0, prev = from;
  for(const p of path){ const n = c + stepCost(prev.x,prev.y,p.x,p.y)*drag; if(n > budget) break; c = n; out.push(p); prev = p; }
  out.cost = c;
  return out;
}

// 沿路徑一步一步走（每步重畫）
// 走出敵人觸及範圍前，對方可以藉機攻擊（每隻每輪一次；撤離中不會）；敵人走進「阻截」範圍會被攻擊
function walk(u, path, done){
  const b = B();
  if(path.length && u===cur()) b.movedThisTurn = true;
  let i = 0, oaDone = -1;const groundMove={iceTried:false};
  const step = ()=>{
    if(b.result || (b.phase==="explore"&&b.exploreStopped) || i>=path.length || u.dead || u.down){ done && done(i); return; }
    if(b.phase!=="explore" && oaDone < i){
      oaDone = i;
      const foes = oaTriggers(u, path[i]);
      if(foes.length){
        foes.forEach(h=>{ if(!u.down && !u.dead) opportunityAttack(h, u); });
        refreshBattle();
        later(step, 750);
        return;
      }
    }
    const prev = {x:u.x, y:u.y}, dragged = victimsOf(u);
    u.x = path[i].x; u.y = path[i].y; i++;
    dragged.forEach(v=>{ const vp = {x:v.x, y:v.y}; v.x = prev.x; v.y = prev.y; faceTo(v, u); });
    { const sx=(u.x-u.y)-(prev.x-prev.y); if(sx) u.face = sx>0?1:-1; }
    u.anim = {k:"hop", t:Date.now()}; sfx("step");
    if(!groundEnter(u,groundMove)){refreshBattle();done?.(i);return;}
    if(pickUp(u)){ b.pickedUp = true; }
    if(b.phase==="explore"){checkExposure();exploreTraps(u);exploreDetect();}
    else {checkGuards(u, prev);checkExposure();}
    refreshBattle();
    later(step, 140);
  };
  step();
}
// ---------- 藉機攻擊 ----------
// 能不能藉機攻擊：要有近戰手段（拿弓弩的不行），這輪還沒藉機攻擊過（敵我一樣）
const canOA = h => inCombat(h) && !h.surprised && !h.shockNoOA && !h.down && !h.dead && !h.oaUsed && !twoHandLocked(h) && !isRanged(h);
function oaTriggers(u, next){
  if(has(u,"disengage") || isHid(u)) return [];
  const dragged = victimsOf(u);                     // 被拖著的人跟著走，不算被甩開
  return B().units.filter(h=> hostile(h,u) && !dragged.includes(h) && canOA(h) && dist(u,h)<=reachOf(h) && dist(next,h)>reachOf(h));
}
function opportunityAttack(h, u){
  const b = B();
  h.oaUsed = true;
  if(u===cur()) b.moveRolled = true;        // 走路途中擲過骰 → 這次移動不能取消
  blog(`${h.name}趁${u.name}離開，藉機攻擊！`, "skill"); sfx("alert");
  faceTo(h, u);
  const k = h.weapon ? animFor(groupOf(h.weapon).id, 0) : "punch";     // 用武器打；只拿法器的揮拳
  h.anim = {k, t:Date.now()}; animSfx(k);
  b.impact = DOLL_IMPACT[k] || 0;
  weaponAttack(h, u, {});
  b.impact = 0;
  checkResult();
}
// 阻截：走進架式範圍就挨一下。敵我同一套（大爺 10-02；以前只有四小隻的架式有效）
// 躲著走的看不到，不會被阻截（跟藉機攻擊一樣）；途中挨過打，這次移動就不能取消
function checkGuards(e, prev){
  if(isHid(e)) return;
  B().units.filter(p=>hostile(p,e) && !p.surprised && !p.down && !p.dead).forEach(p=>{
    const g = hasVia(p,"stance","guard");   // 架式（阻截）
    if(g && !e.down && !e.dead && dist(prev,p) > reachOf(p) && dist(e,p) <= reachOf(p)){
      blog(`${p.name}阻截走進範圍的${e.name}！`, "skill");
      p.statuses = p.statuses.filter(s=>s!==g);
      if(e===cur()) B().moveRolled = true;
      weaponAttack(p, e, {extraDice:g.up||0});            // 阻截升階：多的武器骰
    }
  });
}

// ---------- 玩家操作 ----------
function pcMove(x, y){
  const b = B(), u = cur();
  if(b.busy || b.result || u.side!=="pc") return;
  if(b.dazed && b.actionUsed) return;
  const path = reachable(u, b.moveLeft).get(`${x},${y}`);
  if(!path) return;
  // 記下出發前的樣子，走完問「確認？」，取消就退回來
  const snap = {x:u.x, y:u.y, face:u.face, moveLeft:b.moveLeft, moved:b.movedThisTurn, acted:b.actionUsed,
                drag: victimsOf(u).map(v=>({v, x:v.x, y:v.y}))};
  b.busy = true; b.moveLeft -= path.cost; b.movedThisTurn = true; b.moveMode = false; b.moveRolled = false; b.pickedUp = false;
  if(b.dazed) b.actionUsed = true;          // 震暈：移動後就不能行動
  walk(u, path, (walked)=>{
    if(walked<path.length){let prev=walked?path[walked-1]:snap;for(const p of path.slice(walked)){b.moveLeft+=stepCost(prev.x,prev.y,p.x,p.y)*(snap.drag.length?2:1);prev=p;}}
    b.busy = false;
    if(u.down || u.dead || b.result){ refreshBattle(); return; }
    if(b.moveRolled || b.pickedUp){ if(b.moveRolled) blog(`　途中發生狀況，這次移動不能取消。`); b.menu = "root"; b.pickedUp = false; }
    else b.pendingMove = snap;
    refreshBattle();
  });
}
function confirmMove(ok){
  const b = B(), u = cur(), s = b.pendingMove;
  if(!s || b.busy) return;
  b.pendingMove = null;
  if(ok){ b.menu = "root"; refreshBattle(); return; }
  u.x = s.x; u.y = s.y; u.face = s.face;
  s.drag.forEach(d=>{ d.v.x = d.x; d.v.y = d.y; });
  b.moveLeft = s.moveLeft; b.movedThisTurn = s.moved; b.actionUsed = s.acted;
  b.moveMode = true;                         // 回到選格子
  refreshBattle();
}

// 選技能 → 進入瞄準模式；self 類直接施放
function pickSkill(key){
  const b = B(), u = cur();
  if(b.busy || b.result || u.side!=="pc") return;
  const sk = unitSkills(u).find(s=>s.key===key);
  if(sk && !skillCanUse(u, sk)) return;
  if(sk && fromTwoHanded(u, sk) && inGrapple(u)){ blog(`${sk.def.name}：擒抱中不能用雙手武器`); refreshBattle(); return; }
  if(!sk || sk.impl.passive || !skillReady(u,sk)) return;
  if(sk.impl.can && !sk.impl.can(u)){ blog(`${sk.def.name}：${sk.impl.why}`); refreshBattle(); return; }
  // 用最低階的格子；對自己放、又沒得選（不能升階或只剩一種格子）：直接施放；能選的先進瞄準列，選好用哪一階再按「施放」
  b.tier = lowestTier(u, sk); b.up = upOf(u, sk, b.tier); b.tierOpen = false;
  if(sk.impl.target==="self" && !(canUp(sk) && tiersFor(u, sk).length > 1)){ doSkill(u, sk, u); return; }
  b.mode = (b.mode && b.mode.key===key) ? null : {key, darts:[]};
  b.menu = b.mode ? null : "act";
  refreshBattle();
}
// 瞄準列：直接點要用哪一階的格子（只能點還有格子的階）；已經點了幾發魔法飛彈就不能降到比那個少
function aimTier(t){
  const b = B(), u = cur(); if(!b.mode || b.busy) return;
  const sk = unitSkills(u).find(s=>s.key===b.mode.key); if(!sk || !canUp(sk) || !tiersFor(u, sk).includes(t)) return;
  const n = upOf(u, sk, t);
  if(sk.impl.multi && sk.impl.darts && (b.mode.darts||[]).length > 2 + n) return;
  b.tier = t; b.up = n; b.tierOpen = false; sfx("pop"); refreshBattle();   // 選好就收起來
}
// 瞄準列的「＋／×」：展開、收起其他階（大爺 2026-10-01：升階平常收起來，點＋才展開）
function aimTierToggle(){ const b = B(); if(!b.mode || b.busy) return; b.tierOpen = !b.tierOpen; sfx("pop"); refreshBattle(); }
function aimCast(){                                   // 對自己放的招，選好用哪一階後按「施放」
  const b = B(), u = cur(); if(!b.mode || b.busy) return;
  const sk = unitSkills(u).find(s=>s.key===b.mode.key);
  if(sk && sk.impl.target==="self") doSkill(u, sk, u);
}
// 取消瞄準：回到選這招的那一層（道具 → 道具、推開／推倒 → 推撞、其他 → 動作）
function aimCancel(){ const b = B(), k = b.mode && b.mode.key;
  b.menu = k==="item" ? "items" : (k==="shove_push" || k==="shove_prone") ? "shove" : "act";
  b.mode = null; b.up = 0; b.tier = 0; b.tierOpen = false; sfx("back"); refreshBattle(); }

// 瞄準模式下，這格能不能當目標
function validTarget(u, sk, x, y){
  const im = sk.impl, r = im.range ? im.range(u) : 0, t = unitAt(x,y), p = {x,y};
  switch(im.target){
    case "enemy":  if(!t&&sk.def.groundElement&&dist(u,p)<=r&&groundCanReact(x,y,sk.def.dmg))return p;return t && hostile(t,u) && !t.down && !isHid(t) && dist(u,t)<=r ? t : null;
    case "line":   return t && hostile(t,u) && !t.down && !isHid(t) && dist(u,t)<=r ? t : null;
    case "ally":   return t && t.side===u.side && !t.dead && dist(u,t)<=r && !(im.notSelf && t===u) ? t : null;
    case "area":   return !blocked(x,y) && dist(u,p)<=r ? p : null;
    case "cone":   return dist(u,p)===1 ? p : null;
  }
  return null;
}
// 點格子：瞄準中 → 選目標；點到輪到的角色 → 開關指令選單；點到別隻 → 狀態卡；移動模式點藍格 → 走過去
function clickTile(x, y){
  const b = B(); if(!b) return;
  if(b.phase==="explore"){exploreClick(x,y);return;}
  const u = cur(), t0 = unitAt(x, y), t = t0 && foeHid(t0) ? null : t0;
  const myTurn = u.side==="pc" && !b.busy && !b.result;
  if(myTurn && b.pendingMove) return;        // 先回答「確認移動？」
  if(myTurn && b.mode){
    if(b.mode.key==="search"){ const a = unitAt(x,y);
      if(a && searchTargets(u).includes(a)) doSearch(u, a); else { b.mode = null; b.menu = "act"; refreshBattle(); } return; }
    if(b.mode.key==="help"){ const a = helpTarget(u, x, y); if(a) doHelp(u, a); else { b.mode = null; b.menu = "act"; refreshBattle(); } return; }
    if(b.mode.key==="item"){ const it = u.items.find(i=>i.id===b.mode.item), a = t0 && !foeHid(t0) ? t0 : null;
      if(it && a && itemTargets(u, it).includes(a)) useItem(u, it, a); else { b.mode = null; b.menu = "items"; refreshBattle(); } return; }
    if(GEN_ACT[b.mode.key]){ const g = GEN_ACT[b.mode.key], a = unitAt(x,y);
      if(a && g.targets(u).includes(a)) doGenAct(u, b.mode.key, a); else { b.mode = null; b.menu = "act"; refreshBattle(); } return; }
    const sk = unitSkills(u).find(s=>s.key===b.mode.key);
    const tg = validTarget(u, sk, x, y);
    if(tg && sk.impl.multi){                       // 魔法飛彈：每點一下分一發，點滿就射
      b.mode.darts = [...(b.mode.darts||[]), tg]; sfx("pop");
      if(b.mode.darts.length >= sk.impl.darts()) doSkill(u, sk, b.mode.darts); else refreshBattle();
      return;
    }
    if(tg) doSkill(u, sk, tg);
    else if(sk && sk.impl.target==="self") return;   // 對自己放的招在等「施放」，點地圖不取消
    else { b.mode = null; b.up = 0; b.tier = 0; b.menu = "act"; refreshBattle(); }
    return;
  }
  // 指令列一直在右下角，點角色（包括自己）就是看狀態卡
  if(t){ b.info = b.info===t.id ? null : t.id; sfx(b.info ? "pop" : "back"); refreshBattle(); return; }
  if(myTurn && b.moveMode && reachable(u, b.moveLeft).has(`${x},${y}`)){ b.info = null; pcMove(x, y); return; }
  if((b.menu && b.menu!=="root") || b.info || b.moveMode){ b.menu = null; b.info = null; b.moveMode = false; refreshBattle(); }
}

// ---------- 指令選單 ----------
const canAct = () => { const b = B(); return !b.actionUsed && !(b.dazed && b.movedThisTurn); };
// 免費動作：每回合一次；免費動作能做的事，主動作也能做（免費用過了就改扣主動作）
const canFree = () => !B().freeUsed || canAct();
const freeLeft = () => !B().freeUsed;                                  // 免費那格還在
function spendFree(u){ if(!B().freeUsed) B().freeUsed = true; else useAction(u); }
const reqText = r => (Array.isArray(r) ? r : [r]).map(x=>REQ_TEXT[x]||x).join("或");
const REQ_TEXT = {
  meleeWeapon:"近戰武器", blade:"有刃近戰武器", meleeOrUnarmed:"近戰武器或徒手", twoHandMelee:"雙手近戰武器",
  cutOrPierce:"揮砍或穿刺近戰武器", slashWeapon:"揮砍近戰武器", bluntOrUnarmed:"鈍器或徒手",
  longWeapon:"長兵器", lightMelee:"輕型或靈巧近戰武器", rangedWeapon:"遠程武器", bow:"弓",
  piercingProjectile:"穿刺型遠程武器", thrown:"可投擲武器", unarmed:"徒手", shield:"盾牌", focus:"法器", material:"材料包"
};
const weaponProps = w => (w&&w.props)||[];
// 全單位共用彈藥規則（玩家／敵人／NPC）：弓靠箭袋、弩靠矢匣、投石索／吹箭筒／火槍／手槍靠彈袋；放在背包即可，普通彈藥不逐發消耗。
// 特殊彈藥是 consumable + ammoFor；可代替普通彈藥來源，透過「道具」切換，下一次射擊後消耗。
// 彈袋（10-03）：投石索、吹箭筒、火槍、手槍都靠彈袋
const ammoKind = w => { if(!w) return null; const n = w.base||w.n;
  return ["短弓","長弓"].includes(n) ? "bow" : ["輕弩","手弩","重弩"].includes(n) ? "crossbow" : ["投石索","吹箭筒","火槍","手槍"].includes(n) ? "pouch" : null; };
const ammoStock = u => [...(u.backpack||[]), ...(u.items||[])].filter(Boolean);
const hasNormalAmmo = (u,k) => ammoStock(u).some(it=>it.type==="gear" && it.ammoFor===k);
const specialAmmo = (u,k) => ammoStock(u).filter(it=>it.type==="consumable" && it.ammoFor===k);
const hasAmmoFor = u => { const k=ammoKind(u.weapon); return !k || hasNormalAmmo(u,k) || specialAmmo(u,k).length>0; };
const isMeleeWeapon = w => !!(w&&w.type==="weapon"&&!w.cat.includes("遠程"));
const isRangedWeaponReq = w => !!(w&&w.type==="weapon"&&(w.cat.includes("遠程")||weaponProps(w).some(p=>p.startsWith("投擲"))));
const hasDmg = (w,t) => !!(w&&w.dmg&&w.dmg.includes(t));
const hasProp = (w,p) => weaponProps(w).some(x=>x===p||x.startsWith(p+" "));
// req 可以是陣列：任一種成立就能用（合併過的招式，例如連擊＝刀劍或徒手）
function skillReqMet(u, sk){
  const r=sk.def.req; if(!r)return true;
  return (Array.isArray(r) ? r : [r]).some(x=>reqOne(u, x));
}
function reqOne(u, r){
  const w=u.weapon;
  switch(r){
    case "meleeWeapon": return isMeleeWeapon(w);
    case "blade": return isMeleeWeapon(w) && (hasDmg(w,"揮砍")||hasDmg(w,"穿刺"));
    case "meleeOrUnarmed": return !w || isMeleeWeapon(w);
    case "twoHandMelee": return isMeleeWeapon(w) && hasProp(w,"雙手");
    case "cutOrPierce": return isMeleeWeapon(w) && (hasDmg(w,"揮砍")||hasDmg(w,"穿刺"));
    case "slashWeapon": return isMeleeWeapon(w) && hasDmg(w,"揮砍");
    case "bluntOrUnarmed": return !w || (isMeleeWeapon(w)&&hasDmg(w,"鈍擊"));
    case "longWeapon": return isMeleeWeapon(w) && (hasProp(w,"觸及") || ["長棍","矛","三叉戟","長矛"].includes(w.n));
    case "lightMelee": return isMeleeWeapon(w) && (hasProp(w,"輕型")||hasProp(w,"靈巧"));
    case "rangedWeapon": return isRangedWeaponReq(w);
    case "bow": return !!(w&&["短弓","長弓"].includes(w.base||w.n));   // base：魔法版武器的原型（非凡長弓→長弓）
    case "piercingProjectile": return isRangedWeaponReq(w) && hasDmg(w,"穿刺");
    case "thrown": return !!(w&&hasProp(w,"投擲"));
    case "unarmed": return !w;
    case "shield": return !!(u.shield || u.offhand2);
    case "focus": return !!((u.weapon&&u.weapon.type==="focus") || u.focus);
    case "material": return hasGear(u.backpack, "材料包");
    default:return true;
  }
}
// 施法手與持武器攻擊不同：雙手武器暫時以一手持住時，另一手可做勢。
const castHandFree = u => ((u.weapon?1:0)+(u.focus?1:0)+(u.shield?1:0)+(u.offhand2?1:0)) < 2;
function componentProblem(u, sk){
  const c=sk.def.components;if(!c)return "";
  if(c.v && (u.silenced || u.gagged))return "無法發聲";
  const focus=[u.weapon,u.focus].find(it=>it?.type==="focus"),free=castHandFree(u);
  const material=c.m,ordinary=material&&!material.cost&&!material.consumed;
  if(c.s && !free && !(ordinary&&focus))return "需要空出一隻手";
  if(material){
    const bag=[u.backpackEquip,...(u.backpack||[])].filter(Boolean);
    if(ordinary&&focus)return "";
    if(!free)return "需要空手取用材料";
    if(ordinary&&hasGear(bag,"材料包"))return "";
    if(!hasGear(bag,material.name))return `缺少${material.name}`;
  }
  return "";
}
const skillCanUse = (u, sk) => skillReqMet(u, sk) && !componentProblem(u,sk) && hasAmmoFor(u) && (sk.def.free ? canFree() : canAct());
const canWalk = () => { const b = B(); return b.moveLeft > 0 && !(b.dazed && b.actionUsed); };
function useAction(u){ const b = B(); b.actionUsed = true; if(b.dazed) b.moveLeft = 0; if(u.side==="pc" && b.tut>=0 && b.tut<2) b.tut = 2; }
// ---------- 被動觀察／學習 ----------
// 每輪第一名使出「可學技能」且能被察覺的敵人，會成為玲玲／嬌嬌／香香本輪的觀察對象。
// 默默不受此限制，能被動觀察所有能察覺的敵人。
// !＝本次理解成功；?＝沒看懂；...＝小筆記已有／本次冒險已理解，不再擲骰。
// 理解與正式記入小筆記分開：新理解先放 pendingLearned，休息時才抄進小筆記。
const observeDC = e => 5 + Math.max(1,e.level||1);
const canPerceiveSkill = e => true; // 被動觀察不受隱形、躲藏或視線影響
function knownOrUnderstood(p,key){
  p.learned=p.learned||[];
  p.pendingLearned=p.pendingLearned||[];
  return p.learned.some(x=>x.key===key) || p.pendingLearned.some(x=>x.key===key);
}
function observedSkill(e,key,name,innate=false){
  const b=B(); if(!b || !e || e.side!=="foe" || !canPerceiveSkill(e))return;
  // 本輪第一個「可學技能」使用者成為一般三隻的觀察對象。
  if(b.observeRound!==b.round){ b.observeRound=b.round; b.observeFoe=null; }
  if(!b.observeFoe) b.observeFoe=e.id;

  const dc=observeDC(e),party=b.units.filter(v=>v.side==="pc"&&!v.dead);
  const watchers=party.filter(p=>p.id==="raccoon" || e.id===b.observeFoe);
  if(!watchers.length)return;
  blog(`大家注意到${e.name}使出【${name}】（${innate?"天生能力":"招式"}，學習 DC ${dc}）`,"skill");

  watchers.forEach(p=>{
    if(knownOrUnderstood(p,key)){
      blog(`　... ${p.name}：已經理解這招`,"skill");
      obsMark(p,"known");
      return;
    }
    // 香香的被動觀察有優勢：暗骰兩次取高；骰子不顯示，只在訊息回報結果。
    const r1=d20(), r2=p.id==="wolf"?d20():null, roll=r2===null?r1:Math.max(r1,r2);
    const total=roll+(p.mods.WIS||0),ok=total>=dc;
    if(ok){
      const learned={key,name,innate,from:e.type||e.name,lv:Math.max(1,e.level||1)}; // lv：學到時那隻怪的等級，之後向玲玲學沿用這個難度
      p.pendingLearned.push(learned);
    }
    blog(`　${ok?"!":"?"} ${p.name}：${ok?"理解了！":"沒看懂"}`,ok?"skill":"miss");
    obsMark(p,ok?"ok":"fail");
  });
}
function observeInnate(e,key,name){observedSkill(e,`innate:${key}`,name,true);}


// ---------- 休息／小筆記 ----------
// 小筆記一頁 5 招；玲玲 3 頁，其他人 2 頁
const NOTE_PAGE_SIZE = 5;
const notePages = id => id==="fox" ? 3 : 2;
const noteCap = id => notePages(id) * NOTE_PAGE_SIZE;
function syncLearnedState(){
  const b=B(); if(!b)return;
  b.units.filter(u=>u.side==="pc").forEach(u=>{ state.learned[u.id]=(u.learned||[]).map(x=>({...x})); state.activeSkills[u.id]=(u.activeSkills||[]).filter(k=>(u.learned||[]).some(x=>x.key===k)).slice(0,3); state.proficiency[u.id]=slotsOf(u).slice(); });   // 10-03 修：以前存 u.pts（舊點數制，已不存在）＝ undefined，休息或擦筆記後熟練格被蓋掉
}
function eraseNote(u,key){
  const i=(u.learned||[]).findIndex(x=>x.key===key); if(i<0)return false;
  const [gone]=u.learned.splice(i,1); u.activeSkills=(u.activeSkills||[]).filter(k=>k!==key);
  blog(`${u.name}拿橡皮擦把【${gone.name}】從小筆記擦掉了。`,"skill"); return true;
}
function transcribePending(u,keys){
  u.learned=u.learned||[]; u.pendingLearned=u.pendingLearned||[];
  const chosen=new Set(keys||[]), cap=noteCap(u.id), room=Math.max(0,cap-u.learned.length);
  const add=u.pendingLearned.filter(x=>chosen.has(x.key) && !u.learned.some(y=>y.key===x.key)).slice(0,room);
  add.forEach(x=>u.learned.push({...x}));
  // 休息處理完，沒抄的也忘掉。
  u.pendingLearned=[];
  return add;
}
function learnFromLingling(student,key){
  const b=B(), ling=b&&b.units.find(u=>u.id==="fox"), note=ling&&(ling.learned||[]).find(x=>x.key===key);
  if(!note || student.id==="fox" || (student.learned||[]).some(x=>x.key===key)) return false;
  const dc=5+Math.max(1,note.lv||1), r1=d20(), r2=student.id==="wolf"?d20():null, roll=r2===null?r1:Math.max(r1,r2), ok=roll+(student.mods.WIS||0)>=dc;
  if(ok){ student.pendingLearned=student.pendingLearned||[]; if(!student.pendingLearned.some(x=>x.key===key)) student.pendingLearned.push({...note,from:"玲玲"}); }
  blog(`${ok?"!":"?"} ${student.name}向玲玲學【${note.name}】：${ok?"理解了！":"沒學會"}`,ok?"skill":"miss"); return ok;
}
function takeRest(kind, selections={}){
  const b=B(); if(!b || (b.result!=="win" && b.phase!=="explore") || b.busy || b.exploreStopped)return false;
  if(kind==="short" && state.shortRestsUsed>=2)return false;
  b.units.filter(u=>u.side==="pc").forEach(u=>{
    transcribePending(u,selections[u.id]||[]);
    // 短休：每一階各回一半（無條件進位）；長休全回
    const max=slotMax(u), s=slotsOf(u);
    u.slots = max.map((m,i)=>kind==="short" ? Math.min(m,(s[i]||0)+Math.ceil(m/2)) : m);
    state.proficiency[u.id]=u.slots.slice();
  });
  if(kind==="short") state.shortRestsUsed++; else { state.shortRestsUsed=0; state.retriesLeft=RETRY_MAX; }   // 長休：重新挑戰的次數也回滿
  syncLearnedState(); b.restDone=true; blog(kind==="short"?`短休完成（今天 ${state.shortRestsUsed}/2）`:`長休完成，熟練格全部恢復。`,"skill"); refreshBattle(); return true;
}

function battleCmd(c){
  const b = B(), u = cur();
  if(!b || b.busy || b.result || u.side!=="pc") return;
  if(b.tut===0) b.tut = 1;
  switch(c){
    case "move": case "act": case "root": case "skills": b.menu = c; b.moveMode = false; break;
    case "status":
      if(b.info===u.id) b.info=null;
      else { b.info=u.id; b.infoPage="status"; }
      break;
    case "walk":  if(!canWalk()) return; b.menu = null; b.moveMode = true; break;
    case "dash":
      if(!canAct()) return; useAction(u); b.moveLeft += b.baseMove;
      blog(`${u.name}衝刺！（移動 +${b.baseMove} 格）`, "skill"); b.menu = null; b.moveMode = true; break;
    case "disengage":
      if(!canAct()) return; useAction(u); addStatus(u, "disengage", {until:"end", of:u.id});
      blog(`${u.name}撤離：這回合移動不會被藉機攻擊`, "skill"); b.menu = null; b.moveMode = canWalk(); break;
    case "dodge":
      if(!canAct()) return; useAction(u); addStatus(u, "dodge", {until:"start", of:u.id});
      u.anim = {k:"guard", t:Date.now()}; animSfx("guard");
      blog(`${u.name}專心閃避：到下回合前，打他都有劣勢`, "skill"); afterShow(u, 700); return;
    case "search":
      if(!canFree()) return;
      if(!searchTargets(u).length){ b.menu = null; doSearch(u, null); return; }   // 沒有能看穿的：直接搜四周
      b.menu = null; b.mode = {key:"search"}; break;
    case "help":
      if(!canAct() || !helpList(u).length) return; b.menu = null; b.mode = {key:"help"}; break;
    case "wait": b.menu = null; endTurn(); return;
    case "hide":
      if(!canAct() || hideBlock(u)) return; useAction(u);
      blog(`${u.name}躲了起來……`, "skill"); u.anim = {k:"guard", t:Date.now()}; animSfx("guard");
      tryHide(u); afterShow(u, 800); return;
    case "grapple": case "shove_push": case "shove_prone": case "disarm":
      if(!canAct() || !GEN_ACT[c].targets(u).length || (c==="grapple" && !freeHand(u))) return;
      b.menu = null; b.mode = {key:c}; break;
    case "shove": b.menu = "shove"; break;
    case "escape": if(!canAct() || !grappled(u)) return; doEscape(u); return;
    case "items": if(!canFree()) return; b.menu = "items"; break;
    case "douse": if(!canAct() || !has(u,"burning")) return; doDouse(u); return;
    case "unnet": if(!canAct() || !hasVia(u,"restrained","net")) return; doUnnet(u); return;
  }
  refreshBattle();
}
// ---------- 通用動作：擒抱、推撞（SRD 5.2 徒手攻擊的選項，每個人都能用） ----------
// 目標做力量或敏捷豁免（挑高的），DC = 8 + 力量 + 熟練 2
const adjFoes = u => enemiesOf(u).filter(e=>dist(e,u)<=1);
const GEN_ACT = {
  grapple:     {name:"擒抱", targets:u=>adjFoes(u).filter(e=>!grappled(e))},
  shove_push:  {name:"推開", targets:u=>adjFoes(u)},
  shove_prone: {name:"推倒", targets:u=>adjFoes(u).filter(e=>!has(e,"prone"))},
  disarm:      {name:"繳械", targets:u=>twoHandLocked(u) ? [] : enemiesOf(u).filter(e=>dist(e,u)<=meleeReach(u) && disarmable(e))}
};
const meleeReach = u => isRanged(u) ? 1 : reachOf(u);
function doGenAct(u, key, t){
  const b = B(), g = GEN_ACT[key], dc = dcOf(u,"STR");
  b.mode = null; faceTo(u, t); camOnAttack(u, t); useAction(u);
  // 戰技是豁免判定：先擲骰、再出手
  u.anim = {k:"punch", t:Date.now() + DICE_LEAD}; animSfx("punch", DICE_LEAD);
  b.impact = DOLL_IMPACT.punch + DICE_LEAD; panelStart(`${u.name}【${g.name}】`); sneakShow(u);
  b.impactEnd = Math.max(b.impactEnd||0, Date.now() + b.impact);
  blog(`${u.name}${g.name}${t.name}！`, "skill");
  reveal(u, "出手，現身了！");
  if(key==="disarm"){ tryDisarm(u, t); b.impact = 0; panelEnd(); if(checkResult()) return; if(u.side==="pc") afterShow(u, 1300 + DICE_LEAD); else refreshBattle(); return; }
  const s = t.mods.STR>=t.mods.DEX ? "STR" : "DEX";
  if(saveRoll(t, s, dc)){ blog(`　${t.name}沒被${g.name==="擒抱"?"抓住":g.name}。`); fxFloat(t, POP_TEXT.miss, "miss"); sfx("miss", b.impact); }
  else if(key==="grapple"){ addStatus(t, "restrained", {via:"grapple", src:u.id, dc}); fxHit(t, "burst"); sfx("hit_blunt", b.impact); blog(`　${t.name}被抓住了！不能移動，直到掙脫。`, "skill"); }
  else if(key==="shove_push"){ const x0=t.x, y0=t.y; push(u, t, 1); fxHit(t, "burst"); sfx("hit_blunt", b.impact);
    blog(t.x===x0&&t.y===y0 ? `　${t.name}後面被擋住，推不動。` : `　${t.name}被推開 1 格！`, "skill"); }
  else { knockProne(t); fxHit(t, "burst"); sfx("hit_blunt", b.impact); blog(`　${t.name}被推倒在地！`, "skill"); }
  b.impact = 0; panelEnd();
  if(checkResult()) return;
  if(u.side==="pc") afterShow(u, 1100 + DICE_LEAD); else refreshBattle();
}
// 掙脫：力量或敏捷檢定（挑高的）對抗擒抱的 DC
function doEscape(u){
  const b = B(), gs = grappled(u), s = u.mods.STR>=u.mods.DEX ? "STR" : "DEX";
  useAction(u);
  const r = d20(), total = r + u.mods[s], ok = total >= gs.dc;
  blog(`${u.name}想掙脫：d20=${r}${fmtN(u.mods[s])} = ${total} ${ok?"≥":"<"} DC ${gs.dc} → ${ok?"成功":"失敗"}`, ok?"skill":"miss");
  if(ok){ releaseGrapple(u, "掙脫了！"); u.anim = {k:"hop", t:Date.now()}; sfx("swing"); }
  if(u.side==="pc") afterShow(u, 700); else refreshBattle();
}

// 協助：相鄰的隊友（倒下的也行，改成扶起來）
const helpList = u => alliesOf(u).filter(p=>p!==u && dist(p,u)===1);
function helpTarget(u, x, y){ const t = unitAt(x,y); return t && helpList(u).includes(t) ? t : null; }
// 搜索（主動感知，大爺 10-02）：免費動作；6 格內看得到、還沒看穿的敵人；d20＋感知 對 DC（見 engine.js 的感知）
const searchTargets = u => B().units.filter(v=>v.side==="foe" && !v.dead && !v.down && !foeHid(v) && !pocketKnown(v) && dist(u,v)<=SEARCH_RANGE);
// 搜索（大爺 10-02）：一次 d20＋感知，同時①看穿點的那隻身上的東西（有點的話）②找 6 格內躲著的敵人（比牠潛行擲的數字）
//   按鈕只要有免費動作就能按：如果「附近有躲著的才能按」，等於告訴玩家附近有東西
const hiddenNear = u => B().units.filter(v=>v.side==="foe" && !v.dead && !v.down && foeHid(v) && dist(u,v)<=SEARCH_RANGE);
function doSearch(u, t){
  const b = B(); b.mode = null; if(t) faceTo(u, t); spendFree(u);
  panelStart(`${u.name}【搜索】`);
  const r = d20(), total = r + u.mods.WIS;
  const found = hiddenNear(u).filter(v=>total >= has(v,"hidden").val);
  const groundFound=groundDetect(u,total,SEARCH_RANGE);
  const ok = t ? total >= pocketDC(t) : false;
  panelRow("chk", t || {id:u.id, name:"四周"}, [r], r, total, ok || found.length || groundFound ? "found" : "fail");
  if(t){
    blog(`${u.name}搜索${t.name}身上帶的東西`, "skill");
    blog(`　感知：d20=${r}${fmtN(u.mods.WIS)} = ${total} ${ok?"≥":"<"} DC ${pocketDC(t)} → ${ok?"看穿了":"沒看出來"}`, ok?"skill":"miss", ok?"看穿了":"沒看出來");
    if(ok) markPocket(t);
  } else blog(`${u.name}搜索四周：d20=${r}${fmtN(u.mods.WIS)} = ${total}`, "skill");
  // 沒找到躲著的不寫紀錄（不然等於告訴玩家附近有東西）
  found.forEach(v=>{ blog(`　${u.name}發現了躲著的${v.name}！`, "skill"); reveal(v); fxFloat(v, POP_TEXT.spotted, "dmg"); sfx("alert"); });
  panelEnd(); sfx("pop");
  afterShow(u, DICE_TUMBLE + 500);
}
function doHelp(u, t){
  const b = B();
  b.mode = null; faceTo(u, t); useAction(u);
  if(t.down){
    // 醫療檢定：d20 + 感知 ≥ 10 就把他扶起來（1 點生命、倒地）
    const r = d20(), total = r + u.mods.WIS, ok = r===20 || (r!==1 && total>=10);
    blog(`${u.name}想把${t.name}扶起來，醫療檢定：d20=${r}${fmtN(u.mods.WIS)} = ${total} ${total>=10?"≥":"<"} 10 → ${ok?"成功":"失敗"}`, ok?"heal":"miss");
    if(ok){ t.hp = 1; t.down = false; t.dsFail = 0; addStatus(t, "prone", {}); fxFloat(t, "+1", "heal"); fxHit(t, "heal"); blog(`　${t.name}被扶起來了！（生命 1，倒地）`, "heal"); }
  } else {
    addStatus(t, "helped", {until:"start", of:u.id}); sfx("help");
    blog(`${u.name}協助${t.name}：${t.name}下次攻擊有優勢`, "skill");
  }
  afterShow(u, t.down ? 700 : 1000);
}
// ---------- 道具（免費動作） ----------
// 喝的：自己或貼身隊友；丟的：射程內看得到的敵人，或貼身隊友（＝交給他）
function syncBattleBag(u){
  if(!u || u.side!=="pc") return;
  u.backpack=u.backpack||[];
  // 「道具」不是第二個背包，只是同一背包中可在戰鬥使用的消耗品檢視。
  u.items=u.backpack.filter(it=>it.type==="consumable");
}
function itemTargets(u, it){
  const k = it.use.kind;
  if(k==="ammo") return [u];
  if(k==="drink" || k==="eat") return B().units.filter(v=>v.side===u.side && !v.dead && dist(u,v)<=1);
  return B().units.filter(v=>!v.dead && ((hostile(v,u) && !v.down && !isHid(v) && dist(u,v)<=it.use.range) || (v.side===u.side && v!==u && dist(u,v)===1)));
}
function dropItem(u, it){
  if(u.side==="pc"){
    const bi=(u.backpack||[]).indexOf(it); if(bi>=0) u.backpack.splice(bi,1);
    syncBattleBag(u);
    if(state.inv[u.id]){ const i = state.inv[u.id].indexOf(it.id); if(i>=0) state.inv[u.id].splice(i, 1); }
  }else{
    const i=u.items.indexOf(it); if(i>=0) u.items.splice(i,1);
  }
}
// 點心＝這一隻短休一次：熟練格每一階回一半（無條件進位），跟 takeRest 的短休同一條公式；不算進每天兩次短休
function snackRest(t){
  const max = slotMax(t), s = slotsOf(t);
  t.slots = max.map((m,i)=>Math.min(m, (s[i]||0) + Math.ceil(m/2)));
  if(t.side==="pc") state.proficiency[t.id] = t.slots.slice();
  blog(`　${t.name}吃飽了，像短休過一樣：熟練格 ${t.slots.join("/")}`, "heal", `${t.name} 熟練格回復`);
  fxFloat(t, POP_TEXT.yum, "heal"); fxHit(t, "heal");
}
function useItem(u, it, t){
  const b = B();
  b.mode = null;
  // 特殊彈藥：用道具規則切換，不在切換時消耗；下一次相容射擊才真正用掉。
  if(it.use.kind==="ammo"){
    const k=ammoKind(u.weapon);
    if(!k || it.ammoFor!==k){ blog(`${it.n}不能用在目前的武器上`); refreshBattle(); return; }
    spendFree(u); u.loadedAmmo=it; blog(`${u.name}切換成${it.n}，下一次射擊會使用它`, "skill"); sfx("pop"); refreshBattle(); return;
  }
  if(it.use.action){ if(!canAct()){ refreshBattle(); return; } useAction(u); }   // 點心：花動作（10-03）
  else spendFree(u);
  dropItem(u, it);
  if(t!==u) faceTo(u, t);
  // 丟給貼身的隊友：交給他
  if(it.use.kind!=="drink" && it.use.kind!=="eat" && t.side===u.side){
    if(t.side==="pc"){ t.backpack=t.backpack||[]; t.backpack.push(it); syncBattleBag(t); if(state.inv[t.id]) state.inv[t.id].push(it.id); }
    else t.items.push(it);
    blog(`${u.name}把${it.n}交給${t.name}`, "skill"); sfx("pop"); afterShow(u, 400); return;
  }
  if(it.use.kind==="eat"){
    u.anim = {k:"cast", t:Date.now()}; animSfx("cast");
    blog(t===u ? `${u.name}吃掉${it.n}` : `${u.name}把${it.n}餵給${t.name}`, "heal");
    snackRest(t);
  } else if(it.use.kind==="drink"){
    u.anim = {k:"cast", t:Date.now()}; animSfx("cast");
    blog(t===u ? `${u.name}喝下${it.n}` : `${u.name}把${it.n}餵給${t.name}`, "heal");
    b.impact = DOLL_IMPACT.cast || 0; heal(t, Math.max(1, rollDice(it.use.heal).total)); b.impact = 0;
  } else {
    // 丟道具也要擲骰（攻擊或豁免）：跟招式一樣先擲骰、再丟
    u.anim = {k:"throw", t:Date.now() + DICE_LEAD}; animSfx("throw", DICE_LEAD); camOnAttack(u, t);
    blog(`${u.name}丟出${it.n} → ${t.name}`, "skill");
    b.impact = launch(u, t, "throw", DICE_LEAD, it); panelStart(`${u.name}【${it.n}】`); sneakShow(u);
    if(it.use.kind==="attack"){
      const r = attackRoll(u, t, {bonus:u.mods.DEX + 2, ranged:true});
      if(r.hit){ hurt(t, dmgRoll(it.use.dmg, 0, r.crit), it.use.type, u);
        if(it.use.status==="burning" && !t.dead && !t.down){ addStatus(t, "burning", {}); blog(`　${t.name}燒起來了！（每回合開始 1d4，花動作撲滅）`, "skill"); } }
    } else {
      const ok = saveRoll(t, it.use.save, 8 + 2 + u.mods.DEX);
      if(!ok && it.use.dmg) hurt(t, rollDice(it.use.dmg).total, it.use.type, u);
      if(!ok && it.use.status==="restrained"){ addStatus(t, "restrained", {via:"net", dc:it.use.escape}); fxFloat(t, POP_TEXT.bound, "dmg"); blog(`　${t.name}被網子纏住了！`, "skill"); }
      if(ok){ fxFloat(t, POP_TEXT.miss, "miss"); sfx("miss", b.impact||0); }
    }
    reveal(u, "出手，現身了！");
    b.impact = 0; panelEnd();
  }
  if(checkResult()) return;
  if(u.side==="pc") afterShow(u, Math.max(900, (b.impactEnd||0) - Date.now() + 500)); else refreshBattle();
}
// 切換整組手持配置：主手＋副手一起切換；整理裝備不消耗動作
function swapWeapon(u, i){
  const w=u.spare&&u.spare[i];
  if(!w)return;
  const old=u.weapon, oldOff=u.shield?{n:"盾牌",type:"shield",_shield:true}:null, nextOff=u.offhand2||null;
  u.weapon=w; u.spare[i]=old;
  u.shield=!!nextOff;
  u.offhand2=oldOff;
  if(isTwoHand(u.weapon) && u.shield){u.offhand2={n:"盾牌",type:"shield",_shield:true};u.shield=false;}
  blog(`${u.name}切換了武器組：${u.weapon.n}${u.shield?"＋盾牌":""}`,"skill");
  refreshBattle();
}
// 撲滅火焰（動作）
function doDouse(u){
  useAction(u); u.statuses = u.statuses.filter(s=>s.k!=="burning");
  u.anim = {k:"guard", t:Date.now()}; sfx("swing");
  blog(`${u.name}拍熄身上的火`, "skill");
  if(u.side==="pc") afterShow(u, 600); else refreshBattle();
}
// 掙脫網子（動作）：力量檢定對網子的難度
function doUnnet(u){
  const rs = hasVia(u,"restrained","net"), r = d20(), total = r + u.mods.STR, ok = total >= rs.dc;
  useAction(u);
  blog(`${u.name}想掙脫網子：力量 d20=${r}${fmtN(u.mods.STR)} = ${total} ${ok?"≥":"<"} ${rs.dc} → ${ok?"掙脫了！":"還纏著"}`, ok?"skill":"miss");
  if(ok){ u.statuses = u.statuses.filter(s=>s!==rs); u.anim = {k:"hop", t:Date.now()}; sfx("swing"); }
  if(u.side==="pc") afterShow(u, 700); else refreshBattle();
}
// 靈巧脫逃（哥布林的天生能力，免費動作）：撤離或躲藏
const nimble = u => (u.innate||[]).includes("nimble") && freeLeft() && u===cur();   // 只用免費那格，主動作留著出手
function nimbleDisengage(u){ if(!nimble(u)) return false; observeInnate(u,"nimble","靈巧脫逃"); B().freeUsed = true; addStatus(u, "disengage", {until:"end", of:u.id}); blog(`${u.name}靈巧脫逃：撤離！`, "skill"); return true; }
function nimbleHide(u){ if(!nimble(u) || u.dead || u.down || hideBlock(u)) return false; observeInnate(u,"nimble","靈巧脫逃"); B().freeUsed = true; blog(`${u.name}靈巧脫逃：躲起來！`, "skill"); tryHide(u); return true; }

// 招式的動作：照「出處」那組的動作；但學來的招用不同類的武器做時（例如拿弓用扎腿），改用手上武器的動作，
// 這樣遠程才會射出箭、近戰才會揮出去
const RANGED_GROUPS = ["bow","crossbow","thrown","firearm"];
// 拿火槍、手槍時，射擊動作換成開槍（子彈＋槍口白煙＋槍聲，10-03）
function skillAnim(u, sk, t){
  const k = skillAnimBase(u, sk, t), cg = u.weapon ? groupOf(u.weapon) : null;
  return k==="shoot" && cg && cg.id==="firearm" ? "fire" : k;
}
function skillAnimBase(u, sk, t){
  if(sk.def.components)return "cast";
  const base = sk.anim || animFor(sk.group.id, sk.idx);
  if(FOCUS_GROUPS.includes(sk.group.id)) return base;
  const far = t && t.x!==undefined && dist(u,t) > reachOf(u);
  const ranged = isRanged(u) || (far && hasProp(u.weapon,"投擲"));
  const skRanged = RANGED_GROUPS.includes(sk.group.id), cg = u.weapon ? groupOf(u.weapon) : null;
  if(ranged && !skRanged) return isRanged(u) && cg ? animFor(cg.id, 0) : "throw";
  if(!ranged && skRanged) return cg ? animFor(cg.id, 0) : "punch";
  return base;
}
function doSkill(u, sk, t){
  const b = B();
  const problem=componentProblem(u,sk);if(problem){blog(`${sk.def.name}：${problem}`);refreshBattle();return;}
  if(sk.def.components?.v)reveal(u,"詠唱，現身了！");
  // 普通基本攻擊不觸發學習；法器第 0 招若本身不是基本攻擊（如火焰箭）仍可學。
  if(u.side==="foe" && !sk.def.basicAttack && !(sk.idx===0 && HAS_BASIC(sk.group))) observedSkill(u,sk.key,sk.def.name,false);
  // 用哪一階的格子：瞄準列選的（還拿得出來的話），不然用最低的；升階＝高出要求幾階（嬌嬌物理招再 +1）
  // 狩印：標記的目標倒下後，改標下一個不用再花格子（SRD：之後的回合可以轉移印記）
  const tier = remarkFree(u, sk) ? 0 : tiersFor(u, sk).includes(b.tier) ? b.tier : lowestTier(u, sk), up = upOf(u, sk, tier);
  const names = Array.isArray(t) ? [...new Set(t.map(x=>x.name))].join("、") : (t && t.name && t!==u ? t.name : "");
  const paid = spendSlot(u, sk, tier);
  blog(`${u.name}使用【${sk.def.name}】${names ? `→ ${names}` : ""}${paid ? `（${TIER_NAME[paid]}格${up ? `，升 ${up} 階` : ""}）` : ""}`, "skill");
  const t0 = Array.isArray(t) ? t[0] : t;
  if(t0 && t0!==u && t0.x!==undefined){ faceTo(u, t0); if(sk.def.kind!=="輔助") camOnAttack(u, t0); }
  const k = skillAnim(u, sk, t0);
  // 會擲骰的招（攻擊、豁免）先讓骰子滾完，角色才出招；輔助不擲骰，照舊馬上動
  const lead = sk.def.kind!=="輔助" && !sk.impl.multi ? DICE_LEAD : 0;
  u.anim = {k, t:Date.now() + lead}; animSfx(k, lead);
  const hitAt = b.impact = launch(u, t, k, lead);
  b.impactEnd = Math.max(b.impactEnd||0, Date.now() + hitAt);
  panelStart(`${u.name}【${sk.def.name}】`); sneakShow(u);      // 骰子面板；從藏身處出手先補潛行對決
  b.up = up; b.upBy = u.id; b.upDice = canUp(sk) && !sk.def.up ? up : 0;   // 沒寫升階效果的攻擊招：命中多武器骰
  sk.impl.run(u, t);
  b.markHit = null;                          // 狩印追加傷害只算這一招裡的那一擊
  b.up = 0; b.tier = 0; b.upBy = null; b.upDice = 0; panelEnd();
  reveal(u, "出手，現身了！");               // 用技能（攻擊、施法）就現身
  b.impact = 0;
  if(sk.def.free) spendFree(u); else useAction(u);
  b.mode = null;
  if(checkResult()) return;
  if(u.side==="pc") afterShow(u, Math.max(DOLL_DUR[k]||500, hitAt + 900, (b.impactEnd||0) - Date.now()));
  else refreshBattle();
}
// 動作演出期間：鎖住操作、選單先收起來，演完才重新打開
function afterShow(u, ms){
  const b = B();
  b.busy = true; b.menu = null; refreshBattle();
  later(()=>{
    if(B()!==b) return;
    b.busy = false;
    if(!b.result && cur()===u && !u.down && !u.dead) b.menu = "root";
    refreshBattle();
  }, ms);
}

// 敵人動作後要等多久才換下一隻：至少 ms，而且要等飛行物打中後再看一下
const settle = ms => Math.max(ms, (B().impactEnd||0) - Date.now() + 600);

// ---------- 敵人挑招（跟我方同一套技能，照手上的武器、法器） ----------
// 範圍招（橫掃、震地、回掃）：身邊有兩個以上看得到的敵人才用
const AOE_SELF = {cleave:u=>reachOf(u), quake:u=>1};   // 以自己為中心的範圍招：範圍多大（敵人 AI 用）
const foeUsable = e => unitSkills(e).filter(s=>s.impl && !s.impl.passive && hasAmmoFor(e) && skillReady(e,s) && !(s.impl.can && !s.impl.can(e)) && !(fromTwoHanded(e,s) && inGrapple(e)));
// 對 t 能用的攻擊招：要用格子的招式還有格子就用（六成機率），不然普攻；回傳 {sk, t}
// 不升階（一律用最低階的格子）；之後頭目會省格子，再加判斷
function foePick(e, t){
  const sks = foeUsable(e);
  const aoe = sks.find(s=>AOE_SELF[s.key] && seenPcs().filter(p=>dist(p,e)<=AOE_SELF[s.key](e)).length >= 2);
  if(aoe) return {sk:aoe, t:e};
  const onT = t ? sks.filter(s=>["enemy","line"].includes(s.impl.target) && validTarget(e, s, t.x, t.y)) : [];
  if(!onT.length) return null;
  const special = onT.filter(s=>baseTierOf(s) > 0);
  const sk = special.length && Math.random() < .6 ? special[Math.floor(Math.random()*special.length)] : (onT.find(s=>s.idx===0) || onT[0]);
  return {sk, t};
}
// 回合開始的免費動作：補血（同伴血掉一半）、舉盾護著被貼身的同伴、敵人靠近時開護盾術、有人要靠近時擺阻截架式
function foeFreePick(e){
  const pcs = seenPcs();
  for(const s of foeUsable(e).filter(s=>s.def.free)){
    if(s.group.id==="shield"){ if(alive(e.side).some(o=>o!==e && dist(o,e)===1 && pcs.some(p=>dist(p,o)<=1))) return {sk:s, t:e}; continue; }   // 守護：旁邊有被貼著的同伴就開
    if(s.impl.target==="ally"){ const t = alive(e.side).filter(o=>o.hp<=o.maxHp/2 && validTarget(e,s,o.x,o.y)).sort((a,c)=>a.hp-c.hp)[0]; if(t) return {sk:s, t}; continue; }
    if(s.def.name==="護盾術" && !has(e,"shieldSpell") && pcs.some(p=>dist(p,e)<=2)) return {sk:s, t:e};
    if(s.key==="guard_stance" && !hasVia(e,"stance","guard") && pcs.some(p=>dist(p,e)<=reachOf(e)+4)) return {sk:s, t:e};
  }
  return null;
}
// 對 t 出手：挑到招就用，回傳要等多久；打不到回傳 0
function foeHit(e, t){
  const p = foePick(e, t);
  if(!p) return 0;
  B().up = 0; B().tier = 0;
  doSkill(e, p.sk, p.sk.impl.multi ? foeDarts(e, p.sk, t) : p.t);
  return settle(Math.max(DOLL_DUR[animFor(p.sk.group.id, p.sk.idx)] || 700, 700));
}
// 魔法飛彈分目標：每發打「還沒被分到足以打倒的傷害、血最少的」，大家都分夠了就補在血最少的身上（每發平均算 3.5）
function foeDarts(e, sk, t){
  const n = sk.impl.darts(), pool = seenPcs().filter(p=>validTarget(e, sk, p.x, p.y)).sort((a,c)=>a.hp-c.hp);
  if(!pool.length) return Array(n).fill(t);
  const got = new Map(), out = [];
  for(let i=0;i<n;i++){
    const p = pool.find(p=>(got.get(p)||0) < p.hp) || pool[0];
    got.set(p, (got.get(p)||0) + 3.5); out.push(p);
  }
  return out;
}
// 這隻用什麼當遠程：拿彈藥武器 → 武器射程；拿法器 → 普攻法術的射程；都沒有 → 0（近戰）
function foeRange(e){
  if(isRanged(e)) return rangeOf(e);
  const s = unitSkills(e).find(s=>s.idx===0 && s.impl && s.group.weapons.some(n=>(ITEMS.find(i=>i.n===n)||{}).type==="focus") && s.impl.target==="enemy");
  return !e.weapon && s && s.impl.range ? s.impl.range(e) : 0;
}

// ---------- 敵人的戰技：貼身時先看有沒有更好的招，沒有就打 ----------
// 1. 抓住拿雙手遠程武器的（弓、弩）：被抓住就不能用雙手武器
// 2. 打掉只靠法器的（玲玲、法書、法球）：沒法器就沒法術
// 3. 有別的哥布林也貼著同一個人 → 推倒他，讓同伴近戰有優勢
// 條件照規則走：擒抱要有空手、不能已經抓著人；推撞、繳械都要在觸及內
function foeManeuver(e, adj){
  if(isRanged(e) || e.dead) return null;
  const pick = (key, list) => { const t = list.filter(p=>GEN_ACT[key].targets(e).includes(p))[0]; return t ? {key, t} : null; };
  const shooters = adj.filter(p=>isRanged(p) && holdsTwoHanded(p) && !grappled(p));
  if(freeHand(e) && !victimsOf(e).length){ const m = pick("grapple", shooters); if(m) return m; }
  const casters = adj.filter(p=>!p.weapon && p.focus);
  { const m = pick("disarm", casters); if(m) return m; }
  const ganged = adj.filter(p=>!has(p,"prone") && alive("foe").some(o=>o!==e && dist(o,p)<=1));
  { const m = pick("shove_prone", ganged); if(m) return m; }
  return null;
}
// 貼身時的一回合動作：戰技或攻擊血最少的；回傳要等多久才換人
function foeMelee(e, adj){
  const m = foeManeuver(e, adj);
  if(m){ doGenAct(e, m.key, m.t); return settle(1300); }
  return foeHit(e, adj.sort((a,c)=>a.hp-c.hp)[0]) || 600;
}

// ---------- 敵人 AI：走向最近的角色，貼身就打 ----------
const seenPcs = () => alive("pc").filter(p=>!isHid(p));        // 敵人看得到的角色（躲著的不算）
function aiTurn(e){
  const b = B();
  if(!b || b.result || e.dead || !b.units.includes(e)) return;   // 戰鬥不在、或是上一場留下的計時器（重新挑戰後）
  if(!alive("pc").length){ endTurn(); return; }   // 四小隻全倒在地上擲死亡豁免：敵人沒事做
  // 被網住：先掙脫；身上著火快燒死：先撲滅
  if(hasVia(e,"restrained","net")){ doUnnet(e); later(endTurn, settle(800)); return; }
  if(has(e,"burning") && e.hp<=4){ doDouse(e); later(endTurn, 800); return; }
  // 免費動作：有用得上的免費招式就先用，再回來做這回合的主動作
  // 免費那格用過了、同伴快倒（剩四分之一）→ 用主動作再補一次
  { const f = foeFreePick(e);
    if(f && (!b.freeUsed || (canAct() && f.sk.impl.target==="ally" && f.t.hp<=f.t.maxHp/4))){ doSkill(e, f.sk, f.t); later(()=>{ if(b.result) return; if(cur()===e && !e.dead && !e.down) aiTurn(e); else endTurn(); }, settle(900)); return; } }
  if(!canAct()){ refreshBattle(); later(endTurn, 500); return; }        // 主動作拿去補血了：這回合就這樣
  // 學習系統測試：每隻哥布林先使用一項「既有技能表」裡的招式一次。
  // 不新增測試專用技能，先驗證：敵人施放 → 被動觀察 → 理解/失敗 → 小筆記。
  if(!e.testSkillUsed && e.testSkill){
    const sk=learnedSkillByKey(e.testSkill);
    if(sk && sk.impl && skillReqMet(e,sk) && !componentProblem(e,sk) && skillReady(e,sk)){
      let t=null;
      if(sk.impl.target==="self") t=e;
      else if(sk.impl.target==="enemy"){
        const r=sk.impl.range?sk.impl.range(e):1;
        t=seenPcs().filter(p=>dist(p,e)<=r).sort((a,c)=>a.hp-c.hp)[0]||null;
      }
      if(t){ e.testSkillUsed=true; doSkill(e,sk,t); later(endTurn,settle(1000)); return; }
    }
  }
  if(e.focus && groupOf(e.focus).id==="shaman_totem") return aiShaman(e);
  const pcs = seenPcs();
  if(!pcs.length){ if(isHid(e)){ endTurn(); return; } blog(`${e.name}東張西望，找不到人。`); later(endTurn, 700); return; }
  const holder = grapplerOf(e);
  if(holder){
    if(!isRanged(e) && !holdsTwoHanded(e) && dist(holder,e)<=reachOf(e)){ later(endTurn, foeHit(e, holder) || 700); return; }
    doEscape(e); later(endTurn, settle(700)); return;
  }
  // 手上空空的：找走得到、撿得起來的東西（自己的、或我方掉的都行），挑最近的
  const reach = !e.weapon && !e.focus && (b.drops||[]).length ? reachable(e, b.moveLeft) : null;
  const grab = reach && (b.drops||[]).filter(d=>canPick(e, d.item) && reach.has(`${d.x},${d.y}`))
    .map(d=>({d, path:reach.get(`${d.x},${d.y}`)})).sort((x,y)=>x.path.cost-y.path.cost)[0];
  if(grab){
    const nearFist = pcs.some(p=>dist(p,e)<=1);
    // 旁邊有人而且東西要走很遠 → 先揮拳；不然去撿（撿完如果打得到人就打）
    if(!(nearFist && grab.path.cost > 2)){
      blog(`${e.name}衝去撿${grab.d.name}！`);
      b.busy = true;
      walk(e, grab.path, ()=>{ b.busy = false;
        const r = foeRange(e) || reachOf(e), t = seenPcs().filter(p=>dist(p,e)<=r)[0];
        let wait = 700;
        if(t && !e.dead) wait = foeHit(e, t) || 700;
        refreshBattle(); later(endTurn, wait); });
      return;
    }
  }
  if(foeRange(e)) return aiRanged(e, pcs, foeRange(e));
  const adj = pcs.filter(p=>dist(p,e)<=reachOf(e));
  if(adj.length){ later(endTurn, foeMelee(e, adj)); return; }
  // 找離自己最近、能貼身的角色
  const all = reachable(e, 99);
  let best = null;
  pcs.forEach(p=>{
    for(const [dx,dy] of DIRS){
      const path = all.get(`${p.x+dx},${p.y+dy}`);
      if(path && (!best || path.cost < best.path.cost)) best = {p, path};
    }
  });
  if(!best || !b.moveLeft){ blog(`${e.name}在原地大叫。`); later(endTurn, 600); return; }
  const steps = trimPath(best.path, b.moveLeft, victimsOf(e).length ? 2 : 1, e);
  b.busy = true;
  walk(e, steps, ()=>{
    b.busy = false;
    const near = seenPcs().filter(p=>dist(p,e)<=reachOf(e));
    let wait = 700;
    if(near.length && !e.dead && !(b.dazed && steps.length)){
      // 走過去之後優先處理原本鎖定的那隻（戰技的判斷一樣適用）
      const first = near.includes(best.p) ? [best.p, ...near.filter(p=>p!==best.p)] : near;
      const m = foeManeuver(e, first);
      if(m){ doGenAct(e, m.key, m.t); wait = settle(1300); } else wait = foeHit(e, first[0]) || 700;
    }
    refreshBattle();
    later(endTurn, wait);
  });
}
// 遠程（弓、法器）：被貼身就找一格離大家都至少 2 格、而且最遠的地方退過去；射程內挑好打的出手
function aiRanged(e, pcs, R){
  const b = B();
  const nearest = p => Math.min(...seenPcs().map(q=>dist(q,p)));
  const shoot = ()=>{
    // 跳開途中被打倒（藉機攻擊）或戰鬥已經結束：不射、不留遺言；戰鬥還沒結束就照常換人
    if(e.dead || e.down || b.result){ refreshBattle(); if(!b.result) later(endTurn, settle(700)); return; }
    // 挑好打的：沒掩護、沒躲草叢的優先，再挑血少的
    const hard = p => coverAC(coverOf(e,p)) + (hidden(p) ? 5 : 0);
    const inRange = seenPcs().filter(p=>dist(p,e)<=R).sort((a,c)=>hard(a)-hard(c) || a.hp-c.hp);
    let wait = 700;
    if(inRange.length && !e.dead){ wait = foeHit(e, inRange[0]) || 700; nimbleHide(e); }
    else blog(`${e.name}找不到可以射的目標。`);
    refreshBattle(); later(endTurn, wait);
  };
  let path = null;
  if(nearest(e) <= 1 && b.moveLeft){
    let best = null;
    reachable(e, b.moveLeft).forEach((p,k)=>{
      const [x,y] = k.split(",").map(Number), d = nearest({x,y});
      if(d>=2 && (!best || d>best.d || (d===best.d && p.cost<best.path.cost))) best = {d, path:p};
    });
    if(best){ path = best.path; nimbleDisengage(e); blog(`${e.name}往後跳開，拉開距離！`); }
  } else if(!pcs.some(p=>dist(p,e)<=R) && b.moveLeft){
    // 射程外：往最近的角色靠近到射程內
    const t = pcs.sort((a,c)=>dist(a,e)-dist(c,e))[0];
    let best = null;
    reachable(e, b.moveLeft).forEach((p,k)=>{ const [x,y]=k.split(",").map(Number), d=dist({x,y},t);
      if(d<=R && d>=2 && (!best || p.cost<best.path.cost)) best={path:p}; });
    if(best) path = best.path;
  }
  if(!path){ shoot(); return; }
  b.busy = true;
  walk(e, path, ()=>{ b.busy = false; shoot(); });
}

// ---------- 哥布林薩滿：躲在草叢裡施法（法術都來自薩滿圖騰） ----------
// 1. 已經現身、上回合施過法、藏得住、旁邊沒人 → 躲回去
// 2. （治癒真言是免費動作：回合一開始，12 格內有同伴血掉一半就先補）
// 3. 6 格內看得到角色、災禍術還沒用 → 災禍術
// 4. 射程內看得到角色 → 火焰箭（被貼身先跳開，跟弓手一樣）
// 5. 都沒有：躲著就靜靜等，現身了就往前靠
function aiShaman(e){
  const pcs = seenPcs(), spell = n => foeUsable(e).find(s=>s.def.name===n);
  if(!isHid(e) && e.castLast && !hideBlock(e)){
    e.castLast = false;
    blog(`${e.name}縮回藏身處……`, "skill"); e.anim = {k:"guard", t:Date.now()}; animSfx("guard");
    tryHide(e); refreshBattle(); later(endTurn, 1000); return;
  }
  e.castLast = false;
  const bane = spell("災禍術"), bolt = spell("火焰箭");      // 治癒真言是免費動作，回合一開始就用了（foeFreePick）
  if(bane && pcs.some(p=>dist(p,e)<=6 && !baned(p))) return shamanCast(e, bane, e);
  const R = bolt ? bolt.impl.range(e) : 0;
  if(R && pcs.some(p=>dist(p,e)<=R)){ e.castLast = true; return aiRanged(e, pcs, R); }
  if(isHid(e)){ endTurn(); return; }                       // 躲著靜靜等：不停頓、不寫紀錄
  if(!pcs.length){ blog(`${e.name}東張西望，找不到人。`); later(endTurn, 700); return; }
  aiRanged(e, pcs, R || 1);
}
function shamanCast(e, sk, t){
  doSkill(e, sk, t);
  e.castLast = true;
  if(nimbleHide(e)) e.castLast = false;                     // 靈巧脫逃：施完法馬上躲回去
  later(endTurn, settle(1200));
}

// ---------- 飄字 ----------
// 被動觀察的頭上符號：kind＝ok（!）、fail（?）、known（...）；停留時間依演出長短
const OBS_DUR = {ok:1400, fail:1700, known:2000, sneak:900, sweat:1800, shake:1600, anger:1400, note:1800};   // 後四個是漫畫符號（10-03，時間暫定）   // sneak：從藏身處出手時對面沒發現的 ?（js/battle/engine.js 的 sneakShow）
function obsMark(u, kind){ (B().marks = B().marks || []).push({id:u.id, kind, t:impactAt(), dur:OBS_DUR[kind]}); }
function fxFloat(u, text, cls){ (B().floats = B().floats || []).push({x:u.x, y:u.y, text, cls, t:impactAt()}); }
