/* 梟熊寶寶劇情（大爺 10-21）：文字與數字。台詞全部是香香的草稿（draft），等大爺改。
   第一段：第一次接「梟熊出沒」委託才觸發，只有一次（state.owlbear 記結果）
   - 梟熊媽媽被打死 → 窩裡的寶寶衝出來（數值照 SRD 獒犬）。戰鬥照打：
       打死寶寶＝這條線斷了，四隻壓力 +15、各講一句；敲暈寶寶＝打完牠醒來逃走（之後第二段：跟蹤、獵人）
   - 梟熊媽媽被敲暈 → 委託照常完成，寶寶不出現；之後旅途中看到一大一小的梟熊腳印（讓玩家知道錯過了什麼）
   - 輸了或撤退：什麼都不記，下次接梟熊委託再來一次
   第二段（stage：cubFled → followed → seen → rescued）
   - cubFled 之後在大地圖走路：每趟閒聊時用四隻裡最高的被動感知對 notice.dc，過了＝發現被跟蹤（followed）
   - followed：大地圖森林那條路出現 ❗「草叢裡的眼睛」→ 走過去看劇情，寶寶逃走（seen）
   - seen、而且換日以後（長休過）：同一條路出現 ❗「獵人的網子」→ 打獵人，寶寶被網子困在旁邊 → 打贏＝救出（rescued）
   第三段（stage：rescued → joined）
   - 野外露營時留食物給牠，每次靠近一點；approach.need 次之後加入（joined），取名字
   - 加入後：戰鬥中跟坐騎一樣「呼喚」出來（玩家操作），露營吃飯會長大：小型 → 中型（騎得上）→ 大型（2×2） */
const OWLBEAR_STORY = {
  quest:"owlbear",            // 觸發的委託（data/quests.js 的 id）
  cubStress:15,               // 打死寶寶：四隻各加多少壓力（暫定）
  draft:"香香",
  // 寶寶衝出來（梟熊媽媽被打死的那一下）
  appear:{
    log:"窩裡傳出尖尖的叫聲——一隻小小的梟熊衝了出來，擋在梟熊媽媽前面！",
    hint:"（提示：行動選單的「敲暈」打開，近戰打到 0 血就不會打死）",
    lines:[["tiger","……寶寶？"], ["fox","牠是在保護窩……"], ["wolf","……我們打倒的，是牠媽媽。"], ["raccoon","……牠要撲過來了。"]]
  },
  // 寶寶被打死
  killed:{
    log:"梟熊寶寶倒在媽媽身邊，不動了。",
    lines:[["tiger","……不要……"], ["fox","……我們不該這樣的。"], ["wolf","……對不起。"], ["raccoon","…………"]],
    why:"打倒了梟熊寶寶"
  },
  // 寶寶被敲暈
  knocked:{
    lines:[["tiger","牠只是昏過去了……對吧？"], ["wolf","嗯。等一下就會醒。"], ["fox","讓牠睡，我們別吵牠。"], ["raccoon","……下手很輕。"]]
  },
  // 勝利畫面最後一段
  end:{
    cubFled:"你們離開前，梟熊寶寶醒了過來。牠看了你們一眼，一溜煙鑽進樹林裡。",
    cubDead:"窩裡安靜下來了。沒有人說話。",
    motherKO:"梟熊搖搖晃晃地爬起來，頭也不回地鑽進樹林裡。"
  },
  // 敲暈梟熊媽媽之後，下一次在大地圖上走路的閒聊（大小腳印）
  tracks:{draft:"香香", lines:[
    {who:"fox", text:"地上有梟熊的腳印……一大一小。", mood:"surprised"},
    {who:"tiger", text:"小的？是寶寶嗎？", mood:"surprised"},
    {who:"wolf", text:"……之前那隻梟熊，原來有孩子。", mood:"serious"},
    {who:"raccoon", text:"……還好，牠媽媽還在。", mood:"sly"}
  ]},
  // ---------- 第二段 ----------
  notice:{dc:12, lines:[
    {who:"wolf", text:"……等一下。後面那叢草，一直跟著我們動。", mood:"serious"},
    {who:"raccoon", text:"……有一雙眼睛。小小的，圓圓的。", mood:"sly"},
    {who:"tiger", text:"是那隻寶寶嗎？！", mood:"surprised"},
    {who:"fox", text:"別回頭。讓牠跟，我們找個地方等牠。", mood:"normal"}
  ]},
  pins:{
    owl1:{title:"草叢裡的眼睛", text:"森林那條路上，有東西一直跟在後面。去看看吧。"},
    owl2:{title:"獵人的網子", text:"森林那條路傳來尖尖的叫聲，還有人在笑。"}
  },
  seen:[
    {who:"narr", text:"小傢伙們在路邊坐下，把午餐的麵包放在石頭上。"},
    {who:"narr", text:"過了好一會兒，草叢裡探出一顆毛茸茸的頭——是那隻梟熊寶寶。"},
    {who:"tiger", text:"（小聲）牠來了牠來了……", mood:"happy"},
    {who:"narr", text:"寶寶叼起麵包，看了小傢伙們一眼，又一溜煙鑽回樹林裡。"},
    {who:"fox", text:"牠還在怕我們。……也是啦。", mood:"awkward"},
    {who:"wolf", text:"肯吃東西，就好。", mood:"smile"},
    {who:"raccoon", text:"……這附近有獵人的陷阱。牠最好小心一點。", mood:"serious"}
  ],
  hunt:{
    log:"網子裡的梟熊寶寶拼命掙扎，旁邊幾個獵人在數等一下能賣多少錢。",
    lines:[["fox","……那是我們的寶寶。"], ["tiger","放開牠！"]],
    end:"小傢伙們割開網子。梟熊寶寶縮成一團發抖，可是這次，牠沒有逃走。"
  },
  // ---------- 第三段：露營時慢慢靠近（每次一段，最後一段＝加入） ----------
  approach:{need:3, steps:[
    [{who:"narr", text:"營火的另一邊，有一雙圓圓的眼睛在看。小傢伙們留了一份晚餐在旁邊。"},
     {who:"tiger", text:"我把我的分一半給牠！", mood:"happy"}, {who:"raccoon", text:"……妳只是不想吃青菜。", mood:"sly"}],
    [{who:"narr", text:"梟熊寶寶走到火光邊緣，把晚餐吃得乾乾淨淨，然後在不遠的地方趴下來。"},
     {who:"wolf", text:"……今天，牠離我們比較近。", mood:"smile"}],
    [{who:"narr", text:"半夜，嬌嬌醒來的時候，發現寶寶縮在她身邊睡著了。"},
     {who:"tiger", text:"（不敢動）……大家……牠……在我旁邊……", mood:"surprised"},
     {who:"fox", text:"那就別動了。牠決定跟我們走了。", mood:"normal"},
     {who:"narr", text:"梟熊寶寶加入了小傢伙們！"}]
  ]},
  // ---------- 加入以後 ----------
  pet:{
    defaultName:"咕咕", nameFirst:"幫梟熊寶寶取個名字吧", nameHint:"最多 8 個字；不填就叫咕咕。",
    summon:"呼喚", summonTip:"叫牠到旁邊的空格。",
    down:"昏過去了……", hurtBlock:"牠受傷了，長休後才叫得出來",
    nameBarks:{draft:"香香",
      first:[["tiger","{name}！{name}！牠看我了！"],["fox","……還不錯的名字。"],["wolf","{name}，以後請多指教。"],["raccoon","……{name}。嗯。"]],
      gugu:[["tiger","咕咕！因為牠會咕咕叫！"],["raccoon","……大爺，取名字不能偷懶。"]],
      rename:[["fox","又改名了？{name}會搞混的。"],["tiger","{name}！……牠好像比較喜歡原本那個。"]]}
  },
  // 露營吃飯長大：fed＝吃了幾次（加入那天不算）；到了就換成下一階的數值和外觀
  growth:[
    {type:"owlbear_cub", fed:0},
    {type:"owlbear_young", fed:3, lines:[{who:"narr", text:"{name}長大了一圈！現在小傢伙們騎得上牠了。"}, {who:"tiger", text:"我先！我先騎！", mood:"happy"}]},
    {type:"owlbear", fed:8, lines:[{who:"narr", text:"{name}長成了一隻大梟熊！"}, {who:"wolf", text:"……牠媽媽，一定也是這麼大。", mood:"serious"}, {who:"raccoon", text:"……現在換牠保護我們了。", mood:"sly"}]}
  ]
};
