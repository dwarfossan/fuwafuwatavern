/* ======================== 狀態 ======================== */
const STARTER_NOTES = {
  fox:[
    {key:"arcane_staff_1",name:"魔法飛彈",innate:false,from:"起始技能",lv:1},
    {key:"arcane_staff_2",name:"護盾術",innate:false,from:"起始技能",lv:1},
    {key:"arcane_staff_3",name:"法師護甲",innate:false,from:"起始技能",lv:1}
  ],
  tiger:[
    {key:"axe_1",name:"破甲",innate:false,from:"起始技能",lv:1},
    {key:"axe_2",name:"放血",innate:false,from:"起始技能",lv:1},
    {key:"heavy_3",name:"衝撞",innate:false,from:"起始技能",lv:1}
  ],
  wolf:[
    {key:"bow_1",name:"瞄準射擊",innate:false,from:"起始技能",lv:1},
    {key:"bow_3",name:"壓制射擊",innate:false,from:"起始技能",lv:1},
    {key:"dagger_3",name:"扎腿",innate:false,from:"起始技能",lv:1}
  ],
  raccoon:[
    {key:"dagger_1",name:"偷襲",innate:false,from:"起始技能",lv:1},
    {key:"dagger_2",name:"閃身刺",innate:false,from:"起始技能",lv:1},
    {key:"thrown_3",name:"瞄腿",innate:false,from:"起始技能",lv:1}
  ]
};
const starterNotes = id => (STARTER_NOTES[id]||[]).map(x=>({...x}));

const state = {
  page:"cover",
  active:0,
  rolls:{},   // rolls[id][KEY] = 分配到該屬性的那組骰子 [d,d,d,d]（由 slot 同步而來）
  sets:{},    // sets[id] = 擲出的 6 組骰子 [[d,d,d,d]×6]
  slot:{},    // slot[id][KEY] = 分配到的組別索引
  sel:null,   // 擲骰頁：點選中的籌碼索引
  scene:"prologue", // 目前劇情場景（prologue 序章 / farewell 送別）
  line:0,     // 劇情目前台詞
  info:null,  // 正在查看的角色
  gold:{}, inv:{}, learned:{}, activeSkills:{}, proficiency:{}, shortRestsUsed:0, shopActive:0, shopCat:"簡易近戰", quip:"挑吧挑吧！",
  location:"tavern", // 大地圖：目前所在地
  mapSel:null,       // 大地圖：點選中的地點
  travel:null,       // 大地圖旅行中：{from, to, t, stop, alert}
};
