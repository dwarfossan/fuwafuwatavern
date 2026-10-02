/* 基礎裝備圖示（14 種＋10-03 火槍、手槍）（手繪風：黑框、平塗、一點亮面）
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
  const grip = (y1,y2,w=6) => p(`M${60-w} ${y1} L${60+w} ${y1} L${60+w} ${y2} L${60-w} ${y2} Z`, LEATHER) + ln(`M${60-w} ${y1+8} L${60+w} ${y1+12} M${60-w} ${y1+18} L${60+w} ${y1+22}`, "#4a3020", 2.5);
  const haft = (y1,y2,w=7) => p(`M${60-w} ${y1} L${60+w} ${y1} L${60+w} ${y2} L${60-w} ${y2} Z`, WOOD) + ln(`M${60-w+3} ${y1+6} L${60-w+3} ${y2-6}`, WOOD_DK, 2);
  const ART = {
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
    // 火槍類（10-03）：長槍管、木槍托、燧發機、扳機護圈；槍口朝上畫，跟弩一樣轉斜
    firearm: rot(RAW.firearm =
      p("M52 12 L68 12 L68 84 L74 106 L80 138 Q60 146 40 138 L46 106 L52 84 Z", WOOD) + ln("M56 20 L56 80", WOOD_DK, 2)
      + p("M57 -38 L63 -38 L63 86 L57 86 Z", STEEL) + ln("M59 -32 L59 78", STEEL_HI, 2)
      + p("M54 -42 L66 -42 L66 -34 L54 -34 Z", STEEL_SH, 4) + p("M58 -48 L62 -48 L62 -42 L58 -42 Z", STEEL, 3)
      + p("M52 4 L68 4 L68 11 L52 11 Z", GOLD, 4) + p("M52 44 L68 44 L68 51 L52 51 Z", GOLD, 4)
      + p("M67 70 L82 67 L82 82 L67 85 Z", STEEL_SH, 4) + p("M77 60 L86 53 L89 59 L82 69 Z", STEEL, 3.5)
      + ln("M60 90 Q48 99 57 108", INK, 4)
      + p("M40 136 Q60 145 80 136 L80 142 Q60 152 40 142 Z", GOLD, 3.5), -40, .72),
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
    // 盾牌：鳶形盾
    shield: RAW.shield = `<g>
      ${p("M60 6 L104 20 Q104 80 60 114 Q16 80 16 20 Z", "#40669a")}
      ${p("M60 18 L92 28 Q92 74 60 100 Q28 74 28 28 Z", "#5a82b6", 3)}
      ${ln("M60 20 L60 100 M30 50 L90 50", GOLD, 7)}${c(60,50,10,GOLD,4)}
      ${ln("M26 26 Q24 50 34 70", "#8fb2d8", 3)}
    </g>`,
    // 奧術法杖：木杖 + 水晶
    arcane_staff: rot(RAW.arcane_staff =
      p("M56 26 L64 26 L68 148 L52 148 Z", WOOD) + ln("M58 36 L58 140", WOOD_DK, 2.5)
      + p("M44 28 Q60 12 76 28 L70 36 L50 36 Z", GOLD, 4)
      + `<circle cx="60" cy="8" r="26" fill="#8fd0f0" opacity=".25"/>` + c(60,8,16,"#8fd0f0") + `<circle cx="54" cy="2" r="5" fill="#fff" opacity=".85"/>`, -30),
    // 治癒法書
    healing_book: `<g transform="rotate(-8 60 60)">${RAW.healing_book = `
      ${p("M20 20 L92 14 Q100 14 100 22 L104 100 Q104 108 96 108 L28 112 Q20 112 20 104 Z", "#6f9960")}
      ${p("M92 14 Q100 14 100 22 L104 100 L98 104 L94 22 Z", "#f1e2c6", 3)}
      ${ln("M30 24 L30 104", "#4f7a3a", 4)}
      ${p("M54 42 L68 42 L68 54 L80 54 L80 68 L68 68 L68 80 L54 80 L54 68 L42 68 L42 54 L54 54 Z", GOLD, 4)}
      ${ln("M26 16 L26 110", GOLD, 3)}
    `}</g>`,
    // 火焰法球
    flame_orb: RAW.flame_orb = `<g>
      <circle cx="60" cy="50" r="46" fill="#f2b441" opacity=".2"/>
      ${c(60,50,34,"#f2b441")}
      ${p("M60 22 Q80 40 70 62 Q64 50 58 64 Q42 46 60 22 Z", "#e0584a", 4)}
      ${p("M60 40 Q68 50 62 60 Q58 54 55 60 Q52 50 60 40 Z", "#ffd98a", 3)}
      <circle cx="46" cy="36" r="7" fill="#fff" opacity=".7"/>
      ${p("M32 86 L88 86 L80 110 L40 110 Z", GOLD)}${ln("M40 98 L80 98", WOOD_DK, 3)}
    </g>`,
    // 薩滿圖騰：彎彎的木杖、頂上一顆小骷髏、掛著三色羽毛（跟哥布林薩滿的頭飾同色）
    shaman_totem: rot(RAW.shaman_totem =
      p("M55 30 Q50 70 56 110 L54 148 L66 148 L68 110 Q62 70 65 30 Z", WOOD) + ln("M59 40 Q55 80 60 140", WOOD_DK, 2.5)
      + p("M42 12 Q42 -10 60 -10 Q78 -10 78 12 Q78 24 70 28 L70 34 L50 34 L50 28 Q42 24 42 12 Z", "#f1e8d4", 4)
      + c(52,10,5.5,INK,0) + c(68,10,5.5,INK,0) + ln("M55 26 L55 32 M60 26 L60 32 M65 26 L65 32", INK, 2)
      + ln("M50 36 Q40 44 38 58 M70 36 Q80 44 82 56", "#6b4a35", 2.5)
      + `<ellipse cx="36" cy="66" rx="5" ry="12" fill="#e0766e" stroke="${INK}" stroke-width="3" transform="rotate(12 36 66)"/>`
      + `<ellipse cx="84" cy="64" rx="5" ry="12" fill="#5fa8a0" stroke="${INK}" stroke-width="3" transform="rotate(-12 84 64)"/>`
      + `<ellipse cx="60" cy="48" rx="4.5" ry="10" fill="#f2b441" stroke="${INK}" stroke-width="3"/>`, -30)
  };
  return {ART, RAW};
})();
// 狩獵者特性（狩印）沒有自己的裝備圖，借弓的圖示（10-03）
ITEM_ART.hunter = ITEM_ART.bow;
