/* 復仇敵人的傷疤（大爺 10-21，外觀暫定：香香）
   被敲暈過、回來報仇的敵人，頭上疊一層傷疤 SVG：照「上次被敲暈的那一擊」的傷害類型
     揮砍＝三道刀疤、穿刺＝眼罩、鈍擊＝眼皮腫起來（再一次＝頭頂腫包＋OK 繃）、火焰＝燒痕、其他（法術）＝發亮的疤紋（顏色照傷害類型）
   疊在紙娃娃的頭（側臉、受傷臉）和頭像（正面）上，不重畫怪物本身；回來幾次就疊幾道（最多 3）
   座標：每種頭各一組（100×100 的頭圖座標），先做哥布林、獸人兩種，之後再補 */
const SCAR_SPOTS = {
  goblin: {side:{eyeR:6, eyeA:[43,53], eyeB:[67,52], top:[53,24], cheek:[48,72]}, front:{eyeR:6.5, eyeA:[38,53], eyeB:[61,53], top:[50,23], cheek:[34,69]}},
  orc:    {side:{eyeR:6, eyeA:[43,49], eyeB:[68,49], top:[58,31], cheek:[48,66]}, front:{eyeR:6.5, eyeA:[36,49], eyeB:[63,49], top:[50,31], cheek:[31,65]}},
  // 人類（盜賊、獵人、盜賊頭目，10-21）：側臉照 humanLook 的頭縮放算出來；正面照 humanFrontSVG
  human:  {side:{eyeR:5, k:.8, eyeA:[45,69], eyeB:[65,67], top:[55,40], cheek:[37,86]}, front:{eyeR:4.4, k:.75, eyeA:[41,54], eyeB:[59,54], top:[50,25], cheek:[34,64]}},
  // 殭屍、食屍鬼（10-22 改成紙娃娃）：照 undead.js 的頭
  zombie: {side:{eyeR:7, eyeA:[43,54], eyeB:[67,53], top:[54,22], cheek:[36,72]}, front:{eyeR:7, eyeA:[38,54], eyeB:[62,54], top:[50,22], cheek:[30,70]}},
  ghoul:  {side:{eyeR:7, eyeA:[43,52], eyeB:[67,51], top:[54,22], cheek:[36,70]}, front:{eyeR:7, eyeA:[37,52], eyeB:[63,52], top:[50,22], cheek:[30,68]}},
  // 森林的野豬、狼：紙娃娃是整隻側面（140×150 座標），頭像是正面（100×100）
  boar:   {doll:{eyeR:4.5, k:.65, eyeA:[93,96], eyeB:[111,95], top:[103,79], cheek:[96,108]}, front:{eyeR:5, eyeA:[35,47], eyeB:[65,47], top:[50,29], cheek:[29,64]}},
  forest_wolf:{doll:{eyeR:4.5, k:.65, eyeA:[99,86], eyeB:[115,86], top:[107,68], cheek:[101,99]}, front:{eyeR:5, eyeA:[35,47], eyeB:[65,47], top:[50,30], cheek:[29,64]}}
};
// 整隻一張圖的（幽靈、梟熊等六隻野獸）：傷疤畫進原圖同一層，頭像是從原圖裁的，自然一起有
//   座標＝那張原圖自己的座標（野獸是 BEAST_ART 的座標，外面那層縮放會跟著縮）；k＝傷疤放大倍率（原圖很大的要放大）
const STATIC_SCAR = {
  ghost:  {eyeR:8, eyeA:[59,56], eyeB:[81,56], top:[70,30], cheek:[50,80]},
  owlbear:{eyeR:20, k:1.8, eyeA:[124,111], eyeB:[151,109], top:[138,80], cheek:[104,146]},
  griffin:{eyeR:6, k:1.4, eyeA:[151,84], eyeB:[151,84], top:[140,64], cheek:[136,106]},
  chimera:{eyeR:6, k:1.3, eyeA:[143,107], eyeB:[164,105], top:[155,85], cheek:[140,122]},
  giant_spider:{eyeR:6, k:1.1, eyeA:[146,120], eyeB:[160,116], top:[151,106], cheek:[139,128]},
  slime:  {eyeR:8, k:1.5, eyeA:[136,124], eyeB:[165,119], top:[150,96], cheek:[127,140]},
  bat:    {eyeR:11, k:2, eyeA:[192,124], eyeB:[229,120], top:[210,96], cheek:[176,154]}
};
STATIC_SCAR.owlbear_cub = STATIC_SCAR.owlbear_young = STATIC_SCAR.owlbear;
const SCAR_INK = "#2a2630";
const SCAR_GLOW = {寒冷:"#8fd3ff", 閃電:"#ffe36a", 強酸:"#a6e05a", 毒素:"#9bd06a", 死靈:"#b48ae0", 光耀:"#fff1a8", 力場:"#c9a2ff", 雷鳴:"#9fb7ff", 心靈:"#ff9ad5"};
// 一種傷疤：kind＝傷害類型（揮砍／穿刺／鈍擊／火焰／其他），s＝這張頭圖的位置表，n＝第幾道（疊的時候錯開一點）
function scarSVG(kind, s, n=0){
  if(s.k && s.k!==1){   // 放大／縮小：以這道疤貼的位置為中心，位置不變、大小照 k
    const at = kind==="穿刺" ? s.eyeB : (kind==="揮砍" || (kind==="鈍擊" && n===0)) ? s.eyeA : kind==="鈍擊" ? s.top : s.cheek;
    return `<g transform="translate(${at[0]} ${at[1]}) scale(${s.k}) translate(${-at[0]} ${-at[1]})">${scarSVG(kind, {...s, k:1, eyeR:s.eyeR/s.k}, n)}</g>`;
  }
  const [ax,ay] = s.eyeA, [bx,by] = s.eyeB, [tx,ty] = s.top, [cx,cy] = s.cheek;
  if(kind==="揮砍"){   // 三道斜刀疤，劃過其中一隻眼
    const x = ax - 7 + n*3, y = ay - 12;
    return `<g class="scar scar-slash">${[0,5,10].map(d=>`<path d="M${x+d} ${y} L${x+d+9} ${y+22}" stroke="${SCAR_INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M${x+d} ${y} L${x+d+9} ${y+22}" stroke="#e8857a" stroke-width="1.6" stroke-linecap="round"/>`).join("")}</g>`;
  }
  if(kind==="穿刺"){   // 眼罩：黑色眼罩蓋住另一隻眼，帶子斜過頭
    return `<g class="scar scar-patch"><path d="M${bx-16} ${by-14} Q${bx} ${by-20} ${bx+16} ${by-8}" stroke="${SCAR_INK}" stroke-width="2.6" fill="none"/>
      <ellipse cx="${bx}" cy="${by}" rx="8.5" ry="7.5" fill="#3a3340" stroke="${SCAR_INK}" stroke-width="2.6"/><path d="M${bx-4} ${by-3} Q${bx} ${by-5} ${bx+3} ${by-3}" stroke="#6b6175" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
  }
  if(kind==="鈍擊" && n===0){   // 第一次：眼皮被打腫，腫起來的上眼皮剛好蓋住眼睛上半（大爺 10-21）
    const r = (s.eyeR || 6.5) + 1.6, y0 = ay + .4;   // 比眼睛大一圈，下緣切在眼睛正中間、微微往下垂
    return `<g class="scar scar-swollen"><path d="M${ax-r} ${y0} A${r} ${r*.95} 0 0 1 ${ax+r} ${y0} Q${ax} ${y0+2.2} ${ax-r} ${y0} Z" fill="#d9776a" stroke="${SCAR_INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="${ax-r*.3}" cy="${ay-r*.5}" rx="${r*.35}" ry="${r*.2}" fill="#f2a99b"/></g>`;
  }
  if(kind==="鈍擊"){   // 第二次以後：頭頂腫一個包，貼十字 OK 繃
    const x = tx + (n-1)*6, y = ty;
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
// 骷髏（大爺 10-21：用黑色畫頭骨裂、肋骨斷、斷肢）：頭骨用巫妖那顆頭（100×100）的座標，身體、腳用紙娃娃（140×150）的座標
//   鈍擊＝頭骨裂開（第二次肋骨也裂）、揮砍＝肋骨斷一根（第二次連左腳都斷了，剩一截骨頭）、穿刺＝頭骨穿一個洞、火焰＝燒焦、法術＝發亮的裂痕
const BONE_INK = "#1d1820";
function boneScarHead(kind, n){
  if(kind==="鈍擊") return `<g class="scar bone-crack"><path d="M${64-n*30} 10 L${69-n*30} 17 L${62-n*30} 22 L${67-n*30} 28 L${63-n*30} 32" stroke="${BONE_INK}" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M${62-n*30} 22 L${55-n*30} 24" stroke="${BONE_INK}" stroke-width="2" stroke-linecap="round"/></g>`;
  if(kind==="穿刺") return `<g class="scar bone-hole"><ellipse cx="${38+n*26}" cy="24" rx="5.2" ry="4.4" fill="${BONE_INK}"/><path d="M${33+n*26} 22 L${28+n*26} 18 M${43+n*26} 22 L${47+n*26} 17 M${39+n*26} 28 L${40+n*26} 32" stroke="${BONE_INK}" stroke-width="1.8" stroke-linecap="round"/></g>`;
  if(kind==="火焰") return `<g class="scar bone-burn" opacity=".72"><path d="M22 52 Q20 40 30 34 Q36 40 34 50 Q30 60 22 52 Z" fill="${BONE_INK}"/><path d="M60 16 Q72 14 78 24 Q70 28 62 24 Z" fill="${BONE_INK}"/></g>`;
  if(kind==="揮砍") return "";
  const c = SCAR_GLOW[kind] || "#c9a2ff";
  return `<g class="scar bone-glow"><path d="M26 16 L31 23 L27 27 L32 34" stroke="${BONE_INK}" stroke-width="3.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M26 16 L31 23 L27 27 L32 34" stroke="${c}" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>`;
}
function boneScarBody(kind, n){
  if(kind==="揮砍" && n===0) return `<g class="scar rib-break"><path d="M54 86 L60 92 M57 97 L63 103" stroke="${BONE_INK}" stroke-width="2.8" stroke-linecap="round"/><path d="M50 91 L53 89 L54 93 Z" fill="${BONE_INK}"/></g>`;
  if(kind==="鈍擊" && n>0) return `<g class="scar rib-crack"><path d="M84 88 L80 92 L85 95 L81 99" stroke="${BONE_INK}" stroke-width="2.2" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>`;
  return "";
}
// 斷肢：左腳只剩一截斷掉的骨頭
const BONE_STUMP = `<g class="dl-foot-left scar bone-stump"><path d="M58 124 L60 133" stroke="#2a2630" stroke-width="8" stroke-linecap="round"/><path d="M58 124 L60 133" stroke="#f0e6cc" stroke-width="4" stroke-linecap="round"/><path d="M55 134 L58 129 L60 133 L62 128 L65 135 Z" fill="#f0e6cc" stroke="${BONE_INK}" stroke-width="2" stroke-linejoin="round"/><path d="M50 140 L58 137 L60 140 L52 142 Z" fill="#f0e6cc" stroke="#2a2630" stroke-width="1.6" stroke-linejoin="round"/></g>`;   // 斷掉的那截掉在旁邊
function boneScarredLook(look, scars){
  const list = scars.slice(0,3).map(s=>scarKindOf(s.type)), nth = i => list.slice(0,i).filter(k=>k===list[i]).length;
  const head = list.map((k,i)=>boneScarHead(k, nth(i))).join(""), body = list.map((k,i)=>boneScarBody(k, nth(i))).join("");
  const stump = list.filter(k=>k==="揮砍").length >= 2;
  const deco = svg => svg ? svg.replace(/<\/svg>\s*$/, head + "</svg>") : svg;
  return {...look, face:deco(look.face), head:deco(look.head), headHurt:deco(look.headHurt), extra:(look.extra||"") + body, ...(stump ? {footLeft:BONE_STUMP} : {})};
}
const scarKindOf = type => ["揮砍","穿刺","鈍擊","火焰"].includes(type) ? type : (type||"鈍擊");
// 把傷疤疊到一種外觀上：scars＝[{type}]（最多 3 道）。base＝SCAR_SPOTS 的哪一種頭；沒有座標的外觀照舊不畫
const scarList = (scars, s) => scars.slice(0,3).map((x,i)=>scarSVG(scarKindOf(x.type), s, scars.slice(0,i).filter(o=>scarKindOf(o.type)===scarKindOf(x.type)).length)).join("");
// 整隻一張圖的：把傷疤接在原圖後面（紙娃娃的 art、頭像裡同一段原圖都換掉）
function staticScarredLook(look, kind, scars){
  const s = STATIC_SCAR[kind], art = look.art || (typeof UNDEAD_ART!=="undefined" && UNDEAD_ART[kind]); if(!s || !art) return look;
  const m = art.match(/^<g transform="translate\([-\d.]+ [-\d.]+\) scale\([\d.]+\)">([\s\S]*)<\/g>$/), raw = m ? m[1] : art;
  const withScars = raw + `<g class="scars">${scarList(scars, s)}</g>`, swap = str => str ? str.split(raw).join(withScars) : str;
  return {...look, art:swap(art), face:swap(look.face)};
}
function scarredLook(look, base, scars){
  if(base==="skeleton" && look && scars && scars.length) return boneScarredLook(look, scars);
  if(look && scars && scars.length && STATIC_SCAR[base]) return staticScarredLook(look, base, scars);
  if(look && scars && scars.length && SCAR_SPOTS[base] && SCAR_SPOTS[base].doll)   // 森林的：紙娃娃另外疊一層（forestDollSVG 畫 scarArt），頭像疊正面
    return {...look, scarArt:`<g class="scars">${scarList(scars, SCAR_SPOTS[base].doll)}</g>`, face:look.face && look.face.replace(/<\/svg>\s*$/, scarList(scars, SCAR_SPOTS[base].front) + "</svg>")};
  const spots = SCAR_SPOTS[base]; if(!look || !spots || !scars || !scars.length) return look;
  const art = view => scars.slice(0,3).map((s,i)=>scarSVG(scarKindOf(s.type), spots[view], scars.slice(0,i).filter(o=>scarKindOf(o.type)===scarKindOf(s.type)).length)).join("");
  const deco = (svg, view) => svg ? svg.replace(/<\/svg>\s*$/, art(view) + "</svg>") : svg;
  return {...look, face:deco(look.face, "front"), head:deco(look.head, "side"), headHurt:deco(look.headHurt, "side")};
}

// 立繪（劇情用的哥布林大圖，700×700）：同一套傷疤畫法放大疊上去。px＝這張圖上眼睛、頭頂、臉頰的位置，k＝放大倍率（照兩眼距離抓）
const SCAR_ILLUST = {
  "assets/scenes/goblin_bow.webp":   {k:2.0, eyeR:12, eyeA:[313,167], eyeB:[367,168], top:[352,128], cheek:[318,208]},
  "assets/scenes/goblin_club.webp":  {k:3.4, eyeR:19, eyeA:[404,210], eyeB:[481,220], top:[413,112], cheek:[371,268]},
  "assets/scenes/goblin_sword.webp": {k:4.6, eyeR:21, eyeA:[212,219], eyeB:[322,200], top:[238,104], cheek:[178,272]}
};
function illustScarSVG(src, scars){
  const m = SCAR_ILLUST[src]; if(!m || !scars || !scars.length) return "";
  const u = ([x,y]) => [x/m.k, y/m.k], spots = {eyeR:(m.eyeR||13)/m.k, eyeA:u(m.eyeA), eyeB:u(m.eyeB), top:u(m.top), cheek:u(m.cheek)};
  return `<g transform="scale(${m.k})">${scars.slice(0,3).map((s,i)=>scarSVG(scarKindOf(s.type), spots, scars.slice(0,i).filter(o=>scarKindOf(o.type)===scarKindOf(s.type)).length)).join("")}</g>`;
}
