/* ======================== 規則：擲骰、調整值 ======================== */
const d6 = () => 1 + Math.floor(Math.random()*6);
const roll4 = () => [d6(),d6(),d6(),d6()];
const dropIdx = arr => arr.indexOf(Math.min(...arr));
const scoreOf = arr => arr.reduce((a,b)=>a+b,0) - Math.min(...arr);
const modOf = s => Math.floor((s-10)/2);
const fmt = m => (m>0?"+":m<0?"−":"±") + Math.abs(m);
// 背景加成與最終屬性值（創角時屬性值上限 20）
const bgOf = (id,k) => CRITTERS.find(c=>c.id===id).bg[k] || 0;
const finalScore = (id,k) => Math.min(20, scoreOf(state.rolls[id][k]) + bgOf(id,k));
const done = id => state.rolls[id] && ABILITIES.every(a => state.rolls[id][a.k]);

const pick = a => a[Math.floor(Math.random()*a.length)];

/* ======================== 規則：裝備（金錢、負重、AC、購買限制） ======================== */
function money(cp){
  const g=Math.floor(cp/100), s=Math.floor(cp%100/10), c=cp%10;
  return [g?`${g} gp`:"", s?`${s} sp`:"", c?`${c} cp`:""].filter(Boolean).join(" ") || "0 gp";
}
const scoreK = (id,k) => finalScore(id,k);
// 每件法器有自己的識別與使用屬性；模板仍供規格／測試查詢。
const itemById = id => (state.magicItems||{})[id] || (state.focusItems||{})[id] || ITEMS.find(i=>i.id===id);
function makeItem(it, randomStat=true){
  if(!it || it.type!=="focus" || it.baseId) return it;
  state.focusItems=state.focusItems||{};
  const id="focus-instance-"+(state.focusSerial=(state.focusSerial||0)+1);
  return state.focusItems[id]={...it,id,baseId:it.id,stat:randomStat?pick(["INT","WIS","CHA"]):it.stat};
}
function shopItem(it){
  if(it.type!=="focus")return it;
  state.shopFocusStock=state.shopFocusStock||{};
  return itemById(state.shopFocusStock[it.id]) || (state.shopFocusStock[it.id]=makeItem(it).id,itemById(state.shopFocusStock[it.id]));
}
const invItems = id => (state.inv[id]||[]).map((x,i)=>{
  const it=itemById(x),made=makeItem(it);
  if(made!==it)state.inv[id][i]=made.id;
  return made;
});
const weightOf = id => invItems(id).reduce((s,i)=>s+i.wt,0);
// 有沒有帶某樣東西：單項本身，或身上任何套組的內容物有它（大爺 10-03：套組視同符合單項物品的條件）
const hasGear = (list, name) => (list||[]).some(it=>it && (it.n===name || (it.contains||[]).includes(name)));
// 背包欄：bag＝負重倍數（普通背包 1、次元背包 2，10-03）；身上有好幾個背包時，背包欄放倍數最大的
const isBag = it => !!(it && it.type==="gear" && it.bag);
const bestBag = list => list.filter(isBag).sort((a,b)=>b.bag-a.bag)[0] || null;
const bagMul = it => (it && it.bag) || 1;
const capOf = id => scoreK(id,"STR")*15*bagMul(bestBag(invItems(id)));   // 負重上限 = 力量值 × 15 磅（× 背包倍數）
// AC 公式：沒穿＝10＋敏捷；有穿＝護甲 AC＋敏捷（中甲最多 +2、重甲不加）；拿盾 +2
// 商店（acOf，看背包清單）和戰鬥（acOfUnit，看身上現在穿的）共用這一條（大爺 10-02：戰鬥中換裝 AC 原本不會變）
function armorAC(armor, shield, dex){
  const ac = armor ? armor.ac + (armor.dex==="full" ? dex : armor.dex==="max2" ? Math.min(dex,2) : 0) : 10 + dex;
  return ac + (shield ? 2 : 0);
}
function acOf(id){
  const inv = invItems(id);
  return armorAC(inv.find(i=>i.type==="armor"), inv.some(i=>i.type==="shield"), modOf(scoreK(id,"DEX")));
}
const focusRequirement = (it, score) => it?.type==="focus" && score(it.stat)<13 ? `需要${ABILITIES.find(a=>a.k===it.stat).n} 13（目前 ${score(it.stat)}）` : null;
/* 能不能買：回傳理由字串，null 代表可以買 */
function blockReason(id, it){
  const need=focusRequirement(it,k=>scoreK(id,k));if(need)return need;
  const str = scoreK(id,"STR"), dex = scoreK(id,"DEX");
  if(it.type==="armor" && it.str && str < it.str) return `需要力量 ${it.str}（目前 ${str}）`;
  if(it.type==="weapon" && it.props.includes("重型")){
    const ranged = it.props.some(p=>p.startsWith("彈藥"));
    if(ranged && dex < 13) return `重型遠程武器需要敏捷 13（目前 ${dex}）`;
    if(!ranged && str < 13) return `重型武器需要力量 13（目前 ${str}）`;
  }
  const inv = invItems(id);
  if(it.type==="shield" && inv.some(i=>i.type==="shield")) return "已經有盾牌了";
  if(state.gold[id] < it.cost) return "金幣不夠";
  if(weightOf(id) + it.wt > capOf(id)) return `揹不動（上限 ${capOf(id)} 磅）`;
  return null;
}
