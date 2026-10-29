/* 森林線收尾：德魯伊的抗議（大爺 10-29）：文字、數字在 data/druid-end.js
   state.main.druidEnd：(沒有) → report／atone；state.druidProtest＝{pick}（劇情進行中暫存）
   - 公會：森林回報完才出現紅 ❗ 和按鈕（town.js townShopEventHTML、townTalkTopics）
   - 劇情 druidProtest：揭穿（撿到花粉袋多兩句）→ 選 druidPick → finishDruidProtest 結算
   - 叫她自己收拾之後：進森林偶爾撿到藥水（druidForestGift，enterDungeon 呼叫） */
const druidEnd = () => (state.main ||= {}).druidEnd || null;
const druidDue = () => !!(state.townFounded && mainStage()==="done" && !druidEnd() && !druidRoute());   // 聽德魯伊的那條沒有抗議（10-29）
const ensureDruidProtest = () => (state.druidProtest ||= {});
const druidLines = list => list.map(l=>({draft:DRUID_END.draft, ...l}));
function startDruidProtest(){
  if(!druidDue()) return;
  state.druidProtest = {}; state.townTalk = null;
  state.page = "story"; state.scene = "druidProtest"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}
function druidScript(){
  const D = DRUID_END, pick = ensureDruidProtest().pick;
  const L = [...D.intro, ...(dungeonState("forest").clues.pouch==="ok" ? D.pouch : []), ...D.expose, {...D.ask, druidChoice:true}];
  if(pick==="report") L.push(...D.report.map(l=>({...l, text:l.text.replace("{gold}", D.reportGold)})));
  if(pick==="atone") L.push(...D.atone);
  return druidLines(L);
}
const druidChoicePending = line => !!(line && line.druidChoice && !ensureDruidProtest().pick);
function druidChoiceHTML(){
  const P = DRUID_END.pick;
  return `<div class="choice-list">${["report","atone"].map(k=>`<button class="choice" data-druid-pick="${k}"><b>${P[k].label}</b><small>${P[k].sub}</small></button>`).join("")}</div>`;
}
function druidPick(k){
  const e = ensureDruidProtest(); if(e.pick || state.page!=="story" || state.scene!=="druidProtest" || !["report","atone"].includes(k)) return;
  const from = SCENES.druidProtest.script.length;
  e.pick = k; sfx(k==="report" ? "alert" : "pop");
  state.line = Math.min(from, SCENES.druidProtest.script.length - 1); render();
}
function finishDruidProtest(){
  const e = ensureDruidProtest(); if(!e.pick || !druidDue()) return;
  state.main.druidEnd = e.pick;
  if(e.pick==="report") grantPartyGold(DRUID_END.reportGold);
  state.druidProtest = null; state.page = "town"; state.townPlace = "guild"; render(); window.scrollTo(0,0);
}
// 進森林（打完以後）：她偶爾留一瓶藥水
function druidForestGift(id){
  if(id!=="forest" || !(druidEnd()==="atone" || druidRoute()) || mainStage()!=="done" || Math.random() >= DRUID_END.giftChance) return;   // 聽德魯伊的：她也偶爾留（10-29）
  const b = B(), u = b && b.units.find(v=>isPcCritter(v) && !v.dead), it = ITEMS.find(i=>i.n===DRUID_END.giftItem); if(!u || !it) return;
  const got = makeItem(it, true, u.id);
  u.backpack.push(got); (state.inv[u.id] ||= []).push(got.id); syncBattleBag(u);
  say(u, DRUID_END.gift, 4200);
  setTimeout(()=>blog(DRUID_END.giftLog.replace("{who}", u.name).replace("{item}", it.n), "skill"), 4200);
}
