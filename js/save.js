/* 存檔／讀檔（大爺 10-10）：1 格自動＋3 格手動，存在瀏覽器；可匯出／匯入成檔案。
   只在安全的地方存：城鎮、大地圖（沒在移動）、商店；劇情、探索、戰鬥中不能存。
   測試版（/dev/）和正式版各存各的（同一個網域，靠前綴分開）；音量、說明泡泡看過沒有是個人設定，維持共用。 */
const SAVE_VERSION = 1;
const SAVE_SLOTS = ["auto","1","2","3"];
const SAVE_NS = /\/dev\//.test(location.pathname) ? "dev:" : "";
const saveKey = slot => `${SAVE_NS}fuwa-save-${slot}`;
const MARKET_KEY = `${SAVE_NS}fuwa-market-v1`;
// 不存的：戰場、畫面上暫時開著的東西
const SAVE_SKIP = ["townTalk","battle","battleSnap","modal","info","sysPop","statusCardUI","levelUpAt","sel","restMessage","travel","questSel"];
// 新遊戲用：載入時的乾淨狀態
const STATE_PRISTINE = JSON.stringify(state);

function saveBlockReason(){
  if(state.page==="battle") return state.battle?.phase==="explore" ? "探索中不能存檔" : "戰鬥中不能存檔";
  if(state.page==="story") return "劇情進行中不能存檔";
  if(state.page==="cover"||state.page==="roll") return "還沒開始冒險";
  if(state.page==="map"&&state.travel) return "移動中不能存檔";
  if(!["town","map","shop"].includes(state.page)) return "這裡不能存檔";
  return "";
}
function savePlaceLabel(s){
  if(s.page==="town") return s.townPlace ? (TOWN_PLACES.find(p=>p.id===s.townPlace)?.name||"城鎮") : "城鎮";
  if(s.page==="map") return WORLD.locations.find(l=>l.id===s.location)?.name||"大地圖";
  if(s.page==="shop") return s.shopContext ? (TOWN_PLACES.find(p=>p.id===s.shopContext)?.name||"商店") : "大爺的裝備牆";
  return "";
}
function saveSnapshot(){
  const data={};
  for(const [k,v] of Object.entries(state)) if(!SAVE_SKIP.includes(k)) data[k]=v;
  return JSON.parse(JSON.stringify({v:SAVE_VERSION,at:Date.now(),
    meta:{place:savePlaceLabel(state),levels:CRITTERS.map(c=>state.level?.[c.id]||1),gold:CRITTERS.reduce((n,c)=>n+(state.gold?.[c.id]||0),0)},
    state:data}));
}
function readSave(slot){try{const raw=localStorage.getItem(saveKey(slot));return raw?JSON.parse(raw):null;}catch(e){return null;}}
function saveProblem(data){
  if(!data||typeof data!=="object"||!data.state||typeof data.state!=="object") return "不是存檔檔案";
  if(!Number.isInteger(data.v)||data.v>SAVE_VERSION) return "版本太新，讀不了";
  return "";
}
// 舊格式升級：之後改了存檔格式就在這裡補，現在只有第 1 版
function upgradeSave(data){return data;}
function writeSave(slot,data){try{localStorage.setItem(saveKey(slot),JSON.stringify(data));return true;}catch(e){return false;}}
function saveTo(slot){if(saveBlockReason())return false;return writeSave(slot,saveSnapshot());}
function autoSave(){if(!saveBlockReason())writeSave("auto",saveSnapshot());}
function latestSaveSlot(){let best=null;for(const s of SAVE_SLOTS){const d=readSave(s);if(d&&!saveProblem(d)&&(!best||d.at>best.at))best={slot:s,at:d.at};}return best?.slot||null;}
function resetGameState(){
  for(const k of Object.keys(state)) delete state[k];
  Object.assign(state,JSON.parse(STATE_PRISTINE));
}
function loadFrom(slot){
  const data=readSave(slot);if(saveProblem(data))return false;
  const s=upgradeSave(data).state;
  resetGameState();Object.assign(state,s);
  state.modal=null;state.sysPop=null;state.info=null;state.battle=null;state.battleSnap=null;state.travel=null;
  // 魔法商店帳本跟著存檔走：讀哪一份，商店就回到那時候
  try{state.market?localStorage.setItem(MARKET_KEY,JSON.stringify({...state.market,items:state.magicItems})):localStorage.removeItem(MARKET_KEY);}catch(e){}
  render.last=null;render();window.scrollTo(0,0);return true;
}
// 回到標題＝結束這局：冒險中先確認沒存的進度會不見
function goTitle(){
  if(!["cover","roll"].includes(state.page)&&!confirm("回到標題後，目前沒存的進度會不見。要回去嗎？"))return;
  newGameState();render.last=null;render();window.scrollTo(0,0);
}
// 快速測試入口（#battle／#town／#ambush）還在開機時不自動存
function quickEntryBooting(){return !!document.querySelector(".image-startup");}
function newGameState(){resetGameState();try{localStorage.removeItem(MARKET_KEY);}catch(e){}}

/* ---------- 畫面 ---------- */
const SAVE_SLOT_NAME = {auto:"自動存檔","1":"存檔 1","2":"存檔 2","3":"存檔 3"};
function saveTimeText(t){const d=new Date(t),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function saveSlotHTML(slot,mode,block){
  const d=readSave(slot),bad=d?saveProblem(d):"",manual=slot!=="auto";
  const info=!d?`<small class="save-empty">空</small>`:bad?`<small class="save-bad">${bad}</small>`
    :`<small>${saveTimeText(d.at)} · ${d.meta?.place||""}</small><small>Lv ${(d.meta?.levels||[]).join("／")} · ${Math.floor((d.meta?.gold||0)/GP)} gp</small>`;
  const act=mode==="save"
    ? (manual?`<button class="btn small" data-save-to="${slot}" ${block?"disabled":""}>存檔</button>`:"")
    : `<button class="btn small" data-load-from="${slot}" ${!d||bad?"disabled":""}>讀取</button>`;
  const io=`${d&&!bad?`<button class="btn small ghost" data-save-export="${slot}">匯出</button>`:""}${manual?`<label class="btn small ghost save-import">匯入<input type="file" accept=".json,application/json" data-save-import="${slot}" hidden></label>`:""}`;
  return `<div class="save-slot"><div class="save-info"><b>${SAVE_SLOT_NAME[slot]}</b>${info}</div><div class="save-acts">${act}${io}</div></div>`;
}
function saveModalHTML(m){
  const block=m.mode==="save"?saveBlockReason():"";
  const slots=m.mode==="save"?SAVE_SLOTS:SAVE_SLOTS;
  return `<div class="save-panel"><h3 class="page-bubble-title">${m.mode==="save"?"存檔":"讀檔"}</h3>${block?`<p class="save-block" role="status">${block}</p>`:""}${slots.map(s=>saveSlotHTML(s,m.mode,block)).join("")}${m.msg?`<p class="save-msg" role="status">${m.msg}</p>`:""}</div>`;
}
function openSaveMenu(mode){state.modal={kind:"save",mode};refreshGameUI();}
function saveModalRefresh(msg){if(state.modal?.kind==="save"){state.modal.msg=msg||"";refreshGameUI();}}
function exportSave(slot){
  const d=readSave(slot);if(!d)return;
  const blob=new Blob([JSON.stringify(d)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`fuwafuwa-${slot}-${saveTimeText(d.at).replace(/[ :]/g,"-")}.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function importSave(slot,file){
  if(!file)return;
  file.text().then(text=>{
    let d=null;try{d=JSON.parse(text);}catch(e){}
    const bad=saveProblem(d);if(bad){saveModalRefresh(`匯入失敗：${bad}`);return;}
    if(readSave(slot)&&!confirm(`要蓋掉「${SAVE_SLOT_NAME[slot]}」嗎？`))return;
    saveModalRefresh(writeSave(slot,upgradeSave(d))?`已匯入到「${SAVE_SLOT_NAME[slot]}」`:"匯入失敗：瀏覽器存不下");
  });
}
function bindSaveModal(){
  document.querySelectorAll("[data-save-to]").forEach(el=>modalListen(el,"click",e=>{
    e.stopPropagation();const slot=el.dataset.saveTo;
    if(readSave(slot)&&!confirm(`要蓋掉「${SAVE_SLOT_NAME[slot]}」嗎？`))return;
    saveModalRefresh(saveTo(slot)?`已存到「${SAVE_SLOT_NAME[slot]}」`:"存檔失敗");
  }));
  document.querySelectorAll("[data-load-from]").forEach(el=>modalListen(el,"click",e=>{
    e.stopPropagation();const slot=el.dataset.loadFrom;
    if(!["cover","roll"].includes(state.page)&&!confirm("讀檔後，目前沒存的進度會不見。要讀嗎？"))return;
    if(!loadFrom(slot))saveModalRefresh("讀檔失敗");
  }));
  document.querySelectorAll("[data-save-export]").forEach(el=>modalListen(el,"click",e=>{e.stopPropagation();exportSave(el.dataset.saveExport);}));
  document.querySelectorAll("[data-save-import]").forEach(el=>modalListen(el,"change",e=>{e.stopPropagation();importSave(el.dataset.saveImport,el.files?.[0]);el.value="";}));
  document.querySelectorAll(".save-import").forEach(el=>modalListen(el,"click",e=>e.stopPropagation()));
}
