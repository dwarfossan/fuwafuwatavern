/* 戰場資料
   w、h：格子數（1 格 = 5 呎）；座標 (x, y)，左上 (0,0)
   尺寸照一般 D&D 戰術墊（1 吋格，23 × 26 格）
   方向（2026-10-01 大爺）：小傢伙們從畫面右邊進場、面向左；敵人在左邊
   elev：高度區域 [{x0,y0,x1,y1,h}]，一層 5 呎（規則見 js/battle/engine.js 的 hAt）
   road：道路格（只是好看）；blocks：地形物件（wagon 馬車、crate 箱子、tree 樹擋路；bush 草叢可走，規則見 js/battle/engine.js 的 TERRAIN）
   party：四隻出生點；foes：敵人（gear：換掉這隻的裝備；hidden：開場就躲好，玩家看不到）
   tutorial：是否顯示教學提示 */
const roadCol = (xs, h) => xs.flatMap(x => Array.from({length:h}, (_,y) => [x,y]));
const roadRow = (ys, w) => ys.flatMap(y => Array.from({length:w}, (_,x) => [x,y]));

const BATTLES = {
  // 路旁寶箱遭遇場，GPT 暫定；勝利回接原本旅程。
  worldMimic:{name:"路旁寶箱怪",w:12,h:12,tutorial:false,road:roadRow([5,6],12),
    blocks:[{x:2,y:2,kind:"tree"},{x:9,y:9,kind:"tree"},{x:4,y:3,kind:"bush"}],
    party:[[7,5],[7,6],[8,5],[8,6]],foes:[{type:"world_mimic",x:5,y:5,testSkill:"topple"}],after:"worldChest"},
  ambush: {
    name:"救援商隊", w:23, h:26, tutorial:true,
    road: roadRow([12,13], 23),
    blocks: [
      // 商隊與遭遇點（原本 10×8 的配置整塊平移到地圖中央）
      {x:9, y:9, kind:"wagon"}, {x:9, y:10, kind:"wagon"}, {x:10, y:9, kind:"wagon"},
      {x:10, y:11, kind:"crate"}, {x:9, y:15, kind:"bush"}, {x:13, y:16, kind:"bush"},
      // 路邊草叢（可以躲進去）
      {x:4, y:3, kind:"bush"}, {x:8, y:6, kind:"bush"}, {x:2, y:8, kind:"bush"},
      {x:17, y:5, kind:"bush"}, {x:11, y:19, kind:"bush"}, {x:17, y:17, kind:"bush"},
      // 樹（外圍，加上戰場兩側各一棵可以當掩護）
      {x:14, y:2, kind:"tree"}, {x:20, y:2, kind:"tree"}, {x:3, y:20, kind:"tree"}, {x:8, y:24, kind:"tree"},
      {x:15, y:22, kind:"tree"}, {x:20, y:18, kind:"tree"}, {x:13, y:8, kind:"tree"}, {x:11, y:16, kind:"tree"}
    ],
    party: [[15,11],[15,12],[15,13],[15,14]],
    npcs: [{type:"merchant", x:8, y:10}],
    after: "caravan",   // 打贏後按「繼續」接商隊劇情（10-03）
    // 高度（2026-10-01 大爺：比較高的山丘斷層，放在劇情鏡頭外）：西南角一塊兩層（10 呎）高的台地，
    // 東邊北段是直的山壁，南段有一層的台階可以分兩次爬
    elev: [{x0:2, y0:17, x1:8, y1:22, h:2}, {x0:9, y0:20, x1:9, y1:22, h:1}],   // 商人躲在馬車後面（默默：「馬車後面，躲著一個人」）
    foes: [
      {type:"goblin", x:11, y:11, gear:["短棒","破布衣"], testSkill:"daze"},        // 震暈
      {type:"goblin", x:10, y:13, testSkill:"double_strike"},                   // 連擊
      {type:"goblin_archer", x:9, y:14, testSkill:"suppress"},                 // 壓制射擊
      {type:"goblin_shaman", x:2, y:8, hidden:true, testSkill:"bane"} // 災禍術
    ]
  }
};
