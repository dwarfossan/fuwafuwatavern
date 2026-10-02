/* 序章台詞：who = narr（旁白）/ dwarf（大爺）/ 小動物 id / all（四小隻一起說，四張卡一起亮） */
const SCRIPT = [
  {who:"narr",  text:"晴朗的午後，山腳下的小鎮懶洋洋的。軟呼呼酒館裡，午飯的盤子還沒收。"},
  {who:"narr",  text:"四個毛球圍在飯桌邊，攤開一張皺巴巴的地圖，嘰嘰咕咕地討論著。"},
  {who:"dwarf", text:"喲，吃飽了不睡午覺，在密謀什麼啊？哈哈！"},
  {who:"fox",   text:"我們研究過了，鎮外那片森林最近怪怪的……我們想去看看。"},
  {who:"tiger", text:"就是要去探險啦！"},
  {who:"wolf",  text:"……嬌嬌，話都被妳講完了。"},
  {who:"dwarf", text:"探險？哈哈哈！好啊，有志氣！大爺年輕的時候也是這樣！"},
  {who:"dwarf", text:"可惜酒館走不開，這趟大爺沒辦法陪你們去。"},
  {who:"dwarf", text:"出門在外，你們四個要好好照顧彼此，聽到沒？誰受傷了，其他三個就一起扛回來。"},
  {who:"raccoon", text:"……嗯。（用力點頭）"},
  {who:"dwarf", text:"來！一人一百金幣，拿去！"},
  {who:"tiger", text:"哇！大爺好大方！"},
  {who:"dwarf", text:"然後——（喀嚓）"},
  {who:"narr",  text:"大爺按下吧檯底下的開關。酒館的牆板翻轉過來，上面掛滿了刀劍盔甲。"},
  {who:"tiger", text:"哇啊啊！牆會轉！"},
  {who:"fox",   text:"……這機關是什麼時候裝的？"},
  {who:"raccoon", text:"……酒館裡，不只一面。（盯著另一面牆）"},
  {who:"wolf",  text:"大爺，你等這一刻多久了？"},
  {who:"dwarf", text:"自己挑喜歡的，大爺賣你們。"},
  {who:"fox",   text:"……等一下。所以你給我們一百金幣，是要我們拿去買你的東西？"},
  {who:"wolf",  text:"錢在桌上繞了一圈，又回到大爺口袋了。"},
  {who:"raccoon", text:"……算了一下，大爺一毛都沒花。"},
  {who:"dwarf", text:"咳！這、這叫理財教育！挑不挑？不挑就還來！"},
  {who:"tiger", text:"挑！當然挑！"},
  {who:"dwarf", text:"記住啊，太重的甲穿不動、太大的傢伙揮不起來，量力而為！"}
];

/* 送別：裝備店按「出發」後播放。hug:true 的台詞會讓四隻出現在大爺懷裡
   放屁那段是說謊者邏輯題（大爺 10-02）：四句裡只有一句是假的，答案只有大爺一個解
   （是大爺→只有嬌嬌說謊；換成任何一隻都會有兩個說謊）。改指控前要重新驗算 */
const FAREWELL = [
  {who:"dwarf", text:"要出發啦？等等等等，大爺還沒講完！"},
  {who:"dwarf", text:"水袋裝滿了沒？口糧帶夠了沒？晚上睡覺記得輪流守夜！"},
  {who:"dwarf", text:"玲玲，路上別什麼東西都撿起來研究，有些會咬人。"},
  {who:"dwarf", text:"嬌嬌，看到怪別第一個衝上去，等大家一起！"},
  {who:"dwarf", text:"香香，妳啊，有時會想太多。記得要跟大家討論，別悶著。"},
  {who:"wolf",  text:"……嗯。知道了。"},
  {who:"dwarf", text:"默默……出門前，先把大爺的酒從妳包包裡拿出來。"},
  {who:"raccoon", text:"……那是預備慶功的。"},
  {who:"narr",  text:"默默把一瓶酒放回吧檯，又瞄了一眼。"},
  {who:"raccoon", text:"……回來再喝。"},
  {who:"fox",   text:"大爺，水袋那段你已經講第三遍了。"},
  {who:"dwarf", text:"講三遍怎麼了！大爺擔心不行嗎！"},
  {who:"tiger", text:"知道啦——先抱一下再出發！"},
  {who:"narr",  text:"嬌嬌第一個撲了上去，接著是玲玲、默默，最後香香也被一起拉了進去。", hug:true},
  {who:"narr",  text:"大爺張開小小的手臂，把四個毛球一把抱住。辮子鬍扎得大家咯咯直笑。", hug:true},
  {who:"narr",  text:"……空氣中，飄來一股微妙的味道。", hug:true},
  {who:"dwarf", text:"……誰放屁？", hug:true},
  {who:"tiger", text:"是玲玲放的！", hug:true},
  {who:"fox",   text:"嬌嬌在說謊。", hug:true},
  {who:"raccoon", text:"……不是我，也不是香香。", hug:true},
  {who:"wolf",  text:"不是嬌嬌，也不是玲玲。", hug:true},
  {who:"fox",   text:"我們四個裡面，只有一個在說謊。大爺自己推吧。", hug:true},
  {who:"dwarf", text:"嗯……不是嬌嬌、不是玲玲、不是默默、不是香香……那就是……", hug:true},
  {who:"narr",  text:"四個毛球同時抬起頭，盯著大爺。", hug:true},
  {who:"dwarf", text:"咳！好、好了好了，去吧！記得，天黑前回來喝熱湯！", hug:true},
  {who:"all",   text:"知道啦——！", hug:true}
];

/* 伏擊前的被動察覺（大爺 2026-10-01）：四小隻不知道草叢裡有東西，所以不擲骰，用被動 10 + 感知調整值
   難度＝躲著的敵人這次的潛行擲骰（d20 + 敏捷，薩滿擲、四小隻不擲），進戰鬥沿用同一個數字
   沒過 HIDE_DC＝沒躲好，草叢在抖，四隻都看到（大爺 10-02：以前會被拉到 13，等於把失敗改成及格）
   有人過：劇情裡草叢會晃、過的那幾隻吐槽，進戰鬥時那隻直接現形 */
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
    const roll = d20(), hide = roll + ENEMIES[f.type].mods.DEX;
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
                 ...CRITTERS.filter(c=>who.includes(c.id)).map(c=>({who:c.id, text:SPOT_QUIP[c.id], shake:true}))];
  return [...AMBUSH.slice(0,-1), ...extra, AMBUSH[AMBUSH.length-1]];
}

/* 伏擊：前往城鎮途中遇到被哥布林圍住的商隊。最後一句之後進入戰鬥（戰鬥另外製作）
   merchant：商人，設定未定，先只用聲音出場（顯示為「？？？」） */
const AMBUSH = [
  {who:"narr",     text:"走到岔路口時，通往城鎮的那條路上，突然傳來一聲尖叫。"},
  {who:"narr",     text:"一輛馬車翻倒在路邊，貨物散了一地。三隻哥布林圍著馬車又叫又跳：一隻揮著短棒、一隻舉著彎刀，後面那隻拉著弓。"},
  {who:"merchant", text:"救、救命啊——！有沒有人啊——！"},
  {who:"tiger",    text:"有人在求救！上啊！"},
  {who:"wolf",     text:"嬌嬌，等一下！……大家跟上，別讓她落單！"},
  {who:"fox",      text:"三隻哥布林，我們有四個。只要別被各個擊破，打得贏。"},
  {who:"raccoon",  text:"……馬車後面，躲著一個人。"},
  {who:"narr",     text:"哥布林們聽到動靜，轉過頭來，咧開滿嘴尖牙。"}
];
