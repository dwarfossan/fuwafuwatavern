/* 每日委託（10-10）：資料在 data/quests.js
   state.quests＝{day, list:[{id, tpl, stars, link, t, seed, accepted, done}]}；day 跟道具店同一個遊戲日（長休 +1）
   流程：公會委託板接下 → 大地圖路上出現 ❗ 泡泡 → 點了走過去 → 隨機地圖（探索開場）→ 敵人全倒＝完成、給報酬 → 回大地圖 */
const questTpl = q => QUEST_TEMPLATES.find(t=>t.id===q.tpl) || owlbearPinTpl(q.tpl) || orcPinTpl(q.tpl) || chickenPinTpl(q.tpl) || huntPinTpl(q.tpl);   // 梟熊寶寶劇情的 ❗ 也借用（10-21）
const questLink = q => WORLD.links[q.link] || WORLD.links[0];
const questPos = q => { const l = questLink(q); return roadPoint(l.a, l.b, q.t); };
const questHome = q => { const l = questLink(q); return q.t < .5 ? l.a : l.b; };   // 打完回到比較近的那一頭
const questStars = n => n ? "★".repeat(n) + "☆".repeat(3-n) : "";   // 0＝劇情的 ❗，不顯示星星
function ensureQuests(){
  const m = ensureMarket(), day = m.day;
  if(state.quests && state.quests.day===day && Array.isArray(state.quests.list)) return state.quests;
  const r = mapRng((m.seed ^ Math.imul(day + 7, 0x9E3779B1)) >>> 0);
  // 每條路一個，泡泡不疊在一起（路比委託少才會重複）
  const links = WORLD.links.map((_,i)=>i).sort(()=>r()-.5);
  const list = [1,2,3].slice(0, QUEST_PER_DAY).map((stars, i)=>{
    const pool = QUEST_TEMPLATES.filter(t=>t.stars===stars), ws = pool.map(t=>questTplWeight(t)*graveQuestWeight(t));   // 墓地線：抗議結束後不再有女吸血鬼（10-28）   // 森林＋驅除哥布林都打完：哥布林的減半（10-28）
    let x = r()*ws.reduce((a,b)=>a+b, 0), tpl = pool[pool.length-1]; for(let k=0; k<pool.length; k++){ x -= ws[k]; if(x<0){ tpl = pool[k]; break; } }
    return {id:`q${day}-${i}`, tpl:tpl.id, stars, link:links[i % links.length], t:+(.3 + r()*.4).toFixed(3), seed:Math.floor(r()*2147483647), accepted:false, done:false};
  });
  state.quests = {day, list};
  return state.quests;
}
const questById = id => ensureQuests().list.find(q=>q.id===id) || owlbearPins().find(q=>q.id===id) || orcPins().find(q=>q.id===id) || chickenPins().find(q=>q.id===id) || huntPins().find(q=>q.id===id) || null;
const questOpen = () => [...ensureQuests().list.filter(q=>q.accepted && !q.done), ...owlbearPins(), ...orcPins(), ...chickenPins(), ...huntPins()];
// 目擊的怪物：「哥布林 ×2、哥布林弓手」
function questFoeText(t){
  const n = {}; t.foes.forEach(f=>{ const name = ENEMIES[f].name; n[name] = (n[name]||0) + 1; });
  return Object.entries(n).map(([k,v])=>v>1?`${k} ×${v}`:k).join("、");
}
const questGold = (stars, t) => Math.round(QUEST_REWARD[stars].gold * (t?.goldMul || 1));   // 度假村的客訴打九折（10-29）
function questRewardText(stars, t){
  const rw = QUEST_REWARD[stars];
  return QUEST_UI.rewardText.replace("{g}", questGold(stars, t)) + (rw.magic>=1 ? QUEST_UI.magic : rw.magic>0 ? QUEST_UI.magicChance.replace("{p}", Math.round(rw.magic*100)) : "");
}
// ---------- 公會委託板 ----------
function questBoardHTML(){
  const Q = ensureQuests();
  return `<div class="quest-board"><h3>${QUEST_UI.board} <small>${QUEST_UI.day.replace("{d}", Q.day)}</small></h3><p class="quest-note">${QUEST_UI.refresh}</p>${huntCardHTML()}${orcWantedHTML()}${Q.list.map(q=>{
    const t = questTpl(q);
    const state_ = q.done ? `<span class="quest-state done">${QUEST_UI.done}</span>` : q.accepted ? `<span class="quest-state">${QUEST_UI.accepted}</span>` : `<button class="btn small" data-quest-accept="${q.id}">${QUEST_UI.accept}</button>`;
    return `<div class="quest-card${q.done?" done":""}" data-quest-card="${q.id}"><div class="quest-top"><b>${t.title}</b><span class="quest-stars" aria-label="${q.stars} 星">${questStars(q.stars)}</span></div><p>${t.text}${questNightOnly(t)?`<b class="night-only">${DAYTIME.ui.nightOnly}</b>`:""}</p><small>${QUEST_UI.client}：${t.client} · ${QUEST_UI.foes}：${questFoeText(t)}</small><small>${QUEST_UI.reward}：${questRewardText(q.stars, t)}</small>${state_}</div>`;
  }).join("")}</div>`;
}
function bindQuestBoard(){
  bindOrcWanted();   // 獨眼的通緝單（10-23）
  bindHuntCard();    // 驅除哥布林（主線，10-28）
  document.querySelectorAll("[data-quest-accept]").forEach(el=>el.addEventListener("click", ()=>{ const q = questById(el.dataset.questAccept); if(!q || q.done) return; q.accepted = true; sfx("pop"); render(); }));
}
// ---------- 大地圖：❗ 泡泡 ----------
// 驚嘆號（大爺 10-22）：大地圖不另外畫，跟城鎮、戰場共用同一個泡泡框（obsBubbleBody）；主線紅字、支線黃字
const pinBubbleSVG = kind => `<g class="quest-bob"><g transform="translate(0 -16) scale(1.2)">${obsBubbleBody(kind==="main" ? "main" : "side", 0)}</g></g>`;
function questPinsSVG(){
  if(typeof state==="undefined") return "";
  // 還沒去過公會也會有梟熊寶寶的 ❗（10-21）
  return (state.quests ? questOpen() : owlbearPins()).filter(q=>isNight() || !questNightOnly(questTpl(q))).map(q=>{ const p = questPos(q), t = questTpl(q), on = state.questSel===q.id;   // 不死的委託白天找不到（10-29）
    return `<g class="quest-pin${on?" on":""}" data-quest="${q.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" tabindex="0" role="button" aria-label="${QUEST_UI.pin}：${t.title}">${pinBubbleSVG(q.main ? "main" : "side")}<circle r="30" cy="-36" fill="transparent"/></g>`;
  }).join("");
}
// 走過去：先走到這條路的其中一頭，再沿著這條路走到泡泡的位置（tr.stopT）
function questRoute(q){
  const l = questLink(q), here = state.location;
  const viaA = worldRoute(here, l.a), viaB = worldRoute(here, l.b);
  const cost = (r, rest) => r ? r.length - 1 + rest : Infinity;
  if(cost(viaA, q.t) <= cost(viaB, 1 - q.t)) return {route:[...viaA, l.b], stopT:q.t};
  return {route:[...viaB, l.a], stopT:1 - q.t};
}
function beginQuestTravel(id){
  const q = questById(id); if(!q || !q.accepted || q.done || state.travel) return;
  const {route, stopT} = questRoute(q);
  state.worldArrival = null; state.worldLine = null; state.worldChest = null; state.questSel = null;
  state.travel = {route, from:state.location, to:route[route.length-1], quest:q.id, stopT, leg:0, t:0, stop:1, alert:false, paused:false, chest:false, chestSeen:false, banterAt:2.0, elapsed:0, chatIndex:0, chat:null, orc:orcTravelRoll(route)};
  render(); focusWorldParty(worldTravelPosition(state.travel)); startWorldTravel(state.travel);
}
// 走到了：開戰（探索開場，委託地圖不跳教學）
function questBattle(q){
  const t = questTpl(q), l = questLink(q);
  const grudge = grudgeFoes(q);   // 記仇回來的（10-21，js/grudge.js）：混進敵人名單最後面
  const d = generateQuestMap(q.seed, {theme:QUEST_THEME[`${l.a}-${l.b}`]||"plain", foeList:[...t.foes, ...(grudge ? grudge.extra : [])], name:t.title});   // 委託專用地圖（10-21）
  grudgeMark(d, t.foes.length, grudge);
  dkQuestPatch(d);   // 死亡騎士：馬在我們手上就用走的來（10-23）
  d.quest = q.id; d.questStars = q.stars; d.questHome = questHome(q); d.after = "questDone";
  if(owlbearStoryFor(q)) d.owlbearStory = true;   // 第一次的梟熊委託：梟熊寶寶劇情（10-21）
  return d;
}
function arriveQuest(tr){
  const q = questById(tr.quest);
  state.travel = null; state.worldLine = null; daytimeTick("travel");   // 走到 ❗ 也算出門一趟（日夜，10-29）
  if(!q){ render(); return; }
  state.location = questHome(q); state.mapSel = state.location;   // 輸了傳回酒館、贏了回到這一頭
  if(q.orc){ orcArrive(q); return; }
  if(q.chicken){ chickenArrive(q); return; }   // 失蹤的雞（10-23）
  if(q.hunt){ huntArrive(q); return; }         // 驅除哥布林（主線，10-28）
  if(dkDemandDue(q)){ dkStartDemand(q); return; }   // 死亡騎士來討馬（10-23）   // 獨眼的營地（10-23）
  if(q.story){ owlbearArrive(q); return; }   // 梟熊寶寶劇情的 ❗（10-21）
  BATTLES.quest = questBattle(q);
  state.page = "battle"; state.scout = null; startBattle("quest", false, "explore"); render(); window.scrollTo(0,0);
}
// 打贏（checkResult 呼叫）：報酬當場給，勝利畫面顯示
function grantQuestReward(){
  const b = B(); if(!b?.def.quest || b.questReward) return;
  const rw = b.def.noReward ? {gold:0, magic:0} : QUEST_REWARD[b.def.questStars] || QUEST_REWARD[1], pcs = b.units.filter(isPcCritter), qt = questById(b.def.quest), each = Math.floor((b.def.noReward ? 0 : questGold(b.def.questStars in QUEST_REWARD ? b.def.questStars : 1, qt && questTpl(qt))) / pcs.length);   // 森林打完再來：沒有報酬（10-21）
  pcs.forEach(u=>{ state.gold[u.id] = (state.gold[u.id]||0) + each*GP; });
  const out = {each, item:null, who:null};
  if(rw.magic>0 && Math.random() < rw.magic){
    const pool = b.def.questStars>=3 ? MAGIC_GOODS : MAGIC_GOODS.filter(g=>g.rarity==="blue"||g.rarity==="yellow");
    const g = pool[Math.floor(Math.random()*pool.length)], it = makeMagicItem(g, `quest-${b.def.quest}-${Date.now()}`), u = pcs[Math.floor(Math.random()*pcs.length)];
    u.backpack.push(it); (state.inv[u.id] ||= []).push(it.id); syncBattleBag(u); saveMarket();
    out.item = it.n; out.who = u.name;
  }
  const q = questById(b.def.quest); if(q) q.done = true;   // 打到一半長休換日了：委託不在了，報酬照給
  b.questReward = out;
  owlbearQuestEnd(b);
  orcQuestEnd(b);     // 獨眼獸人（10-23）
  chickenQuestEnd(b); // 失蹤的雞（10-23）
  huntQuestEnd(b);    // 驅除哥布林（10-28）
  forestWin(b);       // 森林（10-21）
  grudgeRollAll(b);   // 被敲暈的擲 1d20（10-21）
  if(!b.def.noReward) blog(QUEST_UI.got.replace("{g}", each) + (out.item ? `；${QUEST_UI.gotItem.replace("{who}", out.who).replace("{item}", out.item)}` : ""), "skill");
}
function questRewardHTML(){
  const r = B()?.questReward; if(!r) return "";
  if(B().def.noReward) return owlbearEndHTML() + orcEndHTML() + chickenEndHTML() + huntEndHTML();
  return `<p class="quest-reward">${QUEST_UI.got.replace("{g}", r.each)}${r.item ? `<br>${QUEST_UI.gotItem.replace("{who}", r.who).replace("{item}", r.item)}` : ""}</p>${owlbearEndHTML()}`;
}
// 勝利畫面按「繼續」：回大地圖
function finishQuest(){
  const b = B(); if(!b || b.result!=="win" || !b.def.quest) return;
  syncLearnedState(); daytimeTick("battle");   // 打完一場委託／地城算一格（日夜，10-29）
  state.location = b.def.questHome || state.location; state.mapSel = state.location;
  state.battle = null; state.scout = null; state.questSel = null;
  state.page = "map";
  if(state.afterQuestScene){ state.page = "story"; state.scene = state.afterQuestScene; state.line = 0; state.info = null; state.afterQuestScene = null; }   // 打完接劇情（森林主線，10-22）
  render(); window.scrollTo(0,0);
}

// ---------- 撤退（大爺 10-20） ----------
// 只有委託這類隨機地圖能撤；一鍵全隊一起走（毛毛們同進同出），昏迷的一起帶走，不會被藉機攻擊。
// 戰鬥中撤：已經打倒的照給經驗、全隊壓力 +10；探索中（還沒開戰）＝直接離開，沒有代價。
// 撤出後站在大地圖上委託那一頭；委託沒完成、留到換日，下次進去敵人照原本的種子滿血重來。
const canRetreat = () => { const b = B(); return !!(b && b.explorationMap && b.def.quest && !b.result); };
function askRetreat(){ const b = B(); if(!canRetreat() || b.busy) return; b.retreatAsk = true; b.busy = true; b.menu = null; b.exploreMenu = null; refreshBattle(); }
function retreatAskHTML(b){
  const combat = b.phase==="combat";
  return `<div class="bt-ov bt-react" role="dialog" aria-live="assertive"><h3>${combat ? RETREAT_UI.titleCombat : RETREAT_UI.titleExplore}</h3><p>${combat ? RETREAT_UI.hintCombat : RETREAT_UI.hintExplore}</p>${choiceBtnsHTML([{attr:`data-retreat="go"`, label:combat ? RETREAT_UI.goCombat : RETREAT_UI.goExplore, sub:combat ? RETREAT_UI.costCombat : RETREAT_UI.costExplore}], {attr:`data-retreat=""`, label:combat ? RETREAT_UI.cancel : RETREAT_UI.cancelExplore})}</div>`;
}
function answerRetreat(go){
  const b = B(); if(!b || !b.retreatAsk) return;
  b.retreatAsk = false; b.busy = false;
  if(!go){ refreshBattle(); return; }
  retreatBattle();
}
function retreatBattle(){
  const b = B(); if(!canRetreat()) return;
  if(b.phase==="combat"){
    daytimeTick("battle");   // 打到一半撤退也算一格（10-29）
    awardBattleXP();
    b.units.filter(u=>u.frenzy).forEach(u=>endFrenzy(u, "撤退"));
    changeStressAll(v=>v + STRESS.retreat);
    queueAfterTalk(b);
    grudgeRollAll(b);   // 撤退時已經被敲暈的也擲（10-21）
    orcQuestEnd(b);     // 獨眼逃走了才撤退的也算（10-23）
  }
  stashSteed(b); wakeAfterBattle(); syncLearnedState();
  state.location = b.def.questHome || state.location; state.mapSel = state.location;
  state.battle = null; state.scout = null; state.questSel = null;
  state.page = "map"; render(); window.scrollTo(0,0);
}
