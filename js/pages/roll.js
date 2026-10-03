/* 擲骰頁：擲 6 組 4d6（取高三）→ 變成數字籌碼 → 拖到屬性格子分配 */
function chipHTML(id, i, extra=""){
  const dice = state.sets[id][i];
  const sel = state.sel === i ? " sel" : "";
  return `<button class="token${sel}${extra}" data-chip="${i}" aria-label="數值 ${scoreOf(dice)}">${scoreOf(dice)}</button>`;
}

function renderRoll(){
  const c = CRITTERS[state.active];
  const id = c.id;
  const sets = state.sets[id];
  const slot = state.slot[id] || {};
  const allDone = CRITTERS.every(x=>done(x.id));
  const total = done(id) ? ABILITIES.reduce((s,a)=> s + modOf(finalScore(id,a.k)), 0) : 0;

  const tabs = CRITTERS.map((x,i)=>`
    <button class="tab" role="tab" aria-selected="${i===state.active}" data-tab="${i}">
      ${critterHead(x.id)}<span>${x.name}</span>${done(x.id)?'<span class="done">✓</span>':''}
    </button>`).join("");

  // 籌碼盤：還沒分配的數值
  let tray;
  if(!sets){
    tray = `<p class="tray-empty">按「擲骰」擲出 6 組數值</p>`;
  } else {
    const used = new Set(Object.values(slot).filter(v=>v!==null && v!==undefined));
    const free = sets.map((_,i)=>i).filter(i=>!used.has(i)).sort((a,b)=>scoreOf(sets[b])-scoreOf(sets[a]));
    tray = free.length ? free.map(i=>chipHTML(id,i,state.chipPop?" pop":"")).join("") : `<p class="tray-empty">全部分配完成</p>`;
  }

  // 六個屬性格子
  const slots = ABILITIES.map(a=>{
    const i = slot[a.k];
    const has = i!==null && i!==undefined && sets;
    const b = bgOf(id,a.k);
    let val = `<div class="mod zero">—</div><div class="score">屬性值 —</div>`;
    if(has){
      const raw = scoreOf(sets[i]), s = finalScore(id,a.k), m = modOf(s);
      val = `<div class="mod ${m<0?"neg":m===0?"zero":""}">${fmt(m)}</div><div class="score">屬性值 ${s}</div>`
          + (b ? `<div class="bgnote">${raw} + 背景 ${b}</div>` : "");
    }
    return `<div class="slot ${has?"filled":""}" data-slot="${a.k}">
      <div class="ab-name">${a.n}<small>${a.k}</small>${b?`<span class="bgtag">+${b}</span>`:""}</div>
      <div class="slot-row">
        <div class="drop">${has ? chipHTML(id,i) : `<span class="drop-hint">拖到這裡</span>`}</div>
        <div class="ab-val">${val}</div>
      </div>
    </div>`;
  }).join("");

  return `<section class="page">
    <div class="head"><div>
      <h2>替小動物擲屬性</h2>
    </div>${pageHelpHTML("roll")}</div>
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="sheet">
      <div class="sheet-top">
        ${critterHead(id)}
        <div><h3>${c.name}</h3><div class="cls">${c.kind} · ${c.tags.join("、")}</div></div>
        <div class="sheet-actions">
          ${sets?`<button class="btn ghost" id="autoAssign">自動分配</button>`:""}
          <button class="btn" id="rollAll">${sets?"全部重擲":"擲骰"}</button>
        </div>
      </div>
      <div class="tray" data-tray="1" aria-label="未分配的數值">${tray}</div>
      <div class="slots">${slots}</div>
      <div class="summary">
        <span>調整值合計 <b>${done(id)?fmt(total):"—"}</b></span>
        <span>${CRITTERS.filter(x=>done(x.id)).length} / 4 隻已完成</span>
      </div>
    </div>
    <div class="nav">
      <button class="btn ghost" id="back">回到封面</button>
      <button class="btn" id="next" ${allDone?"":"disabled"}>${allDone?"進入酒館":"四隻都分配完才能繼續"}</button>
    </div>
  </section>`;
}

const WHO = id => id==="narr" ? {name:"", color:"var(--dim)"} :
                  id==="dwarf" ? {name:"矮人大爺", color:"var(--ale)"} :
                  id==="kam" ? {name:"卡姆", color:"#e8574a"} :   // 紅髮（10-03，顏色暫定）
                  id==="merchant" ? {name:state.scene==="ambush" ? "？？？" : "商人", color:"#c9b7a6"} :   // 伏擊時只聽到聲音
                  id==="all" ? {name:"四小隻", color:"#f0c987"} :   // 四隻一起說（10-02，顏色暫定）
                  (c => ({name:c.name, color:c.color}))(CRITTERS.find(c=>c.id===id));
