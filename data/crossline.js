/* 三線交會的小鉤子（大爺 10-28：做過 A，B 那邊會變）。台詞全部是香香的草稿（draft），等大爺改；數字暫定
   邏輯 js/crossline.js；docs/主線.md「三線交會」
   - 森林主線打完 → 公會艾妲「這個城鎮／閒聊」換一套（guildAfterForest）
   - 森林主線＋驅除哥布林都打完 → 每日委託裡有哥布林的出現得比較少（goblinQuestWeight）
   - 洞窟打完（紅龍幼龍倒下）→ 城鎮街角：狗頭人薩滿傳教（preach），默默收下龍神傳單
   - 死亡騎士、惡魔都打退過 → 大地圖走路閒聊一段伏筆（omen） */
const CROSSLINE = {
  draft:"香香",
  guildAfterForest:{
    town:["森林那邊安靜下來了——不對，是終於又有鳥叫了。","奇美拉項圈上那個家徽，報上去以後……上面還在開會。已經第三次了。"],
    chat:[["德魯伊的事，公會只能記一筆。「森林不歸公會管」，這句話我已經聽了五遍。"],
          ["鳥回來了，蟲也回來了。上週有人來登記：被蚊子咬到睡不著。……我收下了。"]]
  },
  goblinQuestWeight:.5,
  preach:{
    street:{x:24, y:58, place:"街角", who:"狗頭人"},
    item:"龍神傳單",
    lines:[
      {who:"narr", text:"街角圍了一小圈人。中間站著一隻狗頭人，揮著掛滿羽毛的木杖。", on:"kobold_shaman"},
      {who:"kobold_shaman", text:"龍神沒有輸！龍神只是……去休息！龍神會回來！", on:"kobold_shaman"},
      {who:"kobold_shaman", text:"現在入教，只要三個銅板！龍神回來的時候，先保佑你！", on:"kobold_shaman"},
      {who:"tiger", text:"……牠說的龍神，是我們打的那隻嗎？", mood:"confused", on:"kobold_shaman"},
      {who:"fox", text:"噓。", mood:"awkward", on:"kobold_shaman"},
      {who:"kobold_shaman", text:"（看到毛毛們，尾巴豎了起來）……！", on:"kobold_shaman"},
      {who:"kobold_shaman", text:"我、我沒看到毛球！傳單給你們，快走快走！", on:"kobold_shaman"},
      {who:"narr", text:"狗頭人把一張傳單塞過來，抱著木杖跑了。", on:"-"},
      {who:"raccoon", text:"……收下了。", mood:"sly", on:"-"},
      {who:"wolf", text:"上面畫的龍……比本人帥很多。", mood:"serious", on:"-"}
    ],
    done:"回到街上"
  },
  omen:{lines:[
    {who:"fox", text:"最近遇到的怪人，打倒了都不會死耶。", mood:"confused"},
    {who:"tiger", text:"對啊！一個變成黑霧，一個變成黑煙！", mood:"angry"},
    {who:"raccoon", text:"……一個說「有意思」。一個說「這只是開始」。", mood:"sly"},
    {who:"wolf", text:"……被打敗了還講得那麼有自信，通常都不是好事。", mood:"serious"},
    {who:"fox", text:"先記在小筆記上吧。", mood:"awkward"}
  ]}
};
