/* 序章台詞：who = narr（旁白）/ dwarf（大爺）/ kam（卡姆）/ 小動物 id / all（四小隻一起說，四張卡一起亮）
   on＝這句誰站在酒館舞台上（預設大爺）；face＝台上那位的表情（assets/faces/README.md 的檔名，香香 10-03 配的，暫定）
   mood＝說話那隻小動物的表情；moods 僅取說話者自己的設定，all 合聲時取各隻設定。
   其他隻保留上次自己台詞的表情；旁白／抱抱不換臉，場景開始為平常臉。 */
const STARTER_GEAR = {
 fox:{main:"奧術法杖",second:"輕弩",armor:"法袍",ammo:"矢匣"},
 tiger:{main:"長劍",off:"盾牌",second:"手弩",armor:"鏈甲衫",ammo:"矢匣"},
 wolf:{main:"彎刀",second:"短弓",armor:"鏈甲衫",ammo:"箭袋"},
 raccoon:{main:"匕首",off:"匕首",second:"短弓",armor:"鑲釘皮甲",ammo:"箭袋"}
};
const SCRIPT = [
  {who:"narr",  text:"晴朗的午後，山腳下的小鎮懶洋洋的。軟呼呼酒館裡，午飯的盤子還沒收。", face:"smile", moods:{fox:"content",tiger:"content",wolf:"smile",raccoon:"normal"}},
  {who:"narr",  text:"四個毛球圍在飯桌邊，攤開一張皺巴巴的地圖，嘰嘰咕咕地討論著。", face:"smile", moods:{fox:"smug",tiger:"happy",wolf:"serious",raccoon:"sly"}},
  {who:"dwarf", text:"喲，吃飽了不睡午覺，在密謀什麼啊？哈哈！", face:"grin", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"fox",   text:"我們研究過了，鎮外那片森林最近怪怪的……我們想去看看。", mood:"smug", face:"smile", moods:{fox:"smug",tiger:"happy",wolf:"serious",raccoon:"normal"}},
  {who:"tiger", text:"就是要去探險啦！", mood:"happy", face:"grin", moods:{fox:"happy",tiger:"happy",wolf:"resigned",raccoon:"happy"}},
  {who:"wolf",  text:"……嬌嬌，話都被妳講完了。", mood:"resigned", face:"smile", moods:{fox:"awkward",tiger:"happy",wolf:"resigned",raccoon:"sly"}},
  {who:"dwarf", text:"探險？哈哈哈！好啊，有志氣！大爺年輕的時候也是這樣！", face:"grin", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"dwarf", text:"可惜酒館走不開，這趟大爺沒辦法陪你們去。", face:"sad", moods:{fox:"awkward",tiger:"blank",wolf:"sigh",raccoon:"down"}},
  {who:"dwarf", text:"出門在外，你們四個要好好照顧彼此，聽到沒？誰受傷了，其他三個就一起扛回來。", face:"smile", moods:{fox:"normal",tiger:"normal",wolf:"serious",raccoon:"normal"}},
  {who:"raccoon", text:"……嗯。（用力點頭）", mood:"happy", face:"smile", moods:{fox:"content",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"dwarf", text:"先把慣用的傢伙拿好。那邊的裝備送你們，出門可別空著手！", face:"smile", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"narr", text:"四小隻各自挑好武器與護甲，背上小背包，也把弓箭和弩矢收妥。", grantStarter:true, face:"smile", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"fox", text:"法杖，還有備用的輕弩。都檢查好了。", mood:"smug", face:"smile", moods:{fox:"smug",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"tiger", text:"長劍跟盾牌！手弩也帶上！", mood:"happy", face:"smile", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"wolf", text:"彎刀、短弓。箭袋沒有漏掉。", mood:"smile", face:"smile", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"raccoon", text:"……兩把匕首。還有弓。", mood:"sly", face:"smile", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"sly"}},
  {who:"dwarf", text:"來！一人一百金幣，拿去！", face:"grin", moods:{fox:"surprised",tiger:"happy",wolf:"surprised",raccoon:"happy"}},
  {who:"tiger", text:"哇！大爺好大方！", mood:"happy", face:"grin", moods:{fox:"surprised",tiger:"happy",wolf:"surprised",raccoon:"happy"}},
  {who:"dwarf", text:"然後——（喀嚓）", face:"smirk", moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"sly"}},
  {who:"narr",  text:"大爺按下吧檯底下的開關。酒館的牆板翻轉過來，上面掛滿了刀劍盔甲。", face:"smirk", moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"sly"}},
  {who:"tiger", text:"哇啊啊！牆會轉！", mood:"happy", face:"smirk", moods:{fox:"surprised",tiger:"happy",wolf:"surprised",raccoon:"surprised"}},
  {who:"fox",   text:"……這機關是什麼時候裝的？", mood:"confused", face:"smirk", moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"sly"}},
  {who:"raccoon", text:"……酒館裡，不只一面。（盯著另一面牆）", mood:"sly", face:"smirk", moods:{fox:"confused",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"wolf",  text:"大爺，你等這一刻多久了？", mood:"sigh", face:"smirk", moods:{fox:"smug",tiger:"happy",wolf:"sigh",raccoon:"sly"}},
  {who:"dwarf", text:"慣用的裝備送你們了。這面牆的，想添購或換裝就自己挑，大爺賣你們。", face:"smirk", moods:{fox:"confused",tiger:"happy",wolf:"resigned",raccoon:"sly"}},
  {who:"fox",   text:"……等一下。所以你給我們一百金幣，是要我們拿去買你的東西？", mood:"surprised", face:"surprised", moods:{fox:"surprised",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"wolf",  text:"錢在桌上繞了一圈，又回到大爺口袋了。", mood:"resigned", face:"shy", moods:{fox:"smug",tiger:"confused",wolf:"resigned",raccoon:"sly"}},
  {who:"raccoon", text:"……算了一下，買完還是大爺賺。", mood:"sly", face:"shy", moods:{fox:"smug",tiger:"blank",wolf:"resigned",raccoon:"sly"}},
  {who:"dwarf", text:"咳！這、這叫理財教育！挑不挑？不挑就還來！", face:"gritted", moods:{fox:"smug",tiger:"happy",wolf:"resigned",raccoon:"sly"}},
  {who:"tiger", text:"挑！當然挑！", mood:"happy", face:"grin", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"dwarf", text:"記住啊，太重的甲穿不動、太大的傢伙揮不起來，量力而為！", face:"smile", moods:{fox:"normal",tiger:"normal",wolf:"serious",raccoon:"normal"}}
];

/* 送別：裝備店按「出發」後播放。hug:true 的台詞會讓四隻出現在大爺懷裡
   放屁那段是說謊者邏輯題（大爺 10-02）：四句裡只有一句是假的，答案只有大爺一個解
   （是大爺→只有嬌嬌說謊；換成任何一隻都會有兩個說謊）。改指控前要重新驗算 */
const FAREWELL = [
  // 卡姆登場（大爺 10-03：拿完裝備後她走過來，嫌太危險，施傳送詛咒＝全體陣亡就傳回酒館；消耗運氣僅為劇情設定）
  // on:"kam"＝舞台上換卡姆；台詞已經大爺10-04定稿，表情配合台詞
  {who:"narr",  text:"毛毛們正對著新裝備比來比去，一個紅髮的身影端著托盤走了過來。", on:"kam", face:"smile", moods:{fox:"content",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"kam",   text:"嗯?毛毛們要出門？", on:"kam", face:"smile", moods:{fox:"content",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"tiger", text:"嗯！我們要去森林探險！", mood:"happy", on:"kam", face:"surprised", moods:{fox:"smug",tiger:"happy",wolf:"serious",raccoon:"normal"}},
  {who:"kam",   text:"什麼？太危險了。", on:"kam", face:"surprised", moods:{fox:"smug",tiger:"happy",wolf:"serious",raccoon:"normal"}},
  {who:"fox",   text:"我們有裝備了，而且有四個。", mood:"smug", on:"kam", face:"sad", moods:{fox:"smug",tiger:"happy",wolf:"serious",raccoon:"normal"}},
  {who:"kam",   text:"還是太危險。……手伸出來。", on:"kam", face:"smile", moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"confused"}},
  {who:"narr",  text:"卡姆在四隻的手心各點了一下。紅光一閃，手背上浮出一個小小的龍角印記。", on:"kam", face:"smirk", curse:true, moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"surprised"}},
  {who:"wolf",  text:"……這是什麼？", mood:"confused", on:"kam", face:"smirk", moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"surprised"}},
  {who:"kam",   text:"詛咒。", on:"kam", face:"smirk", moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"surprised"}},
  {who:"raccoon", text:"……詛咒？", mood:"surprised", on:"kam", face:"smirk", moods:{fox:"confused",tiger:"blank",wolf:"confused",raccoon:"surprised"}},
  {who:"kam",   text:"你們要是出了甚麼意外能傳回酒館，雖然會消耗你們的運氣。", on:"kam", face:"smile", moods:{fox:"confused",tiger:"confused",wolf:"serious",raccoon:"confused"}},
  {who:"fox",   text:"……一般不是都給祝福嗎？", mood:"confused", on:"kam", face:"smile", moods:{fox:"confused",tiger:"confused",wolf:"serious",raccoon:"confused"}},
  {who:"kam",   text:"......因為我是破壞神，不懂祝福相關的法術。", on:"kam", face:"smirk", moods:{fox:"confused",tiger:"confused",wolf:"serious",raccoon:"confused"}},
  {who:"dwarf", text:"哈哈！卡姆真貼心！", face:"grin", moods:{fox:"content",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"kam",   text:"換做是老大倒在外面就無所謂了。但等我先把帳算完——你昨天打破的三個杯子、上個月讓客人賒的酒錢、還有偷藏在吧檯底下那箱……", on:"kam", face:"annoyed", moods:{fox:"awkward",tiger:"blank",wolf:"resigned",raccoon:"sly"}},
  {who:"dwarf", text:"好了好了！毛毛們在看！", face:"gritted", moods:{fox:"awkward",tiger:"blank",wolf:"resigned",raccoon:"sly"}},
  // 以下是原本的送別（表情 face 是香香 10-03 配的，暫定）
  {who:"narr", text:"毛毛們收下卡姆的詛咒，把最後幾樣東西塞進背包，正準備出發。", face:"smile"},
  {who:"dwarf", text:"要出發啦？等等等等，大爺還沒講完！", face:"annoyed", moods:{fox:"awkward",tiger:"blank",wolf:"serious",raccoon:"normal"}},
  {who:"dwarf", text:"水袋裝滿了沒？口糧帶夠了沒？晚上睡覺記得輪流守夜！", face:"annoyed", moods:{fox:"awkward",tiger:"blank",wolf:"serious",raccoon:"normal"}},
  {who:"dwarf", text:"玲玲，路上別什麼東西都撿起來研究，有些會咬人。", face:"annoyed", moods:{fox:"awkward",tiger:"blank",wolf:"serious",raccoon:"normal"}},
  {who:"dwarf", text:"嬌嬌，看到怪別第一個衝上去，等大家一起！", face:"annoyed", moods:{fox:"awkward",tiger:"blank",wolf:"serious",raccoon:"normal"}},
  {who:"dwarf", text:"香香，妳啊，有時會想太多。記得要跟大家討論，別悶著。", face:"smile", moods:{fox:"awkward",tiger:"blank",wolf:"serious",raccoon:"normal"}},
  {who:"wolf",  text:"……嗯。知道了。", mood:"sigh", face:"smile", moods:{fox:"content",tiger:"normal",wolf:"sigh",raccoon:"normal"}},
  {who:"dwarf", text:"默默……出門前，先把大爺的酒從妳包包裡拿出來。", face:"annoyed", moods:{fox:"surprised",tiger:"blank",wolf:"resigned",raccoon:"caught"}},
  {who:"raccoon", text:"……那是預備慶功的。", mood:"caught", face:"gritted", moods:{fox:"surprised",tiger:"blank",wolf:"resigned",raccoon:"caught"}},
  {who:"narr",  text:"默默把一瓶酒放回吧檯，又瞄了一眼。", face:"smile", moods:{fox:"awkward",tiger:"blank",wolf:"resigned",raccoon:"down"}},
  {who:"raccoon", text:"……回來再喝。", mood:"down", face:"smile", moods:{fox:"awkward",tiger:"blank",wolf:"resigned",raccoon:"down"}},
  {who:"fox",   text:"大爺，水袋那段你已經講第三遍了。", mood:"smug", face:"annoyed", moods:{fox:"smug",tiger:"blank",wolf:"sigh",raccoon:"sly"}},
  {who:"dwarf", text:"講三遍怎麼了！大爺擔心不行嗎！", face:"gritted", moods:{fox:"smug",tiger:"blank",wolf:"sigh",raccoon:"sly"}},
  {who:"tiger", text:"知道啦——先抱一下再出發！", mood:"happy", face:"smile", moods:{fox:"content",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"narr",  text:"嬌嬌第一個撲了上去，接著是玲玲、默默，最後香香也被一起拉了進去。", hug:true, face:"smile", moods:{fox:"content",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"narr",  text:"大爺張開小小的手臂，把四個毛球一把抱住。辮子鬍扎得大家咯咯直笑。", face:"smile", hug:true, moods:{fox:"content",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"narr",  text:"……空氣中，飄來一股微妙的味道。", face:"surprised", hug:true, moods:{fox:"surprised",tiger:"fierce",wolf:"confused",raccoon:"surprised"}},
  {who:"dwarf", text:"……誰放屁？", face:"annoyed", hug:true, moods:{fox:"surprised",tiger:"fierce",wolf:"confused",raccoon:"surprised"}},
  {who:"tiger", text:"是玲玲放的！", mood:"fierce", face:"annoyed", hug:true, moods:{fox:"surprised",tiger:"fierce",wolf:"confused",raccoon:"surprised"}},
  {who:"fox",   text:"嬌嬌在說謊。", mood:"smug", hug:true, face:"surprised", moods:{fox:"smug",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"raccoon", text:"……不是我，也不是香香。", mood:"normal", hug:true, face:"surprised", moods:{fox:"smug",tiger:"blank",wolf:"serious",raccoon:"normal"}},
  {who:"wolf",  text:"不是嬌嬌，也不是玲玲。", mood:"serious", hug:true, face:"surprised", moods:{fox:"smug",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"fox",   text:"我們四個裡面，只有一個在說謊。大爺自己推吧。", mood:"smug", hug:true, face:"surprised", moods:{fox:"smug",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"dwarf", text:"嗯……不是嬌嬌、不是玲玲、不是默默、不是香香……那就是……", face:"surprised", hug:true, moods:{fox:"smug",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"narr",  text:"四個毛球同時抬起頭，盯著大爺。", face:"shy", hug:true, moods:{fox:"smug",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"dwarf", text:"咳！好、好了好了，去吧！記得，天黑前回來喝熱湯！", face:"shy", hug:true, moods:{fox:"smug",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"all",   text:"知道啦——！", hug:true, face:"smile", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  // 出發（大爺 10-03：送別最後放四小隻合照，邊打屁邊出發）。art：這幾句換成 STORY_ART 的插圖
  // 以下台詞已經大爺10-04定稿；不提武器，因為玩家買的裝備不一定跟圖一樣
  // 梗：圖上默默頂著的寶箱是大爺的，出門的時候摸走的（大爺 10-03）
  {who:"narr",  text:"酒館的大門被推開，四個毛球衝進午後的陽光裡。", art:"party", face:"smile", moods:{fox:"happy",tiger:"happy",wolf:"smile",raccoon:"happy"}},
  {who:"tiger", text:"出發——！今天要打倒十隻怪！", mood:"fierce", art:"party", face:"smile", moods:{fox:"happy",tiger:"fierce",wolf:"smile",raccoon:"happy"}},
  {who:"fox",   text:"話說回來，剛才那個屁，到底是誰放的？", mood:"confused", art:"party", face:"smile", moods:{fox:"confused",tiger:"happy",wolf:"sigh",raccoon:"normal"}},
  {who:"tiger", text:"大爺自己都推出來了啊！", mood:"happy", art:"party", face:"smile", moods:{fox:"confused",tiger:"happy",wolf:"sigh",raccoon:"normal"}},
  {who:"wolf",  text:"……推到一半，就把我們趕出來了。", mood:"sigh", art:"party", face:"smile", moods:{fox:"confused",tiger:"happy",wolf:"sigh",raccoon:"normal"}},
  {who:"wolf",  text:"……還有，默默，妳頭上那個是什麼？", mood:"serious", art:"party", face:"smile", moods:{fox:"surprised",tiger:"blank",wolf:"serious",raccoon:"sly"}},
  {who:"raccoon", text:"……路上撿的。", mood:"sly", art:"party", face:"smile", moods:{fox:"surprised",tiger:"blank",wolf:"resigned",raccoon:"sly"}},
  {who:"wolf",  text:"……我們才剛走出門口。", mood:"resigned", art:"party", face:"smile", moods:{fox:"surprised",tiger:"blank",wolf:"resigned",raccoon:"sly"}},
  {who:"fox",   text:"那個鎖頭……是大爺的寶箱吧？", mood:"surprised", art:"party", face:"smile", moods:{fox:"surprised",tiger:"blank",wolf:"resigned",raccoon:"sly"}},
  {who:"raccoon", text:"……出門的時候，順手。", mood:"happy", art:"party", face:"smile", moods:{fox:"surprised",tiger:"happy",wolf:"resigned",raccoon:"happy"}},
  {who:"narr",  text:"身後，酒館的門「砰」地一聲被撞開。", art:"party", face:"annoyed", moods:{fox:"surprised",tiger:"happy",wolf:"surprised",raccoon:"caught"}},
  {who:"dwarf", text:"默默——！大爺的寶箱——！", art:"party", face:"annoyed", moods:{fox:"surprised",tiger:"happy",wolf:"surprised",raccoon:"caught"}},
  {who:"all",   text:"快跑——！", art:"party", face:"annoyed", moods:{fox:"surprised",tiger:"happy",wolf:"sigh",raccoon:"happy"}}
];
/* 劇情插圖：台詞加 art:"key" 就蓋在第一人稱背景上（對話框照舊在最上層） */
const STORY_ART = {party:"assets/portraits/party.webp"};

/* 伏擊前的被動察覺（大爺 2026-10-01）：四小隻不知道草叢裡有東西，所以不擲骰，用被動 10 + 感知調整值
   難度＝躲著的敵人這次的潛行擲骰（d20 + 敏捷，薩滿擲、四小隻不擲），進戰鬥沿用同一個數字
   沒過 HIDE_DC＝沒躲好，草叢在抖，四隻都看到（大爺 10-02：以前會被拉到 13，等於把失敗改成及格）
   有人過：劇情裡草叢會晃、過的那幾隻吐槽，進戰鬥時那隻直接現形 */
const SPOT_MOOD = {fox:"smug", tiger:"fierce", wolf:"serious", raccoon:"sly"};   // 察覺台詞的表情（10-03 暫定）
const SPOT_QUIP = {   // 台詞草稿，大爺改完才算數
  fox:     "躲草叢？草都在抖了，藏得也太差了吧。",
  tiger:   "那邊的草叢在發抖！是不是怕我？",
  wolf:    "現在沒有風，草叢卻在晃。……躲的人技術不太好。",
  raccoon: "……草叢裡也有。躲得比默默差。"
};
function scoutBattle(id){
  const def = BATTLES[id], foes = {};
  def.foes.forEach((f,i)=>{
    if(!f.hidden) return;
    const roll = d20(), hide = roll + abilityMods(ENEMIES[f.type]).DEX;
    const spotted = CRITTERS.filter(c=>hide < HIDE_DC || 10 + modOf(finalScore(c.id,"WIS")) >= hide).map(c=>c.id);
    foes[i] = {hide, roll, spotted};
  });
  state.scout = {battle:id, foes};
}
const scoutSpotters = () => { const sc = state.scout; if(!sc) return [];
  return [...new Set(Object.values(sc.foes).flatMap(f=>f.spotted))]; };
function ambushScript(){
  const who = scoutSpotters();
  if(!who.length) return AMBUSH;
  const extra = [{who:"narr", text:"路邊的草叢，好像晃了一下。", shake:true},
                 ...CRITTERS.filter(c=>who.includes(c.id)).map(c=>({who:c.id, text:SPOT_QUIP[c.id], shake:true, mood:SPOT_MOOD[c.id]}))];
  return [...AMBUSH.slice(0,-1), ...extra, AMBUSH[AMBUSH.length-1]];
}

/* 伏擊：前往城鎮途中遇到被哥布林圍住的商隊。最後一句之後進入戰鬥（戰鬥另外製作）
   merchant：商人，設定未定，先只用聲音出場（顯示為「？？？」） */
const AMBUSH = [
  {who:"narr",     text:"走到岔路口時，通往城鎮的那條路上，突然傳來一聲尖叫。"},
  {who:"narr",     text:"一輛馬車翻倒在路邊，貨物散了一地。三隻哥布林圍著馬車又叫又跳：一隻揮著短棒、一隻舉著彎刀，後面那隻拉著弓。"},
  {who:"merchant", text:"救、救命啊——！有沒有人啊——！"},
  {who:"tiger",    text:"有人在求救！上啊！", mood:"fierce"},
  {who:"wolf",     text:"嬌嬌，等一下！……大家跟上，別讓她落單！", mood:"serious"},
  {who:"fox",      text:"三隻哥布林，我們有四個。只要別被各個擊破，打得贏。", mood:"smug"},
  {who:"raccoon",  text:"……馬車後面，躲著一個人。", mood:"normal"},
  {who:"narr",     text:"哥布林們聽到動靜，轉過頭來，咧開滿嘴尖牙。"}
];

/* ======================== 商隊戰後（大爺 10-03） ========================
   打贏伏擊 → 商人道謝 → 玩家挑一隻出面，那一隻擲她擅長的屬性（d20＋調整值 ≥ CARAVAN_DC）→ 結果、報酬 → 跟馬車一起往城鎮
   梗（大爺）：商人其實是走私犯。玲玲看穿、嬌嬌撞破木箱、香香看到稀有金屬反光 → 敲竹槓；默默直接扒他的背包
   商人只有一張圖、沒有表情：情緒用頭上的泡泡框符號（mark：ok ❗、fail ❓、known …、sweat 滴汗、shake 發抖、anger 青筋、note 音符）
   台詞全部是香香的草稿，大爺改完才算數；失敗的結果、金額分法、難度是香香定的（大爺 10-03：前面都給你決定），暫定 */
const CARAVAN_DC = 12;
const CARAVAN_PICKS = [   // stat：擲哪一項（大爺 10-03：照四小隻擅長的）
  {id:"fox",     stat:"INT", say:"「我們來談談報酬吧。」"},
  {id:"tiger",   stat:"STR", say:"「我幫大叔搬貨！」"},
  {id:"wolf",    stat:"WIS", say:"「……那箱子裡是什麼？」"},
  {id:"raccoon", stat:"DEX", say:"（悄悄繞到大叔背後）"}
];
// 報酬：gold＝四隻合計的金幣（平分）；items＝{角色:[道具名…]}，all＝每隻都有
const CARAVAN_REWARD = {
  fox:     {win:{gold:200}, lose:{gold:100}},
  tiger:   {win:{gold:100, items:{all:["點心","點心"]}}, lose:{gold:100}},
  wolf:    {win:{gold:100, items:{wolf:["非凡長弓"]}}, lose:{gold:100}},
  raccoon: {win:{gold:100, items:{raccoon:["次元背包"]}}, lose:{gold:50}}
};
const CARAVAN_INTRO = [
  {who:"narr",     text:"最後一隻哥布林倒下，路上安靜了下來。翻倒的馬車後面，一個戴寬帽的大叔探出頭來。", mark:"known"},
  {who:"merchant", text:"走、走了嗎？……真的走了？", mark:"shake"},
  {who:"tiger",    text:"都打跑啦！大叔你沒事吧？", mood:"happy"},
  {who:"merchant", text:"沒事沒事！哎呀，多虧了你們這幾個小傢伙！", mark:"note"},
  {who:"merchant", text:"我是跑城鎮的行商。這點謝禮請收下——一百金幣！", mark:"ok"},
  {who:"fox",      text:"……（小聲）只有一個人、一輛車，走這條沒人巡的小路？", mood:"confused"},
  {who:"wolf",     text:"……貨箱封得很緊。", mood:"serious"},
  {who:"raccoon",  text:"……他的背包，很鼓。", mood:"sly"},
  {who:"merchant", text:"哈、哈哈！你們在說什麼悄悄話呢？", mark:"sweat"},
  {who:"narr",     text:"四小隻互看一眼。要由誰出面？", choice:true}
];
const CARAVAN_RESULT = {
  fox: {
    win:[{who:"fox", text:"這條路沒人巡，貨箱上的封條是假的。大叔，你在走私吧？", mood:"smug"},
         {who:"merchant", text:"！！", mark:"ok"},
         {who:"fox", text:"我們什麼都沒看到。不過……一百金幣，好像有點少？", mood:"smug"},
         {who:"merchant", text:"兩、兩百！兩百金幣，這事就當沒發生過！", mark:"sweat"},
         {who:"narr", text:"四小隻各分到 50 金幣。"}],
    lose:[{who:"fox", text:"這輛車……嗯……應該只是在抄捷徑吧。", mood:"confused"},
          {who:"merchant", text:"對對對！就是捷徑！", mark:"note"},
          {who:"narr", text:"四小隻各分到 25 金幣。"}]},
  tiger: {
    win:[{who:"tiger", text:"大叔，我幫你把貨搬回車上！嘿咻——", mood:"happy"},
         {who:"narr", text:"嬌嬌一腳踩空，整個人撲在木箱上。箱子裂開，滾出一堆貼著外國封條的罐頭和點心。"},
         {who:"merchant", text:"啊啊啊！那是——！", mark:"shake"},
         {who:"tiger", text:"……大叔，這些是不是不能讓城裡的人看到？", mood:"confused"},
         {who:"merchant", text:"……拿去！全部拿去！只要你們別說出去！", mark:"sweat"},
         {who:"narr", text:"四小隻各拿到 2 份點心（戰鬥中花一個動作吃掉，等於短休一次），還有各 25 金幣的謝禮。"}],
    lose:[{who:"tiger", text:"大叔，我幫你把貨搬回車上！嘿咻——", mood:"happy"},
          {who:"narr", text:"嬌嬌一口氣把箱子全搬回車上，一根釘子都沒掉。"},
          {who:"merchant", text:"好力氣！謝謝謝謝！", mark:"note"},
          {who:"narr", text:"四小隻各分到 25 金幣。"}]},
  wolf: {
    win:[{who:"narr", text:"香香盯著貨箱的縫隙。陽光照進去，反射出一道冷冷的銀光。"},
         {who:"wolf", text:"……那是稀有金屬。私下買賣，要被抓的。", mood:"serious"},
         {who:"merchant", text:"！", mark:"ok"},
         {who:"wolf", text:"……我們可以什麼都沒看到。", mood:"smile"},
         {who:"merchant", text:"這、這把弓本來是要賣給貴族的……拿去吧，拜託……", mark:"sweat"},
         {who:"narr", text:"香香拿到【非凡長弓】（裝備時可以用狩印），四小隻還各分到 25 金幣。"}],
    lose:[{who:"narr", text:"香香盯著貨箱看了半天，只看到一堆稻草。"},
          {who:"wolf", text:"……看不出來。", mood:"sigh"},
          {who:"merchant", text:"都是些普通貨啦，哈哈。", mark:"note"},
          {who:"narr", text:"四小隻各分到 25 金幣。"}]},
  raccoon: {
    win:[{who:"narr", text:"趁大家說話，默默悄悄繞到大叔背後，手一伸——"},
         {who:"narr", text:"大叔背上那個舊舊的小背包，不見了。"},
         {who:"raccoon", text:"……（拍拍自己的背）", mood:"sly"},
         {who:"wolf", text:"……默默，妳的背包是不是換了一個？", mood:"confused"},
         {who:"raccoon", text:"……路上撿的。", mood:"sly"},
         {who:"merchant", text:"嗯？大家在看什麼？", mark:"fail", moods:{raccoon:"sly", wolf:"resigned"}},
         {who:"narr", text:"默默拿到【次元背包】（裝在背包欄時，負重上限變 2 倍）。大叔什麼都沒發現，照樣給了每隻 25 金幣。"}],
    lose:[{who:"narr", text:"默默悄悄繞到大叔背後，手一伸——"},
          {who:"merchant", text:"嗯？小狸貓，妳的手在我包包裡做什麼？", mark:"ok", moods:{raccoon:"caught"}},
          {who:"raccoon", text:"……幫你抓蟲。", mood:"caught"},
          {who:"merchant", text:"……謝禮減半！", mark:"anger"},
          {who:"narr", text:"四小隻各分到 12 金幣 5 銀幣。"}]}
};
const CARAVAN_XP = 250;   // 商隊護送完成每隻給的經驗（大爺 10-04 定商隊後可手動升到等級 2；數字暫定）
const CARAVAN_OUTRO = [
  {who:"merchant", text:"我也要去城鎮。順路的話，一起走吧！", mark:"note"},
  {who:"fox",      text:"有人帶路，正好。", mood:"content"},
  {who:"narr",     text:"經驗夠了，可以升級！"},   // 系統提示（香香 10-04，文字暫定）
  {who:"narr",     text:"四小隻跟在馬車旁邊，繼續往城鎮出發。"}
];

/* 進城告別與小隊成立：GPT 草稿；表情配置暫定。默默偷包成功不揭露走私。 */
const TOWN_GOODBYE = {
  exposed:[
    {who:"narr",text:"馬車停在城門旁。商人把貨箱的布又拉緊了一些。"},
    {who:"merchant",text:"到、到了！護送就到這裡吧。我那批貨……還有人等著收。",mark:"sweat"},
    {who:"fox",text:"放心，報酬收到了。我們也有自己的事要忙。",mood:"smug"},
    {who:"wolf",text:"……下次把箱子封好一點。",mood:"serious"}
  ],
  hurry:[
    {who:"narr",text:"馬車停在城門旁。商人望了望城內，急著抓起韁繩。"},
    {who:"merchant",text:"多謝多謝！護送就到這裡。我還得趕緊去交貨，失陪啦！",mark:"sweat"},
    {who:"fox",text:"好，我們自己逛。你忙你的吧。",mood:"content"}
  ]
};
const TOWN_FOUNDING = [
  {who:"merchant",text:"對了，你們四個湊在一起……還真像一排毛絨絨的玩具。",mark:"note"},
  {who:"tiger",text:"你家的玩具會拿斧頭喔？",mood:"confused"},
  {who:"merchant",text:"哈、哈哈！我先走了！",mark:"sweat"},
  {who:"narr",text:"商人趕著馬車進城，很快就消失在人群裡。",on:"none"},
  {who:"raccoon",text:"毛絨絨……",on:"none",mood:"happy"},
  {who:"fox",text:"毛絨絨小隊？以後接委託就報這個名字。",on:"none",mood:"happy"},
  {who:"wolf",text:"……聽起來不像能打的。",on:"none",mood:"resigned"},
  {who:"tiger",text:"打過就知道了！",on:"none",mood:"happy"},
  {who:"raccoon",text:"那就這個吧。別人聽一次就記得。",on:"none",mood:"happy"},
  {who:"all",text:"毛絨絨小隊，成立！",on:"none",mood:"happy"}
];
const TOWN_BAG_CHAT = [
  {who:"raccoon",text:"我想先找個地方整理背包。",on:"none",mood:"sly"},
  {who:"wolf",text:"……妳原本那個呢？",on:"none",mood:"confused"},
  {who:"raccoon",text:"退休了。",on:"none",mood:"sly"},
  {who:"fox",text:"妳換背包比我們換工作還快。",on:"none",mood:"awkward"}
];
const TOWN_WHERE_NEXT = [
  {who:"fox",text:"第一件事，先找地方住，還是先逛？",on:"none",mood:"confused"},
  {who:"tiger",text:"先吃。",on:"none",mood:"happy"},
  {who:"wolf",text:"……她問的是住還是逛。",on:"none",mood:"resigned"},
  {who:"tiger",text:"住的地方也能吃，逛的地方也能吃。",on:"none",mood:"happy"},
  {who:"raccoon",text:"旅店、裝備店、公會……那邊還有道具店。",on:"none",mood:"normal"},
  {who:"fox",text:"好，先去哪裡，我們一起決定！",on:"none",mood:"happy"}
];
[...Object.values(TOWN_GOODBYE).flat(),...TOWN_FOUNDING,...TOWN_BAG_CHAT,...TOWN_WHERE_NEXT].forEach(l=>l.draft="GPT");
