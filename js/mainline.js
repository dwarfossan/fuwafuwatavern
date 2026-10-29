/* 主線（大爺 10-22）：紅色 ❗＝主線、黃色 ❗＝支線（docs/主線.md）
   森林主線 state.main.forest：(沒有) → investigate → met → boss → report → done；聽德魯伊的（10-29）：met → chief → report → done（js/druid-route.js）
     (沒有)：公會艾妲有紅 ❗（進城、住過第一晚以後）；對話「哥布林的消息」→ investigate
     investigate：大地圖森林紅 ❗；第一次進森林（霧擋著溪），打完 → 劇情「遇到德魯伊」→ met
     met：第二次進森林（霧散了），深處食人花；調查兩處花粉線索、或走到巢穴附近 → 劇情「撞見」→ boss，直接開打
     boss：打倒奇美拉 → 劇情 → report（公會紅 ❗）→ 對話「回報」→ done（之後森林只有野獸）
   資料、台詞：data/forest.js 的 FOREST.stages、FOREST.main */
const mainStage = () => (state.main ||= {}).forest || null;
const setMainStage = s => { (state.main ||= {}).forest = s; };
FOREST.stageOf = () => { const s = mainStage(); return druidRouteQuiet() ? "quiet" : ["investigate","met","boss"].includes(s) ? s : null; };   // 聽德魯伊的：森林一直安靜（10-29）
// 還沒接到主線：森林先不開（大地圖點了只顯示一句）
const forestLocked = () => !mainStage();
// 公會那邊要不要紅 ❗
const guildMainTalk = () => { const s = mainStage(); return !s && state.townFounded && state.innNightDone ? "start" : s==="report" ? "report" : null; };
function mainTalkLines(kind){ return kind==="report" ? (druidRoute() ? DRUID_ROUTE.report : FOREST.main.report) : [...FOREST.main.guild, ...CAVE.main.lead, ...GRAVE.lead, ...GOBLIN_HUNT.guildAdd]; }   // 三條線索一起講：森林、洞窟、驅除哥布林（10-28）
function mainTalkDone(kind){ if(kind==="start" && !mainStage()){ setMainStage("investigate"); if(!caveStage()) setCaveStage(dungeonState("cave").cleared ? "report" : "investigate"); graveLeadDone(); } if(kind==="report" && mainStage()==="report") setMainStage("done"); }
// 大地圖：主線的地點上掛紅 ❗（點了就跟點地點一樣）
function mainPinsSVG(){
  if(typeof state==="undefined") return "";
  const pin = (id, name) => { const l = WORLD.locations.find(x=>x.id===id);
    return `<g class="quest-pin main-pin" data-loc="${id}" transform="translate(${l.x} ${l.y-120})" role="button" aria-label="主線：${name}">${pinBubbleSVG("main")}<circle r="30" cy="-36" fill="transparent"/></g>`; };
  return (["investigate","met"].includes(mainStage()) ? pin("forest","森林") : "") + (caveStage()==="investigate" ? pin("cave","洞窟") : "") + (["haunt","ancestor","fight_dk","fight_guards"].includes(graveStage()) ? pin("graveyard","墓地") : "");
}
// 洞窟主線（10-28）state.main.cave：(沒有) → investigate（大地圖洞窟紅 ❗）→ 打倒紅龍幼龍 → report（公會紅 ❗「回報洞窟的事」）→ done
//   洞窟本身照舊一開始就進得去；還沒聽艾妲講就先打完的，聽完直接是 report
const caveStage = () => (state.main ||= {}).cave || null;
const setCaveStage = s => { (state.main ||= {}).cave = s; };
const caveReportDue = () => caveStage()==="report";
function caveMainCleared(){ if(caveStage()==="investigate") setCaveStage("report"); }
function caveReportDone(){ if(caveStage()==="report") setCaveStage("done"); }
// 打完（forestWin 呼叫）：照階段往下走、接劇情
FOREST.onWin = b => {
  const s = mainStage();
  if(s==="investigate"){ setMainStage("met"); state.afterQuestScene = "forestDruidMeet"; return true; }
  if(druidRouteQuiet()) return true;   // 安靜的森林：沒有劇情（10-29）
  if(s==="boss"){ setMainStage("report"); dungeonState("forest").cleared = true; state.afterQuestScene = "forestAfter"; blog(FOREST.cleared, "kill"); return true; }
  return false;
};
// 第二次：調查花粉線索到兩處，或走到巢穴附近 → 撞見
const FOREST_REVEAL_CLUES = ["claws","pouch","pollen"];
FOREST.onClue = b => { if(mainStage()!=="met" || b.forestRevealed) return; const n = FOREST_REVEAL_CLUES.filter(k=>dungeonState("forest").clues[k]).length; if(n >= FOREST.stages.met.revealAt) later(forestReveal, 1200); };
function dungeonOnMove(){
  const b = B(); if(!b || b.def.dungeon!=="forest" || mainStage()!=="met" || b.forestRevealed || b.phase!=="explore") return;
  const u = exploreUnit(), A = FOREST.stages.met.revealArea; if(u && u.x<=A.x1 && u.y<=A.y1) later(forestReveal, 300);
}
function forestReveal(){
  const b = B(); if(!b || b.def.dungeon!=="forest" || b.forestRevealed || mainStage()!=="met" || b.phase!=="explore") return;
  b.forestRevealed = true; syncLearnedState(); stashSteed(b); wakeAfterBattle();
  setMainStage("boss");
  state.battle = null; state.scout = null; state.page = "story"; state.scene = "forestReveal"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}
function startForestBoss(){ enterDungeon("forest"); }
function finishForestScene(){ state.page = "map"; state.mapSel = state.location = "forest"; render(); window.scrollTo(0,0); }
