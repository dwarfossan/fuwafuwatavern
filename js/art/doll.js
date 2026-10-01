/* ======================== 紙娃娃：簡單身體＋浮空的手＋掛上裝備 ========================
   手沒有手臂，是浮在身體旁的圓球（不用處理關節透視）。
   主手拿武器（或法杖），副手拿盾／法書／法球；雙手武器兩隻手都握在武器上。
   動作用 CSS 即時演出：整隻（.dl-act）、主手（.dl-arm）、副手（.dl-off）各自動。
   畫布 140×150，腳底在 (70,140) */

// 裝備怎麼拿：握把位置 (gx,gy)、平常的角度、縮放、雙手時第二隻手的位置
const HELD = {
  sword:        {gy:106, ang:35},
  heavy:        {gy:96,  ang:25, two:122},
  axe:          {gy:112, ang:30},
  mace:         {gy:122, ang:30},
  polearm:      {gy:96,  ang:12, two:128},
  dagger:       {gy:99,  ang:40},
  bow:          {gx:95,  gy:60, ang:-6, s:.56, hx:130, hy:100},   // 弓要拿在身體外側，弦才不會壓在身上
  crossbow:     {gy:112, ang:75},
  thrown:       {gy:72,  ang:25},
  arcane_staff: {gy:100, ang:12},
  shaman_totem: {gy:100, ang:12},
  shield:       {gy:60,  ang:0,  s:.34},
  healing_book: {gx:62,  gy:62, ang:-10, s:.4},
  flame_orb:    {gy:70,  ang:0,  s:.4}
};
const GLOW = {arcane_staff:"#8fd0f0", healing_book:"#9be08a", flame_orb:"#f2b441", shaman_totem:"#c58af0"};

// 每個動作的長度（毫秒）與「打中」的時間點
const DOLL_DUR    = {slash:550, smash:720, combo:850, spin:760, thrust:520, guard:600, shoot:680, throw:620, punch:420, cast:820, slam:760, hurt:600, getup:520, fall:450, hop:160, lunge:460};
const DOLL_IMPACT = {slash:230, smash:400, combo:180, spin:260, thrust:280, guard:0,   shoot:450, throw:380, punch:230, cast:320, slam:420, lunge:200};

// 技能 → 動作（武器：普攻＋三招；法器：法術，法杖第一招是打擊）
const SKILL_ANIM = {
  sword:["slash","guard","combo","thrust"], heavy:["smash","spin","smash","thrust"], axe:["slash","smash","slash","smash"],
  mace:["smash","smash","slam","smash"], polearm:["thrust","guard","spin","thrust"], dagger:["thrust","thrust","thrust","thrust"],
  bow:["shoot","shoot","shoot","shoot"], crossbow:["shoot","shoot","shoot","shoot"], thrown:["throw","throw","throw","throw"],
  unarmed:["punch","slam","punch","combo"], arcane_staff:["smash","cast","cast","cast"], healing_book:["cast","cast","cast"], flame_orb:["cast","cast","cast"],
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
function armorSVG(kind){
  if(!kind) return "";
  const INK="#2a2630", d="M54 90 Q70 83 86 90 Q93 110 88 125 Q70 133 52 125 Q47 110 54 90 Z";
  // 布甲：法袍，長到腳邊，深紫配金邊、V 領和腰帶
  if(kind==="布甲") return `<path d="M48 86 Q70 78 92 86 Q99 108 101 132 Q70 141 39 132 Q41 108 48 86 Z" fill="#5b4f8f" stroke="${INK}" stroke-width="3"/>
    <path d="M70 101 L70 136" stroke="#473d73" stroke-width="2.5"/>
    <path d="M42 128 Q70 137 98 128" stroke="#e0ab45" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M47 110 Q70 117 93 110" stroke="#e0ab45" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M57 84 L70 101 L83 84" stroke="#e0ab45" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(kind==="輕甲") return `<path d="${d}" fill="#8a5a34" stroke="${INK}" stroke-width="3"/>
    <path d="M70 88 L70 128" stroke="#5e3a20" stroke-width="2.5" stroke-dasharray="3 3"/><path d="M53 114 Q70 120 87 114" stroke="#5e3a20" stroke-width="4" fill="none"/>`;
  if(kind==="中甲") return `<path d="${d}" fill="#9aa3b2" stroke="${INK}" stroke-width="3"/>
    ${[[60,98],[70,96],[80,98],[58,108],[68,106],[78,106],[86,108],[60,118],[70,118],[80,118]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#6f7888" stroke-width="1.6"/>`).join("")}`;
  return `<path d="${d}" fill="#b7bfcc" stroke="${INK}" stroke-width="3"/>
    <path d="M52 104 Q70 110 88 104 M51 116 Q70 122 89 116" stroke="#7b8494" stroke-width="3" fill="none"/>
    <path d="M56 91 Q70 85 84 91" stroke="#e0ab45" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="62" cy="96" rx="5" ry="3" fill="#eef1f6" opacity=".8"/>`;
}

// 拿在手上的裝備：放在 (hx,hy)，握把對準手
function heldSVG(key, hx, hy, angExtra=0){
  const h = HELD[key]; if(!h) return "";
  const gx = h.gx ?? 60, s = h.s ?? .4;
  return `<g transform="translate(${hx} ${hy}) rotate(${h.ang+angExtra})"><g transform="scale(${s}) translate(${-gx} ${-h.gy})">${ITEM_RAW[key]}</g></g>`;
}
const handSVG = (x,y,c,r=8.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#2a2630" stroke-width="3"/><circle cx="${x-2.5}" cy="${y-2.5}" r="${r*.3}" fill="#fff" opacity=".35"/>`;

// 四隻的外觀
function critterLook(id, c){
  const limb = id==="raccoon" ? "#5a3e2e" : c;   // 狸貓的手腳是深咖啡色
  return {head: critterSide(id), headHurt: critterSide(id, true), headHappy: critterSide(id, false, true), body:c, skin:limb, feet:limb, belly:true, tail: tailSVG(id, c),
    extra: id==="tiger" ? `<path d="M50 100 L58 102 M49 112 L57 112 M90 100 L82 102 M91 112 L83 112" stroke="#3b3a44" stroke-width="3" stroke-linecap="round"/>` : ""};
}

/* o: {id, color 或 look, main, off, armor, anim:{k, el}, face, down, prone, x, y, w, seed}
   down＝生命歸零（橫躺、半透明、X_X）；prone＝被推倒（橫躺、顏色正常） */
function dollSVG(o){
  const L = o.look || critterLook(o.id, o.color), c = L.skin, INK="#2a2630";
  const main = o.main, off = o.off, h = main && HELD[main];
  const two = h && h.two && !off;
  const now = Date.now();
  // 主手：武器跟著手一起轉
  let arm;
  if(main && h){
    const s = h.s ?? .4;
    arm = `<g transform="translate(${h.hx??100} ${h.hy??104}) rotate(${h.ang})">
      <g transform="scale(${s}) translate(${-(h.gx??60)} ${-h.gy})">${ITEM_RAW[main]}</g>
      ${handSVG(0,0,c)}${two?handSVG(0,(h.two-h.gy)*s,c):""}</g>`;
  } else arm = handSVG(100,104,c, main==="unarmed"?10:8.5);
  // 副手
  let offHand = "";
  if(!two){
    if(off==="shield") offHand = handSVG(40,106,c) + heldSVG("shield",38,108);
    else if(off) offHand = heldSVG(off,36,96) + handSVG(40,110,c);
    else offHand = handSVG(40,106,c);
  }
  const glow = GLOW[off] || GLOW[main] || "#f2b441";
  const act = o.anim ? `act-${o.anim.k}` : "";
  const flip = (o.face||1) < 0 ? `transform="translate(140 0) scale(-1 1)"` : "";
  const bob = -((now + (o.seed||0)*237) % 1600);
  const H = o.w*150/140;
  return `<svg class="doll ${o.down?"dl-down":o.prone?"dl-prone":o.cheer?"dl-cheer":""}" x="${o.x}" y="${o.y}" width="${o.w}" height="${H}" viewBox="0 0 140 150" overflow="visible" aria-hidden="true">
    <g ${flip}><g class="dl-lie"><g class="dl-act ${act}" style="--d:${o.anim?-o.anim.el:0}ms;--b:${bob}ms">
      <ellipse cx="60" cy="138" rx="10" ry="5.5" fill="${L.feet}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="80" cy="138" rx="10" ry="5.5" fill="${L.feet}" stroke="${INK}" stroke-width="3"/>
      <g class="dl-bob">
        ${o.backpack?`<g class="dl-backpack" transform="translate(42 74) scale(.42)">${ITEM_RAW.backpack}</g>`:""}
        ${L.tail}
        <path d="M50 86 Q70 74 90 86 Q98 110 92 128 Q70 140 48 128 Q42 110 50 86 Z" fill="${L.body}" stroke="${INK}" stroke-width="3.5"/>
        ${L.belly?`<ellipse cx="70" cy="113" rx="13" ry="14" fill="#fbf4ee" opacity=".85"/>`:""}
        ${L.extra||""}
        ${armorSVG(o.armor)}
        ${L.head.replace('<svg viewBox="0 0 100 100"', '<svg x="32" y="6" width="76" height="76" viewBox="0 0 100 100"')}
        ${o.cheer && L.headHappy ? `<g>${L.headHappy.replace('<svg viewBox="0 0 100 100"', '<svg x="32" y="6" width="76" height="76" viewBox="0 0 100 100"')}</g>` : ""}
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
  const w = u.weapon ? groupOf(u.weapon).id : null;
  const f = u.focus ? groupOf(u.focus).id : null;
  let main = w, off = null;
  if(!main && (f==="arcane_staff" || f==="shaman_totem")) main = f;   // 杖類法器拿在主手
  if(!main && !f) main = "unarmed";
  if(u.shield) off = "shield";
  else if(f && f!==main) off = f;
  return {main, off, armor: u.armor ? u.armor.n : null, backpack: !!u.backpackEquip};
}
