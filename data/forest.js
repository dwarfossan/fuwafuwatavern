/* 森林（大爺 10-21 定案：手工地圖、3～4 場戰鬥、4 個調查點、最深處頭目奇美拉）。地圖、敵人、調查點、台詞全部暫定：香香（draft）
   地圖：一個字一格（x 往右、y 往下）。進場在右邊（畫面左下），一路往左（畫面右上）走到奇美拉的巢
     T 樹　b 草叢　. 空地　~ 溪（過不去）　= 淺灘（踩石頭過，難走）　L 倒木（過溪的捷徑）　S 密林（一開始是樹；看懂獵人營地的地圖就變草叢，捷徑打開）
     X 箱子　P 火藥桶　C 寶箱　t 陷阱（藏著）　M 獵人記號　K 營地木箱上的地圖　R 古老石碑　B 骨堆（調查點）
   區域：A 入口（右）→ B 草叢小徑（狼埋伏）→ C 廢棄獵人營地（記號、地圖、陷阱）→ D 哥布林前哨（哥布林×2＋巫師）
         → 溪（南邊淺灘繞路，或西邊倒木捷徑）→ E 德魯伊的林間空地（德魯伊＋野豬×2、石碑）→ F 奇美拉的巢（奇美拉＋食人花×2、骨堆） */
const DUNGEONS = {};   // 手工地圖的地城登記表（js/dungeon.js 用）：森林、洞窟
const FOREST = {
  draft:"香香", name:"森林", theme:"forest", boss:"chimera",
  shortcutClue:"map", shortcutClosed:"tree", shortcutOpen:"bush",
  map:[
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TT.......TTT~~TTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T.........TT~~TTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T.........TT~~TTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T.......BTTT~~TTTTT....TTTTTTTTTTTTTTTTT",
    "TT......TTTT~~TTT.......TTTTTTTTTTTTTTTT",
    "TTTb..bTTTTT~~TT..X.P....TTTTTTTTTTTTTTT",
    "TTT....TTTTT~~T..........TTTTTTTTTTTTTTT",
    "TTb.....bTTT~~T...C...X..TTTbTTTTTTTTTTT",
    "TT........TT~~T....P.....TT.bb.TTTTTTTTT",
    "Tb.........T~~T.........TT.......bbTTTTT",
    "T..........T~~TT.......TT.....K.bb..TTTT",
    "T....b.....SLLSS........t........b...TTT",
    "T..........T~~TTT......t....M..........T",
    "Tb.........T~~TTTT.......T.b...bb......T",
    "TT........TT~~TTTT..TTTTTTbb....bb...TTT",
    "TTT.......TT~~TTT...TTTTTTTT...TTbTTTTTT",
    "TTTT.R....TT~~TT...TTTTTTTTTTTTTTTTTTTTT",
    "TTTTT......T~~T...TTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTT......==...TTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTT.....==..TTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTT..~~TTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
  ],
  party:[[37,13],[38,13],[37,14],[38,14]],
  // 第一次：照區域排小隊（squad），兩隊之間隔 8 格以上，打一隊不會把下一隊叫來
  foes:[
    {type:"forest_wolf", x:28, y:9, hidden:true, squad:1}, {type:"forest_wolf", x:27, y:15, hidden:true, squad:1},
    {type:"goblin", x:17, y:12, squad:2}, {type:"goblin", x:16, y:10, squad:2}, {type:"goblin_mage", x:15, y:7, squad:2},
    {type:"forest_druid", x:6, y:14, squad:3, druid:true}, {type:"boar", x:4, y:16, squad:3}, {type:"boar", x:8, y:15, squad:3},
    {type:"chimera", x:2, y:2, squad:4, boss:true}, {type:"mantrap", x:6, y:1, squad:4}, {type:"mantrap", x:7, y:3, squad:4}
  ],
  // 打完奇美拉以後再來：只有野獸（練功、找材料）
  again:[
    {type:"forest_wolf", x:28, y:9, hidden:true, squad:1}, {type:"forest_wolf", x:27, y:15, hidden:true, squad:1},
    {type:"boar", x:17, y:12, squad:2}, {type:"boar", x:16, y:10, squad:2},
    {type:"forest_wolf", x:6, y:14, squad:3}, {type:"boar", x:8, y:15, squad:3},
    {type:"giant_spider", x:2, y:2, squad:4}
  ],
  // 調查點（智力檢定；一個地方只能調查一次，失敗頂多錯過）
  clues:{
    M:{id:"marks", name:"獵人的記號", art:"marks", dc:12, effect:"revealTraps",
       ok:"樹幹上刻著獵人的記號：前面的路上埋了陷阱。", fail:"看不懂這些刻痕在說什麼。"},
    K:{id:"map", name:"營地木箱上的地圖", art:"map", dc:10, effect:"shortcut",
       ok:"木箱上壓著一張手畫的地圖：哥布林營地西南邊的密林裡有條獸徑，倒下的大樹可以過溪。", fail:"地圖被雨淋糊了，看不出什麼。", opened:"密林裡的獸徑露出來了。"},
    R:{id:"stele", name:"古老石碑", art:"stele", dc:14, boss:"bless",
       ok:"石碑上的古老文字慢慢亮了起來——「守林者在此祝福」。", fail:"石碑上的字太古老了，讀不出來。", bossText:"石碑的祝福還在身上：打奇美拉時全隊受到祝福。"},
    B:{id:"bones", name:"骨堆", art:"bones", dc:12, effect:"loot",
       ok:"骨堆底下壓著前一個冒險者的背包，裡面還有東西！", fail:"翻了半天，只找到幾枚金幣。", gold:5}
  },
  // 台詞（draft：香香）
  intro:[["wolf","……好安靜。鳥都不叫了。"],["tiger","森林怪怪的耶，連蟲都躲起來了！"],["fox","大家小心，往深處走看看。"],["raccoon","……有東西在看我們。"]],
  againIntro:[["fox","森林恢復熱鬧了呢。"],["tiger","有野豬！今天吃烤肉！"]],
  talker:{type:"forest_druid", shout:"盜獵的！又是你們這些人！給我滾出這座森林！",
  talk:[["talker","……嗚……你們……不是盜獵的？"],["fox","我們是來看看森林怎麼了！"],["talker","對不起……北邊的巢最近住進一隻怪物，野獸都被牠嚇瘋了。"],["talker","那傢伙有三顆頭，其中一顆會噴火……我一個人打不過牠。"],["tiger","交給我們吧！"],["talker","……拜託了。小心牠的火。"]],
  dead:[["wolf","……她好像只是在保護森林。"]]},
  bossShout:"（三顆頭同時轉過來，獅子頭發出震耳的咆哮）",
  win:[["fox","森林……安靜下來了。"],["wolf","聽，鳥又開始叫了。"]],
  cleared:"打倒了奇美拉，森林恢復平靜。"
};
DUNGEONS.forest = FOREST;
