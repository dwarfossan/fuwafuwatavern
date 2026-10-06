/* 戰鬥台詞：在角色頭上跳氣泡框（一兩秒），紀錄裡也留一行
   on：什麼時候說
     down＝有人倒下（我方生命歸零或敵人被打倒），about 是倒下的那個
     hunch＝看得到的敵人全倒了，但還有躲著的（提示玩家去搜索，不能講位置、不能講是誰），about 是最後倒下的那隻
   speaker：誰說（條件全部符合的活著、沒躲起來的角色；有好幾個符合就隨機挑一個）
   about：跟誰有關（條件全部符合才說）
     條件欄位：side 陣營（pc／foe）、id 角色（fox、tiger、wolf、raccoon）、type 敵人種類（goblin…）、
               holds 現在手上拿的物品名稱、born 開場時手上拿的物品名稱
   lines：台詞，隨機挑一句；同一句一場只說一次（講完了就不再說）
   lang：用什麼語言講（不寫＝通用語，大家都聽得懂）。其他語言：我方活著的角色做被動智力檢定
         （10 + 智力調整值 ≥ 語言難度，不擲骰），有人過就顯示意思並註明誰聽懂；都沒過就只顯示「異族語」
   draft：AI 寫的草稿，寫誰寫的（"香香"、"GPT"）。寫好在聊天裡列給大爺看；大爺看過、改過才拿掉
   台詞歡迎 AI 寫（大爺 2026-10-02：喜歡看你們怎麼寫），寫好在聊天裡提醒大爺，他看過、改過才拿掉 draft */
// 語言難度（被動智力檢定的 DC）；沒列在這裡的語言用 15
const LANGS = {"哥布林語":12};

const BARKS = [
  // 哥布林互酸（用哥布林語）：拿短棒的先倒下，拿彎刀的酸他
  {on:"down", speaker:{type:"goblin", holds:"彎刀"}, about:{type:"goblin", born:"短棒"}, lang:"哥布林語",
   lines:["就跟你說拿棍子沒用！", "棍子？你拿棍子打架？活該。"]},
  // 反過來：拿彎刀的先倒下，拿短棒的回嘴
  {on:"down", speaker:{type:"goblin", holds:"短棒"}, about:{type:"goblin", born:"彎刀"}, lang:"哥布林語",
   lines:["……彎刀也沒比較好嘛。"]},
  // 還有躲著的：每隻用自己的方式覺得不對勁（草稿，大爺 10-02 要的提示）
  {on:"hunch", speaker:{id:"wolf"},    draft:"香香", lines:["鼻子癢癢的……附近還有哥布林的味道。"]},
  {on:"hunch", speaker:{id:"fox"},     draft:"香香", lines:["太安靜了吧？這種時候通常還有一隻。"]},
  {on:"hunch", speaker:{id:"tiger"},   draft:"香香", lines:["打完了？不對，我背後毛毛的。"]},
  {on:"hunch", speaker:{id:"raccoon"}, draft:"香香", lines:["……有人在偷看。"]}
];

/* 大地圖對話：GPT 草稿；每趟間隔、不連續重複，到達可略過。 */
const WORLD_CHAT={
 banter:[
  {draft:'GPT',lines:[{who:'tiger',text:'走路也算練腿吧！',mood:'happy'},{who:'wolf',text:'算。不要順便練嗓子。',mood:'serious'}]},
  {draft:'GPT',lines:[{who:'fox',text:'沿著路走，先別抄近路。',mood:'normal'},{who:'raccoon',text:'近路通常比較遠。',mood:'sly'}]},
  {draft:'GPT',lines:[{who:'tiger',text:'回去能多吃一份嗎？',mood:'happy'},{who:'raccoon',text:'先多走一份。',mood:'sly'}]}
 ],
 arrival:{draft:'GPT',lines:[{who:'fox',text:'到了。先看看入口。',mood:'normal'},{who:'tiger',text:'好！大家一起進去！',mood:'happy'}]},
 chest:{draft:'GPT',lines:[{who:'narr',text:'路旁的草叢裡，露出一只舊寶箱。'},{who:'tiger',text:'寶箱！我們發現寶箱了！',mood:'happy'},{who:'fox',text:'先別碰。鎖和箱子都要看清楚。',mood:'confused'},{who:'wolf',text:'很好，至少這次先停下了。',mood:'serious'},{who:'raccoon',text:'它還沒跑。',mood:'sly'},{who:'narr',text:'小傢伙們記下寶箱的位置，繼續沿著原路前進。'}]}
};
