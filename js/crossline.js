/* 三線交會的小鉤子（大爺 10-28）：文字、數字在 data/crossline.js
   state.met＝{deathKnight, demon}：打退過死亡騎士／惡魔（dkRepel、chickenRepel 記）
   state.crossline＝{preached, omenSeen}
   - townTalkData：公會艾妲的「這個城鎮／閒聊」，森林主線打完換一套
   - questTplWeight：每日委託抽樣的權重，森林＋驅除哥布林都打完後有哥布林的減半（js/quests.js ensureQuests）
   - preachStreetHTML／startPreach／finishPreach：洞窟打完，城鎮街角的狗頭人傳教（黃 ❗、劇情 koboldPreach、默默拿到龍神傳單）
   - crosslineTravelChat：死亡騎士、惡魔都打退過，大地圖走路閒聊一次伏筆 */
const ensureCross = () => (state.crossline ||= {});
const metDeathKnight = () => !!(state.met?.deathKnight || state.deathKnight?.demanded);
const metDemon = () => !!(state.met?.demon || ["report","done"].includes(state.chicken?.stage));
function markMet(key){ (state.met ||= {})[key] = true; }

// ---------- 森林打完：艾妲換台詞 ----------
function townTalkData(place){
  const T = TOWN_TALK[place];
  return place==="guild" && mainStage()==="done" ? {...T, ...(druidRoute() ? DRUID_ROUTE.guildAfter : CROSSLINE.guildAfterForest)} : T;   // 聽德魯伊的另一套（10-29）
}

// ---------- 森林＋驅除哥布林都打完：哥布林委託減半 ----------
const goblinQuieted = () => mainStage()==="done" && state.goblinHunt?.stage==="done";
const questTplWeight = t => !t.foes.some(f=>String(f).startsWith("goblin")) ? 1 : goblinGone() ? 0 : goblinQuieted() ? CROSSLINE.goblinQuestWeight : 1;   // 聽德魯伊的打倒酋長：哥布林委託不再出現（10-29）

// ---------- 洞窟打完：狗頭人傳教 ----------
const preachDue = () => !!(state.townFounded && dungeonState("cave").cleared && !ensureCross().preached);
function preachStreetHTML(){
  if(!preachDue()) return "";
  const S = CROSSLINE.preach.street;
  return `<button class="town-building town-event-bubble preach-bubble" data-preach="1" style="left:${S.x}%;top:${S.y}%" aria-label="${S.place}／${S.who}"><b>${S.place}</b><span>${S.who}</span><span class="town-event-symbol">${obsBubbleHTML("side")}</span></button>`;
}
function bindPreach(){ document.querySelector("[data-preach]")?.addEventListener("click", startPreach); }
function startPreach(){ if(!preachDue()) return; state.page = "story"; state.scene = "koboldPreach"; state.line = 0; state.info = null; render(); window.scrollTo(0,0); }
const preachScript = () => CROSSLINE.preach.lines.map(l=>({draft:CROSSLINE.draft, ...l}));
function finishPreach(){
  const C = ensureCross();
  if(!C.preached){
    C.preached = true;
    const it = ITEMS.find(i=>i.n===CROSSLINE.preach.item); if(it) (state.inv.raccoon ||= []).push(makeItem(it, true, "raccoon").id);
  }
  state.page = "town"; state.townPlace = null; render(); window.scrollTo(0,0);
}

// ---------- 死亡騎士＋惡魔：走路閒聊的伏筆 ----------
function crosslineTravelChat(){
  const C = ensureCross();
  if(C.omenSeen || !metDeathKnight() || !metDemon()) return null;
  C.omenSeen = true;
  return {lines:CROSSLINE.omen.lines.map(l=>({draft:CROSSLINE.draft, ...l}))};
}
