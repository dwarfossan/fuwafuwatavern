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
  wyrmSay:"嗚哇——我要跟媽媽說！",
  intro:[
    {who:"narr", text:"街口站著一位穿紅禮服的貴婦。金色長髮、背後拖著長長的披風。路過的人都繞著她走。", on:"dragon_lady", face:"regal"},
    {who:"lady", text:"你們就是「毛絨絨小隊」？", on:"dragon_lady", face:"disdain"},
    {who:"fox", text:"是……請問有什麼事嗎？", mood:"normal", on:"dragon_lady", face:"disdain"},
    {who:"lady", text:"我女兒昨天哭著回家。說洞裡來了四隻毛球，把她打得滿地找鱗片。", on:"dragon_lady", face:"impatient"},
    {who:"tiger", text:"洞、洞裡……？", mood:"confused", on:"dragon_lady", face:"impatient"},
    {who:"wolf", text:"……那隻小紅龍。", mood:"serious", on:"dragon_lady", face:"impatient"},
    {who:"narr", text:"貴婦的眼睛變成了金色的豎瞳。四周的空氣忽然熱了起來。", on:"dragon_lady", face:"furious"},
    {who:"dragon_lady", text:"我是她的母親。", on:"dragon_lady", face:"command"}],
  preached:[{who:"wolf", text:"……狗頭人說「龍神會回來」。回來的是龍神的媽媽。", mood:"sigh", on:"dragon_lady", face:"command"}],
  ask:{who:"dragon_lady", text:"你們最好給我一個解釋。", on:"dragon_lady", face:"command"},
  pick:{
    sorry:{label:"道歉", sub:"先把她安撫下來"},
    reason:{label:"講道理", sub:"魅力檢定・難度 {dc}（{who}）"},
    talkback:{label:"頂嘴", sub:"……真的要嗎？"}},
  sorry:[
    {who:"fox", text:"對不起！我們不知道她是您的女兒……", mood:"guilty", on:"dragon_lady", face:"skeptical"},
    {who:"raccoon", text:"……對不起。", mood:"down", on:"dragon_lady", face:"skeptical"},
    {who:"dragon_lady", text:"……哼。至少還有點禮貌。", on:"dragon_lady", face:"disdain"},
    {who:"dragon_lady", text:"那孩子被狗頭人寵壞了，整天坐在金幣堆上要人拜她。……我早就想帶她回家了。", on:"dragon_lady", face:"regret"},
    {who:"dragon_lady", text:"這個拿去。就當作你們替我把她趕回家的謝禮。", on:"dragon_lady", face:"regal"},
    {who:"narr", text:"拿到 50 gp（四隻平分）。", on:"dragon_lady", face:"regal"}],
  rollLine:"其實……",
  reasonOk:[
    {who:"fox", text:"她在洞裡收狗頭人當信徒，每天半夜敲鑼，礦工都睡不著。", mood:"normal", on:"dragon_lady", face:"skeptical"},
    {who:"raccoon", text:"……還坐在金幣上，要人拜。", mood:"sly", on:"dragon_lady", face:"skeptical"},
    {who:"dragon_lady", text:"……", on:"dragon_lady", face:"surprised"},
    {who:"dragon_lady", text:"那個孩子……！我說過多少次，不准在外面亂收信徒！", on:"dragon_lady", face:"furious"},
    {who:"dragon_lady", text:"（咳了一聲）……失禮了。是我家的孩子給你們添麻煩。", on:"dragon_lady", face:"embarrassed"},
    {who:"dragon_lady", text:"這個拿去，算是賠禮。回去我會好好教訓她。", on:"dragon_lady", face:"warm_smile"},
    {who:"narr", text:"{who}拿到了【{item}】。", on:"dragon_lady", face:"warm_smile"}],
  reasonFail:[
    {who:"fox", text:"她、她在洞裡……那個……收了很多……狗頭人……", mood:"awkward", on:"dragon_lady", face:"skeptical"},
    {who:"dragon_lady", text:"我女兒有信徒，是因為她生來就值得被崇拜。", on:"dragon_lady", face:"smirk"},
    {who:"dragon_lady", text:"下次再讓我聽到你們欺負她——我就親自去你們家拜訪。", on:"dragon_lady", face:"command"},
    {who:"narr", text:"貴婦轉身離開。地上留下一圈燒焦的腳印。", on:"-"},
    {who:"tiger", text:"……她知道我們家在哪嗎？", mood:"confused", on:"-"}],
  talkback:[
    {who:"tiger", text:"是她先咬人的！龍了不起喔！", mood:"angry", on:"dragon_lady", face:"laugh"},
    {who:"narr", text:"貴婦笑了一下。下一秒，她的背後張開了一對巨大的紅色翅膀——", on:"red_dragon_lady"},
    {who:"dragon_lady", text:"……再說一次？", on:"red_dragon_lady"},
    {who:"narr", text:"整條街的窗戶都在震。小傢伙們不約而同地抱成一團。", on:"red_dragon_lady"},
    {who:"narr", text:"等回過神來，貴婦已經不見了。只有公會的招牌還在冒煙。", on:"-"},
    {who:"fox", text:"……嬌嬌，以後不准頂嘴。", mood:"awkward", on:"-"},
    {who:"tiger", text:"……嗯。", mood:"blank", on:"-"},
    {who:"narr", text:"全員壓力 +10。", on:"-"}],
  next:"回到街上"
};
