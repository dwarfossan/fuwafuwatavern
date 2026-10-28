/* 墓地線（大爺 10-28）：資料、台詞在 data/graveyard.js（GRAVE，DUNGEONS.graveyard）
   state.main.grave：(沒有) → rumor → haunt → noble → ancestor（第二批接著做：最老的墳、談判、選邊）
     rumor：艾妲的「最近的怪事」講到鬧鬼（舊存檔：公會另外掛「❗ 墓地鬧鬼」）；街上三個居民掛紅 ❗，三個都問完 → haunt
     haunt：大地圖墓地紅 ❗；手工地城（js/dungeon.js），最深處是女吸血鬼 → 打贏演 graveVampire → noble
     noble：街口的貴族馬車紅 ❗ → 劇情 graveNoble（她不理人）→ ancestor
   state.main.graveAsked＝{elder, baker, youth}
   - 女吸血鬼（vampire，跟每日委託「夜裡的貴婦」同一隻）：打到 0 血不會死，化成蝙蝠飛走（graveVampireRepel，engine.js hurt 呼叫）
   - 墓地出身的仇人：記仇紀錄多 grave:true，碰面喊 GRAVE.grudgeShout（js/grudge.js） */
const graveStage = () => (state.main ||= {}).grave || null;
const setGraveStage = s => { (state.main ||= {}).grave = s; };
const graveAsked = () => ((state.main ||= {}).graveAsked ||= {});
const graveLocked = () => !graveStage() || graveStage()==="rumor";
const graveLockedText = () => graveStage()==="rumor" ? GRAVE.locked.rumor : GRAVE.locked.none;
GRAVE.stageOf = () => graveStage()==="haunt" ? "haunt" : null;
GRAVE.onWin = b => {
  if(graveStage()==="haunt"){ setGraveStage("noble"); dungeonState("graveyard").cleared = true; state.afterQuestScene = "graveVampire"; blog(GRAVE.cleared, "kill"); return true; }
  return false;
};

// ---------- 公會：鬧鬼的線索 ----------
// 舊存檔（已經聽過「最近的怪事」）：公會另外掛紅 ❗「墓地鬧鬼」
const graveGuildDue = () => !!(state.townFounded && state.innNightDone && mainStage() && !graveStage());
function graveLeadDone(){ if(!graveStage()) setGraveStage("rumor"); }

// ---------- 街上：三個居民、貴族馬車（主線，紅 ❗） ----------
const graveStreetBubble = (attr, S, label) => `<button class="town-building town-event-bubble grave-bubble" ${attr} style="left:${S.x}%;top:${S.y}%" aria-label="${S.place}／${label}"><b>${S.place}</b><span>${label}</span><span class="town-event-symbol">${obsBubbleHTML("main")}</span></button>`;
function graveStreetHTML(){
  if(graveStage()==="rumor") return Object.entries(GRAVE.residents).filter(([k])=>!graveAsked()[k]).map(([k,r])=>graveStreetBubble(`data-grave-ask="${k}"`, r, r.name)).join("");
  if(graveStage()==="noble") return graveStreetBubble(`data-grave-noble="1"`, GRAVE.carriage, GRAVE.carriage.who);
  return "";
}
function bindGraveStreet(){
  document.querySelectorAll("[data-grave-ask]").forEach(el=>el.addEventListener("click", ()=>graveGo("graveAsk", el.dataset.graveAsk)));
  document.querySelector("[data-grave-noble]")?.addEventListener("click", ()=>graveGo("graveNoble"));
}
function graveGo(scene, who){
  if(scene==="graveAsk" && (graveStage()!=="rumor" || !GRAVE.residents[who])) return;
  if(scene==="graveNoble" && graveStage()!=="noble") return;
  state.graveAsk = who || null; state.page = "story"; state.scene = scene; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}
const graveLines = list => list.map(l=>({draft:GRAVE.draft, ...l}));
const graveAskActors = () => [GRAVE.residents[state.graveAsk]?.portrait || "townsfolk_male_03_grey_beard"];
function graveAskScript(){
  const k = state.graveAsk, r = GRAVE.residents[k]; if(!r) return graveLines(GRAVE.allAsked);
  const last = Object.keys(GRAVE.residents).every(x=>x===k || graveAsked()[x]);   // 問完這個就三個都問過了
  return graveLines([...r.lines.map(l=>({on:r.portrait, ...l})), ...(last ? GRAVE.allAsked.map(l=>({on:"-", ...l})) : [])]);
}
function finishGraveAsk(){
  const k = state.graveAsk;
  if(k && graveStage()==="rumor"){ graveAsked()[k] = true; if(Object.keys(GRAVE.residents).every(x=>graveAsked()[x])) setGraveStage("haunt"); }
  state.graveAsk = null; state.page = "town"; state.townPlace = null; render(); window.scrollTo(0,0);
}
const graveNobleScript = () => graveLines(GRAVE.nobleTalk);
function finishGraveNoble(){
  if(graveStage()==="noble") setGraveStage("ancestor");
  state.page = "town"; state.townPlace = null; render(); window.scrollTo(0,0);
}
const graveVampireScript = () => graveLines(GRAVE.vampireTalk);
function finishGraveVampire(){ state.page = "map"; state.mapSel = state.location = "graveyard"; render(); window.scrollTo(0,0); }

// ---------- 女吸血鬼：不會死，化成蝙蝠 ----------
function graveVampireRepel(t, at){
  t.dead = true; t.repelled = true; t.deadAt = impactAt();
  blog(GRAVE.repelLog.replace("{name}", t.name), "kill"); sfx("poof", at + 300); fxHit(t, "spark");
  say(t, GRAVE.repelSay, 200);
}
