/* 序章台詞：who = narr（旁白）/ dwarf（大爺）/ 小動物 id */
const SCRIPT = [
  {who:"narr",  text:"雨夜。山腳下的小鎮只剩一盞燈還亮著，那是矮人大爺的軟呼呼酒館。"},
  {who:"narr",  text:"角落的圓桌上攤著一張皺巴巴的地圖，你們四個擠在一起，已經嘀咕了一整晚。"},
  {who:"dwarf", text:"喲，四個毛球又擠在一塊！今晚想搞什麼名堂啊？哈哈！"},
  {who:"fox",   text:"我們研究過了，鎮外那片森林最近怪怪的……我們想去看看。"},
  {who:"tiger", text:"就是要去探險啦！"},
  {who:"wolf",  text:"……嬌嬌，話都被妳講完了。"},
  {who:"dwarf", text:"探險？哈哈哈！好啊，有志氣！大爺年輕的時候也是這樣！"},
  {who:"dwarf", text:"可惜酒館走不開，這趟大爺沒辦法陪你們去。"},
  {who:"dwarf", text:"出門在外，你們四個要好好照顧彼此，聽到沒？誰受傷了，其他三個就一起扛回來。"},
  {who:"raccoon", text:"……嗯。（用力點頭）"},
  {who:"dwarf", text:"來！一人一百金幣，拿去！"},
  {who:"tiger", text:"哇！大爺好大方！"},
  {who:"dwarf", text:"然後後面那面牆上的裝備，自己挑喜歡的，大爺賣你們。"},
  {who:"fox",   text:"……等一下。所以你給我們一百金幣，是要我們拿去買你的東西？"},
  {who:"wolf",  text:"錢在桌上繞了一圈，又回到大爺口袋了。"},
  {who:"raccoon", text:"……算了一下，大爺一毛都沒花。"},
  {who:"dwarf", text:"咳！這、這叫理財教育！挑不挑？不挑就還來！"},
  {who:"tiger", text:"挑！當然挑！"},
  {who:"dwarf", text:"記住啊，太重的甲穿不動、太大的傢伙揮不起來，量力而為！"}
];

/* 送別：裝備店按「出發」後播放。hug:true 的台詞會讓四隻出現在大爺懷裡 */
const FAREWELL = [
  {who:"dwarf", text:"要出發啦？等等等等，大爺還沒講完！"},
  {who:"dwarf", text:"水袋裝滿了沒？口糧帶夠了沒？晚上睡覺記得輪流守夜！"},
  {who:"dwarf", text:"玲玲，路上別什麼東西都撿起來研究，有些會咬人。"},
  {who:"dwarf", text:"嬌嬌，看到怪別第一個衝上去，等大家一起！"},
  {who:"dwarf", text:"香香，妳最穩，路上多看著她們點。"},
  {who:"dwarf", text:"默默……出門前，先把大爺的酒從妳包包裡拿出來。"},
  {who:"raccoon", text:"……（默默地把一瓶酒放回吧檯）"},
  {who:"fox",   text:"大爺，水袋那段你已經講第三遍了。"},
  {who:"dwarf", text:"講三遍怎麼了！大爺擔心不行嗎！"},
  {who:"tiger", text:"大爺～！"},
  {who:"narr",  text:"嬌嬌第一個撲了上去，接著是玲玲、默默，最後香香也被一起拉了進去。", hug:true},
  {who:"narr",  text:"大爺張開粗壯的手臂，把四個毛球一把抱住。大鬍子扎得大家咯咯直笑。", hug:true},
  {who:"dwarf", text:"……好了好了，去吧。記得，天黑前回來喝熱湯！", hug:true}
];

/* 伏擊前的被動察覺（大爺 2026-10-01）：四小隻不知道草叢裡有東西，所以不擲骰，用被動 10 + 感知調整值
   難度＝躲著的敵人這次的躲藏數字（d20 + 敏捷，至少 HIDE_DC），進戰鬥沿用同一個數字
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
    const hide = Math.max(HIDE_DC, d20() + ENEMIES[f.type].mods.DEX);
    const spotted = CRITTERS.filter(c=>10 + modOf(finalScore(c.id,"WIS")) >= hide).map(c=>c.id);
    foes[i] = {hide, spotted};
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
  {who:"narr",     text:"往城鎮的路走到一半，前方突然傳來一聲尖叫。"},
  {who:"narr",     text:"一輛馬車翻倒在路邊，貨物散了一地。三隻哥布林圍著馬車又叫又跳：一隻揮著短棒、一隻舉著彎刀，後面那隻拉著弓。"},
  {who:"merchant", text:"救、救命啊——！有沒有人啊——！"},
  {who:"tiger",    text:"有人在求救！上啊！"},
  {who:"wolf",     text:"嬌嬌，等一下……算了，攔不住。"},
  {who:"fox",      text:"三隻哥布林，我們有四個。只要別被各個擊破，打得贏。"},
  {who:"raccoon",  text:"……馬車後面，躲著一個人。"},
  {who:"narr",     text:"哥布林們聽到動靜，轉過頭來，咧開滿嘴尖牙。"}
];
