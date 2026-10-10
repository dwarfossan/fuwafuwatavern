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
// 地圖上的所有單位保存同一份完整六圍；商店／創角以角色識別取值。
const abilityScore = (subject,k) => typeof subject==="string" ? finalScore(subject,k) : subject.scores[k];
const abilityScores = subject => Object.fromEntries(ABILITIES.map(a=>[a.k,abilityScore(subject,a.k)]));
const abilityMods = subject => Object.fromEntries(ABILITIES.map(a=>[a.k,modOf(abilityScore(subject,a.k))]));
const done = id => state.rolls[id] && ABILITIES.every(a => state.rolls[id][a.k]);

const pick = a => a[Math.floor(Math.random()*a.length)];

/* ======================== 規則：裝備（金錢、負重、AC、購買限制） ======================== */
function money(cp){
  const g=Math.floor(cp/100), s=Math.floor(cp%100/10), c=cp%10;
  return [g?`${g} gp`:"", s?`${s} sp`:"", c?`${c} cp`:""].filter(Boolean).join(" ") || "0 gp";
}
const scoreK = abilityScore;
// 每件法器有自己的識別與使用屬性；模板仍供規格／測試查詢。
const itemById = id => (state.magicItems||{})[id] || (state.focusItems||{})[id] || (state.equipmentItems||{})[id] || ITEMS.find(i=>i.id===id);
// 背景只決定初次配發造型；已建立的盾牌實例不隨持有人改變。
const shieldArtFor=owner=>{
  const background=typeof owner==="string"?(CRITTERS.find(c=>c.id===owner)||{look:owner}):owner;
  return background?.shieldArt || (typeof MONSTER_LOOK!=="undefined"?MONSTER_LOOK[background?.look]?.shieldArt:null) || "shield";
};
function makeItem(it, randomStat=true, owner=null){
  if(it?.type==="shield"&&!it.baseId&&!it.rarity){
    state.equipmentItems ||= {};
    const id="shield-instance-"+(state.equipmentSerial=(state.equipmentSerial||0)+1);
    return state.equipmentItems[id]={...it,id,baseId:it.id,n:"盾牌",en:"Shield",art:it.art||shieldArtFor(owner)};
  }
  if(!it || it.type!=="focus" || it.baseId) return it;
  state.focusItems=state.focusItems||{};
  const id="focus-instance-"+(state.focusSerial=(state.focusSerial||0)+1);
  return state.focusItems[id]={...it,id,baseId:it.id,stat:randomStat?pick(["INT","WIS","CHA"]):it.stat};
}
function shopItem(it){
  if(it.type==="shield")return {...it,art:shieldArtFor(CRITTERS[state.shopActive])};
  if(it.type!=="focus")return it;
  state.shopFocusStock=state.shopFocusStock||{};
  return itemById(state.shopFocusStock[it.id]) || (state.shopFocusStock[it.id]=makeItem(it).id,itemById(state.shopFocusStock[it.id]));
}
const invItems = id => (state.inv[id]||[]).map((x,i)=>{
  const it=itemById(x),made=makeItem(it,true,id);
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
function equipmentRequirement(it, score){
  const focus=focusRequirement(it,score);if(focus)return focus;
  if(it?.type==="armor" && it.str && score("STR")<it.str)return `需要力量 ${it.str}（目前 ${score("STR")}）`;
  return null;
}
/* 能不能買：回傳理由字串，null 代表可以買 */
function blockReason(id, it){
  const need=equipmentRequirement(it,k=>abilityScore(id,k));if(need)return need;
  const str = scoreK(id,"STR"), dex = scoreK(id,"DEX");
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

// ---------- 經驗與升級（大爺 10-04） ----------
// 打倒敵人照 SRD 挑戰等級給經驗（ENEMIES[].xp），小傢伙們平分；劇情完成另外給一筆（商隊護送 CARAVAN_XP）
// 門檻照 SRD 5.2 升級表；不分職業，每升一級生命 +5＋體質（d8 平均，至少 +1）
const XP_NEXT = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
const LEVEL_MAX = 20;
const critterLevel = id => Math.min(LEVEL_MAX, Math.max(1, (state.level||{})[id] || 1));
const critterXP = id => (state.xp||{})[id] || 0;
const xpNeed = lv => XP_NEXT[Math.min(LEVEL_MAX-1, lv)];
const initialHpDie = id => {
  state.initialHpDice ||= {};
  return state.initialHpDice[id] ??= 1 + Math.floor(Math.random()*10);
};
const maxHpAt = (lv, con, id) => Math.max(1, initialHpDie(id) + con) + (lv-1) * Math.max(1, 5 + con);
// 經驗保留累積，達標由玩家在戰鬥外逐級確認。
const LEVEL_UP_DURATION = 2400; // 演出長度暫定 GPT
const leveling = u => !!u.levelUpAt && Date.now()-u.levelUpAt < LEVEL_UP_DURATION;
const canLevelUp = id => critterLevel(id)<LEVEL_MAX && critterXP(id)>=xpNeed(critterLevel(id));
const progressionUnits = id => [...new Set([state.battle,state.townRest].flatMap(b=>(b?.units||[]).filter(u=>u.side==="pc"&&u.id===id)))];
// 劇情／城鎮沒有當前戰場時，也用現有屬性與背包組出同一張狀態卡。
function critterStatusUnit(id){
  const live=progressionUnits(id)[0];if(live)return live;
  const c=CRITTERS.find(x=>x.id===id);if(!c)return null;
  const scores=abilityScores(id),mods=abilityMods({scores}),lv=critterLevel(id),hp=maxHpAt(lv,mods.CON,id);
  const unit={id,side:"pc",name:c.name,color:c.color,hp,maxHp:hp,scores,mods,level:lv,xp:critterXP(id),stress:stressNow(id),svgMood:(stressNow(id)>=STRESS.warn?"stressed":undefined),
    ...Equipment.read(id),
    speed:6,levelUpAt:state.levelUpAt?.[id],statuses:[],learned:raceFreeNotes(state.learned[id]||starterNotes(id)).map(x=>({...x})),activeSkills:raceFreeKeys(state.activeSkills[id]||[]),down:false,face:-1,oaUsed:false};
  unit.slots=slotMax(unit).map((m,i)=>Math.min(m,Array.isArray(state.proficiency[id])?(state.proficiency[id][i]??m):m));
  return unit;
}
function gainXP(ids,n){
  state.xp=state.xp||{};
  ids.forEach(id=>{state.xp[id]=critterXP(id)+n;progressionUnits(id).forEach(u=>u.xp=critterXP(id));});
}
function levelUp(id){
  const b=state.battle;
  if(b && !b.result && b.phase!=="explore") return false;
  if(!canLevelUp(id)) return false;
  const from=critterLevel(id), to=from+1, at=Date.now(), units=progressionUnits(id);
  const oldMax=SLOT_TABLE[from-1], newMax=SLOT_TABLE[to-1];
  const grow=slots=>newMax.map((n,i)=>Math.min(n,(slots?.[i]||0)+n-(oldMax[i]||0)));
  state.proficiency=state.proficiency||{};
  state.proficiency[id]=grow(units[0]?.slots||state.proficiency[id]||oldMax);
  state.level=state.level||{};state.level[id]=to;
  units.forEach(u=>{
    const max=maxHpAt(to,u.mods.CON,u.id), delta=max-u.maxHp;
    u.slots=grow(u.slots||oldMax);u.level=to;u.xp=critterXP(id);
    if(u.hp>0&&!u.dead)u.hp=Math.min(max,u.hp+delta);
    u.maxHp=max;u.levelUpAt=at;
  });
  // 沒有戰場／旅店單位時（例如序章），狀態卡用快照單位，靠這裡記的時間播演出
  (state.levelUpAt ||= {})[id]=at;
  sfx("level_up");
  setTimeout(()=>{if(state.levelUpAt?.[id]===at)afterLevelChange(id);},LEVEL_UP_DURATION+20);
  return true;
}

// 商隊、路旁寶箱共用四人分錢；金額為 gp，狀態保存 cp。
function grantPartyGold(gold){CRITTERS.forEach(c=>{state.gold[c.id]=(state.gold[c.id]||0)+Math.round(gold*GP/CRITTERS.length);});}
