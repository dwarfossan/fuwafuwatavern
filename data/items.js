/* ======================== 裝備資料（數值取自 SRD 5.2，CC-BY-4.0，見 README） ========================
   cost 以銅幣(cp)計：1 gp = 10 sp = 100 cp；wt 以磅(lb)計
   武器 props：輕型、靈巧、投擲、雙手、多用、重型、觸及、裝填、彈藥
   mastery：武器專精 */
const GP=100, SP=10, CP=1;
const W=(n,en,cat,cost,wt,dmg,props,mastery)=>({type:"weapon",n,en,cat,cost,wt,dmg,props,mastery});
// 套組：contains＝內容物（名字跟單項物品一樣的就能代替那個單項）；note＝數量；有背包的 bag:1（能放背包欄）
const PACK=(n,en,cost,wt,contains,note)=>({type:"gear",n,en,cat:"冒險用品",cost,wt,contains,
  ...(contains.includes("背包")?{bag:1}:{}),
  desc:`內含：${contains.join("、")}（${note}）。視同帶著裡面的每一樣：探索時需要其中任何一樣都算有，不逐個消耗。`});
const ITEMS = [
  // 簡易近戰
  W("短棒","Club","簡易近戰",1*SP,2,"1d4 鈍擊",["輕型"],"緩速 Slow"),
  W("匕首","Dagger","簡易近戰",2*GP,1,"1d4 穿刺",["靈巧","輕型","投擲 20/60"],"快擊 Nick"),
  W("巨棒","Greatclub","簡易近戰",2*SP,10,"1d8 鈍擊",["雙手"],"推擊 Push"),
  W("手斧","Handaxe","簡易近戰",5*GP,2,"1d6 揮砍",["輕型","投擲 20/60"],"困擾 Vex"),
  W("標槍","Javelin","簡易近戰",5*SP,2,"1d6 穿刺",["投擲 30/120"],"緩速 Slow"),
  W("輕錘","Light Hammer","簡易近戰",2*GP,2,"1d4 鈍擊",["輕型","投擲 20/60"],"快擊 Nick"),
  W("硬頭錘","Mace","簡易近戰",5*GP,4,"1d6 鈍擊",[],"削弱 Sap"),
  W("長棍","Quarterstaff","簡易近戰",2*SP,4,"1d6 鈍擊",["多用 1d8"],"擊倒 Topple"),
  W("鐮刀","Sickle","簡易近戰",1*GP,2,"1d4 揮砍",["輕型"],"快擊 Nick"),
  W("矛","Spear","簡易近戰",1*GP,3,"1d6 穿刺",["投擲 20/60","多用 1d8"],"削弱 Sap"),
  // 簡易遠程
  W("飛鏢","Dart","簡易遠程",5*CP,0.25,"1d4 穿刺",["靈巧","投擲 20/60"],"困擾 Vex"),
  W("輕弩","Light Crossbow","簡易遠程",25*GP,5,"1d8 穿刺",["彈藥 80/320","裝填","雙手"],"緩速 Slow"),
  W("短弓","Shortbow","簡易遠程",25*GP,2,"1d6 穿刺",["彈藥 80/320","雙手"],"困擾 Vex"),
  W("投石索","Sling","簡易遠程",1*SP,0,"1d4 鈍擊",["彈藥 30/120"],"緩速 Slow"),
  // 軍用近戰
  W("戰斧","Battleaxe","軍用近戰",10*GP,4,"1d8 揮砍",["多用 1d10"],"擊倒 Topple"),
  W("鏈枷","Flail","軍用近戰",10*GP,2,"1d8 鈍擊",[],"削弱 Sap"),
  W("長柄刀","Glaive","軍用近戰",20*GP,6,"1d10 揮砍",["重型","觸及","雙手"],"擦傷 Graze"),
  W("巨斧","Greataxe","軍用近戰",30*GP,7,"1d12 揮砍",["重型","雙手"],"橫掃 Cleave"),
  W("巨劍","Greatsword","軍用近戰",50*GP,6,"2d6 揮砍",["重型","雙手"],"擦傷 Graze"),
  W("戟","Halberd","軍用近戰",20*GP,6,"1d10 揮砍",["重型","觸及","雙手"],"橫掃 Cleave"),
  W("長劍","Longsword","軍用近戰",15*GP,3,"1d8 揮砍",["多用 1d10"],"削弱 Sap"),
  W("巨錘","Maul","軍用近戰",10*GP,10,"2d6 鈍擊",["重型","雙手"],"擊倒 Topple"),
  W("釘頭錘","Morningstar","軍用近戰",15*GP,4,"1d8 鈍擊",[],"削弱 Sap"),
  W("長矛","Pike","軍用近戰",5*GP,18,"1d10 穿刺",["重型","觸及","雙手"],"推擊 Push"),
  W("刺劍","Rapier","軍用近戰",25*GP,2,"1d8 穿刺",["靈巧"],"困擾 Vex"),
  W("彎刀","Scimitar","軍用近戰",25*GP,3,"1d6 揮砍",["靈巧","輕型"],"快擊 Nick"),
  W("短劍","Shortsword","軍用近戰",10*GP,2,"1d6 穿刺",["靈巧","輕型"],"困擾 Vex"),
  W("三叉戟","Trident","軍用近戰",5*GP,4,"1d8 穿刺",["投擲 20/60","多用 1d10"],"擊倒 Topple"),
  W("戰錘","Warhammer","軍用近戰",15*GP,5,"1d8 鈍擊",["多用 1d10"],"推擊 Push"),
  W("戰鎬","War Pick","軍用近戰",5*GP,2,"1d8 穿刺",["多用 1d10"],"削弱 Sap"),
  W("鞭","Whip","軍用近戰",2*GP,3,"1d4 揮砍",["靈巧","觸及"],"緩速 Slow"),
  // 軍用遠程
  W("吹箭筒","Blowgun","軍用遠程",10*GP,1,"1 穿刺",["彈藥 25/100","裝填"],"困擾 Vex"),
  W("手弩","Hand Crossbow","軍用遠程",75*GP,3,"1d6 穿刺",["彈藥 30/120","輕型","裝填"],"困擾 Vex"),
  W("重弩","Heavy Crossbow","軍用遠程",50*GP,18,"1d10 穿刺",["彈藥 100/400","重型","裝填","雙手"],"推擊 Push"),
  W("長弓","Longbow","軍用遠程",50*GP,2,"1d8 穿刺",["彈藥 150/600","重型","雙手"],"緩速 Slow"),
  // 火槍、手槍（大爺 10-03，SRD 5.2）：子彈放彈袋；技能先借弩類（暫定）
  W("火槍","Musket","軍用遠程",500*GP,10,"1d12 穿刺",["彈藥 40/120","裝填","雙手"],"緩速 Slow"),
  W("手槍","Pistol","軍用遠程",250*GP,3,"1d10 穿刺",["彈藥 30/90","裝填"],"困擾 Vex"),
  // 護甲（2026-10-01 大爺：改回 SRD 5.2 的名稱和屬性，以後規則分類、特殊裝備比較好歸類）
  //   tier：輕甲／中甲／重甲／衣服（衣服＝法袍，不算穿護甲，法師護甲照開）；紙娃娃照名稱畫，沒畫到的照 tier 畫
  //   ac 基礎值、dex: full（加全部敏捷）/ max2（最多 +2）/ none、str 力量需求、stealth＝潛行劣勢；數值照 SRD 5.2 核對過
  {type:"armor",n:"法袍",en:"Robe",cat:"護甲",tier:"衣服",cost:5*GP,wt:4,ac:11,dex:"full",cloth:true},
  // 破布衣：哥布林穿的（大爺 10-02 取名），商店不賣；AC 跟沒穿一樣（10＋敏捷），重量是暫定值
  {type:"armor",n:"破布衣",en:"Rags",cat:"護甲",tier:"衣服",cost:0,wt:2,ac:10,dex:"full",cloth:true,noShop:true},
  // +1 薩滿袍：哥布林薩滿穿的（大爺 10-02），D&D 的 +1 魔法物品，比法袍好 1 點，引誘玩家給四小隻穿；商店不賣
  //   外觀是一整套：紫袍＋骷髏頭飾＋牙齒項鍊（js/art/doll.js 的 ARMOR_ART，頭飾、項鍊照每隻的錨點擺）
  {type:"armor",n:"+1 薩滿袍",en:"+1 Shaman Robe",cat:"護甲",tier:"衣服",cost:0,wt:4,ac:12,dex:"full",cloth:true,noShop:true},
  {type:"armor",n:"軟甲",en:"Padded Armor",cat:"護甲",tier:"輕甲",cost:5*GP,wt:8,ac:11,dex:"full",stealth:true},
  {type:"armor",n:"皮甲",en:"Leather Armor",cat:"護甲",tier:"輕甲",cost:10*GP,wt:10,ac:11,dex:"full"},
  {type:"armor",n:"鑲釘皮甲",en:"Studded Leather Armor",cat:"護甲",tier:"輕甲",cost:45*GP,wt:13,ac:12,dex:"full"},
  {type:"armor",n:"獸皮甲",en:"Hide Armor",cat:"護甲",tier:"中甲",cost:10*GP,wt:12,ac:12,dex:"max2"},
  {type:"armor",n:"鏈甲衫",en:"Chain Shirt",cat:"護甲",tier:"中甲",cost:50*GP,wt:20,ac:13,dex:"max2"},
  {type:"armor",n:"鱗甲",en:"Scale Mail",cat:"護甲",tier:"中甲",cost:50*GP,wt:45,ac:14,dex:"max2",stealth:true},
  {type:"armor",n:"胸甲",en:"Breastplate",cat:"護甲",tier:"中甲",cost:400*GP,wt:20,ac:14,dex:"max2"},
  {type:"armor",n:"半身板甲",en:"Half Plate Armor",cat:"護甲",tier:"中甲",cost:750*GP,wt:40,ac:15,dex:"max2",stealth:true},
  {type:"armor",n:"環甲",en:"Ring Mail",cat:"護甲",tier:"重甲",cost:30*GP,wt:40,ac:14,dex:"none",stealth:true},
  {type:"armor",n:"鏈甲",en:"Chain Mail",cat:"護甲",tier:"重甲",cost:75*GP,wt:55,ac:16,dex:"none",str:13,stealth:true},
  {type:"armor",n:"板條甲",en:"Splint Armor",cat:"護甲",tier:"重甲",cost:200*GP,wt:60,ac:17,dex:"none",str:15,stealth:true},
  {type:"armor",n:"全身板甲",en:"Plate Armor",cat:"護甲",tier:"重甲",cost:1500*GP,wt:65,ac:18,dex:"none",str:15,stealth:true},
  {type:"shield",n:"盾牌",en:"Shield",cat:"盾牌",cost:10*GP,wt:6,ac:2},
  // 法器：每件綁定一組 3 個法術（見 data/skills.js）；價格重量參考 SRD 的法杖、法球與法術書
  {type:"focus",n:"奧術法杖",en:"Arcane Staff",cat:"法器",cost:5*GP,wt:4,stat:"INT",spells:"魔法飛彈、護盾術、法師護甲"},
  {type:"focus",n:"治癒法書",en:"Tome of Healing",cat:"法器",cost:50*GP,wt:3,stat:"WIS",spells:"治癒真言、治療傷口、祝福術"},
  {type:"focus",n:"火焰法球",en:"Flame Orb",cat:"法器",cost:20*GP,wt:3,stat:"CHA",spells:"火焰箭、燃燒之手、火焰護盾"},
  // 薩滿圖騰：哥布林薩滿拿的，商店不賣（noShop），打掉之後誰都能撿來用
  {type:"focus",n:"薩滿圖騰",en:"Shaman Totem",cat:"法器",cost:20*GP,wt:3,stat:"WIS",spells:"火焰箭、治癒真言、災禍術",noShop:true},
  // 商隊的報酬（大爺 10-03）：商店不賣。base＝原型武器（規則照原型算）；grants＝裝備時多出的特性技能
  {...W("非凡長弓","Uncommon Longbow","軍用遠程",0,2,"1d8 穿刺",["彈藥 150/600","重型","雙手"],"緩速 Slow"), base:"長弓", noShop:true, grants:["hunters_mark"],
   desc:"非凡品質的長弓，弓身嵌著稀有金屬。狩獵者特性：裝備時可以使用【狩印】。"},
  // 冒險用品
  {type:"gear",n:"背包",en:"Backpack",cat:"冒險用品",cost:2*GP,wt:5, bag:1},
  // 次元背包：放在背包欄（裝備）時，負重上限變 2 倍（大爺 10-03）；重量照 SRD 15 磅
  {type:"gear",n:"次元背包",en:"Bag of Holding",cat:"冒險用品",cost:0,wt:15, bag:2, noShop:true, desc:"裡面比外面大得多。裝在背包欄時，負重上限變成 2 倍。"},
  {type:"gear",n:"睡袋",en:"Bedroll",cat:"冒險用品",cost:1*GP,wt:7},
  {type:"gear",n:"繩索（50 呎）",en:"Rope",cat:"冒險用品",cost:1*GP,wt:5},
  {type:"gear",n:"火把",en:"Torch",cat:"冒險用品",cost:1*CP,wt:1},
  {type:"gear",n:"口糧（1 天）",en:"Rations",cat:"冒險用品",cost:5*SP,wt:2},
  {type:"gear",n:"水袋",en:"Waterskin",cat:"冒險用品",cost:2*SP,wt:5},
  {type:"gear",n:"火絨盒",en:"Tinderbox",cat:"冒險用品",cost:5*SP,wt:1},
  {type:"gear",n:"箭袋",en:"Quiver",cat:"冒險用品",cost:1*GP,wt:1, ammoFor:"bow", desc:"弓的普通彈藥來源。只要放在背包裡，就視為有普通箭矢，不逐發消耗。"},
  {type:"gear",n:"矢匣",en:"Bolt Case",cat:"冒險用品",cost:1*GP,wt:1.5, ammoFor:"crossbow", desc:"弩的普通彈藥來源。只要放在背包裡，就視為有普通弩矢，不逐發消耗。"},
  // 彈袋（大爺 10-03，SRD 的 Pouch）：投石索的鉛彈、吹箭筒的針、火槍手槍的子彈共用（本作簡化：一個彈袋裝得下全部）
  {type:"gear",n:"彈袋",en:"Pouch",cat:"冒險用品",cost:5*SP,wt:1, ammoFor:"pouch", desc:"投石索的鉛彈、吹箭筒的針、火槍和手槍的子彈都放這裡。只要放在背包裡，就視為帶著這些彈藥，不逐發消耗。"},
  {type:"gear",n:"醫療包",en:"Healer's Kit",cat:"冒險用品",cost:5*GP,wt:3},
  // 道具（消耗品，SRD 5.2）：戰鬥中用掉「免費動作」，用完就沒了
  //   use.kind：drink 喝（自己或貼身隊友）／attack 丟過去做遠程攻擊／save 丟過去讓目標豁免
  //   range：格數；丟給貼身隊友＝交給他（不會用掉效果）
  //   proj：丟出去時飛行物的樣子（見 PROJ_ART）；投擲武器不用寫，直接用那把武器的圖
  {type:"consumable",n:"治療藥水",en:"Potion of Healing",cat:"道具",cost:50*GP,wt:0.5,
   use:{kind:"drink", range:1, heal:"2d4+2"}, desc:"喝下恢復 2d4+2 生命；也可以餵給貼身的隊友。"},
  {type:"consumable",n:"鍊金火",en:"Alchemist's Fire",cat:"道具",cost:50*GP,wt:1,
   use:{kind:"attack", range:4, dmg:"1d4", type:"火焰", status:"burning"}, proj:"flask_fire", desc:"丟向 4 格內的敵人（遠程攻擊，用敏捷）：命中受 1d4 火焰傷害並開始燃燒。"},
  {type:"consumable",n:"酸液瓶",en:"Acid",cat:"道具",cost:25*GP,wt:1,
   use:{kind:"save", range:4, save:"DEX", dmg:"2d6", type:"強酸"}, proj:"flask_acid", desc:"丟向 4 格內的敵人：敏捷豁免失敗受 2d6 強酸傷害。"},
  {type:"consumable",n:"網子",en:"Net",cat:"道具",cost:1*GP,wt:3,
   use:{kind:"save", range:3, save:"DEX", status:"restrained", escape:10}, proj:"net", desc:"丟向 3 格內的敵人：敏捷豁免失敗就被束縛（不能移動；打他有優勢、他攻擊有劣勢），要花動作做力量檢定 10 才能掙脫。"},
  // 點心：商隊的報酬（大爺 10-03）。跟其他道具不同，吃要花「動作」；吃下去＝這一隻短休一次（熟練格每階回一半），也能餵貼身隊友
  {type:"consumable",n:"點心",en:"Snack",cat:"道具",cost:0,wt:0.5, noShop:true,
   use:{kind:"eat", range:1, action:true}, desc:"花一個動作吃掉（或餵給貼身的隊友）：等於這一隻短休一次，熟練格每一階回一半。"},
  {type:"gear",n:"材料包",en:"Material Pack",cat:"冒險用品",cost:5*GP,wt:2, desc:"重現特殊／天生能力用的通用材料。只要放在背包裡就能使用需要材料的怪招。"},
  // 套組（大爺 10-03，內容照 SRD 5.2）：視同帶著裡面的每一樣（hasGear），探索時查繩索、火把等都算有，不逐個消耗。
  //   contains 寫的名字跟單項物品一樣的，就能代替那個單項；有「背包」的套組可以放背包欄
  PACK("探險者套組","Explorer's Pack",10*GP,55,["背包","睡袋","油（2 瓶）","口糧（1 天）","繩索（50 呎）","火絨盒","火把","水袋"],"口糧 10 天、火把 10 支"),
  PACK("地城探險者套組","Dungeoneer's Pack",12*GP,55,["背包","鐵蒺藜","鐵撬","油（2 瓶）","口糧（1 天）","繩索（50 呎）","火絨盒","火把","水袋"],"口糧 10 天、火把 10 支"),
  PACK("竊賊套組","Burglar's Pack",16*GP,42,["背包","鋼珠","鈴鐺","蠟燭","鐵撬","遮光提燈","油（7 瓶）","口糧（1 天）","繩索（50 呎）","火絨盒","水袋"],"蠟燭 10 根、口糧 5 天"),
  PACK("外交官套組","Diplomat's Pack",39*GP,39,["箱子","華服","墨水","筆","油燈","地圖或卷軸筒","油（4 瓶）","紙","羊皮紙","香水","火絨盒"],"筆 5 支、卷軸筒 2 個、紙和羊皮紙各 5 張；沒有背包"),
  PACK("藝人套組","Entertainer's Pack",40*GP,58,["背包","睡袋","鈴鐺","牛眼提燈","戲服","鏡子","油（8 瓶）","口糧（1 天）","火絨盒","水袋"],"戲服 3 套、口糧 9 天"),
  PACK("祭司套組","Priest's Pack",33*GP,29,["背包","毯子","聖水","油燈","口糧（1 天）","長袍","火絨盒"],"口糧 7 天"),
  PACK("學者套組","Scholar's Pack",40*GP,22,["背包","書","墨水","筆","油燈","油（10 瓶）","羊皮紙","火絨盒"],"羊皮紙 10 張")
].map((it,i)=>({...it,id:"it"+i}));
const CATS = ["簡易近戰","簡易遠程","軍用近戰","軍用遠程","護甲","盾牌","法器","道具","冒險用品"];
