/* ======================== 戰鬥畫面：45 度戰棋、棋子、操作面板 ======================== */
const TW = 128, TH = 64;   // 一格菱形的寬、高
const TREE_K = 1.5, WAGON_K = 1.4;   // 樹、篷車的放大倍率（原本照 96 寬的格子畫）

// 裝備圖示（手繪風，見 js/art/icons.js）
const iconSVG = (k, size=16) => `<svg viewBox="-14 -14 148 148" width="${size}" height="${size}" aria-hidden="true">${ITEM_ART[k]||""}</svg>`;

// 格子座標 → 畫面座標；會加上那格的高度（一層往上 HZ 像素），站在上面的東西都跟著抬高
function iso(x, y){ const d=B().def; return {x:(x-y)*TW/2 + d.h*TW/2, y:(x+y)*TH/2 + 130 - hAt(x,y)*HZ}; }
const diamond = (x,y) => { const p=iso(x,y); return `${p.x},${p.y} ${p.x+TW/2},${p.y+TH/2} ${p.x},${p.y+TH} ${p.x-TW/2},${p.y+TH/2}`; };

function boardMarkState(){
  const b=B(), d=b.def, u=cur();
  // 可移動／可選目標
  let moveSet = new Map(), tgtSet = new Set(), areaSet = new Set(), range = -1;
  const myTurn = u && u.side==="pc" && !b.busy && !b.result;
  if(myTurn && !b.mode && b.moveMode && !(b.dazed && b.actionUsed)) moveSet = reachable(u, b.moveLeft);
  if(myTurn && b.mode && b.mode.key==="search"){ range = SEARCH_RANGE; searchTargets(u).forEach(p=>tgtSet.add(`${p.x},${p.y}`)); }
  else if(myTurn && b.mode && b.mode.key==="placeBarrel"){ range=1;for(let x=0;x<d.w;x++)for(let y=0;y<d.h;y++)if(placeableCell(worldActor(),x,y))tgtSet.add(`${x},${y}`); }
  else if(myTurn && b.mode && b.mode.key==="help"){ range = 1; helpList(u).forEach(p=>tgtSet.add(`${p.x},${p.y}`)); }
  else if(myTurn && b.mode && b.mode.key==="item"){ const it = u.items.find(i=>i.id===b.mode.item);
    if(it){ range = it.use.range; itemTargets(u, it).forEach(p=>tgtSet.add(`${p.x},${p.y}`)); } }
  else if(myTurn && b.mode && GEN_ACT[b.mode.key]){ range = 1; GEN_ACT[b.mode.key].targets(u).forEach(p=>tgtSet.add(`${p.x},${p.y}`)); }
  else if(myTurn && b.mode){
    const sk = unitSkills(u).find(s=>s.key===b.mode.key);
    if(!sk || !sk.impl){ b.mode=null; return boardMarkState(); }
    range = sk.impl.range ? sk.impl.range(u) : 1;
    // 點地板的招（範圍、錐形）：整個射程淡紅，點哪都行；點人的招：只有打得到的敵人亮紅
    const pickFloor = ["area","cone"].includes(sk.impl.target);
    for(let x=0;x<d.w;x++) for(let y=0;y<d.h;y++) if(validTarget(u,sk,x,y)) (pickFloor ? areaSet : tgtSet).add(`${x},${y}`);
  }
  return {b,d,u,moveSet,tgtSet,areaSet,range};
}

// 探索偵測格屬地板層；警示記號屬場景最上方 HUD。外觀暫定（GPT）。
function exploreWatchCells(){
 const b=B(),out=new Set();if(b.phase!=="explore"||!b.exploreSneak)return out;
 for(const e of b.units.filter(u=>u.side==="foe"&&!u.dead&&!u.down&&!u.fled&&!foeHid(u))){
  const range=ENEMIES[e.type].detectRange;
  for(let x=0;x<b.def.w;x++)for(let y=0;y<b.def.h;y++)if(dist(e,{x,y})<=range&&exploreSight(e,{x,y}))out.add(`${x},${y}`);
 }
 return out;
}
function exploreAlertSVG(v,x,y){const a=B().phase==="explore"&&B().exploreMarks?.[v.id];return a?`<g class="explore-alert" data-alert="${a}"><circle cx="${x}" cy="${y}" r="16" fill="${a===2?"#e35b52":"#e8c057"}" stroke="#292330" stroke-width="3"/><text x="${x}" y="${y+8}" text-anchor="middle" font-size="24" font-weight="bold" fill="#292330">!</text></g>`:"";}
function exploreDockHTML(){
 const b=B();if(b.exploreStopped)return dockWrap(exploreUnit(),b,"dk-pick",b.exploreStopReason==="trap"?EXPLORE_ACTION_TEXT.trapHit:EXPLORE_UI.found,`<p>${EXPLORE_UI.stopped}</p>${b.exploreStopReason==="trap"?`<button class="mn-b" data-explore-cmd="resume">${EXPLORE_ACTION_TEXT.resume}</button>`:""}`);
 if(b.exploreRest)return dockWrap(exploreUnit(),b,"dk-rest",EXPLORE_COMBAT.rest,restChoiceHTML(b)+`<button class="mn-b" data-explore-cmd="rest">${EXPLORE_ACTION_TEXT.close}</button>`);
 if(b.mode?.key==="placeBarrel")return dockWrap(exploreUnit(),b,"dk-pick",WORLD_OBJECT_TEXT.place,`<p>${WORLD_OBJECT_TEXT.placeHint}</p><button class="mn-b" data-explore-cmd="cancelPlace">${WORLD_OBJECT_TEXT.cancel}</button>`);
 const button=(cmd,text)=>`<button class="mn-b" data-explore-cmd="${cmd}" ${b.busy?"disabled":""}>${text}</button>`;
 if(b.exploreObject){const o=b.exploreObject;return dockWrap(exploreUnit(),b,"dk-pick",EXPLORE_OBJECTS[o.kind].name,EXPLORE_OBJECTS[o.kind].actions.map(c=>button(c,EXPLORE_ACTION_TEXT[c])).join("")+button("close",EXPLORE_ACTION_TEXT.close));}
 return dockWrap(exploreUnit(),b,"dk-pick",b.exploreSolo?EXPLORE_UI.individual:EXPLORE_UI.group,`${button("gather",EXPLORE_UI.gather)}${b.exploreSolo?button("leader",EXPLORE_UI.leader):""}${button("hide",b.exploreSneak?EXPLORE_UI.unsneak:EXPLORE_UI.sneak)}${powderCount(exploreUnit())?button("place",WORLD_OBJECT_TEXT.place+" ×"+powderCount(exploreUnit())):""}${button("combat",EXPLORE_UI.combat)}${button("rest",EXPLORE_COMBAT.rest)}`);
}
function boardFloorHTML(){
  const d=B().def, out=[];
  const isRoad=(x,y)=>d.road.some(r=>r[0]===x&&r[1]===y);
  const watch=exploreWatchCells();
  const tileFill = (x,y) => { if(watch.has(`${x},${y}`))return "#cbb668"; const road=isRoad(x,y), alt=(x+y)%2; return road ? (alt?"#d9c08e":"#d2b683") : (alt?"#8fb462":"#86ab5a"); };
  const raised = [];
  for(let s=0;s<d.w+d.h-1;s++) for(let x=0;x<d.w;x++){ const y=s-x; if(y<0||y>=d.h) continue;
    if(hAt(x,y) > 0){ raised.push({x,y}); continue; }
    const k=`${x},${y}`;
    out.push(`<polygon class="tile" data-tile="${k}" points="${diamond(x,y)}" fill="url(#mark-fill-${x}-${y}) ${tileFill(x,y)}" stroke="#5f8744" stroke-width="1"/>`);
  }
  const flat = out.join(""); out.length=0;
  // 凸起的格子：頂面（高亮、點擊都在這裡）＋朝畫面前方的兩面山壁（往下畫到前面那格的高度）
  const columnSVG = (x,y) => {
    const k=`${x},${y}`, p=iso(x,y), h=hAt(x,y), L=p.x-TW/2, R=p.x+TW/2, M=p.y+TH/2, Bt=p.y+TH;
    const dl = (h - hAt(x,y+1))*HZ, dr = (h - hAt(x+1,y))*HZ;   // 左前、右前那格比這格低多少
    const strata = (x1,y1,x2,y2,dd) => [1,2].filter(i=>i*HZ/2 < dd).map(i=>`<path d="M${x1} ${y1+i*HZ/2} L${x2} ${y2+i*HZ/2}" stroke="#5e4630" stroke-width="2" opacity=".55"/>`).join("");
    return `<g id="floor-wall-${x}-${y}" class="cliff">
      ${dl>0 ? `<polygon points="${L},${M} ${p.x},${Bt} ${p.x},${Bt+dl} ${L},${M+dl}" fill="#9a7650" stroke="#2a2630" stroke-width="2" stroke-linejoin="round"/>${strata(L,M,p.x,Bt,dl)}` : ""}
      ${dr>0 ? `<polygon points="${p.x},${Bt} ${R},${M} ${R},${M+dr} ${p.x},${Bt+dr}" fill="#7a5a3c" stroke="#2a2630" stroke-width="2" stroke-linejoin="round"/>${strata(p.x,Bt,R,M,dr)}` : ""}
      </g><polygon id="floor-top-${x}-${y}" class="tile" data-tile="${k}" points="${diamond(x,y)}" fill="url(#mark-fill-${x}-${y}) ${tileFill(x,y)}" stroke="#5f8744" stroke-width="1"/>`;
  };
  const columnDetailSVG = (x,y) => {
    const p=iso(x,y), h=hAt(x,y), L=p.x-TW/2, R=p.x+TW/2, M=p.y+TH/2, Bt=p.y+TH;
    return `<g>
      <polygon points="${diamond(x,y)}" fill="#fffbe8" opacity="${Math.min(.24, h*.08)}" pointer-events="none"/>
      ${[[hAt(x-1,y),L,M,p.x,p.y],[hAt(x,y-1),p.x,p.y,R,M],[hAt(x+1,y),R,M,p.x,Bt],[hAt(x,y+1),p.x,Bt,L,M]]
        .filter(e=>e[0]<h).map(e=>`<path d="M${e[1]} ${e[2]} L${e[3]} ${e[4]}" stroke="#2a2630" stroke-width="2" stroke-linecap="round" pointer-events="none"/>`).join("")}
      </g>`;
  };
  return `<g id="floor-flat">${flat}</g><defs>` + raised.map(({x,y})=>`<g id="floor-${x}-${y}">${columnSVG(x,y)}</g><g id="floor-detail-${x}-${y}">${columnDetailSVG(x,y)}</g>`).join("")+`</defs>`;
}

function raisedTiles(){
  const d=B().def, out=[];
  for(let s=0;s<d.w+d.h-1;s++) for(let x=0;x<d.w;x++){ const y=s-x; if(y>=0 && y<d.h && hAt(x,y)>0) out.push({x,y}); }
  return out;
}
function boardMarksHTML(ctx=boardMarkState()){
  const {b,d,u,moveSet,tgtSet,areaSet,range}=ctx;
  const tileCls=k=>tgtSet.has(k)?"tg":areaSet.has(k)?"ar":moveSet.has(k)?"mv":"";
  // 標示層的 paint server 替原有格子填色，不疊第二片半透明地板。
  // 保留單一 polygon 的幾何與描邊；瀏覽器填色捨入差異見驗收紀錄。
  const polygons=[], paints=[];
  const keys=new Set([...moveSet.keys(),...tgtSet,...areaSet]);
  keys.forEach(k=>{ const cls=tileCls(k), [x,y]=k.split(",").map(Number);
    paints.push(`<linearGradient id="mark-fill-${x}-${y}"><stop stop-color="${cls==="mv"?"#7fb4e8":"#e0766e"}" stop-opacity="${cls==="mv"?.85:cls==="tg"?.9:.35}"/></linearGradient>`);
  });
  if(range>=0) polygons.push(rangeOutline(u,range));
  const out=[];
  // 瞄準時：可以打的敵人旁邊標出夾擊／掩護／草叢（夾擊只算武器近戰：拿彈藥武器、用法器施法都不算）
  const skNow = b.mode && b.mode.key!=="item" && unitSkills(u).find(s=>s.key===b.mode.key);
  const meleeSk = skNow && !isRanged(u) && !skNow.group.weapons.some(n=>(ITEMS.find(i=>i.n===n)||{}).type==="focus");
  if(range>=0 && skNow) tgtSet.forEach(k=>{
    const [x,y] = k.split(",").map(Number), t = unitAt(x,y); if(!t || t.side===u.side) return;
    const cov = coverOf(u, t), far = dist(u,t) > reachOf(u);
    const tags = [meleeSk && flankMate(u, t) ? "夾擊 優勢" : "", coverAC(cov) ? `掩護 +${coverAC(cov)}` : "", far && hidden(t) ? "草叢 劣勢" : ""].filter(Boolean);
    if(!tags.length) return;
    const p = iso(x,y), cx = p.x, cy = p.y + TH/2 + 22, w = tags.join("・").length*19 + 20;
    out.push(`<g class="cov-tag"><rect x="${cx-w/2}" y="${cy-16}" width="${w}" height="32" rx="16" fill="#1f1a24" stroke="#ff8a7a" stroke-width="2.5"/>
      <text x="${cx}" y="${cy+6}" text-anchor="middle">${tags.join("・")}</text></g>`);
  });
  return `<defs>${paints.join("")}<g id="mark-tags">${out.join("")}</g></defs><g id="mark-flat">${polygons.join("")}</g>`;
}
// 地板、標示各有獨立 DOM。標示的 paint server 只換格子的填色；
// 場景以原生 SVG use 引用台地，保留山壁與角色的斜角前後遮擋。
function boardTerrainKey(){
 const b=B(),d=b.def,watch=b.phase==="explore"&&b.exploreSneak;
 // 所有可見敵人的偵測範圍依位置、存活／隱藏、視線及光照更新；不依選取，也不跟我方逐幀重畫。
 return JSON.stringify([d.w,d.h,d.road,d.elev,[...(d._h||[])],b.phase,b.exploreSneak,
  watch?[d.lighting,d.blocks.map(o=>[o.x,o.y,o.kind]),b.units.filter(u=>u.side==="foe").map(u=>[u.id,u.type,u.x,u.y,u.dead,u.down,u.fled,foeHid(u),u.scores,u.mods,u.learned,u.activeSkills,u.passiveSkills,ENEMIES[u.type].detectRange])]:null]);
}
function updateBoardFloor(){
  const layer=document.getElementById("board-floor"); if(!layer) return;
  layer.innerHTML=boardFloorHTML();
  layer.terrainKey=boardTerrainKey();
}
function updateBoardMarks(){
  const layer=document.getElementById("board-marks"); if(layer) layer.innerHTML=boardMarksHTML();
}
// 物件、棋子、當前腳下光與演出共用排序；移動時只更新此層。
function updateBoardScene(){
  const layer=document.getElementById("board-scene"); if(layer) layer.innerHTML=boardSceneHTML();
}
function syncBoardCamera(){
  const svg=document.querySelector(".board"), b=B(); if(!svg) return;
  const raw=boardRaw(); svg.setAttribute("viewBox",`0 0 ${raw.w} ${raw.h}`);
  svg.classList.toggle("crit-zoom",!!b.critOn);
  if(b.critOn){ const p=iso(b.critOn.x,b.critOn.y), z=camZoom(); svg.style.setProperty("--cx",`${(b.cam||{x:0}).x}px`); svg.style.setProperty("--cy",`${(b.cam||{y:0}).y}px`); svg.style.transformOrigin=`${p.x*z}px ${(p.y+TH/2-50)*z}px`; }
  else { svg.style.transformOrigin=""; svg.style.removeProperty("--cx"); svg.style.removeProperty("--cy"); }
}
// 動作（揮砍、受傷、倒地……）有開始時間：先擲骰、0.65 秒後才揮。畫的時候還沒開始的，
// 約好在開始那一刻再更新一次場景層，不然要等到下一次有人重畫才看得到（多半已經演完了）
let sceneWake=null;
function wakeSceneAt(b){
  const now=Date.now(), times=[...b.units.flatMap(v=>[v.anim?.t,...v.statuses.map(s=>s.visualAt)]),
    ...Object.values(b.groundEffects||{}).map(f=>f.visualAt),...(b.fx||[]).map(f=>f.t),...(b.proj||[]).flatMap(p=>[p.t,p.t+p.dur])];
  const next=Math.min(...times.filter(t=>t>now));
  clearTimeout(sceneWake); sceneWake=null;
  if(next<Infinity) sceneWake=setTimeout(()=>{ sceneWake=null; if(B()===b) refreshBattle(); }, next-now+5);
}
function boardSceneHTML(ctx={b:B(),d:B().def,u:cur()}){
  const {b,d,u}=ctx, out=[], raised=raisedTiles();
  wakeSceneAt(b);
  const nowOn=b.phase!=="explore" && u && !b.result && !u.dead && !u.down && !foeHid(u)?u:null;
  const glow=nowOn?`<polygon class="tile-now" points="${diamond(nowOn.x,nowOn.y)}"/>`:"";
  if(nowOn && hAt(nowOn.x,nowOn.y)===0) out.push(glow);
  // 物件與棋子，依前後順序畫
  const things = [];
  // 地形柱排在同一格的物件、角色前面（s 比較小），比牠後面的角色晚畫，所以會擋住後面的人
  raised.forEach(({x,y})=>{
    things.push({s:x+y-.1, svg:`<g><use href="#floor-wall-${x}-${y}"/><use href="#floor-top-${x}-${y}" data-tile="${x},${y}"/><use href="#floor-detail-${x}-${y}" pointer-events="none"/>${nowOn && nowOn.x===x && nowOn.y===y ? glow : ""}</g>`}); });
  (b.drops||[]).forEach(dp=> things.push({s:dp.x+dp.y+.2, svg:dropSVG(dp)}));
  Object.values(b.groundEffects||{}).forEach(f=>things.push({s:f.x+f.y+(f.kind==="fire"?.7:.1),svg:groundEffectSVG(f)}));
  d.blocks.forEach(o=>{const svg=blockSVG(o);if(svg)things.push({s:o.x+o.y + (o.kind==="bush" ? .6 : o.kind==="oil" ? .65 : 0), svg:`<g data-tile="${o.x},${o.y}" ${EXPLORE_OBJECTS[o.kind]&&!(o.kind==="trap"&&(!o.found||o.disarmed))?`data-world-object="${o.x},${o.y}"`:""}>${svg}</g>`});});
  const now = Date.now();
  // 剛被打倒的敵人多留一下，播完倒下動畫才消失
  // 躲著的敵人不畫（玩家不知道牠在哪）
  const shown = b.units.filter(v=>!v.fled&&(!v.dead || now - v.deadAt < 900) && !foeHid(v));
  shown.forEach(v=> things.push({s:v.x+v.y+.5, svg:tokenSVG(v, v===u), unit:v}));
  things.sort((a,c)=>a.s-c.s).forEach(t=>out.push(t.svg));
  // 血條、狀態圖示一律畫在最上層（大爺 10-03：拿掉被擋住時的剪影外框，被擋住就點血條）：
  // 樹、篷車、前面的人擋住角色時，血條還浮在上面，看得到也點得到（data-tile，瞄準時點它＝選那一隻）
  shown.filter(v=>!v.dead).sort((a,c)=>(a.x+a.y)-(c.x+c.y)).forEach(v=>out.push(hudSVG(v)));
  out.push(`<use href="#mark-tags"/>`);
  // 飛行物（出手時才出現，飛到目標消失）
  b.proj = (b.proj||[]).filter(pj=>now < pj.t + pj.dur + 80);
  b.proj.forEach(pj=>out.push(`<g data-exp="${pj.t+pj.dur+80}">${projSVG(pj, now)}</g>`));
  // 打中特效（在打中的時間點才出現）
  b.fx = (b.fx||[]).filter(f=>now-f.t<(f.dur||700));
  b.fx.forEach(f=>{ const p=iso(f.x,f.y), d=f.dur||700;
    // 槍口白煙：畫在槍口（跟飛行物出手的位置一樣），往面向的方向飄
    if(f.kind==="smoke") out.push(`<g data-exp="${f.t+d}">${smokeSVG(p.x + f.face*30, p.y+TH/2-66, f.face, now-f.t)}</g>`);
    else if(f.kind==="aim") out.push(`<g data-exp="${f.t+d}">${aimSVG(p.x, p.y+TH/2-54, now-f.t, d)}</g>`);
    else out.push(`<g data-exp="${f.t+d}">${fxSVG(f.kind, p.x, p.y+TH/2-54, now-f.t)}</g>`); });
  // 飄字
  b.floats = (b.floats||[]).filter(f=>now-f.t<1100);
  b.floats.forEach(f=>{ const p=iso(f.x,f.y);
    out.push(`<text class="float ${f.cls}" data-exp="${f.t+1100}" x="${p.x}" y="${p.y+TH/2-146}" text-anchor="middle" style="animation-delay:${f.t-now}ms">${f.text}</text>`); });
  // 被動觀察符號
  b.marks = (b.marks||[]).filter(m=>now < m.t + m.dur);
  b.marks.forEach(m=>{ const v = b.units.find(u=>u.id===m.id); if(v && !v.dead) out.push(obsMarkSVG(v, m, now)); });
  // 戰鬥台詞：頭上的氣泡框
  b.bubbles = (b.bubbles||[]).filter(x=>now < x.t + x.dur);
  b.bubbles.forEach(x=>{ const v = b.units.find(u=>u.id===x.id); if(v && !foeHid(v)) out.push(bubbleSVG(v, x, now)); });
  out.push(worldObjectTipSVG());
  return out.join("");
}

function worldObjectTipSVG(){
 const b=B(),key=b.objectTip;if(!key)return "";const [x,y]=key.split(",").map(Number),o=exploreObjectAt(x,y);if(!o)return "";
 const z=camZoom(),p=iso(x,y),r=document.querySelector(".board-wrap")?.getBoundingClientRect(),w=300,lines=objectTipLines(o),h=42+lines.length*19;
 const px=Math.max(-b.cam.x/z+6/z,Math.min(p.x-w/2/z,((r?.width||390)-b.cam.x-w-6)/z)),dock=document.querySelector(".bt-dock")?.getBoundingClientRect();
 const dockLimit=dock&&r?(dock.top-r.top-b.cam.y-h-14)/z:Infinity,py=Math.max(-b.cam.y/z+6/z,Math.min(p.y-70-h/z,dockLimit));
 return `<g class="world-object-tip" role="tooltip" pointer-events="none" transform="translate(${px} ${py}) scale(${1/z})"><path d="M140 ${h-2} l10 12 10-12" fill="#fff6df" stroke="#292330" stroke-width="3"/><rect width="${w}" height="${h}" rx="14" fill="#fff6df" stroke="#292330" stroke-width="3"/><text x="14" y="24" fill="#292330" font-size="15" font-weight="bold">${EXPLORE_OBJECTS[o.kind].name}</text>${lines.map((s,i)=>`<text x="14" y="${45+i*19}" fill="#292330" font-size="12">${s}</text>`).join("")}</g>`;
}

function boardSVG(){
  const b=B(), d=b.def, W=(d.w+d.h)*TW/2, H=(d.w+d.h)*TH/2+150;
  const ctx=boardMarkState();
  const out=[`<g id="board-floor">${boardFloorHTML()}</g><g id="board-marks">${boardMarksHTML(ctx)}</g><g id="board-scene">${boardSceneHTML(ctx)}</g>`];

  const z = camZoom(), c = b.cam || {x:0, y:0};
  if(b.critOn){   // 爆擊：以目標為中心拉近
    const p = iso(b.critOn.x, b.critOn.y);
    return `<svg class="board crit-zoom" viewBox="0 0 ${W} ${H}" width="${Math.round(W*z)}" height="${Math.round(H*z)}" style="--cx:${c.x}px;--cy:${c.y}px;transform:translate(${c.x}px,${c.y}px);transform-origin:${p.x*z}px ${(p.y+TH/2-50)*z}px" xmlns="http://www.w3.org/2000/svg">${out.join("")}</svg>`;
  }
  return `<svg class="board" viewBox="0 0 ${W} ${H}" width="${Math.round(W*z)}" height="${Math.round(H*z)}" style="transform:translate(${c.x}px,${c.y}px)" xmlns="http://www.w3.org/2000/svg">${out.join("")}</svg>`;
}

/* ---------- 鏡頭：拖曳平移＋縮放（滑鼠、觸控共用 Pointer Events） ----------
   單指／滑鼠按下後移動超過 DRAG_TOL 像素就算拖曳，沒超過就當成點格子。
   縮放：桌機滾輪（以游標為中心），手機兩指張開／合起（以兩指中點為中心）。
   鏡頭位置 B().cam、縮放 B().zoom 存在戰鬥狀態裡，重畫時沿用。 */
const DRAG_TOL = 6, ZOOM_MIN = .35, ZOOM_MAX = 1.5;
const zoomDefault = () => window.innerWidth < 560 ? .45 : .6;
const camZoom = () => (B() && B().zoom) || zoomDefault();
/* 頭上提示（狀態圖示、台詞氣泡、觀察符號）的縮放（大爺 2026-10-01：縮小地圖時太大）
   跟著地圖一起縮放，在預設縮放時跟以前一樣大；地圖縮小時跟著縮，但畫面上最小保留原本的 60%，才看得清楚 */
const OVERLAY_MIN = .6;
const overlayK = () => Math.max(1 / zoomDefault(), OVERLAY_MIN / camZoom());
/* 狀態圖示另外算（大爺 10-02：太大）：預設縮放時是原本的 70%；拉遠跟著地圖變小，拉近時停在預設那麼大、不再放大 */
const BADGE_SCALE = .7;
const badgeK = () => BADGE_SCALE * Math.min(1 / zoomDefault(), 1 / camZoom());
const clampZoom = z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
const boardRaw = () => { const d=B().def; return {w:(d.w+d.h)*TW/2, h:(d.w+d.h)*TH/2+150}; };
function boardSize(){ const r=boardRaw(), z=camZoom(); return {w:r.w*z, h:r.h*z}; }
function clampCam(c){
  const wrap = document.querySelector(".board-wrap"); if(!wrap) return c;
  const vw = wrap.clientWidth, vh = wrap.clientHeight, s = boardSize();
  const mx = Math.min(90, vw*.15), my = Math.min(90, vh*.15);    // 地圖邊緣最多拉進畫面一點點，不會露出一大片空白
  const lim = (v, view, size, m) => size + 2*m <= view ? (view-size)/2 : Math.min(m, Math.max(view-size-m, v));
  return {x:lim(c.x, vw, s.w, mx), y:lim(c.y, vh, s.h, my)};
}
function applyCam(glide){
  const svg = document.querySelector(".board"), b = B(); if(!svg || !b.cam) return;
  const s = boardSize();
  svg.setAttribute("width", Math.round(s.w)); svg.setAttribute("height", Math.round(s.h));
  svg.style.transition = glide ? "transform .35s ease" : "";
  svg.style.transform = `translate(${b.cam.x}px,${b.cam.y}px)`;
  placeOverlays(glide);
}
// 選單、狀態卡貼在角色旁邊（窄螢幕由 CSS 固定在戰場底部）
function placeOverlays(glide){
  const wrap = document.querySelector(".board-wrap"); if(!wrap) return;
  const narrow = window.innerWidth < 560, z = camZoom(), c = B().cam;
  wrap.querySelectorAll(".bt-ov[data-anchor]").forEach(el=>{
    if(narrow){ el.style.left = el.style.top = ""; return; }
    const v = B().units.find(x=>x.id===el.dataset.anchor); if(!v) return;
    if(el.classList.contains("gear-info")){
      const r=el.getBoundingClientRect();
      const w=r.width,h=r.height,W=wrap.clientWidth,H=wrap.clientHeight;
      const left=Math.max(12,Math.min(W-w-12,Math.round(W*.12)));
      const top=Math.max(8,Math.min(H-h-8,Math.round((H-h)/2)));
      el.style.transition=glide?"left .25s ease, top .25s ease":"";
      el.style.left=left+"px"; el.style.top=top+"px";
      return;
    }
    const p = iso(v.x, v.y), ux = c.x + p.x*z, uy = c.y + (p.y+TH/2)*z;
    const w = el.offsetWidth, h = el.offsetHeight, W = wrap.clientWidth, H = wrap.clientHeight, gap = 44*z + 12;
    let left = ux + gap; if(left + w > W - 8) left = ux - gap - w;       // 右邊放不下就放左邊
    left = Math.max(8, Math.min(W - w - 8, left));
    const top = Math.max(8, Math.min(H - h - 8, uy - 60*z - h/2));
    el.style.transition = glide ? "left .35s ease, top .35s ease" : "";
    el.style.left = left + "px"; el.style.top = top + "px";
  });
}
// 把某個格子（可給小數）移到畫面中央
function centerCam(x, y, glide){
  const wrap = document.querySelector(".board-wrap"); if(!wrap) return;
  const p = iso(x, y), z = camZoom();
  B().cam = clampCam({x: wrap.clientWidth/2 - p.x*z, y: wrap.clientHeight/2 - (p.y+TH/2-40)*z});
  applyCam(glide);
}
// 攻擊時鏡頭（大爺 10-02）：攻擊者或目標不在畫面裡，就滑到兩隻的中間點；兩隻都看得到就不動，免得每次攻擊都晃
// 手指按著地圖時不搶鏡頭；目標躲著（我方看不到）也不跟。爆擊另外由 critMoment 以目標為中心拉近
function camOnAttack(a, t){
  if(!a || !t || t===a || t.x===undefined || touches.size) return;
  if(t.side && foeHid(t)) return;
  if(onScreen(a) && onScreen(t)) return;
  centerCam((a.x+t.x)/2, (a.y+t.y)/2 - 1, true);
}
// 角色整隻（含頭頂血條）有沒有在畫面裡，邊緣留一點空間
function onScreen(v){
  const wrap = document.querySelector(".board-wrap"); if(!wrap) return true;
  const p = iso(v.x, v.y), z = camZoom(), c = B().cam, m = 24;
  const x = c.x + p.x*z, top = c.y + (p.y+TH/2-130)*z, bot = c.y + (p.y+TH/2)*z;
  return x > m && x < wrap.clientWidth - m && top > m && bot < wrap.clientHeight - m;
}
// 以畫面上某一點（相對戰場視窗的座標）為中心縮放
function zoomAt(z, px, py){
  const b = B(), f = {z:camZoom(), cam:b.cam};
  const nz = clampZoom(z);
  const bx = (px - f.cam.x)/f.z, by = (py - f.cam.y)/f.z;   // 這點在地圖上的原始座標
  b.zoom = nz;
  b.cam = clampCam({x: px - bx*nz, y: py - by*nz});
  applyCam();
}

const touches = new Map();   // pointerId → {x,y}
let drag = null, pinch = null;
// 特效到期就從畫面移除（不靠 CSS 動畫最後一格變透明：減少動態效果、背景分頁時動畫可能不會播完）
function sweepFx(){
  const now = Date.now();
  document.querySelectorAll(".board [data-exp]").forEach(e=>{ if(+e.dataset.exp < now) e.remove(); });
}
function wrapXY(e){ const r = document.querySelector(".board-wrap").getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; }
function startPinch(){
  const [p1, p2] = [...touches.values()];
  pinch = {d:Math.hypot(p1.x-p2.x, p1.y-p2.y) || 1, mx:(p1.x+p2.x)/2, my:(p1.y+p2.y)/2, z:camZoom(), cam:{...B().cam}};
}
function initBoardDrag(){
  if(initBoardDrag.done) return; initBoardDrag.done = true;
  setInterval(()=>{ sweepFx(); refreshLogStrip(); }, 100);
  let objectHold=null;const clearHold=()=>{clearTimeout(objectHold);objectHold=null;};
  const tip=key=>{if(B()&&B().objectTip!==key){B().objectTip=key;refreshBattle();}};
  window.addEventListener("pointermove",e=>{if(e.pointerType==="mouse"&&!touches.size)tip(e.target.closest?.("[data-world-object]")?.dataset.worldObject||null);});
  window.addEventListener("blur",()=>{clearHold();tip(null);});
  window.addEventListener("pointerdown", e=>{
    const wrap = e.target.closest && e.target.closest(".board-wrap");
    if(!wrap || !B() || e.target.closest(".bt-ov, .bt-logstrip, .tut") || (e.pointerType==="mouse" && e.button!==0)) return;
    // 第一根手指放下＝前面的手指一定都離開了。畫面重畫時手指按著的元素會被換掉，
    // 手機（尤其 iPhone）之後的放開事件送不到 window，留下「幽靈手指」讓下一次單指拖曳變成縮放
    if(e.isPrimary && (touches.size || pinch || drag)){ touches.clear(); pinch = null; drag = null; document.body.classList.remove("board-dragging"); }
    clearHold();tip(null);
    touches.set(e.pointerId, wrapXY(e));
    if(touches.size===2){ drag = null; startPinch(); return; }     // 第二根手指放下 → 改成縮放，不算點格子
    if(touches.size>2) return;
    const t = e.target.closest("[data-tile]");
    drag = {id:e.pointerId, sx:e.clientX, sy:e.clientY, c:{...(B().cam||{x:0,y:0})}, moved:false, unit:e.target.closest("[data-explore-body]")?.dataset.exploreBody, tile:t && t.dataset.tile};
    const key=e.target.closest("[data-world-object]")?.dataset.worldObject,b=B(),d=drag;
    if(e.pointerType!=="mouse"&&key)objectHold=setTimeout(()=>{if(B()===b&&drag===d&&!d.moved&&touches.size===1){d.held=true;tip(key);}},450);
  });
  window.addEventListener("pointermove", e=>{
    if(!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, wrapXY(e));
    if(pinch && touches.size>=2){
      const [p1, p2] = [...touches.values()];
      const d = Math.hypot(p1.x-p2.x, p1.y-p2.y), mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2;
      // 兩指剛放下時中點底下的那塊地圖，永遠跟著兩指中點走（同時縮放＋平移）
      const b = B(), nz = clampZoom(pinch.z*d/pinch.d);
      const bx = (pinch.mx - pinch.cam.x)/pinch.z, by = (pinch.my - pinch.cam.y)/pinch.z;
      b.zoom = nz; b.cam = clampCam({x: mx - bx*nz, y: my - by*nz}); applyCam();
      e.preventDefault(); return;
    }
    if(!drag || e.pointerId!==drag.id) return;
    const dx = e.clientX-drag.sx, dy = e.clientY-drag.sy;
    if(!drag.moved && Math.hypot(dx,dy) > DRAG_TOL){ clearHold();tip(null);drag.moved = true; document.body.classList.add("board-dragging"); }
    if(drag.moved){ B().cam = clampCam({x:drag.c.x+dx, y:drag.c.y+dy}); applyCam(); e.preventDefault(); }
  }, {passive:false});
  const up = e=>{
    if(!touches.has(e.pointerId)) return;
    touches.delete(e.pointerId);
    if(pinch){
      if(touches.size<2){ pinch = null;
        // 放開一指後，剩下那指接著拖（不會誤點）
        const rest = [...touches.entries()][0];
        if(rest){ const r = document.querySelector(".board-wrap").getBoundingClientRect();
          drag = {id:rest[0], sx:rest[1].x+r.left, sy:rest[1].y+r.top, c:{...B().cam}, moved:true, tile:null}; }
        else { drag = null; document.body.classList.remove("board-dragging"); }
      } else startPinch();
      return;
    }
    if(!drag || e.pointerId!==drag.id) return;
    const d = drag;clearHold();if(d.held){tip(null);ghostUntil=Date.now()+400;} drag = null; document.body.classList.remove("board-dragging");
    if(e.type==="pointerup" && !d.moved && !d.held && d.tile){
      if(e.pointerType!=="mouse") ghostUntil = Date.now() + 400;
      const [x,y] = d.tile.split(",").map(Number);
      if(B().phase==="explore" && d.unit){
        if(!B().busy&&!B().exploreStopped){B().info=B().info===d.unit?null:d.unit;refreshBattle();}
      }else if(B().phase==="explore" && !unitAt(x,y) && !exploreObjectAt(x,y)){
        const q=wrapXY(e),b=B(),z=camZoom(),sx=((q.x-b.cam.x)/z-b.def.h*TW/2)/(TW/2),sy=((q.y-b.cam.y)/z-130-TH/2+hAt(x,y)*HZ)/(TH/2);
        const px=(sx+sy)/2,py=(sy-sx)/2;
        exploreClick(Math.max(x-.45,Math.min(x+.45,px)),Math.max(y-.45,Math.min(y+.45,py)));
      }else clickTile(x,y);
    }
  };
  // 手機點格子：放開手指時選單就畫出來了，瀏覽器接著補發的 click 會重新找手指底下的元素，
  // 剛好落在新冒出來的選單按鈕上（一次點擊按到兩下）。這一下吃掉，只吃選單上的、只吃一次
  let ghostUntil = 0;
  window.addEventListener("click", e=>{
    if(Date.now() > ghostUntil) return;
    ghostUntil = 0;
    if(e.target.closest && e.target.closest(".bt-ov")){ e.preventDefault(); e.stopPropagation(); }
  }, true);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  // 滾輪縮放（以游標為中心）；在戰場上滾輪不捲頁面
  window.addEventListener("wheel", e=>{
    const wrap = e.target.closest && e.target.closest(".board-wrap");
    if(!wrap || !B() || e.target.closest(".bt-ov, .bt-logstrip, .tut")) return;
    e.preventDefault();
    const dy = e.deltaMode===1 ? e.deltaY*16 : e.deltaY;
    const p = wrapXY(e);
    zoomAt(camZoom()*Math.exp(-dy*.0015), p.x, p.y);
  }, {passive:false});
  window.addEventListener("resize", ()=>{ if(B() && document.querySelector(".board-wrap")){ refreshBattle(); } });
}

// 掉在地上的武器：用拿在手上的同一張圖，躺在地上；剛被打飛時從原主身上拋過來
function dropSVG(dp){
  const p = iso(dp.x, dp.y), cx = p.x, cy = p.y + TH/2;
  const h = HELD[dp.group] || {}, s = (h.s ?? .4) * 1.1, gx = h.gx ?? 60, gy = h.gy ?? 90;
  const art = ITEM_RAW[dp.group] || "";
  const f = iso(dp.fx, dp.fy), sx = f.x - cx, sy = (f.y + TH/2 - 60) - cy;
  const el = Date.now() - dp.t, flying = el < 550;
  const st = flying ? `style="--sx:${sx}px;--sy:${sy}px;animation-delay:${-el}ms"` : "";
  return `<g class="drop ${flying?"flying":""}" ${st}>
    <ellipse cx="${cx}" cy="${cy+2}" rx="26" ry="9" fill="#000" opacity=".22"/>
    <g class="drop-glint"><ellipse cx="${cx}" cy="${cy}" rx="30" ry="12" fill="none" stroke="#f2b441" stroke-width="2" opacity=".7"/></g>
    <g transform="translate(${cx} ${cy-4}) rotate(-62) scale(${s}) translate(${-gx} ${-gy})">${art}</g>
  </g>`;
}

function rangeOutline(u, r){
  const d = B().def, inR = (x,y) => Math.max(Math.abs(x-u.x), Math.abs(y-u.y)) <= r;
  const inMap = (x,y) => x>=0 && y>=0 && x<d.w && y<d.h;
  const segs = [];
  for(let x=Math.max(0,u.x-r); x<=Math.min(d.w-1,u.x+r); x++) for(let y=Math.max(0,u.y-r); y<=Math.min(d.h-1,u.y+r); y++){
    const p = iso(x,y), T=[p.x,p.y], R=[p.x+TW/2,p.y+TH/2], Bm=[p.x,p.y+TH], L=[p.x-TW/2,p.y+TH/2];
    // 四個鄰格：在地圖內但超出射程 → 這條邊是射程邊界
    [[1,0,R,Bm],[-1,0,T,L],[0,1,Bm,L],[0,-1,T,R]].forEach(([dx,dy,a,c])=>{
      if(inMap(x+dx,y+dy) && !inR(x+dx,y+dy)) segs.push(`M${a[0]} ${a[1]} L${c[0]} ${c[1]}`);
    });
  }
  if(!segs.length) return "";
  const path = segs.join(" ");
  return `<g class="range-line"><path d="${path}" stroke="#2a2630" stroke-width="8" stroke-linecap="round" fill="none" opacity=".45"/>
    <path d="${path}" stroke="#ff8a7a" stroke-width="4" stroke-linecap="round" fill="none"/></g>`;
}

// 被動觀察符號：白色泡泡框，錨點跟台詞氣泡框一樣在頭上；大小見 overlayK
// 泡泡框＋符號本體（原點＝尾巴尖端），戰場和劇情共用；d＝動畫延遲（負數＝已經播了多久）
function obsBubbleBody(kind, d){
  const w = 42, h = 38, L = -w/2, T = -h - 9;   // 所有符號同一個泡泡框大小
  const bubble = `<path d="M${L+10} ${T} H${-L-10} Q${-L} ${T} ${-L} ${T+10} V${T+h-10} Q${-L} ${T+h} ${-L-10} ${T+h} H7 L0 ${T+h+9} L-7 ${T+h} H${L+10} Q${L} ${T+h} ${L} ${T+h-10} V${T+10} Q${L} ${T} ${L+10} ${T} Z"
      fill="#fff" stroke="#2a2630" stroke-width="2.5" stroke-linejoin="round"/>`;
  let inner;
  if(kind==="ok") inner = `<text x="0" y="${T+h/2+11}" text-anchor="middle" class="obs-glyph" fill="#e0453a">!</text>`;
  else if(kind==="fail" || kind==="sneak") inner = `<text x="0" y="${T+h/2+11}" text-anchor="middle" class="obs-glyph" fill="#3d7fd9">?</text>`;
  // 漫畫符號（大爺 10-03：商人、躲著的薩滿等沒有表情圖的用；外觀、顏色、時間都暫定）
  else if(kind==="sweat") inner = `<g class="obs-drip"><path d="M2 ${T+6} Q9.5 ${T+16} 8 ${T+21} A6.5 6.5 0 1 1 -4.6 ${T+20.5} Q-4 ${T+15} 2 ${T+6} Z" fill="#7cc4f2" stroke="#2a2630" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-1.5 ${T+18} Q-1.5 ${T+23} 1.5 ${T+24.5}" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></g>`;
  else if(kind==="shake") inner = [[-1,5],[-1,11],[1,5],[1,11]].map(([sx,x])=>`<path d="M${sx*x} ${T+10} Q${sx*(x+5)} ${T+19} ${sx*x} ${T+28}" stroke="#1f1a24" stroke-width="2.6" stroke-linecap="round" fill="none"/>`).join("");
  else if(kind==="anger") inner = `<g class="obs-vein">${[0,90,180,270].map(r=>`<path d="M3 -11 Q3 -3 11 -3" transform="translate(0 ${T+h/2}) rotate(${r})" stroke="#e0453a" stroke-width="3.6" stroke-linecap="round" fill="none"/>`).join("")}</g>`;
  else if(kind==="note") inner = `<g class="obs-float"><ellipse cx="-4" cy="${T+28}" rx="5.6" ry="4.2" transform="rotate(-20 -4 ${T+28})" fill="#e0862a" stroke="#2a2630" stroke-width="1.6"/>
      <path d="M1.4 ${T+27} V${T+7} Q10 ${T+10} 9 ${T+18}" stroke="#2a2630" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`;
  else inner = [-11,0,11].map((x,i)=>`<circle class="obs-dot" cx="${x}" cy="${T+h/2}" r="3.5" fill="#1f1a24" style="animation-delay:${d + 350 + i*420}ms"/>`).join("");
  return `<g class="obs-life" style="animation-delay:${d}ms;--dur:${OBS_DUR[kind]}ms"><g class="obs-anim" style="animation-delay:${d}ms;--dur:${OBS_DUR[kind]}ms">${bubble}${inner}</g></g>`;
}
// 戰場用：錨在角色頭上
function obsMarkSVG(v, m, now){
  const p = iso(v.x, v.y), ax = p.x, ay = p.y + TH/2 - ((v.down || has(v,"prone")) ? 66 : 134) - (hasBadge(v) ? 38*badgeK() : 0);
  return `<g class="obs obs-${m.kind}" transform="translate(${ax} ${ay}) scale(${overlayK().toFixed(3)})" data-exp="${m.t + m.dur}">${obsBubbleBody(m.kind, m.t - now)}</g>`;
}
// 畫面上一般的 HTML 用（劇情的卡片）：一個獨立的小 svg
// delay：幾毫秒後才開始演（劇情裡先讓骰子停一下）
const obsBubbleHTML = (kind, delay=0) => `<svg class="obs obs-${kind}" viewBox="-22 -48 44 50" aria-hidden="true">${obsBubbleBody(kind, delay)}</svg>`;

// 台詞氣泡框：錨在角色頭上（血條上方）；大小見 overlayK（跟著地圖縮放，有最小尺寸）
function bubbleSVG(v, x, now){
  const p = iso(v.x, v.y), ax = p.x, ay = p.y + TH/2 - ((v.down || has(v,"prone")) ? 66 : 134) - (hasBadge(v) ? 38*badgeK() : 0);
  const k = overlayK(), text = String(x.text).replace(/[<>&]/g, ""), sub = String(x.sub||"").replace(/[<>&]/g, "");
  const w = Math.max(64, [...text].length*16 + 24, [...sub].length*11 + 20), h = sub ? 50 : 34;
  const L = -w/2, T = -h - 10;
  return `<g transform="translate(${ax} ${ay}) scale(${k.toFixed(3)})" data-exp="${x.t + x.dur}"><g class="bark" style="animation-delay:${x.t-now}ms;--dur:${x.dur}ms">
    <path d="M${L+10} ${T} H${-L-10} Q${-L} ${T} ${-L} ${T+10} V${T+h-10} Q${-L} ${T+h} ${-L-10} ${T+h} H8 L0 ${T+h+10} L-8 ${T+h} H${L+10} Q${L} ${T+h} ${L} ${T+h-10} V${T+10} Q${L} ${T} ${L+10} ${T} Z"
      fill="#fffbe8" stroke="#2a2630" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="0" y="${T+23}" text-anchor="middle" class="bark-t">${text}</text>
    ${sub ? `<text x="0" y="${T+41}" text-anchor="middle" class="bark-s">${sub}</text>` : ""}</g></g>`;
}

/* 投擲物的樣子（大爺 2026-10-01：原本不管丟什麼都是小刀）
   道具看 item.proj；投擲武器用那把武器所屬技能組的圖（ITEM_RAW，跟裝備圖示同一套）。軌跡一律直線、本身旋轉 */
const projArtKey = it => !it ? null : (it.proj || (groupOf(it) || {}).id || null);
const PROJ_ART = {
  flask_fire: `<path d="M-3 -16 H3 V-9 Q11 -5 11 3 Q11 13 0 13 Q-11 13 -11 3 Q-11 -5 -3 -9 Z" fill="#f6e9d8" stroke="#2a2630" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M-9 2 Q0 -2 9 2 Q9 11 0 11 Q-9 11 -9 2 Z" fill="#f0862c"/><circle cx="-3" cy="5" r="2" fill="#ffd27a"/>
    <rect x="-4" y="-20" width="8" height="5" rx="1.5" fill="#a0703f" stroke="#2a2630" stroke-width="2"/>`,
  flask_acid: `<path d="M-3 -16 H3 V-9 Q11 -5 11 3 Q11 13 0 13 Q-11 13 -11 3 Q-11 -5 -3 -9 Z" fill="#f6e9d8" stroke="#2a2630" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M-9 2 Q0 -2 9 2 Q9 11 0 11 Q-9 11 -9 2 Z" fill="#8bc34a"/><circle cx="3" cy="5" r="2" fill="#d6f0a6"/>
    <rect x="-4" y="-20" width="8" height="5" rx="1.5" fill="#a0703f" stroke="#2a2630" stroke-width="2"/>`,
  net: `<circle r="13" fill="#d9c08e" stroke="#2a2630" stroke-width="2.5"/>
    <path d="M-12 -4 Q0 -9 12 -4 M-12 4 Q0 9 12 4 M-5 -12 Q-9 0 -5 12 M5 -12 Q9 0 5 12" stroke="#8a6a44" stroke-width="2" fill="none"/>
    <path d="M10 8 Q16 12 18 18" stroke="#8a6a44" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
};
const projArtSVG = key => PROJ_ART[key] || (ITEM_RAW[key] ? `<g transform="scale(.3) translate(-60 -60)">${ITEM_RAW[key]}</g>` : null);
function projSVG(pj, now){
  const a = iso(pj.fx, pj.fy), t = iso(pj.tx, pj.ty);
  const x0 = a.x + pj.face*26, y0 = a.y + TH/2 - 66, x1 = t.x, y1 = t.y + TH/2 - 54;
  const ang = Math.atan2(y1-y0, x1-x0)*180/Math.PI;
  const st = `style="--x0:${x0}px;--y0:${y0}px;--x1:${x1}px;--y1:${y1}px;--dur:${pj.dur}ms;--d:${pj.t-now}ms"`;
  let shape;
  if(pj.kind==="bullet") shape = `<g transform="rotate(${ang})"><path d="M-30 0 H-4" stroke="#fff3c4" stroke-width="3" stroke-linecap="round" opacity=".8"/><circle r="3.6" fill="#5b5f6b" stroke="#2a2630" stroke-width="1.2"/></g>`;   // 子彈：小鉛彈＋一道亮線
  else if(pj.kind==="arrow") shape = `<g transform="rotate(${ang})"><path d="M-26 0 H14" stroke="#6e4a32" stroke-width="3" stroke-linecap="round"/>
      <path d="M22 0 L12 -5 L14 0 L12 5 Z" fill="#dfe6ee" stroke="#2a2630" stroke-width="1.5"/>
      <path d="M-26 0 L-32 -5 M-26 0 L-32 5 M-20 0 L-26 -5 M-20 0 L-26 5" stroke="#f6e9d8" stroke-width="2" stroke-linecap="round"/></g>`;
  else if(pj.kind==="thrown" && projArtSVG(pj.art)) shape = `<g class="pj-spin">${projArtSVG(pj.art)}</g>`;
  else if(pj.kind==="thrown") shape = `<g class="pj-spin"><path d="M-16 0 H10" stroke="#6e4a32" stroke-width="4" stroke-linecap="round"/>
      <path d="M8 -5 L22 0 L8 5 Z" fill="#dfe6ee" stroke="#2a2630" stroke-width="1.5"/></g>`;
  else shape = `<circle r="15" fill="${pj.glow}" opacity=".35"/><circle r="9" fill="${pj.glow}"/><circle r="4" fill="#fff"/>
      <path d="M-22 0 H-9" stroke="${pj.glow}" stroke-width="4" stroke-linecap="round" opacity=".6" transform="rotate(${ang})"/>`;
  return `<g class="proj proj-${pj.kind}" ${st}><g transform="scale(${pj.kind==="arrow" || pj.kind==="bullet" ? 1 : 1.5})">${shape}</g></g>`;   // 箭不放大（大爺：原本太大）
}

function blockSVG(o){
  if(o.kind==="trap"&&!o.found)return "";
  if(o.kind==="poisonSwamp"){const p=iso(o.x,o.y);return `<g class="poison-swamp"><polygon points="${diamond(o.x,o.y)}" fill="#859948" stroke="#2a2630" stroke-width="2"/><circle cx="${p.x-18}" cy="${p.y+30}" r="6" fill="#c7d96d" stroke="#2a2630" stroke-width="2"/><circle cx="${p.x+16}" cy="${p.y+38}" r="9" fill="#c7d96d" stroke="#2a2630" stroke-width="2"/></g>`;}
  if(o.kind==="water")return `<polygon points="${diamond(o.x,o.y)}" fill="#6da8b9" stroke="#2a2630" stroke-width="2"/>`;
  if(o.kind==="oil")return o.found?`<polygon class="ground-oil" points="${diamond(o.x,o.y)}" fill="#665954" stroke="#2a2630" stroke-width="2"/>`:"";
  const p = iso(o.x,o.y), cx = p.x, cy = p.y+TH/2;
  const box = (h, top, side1, side2) =>
    `<polygon points="${cx},${cy-TH/2-h} ${cx+TW/2-8},${cy-h} ${cx},${cy+TH/2-h} ${cx-TW/2+8},${cy-h}" fill="${top}" stroke="#2a2630" stroke-width="2"/>
     <polygon points="${cx-TW/2+8},${cy-h} ${cx},${cy+TH/2-h} ${cx},${cy+TH/2} ${cx-TW/2+8},${cy}" fill="${side1}" stroke="#2a2630" stroke-width="2"/>
     <polygon points="${cx+TW/2-8},${cy-h} ${cx},${cy+TH/2-h} ${cx},${cy+TH/2} ${cx+TW/2-8},${cy}" fill="${side2}" stroke="#2a2630" stroke-width="2"/>`;
  if(o.kind==="wagon"){
    // 篷車：低低的木頭車斗＋車輪＋弧形帆布頂，跟箱子一眼分得出來
    const k = WAGON_K, h = 20*k, L = cx-TW/2+6, R = cx+TW/2-6, T = cy-TH/2+3, Bt = cy+TH/2-3;
    const top = (dy)=>`${cx},${T-dy} ${R},${cy-dy} ${cx},${Bt-dy} ${L},${cy-dy}`;
    // 帆布：沿著車斗上緣往上鼓起的拱
    const arch = (x1,y1,x2,y2,k)=>`Q${(x1+x2)/2} ${(y1+y2)/2-k}`;
    return `<g class="wagon">
      <polygon points="${L},${cy-h} ${cx},${Bt-h} ${cx},${Bt} ${L},${cy}" fill="#8a6038" stroke="#2a2630" stroke-width="2"/>
      <polygon points="${R},${cy-h} ${cx},${Bt-h} ${cx},${Bt} ${R},${cy}" fill="#6e4a32" stroke="#2a2630" stroke-width="2"/>
      <path d="M${L} ${cy-h/2} L${cx} ${Bt-h/2} L${R} ${cy-h/2}" stroke="#5e3f24" stroke-width="2" fill="none"/>
      <polygon points="${top(h)}" fill="#b0834f" stroke="#2a2630" stroke-width="2"/>
      <path d="M${L+4} ${cy-h} ${arch(L,cy-h,cx,T-h,52*k)} ${cx} ${T-h} L${R} ${cy-h} L${cx} ${Bt-h} Z" fill="#efe3c8" stroke="#2a2630" stroke-width="2"/>
      <path d="M${L+4} ${cy-h} ${arch(L,cy-h,cx,Bt-h,52*k)} ${cx} ${Bt-h} ${arch(cx,Bt-h,R,cy-h,52*k)} ${R} ${cy-h}" fill="#e2d2ae" stroke="#2a2630" stroke-width="2"/>
      <path d="M${(L+cx)/2} ${(cy+Bt)/2-h} Q${(L+cx)/2} ${(cy+Bt)/2-h-48*k} ${(L+cx)/2+2} ${(cy+Bt)/2-h-50*k} M${(R+cx)/2} ${(cy+Bt)/2-h} Q${(R+cx)/2} ${(cy+Bt)/2-h-48*k} ${(R+cx)/2-2} ${(cy+Bt)/2-h-50*k}" stroke="#c9b58a" stroke-width="2.5" fill="none"/>
      <g transform="translate(${(L+cx)/2-2} ${(cy+Bt)/2-4}) scale(${k})">
        <ellipse rx="11" ry="12" fill="#6e4a32" stroke="#2a2630" stroke-width="2.5"/>
        <path d="M0 -12 V12 M-11 0 H11 M-8 -8 L8 8 M8 -8 L-8 8" stroke="#2a2630" stroke-width="1.5"/>
        <ellipse rx="3" ry="3.2" fill="#b0834f" stroke="#2a2630" stroke-width="1.5"/></g>
    </g>`;
  }
  // 互動物件的手繪 SVG 暫定（GPT）；與既有場景一起排序。
  if(o.kind==="powderBarrel")return `<g class="powder-barrel" transform="translate(${cx-36} ${cy-66}) scale(.6)">${ITEM_ART.powder_barrel}</g>`;
  if(o.kind==="chest")return `<g class="explore-chest" transform="translate(${cx} ${cy})" stroke="#292330" stroke-width="3" stroke-linejoin="round"><path d="M-50 -24 L0 -2 L50 -24 V5 L0 28 L-50 5Z" fill="#93613d"/><path d="M0 -2 V28 L50 5 V-24Z" fill="#734b32"/><path d="M-50 -24 L0 -46 L50 -24 L0 -2Z" fill="${o.opened?"#302830":"#b9894d"}"/><g transform="${o.opened?"translate(0 -34) rotate(-18)":""}"><path d="M-50 -24 Q-50 -58 -25 -66 L25 -44 Q50 -36 50 -24 L0 -2Z" fill="#c49652"/><path d="M-28 -45 Q-24 -62 -15 -61 L-7 -57 Q-18 -46 -17 -39 L32 -17 L22 -12Z M7 -56 L17 -51 Q39 -36 34 -18 L25 -14 Q28 -35 7 -42Z" fill="#a4a5a0"/></g><path d="M-27 -14 L-17 -10 V20 L-27 16Z M23 -12 L33 -17 V13 L23 18Z" fill="#a4a5a0"/><rect x="-6" y="-8" width="12" height="17" rx="2" fill="#e8c45b"/><circle cx="0" cy="-1" r="2" fill="#292330" stroke="none"/></g>`;
  if(o.kind==="door"||o.kind==="doorOpen")return `<g class="explore-door" transform="translate(${cx} ${cy})"><path d="M-38 5 V-100 H38 V5" fill="none" stroke="#2a2630" stroke-width="7"/><path d="${o.kind==="door"?"M-32 0 V-95 H32 V0Z":"M-32 0 V-95 L-55 -80 V15Z"}" fill="#98714e" stroke="#2a2630" stroke-width="3"/><circle cx="${o.kind==="door"?22:-47}" cy="-40" r="4" fill="#ebc965"/></g>`;
  if(o.kind==="trap")return `<g class="explore-trap"><ellipse cx="${cx}" cy="${cy}" rx="30" ry="15" fill="${o.disarmed?"#aaa":"#cf7d58"}" stroke="#2a2630" stroke-width="3"/><path d="M${cx-22} ${cy} l8 -12 l8 12 l8 -12 l8 12" fill="none" stroke="#2a2630" stroke-width="3"/></g>`;
  if(o.kind==="crate") return `<g class="slatted-crate">${box(36,"#c49a62","#9a6a3e","#7a5230")}<g transform="translate(${cx} ${cy})" fill="none" stroke="#292330" stroke-width="3" stroke-linejoin="round"><path d="M-37 -47 L19 -15 M-19 -58 L37 -26 M-56 -24 L0 8 L56 -24 M-56 -12 L0 20 L56 -12"/><path d="M-49 -29 L-7 27 M7 -1 L49 -3" stroke-width="8"/><path d="M-49 -29 L-7 27 M7 -1 L49 -3" stroke="#c49a62" stroke-width="4"/></g></g>`;
  if(o.kind==="tree") return `<g class="tree" transform="translate(${cx} ${cy}) scale(${TREE_K}) translate(${-cx} ${-cy})">
    <ellipse cx="${cx}" cy="${cy+2}" rx="30" ry="13" fill="#000" opacity=".22"/>
    <path d="M${cx-9} ${cy} Q${cx-7} ${cy-40} ${cx-5} ${cy-62} L${cx+5} ${cy-62} Q${cx+7} ${cy-40} ${cx+9} ${cy} Z" fill="#7a5230" stroke="#2a2630" stroke-width="2.5"/>
    <path d="M${cx-2} ${cy-10} Q${cx} ${cy-30} ${cx-1} ${cy-50}" stroke="#5e3f24" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="${cx-22}" cy="${cy-72}" r="24" fill="#4f7d42" stroke="#2a2630" stroke-width="2.5"/>
    <circle cx="${cx+22}" cy="${cy-74}" r="24" fill="#4f7d42" stroke="#2a2630" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy-98}" r="28" fill="#5a8a48" stroke="#2a2630" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy-70}" r="22" fill="#5a8a48"/>
    <circle cx="${cx-10}" cy="${cy-106}" r="9" fill="#7aa864"/><circle cx="${cx+16}" cy="${cy-82}" r="6" fill="#7aa864"/>
  </g>`;
  return `<ellipse cx="${cx}" cy="${cy-10}" rx="${TW*.36}" ry="${TH*.46}" fill="#4f7d42" stroke="#2a2630" stroke-width="2"/>
          <ellipse cx="${cx-TW*.1}" cy="${cy-TH*.37}" rx="${TW*.12}" ry="${TH*.15}" fill="#6f9960"/>`;
}

function faceSVG(v, x, y, size){
  if(foeHid(v)) return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#2a2630"/>
    <text x="50" y="69" text-anchor="middle" font-size="58" font-weight="900" fill="#e0766e" font-family="var(--font-num),serif">?</text></svg>`;
  if(v.side==="pc") return critterSVG(v.id,v.down?"hurt":B().result==="win"?"happy":v.svgMood).replace('<svg viewBox="0 0 100 100"', `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100"`);
  const L = MONSTER_LOOK[v.look];
  return (L.face || L.head).replace('<svg viewBox="0 0 100 100"', `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100"`);
}
// 打中特效：斬擊弧線、穿刺、衝擊、火焰、魔法、治療
// 瞄準圈（10-03）：紅色準星縮到目標身上
const aimSVG = (x, y, el, dur) => `<g class="fx-aim" transform="translate(${x} ${y})"><g class="aim-ring" style="--dur:${dur}ms;animation-delay:${-el}ms">
  <circle r="22" fill="none" stroke="#2a2630" stroke-width="6" opacity=".5"/><circle r="22" fill="none" stroke="#ff5a4a" stroke-width="3"/>
  <path d="M0 -32 V-14 M0 14 V32 M-32 0 H-14 M14 0 H32" stroke="#ff5a4a" stroke-width="3" stroke-linecap="round"/><circle r="3" fill="#ff5a4a"/></g></g>`;
// 開槍的白煙（10-03）：一閃火光，接著幾團煙往前冒、慢慢變大散掉
function smokeSVG(x, y, face, el){
  const puffs = [[10,0,13,0],[24,-6,16,50],[40,-12,18,110],[18,-16,12,170],[54,-20,16,230],[32,-26,13,300]];
  return `<g class="fx-smoke" transform="translate(${x} ${y}) scale(${face*1.2} 1.2)" style="--el:${-el}ms">
    <g class="sm-flash" style="animation-delay:${-el}ms"><path d="M0 0 L14 -7 L10 -1 L24 0 L10 2 L14 8 Z" fill="#ffd46a" stroke="#f08a2c" stroke-width="1.5" stroke-linejoin="round"/><circle cx="4" r="5" fill="#fff6c8"/></g>
    ${puffs.map(([dx,dy,r,dl])=>`<circle class="sm-puff" cx="${dx}" cy="${dy}" r="${r}" style="animation-delay:${dl-el}ms"/>`).join("")}</g>`;
}
function fxSVG(kind, x, y, el){
  const st = `style="animation-delay:${-el}ms"`;
  const g = inner => `<g class="fx fx-${kind}" transform="translate(${x} ${y})"><g ${st}>${inner}</g></g>`;
  if(kind==="slash")  return g(`<path d="M-30 -26 Q4 -40 28 14" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M-26 -22 Q2 -32 22 8" fill="none" stroke="#f2b441" stroke-width="3" stroke-linecap="round"/>`);
  if(kind==="pierce") return g(`<path d="M-34 10 L30 -10" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M-34 -2 L14 -14 M-30 20 L18 4" stroke="#f6e9d8" stroke-width="2.5" stroke-linecap="round"/><path d="M26 -18 L38 -12 L28 -2 Z" fill="#fff"/>`);
  if(kind==="fire")   return g(`<circle r="22" fill="#f2b441" opacity=".85"/><path d="M0 -30 Q18 -8 8 14 Q0 4 -8 14 Q-18 -8 0 -30 Z" fill="#e0584a"/><circle r="8" fill="#fff4b0"/>`);
  if(kind==="spark")  return g(`<path d="M0 -26 L6 -6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6 -6 Z" fill="#b9a0ff" stroke="#fff" stroke-width="2"/><circle r="5" fill="#fff"/>`);
  if(kind==="heal")   return g(`<path d="M-6 -20 H6 V-6 H20 V6 H6 V20 H-6 V6 H-20 V-6 H-6 Z" fill="#9be08a" stroke="#fff" stroke-width="2"/><circle cx="-22" cy="-16" r="3" fill="#fff"/><circle cx="20" cy="-22" r="2.5" fill="#fff"/>`);
  return g(`<path d="M0 -28 L7 -9 L27 -12 L12 2 L22 20 L3 11 L-9 26 L-8 6 L-27 0 L-9 -8 Z" fill="#fff4b0" stroke="#f2b441" stroke-width="2.5"/>`);
}

function unitDoll(v, active){
  const p = iso(v.x,v.y), cx = p.x, cy = p.y+TH/2;
  const now = Date.now(), a = v.anim, el = a ? now - a.t : 0;
  const live = a && el >= 0 && el < (DOLL_DUR[a.k]||0) ? {k:a.k, el} : null;   // el < 0：還在擲骰，動作還沒開始
  const look = v.side!=="pc" ? MONSTER_LOOK[v.look] : null;
  return dollSVG({id:v.id, color:v.color, look, mood:v.svgMood, ...dollGear(v), walking:B().phase==="explore"&&v.exploreWalking, anim:live, face:v.face||1, down:v.down, prone:!v.down && !!has(v,"prone"), cheer: B().result==="win" && v.side==="pc" && !v.down,
                        x:cx-59, y:cy-118, w:118, seed:v.id.length*3 + (v.side!=="pc"?+v.id.slice(3)*5:0)});
}
// 頭上的狀態小圖示：壞的紅底、好的綠底，最多五個；大小見 overlayK（跟著地圖縮放，有最小尺寸）
// 有倒數的狀態，圖示上方標剩幾回合（流血＝剩幾次、到某人回合開始／結束＝1）；燒到撲滅、整場的不標
// 圖示不用字，出其他語言版本也不用改
// 17 個狀態（2026-10-01 大爺定上限 15，10-03 放寬到 17）：12 個掛圖示＋凍結、麻痺、中毒＋狩印、專注。icon 是 null 的不掛頭上（身上已經看得出來、或不用提醒），狀態卡照樣列出
const STATUS_BADGE = {
  dazed:["daze",0], slowed:["slow",0], restrained:["net",0], sapped:["weak",0], bane:["skull",0], acDown:["crack",0], bleed:["drop",0],
  frozen:["snow",0], paralyzed:["bolt",0], poisoned:["bubble",0], marked:["target",0],
  conc:["focus",1],   // 10-03 大爺：上限放寬到 17，加狩印（被標的）和專注（施法的）
  blessed:["sun",1], helped:["hand",1], dodge:["dodge",1], shieldSpell:["shieldStar",1], stance:["parry",1],
  prone:[null,0], burning:[null,0], hidden:[null,1], mageArmor:[null,1], disengage:[null,1], fireShield:[null,1]
};
const badgeOf = s => (STATUS_BADGE[s.k]||[])[0];
const hasBadge = v => v.statuses.some(badgeOf);
// 圖示畫在 20×20 的格子裡（白色）
const ST_ICON = {
  net:`<path d="M4 4l12 12M4 10l6 6M10 4l6 6M16 4L4 16M10 4L4 10M16 10l-6 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  drop:`<path d="M10 3c2.5 3.8 4.6 6.2 4.6 8.8a4.6 4.6 0 0 1-9.2 0C5.4 9.2 7.5 6.8 10 3z" fill="#fff"/>`,
  daze:`<path d="M10 10m-1.6 0a1.6 1.6 0 1 1 3.2 0a3.6 3.6 0 1 1-7.2 0a5.6 5.6 0 1 1 11.2 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  slow:`<path d="M5 6l5 4 5-4M5 11l5 4 5-4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  weak:`<path d="M13.5 3.5l3 3-8 8-3-3zM6 12l2 2M4 16l2.5-2.5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 3l14 14" stroke="#1f1a24" stroke-width="4"/><path d="M3.5 3.5l13 13" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  skull:`<path d="M10 3a6 6 0 0 0-6 6c0 2 1 3.4 2.3 4.2V16h7.4v-2.8C15 12.4 16 11 16 9a6 6 0 0 0-6-6z" fill="#fff"/><circle cx="7.6" cy="9.4" r="1.6" fill="#a33c32"/><circle cx="12.4" cy="9.4" r="1.6" fill="#a33c32"/><path d="M8.5 16v-2M11.5 16v-2" stroke="#a33c32" stroke-width="1.2"/>`,
  grab:`<path d="M6 17v-6.5a1.4 1.4 0 0 1 2.8 0V9V4.5a1.4 1.4 0 0 1 2.8 0V9V5.5a1.4 1.4 0 0 1 2.8 0v5.5l.3-1.5a1.3 1.3 0 0 1 2.5.6L15.6 17z" fill="#fff"/>`,
  crack:`<path d="M10 2.5l6 2.2v5c0 3.8-2.6 6.4-6 7.8-3.4-1.4-6-4-6-7.8v-5z" fill="#fff"/><path d="M11 3l-2.2 4.5 2.6 2-2.4 4.3 1.2 3.4" stroke="#a33c32" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
  sun:`<circle cx="10" cy="10" r="3.4" fill="#fff"/><path d="M10 2.5v2.4M10 15.1v2.4M2.5 10h2.4M15.1 10h2.4M4.7 4.7l1.7 1.7M13.6 13.6l1.7 1.7M4.7 15.3l1.7-1.7M13.6 6.4l1.7-1.7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
  dodge:`<path d="M3 6h8M5 10h10M3 14h8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M14 4l3 2-3 2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  parry:`<path d="M4 4l12 12M16 4L4 16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M3 13l4 4M17 13l-4 4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  shieldStar:`<path d="M10 2.5l6 2.2v5c0 3.8-2.6 6.4-6 7.8-3.4-1.4-6-4-6-7.8v-5z" fill="#fff"/><path d="M10 6.2l1.1 2.4 2.5.3-1.9 1.7.5 2.5L10 11.9l-2.2 1.2.5-2.5-1.9-1.7 2.5-.3z" fill="#3f7a3a"/>`,
  snow:`<path d="M10 2.5v15M3.5 6.2l13 7.6M3.5 13.8l13-7.6" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><path d="M8 3.8l2 1.8 2-1.8M8 16.2l2-1.8 2 1.8" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  bolt:`<path d="M11.5 2.5L5 11h4.2L8 17.5 15 8.6h-4.3z" fill="#fff"/>`,
  bubble:`<path d="M6 3H12M7 3V8L3 14Q2 17 6 17H14Q18 17 17 14L11 8V3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13H15L16 15H4Z" fill="#fff"/><circle cx="16" cy="6" r="2" fill="#fff"/>`,
  hand:`<path d="M10 3.5v13M3.5 10h13" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  target:`<circle cx="10" cy="10" r="5.6" stroke="#fff" stroke-width="1.9" fill="none"/><circle cx="10" cy="10" r="1.7" fill="#fff"/><path d="M10 2v3.2M10 14.8V18M2 10h3.2M14.8 10H18" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>`,
  focus:`<path d="M2 10Q10 1 18 10Q10 19 2 10Z" fill="none" stroke="#fff" stroke-width="2"/><circle cx="10" cy="10" r="3" fill="#fff"/>`,
};
// 剩幾回合：流血、中毒照次數；到某人回合開始／結束才消失＝1；其他（燒到撲滅、整場、掙脫才解）不標
const stTurns = s => s.k==="bleed" ? s.n : (s.until==="start" || s.until==="end") ? 1 + (s.left||0) : null;   // left：升階多撐的輪數
function statusBadges(v, cx, y){
  const by = new Map();                              // 同一個圖示只畫一次，回合數取大的
  v.statuses.forEach(s=>{ const b = STATUS_BADGE[s.k]; if(!b || !b[0]) return;
    const o = by.get(b[0]) || {icon:b[0], good:b[1], n:null}, t = stTurns(s);
    if(t!=null) o.n = Math.max(o.n||0, t); by.set(b[0], o); });
  const list = [...by.values()].slice(0,5);
  if(!list.length || v.dead) return "";
  const k = badgeK(), W = 20, gap = 4, x0 = -(list.length*W + (list.length-1)*gap)/2;
  return `<g class="st-badges" transform="translate(${cx} ${y}) scale(${k.toFixed(3)})">${list.map((o,i)=>`
    <g data-st="${o.icon}" transform="translate(${x0 + i*(W+gap)} ${-W})"><rect width="${W}" height="${W}" rx="5" fill="${o.good?"#3f7a3a":"#a33c32"}" stroke="#1f1a24" stroke-width="2"/>
    ${ST_ICON[o.icon]||""}${o.n!=null ? `<g transform="translate(${W/2} -4)"><circle r="6.5" fill="#fff4b0" stroke="#1f1a24" stroke-width="1.8"/><text y="3.6" text-anchor="middle" class="st-n">${o.n}</text></g>` : ""}</g>`).join("")}</g>`;
}
// 燃燒：身上冒火（三團火焰在身體周圍閃動，躺下時貼著地面）
// ---------- 骰子面板（戰場上方中央，參考索拉塔） ----------
// 骰子只負責滾動演出，停住後面上是擲出的點數；真正要看的總和另外寫大字，顏色講結果
// 骰子形狀照面數：d4 三角、d6 方、d8 菱形、d10 風箏、d12 五邊、d20 六角
const DIE_SHAPE = {
  4:"M0 -15 L14 11 L-14 11 Z", 6:"M-12 -12 H12 V12 H-12 Z", 8:"M0 -16 L14 0 L0 16 L-14 0 Z",
  10:"M0 -16 L14 -3 L0 16 L-14 -3 Z", 12:"M0 -15 L14.3 -4.6 L8.8 12.1 L-8.8 12.1 L-14.3 -4.6 Z",
  20:"M0 -16 L13.9 -8 L13.9 8 L0 16 L-13.9 8 L-13.9 -8 Z"
};
const RES_TEXT = {hit:"HIT", miss:"MISS", crit:"CRITICAL!", fumble:"MISS", save:"SAVE", fail:"FAIL", found:"FOUND", hide:"STEALTH"};
// 一顆骰子：start＝開始滾的時間、land＝停住的時間（相對現在，毫秒）；drop＝優劣勢沒用到的那顆
// still：不滾動，直接停在 v（被動檢定用）
function dieFace(sides, v, start, land, flick, drop, tint, still){
  const nat = sides===20 ? (v===20 ? " nat20" : v===1 ? " nat1" : "") : "";
  const edge = sides===20 ? `<path class="dp-edge" d="M0 -9.5 L8.8 5.8 L-8.8 5.8 Z"/>` : "";
  return `<span class="dp-die${drop?" dp-drop":""}${still?" dp-still":""}${nat}" style="--tint:${tint||"#f6e9d8"};--land:${land}ms"><svg viewBox="-18 -18 36 36" width="34" height="34">
    <g class="dp-spin" style="animation-delay:${start}ms"><path class="dp-body" d="${DIE_SHAPE[sides]||DIE_SHAPE[6]}"/>${edge}
    ${flick.map((f,j)=>`<text class="dp-f" y="4.5" text-anchor="middle" style="animation-delay:${start + j*DICE_TUMBLE/3}ms">${(f % sides) + 1}</text>`).join("")}
    <text class="dp-n" y="4.5" text-anchor="middle" style="animation-delay:${land}ms">${v}</text></g></svg><small>d${sides}</small></span>`;
}
const DMG_TINT = {"毒素":"#7fd0a0", "物理":"#f6e9d8", "法術":"#c9b5ff", "特殊":"#ffd36a", "火焰":"#f2903a", "強酸":"#a8e07a"};
function dicePanelHTML(b){
  const p = b.panel, now = Date.now();
  if(!p || !p.rows.length || b.panelHidden) return "";
  // 好幾列時名字去掉大家都一樣的開頭（哥布林A、哥布林B → A、B），手機上才看得出是誰
  const names = p.rows.map(r=>r.tname);
  let pre = names.length > 1 ? names.reduce((a,n)=>{ let i = 0; while(i < a.length && a[i]===n[i]) i++; return a.slice(0, i); }) : "";
  if(names.some(n=>n.length===pre.length)) pre = "";
  const rows = p.rows.slice(0, 3).map(r=>{
    const land = r.t + DICE_TUMBLE - now, two = r.rolls.length===2;
    const usedIdx = two ? (r.rolls[0]===r.used ? 0 : 1) : 0;
    const d20 = r.rolls.map((v,i)=>dieFace(20, v, r.t - now, land, r.flick, two && i!==usedIdx, null, r.still)).join("");   // still：被動感知，骰子停在 10
    let dmg = "";
    if(r.faces.length || r.dmg){                     // 傷害骰：比 d20 晚 DMG_OFF 開始滾
      const ds = r.t + DMG_OFF - now, dl = ds + DICE_TUMBLE, shown = dmgShown(r.type||""), tint = DMG_TINT[shown] || "#f6e9d8";
      const sum = r.faces.reduce((a,f)=>a+f.v, 0), mod = (r.dmg||0) - sum;
      const half = r.kind==="save" && r.res==="save" && mod < 0;          // 豁免成功傷害減半
      dmg = `<div class="dp-dmg">${r.faces.slice(0,6).map(f=>dieFace(f.sides, f.v, ds, dl, r.flick, false, tint)).join("")}
        ${mod && !half ? `<span class="dp-mod" style="--land:${dl}ms">${mod>0?"+":"−"}${Math.abs(mod)}</span>` : ""}
        <span class="dp-total" style="--land:${dl + 60}ms;color:${tint}"><b>${r.dmg||0}</b><small>${half ? "減半" : shown}</small></span></div>`;
    }
    return `<div class="dp-row">
      ${p.rows.length > 1 || r.kind==="save" ? `<span class="dp-tg">${r.tname.slice(pre.length)}</span>` : ""}
      <div class="dp-atk">${d20}<span class="dp-total res-${r.res}" style="--land:${land + 40}ms"><b>${r.total}</b><small>${RES_TEXT[r.res]}</small></span></div>
      ${dmg}${r.vs ? `<div class="dp-dmg dp-vs"><span class="dp-vs-n">${r.vs.name}</span>${dieFace(20, 10, r.t - now, land, r.flick, false, null, true)}
        <span class="dp-total res-${r.vs.res}" style="--land:${land + 40}ms"><b>${r.vs.n}</b><small>${RES_TEXT[r.vs.res]}</small></span></div>` : ""}</div>`;
  }).join("");
  // 三列以上（例如偷襲：潛行、被動、攻擊）每列變矮，整塊塞進戰場上緣到螢幕頂端之間，標題不會被擠出畫面（大爺 10-02 選 a）
  // 「還有 N 個」也搬到標題列，不多佔一行
  const tight = p.rows.length >= 3, extra = p.rows.length - 3;
  const more = extra > 0 && !tight ? `<div class="dp-more">還有 ${extra} 個，看紀錄</div>` : "";
  const moreHead = extra > 0 && tight ? `<span class="dp-more-h">＋${extra} 看紀錄</span>` : "";
  const target = p.rows.length===1 && ["atk","chk"].includes(p.rows[0].kind) && !p.rows[0].vs ? ` → ${p.rows[0].tname}` : "";
  return `<div class="dice-panel${tight ? " tight" : ""}" id="dicePanel" role="button" aria-label="收起擲骰結果"><div class="dp-head"><span>${p.label}${target}</span>${moreHead}<span class="dp-x" aria-hidden="true">✕</span></div>${rows}${more}</div>`;
}
const visibleStatus=(v,k)=>{const s=has(v,k);return s && (s.visualAt||0)<=Date.now()?s:null;};
function burnFX(v, cx, cy){
  if(v.dead || !visibleStatus(v,"burning")) return "";
  const low = v.down || visibleStatus(v,"prone"), ys = low ? [-18,-26,-14] : [-44,-78,-30], xs = [-22, 8, 24];
  const flame = (x,y,s,d) => `<g transform="translate(${cx+x} ${cy+y}) scale(${s})"><g class="burn-f" style="animation-delay:${d}ms">
    <path d="M0 -22c3 7 11 10 11 19a11 11 0 0 1-22 0c0-5 3-8 5-11 .6 3.5 2.4 5.4 4.4 6C-1.7 -12 -1.2 -17 0 -22z" fill="#f2703a" stroke="#2a2630" stroke-width="2" opacity=".92"/>
    <path d="M0 -10c1.6 3.5 5.5 5 5.5 9a5.5 5.5 0 0 1-11 0c0-2.4 1.4-3.8 2.6-5.3.3 1.6 1 2.5 2 2.8-.3-2.2-.2-4.3.9-6.5z" fill="#ffd36a"/></g></g>`;
  return `<g class="fx-burn">${flame(xs[0],ys[0],.9,0)}${flame(xs[1],ys[1],.75,180)}${flame(xs[2],ys[2],1,90)}</g>`;
}
// 狀態身上演出：外觀暫定GPT。只讀statuses，放原場景層；不畫角色外框。
function statusBodyFX(v,cx,cy){
  if(v.dead)return "";
  const low=v.down||visibleStatus(v,"prone"), base=low?-12:-26, ink="#2a2630",out=[];
  const path=(d,fill,stroke=ink,w=2.5)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(visibleStatus(v,"frozen"))out.push(`<g data-body-status="frozen">${path("M-31 6L-29 -23L-19 -35L-9 -21L-8 7Z","#a7e6ed")}${path("M13 8L15 -30L26 -42L36 -20L34 10Z","#8ac4df")}<path d="M-25 -16L-17 -24M20 -20L27 -31" stroke="#f5ffff" stroke-width="3"/></g>`);
  if(visibleStatus(v,"paralyzed"))out.push(`<g data-body-status="paralyzed" class="status-electric">${path(`M-32 ${base-40}l-9 19h12l-9 19`,"none","#292330",7)}${path(`M-32 ${base-40}l-9 19h12l-9 19`,"none","#fff29c",3)}${path(`M34 ${base-25}l-8 18h12l-10 20`,"none","#292330",7)}${path(`M34 ${base-25}l-8 18h12l-10 20`,"none","#fff29c",3)}</g>`);
  if(visibleStatus(v,"poisoned"))out.push(`<g data-body-status="poisoned">${[[-26,4,6,0],[25,-10,5,250],[15,8,4,500]].map(([x,y,r,d])=>`<g transform="translate(${x} ${y+base})"><circle class="status-poison-bubble" r="${r}" fill="#a5ce64" stroke="${ink}" stroke-width="2" style="animation-delay:${-d}ms"/></g>`).join("")}</g>`);
  if(visibleStatus(v,"bleed"))out.push(`<g data-body-status="bleed" class="status-drip">${path("M-19 -17Q-31 0 -20 2Q-9 0 -19 -17Z","#c34e4a")}${path("M19 -9Q11 3 19 4Q27 3 19 -9Z","#c34e4a")}</g>`);
  if(visibleStatus(v,"restrained"))out.push(`<g data-body-status="restrained" transform="translate(0 ${base})">${path("M-22 -21L22 19M-22 -1L2 21M-2 -21L22 1M22 -21L-22 19M22 -1L-2 21M2 -21L-22 1","none",ink,5)}${path("M-22 -21L22 19M-22 -1L2 21M-2 -21L22 1M22 -21L-22 19M22 -1L-2 21M2 -21L-22 1","none","#dac69a",2)}</g>`);
  return out.length?`<g class="status-body-fx" transform="translate(${cx} ${cy})">${out.join("")}</g>`:"";
}
// 火焰護盾：腳下一圈火光、身體外圍一層淡淡的火焰光暈（不掛圖示）
function fireShieldFX(v, cx, cy){
  if(v.dead || v.down || !visibleStatus(v,"fireShield")) return "";
  const low = visibleStatus(v,"prone"), ry = low ? 30 : 62, oy = low ? -20 : -56;
  return `<g class="fx-fshield"><ellipse cx="${cx}" cy="${cy-4}" rx="40" ry="13" fill="none" stroke="#f2903a" stroke-width="3" opacity=".75"/>
    <ellipse class="fs-glow" cx="${cx}" cy="${cy+oy}" rx="${low?58:42}" ry="${ry}" fill="#f2903a" opacity=".16" stroke="#ffd36a" stroke-width="1.5" stroke-dasharray="6 7"/></g>`;
}
// 頭上的血條＋狀態圖示＋潛行眼睛：角色本身和「被擋住的指示物」共用
function unitHUD(v, cx, top, badgeUp){
  const pct = v.hp/v.maxHp;
  const hid = isHid(v) ? `<g class="hid-eye" transform="translate(${cx} ${top-24-badgeUp})"><path d="M-17 0 Q0 -14 17 0 Q0 14 -17 0 Z" fill="#1f1a24" stroke="#f6e9d8" stroke-width="2.5"/>
    <circle r="5.5" fill="#f6e9d8"/><path d="M-19 9 L19 -9" stroke="#1f1a24" stroke-width="7" stroke-linecap="round"/><path d="M-17 8 L17 -8" stroke="#f6e9d8" stroke-width="2.5" stroke-linecap="round"/></g>` : "";
  return `<rect x="${cx-28}" y="${top-8}" width="56" height="7" rx="3" fill="#1f1a24"/>
    <rect x="${cx-27}" y="${top-7}" width="${54*pct}" height="5" rx="2" fill="${pct>.5?"#8fbf7a":pct>.25?"#f2b441":"#e0766e"}"/>
    ${statusBadges(v, cx, top - 12)}${hid}`;
}
const hudTop = (v, cy) => (v.down || has(v,"prone")) ? cy-56 : cy-122;   // 躺下的人血條跟著降到身體上方
// 角色頭上那一塊（血條＋狀態圖示＋潛行眼睛），畫在最上層；底下墊一塊透明的點擊範圍，手機比較好點
function hudSVG(v){
  const p = iso(v.x,v.y), cx = p.x, cy = p.y+TH/2, top = hudTop(v, cy), badgeUp = hasBadge(v) ? 40*overlayK() : 0;
  return `<g class="hud" ${B().phase==="explore"?`data-explore-body="${v.id}"`:""} data-tile="${mapCell(v.x)},${mapCell(v.y)}"><rect x="${cx-30}" y="${top-16}" width="60" height="22" fill="transparent"/>${unitHUD(v, cx, top, badgeUp)}${exploreAlertSVG(v,cx,top-badgeUp-34)}</g>`;
}
function tokenSVG(v, active){
  const p = iso(v.x,v.y), cx = p.x, cy = p.y+TH/2, ring = sideColor(v);
  const now = Date.now(), pct = v.hp/v.maxHp;
  const doll = unitDoll(v, active);
  const body = v.dead ? `<g class="dying" style="animation-delay:${v.deadAt-now}ms">${doll}</g>` : doll;
  const top = hudTop(v, cy);
  const badgeUp = hasBadge(v) ? 40*overlayK() : 0;
  return `<g ${B().phase==="explore"?`data-explore-body="${v.id}"`:""} class="token ${active?"active":""} ${v.down?"down":""} ${isHid(v)?"hid-me":""}" ${v.dead?`data-exp="${v.deadAt+900}"`:`data-tile="${mapCell(v.x)},${mapCell(v.y)}"`}>
    <ellipse cx="${cx}" cy="${cy}" rx="30" ry="14" fill="#000" opacity=".25"/>
    <ellipse cx="${cx}" cy="${cy-2}" rx="28" ry="12" fill="#2a2630" stroke="${ring}" stroke-width="3"/>
    ${body}
    ${burnFX(v, cx, cy)}${statusBodyFX(v,cx,cy)}${fireShieldFX(v, cx, cy)}
  </g>`;
}
// 棋子旁的裝備圖示：武器類別、法器、盾
function equipKeys(v){
  const out = [];
  if(v.weapon) out.push(equipmentArtKey(v.weapon));
  if(v.focus) out.push(equipmentArtKey(v.focus));
  if(!v.weapon && !v.focus) out.push("unarmed");
  if(v.shield) out.push("shield");
  return out;
}

// 狀態名稱、說明（2026-10-01 大爺：名字不能混淆；同一個狀態可能由不同招式造成，說明照 via 分）
const STATUS_NAME = {prone:"倒地", dazed:"恍神", slowed:"緩速", restrained:"束縛", sapped:"削弱", bane:"災禍", acDown:"破甲", bleed:"流血", burning:"燃燒",
  frozen:"凍結", paralyzed:"麻痺", poisoned:"中毒", marked:"狩印", conc:"專注",
  blessed:"祝福", helped:"協助", dodge:"閃避", shieldSpell:"護盾術", stance:"架式", hidden:"潛行", mageArmor:"法師護甲", fireShield:"火焰護盾", disengage:"撤離"};
const STATUS_DESC = {prone:"倒在地上：近戰打他有優勢、遠程打他有劣勢，他攻擊有劣勢。輪到他時先爬起來，移動減半。",
  dazed:"這回合只能移動或行動，二選一。", sapped:"下一次攻擊有劣勢。", bane:"攻擊和豁免各減 1d4，直到施法者倒下或專注中斷。",
  bleed:"每回合開始受 1d4 傷害。", burning:"每回合開始受 1d4 火焰傷害，花動作撲滅。",
  frozen:"不能移動，敏捷豁免有劣勢；被火焰打到立刻解凍。", paralyzed:"下一回合整個跳過。", poisoned:"攻擊有劣勢，每回合開始受 1d4 毒素傷害；回合結束體質豁免，成功解毒，失敗持續。探索每 6 秒結算一次。",
  blessed:"攻擊和豁免各多擲 1d4 加上去，直到施法者的專注中斷。", shieldSpell:"AC +5。", hidden:"躲起來了，敵人看不到；從藏身處攻擊有優勢。",
  mageArmor:"沒穿護甲時，基礎 AC 變成 13 + 敏捷調整值，整場戰鬥。", disengage:"這回合移動不會被藉機攻擊。"};
function statusLabel(v,s){return STATUS_NAME[s.k]||s.k;}
function statusExplain(v,s){
  const who = id => (B().units.find(x=>x.id===id)||{}).name || "";
  let t;
  switch(s.k){
    case "slowed": t = s.stop ? "被釘住，不能移動。" : `移動 −${2+(s.n||0)} 格。`; break;
    case "restrained": t = (s.via==="grapple" ? `被${who(s.src)||"敵人"}抓住。` : "被網子纏住。") + `不能移動；打他有優勢，他攻擊有劣勢。${s.dc ? `掙脫難度 ${s.dc}。` : ""}`; break;
    case "acDown": t = s.shield ? "盾牌被劈開，這段時間盾不算（AC −2）。" : `AC −${2+(s.n||0)}。`; break;
    case "helped": t = s.target ? `下一次攻擊${who(s.target)}有優勢。` : "下一次攻擊有優勢。"; break;
    case "dodge": t = s.once ? `${who(s.by)}守護著他：打他的第一次攻擊有劣勢（${who(s.by)}要在旁邊）。` : "打他的攻擊有劣勢。"; break;
    case "stance": t = s.via==="guard" ? "第一個走進攻擊範圍的敵人會立刻被攻擊一次。" : "AC +2；被近戰打空會立刻反擊。"; break;
    case "marked": t = `被${who(s.src)}打上狩印：${who(s.src)}打中他時多 1d6 力場傷害，直到${who(s.src)}的專注中斷。`; break;
    case "conc": t = `正在專注【${s.name}】。受傷要過體質豁免（DC＝傷害一半，最少 10），失敗或倒下就中斷；再施另一個專注法術，這個就結束。`; break;
    case "fireShield": t = `近戰打中他的敵人受 ${1+(s.n||0)}d6 火焰傷害，整場戰鬥。`; break;
    default: t = STATUS_DESC[s.k] || "目前作用中的戰鬥狀態。";
  }
  if(s.via==="ground"&&GROUND_STATUS_RULES[s.k]){
    if(s.k==="prone")t="倒在地上：近戰打他有優勢、遠程打他有劣勢，他攻擊有劣勢；移動減半。";
    if(s.k==="paralyzed")t="整個回合不能行動。";
    const rule=GROUND_STATUS_RULES[s.k],name=ABILITIES.find(a=>a.k===rule.stat).n;
    t+=` 地面造成；回合結束${name}豁免 DC ${s.dc??rule.dc}，成功解除，失敗持續。探索每 6 秒結算一次。`;
  }
  if(s.k==="poisoned")t += ` 解毒體質豁免 DC ${s.dc??13}。`;
  const n = stTurns(s);
  if(n!=null) t += (s.k==="bleed"||s.k==="poisoned") ? ` 剩 ${n} 次。` : ` 剩餘 ${n} 回合。`;
  return t;
}
const TUTORIAL = [
  "輪到我方時，右下角的指令列就是這隻的指令。拖曳可以移動畫面，滾輪或兩指可以縮放。",
  "「走位」裡有移動、衝刺、撤離、潛行，選移動之後藍色格子是能走到的地方；「動作」裡有攻擊、技能、閃避、協助。點任何角色可以看他的狀態。",
  "攻擊會擲 d20 ＋ 加值，大於等於敵人的 AC 就命中。戰場角落的紀錄條會寫結果，點一下可以看完整的擲骰過程。",
  "每回合一次「動作」。離開敵人身邊會被藉機攻擊（每隻敵人每輪一次），先「撤離」就不會。做完選「待機」結束回合。"
];

// 燈號：動作、剩餘移動（只有輪到的那隻有）
function econHTML(u, b, pts=true){
  if(!(b && u===cur())) return "";
  return `<span class="eco ${b.actionUsed?"used":""}" title="動作">動作</span><span class="eco ${b.freeUsed?"used":""}" title="免費動作（每回合一次）">免費</span><span class="eco mv">移動 <b>${b.moveLeft}</b></span>${pts?ptsHTML(u):""}`;
}
// 熟練格（大爺 2026-10-01 畫的）：直的一小塊，I 在最下面、高階往上疊；實心＝還剩的格子，空心＝用掉的
// I 那一排留在燈號列裡；II 以上平常收成 I 上面一條隱藏條，點了才往上展開（絕對定位往上長，不會把燈號列撐高）
let slotLightsOpen = false;
function ptsHTML(u){
  const max = slotMax(u), s = slotsOf(u);
  const row = i => { const m = max[i], n = Math.min(m, s[i]||0);
    return `<span class="sl-r" title="熟練格・${TIER_NAME[i+1]} ${n}/${m}"><em>${ROMAN[i+1]}</em><b>${"●".repeat(n)}<i>${"○".repeat(Math.max(0, m-n))}</i></b></span>`; };
  const up = max.length > 1 ? `<span class="sl-up">${slotLightsOpen ? max.map((_,i)=>i).slice(1).reverse().map(row).join("") : ""}
      <button class="sl-bar ${slotLightsOpen?"on":""}" data-sltoggle aria-label="${slotLightsOpen?"收起":"展開"} II 以上的熟練格"></button></span>` : "";
  return `<span class="eco mv pts">${up}${row(0)}</span>`;
}
// 狀態卡裡的熟練格（大爺 10-02）：跟戰場上一樣收合，平常只看 I；點下面的細條展開 II 以上
// 戰場上往上長（上面是地圖），卡片裡往上長會撞到標題，所以改成往下展開、把底下的內容推下去
// 開關存在 B().cardSlotsOpen（在戰鬥資料裡，分層更新才看得到它變了）
function slotGridHTML(u){
  const max = slotMax(u), s = slotsOf(u), open = !!B().cardSlotsOpen && max.length > 1;
  const row = i => { const m = max[i], n = Math.min(m, s[i]||0);
    return `<span class="sl-r" title="熟練格・${TIER_NAME[i+1]} ${n}/${m}"><em>${ROMAN[i+1]}</em><b>${"●".repeat(n)}<i>${"○".repeat(Math.max(0, m-n))}</i></b></span>`; };
  const rows = open ? max.map((_,i)=>row(i)).join("") : row(0);
  const bar = max.length > 1 ? `<button class="sl-bar ${open?"on":""}" data-cardslt aria-label="${open?"收起":"展開"} II 以上的熟練格"></button>` : "";
  return `<div class="inf-slots ${open?"open":""}" style="--rows:${open ? Math.ceil(max.length/2) : 1}" aria-label="熟練格"><div class="inf-slots-g">${rows}</div>${bar}</div>`;
}
const mbtn = (cmd, label, off, sub="") => `<button class="mn-b" data-cmd="${cmd}" ${off?"disabled":""}><span>${label}</span>${sub?`<small>${sub}</small>`:""}</button>`;
// 按鈕上只放圖示、名稱（要求的階在圖示角落）；這裡只標會影響決定的：免費動作、格子用完
function skillTag(u, sk){
  if(sk.impl && sk.impl.passive) return "自動";
  if(componentProblem(u,sk))return componentProblem(u,sk);
  if(!skillReady(u, sk)) return "格子用完";
  return sk.def.free ? (B() && u===cur() && !freeLeft() ? "用動作" : "免費動作") : "";
}
function skillBtn(u, sk, label){
  const b = B(), passive = sk.impl && sk.impl.passive;
  const locked = fromTwoHanded(u, sk) && inGrapple(u);
  const off = passive || !skillReady(u, sk) || !skillCanUse(u, sk) || locked;
  const src = sk.group.id==="shield" ? ITEMS.find(i=>i.type==="shield") : (u.weapon && groupOf(u.weapon)===sk.group) ? u.weapon : (u.focus && groupOf(u.focus)===sk.group) ? u.focus : null;
  return `<div class="skill-row"><button class="skill ${b.mode&&b.mode.key===sk.key?"on":""}" data-skill="${sk.key}" data-skill-thought="${u.id}:${sk.def.name}" ${off?"disabled":""}>
    ${skillIcon(sk.group.id, sk.def, sk.impl, 24)}<span class="sk-n">${label||sk.def.name}</span><span class="sk-t">${locked ? (grappled(u) ? "被抓住" : "抓著人") : skillTag(u,sk)}</span></button>
    ${sk.synthetic&&sk.idx!==-1?"":`<button class="sk-info" data-skinfo="${sk.group.id}:${sk.idx}:${src?src.id:""}:${u.id}" aria-label="${sk.def.name}的說明">ⓘ</button>`}</div>`;
}
// 指令列（大爺 2026-09-29 定案）：輪到我方時一直貼在戰場右下角，五顆由上到下：待機、狀態、道具、走位、動作（動作離大拇指最近）
// 點進去就原地換成那一層，最底下「← 返回」；瞄準列、移動確認、移動中也在同一個位置
const dockWrap = (u, b, cls, title, body) => `<div class="bt-ov bt-menu bt-dock ${cls}${b.busy?" busy":""}" style="--c:${u.color}">
    ${title?`<div class="mn-head"><b>${u.name} · ${title}</b></div>`:""}<div class="mn-list">${body}</div></div>`;
function menuHTML(u, b){
  const act = canAct(), back = `<button class="mn-back" data-cmd="${["skills","shove"].includes(b.menu)?"act":"root"}">← 返回</button>`;
  const lv = b.menu || "root";
  let body = "", title = "";
  if(lv==="root"){
    const freeSk = canFree();   // 搜索只要有免費動作就能用（搜四周），所以免費動作還在就有事可做
    const hasItems = u.items.length || u.spare.length || powderCount(u);
    body = mbtn("act","動作", !act && !freeSk, !act && freeSk ? "只剩免費招式" : "") +
           mbtn("move","走位", !canWalk() && !act) +
           mbtn("items","道具", !hasItems || !canFree(), !hasItems ? "身上沒有" : !canFree() ? "動作都用完了" : freeLeft() ? "免費動作" : "用掉動作") +
           mbtn("status","狀態", false, u.name) +
           mbtn("wait","待機", false, "結束回合");
  } else if(lv==="move"){
    title = "走位";
    const hb = hideBlock(u);
    body = mbtn("walk","移動", !canWalk(), `剩 ${b.moveLeft} 格`) + mbtn("dash","衝刺", !act, `用掉動作，移動 +${b.baseMove}`) +
           mbtn("disengage","撤離", !act, "用掉動作，不被藉機攻擊") +
           mbtn("hide","潛行", !act || !!hb, hb || `d20＋敏捷 ≥ ${HIDE_DC}${u.armor && u.armor.stealth ? `（${u.armor.n}：劣勢）` : ""}`) + back;
  } else if(lv==="act"){
    title = "動作";
    const atks = attackSkills(u);
    const foesNear = adjFoes(u).length;
    body = (grappled(u) ? mbtn("escape","掙脫", !act, `被${(grapplerOf(u)||{}).name||""}抓住`) : "") +
           (hasVia(u,"restrained","net") ? mbtn("unnet","掙脫網子", !act, `力量檢定 ${hasVia(u,"restrained","net").dc}`) : "") +
           (has(u,"burning") ? mbtn("douse","撲滅火焰", !act, "身上著火了") : "") +
           (atks.length>1 ? atks.map(sk=>skillBtn(u,sk)).join("") : atks.length ? skillBtn(u,atks[0],"攻擊") : "") + mbtn("skills","技能", false) + mbtn("dodge","閃避", !act, "被打有劣勢") +
           mbtn("search","搜索", !canFree(), freeLeft() ? "免費動作" : "用掉動作") +
           mbtn("help","協助", !act || !helpList(u).length, helpList(u).some(p=>p.down) ? "可扶起倒下隊友" : "鄰格隊友攻擊優勢") +
           mbtn("grapple","擒抱", !act || !freeHand(u) || !GEN_ACT.grapple.targets(u).length, holdsTwoHanded(u) ? "拿著雙手武器" : !freeHand(u) ? "要空一隻手" : "抓住就不能移動") +
           mbtn("shove","推撞", !act || !foesNear, "推開或推倒") +
           mbtn("disarm","繳械", !act || !GEN_ACT.disarm.targets(u).length, "雙手武器較難打掉") + back;
  } else if(lv==="shove"){
    title = "推撞";
    body = mbtn("shove_push","推開", !act || !GEN_ACT.shove_push.targets(u).length, "推開 1 格") +
           mbtn("shove_prone","推倒", !act || !GEN_ACT.shove_prone.targets(u).length, "倒地：近戰打他有優勢") + back;
  } else if(lv==="items"){
    title = "道具";
    const groups = [...new Set(u.items)];
    body = groups.map(it=>{ const noAct = it.use.action && !canAct();   // 點心要花動作（10-03）
      return `<button class="mn-b" data-item="${it.id}" ${noAct?"disabled":""}><span>${it.n} ×${u.items.filter(i=>i===it).length}</span><small>${noAct?"動作用完了":it.use.kind==="drink"?"喝或餵貼身隊友":it.use.kind==="eat"?"吃或餵貼身隊友（用掉動作）":`丟 ${it.use.range} 格內`}</small></button>`; }).join("") +
           (powderCount(u)?`<button class="mn-b" data-placebarrel ${!canAct()?"disabled":""}><span>${WORLD_OBJECT_TEXT.place} ×${powderCount(u)}</span><small>${WORLD_OBJECT_TEXT.placeAction}</small></button>`:"")+
           u.spare.slice(0,1).map((w,i)=>`<button class="mn-b" data-swap="${i}"><span>切換配置：${w.n}${u.offhand2?"＋"+u.offhand2.n:""}</span><small>主手與副手一起切換</small></button>`).join("") +
           `<button class="mn-back" data-cmd="root">← 返回</button>`;
  } else if(lv==="skills"){
    title = "技能";
    const atkKeys = new Set(attackSkills(u).map(s=>s.key));
    // 照要求的階分組（大爺 2026-10-01，參考索拉塔）：每組標題寫階數和那一階剩的格子，之後有高階招式就自動多一組
    const sks = unitSkills(u).filter(s=>!atkKeys.has(s.key)), max = slotMax(u), sl = slotsOf(u);
    const tiers = [...new Set(sks.map(baseTierOf))].sort((a,c)=>a-c);
    body = `<div class="skills">${tiers.map(t=>{
      const n = Math.min(max[t-1]||0, sl[t-1]||0);
      const head = t ? `${ROMAN[t]} <b>${"●".repeat(n)}<i>${"○".repeat(Math.max(0,(max[t-1]||0)-n))}</i></b>` : "不用格子";
      return `<div class="sk-tier">${head}</div>` + sks.filter(s=>baseTierOf(s)===t).map(s=>skillBtn(u,s)).join("");
    }).join("")}</div>` + back;
  }
  return dockWrap(u, b, `dk-${lv}`, title, body);
}
// 移動中（藍色格子）：指令列換成剩幾格＋返回；做得跟指令列一樣窄，不擋住底下的格子
function moveBarHTML(u, b){
  return dockWrap(u, b, "dk-pick dk-slim", "", `<p class="aim-note">點藍色格子<br>剩 <b>${b.moveLeft}</b> 格</p><button class="mn-back" data-cmd="move">← 返回</button>`);
}
function confirmHTML(u, b){
  return dockWrap(u, b, "dk-pick bt-confirm", "", `<p class="aim-note">移動到這裡？</p><button class="mn-b ok" data-move="ok"><span>確認</span></button><button class="mn-b" data-move="undo"><span>取消</span><small>回到原位</small></button>`);
}
// 瞄準列：選了招式之後，決定用哪一階的格子（升階）、魔法飛彈還要點幾發、對自己放的按「施放」
// 沒什麼好調的（普攻、道具、擒抱……）就只寫要點哪裡＋取消
function aimHTML(u, b){
  const k = b.mode.key;
  const plain = (name, note) => dockWrap(u, b, "dk-pick dk-slim bt-aim", "", `<p class="aim-note"><b>${name}</b><br>${note}</p><button class="mn-back" data-aim="cancel">← 取消</button>`);
  if(k==="placeBarrel")return plain(WORLD_OBJECT_TEXT.place,WORLD_OBJECT_TEXT.placeHint);
  if(k==="search") return plain("搜索", "點紅色格子裡的敵人");
  if(k==="help") return plain("協助", "點紅色格子裡的隊友");
  if(k==="item"){ const it = u.items.find(i=>i.id===b.mode.item); return plain(it ? it.n : "道具", "點紅色格子：敵人＝丟，貼身隊友＝交給他"); }
  if(GEN_ACT[k]) return plain(GEN_ACT[k].name, "點紅色格子裡的敵人");
  const sk = unitSkills(u).find(s=>s.key===k); if(!sk) return "";
  const ts = canUp(sk) ? tiersFor(u, sk) : [], tier = ts.includes(b.tier) ? b.tier : ts[0];
  const up = upOf(u, sk, tier), self = sk.impl.target==="self";
  const darts = sk.impl.multi ? b.mode.darts||[] : null;
  if(ts.length < 2 && !up && !darts && !self) return plain(k===(attackSkill(u)||{}).key ? "攻擊" : sk.def.name, "點紅色格子選目標");
  const rows = [];
  // 選階（大爺 2026-10-01）：平常只顯示選中的那一階＋「＋」；點「＋」往上展開其他階（高階在上），「＋」變「×」；選好就收起來
  if(ts.length > 1 || up){
    const max = slotMax(u), s = slotsOf(u);
    const chip = t => { const n = s[t-1]||0;
      return `<button class="mn-b aim-tier ${t===tier?"on":""}" data-aim="t${t}" ${n?"":"disabled"}><span>${ROMAN[t]}</span><small>${"●".repeat(n)}<i>${"○".repeat(Math.max(0,max[t-1]-n))}</i></small></button>`; };
    const others = []; for(let t=max.length; t>=baseTierOf(sk); t--) if(t!==tier) others.push(chip(t));
    const toggle = ts.length > 1 ? `<button class="mn-b aim-tgl" data-aim="toggle" aria-label="${b.tierOpen?"收起":"展開"}其他階">${b.tierOpen?"×":"＋"}</button>` : "";
    rows.push(`${b.tierOpen?`<div class="aim-tiers">${others.join("")}</div>`:""}<div class="aim-cur">${chip(tier)}${toggle}</div>${up?`<p class="aim-note">升 <b>${up}</b> 階</p>`:""}`);
  }
  if(darts) rows.push(`<p class="aim-note">還要點 <b>${sk.impl.darts()-darts.length}</b> 發${darts.length?`（已選：${darts.map(d=>d.name).join("、")}）`:""}</p>`);
  else if(!self) rows.push(`<p class="aim-note">點紅色格子選目標</p>`);
  if(self) rows.push(`<button class="mn-b ok" data-aim="cast"><span>施放</span></button>`);
  rows.push(`<button class="mn-back" data-aim="cancel">← 取消</button>`);
  return dockWrap(u, b, "dk-pick dk-aim bt-aim", sk.def.name, rows.join(""));
}
// 資源燈號：輪到我方時放在紀錄條正上方（大爺：不要佔指令列的空間）
function resHTML(u, b){ return `<span class="econ">${econHTML(u,b)}</span>`; }
function isTwoHand(it){ return !!(it && it.props && it.props.includes("雙手")); }
function syncWeaponSet(u){
  u.activeSet=u.activeSet===2?2:1;
  if(u.activeSet===1){
    if(isTwoHand(u.weapon)) u.shield=false;
  }else{
    if(isTwoHand(u.spare&&u.spare[0])) u.offhand2=null;
  }
}
function switchWeaponSet(u,set){
  if(!u||u.side!=="pc")return;
  if(set===2 && equipmentRequirement(u.spare?.[0],k=>abilityScore(u,k)))return;
  u.activeSet=set===2?2:1;
  // 戰鬥實際使用欄位永遠指向目前配置；切組不消耗任何動作。
  if(u.activeSet===2){
    const a=u.weapon, b=u.spare&&u.spare[0]||null;
    u.weapon=b; u.spare[0]=a;
    const sh=u.shield; u.shield=!!u.offhand2; u.offhand2=sh?{n:"盾牌",type:"shield",_shield:true}:null;
    u.activeSet=1; // 交換後目前組仍以 UI 的配置Ⅰ代表
  }
  syncWeaponSet(u);
}
function equipItemAt(u, from, to){
  if(!u || u.side!=="pc") return false;
  u.backpack=u.backpack||[]; u.spare=u.spare||[]; u.accessories=u.accessories||[];
  const shieldObj=()=>({n:"盾牌",type:"shield",_shield:true});
  const get=slot=>{
    if(slot==="weapon1")return u.weapon||null;
    if(slot==="weapon2")return u.spare[0]||null;
    if(slot==="offhand1")return u.shield?shieldObj():null;
    if(slot==="offhand2")return u.offhand2||null;
    if(slot==="armor")return u.armor||null;
    if(slot==="acc1")return u.accessories[0]||null;
    if(slot==="acc2")return u.accessories[1]||null;
    if(slot==="backpack")return u.backpackEquip||null;
    if(slot.startsWith("bag:"))return u.backpack[+slot.slice(4)]||null;
    return null;
  };
  const accepts=(slot,it)=>{
    if(!it)return true;
    if(slot!=="bag" && equipmentRequirement(it,k=>abilityScore(u,k)))return false;
    if(slot==="weapon1"||slot==="weapon2")return it.type==="weapon"||it.type==="focus";
    if(slot==="offhand1"||slot==="offhand2")return it.type==="shield";
    if(slot==="armor")return it.type==="armor";
    if(slot==="acc1"||slot==="acc2")return it.type==="accessory";
    if(slot==="backpack")return isBag(it);
    if(slot==="bag")return true;
    return false;
  };
  const take=slot=>{
    const it=get(slot); if(!it)return null;
    if(slot==="weapon1")u.weapon=null;
    else if(slot==="weapon2")u.spare.splice(0,1);
    else if(slot==="offhand1")u.shield=false;
    else if(slot==="offhand2")u.offhand2=null;
    else if(slot==="armor")u.armor=null;
    else if(slot==="acc1")u.accessories.splice(0,1);
    else if(slot==="acc2")u.accessories.splice(1,1);
    else if(slot==="backpack")u.backpackEquip=null;
    else if(slot.startsWith("bag:"))u.backpack.splice(+slot.slice(4),1);
    return it;
  };
  const put=(slot,it)=>{
    if(!it)return;
    if(slot==="weapon1")u.weapon=it;
    else if(slot==="weapon2")u.spare[0]=it;
    else if(slot==="offhand1")u.shield=true;
    else if(slot==="offhand2")u.offhand2=it;
    else if(slot==="armor")u.armor=it;
    else if(slot==="acc1")u.accessories[0]=it;
    else if(slot==="acc2")u.accessories[1]=it;
    else if(slot==="backpack")u.backpackEquip=it;
    else if(slot==="bag")u.backpack.push(it);
  };
  const a=get(from); if(!a)return false;
  const target=to==="bag"?null:get(to);
  if(!accepts(to,a)||(target&&!accepts(from.startsWith("bag:")?"bag":from,target)))return false;
  const moving=take(from);
  if(to==="bag")put("bag",moving);
  else{
    const displaced=take(to); put(to,moving);
    if(displaced){ if(from.startsWith("bag:"))put("bag",displaced); else put(from,displaced); }
  }
  // 雙手武器獨佔整組；裝上時該組副手自動收回背包。
  if((to==="weapon1"||from==="weapon1") && isTwoHand(u.weapon) && u.shield){u.backpack.push(shieldObj());u.shield=false;}
  if((to==="weapon2"||from==="weapon2") && isTwoHand(u.spare[0]) && u.offhand2){u.backpack.push(u.offhand2);u.offhand2=null;}
  syncBattleBag(u);
  blog(`${u.name}整理了裝備`,"skill");
  return true;
}
function bindGearDrag(){
  let drag=null, ghost=null, over=null, sx=0, sy=0;
  // 手機上背包清單要能上下滑（大爺 2026-10-01 選 A）：清單裡的道具用手指要「長按」才開始拖曳，
  // 長按前手指移動超過門檻就當成捲動，交給瀏覽器捲清單。滑鼠、裝備格照舊一按住就能拖
  const LONG_PRESS=300, SCROLL_TOL=8;
  document.querySelectorAll("[data-gearitem]").forEach(el=>{
    battleListen(el,"pointerdown",e=>{
      if(e.button!==undefined&&e.button!==0)return;
      const needHold=e.pointerType==="touch"&&!!el.closest(".gear-bagitems");
      let armed=!needHold, timer=null;
      drag={uid:el.dataset.uid,from:el.dataset.gearitem}; sx=e.clientX; sy=e.clientY;
      const lift=()=>{ ghost=el.cloneNode(true); ghost.classList.add("gear-ghost"); document.body.appendChild(ghost); el.classList.add("gear-lift"); ghost.style.left=sx+"px"; ghost.style.top=sy+"px"; };
      // 浮起來之後擋掉瀏覽器的捲動，手指的移動才會一路交給拖曳
      const noScroll=ev=>{ if(armed) ev.preventDefault(); };
      const move=ev=>{
        if(!armed){
          if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>SCROLL_TOL) stop();
          return;
        }
        if(!ghost){
          if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<5)return;
          lift();
        }
        ghost.style.left=ev.clientX+"px"; ghost.style.top=ev.clientY+"px";
        const t=document.elementFromPoint(ev.clientX,ev.clientY)?.closest("[data-gearslot],[data-gearbag]");
        if(over!==t){over?.classList.remove("gear-over");t?.classList.add("gear-over");over=t;}
        ev.preventDefault();
      };
      const stop=()=>{
        clearTimeout(timer);
        window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);window.removeEventListener("touchmove",noScroll);
        ghost?.remove(); ghost=null; el.classList.remove("gear-lift"); over?.classList.remove("gear-over");
        drag=null;over=null;
      };
      const up=ev=>{
        const didDrag=!!ghost, d=drag;
        // 被瀏覽器拿去捲動（pointercancel）不算放下
        const t=ev.type==="pointerup"?(ghost&&(ghost.style.display="none"),document.elementFromPoint(ev.clientX,ev.clientY)?.closest("[data-gearslot],[data-gearbag]")):null;
        stop();
        // 單純點擊裝備圖示不是拖曳。只有真的移動到拖曳門檻後才執行換裝，
        // 否則像背包圖示的 click 會在 pointerup 時被 render() 吃掉，導致背包無法打開。
        if(didDrag&&t&&d){
          const b=B(),u=b&&b.units.find(x=>x.id===d.uid);
          const to=t.dataset.gearslot||"bag";
          if(equipItemAt(u,d.from,to)){ b.info=u.id; refreshBattle(); }
        }
      };
      if(needHold) timer=setTimeout(()=>{ armed=true; lift(); },LONG_PRESS);
      window.addEventListener("pointermove",move,{passive:false});window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);
      window.addEventListener("touchmove",noScroll,{passive:false});
    });
  });
}
function infoHTML(v, b){
  const pct=v.hp/v.maxHp, held=victimsOf(v);
  const statusItems=[...v.statuses.map((x,i)=>{const sb=STATUS_BADGE[x.k];return {s:x,key:`s${i}`,icon:sb?.[0]||null,good:sb?.[1]||0,n:stTurns(x),label:statusLabel(v,x),desc:statusExplain(v,x)}}),...held.map((x,i)=>({s:null,key:`h${i}`,icon:"grab",good:1,n:null,label:`抓住${x.name}`,desc:`目前正抓住${x.name}；依擒抱規則限制對方移動。`}))];
  const shownStatus=[], plainStatus=[]; statusItems.forEach(x=>{if(!x.icon){if(!plainStatus.some(y=>y.label===x.label))plainStatus.push(x);return;}const prev=shownStatus.find(y=>y.icon===x.icon);if(prev){if(x.n!=null)prev.n=Math.max(prev.n||0,x.n);return;}shownStatus.push({...x});});
  const statusBadgeHTML=(shownStatus.length||plainStatus.length)?`<div class="status-unit-badges">${shownStatus.map(x=>`<button class="status-unit-badge ${x.good?"good":"bad"} ${b.statusTip===x.key?"on":""}" data-statustip="${x.key}" aria-label="${x.label}"><svg viewBox="0 0 20 20">${ST_ICON[x.icon]||""}</svg>${x.n!=null?`<span class="turns">${x.n}</span>`:""}</button>`).join("")}${plainStatus.map(x=>`<button class="status-unit-badge plain ${x.good?"good":"bad"} ${b.statusTip===x.key?"on":""}" data-statustip="${x.key}">${x.label}</button>`).join("")}</div>`:"";
  const statusPop=b.statusTip?(()=>{const x=statusItems.find(y=>y.key===b.statusTip);return x?`<div class="status-pop"><b>${x.label}</b><br>${rulesHTML(x.desc)}</div>`:""})():"";
  // 狀態卡的紙娃娃朝左：這裡畫朝右（face:1），CSS 的 .status-paper .inf-doll>svg 整張翻過來
  const doll=v.side==="pc"?`<div class="inf-doll"><svg viewBox="-20 -10 180 170" width="150" height="145">${dollSVG({id:v.id,color:v.color,mood:v.svgMood,...dollGear(v),face:1,down:v.down,prone:!v.down&&!!has(v,"prone"),x:0,y:0,w:140,seed:v.id.length*3})}</svg></div>`:"";
  const page=v.side==="pc"?(b.infoPage||"status"):"status";
  const tabs=v.side==="pc"?`<div class="gear-tabs"><button class="gear-tab ${page==="status"?"on":""}" data-infopage="status">狀態</button><button class="gear-tab ${page==="notes"?"on":""}" data-infopage="notes">小筆記</button></div>`:"";
  const notes=v.side==="pc"?notebookPageHTML(v,b):"";
  let statusPage="";
  const armorIcon=it=>`<svg class="status-armoricon" viewBox="38 76 64 66" width="42" height="42" aria-hidden="true">${armorSVG(it.base||it.n)}</svg>`;
  const eqIcon=it=>{if(!it)return `<span class="status-eqempty">＋</span>`;if(it.type==="armor")return armorIcon(it);if(isBag(it))return `<svg viewBox="0 0 120 120" width="42" height="42" aria-hidden="true">${ITEM_ART.backpack||ITEM_RAW.backpack}</svg>`;const g=groupOf(it);return g?iconSVG(equipmentArtKey(it),38):`<span class="eq-text">${it.n}</span>`};
  const eqTip=it=>it?`${it.n}\n${it.cat||it.type||"裝備"}${it.wt!=null?`・${it.wt} lb`:""}`:"空裝備格";
  if(v.side==="pc"){
    const abilities=`<div class="status-abilities">${ABILITIES.map(a=>{const n=abilityScore(v,a.k),m=modOf(n);return `<div class="status-ability"><small>${a.n}</small><div class="ab-v"><b>${n}</b><span>${m>=0?"+":""}${m}</span></div></div>`}).join("")}</div>`;
    const sh1=v.shield?{n:"盾牌",type:"shield",id:"shield",wt:6}:null;
    const eqSlot=(slot,it,label,cls,extra="")=>`<div class="status-eqslot ${cls}" data-gearslot="${slot}"><small>${label}</small>${it?`<button class="status-eqitem eq-tip" data-uid="${v.id}" data-gearitem="${slot}" data-tip="${eqTip(it)}" data-iteminfo="${it.id||""}">${eqIcon(it)}</button>`:eqIcon(null)}${extra}</div>`;
    const carried=[v.weapon,v.spare&&v.spare[0],sh1,v.offhand2,v.armor,...(v.accessories||[]),v.backpackEquip,...(v.backpack||[])].filter(Boolean);
    const load=carried.reduce((sum,it)=>sum+(Number(it.wt)||0),0), cap=abilityScore(v,"STR")*15*bagMul(v.backpackEquip), loadPct=Math.min(100,cap?load/cap*100:0);
    const bagOpen=!!b.gearBagOpen;
    const bagIt=v.backpackEquip||null;
    const bag=`<div class="status-eqslot backpack ${bagOpen?"on":""}" data-gearslot="backpack"><small>背包</small>${bagIt?`<button class="status-eqitem status-bagbtn eq-tip" data-bagtoggle data-uid="${v.id}" data-gearitem="backpack" data-tip="${eqTip(bagIt)}" aria-label="${bagOpen?"收起":"打開"}背包"><svg viewBox="0 0 120 120" aria-hidden="true">${ITEM_ART.backpack||ITEM_RAW.backpack}</svg></button>`:`<span class="status-eqempty">＋</span>`}</div>`;
    const bagDrawer=bagOpen?`<div class="status-bagdrawer gear-bag" data-gearbag><div class="gear-load"><div class="gear-load-head"><span>負重</span><b>${+load.toFixed(1)} / ${cap} lb</b></div><div class="gear-load-track"><div class="gear-load-fill" style="width:${loadPct}%"></div></div></div><div class="gear-bagitems">${(v.backpack||[]).map((it,i)=>{const g=groupOf(it);return `<button class="gear-item eq-tip" data-uid="${v.id}" data-gearitem="bag:${i}" data-iteminfo="${it.id||""}" data-tip="${eqTip(it)}">${equipmentArtKey(it)?iconSVG(equipmentArtKey(it),24):""}<span>${it.n}</span></button>`}).join("")||`<span class="gear-empty bag-drop">背包是空的；可把裝備拖到這裡</span>`}</div></div>`:"";
    statusPage=`<div class="status-page"><div class="status-loadout"><div class="status-paper">${statusBadgeHTML}${statusPop}${doll}</div>${bag}${eqSlot("acc1",v.accessories&&v.accessories[0],"飾Ⅰ","acc1")}${eqSlot("acc2",v.accessories&&v.accessories[1],"飾Ⅱ","acc2")}${eqSlot("armor",v.armor,"身體","armor")}${eqSlot("weapon1",v.weapon,"主手","main",`<button class="status-switch" data-switchset title="切換武器配置" aria-label="切換武器配置">↻</button>`)}${isTwoHand(v.weapon)?`<div class="status-eqslot off locked" data-gearslot="offhand1"><small>副手</small><span class="gear-empty">雙手</span></div>`:eqSlot("offhand1",sh1,"副手","off")}</div>${bagOpen?bagDrawer:abilities}</div>`;   // 背包打開時換掉六圍那塊（大爺 2026-10-01）
  } else {
    // 敵人、NPC：紙娃娃＋裝備格（不能拖）、六圍（介面沿用只顯示調整值，資料保存完整屬性值）；不顯示熟練格、燈號、小筆記
    // 背包：看穿（被動感知、搜索）或打倒之後才打得開（大爺 10-02）
    const big=`<div class="inf-doll"><svg viewBox="-20 -10 180 170" width="150" height="145">${dollSVG({id:v.id,color:sideColor(v),look:MONSTER_LOOK[v.look],...dollGear(v),face:1,down:v.down,prone:!v.down&&!!has(v,"prone"),x:0,y:0,w:140,seed:v.id.length*3})}</svg></div>`;
    const roSlot=(it,label,cls)=>`<div class="status-eqslot ro ${cls}"><small>${label}</small>${it?`<button class="status-eqitem eq-tip" data-tip="${eqTip(it)}" data-iteminfo="${it.id||""}">${eqIcon(it)}</button>`:""}</div>`;
    const known=pocketKnown(v), bagOpen=known && !!b.gearBagOpen, items=v.backpack||[];
    const bag=known
      ? `<div class="status-eqslot backpack ro ${bagOpen?"on":""}"><small>背包</small><button class="status-eqitem status-bagbtn" data-bagtoggle aria-label="${bagOpen?"收起":"打開"}${v.name}的背包"><svg viewBox="0 0 120 120" aria-hidden="true">${ITEM_ART.backpack||ITEM_RAW.backpack}</svg></button></div>`
      : `<div class="status-eqslot backpack ro locked" title="還沒看穿牠身上帶了什麼"><small>背包</small><span class="status-eqempty">？</span></div>`;
    const drawer=`<div class="status-bagdrawer gear-bag"><div class="gear-bagitems">${items.map(it=>{const g=groupOf(it);return `<button class="gear-item eq-tip" data-iteminfo="${it.id||""}" data-tip="${eqTip(it)}">${g?iconSVG(equipmentArtKey(it),24):""}<span>${it.n}</span></button>`}).join("")||`<span class="gear-empty">身上沒帶東西</span>`}</div></div>`;
    const abilities=`<div class="status-abilities">${ABILITIES.map(a=>{const m=v.mods[a.k]||0;return `<div class="status-ability"><small>${a.n}</small><div class="ab-v"><b>${m>=0?"+":""}${m}</b></div></div>`}).join("")}</div>`;
    const main=v.weapon||v.focus||null;
    statusPage=`<div class="status-page"><div class="status-loadout"><div class="status-paper">${statusBadgeHTML}${statusPop}${big}</div>${bag}${roSlot(v.accessories&&v.accessories[0],"飾Ⅰ","acc1")}${roSlot(v.accessories&&v.accessories[1],"飾Ⅱ","acc2")}${roSlot(v.armor,"身體","armor")}${roSlot(main,"主手","main")}${isTwoHand(main)?`<div class="status-eqslot ro off locked"><small>副手</small><span class="gear-empty">雙手</span></div>`:roSlot(v.shield?{n:"盾牌",type:"shield",id:"shield"}:null,"副手","off")}</div>${bagOpen?drawer:abilities}</div>`;
  }
  const pageBody=v.side==="pc"&&page==="notes"?notes:statusPage;
  return `<div class="bt-ov bt-info gear-info ${v.side==="pc"?(page==="status"?"status-view":"notes-view"):"status-view foe-view"}" data-anchor="${v.id}" style="--c:${v.side==="npc"?sideColor(v):v.side==="pc"?v.color:"var(--bad)"};--info-scale:${page==="status"?(b.infoScale||1):1}">
    <button class="inf-x" data-closeinfo aria-label="關閉">✕</button>
    <div class="bt-me"><div><h3>${v.name}${v.side==="pc"?`　Lv.${v.level||1}`:""}</h3><div class="dim">${v.gone==="teleport"?"被傳送回酒館":v.dead?"已被打倒":v.down?`倒下了（死亡豁免失敗 ${v.dsFail||0}/${DS_MAX}）`:`生命 ${v.hp}/${v.maxHp}`} · AC ${acOfUnit(v)} · 移動 ${v.speed}${v.side==="pc"?` · 被動感知 ${passivePer(v)}`:""}</div></div></div>
    <div class="inf-hp"><i style="width:${pct*100}%;background:${pct>.5?"var(--moss)":pct>.25?"var(--honey)":"var(--bad)"}"></i></div>
    ${v.side==="pc" && econHTML(v,b,false)?`<div class="econ">${econHTML(v,b,false)}</div>`:""}
    ${v.side==="pc"?slotGridHTML(v):""}
    ${v.oaUsed&&!v.down&&!v.dead?`<div class="inf-g dim">這輪已經藉機攻擊過了</div>`:""}
    ${tabs}${pageBody}
  </div>`;
}

// ---------- 戰鬥紀錄 ----------
// 把紀錄整理成「事件」：一行開頭（誰做了什麼）＋底下細節裡的短結果（命中、8 點穿刺、倒地……）
function logEvents(log){
  const ev = [];
  for(const l of log){
    if(!l.t.startsWith("　")){ if(l.cls!=="turn") ev.push({head:l.t, cls:l.cls, parts:[]}); continue; }
    const last = ev[ev.length-1]; if(!last) continue;
    const s = l.s || (["skill","heal","dmg"].includes(l.cls) ? l.t.trim() : "");
    if(s) last.parts.push({s, cls:l.cls});
  }
  return ev;
}
// 戰鬥紀錄三段（大爺定的）：b.logLv 0＝3 行（預設）→ 1＝6 行 → 2＝完整紀錄（10 行高、有擲骰細節、可捲動）→ 再點回 3 行
// 手機、電腦都在戰場左下；指令選單、瞄準列、移動確認、狀態卡打開時紀錄讓位，關掉後回到原本的段數
const LOG_HINT = ["展開 ▴", "完整紀錄 ▴"];
// 「3 行」「6 行」是字的行數（大爺：預設要能完整看到三行）：長的句子換行完整顯示，最新的貼在最下面，舊的從上面推出去
function logStripRows(b){
  const shown = b.log.filter(logDue);
  b._stripN = shown.length;
  const ev = logEvents(shown).slice(-6);             // 最多 6 件就夠填滿 6 行；多的反正會被推出去
  if(!ev.length) return "";
  return `<div class="ls-lines">${ev.map((e,i)=>`<div class="ls-ev lg-${e.cls||""}" style="opacity:${(.45 + .55*(i+1)/ev.length).toFixed(2)}">
    <span class="ls-h">${e.head}</span>${e.parts.length ? `<span class="ls-a">→</span>${e.parts.map(p=>`<span class="lg-${p.cls}">${p.s}</span>`).join("，")}` : ""}</div>`).join("")}</div>`
    + `<span class="ls-more">${LOG_HINT[b.logLv||0]}</span>`;
}
function logStripHTML(b){
  const rows = logStripRows(b);
  return rows ? `<button class="bt-logstrip lv${b.logLv||0}" id="logOpen" aria-label="${b.logLv===1 ? "打開完整戰鬥紀錄" : "展開戰鬥紀錄"}" aria-live="polite">${rows}</button>` : "";
}
// 打中的那一刻才補上結果：有新的紀錄到時間了就只重畫縮小條的內容（按鈕本身不換，點擊照常）
// 縮小條捲到最新（字少時本來就在最上面，捲不動；滿了才會捲到底）
function stripToEnd(){ const box = document.querySelector(".bt-logstrip .ls-lines"); if(box) box.scrollTop = box.scrollHeight; }
function refreshLogStrip(){
  const b = B(); if(!b) return;
  const el = document.querySelector(".bt-logstrip"), lb = document.getElementById("logBody");
  if(b.log.filter(logDue).length === b._stripN) return;
  if(el){ el.innerHTML = logStripRows(b); stripToEnd(); }
  if(lb){ lb.innerHTML = logPanelRows(b); if(b.logStick!==false) lb.scrollTop = lb.scrollHeight; }
}
function logPanelRows(b){
  const shown = b.log.filter(logDue); b._stripN = shown.length;
  return shown.map(l=>`<div class="lg ${l.cls?"lg-"+l.cls:""} ${l.t.startsWith("　")?"lg-d":""}">${l.t}</div>`).join("");
}
function logPanelHTML(b){
  return `<div class="bt-ov bt-logpanel" id="logPanel" role="button" aria-label="收回戰鬥紀錄">
    <div class="lp-head"><b>戰鬥紀錄</b><button class="inf-x" id="logClose" aria-label="收回紀錄">✕</button></div>
    <div class="lp-body" id="logBody">${logPanelRows(b)}</div></div>`;
}


function restChoiceHTML(b){return restNotebookHTML(b);}

function battleInterfaceHTML(){
  const b = B();
  if(!b) return `<section class="page"><p>沒有進行中的戰鬥。</p></section>`;
  const u = cur();
  const order = b.units.map((v,i)=>v.side==="npc" || foeHid(v) || (b.phase==="combat"&&!inCombat(v)) ? "" : `<div class="ord ${i===b.turn?"now":""} ${v.dead||v.down?"out":""}" style="--c:${v.side==="pc"?v.color:"#e0766e"}" title="${nameFor(v)}" ${b.phase==="explore"&&v.side==="pc"?`data-explore-unit="${v.id}" role="button" aria-label="${v.name}"`:""}>
      <svg viewBox="0 0 60 60" width="40" height="40">${faceSVG(v,4,4,52)}</svg></div>`).join("");

  // 上方狀態列：輪到誰、行動經濟、提示
  let hint = "";
  const teaching = b.tut>=0 && b.tut<TUTORIAL.length;   // 操作提示只在教學期間顯示
  if(teaching && u.side==="pc" && !b.busy){
    if(b.pendingMove) hint = "確認移動，或取消回到原位";
    else if(b.mode && b.mode.key==="item") hint = "點紅色格子：敵人＝丟過去，貼身隊友＝交給他（喝的＝餵他）";
    else if(b.mode && GEN_ACT[b.mode.key]) hint = `點紅色格子裡的敵人${GEN_ACT[b.mode.key].name}（點其他地方取消）`;
    else if(b.mode) hint = b.mode.key==="help" ? "點紅色格子裡的隊友（點其他地方取消）" : "點紅色格子選目標（點其他地方取消）";
    else if(b.moveMode) hint = "點藍色格子移動";
  }
  const hud = b.result || foeHid(u) ? "" : `<div class="bt-hud" style="--c:${u.side==="pc"?u.color:"var(--bad)"}">
    <svg viewBox="0 0 60 60" width="34" height="34">${faceSVG(u,4,4,52)}</svg>
    <b>${nameFor(u)}${u.side==="foe"?"行動中……":"的回合"}</b>
    ${hint?`<span class="hud-hint">${hint}</span>`:""}</div>`;

  let ov = "";
  if(b.result){
    // 勝利：只放一條常見的勝利標題，不擋操作（大爺 10-02：拿掉整個勝利視窗）
    if(b.result==="win") ov = `<div class="bt-victory" aria-live="polite"><div class="bv-band"></div><div class="bv-title">${POP_TEXT.victory}</div></div>`
      + (b.def.after ? `<button class="btn bt-after" id="afterWin">繼續 ▶</button>` : "");   // 打完有後續劇情（伏擊→商隊，10-03）
    else ov = `<div class="bt-ov bt-result ${b.result}">
      <h3>${b.result==="win"?"勝利！":"傳送回酒館……"}</h3>
      <p>卡姆的傳送魔法把四小隻送回酒館了。</p>
      ${state.retriesLeft > 0 ? `<button class="btn" id="retry">重新挑戰（剩 ${state.retriesLeft} 次）</button>` : `<p class="dim">重新挑戰用完了，長休之後才能再用。</p>`}
      <button class="btn ghost" id="toTavern">傳送回酒館</button></div>`;
  } else {
    const iv = b.info && b.units.find(v=>v.id===b.info);
    if(iv) ov += infoHTML(iv, b);
  }
  // 右下角指令列：我方回合一直在（演出中變淡、不能按）；敵人回合收起來不擋畫面
  let dock = "";
  const mine = u.side==="pc" && !b.result;
  if(mine){
    if(b.pendingMove && !b.busy) dock = confirmHTML(u, b);
    else if(b.mode && !b.busy) dock = aimHTML(u, b);
    else if(b.moveMode && !b.busy) dock = moveBarHTML(u, b);
    else dock = menuHTML(u, b);
    if(b.phase==="explore")dock=exploreDockHTML();
    else if(b.worldObject&&!b.mode&&!b.moveMode){const o=b.worldObject;dock=dockWrap(u,b,"dk-pick",EXPLORE_OBJECTS.powderBarrel.name,`<button class="mn-b" data-worldcmd="pickup" ${!worldCanAct(u)||dist(u,o)>1?"disabled":""}>${WORLD_OBJECT_TEXT.pickup}<small>${WORLD_OBJECT_TEXT.carryAction}</small></button><button class="mn-back" data-worldcmd="close">← 返回</button>`);}
  }
  // 紀錄：指令列在最上層那一頁（或演出中）才出現；點進子選單、瞄準、移動、狀態卡打開時讓位，段數記著
  const deep = mine && !b.busy && (b.pendingMove || b.mode || b.moveMode || (b.menu && b.menu!=="root"));
  const logEl = b.result || deep || ov ? "" : b.logLv===2 ? logPanelHTML(b) : logStripHTML(b);
  if(b.manualCombat&&mine&&!b.busy)dock+=dockWrap(u,b,"dk-pick",EXPLORE_COMBAT.return,`<button class="mn-b" data-explore-cmd="return">${EXPLORE_COMBAT.return}</button>`);
  const bottom = `<div class="bt-bottom">${dock?`<div class="bt-dockrow">${dock}</div>`:""}<div class="bt-resrow">${mine&&b.phase!=="explore"?resHTML(u,b):""}</div>${logEl}</div>`;
  const tut = b.tut>=0 && b.tut<TUTORIAL.length && !b.result ? `<div class="tut"><div class="tut-text"><b>${PAGE_UI.tutorial}</b> ${TUTORIAL[b.tut]}</div><div class="tut-actions"><button class="tut-x" id="tutNext">知道了</button><button class="tut-close" id="tutClose" aria-label="關閉教學">✕</button></div></div>` : "";
  return {
    head: `<div class="head"><div><h2>${b.phase==="explore"?EXPLORE_UI.title:b.manualCombat?EXPLORE_UI.turn:"戰鬥"}：${b.def.name}</h2><p class="rule">${b.phase==="explore"?(b.exploreSolo?EXPLORE_UI.individual:EXPLORE_UI.group):`第 ${b.round} 回合`}${b.def.seed!==undefined ? ` · Seed ${b.def.seed}` : ""}</p></div>
      <div class="sys-tools">
        <button class="snd ${SFX.isMuted()?"off":""}" id="sndToggle" aria-label="主音量" title="主音量">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${SFX.isMuted()?'<path d="M17 9l5 6M22 9l-5 6"/>':'<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'}</svg></button>
        <button class="gear-btn" id="gearToggle" aria-label="主選單" title="主選單"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.4.3.7.6 1 .3.3.7.4 1.1.4h.1v4h-.1c-.4 0-.8.1-1.1.4-.3.3-.5.6-.6 1.2Z"/></svg></button>
        ${b.sysPop==="volume"?`<div class="vol-pop" id="volPop"><button class="snd ${SFX.isMuted()?"off":""}" id="volMute" aria-label="靜音切換"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/></svg></button><input id="masterVolume" type="range" min="0" max="100" value="${Math.round(SFX.getVolume()*100)}" aria-label="主音量"><span class="vol-num" id="volNum">${SFX.isMuted()?0:Math.round(SFX.getVolume()*100)}%</span></div>`:""}
        ${b.sysPop==="menu"?`<div class="sys-menu" id="sysMenu"><h3>主選單</h3><button data-sys="continue">繼續遊戲</button><button data-sys="party">隊伍</button><button data-sys="title">回到標題</button></div>`:""}
      </div></div>`,
    order: `<div class="order">${order}</div>`,
    hud:b.phase==="explore"?`<div class="bt-hud" style="--c:${u.color}"><b>${u.name} ${b.exploreStopped?(b.exploreStopReason==="trap"?EXPLORE_ACTION_TEXT.trapHit:EXPLORE_UI.found):EXPLORE_UI.hint}${b.exploreSneak?` · ${EXPLORE_UI.hiddenCount} ${exploreParty().filter(isHid).length}/${exploreParty().length}`:""}</b></div>`:hud,
    tutorial:tut,
    dice: `<div class="dp-anchor">${dicePanelHTML(b)}</div>`,
    overlays: `${bottom}${ov}${b.critOn ? `<div class="crit-fx"><div class="crit-flash"></div><div class="crit-txt">${POP_TEXT.crit}</div></div>` : ""}`
  };
}
function battleUISlot(k,html){ return `<div data-battle-ui="${k}" style="display:contents">${html}</div>`; }
function renderBattle(){
  if(!B()) return `<section class="page"><p>沒有進行中的戰鬥。</p></section>`;
  const ui=battleInterfaceHTML();
  return `<section class="page battle">${["head","order","hud","tutorial","dice"].map(k=>battleUISlot(k,ui[k])).join("")}<div class="board-wrap">${boardSVG()}${battleUISlot("overlays",ui.overlays)}</div></section>`;
}
// 比較資料依賴，不比較產生出的 HTML；每次更新完整的指定層。
// 介面不依賴走路座標／面向／跳躍時間，保留按鈕、捲動與拖曳中的 DOM。
function battleDataKey(value, omit=[]){
  const seen=new WeakSet(), skip=new Set(omit);
  return JSON.stringify(value,(k,v)=>{
    if(skip.has(k)) return undefined;
    if(v instanceof Map) return [...v];
    if(v instanceof Set) return [...v];
    if(v && typeof v==="object"){ if(seen.has(v)) return undefined; seen.add(v); }
    return v;
  });
}
function battleLayerKeys(){
  const b=B(), u=cur();
  const units=battleDataKey(b.units,["anim","face","notePages"]);
  // 動作有開始時間（擲骰後才揮），所以場景也要看「動作現在是還沒開始／進行中／結束」，不然時間到了也不會重畫
  const animPhase=v=>{ const a=v.anim; if(!a) return 0; const el=Date.now()-a.t; return el<0?1:el<(DOLL_DUR[a.k]||0)?2:3; };
  // svgMood 在 b.units 中，場景、先攻介面與狀態卡更新鍵均涵蓋表情。
  const scene=battleDataKey([b.turn,b.result,camZoom(),b.units,b.units.map(animPhase),b.units.map(v=>v.statuses.map(s=>(s.visualAt||0)<=Date.now())),Object.values(b.groundEffects||{}).map(f=>(f.visualAt||0)<=Date.now()),(b.fx||[]).map(f=>f.t<=Date.now()),(b.proj||[]).map(p=>Date.now()<p.t?0:Date.now()<p.t+p.dur?1:2),b.def.blocks,b.drops,b.proj,b.fx,b.floats,b.marks,b.bubbles,b.phase,b.exploreMarks,b.groundEffects,b.objectTip,b.objectTip?b.cam:null]);
  const selectable=u?.side==="pc" && !b.busy && !b.result && (b.mode || b.moveMode);
  const marks=selectable?battleDataKey([b.turn,b.phase,b.mode,b.moveMode,b.moveLeft,b.actionUsed,b.dazed,units,b.def.blocks,b.groundEffects]):"none";
  const ui=battleDataKey([b,state.inv,state.focusItems,state.magicItems,state.rolls,state.retriesLeft,slotLightsOpen,SFX.isMuted(),SFX.getVolume()],
    ["objectTip","def","cam","zoom","focusReq","units","drops","proj","fx","floats","marks","bubbles","impact","logScroll","logStick","x","y","face","anim"])
    +battleDataKey(b.units,["x","y","face","anim"])
    +(b.mode?units:"");
  return {floor:boardTerrainKey(),marks,scene,ui,modal:battleDataKey([state.modal,state.modal?b.units:null]),camera:battleDataKey([b.critOn,b.def.w,b.def.h])};
}
function updateBattleUI(){
  closeGameBubble();
  const ui=battleInterfaceHTML();
  Object.entries(ui).forEach(([k,html])=>{ document.querySelector(`[data-battle-ui="${k}"]`).innerHTML=html; });
}
function refreshBattle(){
  if(state.page!=="battle" || !B() || !document.getElementById("board-floor") || refreshBattle.battle!==B()) { render(); return; }
  updateBattleFrame();
}
function updateBattleFrame(){
  const keys=battleLayerKeys(), prev=refreshBattle.keys||{}, terrain=keys.floor!==prev.floor;
  if(terrain) updateBoardFloor();
  if(terrain || keys.marks!==prev.marks) updateBoardMarks();
  if(terrain || keys.scene!==prev.scene) updateBoardScene();
  const uiChanged=keys.ui!==prev.ui;
  if(uiChanged) updateBattleUI();
  if(keys.modal!==prev.modal){
    document.querySelector(".modal-back")?.remove();
    document.getElementById("app").insertAdjacentHTML("beforeend",renderModal());
  }
  if(terrain || keys.camera!==prev.camera) syncBoardCamera();
  if(uiChanged || B().focusReq) bindBattle();
  bindModal();
  refreshBattle.keys=battleLayerKeys();
}
// 保留的按鈕只綁一次；新介面節點各自取得新的事件處理器。
const battleEvents=new WeakMap();
function battleListen(el,type,fn,options){
  if(!el)return;
  let types=battleEvents.get(el); if(!types){types=new Set();battleEvents.set(el,types);}
  if(types.has(type))return; types.add(type);el.addEventListener(type,fn,options);
}

function clampInfoScale(z){ return Math.max(.75,Math.min(1.35,z)); }
let infoPinch=null, infoTouches=new Map();
function initInfoZoom(){
  if(initInfoZoom.done) return; initInfoZoom.done=true;
  window.addEventListener("wheel",e=>{
    const el=e.target.closest&&e.target.closest(".gear-info.status-view"); if(!el||!B()) return;
    e.preventDefault(); e.stopPropagation();
    const dy=e.deltaMode===1?e.deltaY*16:e.deltaY;
    B().infoScale=clampInfoScale((B().infoScale||1)*Math.exp(-dy*.0015));
    el.style.setProperty("--info-scale",B().infoScale); placeOverlays(false);
  },{passive:false,capture:true});
  window.addEventListener("pointerdown",e=>{
    const el=e.target.closest&&e.target.closest(".gear-info.status-view");
    if(!el||e.pointerType==="mouse"||e.target.closest(".gear-bagitems,.gear-item,.status-eqitem,button,input")) return;
    infoTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(infoTouches.size===2){ const [a,b]=[...infoTouches.values()]; infoPinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:B().infoScale||1}; }
  });
  window.addEventListener("pointermove",e=>{
    if(!infoTouches.has(e.pointerId)) return; infoTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(infoPinch&&infoTouches.size>=2){ const [a,b]=[...infoTouches.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); B().infoScale=clampInfoScale(infoPinch.z*d/infoPinch.d); const el=document.querySelector(".gear-info.status-view"); if(el){el.style.setProperty("--info-scale",B().infoScale);placeOverlays(false);} e.preventDefault(); }
  },{passive:false});
  const end=e=>{ if(!infoTouches.has(e.pointerId))return; infoTouches.delete(e.pointerId); if(infoTouches.size<2)infoPinch=null; };
  window.addEventListener("pointerup",end); window.addEventListener("pointercancel",end);
}

function bindBattle(){
  initBoardDrag(); initInfoZoom();
  document.querySelectorAll("[data-placebarrel]").forEach(el=>battleListen(el,"click",beginBarrelPlacement));
  document.querySelectorAll("[data-worldcmd]").forEach(el=>battleListen(el,"click",()=>worldInteract(el.dataset.worldcmd)));
  const b = B();
  if(b && !b.cam){ const ps = b.units.filter(v=>v.side==="pc"); centerCam(ps.reduce((a,v)=>a+v.x,0)/ps.length, ps.reduce((a,v)=>a+v.y,0)/ps.length - 2); }
  else if(b){ b.cam = clampCam(b.cam); applyCam(); }
  if(b && b.focusReq && !b.result){ b.focusReq = false; const u = cur();
    if(u.side==="pc") centerCam(u.x, u.y - 1, true);
    else if(!touches.size && !foeHid(u) && !onScreen(u)) centerCam(u.x, u.y - 1, true); }
  const aw = document.getElementById("afterWin"); if(aw) battleListen(aw, "click", ()=>{ sfx("pop"); leaveBattleTo(B().def.after); });
  document.querySelectorAll("[data-item]").forEach(el=>battleListen(el,"click", ()=>{ sfx("pop"); const b = B(); b.menu = null; b.mode = {key:"item", item:el.dataset.item}; refreshBattle(); }));
  document.querySelectorAll("[data-swap]").forEach(el=>battleListen(el,"click", ()=>{ swapWeapon(cur(), +el.dataset.swap); }));
  document.querySelectorAll("[data-skill]").forEach(el=>battleListen(el,"click", ()=>{ sfx("pop"); pickSkill(el.dataset.skill); }));
  document.querySelectorAll("[data-sltoggle]").forEach(el=>battleListen(el,"click", ()=>{ slotLightsOpen = !slotLightsOpen; sfx("pop"); refreshBattle(); }));
  document.querySelectorAll("[data-cardslt]").forEach(el=>battleListen(el,"click", e=>{ e.stopPropagation(); const b=B(); b.cardSlotsOpen=!b.cardSlotsOpen; sfx("pop"); refreshBattle(); }));
  document.querySelectorAll("[data-aim]").forEach(el=>battleListen(el,"click", ()=>{ const a = el.dataset.aim;
    if(/^t\d$/.test(a)) aimTier(+a.slice(1)); else if(a==="toggle") aimTierToggle(); else if(a==="cast") aimCast(); else aimCancel(); }));
  document.querySelectorAll("[data-move]").forEach(el=>battleListen(el,"click", ()=>{ sfx(el.dataset.move==="ok"?"pop":"back"); confirmMove(el.dataset.move==="ok"); }));
  document.querySelectorAll("[data-explore-unit]").forEach(el=>battleListen(el,"click",()=>exploreSelect(el.dataset.exploreUnit)));
  document.querySelectorAll("[data-explore-cmd]").forEach(el=>battleListen(el,"click",()=>exploreCmd(el.dataset.exploreCmd)));
  document.querySelectorAll("[data-cmd]").forEach(el=>battleListen(el,"click", ()=>{ const c = el.dataset.cmd; if(!["dodge","wait"].includes(c)) sfx(el.classList.contains("mn-back") ? "back" : "pop"); battleCmd(c); }));
  battleListen(document.getElementById("sndToggle"),"click", (e)=>{ e.stopPropagation(); b.sysPop=b.sysPop==="volume"?null:"volume"; refreshBattle(); });
  battleListen(document.getElementById("gearToggle"),"click", (e)=>{ e.stopPropagation(); b.sysPop=b.sysPop==="menu"?null:"menu"; refreshBattle(); });
  battleListen(document.getElementById("volMute"),"click", (e)=>{ e.stopPropagation(); SFX.toggleMuted(); if(!SFX.isMuted()) sfx("pop"); refreshBattle(); });
  battleListen(document.getElementById("masterVolume"),"input", e=>{ SFX.setVolume(+e.target.value/100); const n=document.getElementById("volNum"); if(n)n.textContent=`${e.target.value}%`; document.getElementById("sndToggle")?.classList.toggle("off",+e.target.value===0); });
  document.querySelectorAll("[data-sys]").forEach(el=>battleListen(el,"click",()=>{ const a=el.dataset.sys; b.sysPop=null; if(a==="continue"){refreshBattle();return;} if(a==="party"){const p=b.units.find(x=>x.side==="pc"); if(p){b.info=p.id;b.infoPage="status";} refreshBattle();return;} if(a==="title"){state.page="cover";refreshBattle();window.scrollTo(0,0);} }));
  battleListen(document.querySelector("[data-closeinfo]"),"click", ()=>{ B().info = null; refreshBattle(); });
  document.querySelectorAll("[data-infopage]").forEach(el=>battleListen(el,"click", ()=>{ B().infoPage=el.dataset.infopage; sfx("pop"); refreshBattle(); }));
  battleListen(document.querySelector("[data-bagtoggle]"),"click", e=>{ e.stopPropagation(); const b=B(); b.gearBagOpen=!b.gearBagOpen; sfx("pop"); refreshBattle(); });
  battleListen(document.querySelector("[data-switchset]"),"click", e=>{ e.stopPropagation(); const b=B(),u=b.units.find(x=>x.id===b.info); if(u){switchWeaponSet(u,2); syncBattleBag(u); sfx("pop"); refreshBattle();} });
  document.querySelectorAll("[data-statustip]").forEach(el=>battleListen(el,"click", ()=>{ const b=B(),k=el.dataset.statustip; b.statusTip=b.statusTip===k?null:k; sfx("pop"); refreshBattle(); }));
  document.querySelectorAll("[data-notepage]").forEach(el=>battleListen(el,"click", ()=>{ const [id,p]=el.dataset.notepage.split(":"); const b=B(); b.notePages=b.notePages||{}; b.notePages[id]=Math.max(1,+p||1); sfx("pop"); refreshBattle(); }));
  document.querySelectorAll("[data-noteskill]").forEach(el=>battleListen(el,"click", ()=>{
    const b=B(),u=b&&b.units.find(x=>x.id===b.info); if(!u)return;
    if(!toggleCarriedSkill(u,el.dataset.noteskill)){sfx("bad");return;}
    sfx("pop"); refreshBattle();
  }));
  bindGearDrag();
  document.querySelectorAll("[data-teach]").forEach(el=>battleListen(el,"click",()=>{ const [id,key]=el.dataset.teach.split(":"); const u=B().units.find(x=>x.id===id); if(u){learnFromLingling(u,key);refreshBattle();} }));
  document.querySelectorAll("[data-erase]").forEach(el=>battleListen(el,"click",()=>{ const [id,key]=el.dataset.erase.split(":"); const u=B().units.find(x=>x.id===id); if(u&&eraseNote(u,key)){syncLearnedState();refreshBattle();} }));
  if(b.exploreRest)bindRestNotebook(b);
  const restSelections=()=>restPickSelections(b);
  battleListen(document.getElementById("shortRest"),"click",()=>takeRest("short",restSelections()));
  battleListen(document.getElementById("longRest"),"click",()=>takeRest("long",restSelections()));
  battleListen(document.getElementById("retry"),"click", ()=>retryBattle());          // 還原開戰前再打（不再呼叫 syncLearnedState，它會把熟練格寫壞）
  battleListen(document.getElementById("toTavern"),"click", ()=>teleportHome());
  // 點一下往下一段：3 行 → 6 行 → 完整紀錄 → 3 行（完整紀錄裡捲動不算點）
  battleListen(document.getElementById("logOpen"),"click", ()=>{ const b = B(); b.logLv = ((b.logLv||0) + 1) % 3; if(b.logLv===2) b.logStick = true; sfx("pop"); refreshBattle(); });
  battleListen(document.getElementById("logPanel"),"click", ()=>{ B().logLv = 0; sfx("back"); refreshBattle(); });
  stripToEnd();
  battleListen(document.getElementById("dicePanel"),"click", ()=>{ B().panelHidden = true; sfx("back"); refreshBattle(); });   // 點一下收起來（想看回合順序時）
  const lb = document.getElementById("logBody");
  if(lb){   // 重畫時保留捲動位置；本來就在最底下的話，新紀錄進來時跟著往下
    lb.scrollTop = b.logStick!==false ? lb.scrollHeight : (b.logScroll||0);
    battleListen(lb,"scroll", ()=>{ b.logScroll = lb.scrollTop; b.logStick = lb.scrollTop + lb.clientHeight >= lb.scrollHeight - 8; });
  }
  battleListen(document.getElementById("tutNext"),"click", ()=>{ B().tut++; refreshBattle(); });
  // 教學的 ✕：整個教學關掉，這場不再跳（新手戰役做完後再放進主選單齒輪，大爺 2026-10-01）
  battleListen(document.getElementById("tutClose"),"click", ()=>{ B().tut = TUTORIAL.length; refreshBattle(); });
}
