/* ======================== 坐騎：韁繩叫出來的骷髏戰馬（大爺 10-20，騎乘第二批） ========================
   打倒死亡騎士有機率掉「骷髏戰馬的韁繩」。帶著韁繩的小傢伙在戰鬥中花一個主要動作把牠叫到旁邊的空格。
   同一匹馬：血量跨戰鬥保留在 state.steed；被打倒就散成一堆骨頭，長休後拼回來、血回滿。
   第一次叫出來讓玩家取名字（最多 8 個字，空白＝骨骨），之後狀態卡可以改名；取名、改名後小傢伙們吐槽一輪。
   沒人騎時由玩家操作（我方單位，steed:true）；不拿經驗、沒有壓力、不算進輸贏。四隻都能騎，一次一隻。
   目前只在戰鬥中叫；戰鬥結束（勝、敗、切回探索）牠就回去，血量記著。 */
const STEED_ID = "steed", STEED_DEFAULT_NAME = "骨骨", STEED_NAME_MAX = 8;
const steedUnit = () => B()?.units.find(v=>v.steed) || null;
const reinsOf = u => (u?.backpack||[]).find(it=>it.summon) || null;
function summonBlock(u){
  const b = B();
  if(!reinsOf(u)) return "沒帶韁繩";
  if(b.phase!=="combat") return "戰鬥中才能叫";
  if(steedUnit()) return "已經叫出來了";
  if(state.steed && state.steed.bones) return "骨頭散了，長休後才拼得回來";
  if(!nearFree(u.x, u.y)) return "旁邊沒有空位";
  return "";
}
function summonSteed(u){
  const b = B(), it = reinsOf(u); if(!it || summonBlock(u) || !canAct()) return;
  const m = ENEMIES[it.summon], p = nearFree(u.x, u.y);
  state.steed ||= {type:it.summon, name:null, hp:m.hp, bones:false};
  const s = state.steed;
  useAction(u);
  const h = {
    id:STEED_ID, side:"pc", steed:true, type:s.type, name:s.name || m.name, color:"#b9a0ff", look:m.look, natural:m.natural||null, special:null,
    x:p.x, y:p.y, hp:Math.max(1, Math.min(s.hp, m.hp)), maxHp:m.hp, scores:{...m.scores}, mods:abilityMods(m), baseAc:m.ac,
    resistances:[...(m.resistances||[])], damageImmunities:[...(m.damageImmunities||[])], vulnerabilities:[...(m.vulnerabilities||[])],
    weapon:null, focus:null, shield:false, armor:null, spare:[], items:[], backpackEquip:null, learned:[], activeSkills:[],
    speed:m.speed, statuses:[], level:1, down:false, face:u.face||1, oaUsed:false, slots:[0], combatActive:true, init:u.init - .001, born:null
  };
  b.units.splice(b.turn + 1, 0, h);                 // 排在叫牠的人後面：這輪接著輪到牠
  faceTo(u, h); u.anim = {k:"cast", t:Date.now()}; sfx("pop");
  blog(`${u.name}拉了拉韁繩，${h.name}從地上冒了出來！`, "skill"); fxHit(h, "spark");
  if(!s.name){ b.steedNameAsk = {first:true}; b.busy = true; }
  refreshBattle();
}
// 取名／改名：確定後同步到場上那匹和存檔，再吐槽一輪
function steedNameHTML(b){
  const a = b.steedNameAsk, cur0 = (state.steed && state.steed.name) || "";
  return `<div class="bt-ov bt-react" role="dialog" aria-live="assertive"><h3>${a.first ? MOUNT_UI.nameFirst : MOUNT_UI.nameAgain}</h3>
    <p>${MOUNT_UI.nameHint}</p><input class="steed-name" id="steedName" maxlength="${STEED_NAME_MAX}" value="${a.first ? "" : cur0}" placeholder="${STEED_DEFAULT_NAME}" autocomplete="off">
    <button class="btn" data-steed-name="ok">${MOUNT_UI.ok}</button>${a.first ? "" : `<button class="btn" data-steed-name="">${MOUNT_UI.cancel}</button>`}</div>`;
}
function answerSteedName(ok, value){
  const b = B(), a = b && b.steedNameAsk; if(!a) return;
  b.steedNameAsk = null; b.busy = false;
  if(!ok){ refreshBattle(); return; }
  const name = String(value||"").trim().slice(0, STEED_NAME_MAX) || STEED_DEFAULT_NAME;
  state.steed.name = name; const h = steedUnit(); if(h) h.name = name;
  blog(`${MOUNT_UI.named}「${name}」`, "skill");
  steedBanter(a.first ? (name===STEED_DEFAULT_NAME ? "gugu" : "first") : "rename", name);
  refreshBattle();
}
function steedBanter(kind, name){
  const b = B(), lines = (STEED_NAME_BARKS[kind] || []);
  lines.forEach(([id, text], i)=>{ const u = b.units.find(v=>v.id===id && !v.dead && !v.down); if(u) say(u, text.replaceAll("{name}", name), i*1700); });
}
// 戰鬥結束：記下血量（倒下＝散成骨頭），把牠從戰場收回去
function stashSteed(b=B()){
  const h = b && b.units.find(v=>v.steed); if(!h) return;
  const r = riderOf(h); if(r){ delete r.mountId; delete h.riderId; }
  if(state.steed){ state.steed.hp = h.down || h.dead ? 0 : h.hp; state.steed.bones = !!(h.down || h.dead || h.hp<=0); }
  const i = b.units.indexOf(h); b.units.splice(i, 1); if(i <= b.turn) b.turn--;
}
function steedLongRest(){ if(!state.steed) return; const m = ENEMIES[state.steed.type]; state.steed.hp = m ? m.hp : state.steed.hp; state.steed.bones = false; }

// 小傢伙騎上／下馬（花一半移動，照 SRD 騎乘）
const steedNear = u => { const h = steedUnit(); return h && !h.dead && !h.down && !ridden(h) && !has(h,"prone") && dist(u,h)<=1 ? h : null; };
function mountBlock(u){
  const b = B();
  if(!isPcCritter(u) || mountOf(u)) return "-";
  if(!steedNear(u)) return "坐騎不在旁邊";
  if(has(u,"restrained")) return "被抓住了";
  if(b.moveLeft < Math.ceil(u.speed/2)) return "移動不夠";
  return "";
}
function pcMount(u){ const h = steedNear(u); if(mountBlock(u) || !h) return false; return tryRemount(u, h); }
function dismountBlock(u){
  const b = B(), h = mountOf(u); if(!h) return "-";
  if(b.moveLeft < Math.ceil(b.baseMove/2)) return "移動不夠";
  if(!nearFree(h.x, h.y)) return "旁邊沒有空位";
  return "";
}
// 自己下馬：落在旁邊的空格、不倒地；剩的移動照比例換回自己的速度
function pcDismount(u){
  const b = B(), h = mountOf(u); if(!h || dismountBlock(u)) return false;
  const cost = Math.ceil(b.baseMove/2), frac = (b.moveLeft - cost) / Math.max(1, b.baseMove), p = nearFree(h.x, h.y);
  delete u.mountId; delete h.riderId; u.x = p.x; u.y = p.y;
  b.moveLeft = Math.floor(frac * u.speed);
  blog(`${u.name}從${h.name}背上跳下來（花一半移動）`, "skill");
  return true;
}
// 敵方坐騎：主人摔下來了 → 先跑回主人旁邊讓他騎回去（路上旁邊有人照樣踢）
const steedOwner = h => B().units.find(r=>r.steedId===h.id && r.side===h.side && !r.mountId && !r.dead && !r.down) || null;
function aiSteedReturn(e){
  const b = B(), owner = steedOwner(e); if(!owner || dist(owner, e)<=1 || !b.moveLeft) return false;
  const all = reachable(e, 99); let best = null;
  for(const [dx,dy] of DIRS){ const path = all.get(`${owner.x+dx},${owner.y+dy}`); if(path && (!best || path.cost < best.cost)) best = path; }
  if(!best) return false;
  const steps = trimPath(best, b.moveLeft, 1, e);
  blog(`${e.name}往${owner.name}那邊跑過去！`);
  b.busy = true;
  walk(e, steps, ()=>{ b.busy = false;
    const near = seenFoes(e).filter(p=>dist(p,e)<=reachOf(e)); let wait = 700;
    if(near.length && !e.dead) wait = foeHit(e, near[0]) || 700;
    refreshBattle(); later(endTurn, wait); });
  return true;
}
