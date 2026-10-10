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
  // 哥布林互酸（用哥布林語）：拿短棒的先倒下，拿短劍的酸他（10-09 彎刀改短劍，配合 CG）
  {on:"down", speaker:{type:"goblin", holds:"短劍"}, about:{type:"goblin", born:"短棒"}, lang:"哥布林語",
   lines:["就跟你說拿棍子沒用！", "棍子？你拿棍子打架？活該。"]},
  // 反過來：拿短劍的先倒下，拿短棒的回嘴
  {on:"down", speaker:{type:"goblin", holds:"短棒"}, about:{type:"goblin", born:"短劍"}, lang:"哥布林語",
   lines:["……短劍也沒比較好嘛。"]},
  // 還有躲著的：每隻用自己的方式覺得不對勁（草稿，大爺 10-02 要的提示）
  {on:"hunch", speaker:{id:"wolf", cranky:false},    draft:"香香", lines:["鼻子癢癢的……附近還有什麼東西的味道。"]},
  {on:"hunch", speaker:{id:"fox", cranky:false},     draft:"香香", lines:["太安靜了吧？這種時候通常還有一隻。"]},
  {on:"hunch", speaker:{id:"tiger", cranky:false},   draft:"香香", lines:["打完了？不對，我背後毛毛的。"]},
  {on:"hunch", speaker:{id:"raccoon", cranky:false}, draft:"香香", lines:["……有人在偷看。"]},
  // 壓力 75 以上的煩躁台詞（大爺 10-10 要的，草稿）：cranky:true＝說話的那隻壓力 75 以上
  {on:"hunch", speaker:{id:"wolf", cranky:true},    draft:"香香", lines:["……又來。還有一隻，我聞得到，煩死了。"]},
  {on:"hunch", speaker:{id:"fox", cranky:true},     draft:"香香", lines:["還有？到底要躲到什麼時候，快點出來啦。"]},
  {on:"hunch", speaker:{id:"tiger", cranky:true},   draft:"香香", lines:["出來！不要躲！我現在超不爽的！"]},
  {on:"hunch", speaker:{id:"raccoon", cranky:true}, draft:"香香", lines:["……躲啊，繼續躲。等一下就輪到你。"]},
  {on:"down", speaker:{id:"wolf", cranky:true},    about:{side:"pc"}, draft:"香香", lines:["起來……拜託，不要現在倒。"]},
  {on:"down", speaker:{id:"fox", cranky:true},     about:{side:"pc"}, draft:"香香", lines:["又一個！這樣下去根本算不完！"]},
  {on:"down", speaker:{id:"tiger", cranky:true},   about:{side:"pc"}, draft:"香香", lines:["誰打的！給我站好不要跑！"]},
  {on:"down", speaker:{id:"raccoon", cranky:true}, about:{side:"pc"}, draft:"香香", lines:["……好，這筆我記下了。"]}
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

// 路旁開箱與寶箱怪演出：GPT 草稿。
WORLD_CHAT.chestTry={
 fox:{draft:'GPT',try:'先找鎖舌的位置。',win:'開了。別把金幣撒出去。',lose:'鎖舌沒動。換你們試試。',winMood:'happy',loseMood:'confused'},
 tiger:{draft:'GPT',try:'我會輕輕轉！',win:'開了！我真的很輕！',lose:'它比我的手還倔。',winMood:'happy',loseMood:'blank'},
 wolf:{draft:'GPT',try:'先讓我看看卡在哪裡。',win:'好了。手先拿開再掀蓋。',lose:'沒開。至少手還在。',winMood:'smile',loseMood:'sigh'},
 raccoon:{draft:'GPT',try:'這個鎖，有點想法。',win:'它想通了。',lose:'它暫時不想跟我聊。',winMood:'happy',loseMood:'caught'}
};
WORLD_CHAT.chestEnd={draft:'GPT',choose:'誰來試著開鎖？每隻只能試一次。',gold:'箱裡有 {gold} 枚金幣，四隻各分 {share}。',reveal:'箱蓋突然張開，露出一排牙齒！',unlockMimic:'鎖鬆了……箱子怎麼在動？',lockedMimic:'鎖沒開……箱子怎麼在動？',failed:'四隻都試過了。記下位置，先走吧。',mimic:'寶箱長牙了！？',defeated:'這次確認了。它不會再咬人。',resume:'回到剛才停下的位置，繼續走。'};

/* 戰後閒聊（大爺 10-11：每隻一套）：打贏後挑最多 2 件笑點，每件 2 句：當事的那隻（self）講自己、旁邊隨機一隻（other）回應。
   兩邊都照那隻的個性寫；order:"other" 表示旁邊那隻先開口。{self}＝當事那隻的名字，{t}＝對象（敵人或撿到的東西）。全部香香草稿，大爺看過再改 */
const AFTER_TALK = {draft:"香香",
  crit:{order:"other",
    self:{fox:{mood:"smug",text:"弱點、角度、力道，全部算好的。這叫效率。"}, tiger:{mood:"fierce",text:"哈！看到沒！一拳……不對，一刀就飛啦！"},
          wolf:{mood:"serious",text:"……瞄準的時候，有想著大家。所以中了。"}, raccoon:{mood:"sly",text:"……順手。"}},
    other:{fox:{mood:"surprised",text:"{self}那一下的傷害，夠付三天房錢了。"}, tiger:{mood:"happy",text:"{self}好帥！下次換我！我也要那樣！"},
          wolf:{mood:"surprised",text:"{self}，剛剛那一下……好厲害。"}, raccoon:{mood:"surprised",text:"……{t}，飛好遠。"}}},
  fumble:{order:"other",
    self:{fox:{mood:"awkward",text:"……那是測試。我在測試空氣的阻力。"}, tiger:{mood:"angry",text:"那隻怪偷偷動了！不然我一定打中！"},
          wolf:{mood:"sigh",text:"……抱歉。下一次，一定打中。"}, raccoon:{mood:"caught",text:"……沒看到。什麼都沒發生。"}},
    other:{fox:{mood:"smug",text:"{self}，剛剛那一下的命中率，我記下來了喔。"}, tiger:{mood:"happy",text:"哈哈哈！{self}打到空氣了！空氣痛不痛！"},
          wolf:{mood:"serious",text:"{self}，沒關係。我也有揮空過。"}, raccoon:{mood:"sly",text:"……揮空。我看到了。"}}},
  down:{order:"other",
    self:{fox:{mood:"guilty",text:"……醫藥費，可以算公帳嗎？"}, tiger:{mood:"confused",text:"咦？我怎麼躺在地上？我們贏了嗎？贏了吧！"},
          wolf:{mood:"resigned",text:"……讓大家擔心了。下次我會站得更穩。"}, raccoon:{mood:"down",text:"……睡了一下。"}},
    other:{fox:{mood:"confused",text:"{self}，你倒下的時候，我的計畫全部要重算耶。"}, tiger:{mood:"angry",text:"{self}！誰打你的！我去揍他！……啊，已經揍完了。"},
          wolf:{mood:"serious",text:"{self}，還好嗎？哪裡痛要說。"}, raccoon:{mood:"surprised",text:"……{self}，還活著？"}}},
  lastKill:{order:"self",
    self:{fox:{mood:"smug",text:"最後一擊是我的，戰利品分配的時候記得算進去。"}, tiger:{mood:"fierce",text:"最後一隻是我的！我是最強的！"},
          wolf:{mood:"smile",text:"……結束了。大家都平安就好。"}, raccoon:{mood:"sly",text:"……收尾。順便看看牠身上有什麼。"}},
    other:{fox:{mood:"content",text:"好吧，這次算你的功勞。"}, tiger:{mood:"angry",text:"不公平！那隻我也要打！"},
          wolf:{mood:"smile",text:"{self}，辛苦了。"}, raccoon:{mood:"normal",text:"……嗯。"}}},
  pickup:{order:"other",
    self:{fox:{mood:"smug",text:"免費的裝備，不撿白不撿。省下來的錢可多了。"}, tiger:{mood:"happy",text:"撿到了！這個看起來比較大！比較強！"},
          wolf:{mood:"serious",text:"……能用的東西，不能浪費。"}, raccoon:{mood:"sly",text:"……現在是我的了。"}},
    other:{fox:{mood:"smug",text:"{self}，那把{t}拿去店裡大概能賣個好價錢。"}, tiger:{mood:"confused",text:"{self}，那是誰的{t}？好像是敵人的耶？"},
          wolf:{mood:"confused",text:"{self}，那把{t}……要先擦乾淨喔。"}, raccoon:{mood:"surprised",text:"……{self}，搶我的工作。"}}},
  prone:{order:"other",
    self:{fox:{mood:"awkward",text:"……我是故意蹲低，降低被擊中的面積。"}, tiger:{mood:"angry",text:"地板偷襲我！地板是壞人！"},
          wolf:{mood:"resigned",text:"……腳滑了。不會再有下次。"}, raccoon:{mood:"down",text:"……地板，很硬。"}},
    other:{fox:{mood:"smug",text:"{self}剛剛那一跤，摔得很有學術價值。"}, tiger:{mood:"happy",text:"{self}剛剛咚的一聲！好大聲！"},
          wolf:{mood:"serious",text:"{self}，有沒有撞到頭？"}, raccoon:{mood:"sly",text:"……咚。"}}},
  luck:{order:"self",
    self:{fox:{mood:"smug",text:"運氣也是實力的一部分。這很合理。"}, tiger:{mood:"happy",text:"再來一次就中了！我就說我很強吧！"},
          wolf:{mood:"smile",text:"……運氣好。下次要靠自己。"}, raccoon:{mood:"sly",text:"……運氣，也是偷來的。"}},
    other:{fox:{mood:"content",text:"毛球族的好運，真的很划算呢。"}, tiger:{mood:"happy",text:"好運好運！分我一點！"},
          wolf:{mood:"smile",text:"{self}，太好了。"}, raccoon:{mood:"normal",text:"……好運。"}}},
  frenzy:{order:"other",
    self:{fox:{mood:"guilty",text:"……剛剛的熟練格，好像全部燒光了。我不想看帳本。"}, tiger:{mood:"blank",text:"……我剛剛做了什麼？為什麼大家都退那麼遠？"},
          wolf:{mood:"sigh",text:"……我好像，一直在用同一招。對不起。"}, raccoon:{mood:"caught",text:"……口袋，怎麼這麼重。"}},
    other:{fox:{mood:"confused",text:"{self}……你剛剛是不是有點恐怖？"}, tiger:{mood:"surprised",text:"{self}剛剛好兇！比我還兇！"},
          wolf:{mood:"serious",text:"{self}，回去找大爺摸摸頭吧。"}, raccoon:{mood:"surprised",text:"……{self}，嚇人。"}}}
};
