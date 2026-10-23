/* 敵人資料（本作原創數值，量級參考 SRD 5.2 的哥布林）
   跟我方同一套規則：攻擊、招式全部照手上的裝備算（命中 = 屬性 + 2，靈巧武器取力量敏捷高的）
   look：紙娃娃外觀（js/art/monsters.js 的 MONSTER_LOOK）
   gear：拿什麼、穿什麼（物品名稱，武器／法器／盾牌／身體裝備；身體裝備只是穿著，AC 還是照 ac）；戰場資料的 foes 可以用 gear 換掉
   hp、ac、speed：屬性表數字（AC 直接寫，不照護甲算）
   spells：會的法術（技能 id，例 burning_hands＝燃燒之手；要拿著那個法器，10-21）
   scores：完整六項屬性值，調整值由共用 modOf 算出；passives：被動技能代號清單（選填）
   resistances、damageImmunities：原始傷害類型的陣列，選填；foes 同名欄位可覆寫。現有敵人未新增抗性。
   size：體型（微型／小型／中型／大型／巨型／超巨型），沒寫＝中型；只用在擒抱、推開、推倒「最多大一級」（SRD 5.2，10-20），佔格一律 1 格
   special：天生技能代號，例如 nimble＝靈巧脫逃（SRD 5.2 哥布林的種族特性：花免費動作撤離或躲藏） */
/* NPC：站在戰場上、不屬於任何一方（不能被當成目標、不參與先攻、不行動）。行為之後跟劇情一起定
   數值先用 SRD 5.2 的平民（Commoner）：AC 10、生命 4、屬性全 +0 */
const NPCS = {
  merchant: {name:"商人", look:"merchant", hp:4, ac:10, speed:6, scores:{STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10}},
  owlbear_cub: {name:"梟熊寶寶", look:"owlbear_cub", hp:5, ac:12, speed:8, scores:{STR:13, DEX:14, CON:12, INT:3, WIS:12, CHA:7}},   // 被獵人網住（梟熊寶寶劇情第二段，10-21）
  // 矮人大爺（大爺 10-22：放進遊戲當備用，數值以後再想；先跟其他 NPC 一樣用平民的數字）。還沒有放進任何戰場
  dwarf: {name:"矮人大爺", look:"dwarf", hp:4, ac:10, speed:6, scores:{STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10}},
  // 鎧甲版是大型（2×2）；NPC 目前一律佔 1 格，要放上戰場時再把佔格接上
  dwarf_armored: {name:"矮人大爺（鎧甲）", look:"dwarf_armored", size:"大型", hp:4, ac:10, speed:6, scores:{STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10}},
  // 失蹤的雞（10-23）：揭穿之後站我們這邊的雞群（不行動，每輪開始一起啄惡魔，js/chicken.js chickenRound）
  hen_white: {name:"白雞", look:"hen_white", hp:15, ac:13, speed:6, scores:{STR:16, DEX:12, CON:16, INT:3, WIS:11, CHA:6}},
  hen_brown: {name:"棕雞", look:"hen_brown", hp:15, ac:13, speed:6, scores:{STR:16, DEX:12, CON:16, INT:3, WIS:11, CHA:6}},
  rooster: {name:"公雞", look:"rooster", hp:15, ac:13, speed:6, scores:{STR:16, DEX:12, CON:16, INT:3, WIS:11, CHA:8}}
};

const ENEMIES = {
  // 寶箱怪測試配置 GPT 暫定，原創數值；只沿用徒手與通用動作「推倒」（10-10 大爺：撞倒刪了，改用推撞），不借新版怪物能力。
  world_mimic:{size:"中型",detectRange:6,name:"寶箱怪",look:"mimic",gear:[],hp:7,ac:12,speed:6,xp:0,
    scores:{STR:12,DEX:10,CON:12,INT:6,WIS:10,CHA:6}},
  // xp：打倒給的經驗，照 SRD 5.2 挑戰等級（哥布林 1/4＝50）；薩滿血量同哥布林，先同樣 50（暫定，大爺 10-04）
  goblin: {size:"小型",
    detectRange:5, name:"哥布林", look:"goblin", shieldArt:"round_shield", gear:["短劍","破布衣"],
    hp:7, ac:12, speed:6, xp:50,
    special:"nimble",
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:8, CHA:8}
  },
  goblin_archer: {size:"小型",
    detectRange:7, name:"哥布林弓手", look:"goblin", shieldArt:"round_shield", gear:["短弓","箭袋","破布衣"],
    hp:7, ac:12, speed:6, xp:50,
    special:"nimble",
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:8, CHA:8}
  },
  // 哥布林薩滿：躲在草叢裡施法（火焰箭、治癒真言、災禍術都來自薩滿圖騰；圖騰被打掉就不能施法）
  // 行動方式見 js/battle/flow.js 的 aiShaman
  goblin_shaman: {size:"小型",
    detectRange:6, name:"哥布林薩滿", look:"goblin_shaman", shieldArt:"round_shield", gear:["薩滿圖騰","+1 薩滿袍"],
    hp:7, ac:12, speed:6, xp:50,
    special:"nimble",
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:14, CHA:10}
  },

  /* ===== 10-10 委託用怪物（大爺 10-10：面板＋一個技能，香香定、全部暫定） =====
     本作原創數值（量級參考 SRD 5.1／5.2 的挑戰等級，配合 1～3 級的四小隻調低）；不照抄 SRD 怪物能力
     natural：天生攻擊（沒拿武器時用這個，不會被繳械、不會掉落）{name, dmg:"骰 傷害種類", stat:命中與傷害用的屬性}
     special：天生技能代號（data/skills.js 的「天生技能」組，js/battle/monster.js 實作）；小傢伙們學不走
     stars：委託星等（data/quests.js 用） */
  bat:{size:"微型",detectRange:6,name:"蝙蝠",look:"bat",gear:[],hp:5,ac:12,speed:8,xp:25,stars:1,
    natural:{name:"咬",dmg:"1d4 穿刺",stat:"DEX"},special:"bat_drain",
    scores:{STR:6,DEX:15,CON:10,INT:2,WIS:12,CHA:4}},
  slime:{size:"中型",detectRange:4,name:"史萊姆",look:"slime",gear:[],hp:16,ac:8,speed:4,xp:50,stars:1,
    natural:{name:"偽足",dmg:"1d6 鈍擊",stat:"STR"},special:"slime_spit",damageImmunities:["強酸"],
    scores:{STR:12,DEX:6,CON:14,INT:1,WIS:6,CHA:2}},
  skeleton:{size:"中型",detectRange:6,name:"骷髏兵",look:"skeleton",gear:["長劍","盾牌"],hp:13,ac:13,speed:6,xp:50,stars:1,
    special:"loose_bones",resistances:["穿刺"],
    scores:{STR:12,DEX:12,CON:14,INT:6,WIS:8,CHA:5}},
  skeleton_archer:{size:"中型",detectRange:8,name:"骷髏弓手",look:"skeleton",gear:["短弓","箭袋"],hp:13,ac:13,speed:6,xp:50,stars:1,
    special:"loose_bones",resistances:["穿刺"],
    scores:{STR:10,DEX:14,CON:14,INT:6,WIS:8,CHA:5}},
  // 骷髏勇士（大爺 10-21）：只從記仇進化出來（骷髏兵／骷髏弓手 擲到 20），不放進一般委託；SRD 沒有這隻，數值照骷髏兵往上調（暫定：香香）
  //   披風（大爺 10-21）；會說話、記得生前的事（大爺 10-21：比較有喜感）
  skeleton_warrior:{size:"中型",detectRange:6,name:"骷髏勇士",look:"skeleton_warrior",gear:["長劍","盾牌"],hp:26,ac:15,speed:6,xp:200,
    special:"loose_bones",passives:["double_strike"],resistances:["穿刺"],
    scores:{STR:14,DEX:12,CON:15,INT:8,WIS:8,CHA:6}},
  zombie:{size:"中型",detectRange:4,name:"殭屍",look:"zombie",gear:[],hp:20,ac:8,speed:4,xp:50,stars:1,
    natural:{name:"捶打",dmg:"1d6 鈍擊",stat:"STR"},special:"undead_fortitude",
    scores:{STR:13,DEX:6,CON:16,INT:3,WIS:6,CHA:5}},
  bandit:{size:"中型",detectRange:6,name:"盜賊",look:"human_male",gear:["彎刀","皮甲"],hp:11,ac:12,speed:6,xp:25,stars:1,
    special:"bandit_sand",
    scores:{STR:11,DEX:12,CON:12,INT:10,WIS:10,CHA:10}},
  // 進化（大爺 10-21）：盜賊／盜賊弓手→盜賊頭目（SRD 強盜頭目）、殭屍→食屍鬼（SRD）；只從記仇進化出來，不進一般委託。多重攻擊用連擊代替（暫定：香香）
  bandit_captain:{size:"中型",detectRange:6,name:"盜賊頭目",look:"bandit_captain",gear:["彎刀","鑲釘皮甲"],hp:65,ac:15,speed:6,xp:450,
    special:"bandit_sand",passives:["double_strike"],
    scores:{STR:15,DEX:16,CON:14,INT:14,WIS:11,CHA:14}},
  ghoul:{size:"中型",detectRange:6,name:"食屍鬼",look:"ghoul",gear:[],hp:22,ac:12,speed:6,xp:200,
    natural:{name:"利爪",dmg:"2d4 揮砍",stat:"DEX"},special:"ghoul_claw",damageImmunities:["毒素"],
    scores:{STR:13,DEX:15,CON:10,INT:7,WIS:10,CHA:6}},
  // ===== 森林（大爺 10-21）：狼、野豬照 SRD；食人花 SRD 沒有，原創；哥布林巫師＝SRD 哥布林拿火焰法球；林間德魯伊照 SRD 德魯伊（數值暫定：香香） =====
  forest_wolf:{size:"中型",detectRange:7,name:"狼",look:"forest_wolf",gear:[],hp:11,ac:13,speed:8,xp:50,stars:1,srd:true,
    natural:{name:"咬",dmg:"2d4 穿刺",stat:"DEX"},special:"cub_pounce",passives:["pack_tactics"],
    scores:{STR:12,DEX:15,CON:12,INT:3,WIS:12,CHA:6}},
  boar:{size:"中型",detectRange:5,name:"野豬",look:"boar",gear:[],hp:11,ac:11,speed:8,xp:50,stars:1,srd:true,
    natural:{name:"獠牙",dmg:"1d6 揮砍",stat:"STR"},special:"orc_charge",
    scores:{STR:13,DEX:11,CON:12,INT:2,WIS:9,CHA:5}},
  mantrap:{size:"中型",detectRange:4,name:"食人花",look:"mantrap",gear:[],hp:18,ac:10,speed:0,xp:100,stars:1,
    natural:{name:"藤蔓",dmg:"1d6 鈍擊",stat:"STR"},special:"vine_snare",vulnerabilities:["火焰"],
    scores:{STR:14,DEX:8,CON:14,INT:1,WIS:10,CHA:2}},
  goblin_mage:{size:"小型",detectRange:6,name:"哥布林巫師",look:"goblin_mage",shieldArt:"round_shield",gear:["火焰法球","破布衣"],spells:["burning_hands","fire_shield"],hp:12,ac:12,speed:6,xp:100,
    special:"nimble",scores:{STR:8,DEX:14,CON:10,INT:10,WIS:8,CHA:14}},
  forest_druid:{size:"中型",detectRange:7,name:"林間德魯伊",look:"forest_druid",gear:["治癒法書","聖徽"],spells:["bless"],hp:27,ac:11,speed:6,xp:450,srd:true,
    scores:{STR:10,DEX:12,CON:13,INT:12,WIS:15,CHA:11}},
  // ===== 洞窟（大爺 10-21）：狗頭人照 SRD；狗頭人法師＝SRD 狗頭人拿奧術法杖（會魔法飛彈）；頭目紅龍幼龍照 SRD（飛行先不做；咬的火焰追加先不做）。數值暫定：香香 =====
  kobold:{size:"小型",detectRange:6,name:"狗頭人",look:"kobold",gear:["匕首","破布衣"],hp:5,ac:12,speed:6,xp:25,stars:1,srd:true,
    passives:["pack_tactics","sun_sensitive","darkvision"],scores:{STR:7,DEX:15,CON:9,INT:8,WIS:7,CHA:8}},
  kobold_mage:{size:"小型",detectRange:6,name:"狗頭人法師",look:"kobold_mage",gear:["奧術法杖","破布衣"],spells:["magic_missile"],hp:9,ac:12,speed:6,xp:100,
    passives:["sun_sensitive","darkvision"],scores:{STR:7,DEX:15,CON:10,INT:14,WIS:9,CHA:8}},
  red_wyrmling:{size:"中型",detectRange:8,name:"紅龍幼龍",look:"dragon",gear:[],hp:75,ac:17,speed:6,xp:1100,stars:3,srd:true,
    natural:{name:"咬",dmg:"1d10 穿刺",stat:"STR"},special:"wyrm_breath",damageImmunities:["火焰"],passives:["darkvision"],
    scores:{STR:19,DEX:10,CON:17,INT:12,WIS:11,CHA:15}},
  bandit_archer:{size:"中型",detectRange:8,name:"盜賊弓手",look:"human_female",gear:["短弓","箭袋","皮甲"],hp:11,ac:12,speed:6,xp:25,stars:1,
    special:"bandit_sand",
    scores:{STR:10,DEX:13,CON:12,INT:10,WIS:10,CHA:10}},
  orc:{size:"中型",detectRange:6,name:"獸人",look:"orc",gear:["巨斧"],hp:15,ac:13,speed:6,xp:100,stars:2,
    special:"orc_charge",
    scores:{STR:16,DEX:12,CON:16,INT:7,WIS:11,CHA:10}},
  ghost:{size:"中型",detectRange:6,name:"幽靈",look:"ghost",gear:[],hp:18,ac:11,speed:6,xp:200,stars:2,
    natural:{name:"枯萎之觸",dmg:"1d8 死靈",stat:"DEX"},special:"ghost_wail",resistances:["揮砍","穿刺","鈍擊"],
    scores:{STR:7,DEX:13,CON:10,INT:10,WIS:12,CHA:15}},
  giant_spider:{size:"大型",detectRange:7,name:"巨蛛",look:"giant_spider",gear:[],hp:20,ac:13,speed:6,xp:200,stars:2,
    natural:{name:"咬",dmg:"1d8 穿刺",stat:"DEX"},special:"spider_web",
    scores:{STR:14,DEX:16,CON:12,INT:2,WIS:11,CHA:4}},
  griffin:{size:"大型",detectRange:8,name:"獅鷲",look:"griffin",gear:[],hp:26,ac:12,speed:8,xp:450,stars:2,
    natural:{name:"利爪",dmg:"1d8 揮砍",stat:"STR"},special:"griffin_dive",
    scores:{STR:16,DEX:14,CON:14,INT:2,WIS:13,CHA:8}},
  // 梟熊寶寶（大爺 10-21）：數值照 SRD 5.1 的獒犬（Mastiff），體型先定小型；只在第一次梟熊委託的劇情出現（js/owlbear-story.js）
  owlbear_cub:{size:"小型",detectRange:6,name:"梟熊寶寶",look:"owlbear_cub",gear:[],hp:5,ac:12,speed:8,xp:25,stars:1,
    natural:{name:"啃咬",dmg:"1d6 穿刺",stat:"STR"},special:"cub_pounce",
    scores:{STR:13,DEX:14,CON:12,INT:3,WIS:12,CHA:7}},
  // 半大的梟熊（10-21，小傢伙們養大的那隻第二階段）：數值照 SRD 5.1 的黑熊（Black Bear），中型，小傢伙們騎得上
  owlbear_young:{size:"中型",detectRange:6,name:"半大梟熊",look:"owlbear_young",gear:[],hp:19,ac:11,speed:8,xp:100,stars:1,
    natural:{name:"利爪",dmg:"2d4 揮砍",stat:"STR"},
    scores:{STR:15,DEX:10,CON:14,INT:3,WIS:12,CHA:7}},
  // 進化（10-21，大爺：記仇的敵人擲到 20 就升一階）：外觀 10-09 就有（js/art/monsters.js），數值香香配、暫定
  //   哥布林英雄＝SRD 5.1 哥布林首領（Goblin Boss）；哥布林酋長往上加一點；獸人酋長照 SRD 獸人督軍（Orc War Chief）往下調，獸人英雄在中間
  goblin_hero:{size:"小型",detectRange:6,name:"哥布林英雄",look:"goblin_hero",shieldArt:"round_shield",gear:["彎刀","盾牌","鏈甲衫"],hp:21,ac:17,speed:6,xp:200,
    special:"nimble", scores:{STR:10,DEX:14,CON:10,INT:10,WIS:8,CHA:10}},
  goblin_chief:{size:"小型",detectRange:6,name:"哥布林酋長",look:"goblin_chief",shieldArt:"round_shield",gear:["彎刀","盾牌","鏈甲衫"],hp:30,ac:17,speed:6,xp:450,
    special:"nimble", scores:{STR:10,DEX:15,CON:12,INT:11,WIS:10,CHA:12}},
  // 失蹤的雞（10-23，js/chicken.js）：被標會壓力逼成獸人等級的雞（數值照獸人）、異界雞（惡魔變的，半血變回原形）、惡魔原形（打到 0 血不死、化成黑煙飛走）。數值香香配、暫定
  hen_white:{size:"小型",detectRange:6,name:"白雞",look:"hen_white",gear:[],hp:15,ac:13,speed:6,xp:100,stars:1,
    natural:{name:"啄",dmg:"1d10 穿刺",stat:"STR"},special:"chicken_attack", scores:{STR:16,DEX:12,CON:16,INT:3,WIS:11,CHA:6}},
  hen_brown:{size:"小型",detectRange:6,name:"棕雞",look:"hen_brown",gear:[],hp:15,ac:13,speed:6,xp:100,stars:1,
    natural:{name:"啄",dmg:"1d10 穿刺",stat:"STR"},special:"chicken_attack", scores:{STR:16,DEX:12,CON:16,INT:3,WIS:11,CHA:6}},
  rooster:{size:"小型",detectRange:6,name:"公雞",look:"rooster",gear:[],hp:15,ac:13,speed:6,xp:100,stars:1,
    natural:{name:"啄",dmg:"1d10 穿刺",stat:"STR"},special:"chicken_attack", scores:{STR:16,DEX:12,CON:16,INT:3,WIS:11,CHA:8}},
  demon_chicken:{size:"小型",detectRange:6,name:"異界雞",look:"demon_chicken",gear:[],hp:30,ac:13,speed:6,xp:200,stars:2,
    natural:{name:"啄",dmg:"1d8 穿刺",stat:"STR"},special:"chicken_attack", scores:{STR:14,DEX:14,CON:14,INT:16,WIS:12,CHA:18}},
  chicken_demon:{size:"中型",detectRange:8,name:"惡魔",look:"chicken_demon",gear:[],hp:45,ac:15,speed:6,xp:700,stars:3,
    natural:{name:"爪擊",dmg:"1d8 揮砍",stat:"DEX"},special:"demon_wiles",resistances:["火焰"], scores:{STR:12,DEX:16,CON:14,INT:16,WIS:13,CHA:20}},
  // 獨眼隊長（10-23，獨眼獸人強盜團支線 js/orc-gang.js）：數值香香配、暫定（獸人往上、獸人英雄往下）
  orc_captain:{size:"中型",detectRange:6,name:"獨眼隊長",look:"orc_captain",gear:["巨斧","鏈甲衫"],hp:30,ac:14,speed:6,xp:200,stars:2,
    special:"orc_charge", scores:{STR:16,DEX:12,CON:16,INT:10,WIS:11,CHA:12}},
  orc_hero:{size:"中型",detectRange:6,name:"獸人英雄",look:"orc_hero",gear:["巨斧","鏈甲衫"],hp:40,ac:14,speed:6,xp:450,stars:3,
    special:"orc_charge", scores:{STR:17,DEX:12,CON:16,INT:9,WIS:11,CHA:12}},
  orc_chief:{size:"中型",detectRange:6,name:"獸人酋長",look:"orc_chief",gear:["巨斧","鏈甲"],hp:60,ac:16,speed:6,xp:1100,stars:3,
    special:"orc_charge", scores:{STR:18,DEX:12,CON:18,INT:11,WIS:11,CHA:16}},
  // 獵人（10-21，梟熊寶寶劇情第二段）：數值照盜賊／盜賊弓手（暫定）
  hunter:{size:"中型",detectRange:6,name:"獵人",look:"human_male",gear:["彎刀","皮甲"],hp:11,ac:12,speed:6,xp:25,stars:1,
    scores:{STR:11,DEX:12,CON:12,INT:10,WIS:10,CHA:10}},
  hunter_archer:{size:"中型",detectRange:8,name:"獵人弓手",look:"human_female",gear:["短弓","箭袋","皮甲"],hp:11,ac:12,speed:6,xp:25,stars:1,
    scores:{STR:10,DEX:13,CON:12,INT:10,WIS:10,CHA:10}},
  owlbear:{size:"大型",detectRange:6,name:"梟熊",look:"owlbear",gear:[],hp:32,ac:12,speed:6,xp:700,stars:3,
    natural:{name:"利爪",dmg:"1d8 揮砍",stat:"STR"},special:"owlbear_hug",
    scores:{STR:18,DEX:12,CON:16,INT:3,WIS:12,CHA:7}},
  chimera:{size:"大型",detectRange:7,name:"奇美拉",look:"chimera",gear:[],hp:42,ac:13,speed:6,xp:1100,stars:3,
    natural:{name:"咬",dmg:"1d10 穿刺",stat:"STR"},special:"chimera_breath",
    scores:{STR:18,DEX:11,CON:16,INT:3,WIS:12,CHA:10}},
  vampire:{size:"中型",detectRange:7,name:"吸血鬼",look:"vampire",gear:["吸血鬼禮服"],hp:36,ac:14,speed:6,xp:1100,stars:3,
    natural:{name:"利爪",dmg:"1d6 揮砍",stat:"DEX"},special:"vampire_bite",
    scores:{STR:14,DEX:16,CON:16,INT:12,WIS:12,CHA:16}},
  lich:{size:"中型",detectRange:8,name:"巫妖",look:"lich",gear:["火焰法球","巫妖法袍"],hp:38,ac:13,speed:6,xp:1800,stars:3,
    special:"lich_whisper",
    scores:{STR:8,DEX:14,CON:14,INT:18,WIS:14,CHA:16}},
  // 死亡騎士騎著骷髏戰馬出場（騎乘，大爺 10-20）：騎士中型；騎著時用馬的速度、外觀是人馬一張圖，下馬換 lookOnFoot、speedOnFoot
  death_knight:{size:"中型",detectRange:7,name:"死亡騎士",look:"death_knight",lookOnFoot:"death_knight_foot",mount:"dk_horse",drops:[{n:"骷髏戰馬的韁繩",chance:.25}],gear:[],hp:45,ac:17,speed:6,speedOnFoot:6,xp:1800,stars:3,
    natural:{name:"騎士劍",dmg:"1d10 揮砍",stat:"STR"},special:"dk_hellstrike",
    scores:{STR:18,DEX:10,CON:16,INT:10,WIS:12,CHA:14}},
  // 骷髏戰馬：照 SRD 5.1 的 Warhorse Skeleton（大型不死、AC 13、HP 22、60 呎、蹄擊 2d6+力量、怕鈍擊、免疫毒素）
  dk_horse:{size:"大型",detectRange:7,name:"骷髏戰馬",look:"dk_horse",gear:[],hp:22,ac:13,speed:12,xp:100,
    natural:{name:"蹄擊",dmg:"2d6 鈍擊",stat:"STR"},damageImmunities:["毒素"],vulnerabilities:["鈍擊"],
    scores:{STR:18,DEX:12,CON:15,INT:2,WIS:8,CHA:5}}
};
// 隨機測試場（#battle）照舊只出原本這幾種，新怪物只在委託出現（不讓 #battle 的種子配置跑掉）
const RANDOM_TEST_FOES = ["world_mimic","goblin","goblin_archer","goblin_shaman"];
