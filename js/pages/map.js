/* 大地圖：點地點看介紹；隊伍棋子標出目前位置 */
function renderMap(){
  const tr = state.travel;
  if(tr){
    const pos = roadPoint(tr.from, tr.to, tr.t);
    const to = WORLD.locations.find(l=>l.id===tr.to);
    return `<section class="page map-page">
      <div class="head"><div><h2>大地圖</h2></div></div>
      <div class="map-frame">${worldMapSVG(null, state.location, pos, tr.alert)}</div>
      <div class="map-info"><div>
        <h3>${tr.alert ? "前面有狀況！" : `前往${to.name}途中……`}</h3>
        <p>${tr.alert ? "隊伍停下了腳步。" : "沿著大路往前走。"}</p><small class="map-pan-hint">${PAGE_UI.mapPan}</small>
      </div></div>
    </section>`;
  }
  const sel = WORLD.locations.find(l=>l.id===state.mapSel) || WORLD.locations.find(l=>l.id===state.location);
  const here = sel.id === state.location;
  return `<section class="page map-page">
    <div class="head"><div>
      <h2>大地圖</h2>
    </div>${pageHelpHTML("map")}</div>
    <div class="map-frame">${worldMapSVG(sel.id, state.location)}</div>
    <div class="map-info">
      <div>
        <h3>${sel.name}${here?`<span class="here">你們在這裡</span>`:""}</h3>
        <p>${sel.desc}</p><small class="map-pan-hint">${PAGE_UI.mapPan}</small>
      </div>
      <button class="btn" disabled>${here?"探索（待製作）":"前往（待製作）"}</button>
    </div>
  </section>`;
}

function bindMap(){
  const frame=document.querySelector('.map-frame'), svg=frame?.querySelector('.worldmap');
  if(!frame||!svg) return;
  const focus=state.travel ? roadPoint(state.travel.from,state.travel.to,.5) : WORLD.locations.find(l=>l.id===(state.mapSel||state.location));
  frame.scrollLeft=state.mapScrollLeft===null ? (focus.x/WORLD.width*svg.getBoundingClientRect().width-frame.clientWidth/2) : state.mapScrollLeft;
  // 手機原生左右捲動；電腦手機框內也可用滑鼠拖曳。拖過不當作點地點。
  let drag=null, suppressUntil=0;
  frame.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0) return;
    drag={id:e.pointerId,x:e.clientX,left:frame.scrollLeft,moved:false};
  });
  frame.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId) return;
    const dx=e.clientX-drag.x;
    if(!drag.moved&&Math.abs(dx)>8){drag.moved=true;frame.setPointerCapture(e.pointerId);}
    if(drag.moved){frame.scrollLeft=drag.left-dx;e.preventDefault();}
  });
  frame.addEventListener('pointerup',()=>{if(drag?.moved)suppressUntil=performance.now()+500;drag=null;});
  frame.addEventListener('pointercancel',()=>{drag=null;});
  frame.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  frame.addEventListener('scroll',()=>{state.mapScrollLeft=frame.scrollLeft;},{passive:true});
}
