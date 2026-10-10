/* ======================== 壓力（大爺 10-04、10-10 定；數字全部暫定，玩過再調） ========================
   - 0～100，到頂就失控；不做振奮。50 以上換壓力臉（stressed），100 失控＝同一張臉＋紅光＋晃動（嬌嬌額頭 V 變「王」）
   - 存在 state.stress[id]（跟著存檔、重新挑戰的快照走）；戰場單位的 u.stress 同步一份給畫面用
   - 只有戰鬥中會失控；探索、劇情、城鎮只累積
   - 失控：AI 接手（敵我共用的 aiTurn），不打隊友；自己回合結束擲感知豁免回神，隊友協助過有優勢，最多 3 回合一定回神；
     回神後壓力降到 50；戰鬥結束還在失控就自動回神
   第二批（10-10）：四招失控技能（frenzyTurn，在檔案最後）、75 以上的煩躁台詞（data/barks.js 的 cranky） */
const STRESS = {
  warn:50, cranky:75, afterFrenzy:50,
  battleEnd:5, critTaken:5, selfDown:15, allyDown:10, trap:5,   // 加
  relief:3, reliefMax:10,                                         // 自己爆擊或打倒敵人：每次 −3，每場最多 −10
  teleport:20,                                                    // 全隊昏迷傳回酒館（10-11）
  shortRest:10, longRest:30,                                      // 減；酒館裡摸摸頭、睡覺再減（10-11 起回酒館不自動歸零）
  recoverStat:"WIS", recoverDC:10, frenzyMaxRounds:3
};
const isCritter = u => !!u && u.side==="pc" && CRITTERS.some(c=>c.id===u.id);   // 跟著冒險的 NPC 沒有壓力
const stressNow = id => Math.max(0, Math.min(STRESS_MAX, (state.stress||{})[id]||0));
// 表情：失控＞50 以上的壓力臉＞平常（受傷、勝利等演出由各畫面自己蓋過去）
const stressMood = u => u.frenzy ? "frenzy" : (u.stress||0) >= STRESS.warn ? "stressed" : undefined;
function setStress(u, v){
  state.stress ||= {};
  state.stress[u.id] = Math.max(0, Math.min(STRESS_MAX, Math.round(v)));
  u.stress = state.stress[u.id]; u.svgMood = stressMood(u);
}
// 戰場上的小傢伙：加減壓力；n 正＝加、負＝減。戰鬥中到頂就失控
function addStress(u, n, why){
  if(!isCritter(u) || !n) return;
  const before = stressNow(u.id); setStress(u, before + n);
  if(u.stress===before) return;
  if(B()) blog(`　${u.name}壓力 ${n>0?"+":"−"}${Math.abs(u.stress-before)}（${why}）→ ${u.stress}`, n>0 ? "stress" : "heal");
  if(n>0 && u.stress>=STRESS_MAX) startFrenzy(u);
}
// 戰鬥外（休息、回酒館）：直接改 state，戰場單位如果還在也同步
function changeStressAll(fn){
  state.stress ||= {};
  for(const c of CRITTERS){ state.stress[c.id] = Math.max(0, Math.min(STRESS_MAX, Math.round(fn(stressNow(c.id))))); }
  B()?.units.filter(isCritter).forEach(u=>{ u.stress = stressNow(u.id); u.svgMood = stressMood(u); });
}
const restStress = kind => changeStressAll(v => v - (kind==="short" ? STRESS.shortRest : STRESS.longRest));
// 開戰時單位帶上存著的壓力（到頂的進戰鬥時不立刻失控，輪到她時才爆）
function initStress(u){ if(!isCritter(u)) return; u.stress = stressNow(u.id); u.frenzy = null; u.svgMood = stressMood(u); }

// 自己爆擊或打倒敵人：每場最多 −10
function stressRelief(u, why){
  if(!isCritter(u) || u.frenzy) return;
  const b = B(); b.stressRelief ||= {};
  const left = STRESS.reliefMax - (b.stressRelief[u.id]||0), n = Math.min(STRESS.relief, left);
  if(n<=0) return;
  b.stressRelief[u.id] = (b.stressRelief[u.id]||0) + n;
  addStress(u, -n, why);
}
// 事件：被爆擊、昏迷（自己 +15、看到的隊友 +10）、踩陷阱、打完一場
function stressOnCrit(a, t){
  if(isCritter(t)) addStress(t, STRESS.critTaken, "被爆擊");
  if(isCritter(a) && a.side!==t.side) stressRelief(a, "爆擊");
}
function stressOnDown(t, src){
  if(isCritter(t)){
    addStress(t, STRESS.selfDown, "昏迷");
    B().units.filter(v=>isCritter(v) && v!==t && !v.down && !v.dead && inCombat(v)).forEach(v=>addStress(v, STRESS.allyDown, `看到${t.name}昏迷`));
  } else if(t.side==="foe" && isCritter(src)) stressRelief(src, `打倒${t.name}`);
}
function stressBattleEnd(){
  const b = B(); if(!b) return;
  b.units.filter(u=>isCritter(u) && inCombat(u) && !u.dead).forEach(u=>{ if(u.frenzy) endFrenzy(u, "戰鬥結束"); addStress(u, STRESS.battleEnd, "打完一場"); });
}

// ---------- 失控 ----------
function startFrenzy(u){
  const b = B();
  if(!b || b.phase!=="combat" || u.frenzy || u.down || u.dead || b.result) return;   // 只有戰鬥中會失控
  u.frenzy = {rounds:0, at:Date.now(), helped:false};
  u.svgMood = stressMood(u);
  blog(`${u.name}壓力爆表，失控了！（AI 接手）`, "kill", "失控！");
  fxFloat(u, POP_TEXT.frenzy, "dmg"); sfx("alert");
}
function endFrenzy(u, why){
  if(!u.frenzy) return;
  u.frenzy = null;
  setStress(u, STRESS.afterFrenzy);
  blog(`${u.name}回神了（${why}）。壓力降到 ${STRESS.afterFrenzy}`, "heal");
}
// 失控的回合結束：感知豁免回神；隊友協助過有優勢（兩顆取高）；第 3 回合結束一定回神
function frenzyTurnEnd(u){
  if(!u.frenzy || u.down || u.dead) return;
  u.frenzy.rounds++;
  if(u.frenzy.rounds >= STRESS.frenzyMaxRounds){ endFrenzy(u, `失控 ${STRESS.frenzyMaxRounds} 回合`); return; }
  const helped = u.frenzy.helped; u.frenzy.helped = false;
  let ok = saveRoll(u, STRESS.recoverStat, STRESS.recoverDC);
  if(!ok && helped){ blog(`　（${u.name}被隊友協助過，再擲一次）`); ok = saveRoll(u, STRESS.recoverStat, STRESS.recoverDC); }
  if(ok) endFrenzy(u, "感知豁免成功");
  else blog(`　${u.name}還沒回神……`, "miss");
}

// ---------- 失控技能（第二批，大爺 10-04 定、10-10 做；細節暫定） ----------
// 嬌嬌【魯莽打擊】：衝去打最兇的（生命最多的）；她攻擊有優勢、打她也有優勢
// 香香【同一招到底】：失控那一刻鎖定一招、一個目標，每回合重複，不花熟練格；目標倒了才換
// 默默【順手牽羊】：先撿走得到的地上武器／法器，再打架（偷敵人身上的要等偷竊系統）；
//                  高等隱形術（暫定只做優劣勢）：她攻擊有優勢、打她有劣勢
// 玲玲【效率至上】：挑範圍法術（沒有就挑最高階的傷害法術），用剩下最高階的格子升階放，真的耗格；
//                  格子用完就照一般 AI 打；她的範圍招不打自己人（skills.js spellCaught）
const FRENZY_SKILL = {tiger:"魯莽打擊", wolf:"同一招到底", raccoon:"順手牽羊", fox:"效率至上"};
function frenzyAdv(a, t){
  let n = 0;
  if(a?.frenzy && a.id==="tiger") n++;
  if(t?.frenzy && t.id==="tiger") n++;
  if(a?.frenzy && a.id==="raccoon") n++;
  if(t?.frenzy && t.id==="raccoon") n--;
  return n;
}
// 走到射程內再出手；走不到就盡量靠近，這回合不出手
function frenzyGo(e, t, R, act){
  const b = B();
  if(dist(e,t) <= R){ act(); return; }
  let best = null;
  reachable(e, b.moveLeft).forEach((p,k)=>{ const [x,y] = k.split(",").map(Number), d = dist({x,y}, t);
    if(!best || (d<=R) > (best.d<=R) || ((d<=R)===(best.d<=R) && (d<best.d || (d===best.d && p.cost<best.path.cost)))) best = {d, path:p}; });
  if(!best || !best.path.length){ blog(`${e.name}搆不到${t.name}……`); later(endTurn, 600); return; }
  b.busy = true;
  walk(e, best.path, ()=>{ b.busy = false;
    if(e.dead || e.down || b.result){ refreshBattle(); if(!b.result) later(endTurn, 600); return; }
    if(dist(e,t) <= R && !t.dead && !t.down) act(); else { refreshBattle(); later(endTurn, 600); } });
}
function frenzyCast(e, sk, t, tier=0){
  const b = B(); b.up = 0; b.tier = tier;
  const tgt = sk.impl.multi ? foeDarts(e, sk, t) : ["cone","area"].includes(sk.impl.target) ? {x:t.x, y:t.y} : t;
  doSkill(e, sk, tgt);
  later(endTurn, settle(1200));
}
// 有處理這回合回傳 true；回傳 false 就照一般 AI 打
function frenzyTurn(e){
  const foes = seenFoes(e); if(!foes.length) return false;
  const near = list => list.slice().sort((a,c)=>dist(a,e)-dist(c,e))[0];
  const tag = `【${FRENZY_SKILL[e.id]}】`;
  if(e.id==="tiger"){
    const sk = attackSkill(e); if(!sk) return false;
    const t = foes.slice().sort((a,c)=>c.hp-a.hp || dist(a,e)-dist(c,e))[0];
    blog(`${e.name}${tag}衝向最兇的${t.name}！`, "kill");
    frenzyGo(e, t, sk.impl.range ? sk.impl.range(e) : 1, ()=>frenzyCast(e, sk, t));
    return true;
  }
  if(e.id==="wolf"){
    const f = e.frenzy;
    if(!f.lock){
      const sks = foeUsable(e).filter(s=>s.impl.target==="enemy" && s.def.kind!=="輔助");
      const sk = sks.filter(s=>baseTierOf(s)>0).sort((a,c)=>baseTierOf(c)-baseTierOf(a))[0] || attackSkill(e);
      if(!sk) return false;
      f.lock = {key:sk.key, tid:near(foes).id};
      blog(`${e.name}${tag}盯上${near(foes).name}，只用【${sk.def.name}】！`, "kill");
    }
    const sk = unitSkills(e).find(s=>s.key===f.lock.key) || learnedSkillByKey(f.lock.key);
    if(!sk || !sk.impl) return false;
    let t = foes.find(v=>v.id===f.lock.tid);
    if(!t){ t = near(foes); f.lock.tid = t.id; blog(`${e.name}${tag}改盯${t.name}。`, "kill"); }
    frenzyGo(e, t, sk.impl.range ? sk.impl.range(e) : 1, ()=>frenzyCast(e, sk, t));
    return true;
  }
  if(e.id==="raccoon"){
    const b = B();
    const reach = (b.drops||[]).length ? reachable(e, b.moveLeft) : null;
    const grab = reach && (b.drops||[]).filter(d=>canPick(e, d.item) && reach.has(`${d.x},${d.y}`))
      .map(d=>({d, path:reach.get(`${d.x},${d.y}`)})).sort((x,y)=>x.path.cost-y.path.cost)[0];
    if(grab){
      blog(`${e.name}${tag}先去撿${grab.d.name}！`, "kill"); b.busy = true;
      walk(e, grab.path, ()=>{ b.busy = false; refreshBattle(); later(endTurn, 700); });
      return true;
    }
    return false;   // 沒東西撿：照一般 AI 打（高等隱形的優劣勢照樣算）
  }
  if(e.id==="fox"){
    const spells = foeUsable(e).filter(s=>s.def.components && s.def.kind!=="輔助" && baseTierOf(s)>0 && tiersFor(e,s).length);
    const area = spells.filter(s=>["cone","area"].includes(s.impl.target));
    const sk = (area.length ? area : spells).sort((a,c)=>baseTierOf(c)-baseTierOf(a))[0];
    if(!sk) return false;   // 格子燒光：照一般 AI 打
    const tier = tiersFor(e, sk).at(-1), t = near(foes);
    const R = sk.impl.target==="cone" ? 3 : sk.impl.range ? sk.impl.range(e) : 1;
    blog(`${e.name}${tag}用${TIER_NAME[tier]}格放【${sk.def.name}】！`, "kill");
    frenzyGo(e, t, R, ()=>frenzyCast(e, sk, t, tier));
    return true;
  }
  return false;
}
