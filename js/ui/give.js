/* 小傢伙們之間交換東西（大爺 10-20）：狀態卡背包裡點一件東西 → 物品卡下面「交給…」選人。
   - 只能給背包裡的東西；身上裝備著的（武器、護甲、法器、飾品、背包本身）要先卸下
   - 收的那隻背不動（超過負重上限）就不能給
   - 戰鬥（戰棋）中：只能在給的那隻自己的回合、對象要相鄰、花一個免費動作（沒有就用主要動作）；探索中、戰鬥外隨時可以，不花動作
   ownership 只有一份：state.inv[id]；戰場上的單位背包同步（syncBattleBag），戰鬥外用 Equipment.refresh 重建 */
const giveUnit = id => (state.page==="battle" && B() ? B().units.find(v=>v.id===id) : null);
const giveBag = id => { const u = giveUnit(id); return u ? (u.backpack||[]) : Equipment.read(id).backpack; };
const giveLoad = id => weightOf(id);
const giveCap = id => { const u = giveUnit(id); return u ? worldCapacity(u) : abilityScore(id,"STR")*15*bagMul(Equipment.read(id).backpackEquip); };
const giveInCombat = () => state.page==="battle" && B() && B().phase==="combat" && !B().result;
function giveBlock(from, to, it){
  if(!it || !giveBag(from).some(x=>x.id===it.id)) return "裝備中的要先卸下";
  if(giveLoad(to) + (Number(it.wt)||0) > giveCap(to) + 1e-9) return `${CRITTERS.find(c=>c.id===to).name}背不動`;
  if(giveInCombat()){
    const b = B(), a = giveUnit(from), t = giveUnit(to);
    if(!a || a!==cur() || !playerControlled(a) || b.busy) return "輪到牠才能給";
    if(!t || t.dead) return "不在場上";
    if(dist(a,t)>1) return "要站在旁邊";
    if(!canFree()) return "沒有動作了";
  }
  return "";
}
function giveHTML(m){
  const it = itemById(m.id), from = m.owner;
  if(!it || !from || !CRITTERS.some(c=>c.id===from) || !giveBag(from).some(x=>x.id===it.id)) return "";
  const others = CRITTERS.filter(c=>c.id!==from);
  return `<div class="give-row"><small>${GIVE_UI.title}${giveInCombat() ? GIVE_UI.combat : ""}</small>${whoPickHTML(others.map(c=>{const why = giveBlock(from, c.id, it);
    return {id:c.id, name:c.name, sub:why, off:!!why, attr:`data-give-to="${c.id}" aria-label="交給${c.name}"`};}))}</div>`;
}
function giveItem(from, to, id){
  const it = itemById(id); if(giveBlock(from, to, it)) return false;
  const a = giveUnit(from), t = giveUnit(to);
  const fi = (state.inv[from]||[]).indexOf(id); if(fi>=0) state.inv[from].splice(fi,1);
  (state.inv[to] ||= []).push(id);
  if(a && t){
    const bi = a.backpack.indexOf(a.backpack.find(x=>x.id===id)); const obj = a.backpack.splice(bi,1)[0];
    (t.backpack ||= []).push(obj); syncBattleBag(a); syncBattleBag(t);
    if(giveInCombat()){ spendFree(a); faceTo(a, t); }
    blog(`${a.name}把${it.n}交給${t.name}`, "skill");
  } else { Equipment.refresh(from); Equipment.refresh(to); }
  sfx("pop");
  return true;
}
