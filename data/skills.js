/* 裝備 → 技能（第一版草案）
   規則：沒有職業。普攻跟著手上的武器；招式靠觀察學習、記在小筆記（見 docs/小筆記規格.md）。
   - id：招式的固定代號，小筆記、敵人的 testSkill 都用它（不要用組裡的第幾招，組裡增減招式時編號會位移）
   - 招式記的是「樣子」，用什麼做出來看 req（可以是陣列＝任一種都行）。招式放在哪一組只是「出處」
   - 2026-10-01 大爺：重複的招合併（震暈＋頭槌、扎腿＋瞄腿、橫掃＋回掃、衝撞＋絆倒→撞倒、重敲＋逼退→擊退、連斬＋連打→連擊）
   - 武器按「類別」：固定普攻（不用熟練格）＋這一類原本的招式（用熟練格）。
     沒有大招這種突然很特別的招式（大爺決定）；說明和實作都不寫死武器名稱，只看武器屬性（投擲、觸及、靈巧……），以後好替換
   - 盾牌 1 招（守護，免費動作）；護甲只給被動數值，不給主動技能
   - 升階效果只有三種：多傷害、多目標、多持續時間；範圍招的範圍固定，不能靠升階變大（大爺 2026-10-01、10-02 再確認）
   - 法器分法杖／法書／法球，每件綁定一組 3 個法術，以主題命名（使用屬性：每件生成時智力／感知／魅力隨機擇一並固定）
   共通數字：命中 = d20 + 屬性調整值 + 2 ≥ 目標 AC；豁免 DC = 8 + 2 + 屬性調整值；
             生命值（1 級）= 創角擲的 1d10 + 體質調整值（最低 1，大爺 10-04）；地圖 1 格 = 5 呎
   tier：這招要求的熟練格階數（0 = 普攻、戲法，不用格子；其他都是 1＝一階）。每個角色照等級有一階、二階……的格子
        （全施法者的表，見 js/battle/skills.js 的 SLOT_TABLE），每招用一格。用比要求高的格子放＝「升階」：
        up 寫升階效果（每高一階多一份），沒寫的攻擊招式＝每高一階，命中時多 1 顆武器骰；noUp＝不能升階。
        multi：每發各自點一個目標（魔法飛彈）
   kind：判定方式。近戰／遠程＝擲攻擊骰對 AC；豁免＝對方擲豁免；輔助＝不打人。一招有兩段的，照第一段擲的骰算
   dmg：傷害種類（大爺定的）。物理＝武器或身體本身的力量；法術＝法術（含神術）不帶元素的；特殊＝其他力量（氣……）；
        元素優先：帶元素的直接寫元素（火焰、強酸……），不管從法術、道具還是龍嘴出來。
        沒寫就照技能組（法器＝法術，其他＝物理）；不造成傷害的寫 dmg:""。
   基本攻擊（第 0 招）的名稱看武器本身：砍的斬擊、戳的刺擊、砸的打擊（含徒手、法杖）、用彈藥的射擊、投擲類的投擲
   free：花免費動作（每回合一次）而不是主動作；D&D 裡原本是附贈動作或反應的招式
   能力 stat："力量"、"敏捷"、"靈巧"（力量或敏捷取高）、"智力"、"感知"
   標 SRD 的法術取自 SRD 5.2（CC-BY-4.0），其餘為本作原創 */

// 風格（大爺 10-09）：被動分三類，同類能帶的數量有上限（預設 1，之後裝備等可加，見 styleCap）；不同類可以混搭，不是職業。
// 招式資料寫 style:"warrior" 就屬於那一類，名稱顯示成「戰士風格：反擊」。
const STYLE_GROUPS = {
  warrior:{name:"戰士風格", max:1},
  rogue:{name:"俠盜風格", max:1},
  mage:{name:"法師風格", max:1}
};
const SKILL_GROUPS = [
  {id:"sword", name:"劍類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["短劍","長劍","刺劍","彎刀"],
   skills:[
    {name:"斬擊", kind:"近戰",     tier:0,   text:"造成武器傷害，觸發武器專精。"},
    {id:"counterattack", name:"反擊", style:"warrior", activation:"passive", kind:"被動", dmg:"物理", req:"weaponOrUnarmed", tier:0, statText:"依攻擊方式", text:"敵人的攻擊未命中你時，立刻攻擊一次。"},
    {id:"double_strike", name:"連擊", style:"warrior", activation:"passive", kind:"被動", dmg:"物理", tier:0, statText:"依攻擊方式", text:"用主要動作普攻時攻擊兩次，兩下都照常計算。副手攻擊、藉機攻擊、反擊、招式、戲法不算；帶「裝填」的武器不能連擊。"}]},

  {id:"heavy", name:"雙手重武器", stat:"力量",
   weapons:["巨劍","巨斧","巨錘","巨棒"],
   skills:[
    {name:"重擊", kind:"近戰",     tier:0,   text:"造成武器傷害，觸發武器專精。"},
    {id:"cleave", name:"橫掃", kind:"近戰", req:["twoHandMelee","longWeapon"], tier:1,   text:"對每個敵人各攻擊一次，傷害只算武器骰、不加屬性。"},
    {id:"power_strike", name:"蓄力重擊", kind:"近戰", req:"twoHandMelee", tier:1,   text:"這回合不能移動；攻擊一次，命中時多 1 顆武器骰。"},
    {id:"topple", name:"撞倒", kind:"近戰", req:["twoHandMelee","longWeapon","unarmed"], tier:1,   text:"攻擊一次；命中後目標選力量或敏捷豁免，失敗則倒地。"}]},

  {id:"axe", name:"斧類", stat:"力量",
   weapons:["手斧","戰斧","戰鎬"],
   skills:[
    {name:"劈砍", kind:"近戰",     tier:0,   text:"造成武器傷害，觸發武器專精。"},
    {id:"sunder", name:"破甲", kind:"近戰", req:"meleeWeapon", tier:1,   up:"每高一階多 1 輪。", text:"攻擊一次，命中則目標 AC −2，直到你下回合結束。"},
    {id:"bleed", name:"放血", kind:"近戰", req:"cutOrPierce", tier:1,   up:"每高一階多流血 1 次。", text:"攻擊一次；命中後目標接下來 2 次回合開始各受 1d4 流血傷害。"},
    {id:"shield_split", name:"劈盾", kind:"近戰", req:"slashWeapon", tier:1,   text:"攻擊一次；命中後目標盾牌失效（AC −2），直到你下回合開始。"}]},

  {id:"mace", name:"錘類", stat:"力量",
   weapons:["短棒","輕錘","硬頭錘","戰錘","釘頭錘","鏈枷"],
   skills:[
    {name:"敲擊", kind:"近戰",     tier:0,   text:"造成武器傷害，觸發武器專精。"},
    {id:"daze", name:"震暈", kind:"近戰", req:"bluntOrUnarmed", tier:1,   up:"每高一階多 1 輪。", text:"攻擊一次；命中後目標體質豁免，失敗則下回合只能移動或行動二選一。"},
    {id:"quake", name:"震地", kind:"豁免", dmg:"", req:"bluntOrUnarmed", tier:1,   up:"每高一階，豁免失敗的多受 1 顆武器骰傷害（範圍不變）。", text:"敵人敏捷豁免，失敗則倒地；不造成傷害。"},
    {id:"knockback", name:"擊退", kind:"近戰", req:"meleeOrUnarmed", tier:1,   text:"攻擊一次；命中後推開目標 1 格，你跟上一步。"}]},

  {id:"polearm", name:"長柄類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["長柄刀","戟","長矛","矛","三叉戟","長棍","鞭"],
   skills:[
    {name:"突刺", kind:"近戰",     tier:0,   text:"造成武器傷害，觸發武器專精。"},
    {id:"guard_stance", name:"阻截", kind:"輔助", req:"longWeapon", tier:1,   free:true, text:"直到你下回合開始，第一個走進攻擊範圍的敵人會被你攻擊一次。"}]},

  {id:"dagger", name:"匕首類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["匕首","鐮刀"],
   skills:[
    {name:"快刺", kind:"近戰",     tier:0,   text:"造成武器傷害，觸發武器專精；有「投擲」屬性時也能投擲。"},
    {id:"sneak_attack", name:"偷襲", kind:"近戰", req:"lightMelee", tier:1,   up:"每高一階，偷襲傷害多 1d6。", text:"攻擊一次，如果目標旁邊有你的隊友，命中時多 2d6 傷害。"},
    {id:"dash_stab", name:"閃身刺", kind:"近戰", req:"lightMelee", tier:1,   text:"先閃到 2 格內、目標身旁的空位（不會被藉機攻擊，不算移動），再攻擊一次。"},
    {id:"hamstring", name:"扎腿", kind:"近戰", req:["cutOrPierce","rangedWeapon"], tier:1,   up:"每高一階多 1 輪。", text:"攻擊一次；命中後目標下回合移動 −2 格。"}]},

  {id:"bow", name:"弓類", stat:"敏捷",
   weapons:["短弓","長弓","非凡長弓"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"造成武器傷害，觸發武器專精。"},
    {id:"aimed_shot", name:"瞄準射擊", kind:"遠程", req:"rangedWeapon", tier:1,   text:"本回合不能移動；攻擊一次，命中 +2，傷害多 1 顆武器骰。"},
    {id:"arrow_rain", name:"箭雨", kind:"豁免", req:"bow", tier:1,   up:"每高一階，豁免失敗的多受 1 顆武器骰（範圍不變）。", text:"敵人敏捷豁免，失敗受 1 顆武器骰傷害。"},
    {id:"suppress", name:"壓制射擊", kind:"遠程", req:"rangedWeapon", tier:1,   text:"攻擊一次；命中後目標削弱，下次攻擊有劣勢。"}]},

  {id:"crossbow", name:"弩類", stat:"敏捷",
   weapons:["輕弩","手弩","重弩"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"造成武器傷害，觸發武器專精；每回合只能射一次。"},
    {id:"pierce_shot", name:"貫穿", kind:"遠程", req:"piercingProjectile", tier:1,   text:"朝一個方向射出，直線上的每個敵人各攻擊一次。"},
    {id:"pin", name:"釘住", kind:"遠程", req:"piercingProjectile", tier:1,   text:"攻擊一次，命中的話目標到他自己的回合結束前都不能移動。"},
    {id:"point_blank", name:"近射", kind:"遠程", req:"rangedWeapon", tier:1,   text:"攻擊一次，貼身射擊也沒有劣勢。"}]},

  // 火槍類（大爺 10-03）：只有普攻。大爺：手上拿什麼，能用的招式就照招式的要求出現（貫穿、釘住、近射等要「穿刺型遠程武器」「遠程武器」的照樣能用）
  {id:"firearm", name:"火槍類", stat:"敏捷",
   weapons:["火槍","手槍"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"造成武器傷害，觸發武器專精；每回合只能射一次。"}]},

  {id:"thrown", name:"投擲類", stat:"力量（有「靈巧」的取力量、敏捷高的；用彈藥的用敏捷）",
   weapons:["標槍","飛鏢","投石索","吹箭筒"],
   skills:[
    {name:"投擲", kind:"遠程",     tier:0,   text:"造成武器傷害，觸發武器專精。"},
    {id:"multi_throw", name:"連投", kind:"遠程", req:"thrown", tier:1,   up:"每高一階多投 1 個不同目標。", text:"對兩個不同目標各攻擊一次。"},
    {id:"precise_throw", name:"精準一擲", kind:"遠程", req:"thrown", tier:1,   text:"攻擊有優勢，命中的話目標削弱（下次攻擊有劣勢）。"}]},

  {id:"unarmed", name:"徒手", stat:"力量",
   weapons:["（沒拿武器）"],
   skills:[
    {name:"拳擊", kind:"近戰",     tier:0,   text:"造成 1 + 力量調整值傷害。"},
    {id:"suplex", name:"摔投", kind:"近戰", req:"unarmed", tier:1,   up:"每高一階多 1d6 傷害。", text:"要先擒抱住目標：把他摔到 1 格外，目標倒地並受 1d6 傷害，擒抱結束。"}]},


  {id:"shield", name:"盾牌", stat:"—",
   weapons:["盾牌"],
   skills:[
    {id:"shield_guard", name:"守護", kind:"輔助", req:"shield", tier:1,   free:true, up:"每高一階多 1 輪。", text:"直到你下回合開始，各貼身隊友受到的第一次攻擊有劣勢；你須仍在她身旁。"}]},

  // 法器：法杖／法書／法球三種，每件法器綁定一組法術（法杖另外能敲人），以法術主題命名
  //       使用屬性：每件固定隨機 INT／WIS／CHA
  {id:"arcane_staff", name:"奧術法杖", stat:"智力",
   weapons:["奧術法杖","霜雷法杖"],
   skills:[
    {name:"打擊", kind:"近戰", dmg:"物理",     tier:0,   text:"造成 1d6 + 力量調整值物理傷害。"},
    {id:"magic_missile", name:"魔法飛彈",  kind:"遠程", tier:1,   srd:true, multi:true, up:"每高一階多 1 發。", text:"射出 3 發必中飛彈，每發 1d4+1 力場傷害；每發各自點一個目標，可以分給不同敵人。"},
    {id:"shield_spell", name:"護盾術",  kind:"輔助",   tier:1,   srd:true, free:true, noUp:true, reaction:true, text:"敵人攻擊命中你時，花一個保留的免費動作施放：AC +5（可能讓這次攻擊變成沒中），直到你下回合開始。"},
    {id:"mage_armor", name:"法師護甲",  kind:"輔助", tier:1, srd:true, noUp:true, text:"沒穿護甲或只穿布甲時，整場戰鬥的基礎 AC 變成 13 + 敏捷調整值。"}]},

  {id:"healing_book", name:"治癒法書", stat:"感知",
   weapons:["治癒法書"],
   skills:[
    {id:"healing_word", name:"治癒真言",  kind:"輔助", tier:1,   srd:true, free:true, up:"每高一階多恢復 1d4。", text:"恢復 1d4 + 施法屬性調整值生命值。"},
    {id:"cure_wounds", name:"治療傷口",  kind:"輔助", tier:1,   srd:true, up:"每高一階多恢復 2d8。", text:"恢復 2d8 + 施法屬性調整值生命值。"},
    {id:"bless", name:"祝福術",  kind:"輔助",   tier:1, srd:true, conc:true, up:"每高一階多 1 名隊友。", text:"最多 3 名隊友的攻擊與豁免 +1d4。"}]},

  {id:"flame_orb", name:"火焰法球", stat:"魅力",
   weapons:["火焰法球"],
   skills:[
    {id:"fire_bolt", name:"火焰箭",  kind:"遠程", dmg:"火焰",   tier:0,   srd:true, text:"命中造成 1d10 火焰傷害。"},
    {id:"burning_hands", name:"燃燒之手",  kind:"豁免", dmg:"火焰", tier:1,   srd:true, up:"每高一階多 1d6。", text:"敏捷豁免；失敗受 3d6 火焰傷害，成功減半。"},
    {id:"fire_shield", name:"火焰護盾",  kind:"輔助", tier:1, up:"每高一階，反燒多 1d6。", text:"整場戰鬥中，近戰打中你的敵人會受 1d6 火焰傷害。"}]},

  // 薩滿圖騰：哥布林薩滿的法器（商店不賣），使用屬性感知
  {id:"shaman_totem", name:"薩滿圖騰", stat:"感知",
   weapons:["薩滿圖騰"],
   skills:[
    {id:"totem_fire_bolt", name:"火焰箭",  kind:"遠程", dmg:"火焰",   tier:0,   srd:true, text:"命中造成 1d10 火焰傷害。"},
    {id:"totem_healing_word", name:"治癒真言",  kind:"輔助", tier:1,   srd:true, free:true, up:"每高一階多恢復 1d4。", text:"恢復 1d4 + 施法屬性調整值生命值。"},
    {id:"bane", name:"災禍術",  kind:"豁免", dmg:"",   tier:1, srd:true, up:"每高一階多 1 個目標。", conc:true, text:"最多 3 個看得到的敵人魅力豁免；失敗則攻擊與豁免 −1d4。"}]},

  // 狩獵者：不是武器類別，是某些裝備附帶的特性（item.grants）。非凡長弓（大爺 10-03）
  {id:"hunter", name:"狩獵者", stat:"—", trait:true,
   weapons:[],
   skills:[
    {id:"hunters_mark", name:"狩印", kind:"輔助", dmg:"", tier:1, srd:true, free:true, conc:true, noUp:true, text:"標記一個看得到的敵人；你的攻擊命中他時多 1d6 力場傷害（爆擊加倍）。他倒下後可免費改標其他敵人。"}]}
  ,{id:"elements",name:"元素戲法",stat:"法器屬性",trait:true,weapons:[],skills:[
    {id:"ray_of_frost",basicAttack:true,name:"寒冷射線",kind:"遠程",dmg:"寒冷",tier:0,srd:true,text:"命中造成 1d8 寒冷傷害，目標速度 −2 格，直到你下回合開始。5／11／17 級增加傷害骰。"},
    {id:"shocking_grasp",basicAttack:true,name:"電擊術",kind:"近戰",dmg:"閃電",tier:0,srd:true,text:"命中造成 1d8 閃電傷害，目標不能藉機攻擊，直到牠下回合開始。5／11／17 級增加傷害骰。"}]}
];
// 聲勢材：對照 SRD 5.2.1 各法術；火焰護盾沿用本作效果，只借成分。
const SPELL_COMPONENTS = {
  "寒冷射線":{v:true,s:true},"電擊術":{v:true,s:true},
  "魔法飛彈":{v:true,s:true},"護盾術":{v:true,s:true},
  "法師護甲":{v:true,s:true,m:{name:"鞣製皮革"}},
  "治癒真言":{v:true},"治療傷口":{v:true,s:true},
  "祝福術":{v:true,s:true,m:{name:"聖徽",cost:5*GP}},
  "火焰箭":{v:true,s:true},"聖火術":{v:true,s:true},
  "燃燒之手":{v:true,s:true},"火焰護盾":{v:true,s:true,m:{name:"磷或螢火蟲"}},
  "災禍術":{v:true,s:true,m:{name:"一滴血"}},"狩印":{v:true}
};
SKILL_GROUPS.forEach(g=>g.skills.forEach(s=>{if(SPELL_COMPONENTS[s.name])s.components=SPELL_COMPONENTS[s.name];}));
const componentsText = c => c ? [c.v?"聲":"",c.s?"勢":"",c.m?`材（${c.m.name}${c.m.cost?`，至少 ${c.m.cost/GP} gp`:""}${c.m.consumed?"，消耗":""}）`:""].filter(Boolean).join("、") : "—";

// 技能類型標籤：判定方式・傷害，例如「近戰・物理」「遠程・法術」「豁免・火焰」；輔助、不造成傷害的只寫前半
const FOCUS_GROUPS = ["arcane_staff", "healing_book", "flame_orb", "shaman_totem"];
const skillDmg = (g, s) => s.kind==="輔助" ? "" : s.dmg !== undefined ? s.dmg : FOCUS_GROUPS.includes(g.id) ? "法術" : "物理";
const skillType = (g, s) => skillDmg(g, s) ? `${s.kind}・${skillDmg(g, s)}` : s.kind;
// 基本攻擊名稱：看手上那把武器（同一組裡可能混著砍的和砸的，例如巨劍、巨錘）
const BASIC_BY_DMG = {"揮砍":"斬擊", "穿刺":"刺擊", "鈍擊":"打擊"};
function basicName(g, item){
  if(!item || item.type!=="weapon") return "打擊";                       // 徒手、法杖
  if(item.props.some(p=>p.startsWith("彈藥"))) return "射擊";
  if(g.id==="thrown") return "投擲";
  return BASIC_BY_DMG[item.dmg.split(" ")[1]] || "打擊";
}
const HAS_BASIC = g => !g.trait && (!FOCUS_GROUPS.includes(g.id) || g.id==="arcane_staff");   // 這組的第 0 招是基本攻擊（法杖能打擊，其他法器第 0 招是法術）
// 技能表用：這組基本攻擊可能出現的名稱，例如「斬擊／刺擊」
const basicNames = g => [...new Set(g.weapons.map(n=>basicName(g, (typeof ITEMS!=="undefined" ? ITEMS : []).find(i=>i.n===n))))].join("／");
// 傷害種類給玩家看的名字：物理三種與流血合併成物理；力場、光耀與元素保留原名
const DMG_SHOWN = {"揮砍":"物理", "穿刺":"物理", "鈍擊":"物理", "流血":"物理"};
const dmgShown = t => DMG_SHOWN[t] || t;

// 地面反應沿用法術傷害類型，沒有另外一套施法規則。
Object.values(SKILL_GROUPS).forEach(g=>g.skills.forEach(s=>{if(["火焰箭","寒冷射線","電擊術"].includes(s.name))s.groundElement=true;}));

// 主／被動以是否需要玩家施展分類；天生技能仍使用同一技能資料。
SKILL_GROUPS.push({id:"natural",name:"天生技能",trait:true,weapons:[],stat:"—",skills:[
 {id:"darkvision",name:"黑暗視覺",activation:"passive",kind:"被動",dmg:"",tier:0,darkvision:12,text:"黑暗看成黑白；仍受樹、馬車及關門等遮擋。"}
]});
// 風格被動（10-09）：不屬於任何武器組的放這裡；招式本身寫 style 決定是哪一類風格
SKILL_GROUPS.push({id:"style",name:"風格",trait:true,weapons:[],stat:"—",skills:[
 {id:"turn_danger",name:"化險",style:"rogue",activation:"passive",kind:"被動",dmg:"",tier:0,reaction:true,text:"敵人攻擊命中你時，花一個保留的免費動作，讓這次傷害減半。"}
]});
SKILL_GROUPS.forEach(g=>g.skills.forEach(s=>s.activation ||= "active"));

// 只供技能卡／技能表呈現，不參與技能結算。
const SKILL_AREA_TEXT={cleave:"武器攻擊範圍",quake:"周圍 1 格",arrow_rain:"3×3 格",burning_hands:"前方 3 格錐形",bless:"6 格內",bane:"6 格內"};
SKILL_GROUPS.forEach(g=>g.skills.forEach(s=>{if(SKILL_AREA_TEXT[s.id])s.areaText=SKILL_AREA_TEXT[s.id];}));
