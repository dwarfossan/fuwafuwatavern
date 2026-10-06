/* ======================== 紙娃娃：簡單身體＋浮空的手＋掛上裝備 ========================
   手沒有手臂，是浮在身體旁的圓球（不用處理關節透視）。
   主手拿武器（或法杖），副手拿盾／法書／法球；雙手武器兩隻手都握在武器上。
   動作用 CSS 即時演出：整隻（.dl-act）、主手（.dl-arm）、副手（.dl-off）各自動。
   畫布 140×150，腳底在 (70,140) */

// 裝備怎麼拿：握把位置 (gx,gy)、平常的角度、縮放、雙手時第二隻手的位置
const HELD = {
  club:         {gy:112, ang:30},
  scimitar:     {gy:106, ang:35},
  sword:        {gy:106, ang:35},
  heavy:        {gy:96,  ang:25, two:122},
  axe:          {gy:112, ang:30},
  mace:         {gy:122, ang:30},
  polearm:      {gy:96,  ang:12, two:128},
  dagger:       {gy:99,  ang:40},
  bow:          {gx:95,  gy:60, ang:-6, s:.56, hx:130, hy:100},   // 弓要拿在身體外側，弦才不會壓在身上
  crossbow:     {gy:112, ang:75},
  firearm:      {gy:100, ang:78, two:24, twoX:70},   // 火槍：主手握槍托、副手托住槍管下面的護木（twoX：副手偏到槍管下面）（10-03 大爺）
  pistol:       {gy:100, ang:80, s:.34},     // 手槍：單手（item.art；SRD 手槍不是雙手武器）
  thrown:       {gy:72,  ang:25},
  arcane_staff: {gy:100, ang:12},
  shaman_totem: {gy:100, ang:12},
  shield:       {gy:60,  ang:0,  s:.34},
  healing_book: {gx:62,  gy:62, ang:-10, s:.4},
  flame_orb:    {gy:70,  ang:0,  s:.4}
};
const GLOW = {arcane_staff:"#8fd0f0", healing_book:"#9be08a", flame_orb:"#f2b441", shaman_totem:"#c58af0"};

// 每個動作的長度（毫秒）與「打中」的時間點
const DOLL_DUR    = {slash:550, smash:720, combo:850, spin:760, thrust:520, guard:600, shoot:680, fire:1150, throw:620, punch:420, cast:820, slam:760, hurt:600, getup:520, fall:450, hop:160, lunge:460};
const DOLL_IMPACT = {slash:230, smash:400, combo:180, spin:260, thrust:280, guard:0,   shoot:450, fire:820, throw:380, punch:230, cast:320, slam:420, lunge:200};

// 技能 → 動作（武器：普攻＋三招；法器：法術，法杖第一招是打擊）
const SKILL_ANIM = {
  // 跟 data/skills.js 每組的招式一一對應（2026-10-01 合併重複招式後：劍、長柄、投擲、徒手少了幾招）
  sword:["slash","guard","combo"], heavy:["smash","spin","smash","thrust"], axe:["slash","smash","slash","smash"],
  mace:["smash","smash","slam","smash"], polearm:["thrust","guard"], dagger:["thrust","thrust","thrust","thrust"],
  bow:["shoot","shoot","shoot","shoot"], crossbow:["shoot","shoot","shoot","shoot"], firearm:["fire"], thrown:["throw","throw","throw"],
  unarmed:["punch","slam"], arcane_staff:["smash","cast","cast","cast"], healing_book:["cast","cast","cast"], flame_orb:["cast","cast","cast"],
  shaman_totem:["cast","cast","cast"]
};
const animFor = (groupId, idx) => (SKILL_ANIM[groupId]||[])[idx] || "slash";

// 各角色的尾巴（畫在身體後面）
function tailSVG(id, c){
  const INK="#2a2630";
  const pp = (d,f,w=3) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if(id==="fox") return pp("M54 120 Q22 116 20 84 Q32 98 46 98 Q40 88 44 76 Q58 96 60 112 Z", c) + pp("M20 84 Q24 76 32 78 Q30 90 38 96 Q26 96 20 84 Z", "#fbead6", 2.5);
  if(id==="tiger") return `<path d="M54 124 Q28 126 28 104 Q28 92 38 88" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
    <path d="M54 124 Q28 126 28 104 Q28 92 38 88" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
    <path d="M38 118 L34 126 M29 106 L22 108 M32 94 L28 88" stroke="#3b3a44" stroke-width="3.5" stroke-linecap="round"/>`;
  if(id==="wolf") return pp("M54 120 Q24 124 20 98 Q32 108 44 106 Q38 96 44 86 Q58 102 60 114 Z", c) + pp("M20 98 Q24 90 30 92 Q30 100 36 104 Q26 106 20 98 Z", "#6e7690", 2.5);
  // 狸貓：短而蓬的尾巴，尾端深咖啡（沒有浣熊的環紋）
  return pp("M56 120 Q30 124 26 102 Q24 88 36 86 Q48 88 48 100 Q50 110 60 110 Z", c)
    + pp("M26 102 Q24 88 36 86 Q42 87 45 92 Q36 92 32 100 Q30 106 33 112 Q27 109 26 102 Z", "#4a3226", 2.5);
}

// 護甲（紙娃娃的衣服層，蓋在身體上）
/* 身體裝備分三層（大爺 10-02）：
     body＝蓋在身上（大家共用同一個身體形狀，直接畫在紙娃娃座標上）
     neck＝項鍊之類，以「頸錨點」為原點畫；畫在身體上、頭下面
     head＝頭飾，以「頭錨點」為原點畫（頭的 100×100 座標，原點＝額頭正中、布帶的位置）；畫在頭上面
   錨點每種外觀各一組（critterLook、MONSTER_LOOK 的 anchor），沒寫就用 DEFAULT_ANCHOR
   ARMOR_ART 的值可以是字串（只有 body），或 {body, neck, head}
   身體裝備（2026-10-01：改回 SRD 的 12 件＋法袍，每件畫出差異，大爺之後修）
   kind＝裝備名稱；沒有專屬畫法的照分類（輕甲／中甲／重甲）畫。畫在紙娃娃的身體上（身體約 x 48~92、y 83~133） */
const ARMOR_ART = (()=>{
  // 外框比身體大一圈，蓋住肩膀（2026-10-01 大爺：原本比身體窄，肩膀會露出來）
  const INK="#2a2630", T="M47 84 Q70 72 93 84 Q100 110 94 127 Q70 138 46 127 Q40 110 47 84 Z";      // 一般上衣
  const LONG="M47 84 Q70 72 93 84 Q101 110 96 132 Q70 142 44 132 Q39 110 47 84 Z";                  // 長到大腿
  const body = (d, fill, w=3) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}"/>`;
  const line = (d, c, w=2.5, extra="") => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" ${extra}/>`;
  const dots = (pts, r, fill, stroke) => pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${stroke?`stroke="${stroke}" stroke-width="1.3"`:""}/>`).join("");
  const rings = (pts, r, c) => pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="1.6"/>`).join("");
  const grid = (x0,x1,y0,y1,dx,dy,off=true) => { const o=[]; for(let y=y0,k=0;y<=y1;y+=dy,k++) for(let x=x0+(off&&k%2?dx/2:0);x<=x1;x+=dx) o.push([x,y]); return o; };
  const belt = (c="#5e3a20") => line("M52 116 Q70 122 88 116", c, 4.5);
  return {
    // 衣服：法袍，長到腳邊，深紫配金邊、V 領和腰帶
    "法袍": `<path d="M48 86 Q70 78 92 86 Q99 108 101 132 Q70 141 39 132 Q41 108 48 86 Z" fill="#5b4f8f" stroke="${INK}" stroke-width="3"/>
      ${line("M70 101 L70 136","#473d73")}${line("M42 128 Q70 137 98 128","#e0ab45",3)}${line("M47 110 Q70 117 93 110","#e0ab45",4)}
      ${line("M57 84 L70 101 L83 84","#e0ab45",3,'stroke-linejoin="round"')}`,
    // 衣服：破布衣（哥布林穿的），形狀跟紙娃娃身體一樣；麻繩腰帶、下襬破成鋸齒
    "破布衣": `<path d="M50 86 Q70 74 90 86 Q98 110 92 128 L85 126 L79 133 L72 128 L65 134 L58 127 L49 130 Q42 110 50 86 Z" fill="#7a5a3c" stroke="${INK}" stroke-width="3.5"/>
      ${line("M49 112 Q70 119 91 112","#c9a86a",3.5)}`,
    // +1 薩滿袍（大爺 10-02）：紫袍＋骷髏頭飾＋牙齒項鍊，一整套
    "+1 薩滿袍": {
      body: `<path d="M50 86 Q70 74 90 86 Q98 110 92 128 Q70 140 48 128 Q42 110 50 86 Z" fill="#5e4a6e" stroke="${INK}" stroke-width="3.5"/>
        <path d="M50 90 Q70 101 90 90" stroke="${INK}" stroke-width="1.5" fill="none"/>${line("M49 112 Q70 119 91 112","#c9a86a",3.5)}`,
      neck: [[-12,-2],[-6,1.5],[0,3],[6,1.5],[12,-2]].map(([x,y])=>`<path d="M${x-2.6} ${y-2}L${x+2.6} ${y-2}L${x} ${y+5}Z" fill="#fffbe8" stroke="${INK}" stroke-width="1.3"/>`).join(""),
      head: `<path d="M-23 5 Q0 -5 23 5" stroke="${INK}" stroke-width="8.5" fill="none" stroke-linecap="round"/><path d="M-23 5 Q0 -5 23 5" stroke="#a33c32" stroke-width="5.5" fill="none" stroke-linecap="round"/>
        <g transform="translate(2 -13)"><path d="M-11 2 Q-12 -13 0 -14 Q12 -13 11 2 Q11 7 6 8 L6 12 L-6 12 L-6 8 Q-11 7 -11 2 Z" fill="#f3ead2" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
        <ellipse cx="-4.5" cy="-1.5" rx="3.3" ry="3.8" fill="${INK}"/><ellipse cx="4.5" cy="-1.5" rx="3.3" ry="3.8" fill="${INK}"/>
        <path d="M0 2.5 L-1.8 6 L1.8 6 Z" fill="${INK}"/><path d="M-3 12 L-3 8.5 M0 12 L0 8.5 M3 12 L3 8.5" stroke="${INK}" stroke-width="1.3"/></g>
        <path d="M-1 -2 L5 -2 L2 6 Z" fill="#fffbe8" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    },
    // 輕甲
    "軟甲": body(T,"#d8c7a0") + line("M54 98 L86 120 M54 112 L76 126 M60 90 L88 108 M86 98 L54 120 M86 112 L64 126 M80 90 L52 108","#b59f72",1.8) + line("M58 89 Q70 94 82 89","#b59f72",3),   // 菱格縫線的棉甲
    "皮甲": body(T,"#9a6a3e") + line("M70 88 L70 128","#6e4a32",2.2,'stroke-dasharray="3 3"') + belt(),                                   // 素面皮衣
    "鑲釘皮甲": body(T,"#7a4a2a") + line("M70 88 L70 128","#5e3a20",2.2,'stroke-dasharray="3 3"') + belt("#4a2c18")
      + dots([[58,97],[82,97],[58,108],[82,108]],2.2,"#d9dee6","#2a2630"),                            // 皮衣＋金屬鉚釘
    // 中甲
    "獸皮甲": body(T,"#a8865e") + `<path d="M52 121 L56 129 L60 122 L64 130 L68 123 L72 130 L76 123 L80 130 L84 122 L88 128 L88 121 Z" fill="#c9a77a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M54 90 Q62 84 70 88 Q78 84 86 90 Q80 97 70 94 Q60 97 54 90 Z" fill="#e2cfa8" stroke="${INK}" stroke-width="2"/>` + line("M60 104 q3 -3 6 0 M74 108 q3 -3 6 0 M64 114 q3 -3 6 0","#7e6040",2),   // 毛領＋毛邊下擺
    "鏈甲衫": body(T,"#9aa3b2") + rings(grid(58,82,98,118,12,10),2.8,"#6f7888") + `<path d="M58 88 Q70 94 82 88 L80 92 Q70 97 60 92 Z" fill="#6b4a35" stroke="${INK}" stroke-width="1.5"/>`,   // 鏈環＋皮領
    "鱗甲": body(T,"#a99a72") + grid(58,82,98,122,12,8).map(([x,y])=>`<path d="M${x-3.5} ${y} Q${x} ${y+5} ${x+3.5} ${y}" stroke="#6e6244" stroke-width="1.6" fill="none"/>`).join("") + belt("#5e3a20"),   // 一片一片的鱗
    "胸甲": body(T,"#7a5a3c") + `<path d="M55 90 Q70 84 85 90 Q90 104 84 114 Q70 120 56 114 Q50 104 55 90 Z" fill="#c9d0dc" stroke="${INK}" stroke-width="2.5"/>`
      + line("M70 88 L70 116","#8c97ab",2) + `<ellipse cx="62" cy="97" rx="4" ry="6" fill="#f2f4f8" opacity=".8"/>` + belt("#4a2c18"),   // 亮面胸板＋皮裙
    "半身板甲": body(T,"#7a5a3c") + `<path d="M55 90 Q70 84 85 90 Q90 104 84 114 Q70 120 56 114 Q50 104 55 90 Z" fill="#b7bfcc" stroke="${INK}" stroke-width="2.5"/>`
      + `<path d="M46 92 Q52 84 60 89 Q56 96 48 98 Z M94 92 Q88 84 80 89 Q84 96 92 98 Z" fill="#c9d0dc" stroke="${INK}" stroke-width="2"/>`
      + `<path d="M54 116 L86 116 L88 124 L52 124 Z" fill="#9aa3b2" stroke="${INK}" stroke-width="2"/>` + line("M70 88 L70 114","#7b8494",2),   // 胸板＋護肩＋腰甲片
    // 重甲
    "環甲": body(LONG,"#6b4a35") + rings(grid(58,84,96,126,10,9,false),3.6,"#b7bfcc") + line("M50 120 Q70 126 90 120","#4a2c18",3.5),   // 皮衣縫上大鐵環
    "鏈甲": body(LONG,"#8c95a4") + rings(grid(56,84,96,128,9,8),2.4,"#5f6878") + `<path d="M56 87 Q70 92 84 87 L83 91 Q70 96 57 91 Z" fill="#5f6878" stroke="${INK}" stroke-width="1.5"/>` + belt("#4a2c18"),   // 長到大腿的細密鏈甲
    "板條甲": body(LONG,"#6b4a35") + [57,63,69,75,81].map(x=>`<rect x="${x}" y="92" width="5" height="34" rx="1.5" fill="#b7bfcc" stroke="${INK}" stroke-width="1.5"/>`).join("")
      + dots([[59.5,96],[65.5,96],[71.5,96],[77.5,96],[83.5,96],[59.5,121],[65.5,121],[71.5,121],[77.5,121],[83.5,121]],1,"#2a2630"),   // 直條鐵片＋鉚釘
    "全身板甲": body(LONG,"#c9d0dc") + line("M50 104 Q70 110 90 104 M49 116 Q70 122 91 116","#8c97ab",3)
      + `<path d="M44 92 Q52 82 62 88 Q58 97 47 100 Z M96 92 Q88 82 78 88 Q82 97 93 100 Z" fill="#dfe6ee" stroke="${INK}" stroke-width="2"/>`
      + line("M56 91 Q70 85 84 91","#e0ab45",4) + `<ellipse cx="62" cy="97" rx="5" ry="3" fill="#f2f4f8" opacity=".9"/>`,   // 整身亮面＋金邊＋護肩
  };
})();
const ARMOR_BY_TIER = {"衣服":"法袍", "輕甲":"皮甲", "中甲":"鏈甲衫", "重甲":"鏈甲"};
function armorArt(kind){                    // 一律回傳 {body, neck, head}
  if(!kind) return {};
  let a = ARMOR_ART[kind];
  if(!a){ const it = ITEMS.find(i=>i.type==="armor" && i.n===kind); a = ARMOR_ART[ARMOR_BY_TIER[it && it.tier] || "皮甲"]; }
  return typeof a==="string" ? {body:a} : a;
}
function armorSVG(kind){ const a = armorArt(kind); return (a.body||"") + (a.neck ? `<g transform="translate(${DEFAULT_ANCHOR.neck.join(" ")})">${a.neck}</g>` : ""); }   // 圖示用：身體＋項鍊
// 錨點：head＝[x, y, 縮放]（頭的 100×100 座標），neck＝[x, y]（紙娃娃座標）
const DEFAULT_ANCHOR = {head:[52,28,1], neck:[70,95]};


// 拿在手上的裝備：放在 (hx,hy)，握把對準手
function heldSVG(key, hx, hy, angExtra=0){
  const h = HELD[key]; if(!h) return "";
  const gx = h.gx ?? 60, s = h.s ?? .4;
  return `<g transform="translate(${hx} ${hy}) rotate(${h.ang+angExtra})"><g transform="scale(${s}) translate(${-gx} ${-h.gy})">${ITEM_RAW[key]}</g></g>`;
}
const handSVG = (x,y,c,r=8.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#2a2630" stroke-width="3"/><circle cx="${x-2.5}" cy="${y-2.5}" r="${r*.3}" fill="#fff" opacity=".35"/>`;

// 四隻的頭、頸錨點（大爺 10-02）：頭比哥布林圓、大，頭飾放大一點、往上一點；目測，大爺看過再調
const CRITTER_ANCHOR = {
  fox:     {head:[52,26,1.15], neck:[70,95]},
  tiger:   {head:[51,26,1.18], neck:[70,95]},
  wolf:    {head:[52,26,1.15], neck:[70,95]},
  raccoon: {head:[51,27,1.18], neck:[70,95]}
};
// 四隻的外觀
function critterLook(id, c, mood="normal"){
  const limb = id==="raccoon" ? "#5a3e2e" : c;   // 狸貓的手腳是深咖啡色
  return {head: critterSide(id, mood), headHurt: critterSide(id, true), headHappy: critterSide(id, false, true), body:c, skin:limb, feet:limb, belly:true, tail: tailSVG(id, c), anchor: CRITTER_ANCHOR[id],
    extra: id==="tiger" ? `<path d="M50 100 L58 102 M49 112 L57 112 M90 100 L82 102 M91 112 L83 112" stroke="#3b3a44" stroke-width="3" stroke-linecap="round"/>` : ""};
}

/* o: {id, color 或 look, main, off, armor, anim:{k, el}, face, down, prone, x, y, w, seed}
   down＝生命歸零（橫躺、半透明、X_X）；prone＝被推倒（橫躺、顏色正常） */
function dollSVG(o){
  if(o.look?.render)return o.look.render(o);
  const L = o.look || critterLook(o.id, o.color, o.mood), c = L.skin, INK="#2a2630";
  const gear = armorArt(o.armor), anc = {...DEFAULT_ANCHOR, ...(L.anchor||{})};
  const main = o.main, off = o.off, h = main && HELD[main];
  const two = h && h.two && !off;
  const now = Date.now(), level = leveling(o), cheer = o.cheer || level;
  // 主手：武器跟著手一起轉
  let arm;
  if(main && h){
    const s = h.s ?? .4;
    arm = `<g transform="translate(${h.hx??100} ${h.hy??104}) rotate(${h.ang})">
      <g transform="scale(${s}) translate(${-(h.gx??60)} ${-h.gy})">${ITEM_RAW[main]}</g>
      ${handSVG(0,0,c)}${two?handSVG(((h.twoX??(h.gx??60))-(h.gx??60))*s,(h.two-h.gy)*s,c):""}</g>`;
  } else arm = handSVG(100,104,c, main==="unarmed"?10:8.5);
  // 副手
  let offHand = "";
  if(!two){
    if(off==="shield") offHand = handSVG(40,106,c) + heldSVG("shield",38,108);
    else if(off) offHand = heldSVG(off,36,96) + handSVG(40,110,c);
    else offHand = handSVG(40,106,c);
  }
  const glow = GLOW[off] || GLOW[main] || "#f2b441";
  const act = o.walking ? "act-walk" : o.anim ? `act-${o.anim.k}${o.anim.hand==="off"?" offhand-attack":""}` : "";
  const flip = (o.face||1) < 0 ? `transform="translate(140 0) scale(-1 1)"` : "";
  const bob = -((now + (o.seed||0)*237) % 1600);
  const H = o.w*150/140;
  return `<svg class="doll ${o.down?"dl-down":o.prone?"dl-prone":cheer?"dl-cheer":""}" x="${o.x}" y="${o.y}" width="${o.w}" height="${H}" viewBox="0 0 140 150" overflow="visible" aria-hidden="true">
    ${level?`<g class="dl-level-aura" style="--level-delay:${-(now-o.levelUpAt)}ms"><ellipse cx="70" cy="136" rx="42" ry="12"/><path d="M28 136 Q22 118 32 104 M112 136 Q118 118 108 104"/><path class="level-front" d="M29 133 Q70 160 111 133"/></g>`:""}
    <g class="dl-face" ${flip}><g class="dl-lie"><g class="dl-act ${act}" style="--d:${o.anim?-o.anim.el:0}ms;--b:${bob}ms;--walk:${-(now%360)}ms">
      <ellipse class="dl-foot-left" cx="60" cy="138" rx="10" ry="5.5" fill="${L.feet}" stroke="${INK}" stroke-width="3"/>
      <ellipse class="dl-foot-right" cx="80" cy="138" rx="10" ry="5.5" fill="${L.feet}" stroke="${INK}" stroke-width="3"/>
      <g class="dl-bob">
        <g class="dl-backpack" transform="translate(42 74) scale(.42)">${o.backpack?ITEM_RAW.backpack:""}</g>
        ${L.tail}
        <path d="M50 86 Q70 74 90 86 Q98 110 92 128 Q70 140 48 128 Q42 110 50 86 Z" fill="${L.body}" stroke="${INK}" stroke-width="3.5"/>
        ${L.belly?`<ellipse cx="70" cy="113" rx="13" ry="14" fill="#fbf4ee" opacity=".85"/>`:""}
        ${L.extra||""}
        <g class="dl-gear-body">${gear.body||""}</g>
        <g class="dl-gear-neck">${gear.neck ? `<g transform="translate(${anc.neck.join(" ")})">${gear.neck}</g>` : ""}</g>
        ${L.head.replace('<svg viewBox="0 0 100 100"', '<svg x="32" y="6" width="76" height="76" viewBox="0 0 100 100"')}
        ${cheer && L.headHappy ? `<g>${L.headHappy.replace('<svg viewBox="0 0 100 100"', '<svg x="32" y="6" width="76" height="76" viewBox="0 0 100 100"')}</g>` : ""}
        <g class="dl-gear-head">${gear.head ? `<g transform="translate(32 6) scale(.76)"><g transform="translate(${anc.head[0]} ${anc.head[1]}) scale(${anc.head[2]})">${gear.head}</g></g>` : ""}</g>
        ${L.headHurt && o.down ? `<g>${L.headHurt.replace('<svg viewBox="0 0 100 100"', '<svg x="32" y="6" width="76" height="76" viewBox="0 0 100 100"')}</g>` :
          L.headHurt && o.anim && o.anim.k==="hurt" ? `<g class="dl-xeyes" data-exp="${now - o.anim.el + DOLL_DUR.hurt}">${L.headHurt.replace('<svg viewBox="0 0 100 100"', '<svg x="32" y="6" width="76" height="76" viewBox="0 0 100 100"')}</g>` : ""}
        <g class="dl-off">${offHand}<circle class="dl-glow" cx="40" cy="96" r="18" fill="${glow}"/></g>
        <g class="dl-arm">${arm}</g>
      </g>
    </g></g></g>
  </svg>`;
}

// 從戰鬥單位算出紙娃娃要拿什麼
function dollGear(u){                       // 敵我一樣：照手上的武器、法器、盾算
  const w = u.weapon ? equipmentArtKey(u.weapon) : null;   // art：同一類裡長得不一樣的（手槍，10-03）
  const f = u.focus ? equipmentArtKey(u.focus) : null;
  let main = w, off = null;
  if(!main && (f==="arcane_staff" || f==="shaman_totem")) main = f;   // 杖類法器拿在主手
  if(!main && !f) main = "unarmed";
  if(u.shield) off = "shield";
  else if(u.offhand)off=equipmentArtKey(u.offhand);
  else if(f && f!==main) off = f;
  return {main, off, armor: u.armor ? (u.armor.base||u.armor.n) : null, backpack: !!u.backpackEquip};
}
