/* 敵人資料（本作原創數值，量級參考 SRD 5.2 的哥布林）
   跟我方同一套規則：攻擊、招式全部照手上的裝備算（命中 = 屬性 + 2，靈巧武器取力量敏捷高的）
   look：紙娃娃外觀（js/art/monsters.js 的 MONSTER_LOOK）
   gear：拿什麼、穿什麼（物品名稱，武器／法器／盾牌／身體裝備；身體裝備只是穿著，AC 還是照 ac）；戰場資料的 foes 可以用 gear 換掉
   hp、ac、speed：屬性表數字（AC 直接寫，不照護甲算）
   scores：完整六項屬性值，調整值由共用 modOf 算出；passives：被動技能代號清單（選填）
   resistances、damageImmunities：原始傷害類型的陣列，選填；foes 同名欄位可覆寫。現有敵人未新增抗性。
   innate：天生能力（跟裝備無關）
     nimble＝靈巧脫逃（SRD 5.2 哥布林的種族特性）：花免費動作撤離或躲藏 */
/* NPC：站在戰場上、不屬於任何一方（不能被當成目標、不參與先攻、不行動）。行為之後跟劇情一起定
   數值先用 SRD 5.2 的平民（Commoner）：AC 10、生命 4、屬性全 +0 */
const NPCS = {
  merchant: {name:"商人", look:"merchant", hp:4, ac:10, speed:6, scores:{STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10}}
};

const ENEMIES = {
  // 寶箱怪測試配置 GPT 暫定，原創數值；只沿用徒手與撞倒，不借新版怪物能力。
  world_mimic:{detectRange:6,name:"寶箱怪",look:"mimic",gear:[],hp:7,ac:12,speed:6,xp:0,
    scores:{STR:12,DEX:10,CON:12,INT:6,WIS:10,CHA:6},innate:[]},
  // xp：打倒給的經驗，照 SRD 5.2 挑戰等級（哥布林 1/4＝50）；薩滿血量同哥布林，先同樣 50（暫定，大爺 10-04）
  goblin: {
    detectRange:5, name:"哥布林", look:"goblin", shieldArt:"round_shield", gear:["彎刀","破布衣"],
    hp:7, ac:12, speed:6, xp:50,
    innate:["nimble"],
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:8, CHA:8}
  },
  goblin_archer: {
    detectRange:7, name:"哥布林弓手", look:"goblin", shieldArt:"round_shield", gear:["短弓","箭袋","破布衣"],
    hp:7, ac:12, speed:6, xp:50,
    innate:["nimble"],
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:8, CHA:8}
  },
  // 哥布林薩滿：躲在草叢裡施法（火焰箭、治癒真言、災禍術都來自薩滿圖騰；圖騰被打掉就不能施法）
  // 行動方式見 js/battle/flow.js 的 aiShaman
  goblin_shaman: {
    detectRange:6, name:"哥布林薩滿", look:"goblin_shaman", shieldArt:"round_shield", gear:["薩滿圖騰","+1 薩滿袍"],
    hp:7, ac:12, speed:6, xp:50,
    innate:["nimble"],
    scores:{STR:8, DEX:14, CON:10, INT:10, WIS:14, CHA:10}
  }
};
