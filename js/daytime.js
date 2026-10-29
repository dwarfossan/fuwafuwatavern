/* 日夜循環（大爺 10-28／10-29）：資料、文字在 data/daytime.js
   - ensureTime／isNight：舊存檔沒有 state.time＝白天、格數 0
   - daytimeTick(why)：走完一趟路（map.js 到達、quests.js 走到 ❗）、打完委託或地城（finishQuest、retreatBattle）
   - daytimeDawn()：長休（flow.js 的長休，旅店、酒館、露營、地城都經過）
   - 晚上的效果：nightLighting(def)（startBattle 呼叫）、townClosed(id)、questNightOnly(tpl)、夜色 nightTintClass()
   - 圖示：timeBadgeHTML()／timePopHTML() 放進共用的右上角工具（js/ui/system-tools.js），大地圖、城鎮、劇情、戰鬥都有 */
const ensureTime = () => (state.time ||= {night:false, ticks:0});
const isNight = () => !!state.time?.night;
function daytimeTick(why){
  const t = ensureTime(); if(t.night) return;
  t.ticks = Math.min(DAYTIME.nightAfter, (t.ticks||0) + 1);
  if(t.ticks >= DAYTIME.nightAfter){ t.night = true; t.changedAt = Date.now(); }
}
function daytimeDawn(){ const t = ensureTime(); if(t.night) t.changedAt = Date.now(); t.night = false; t.ticks = 0; }
// 外面的戰場晚上變微光：只改明亮的（委託地圖、森林）；洞窟、墓地本來就有自己的亮度
function nightLighting(def){ if(def && def.quest && isNight() && (!def.lighting || def.lighting==="bright")){ def.lighting = "dim"; def.nightLit = true; } }
const townClosed = id => isNight() && DAYTIME.closedAtNight.includes(id);
const questNightOnly = tpl => !!tpl && Array.isArray(tpl.foes) && tpl.foes.some(f=>DAYTIME.nightFoes.includes(f));
const nightTintClass = () => isNight() ? " is-night" : "";

// ---------- 右上角的日夜圖示（SVG）----------
// 白天：太陽＋下面三顆小點（亮著的＝還剩幾格）；晚上：彎月＋星星。剛換的時候閃一下（fresh）
function timeIconSVG(){
  const t = ensureTime(), I = "#2a2630";
  if(t.night) return `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M20 5 A11 11 0 1 0 27 21 A9 9 0 0 1 20 5Z" fill="#f2d98a" stroke="${I}" stroke-width="2" stroke-linejoin="round"/><path d="M8 7 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1z" fill="#cfe0ff"/><circle cx="26" cy="9" r="1.4" fill="#cfe0ff"/></svg>`;
  const left = DAYTIME.nightAfter - (t.ticks||0);
  const dots = Array.from({length:DAYTIME.nightAfter}, (_,i)=>`<circle cx="${9+i*7}" cy="28.5" r="2.6" fill="${i<left?"#f7c94b":"#3a3228"}" stroke="${I}" stroke-width="1.2"/>`).join("");
  return `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><g stroke="#f2b441" stroke-width="2.6" stroke-linecap="round"><path d="M16 0.8v3M16 20.8v2.6M3.8 12H7M25 12h3.2M7.1 3.1l2.2 2.2M22.7 18.7l2.2 2.2M7.1 20.9l2.2-2.2M22.7 5.3l2.2-2.2"/></g><circle cx="16" cy="12" r="7.4" fill="#f7c94b" stroke="${I}" stroke-width="2"/>${dots}</svg>`;
}
const timeShown = () => !["cover","roll"].includes(state.page);
function timeBadgeHTML(pop){
  if(!timeShown()) return "";
  const t = ensureTime(), fresh = t.changedAt && Date.now() - t.changedAt < 4000;
  const label = t.night ? DAYTIME.ui.night : `${DAYTIME.ui.day}・${DAYTIME.ui.dayLeft.replace("{n}", DAYTIME.nightAfter - (t.ticks||0))}`;
  return `<button class="time-btn${t.night ? " night" : ""}${fresh ? " fresh" : ""}" data-system-time aria-label="${label}" title="${label}">${timeIconSVG()}</button>`
    + `<div class="time-pop" data-system-pop="time" ${pop==="time" ? "" : "hidden"}>${timePopHTML()}</div>`;
}
function timePopHTML(){
  const t = ensureTime(), U = DAYTIME.ui;
  return t.night ? `<h3>${U.night}</h3><p>${U.nightHint}</p>`
    : `<h3>${U.day}</h3><p>${U.dayLeft.replace("{n}", DAYTIME.nightAfter - (t.ticks||0))}</p><p class="dim">${U.dayHint}</p>`;
}
