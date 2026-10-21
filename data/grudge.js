/* 被敲暈的敵人之後怎麼了（大爺 10-21）：文字、數字全部暫定（draft：香香）
   委託裡被敲暈的敵人，打完（贏或撤退）各擲 1d20，結果不顯示，等事情發生才知道；跟劇情有關的不擲（梟熊媽媽、梟熊寶寶）
   1：傷太重沒走出來（對牠最慘）　2：回心轉意來報恩　3–5：不幹了　6–10：就這樣逃走了　11–15：記仇回來　16–18：記仇＋找幫手　19：閉關苦練　20：進化（對牠最好，大爺 10-21）
   回來的仇人混進同一條路上之後的委託；再被敲暈就再擲一次（傷疤疊上去），最多回來 3 次；打死就結束 */
const GRUDGE = {
  draft:"香香",
  maxReturns:3,
  // d20 → 結果
  table:[[1,1,"dead"],[2,2,"grateful"],[3,5,"retire"],[6,10,"gone"],[11,15,"return"],[16,18,"gang"],[19,19,"train"],[20,20,"evolve"]],
  // 進化：一次只升一階；表裡沒有下一階的，照 19 閉關苦練算（之後補怪物再接）
  evolve:{goblin:"goblin_hero", goblin_archer:"goblin_hero", goblin_hero:"goblin_chief", orc:"orc_hero", orc_hero:"orc_chief"},
  // 種類：人形／野獸／不死魔物（沒寫的當野獸）
  category:{goblin:"humanoid",goblin_archer:"humanoid",goblin_shaman:"humanoid",goblin_hero:"humanoid",goblin_chief:"humanoid",orc_hero:"humanoid",orc_chief:"humanoid",bandit:"humanoid",bandit_archer:"humanoid",orc:"humanoid",hunter:"humanoid",hunter_archer:"humanoid",vampire:"humanoid",
    // 不死：有智慧的才會說話（大爺 10-21）＝幽靈、巫妖、死亡騎士；骷髏、殭屍、骷髏戰馬沒腦子，只有動作
    ghost:"undead",lich:"undead",death_knight:"undead",
    skeleton:"mindless",skeleton_archer:"mindless",zombie:"mindless",dk_horse:"mindless"},
  // 回來時變多強：每回來一次等級 +1、血量 +25%；閉關苦練再多 +1 級、AC +1，沒有天生技能的學一招（看種類）
  hpPer:.25, trainAc:1, xpPer:.5,
  trainSkill:{humanoid:"bandit_sand", beast:"cub_pounce", undead:"ghost_wail", mindless:"undead_fortitude"},
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
    humanoid:[
      "又是你們這群臭毛球！{by}，今天我要扒了你的皮做圍巾！",
      "{by}！你這死畜生，上次害我躺了三天，這筆帳今天連本帶利討回來！",
      "哈！臭毛球自己送上門了！{by}，這次換我把你打到爬不起來！",
      "看到你這張毛臉我就火大！{by}，給我跪下求饒！",
      "{by}，你那一下我每天晚上都夢到——今天輪到你做惡夢了！",
      "小的們聽好！那隻叫{by}的毛球留給我，其他的隨便你們剁！"
    ],
    beast:[
      "（認出{by}，齜牙咧嘴地低吼，口水滴了一地）",
      "（盯著{by}，全身的毛都豎了起來，喉嚨裡滾著怒吼）",
      "（嗅到{by}的味道，發狂似地撞斷了身邊的樹枝）"
    ],
    mindless:[
      "（喀啦喀啦——骨頭全轉向{by}，下巴不停地開合）",
      "（認出{by}，發出沒有意義的低吼，拖著腳步直直衝過來）",
      "（身上還留著上次的傷，空洞的眼睛死盯著{by}）"
    ],
    undead:[
      "……{by}……臭毛球……我從墳裡爬回來……就是為了你……",
      "（空洞的眼窩轉向{by}）……死畜生……這次……換你躺進土裡……",
      "……我記得你的味道，{by}……溫熱的、討厭的毛……"
    ]
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
