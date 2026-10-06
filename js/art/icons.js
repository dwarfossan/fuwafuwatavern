/* 基礎裝備圖示（14 種＋10-03 火槍、手槍）（手繪風：黑框、平塗、一點亮面；10-03精簡外觀暫定GPT）
   ITEM_ART：圖示用（長兵器轉斜）；ITEM_RAW：拿在紙娃娃手上用（直立、未旋轉）
   畫布 120×120 */
const {ART: ITEM_ART, RAW: ITEM_RAW} = (()=>{
  const RAW = {};
  const INK="#2a2630", STEEL="#c9d0dc", STEEL_HI="#f2f4f8", STEEL_SH="#8c97ab",
        WOOD="#a0703f", WOOD_DK="#6e4a32", GOLD="#e0ab45", LEATHER="#6b4a35", SW=6;
  const p  = (d,f,w=SW) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const ln = (d,c,w=3)  => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const c  = (x,y,r,f,w=SW) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${INK}" stroke-width="${w}"/>`;
  // 長兵器：縮到 80% 再轉斜，才不會被邊框切掉
  const rot = (inner,a=-45,k=.8) => `<g transform="translate(60 60) scale(${k}) translate(-60 -60) rotate(${a} 60 60)">${inner}</g>`;
  const grip = (y1,y2,w=6) => p(`M${60-w} ${y1} L${60+w} ${y1} L${60+w} ${y2} L${60-w} ${y2} Z`, LEATHER) + ln(`M${60-w} ${(y1+y2)/2} L${60+w} ${(y1+y2)/2+3}`, "#4a3020", 3);
  const haft = (y1,y2,w=7) => p(`M${60-w} ${y1} L${60+w} ${y1} L${60+w} ${y2} L${60-w} ${y2} Z`, WOOD) + ln(`M${60-w+3} ${y1+6} L${60-w+3} ${y2-6}`, WOOD_DK, 2);
  const ART = {
    // 哥布林常用的木棒／彎刀：敵我共用，純外觀
    club: rot(RAW.club = p("M52 44Q42 28 46 5Q48 -8 61 -8Q78 -8 78 8L70 44L66 132L54 132Z",WOOD)
      + ln("M53 8L52 30M62 59L61 111",WOOD_DK,4),-35),
    scimitar: rot(RAW.scimitar = p("M50 82Q39 26 81 -25Q71 23 68 81Z",STEEL)
      + ln("M59 69Q55 29 73 0",STEEL_HI,4)+p("M34 81L84 81L81 92L37 92Z",GOLD)+grip(93,122)+c(60,130,7,GOLD),-35),
    // 劍類：細長直劍、十字護手
    sword: rot(RAW.sword =
      p("M52 -14 L60 -30 L68 -14 L68 82 L52 82 Z", STEEL) + ln("M60 -18 L60 78", STEEL_SH, 2.5) + ln("M56 -12 L56 76", STEEL_HI, 3)
      + p("M28 82 L92 82 L92 93 L28 93 Z", GOLD) + c(60,87.5,4,"#40669a",2)
      + grip(93,122) + c(60,130,8,GOLD)),
    // 雙手重武器：寬大巨劍、彎護手、長握柄
    heavy: rot(RAW.heavy =
      p("M47 -8 L60 -34 L73 -8 L73 70 L47 70 Z", "#b7bfcc") + ln("M60 -18 L60 66", STEEL_SH, 3) + ln("M53 -6 L53 64", STEEL_HI, 3.5)
      + p("M18 66 Q20 80 36 76 L84 76 Q100 80 102 66 L96 84 L24 84 Z", GOLD)
      + grip(84,128,7) + c(60,135,9,GOLD)),
    // 斧類：單刃戰斧
    axe: rot(RAW.axe =
      haft(-18,138) + p("M65 -6 Q98 -22 110 8 Q112 36 100 54 Q88 40 65 42 Z", STEEL)
      + ln("M100 -2 Q110 20 102 44", STEEL_HI, 4) + p("M50 -2 L58 -2 L58 38 L50 38 Q44 18 50 -2 Z", STEEL_SH, 4)
      + p("M53 30 L67 30 L67 46 L53 46 Z", GOLD, 4), -40),
    // 錘類：凸緣硬頭錘
    mace: rot(RAW.mace =
      haft(24,138) + p("M36 -6 L46 -18 L60 -24 L74 -18 L84 -6 L86 12 L78 28 L60 34 L42 28 L34 12 Z", STEEL)
      + ln("M60 -24 L60 34 M36 -6 L84 28 M84 -6 L36 28", STEEL_SH, 3) + c(60,5,9,STEEL_HI,3)
      + p("M52 34 L68 34 L68 44 L52 44 Z", GOLD, 4) + grip(112,136,6)),
    // 長柄類：戟
    polearm: rot(RAW.polearm =
      haft(-6,142,6) + p("M60 -34 L68 -8 L52 -8 Z", STEEL, 5)
      + p("M64 -2 Q96 -10 98 16 Q96 40 64 32 Z", STEEL) + ln("M92 2 Q97 16 92 30", STEEL_HI, 3.5)
      + p("M56 2 L36 12 L56 22 Z", STEEL_SH, 4) + p("M53 -8 L67 -8 L67 38 L53 38 Z", "none", 4)
      + p("M54 36 L66 36 L66 44 L54 44 Z", GOLD, 4), -40),
    // 匕首類：短而寬的葉形刃
    dagger: rot(RAW.dagger =
      p("M60 4 Q80 34 72 74 L48 74 Q40 34 60 4 Z", STEEL) + ln("M60 12 L60 70", STEEL_SH, 3) + ln("M53 30 Q50 50 53 68", STEEL_HI, 3.5)
      + p("M36 74 L84 74 Q88 80 84 86 L36 86 Q32 80 36 74 Z", GOLD) + grip(86,112,7) + c(60,119,9,"#e0766e"), -45, .95),
    // 弓類：弓身、弓弦、搭好的箭
    bow: `<g transform="translate(60 60) scale(.88) translate(-60 -60) rotate(-18 60 60)">${RAW.bow = `
      ${ln("M34 4 L34 116", INK, 6)}${ln("M34 4 L34 116", "#f1e2c6", 3)}
      ${p("M34 4 Q106 28 106 60 Q106 92 34 116 Q84 90 84 60 Q84 30 34 4 Z", WOOD)}
      ${p("M86 50 L104 50 L104 70 L86 70 Z", LEATHER, 4)}
      ${ln("M28 60 L112 60", INK, 8)}${ln("M28 60 L112 60", "#d8c49a", 4)}
      ${p("M108 52 L122 60 L108 68 Z", STEEL, 4)}
      ${p("M34 60 L22 50 L18 56 L28 60 L18 64 L22 70 Z", "#e0766e", 3)}
    `}</g>`,
    // 弩類：弩身、弩臂、弩矢
    crossbow: rot(RAW.crossbow =
      p("M52 30 L68 30 L70 138 L50 138 Z", WOOD) + ln("M56 40 L56 130", WOOD_DK, 2)
      + ln("M12 44 Q60 18 108 44", INK, 11) + ln("M12 44 Q60 18 108 44", STEEL, 6)
      + ln("M12 44 L60 64 L108 44", INK, 5) + ln("M12 44 L60 64 L108 44", "#f1e2c6", 2.5)
      + p("M57 -14 L63 -14 L63 64 L57 64 Z", "#d8c49a", 3.5) + p("M60 -28 L67 -12 L53 -12 Z", STEEL, 3.5)
      + p("M46 88 L60 84 L60 100 Z", STEEL_SH, 3.5), -40),
    // 火槍類（10-03）：槍口朝上畫、跟弩一樣轉斜。右邊（+x）在戰場上是「槍管下面」：
    //   槍管下面墊一條木頭護木（大爺：一手托著這塊），後段是槍托（另一手握這裡）
    firearm: rot(RAW.firearm =
      p("M58 -6 L73 -6 L73 86 L58 86 Z", WOOD) + ln("M68 2 L68 80", WOOD_DK, 2)
      + p("M53 -44 L61 -44 L61 88 L53 88 Z", STEEL) + ln("M55 -38 L55 82", STEEL_HI, 2)
      + p("M51 -48 L63 -48 L63 -40 L51 -40 Z", STEEL_SH, 4) + p("M54 -54 L59 -54 L59 -48 L54 -48 Z", STEEL, 3)
      + p("M50 6 L75 6 L75 13 L50 13 Z", GOLD, 4) + p("M50 46 L75 46 L75 53 L50 53 Z", GOLD, 4)
      + p("M52 84 L72 84 L71 102 L76 112 L82 140 Q62 148 42 140 L50 112 L54 102 Z", WOOD) + ln("M60 108 L56 136", WOOD_DK, 2)
      + p("M40 82 L51 80 L52 92 L42 94 Z", STEEL_SH, 3.5) + p("M38 70 L46 66 L50 74 L44 80 Z", STEEL, 3)
      + ln("M72 92 Q82 100 72 108", INK, 4)
      + p("M42 138 Q62 146 82 138 L82 144 Q62 154 42 144 Z", GOLD, 3.5), -40, .7),
    // 手槍（火槍類裡長得不一樣的，item.art:"pistol"）：短槍管、彎握把
    pistol: rot(RAW.pistol =
      p("M53 18 L67 18 L67 66 L53 66 Z", WOOD)
      + p("M56 -8 L64 -8 L64 66 L56 66 Z", STEEL) + ln("M58 -2 L58 60", STEEL_HI, 2)
      + p("M54 -12 L66 -12 L66 -4 L54 -4 Z", STEEL_SH, 4)
      + p("M52 60 L68 60 L75 92 Q79 112 64 117 L56 117 Q45 107 50 90 Z", WOOD) + ln("M58 74 L62 104", WOOD_DK, 2)
      + c(61, 115, 6, GOLD, 3.5)
      + p("M64 50 L75 42 L78 48 L69 59 Z", STEEL, 3.5)
      + ln("M56 70 Q44 79 54 89", INK, 4), -40, .9),
    // 投擲類：標槍
    thrown: rot(RAW.thrown =
      haft(10,146,6) + p("M60 -38 Q76 -8 66 18 L54 18 Q44 -8 60 -38 Z", STEEL) + ln("M60 -26 L60 12", STEEL_SH, 2.5)
      + p("M55 60 L65 60 L65 84 L55 84 Z", LEATHER, 3.5) + p("M60 132 L48 150 L60 144 L72 150 Z", "#e0766e", 3.5), -45),
    // 徒手：纏著布的拳頭
    unarmed: RAW.unarmed = `<g>
      ${p("M30 58 Q30 30 44 30 L86 30 Q96 30 96 42 L96 84 Q96 104 72 104 L48 104 Q30 104 30 86 Z", "#f1d3ae")}
      ${ln("M42 30 L42 56 M56 30 L56 56 M70 30 L70 56 M84 32 L84 56", INK, 3.5)}
      ${p("M30 58 Q30 48 44 48 L70 48 Q78 48 78 58 Q78 68 66 68 L40 68 Q30 68 30 58 Z", "#e6c19a", 4)}
      ${p("M34 86 L94 86 L94 100 Q88 106 72 106 L48 106 Q36 106 34 100 Z", "#f6e9d8", 4)}
      ${ln("M40 92 L90 92 M40 99 L88 99", "#cbbd9e", 2.5)}
    </g>`,
    // 背包：皮革旅行背包（裝在角色背後）
    backpack: RAW.backpack = `<g>
      ${p("M26 34 Q26 18 42 18 L78 18 Q94 18 94 34 L100 102 Q100 114 88 114 L32 114 Q20 114 20 102 Z", LEATHER)}
      ${p("M30 46 L90 46 L94 98 Q94 106 84 106 L36 106 Q26 106 26 98 Z", "#8b6243", 4)}
      ${p("M38 16 Q40 4 60 4 Q80 4 82 16 L74 20 Q72 12 60 12 Q48 12 46 20 Z", WOOD_DK, 4)}
      ${p("M36 70 L84 70 L82 96 L38 96 Z", "#6f4b35", 4)}
      ${ln("M30 52 L90 52 M44 70 L44 96 M76 70 L76 96", "#d1a66f", 3)}
      ${p("M55 48 L65 48 L65 58 L55 58 Z", GOLD, 3)}
    </g>`,
    // 盾牌：一層輪廓＋大十字，縮小後仍清楚
    shield: RAW.shield = p("M60 7L104 22Q103 82 60 114Q17 82 16 22Z", "#426e9e")
      + ln("M60 20V98M30 48H90", GOLD, 8) + c(60,48,10,GOLD,4),
    // 法杖：菱形水晶，與圓形法球分開辨識；握點不變
    arcane_staff: rot(RAW.arcane_staff =
      haft(27,148,6) + p("M60 -18L79 6L60 30L41 6Z", "#8fd0f0")
      + p("M60 -18L60 30L41 6Z", "#63a8cb", 2.5)
      + p("M46 26L74 26L70 37L50 37Z", GOLD,4), -30),
    // 治癒法書
    healing_book: `<g transform="rotate(-8 60 60)">${RAW.healing_book = `
      ${p("M20 20 L92 14 Q100 14 100 22 L104 100 Q104 108 96 108 L28 112 Q20 112 20 104 Z", "#6f9960")}
      ${p("M92 14 Q100 14 100 22 L104 100 L98 104 L94 22 Z", "#f1e2c6", 3)}
      ${ln("M30 24 L30 104", "#4f7a3a", 4)}
      ${p("M54 42 L68 42 L68 54 L80 54 L80 68 L68 68 L68 80 L54 80 L54 68 L42 68 L42 54 L54 54 Z", GOLD, 4)}

    `}</g>`,
    // 火焰法球
    flame_orb: RAW.flame_orb = `<g>

      ${c(60,50,34,"#f2b441")}
      ${p("M60 22 Q80 40 70 62 Q64 50 58 64 Q42 46 60 22 Z", "#e0584a", 4)}
      ${p("M60 40 Q68 50 62 60 Q58 54 55 60 Q52 50 60 40 Z", "#ffd98a", 3)}

      ${p("M32 86 L88 86 L80 110 L40 110 Z", GOLD)}${ln("M40 98 L80 98", WOOD_DK, 3)}
    </g>`,
    // 薩滿圖騰：彎彎的木杖、頂上一顆小骷髏、掛著三色羽毛（跟哥布林薩滿的頭飾同色）
    shaman_totem: rot(RAW.shaman_totem =
      p("M55 30 Q50 70 56 110 L54 148 L66 148 L68 110 Q62 70 65 30 Z", WOOD) + ln("M59 40 Q55 80 60 140", WOOD_DK, 2.5)
      + p("M42 12 Q42 -10 60 -10 Q78 -10 78 12 Q78 24 70 28 L70 34 L50 34 L50 28 Q42 24 42 12 Z", "#f1e8d4", 4)
      + c(52,10,5.5,INK,0) + c(68,10,5.5,INK,0)
      + ln("M50 36 Q40 44 38 58 M70 36 Q80 44 82 56", "#6b4a35", 2.5)
      + `<ellipse cx="36" cy="66" rx="5" ry="12" fill="#e0766e" stroke="${INK}" stroke-width="3" transform="rotate(12 36 66)"/>`
      + `<ellipse cx="84" cy="64" rx="5" ry="12" fill="#5fa8a0" stroke="${INK}" stroke-width="3" transform="rotate(-12 84 64)"/>`
      + `<ellipse cx="60" cy="48" rx="4.5" ry="10" fill="#f2b441" stroke="${INK}" stroke-width="3"/>`, -30)
  };
  return {ART, RAW};
})();
// 狩獵者特性（狩印）沒有自己的裝備圖，借弓的圖示（10-03）
ITEM_ART.hunter = ITEM_ART.bow;

// 裝備外觀與技能類別分開；魔法物品沿用base，撿起仍為同一畫法。
function equipmentArtKey(it){
  if(!it)return null;
  return it.art || ({"短棒":"club","彎刀":"scimitar"})[it.base||it.n] || groupOf(it)?.id;
}

// 火藥桶原創手繪外觀暫定 GPT；地面與背包共用。
ITEM_ART.powder_barrel=`<g stroke="#292330" stroke-width="5" stroke-linejoin="round"><path d="M28 25 Q14 62 28 101 Q60 119 92 101 Q106 62 92 25Z" fill="#9d7046"/><path d="M42 29 Q32 65 43 106 M60 29 V111 M78 29 Q88 65 77 106" fill="none" stroke-width="3"/><path d="M24 41 Q60 56 96 41 L98 51 Q60 68 22 51Z M22 82 Q60 97 98 82 L95 94 Q60 109 25 94Z" fill="#777b82"/><ellipse cx="60" cy="25" rx="32" ry="12" fill="#c49a62"/><path d="M34 24 H87 M48 16 L45 34 M74 16 L77 34" fill="none" stroke-width="3"/><path d="M60 58 l-13 19 h12 l-5 14 19-22 H62 l5-11Z" fill="#efc25b" stroke-width="3"/></g>`;

/* 劇情／探索共用寶箱：參照大爺的圓頂木箱、金屬箍、鎖孔與側環。
   稀有度色票／亮點為 GPT 暫定；僅外觀，不改獎勵、機率或互動規則。 */
const CHEST_PALETTES={
 common:{name:'普通',metal:'#959b9b',shade:'#676f72',light:'#cbd0cc',sparkles:0},
 uncommon:{name:'少見',metal:'#64ab73',shade:'#386947',light:'#b2e2ae',sparkles:0},
 rare:{name:'稀有',metal:'#5c9cce',shade:'#365f86',light:'#a8dcf5',sparkles:1},
 epic:{name:'史詩',metal:'#a779c7',shade:'#694884',light:'#e1baf4',sparkles:2},
 legendary:{name:'傳說',metal:'#e6b94e',shade:'#9d712e',light:'#fff0a7',sparkles:3}
};
function chestSVG(o={},cx=0,cy=0){
 const rarity=Object.hasOwn(CHEST_PALETTES,o.rarity)?o.rarity:'common',p=CHEST_PALETTES[rarity];
 // 金屬箍只畫可見的前半弧，後半在圓頂背面，不伸出箱蓋。
 const band=(x,y)=>`M${x} ${y} C${x-3.939} ${y-21.010} ${x+6.347} ${y-39.865} ${x+18.123} ${y-39.865} L${x+28.123} ${y-37.365} C${x+16.347} ${y-37.365} ${x+6.061} ${y-18.510} ${x+10} ${y+2.5}Z`;
 const glints=[[-47,-62],[52,-49],[6,-78]].slice(0,p.sparkles).map(([x,y])=>`<path class="chest-sparkle" d="M${x} ${y-5} L${x+2} ${y-2} L${x+5} ${y} L${x+2} ${y+2} L${x} ${y+5} L${x-2} ${y+2} L${x-5} ${y} L${x-2} ${y-2}Z" fill="${p.light}" stroke-width="1.5"/>`).join('');
 return `<g class="explore-chest" data-chest-rarity="${rarity}" transform="translate(${cx} ${cy})" stroke="#30281f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
 <title>${p.name}寶箱${o.opened?'（已打開）':''}</title>
 <path class="chest-wood" d="M-54 -19 L18 -1 L54 -23 V11 L18 34 L-54 16Z" fill="#a37a43"/>
 <path class="chest-wood" d="M18 -1 L54 -23 V11 L18 34Z" fill="#78542f"/>
 <path class="chest-wood" d="M-53 -7 L17 10 M-53 5 L17 22 M30 -5 V25 M42 -13 V18" fill="none" stroke="#76522e" stroke-width="2"/>
 <path d="M-54 -19 L-18 -41 L54 -23 L18 -1Z" fill="${o.opened?'#30281f':'#b99051'}"/>
 <path class="chest-metal" d="M-45 -17 L-35 -14 V20 L-45 18Z M2 -5 L12 -2 V32 L2 30Z" fill="${p.metal}"/>
 <path class="chest-metal" d="M18 -1 L54 -23 V-15 L18 7Z M18 25 L54 2 V11 L18 34Z" fill="${p.shade}"/>
 <g class="chest-lid" transform="${o.opened?'translate(-7 -36) rotate(-15)':''}">
 <path class="chest-wood" d="M-54 -19 C-57.939, -40.010 -47.653, -58.865 -35.877, -58.865 L36.123, -40.865 C42.282, -40.865 48.849, -35.707 54 -23 L18 -1Z" fill="#c09a59"/>
 <path class="chest-wood" d="M18 -1 C12 -33 39 -60 54 -23Z" fill="#94703c"/>
 <path class="chest-wood" d="M-50 -30 L15 -14 M-44 -45 L13 -31 M-35 -55 L27 -40" fill="none" stroke="#896333" stroke-width="2"/>
 <path class="chest-metal" d="${band(-43,-16.25)} ${band(3,-4.75)}" fill="${p.metal}"/>
 <path class="chest-metal" d="M-54 -19 L18 -1 V7 L-54 -11Z" fill="${p.metal}"/>
 <path class="chest-metal" d="M18 -1 L54 -23 V-15 L18 7Z" fill="${p.shade}"/>
 <path d="M-40 -28 C-40 -39 -34 -50 -26 -53 M7 -15 C7 -26 13 -37 21 -40" fill="none" stroke="${p.light}" stroke-width="2"/>
 </g>
 <path class="chest-metal chest-lock" d="M-26 -16 L-9 -12 V8 L-26 4Z" fill="${p.metal}"/>
 <path d="M-20 -7 a3 3 0 1 1 5 1 l1 6 -6 -1Z" fill="#30281f" stroke="none"/>
 <path d="M39 -5 q-9 1 -9 9 q0 9 7 5 q8 -4 6 -11" fill="none" stroke="${p.light}" stroke-width="3"/>
 <g fill="${p.light}" stroke="none"><circle cx="-41" cy="-9" r="1.6"/><circle cx="-41" cy="11" r="1.6"/><circle cx="7" cy="3" r="1.6"/><circle cx="7" cy="25" r="1.6"/></g>
 ${glints}</g>`;
}
