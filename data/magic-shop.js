/* 魔法現貨第一批：效果、價格與來歷全部 GPT 暫定／草稿；不借新法術。 */
const MAGIC_RARITIES={white:{name:'普通',color:'#eee1d0'},blue:{name:'魔法',color:'#80b8ef'},yellow:{name:'稀有',color:'#edcf65'},orange:{name:'傳奇',color:'#ee9a55'},gold:{name:'獨特',color:'#d9b679'}};
const MAGIC_GOODS=[
 {key:'flame_bow',n:'烈焰長弓',base:'長弓',rarity:'blue',cost:300,extraDamage:{type:'火焰',amount:1},desc:'命中時額外造成 1 點火焰傷害。'},
 {key:'frost_bow',n:'霜寒長弓',base:'長弓',rarity:'blue',cost:300,extraDamage:{type:'寒冷',amount:1},desc:'命中時額外造成 1 點寒冷傷害，不會因此使目標緩速。'},
 {key:'spark_sword',n:'雷鳴短劍',base:'短劍',rarity:'blue',cost:300,extraDamage:{type:'閃電',amount:1},desc:'命中時額外造成 1 點閃電傷害，不會因此使目標麻痺。'},
 {key:'light_sword',n:'輕羽短劍',base:'短劍',rarity:'blue',cost:300,weightMul:.5,desc:'重量是普通短劍的一半。'},
 {key:'guard_leather',n:'守護皮甲',base:'皮甲',rarity:'blue',cost:300,acBonus:1,desc:'基礎 AC 比普通皮甲高 1。'},
 {key:'fire_leather',n:'抗火皮甲',base:'皮甲',rarity:'blue',cost:300,resistances:['火焰'],desc:'穿著時獲得火焰抗性；不提供燃燒狀態免疫。'},
 {key:'flame_light_bow',n:'烈焰輕羽長弓',base:'長弓',rarity:'yellow',cost:3000,extraDamage:{type:'火焰',amount:1},weightMul:.5,desc:'命中時額外造成 1 點火焰傷害；重量是普通長弓的一半。'},
 {key:'frost_guard_leather',n:'霜寒守護皮甲',base:'皮甲',rarity:'yellow',cost:3000,acBonus:1,resistances:['寒冷'],desc:'基礎 AC 比普通皮甲高 1；穿著時獲得寒冷抗性。'},
 {key:'light_staff',n:'輕羽治癒法書',base:'治癒法書',rarity:'yellow',cost:3000,weightMul:.5,resistances:['火焰'],desc:'重量是普通治癒法書的一半；拿在手上時獲得火焰抗性。'},
 {key:'hunter_bow',n:'非凡長弓',base:'非凡長弓',rarity:'blue',cost:300,desc:'可以施放狩印；標記的目標倒下後可免費改標。',lore:'這把弓曾掛在一名守林人的門後。商人說主人退休了；弓柄上卻還留著被匆忙鋸掉的名字。莉莉安娜只說，弓記得獵物，不記得帳單。'},
 {key:'night_coat',n:'守夜人的披風',base:'鑲釘皮甲',rarity:'orange',cost:30000,resistances:['火焰'],weightMul:.5,desc:'防護照鑲釘皮甲，重量減半；穿著時獲得火焰抗性。',lore:'舊城守夜人用它裹住火場裡救出的孩子。披風沒燒壞，薪水卻扣了三個月，理由是制服擅自借人。她最後把制服和辭呈一起交了出去。'},
 {key:'dimension_bag',n:'次元背包',base:'次元背包',rarity:'blue',cost:300,desc:'裝在背包欄時，負重上限變成 2 倍。',lore:'最早的主人堅持包裡只裝了三件行李。海關數到第十七箱時，他補充：三件是指家具、食物，以及其他。後來這個包就換了主人。'},
 {key:'wind_bow',n:'風隙長弓',base:'長弓',rarity:'gold',cost:3000,hitBonus:1,extraDamage:{type:'閃電',amount:1},desc:'武器攻擊命中加值 +1；命中時額外造成 1 點閃電傷害。',lore:'山口的信差拿它射斷過一百次吊橋繩，總說這樣能替追兵省下走錯路的麻煩。弓被收走後，莉莉安娜收到一封沒有郵票的信：記得跟下一位買家說，橋只算單程。'},
 // 10-10 大爺挑的新橙／金（香香草案；效果數值暫定、名稱與來歷草稿）
 {key:'frostbite_axe',n:'霜咬戰斧',base:'戰斧',rarity:'orange',cost:30000,hitBonus:1,extraDamage:{type:'寒冷',amount:1},desc:'武器攻擊命中加值 +1；命中時額外造成 1 點寒冷傷害。',lore:'北邊伐木場的老工頭說這把斧頭咬過冰河，冰河咬回來，所以斧刃上缺了一角。',draft:'香香'},
 {key:'ash_cloak',n:'灰燼斗篷',base:'法袍',rarity:'orange',cost:30000,acBonus:1,resistances:['火焰'],desc:'基礎 AC 比普通法袍高 1；穿著時獲得火焰抗性。',lore:'一位法師在自己的火球裡站了整整一輪，只為了證明這件斗篷沒問題。斗篷確實沒問題。',draft:'香香'},
 {key:'liliana_scale',n:'莉莉安娜的舊秤',base:'鑲釘皮甲',rarity:'gold',cost:30000,resistances:['強酸'],weightMul:.5,desc:'防護照鑲釘皮甲，重量減半；穿著時獲得強酸抗性。',lore:'莉莉安娜說她用這副秤量過一頭龍的良心，結果秤盤融了一半，剩下的被打成了這件甲。',draft:'香香'},
 {key:'lost_shortsword',n:'迷途者短劍',base:'短劍',rarity:'gold',cost:3000,hitBonus:1,extraDamage:{type:'力場',amount:1},desc:'武器攻擊命中加值 +1；命中時額外造成 1 點力場傷害。',lore:'劍身刻著「往回走」。沒有人知道是從哪裡往回走，帶著它的人倒是都回來了。',draft:'香香'},
].map(g=>({...g,draft:'GPT'}));
const MAGIC_SHOP_UI={cat:'魔法物品',sold:'已售完',buy:'買下這件',draft:'價格、效果數值暫定／來歷草稿',day:'日',refresh:'長休後換貨',lore:'來歷',stock:'今日現貨'};
