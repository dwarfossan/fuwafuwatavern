/* ======================== 壓力（大爺 10-04、10-10 定；數字全部暫定，玩過再調） ========================
   - 0～100，到頂就失控；不做振奮。50 以上換壓力臉（stressed），100 失控＝同一張臉＋紅光＋晃動（嬌嬌額頭 V 變「王」）
   - 存在 state.stress[id]（跟著存檔、重新挑戰的快照走）；戰場單位的 u.stress 同步一份給畫面用
   - 只有戰鬥中會失控；探索、劇情、城鎮只累積
   - 失控：AI 接手（敵我共用的 aiTurn），不打隊友；自己回合結束擲感知豁免回神，隊友協助過有優勢，最多 3 回合一定回神；
     回神後壓力降到 50；戰鬥結束還在失控就自動回神
   第二批（還沒做）：四招失控技能、75 以上的煩躁台詞 */
const STRESS = {
  warn:50, cranky:75, afterFrenzy:50,
  battleEnd:5, critTaken:5, selfDown:15, allyDown:10, trap:5,   // 加
  relief:3, reliefMax:10,                                         // 自己爆擊或打倒敵人：每次 −3，每場最多 −10
  shortRest:10, longRest:30,                                      // 減；回到大爺的酒館直接歸零
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
const tavernStress = () => changeStressAll(() => 0);
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
