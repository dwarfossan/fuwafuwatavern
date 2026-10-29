/* 每日委託（10-10，大爺定：公會每天換委託、接了地圖出現驚嘆號泡泡、點了就過去打）
   香香定、全部暫定：每天 3 個（★、★★、★★★ 各一）、報酬、委託文字、地形
   - 「每天」＝遊戲日（長休推進一天，跟道具店換貨同一個天數）；沒做完的換日就消失
   - 只有討伐：地圖上的敵人全倒＝完成（給測試的朋友有東西打）
   - 戰場用委託地圖產生器（data/quest-map.js），敵人照委託；地形主題看在哪條路上（QUEST_THEME） */
const QUEST_PER_DAY = 3;
// 報酬：gold＝全隊合計（gp），四隻平分；magic＝給魔法物品的機率（一件，隨機給一隻）
const QUEST_REWARD = {1:{gold:60, magic:0}, 2:{gold:160, magic:.25}, 3:{gold:400, magic:1}};
// 委託內容（draft：香香）。foes 照順序擺，兩隻一小隊
const QUEST_TEMPLATES = [
  {id:"goblin_raid",   stars:1, title:"追回被搶的貨", client:"商人",     foes:["goblin","goblin","goblin_archer"],          text:"哥布林搶了商隊的貨。打跑牠們，貨能拿回多少算多少。"},
  {id:"bone_walk",     stars:1, title:"走路的骨頭",   client:"守墓人",   foes:["skeleton","skeleton","skeleton_archer"],    text:"墓地的骨頭爬出來，在路上晃。請讓它們回去躺好。"},
  {id:"zombie_field",  stars:1, title:"不是稻草人",   client:"農夫",     foes:["zombie","zombie","zombie"],                 text:"田裡的稻草人會走路。後來發現，那不是稻草人。"},
  {id:"toll_bandits",  stars:1, title:"收過路費的人", client:"旅人",     foes:["bandit","bandit","bandit_archer"],          text:"路上有人在收過路費。他們不是收費員。"},
  {id:"cave_pests",    stars:1, title:"會飛的、會黏的", client:"採藥人", foes:["slime","bat","bat","bat"],                  text:"採藥的路上有東西會飛、有東西會黏。兩種都不想再碰到。"},
  {id:"orc_scouts",    stars:2, title:"獸人斥候",     client:"公會",     foes:["orc","orc","goblin","goblin_archer"],       text:"獸人帶著哥布林在附近探路。趁牠們回去報信之前攔下來。"},
  {id:"weeping_house", stars:2, title:"哭泣的廢屋",   client:"鎮民",     foes:["ghost","zombie","zombie"],                  text:"廢屋晚上有人在哭。進去看的人，出來都說不出話。"},
  {id:"spider_web",    stars:2, title:"一整片蛛網",   client:"獵人",     foes:["giant_spider","giant_spider"],              text:"林子裡拉了一整片網。獵人的狗追進去，就沒回來。"},
  {id:"griffin_hunt",  stars:2, title:"叼羊的獅鷲",   client:"牧羊人",   foes:["griffin","bat","bat"],                      text:"獅鷲把羊叼走了。今天兩隻，明天可能是牧羊人。"},
  // 墓地線結局之後才會出現（grave＝哪個結局；10-29，女貴族＝諷刺台灣政客、帶點可愛的遜炮）
  {id:"noble_revenge", stars:2, title:"毛球盤查哨",   client:"艾妲（代貼）", grave:"protected", foes:["guard_captain","guard_halberd","guard_archer"], text:"芙蘿拉小姐的護衛隊在路上設了盤查哨，專攔毛球。她說這是「依王國律法辦事」。麻煩去把盤查哨拆了。"},
  {id:"resort_haunt",  stars:2, title:"度假村的客訴", client:"芙蘿拉・金庫爾", grave:"resort", goldMul:.9, foes:["ghost","skeleton","skeleton_archer"], text:"度假村一到晚上客人就被嚇跑。本小姐文書齊全、依法辦事，這是前任守墓人留下的問題。告示也在廣場貼過了（貼了一個早上）。報酬照行情——打九折。"},
  {id:"owlbear",       stars:3, title:"梟熊出沒",     client:"樵夫",     foes:["owlbear"],                                  text:"樵夫被追了半座山。牠還在附近，而且看起來還沒吃飽。"},
  {id:"chimera",       stars:3, title:"三個頭的怪物", client:"公會",     foes:["chimera"],                                  text:"目擊者說是獅子、說是山羊、說是龍。三個人說的都對。"},
  {id:"night_lady",    stars:3, title:"夜裡的貴婦",   client:"鎮民聯名", foes:["vampire","bat","bat","bat"],                text:"夜裡有個穿禮服的女吸血鬼在鎮上嚇人，已經好幾次了。鎮民聯名請公會處理。"},   // 跟墓地線的女吸血鬼是同一隻（10-28）
  {id:"bone_master",   stars:3, title:"骨頭的主人",   client:"守墓人",   foes:["lich","skeleton","skeleton_archer"],        text:"骨頭會走路，是因為有人在後面拉線。去把拉線的找出來。"},
  {id:"black_rider",   stars:3, title:"黑馬騎士",     client:"公會",     foes:["death_knight","skeleton","skeleton"],      text:"路上有個騎黑馬的騎士。他不說話，只是一直往這邊騎。"}
];
const QUEST_UI = {
  board:"委託板", day:"第 {d} 天的委託", refresh:"長休之後換新的委託；沒做完的會消失。",
  accept:"接下委託", accepted:"已接下 · 到地圖上點 ❗", done:"已完成", client:"委託人", reward:"報酬",
  rewardText:"{g} gp（四隻平分）", magic:"＋魔法物品", magicChance:"＋{p}% 機率魔法物品",
  go:"出發", pin:"委託", far:"走過去要一點時間。", cleared:"委託完成！敵人全被打倒了！",
  got:"委託報酬：每隻 {g} gp", gotItem:"{who}拿到了{item}", draft:"委託內容、報酬、怪物數值暫定（香香）",
  foes:"目擊"
};
