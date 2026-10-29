/* 墓地線（大爺 10-28）：資料、台詞在 data/graveyard.js（GRAVE，DUNGEONS.graveyard）
   state.main.grave：(沒有) → rumor → haunt → noble → ancestor（第二批接著做：最老的墳、談判、選邊）
     rumor：艾妲的「最近的怪事」講到鬧鬼（舊存檔：公會另外掛「❗ 墓地鬧鬼」）；街上三個居民掛紅 ❗，三個都問完 → haunt
     haunt：大地圖墓地紅 ❗；手工地城（js/dungeon.js），最深處是女吸血鬼 → 打贏演 graveVampire → noble
     noble：街口的貴族馬車紅 ❗ → 劇情 graveNoble（她不理人）→ ancestor
     ancestor：大地圖墓地紅 ❗；調查最老的墳（過不過都算）→ 劇情 graveAncestor：死亡騎士現身、女貴族帶護衛來 → 選邊
       幫女貴族 → fight_dk（死亡騎士＋女吸血鬼）→ 打贏 resort：給錢＋禮儀長劍，墓地在大地圖換成度假村、進不去
       跟騎士站一邊 → fight_guards（護衛隊）→ 打贏 protected：祖先的長劍＋骨骨（已經有的：託付、最大生命 +10）
       拿出項圈（森林的項圈調查成功才有）→ 不用打，直接 protected，獎勵同騎士那邊
     protected：點墓地＝去找女吸血鬼喝茶（劇情 graveVisit），每日委託不再出現她；resort：每日委託照樣有她，開戰多嗆一句
   state.main.graveAsked＝{elder, baker, youth}；state.main.graveDeal＝{pick, end}
   - 女吸血鬼（vampire，跟每日委託「夜裡的貴婦」同一隻）：打到 0 血不會死，化成蝙蝠飛走（graveVampireRepel，engine.js hurt 呼叫）
   - 墓地出身的仇人：記仇紀錄多 grave:true，碰面喊 GRAVE.grudgeShout（js/grudge.js） */
const graveStage = () => (state.main ||= {}).grave || null;
const setGraveStage = s => { (state.main ||= {}).grave = s; };
const graveAsked = () => ((state.main ||= {}).graveAsked ||= {});
const graveDeal = () => ((state.main ||= {}).graveDeal ||= {});
const graveLocked = () => !graveStage() || ["rumor","resort"].includes(graveStage());
const graveLockedText = () => graveStage()==="rumor" ? GRAVE.locked.rumor : graveStage()==="resort" ? GRAVE.resort.locked : GRAVE.locked.none;
const GRAVE_STAGE_KEY = {haunt:"haunt", ancestor:"ancestor", fight_dk:"knight", fight_guards:"guards"};
GRAVE.stageOf = () => GRAVE_STAGE_KEY[graveStage()] || null;
GRAVE.onWin = b => {
  const s = graveStage();
  if(s==="haunt"){ setGraveStage("noble"); dungeonState("graveyard").cleared = true; state.afterQuestScene = "graveVampire"; blog(GRAVE.cleared, "kill"); return true; }
  if(s==="fight_dk"){ setGraveStage("resort"); graveDeal().end = "noble"; graveRewardNoble(); state.afterQuestScene = "graveEnd"; return true; }
  if(s==="fight_guards"){ setGraveStage("protected"); graveDeal().end = "knight"; graveRewardKnight(); state.afterQuestScene = "graveEnd"; return true; }
  return false;
};
// 最老的墳：調查過（不管過沒過）就撞見死亡騎士
GRAVE.onClue = b => { if(graveStage()==="ancestor" && dungeonState("graveyard").clues.oldest && !b.graveRevealed) later(graveReveal, 1200); };
function graveReveal(){
  const b = B(); if(!b || b.def.dungeon!=="graveyard" || b.graveRevealed || graveStage()!=="ancestor") return;
  b.graveRevealed = true; syncLearnedState(); stashSteed(b); wakeAfterBattle();
  graveDeal().pick = null;
  state.battle = null; state.scout = null; state.page = "story"; state.scene = "graveAncestor"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}

// ---------- 公會：鬧鬼的線索 ----------
// 舊存檔（已經聽過「最近的怪事」）：公會另外掛紅 ❗「墓地鬧鬼」
const graveGuildDue = () => !!(state.townFounded && state.innNightDone && mainStage() && !graveStage());
function graveLeadDone(){ if(!graveStage()) setGraveStage("rumor"); }

// ---------- 街上：三個居民、貴族馬車（主線，紅 ❗） ----------
const graveStreetBubble = (attr, S, label) => `<button class="town-building town-event-bubble grave-bubble" ${attr} style="left:${S.x}%;top:${S.y}%" aria-label="${S.place}／${label}"><b>${S.place}</b><span>${label}</span><span class="town-event-symbol">${obsBubbleHTML("main")}</span></button>`;
function graveStreetHTML(){
  if(graveStage()==="rumor") return Object.entries(GRAVE.residents).filter(([k])=>!graveAsked()[k]).map(([k,r])=>graveStreetBubble(`data-grave-ask="${k}"`, r, r.name)).join("");
  if(graveStage()==="noble") return graveStreetBubble(`data-grave-noble="1"`, GRAVE.carriage, GRAVE.carriage.who) + druidShopHTML();
  return druidShopHTML();   // 聽德魯伊的：市場遇到買東西的德魯伊（10-29）
}
function bindGraveStreet(){
  document.querySelectorAll("[data-grave-ask]").forEach(el=>el.addEventListener("click", ()=>graveGo("graveAsk", el.dataset.graveAsk)));
  document.querySelector("[data-grave-noble]")?.addEventListener("click", ()=>graveGo("graveNoble"));
  bindDruidShop();
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

// ---------- 談判、選邊 ----------
const graveHasRealCollar = () => dungeonState("forest").clues.collar==="ok";
const graveHasCollar = () => graveHasRealCollar() || gravePlate();   // 聽德魯伊的：沒有項圈，但德魯伊給了名牌（10-29）   // 森林巢穴的項圈調查成功＝手上有項圈
const graveChoicePending = line => !!(line && line.graveChoice && !graveDeal().pick);
function graveChoiceHTML(){
  const P = {...GRAVE.pick, ...(graveHasRealCollar() ? {} : {collar:DRUID_ROUTE.pickPlate})}, keys = ["noble","knight", ...(graveHasCollar() ? ["collar"] : [])];
  return `<div class="choice-list">${keys.map(k=>`<button class="choice" data-grave-pick="${k}"><b>${P[k].label}</b><small>${P[k].sub}</small></button>`).join("")}</div>`;
}
function graveAncestorScript(){
  const pick = graveDeal().pick;
  const plate = !graveHasRealCollar() && gravePlate();
  const L = [...GRAVE.ancestorTalk, ...(graveHasRealCollar() ? GRAVE.ancestorCollar : plate ? DRUID_ROUTE.ancestorPlate : []), ...GRAVE.ancestorTalk2];
  if(pick) L.push(...(pick==="collar" && plate ? DRUID_ROUTE.pickedPlate : GRAVE.picked[pick]));
  if(pick==="collar") L.push(...GRAVE.endCollar, ...graveGiftLines(), ...GRAVE.endVampire);
  return graveLines(L);
}
const graveAncestorNext = () => { const p = graveDeal().pick; return p==="collar" ? ["finishGraveCollar", GRAVE.collarNext] : ["startGraveFight", GRAVE.fightNext]; };
function gravePick(k){
  if(state.page!=="story" || state.scene!=="graveAncestor" || graveDeal().pick || graveStage()!=="ancestor") return;
  if(!["noble","knight"].includes(k) && !(k==="collar" && graveHasCollar())) return;
  const from = SCENES.graveAncestor.script.length;
  graveDeal().pick = k;
  if(k==="noble") setGraveStage("fight_dk");
  if(k==="knight") setGraveStage("fight_guards");
  sfx(k==="collar" ? "pop" : "alert");
  state.line = Math.min(from, SCENES.graveAncestor.script.length - 1); render();
}
function startGraveFight(){ if(["fight_dk","fight_guards"].includes(graveStage())) enterDungeon("graveyard"); }
function finishGraveCollar(){
  if(graveDeal().pick==="collar" && graveStage()==="ancestor"){ setGraveStage("protected"); graveDeal().end = "collar"; graveRewardKnight(); }
  finishGraveVampire();
}
// ---------- 獎勵 ----------
function graveGive(item){ const it = makeMagicItem(item, `grave-${item.key}-${Date.now()}`); (state.inv[GRAVE.rewardTo] ||= []).push(it.id); saveMarket(); return it; }
function graveRewardNoble(){ if(graveDeal().paid) return; graveDeal().paid = true; grantPartyGold(GRAVE.noble.gold); graveGive(GRAVE.noble.item); }
function graveRewardKnight(){
  if(graveDeal().paid) return; graveDeal().paid = true;
  graveGive(GRAVE.knight.item);
  if(partyHasReins()){ state.steed ||= {type:"dk_horse", name:null, hp:ENEMIES.dk_horse.hp, bones:false}; state.steed.bonusHp = GRAVE.knight.steedBonusHp; state.steed.hp += GRAVE.knight.steedBonusHp; graveDeal().horse = "kept"; }
  else { const r = ITEMS.find(i=>i.summon==="dk_horse"); if(r) (state.inv[GRAVE.rewardTo] ||= []).push(r.id); graveDeal().horse = "new"; }
  (state.deathKnight ||= {}).demanded = true; state.deathKnight.entrusted = true;   // 正式託付：以後不會再來討馬
}
// 送劍、送馬那幾句：還沒給獎勵時照「現在手上有沒有骨骨」挑，給過了照當時的結果
const graveGiftLines = () => [...GRAVE.endGifts, ...((graveDeal().horse || (partyHasReins() ? "kept" : "new"))==="kept" ? GRAVE.giftHorseKept : GRAVE.giftHorseNew)];
function graveEndScript(){
  const e = graveDeal().end;
  return graveLines(e==="noble" ? GRAVE.endNoble : [...GRAVE.endKnight, ...graveGiftLines(), ...GRAVE.endVampire]);
}
const graveEndActors = () => graveDeal().end==="noble" ? ["noblewoman"] : ["dk_helmet","vampire"];
// ---------- 結局之後 ----------
// 跟騎士站一邊（含項圈）：點墓地＝去找女吸血鬼喝茶
const graveVisitScript = () => graveLines(GRAVE.visit[(state.main.graveVisits = ((state.main.graveVisits||0) + 1)) % GRAVE.visit.length]);
// 大地圖：幫女貴族＝墓地換成度假村
const graveMapArt = id => id==="graveyard" && graveStage()==="resort" ? GRAVE.resort.art : null;
const graveMapName = (id, name) => id==="graveyard" && graveStage()==="resort" ? GRAVE.resort.name : name;
const graveMapDesc = (id, desc) => id==="graveyard" && graveStage()==="resort" ? GRAVE.resort.desc : desc;
// 每日委託「夜裡的貴婦」：抗議結束＝不再出現；度假村蓋了＝更生氣，開戰多嗆一句
const graveQuestWeight = t => t.grave ? (graveStage()===t.grave ? 1 : 0) : t.id==="night_lady" && graveStage()==="protected" ? 0 : 1;   // 結局之後的委託：盤查哨、度假村的客訴（10-29）
function graveQuestShout(){
  const b = B(); if(!b || b.graveShout || graveStage()!=="resort") return;
  const q = b.def.quest && questById(b.def.quest), v = q && q.tpl==="night_lady" && b.units.find(u=>u.type==="vampire" && u.combatActive && !u.dead);
  if(v){ b.graveShout = true; say(v, GRAVE.resortShout, 300); }
}
// 結局之後的委託：開戰時帶頭的喊一句（10-29）
function graveAfterQuestShout(){
  const b = B(); if(!b || b.graveAfterShout) return;
  const q = b.def.quest && questById(b.def.quest), S = q && GRAVE.afterQuestShout[q.tpl], u = S && b.units.find(x=>x.type===S.type && x.combatActive && !x.dead);
  if(u){ b.graveAfterShout = true; say(u, S.text, 300); }
}

// ---------- 女吸血鬼：不會死，化成蝙蝠 ----------
function graveVampireRepel(t, at){
  t.dead = true; t.repelled = true; t.deadAt = impactAt();
  blog(GRAVE.repelLog.replace("{name}", t.name), "kill"); sfx("poof", at + 300); fxHit(t, "spark");
  say(t, GRAVE.repelSay, 200);
}
