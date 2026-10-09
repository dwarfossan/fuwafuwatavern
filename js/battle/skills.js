/* ======================== 技能實作（對應 data/skills.js） ========================
   target：enemy 單一敵人／ally 單一隊友／self 自己／area 範圍（點格子）／cone 錐形（點方向）／line 直線（點敵人定方向）
   range(u)：可選目標的距離；run(u, 目標) 執行 */

const groupOf = item => SKILL_GROUPS.find(g=>g.weapons.includes(item.base||item.n) || g.weapons.includes(item.n));

// 角色身上可用的技能（敵我一樣）：武器（沒武器也沒法器就徒手）＋法器＋盾牌
// 只拿法器、法器又沒有不用格子的攻擊（例如治癒法書）：補一個徒手普攻，格子用完時還有東西能打
// 招式代號（data/skills.js 的 id）→ 出處的組和第幾招。小筆記、敵人的 testSkill 都存代號
const SKILL_BY_ID = {};
SKILL_GROUPS.forEach(g=>g.skills.forEach((s,idx)=>{ if(s.id) SKILL_BY_ID[s.id] = {g, idx}; }));
function learnedSkillByKey(key){
  if(/^(arcane_staff|healing_book)_cantrip$/.test(key))return focusCantripSkill(SKILL_GROUPS.find(g=>g.id===key.split("_cantrip")[0]));
  const f = SKILL_BY_ID[key]; if(!f) return null;
  const {g, idx} = f;
  return {key, group:g, idx, def:g.skills[idx], impl:(SKILL_IMPL[g.id]||[])[idx]};
}
// 所有筆記配置入口共用同一限制；activeSkills 保留舊欄位以相容快照。
const CARRIED_SKILL_MAX=5,ACTIVE_SKILL_MAX=3;
const isPassiveSkill = s => s?.def?.activation==='passive'||s?.impl?.passive===true;
// 風格：同類能帶幾個＝STYLE_GROUPS 的 max ＋ 角色身上的加成（u.styleBonus，之後裝備等用）。敵我同一套。
const skillStyle = s => s?.def?.style && STYLE_GROUPS[s.def.style] ? s.def.style : null;
const styleCap = (u,g) => (STYLE_GROUPS[g]?.max||1) + ((u.styleBonus||{})[g]||0);
const skillLabel = def => def?.style && STYLE_GROUPS[def.style] ? `${STYLE_GROUPS[def.style].name}：${def.name}` : def?.name;
function carriedSkillKeys(u){
 const keys=[],known=new Set((u.learned||[]).map(n=>n.key)),styles={};let active=0;
 for(const k of u.activeSkills||[]){if(keys.includes(k)||!known.has(k))continue;const s=learnedSkillByKey(k),g=skillStyle(s);if(!isPassiveSkill(s)&&active>=ACTIVE_SKILL_MAX)continue;if(g&&(styles[g]||0)>=styleCap(u,g))continue;if(keys.length>=CARRIED_SKILL_MAX)break;keys.push(k);if(!isPassiveSkill(s))active++;if(g)styles[g]=(styles[g]||0)+1;}
 return keys;
}
// 勾選被擋的原因（介面顯示用）；可以勾回傳空字串。
function carryBlockReason(u,key){
 const keys=carriedSkillKeys(u);if(keys.includes(key))return "";
 const s=learnedSkillByKey(key),g=skillStyle(s);
 if(keys.length>=CARRIED_SKILL_MAX)return `最多帶 ${CARRIED_SKILL_MAX} 個技能`;
 if(!isPassiveSkill(s)&&keys.filter(k=>!isPassiveSkill(learnedSkillByKey(k))).length>=ACTIVE_SKILL_MAX)return `主動技能最多 ${ACTIVE_SKILL_MAX} 個`;
 if(g&&keys.filter(k=>skillStyle(learnedSkillByKey(k))===g).length>=styleCap(u,g))return `${STYLE_GROUPS[g].name}只能帶 ${styleCap(u,g)} 個`;
 return "";
}
function toggleCarriedSkill(u,key){
 if(!(u.learned||[]).some(n=>n.key===key))return false;
 const keys=carriedSkillKeys(u),i=keys.indexOf(key);
 if(i>=0)keys.splice(i,1);else {if(carryBlockReason(u,key))return false;keys.push(key);}
 u.activeSkills=keys;return true;
}
function passiveSkills(u){return carriedSkillKeys(u).map(learnedSkillByKey).filter(isPassiveSkill);}
const darkvisionRange=u=>Math.max(0,...passiveSkills(u).map(s=>s.def.darkvision||0));
// 場景未指定光照時沿用明亮；不自訂日夜循環／火把半徑。
function visionAt(u,t,light=B()?.def.lighting||"bright"){
 if(coverOf(u,t).v>=.75)return "blocked";
 const radius=darkvisionRange(u),night=radius>0&&dist(u,t)<=radius;
 return light==="dark"?(night?"gray":"blind"):light==="dim"?(night?"bright":"dim"):"bright";
}
function canSeeInLight(u,t){return !["blind","blocked"].includes(visionAt(u,t));}

function activeLearnedSkills(u){
  u.activeSkills=u.activeSkills||[];
  return carriedSkillKeys(u).map(learnedSkillByKey).filter(s=>s&&!isPassiveSkill(s));
}
function unitSkills(u){
  const held=u.weapon||u.focus||null;
  const unarmed=SKILL_GROUPS.find(g=>g.id==="unarmed");
  const out=held?equipmentSkills(held,u):[{key:"unarmed_0",group:unarmed,idx:0,def:basicDef(unarmed,unarmed.skills[0],u),impl:SKILL_IMPL.unarmed[0]}];
  equippedMagic(u).filter(it=>it!==held).forEach(it=>out.push(...equipmentSkills(it,u).filter(s=>s.equipmentGrant)));
  const off=offhandAttackSkill(u);if(off)out.push(off);
  if(u.side==="pc") out.push(...activeLearnedSkills(u));
  return out.filter((x,i,a)=>!isPassiveSkill(x)&&a.findIndex(y=>y.key===x.key)===i);
}

// 同名法術／普攻共用結算；不同裝備來源保留既有技能代號。
const FIRE_BOLT_IMPL={target:"enemy",range:()=>12,run:(u,t)=>{
  if(!t.id){groundReact(t.x,t.y,"火焰");return;}
  const r=attackRoll(u,t,{bonus:u.mods[spellStat(u)]+2,ranged:true});
  if(r.hit){hurt(t,dmgRoll("1d10",0,r.crit),"火焰",u);groundReact(t.x,t.y,"火焰");}
}};
const HEALING_WORD_IMPL={target:"ally",range:()=>6,run:(u,t)=>heal(t,Math.max(1,rollDice(`${1+upNow()}d4`).total+u.mods[spellStat(u)]))};
const focusStrikeImpl=die=>({target:"enemy",range:()=>1,run:(u,t)=>{
  const r=attackRoll(u,t,{bonus:u.mods.STR+2});if(!r.hit)return;
  const n=dmgRoll(die,u.mods.STR,r.crit);
  if(die==="1d6"&&n<=0){blog(`　打中了，但${t.name}不痛不癢（0 點）`,"miss","不痛不癢");fxFloat(t,"0","miss");}
  hurt(t,n,"鈍擊",u);
}});
const FOCUS_STRIKE_IMPLS={staff:focusStrikeImpl("1d6"),other:focusStrikeImpl("1d4")};
// 法杖當長棍，其他法器當輕型鈍器；共用命中、傷害與貼身距離。
function focusStrikeSkill(g){
  const staff=g.id==="arcane_staff",die=staff?"1d6":"1d4";
  return {key:`${g.id}_strike`,group:g,idx:-2,synthetic:true,anim:"smash",
    def:{name:"打擊",kind:"近戰",dmg:"物理",tier:0,req:"focus",basicAttack:true,text:`造成 ${die} + 力量調整值物理傷害。`},
    impl:FOCUS_STRIKE_IMPLS[staff?"staff":"other"]};
}
// 裝備卡與戰鬥共用：只取裝備實際提供的普攻，以及物品明列的 grants。
function equipmentSkills(it,u){
  if(!it)return [];
  const g=groupOf(it),out=[];
  if(g&&(it.type==="weapon"||it.type==="focus")){
    let def=basicDef(g,g.skills[0],u);
    if(it.type==="focus"&&def.components&&(def.tier||0)===0)def={...def,free:true,turnLimit:"focusCantrip"};
    out.push({key:`${g.id}_0`,group:g,idx:0,def,impl:SKILL_IMPL[g.id][0]});
    if(FOCUS_GROUPS.includes(g.id)){
      if(g.id!=="arcane_staff")out.push(focusStrikeSkill(g));
      if(!it.elementFocus&&(g.id==="arcane_staff"||g.id==="healing_book"))out.push(focusCantripSkill(g));
    }
  }
  for(const key of it.grants||[]){const sk=learnedSkillByKey(key);if(!sk)continue;
    out.push({...sk,equipmentGrant:true,def:it.type==="focus"&&sk.def.components&&(sk.def.tier||0)===0?{...sk.def,free:true,turnLimit:"focusCantrip"}:sk.def});
  }
  return out;
}
// 法杖用火焰箭、治癒法書用聖火術；火焰法球和薩滿圖騰本來就有火焰箭。
function focusCantripSkill(g){
  const sacred=g.id==="healing_book";
  const def=sacred
    ? {name:"聖火術",kind:"豁免",dmg:"光耀",tier:0,srd:true,components:{v:true,s:true},basicAttack:true,text:"敏捷豁免；失敗受 1d8 光耀傷害。"}
    : {name:"火焰箭",groundElement:true,kind:"遠程",dmg:"火焰",tier:0,srd:true,components:{v:true,s:true},basicAttack:true,text:"命中造成 1d10 火焰傷害。"};
  const impl=sacred
    ? {target:"enemy",range:()=>12,run:(u,t)=>{if(!saveRoll(t,"DEX",dcOf(u,spellStat(u))))hurt(t,dmgRoll("1d8",0,false),"光耀",u);}}
    : FIRE_BOLT_IMPL;
  return {key:`${g.id}_cantrip`,group:g,idx:-1,synthetic:true,anim:"cast",def:{...def,free:true,turnLimit:"focusCantrip"},impl};
}

// 副手按該武器的既有命中、傷害與彈藥規則結算，不交換角色實際裝備。
const skillWeaponView=(u,sk)=>sk.def.turnLimit==="offhand"?{...u,weapon:u.offhand,shield:false}:u;
function offhandAttackSkill(u){
 const w=u.offhand,g=w&&groupOf(w);if(!g||w.type!=="weapon")return null;
 return {key:"offhand_attack",group:g,idx:0,synthetic:true,def:{name:`副手攻擊：${w.n}`,kind:isRanged({...u,weapon:w})?"遠程":"近戰",tier:0,free:true,turnLimit:"offhand",basicAttack:true,text:"使用副手武器攻擊，每回合一次，耗一個免費動作。"},
 impl:{target:"enemy",range:u=>meleeOrRange({...u,weapon:u.offhand,shield:false}),run:(u,t)=>weaponAttack(u,t,{weapon:u.offhand,mastery:true})}};
}
// 基本攻擊名稱看武器；法器戲法另列為免費攻擊選項。
function basicDef(g, s, u){
  if(!HAS_BASIC(g) || g.id==="shield") return s;
  const item = g.id==="arcane_staff" || g.id==="unarmed" ? null : u.weapon;
  return {...s, name: basicName(g, item)};
}
const attackSkills = u => unitSkills(u).filter(s=>s.group.id!=="shield" && !(s.impl&&s.impl.passive) &&
  (!!s.def.basicAttack || (s.idx===0 && s.def.kind!=="輔助" && (s.def.tier||0)===0)));
const attackSkill = u => attackSkills(u)[0] || null;

// ---------- 熟練格（2026-10-01 大爺：點數池改成一階、二階的格子） ----------
// 每個角色照等級有一階、二階……的格子，全部用全施法者的表（SRD 5.2 法師表；我方、敵人都一樣，不分職業）
// 每招用一格；def.tier＝這招要求的階（0＝普攻、戲法，不用格子）。一階用完可以拿高階的格子放
// 升階：用比要求高的格子放，每高一階多一份升階效果（up 寫的；沒寫的攻擊招＝命中時多 1 顆武器骰）
const SLOT_TABLE = [            // 等級 1～20：[一階, 二階, …九階]
  [2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],
  [4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const TIER_NAME = ["","一階","二階","三階","四階","五階","六階","七階","八階","九階"];   // 句子裡用（紀錄、說明）
const ROMAN = ["","I","II","III","IV","V","VI","VII","VIII","IX"];                        // 燈號、技能分組、選階按鈕用（大爺 2026-10-01，參考索拉塔）
const levelOf = u => u.level || 1;
const slotMax = u => SLOT_TABLE[Math.min(20, Math.max(1, levelOf(u))) - 1].slice();
const slotsOf = u => u.slots || (u.slots = slotMax(u));
const slotsText = u => slotsOf(u).map((n,i)=>`${TIER_NAME[i+1]} ${n} 格`).join("、");
const baseTierOf = sk => sk.def.tier || 0;
const isPhysicalSkill = sk => skillDmg(sk.group, sk.def)==="物理";
const canUp = sk => baseTierOf(sk) > 0 && !sk.def.noUp;
// 嬌嬌特性：造成物理傷害的招式免費升一階（用一階格子，效果算二階）
const freeUp = (u, sk) => u && u.id==="tiger" && canUp(sk) && isPhysicalSkill(sk) ? 1 : 0;
// 這招現在拿得出哪幾階的格子（由低到高）；不用格子的招回傳 [0]
function tiersFor(u, sk){
  const base = baseTierOf(sk); if(!base) return [0];
  const s = slotsOf(u), r = [];
  for(let t=base; t<=s.length; t++) if(s[t-1] > 0) r.push(t);
  return r;
}
const lowestTier = (u, sk) => tiersFor(u, sk)[0];
// 用第 tier 階的格子放，效果升了幾階
const upOf = (u, sk, tier) => canUp(sk) && tier ? Math.max(0, tier - baseTierOf(sk)) + freeUp(u, sk) : 0;
function skillReady(u, sk){ return tiersFor(u, sk).length > 0 || remarkFree(u, sk); }
// 狩印正在專注、標記的目標已經倒下：改標不花格子
const remarkFree = (u, sk) => sk.key==="hunters_mark" && (concOf(u)||{}).key==="hunters_mark"
  && !B().units.some(v=>!v.dead && !v.down && v.statuses.some(s=>s.k==="marked" && s.src===u.id));
const upNow = () => (B() && B().up) || 0;
function spendSlot(u, sk, tier){
  if(!tier) return 0;
  const s = slotsOf(u); if(s[tier-1] > 0) s[tier-1]--;
  if(u.side==="pc") state.proficiency[u.id] = s.slice();
  return tier;
}

const meleeOrRange = u => isRanged(u) ? rangeOf(u) : reachOf(u);
const thrownRange = u => Math.max(reachOf(u), rangeOf(u));
const enemiesOf = u => B().units.filter(x=>hostile(x,u) && !x.down && !x.dead && !isHid(x));   // 躲著的看不到
// 範圍招（大爺 10-02）：打的是一塊地方，不是指定某一隻，躲在裡面的也會被波及。被波及的先現身再結算
// （豁免、傷害都會攤在骰子面板上，藏不住）。要指定目標的招（多投、災禍術、橫掃專精）還是用 enemiesOf
const caught = (u, es) => es.filter(x=>hostile(x,u) && !x.down && !x.dead).map(x=>{ if(isHid(x)) reveal(x, "被波及，現身！"); return x; });
const inArea = (u, at) => caught(u, B().units.filter(at));   // at：哪些格子算在範圍裡
const alliesOf  = u => B().units.filter(x=>x.side===u.side && !x.dead);
const stat = u => weaponStat(u);

// 通用：武器普攻
const basicAttack = {target:"enemy", range:u=>meleeOrRange(u), run:(u,t)=>weaponAttack(u,t,{mastery:true})};
// 攻擊一次，命中而且目標還站著就套效果
function hitThen(u, t, o, fx){ const r = weaponAttack(u, t, o||{}); if(r.hit && !t.dead && !t.down) fx(r); return r; }
// 常用效果（敵我通用，說明不寫武器名稱）
// 目標自己選豁免：取調整值比較高的那個
const bestOfSave = (t, a, b) => (t.mods[a]||0) >= (t.mods[b]||0) ? a : b;
const fxProne  = (u, t, stat, save, up=0) => { if(!saveRoll(t, save, dcOf(u, stat) + up)){ knockProne(t); blog(`　${t.name}倒地！`, "skill"); } };
const fxSlow   = (u, t, up=0) => { addStatus(t, "slowed", {until:"start", of:u.id, left:up}); blog(`　${t.name}${up?`接下來 ${1+up} 回合`:"下回合"}移動 −2 格`, "skill"); };
const fxHamper = t => { addStatus(t, "sapped", {via:"hamper"}); blog(`　削弱：${t.name}下次攻擊有劣勢`, "skill"); };
const fxDaze   = (u, t, stat, up=0) => { if(!saveRoll(t, "CON", dcOf(u, stat))){ addStatus(t, "dazed", {until:"end", of:t.id, left:up}); blog(`　${t.name}被震暈了！${up?`接下來 ${1+up} 回合`:"下回合"}只能移動或行動二選一`, "skill"); } };
const standStill = {can:u=>!B().movedThisTurn, why:"這回合已經移動過了"};
// 近身類的「靠過去」：2 格內、目標身旁的空位（花費照地形算），找最近的
function dashSpot(u, t, max){
  if(dist(u,t) <= 1) return {x:u.x, y:u.y};
  let best = null;
  reachable(u, max).forEach((path, k)=>{ const [x,y] = k.split(",").map(Number);
    if(dist({x,y}, t)===1 && (!best || path.cost < best.cost)) best = {x, y, cost:path.cost}; });
  return best;
}

const SKILL_IMPL = {
  natural:[{passive:true}],
  sword: [
    basicAttack,
    {passive:true},
    // 連擊（連斬＋連打合併）：攻擊兩次，第二下不加屬性
    {target:"enemy", range:u=>meleeOrRange(u), run:(u,t)=>{ weaponAttack(u,t,{}); if(!t.dead && !t.down) weaponAttack(u,t,{noMod:true}); }}
  ],
  heavy: [
    basicAttack,
    // 橫掃（＋回掃）：攻擊範圍內每個敵人，有觸及的打得到 2 格外
    {target:"self", run:u=>{ const es = inArea(u, e=>dist(e,u)<=reachOf(u)); if(!es.length) blog("　範圍內沒有敵人。"); es.forEach(e=>weaponAttack(u,e,{noMod:true})); }},
    {target:"enemy", range:u=>reachOf(u), ...standStill, run:(u,t)=>{ B().moveLeft = 0; weaponAttack(u,t,{extraDice:1}); }},
    // 撞倒（衝撞＋絆倒）：目標自己選力量或敏捷豁免（取他比較好的那個，照 D&D 推撞）
    {target:"enemy", range:u=>reachOf(u), run:(u,t)=>hitThen(u,t,{},()=>fxProne(u,t,weaponStat(u),bestOfSave(t,"STR","DEX")))}
  ],
  axe: [
    basicAttack,
    {target:"enemy", range:u=>reachOf(u), run:(u,t)=>hitThen(u,t,{},()=>{ addStatus(t,"acDown",{until:"end", of:u.id, left:upNow()}); blog(`　破甲：${t.name} AC −2${upNow()?`（${1+upNow()} 輪）`:""}`,"skill"); })},
    {target:"enemy", range:u=>reachOf(u), run:(u,t)=>hitThen(u,t,{},()=>{ addStatus(t,"bleed",{n:2+upNow(), src:u.id}); blog(`　${t.name}開始流血（接下來 ${2+upNow()} 次回合開始各 1d4）`,"skill"); })},
    {target:"enemy", range:u=>reachOf(u), run:(u,t)=>hitThen(u,t,{},()=>{
      if(t.shield){ addStatus(t,"acDown",{via:"cleave", shield:true, until:"start", of:u.id}); blog(`　${t.name}的盾被劈開，AC −2`,"skill"); } else blog(`　${t.name}沒有拿盾。`); })}
  ],
  mace: [
    basicAttack,
    {target:"enemy", range:u=>reachOf(u), run:(u,t)=>hitThen(u,t,{},()=>fxDaze(u,t,"STR",upNow()))},
    {target:"self", run:u=>{ const up = upNow(), es = inArea(u, e=>dist(e,u)<=1); if(!es.length) blog("　範圍內沒有敵人。");
      es.forEach(e=>{ if(saveRoll(e, "DEX", dcOf(u, "STR"))) return; knockProne(e); blog(`　${e.name}倒地！`, "skill");
        if(up && weaponDie(u)){ let n = 0; for(let i=0;i<up;i++) n += dmgRoll(weaponDie(u),0,false); hurt(e, n, dmgType(u), u); } }); }},
    // 擊退（重敲＋逼退）：推開，推得動就跟上一步
    {target:"enemy", range:u=>reachOf(u), run:(u,t)=>hitThen(u,t,{},()=>{
      const ox = t.x, oy = t.y; push(u, t, 1);
      if(t.x===ox && t.y===oy){ blog(`　${t.name}後面被擋住，推不動。`); return; }
      blog(`　${t.name}被擊退！`, "skill");
      if(!victimsOf(u).length && !grappled(u) && dist(u,{x:ox,y:oy})===1 && !unitAt(ox,oy)){ u.x = ox; u.y = oy; faceTo(u, t); }
    })}
  ],
  polearm: [
    basicAttack,
    {target:"self", run:u=>{ addStatus(u,"stance",{via:"guard", until:"start", of:u.id, up:upNow()}); blog(`　${u.name}架起武器，阻截走進攻擊範圍的敵人`,"skill"); }}
  ],
  dagger: [
    // 有「投擲」屬性的武器可以丟出去（超出觸及就算遠程）
    {target:"enemy", range:u=>thrownRange(u), run:(u,t)=>weaponAttack(u,t,{mastery:true, thrown: dist(u,t)>reachOf(u)})},
    {target:"enemy", range:u=>reachOf(u), run:(u,t)=>{ const ally = alliesOf(u).some(p=>p!==u && !p.down && dist(p,t)===1);
      if(ally) blog("　隊友在旁邊牽制，偷襲！","skill"); weaponAttack(u,t,{bonusDmgDice: ally?`${2+upNow()}d6`:null}); }},
    {target:"enemy", range:u=>reachOf(u)+2, run:(u,t)=>{
      if(dist(u,t) > reachOf(u)){
        const spot = dashSpot(u, t, 2);
        if(!spot){ blog("　找不到空位閃過去。"); return; }
        u.x = spot.x; u.y = spot.y; faceTo(u, t); u.anim = {k:"hop", t:Date.now()}; checkExposure();
        blog(`　${u.name}一閃，到了${t.name}身旁！`, "skill");
      }
      weaponAttack(u,t,{}); }},
    // 扎腿（＋瞄腿）：近戰或遠程都行
    {target:"enemy", range:u=>thrownRange(u), run:(u,t)=>hitThen(u,t,{thrown:dist(u,t)>reachOf(u)},()=>fxSlow(u,t,upNow()))}
  ],
  bow: [
    basicAttack,
    {target:"enemy", range:u=>rangeOf(u), ...standStill, run:(u,t)=>{ B().moveLeft=0; weaponAttack(u,t,{hitMod:2, extraDice:1}); }},
    {target:"area", range:u=>rangeOf(u), radius:1, run:(u,c)=>{ const up = upNow(), es = inArea(u, e=>dist(e,c)<=1); if(!es.length) blog("　箭雨落空了。");
      es.forEach(e=>{ if(saveRoll(e,"DEX",dcOf(u,"DEX"))) return; let n = 0; for(let i=0;i<=up;i++) n += dmgRoll(weaponDie(u),0,false); hurt(e, n, dmgType(u), u); }); }},
    {target:"enemy", range:u=>rangeOf(u), run:(u,t)=>hitThen(u,t,{},()=>fxHamper(t))}
  ],
  crossbow: [
    basicAttack,
    {target:"line", range:u=>rangeOf(u), run:(u,t)=>{ caught(u, lineUnits(u,t,rangeOf(u))).forEach(e=>weaponAttack(u,e,{})); }},
    {target:"enemy", range:u=>rangeOf(u), run:(u,t)=>hitThen(u,t,{},()=>{ addStatus(t,"slowed",{via:"pin", stop:true, until:"end", of:t.id}); blog(`　${t.name}被釘住了，這回合不能移動`,"skill"); })},
    {target:"enemy", range:u=>rangeOf(u), run:(u,t)=>weaponAttack(u,t,{pointBlank:true})}
  ],
  firearm: [ basicAttack ],   // 火槍類只有普攻（10-03）
  // 投擲類：射程用武器的投擲／彈藥射程；超出觸及就算遠程攻擊（貼身投有劣勢）
  thrown: [
    {target:"enemy", range:u=>thrownRange(u), run:(u,t)=>weaponAttack(u,t,{mastery:true, thrown:dist(u,t)>reachOf(u)})},
    {target:"enemy", range:u=>thrownRange(u), run:(u,t)=>{ weaponAttack(u,t,{thrown:dist(u,t)>reachOf(u)});
      const others = enemiesOf(u).filter(e=>e!==t && dist(e,u)<=thrownRange(u)).sort((a,b)=>dist(a,u)-dist(b,u)).slice(0, 1+upNow());
      others.forEach(other=>{ blog(`　再投向${other.name}`,"skill"); weaponAttack(u,other,{thrown:dist(u,other)>reachOf(u)}); }); }},
    {target:"enemy", range:u=>thrownRange(u), run:(u,t)=>hitThen(u,t,{adv:true, thrown:dist(u,t)>reachOf(u)},()=>fxHamper(t))}
  ],
  unarmed: [
    {target:"enemy", range:()=>1, run:(u,t)=>weaponAttack(u,t,{})},
    {target:"enemy", range:()=>1, can:(u)=>enemiesOf(u).some(e=>e.statuses.some(s=>s.k==="restrained"&&s.via==="grapple"&&s.src===u.id)), why:"要先擒抱住敵人",
     run:(u,t)=>{ if(!t.statuses.some(s=>s.k==="restrained"&&s.via==="grapple"&&s.src===u.id)){ blog("　沒有抓住這個目標。"); return; }
       push(u,t,1); knockProne(t); t.statuses=t.statuses.filter(s=>!(s.k==="restrained"&&s.via==="grapple")); blog(`　${t.name}被摔了出去！`,"skill"); hurt(t, rollDice(`${1+upNow()}d6`).total, "鈍擊", u); }}
  ],
  shield: [
    // 守護（原舉盾護友，大爺 10-01 定、10-02 做）：用一格、免費動作；所有貼身隊友各自被打的第一次攻擊劣勢，
    // 到你下回合開始；升階每高一階多 1 輪（每輪各擋一次）。守護的人要還在旁邊（見 attackRoll）
    {target:"self", run:u=>{ const ps = alliesOf(u).filter(p=>p!==u && !p.down && dist(p,u)===1), up = upNow();
      if(!ps.length){ blog("　旁邊沒有隊友。"); return; }
      ps.forEach(p=>addStatus(p,"dodge",{via:"guard", once:true, by:u.id, until:"start", of:u.id, left:up}));
      blog(`　${u.name}舉盾守護${ps.map(p=>p.name).join("、")}${up?`（${1+up} 輪）`:""}`,"skill"); }}
  ],
  arcane_staff: [
    FOCUS_STRIKE_IMPLS.staff,
    // 魔法飛彈：必中，每發 1d4+1；ts 是每一發的目標（可以重複、可以分給不同敵人），一發一顆光球錯開飛出去
    {target:"enemy", multi:true, darts:()=>3+upNow(), range:()=>24, run:(u,ts)=>{ ts = [].concat(ts);
      blog(`　${ts.length} 發魔法飛彈必定命中！`,"skill");
      ts.forEach((t,i)=>{ if(t.dead){ blog(`　第 ${i+1} 發：${t.name}已經倒下了，飛彈散掉。`,"miss"); return; }
        B().impact = launch(u, t, "cast", i*140); hurt(t, rollDice("1d4+1").total, "力場", u); }); }},
    {target:"self", run:u=>{ addStatus(u,"shieldSpell",{until:"start", of:u.id}); blog(`　${u.name}施放護盾術：AC +5 直到下回合`,"skill"); }},   // 護盾術（免費動作）
    {target:"self", can:u=>!u.armor || u.armor.cloth, why:"穿著輕甲以上時不能用", run:u=>{ addStatus(u,"mageArmor",{until:"battle"}); blog(`　法師護甲：${u.name}的 AC 變成 ${acOfUnit(u)}`,"skill"); }}
  ],
  healing_book: [
    HEALING_WORD_IMPL,
    {target:"ally", range:()=>1, run:(u,t)=>heal(t, Math.max(1, rollDice(`${2*(1+upNow())}d8`).total + u.mods[spellStat(u)]))},
    {target:"self", run:u=>{ const ps = alliesOf(u).filter(p=>!p.down && dist(p,u)<=6).sort((a,b)=>dist(a,u)-dist(b,u)).slice(0,3+upNow());
      startConc(u, "bless", "祝福術");
      ps.forEach(p=>addStatus(p,"blessed",{src:u.id})); blog(`　祝福：${ps.map(p=>p.name).join("、")}的攻擊與豁免 +1d4（${u.name}專注中）`,"skill"); }}
  ],
  flame_orb: [
    FIRE_BOLT_IMPL,
    {target:"cone", range:()=>1, run:(u,c)=>{ coneTiles(u,c,3).forEach(p=>groundReact(p.x,p.y,"火焰"));const es = caught(u, coneUnits(u,c,3)); if(!es.length) blog("　火焰沒燒到任何敵人。");
      es.forEach(e=>{ const n=rollDice(`${3+upNow()}d6`).total; hurt(e, saveRoll(e,"DEX",dcOf(u,spellStat(u)),u) ? Math.floor(n/2) : n, "火焰", u); }); }},
    {target:"self", run:u=>{ addStatus(u,"fireShield",{until:"battle", n:upNow()}); blog(`　${u.name}全身冒出火焰護盾！`,"skill"); }}
  ],
  // 狩獵者（非凡長弓的特性，大爺 10-03）：狩印＝SRD 獵人印記。免費動作、專注；標記 18 格內看得到的敵人，
  // 打中他多 1d6 力場；標記的目標倒下後可以免費改標下一個（skillReady／doSkill 的 remarkFree）
  hunter: [
    {target:"enemy", range:()=>18, run:(u,t)=>{ startConc(u, "hunters_mark", "狩印"); addStatus(t, "marked", {src:u.id});
      fxFloat(t, POP_TEXT.mark, "dmg"); blog(`　${t.name}被打上狩印：${u.name}打中他時多 1d6 力場傷害（專注中）`, "skill"); }}
  ],
  elements: [
    {target:"enemy",range:()=>12,run:(u,t)=>{if(!t.id){groundReact(t.x,t.y,"寒冷");return;}const r=attackRoll(u,t,{bonus:u.mods[spellStat(u)]+2,ranged:true});if(r.hit){groundReact(t.x,t.y,"寒冷");hurt(t,dmgRoll(`${1+(levelOf(u)>=5)+(levelOf(u)>=11)+(levelOf(u)>=17)}d8`,0,r.crit),"寒冷",u);if(!t.dead&&!t.down)addStatus(t,"slowed",{until:"start",of:u.id,src:u.id});}}},
    {target:"enemy",range:()=>1,run:(u,t)=>{if(!t.id){groundReact(t.x,t.y,"閃電");return;}const r=attackRoll(u,t,{bonus:u.mods[spellStat(u)]+2});if(r.hit){groundReact(t.x,t.y,"閃電");hurt(t,dmgRoll(`${1+(levelOf(u)>=5)+(levelOf(u)>=11)+(levelOf(u)>=17)}d8`,0,r.crit),"閃電",u);if(!t.dead&&!t.down){t.shockNoOA=true;blog(`　${t.name}在下回合開始前不能藉機攻擊。`,"skill");}}}}
  ],
  shaman_totem: [
    FIRE_BOLT_IMPL,
    HEALING_WORD_IMPL,
    // 災禍術：自動挑 6 格內最近、看得到的 3 個敵人
    {target:"self", run:u=>{ const ts = enemiesOf(u).filter(e=>dist(e,u)<=6).sort((a,b)=>dist(a,u)-dist(b,u)).slice(0,3+upNow());
      if(!ts.length) blog("　6 格內沒有看得到的敵人。");
      else startConc(u, "bane", "災禍術");
      ts.forEach(p=>{ if(!saveRoll(p,"CHA",dcOf(u,spellStat(u)))){ addStatus(p,"bane",{src:u.id}); fxFloat(p,POP_TEXT.bane,"dmg"); fxHit(p,"spark");
        blog(`　${p.name}被詛咒了：攻擊和豁免 −1d4，直到${u.name}倒下或專注中斷`,"skill"); } }); }}
  ]
};

// ---------- 範圍工具 ----------
function lineUnits(u, t, len){   // 從 u 朝 t 方向延伸的直線
  const out=[], dx=t.x-u.x, dy=t.y-u.y, n=Math.max(Math.abs(dx),Math.abs(dy));
  for(let i=1;i<=len;i++){ const x=Math.round(u.x+dx*i/n), y=Math.round(u.y+dy*i/n);
    if(blocked(x,y)) break; const v=unitAt(x,y); if(v && !out.includes(v)) out.push(v); }
  return out;
}
function coneTiles(u, dir, len){   // 以 dir 方向、45 度以內、len 格內
  const out=[], dl=Math.hypot(dir.x-u.x, dir.y-u.y), vx=(dir.x-u.x)/dl, vy=(dir.y-u.y)/dl;
  for(let x=u.x-len;x<=u.x+len;x++) for(let y=u.y-len;y<=u.y+len;y++){
    const ox=x-u.x, oy=y-u.y, d=Math.max(Math.abs(ox),Math.abs(oy)); if(d<1||d>len) continue;
    if((ox*vx+oy*vy)/Math.hypot(ox,oy) >= .7) out.push({x,y});
  }
  return out;
}
const coneUnits = (u,dir,len) => coneTiles(u,dir,len).map(p=>unitAt(p.x,p.y)).filter(Boolean);
