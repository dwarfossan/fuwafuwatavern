/* 分層大地圖：鏡頭與隊伍、對話獨立更新，不靠逐步整頁重畫。 */
function worldTravelPosition(tr){return roadPoint(tr.route?tr.route[tr.leg]:tr.from,tr.route?tr.route[tr.leg+1]:tr.to,tr.t);}
function worldPartyLine(){return state.travel?.alert?{who:'all',moods:{fox:'surprised',tiger:'blank',wolf:'surprised',raccoon:'surprised'},marks:Object.fromEntries(CRITTERS.map(c=>[c.id,'ok']))}:state.worldLine||{};}
function worldRoute(from,to){
 const queue=[[from]],seen=new Set([from]);
 while(queue.length){const route=queue.shift(),at=route.at(-1);if(at===to)return route;for(const link of WORLD.links){const next=link.a===at?link.b:link.b===at?link.a:null;if(next&&!seen.has(next)){seen.add(next);queue.push([...route,next]);}}}
 return null;
}
function renderMap(){
 const tr=state.travel,sel=WORLD.locations.find(l=>l.id===state.mapSel)||WORLD.locations.find(l=>l.id===state.location),here=sel.id===state.location;
 const qs=!tr&&!state.worldArrival&&state.questSel?questOpen().find(q=>q.id===state.questSel):null;   // 點了委託泡泡（10-10）
 return `<section class="page fp-page map-page"><div class="story-head"><h2>大地圖</h2>${pageToolsHTML(pageHelpHTML('map'))}</div><div class="stage map-frame">${worldMapSVG(sel.id,state.location,tr?worldTravelPosition(tr):null,tr?.alert)}<div id="world-place-hint" class="world-place-hint" role="tooltip" hidden></div></div><div id="map-party">${storyPartyHTML(worldPartyLine())}</div><div class="map-info"><div id="map-message">${qs?`<h3>${QUEST_UI.pin}：${questTpl(qs).title} <span class="quest-stars">${questStars(qs.stars)}</span></h3><p>${questTpl(qs).text}</p>`:`<h3>${tr?(tr.alert?'前面有狀況！':tr.quest?`前往委託「${questTpl(questById(tr.quest)||{tpl:''})?.title||''}」途中……`:`前往${WORLD.locations.find(l=>l.id===tr.to).name}途中……`):sel.name}</h3><p>${tr?'沿著道路前進。':sel.desc}</p>`}</div><div id="map-actions">${qs?`<button class="btn small" id="questGo">${QUEST_UI.go}</button><button class="btn small ghost" id="questCancel">取消</button>`:state.worldArrival?'<button class="btn small" id="worldEnter">進入</button><button class="btn small ghost" id="worldSkip">略過對話</button>':tr?`<button class="btn small" id="worldStop" ${!tr.route||tr.alert?'disabled':''}>${tr.paused?'繼續走':'停下'}</button>`:here?`<button class="btn small" id="${sel.id==='town'?'enterTown':'worldEnter'}">進入</button>`:'<button class="btn small" id="worldGo">前往</button>'}</div></div></section>`;
}
function worldZoomMin(frame){return Math.max(frame.clientWidth/WORLD.width,frame.clientHeight/WORLD.height)*1.2;}
function applyWorldCamera(){
 const frame=document.querySelector('.map-frame'),svg=frame?.querySelector('.worldmap');if(!svg)return;
 const fit=worldZoomMin(frame),at=state.travel?worldTravelPosition(state.travel):WORLD.locations.find(l=>l.id===state.location),c=state.worldCamera||={zoom:fit,cam:{x:frame.clientWidth/2-at.x*fit,y:frame.clientHeight/2-at.y*fit}};
 c.zoom=Math.max(fit,Math.min(1.5,c.zoom));
 c.cam=clampSceneCamera(c.cam,{w:frame.clientWidth,h:frame.clientHeight},{w:WORLD.width*c.zoom,h:WORLD.height*c.zoom});
 svg.style.width=WORLD.width*c.zoom+'px';svg.style.height=WORLD.height*c.zoom+'px';svg.style.transform=`translate(${c.cam.x}px,${c.cam.y}px)`;
}
function focusWorldParty(p){
 const frame=document.querySelector('.map-frame'),c=state.worldCamera;if(!frame||!c)return;
 c.cam={x:frame.clientWidth/2-p.x*c.zoom,y:frame.clientHeight*.6-p.y*c.zoom};applyWorldCamera();
}
function bindMap(){
 applyWorldCamera();
 const frame=document.querySelector('.map-frame'),points=new Map();let drag=null,pinch=null,suppress=0;
 const xy=e=>{const r=frame.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 const zoom=(z,p)=>{const c=state.worldCamera,old=c.zoom;c.zoom=Math.max(worldZoomMin(frame),Math.min(1.5,z));c.cam=sceneZoomCamera(c.cam,old,c.zoom,p);applyWorldCamera();};
 frame.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;const p=xy(e);points.set(e.pointerId,p);drag={id:e.pointerId,p,cam:{...state.worldCamera.cam},moved:false};if(points.size===2){const [a,b]=[...points.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,p:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},zoom:state.worldCamera.zoom,cam:{...state.worldCamera.cam}};suppress=Infinity;frame.setPointerCapture(e.pointerId);}});
 frame.addEventListener('pointermove',e=>{
  if(!points.has(e.pointerId))return;const p=xy(e);points.set(e.pointerId,p);state.worldCameraGestureUntil=performance.now()+3000;
  if(pinch&&points.size===2){const [a,b]=[...points.values()],c=state.worldCamera;c.zoom=Math.max(worldZoomMin(frame),Math.min(1.5,pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));c.cam=sceneZoomCamera(pinch.cam,pinch.zoom,c.zoom,pinch.p,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});applyWorldCamera();e.preventDefault();return;}
  if(!drag||drag.id!==e.pointerId)return;const dx=p.x-drag.p.x,dy=p.y-drag.p.y;
  if(Math.hypot(dx,dy)>DRAG_TOL){drag.moved=true;frame.setPointerCapture(e.pointerId);}
  if(drag.moved){state.worldCameraGestureUntil=performance.now()+3000;state.worldCamera.cam={x:drag.cam.x+dx,y:drag.cam.y+dy};applyWorldCamera();e.preventDefault();}
 });
 const end=e=>{if(!points.has(e.pointerId))return;points.delete(e.pointerId);if(pinch||drag?.moved||e.type==='pointercancel')suppress=performance.now()+500;if(points.size===1){const [id,p]=[...points.entries()][0];drag={id,p,cam:{...state.worldCamera.cam},moved:true};}else drag=null;pinch=null;};
 frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
 frame.addEventListener('click',e=>{if(performance.now()<suppress){e.preventDefault();e.stopImmediatePropagation();}},true);
 frame.addEventListener('wheel',e=>{e.preventDefault();hide();zoom(state.worldCamera.zoom*Math.exp(-e.deltaY*.0015),xy(e));},{passive:false});
 const hint=document.getElementById('world-place-hint');let touchPreview=null;
 const show=id=>{if(state.travel||state.worldArrival)return;const l=WORLD.locations.find(x=>x.id===id),c=state.worldCamera;hint.innerHTML=`<b>${townText(l.name)}</b><span>${townText(l.desc)}</span>`;hint.hidden=false;hint.style.left=Math.max(8,Math.min(frame.clientWidth-228,c.cam.x+l.x*c.zoom-110))+'px';hint.style.top=Math.max(8,Math.min(frame.clientHeight-90,c.cam.y+(l.y-160)*c.zoom-70))+'px';};
 const hide=()=>{touchPreview=null;hint.hidden=true;};
 const go=id=>{if(state.travel||state.worldArrival)return;state.questSel=null;state.mapSel=id;if(id===state.location)enterWorldLocation();else beginWorldTravel(id);};
 document.querySelectorAll('[data-loc]').forEach(el=>{
  el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')show(el.dataset.loc);});
  el.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')hide();});
  el.addEventListener('focus',()=>show(el.dataset.loc));el.addEventListener('blur',hide);
  el.addEventListener('click',e=>{const id=el.dataset.loc;if(e.pointerType==='touch'&&touchPreview!==id){touchPreview=id;show(id);return;}go(id);});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(el.dataset.loc);}});
 });
 frame.addEventListener('pointermove',e=>{if(points.has(e.pointerId)&&(drag?.moved||pinch))hide();});
 document.getElementById('worldGo')?.addEventListener('click',()=>beginWorldTravel(state.mapSel));
 // 委託泡泡（10-10）：點一下看內容，按「出發」走過去
 document.querySelectorAll('[data-quest]').forEach(el=>{const pick=()=>{if(state.travel||state.worldArrival)return;hide();state.questSel=el.dataset.quest;render();};el.addEventListener('click',pick);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});});
 document.getElementById('questGo')?.addEventListener('click',()=>beginQuestTravel(state.questSel));
 document.getElementById('questCancel')?.addEventListener('click',()=>{state.questSel=null;render();});
 document.getElementById('worldStop')?.addEventListener('click',()=>{const tr=state.travel;if(!tr?.route||tr.alert)return;tr.paused=!tr.paused;render();if(!tr.paused)startWorldTravel(tr);});
 document.getElementById('worldSkip')?.addEventListener('click',()=>{state.worldLine=null;state.worldArrival.done=true;render();});
 document.getElementById('worldEnter')?.addEventListener('click',enterWorldLocation);
 document.getElementById('map-message')?.addEventListener('click',()=>{if(state.worldArrival&&!state.worldArrival.done){state.worldArrival.index++;showWorldArrivalLine();}});
 updateWorldParty();
}
function updateWorldParty(){
 const el=document.getElementById('map-party');if(!el)return;const line=worldPartyLine();
 el.querySelectorAll('.world-banter').forEach(n=>n.remove());
 el.querySelectorAll('[data-info]').forEach(pf=>{const id=pf.dataset.info;pf.classList.toggle('speaking',line.who===id||line.who==='all');const img=pf.querySelector('.c-head');img.src=sceneAssetURL(critterFaceSrc(id,critterMood(id,line)));});
 if(line.text){const pf=el.querySelector(`[data-info="${line.who}"]`);pf?.insertAdjacentHTML('beforeend',`<span class="world-banter">${townText(line.text)}</span>`);}
}

function beginWorldTravel(to){
 if(state.travel||to===state.location)return;const route=worldRoute(state.location,to);if(!route)return;
 state.worldArrival=null;state.worldLine=null;state.worldChest=null;
 state.travel={route,from:state.location,to,leg:0,t:0,stop:1,alert:false,paused:false,chest:Math.random()<.2,chestSeen:false,banterAt:2.0,elapsed:0,chatIndex:0,chat:null};
 render();focusWorldParty(worldTravelPosition(state.travel));startWorldTravel(state.travel);
}
function startWorldTravel(tr){
 if(tr.running)return;tr.running=true;let last=performance.now();
 const step=now=>{
  if(state.page!=='map'||state.travel!==tr||tr.paused||tr.alert){tr.running=false;return;}
  const dt=Math.max(0,Math.min(now-last,100));last=now;tr.elapsed+=dt/1000;tr.t=Math.min(1,tr.t+dt/6500);
  const p=worldTravelPosition(tr);document.getElementById('party-marker')?.setAttribute('transform',`translate(${p.x} ${p.y})`);
  const frame=document.querySelector('.map-frame'),c=state.worldCamera;
  if(frame&&c&&now>(state.worldCameraGestureUntil||0)){const x=c.cam.x+p.x*c.zoom,y=c.cam.y+(p.y-100)*c.zoom;if(x<50||x>frame.clientWidth-50||y<50||y>frame.clientHeight-50)focusWorldParty(p);}
  if(tr.chest&&!tr.chestSeen&&tr.leg===0&&tr.t>=.55){tr.chestSeen=true;state.worldChest=tr.chestEvent=createWorldChest();tr.alert=true;tr.running=false;state.worldLine=null;focusWorldParty(p);render();setTimeout(()=>{if(state.travel!==tr||state.page!=='map')return;state.page='story';state.scene='worldChest';state.line=0;state.info=null;render();},1500);return;}
  if(tr.elapsed>=tr.banterAt){
   if(!tr.chat){let candidates=WORLD_CHAT.banter.filter((_,i)=>i!==state.worldLastChat);const chat=candidates[Math.floor(Math.random()*candidates.length)];state.worldLastChat=WORLD_CHAT.banter.indexOf(chat);tr.chat=chat.lines;tr.chatIndex=0;}
   state.worldLine=tr.chat[tr.chatIndex++];updateWorldParty();
   if(tr.chatIndex===tr.chat.length){tr.chat=null;tr.banterAt=tr.elapsed+8;}else tr.banterAt=tr.elapsed+3;
  }
  if(tr.quest&&tr.leg===tr.route.length-2&&tr.t>=tr.stopT){tr.running=false;arriveQuest(tr);return;}   // 委託：走到泡泡的位置就開打（10-10）
  if(tr.t>=1){if(tr.leg<tr.route.length-2){tr.leg++;tr.t=0;}else{tr.running=false;state.location=tr.to;state.mapSel=tr.to;state.travel=null;state.worldLine=null;state.worldVisits||={};const seen=state.worldVisits[tr.to];state.worldVisits[tr.to]=true;state.worldArrival={index:0,done:!!seen};render();showWorldArrivalLine();return;}}
  requestAnimationFrame(step);
 };
 requestAnimationFrame(step);
}
function showWorldArrivalLine(){
 const arrival=state.worldArrival;if(!arrival)return;
 const line=!arrival.done&&WORLD_CHAT.arrival.lines[arrival.index];
 if(!line){arrival.done=true;state.worldLine=null;}else state.worldLine=line;
 updateWorldParty();const msg=document.getElementById('map-message');if(msg)msg.innerHTML=`<h3>${WORLD.locations.find(l=>l.id===state.location).name}</h3><p>${line?townText(line.text)+'（點一下繼續）':'已到達。'}</p>`;
}
function enterWorldLocation(){
 if(state.travel)return;
 if(state.worldArrival&&!state.worldArrival.done){state.worldArrival.index++;showWorldArrivalLine();return;}
 const id=state.location;state.worldArrival=null;state.worldLine=null;
 if(id==='town'&&state.townFounded){state.page='town';state.townPlace=null;state.townPanel=null;render();}
 else if(id==='tavern'){tavernStress();state.page='story';state.scene=state.leftTavernDay!==undefined&&ensureMarket().day>state.leftTavernDay?'tavernReturn':'farewell';state.line=0;state.info=null;render();}
 else {document.getElementById('map-message').innerHTML=`<h3>${WORLD.locations.find(l=>l.id===id).name}</h3><p>探索待製作</p>`;}
}
function resumeWorldTravel(){const tr=state.travel;if(!tr?.route||!['opened','failed','defeated'].includes(state.worldChest?.status))return;tr.alert=false;state.worldLine=null;state.page='map';render();startWorldTravel(tr);}
