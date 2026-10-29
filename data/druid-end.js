/* 森林線收尾：德魯伊的抗議（大爺 10-29「可」）。台詞全部是香香的草稿（draft），數字暫定
   邏輯 js/druid-end.js；docs/主線.md「森林」
   ★ 德魯伊＝諷刺環保團體（大爺 10-29）：只保護稀有、好看的物種，舉牌、連署、募款，對真正的生態失職
   - 森林主線回報完（state.main.forest==="done"）→ 公會紅 ❗「公會門口的抗議」→ 劇情 druidProtest
   - 揭穿之後選一條（state.main.druidEnd）：
     report＝報給公會：她「另有任用」、森林換新的看守；公會給一筆檢舉獎金（reportGold，全隊）
     atone＝叫她自己收拾：她回森林清食人花；之後進森林偶爾會撿到她留下的藥水（giftChance） */
const DRUID_END = {
  draft:"香香",
  guildButton:"❗ 公會門口的抗議",
  reportGold:100,
  giftChance:.3,
  giftItem:"治療藥水",
  next:"回到公會",
  intro:[
    {who:"narr", text:"公會門口圍了一圈人。中間站著那位德魯伊，高舉一塊木牌：「還我奇美拉！」", on:"druid", face:"shout"},
    {who:"druid", text:"殘忍！野蠻！森林裡唯一一隻奇美拉，被一群毛球殺掉了！", on:"druid", face:"shout"},
    {who:"tiger", text:"……唯一一隻，不就是被丟進森林的那隻嗎？", mood:"confused", on:"druid", face:"impatient"},
    {who:"druid", text:"牠已經是森林的一份子了。牠很稀有，牠很美。", on:"druid", face:"cold"},
    {who:"fox", text:"那鳥呢？野豬呢？被食人花擠掉的那些花呢？", mood:"serious", on:"druid", face:"cold"},
    {who:"druid", text:"……那些很常見。", on:"druid", face:"impatient"},
    {who:"druid", text:"我要求公會公開道歉，並成立「奇美拉紀念基金」。連署在這裡，順便樂捐，一人三個銅板。", on:"druid", face:"contempt"},
    {who:"wolf", text:"……還要錢。", mood:"serious", on:"druid", face:"contempt"}
  ],
  // 森林巢穴前撿到的花粉袋（調查「掉在地上的小袋子」成功）才有這兩句
  pouch:[
    {who:"raccoon", text:"……這個，妳認得嗎？", mood:"sly", on:"druid", face:"surprised"},
    {who:"narr", text:"默默拿出那個繡著葉子花紋的小袋子。空的，袋口還沾著黃色的花粉。", on:"druid", face:"surprised"}
  ],
  expose:[
    {who:"fox", text:"我們在巢穴前面親眼看到了。妳用食人花的花粉讓奇美拉聽話，叫牠去清哥布林窩。", mood:"serious", on:"druid", face:"alert"},
    {who:"druid", text:"那、那是生態調節！哥布林是害蟲，我只是讓森林——", on:"druid", face:"alert"},
    {who:"wolf", text:"讓森林只剩下一隻奇美拉。", mood:"serious", on:"druid", face:"hurt"},
    {who:"narr", text:"圍觀的人開始竊竊私語。有人默默把剛簽好的連署撕掉了。", on:"druid", face:"hurt"},
    {who:"druid", text:"…………", on:"druid", face:"hurt"}
  ],
  ask:{who:"fox", text:"……這件事，要怎麼處理？", mood:"awkward", on:"druid", face:"sad"},
  pick:{
    report:{label:"報給公會", sub:"她會被撤掉森林看守的位置"},
    atone:{label:"叫她自己收拾", sub:"把食人花清乾淨，讓森林恢復"}
  },
  report:[
    {who:"fox", text:"艾妲，這件事交給公會。", mood:"serious", on:"druid", face:"angry"},
    {who:"druid", text:"你們會後悔的！森林需要我！", on:"druid", face:"shout"},
    {who:"narr", text:"三天後，公會貼出一張公告：林間德魯伊「另有任用」，森林改由新的看守負責。公會發了一筆檢舉獎金，全隊 {gold} gp。", on:"-"},
    {who:"tiger", text:"「另有任用」是什麼意思？", mood:"confused", on:"-"},
    {who:"raccoon", text:"……意思是，換個地方，繼續舉牌。", mood:"sly", on:"-"}
  ],
  atone:[
    {who:"tiger", text:"妳不是說妳愛森林嗎？那就自己去把食人花拔乾淨！", mood:"angry", on:"druid", face:"impatient"},
    {who:"druid", text:"……我是德魯伊。拔草不是我的工作。", on:"druid", face:"contempt"},
    {who:"wolf", text:"顧好整座森林，就是妳的工作。", mood:"serious", on:"druid", face:"sad"},
    {who:"druid", text:"…………知道了。", on:"druid", face:"acknowledge"},
    {who:"narr", text:"她把木牌往地上一丟，頭也不回地走向森林。木牌背面寫著一行小字：「募款專線」。", on:"-"},
    {who:"fox", text:"以後去森林，說不定會遇到她喔。", mood:"normal", on:"-"}
  ],
  // 叫她自己收拾之後：進森林偶爾撿到她留的藥水（說話的是第一隻還站著的毛毛）
  gift:"樹根旁邊……有一瓶藥水？",
  giftLog:"藥水底下壓著一張紙條：「別誤會。森林裡死掉東西，很難清。」{who}撿到了德魯伊留下的{item}"
};
