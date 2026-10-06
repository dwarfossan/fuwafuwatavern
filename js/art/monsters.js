/* 怪物（正面，第一人稱場景用）。由 tools/art/monsters.py 的圖轉來 */
/* 劇情用哥布林的武器（跟戰鬥裡的裝備一致：短棒、彎刀、短弓），畫在手的後面 */
const STORY_GOBLIN_WEAPON = {
  club: `<g transform="translate(310 300) rotate(20)"> <path d="M-12 -120 Q20 -130 22 -90 L10 60 L-14 60 Z" fill="#8a6038" stroke="#2a2630" stroke-width="6" stroke-linejoin="round" /> <path d="M-6 -110 L8 -114 M-6 -80 L10 -84" fill="none" stroke="#5e3a20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="1"/> <circle cx="4" cy="-104" r="6" fill="#aeb2b9" stroke="#2a2630" stroke-width="3"/> <circle cx="14" cy="-80" r="5" fill="#aeb2b9" stroke="#2a2630" stroke-width="3"/> </g>`,
  scimitar: `<g transform="translate(306 312) rotate(16)">
    <path d="M-7 18 Q-16 -50 14 -128 Q30 -60 9 18 Z" fill="#c9d0dc" stroke="#2a2630" stroke-width="6" stroke-linejoin="round"/>
    <path d="M1 8 Q-4 -50 14 -110" fill="none" stroke="#f2f4f8" stroke-width="4" stroke-linecap="round"/>
    <path d="M-26 22 L28 16" stroke="#2a2630" stroke-width="16" stroke-linecap="round"/><path d="M-26 22 L28 16" stroke="#e0ab45" stroke-width="8" stroke-linecap="round"/>
    <path d="M-4 24 L-2 66 L12 65 L10 23 Z" fill="#6b4a35" stroke="#2a2630" stroke-width="5" stroke-linejoin="round"/></g>`,
  bow: `<g transform="translate(298 352) rotate(8)">
    <path d="M-6 -150 L-6 150" stroke="#f6e9d8" stroke-width="3"/>
    <path d="M-6 -150 Q70 -80 14 -10 L14 10 Q70 80 -6 150" fill="none" stroke="#2a2630" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-6 -150 Q70 -80 14 -10 L14 10 Q70 80 -6 150" fill="none" stroke="#a0703f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`
};
const storyGoblinSVG = weapon => MONSTER_SVG.goblin.replace("<!--weapon-->", STORY_GOBLIN_WEAPON[weapon] || "");
const MONSTER_SVG = {
  goblin: `<svg viewBox="30 90 350 440" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g> <ellipse cx="200" cy="505" rx="130" ry="20" fill="#000" opacity=".25"/> <path d="M130 400 Q120 340 200 330 Q280 340 270 400 L285 500 L115 500 Z" fill="#7a5a3c" stroke="#2a2630" stroke-width="6" stroke-linejoin="round" /> <path d="M150 420 L250 420 M140 460 L260 460" fill="none" stroke="#5a3f28" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="1"/> <path d="M170 330 L230 330 L220 380 L180 380 Z" fill="#a33c32" stroke="#2a2630" stroke-width="6" stroke-linejoin="round" /> <path d="M40 170 Q90 200 118 225 L110 260 Q70 230 40 170 Z" fill="#8fae4a" stroke="#2a2630" stroke-width="6" stroke-linejoin="round" /> <path d="M360 170 Q310 200 282 225 L290 260 Q330 230 360 170 Z" fill="#8fae4a" stroke="#2a2630" stroke-width="6" stroke-linejoin="round" /> <path d="M60 188 Q90 212 108 236 M340 188 Q310 212 292 236" fill="none" stroke="#6a8634" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="1"/> <path d="M110 230 Q110 120 200 115 Q290 120 290 230 Q290 330 200 345 Q110 330 110 230 Z" fill="#8fae4a" stroke="#2a2630" stroke-width="6" stroke-linejoin="round" /> <path d="M150 150 Q200 136 250 150" fill="none" stroke="#6a8634" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/> <circle cx="160" cy="225" r="26" fill="#fff4b0" stroke="#2a2630" stroke-width="4"/><circle cx="160" cy="228.9" r="14.3" fill="#c0392b"/><circle cx="166.5" cy="219.8" r="5.2" fill="#fff"/><circle cx="240" cy="225" r="26" fill="#fff4b0" stroke="#2a2630" stroke-width="4"/><circle cx="240" cy="228.9" r="14.3" fill="#c0392b"/><circle cx="246.5" cy="219.8" r="5.2" fill="#fff"/> <path d="M125 190 L190 212 L188 196 Z" fill="#6a8634" stroke="#2a2630" stroke-width="4" stroke-linejoin="round" /><path d="M275 190 L210 212 L212 196 Z" fill="#6a8634" stroke="#2a2630" stroke-width="4" stroke-linejoin="round" /> <path d="M185 255 Q200 240 215 255 Q215 285 200 292 Q185 285 185 255 Z" fill="#6a8634" stroke="#2a2630" stroke-width="4" stroke-linejoin="round" /> <path d="M145 300 Q200 330 255 300 Q250 322 200 330 Q150 322 145 300 Z" fill="#2a2630" stroke="#2a2630" stroke-width="4" stroke-linejoin="round" /> <path d="M160 305 L170 325 L178 309 Z M222 309 L230 325 L240 305 Z" fill="#fffbe8" stroke="#2a2630" stroke-width="3" stroke-linejoin="round" /> <!--weapon--> <path d="M262 330 Q282 345 290 356" fill="none" stroke="#2a2630" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" opacity="1"/><path d="M262 330 Q282 345 290 356" fill="none" stroke="#8fae4a" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity="1"/><circle cx="292" cy="354" r="22" fill="#8fae4a" stroke="#2a2630" stroke-width="5"/><path d="M278 346 Q292 342 304 348 M278 360 Q292 356 304 362" fill="none" stroke="#6a8634" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="1"/> </g></svg>`
};

/* 怪物的紙娃娃外觀：頭（100×100，跟四隻的頭同規格）、身體、手腳顏色、額外裝飾
   怪物跟四隻共用同一套紙娃娃：拿什麼裝備、做什麼動作都一樣 */
const MONSTER_LOOK = (()=>{
  const INK="#2a2630", G="#8fae4a", GD="#6a8634";
  const p = (d,f,w=3.5) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const eye = (x,y) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#fff4b0" stroke="${INK}" stroke-width="2.5"/><circle cx="${x}" cy="${y+1}" r="4.2" fill="#c0392b"/><circle cx="${x+1.8}" cy="${y-1.5}" r="1.6" fill="#fff"/>`;
  const goblinHead = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${p("M3 30 Q22 42 31 50 L29 62 Q13 54 3 30 Z", G)}${p("M97 30 Q78 42 69 50 L71 62 Q87 54 97 30 Z", G)}
    <path d="M9 36 Q20 44 27 52 M91 36 Q80 44 73 52" stroke="${GD}" stroke-width="2" fill="none"/>
    ${p("M25 56 Q25 22 50 20 Q75 22 75 56 Q75 86 50 92 Q25 86 25 56 Z", G)}
    <path d="M36 32 Q50 27 64 32" stroke="${GD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${eye(39,54)}${eye(61,54)}
    ${p("M28 42 L46 50 L45 45 Z", GD, 2.5)}${p("M72 42 L54 50 L55 45 Z", GD, 2.5)}
    ${p("M45 61 Q50 56 55 61 Q56 70 50 73 Q44 70 45 61 Z", GD, 2.5)}
    ${p("M36 76 Q50 85 64 76 Q62 84 50 86 Q38 84 36 76 Z", INK, 2)}
    ${p("M40 77 L43 83 L45 78 Z M55 78 L57 83 L60 77 Z", "#fffbe8", 1.5)}
  </svg>`;
  // 3/4 側臉（朝右）：近側耳朵整隻、遠側耳朵縮短往後；長鼻子凸出輪廓；獠牙嘴跟著右移；不加腮紅
  const goblinSide = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${p("M72 40 Q84 32 95 20 Q90 42 77 54 Z", G)}<path d="M80 38 Q88 32 92 26" stroke="${GD}" stroke-width="2" fill="none"/>
    ${p("M2 30 Q21 42 31 50 L29 62 Q12 54 2 30 Z", G)}<path d="M8 36 Q19 44 27 52" stroke="${GD}" stroke-width="2" fill="none"/>
    ${p("M24 56 Q24 22 50 20 Q76 22 78 50 Q80 64 76 74 Q70 88 52 92 Q26 86 24 56 Z", G)}
    <path d="M40 31 Q54 26 68 32" stroke="${GD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${eye(43,54)}<circle cx="67" cy="53" r="6.3" fill="#fff4b0" stroke="${INK}" stroke-width="2.5"/><circle cx="67.5" cy="54" r="3.6" fill="#c0392b"/><circle cx="69" cy="52.5" r="1.4" fill="#fff"/>
    ${p("M31 42 L50 50 L49 45 Z", GD, 2.5)}${p("M76 44 L61 50 L62 46 Z", GD, 2.5)}
    ${p("M67 58 Q80 55 90 64 Q86 72 71 70 Q66 64 67 58 Z", GD, 2.5)}
    ${p("M44 77 Q58 86 71 75 Q69 84 57 86 Q46 84 44 77 Z", INK, 2)}
    ${p("M48 79 L51 84 L53 80 Z M62 80 L64 84 L66 78 Z", "#fffbe8", 1.5)}
  </svg>`;
  // 被打中時的 X_X 眼睛：同一張側臉，眼睛換成叉叉
  const xEye = (x,y,r) => `<path d="M${x-r} ${y-r} L${x+r} ${y+r} M${x+r} ${y-r} L${x-r} ${y+r}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  const goblinSideHurt = goblinSide
    .replace(`${eye(43,54)}`, xEye(43,54,6.5))
    .replace(/<circle cx="67" cy="53"[^>]*\/><circle cx="67\.5"[^>]*\/><circle cx="69"[^>]*\/>/, xEye(67,53,5.5));
  // 哥布林薩滿：骷髏頭飾（大爺 10-02：原本是三根羽毛）＋額頭的布帶和一顆牙
  const skull = ([x,y]) => `<g transform="translate(${x} ${y})">
    <path d="M-11 2 Q-12 -13 0 -14 Q12 -13 11 2 Q11 7 6 8 L6 12 L-6 12 L-6 8 Q-11 7 -11 2 Z" fill="#f3ead2" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <ellipse cx="-4.5" cy="-1.5" rx="3.3" ry="3.8" fill="${INK}"/><ellipse cx="4.5" cy="-1.5" rx="3.3" ry="3.8" fill="${INK}"/>
    <path d="M0 2.5 L-1.8 6 L1.8 6 Z" fill="${INK}"/><path d="M-3 12 L-3 8.5 M0 12 L0 8.5 M3 12 L3 8.5" stroke="${INK}" stroke-width="1.3"/></g>`;
  const feathers = (at, band) => `${skull(at)}
    <path d="${band}" stroke="${INK}" stroke-width="8.5" fill="none" stroke-linecap="round"/><path d="${band}" stroke="#a33c32" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
  const hat = (svg, xs, band, tooth) => svg.replace(/<\/svg>\s*$/, `${feathers(xs, band)}${tooth}</svg>`);
  const TOOTH = (x,y) => `<path d="M${x-3} ${y-2} L${x+3} ${y-2} L${x} ${y+6} Z" fill="#fffbe8" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const FACE_F = [50,15], FACE_B = "M28 34 Q50 24 72 34";
  // 哥布林的頭、頸錨點（跟原本薩滿頭飾、項鍊的位置一樣）
  const GOBLIN_ANCHOR = {head:[52,28,1], neck:[70,95]};
  // 歐克本體（GPT 暫定外觀）：寬下顎、短耳、向上獠牙；裝備與動作沿用共用紙娃娃。
  const O="#71916a", OD="#49664a", OH="#35352f";
  const orcEyes = (side=false) => side
    ? `${eye(43,51)}${eye(69,50)}` : `${eye(35,51)}${eye(65,51)}`;
  const orcHead = side => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-monster="orc" data-view="${side?'side':'front'}">
    ${p("M18 40 L5 34 Q5 55 22 61 Z M78 40 L95 34 Q94 55 77 61 Z", O)}
    ${p(side?"M21 38 Q22 17 49 16 Q78 16 80 42 L86 66 Q87 89 65 93 L36 91 Q18 86 19 64 Z":"M20 38 Q20 16 50 16 Q80 16 80 38 L83 68 Q81 91 62 94 L38 94 Q19 91 17 68 Z", O)}
    ${p("M20 38 L18 25 L28 27 L29 15 L40 19 L48 10 L57 19 L70 14 L72 26 L81 25 L80 38 L68 33 L31 33 Z", OH,3)}
    ${orcEyes(side)}
    <path d="${side?'M30 39 L50 44 M60 43 L77 37':'M23 39 L44 44 M56 44 L77 39'}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    ${p(side?"M62 57 Q74 52 88 61 L85 69 L66 69 Z":"M42 59 Q50 54 58 59 L61 67 Q50 72 39 67 Z", OD,2.5)}
    ${p(side?"M35 74 Q59 82 81 72 L79 84 Q58 91 38 84 Z":"M28 75 Q50 82 72 75 L69 85 Q50 91 31 85 Z", OD,2.5)}
    <path d="${side?'M42 81 Q59 84 74 79':'M34 81 L66 81'}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${p(side?"M39 84 L35 67 Q46 71 47 83 Z M70 83 Q70 71 78 65 L79 81 Z":"M31 83 L28 67 Q39 71 40 83 Z M60 83 Q61 71 72 67 L69 83 Z", "#fffbe8",2)}
  </svg>`;
  const orcSide=orcHead(true), orcFront=orcHead(false);
  const orcHurt=orcSide.replace(orcEyes(true),xEye(43,51,6.5)+xEye(69,50,6.5));
  // 遮角色右眼：正面在畫面左方，朝右的側臉為近側眼；受傷臉也保留眼罩。
  const captainHead=(svg,side)=>svg.replace(/<\/svg>\s*$/, `<g data-eye-patch="right"><path d="${side?'M23 34 L78 60':'M20 36 L79 63'}" stroke="${INK}" stroke-width="4" fill="none"/>${p(side?'M33 43 L53 43 L52 57 Q43 64 34 56 Z':'M25 43 L45 43 L44 57 Q35 64 26 56 Z',OH,2.5)}</g></svg>`);
  // 人類大叔（商人，暫定外觀，大爺 2026-10-01：之後再確定）：平頂帽、八字鬍、圓鼻子
  const SK="#f1c9a0", SKD="#d9a77c", HAIR="#6b4a35", CAP="#8a6a44", CAPD="#6e5032";
  const uncleFace = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${p("M20 52 Q12 52 13 60 Q15 68 24 66 Z", SK, 3)}${p("M80 52 Q88 52 87 60 Q85 68 76 66 Z", SK, 3)}
    ${p("M24 50 Q24 24 50 22 Q76 24 76 50 Q76 84 50 90 Q24 84 24 50 Z", SK)}
    ${p("M25 50 Q22 40 30 38 L31 54 Z M75 50 Q78 40 70 38 L69 54 Z", HAIR, 2.5)}
    ${p("M20 40 Q22 12 50 11 Q78 12 80 40 Q50 32 20 40 Z", CAP)}${p("M16 41 Q50 30 84 41 Q84 47 78 46 Q50 38 22 46 Q16 47 16 41 Z", CAPD, 2.5)}
    <path d="M34 50 Q40 46 45 50 M55 50 Q60 46 66 50" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="57" r="3.6" fill="${INK}"/><circle cx="60" cy="57" r="3.6" fill="${INK}"/>
    <circle cx="33" cy="66" r="5" fill="#e8a08a" opacity=".55"/><circle cx="67" cy="66" r="5" fill="#e8a08a" opacity=".55"/>
    ${p("M44 62 Q50 56 56 62 Q57 70 50 71 Q43 70 44 62 Z", SKD, 2.5)}
    ${p("M50 72 Q40 68 30 74 Q36 80 44 77 Q48 76 50 74 Q52 76 56 77 Q64 80 70 74 Q60 68 50 72 Z", HAIR, 2.5)}
    <path d="M44 83 Q50 85 56 83" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
  // 3/4 側臉（朝右）：遠側耳朵藏起來、鼻子凸出輪廓、帽簷朝前
  const uncleSide = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${p("M24 52 Q14 52 15 60 Q17 68 27 66 Z", SK, 3)}
    ${p("M26 50 Q26 24 52 22 Q78 24 80 50 Q82 64 78 74 Q72 88 54 90 Q28 86 26 50 Z", SK)}
    ${p("M27 50 Q23 40 32 37 L34 55 Z", HAIR, 2.5)}
    ${p("M22 40 Q24 12 52 11 Q78 12 82 38 Q52 32 22 40 Z", CAP)}${p("M18 41 Q52 30 92 40 Q93 46 86 46 Q52 38 24 46 Q18 47 18 41 Z", CAPD, 2.5)}
    <path d="M44 50 Q50 46 55 50 M64 50 Q69 46 74 50" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="57" r="3.6" fill="${INK}"/><circle cx="69" cy="57" r="3.2" fill="${INK}"/>
    <circle cx="42" cy="67" r="5" fill="#e8a08a" opacity=".55"/>
    ${p("M68 60 Q80 57 86 64 Q84 71 72 70 Q66 66 68 60 Z", SKD, 2.5)}
    ${p("M66 72 Q56 68 46 74 Q52 80 60 77 Q64 76 66 74 Q69 76 73 77 Q80 79 85 73 Q76 68 66 72 Z", HAIR, 2.5)}
    <path d="M58 83 Q64 85 70 82" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
  const uncleSideHurt = uncleSide
    .replace(`<circle cx="50" cy="57" r="3.6" fill="${INK}"/><circle cx="69" cy="57" r="3.2" fill="${INK}"/>`, xEye(50,56,5)+xEye(69,56,4.5));
  const orcLook={face:orcFront,head:orcSide,headHurt:orcHurt,body:O,skin:O,feet:OD,belly:false,tail:"",anchor:GOBLIN_ANCHOR,
    extra:`<path d="M54 92 Q62 97 68 94 M72 94 Q80 97 86 92 M70 97 L70 119 M54 122 Q70 128 86 122" stroke="${OD}" stroke-width="3" fill="none" stroke-linecap="round"/>`};
  return {
    orc_captain: {
      ...orcLook,face:captainHead(orcFront,false),head:captainHead(orcSide,true),headHurt:captainHead(orcHurt,true)
    },
    dragon: {
      dragon:true,mouth:[126,101],
      face:`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M24 32 L17 9 L38 26 M62 26 L83 9 L76 32" fill="#f0d398" stroke="${INK}" stroke-width="4"/><path d="M19 38 Q20 21 50 23 Q80 21 81 38 L85 70 Q77 92 50 91 Q23 92 15 70 Z" fill="#b96550" stroke="${INK}" stroke-width="4"/>${eye(33,49)}${eye(67,49)}<path d="M28 63 Q50 53 72 63 L76 78 Q50 91 24 78 Z" fill="#d88964" stroke="${INK}" stroke-width="3"/><path d="M32 74 Q50 81 68 74" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="39" cy="66" r="2.5" fill="${INK}"/><circle cx="61" cy="66" r="2.5" fill="${INK}"/></svg>`,
      render:dragonDollSVG
    },
    dragon_adult: {
      dragon:true,adult:true,mouth:[128,58],render:dragonDollSVG,
      face:`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27 36 L12 9 L39 25 M64 26 L87 8 L75 39" fill="#f0d398" stroke="${INK}" stroke-width="4"/><path d="M23 42 Q27 23 50 25 Q74 23 78 42 L85 67 L72 82 L50 94 L28 82 L15 67 Z" fill="#b96550" stroke="${INK}" stroke-width="4"/><path d="M26 48 L40 53 M60 53 L74 48" stroke="${INK}" stroke-width="4"/><path d="M28 57 L40 59 M60 59 L72 57" stroke="#fff4b0" stroke-width="5"/><path d="M31 70 Q50 60 69 70 L63 84 L50 89 L37 84 Z" fill="#d88964" stroke="${INK}" stroke-width="3"/><path d="M39 79 L61 79" stroke="${INK}" stroke-width="3"/></svg>`
    },
    orc:orcLook,
    merchant: {
      face: uncleFace, head: uncleSide, headHurt: uncleSideHurt, body:"#5f7896", skin:SK, feet:"#5a3f28", belly:false, tail:"",
      extra: `<path d="M49 112 Q70 119 91 112" stroke="#6e4a32" stroke-width="5" fill="none" stroke-linecap="round"/>
              <path d="M80 114 Q88 113 89 121 Q88 129 80 128 Q74 126 75 120 Q75 115 80 114 Z" fill="#c9a86a" stroke="${INK}" stroke-width="2.5"/>
              <path d="M78 116 L84 115" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
    },
    goblin_shaman: {
      // 頭像（face）照舊畫頭飾，認得出是薩滿；紙娃娃的袍子、頭飾、項鍊都來自身上穿的「+1 薩滿袍」
      face: hat(goblinHead, FACE_F, FACE_B, TOOTH(50,29)), head: goblinSide, headHurt: goblinSideHurt,
      body:G, skin:G, feet:"#5a3f28", belly:false, tail:"", anchor:GOBLIN_ANCHOR
    },
    goblin: {
      // face：頭像框、先攻列用的正面；head：棋盤上紙娃娃用的側臉
      // 衣服是裝備「破布衣」（js/art/doll.js 的 ARMOR_ART），這裡只畫皮膚
      face: goblinHead, head: goblinSide, headHurt: goblinSideHurt, body:G, skin:G, feet:"#5a3f28", belly:false, tail:"", anchor:GOBLIN_ANCHOR
    }
  };
})();

/* 小龍專屬本體，接共用紙娃娃入口與動作／倒下 class；尺寸、色票暫定。 */
function dragonDollSVG(o){
 const ink="#2a2630",red="#b96550",light="#d88964",bone="#f0d398";
 const p=(d,c,w=3)=>`<path d="${d}" fill="${c}" stroke="${ink}" stroke-width="${w}" stroke-linejoin="round"/>`;
 const hurt=o.down||o.anim?.k==='hurt',act=o.walking?'act-walk':o.anim?`act-${o.anim.k}`:'';
 const adult=o.look?.adult;
 const adultBody=`
 ${p('M42 113 Q25 138 4 134 Q17 130 25 113 Q31 100 44 101 Z',red)}
 <g class="dragon-leg dragon-leg-far">${p('M43 109 L54 115 L51 128 L62 136 L44 136 L35 123 Z','#8f493f')}</g>
 <g class="dragon-leg dragon-leg-far">${p('M91 107 L101 107 L102 129 L113 136 L97 136 L89 126 Z','#8f493f')}</g>
 <g class="dragon-wing dragon-wing-far">${p('M68 100 L45 16 L14 26 L3 58 Q23 43 31 75 Q48 60 56 103 Z','#8f493f')}${p('M45 16 L31 75 M45 16 L56 103','none',2)}</g>
 ${p('M30 100 Q53 83 79 94 Q91 92 88 80 Q81 68 87 56 Q95 45 111 49 L113 60 Q95 57 99 70 Q119 102 103 118 Q78 136 43 130 Q21 123 30 100 Z',red)}
 ${p('M45 118 Q74 122 94 105 Q104 95 96 78 L98 65 L106 65 Q116 96 105 112 Q83 137 45 129 Z',bone)}
 <path d="M57 120 L59 132 M72 117 L77 130 M85 111 L92 123 M95 99 L107 106 M97 86 L109 88" stroke="#b58e5d" stroke-width="2"/>
 <g class="dragon-leg">${p('M37 111 Q51 104 59 119 L49 131 L56 140 L34 140 L29 130 L35 121 Z',red)}<path d="M39 135 L37 140 M47 136 L46 140" stroke="${bone}" stroke-width="2.5"/></g>
 <g class="dragon-leg">${p('M84 112 L94 113 L94 129 L106 140 L82 140 L79 132 Z',red)}<path d="M88 135 L86 140 M97 136 L96 140" stroke="${bone}" stroke-width="2.5"/></g>
 <g class="dragon-wing">${p('M67 105 L44 25 L10 36 L2 71 Q23 57 30 88 Q49 75 54 113 Z',light)}${p('M44 25 L30 88 M44 25 L54 113','none',2)}</g>`;
 return `<svg class="doll dragon ${o.down?'dl-down':o.prone?'dl-prone':''}" data-monster="${adult?'dragon_adult':'dragon'}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.w*150/140}" viewBox="0 0 140 150" overflow="visible" aria-hidden="true"><g class="dl-face" ${o.face<0?'transform="translate(140 0) scale(-1 1)"':''}><g class="dl-lie"><g class="dl-act ${act}" style="--d:${o.anim?-o.anim.el:0}ms;--walk:${-(Date.now()%360)}ms;--b:${-(Date.now()%1600)}ms">
 ${adult?adultBody:`${p('M35 119 Q18 140 5 125 Q-1 116 5 108 Q7 125 26 108 L44 106 Z',red)}${p('M5 109 L2 98 L15 108 Z',bone)}
 <g class="dragon-leg dragon-leg-far">${p('M46 117 L61 117 L60 130 L67 135 L46 135 Z','#8f493f')}</g>
 <g class="dragon-leg dragon-leg-far">${p('M94 116 L107 116 L108 129 L117 135 L95 135 Z','#8f493f')}</g>
 <g class="dragon-wing dragon-wing-far">${p('M66 98 L40 49 L18 60 L11 89 Q28 79 36 103 L57 120 Z','#8f493f')}${p('M40 49 L36 89 L57 120','none',2)}</g>
 ${p('M29 105 Q49 90 76 99 Q89 96 94 86 L104 96 Q104 122 91 130 Q59 140 30 128 Q22 119 29 105 Z',red)}${p('M34 119 Q62 127 93 115 L90 129 Q59 138 34 129 Z',bone)}
 <path d="M47 123 L49 132 M61 125 L62 134 M75 122 L77 132" stroke="#b58e5d" stroke-width="2"/>
 <g class="dragon-leg">${p('M34 118 Q49 114 53 126 L47 136 L56 141 L29 141 L27 133 Z',red)}<path d="M35 136 L33 141 M44 137 L43 141" stroke="${bone}" stroke-width="3"/></g>
 <g class="dragon-leg">${p('M86 113 L99 113 L98 133 L110 140 L82 140 L82 130 Z',red)}<path d="M91 135 L89 140 M101 137 L99 140" stroke="${bone}" stroke-width="3"/></g>
 <g class="dragon-wing">${p('M56 105 L29 64 L7 75 L3 102 Q20 92 28 115 L48 127 Z',light)}${p('M29 64 L28 102 L48 127','none',2)}</g>
 `}
 <g transform="${adult?'translate(77 29) scale(.42)':'translate(4 32)'}"><g class="dragon-head">${p('M58 38 L50 20 L67 31 M83 33 L94 17 L97 40',bone)}
 ${p('M48 52 Q45 31 69 30 Q91 28 98 49 L118 59 Q127 67 119 79 L88 85 Q57 86 48 67 Z',red)}
 ${hurt?`<path d="M66 45 L78 57 M78 45 L66 57" stroke="${ink}" stroke-width="4"/>`:`<ellipse cx="74" cy="51" rx="8" ry="9" fill="#fff4b0" stroke="${ink}" stroke-width="3"/><ellipse cx="77" cy="51" rx="3" ry="6" fill="${ink}"/>`}
 <path d="M61 40 L81 43" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
 <path class="dragon-mouth" d="M82 69 L122 69 L118 87 Q99 94 83 80 Z" fill="${ink}"/>
 <g class="dragon-jaw">${p('M82 70 L122 69 L118 83 Q103 94 83 83 Z',light)}${p('M92 72 L97 80 L101 72 M110 72 L114 79 L118 72','#fffbe8',1.5)}</g>
 <path d="M88 69 L119 69" stroke="${ink}" stroke-width="3"/><circle cx="112" cy="61" r="2.5" fill="${ink}"/></g></g>
 </g></g></g></svg>`;
}
