/* 洞窟（大爺 10-21 定案：狗頭人供奉小紅龍；手工地圖、調查點四個、頭目紅龍幼龍）。地圖、敵人、調查點、台詞全部暫定：香香（draft）
   地圖：一個字一格。進場在右邊，一路往左走到龍巢；整張是黑的（lighting:"dark"），入口有一點天光、火盆 F 會照亮周圍
     W 岩壁　. 地面　~ 地下河（過不去）　= 淺灘（踩石頭過）　S 塌方（看懂礦工筆記才挖得開，變碎石路）　F 火盆（光源）
     X 箱子　C 寶箱　t 陷阱（藏著）　N 礦工筆記　K 狗頭人的落石機關　A 龍語祭壇　H 龍的寶藏堆（調查點）
   區域：A 入口 → B 蝙蝠洞（蝙蝠×2、史萊姆）→ C 廢棄礦工營地（筆記、陷阱）→ D 狗頭人窩（狗頭人、矛兵、弓手＋狗頭人薩滿）
         → 地下河（南邊淺灘繞路，或北邊塌方捷徑）→ E 龍語祭壇（狗頭人矛兵＋弓手、落石機關）→ F 龍巢（紅龍幼龍、寶藏堆） */
const CAVE = {
  draft:"香香", name:"洞窟", theme:"cave", lighting:"dark", boss:"red_wyrmling",
  lights:[{x:38, y:13, bright:3, dim:6}],   // 入口的天光（火盆 F 另外自動算）
  shortcutClue:"notes", shortcutClosed:"rubble", shortcutOpen:"gravel",
  map:[
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WW...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WH...FWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "W.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "W.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "W.....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "W....FWWWWWWWWW...WWWWWWWWW...WWWWWWWWWW",
    "WW..t.KW.W.SSSS.F..WWWWWWWW....WWWWWWWWW",
    "WWWW.t.....W~~.....WW...WWW.W...WWWWWWWW",
    "WWWWWW...F.W~~.....WWX.N.WW.....WWW...WW",
    "WWWWWW.....W~~........t..WW.....WW.....W",
    "WWWWW.......~~....C..t.................W",
    "WWWWW.......~~.....WW..................W",
    "WWWWW.......~~.....WW.X..WW............W",
    "WWWWWWA....W~~...FWWW...WWW.....WW.....W",
    "WWWWWW.....W~~..WWWWWWWWWWW..W.WWWW...WW",
    "WWWWWWW...WW~~..WWWWWWWWWWW...WWWWWWWWWW",
    "WWWWWWWW....==..WWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWW...==..WWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWW...~~..WWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWW~~WWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWW~~WWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWW~~WWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWW~~WWWWWWWWWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
  ],
  party:[[37,13],[38,13],[37,14],[38,14]],
  foes:[
    {type:"bat", x:28, y:11, squad:1}, {type:"bat", x:27, y:14, squad:1}, {type:"slime", x:28, y:13, squad:1},
    {type:"kobold_spear", x:16, y:10, squad:2}, {type:"kobold_archer", x:17, y:13, squad:2}, {type:"kobold", x:15, y:14, squad:2}, {type:"kobold_mage", x:15, y:12, squad:2},
    {type:"kobold_spear", x:8, y:13, squad:3}, {type:"kobold_archer", x:9, y:15, squad:3},
    {type:"red_wyrmling", x:2, y:3, squad:4, boss:true}
  ],
  again:[
    {type:"bat", x:28, y:11, squad:1}, {type:"bat", x:27, y:14, squad:1},
    {type:"giant_spider", x:16, y:11, squad:2},
    {type:"slime", x:8, y:13, squad:3}, {type:"slime", x:9, y:15, squad:3},
    {type:"giant_spider", x:2, y:3, squad:4}
  ],
  clues:{
    N:{id:"notes", name:"礦工筆記", art:"map", dc:12, effect:"shortcut",
       ok:"破爛的筆記本上寫著：「北邊那段塌方後面就是祭壇，挖開就不用繞到地下河南邊。」", fail:"字被水泡爛了，看不出寫什麼。", opened:"塌方的碎石挖開了，北邊的捷徑通了。"},
    K:{id:"rockfall", name:"狗頭人的落石機關", art:"marks", dc:13, boss:"rockfall", trapsFound:true,
       ok:"看懂了！這是狗頭人拿來擋闖入者的落石機關——拉繩子就會砸在龍巢門口。附近的陷阱也一起看出來了。", fail:"繩子、木樁纏成一團，看不懂怎麼用。", bossText:"落石機關！石頭轟隆隆砸在紅龍頭上！"},
    A:{id:"altar", name:"龍語祭壇", art:"stele", dc:14, boss:"fireResist",
       ok:"祭壇上的龍語刻文寫著狗頭人的祈禱：「願主人的火不燒到僕人」——念出來，身上暖暖的。", fail:"龍語太難了，一個字都讀不出來。", bossText:"祭壇的祈禱還在：打紅龍時全隊有火焰抗性。"},
    H:{id:"hoard", name:"龍的寶藏堆", art:"bones", dc:12, effect:"loot",
       ok:"金幣堆底下埋著一件閃閃發亮的東西！", fail:"翻了半天，只抓到一把金幣。", gold:10}
  },
  intro:[["raccoon","……好黑。"],["wolf","黑暗視覺看得到，就是灰灰的。要不要點火把？"],["tiger","有火把就不怕！"],["fox","點了火，裡面的東西也會看到我們喔。"]],
  againIntro:[["fox","龍走了以後，洞裡只剩蝙蝠跟蜘蛛了。"]],
  bossShout:"（紅龍睜開眼睛，噴出一口煙）「……狗頭人呢？誰准你們進來的？」",
  win:[["tiger","我們打贏龍了！！"],["fox","……雖然只是小龍。"],["wolf","……她哭了。"],["raccoon","寶藏。"]],
  cleared:"紅龍幼龍哭著飛走了，洞窟安靜下來了。",
  // 洞窟主線開頭與回報（大爺 10-28：三條線一開始都能選；開頭＝狗頭人半夜敲鑼吵礦工）。艾妲說的，香香草稿
  main:{
    draft:"香香",
    lead:["還有一件。洞窟那邊的礦工來抱怨，說每天半夜都有東西在洞裡敲鑼，吵得他們睡不著。","……一邊敲還一邊唱歌，唱得很難聽。礦工說，聽起來像在拜什麼東西。","有空的話去看看是誰在吵。礦工會很感激。"],
    report:["狗頭人在洞裡拜一隻小紅龍？……然後你們把牠們的神打倒了。","礦工說昨晚終於睡了個好覺，要我跟你們道謝。","……聽說狗頭人到處說那隻是「壞龍」，牠們要去找真正的龍神。……好像哪裡不太對。"],
    reportButton:"❗ 回報洞窟的事"
  }
};
DUNGEONS.cave = CAVE;
