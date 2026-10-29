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
    "Tb.....Q...T~~T.........TT.......bbTTTTT",
    "T..........T~~TT.......TT.....K.bb..TTTT",
    "T...Yb.....SLLSS........t........b...TTT",
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
  // ===== 森林主線（大爺 10-22）：公會艾妲 → 第一次進森林（哥布林、遇到德魯伊）→ 第二次（食人花、花粉）→ 撞見德魯伊控制奇美拉 → 打奇美拉 → 回公會報告 =====
  //   state.main.forest：(沒有) → investigate → met → boss → report → done。台詞全部是香香的草稿（draft）
  stages:{
    // 第一次：溪邊起霧（德魯伊施的法，「熟悉的路會走錯」），過不去；打完狼和森林邊的哥布林（被趕出森林、到處搶劫的那群）＝這次結束，德魯伊出場
    investigate:{stars:1, mist:[[12,19],[13,19],[12,20],[13,20],[11,12],[12,12],[13,12],[14,12],[15,12]], after:"forestDruidMeet",
      foes:[
        {type:"forest_wolf", x:28, y:9, hidden:true, squad:1}, {type:"forest_wolf", x:27, y:15, hidden:true, squad:1},
        {type:"goblin", x:17, y:12, squad:2}, {type:"goblin", x:16, y:10, squad:2}, {type:"goblin_mage", x:15, y:7, squad:2}],
      intro:[["wolf","……好安靜。鳥都不叫了。"],["tiger","哥布林就是從這裡跑出來的嗎？"],["fox","艾妲說牠們以前從來不出森林。往裡面看看。"],["raccoon","……有東西在看我們。"]]},
    // 第二次：霧散了（德魯伊不在附近）；深處長滿食人花、野獸被花粉迷得東倒西歪。調查兩處（或走到巢穴附近）＝撞見德魯伊
    met:{stars:0, noReward:true, revealAt:2, revealArea:{x1:8, y1:6},
      foes:[
        {type:"mantrap", x:3, y:13, squad:3}, {type:"mantrap", x:5, y:11, squad:3},
        {type:"boar", x:6, y:16, squad:4}, {type:"boar", x:8, y:15, squad:4}],
      intro:[["fox","……霧散了。"],["wolf","她不在，路就不會繞。"],["tiger","所以霧是她弄的？"],["raccoon","……走。"]]},
    // 撞見之後：直接在巢穴開打（奇美拉被叫醒，德魯伊溜了）
    boss:{stars:3, combat:true, party:[[6,8],[7,8],[6,9],[7,9]], after:"forestAfter",
      foes:[{type:"chimera", x:2, y:2, squad:5, boss:true}, {type:"mantrap", x:6, y:1, squad:5}, {type:"mantrap", x:8, y:2, squad:5}]}
  },
  main:{
    draft:"香香",
    // 公會艾妲（城鎮的對話；一句一個字串，艾妲說的）
    guild:["毛絨絨小隊，來得正好。最近鎮外的商隊一直被哥布林搶。","怪的是，牠們全是從森林那邊過來的。森林裡的哥布林以前從來不出森林。","公會想知道森林裡出了什麼事。去看看，回來報告。","對了——森林裡住著一位德魯伊。見到她客氣點，她不太喜歡外人。……大概也不太喜歡任何東西。"],
    guildButton:"❗ 最近的怪事",   // 10-28：三條線索一起講（森林、洞窟、驅除哥布林）
    locked:"森林安安靜靜的……現在還沒有理由進去。（鎮上的公會好像有事找你們）",
    report:["……德魯伊拿外來的怪物趕哥布林？還用花粉控制牠？","而那隻奇美拉，項圈上刻著貴族的家徽。","（艾妲揉了揉眉心）我會往上報。上面……大概又要開很久的會了。","辛苦了，毛絨絨小隊。這次的報告，公會記下了。"],
    reportButton:"❗ 回報森林的事",
    // 第一次打完：德魯伊出場
    druidMeet:[
      {who:"narr", text:"哥布林的營地安靜下來時，樹後走出一個人。", on:"druid", face:"cold"},
      {who:"druid", text:"……清乾淨了？不錯。", on:"druid", face:"cold"},
      {who:"fox", text:"妳是……德魯伊？我們在調查哥布林為什麼跑出森林。", mood:"normal", on:"druid", face:"skeptical"},
      {who:"druid", text:"哥布林就是會搶東西的害蟲。牠們離開森林，是森林的福氣。", on:"druid", face:"contempt"},
      {who:"tiger", text:"可是牠們跑去搶鎮上的人耶！", mood:"angry", on:"druid", face:"impatient"},
      {who:"druid", text:"那是鎮上的事。城鎮是你們自己蓋出來的東西，跟森林無關。", on:"druid", face:"impatient"},
      {who:"wolf", text:"……森林太安靜了。鳥呢？", mood:"serious", on:"druid", face:"alert"},
      {who:"druid", text:"……季節到了而已。", on:"druid", face:"cold"},
      {who:"raccoon", text:"……她在說謊。", mood:"sly", on:"druid", face:"cruel_smirk"},
      {who:"druid", text:"森林需要的是保護，不是你們這種踩壞草皮的外人。", on:"druid", face:"contempt"},
      {who:"druid", text:"回去吧，毛球們。森林深處，你們走不進去的。", on:"druid", face:"cruel_smirk"},
      {who:"narr", text:"她轉身走進霧裡。霧散開的時候，她已經不見了——溪邊那條路，好像又看得見了。", on:"-"},
      {who:"fox", text:"……她剛剛是不是說了「走不進去」？下次再來看看。", mood:"confused", on:"-"}],
    // 第二次：撞見
    reveal:[
      {who:"narr", text:"巢穴前面，小傢伙們趕緊躲進草叢。", on:"-"},
      {who:"narr", text:"德魯伊站在一隻巨大的怪物旁邊——獅子、山羊、龍，三顆頭。", on:"chimera"},
      {who:"tiger", text:"（小聲）奇、奇美拉！", mood:"surprised", on:"chimera"},
      {who:"narr", text:"她從腰上的袋子抓了一把黃色的花粉，往三顆頭撒過去。奇美拉晃了晃，乖乖趴下睡著了。", on:"druid", face:"cold"},
      {who:"fox", text:"（小聲）食人花的花粉……她在控制牠！", mood:"surprised", on:"druid", face:"cold"},
      {who:"druid", text:"乖。明天去東邊，把剩下的哥布林窩也清掉。", on:"druid", face:"cruel_smirk"},
      {who:"wolf", text:"……所以森林會這麼安靜，是因為牠。", mood:"serious", on:"druid", face:"alert"},
      {who:"druid", text:"……誰在那裡？", on:"druid", face:"alert"},
      {who:"druid", text:"又是你們這群毛球。——起來！", on:"druid", face:"shout"},
      {who:"narr", text:"奇美拉睜開了六隻眼睛。德魯伊退進樹林，不見了。", on:"chimera"},
      {who:"raccoon", text:"……跑了。", mood:"normal", on:"chimera"}],
    // 打倒奇美拉以後
    after:[
      {who:"narr", text:"奇美拉倒下了。森林深處，第一次傳來一聲鳥叫。", on:"-"},
      {who:"tiger", text:"牠也是被丟掉的耶……", mood:"sad", on:"-"},
      {who:"fox", text:"德魯伊跑了。先回公會跟艾妲報告吧。", mood:"serious", on:"-"}]
  },
  // 調查點（智力檢定；一個地方只能調查一次，失敗頂多錯過）
  clues:{
    M:{id:"marks", name:"獵人的記號", art:"marks", dc:12, effect:"revealTraps", stage:["investigate","done"],
       ok:"樹幹上刻著獵人的記號：前面的路上埋了陷阱。", fail:"看不懂這些刻痕在說什麼。"},
    K:{id:"map", name:"營地木箱上的地圖", art:"map", dc:10, effect:"shortcut", stage:["investigate","met","done"],
       ok:"木箱上壓著一張手畫的地圖：哥布林營地西南邊的密林裡有條獸徑，倒下的大樹可以過溪。", fail:"地圖被雨淋糊了，看不出什麼。", opened:"密林裡的獸徑露出來了。"},
    R:{id:"claws", name:"巨大的爪痕", art:"marks", dc:12, boss:"fireResist", stage:["met"],
       ok:"樹幹上三道又深又寬的爪痕，旁邊黏著三種毛：獅子的、山羊的，還有……鱗片？樹皮一大片是燒焦的。", fail:"好大的爪痕……看不出是什麼。", bossText:"看過燒焦的樹，大家知道牠吐火前會先吸一口氣——躲得開（火焰抗性）。"},
    Q:{id:"pouch", name:"掉在地上的小袋子", art:"bones", dc:10, boss:"drowsy", stage:["met"],
       ok:"皮製的小袋子，裡面裝滿黃色的花粉，袋口繡著葉子的花紋——跟德魯伊腰上那個一模一樣。", fail:"一個空空的小袋子。", bossText:"玲玲把撿到的花粉往奇美拉臉上一撒！牠晃了晃頭，第一回合動不了。"},
    Y:{id:"pollen", name:"被採過的食人花", art:"stele", dc:12, stage:["met"],
       ok:"食人花的花蕊被整齊地刮掉了一半——有人在採牠的花粉。旁邊的草地上，一隻野豬睡得東倒西歪。", fail:"一株普通（？）的食人花。"},
    B:{id:"collar", name:"被丟掉的寵物項圈", art:"bones", dc:12, effect:"loot", stage:["boss","done"],
       ok:"一個鑲金的大項圈，刻著「小咪咪」和一個貴族的家徽。旁邊還有一本《奇美拉飼養入門》。項圈裡卡著一件值錢的東西！", fail:"一個壞掉的大項圈。", gold:5}
  },
  // 台詞（draft：香香）
  intro:[["wolf","……好安靜。鳥都不叫了。"],["tiger","森林怪怪的耶，連蟲都躲起來了！"],["fox","大家小心，往深處走看看。"],["raccoon","……有東西在看我們。"]],
  againIntro:[["fox","森林恢復熱鬧了呢。"],["tiger","有野豬！今天吃烤肉！"]],
  bossShout:"（三顆頭同時轉過來，獅子頭發出震耳的咆哮）",
  win:[["fox","森林……安靜下來了。"],["wolf","聽，鳥又開始叫了。"]],
  cleared:"打倒了奇美拉，森林恢復平靜。"
};
DUNGEONS.forest = FOREST;
