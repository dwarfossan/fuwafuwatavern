/* 共用系統工具：音量＋主選單。畫面只提供 context/state 與各動作 callback。 */
const SYSTEM_TOOLS_GEAR_SVG='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06-.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.4.3.7.6 1 .3.3.7.4 1.1.4h.1v4h-.1c-.4 0-.8.1-1.1.4-.3.3-.5.6-.6 1.2Z"/></svg>';
const systemToolsSpeakerSVG=()=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${SFX.isMuted()?'<path d="M17 9l5 6M22 9l-5 6"/>':'<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'}</svg>`;
// 音量顯示唯一入口：靜音寫「靜音」，滑桿留在原本音量（解除靜音就回到這裡）
function systemVolumeText(){return SFX.isMuted()?"靜音":`${Math.round(SFX.getVolume()*100)}%`;}
// 喇叭圖示、框裡的小喇叭、滑桿、數字一起更新（10-10：以前拖滑桿只改數字，喇叭圖示停在舊狀態）
function syncSystemVolume(root=document){
 root.querySelectorAll("[data-system-tools]").forEach(t=>{
  const head=t.querySelector("[data-system-volume]");if(head){head.classList.toggle("off",SFX.isMuted());head.innerHTML=systemToolsSpeakerSVG();}
  t.querySelector("[data-system-mute]")?.classList.toggle("off",SFX.isMuted());
  const s=t.querySelector("[data-system-slider]");if(s&&document.activeElement!==s)s.value=Math.round(SFX.getVolume()*100);
  const n=t.querySelector("[data-system-number]");if(n)n.textContent=systemVolumeText();
 });
}
const SYSTEM_MENU_LABEL={continue:"繼續遊戲",party:"隊伍",save:"存檔",load:"讀檔",about:"關於／授權",title:"回到標題"};
function renderSystemTools({context="default",pop=null,items=["continue","party","save","load","about","title"]}={}){
 return `<div class="sys-tools sys-tools--${context}" data-system-tools><button class="snd ${SFX.isMuted()?"off":""}" data-system-volume aria-label="主音量" title="主音量">${systemToolsSpeakerSVG()}</button><button class="gear-btn" data-system-menu aria-label="主選單" title="主選單">${SYSTEM_TOOLS_GEAR_SVG}</button><div class="vol-pop" data-system-pop="volume" ${pop==="volume"?"":"hidden"}><button class="snd ${SFX.isMuted()?"off":""}" data-system-mute aria-label="靜音切換"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/></svg></button><input data-system-slider type="range" min="0" max="100" value="${Math.round(SFX.getVolume()*100)}" aria-label="主音量"><span class="vol-num" data-system-number>${systemVolumeText()}</span></div><div class="sys-menu" data-system-pop="menu" ${pop==="menu"?"":"hidden"}><h3>主選單</h3>${items.map(k=>`<button data-system-action="${k}">${SYSTEM_MENU_LABEL[k]}</button>`).join("")}</div></div>`;
}
// 音量框、主選單一直在畫面上，開關只切 hidden（10-10：以前開關都整頁重畫，劇情／城鎮會閃）
function showSystemPop(root,pop){root.querySelectorAll("[data-system-pop]").forEach(el=>{el.hidden=el.dataset.systemPop!==pop;});}
function bindSystemTools(root,{getPop,setPop,refresh,party,about,title,listen=(el,ev,fn)=>el.addEventListener(ev,fn)}){
 const q=s=>root.querySelector(s),on=(s,ev,fn)=>{const el=q(s);if(el)listen(el,ev,fn);};
 const toggle=p=>{const next=getPop()===p?null:p;setPop(next);showSystemPop(root,next);if(next==="volume")syncSystemVolume(root);};
 on("[data-system-volume]","click",e=>{e.stopPropagation();toggle("volume");});
 on("[data-system-menu]","click",e=>{e.stopPropagation();toggle("menu");});
 on("[data-system-mute]","click",e=>{e.stopPropagation();SFX.toggleMuted();if(!SFX.isMuted())sfx("pop");syncSystemVolume(root);});
 on("[data-system-slider]","input",e=>{e.stopPropagation();SFX.setVolume(+e.target.value/100);syncSystemVolume(root);});
 root.querySelectorAll("[data-system-action]").forEach(el=>listen(el,"click",e=>{e.stopPropagation();const a=el.dataset.systemAction;setPop(null);showSystemPop(root,null);if(a==="continue")return;else if(a==="save"||a==="load")openSaveMenu(a);else if(a==="party")party();else if(a==="about")about();else if(a==="title")title();}));
}

// 戰場以外每一頁右上角的同一組工具（10-10 大爺：每頁都要有）；extra 放在左邊（例如「說明」）。
// 選單只列這一頁用得到的：首頁只有讀檔、關於，擲屬性還沒有隊伍可看。
function pageToolsHTML(extra=""){
 const items=state.page==="cover"?["load","about"]:state.page==="roll"?["load","about","title"]:undefined;
 return `<div class="page-tools">${extra}${renderSystemTools({context:"page",pop:state.sysPop,items})}</div>`;
}
