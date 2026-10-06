/* 大地圖（手繪風 SVG）：地形依 data/world.js 的座標自動生成 */
// 兩地之間道路的弧線（畫路和棋子走路共用同一條）
function roadCurve(a, b){
  const p = WORLD.locations.find(l=>l.id===a), q = WORLD.locations.find(l=>l.id===b);
  const mx=(p.x+q.x)/2, my=(p.y+q.y)/2, dx=q.x-p.x, dy=q.y-p.y, len=Math.hypot(dx,dy);
  const bend = len*.18;
  return {p, q, cx: mx - dy/len*bend, cy: my + dx/len*bend};
}
// 路上 t（0~1）位置的座標
// 曲線一律照 WORLD.links 裡那條路的方向算（跟畫出來的路同一條）；反方向走就從終點那頭倒著算
function roadPoint(a, b, t){
  if(WORLD.links.some(l=>l.a===b && l.b===a)){ [a,b] = [b,a]; t = 1-t; }
  const {p,q,cx,cy} = roadCurve(a,b), u = 1-t;
  return {x: u*u*p.x + 2*u*t*cx + t*t*q.x, y: u*u*p.y + 2*u*t*cy + t*t*q.y};
}
// 隊伍棋子（四張臉），以 (0,0) 為中心，外面用 transform 移動
function partyMarkerSVG(alert){
  return CRITTERS.map((c,i)=>{
    const a = -Math.PI/2 + i*Math.PI/2 + Math.PI/4, x = Math.cos(a)*30 - 22, y = -70 + Math.sin(a)*18 - 22;
    return `<circle cx="${x+22}" cy="${y+24}" r="21" fill="#1f1a24" stroke="${c.color}" stroke-width="3"/>`
      + critterSVG(c.id).replace('<svg viewBox="0 0 100 100"', `<svg x="${x}" y="${y}" width="44" height="44" viewBox="0 0 100 100"`);
  }).join("") + (alert ? `<g class="map-alert" transform="translate(0 -105) scale(1.3)">${obsBubbleBody('ok',0)}</g>` : "");
}
const WORLD_ART={terrain:'assets/world/terrain.webp',town:'assets/world/town.webp',tavern:'assets/world/tavern.webp',forest:'assets/world/forest.webp',cave:'assets/world/cave.webp'};
function worldMapSVG(sel,here,pos,alert){
 const {width:W,height:H,locations,links}=WORLD;
 const roads=links.map(({a,b})=>{const {p,q,cx,cy}=roadCurve(a,b);const d=`M${p.x} ${p.y} Q${cx} ${cy} ${q.x} ${q.y}`;return `<path d="${d}" stroke="#513826" stroke-width="21" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#dbbd86" stroke-width="13" fill="none" stroke-linecap="round"/>`;}).join('');
 const places=[...locations].sort((a,b)=>a.y-b.y).map(l=>{const w=l.id==='tavern'?175:220,h=l.id==='town'?195:170;return `<image href="${sceneAssetURL(WORLD_ART[l.id])}" x="${l.x-w/2}" y="${l.y-h+15}" width="${w}" height="${h}"/>`;}).join('');
 const labels=locations.map(l=>`<g class="loc" data-loc="${l.id}" tabindex="0" role="button" aria-label="${l.name}"><rect x="${l.x-100}" y="${l.y-160}" width="200" height="240" fill="transparent"/></g>`).join('');
 const at=pos||locations.find(l=>l.id===here);
 return `<svg class="worldmap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><g id="map-terrain"><image href="${sceneAssetURL(WORLD_ART.terrain)}" width="${W}" height="${H}" preserveAspectRatio="none"/></g><g id="map-roads">${roads}</g><g id="map-places">${places}</g><g id="map-labels">${labels}</g><g id="party-marker" pointer-events="none" transform="translate(${at.x} ${at.y})">${partyMarkerSVG(alert)}</g></svg>`;
}
