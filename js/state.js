/* ======================== 狀態 ======================== */
const STARTER_NOTES = {
  fox:[
    {key:"magic_missile",name:"魔法飛彈",innate:false,from:"起始技能",lv:1},
    {key:"shield_spell",name:"護盾術",innate:false,from:"起始技能",lv:1},
    {key:"mage_armor",name:"法師護甲",innate:false,from:"起始技能",lv:1}
  ],
  tiger:[
    {key:"sunder",name:"破甲",innate:false,from:"起始技能",lv:1},
    {key:"bleed",name:"放血",innate:false,from:"起始技能",lv:1},
    {key:"topple",name:"撞倒",innate:false,from:"起始技能",lv:1}
  ],
  wolf:[
    {key:"aimed_shot",name:"瞄準射擊",innate:false,from:"起始技能",lv:1},
    {key:"suppress",name:"壓制射擊",innate:false,from:"起始技能",lv:1},
    {key:"hamstring",name:"扎腿",innate:false,from:"起始技能",lv:1}
  ],
  raccoon:[
    {key:"sneak_attack",name:"偷襲",innate:false,from:"起始技能",lv:1},
    {key:"dash_stab",name:"閃身刺",innate:false,from:"起始技能",lv:1},
    {key:"hamstring",name:"扎腿",innate:false,from:"起始技能",lv:1}
  ]
};
const starterNotes = id => [...(STARTER_NOTES[id]||[]).map(x=>({...x})),{key:"darkvision",name:"黑暗視覺",innate:true,from:"天生",lv:1}];

const state = {
  page:"cover",
  active:0,
  initialHpDice:{}, // 每隻初始生命1d10，創角重擲時更新
  rolls:{},   // rolls[id][KEY] = 分配到該屬性的那組骰子 [d,d,d,d]（由 slot 同步而來）
  sets:{},    // sets[id] = 擲出的 6 組骰子 [[d,d,d,d]×6]
  slot:{},    // slot[id][KEY] = 分配到的組別索引
  sel:null,   // 擲骰頁：點選中的籌碼索引
  scene:"prologue", // 目前劇情場景（prologue 序章 / farewell 送別）
  line:0,     // 劇情目前台詞
  info:null,  // 正在查看的角色
  sysPop:null, // 共用系統工具：volume / menu
  starterGranted:false, startingGear:{},
  gold:{}, inv:{}, learned:{}, activeSkills:{}, proficiency:{}, shortRestsUsed:0, shopActive:0, shopCat:"簡易近戰", quip:"挑吧挑吧！",
  focusItems:{}, focusSerial:0, shopFocusStock:{}, // 每件法器固定使用屬性與商店現貨
  shopScroll:{}, shopBagOpen:false, // 商店分類各自保留商品捲動位置
  location:"tavern", // 大地圖：目前所在地
  mapSel:null,       // 大地圖：點選中的地點
  travel:null,       // 大地圖旅行中：{from, to, t, stop, alert}
  magicItems:{},market:null, supplierSeen:false, townFounded:false, townPlace:null, townPanel:null, townRest:null, shopContext:null, restMessage:null,
  xp:{}, level:{},   // 經驗與等級（大爺 10-04）：打倒敵人照 SRD 平分、劇情完成另給；見 js/rules.js gainXP
  retriesLeft:3,     // 輸掉後「重新挑戰」還剩幾次；長休回滿（大爺 10-02，RETRY_MAX 在 js/battle/engine.js）
  battleSnap:null,   // 開戰前的存檔：重新挑戰時整個還原（血、熟練格、道具、筆記）
};
