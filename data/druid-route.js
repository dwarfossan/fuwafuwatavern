/* 森林線的另一條路：聽德魯伊的（大爺 10-29）。台詞全部是香香的草稿（draft），數字暫定
   邏輯 js/druid-route.js；docs/主線.md「森林」
   - 撞見那段，她叫醒奇美拉之前選：維持森林生態（照舊打奇美拉）／聽德魯伊的。**選了就不能反悔**
   - 聽德魯伊的：state.main.forestPath="druid"，森林主線 → chief（大地圖城鎮—洞窟那條路紅 ❗「哥布林酋長的營地」）
     → 打倒酋長＝暴動結束（劇情 druidChiefAfter）→ report（公會回報，艾妲台詞不一樣）→ done
   - 之後：哥布林委託不再出現；「驅除哥布林」還沒做完的一起結案（照樣回公會領錢）；
     森林繼續安靜（食人花、被花粉迷昏的野獸，沒有報酬；奇美拉不會出現——不能反悔）；德魯伊偶爾留藥水；不會有「德魯伊的抗議」
   - 拿不到巢穴的項圈；但墓地線走到女貴族那段（noble／ancestor）時，城鎮會遇到來買東西的德魯伊，
     她給毛毛們奇美拉的名牌（state.main.gravePlate）→ 談判時一樣有「不用打」的第三條路 */
const DRUID_ROUTE = {
  draft:"香香",
  road:["town","cave"],
  foes:["goblin_chief","goblin_hero","goblin_shaman","goblin_archer","goblin_archer","goblin","goblin","goblin"],
  loot:{gold:[80,140], items:3},
  pin:"哥布林酋長的營地",
  // 撞見：她發現毛毛們之後、叫醒奇美拉之前（接在 FOREST.main.reveal 的「……誰在那裡？」後面）
  ask:[
    {who:"druid", text:"又是你們這群毛球。", on:"druid", face:"contempt"},
    {who:"druid", text:"……看到了就看到了。要嘛滾出我的森林，要嘛——幫我把事情做完。", on:"druid", face:"cold"}],
  pick:{
    eco:{label:"維持森林生態", sub:"打倒奇美拉"},
    druid:{label:"聽德魯伊的", sub:"不動奇美拉，去打哥布林酋長・選了就不能反悔"}},
  eco:[
    {who:"fox", text:"森林不是妳一個人的。奇美拉不能留。", mood:"serious", on:"druid", face:"angry"},
    {who:"druid", text:"……那就隨你們。——起來！", on:"druid", face:"shout"},
    {who:"narr", text:"奇美拉睜開了六隻眼睛。德魯伊退進樹林，不見了。", on:"chimera"},
    {who:"raccoon", text:"……跑了。", mood:"normal", on:"chimera"}],
  druid:[
    {who:"druid", text:"聰明。", on:"druid", face:"acknowledge"},
    {who:"druid", text:"這隻是哪個貴族養膩了，丟進森林的。我只是讓牠派上用場。", on:"druid", face:"cold"},
    {who:"druid", text:"哥布林一直跑出來，是因為牠們有個酋長。現在在城鎮和洞窟之間那條路上紮營。", on:"druid", face:"cold"},
    {who:"druid", text:"把酋長解決掉，哥布林就散了。森林安靜，你們的鎮也安靜。", on:"druid", face:"cruel_smirk"},
    {who:"tiger", text:"……那森林的鳥呢？", mood:"confused", on:"druid", face:"cruel_smirk"},
    {who:"druid", text:"鳥會習慣的。", on:"druid", face:"cold"},
    {who:"wolf", text:"…………", mood:"serious", on:"druid", face:"cold"},
    {who:"fox", text:"……說好了。我們去打酋長。", mood:"awkward", on:"-"}],
  revealNext:{eco:"戰鬥開始！", druid:"回大地圖"},
  // 酋長營地
  shout:"毛球？森林的女人派來的？——那就連妳們一起搶！",
  lootLog:"酋長的箱子裡塞滿了搶來的東西，還有 {g} gp（四隻平分）",
  end:"哥布林酋長倒下了。剩下的哥布林四散逃走。",
  chiefAfter:[
    {who:"narr", text:"酋長倒下以後，剩下的哥布林丟下武器，往四面八方逃走了。", on:"-"},
    {who:"narr", text:"樹影裡，德魯伊靜靜地看著這一切。", on:"druid", face:"cold"},
    {who:"druid", text:"做得好。之後牠們不會再成群結隊了。", on:"druid", face:"acknowledge"},
    {who:"tiger", text:"那、那森林會恢復熱鬧嗎？", mood:"normal", on:"druid", face:"acknowledge"},
    {who:"druid", text:"森林會恢復「安靜」。這樣就夠了。", on:"druid", face:"cold"},
    {who:"narr", text:"她轉身走進樹林。", on:"-"},
    {who:"wolf", text:"……鎮上不會再被搶了。森林也不會再有鳥叫了。", mood:"serious", on:"-"},
    {who:"fox", text:"回公會跟艾妲報告吧。", mood:"awkward", on:"-"}],
  chiefNext:"回大地圖",
  // 公會回報（艾妲說的）
  report:["哥布林的酋長倒了？……這下鎮外終於清靜了。","可是你們說，森林裡那隻奇美拉……還在？","（艾妲沉默了一下）公會只管鎮上的事。森林……不歸我們管。","辛苦了，毛絨絨小隊。"],
  // 之後公會艾妲「這個城鎮／閒聊」（取代 CROSSLINE.guildAfterForest）
  guildAfter:{
    town:["鎮外的哥布林不見了。商隊說這條路從來沒這麼好走過。","……森林那邊，還是一樣安靜。安靜得有點怪。"],
    chat:[["哥布林委託？最近一張都沒有了。委託板空了一塊，看起來怪寂寞的。"],
          ["獵人說森林裡的野獸都在打瞌睡。……這也算好事吧？"]]
  },
  // 再進森林：安靜（沒有報酬）
  quiet:{
    intro:[["wolf","……還是沒有鳥叫。"],["tiger","野豬睡得好熟喔。"],["raccoon","……不要吵醒。"]],
    foes:[
      {type:"mantrap", x:3, y:13, squad:3}, {type:"mantrap", x:5, y:11, squad:3},
      {type:"boar", x:6, y:16, squad:4}, {type:"boar", x:8, y:15, squad:4}]
  },
  // 墓地線：城鎮遇到買東西的德魯伊，拿到名牌
  shop:{street:{place:"市場", who:"德魯伊", x:74, y:51},
    lines:[
      {who:"narr", text:"市場的攤子前，德魯伊抱著一大袋東西。袋口露出一截——是肥料。", on:"druid", face:"impatient"},
      {who:"tiger", text:"德魯伊也會來鎮上買東西喔？", mood:"surprised", on:"druid", face:"impatient"},
      {who:"druid", text:"……食人花要吃的。森林裡的土不夠肥。", on:"druid", face:"cold"},
      {who:"fox", text:"對了，我們在查墓地的事。有個貴族要把墓地剷平……", mood:"normal", on:"druid", face:"cold"},
      {who:"druid", text:"貴族？", on:"druid", face:"skeptical"},
      {who:"druid", text:"……那隻奇美拉剛來的時候，脖子上掛著這個。我嫌吵，拔下來了。", on:"druid", face:"contempt"},
      {who:"narr", text:"一塊鑲金的小名牌，刻著「小咪咪」，背面是一個家徽。", on:"druid", face:"contempt"},
      {who:"wolf", text:"……這個家徽，在哪裡看過。", mood:"serious", on:"druid", face:"contempt"},
      {who:"druid", text:"拿去。人造的東西，我留著也沒用。", on:"druid", face:"cold"},
      {who:"raccoon", text:"……收下了。", mood:"sly", on:"-"}],
    next:"回到街上"},
  // 墓地談判（拿名牌的版本，取代 GRAVE.ancestorCollar／pick.collar／picked.collar 裡講項圈的句子）
  ancestorPlate:[{who:"wolf", text:"……也跟德魯伊給的名牌上一樣。", mood:"serious", on:"-"}],
  pickPlate:{label:"拿出奇美拉的名牌", sub:"德魯伊給的那個・不用打"},
  pickedPlate:[
    {who:"raccoon", text:"……這個，妳認得嗎？", mood:"sly", on:"noblewoman", face:"surprised"},
    {who:"narr", text:"鑲金的小名牌。背面刻著同一個家徽，正面是「小咪咪」三個字。", on:"noblewoman", face:"surprised"},
    {who:"fox", text:"森林裡那隻奇美拉，是妳家丟的吧？牠現在還在森林裡喔。", mood:"smug", on:"noblewoman", face:"embarrassed"},
    {who:"noblewoman", text:"……", on:"noblewoman", face:"embarrassed"},
    {who:"noblewoman", text:"這、這也在本小姐的計畫之中……度假村的事，我會再考慮。護衛，走！", on:"noblewoman", face:"angry"},
    {who:"vampire", text:"……你們比我想的有用。", on:"vampire", face:"smile"}]
};
