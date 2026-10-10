/* 每日委託（10-10）：資料在 data/quests.js
   state.quests＝{day, list:[{id, tpl, stars, link, t, seed, accepted, done}]}；day 跟道具店同一個遊戲日（長休 +1）
   流程：公會委託板接下 → 大地圖路上出現 ❗ 泡泡 → 點了走過去 → 隨機地圖（探索開場）→ 敵人全倒＝完成、給報酬 → 回大地圖 */
const questTpl = q => QUEST_TEMPLATES.find(t=>t.id===q.tpl);
const questLink = q => WORLD.links[q.link] || WORLD.links[0];
const questPos = q => { const l = questLink(q); return roadPoint(l.a, l.b, q.t); };
const questHome = q => { const l = questLink(q); return q.t < .5 ? l.a : l.b; };   // 打完回到比較近的那一頭
const questStars = n => "★".repeat(n) + "☆".repeat(3-n);
function ensureQuests(){
  const m = ensureMarket(), day = m.day;
  if(state.quests && state.quests.day===day && Array.isArray(state.quests.list)) return state.quests;
  const r = mapRng((m.seed ^ Math.imul(day + 7, 0x9E3779B1)) >>> 0);
  // 每條路一個，泡泡不疊在一起（路比委託少才會重複）
  const links = WORLD.links.map((_,i)=>i).sort(()=>r()-.5);
  const list = [1,2,3].slice(0, QUEST_PER_DAY).map((stars, i)=>{
    const pool = QUEST_TEMPLATES.filter(t=>t.stars===stars), tpl = pool[Math.floor(r()*pool.length)];
    return {id:`q${day}-${i}`, tpl:tpl.id, stars, link:links[i % links.length], t:+(.3 + r()*.4).toFixed(3), seed:Math.floor(r()*2147483647), accepted:false, done:false};
  });
  state.quests = {day, list};
  return state.quests;
}
const questById = id => ensureQuests().list.find(q=>q.id===id) || null;
const questOpen = () => ensureQuests().list.filter(q=>q.accepted && !q.done);
// 目擊的怪物：「哥布林 ×2、哥布林弓手」
function questFoeText(t){
  const n = {}; t.foes.forEach(f=>{ const name = ENEMIES[f].name; n[name] = (n[name]||0) + 1; });
  return Object.entries(n).map(([k,v])=>v>1?`${k} ×${v}`:k).join("、");
}
function questRewardText(stars){
  const rw = QUEST_REWARD[stars];
  return QUEST_UI.rewardText.replace("{g}", rw.gold) + (rw.magic>=1 ? QUEST_UI.magic : rw.magic>0 ? QUEST_UI.magicChance.replace("{p}", Math.round(rw.magic*100)) : "");
}
// ---------- 公會委託板 ----------
function questBoardHTML(){
  const Q = ensureQuests();
  return `<div class="quest-board"><h3>${QUEST_UI.board} <small>${QUEST_UI.day.replace("{d}", Q.day)}</small></h3><p class="quest-note">${QUEST_UI.refresh}</p>${Q.list.map(q=>{
    const t = questTpl(q);
    const state_ = q.done ? `<span class="quest-state done">${QUEST_UI.done}</span>` : q.accepted ? `<span class="quest-state">${QUEST_UI.accepted}</span>` : `<button class="btn small" data-quest-accept="${q.id}">${QUEST_UI.accept}</button>`;
    return `<div class="quest-card${q.done?" done":""}" data-quest-card="${q.id}"><div class="quest-top"><b>${t.title}</b><span class="quest-stars" aria-label="${q.stars} 星">${questStars(q.stars)}</span></div><p>${t.text}</p><small>${QUEST_UI.client}：${t.client} · ${QUEST_UI.foes}：${questFoeText(t)}</small><small>${QUEST_UI.reward}：${questRewardText(q.stars)}</small>${state_}</div>`;
  }).join("")}</div>`;
}
function bindQuestBoard(){
  document.querySelectorAll("[data-quest-accept]").forEach(el=>el.addEventListener("click", ()=>{ const q = questById(el.dataset.questAccept); if(!q || q.done) return; q.accepted = true; sfx("pop"); render(); }));
}
// ---------- 大地圖：❗ 泡泡 ----------
function questPinsSVG(){
  if(typeof state==="undefined" || !state.quests) return "";
  return questOpen().map(q=>{ const p = questPos(q), t = questTpl(q), on = state.questSel===q.id;
    return `<g class="quest-pin${on?" on":""}" data-quest="${q.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" tabindex="0" role="button" aria-label="${QUEST_UI.pin}：${t.title}"><g class="quest-bob"><path d="M-17 -62 H17 Q25 -62 25 -54 V-34 Q25 -26 17 -26 H6 L0 -16 L-6 -26 H-17 Q-25 -26 -25 -34 V-54 Q-25 -62 -17 -62Z" fill="#fff" stroke="#2a2630" stroke-width="3.5" stroke-linejoin="round"/><path d="M0 -56 V-40" stroke="#d64545" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-32.5" r="3.6" fill="#d64545"/></g><circle r="30" cy="-36" fill="transparent"/></g>`;
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
  state.travel = {route, from:state.location, to:route[route.length-1], quest:q.id, stopT, leg:0, t:0, stop:1, alert:false, paused:false, chest:false, chestSeen:false, banterAt:2.0, elapsed:0, chatIndex:0, chat:null};
  render(); focusWorldParty(worldTravelPosition(state.travel)); startWorldTravel(state.travel);
}
// 走到了：開戰（探索開場，委託地圖不跳教學）
function questBattle(q){
  const t = questTpl(q), l = questLink(q);
  const d = generateRandomBattle(q.seed, {...(QUEST_TERRAIN[`${l.a}-${l.b}`]||{}), foes:t.foes.length, foeList:t.foes, name:t.title, tutorial:false});
  d.quest = q.id; d.questStars = q.stars; d.questHome = questHome(q); d.after = "questDone";
  return d;
}
function arriveQuest(tr){
  const q = questById(tr.quest);
  state.travel = null; state.worldLine = null;
  if(!q){ render(); return; }
  state.location = questHome(q); state.mapSel = state.location;   // 輸了傳回酒館、贏了回到這一頭
  BATTLES.quest = questBattle(q);
  state.page = "battle"; state.scout = null; startBattle("quest", false, "explore"); render(); window.scrollTo(0,0);
}
// 打贏（checkResult 呼叫）：報酬當場給，勝利畫面顯示
function grantQuestReward(){
  const b = B(); if(!b?.def.quest || b.questReward) return;
  const rw = QUEST_REWARD[b.def.questStars] || QUEST_REWARD[1], pcs = b.units.filter(u=>u.side==="pc"), each = Math.floor(rw.gold / pcs.length);
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
  blog(QUEST_UI.got.replace("{g}", each) + (out.item ? `；${QUEST_UI.gotItem.replace("{who}", out.who).replace("{item}", out.item)}` : ""), "skill");
}
function questRewardHTML(){
  const r = B()?.questReward; if(!r) return "";
  return `<p class="quest-reward">${QUEST_UI.got.replace("{g}", r.each)}${r.item ? `<br>${QUEST_UI.gotItem.replace("{who}", r.who).replace("{item}", r.item)}` : ""}</p>`;
}
// 勝利畫面按「繼續」：回大地圖
function finishQuest(){
  const b = B(); if(!b || b.result!=="win" || !b.def.quest) return;
  syncLearnedState();
  state.location = b.def.questHome || state.location; state.mapSel = state.location;
  state.battle = null; state.scout = null; state.questSel = null;
  state.page = "map"; render(); window.scrollTo(0,0);
}
