/* 森林線的另一條路：聽德魯伊的（大爺 10-29）：文字、數字在 data/druid-route.js
   state.main.forestPath＝"eco"｜"druid"（沒有＝舊存檔＝eco）；state.main.gravePlate＝拿到奇美拉的名牌
   - 撞見（forestReveal 劇情）：選項 forestPick；eco＝照舊打奇美拉；druid＝森林主線 → chief、回大地圖。選了就不能反悔
   - chief：大地圖紅 ❗（chiefPins，借委託的泡泡、走路、到達）→ chiefBattle 營地戰 → chiefQuestEnd → 劇情 druidChiefAfter → report
   - 之後：questTplWeight 哥布林委託 0、驅除哥布林一起結案（chiefQuestEnd）、森林 quiet、公會台詞 guildAfter
   - 墓地線（noble／ancestor）：城鎮市場遇到德魯伊 → 劇情 druidShop → 名牌 → 談判有第三條路（graveHasCollar） */
FOREST.stages.quiet = {stars:0, noReward:true, foes:DRUID_ROUTE.quiet.foes, intro:DRUID_ROUTE.quiet.intro};   // 聽德魯伊的：之後的森林
const forestPath = () => (state.main ||= {}).forestPath || null;
const druidRoute = () => forestPath()==="druid";
const druidLinesR = list => list.map(l=>({draft:DRUID_ROUTE.draft, ...l}));

// ---------- 撞見：選邊 ----------
function forestRevealScript(){
  const p = forestPath(), A = DRUID_ROUTE.ask;
  const L = [...FOREST.main.reveal.map(l=>({draft:FOREST.main.draft, ...l})), ...druidLinesR(A.slice(0,-1)), {draft:DRUID_ROUTE.draft, ...A[A.length-1], forestChoice:true}];
  if(p==="eco" || p==="druid") L.push(...druidLinesR(DRUID_ROUTE[p]));
  return L;
}
const forestRevealNext = () => druidRoute() ? ["finishForestChoice", DRUID_ROUTE.revealNext.druid] : ["startForestBoss", DRUID_ROUTE.revealNext.eco];
const forestChoicePending = line => !!(line && line.forestChoice && !forestPath());
function forestChoiceHTML(){
  const P = DRUID_ROUTE.pick;
  return `<div class="choice-list">${["eco","druid"].map(k=>`<button class="choice" data-forest-pick="${k}"><b>${P[k].label}</b><small>${P[k].sub}</small></button>`).join("")}</div>`;
}
function forestPick(k){
  if(state.page!=="story" || state.scene!=="forestReveal" || forestPath() || !["eco","druid"].includes(k) || mainStage()!=="boss") return;
  const from = SCENES.forestReveal.script.length;
  state.main.forestPath = k;
  if(k==="druid") setMainStage("chief");
  sfx(k==="druid" ? "pop" : "alert");
  state.line = Math.min(from, SCENES.forestReveal.script.length - 1); render();
}
function finishForestChoice(){ if(druidRoute()) finishForestScene(); }

// ---------- 大地圖：酋長營地 ----------
const chiefLink = () => Math.max(0, WORLD.links.findIndex(l=>(l.a===DRUID_ROUTE.road[0] && l.b===DRUID_ROUTE.road[1]) || (l.a===DRUID_ROUTE.road[1] && l.b===DRUID_ROUTE.road[0])));
const chiefPins = () => druidRoute() && mainStage()==="chief" ? [{id:"chief", tpl:"chief", stars:0, link:chiefLink(), t:.62, seed:(state.goblinHunt?.seed || 7) ^ 0x2545F491, accepted:true, done:false, chief:true, main:true}] : [];
const chiefPinTpl = id => id==="chief" ? {title:DRUID_ROUTE.pin, foes:[]} : null;
function chiefArrive(q){ BATTLES.quest = chiefBattle(q); state.page = "battle"; state.scout = null; startBattle("quest", false, "explore"); render(); window.scrollTo(0,0); }
function chiefBattle(q){
  const l = questLink(q), R = DRUID_ROUTE, grudge = grudgeFoes(q);
  const d = generateQuestMap(q.seed, {theme:QUEST_THEME[`${l.a}-${l.b}`]||"plain", foeList:[...R.foes, ...(grudge ? grudge.extra : [])], name:R.pin});
  grudgeMark(d, R.foes.length, grudge);
  const chest = d.blocks.find(o=>o.kind==="chest"), r = mapRng(q.seed ^ 0x5bd1e995);
  if(chest){
    const pool = ITEMS.filter(it=>GOBLIN_HUNT.lootCats.includes(it.cat) && !it.contains);
    chest.contents = Array.from({length:R.loot.items}, ()=>({...pool[Math.floor(r()*pool.length)]}));
    chest.gold = R.loot.gold[0] + Math.floor(r()*(R.loot.gold[1] - R.loot.gold[0] + 1));
    chest.goldLog = R.lootLog;
  }
  d.quest = q.id; d.questStars = 0; d.noReward = true; d.questHome = questHome(q); d.after = "questDone"; d.goblinChief = true;
  return d;
}
function chiefCombatStart(){
  const b = B(); if(!b?.def.goblinChief || b.chiefShout) return;
  const c = b.units.find(u=>u.type==="goblin_chief" && u.combatActive && !u.dead && !u.grudge);
  if(c){ b.chiefShout = true; say(c, DRUID_ROUTE.shout, 300); }
}
function chiefQuestEnd(b){
  if(!b?.def.goblinChief || b.chiefEnded) return; b.chiefEnded = true;
  if(mainStage()==="chief") setMainStage("report");
  const H = state.goblinHunt; if(H && H.stage==="hunting"){ H.stage = "report"; H.accepted = false; }   // 驅除哥布林一起結案（回公會照樣領錢）
  state.afterQuestScene = "druidChiefAfter";
}
const chiefEndHTML = () => B()?.def.goblinChief && B()?.chiefEnded ? `<p class="quest-reward">${DRUID_ROUTE.end}</p>` : "";
const druidChiefScript = () => druidLinesR(DRUID_ROUTE.chiefAfter);
function finishDruidChief(){ state.page = "map"; render(); window.scrollTo(0,0); }

// ---------- 之後 ----------
const druidRouteQuiet = () => druidRoute() && ["chief","report","done"].includes(mainStage());
const goblinGone = () => druidRoute() && ["report","done"].includes(mainStage());

// ---------- 墓地線：買東西的德魯伊、名牌 ----------
const druidShopDue = () => !!(state.townFounded && druidRoute() && mainStage()==="done" && ["noble","ancestor"].includes(graveStage()) && !state.main.gravePlate);
function druidShopHTML(){
  if(!druidShopDue()) return "";
  const S = DRUID_ROUTE.shop.street;
  return `<button class="town-building town-event-bubble druid-bubble" data-druid-shop="1" style="left:${S.x}%;top:${S.y}%" aria-label="${S.place}／${S.who}"><b>${S.place}</b><span>${S.who}</span><span class="town-event-symbol">${obsBubbleHTML("main")}</span></button>`;
}
function bindDruidShop(){ document.querySelector("[data-druid-shop]")?.addEventListener("click", ()=>{ if(!druidShopDue()) return; state.page = "story"; state.scene = "druidShop"; state.line = 0; state.info = null; render(); window.scrollTo(0,0); }); }
const druidShopScript = () => druidLinesR(DRUID_ROUTE.shop.lines);
function finishDruidShop(){ if(druidShopDue()) state.main.gravePlate = true; state.page = "town"; state.townPlace = null; render(); window.scrollTo(0,0); }
const gravePlate = () => !!state.main?.gravePlate;
