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
  evolve:{goblin:"goblin_hero", goblin_archer:"goblin_hero", goblin_hero:"goblin_chief", orc:"orc_hero", orc_hero:"orc_chief",
    skeleton:"skeleton_warrior", skeleton_archer:"skeleton_warrior", skeleton_warrior:"lich",
    bandit:"bandit_captain", bandit_archer:"bandit_captain", zombie:"ghoul"},   // 10-21   // 骷髏兵／弓手→骷髏勇士→巫妖（大爺 10-21）
  // 種類：人形／野獸／不死魔物（沒寫的當野獸）
  category:{goblin:"humanoid",goblin_archer:"humanoid",goblin_shaman:"humanoid",goblin_hero:"humanoid",goblin_chief:"humanoid",orc_hero:"humanoid",orc_chief:"humanoid",bandit:"humanoid",bandit_archer:"humanoid",bandit_captain:"humanoid",orc:"humanoid",hunter:"humanoid",hunter_archer:"humanoid",vampire:"humanoid",
    // 不死：有智慧的才會說話（大爺 10-21）＝幽靈、巫妖、死亡騎士；骷髏、殭屍、骷髏戰馬沒腦子，只有動作
    ghost:"undead",lich:"undead",death_knight:"undead",
    skeleton_warrior:"warrior",   // 骷髏勇士：會說話、記得生前的事（大爺 10-21）
    skeleton:"mindless",skeleton_archer:"mindless",zombie:"mindless",ghoul:"mindless",forest_druid:"humanoid",goblin_mage:"humanoid",kobold:"humanoid",kobold_mage:"humanoid",red_wyrmling:"humanoid",dk_horse:"mindless"},
  // 回來時變多強：每回來一次等級 +1、血量 +25%；閉關苦練再多 +1 級、AC +1，沒有天生技能的學一招（看種類）
  hpPer:.25, trainAc:1, xpPer:.5,
  trainSkill:{humanoid:"bandit_sand", beast:"cub_pounce", undead:"ghost_wail", mindless:"undead_fortitude", warrior:"undead_fortitude"},
  // 傷疤造型（js/art/scars.js）：沒有座標的怪物（龍、死亡騎士、寶箱怪、食人花……）先只有綽號、狀態卡那行
  scarBase:look => /^goblin/.test(look||"") ? "goblin" : /^orc/.test(look||"") ? "orc" : /^(skeleton|lich)/.test(look||"") ? "skeleton"   // skeleton_warrior 也算骷髏
    : /^(human|bandit)/.test(look||"") ? "human"                                          // 人類：盜賊、獵人、盜賊頭目（10-21）
    : (typeof STATIC_SCAR!=="undefined" && STATIC_SCAR[look]) || (SCAR_SPOTS[look] && SCAR_SPOTS[look].doll) ? look : null,   // 殭屍、幽靈、食屍鬼、野獸（10-21）
  // 綽號：照最後一道傷疤
  nick:{揮砍:"刀疤", 穿刺:"獨眼", 鈍擊:"腫眼", 火焰:"焦臉", 其他:"帶電"},
  nickTail:["", "老對手", "宿敵"],          // 第幾次回來（1、2、3）
  // 狀態卡那一行
  card:(by, how, n)=>`記仇：上次被${by}${how}${n>1?`（第 ${n} 次回來）`:""}`,
  how:{揮砍:"砍暈", 穿刺:"刺暈", 鈍擊:"敲暈", 火焰:"燒暈", 其他:"用法術打暈"},
  // 碰面時喊的（{by}＝上次打暈牠的那隻是什麼：白虎／狐狸／灰狼／狸貓；怪物不知道毛毛們的名字，大爺 10-21）
  shout:{
    humanoid:[
      "又是你們這群臭毛球！那隻{by}，今天我要扒了你的皮做圍巾！",
      "臭{by}！你這死畜生，上次害我躺了三天，這筆帳今天連本帶利討回來！",
      "哈！臭毛球自己送上門了！那隻{by}，這次換我把你打到爬不起來！",
      "看到你這張{by}臉我就火大！給我跪下求饒！",
      "你這隻{by}，你那一下我每天晚上都夢到——今天輪到你做惡夢了！",
      "小的們聽好！那隻{by}留給我，其他的毛球隨便你們剁！"
    ],
    beast:[
      "（認出了那隻{by}，齜牙咧嘴地低吼，口水滴了一地）",
      "（盯著那隻{by}，全身的毛都豎了起來，喉嚨裡滾著怒吼）",
      "（嗅到那隻{by}的味道，發狂似地撞斷了身邊的樹枝）"
    ],
    mindless:[
      "（喀啦喀啦——骨頭全轉向那隻{by}，下巴不停地開合）",
      "（認出了那隻{by}，發出沒有意義的低吼，拖著腳步直直衝過來）",
      "（身上還留著上次的傷，空洞的眼睛死盯著那隻{by}）"
    ],
    // 骷髏勇士：生前的記憶東缺一塊西缺一塊（大爺 10-21：比較有喜感）
    warrior:[
      "又是你這隻{by}！我生前可是王國近衛隊的……隊……呃，某個隊！總之今天你死定了，臭毛球！",
      "這把劍我生前練了二十年！……還是三十年？反正砍你這死畜生夠用了！",
      "我想起來了！我生前最討厭的就是毛茸茸的東西！尤其是你這隻{by}！",
      "（喀啦）……等等，我老婆叫什麼來著……算了！臭{by}，先扒了你的皮再說！",
      "上次被你打散的骨頭，我一根一根撿回來的！少一根肋骨你知道我找多久嗎，臭{by}！",
      "我生前戰無不勝！……除了那次。還有那次。還有上次被你打暈那次！"
    ],
    undead:[
      "……那隻{by}……臭毛球……我從墳裡爬回來……就是為了你……",
      "（空洞的眼窩轉向那隻{by}）……死畜生……這次……換你躺進土裡……",
      "……我記得你的味道……臭{by}……溫熱的、討厭的毛……"
    ]
  },
  shoutLog:"{name}認出了{by}！",   // 旁白給玩家看的，用名字
  byUnknown:"毛球",                 // 不知道是哪隻打暈的
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
