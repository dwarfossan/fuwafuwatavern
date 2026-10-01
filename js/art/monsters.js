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
  // 哥布林薩滿：羽毛頭飾（紅、金、青三根羽毛＋額頭的布帶和一顆牙）
  const feathers = (xs, band) => `
    ${xs.map(([x,y,r,c])=>`<ellipse cx="${x}" cy="${y}" rx="4.2" ry="12" fill="${c}" stroke="${INK}" stroke-width="2.2" transform="rotate(${r} ${x} ${y+10})"/>
      <path d="M${x} ${y-8} L${x} ${y+9}" stroke="${INK}" stroke-width="1.2" opacity=".5" transform="rotate(${r} ${x} ${y+10})"/>`).join("")}
    <path d="${band}" stroke="${INK}" stroke-width="8.5" fill="none" stroke-linecap="round"/><path d="${band}" stroke="#a33c32" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
  const hat = (svg, xs, band, tooth) => svg.replace(/<\/svg>\s*$/, `${feathers(xs, band)}${tooth}</svg>`);
  const TOOTH = (x,y) => `<path d="M${x-3} ${y-2} L${x+3} ${y-2} L${x} ${y+6} Z" fill="#fffbe8" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const SIDE_F = [[40,13,-22,"#e0766e"],[52,8,-4,"#f2b441"],[64,11,16,"#5fa8a0"]], SIDE_B = "M29 33 Q52 23 75 33";
  const FACE_F = [[38,11,-20,"#e0766e"],[50,6,0,"#f2b441"],[62,11,20,"#5fa8a0"]],  FACE_B = "M28 34 Q50 24 72 34";
  const necklace = [[58,93],[64,96.5],[70,98],[76,96.5],[82,93]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="#fffbe8" stroke="${INK}" stroke-width="1.5"/>`).join("");
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
  return {
    merchant: {
      face: uncleFace, head: uncleSide, headHurt: uncleSideHurt, body:"#5f7896", skin:SK, feet:"#5a3f28", belly:false, tail:"",
      extra: `<path d="M49 112 Q70 119 91 112" stroke="#6e4a32" stroke-width="5" fill="none" stroke-linecap="round"/>
              <path d="M80 114 Q88 113 89 121 Q88 129 80 128 Q74 126 75 120 Q75 115 80 114 Z" fill="#c9a86a" stroke="${INK}" stroke-width="2.5"/>
              <path d="M78 116 L84 115" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
    },
    goblin_shaman: {
      face: hat(goblinHead, FACE_F, FACE_B, TOOTH(50,29)), head: hat(goblinSide, SIDE_F, SIDE_B, TOOTH(54,28)), headHurt: hat(goblinSideHurt, SIDE_F, SIDE_B, TOOTH(54,28)),
      body:"#5e4a6e", skin:G, feet:"#5a3f28", belly:false, tail:"",
      extra: `<path d="M50 90 Q70 101 90 90" stroke="${INK}" stroke-width="1.5" fill="none"/>${necklace}
              <path d="M49 112 Q70 119 91 112" stroke="#c9a86a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    },
    goblin: {
      // face：頭像框、先攻列用的正面；head：棋盤上紙娃娃用的側臉
      face: goblinHead, head: goblinSide, headHurt: goblinSideHurt, body:"#7a5a3c", skin:G, feet:"#5a3f28", belly:false, tail:"",
      extra: `<path d="M49 112 Q70 119 91 112" stroke="#c9a86a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
              <path d="M50 124 L55 131 L60 126 L66 133 L72 127 L78 133 L84 126 L90 130" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`
    }
  };
})();
