/* ======================== 坐騎：韁繩叫出來的骷髏戰馬（大爺 10-20，騎乘第二批） ========================
   打倒死亡騎士有機率掉「骷髏戰馬的韁繩」。帶著韁繩的小傢伙在戰鬥中花一個主要動作把牠叫到旁邊的空格。
   同一匹馬：血量跨戰鬥保留在 state.steed；被打倒就散成一堆骨頭，長休後拼回來、血回滿。
   第一次叫出來讓玩家取名字（最多 8 個字，空白＝骨骨），之後狀態卡可以改名；取名、改名後小傢伙們吐槽一輪。
   沒人騎時由玩家操作（我方單位，steed:true）；不拿經驗、沒有壓力、不算進輸贏。四隻都能騎，一次一隻。
   目前只在戰鬥中叫；戰鬥結束（勝、敗、切回探索）牠就回去，血量記著。 */
const STEED_ID = "steed", STEED_DEFAULT_NAME = "骨骨", STEED_NAME_MAX = 8;
const steedUnit = () => B()?.units.find(v=>v.steed) || null;
// 梟熊寶寶（10-21，js/owlbear-story.js）：加入以後也走這一套（steed:true＋pet:true），記錄在 state.pet；場上一次只叫一隻
const companionRec = h => h && h.pet ? state.pet : state.steed;
const companionDefaultName = pet => pet ? OWLBEAR_STORY.pet.defaultName : STEED_DEFAULT_NAME;
// 韁繩全隊共用（大爺 10-20）：隊上任何一隻帶著，誰都能叫
const reinsOf = u => (B()?.units||[]).filter(isPcCritter).flatMap(v=>v.backpack||[]).find(it=>it.summon) || null;
function summonBlock(u){
  const b = B();
  if(!reinsOf(u)) return "沒帶韁繩";
  if(b.phase!=="combat") return "戰鬥中才能叫";
  if(steedUnit()) return "已經叫出來了";
  if(state.steed && state.steed.bones) return "骨頭散了，長休後才拼得回來";
  if(!freeSpotFor({side:"pc", steed:true, type:reinsOf(u).summon, x:u.x, y:u.y}, u.x, u.y, 2)) return "旁邊沒有空位";
  return "";
}
function summonSteed(u){
  const it = reinsOf(u); if(!it || summonBlock(u) || !canAct()) return;
  state.steed ||= {type:it.summon, name:null, hp:ENEMIES[it.summon].hp, bones:false};
  callCompanion(u, state.steed, false);
}
function petSummonBlock(u){
  const b = B(), s = state.pet;
  if(!s) return "-";
  if(b.phase!=="combat") return "戰鬥中才能叫";
  if(steedUnit()) return "已經叫出來了";
  if(s.bones) return OWLBEAR_STORY.pet.hurtBlock;
  if(!freeSpotFor({side:"pc", steed:true, type:s.type, x:u.x, y:u.y}, u.x, u.y, 2)) return "旁邊沒有空位";
  return "";
}
function summonPet(u){ if(!state.pet || petSummonBlock(u) || !canAct()) return; callCompanion(u, state.pet, true); }
// 叫出來（韁繩的馬、梟熊寶寶共用）：放在叫的人旁邊放得下的地方，排在牠後面行動
function callCompanion(u, s, pet){
  const b = B(), m = ENEMIES[s.type], p = freeSpotFor({side:"pc", steed:true, type:s.type, x:u.x, y:u.y}, u.x, u.y, 2);   // 大型的要整塊 2×2 放得下（10-20）
  if(!p) return;
  useAction(u);
  const h = {
    id:pet ? "pet" : STEED_ID, side:"pc", steed:true, pet, type:s.type, name:s.name || m.name, color:pet ? "#d9a66b" : "#b9a0ff", look:m.look, natural:m.natural||null, special:null,
    x:p.x, y:p.y, hp:Math.max(1, Math.min(s.hp, m.hp)), maxHp:m.hp, scores:{...m.scores}, mods:abilityMods(m), baseAc:m.ac,
    resistances:[...(m.resistances||[])], damageImmunities:[...(m.damageImmunities||[])], vulnerabilities:[...(m.vulnerabilities||[])],
    weapon:null, focus:null, shield:false, armor:null, spare:[], items:[], backpackEquip:null, learned:[], activeSkills:[],
    speed:m.speed, statuses:[], level:1, down:false, face:u.face||1, oaUsed:false, slots:[0], combatActive:true, init:u.init - .001, born:null
  };
  b.units.splice(b.turn + 1, 0, h);                 // 排在叫牠的人後面：這輪接著輪到牠
  faceTo(u, h); u.anim = {k:"cast", t:Date.now()}; sfx("pop");
  blog(pet ? `${u.name}喊了一聲，${h.name}從樹叢裡跑了過來！` : `${u.name}拉了拉韁繩，${h.name}從地上冒了出來！`, "skill"); fxHit(h, "spark");
  if(!s.name){ b.steedNameAsk = {first:true, pet}; b.busy = true; }
  refreshBattle();
}
// 取名／改名：確定後同步到場上那匹和存檔，再吐槽一輪
function steedNameHTML(b){
  const a = b.steedNameAsk, rec = a.pet ? state.pet : state.steed, cur0 = (rec && rec.name) || "", P = OWLBEAR_STORY.pet;
  return `<div class="bt-ov bt-react" role="dialog" aria-live="assertive"><h3>${a.first ? (a.pet ? P.nameFirst : MOUNT_UI.nameFirst) : MOUNT_UI.nameAgain}</h3>
    <p>${a.pet ? P.nameHint : MOUNT_UI.nameHint}</p><input class="steed-name" id="steedName" maxlength="${STEED_NAME_MAX}" value="${a.first ? "" : cur0}" placeholder="${companionDefaultName(a.pet)}" autocomplete="off">
    ${choiceBtnsHTML([{attr:`data-steed-name="ok"`, label:MOUNT_UI.ok}], a.first ? null : {attr:`data-steed-name=""`, label:MOUNT_UI.cancel})}</div>`;
}
function answerSteedName(ok, value){
  const b = B(), a = b && b.steedNameAsk; if(!a) return;
  b.steedNameAsk = null; b.busy = false;
  if(!ok){ refreshBattle(); return; }
  const rec = a.pet ? state.pet : state.steed; if(!rec){ refreshBattle(); return; }
  const def = companionDefaultName(a.pet), name = String(value||"").trim().slice(0, STEED_NAME_MAX) || def;
  rec.name = name; const h = steedUnit(); if(h && !!h.pet===!!a.pet) h.name = name;
  blog(`${a.pet ? "梟熊寶寶的名字：" : MOUNT_UI.named}「${name}」`, "skill");
  steedBanter(a.first ? (name===def ? "gugu" : "first") : "rename", name, a.pet);
  refreshBattle();
}
function steedBanter(kind, name, pet=false){
  const b = B(), lines = ((pet ? OWLBEAR_STORY.pet.nameBarks : STEED_NAME_BARKS)[kind] || []);
  lines.forEach(([id, text], i)=>{ const u = b.units.find(v=>v.id===id && !v.dead && !v.down); if(u) say(u, text.replaceAll("{name}", name), i*1700); });
}
// 戰鬥結束：記下血量（倒下＝散成骨頭），把牠從戰場收回去
function stashSteed(b=B()){
  const h = b && b.units.find(v=>v.steed); if(!h) return;
  const r = riderOf(h); if(r){ delete r.mountId; delete h.riderId; }
  const rec = companionRec(h);
  if(rec){ rec.hp = h.down || h.dead ? 0 : h.hp; rec.bones = !!(h.down || h.dead || h.hp<=0); }
  const i = b.units.indexOf(h); b.units.splice(i, 1); if(i <= b.turn) b.turn--;
}
function steedLongRest(){ for(const s of [state.steed, state.pet]){ if(!s) continue; const m = ENEMIES[s.type]; s.hp = m ? m.hp : s.hp; s.bones = false; } }

// 小傢伙騎上／下馬（花一半移動，照 SRD 騎乘）
const steedNear = u => { const h = steedUnit(); return h && !h.dead && !h.down && !ridden(h) && !has(h,"prone") && dist(u,h)<=1 ? h : null; };
function mountBlock(u){
  const b = B();
  if(!isPcCritter(u) || mountOf(u)) return "-";
  if(!steedNear(u)) return "坐騎不在旁邊";
  if(SIZES.indexOf(sizeOf(steedNear(u))) <= SIZES.indexOf(sizeOf(u))) return "坐騎太小";
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
  for(const [k, path] of all){ const [x,y] = k.split(",").map(Number); if(dist({...e, x, y}, owner)<=1 && (!best || path.cost < best.cost)) best = path; }   // 多格的馬（10-20）
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
