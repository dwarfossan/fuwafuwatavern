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
        <p>${tr.alert ? "隊伍停下了腳步。" : "沿著大路往前走。"}</p>
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
        <p>${sel.desc}</p>
      </div>
      <button class="btn" disabled>${here?"探索（待製作）":"前往（待製作）"}</button>
    </div>
  </section>`;
}

function bindMap(){}   // 10-02：大地圖改成一次看完整張，不用左右滑了（main.js 還會呼叫，先留空）
