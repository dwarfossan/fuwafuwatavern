/* 失蹤的雞（10-23）：戰場外觀。香香照大爺給的立繪配色畫，暫定；劇情場景用立繪（PORTRAITS.hen_white 等）
   原圖朝右（10-21 規格），整隻一張圖，共用 undeadStaticDollSVG。座標畫在 200×200 裡、腳踩在 y≈188 */
const CHICKEN_ART = {};
const chickenSVG = ({body, wing, tail, demon=false}) => `<g stroke="#29252e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
  ${demon ? `<path d="M86 104 Q46 44 14 66 Q34 76 24 96 Q44 94 42 116 Q64 104 92 118Z" fill="#c43a3a"/><path d="M60 122 Q30 140 40 160 Q46 150 54 154 L50 140" fill="none" stroke="#c43a3a"/><path d="M40 160 L30 170 L46 168Z" fill="#c43a3a"/>`
    : `<path d="M64 100 Q30 58 46 34 Q58 66 78 82Z" fill="${tail}"/>`}
  <path d="M92 150 L88 186 M78 188 L88 186 L98 188 M112 150 L116 186 M106 188 L116 186 L126 188" fill="none" stroke="#e8a020" stroke-width="7"/>
  <ellipse cx="100" cy="118" rx="48" ry="42" fill="${body}"/>
  ${demon ? "" : `<path d="M74 112 Q100 94 126 116 Q104 142 76 130Z" fill="${wing}"/>`}
  <circle cx="136" cy="72" r="24" fill="${body}"/>
  ${demon ? `<path d="M124 54 Q110 38 118 24 Q122 40 132 50Z M144 50 Q152 32 166 34 Q154 42 150 54Z" fill="#2b2228"/>` : ""}
  <path d="M122 52 Q124 36 134 48 Q140 32 146 48 Q156 38 154 56Z" fill="#e23b2e"/>
  <path d="M158 68 L178 76 L158 84Z" fill="#f2b51f"/>
  <path d="M152 86 Q158 100 148 100 Q142 94 150 86Z" fill="#e23b2e"/>
  <circle cx="146" cy="70" r="4.5" fill="${demon ? "#ffd23a" : "#29252e"}" stroke-width="${demon ? 2 : 0}"/>
  <path d="M136 61 L154 66" fill="none" stroke-width="5"/>
  ${demon ? `<path d="M100 132 L106 140 L100 148 L94 140Z" fill="#e23b2e" stroke-width="3"/>` : ""}
</g>`;
CHICKEN_ART.hen_white = chickenSVG({body:"#f4efe4", wing:"#ddd3c0", tail:"#ddd3c0"});
CHICKEN_ART.hen_brown = chickenSVG({body:"#b8743a", wing:"#8f5426", tail:"#6b3d1c"});
CHICKEN_ART.rooster   = chickenSVG({body:"#e08a2c", wing:"#b5501f", tail:"#1f4e5a"});
CHICKEN_ART.demon_chicken = chickenSVG({body:"#a8202c", demon:true});
// 惡魔原形：黑長髮、羊角、紅色蝙蝠翅膀、惡魔尾巴（大爺 10-23 的女惡魔立繪，髮色改黑）
CHICKEN_ART.chicken_demon = `<g stroke="#29252e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M98 92 Q50 30 10 54 Q32 66 20 88 Q44 88 40 112 Q64 100 98 112Z" fill="#c43a3a"/>
  <path d="M108 92 Q156 30 196 54 Q174 66 186 88 Q162 88 166 112 Q142 100 108 112Z" fill="#b3313a"/>
  <path d="M82 150 Q52 160 56 182" fill="none" stroke="#8e1f2a" stroke-width="6"/><path d="M56 182 L46 190 L62 190Z" fill="#8e1f2a"/>
  <path d="M94 150 L90 186 M112 150 L116 186" fill="none" stroke="#f2c9a8" stroke-width="10"/>
  <path d="M84 178 L98 178 L98 190 L80 190Z M110 178 L124 178 L128 190 L110 190Z" fill="#2a1a24"/>
  <path d="M82 100 L124 100 L136 156 L70 156Z" fill="#2a1a24"/><path d="M74 150 L132 150" fill="none" stroke="#d9a52b" stroke-width="4"/>
  <path d="M92 104 L114 104 L110 122 L96 122Z" fill="#8e1f2a" stroke-width="3"/>
  <path d="M84 104 L66 132 M122 104 L142 128" fill="none" stroke="#f2c9a8" stroke-width="9"/>
  <path d="M80 66 Q78 38 104 40 Q132 38 130 70 L136 120 Q122 108 120 84 L88 84 L82 122 Q72 108 80 66Z" fill="#1d1720"/>
  <circle cx="106" cy="70" r="20" fill="#f2c9a8"/>
  <path d="M86 62 Q90 44 106 46 Q124 46 126 62 Q112 54 98 60 Q92 64 86 62Z" fill="#1d1720"/>
  <path d="M92 50 Q74 34 82 22 Q88 38 100 46Z M118 46 Q130 28 142 32 Q128 38 124 50Z" fill="#2b2228"/>
  <path d="M84 30 L88 36 M134 32 L130 38" fill="none" stroke="#d9a52b" stroke-width="3"/>
  <ellipse cx="116" cy="70" rx="3.5" ry="4.5" fill="#ffc93a" stroke-width="2"/><path d="M110 64 L122 66" fill="none" stroke-width="3"/>
  <path d="M114 80 Q118 82 122 79" fill="none" stroke-width="2.5"/>
</g>`;
const chickenFace = (id, s, tx, ty) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="translate(50 50) scale(${s}) translate(${tx} ${ty})">${CHICKEN_ART[id]}</g></svg>`;
["hen_white","hen_brown","rooster","demon_chicken"].forEach(id=>{
  MONSTER_LOOK[id] = {kind:id, art:`<g transform="translate(20 53) scale(0.5)">${CHICKEN_ART[id]}</g>`, face:chickenFace(id, 0.62, -112, -108), render:undeadStaticDollSVG};
});
MONSTER_LOOK.chicken_demon = {kind:"chicken_demon", art:`<g transform="translate(10 33) scale(0.6)">${CHICKEN_ART.chicken_demon}</g>`, face:chickenFace("chicken_demon", 0.62, -104, -104), render:undeadStaticDollSVG};
