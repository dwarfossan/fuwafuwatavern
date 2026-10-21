/* 被敲暈的敵人之後怎麼了（大爺 10-21）：文字、數字全部暫定（draft：香香）
   委託裡被敲暈的敵人，打完（贏或撤退）各擲 1d20，結果不顯示，等事情發生才知道；跟劇情有關的不擲（梟熊媽媽、梟熊寶寶）
   1：傷太重沒走出來　2–5：不幹了　6–10：就這樣逃走了　11–15：記仇回來　16–18：記仇＋找幫手　19：閉關苦練　20：回心轉意來報恩
   回來的仇人混進同一條路上之後的委託；再被敲暈就再擲一次（傷疤疊上去），最多回來 3 次；打死就結束 */
const GRUDGE = {
  draft:"香香",
  maxReturns:3,
  // d20 → 結果
  table:[[1,1,"dead"],[2,5,"retire"],[6,10,"gone"],[11,15,"return"],[16,18,"gang"],[19,19,"train"],[20,20,"grateful"]],
  // 種類：人形／野獸／不死魔物（沒寫的當野獸）
  category:{goblin:"humanoid",goblin_archer:"humanoid",goblin_shaman:"humanoid",bandit:"humanoid",bandit_archer:"humanoid",orc:"humanoid",hunter:"humanoid",hunter_archer:"humanoid",vampire:"humanoid",
    skeleton:"undead",skeleton_archer:"undead",zombie:"undead",ghost:"undead",lich:"undead",death_knight:"undead",dk_horse:"undead"},
  // 回來時變多強：每回來一次等級 +1、血量 +25%；閉關苦練再多 +1 級、AC +1，沒有天生技能的學一招（看種類）
  hpPer:.25, trainAc:1, xpPer:.5,
  trainSkill:{humanoid:"bandit_sand", beast:"cub_pounce", undead:"ghost_wail"},
  // 傷疤造型（js/art/scars.js）只有這些頭畫得上；其他怪物先只有綽號、狀態卡那行
  scarBase:look => /^goblin/.test(look||"") ? "goblin" : /^orc/.test(look||"") ? "orc" : null,
  // 綽號：照最後一道傷疤
  nick:{揮砍:"刀疤", 穿刺:"獨眼", 鈍擊:"腫眼", 火焰:"焦臉", 其他:"帶電"},
  nickTail:["", "老對手", "宿敵"],          // 第幾次回來（1、2、3）
  // 狀態卡那一行
  card:(by, how, n)=>`記仇：上次被${by}${how}${n>1?`（第 ${n} 次回來）`:""}`,
  how:{揮砍:"砍暈", 穿刺:"刺暈", 鈍擊:"敲暈", 火焰:"燒暈", 其他:"用法術打暈"},
  // 碰面時喊的（{by}＝上次打暈牠的那隻）
  shout:{
    humanoid:["是你們！上次就是{by}害我變這樣的！", "{by}！我找你很久了！", "這次不會再讓你得逞，{by}！"],
    beast:["（認出{by}，低吼了一聲）", "（盯著{by}，毛全豎起來了）"],
    undead:["……{by}……我回來了……", "（空洞的眼窩轉向{by}）"]
  },
  shoutLog:"{name}認出了{by}！",
  // 大地圖走路時聽到的消息（只講一次）
  retire:{
    humanoid:[{who:"raccoon", text:"……上次放走的那個{type}，聽說在鎮上幫人搬貨了。", mood:"sly"}, {who:"tiger", text:"牠不打架了嗎？那很好啊！", mood:"happy"}],
    beast:[{who:"wolf", text:"……之前放走的{type}，好像搬到深山裡了。", mood:"serious"}, {who:"fox", text:"不會再靠近人了吧。", mood:"normal"}],
    undead:[{who:"fox", text:"聽說上次那個{type}，自己躺回墓裡去了。", mood:"surprised"}, {who:"raccoon", text:"……躺好。", mood:"sly"}]
  },
  grateful:{
    humanoid:[{who:"narr", text:"路邊的石頭上放著一個小布包，上面歪歪扭扭寫著：謝謝沒殺我。"}, {who:"tiger", text:"是那個{type}！牠來報恩了！", mood:"happy"}],
    beast:[{who:"narr", text:"路邊放著一堆亮晶晶的東西，旁邊有{type}的腳印。"}, {who:"wolf", text:"……牠記得我們。", mood:"smile"}],
    undead:[{who:"narr", text:"路邊有一團淡淡的光，留下一個小布包就散掉了。"}, {who:"fox", text:"上次那個{type}……安息了吧。", mood:"normal"}]
  },
  giftGold:15,                                 // 報恩：每隻拿到幾 gp（暫定）
  giftLog:"報恩的禮物：每隻 {g} gp"
};
