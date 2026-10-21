/* 復仇敵人的傷疤（大爺 10-21，外觀暫定：香香）
   被敲暈過、回來報仇的敵人，頭上疊一層傷疤 SVG：照「上次被敲暈的那一擊」的傷害類型
     揮砍＝三道刀疤、穿刺＝眼罩、鈍擊＝腫包＋OK 繃、火焰＝燒痕、其他（法術）＝發亮的疤紋（顏色照傷害類型）
   疊在紙娃娃的頭（側臉、受傷臉）和頭像（正面）上，不重畫怪物本身；回來幾次就疊幾道（最多 3）
   座標：每種頭各一組（100×100 的頭圖座標），先做哥布林、獸人兩種，之後再補 */
const SCAR_SPOTS = {
  goblin: {side:{eyeA:[43,53], eyeB:[67,52], top:[53,24], cheek:[48,72]}, front:{eyeA:[38,53], eyeB:[61,53], top:[50,23], cheek:[34,69]}},
  orc:    {side:{eyeA:[43,49], eyeB:[68,49], top:[58,31], cheek:[48,66]}, front:{eyeA:[36,49], eyeB:[63,49], top:[50,31], cheek:[31,65]}}
};
const SCAR_INK = "#2a2630";
const SCAR_GLOW = {寒冷:"#8fd3ff", 閃電:"#ffe36a", 強酸:"#a6e05a", 毒素:"#9bd06a", 死靈:"#b48ae0", 光耀:"#fff1a8", 力場:"#c9a2ff", 雷鳴:"#9fb7ff", 心靈:"#ff9ad5"};
// 一種傷疤：kind＝傷害類型（揮砍／穿刺／鈍擊／火焰／其他），s＝這張頭圖的位置表，n＝第幾道（疊的時候錯開一點）
function scarSVG(kind, s, n=0){
  const [ax,ay] = s.eyeA, [bx,by] = s.eyeB, [tx,ty] = s.top, [cx,cy] = s.cheek;
  if(kind==="揮砍"){   // 三道斜刀疤，劃過其中一隻眼
    const x = ax - 7 + n*3, y = ay - 12;
    return `<g class="scar scar-slash">${[0,5,10].map(d=>`<path d="M${x+d} ${y} L${x+d+9} ${y+22}" stroke="${SCAR_INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M${x+d} ${y} L${x+d+9} ${y+22}" stroke="#e8857a" stroke-width="1.6" stroke-linecap="round"/>`).join("")}</g>`;
  }
  if(kind==="穿刺"){   // 眼罩：黑色眼罩蓋住另一隻眼，帶子斜過頭
    return `<g class="scar scar-patch"><path d="M${bx-16} ${by-14} Q${bx} ${by-20} ${bx+16} ${by-8}" stroke="${SCAR_INK}" stroke-width="2.6" fill="none"/>
      <ellipse cx="${bx}" cy="${by}" rx="8.5" ry="7.5" fill="#3a3340" stroke="${SCAR_INK}" stroke-width="2.6"/><path d="M${bx-4} ${by-3} Q${bx} ${by-5} ${bx+3} ${by-3}" stroke="#6b6175" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
  }
  if(kind==="鈍擊"){   // 頭頂腫一個包，貼十字 OK 繃
    const x = tx + n*6, y = ty;
    return `<g class="scar scar-bump"><ellipse cx="${x}" cy="${y}" rx="8" ry="6" fill="#e9a58f" stroke="${SCAR_INK}" stroke-width="2.6"/>
      <g transform="rotate(-25 ${x} ${y})"><rect x="${x-9}" y="${y-2.5}" width="18" height="5" rx="2" fill="#f3dcb0" stroke="${SCAR_INK}" stroke-width="1.8"/></g>
      <g transform="rotate(35 ${x} ${y})"><rect x="${x-9}" y="${y-2.5}" width="18" height="5" rx="2" fill="#f3dcb0" stroke="${SCAR_INK}" stroke-width="1.8"/></g></g>`;
  }
  if(kind==="火焰"){   // 半邊臉的焦痕
    const x = cx - n*4, y = cy - 4;
    return `<g class="scar scar-burn"><path d="M${x-9} ${y-8} Q${x-2} ${y-13} ${x+6} ${y-7} Q${x+11} ${y} ${x+5} ${y+7} Q${x-3} ${y+11} ${x-9} ${y+5} Q${x-13} ${y-2} ${x-9} ${y-8} Z" fill="#b8574a" stroke="${SCAR_INK}" stroke-width="2.2" opacity=".9"/>
      <path d="M${x-5} ${y-4} Q${x} ${y-7} ${x+3} ${y-2} Q${x+5} ${y+3} ${x} ${y+5} Q${x-5} ${y+4} ${x-5} ${y-4} Z" fill="#e8907e"/>
      <circle cx="${x+6}" cy="${y-4}" r="1.4" fill="#3a2620"/><circle cx="${x-7}" cy="${y+3}" r="1.2" fill="#3a2620"/></g>`;
  }
  // 法術：臉頰上一道發亮的閃電形疤紋
  const c = SCAR_GLOW[kind] || "#c9a2ff", x = cx + n*4, y = cy - 10;
  return `<g class="scar scar-glow"><path d="M${x} ${y} L${x+4} ${y+6} L${x-1} ${y+9} L${x+3} ${y+16}" stroke="${SCAR_INK}" stroke-width="3.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M${x} ${y} L${x+4} ${y+6} L${x-1} ${y+9} L${x+3} ${y+16}" stroke="${c}" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>`;
}
const scarKindOf = type => ["揮砍","穿刺","鈍擊","火焰"].includes(type) ? type : (type||"鈍擊");
// 把傷疤疊到一種外觀上：scars＝[{type}]（最多 3 道）。base＝SCAR_SPOTS 的哪一種頭；沒有座標的外觀照舊不畫
function scarredLook(look, base, scars){
  const spots = SCAR_SPOTS[base]; if(!look || !spots || !scars || !scars.length) return look;
  const art = view => scars.slice(0,3).map((s,i)=>scarSVG(scarKindOf(s.type), spots[view], scars.slice(0,i).filter(o=>scarKindOf(o.type)===scarKindOf(s.type)).length)).join("");
  const deco = (svg, view) => svg ? svg.replace(/<\/svg>\s*$/, art(view) + "</svg>") : svg;
  return {...look, face:deco(look.face, "front"), head:deco(look.head, "side"), headHurt:deco(look.headHurt, "side")};
}

// 立繪（劇情用的哥布林大圖，700×700）：同一套傷疤畫法放大疊上去。px＝這張圖上眼睛、頭頂、臉頰的位置，k＝放大倍率（照兩眼距離抓）
const SCAR_ILLUST = {
  "assets/scenes/goblin_bow.webp":   {k:2.0, eyeA:[320,168], eyeB:[367,168], top:[352,128], cheek:[318,208]},
  "assets/scenes/goblin_club.webp":  {k:3.4, eyeA:[397,215], eyeB:[481,220], top:[413,112], cheek:[371,268]},
  "assets/scenes/goblin_sword.webp": {k:4.6, eyeA:[206,220], eyeB:[322,200], top:[238,104], cheek:[178,272]}
};
function illustScarSVG(src, scars){
  const m = SCAR_ILLUST[src]; if(!m || !scars || !scars.length) return "";
  const u = ([x,y]) => [x/m.k, y/m.k], spots = {eyeA:u(m.eyeA), eyeB:u(m.eyeB), top:u(m.top), cheek:u(m.cheek)};
  return `<g transform="scale(${m.k})">${scars.slice(0,3).map((s,i)=>scarSVG(scarKindOf(s.type), spots, scars.slice(0,i).filter(o=>scarKindOf(o.type)===scarKindOf(s.type)).length)).join("")}</g>`;
}
