/* 失蹤的雞（支線，大爺 10-23）：文字、數字。台詞全部是香香的草稿（draft），等大爺改；數字暫定
   故事：雞群在標會。會頭是惡魔變的異界雞，用不存在的「咕咕三號」冒標，每期都標第一、把蛋吃光；
         雞是雞，所以沒發現。毛毛們去的那期，第一次有真的雞（白雞＝委託人的小白）標到，會頭拿不出蛋 → 露餡
   流程（邏輯 js/chicken.js）：
   - 住過第一晚後，城鎮街上有黃 ❗（養雞的大嬸）→ 接下 → 城鎮旁的路出現黃 ❗
   - 走過去：沿著雞毛找（感知檢定，過了撿到會單＝揭穿時優勢；沒過只是多繞一段）→ 撞見開標 → 揭穿／直接打
       揭穿（魅力檢定）：成功＝雞群嚇得跑回家，只打惡魔原形（大爺 10-23）；失敗＝雞群不信，照直接打
       直接打：異界雞＋三隻雞（被標會壓力逼成獸人等級），雞群護著會頭；異界雞血量剩一半變回惡魔原形
   - 惡魔打到 0 血不死，化成黑煙飛走（重要角色）；雞不會自動敲暈，開戰時提示白雞是委託人家的
   - 打完：窩裡只剩幾顆蛋 → 還給雞群／交給大嬸 → 城鎮街上黃 ❗ 回報 → 沒人相信，報酬照給 */
const CHICKEN = {
  draft:"香香",
  gold:60,                 // 報酬（全隊合計，四隻平分）
  findDc:12,               // 找雞：感知（四隻裡感知最高的）
  exposeDc:13,             // 揭穿：魅力（四隻裡魅力最高的）；有會單＝優勢
  whiteStress:5,           // 小白被打死：四隻壓力 +5
  street:{x:50, y:66, place:"街角", who:"養雞的大嬸", report:"回報"},   // 城鎮街上 ❗ 的位置（%）和小卡片文字
  pin:"雞毛",              // 大地圖 ❗ 的名字
  title:"失蹤的雞",
  item:"雞蛋會單",
  ui:{plan:"要怎麼做？", eggs:"剩下的蛋怎麼辦？", accept:"接下委託", go:"戰鬥開始！", back:"回大地圖", done:"回到街上",
    expose:{label:"揭穿", sub:"魅力檢定・難度 {dc}（{who}）{adv}"}, adv:"・有會單：優勢", fight:{label:"直接打", sub:"把會頭抓起來"},
    giveBack:{label:"帶回雞舍", sub:"每隻分一兩顆"}, toAuntie:{label:"交給大嬸", sub:"畢竟是她家的雞生的"},
    hint:"（提示：白雞是委託人家的雞。行動選單的「敲暈」打開，近戰打到 0 血就不會打死）",
    transformLog:"{name}的羽毛一片片剝落——是惡魔！", transformSay:"哎呀，被逼出原形了呢。",
    repelLog:"{name}笑著化成一團黑煙，飛走了。", repelSay:"……這只是開始。",
    end:"雞群的事解決了。帶著剩下的蛋離開吧。", got:"委託報酬：每隻 {g} gp；默默收下了雞蛋會單"},
  ask:[
    {who:"auntie", text:"你們是冒險者吧？我家的小白不見了，就是那隻白母雞。"},
    {who:"auntie", text:"最近雞舍怪怪的，每隻都悶悶不樂，蛋也越生越少……昨天晚上，小白就沒回來了。"},
    {who:"tiger", text:"找雞！這個嬌嬌會！", mood:"happy"},
    {who:"fox", text:"……報酬呢？", mood:"smug"},
    {who:"auntie", text:"60 gp，找到小白就給。"}
  ],
  search:[
    {who:"narr", text:"路邊散著白色的雞毛，一路往樹林裡延伸。", on:"-"},
    {who:"wolf", text:"……雞的味道。不只一隻。", mood:"serious", on:"-"}
  ],
  lookLine:"……附近好像有什麼東西。",
  ledger:[
    {who:"narr", text:"草叢裡卡著一張被雞爪抓皺的紙。", on:"-"},
    {who:"raccoon", text:"……會單。", mood:"sly", on:"-"},
    {who:"fox", text:"每一期得標的，都是「咕咕三號」……咕咕三號是誰？", mood:"confused", on:"-"}
  ],
  noLedger:[{who:"narr", text:"繞了一大圈，才找到雞群在哪裡。", on:"-"}],
  bid:[
    {who:"narr", text:"樹林深處，一群雞圍成一圈。中間的窩，空空的。", on:"hen_white"},
    {who:"demon_chicken", text:"咕咕咕。（開標了。這一期得標的是……）", on:"demon_chicken"},
    {who:"demon_chicken", text:"……咕。（……白雞。）", on:"demon_chicken"},
    {who:"hen_white", text:"咕咕咕咕！（我、我標到了！終於！）", on:"hen_white"},
    {who:"hen_brown", text:"咕？（不是咕咕三號？）", on:"hen_brown"},
    {who:"rooster", text:"咕咕！（咕咕三號每期都標第一，這是第一次耶！）", on:"rooster"},
    {who:"hen_white", text:"咕咕咕！（會頭，我的蛋呢？）", on:"hen_white"},
    {who:"demon_chicken", text:"……咕咕。（……蛋，下次一起給。）", on:"demon_chicken"},
    {who:"rooster", text:"咕咕？！（下次？！）", on:"rooster"},
    {who:"tiger", text:"（小聲）牠們在……標會？", mood:"confused", on:"rooster"},
    {who:"raccoon", text:"……而且會頭拿不出蛋。", mood:"sly", on:"demon_chicken"}
  ],
  exposeAsk:[{who:"fox", text:"等一下！咕咕三號在哪裡？叫牠出來啊！", mood:"smug", on:"demon_chicken"}],
  exposeOk:[
    {who:"hen_brown", text:"咕……（對耶，咕咕三號是誰？）", on:"hen_brown"},
    {who:"rooster", text:"咕咕咕！（我從來沒看過咕咕三號！）", on:"rooster"},
    {who:"hen_white", text:"咕咕咕咕！（每一期的蛋，都被「咕咕三號」拿走了……）", on:"hen_white"},
    {who:"demon_chicken", text:"……咕。", on:"demon_chicken"},
    {who:"narr", text:"異界雞的羽毛一片片剝落，黑煙裡張開一對巨大的翅膀。", on:"demon", face:"smug"},
    {who:"demon", text:"哎呀，被發現了呢。", on:"demon", face:"smug"},
    {who:"demon", text:"蛋？早就吃光啦，一顆都不剩——真的很好吃喔。", on:"demon", face:"teasing"},
    {who:"rooster", text:"咕咕咕咕！（快逃啊！）", on:"rooster"},
    {who:"narr", text:"雞群咕咕叫著，一哄而散，往家的方向跑了。", on:"demon", face:"annoyed"},
    {who:"raccoon", text:"……跑得比標會還快。", mood:"sly", on:"demon", face:"annoyed"}
  ],
  exposeFail:[
    {who:"hen_brown", text:"咕咕！（外人懂什麼！）", on:"hen_brown"},
    {who:"rooster", text:"咕咕咕！（會頭說下次給，就是下次給！）", on:"rooster"},
    {who:"demon_chicken", text:"咕咕。（把這些毛球趕出去。）", on:"demon_chicken"},
    {who:"tiger", text:"……牠們寧願相信會頭。", mood:"confused", on:"demon_chicken"}
  ],
  fight:[
    {who:"tiger", text:"抓住那隻紅色的！", mood:"fierce", on:"demon_chicken"},
    {who:"rooster", text:"咕咕咕！（別想動我們的會頭！蛋還沒拿回來！）", on:"rooster"},
    {who:"hen_brown", text:"咕咕！（會頭倒了，我們的蛋怎麼辦！）", on:"hen_brown"},
    {who:"raccoon", text:"……牠們在護著騙子。", mood:"sly", on:"rooster"}
  ],
  eggs:[
    {who:"narr", text:"惡魔留下的窩裡，只剩幾顆蛋。", on:"-"},
    {who:"fox", text:"其他的……都被吃掉了。", mood:"awkward", on:"-"}
  ],
  giveBack:[
    {who:"rooster", text:"咕咕咕？！（才這樣？！）", on:"rooster"},
    {who:"hen_brown", text:"咕……（……那下一期還標嗎？）", on:"hen_brown"},
    {who:"raccoon", text:"……還想標。", mood:"sly", on:"hen_brown"}
  ],
  toAuntie:[
    {who:"tiger", text:"蛋給大嬸，大嬸會開心！", mood:"happy", on:"rooster"},
    {who:"rooster", text:"咕咕咕咕！（那是我們的蛋！）", on:"rooster"},
    {who:"wolf", text:"……先走吧。", mood:"sigh", on:"rooster"}
  ],
  // 回報（城鎮）
  endAlive:[
    {who:"auntie", text:"小白！你們找到牠了！"},
    {who:"tiger", text:"大嬸！牠們在標會！會頭是惡魔變的，把蛋全部吃掉了！", mood:"angry"},
    {who:"auntie", text:"……雞？標會？"},
    {who:"fox", text:"真的。我們還有會單。", mood:"smug"},
    {who:"auntie", text:"……雞自己跑回來就好啦。你們是不是曬太陽曬昏頭了？"}
  ],
  endDead:[
    {who:"auntie", text:"……小白呢？"},
    {who:"tiger", text:"呃、那個……", mood:"shy"},
    {who:"fox", text:"……牠、牠很勇敢。", mood:"guilty"},
    {who:"auntie", text:"…………"}
  ],
  endEggs:[{who:"auntie", text:"蛋倒是收下了，謝謝啊。"}],
  endPay:[{who:"auntie", text:"說好的 60 gp，拿去吧。"}, {who:"narr", text:"拿到 60 gp。默默把雞蛋會單收進了背包。"}],
  endAliveTail:[
    {who:"tiger", text:"她不信！", mood:"angry"},
    {who:"raccoon", text:"……我就說不會有人信。", mood:"sly"}
  ],
  endDeadTail:[{who:"wolf", text:"……", mood:"sigh"}]
};
