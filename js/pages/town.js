/* 城鎮為圖形點擊場景；不使用格子地圖或戰場渲染。代表物外觀 GPT 暫定。 */
const townPlace = ()=>TOWN_PLACES.find(p=>p.id===state.townPlace);
function townSymbolSVG(symbol){
 const shapes={
 bed:'<path d="M15 67V32H28V58H85V80M15 67H85M28 58V43H72Q85 43 85 58" fill="#d3a472"/><path d="M31 47H47V58H31Z" fill="#f6e9d8"/>',
 anvil:'<path d="M14 37H82L67 55H57V69H74V78H26V69H42V55H31L14 45Z" fill="#9bb3bd"/><path d="M51 18L66 29M42 18L49 9L71 25L64 34Z" fill="#d3a472"/>',
 board:'<path d="M17 18H83V82H17Z" fill="#b2865f"/><path d="M27 27H73V70H27Z" fill="#f6e9d8"/><path d="M35 39H64M35 49H65M35 59H57"/>',
 potion:'<path d="M36 13H62V25H58V40Q83 54 76 78Q72 88 49 88Q23 88 22 71Q20 51 40 40V25H36Z" fill="#bf9ec9"/><path d="M25 63Q49 55 76 63V75Q72 85 49 85Q29 85 25 75Z" fill="#8460a7"/><path d="M67 28L80 22L84 38L71 45Z" fill="#f6e9d8"/>'
 };
 return `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#302b32" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${shapes[symbol]||shapes.board}</g></svg>`;
}
function renderTown(){
 const p=townPlace(), party=state.townRest?`<div class="town-party">${CRITTERS.map(c=>`<button data-info="${c.id}" aria-label="${c.name}狀態">${critterHead(c.id)}<span>${c.name}</span></button>`).join("")}</div>`:"";
 if(!p)return `<section class="page town-page"><div class="head"><h2>${TOWN_UI.title}</h2></div>${party}<p>${TOWN_UI.subtitle}</p><div class="town-street">${TOWN_PLACES.map(p=>`<button class="town-building" data-town-place="${p.id}" style="--venue:${p.color}">${townSymbolSVG(p.symbol)}<b>${p.name}</b><span>${p.owner}</span></button>`).join('')}</div><small>${TOWN_UI.draft}</small><div class="nav"><button class="btn ghost" id="townMap">${TOWN_UI.map}</button></div></section>`;
 return `<section class="page fp-page town-page town-conversation" aria-label="${p.name}"><div class="stage"><div class="npc-space" aria-hidden="true"></div><div class="dialog town-dialog"><b>${p.owner} · ${p.role}</b><p>${p.line}</p></div></div>${storyPartyHTML()}<small>${TOWN_UI.draft}</small><button class="btn" id="townAction">${p.action}</button>${state.townPanel==='guild'?`<p class="town-panel">${TOWN_UI.guild}</p>`:''}${state.townPanel==='rest'?`<div class="town-rest">${state.townRest?restChoiceHTML(state.townRest):`<p>${TOWN_UI.restUnavailable}</p>`}<p>${TOWN_UI.rest}</p>${state.restMessage?`<p role="status">${state.restMessage}</p>`:''}</div>`:''}<div class="nav"><button class="btn ghost" id="townStreet">${TOWN_UI.back}</button></div></section>`;
}
function openTownPlace(id){if(!TOWN_PLACES.some(p=>p.id===id))return;state.townPlace=id;state.townPanel=null;state.restMessage=null;render();window.scrollTo(0,0);}
function bindTown(){
 document.querySelectorAll('[data-town-place]').forEach(el=>el.addEventListener('click',()=>openTownPlace(el.dataset.townPlace)));
 document.getElementById('townMap')?.addEventListener('click',()=>{state.page='map';state.mapSel='town';render();});
 document.getElementById('townStreet')?.addEventListener('click',()=>{if(state.townPlace==='items'&&!state.supplierSeen){state.page='story';state.scene='townSupplier';state.line=0;state.info=null;state.townPanel=null;render();window.scrollTo(0,0);return;}state.townPlace=null;state.townPanel=null;render();window.scrollTo(0,0);});
 document.getElementById('townAction')?.addEventListener('click',()=>{
  const p=townPlace();if(p.id==='smith'||p.id==='items'){
   state.shopContext=p.id;state.page='shop';state.shopCat=shopCategories()[0];state.quip=p.line;render();
  }else{state.townPanel=p.id==='inn'?'rest':'guild';render();}
 });
 if(state.townRest && state.townPanel==='rest')bindRestNotebook(state.townRest);
 const selections=()=>restPickSelections(state.townRest);
 document.getElementById('shortRest')?.addEventListener('click',()=>takeRest('short',selections(),state.townRest));
 document.getElementById('longRest')?.addEventListener('click',()=>takeRest('long',selections(),state.townRest));
 document.querySelectorAll('[data-teach]').forEach(el=>el.addEventListener('click',()=>{const [id,key]=el.dataset.teach.split(':');const b=state.townRest,u=b.units.find(u=>u.id===id);if(u){learnFromLingling(u,key,b);render();}}));
 document.querySelectorAll('[data-erase]').forEach(el=>el.addEventListener('click',()=>{const [id,key]=el.dataset.erase.split(':');const b=state.townRest,u=b.units.find(u=>u.id===id);if(u&&eraseNote(u,key,b)){syncLearnedState(b);render();}}));
}
function leaveTownShop(){state.page='town';state.shopContext=null;render();window.scrollTo(0,0);}
