/* 驅除哥布林（主線，大爺 10-28）：文字、數字在 data/goblin-hunt.js
   state.goblinHunt＝{seed, stage, accepted, boardSeen, clueDay}
     stage：hunting（委託在板上，還沒打完）｜report（打完了，等回公會）｜done（回報完、領了錢）
     clueDay：哪一個遊戲日撲空過（那天的 ❗ 移到正確的路）
   - 公會：艾妲講完「哥布林的消息」（森林主線開頭，mainStage() 有值）就貼出來；委託板卡片 huntCardHTML；公會紅 ❗ huntGuildNotice
   - 每天牠們在哪條路：huntDayInfo（照 seed＋遊戲日，長休換）；目擊情報七成準
   - 接下：大地圖紅 ❗（huntPins，借委託的泡泡、走路、到達）→ huntArrive：準＝huntBattle 營地戰；不準＝劇情 huntMiss 撲空
   - 打完：grantQuestReward 呼叫 huntQuestEnd → report；公會「回報」→ huntReportDone 給錢 → done */
const ensureHunt = () => (state.goblinHunt ||= {seed:1 + Math.floor(Math.random()*2147483646), stage:"hunting", accepted:false});
const huntPosted = () => !!(state.townFounded && mainStage());   // 聽過艾妲「哥布林的消息」以後
const huntActive = () => huntPosted() && ensureHunt().stage==="hunting";
const huntRoadLinks = () => GOBLIN_HUNT.roads.map(([a,b])=>WORLD.links.findIndex(l=>(l.a===a && l.b===b) || (l.a===b && l.b===a))).filter(i=>i>=0);
const huntRoadName = link => { const l = WORLD.links[link], n = id => WORLD.locations.find(x=>x.id===id)?.name || id; return l ? `${n(l.a)}—${n(l.b)}` : ""; };
const huntRoadEnd = link => { const l = WORLD.links[link]; return l ? (l.a==="town" ? l.b : l.a) : "cave"; };   // 不是城鎮的那一頭
// 今天牠們在哪、目擊情報說哪（同一天固定，長休換）
function huntDayInfo(){
  const H = ensureHunt(), day = ensureMarket().day, links = huntRoadLinks();
  const r = mapRng((H.seed ^ Math.imul(day + 13, 0x85EBCA6B)) >>> 0);
  const real = links[Math.floor(r()*links.length)], right = r() < GOBLIN_HUNT.accuracy;
  const said = right || links.length<2 ? real : links.find(i=>i!==real);
  return {day, real, said, clue:H.clueDay===day};
}
// ❗ 在哪條路：撲空過就換成正確的那條
const huntPinLink = () => { const d = huntDayInfo(); return d.clue ? d.real : d.said; };

// ---------- 公會委託板 ----------
function huntCardHTML(){
  if(!huntPosted()) return "";
  const H = ensureHunt(), C = GOBLIN_HUNT.card, d = huntDayInfo();
  const where = H.stage==="hunting" ? `<small class="hunt-sighting">${(d.clue ? C.clue : C.sighting).replace("{road}", huntRoadName(d.clue ? d.real : d.said))}</small>` : "";
  const st = H.stage==="done" ? `<span class="quest-state done">${C.done}</span>`
    : H.stage==="report" ? `<span class="quest-state">${C.report}</span>`
    : H.accepted ? `<span class="quest-state">${C.accepted}</span>`
    : `<button class="btn small" data-hunt-accept="1">${C.accept}</button>`;
  return `<div class="quest-card hunt-card${H.stage==="done" ? " done" : ""}" data-hunt-card="1"><div class="quest-top"><b>${C.title}</b><span class="quest-main-mark" aria-label="主線">${obsBubbleHTML("main")}</span></div><p>${C.text}</p>${where}<small>${QUEST_UI.client}：${C.client} · ${QUEST_UI.foes}：${C.foes}</small><small>${QUEST_UI.reward}：${C.reward.replace("{g}", GOBLIN_HUNT.reward)}</small>${st}</div>`;
}
function bindHuntCard(){
  if(!document.querySelector("[data-hunt-card]")) return;
  const H = ensureHunt(); H.boardSeen = true;
  document.querySelector("[data-hunt-accept]")?.addEventListener("click", ()=>{ if(!huntActive()) return; H.accepted = true; sfx("pop"); render(); });
}
// 公會紅 ❗：還沒看過委託板、或打完等回報
const huntGuildNotice = () => huntPosted() && (!ensureHunt().boardSeen || ensureHunt().stage==="report");
const huntReportDue = () => huntPosted() && ensureHunt().stage==="report";
function huntReportLines(){
  const L = GOBLIN_HUNT.report[mainStage()==="done" ? "after" : "before"];
  return L.map(t=>t.replace("{g}", GOBLIN_HUNT.reward));
}
function huntReportDone(){
  const H = ensureHunt(); if(H.stage!=="report") return;
  grantPartyGold(GOBLIN_HUNT.reward); H.stage = "done"; sfx("win");
}

// ---------- 大地圖：紅 ❗ ----------
function huntPins(){
  if(!huntActive() || !ensureHunt().accepted) return [];
  const H = ensureHunt(), d = huntDayInfo(), link = huntPinLink();
  return [{id:"hunt", tpl:"hunt", stars:0, link, t:.5, seed:(H.seed ^ Math.imul(d.day + 1, 0x9E3779B1))>>>0, accepted:true, done:false, hunt:true, main:true}];
}
const huntPinTpl = id => id==="hunt" ? {title:GOBLIN_HUNT.card.pin, foes:[]} : null;
function huntArrive(q){
  const d = huntDayInfo();
  if(q.link!==d.real){   // 撲空
    ensureHunt().clueDay = d.day;
    state.huntMiss = huntRoadEnd(d.real);
    state.page = "story"; state.scene = "huntMiss"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
    return;
  }
  BATTLES.quest = huntBattle(q);
  state.page = "battle"; state.scout = null; startBattle("quest", false, "explore"); render(); window.scrollTo(0,0);
}
const huntMissScript = () => (GOBLIN_HUNT.miss[state.huntMiss] || GOBLIN_HUNT.miss.cave).map(l=>({draft:GOBLIN_HUNT.draft, ...l}));
function finishHuntMiss(){ state.huntMiss = null; state.page = "map"; render(); window.scrollTo(0,0); }

// ---------- 戰場：營地 ----------
function huntBattle(q){
  const l = questLink(q), G = GOBLIN_HUNT, grudge = grudgeFoes(q);   // 記仇回來的照樣混進來
  const d = generateQuestMap(q.seed, {theme:QUEST_THEME[`${l.a}-${l.b}`]||"plain", foeList:[...G.foes, ...(grudge ? grudge.extra : [])], name:G.card.title});
  grudgeMark(d, G.foes.length, grudge);
  // 營地寶箱＝贓物：金幣＋搶來的道具
  const chest = d.blocks.find(o=>o.kind==="chest"), r = mapRng(q.seed ^ 0x5bd1e995);
  if(chest){
    const pool = ITEMS.filter(it=>G.lootCats.includes(it.cat) && !it.contains);   // 只抽單件，不抽套組（大爺 10-28）
    chest.contents = Array.from({length:G.loot.items}, ()=>({...pool[Math.floor(r()*pool.length)]}));
    chest.gold = G.loot.gold[0] + Math.floor(r()*(G.loot.gold[1] - G.loot.gold[0] + 1));
    chest.goldLog = G.lootLog;
  }
  d.quest = q.id; d.questStars = 0; d.noReward = true; d.questHome = questHome(q); d.after = "questDone"; d.goblinHunt = true;
  return d;
}
// 開戰、增援（forestCombatStart 呼叫）：帶頭的英雄喊一句
function huntCombatStart(){
  const b = B(); if(!b?.def.goblinHunt || b.huntShout) return;
  const hero = b.units.find(u=>u.type==="goblin_hero" && u.combatActive && !u.dead && !u.grudge);
  if(hero){ b.huntShout = true; say(hero, GOBLIN_HUNT.shout, 300); }
}
// 打贏（grantQuestReward 呼叫）
function huntQuestEnd(b){
  if(!b?.def.goblinHunt || b.huntEnded) return; b.huntEnded = true;
  const H = ensureHunt(); H.stage = "report"; H.accepted = false;
}
const huntEndHTML = () => B()?.def.goblinHunt && B()?.huntEnded ? `<p class="quest-reward">${GOBLIN_HUNT.end}</p>` : "";
