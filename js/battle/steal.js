/* ======================== 偷竊（大爺 10-20） ========================
   通用動作（行動選單，跟擒抱、推撞並排）：站在敵人旁邊，花一個主要動作，擲 d20＋敏捷對目標的被動感知（10＋感知）。
   從藏身處偷（潛行中）有優勢。只偷背包裡的東西（手上的武器用繳械）。
   背包還沒看穿：盲摸，成功隨機摸到一件背得動的，順便看穿整個背包；看穿了就挑要偷哪一件。
   失敗：沒偷到，躲著的現身。偷到的放進小偷的背包，背不動就不能偷。
   探索中也能偷：摸到敵人旁邊（還沒開戰＝牠沒察覺），不花動作；成功牠完全沒發現，失敗直接開戰。
   系統敵我共用，這次 AI 不用（之後讓盜賊偷）；NPC（商人）不能偷。默默失控【順手牽羊】旁邊有敵人就偷。 */
const stealItems = t => [...new Set([...(t.backpack||[]), ...(t.items||[])])].filter(it=>it && it.type!=="shield");
const stealWeight = u => isPcCritter(u) ? weightOf(u.id) : [u.weapon,u.focus,u.armor,u.backpackEquip,...(u.backpack||[])].filter(Boolean).reduce((n,it)=>n+(Number(it.wt)||0),0);
const stealFits = (u, it) => stealWeight(u) + (Number(it.wt)||0) <= worldCapacity(u) + 1e-9;
// 可以偷的對象：相鄰、看得到、還站著的敵人；已經看穿而且背包空了就不算
const stealTargets = u => enemiesOf(u).filter(t=>t.side==="foe" && dist(u,t)<=1 && !t.dead && !t.down && !(pocketKnown(t) && !stealItems(t).length));
function stealBlock(u){
  if(!stealTargets(u).length) return enemiesOf(u).some(t=>dist(u,t)<=1) ? "牠身上沒東西了" : "旁邊沒有敵人";
  return "";
}
function stealPick(u, t){   // 點了目標：看穿了就挑東西，沒看穿就盲摸
  const b = B();
  if(pocketKnown(t)){ b.stealAsk = {who:u.id, t:t.id}; b.busy = true; refreshBattle(); return; }
  doSteal(u, t, null);
}
function stealAskHTML(b){
  const a = b.stealAsk, u = b.units.find(v=>v.id===a.who), t = b.units.find(v=>v.id===a.t);
  const items = t ? stealItems(t) : [];
  return `<div class="bt-ov bt-react" role="dialog" aria-live="assertive"><h3>${STEAL_UI.pick(t?.name||"")}</h3>${choiceBtnsHTML(items.map(it=>{const heavy = !stealFits(u,it);
    return {attr:`data-steal-item="${it.id}"`, label:it.n, sub:heavy ? `${it.wt||0} lb・${STEAL_UI.heavy}` : `${it.wt||0} lb`, off:heavy};}), {attr:`data-steal-item=""`, label:STEAL_UI.cancel})}</div>`;
}
function answerStealPick(id){
  const b = B(), a = b && b.stealAsk; if(!a) return; b.stealAsk = null; b.busy = false;
  const u = b.units.find(v=>v.id===a.who), t = b.units.find(v=>v.id===a.t);
  if(!id || !u || !t){ b.menu = a.explore ? null : "act"; refreshBattle(); return; }
  doSteal(u, t, stealItems(t).find(it=>it.id===id) || null, !!a.explore);
}
// 擲骰與結算；explore＝探索中（不花動作，失敗直接開戰）
function doSteal(u, t, want, explore=false){
  const b = B(); b.mode = null; b.menu = null; faceTo(u, t);
  if(!explore) useAction(u);
  const hidden = isHid(u), r1 = d20(), r2 = hidden ? d20() : null, r = hidden ? Math.max(r1, r2) : r1;
  const total = r + u.mods.DEX, dc = passivePer(t), ok = total >= dc;
  u.anim = {k:"punch", t:Date.now() + DICE_LEAD}; animSfx("punch", DICE_LEAD);
  panelStart(`${u.name}【${STEAL_UI.name}】`);
  panelRow("chk", t, hidden ? [r1, r2] : [r], r, total, ok ? "stolen" : "fail");
  blog(`${u.name}偷偷把手伸向${t.name}的背包……`, "skill");
  blog(`　敏捷：d20=${r}${hidden?`（藏身優勢 ${r1}/${r2}）`:""}${fmtN(u.mods.DEX)} = ${total} ${ok?"≥":"<"} 被動感知 ${dc} → ${ok?"得手":"被發現了"}`, ok?"skill":"miss", ok?"得手":"失手");
  let got = null;
  if(ok){
    const fits = stealItems(t).filter(it=>stealFits(u, it));
    got = want ? (stealFits(u, want) ? want : null) : fits[Math.floor(Math.random()*fits.length)] || null;
    if(!pocketKnown(t)){ markPocket(t); blog(`　${u.name}摸清楚了${t.name}身上帶的東西`, "skill"); }
    if(got){
      const drop1 = arr => { const i = (arr||[]).indexOf(got); if(i>=0) arr.splice(i,1); };   // 同樣的消耗品可能是同一個物件：只拿走一個
      drop1(t.backpack); drop1(t.items);
      (u.backpack ||= []).push(got); if(isPcCritter(u)){ (state.inv[u.id] ||= []).push(got.id); syncBattleBag(u); }
      blog(`　${u.name}偷到了${got.n}！`, "skill", got.n); fxFloat(u, STEAL_UI.pop, "heal"); sfx("pop", DICE_LEAD); funNote("pickup", u, {t:got.n});
    } else blog(`　摸到了，可是背不動，只好放回去。`, "miss");
  } else if(hidden) reveal(u, "伸手的時候被看到，現身了！");
  panelEnd();
  if(explore){
    if(!ok){ stealWakeUp(u, t); return; }
    refreshBattle(); return;
  }
  if(checkResult()) return;
  if(playerControlled(u)) afterShow(u, DICE_TUMBLE + 700); else refreshBattle();   // 失控的默默由 AI 收尾
}
// 探索中失手：那一小隊和我方都察覺彼此，直接開戰（不算奇襲）
function stealWakeUp(u, t){
  const b = B(), squad = b.units.filter(e=>e.side==="foe" && !e.dead && !e.fled && (e===t || (t.squad!==undefined && e.squad===t.squad)));
  const pcs = b.units.filter(isPcCritter).filter(p=>!p.dead);
  b.exploreAwareness ||= {};
  squad.forEach(e=>b.exploreAwareness[e.id] = pcs.map(p=>p.id));
  pcs.forEach(p=>b.exploreAwareness[p.id] = [...new Set([...(b.exploreAwareness[p.id]||[]), ...squad.map(e=>e.id)])]);
  blog(`${t.name}發現有人在翻牠的背包！`, "kill");
  enterExploreCombat(t.id, false);
}
// 探索：目前操作的那隻旁邊、還沒開戰的敵人
const exploreStealTarget = () => { const u = exploreUnit(); if(!u || u.down || u.dead) return null; return stealTargets(u).sort((a,c)=>dist(a,u)-dist(c,u))[0] || null; };
function exploreSteal(){
  const b = B(), u = exploreUnit(), t = exploreStealTarget(); if(!t || b.busy || b.exploreStopped) return;
  b.exploreMenu = null;
  if(pocketKnown(t)){ b.stealAsk = {who:u.id, t:t.id, explore:true}; b.busy = true; refreshBattle(); return; }
  doSteal(u, t, null, true);
}
