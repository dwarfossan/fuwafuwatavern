/* 死亡騎士（大爺 10-23）：文字在 data/death-knight.js
   - hurt() 打到 0 血時呼叫 dkRepel：不會死、不會被敲暈，化成黑霧消失（t.dead＝算打倒，t.repelled）
   - questBattle 呼叫 dkQuestPatch：隊上帶著韁繩＝他用走的來（f.onFoot，engine 不建坐騎）
   - arriveQuest 呼叫 dkDemandDue：第一次帶著韁繩去接「黑馬騎士」→ 先演討馬（劇情 dkDemand）→ startDkQuest 開打 */
const partyHasReins = () => CRITTERS.some(c=>invItems(c.id).some(it=>it && it.summon==="dk_horse"));
function dkRepel(t, at){
  t.dead = true; t.repelled = true; t.deadAt = impactAt();
  blog(DEATH_KNIGHT.repelLog.replace("{name}", t.name), "kill"); sfx("poof", at + 300); fxHit(t, "spark");
  say(t, DEATH_KNIGHT.repelSay, 200);
}
function dkQuestPatch(d){
  if(!partyHasReins()) return;
  d.foes.forEach(f=>{ if(f.type==="death_knight") f.onFoot = true; });
}
const dkDemandDue = q => !!q && q.tpl===DEATH_KNIGHT.quest && partyHasReins() && !state.deathKnight?.demanded;
function dkDemandScript(){
  const name = state.steed?.name || STEED_DEFAULT_NAME, D = DEATH_KNIGHT;
  const mid = name===STEED_DEFAULT_NAME ? D.same : D.renamed;
  return [...D.demand, ...mid, ...D.end].map(l=>({draft:D.draft, ...l, text:l.text.replaceAll("{name}", name)}));
}
function dkStartDemand(q){
  (state.deathKnight ||= {}).demanded = true; state.dkQuest = q.id;
  state.page = "story"; state.scene = "dkDemand"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}
function startDkQuest(){
  const q = questById(state.dkQuest); state.dkQuest = null;
  if(!q){ state.page = "map"; render(); return; }
  BATTLES.quest = questBattle(q);
  state.page = "battle"; state.scout = null; startBattle("quest", false, "explore"); render(); window.scrollTo(0,0);
}
