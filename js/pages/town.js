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
 if(p && state.townPanel)return `<section class="page shop-page town-service-page${p.id==='inn'&&innFirstNight()?' inn-first-night':''}" aria-label="${p.name}">${venueHeaderHTML(p,p.line)}<div class="shop-list town-service-body">${state.townPanel==='rest'?`<div class="town-rest">${p.id==='inn'&&innFirstNight()?`<div class="inn-tutor-mask" aria-hidden="true"></div><div class="inn-tutor-tip" role="note"><b>${TOWN_UI.innFirstNightTitle}</b><p>${TOWN_UI.innFirstNight}</p></div>`:''}${state.townRest?restChoiceHTML(state.townRest):`<p>${TOWN_UI.restUnavailable}</p>`}<p>${TOWN_UI.rest}</p>${state.restMessage?`<p role="status">${state.restMessage}</p>`:''}</div>`:questBoardHTML()}</div><div class="nav"><button class="btn ghost" id="townServiceBack">回到${p.name}</button><button class="btn ghost" id="townStreet">${TOWN_UI.back}</button></div></section>`;
 if(!p)return `<section class="page town-page town-street-page"><div class="story-head"><h2>${TOWN_UI.title}</h2>${pageToolsHTML()}</div><div class="stage town-street town-street-art"><img class="town-street-background" src="${SCENE_ART.town}" alt="城鎮街景"><p class="town-street-caption">${TOWN_UI.subtitle}</p>${TOWN_PLACES.map(p=>`<button class="town-building" data-town-place="${p.id}" style="--venue:${p.color}">${townSymbolSVG(p.symbol)}<b>${p.name}</b><span>${p.owner}</span>${townShopEventHTML(p.id)}</button>`).join('')}${townEventBubbleHTML()}</div>${storyPartyHTML()}<div class="nav"><button class="btn ghost town-map-button" id="townMap" aria-label="${TOWN_UI.map}"><img src="${SCENE_ART.mapMarker}" alt=""><span class="town-hint" role="tooltip">${TOWN_UI.map}</span></button></div></section>`;
 return `<section class="page fp-page town-page town-conversation" aria-label="${p.name}"><div class="story-head"><span></span>${pageToolsHTML()}</div><div class="stage"><div class="actor ${TOWN_PORTRAIT[p.id]}">${portraitHTML(TOWN_PORTRAIT[p.id],"smile")}</div><div class="dialog town-dialog" ${talkLine(p)?'id="townTalkNext" role="button" tabindex="0"':''}><b>${p.owner} · ${p.role}</b><p>${talkLine(p)||p.line}</p>${talkLine(p)?'<span class="next">▼ 點一下繼續</span>':''}</div></div>${storyPartyHTML()}${townTalkButtons(p)}<div class="nav"><button class="btn ghost" id="townStreet">${TOWN_UI.back}</button></div></section>`;
}
// 進城第一晚（大爺 10-10）：逛到旅店就直接進休息、只能長休，長休完看旅店 CG；之後照常讓玩家選
const innFirstNight = () => !state.innNightDone;
// 店內對話（10-10）：state.townTalk＝{place, topic, lines, i}；topic 為 null＝正在挑話題
const talkLine = p => { const t=state.townTalk; return t && t.place===p.id && t.lines ? t.lines[t.i] : null; };
function townTalkButtons(p){
  const t=state.townTalk;
  if(t && t.place===p.id && !t.lines) return `<div class="town-talk-topics pop-choices" role="dialog">${Object.entries(TOWN_TALK_TOPICS).map(([k,n])=>`<button class="btn" data-talk-topic="${k}">${n}</button>`).join("")}<button class="btn ghost" id="townTalkClose">不聊了</button></div>`;
  if(t && t.place===p.id) return "";
  return `<div class="town-talk-topics"><button class="btn" id="townAction">${p.action}</button><button class="btn ghost" id="townTalk">對話</button></div>`;
}
function openTownPlace(id){state.townTalk=null;if(!TOWN_PLACES.some(p=>p.id===id))return;state.townPlace=id;state.townPanel=id==='inn'&&innFirstNight()&&state.townRest?'rest':null;state.restMessage=null;render();window.scrollTo(0,0);}
function bindTown(){
 bindTownImageReadiness();
 document.getElementById('townServiceBack')?.addEventListener('click',()=>{state.townPanel=null;render();});
 document.getElementById('townTalk')?.addEventListener('click',()=>{state.townTalk={place:state.townPlace,lines:null,i:0};render();});
 document.getElementById('townTalkClose')?.addEventListener('click',()=>{state.townTalk=null;render();});
 document.querySelectorAll('[data-talk-topic]').forEach(el=>el.addEventListener('click',()=>{const T=TOWN_TALK[state.townPlace],k=el.dataset.talkTopic;const lines=k==='chat'?T.chat[Math.floor(Math.random()*T.chat.length)]:T[k];state.townTalk={place:state.townPlace,topic:k,lines,i:0};render();}));
 document.getElementById('townTalkNext')?.addEventListener('click',()=>{const t=state.townTalk;if(!t?.lines)return;if(t.i<t.lines.length-1)t.i++;else{t.lines=null;t.topic=null;}render();});
 if(state.townPlace==='items'&&!state.supplierSeen)loadEntryImage(PORTRAITS.merchant.base).catch(()=>{});
 document.querySelectorAll('[data-town-place]').forEach(el=>el.addEventListener('click',e=>{if(e.pointerType==='touch'&&el.querySelector('.town-hint')&&!el.classList.contains('hint-open')){el.classList.add('hint-open');return;}openTownPlace(el.dataset.townPlace);}));
 document.getElementById('townMap')?.addEventListener('click',e=>{if(e.pointerType==='touch'&&!e.currentTarget.classList.contains('hint-open')){e.currentTarget.classList.add('hint-open');return;}state.page='map';state.mapSel='town';render();});
 document.querySelectorAll('[data-town-event]').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('hint-open')));
 document.getElementById('townStreet')?.addEventListener('click',()=>{state.townTalk=null;if(state.townPlace==='items'&&!state.supplierSeen){state.page='story';state.scene='townSupplier';state.line=0;state.info=null;state.townPanel=null;render();window.scrollTo(0,0);return;}state.townPlace=null;state.townPanel=null;render();window.scrollTo(0,0);});
 document.getElementById('townAction')?.addEventListener('click',()=>{
  const p=townPlace();if(p.id==='smith'||p.id==='items'){
   state.shopContext=p.id;state.page='shop';state.shopCat=shopCategories()[0];state.quip=p.line;render();
  }else{state.townPanel=p.id==='inn'?'rest':'guild';render();}
 });
 if(state.townPanel==='guild')bindQuestBoard();   // 委託板（10-10）
 if(state.townRest && state.townPanel==='rest')bindRestNotebook(state.townRest);
 const selections=()=>restPickSelections(state.townRest);
 document.getElementById('shortRest')?.addEventListener('click',()=>takeRest('short',selections(),state.townRest));
 document.getElementById('longRest')?.addEventListener('click',()=>{
  if(!takeRest('long',selections(),state.townRest))return;
  state.innNightDone=true;state.townPanel=null;state.page='story';state.scene='innRest';state.line=0;state.info=null;render();window.scrollTo(0,0);   // 長休：切旅店 CG（10-10）
 });
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

// ---------- 酒館（大爺 10-11）：回家劇情演完後，跟店家同一套版面 ----------
// state.tavern＝{talkWho:"dwarf"|"kam"|null(在選要跟誰聊), topicOpen, lines, i, pet, msg}；不存檔
const tavernDay = () => ensureMarket().day;
function openTavern(){ state.tavern = {}; state.page = "tavern"; state.info = null; render(); window.scrollTo(0,0); }
function tavernLine(){ const t = state.tavern||{}; return t.lines ? t.lines[t.i] : null; }
function petPopHTML(){
  return `<div class="pop-choices tavern-pet" role="dialog" id="tavernPetPop"><b class="pet-title">${TAVERN_UI.petTitle}</b><div class="pet-heads">${CRITTERS.map(c=>{
    const s = stressNow(c.id), happy = (state.tavern?.petAt?.[c.id]||0) > Date.now();
    return `<button class="pet-head" data-pet="${c.id}" aria-label="摸摸${c.name}的頭">${happy?`<span class="pet-bubble">${obsBubbleHTML("note")}</span>`:""}${critterHead(c.id, happy ? "happy" : "normal")}<span>${c.name}</span><small>${TAVERN_UI.stress} ${s}</small></button>`;
  }).join("")}</div><button class="btn ghost" id="tavernPetDone">${TAVERN_UI.petDone}</button></div>`;
}
function tavernButtons(){
  const t = state.tavern||{};
  if(t.lines) return "";
  if(t.pet) return petPopHTML();
  if(t.talkWho===null) return `<div class="town-talk-topics pop-choices" role="dialog"><b class="pet-title">${TAVERN_UI.talkWho}</b><button class="btn" data-tavern-who="dwarf">${TAVERN_UI.dwarfName}</button><button class="btn" data-tavern-who="kam">${TAVERN_UI.kamName}</button><button class="btn ghost" id="tavernTalkClose">不聊了</button></div>`;
  if(t.topicOpen) return `<div class="town-talk-topics pop-choices" role="dialog">${Object.entries(TAVERN_TALK_TOPICS).map(([k,n])=>`<button class="btn" data-tavern-topic="${k}">${n}</button>`).join("")}<button class="btn ghost" id="tavernTalkClose">不聊了</button></div>`;
  const ate = state.tavernMealDay===tavernDay();
  return `<div class="town-talk-topics"><button class="btn" id="tavernEat" ${ate?"disabled":""}>${TAVERN_UI.eat}${ate?`<small>${TAVERN_UI.ate}</small>`:""}</button><button class="btn" id="tavernSleep" ${state.townRest?"":"disabled"}>${TAVERN_UI.sleep}${state.townRest?"":`<small>${TAVERN_UI.noBed}</small>`}</button><button class="btn" id="tavernTalk">${TAVERN_UI.talk}</button><button class="btn" id="tavernPet">${TAVERN_UI.pet}</button></div>`;
}
function renderTavern(){
  const t = state.tavern || (state.tavern = {}), line = tavernLine();
  const who = (line && line.who) || t.talkWho || t.speaker || "dwarf";
  const face = line ? line.face : (t.face || "smile");
  return `<section class="page fp-page town-page town-conversation tavern-page" aria-label="酒館"><div class="story-head"><span></span>${pageToolsHTML()}</div><div class="stage"><div class="wall"></div><div class="actor ${who}">${portraitHTML(who, face||"smile")}</div><div class="dialog town-dialog" ${line?'id="tavernNext" role="button" tabindex="0"':''}><b>${who==="kam"?TAVERN_UI.kamName:TAVERN_UI.dwarfName}</b><p>${line?line.text:(t.msg||TAVERN_UI.idle)}</p>${line?'<span class="next">▼ 點一下繼續</span>':''}</div></div>${storyPartyHTML()}${tavernButtons()}<div class="nav"><button class="btn ghost" id="tavernLeave">${TAVERN_UI.leave}</button></div></section>`;
}
function tavernEat(){
  if(state.tavernMealDay===tavernDay()) return;
  const keys = Object.keys(CAMP_FOODS), food = keys[Math.floor(Math.random()*keys.length)];
  state.tavernMealDay = tavernDay();
  CRITTERS.forEach(c=>{ (state.cookBuff ||= {})[c.id] = food; });
  if(food==="honey") changeStressAll(v=>v-10);   // 蜂蜜麵包：壓力額外 −10（同露營）
  Object.assign(state.tavern, {msg:TAVERN_UI.meal.replace("{food}", CAMP_FOODS[food].dish)+`（${CAMP_FOODS[food].effect}，到下次長休）`, speaker:"dwarf", face:"grin"});
  sfx("win"); render(); autoSave();
}
function tavernSleep(){
  const b = state.townRest; if(!b) return;
  if(!takeRest("long", restPickSelections(b), b)) return;
  state.page = "story"; state.scene = "tavernRest"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}
function petCritter(id){
  const t = state.tavern; if(!t?.pet) return;
  state.stress ||= {}; state.stress[id] = Math.max(0, stressNow(id) - PET_STRESS);
  (t.petAt ||= {})[id] = Date.now() + 900;
  sfx("pop");
  const pop = document.getElementById("tavernPetPop"); if(pop){ pop.outerHTML = petPopHTML(); bindTavernPet(); }   // 只換跳出框，不整頁重畫
  clearTimeout(petCritter.timer); petCritter.timer = setTimeout(()=>{ const p = document.getElementById("tavernPetPop"); if(p && state.page==="tavern"){ p.outerHTML = petPopHTML(); bindTavernPet(); } }, 950);
}
function bindTavernPet(){
  document.querySelectorAll("[data-pet]").forEach(el=>el.addEventListener("click", ()=>petCritter(el.dataset.pet)));
  document.getElementById("tavernPetDone")?.addEventListener("click", ()=>{ state.tavern.pet = false; render(); autoSave(); });
}
function bindTavern(){
  const t = state.tavern || (state.tavern = {}), $ = id => document.getElementById(id);
  $("tavernEat")?.addEventListener("click", tavernEat);
  $("tavernSleep")?.addEventListener("click", tavernSleep);
  $("tavernTalk")?.addEventListener("click", ()=>{ t.talkWho = null; t.msg = null; render(); });
  $("tavernPet")?.addEventListener("click", ()=>{ t.pet = true; t.msg = null; render(); });
  $("tavernTalkClose")?.addEventListener("click", ()=>{ t.talkWho = undefined; t.topicOpen = false; render(); });
  document.querySelectorAll("[data-tavern-who]").forEach(el=>el.addEventListener("click", ()=>{ t.talkWho = el.dataset.tavernWho; t.speaker = t.talkWho; t.face = "smile"; t.topicOpen = true; render(); }));
  document.querySelectorAll("[data-tavern-topic]").forEach(el=>el.addEventListener("click", ()=>{
    const T = TAVERN_TALK[t.talkWho], k = el.dataset.tavernTopic, src = k==="chat" ? T.chat[Math.floor(Math.random()*T.chat.length)] : T[k];
    t.lines = src.map(l=>({...l, who:t.talkWho})); t.i = 0; t.topicOpen = false; render();
  }));
  $("tavernNext")?.addEventListener("click", ()=>{ if(t.i < t.lines.length-1) t.i++; else { t.face = t.lines[t.i].face; t.lines = null; t.topicOpen = true; } render(); });
  $("tavernLeave")?.addEventListener("click", ()=>{ state.tavern = null; state.page = "map"; state.location = "tavern"; state.mapSel = null; state.travel = null; render(); window.scrollTo(0,0); });
  if(t.pet) bindTavernPet();
}
