/* 紅龍夫人・怪獸家長（大爺 10-28：紅龍夫人＝幼龍的媽媽，幼龍是女的；香香提案大爺「都照你的」）。台詞全部是香香的草稿（draft）；數字暫定
   流程（邏輯 js/dragon-lady.js）：
   - 洞窟的紅龍幼龍不會死：打到 0 血哭著飛走（不擲記仇、敲暈對她沒用），經驗、報酬照給
   - 洞窟回報完（state.main.cave==="done"）→ 城鎮街口掛紅 ❗「紅禮服的貴婦」→ 劇情 dragonLady
   - 她是來興師問罪的家長；三個選項都不打：
       道歉＝她消氣，給 50 gp ／ 講道理＝魅力最高那隻 d20＋魅力 對 DC 13，過了她反過來罵女兒、給一件魔法物品；沒過被嗆一頓
       ／ 頂嘴＝她現出原形吼一聲，全員壓力 +10
   - 看過狗頭人傳教的，香香多吐槽一句（「龍神會回來」，回來的是龍神的媽媽） */
const DRAGON_LADY = {
  draft:"香香",
  street:{place:"街口", who:"紅禮服的貴婦", x:40, y:84},
  dc:13, gold:50, stress:10,
  // 幼龍（洞窟頭目）打到 0 血
  wyrmLog:"{name}哇的一聲哭了出來，拍著小翅膀，從洞頂的裂縫飛走了。",
  wyrmSay:"嗚、嗚嗚……！",
  // 洞窟第一次打完：原形立繪的小紅龍哭著飛走（劇情 wyrmFlee，10-28 大爺：兩張都是立繪）
  flee:[
    {who:"narr", text:"洞頂的裂縫底下，小紅龍縮在一塊岩石上，翅膀抖個不停。", on:"red_wyrmling"},
    {who:"wyrmling", text:"你、你們……！你們這些臭毛球！把我的玩具都嚇跑了！", on:"red_wyrmling"},
    {who:"wyrmling", text:"嗚哇——我要跟媽媽說！", on:"red_wyrmling"},
    {who:"narr", text:"她拍著小翅膀，從裂縫鑽出去，飛走了。", on:"-"},
    {who:"narr", text:"岩石後面，幾隻狗頭人探出頭來，看著龍神哭著飛走的方向。", on:"kobold_shaman"},
    {who:"kobold_shaman", text:"龍神……哭著找媽媽？", on:"kobold_shaman"},
    {who:"fox", text:"牠只是個小孩啦。叫你們跳舞、敲鑼、搬金幣，都是因為好玩。", mood:"normal", on:"kobold_shaman"},
    {who:"wolf", text:"拜之前，先想想自己在拜什麼。", mood:"serious", on:"kobold_shaman"},
    {who:"kobold_shaman", text:"…………", on:"kobold_shaman"},
    {who:"kobold_shaman", text:"懂了！那是壞龍！假的龍神！真正的龍神，才不會哭！", on:"kobold_shaman"},
    {who:"narr", text:"狗頭人們歡呼著跑進黑暗裡，說要去找「真正的龍神」。", on:"-"},
    {who:"wolf", text:"……這不是我想要的結論。", mood:"sigh", on:"-"},
    {who:"tiger", text:"媽媽……？", mood:"confused", on:"-"},
    {who:"wolf", text:"……龍的媽媽，應該是更大的龍。", mood:"serious", on:"-"},
    {who:"raccoon", text:"……寶藏。", mood:"sly", on:"-"},
    {who:"fox", text:"先拿寶藏，再擔心媽媽。", mood:"awkward", on:"-"}],
  fleeNext:"離開洞窟",
  // 紅龍夫人那段：女兒（人形立繪）躲在媽媽背後探頭——with＝同時站在旁邊的第二個角色、withFace＝她的表情
  intro:[
    {who:"narr", text:"街口站著一位穿紅禮服的貴婦。金色長髮、背後拖著長長的披風。路過的人都繞著她走。", on:"dragon_lady", face:"regal"},
    {who:"lady", text:"你們就是「毛絨絨小隊」？", on:"dragon_lady", face:"disdain"},
    {who:"fox", text:"是……請問有什麼事嗎？", mood:"normal", on:"dragon_lady", face:"disdain"},
    {who:"lady", text:"我女兒昨天哭著回家。說洞裡來了四隻毛球，把她打得滿地找鱗片。", on:"dragon_lady", face:"impatient"},
    {who:"tiger", text:"洞、洞裡……？", mood:"confused", on:"dragon_lady", face:"impatient"},
    {who:"wolf", text:"……那隻小紅龍。", mood:"serious", on:"dragon_lady", face:"impatient"},
    {who:"narr", text:"貴婦的眼睛變成了金色的豎瞳。四周的空氣忽然熱了起來。", on:"dragon_lady", face:"furious"},
    {who:"dragon_lady", text:"我是她的母親。", on:"dragon_lady", face:"command"},
    {who:"narr", text:"貴婦的裙襬後面，探出一顆金色捲髮的小腦袋。頭上有兩支小小的角。", on:"dragon_lady", face:"command", withFace:"teary"},
    {who:"wyrmling", text:"……就是她們！", on:"dragon_lady", face:"command", withFace:"angry"},
    {who:"tiger", text:"欸？那隻小龍……變成人了？", mood:"confused", on:"dragon_lady", face:"command", withFace:"angry"},
    {who:"wyrmling", text:"哼！本小姐才不是小龍！", on:"dragon_lady", face:"command", withFace:"contempt"}],
  preached:[{who:"wolf", text:"……狗頭人在等「真正的龍神」。結果來的是「壞龍」的媽媽。", mood:"sigh", on:"dragon_lady", face:"command"}],
  // 凱倫（大爺 10-29）：要找管事的、要投訴
  ask:[
    {who:"dragon_lady", text:"叫你們公會管事的出來。我要投訴。", on:"dragon_lady", face:"command"},
    {who:"fox", text:"艾、艾妲今天輪休……", mood:"awkward", on:"dragon_lady", face:"disdain"},
    {who:"dragon_lady", text:"那就由你們給我一個解釋。", on:"dragon_lady", face:"command"}],
  pick:{
    sorry:{label:"道歉", sub:"先把她安撫下來"},
    reason:{label:"講道理", sub:"魅力檢定・難度 {dc}（{who}）"},
    talkback:{label:"頂嘴", sub:"……真的要嗎？"}},
  sorry:[
    {who:"fox", text:"對不起！我們不知道她是您的女兒……", mood:"guilty", on:"dragon_lady", face:"skeptical"},
    {who:"raccoon", text:"……對不起。", mood:"down", on:"dragon_lady", face:"skeptical"},
    {who:"dragon_lady", text:"……哼。至少還有點禮貌。", on:"dragon_lady", face:"disdain"},
    {who:"dragon_lady", text:"那孩子把狗頭人當玩具，整天坐在金幣堆上叫牠們跳舞、拜她。……我早就想帶她回家了。", on:"dragon_lady", face:"regret", withFace:"surprised"},
    {who:"wyrmling", text:"媽媽！", on:"dragon_lady", face:"regret", withFace:"pout"},
    {who:"dragon_lady", text:"這個拿去。就當作你們替我把她趕回家的謝禮。", on:"dragon_lady", face:"regal"},
    {who:"narr", text:"拿到 50 gp（四隻平分）。", on:"dragon_lady", face:"regal"}],
  rollLine:"其實……",
  reasonOk:[
    {who:"fox", text:"她在洞裡收狗頭人當信徒，每天半夜敲鑼，礦工都睡不著。", mood:"normal", on:"dragon_lady", face:"skeptical"},
    {who:"raccoon", text:"……還坐在金幣上，要人拜。", mood:"sly", on:"dragon_lady", face:"skeptical"},
    {who:"dragon_lady", text:"……", on:"dragon_lady", face:"surprised"},
    {who:"dragon_lady", text:"那個孩子……！我說過多少次，不准在外面亂收信徒！", on:"dragon_lady", face:"furious", withFace:"surprised"},
    {who:"wyrmling", text:"可、可是牠們很好玩嘛！叫牠們跳舞就跳舞……", on:"dragon_lady", face:"furious", withFace:"embarrassed"},
    {who:"dragon_lady", text:"（咳了一聲）……失禮了。是我家的孩子給你們添麻煩。", on:"dragon_lady", face:"embarrassed"},
    {who:"dragon_lady", text:"這個拿去，算是賠禮。回去我會好好教訓她。", on:"dragon_lady", face:"warm_smile"},
    {who:"narr", text:"{who}拿到了【{item}】。", on:"dragon_lady", face:"warm_smile"}],
  reasonFail:[
    {who:"fox", text:"她、她在洞裡……那個……收了很多……狗頭人……", mood:"awkward", on:"dragon_lady", face:"skeptical"},
    {who:"dragon_lady", text:"我女兒有信徒，是因為她生來就值得被崇拜。", on:"dragon_lady", face:"smirk", withFace:"boastful"},
    {who:"wyrmling", text:"就是說！", on:"dragon_lady", face:"smirk", withFace:"laugh"},
    {who:"dragon_lady", text:"我會讓全城的吟遊詩人都知道，毛絨絨小隊是怎麼欺負小孩的。", on:"dragon_lady", face:"disdain"},
    {who:"dragon_lady", text:"下次再讓我聽到你們欺負她——我就親自去你們家拜訪。", on:"dragon_lady", face:"command"},
    {who:"narr", text:"貴婦轉身離開。地上留下一圈燒焦的腳印。", on:"-"},
    {who:"tiger", text:"……她知道我們家在哪嗎？", mood:"confused", on:"-"}],
  talkback:[
    {who:"tiger", text:"是她先咬人的！龍了不起喔！", mood:"angry", on:"dragon_lady", face:"laugh", withFace:"angry"},
    {who:"wyrmling", text:"媽媽，咬她！", on:"dragon_lady", face:"laugh", withFace:"orders"},
    {who:"narr", text:"貴婦笑了一下。下一秒，她的背後張開了一對巨大的紅色翅膀——", on:"red_dragon_lady"},
    {who:"dragon_lady", text:"……再說一次？", on:"red_dragon_lady", withFace:"smug"},
    {who:"narr", text:"整條街的窗戶都在震。小傢伙們不約而同地抱成一團。", on:"red_dragon_lady"},
    {who:"narr", text:"等回過神來，貴婦已經不見了。只有公會的招牌還在冒煙。", on:"-"},
    {who:"fox", text:"……嬌嬌，以後不准頂嘴。", mood:"awkward", on:"-"},
    {who:"tiger", text:"……嗯。", mood:"blank", on:"-"},
    {who:"narr", text:"全員壓力 +10。", on:"-"}],
  next:"回到街上"
};
