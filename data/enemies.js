/* 敵人資料（本作原創數值，量級參考 SRD 5.2 的哥布林）
   跟我方同一套規則：攻擊、招式全部照手上的裝備算（命中 = 屬性 + 2，靈巧武器取力量敏捷高的）
   look：紙娃娃外觀（js/art/monsters.js 的 MONSTER_LOOK）
   gear：拿什麼、穿什麼（物品名稱，武器／法器／盾牌／身體裝備；身體裝備只是穿著，AC 還是照 ac）；戰場資料的 foes 可以用 gear 換掉
   hp、ac、speed：屬性表數字（AC 直接寫，不照護甲算）
   scores：完整六項屬性值，調整值由共用 modOf 算出；passives：被動技能代號清單（選填）
   resistances、damageImmunities：原始傷害類型的陣列，選填；foes 同名欄位可覆寫。現有敵人未新增抗性。
   special：天生技能代號，例如 nimble＝靈巧脫逃（SRD 5.2 哥布林的種族特性：花免費動作撤離或躲藏） */
/* NPC：站在戰場上、不屬於任何一方（不能被當成目標、不參與先攻、不行動）。行為之後跟劇情一起定
   數值先用 SRD 5.2 的平民（Commoner）：AC 10、生命 4、屬性全 +0 */
const NPCS = {
  merchant: {name:"商人", look:"merchant", hp:4, ac:10, speed:6, scores:{STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10}}
};

const ENEMIES = {
  // 寶箱怪測試配置 GPT 暫定，原創數值；只沿用徒手與通用動作「推倒」（10-10 大爺：撞倒刪了，改用推撞），不借新版怪物能力。
  world_mimic:{detectRange:6,name:"寶箱怪",look:"mimic",gear:[],hp:7,ac:12,speed:6,xp:0,
    scores:{STR:12,DEX:10,CON:12,INT:6,WIS:10,CHA:6}},
  // xp：打倒給的經驗，照 SRD 5.2 挑戰等級（哥布林 1/4＝50）；薩滿血量同哥布林，先同樣 50（暫定，大爺 10-04）
  goblin: {
    detectRange:5, name:"哥布林", look:"goblin", shieldArt:"round_shield", gear:["短劍","破布衣"],
    hp:7, ac:12, speed:6, xp:50,
    special:"nimble",
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:8, CHA:8}
  },
  goblin_archer: {
    detectRange:7, name:"哥布林弓手", look:"goblin", shieldArt:"round_shield", gear:["短弓","箭袋","破布衣"],
    hp:7, ac:12, speed:6, xp:50,
    special:"nimble",
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:8, CHA:8}
  },
  // 哥布林薩滿：躲在草叢裡施法（火焰箭、治癒真言、災禍術都來自薩滿圖騰；圖騰被打掉就不能施法）
  // 行動方式見 js/battle/flow.js 的 aiShaman
  goblin_shaman: {
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
  bat:{detectRange:6,name:"蝙蝠",look:"bat",gear:[],hp:5,ac:12,speed:8,xp:25,stars:1,
    natural:{name:"咬",dmg:"1d4 穿刺",stat:"DEX"},special:"bat_drain",
    scores:{STR:6,DEX:15,CON:10,INT:2,WIS:12,CHA:4}},
  slime:{detectRange:4,name:"史萊姆",look:"slime",gear:[],hp:16,ac:8,speed:4,xp:50,stars:1,
    natural:{name:"偽足",dmg:"1d6 鈍擊",stat:"STR"},special:"slime_spit",damageImmunities:["強酸"],
    scores:{STR:12,DEX:6,CON:14,INT:1,WIS:6,CHA:2}},
  skeleton:{detectRange:6,name:"骷髏兵",look:"skeleton",gear:["長劍","盾牌"],hp:13,ac:13,speed:6,xp:50,stars:1,
    special:"loose_bones",resistances:["穿刺"],
    scores:{STR:12,DEX:12,CON:14,INT:6,WIS:8,CHA:5}},
  skeleton_archer:{detectRange:8,name:"骷髏弓手",look:"skeleton",gear:["短弓","箭袋"],hp:13,ac:13,speed:6,xp:50,stars:1,
    special:"loose_bones",resistances:["穿刺"],
    scores:{STR:10,DEX:14,CON:14,INT:6,WIS:8,CHA:5}},
  zombie:{detectRange:4,name:"殭屍",look:"zombie",gear:[],hp:20,ac:8,speed:4,xp:50,stars:1,
    natural:{name:"捶打",dmg:"1d6 鈍擊",stat:"STR"},special:"undead_fortitude",
    scores:{STR:13,DEX:6,CON:16,INT:3,WIS:6,CHA:5}},
  bandit:{detectRange:6,name:"盜賊",look:"human_male",gear:["彎刀","皮甲"],hp:11,ac:12,speed:6,xp:25,stars:1,
    special:"bandit_sand",
    scores:{STR:11,DEX:12,CON:12,INT:10,WIS:10,CHA:10}},
  bandit_archer:{detectRange:8,name:"盜賊弓手",look:"human_female",gear:["短弓","箭袋","皮甲"],hp:11,ac:12,speed:6,xp:25,stars:1,
    special:"bandit_sand",
    scores:{STR:10,DEX:13,CON:12,INT:10,WIS:10,CHA:10}},
  orc:{detectRange:6,name:"獸人",look:"orc",gear:["巨斧"],hp:15,ac:13,speed:6,xp:100,stars:2,
    special:"orc_charge",
    scores:{STR:16,DEX:12,CON:16,INT:7,WIS:11,CHA:10}},
  ghost:{detectRange:6,name:"幽靈",look:"ghost",gear:[],hp:18,ac:11,speed:6,xp:200,stars:2,
    natural:{name:"枯萎之觸",dmg:"1d8 死靈",stat:"DEX"},special:"ghost_wail",resistances:["揮砍","穿刺","鈍擊"],
    scores:{STR:7,DEX:13,CON:10,INT:10,WIS:12,CHA:15}},
  giant_spider:{detectRange:7,name:"巨蛛",look:"giant_spider",gear:[],hp:20,ac:13,speed:6,xp:200,stars:2,
    natural:{name:"咬",dmg:"1d8 穿刺",stat:"DEX"},special:"spider_web",
    scores:{STR:14,DEX:16,CON:12,INT:2,WIS:11,CHA:4}},
  griffin:{detectRange:8,name:"獅鷲",look:"griffin",gear:[],hp:26,ac:12,speed:8,xp:450,stars:2,
    natural:{name:"利爪",dmg:"1d8 揮砍",stat:"STR"},special:"griffin_dive",
    scores:{STR:16,DEX:14,CON:14,INT:2,WIS:13,CHA:8}},
  owlbear:{detectRange:6,name:"梟熊",look:"owlbear",gear:[],hp:32,ac:12,speed:6,xp:700,stars:3,
    natural:{name:"利爪",dmg:"1d8 揮砍",stat:"STR"},special:"owlbear_hug",
    scores:{STR:18,DEX:12,CON:16,INT:3,WIS:12,CHA:7}},
  chimera:{detectRange:7,name:"奇美拉",look:"chimera",gear:[],hp:42,ac:13,speed:6,xp:1100,stars:3,
    natural:{name:"咬",dmg:"1d10 穿刺",stat:"STR"},special:"chimera_breath",
    scores:{STR:18,DEX:11,CON:16,INT:3,WIS:12,CHA:10}},
  vampire:{detectRange:7,name:"吸血鬼",look:"vampire",gear:["吸血鬼禮服"],hp:36,ac:14,speed:6,xp:1100,stars:3,
    natural:{name:"利爪",dmg:"1d6 揮砍",stat:"DEX"},special:"vampire_bite",
    scores:{STR:14,DEX:16,CON:16,INT:12,WIS:12,CHA:16}},
  lich:{detectRange:8,name:"巫妖",look:"lich",gear:["火焰法球","巫妖法袍"],hp:38,ac:13,speed:6,xp:1800,stars:3,
    special:"lich_whisper",
    scores:{STR:8,DEX:14,CON:14,INT:18,WIS:14,CHA:16}},
  death_knight:{detectRange:7,name:"死亡騎士",look:"death_knight",gear:[],hp:45,ac:17,speed:8,xp:1800,stars:3,
    natural:{name:"騎士劍",dmg:"1d10 揮砍",stat:"STR"},special:"dk_hellstrike",
    scores:{STR:18,DEX:10,CON:16,INT:10,WIS:12,CHA:14}}
};
// 隨機測試場（#battle）照舊只出原本這幾種，新怪物只在委託出現（不讓 #battle 的種子配置跑掉）
const RANDOM_TEST_FOES = ["world_mimic","goblin","goblin_archer","goblin_shaman"];
