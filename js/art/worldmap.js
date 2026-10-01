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
  }).join("") + (alert ? `<g class="alert"><path d="M-24 -150 h48 a10 10 0 0 1 10 10 v36 a10 10 0 0 1 -10 10 h-14 l-10 12 l-10 -12 h-14 a10 10 0 0 1 -10 -10 v-36 a10 10 0 0 1 10 -10 z" fill="#f2b441" stroke="#2a2630" stroke-width="3"/>
      <text x="0" y="-112" text-anchor="middle" font-size="36" font-weight="900" fill="#2a2630" font-family="Fraunces, Georgia, serif">!</text></g>` : "");
}
function worldMapSVG(sel, here, pos, alert){
  const {width:W, height:H, locations:L, links} = WORLD;
  // 固定種子的亂數：每次畫出來都一樣
  let seed = 20260928;
  const rnd = () => (seed = (seed*1664525 + 1013904223) % 4294967296) / 4294967296;
  const R = (a,b) => a + rnd()*(b-a);
  const loc = id => L.find(l=>l.id===id);
  const INK = "#2a2630";
  const out = [];

  // 草地底色 + 零星草叢與小花
  out.push(`<defs><radialGradient id="meadow" cx="50%" cy="55%" r="75%">
    <stop offset="0" stop-color="#9cbf6e"/><stop offset=".7" stop-color="#83a95a"/><stop offset="1" stop-color="#5f8744"/></radialGradient></defs>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#meadow)"/>`);
  for(let i=0;i<140;i++){
    const x=R(0,W), y=R(0,H);
    if(rnd()<.8) out.push(`<path d="M${x-4} ${y} q2 -7 4 0 q2 -9 4 0" stroke="#5f8744" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`);
    else out.push(`<circle cx="${x}" cy="${y}" r="2.2" fill="${["#f6e9d8","#f2b441","#e6b8c8"][Math.floor(rnd()*3)]}"/>`);
  }

  // 道路：兩地之間的弧線
  links.forEach(({a,b,style})=>{
    const {p,q,cx,cy} = roadCurve(a,b);
    const d = `M${p.x} ${p.y} Q${cx} ${cy} ${q.x} ${q.y}`;
    if(style==="road"){
      out.push(`<path d="${d}" stroke="#8a6a44" stroke-width="20" fill="none" stroke-linecap="round"/>`);
      out.push(`<path d="${d}" stroke="#d9c08e" stroke-width="13" fill="none" stroke-linecap="round"/>`);
    } else {
      out.push(`<path d="${d}" stroke="#d9c08e" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="2 12"/>`);
    }
  });

  // 會互相遮擋的物件（樹、房子、山）收集起來，依 y 由上往下畫
  const props = [];
  const tree = (x,y,s)=>props.push({y, svg:
    `<rect x="${x-3*s}" y="${y-8*s}" width="${6*s}" height="${10*s}" fill="#6e4a32"/>
     <circle cx="${x}" cy="${y-18*s}" r="${14*s}" fill="${rnd()<.5?"#3f6b3a":"#4f7d42"}" stroke="${INK}" stroke-width="2.5"/>
     <circle cx="${x-4*s}" cy="${y-22*s}" r="${5*s}" fill="#6f9960" opacity=".7"/>`});
  const house = (x,y,s,roof,glow)=>props.push({y, svg:
    `<rect x="${x-14*s}" y="${y-18*s}" width="${28*s}" height="${18*s}" fill="#f1e2c6" stroke="${INK}" stroke-width="2.5"/>
     <path d="M${x-18*s} ${y-16*s} L${x} ${y-32*s} L${x+18*s} ${y-16*s} Z" fill="${roof}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
     <rect x="${x-4*s}" y="${y-10*s}" width="${8*s}" height="${10*s}" fill="#6e4a32"/>
     ${glow?`<rect x="${x+6*s}" y="${y-14*s}" width="${6*s}" height="${5*s}" fill="#f2b441"/><circle cx="${x+9*s}" cy="${y-11.5*s}" r="${10*s}" fill="#f2b441" opacity=".25"/>`:""}`});
  // 丘陵：圓頂土丘，帶草色和陰影
  const hill = (x,y,w,h,tone)=>props.push({y, svg:
    `<path d="M${x-w} ${y} Q${x-w*.9} ${y-h} ${x} ${y-h} Q${x+w*.9} ${y-h} ${x+w} ${y} Z" fill="${tone}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
     <path d="M${x+w*.15} ${y-h*.98} Q${x+w*.85} ${y-h*.85} ${x+w} ${y} L${x+w*.35} ${y} Q${x+w*.45} ${y-h*.6} ${x+w*.15} ${y-h*.98} Z" fill="#000" opacity=".12"/>
     <path d="M${x-w*.55} ${y-h*.7} q${w*.2} ${-h*.18} ${w*.45} ${-h*.22}" stroke="#b8d08a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`});
  const rock = (x,y,s)=>props.push({y, svg:
    `<path d="M${x-10*s} ${y} L${x-7*s} ${y-9*s} L${x+2*s} ${y-12*s} L${x+10*s} ${y-5*s} L${x+9*s} ${y} Z" fill="#9a96a4" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`});
  L.forEach(l=>{
    if(l.kind==="forest"){
      // 範圍跟城鎮差不多（約 ±95 × ±70）
      for(let i=0;i<30;i++){
        const a=R(0,Math.PI*2), r=Math.sqrt(rnd());
        const x=l.x+Math.cos(a)*r*95, y=l.y+Math.sin(a)*r*70;
        if(Math.hypot(x-l.x,(y-l.y)*1.5)<38) continue; // 中間留一塊空地放名牌
        tree(x,y,R(.8,1.25));
      }
    }
    if(l.kind==="cave"){
      // 範圍跟城鎮差不多：後排兩座小丘 → 洞口大丘 → 前排兩座小丘
      [[-62,-34,48,40,"#7a9a52"],[62,-38,52,42,"#7a9a52"]].forEach(([dx,dy,w,h,t])=>hill(l.x+dx,l.y+dy,w,h,t));
      hill(l.x, l.y+12, 72, 66, "#8fae62");
      props.push({y:l.y+13, svg:`<path d="M${l.x-22} ${l.y+12} Q${l.x-22} ${l.y-24} ${l.x} ${l.y-26} Q${l.x+22} ${l.y-24} ${l.x+22} ${l.y+12} Z" fill="#1f1a24" stroke="${INK}" stroke-width="3"/>
        <path d="M${l.x-26} ${l.y-4} L${l.x-19} ${l.y-22} M${l.x+26} ${l.y-4} L${l.x+19} ${l.y-22}" stroke="#9a96a4" stroke-width="4" stroke-linecap="round"/>`});
      [[-82,26,44,30,"#86a65c"],[84,24,42,28,"#86a65c"]].forEach(([dx,dy,w,h,t])=>hill(l.x+dx,l.y+dy,w,h,t));
      [[-42,20,.9],[44,18,1]].forEach(([dx,dy,s])=>rock(l.x+dx,l.y+dy,s));
    }
    if(l.kind==="town"){
      const roofs=["#b5553f","#40669a","#8b5a34","#6f9960","#b5553f","#40669a"];
      [[-70,-40],[-20,-60],[35,-45],[80,-20],[-85,10],[-35,-5],[25,5],[70,35],[-55,50],[0,55],[45,70]].forEach(([dx,dy],i)=>
        house(l.x+dx+R(-6,6), l.y+dy+R(-4,4), R(.9,1.2), roofs[i%roofs.length], rnd()<.35));
      // 鐘樓
      props.push({y:l.y-10, svg:`<rect x="${l.x-10}" y="${l.y-62}" width="20" height="52" fill="#d8cdb8" stroke="${INK}" stroke-width="2.5"/>
        <path d="M${l.x-14} ${l.y-60} L${l.x} ${l.y-84} L${l.x+14} ${l.y-60} Z" fill="#b5553f" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="${l.x}" cy="${l.y-46}" r="5" fill="#f2b441" stroke="${INK}" stroke-width="2"/>`});
    }
    if(l.kind==="tavern"){
      house(l.x, l.y+6, 1.9, "#8b5a34", true);
      props.push({y:l.y+7, svg:`<path d="M${l.x+30} ${l.y-18} L${l.x+44} ${l.y-18}" stroke="${INK}" stroke-width="3"/>
        <rect x="${l.x+36}" y="${l.y-17}" width="16" height="12" rx="2" fill="#f2b441" stroke="${INK}" stroke-width="2"/>`});
      [[-60,-10],[-48,20],[62,-30],[70,10]].forEach(([dx,dy])=>tree(l.x+dx,l.y+dy,.9));
    }
  });
  props.sort((a,b)=>a.y-b.y).forEach(p=>out.push(p.svg));

  // 名牌與點擊範圍
  L.forEach(l=>{
    const w = l.name.length*18+24, isSel = sel===l.id;
    out.push(`<g class="loc ${isSel?"sel":""}" data-loc="${l.id}" tabindex="0" role="button" aria-label="${l.name}">
      <circle cx="${l.x}" cy="${l.y-10}" r="62" fill="transparent"/>
      ${isSel?`<ellipse cx="${l.x}" cy="${l.y+8}" rx="70" ry="26" fill="none" stroke="#f2b441" stroke-width="4" stroke-dasharray="10 8"/>`:""}
      <rect x="${l.x-w/2}" y="${l.y+18}" width="${w}" height="30" rx="15" fill="#1f1a24" stroke="${isSel?"#f2b441":"#f6e9d8"}" stroke-width="2.5"/>
      <text x="${l.x}" y="${l.y+39}" text-anchor="middle" font-size="18" font-weight="700" fill="#f6e9d8" font-family="LXGW WenKai TC, PingFang TC, Microsoft JhengHei, serif">${l.name}</text>
    </g>`);
  });

  // 隊伍棋子：在地點上，或旅行中在路上（pos）
  const at = pos || loc(here);
  if(at) out.push(`<g id="party-marker" pointer-events="none" transform="translate(${at.x} ${at.y})">${partyMarkerSVG(alert)}</g>`);
  return `<svg class="worldmap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${out.join("")}</svg>`;
}
