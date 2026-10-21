/* 天生技能（10-10，大爺：每隻怪物一個技能，香香定、全部暫定；怪物技能就是天生技能）
   資料：data/skills.js 的「天生技能」組（id、名稱、說明）；怪物身上寫 special（data/enemies.js）
   這裡：結算（SKILL_IMPL.natural）、動作外觀（SKILL_ANIM.natural）、AI 什麼時候用（MONSTER_AI）
   充能：用過後，之後每輪輪到牠時擲 d6，5～6 充好（第一次一定能用）；每場一次（once）用過就沒了
   小傢伙們觀察學不走（doSkillNow 看 def.innate 跳過觀察） */
const MONSTER_DC = (u, stat) => dcOf(u, stat);
// 攻擊後看實際扣了多少血（吸血用）
function hpLost(t, fn){ const before = t.hp; fn(); return Math.max(0, before - t.hp); }
SKILL_IMPL.natural = [
  // 吸血（蝙蝠）：咬，命中回復傷害的一半
  {target:"enemy", range:()=>1, run:(u,t)=>{ let r; const lost = hpLost(t, ()=>{ r = weaponAttack(u,t,{}); });
    if(r.hit && lost>1 && !u.dead){ heal(u, Math.floor(lost/2)); blog(`　${u.name}吸了血，回復 ${Math.floor(lost/2)}`, "skill"); } }},
  // 酸液噴吐（史萊姆）
  {target:"enemy", range:()=>3, run:(u,t)=>{ const n = rollDice("2d6").total;
    hurt(t, saveRoll(t,"DEX",MONSTER_DC(u,"CON"),u) ? Math.floor(n/2) : n, "強酸", u); }},
  {passive:true},   // 散骨（骷髏）：穿刺抗性，寫在 enemies.js 的 resistances
  {passive:true},   // 不死韌性（殭屍）：undeadFortitude，hurt() 裡呼叫
  // 撒沙（盜賊）
  {target:"enemy", range:()=>1, run:(u,t)=>{
    if(!saveRoll(t,"CON",MONSTER_DC(u,"DEX"))){ addStatus(t,"sapped",{via:"sand"}); fxFloat(t,"沙子！","dmg"); blog(`　${t.name}眼睛進沙，下次攻擊有劣勢`,"skill"); }
    else { fxFloat(t, POP_TEXT.miss, "miss"); blog(`　${t.name}閉眼躲開了。`); } }},
  // 蠻衝（獸人）：AI 先衝到旁邊，這裡結算攻擊
  {target:"enemy", range:()=>1, run:(u,t)=>{ const r = weaponAttack(u,t,{});
    if(r.hit && !t.dead && !t.down && !saveRoll(t,"STR",MONSTER_DC(u,"STR"))){ knockProne(t); blog(`　${t.name}被撞倒了！`,"skill"); } }},
  // 驚嚇哀號（幽靈）：4 格內的小傢伙們感知豁免，失敗壓力 +15
  {target:"self", run:u=>{ const ps = enemiesOf(u).filter(p=>dist(p,u)<=4 && !p.down && !p.dead);
    if(!ps.length) blog("　附近沒有人聽到。");
    ps.forEach(p=>{ if(saveRoll(p,"WIS",MONSTER_DC(u,"CHA"))){ fxFloat(p, POP_TEXT.miss, "miss"); return; }
      fxHit(p,"spark"); if(isCritter(p)) addStress(p, 15, "驚嚇哀號"); else fxFloat(p,"嚇到了","dmg"); }); }},
  // 蛛網（巨蛛）：跟網子同一套束縛（via:"net"），花動作力量檢定掙脫
  {target:"enemy", range:()=>6, run:(u,t)=>{
    if(!saveRoll(t,"DEX",MONSTER_DC(u,"DEX"),u)){ addStatus(t,"restrained",{via:"net", dc:MONSTER_DC(u,"STR")}); fxFloat(t, POP_TEXT.bound, "dmg"); blog(`　${t.name}被蛛網纏住了！`,"skill"); }
    else { fxFloat(t, POP_TEXT.miss, "miss"); blog(`　${t.name}閃開了蛛網。`); } }},
  // 俯衝（獅鷲）：AI 先飛到旁邊，這裡結算（優勢、命中多 1d8）
  {target:"enemy", range:()=>1, run:(u,t)=>{ const r = weaponAttack(u,t,{adv:true});
    if(r.hit && !t.dead && !t.down) hurt(t, dmgRoll("1d8",0,r.crit), dmgType(u), u); }},
  // 熊抱（梟熊）
  {target:"enemy", range:()=>1, run:(u,t)=>{ const r = weaponAttack(u,t,{});
    if(!r.hit || t.dead || t.down || grappled(t)) return;
    const s = bestOfSave(t,"STR","DEX"), dc = MONSTER_DC(u,"STR");
    if(!saveRoll(t,s,dc)){ addStatus(t,"restrained",{via:"grapple", src:u.id, dc}); fxHit(t,"burst"); blog(`　${t.name}被${u.name}抱住了！不能移動，直到掙脫。`,"skill"); } }},
  // 火焰吐息（奇美拉）：前方 3 格錐形；只燒對手（暫定）
  {target:"cone", range:()=>1, run:(u,c)=>{ coneTiles(u,c,3).forEach(p=>groundReact(p.x,p.y,"火焰"));
    const es = coneUnits(u,c,3).filter(v=>hostile(v,u)); if(!es.length) blog("　火焰沒燒到任何人。");
    es.forEach(e=>{ const n = rollDice("3d6").total; hurt(e, saveRoll(e,"DEX",MONSTER_DC(u,"CON"),u) ? Math.floor(n/2) : n, "火焰", u); }); }},
  // 吸血鬼之咬：命中多 2d6 死靈，回復同樣的量
  {target:"enemy", range:()=>1, run:(u,t)=>{ const r = weaponAttack(u,t,{});
    if(!r.hit || t.dead || t.down) return;
    const lost = hpLost(t, ()=>hurt(t, dmgRoll("2d6",0,r.crit), "死靈", u));
    if(lost && !u.dead){ heal(u, lost); blog(`　${u.name}吸了血，回復 ${lost}`, "skill"); } }},
  // 死亡低語（巫妖）
  {target:"enemy", range:()=>8, run:(u,t)=>{ const n = rollDice("3d8").total;
    hurt(t, saveRoll(t,"CON",MONSTER_DC(u,"INT"),u) ? Math.floor(n/2) : n, "死靈", u); }},
  // 獄火斬（死亡騎士）
  {target:"enemy", range:()=>1, run:(u,t)=>{ const r = weaponAttack(u,t,{});
    if(r.hit && !t.dead && !t.down){ hurt(t, dmgRoll("2d6",0,r.crit), "火焰", u); groundReact(t.x,t.y,"火焰"); } }},
  // 撲咬（梟熊寶寶，SRD 獒犬）：咬，命中後力量豁免，失敗倒地
  {target:"enemy", range:()=>1, run:(u,t)=>{ const r = weaponAttack(u,t,{});
    if(r.hit && !t.dead && !t.down && !saveRoll(t,"STR",MONSTER_DC(u,"STR"))){ knockProne(t); blog(`　${t.name}被撲倒了！`,"skill"); } }},
  // 麻痺之爪（食屍鬼，SRD）：命中後體質豁免，失敗麻痺（下一回合跳過）
  {target:"enemy", range:()=>1, run:(u,t)=>{ const r = weaponAttack(u,t,{});
    if(r.hit && !t.dead && !t.down && !saveRoll(t,"CON",10)){ addStatus(t,"paralyzed",{via:"ghoul"}); fxFloat(t,"麻痺","dmg"); blog(`　${t.name}全身麻掉了！下一回合動不了。`,"skill"); } }},
  // 纏藤（食人花，原創）：跟蛛網同一套束縛
  {target:"enemy", range:()=>2, run:(u,t)=>{
    if(!saveRoll(t,"DEX",MONSTER_DC(u,"STR"),u)){ addStatus(t,"restrained",{via:"net", dc:MONSTER_DC(u,"STR")}); fxFloat(t, POP_TEXT.bound, "dmg"); blog(`　${t.name}被藤蔓纏住了！`,"skill"); }
    else { fxFloat(t, POP_TEXT.miss, "miss"); blog(`　${t.name}躲開了藤蔓。`); } }},
  // 火焰吐息（紅龍幼龍，SRD）：前方 3 格錐形；用龍的吐息演出（dragon.js），演不出來就直接結算
  {target:"cone", range:()=>1, run:(u,c)=>{ const hit = tiles=>{ tiles.forEach(p=>groundReact(p.x,p.y,"火焰")); const es = coneUnits(u,c,3).filter(v=>hostile(v,u)); if(!es.length) blog("　火焰沒燒到任何人。");
      es.forEach(e=>{ const n = rollDice("7d6").total; hurt(e, saveRoll(e,"DEX",MONSTER_DC(u,"CON"),u) ? Math.floor(n/2) : n, "火焰", u); }); };
    const b = B(), busy = b.busy; b.busy = false; if(!dragonBreath(u, c, {range:3, onImpact:hit})){ b.busy = busy; hit(coneTiles(u,c,3)); } }},
  {passive:true},   // 圍毆（狼、狗頭人）：attackRoll
  {passive:true},   // 怕陽光（狗頭人）：attackRoll
  {passive:true},   // 靈巧脫逃（哥布林）：flow.js 的 nimbleDisengage／nimbleHide
  {passive:true}    // 黑暗視覺：darkvisionRange
];
SKILL_ANIM.natural = ["thrust","cast","slash","slash","punch","slash","cast","cast","slash","punch","cast","thrust","cast","slash","thrust","slash","cast","cast"];

// 殭屍：不死韌性（hurt() 打到 0 時呼叫；光耀不能撐）
function undeadFortitude(t, n, type){
  if(t.side!=="foe" || t.special!=="undead_fortitude" || type==="光耀" || n<=0) return;
  if(saveRoll(t, "CON", 5+n)){ t.hp = 1; fxFloat(t, "撐住了", "dmg"); blog(`　${t.name}【不死韌性】：撐住了，剩 1 血！`, "skill"); }
}

// ---------- AI：輪到牠時，技能能用、用得上就用 ----------
const monsterAdj = e => seenFoes(e).filter(p=>dist(p,e)<=reachOf(e)).sort((a,c)=>aiHp(e,a)-aiHp(e,c))[0] || null;
const monsterNear = (e, r, ok=()=>true) => seenFoes(e).filter(p=>dist(p,e)<=r && ok(p)).sort((a,c)=>dist(a,e)-dist(c,e) || a.hp-c.hp)[0] || null;
// 錐形：挑打到最多對手的方向
function monsterConeAim(e){
  let best = null;
  for(const p of seenFoes(e).filter(p=>dist(p,e)<=3)){ const n = coneUnits(e,{x:p.x,y:p.y},3).filter(v=>hostile(v,e)).length; if(!best || n>best.n) best = {n, t:{x:p.x,y:p.y}}; }
  return best && best.n ? best.t : null;
}
// 衝過去：3 格以外、這回合走得到旁邊的對手；回傳 {t, path}
function monsterRush(e){
  const b = B(); if(!b.moveLeft || grappled(e) || has(e,"restrained")) return null;
  const all = reachable(e, b.moveLeft); let best = null;
  for(const t of seenFoes(e).filter(p=>dist(p,e)>=3)){
    for(const [dx,dy] of DIRS){ const path = all.get(`${t.x+dx},${t.y+dy}`); if(path && path.length && (!best || path.cost<best.path.cost)) best = {t, path}; }
  }
  return best;
}
const MONSTER_AI = {
  bat_drain:      e=>monsterAdj(e),
  slime_spit:     e=>monsterNear(e,3),
  bandit_sand:    e=>monsterAdj(e),
  orc_charge:     e=>monsterRush(e),
  ghost_wail:     e=>seenFoes(e).some(p=>dist(p,e)<=4) ? e : null,
  spider_web:     e=>monsterNear(e,6,p=>!has(p,"restrained")),
  griffin_dive:   e=>monsterRush(e),
  owlbear_hug:    e=>victimsOf(e).length ? null : monsterAdj(e),
  chimera_breath: e=>monsterConeAim(e),
  vampire_bite:   e=>monsterAdj(e),
  lich_whisper:   e=>monsterNear(e,8),
  dk_hellstrike:  e=>monsterAdj(e),
  cub_pounce:     e=>monsterAdj(e),
  ghoul_claw:     e=>monsterAdj(e),
  vine_snare:     e=>monsterNear(e,2,p=>!has(p,"restrained")),
  wyrm_breath:    e=>monsterConeAim(e)
};
function monsterSpecialReady(e, def){
  if(def.once) return !e.specialUsed;
  if(!def.recharge) return true;
  if(e.specialReady===undefined) e.specialReady = true;
  if(!e.specialReady && e.rechargeRound!==B().round){
    e.rechargeRound = B().round; const r = 1 + Math.floor(Math.random()*6);
    if(r>=5){ e.specialReady = true; blog(`${e.name}的【${def.name}】充能好了（d6=${r}）`, "skill"); }
  }
  return e.specialReady;
}
// aiTurn 呼叫：用了回傳 true（這回合交給這裡收尾）
function monsterTurn(e){
  const key = e.special, pick = key && MONSTER_AI[key]; if(!pick) return false;
  const sk = learnedSkillByKey(key); if(!sk || !sk.impl || sk.impl.passive) return false;
  if(!monsterSpecialReady(e, sk.def)) return false;
  const got = pick(e); if(!got) return false;
  const use = t => { if(sk.def.once) e.specialUsed = true; if(sk.def.recharge) e.specialReady = false; doSkill(e, sk, t); };
  if(got.path){   // 衝過去再出手
    const b = B(); b.busy = true;
    blog(`${e.name}【${sk.def.name}】衝向${got.t.name}！`, "skill");
    walk(e, got.path, ()=>{ b.busy = false;
      if(e.dead || e.down || b.result){ refreshBattle(); if(!b.result) later(endTurn, 600); return; }
      if(dist(e,got.t)<=1 && !got.t.dead && !got.t.down){ use(got.t); later(endTurn, settle(1000)); }
      else { refreshBattle(); later(endTurn, 600); } });
    return true;
  }
  use(got); later(endTurn, settle(1000)); return true;
}
// 狀態卡一行：天生攻擊＋怪物技能（說明放提示）
// 體型（10-21）：敵人和坐騎的狀態卡上寫「大型 · 佔 2×2 格」，點了說明抓不抓得動
function sizeLineHTML(v){
  if(isPcCritter(v) || v.side==="npc") return "";
  const sz = sizeOf(v), n = footOf(v), k = SIZES.indexOf(sz) - SIZES.indexOf(RACE.size) - 1;
  const tip = (k>0 ? SIZE_UI.bigger(k+1) : SIZE_UI.ok) + (n>1 ? SIZE_UI.footTip(n) : "");
  return `<div class="dim race-line size-line" data-tip="${tip}" data-tip-title="${SIZE_UI.tipTitle}">${sz}${n>1 ? ` · ${SIZE_UI.foot(n)}` : ""}</div>`;
}
function monsterInfoHTML(v){
  const size = sizeLineHTML(v) + grudgeLineHTML(v);
  const pas = v.side==="foe" ? passiveSkills(v).filter(s=>s.key!==v.special) : [];   // 敵人身上的被動（例：骷髏勇士的連擊，10-21）
  if(v.side!=="foe" || (!v.natural && !v.special && !pas.length)) return size;
  const sk = v.special && learnedSkillByKey(v.special), parts = [];
  if(v.natural) parts.push(`${v.natural.name} ${v.natural.dmg.replace(" ","・")}`);
  if(sk) parts.push(`技能：${sk.def.name}${sk.def.recharge ? (v.specialReady===false ? "（充能中）" : "（可用）") : sk.def.once && v.specialUsed ? "（用過了）" : ""}`);
  if(pas.length) parts.push(`被動：${pas.map(s=>s.def.name).join("、")}`);
  const tip = [sk, ...pas].filter(Boolean).map(s=>`${s.def.name}：${s.def.text}`).join("\n");
  return size + `<div class="dim race-line monster-line" data-tip="${tip}" data-tip-title="${sk?sk.def.name:pas[0]?pas[0].def.name:""}">${parts.join(" · ")}</div>`;
}
