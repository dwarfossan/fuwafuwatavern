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
// 事件資料只描述呈現；實際內容／触發規則另由劇情提供。
function townText(text){return String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function townEvents(){return (state.townEvents||[]).filter(e=>e.location&&e.person&&e.action);}
function townEventSymbol(e){return `<span class="town-event-symbol">${obsBubbleHTML(e.symbol==='?'?'fail':e.symbol==='…'?'known':'ok')}</span>`;}
function townEventHint(e){return `<span class="town-hint" role="tooltip">${townText([...String(e.intro||e.action)].slice(0,10).join(''))}</span>`;}
function townEventBubbleHTML(){
 return townEvents().filter(e=>!e.place).map((e,i)=>`<button class="town-building town-event-bubble" data-town-event="${i}" style="left:${Math.max(12,Math.min(70,Number(e.x)||50))}%;top:${Math.max(16,Math.min(78,Number(e.y)||70))}%" aria-label="${townText(e.location+'／'+e.person+'／'+e.action)}"><b>${townText(e.location)}</b><span>${townText(e.person)}／${townText(e.action)}</span>${townEventSymbol(e)}${townEventHint(e)}</button>`).join('');
}
function townShopEventHTML(place){const e=townEvents().find(e=>e.place===place);return e?townEventSymbol(e)+townEventHint(e):'';}
function renderTown(){
 const p=townPlace();
 if(!p)return `<section class="page town-page town-street-page"><div class="story-head"><h2>${TOWN_UI.title}</h2></div><div class="stage town-street town-street-art"><img class="town-street-background" src="${SCENE_ART.town}" alt="城鎮街景"><p class="town-street-caption">${TOWN_UI.subtitle}</p>${TOWN_PLACES.map(p=>`<button class="town-building" data-town-place="${p.id}" style="--venue:${p.color}">${townSymbolSVG(p.symbol)}<b>${p.name}</b><span>${p.owner}</span>${townShopEventHTML(p.id)}</button>`).join('')}${townEventBubbleHTML()}</div>${storyPartyHTML()}<small>${TOWN_UI.draft}</small><div class="nav"><button class="btn ghost town-map-button" id="townMap" aria-label="${TOWN_UI.map}"><img src="${SCENE_ART.mapMarker}" alt=""><span class="town-hint" role="tooltip">${TOWN_UI.map}</span></button></div></section>`;
 return `<section class="page fp-page town-page town-conversation" aria-label="${p.name}"><div class="stage"><div class="actor ${TOWN_PORTRAIT[p.id]}">${portraitHTML(TOWN_PORTRAIT[p.id],"smile")}</div><div class="dialog town-dialog"><b>${p.owner} · ${p.role}</b><p>${p.line}</p></div></div>${storyPartyHTML()}<small>${TOWN_UI.draft}</small><button class="btn" id="townAction">${p.action}</button>${state.townPanel==='guild'?`<p class="town-panel">${TOWN_UI.guild}</p>`:''}${state.townPanel==='rest'?`<div class="town-rest">${state.townRest?restChoiceHTML(state.townRest):`<p>${TOWN_UI.restUnavailable}</p>`}<p>${TOWN_UI.rest}</p>${state.restMessage?`<p role="status">${state.restMessage}</p>`:''}</div>`:''}<div class="nav"><button class="btn ghost" id="townStreet">${TOWN_UI.back}</button></div></section>`;
}
function openTownPlace(id){if(!TOWN_PLACES.some(p=>p.id===id))return;state.townPlace=id;state.townPanel=null;state.restMessage=null;render();window.scrollTo(0,0);}
function bindTown(){
 bindTownImageReadiness();
 if(state.townPlace==='items'&&!state.supplierSeen)loadEntryImage(PORTRAITS.merchant.base).catch(()=>{});
 document.querySelectorAll('[data-town-place]').forEach(el=>el.addEventListener('click',e=>{if(e.pointerType==='touch'&&el.querySelector('.town-hint')&&!el.classList.contains('hint-open')){el.classList.add('hint-open');return;}openTownPlace(el.dataset.townPlace);}));
 document.getElementById('townMap')?.addEventListener('click',e=>{if(e.pointerType==='touch'&&!e.currentTarget.classList.contains('hint-open')){e.currentTarget.classList.add('hint-open');return;}state.page='map';state.mapSel='town';render();});
 document.querySelectorAll('[data-town-event]').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('hint-open')));
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

// 城鎮入口只準備這一城的四位店主，完成前不開放尚未準備好的店。
const townImageLoads=new Map();
function prepareTownPlaceImages(place){
 const id=TOWN_PORTRAIT[place], portrait=PORTRAITS[id];
 if(!townImageLoads.has(place)){
  const pending=Promise.all([portrait.base,portrait.sheet].map(src=>loadEntryImage(src))).catch(error=>{townImageLoads.delete(place);throw error;});
  townImageLoads.set(place,pending);
 }
 return townImageLoads.get(place);
}
function bindTownImageReadiness(){
 CRITTERS.forEach(c=>loadEntryImage(critterFaceSrc(c.id,'normal')).catch(()=>{}));
 document.querySelectorAll('[data-town-place]').forEach(button=>{
  const place=button.dataset.townPlace;
  if(entryDecodedImages.has(PORTRAITS[TOWN_PORTRAIT[place]].base)&&entryDecodedImages.has(PORTRAITS[TOWN_PORTRAIT[place]].sheet))return;
  button.disabled=true;button.setAttribute('aria-busy','true');
  const label=document.createElement('small');label.textContent='圖片準備中…';button.append(label);
  prepareTownPlaceImages(place).then(()=>{button.disabled=false;button.removeAttribute('aria-busy');label.remove();},()=>{
   button.disabled=false;button.removeAttribute('aria-busy');label.textContent='圖片未載入，點擊重試';
  });
 });
}
