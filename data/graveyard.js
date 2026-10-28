/* 墓地線（大爺 10-28 定流程，docs/主線.md「墓地線」）：地圖、敵人、調查點、台詞全部暫定：香香（draft）
   城鎮政治諷刺：女貴族要把墓地剷平蓋豪華度假勝地，老祖宗們（不死）鬧鬼抗議
   state.main.grave：(沒有) → rumor（艾妲講了鬧鬼，去街上問三個居民）→ haunt（墓地開放、紅 ❗）→ 打倒女吸血鬼 → noble（街口的貴族馬車）
     → ancestor（回墓地查最老的墳，第二批）……
   地圖：一個字一格，30×20，晚上（dim）。進場在右邊，往左走到最深處的地下墓室
     T 樹　b 草叢　M 墓碑（擋路、半掩護）　F 墓地的燈籠（光源，借火盆）
     R 抗議布條　O 打翻的供品（P 是共用的火藥桶，不能用）　G 最老的那座墳（調查點；第二批才有，stage:["ancestor"]）
   區域：A 入口（右）→ B 墓碑群（骷髏×2、殭屍）→ C 中間的空地（幽靈、骷髏弓手、骷髏）→ D 地下墓室前（女吸血鬼＋蝙蝠×2） */
const GRAVE = {
  draft:"香香", name:"墓地", theme:"forest", lighting:"dim", boss:"vampire", home:"graveyard",
  map:[
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T....TT.......b.....TTTTTTTTTT",
    "T.M.M..M.M.M......M.M.TTTTTTTT",
    "T.......................b.TTTT",
    "T.M.M.F.M.M.M..R...M.M....TTTT",
    "TT.............M.M........b.TT",
    "T..M.M..b..M.......M.M.......T",
    "T.......M.M..M.M..........F..T",
    "T.G.M...........b...M.M.......",
    "T.......M.M.M..O..............",
    "T..M.M.....................M..",
    "T.F.....M.M.M...M.M.M...b.....",
    "TT..M.M..........b......M.M..T",
    "T........M.M.M......M........T",
    "T.M.M.F.........M.M....M.M..TT",
    "T..........b..........F.....TT",
    "TT.M.M.M..M.M.M..M.M.....TTTTT",
    "TTT..........b..........TTTTTT",
    "TTTTTTT....TTTTT.......TTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
  ],
  kinds:{M:"tomb"},   // 墓地專用的格子（js/dungeon.js 合進 DUNGEON_KINDS）
  party:[[27,9],[28,9],[26,9],[28,10]],
  stages:{
    // 第一次：老祖宗們在抗議，最深處是女吸血鬼（跟每日委託「夜裡的貴婦」是同一隻，打到 0 血化成蝙蝠飛走）
    haunt:{stars:3, after:"graveVampire",
      foes:[
        {type:"skeleton", x:17, y:8, squad:1}, {type:"skeleton", x:16, y:10, squad:1}, {type:"zombie", x:18, y:10, squad:1},   // 離入口要比偵測距離多 2 格以上
        {type:"ghost", x:10, y:6, squad:2}, {type:"skeleton_archer", x:9, y:10, squad:2}, {type:"skeleton", x:11, y:10, squad:2},
        {type:"vampire", x:1, y:10, squad:3, boss:true}, {type:"bat", x:1, y:8, squad:3}, {type:"bat", x:2, y:12, squad:3}],
      intro:[["raccoon","……墓碑好多。"],["tiger","晚、晚上的墓地，我才不怕！"],["wolf","……有東西在動。"],["fox","小心點。牠們好像在……排隊？"]]}
  },
  // 不在任何階段（還沒打、或打完女吸血鬼以後）：零星幾隻
  again:[
    {type:"skeleton", x:17, y:8, squad:1}, {type:"zombie", x:10, y:10, squad:2}
  ],
  clues:{
    R:{id:"banner", name:"抗議布條", art:"marks", dc:10,
       ok:"破布條上用暗紅色的字寫著：「還我安寧！反對開發！」——字很漂亮，大概是很久以前的人寫的。", fail:"布條爛成一條一條，看不出寫什麼。"},
    O:{id:"offering", name:"打翻的供品", art:"bones", dc:12, effect:"loot",
       ok:"供品盤底下壓著一件不像供品的東西！", fail:"只有幾個發霉的饅頭……還有幾枚銅板。", gold:5}
  },
  intro:[["fox","墓地……先四處看看。"]],
  againIntro:[["fox","老祖宗們安靜多了。"]],
  bossShout:"（女吸血鬼從墓碑上站起來，拉了拉禮服的裙襬）「毛球？……這裡不歡迎觀光客。」",
  win:[["tiger","她又變成蝙蝠跑掉了！"],["raccoon","……又。"]],
  cleared:"墓地安靜下來了。",

  // ---------- 劇情 ----------
  locked:{none:"墓地靜悄悄的……現在還沒有理由進去。（鎮上的公會好像有事找你們）", rumor:"報案的居民說法都不一樣……先去街上問問他們吧。"},
  // 艾妲（接在「最近的怪事」裡；舊存檔另外掛「❗ 墓地鬧鬼」）
  lead:["另外，墓地那邊……居民一直來報案，說晚上鬧鬼。","報案的人很多，說法每個都不一樣。去街上問問吧。"],
  guildButton:"❗ 墓地鬧鬼",
  // 街上的三個居民（紅 ❗；台詞香香草稿：每個人都只講對自己有利的）
  residents:{
    elder:{portrait:"townsfolk_male_03_grey_beard", name:"掃墓的老伯", place:"墓地路口", x:74, y:51, lines:[
      {who:"townsfolk_male_03_grey_beard", text:"鬧鬼？那是老祖宗在生氣啦。現在的年輕人都不去掃墓。"},
      {who:"townsfolk_male_03_grey_beard", text:"我？我每年都有去喔。……今年還沒去而已。"},
      {who:"townsfolk_male_03_grey_beard", text:"啊對了，前幾天有幾個穿得很體面的人，拿著繩子在墓地量來量去。大概是來掃墓的吧。"},
      {who:"fox", text:"（小聲）……拿繩子掃墓？", mood:"confused"}]},
    baker:{portrait:"townsfolk_female_02_auburn_bun", name:"麵包店的老闆娘", place:"麵包店", x:20, y:80, lines:[
      {who:"townsfolk_female_02_auburn_bun", text:"鬧鬼？絕對是對面那家麵包店搞的鬼！他們半夜把發霉的麵包倒在墓地，老祖宗當然會生氣！"},
      {who:"tiger", text:"真的嗎？！", mood:"confused"},
      {who:"townsfolk_female_02_auburn_bun", text:"……我沒看到啦。可是他們家的麵包真的很難吃。"},
      {who:"townsfolk_female_02_auburn_bun", text:"喔對，我半夜起來揉麵團的時候，看到一個穿禮服的女人從墓地那邊飛過去。用飛的喔。"},
      {who:"raccoon", text:"……禮服。", mood:"sly"}]},
    youth:{portrait:"townsfolk_male_04_red_hair", name:"晚歸的青年", place:"後巷", x:62, y:84, lines:[
      {who:"townsfolk_male_04_red_hair", text:"我那天喝完酒經過墓地，看到一排骷髏站在那裡，手上舉著牌子。"},
      {who:"wolf", text:"牌子上寫什麼？", mood:"serious"},
      {who:"townsfolk_male_04_red_hair", text:"……我不識字。不過字寫得很大，應該很生氣。"},
      {who:"townsfolk_male_04_red_hair", text:"然後我就醒了，躺在墓碑旁邊。錢包不見了。"},
      {who:"raccoon", text:"……不是我。", mood:"caught"}]}
  },
  allAsked:[
    {who:"fox", text:"三個人講三個樣……只有一件事一樣：都是晚上。", mood:"confused"},
    {who:"wolf", text:"禮服的女人、量地的人、舉牌子的骷髏。", mood:"serious"},
    {who:"tiger", text:"那就晚上去墓地看看！", mood:"happy"}],
  askDone:"回到街上",
  // 打倒女吸血鬼以後（她化成蝙蝠又聚回來）
  vampireTalk:[
    {who:"narr", text:"墓地安靜下來。一群蝙蝠在墓碑上空繞了幾圈，又聚回一個人影。", on:"vampire", face:"annoyed"},
    {who:"vampire", text:"……你們很煩耶。", on:"vampire", face:"annoyed"},
    {who:"fox", text:"在鎮上嚇人的是妳吧？居民都去公會報案了。", mood:"normal", on:"vampire", face:"annoyed"},
    {who:"vampire", text:"嚇人？我們是在抗議。", on:"vampire", face:"serious"},
    {who:"vampire", text:"鎮上有個貴族，要把整座墓地剷平，蓋成什麼「豪華度假勝地」。溫泉、別墅，還有給有錢人散步的花園。", on:"vampire", face:"angry"},
    {who:"tiger", text:"那老祖宗們要睡哪裡？", mood:"confused", on:"vampire", face:"angry"},
    {who:"vampire", text:"好問題。她說：「死人不需要地方睡。」", on:"vampire", face:"sad"},
    {who:"wolf", text:"……所以骷髏舉的牌子，是抗議標語。", mood:"serious", on:"vampire", face:"sad"},
    {who:"vampire", text:"寫得很漂亮吧？我寫的。", on:"vampire", face:"smile"},
    {who:"raccoon", text:"……那個貴族在哪？", mood:"sly", on:"vampire", face:"smile"},
    {who:"vampire", text:"鎮上。她每天坐馬車經過街口。你們去跟她說說看——如果她肯理你們的話。", on:"vampire", face:"smirk"}],
  vampireNext:"回大地圖",
  // 女吸血鬼打到 0 血（委託、墓地都一樣）：不會死，化成蝙蝠飛走
  repelLog:"{name}化成一大群蝙蝠，吱吱叫著飛走了。",
  repelSay:"……下次可沒這麼簡單。",
  // 街口的貴族馬車（紅 ❗）
  carriage:{place:"街口", who:"貴族的馬車", x:52, y:44},
  nobleTalk:[
    {who:"narr", text:"一輛鑲金邊的馬車停在街口。車窗拉開了一半。", on:"noblewoman", face:"haughty"},
    {who:"fox", text:"請問，墓地要改建成度假勝地的事——", mood:"normal", on:"noblewoman", face:"haughty"},
    {who:"noblewoman", text:"……誰准毛球靠近我的馬車的？", on:"noblewoman", face:"contempt"},
    {who:"tiger", text:"老祖宗們在抗議耶！你們要把他們的墳剷掉！", mood:"angry", on:"noblewoman", face:"contempt"},
    {who:"noblewoman", text:"那塊地是我家的。我家的地，我想蓋什麼就蓋什麼。", on:"noblewoman", face:"haughty"},
    {who:"noblewoman", text:"死人沒有投票權，也不繳稅。他們的意見，不重要。", on:"noblewoman", face:"smirk"},
    {who:"wolf", text:"……那塊地，是妳家的？", mood:"serious", on:"noblewoman", face:"smirk"},
    {who:"noblewoman", text:"車夫，走。", on:"noblewoman", face:"impatient"},
    {who:"narr", text:"馬車揚長而去，濺了毛毛們一身泥。", on:"-"},
    {who:"raccoon", text:"……記住了。", mood:"sly", on:"-"},
    {who:"fox", text:"她說「我家的地」……回墓地問問那個吸血鬼，那塊地到底是誰的。", mood:"normal", on:"-"}],
  nobleNext:"回到街上",
  // 墓地出身的仇人（被敲暈、記仇回來）多一套：沒腦子的用旁白演，幽靈開口（大爺 10-28）
  grudgeShout:{
    mindless:[
      "（低頭看了看自己斷掉的那根肋骨……又抬頭看了看那隻{by}。下巴喀啦喀啦地抖）",
      "（摸了摸少掉一截的手臂——那是生前牽女朋友的那隻手。空洞的眼睛死盯著那隻{by}）",
      "（把墓碑上被踩出來的{by}腳印，指給旁邊的同伴看）"],
    undead:[
      "你知道我在墓地飄了幾百年，才飄到那個好位置嗎？！那隻{by}，給我站住！",
      "上次被你打散，我花了三個晚上才把自己拼回來！臭{by}！",
      "我們在抗議，你們在搗亂！那隻{by}，今天讓你也變成老祖宗！"]
  }
};
DUNGEONS.graveyard = GRAVE;
