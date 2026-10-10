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
    {name:"斬擊", kind:"近戰",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精。"},
    {id:"counterattack", name:"反擊", style:"warrior", activation:"passive", kind:"被動", dmg:"物理", req:"weaponOrUnarmed", tier:0, statText:"依攻擊方式", text:"敵人的攻擊未命中你時，立刻攻擊一次。"},
    {id:"double_strike", name:"連擊", style:"warrior", activation:"passive", kind:"被動", dmg:"物理", tier:0, statText:"依攻擊方式", text:"用主要動作普攻時攻擊兩次，兩下都照常計算。副手攻擊、藉機攻擊、反擊、招式、戲法不算；帶「裝填」的武器不能連擊。"}]},

  {id:"heavy", name:"雙手重武器", stat:"力量",
   weapons:["巨劍","巨斧","巨錘","巨棒"],
   skills:[
    {name:"重擊", kind:"近戰",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精。"}]},

  {id:"axe", name:"斧類", stat:"力量",
   weapons:["手斧","戰斧","戰鎬"],
   skills:[
    {name:"劈砍", kind:"近戰",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精。"},
    {id:"sunder", name:"破甲", kind:"近戰", req:"meleeWeapon", tier:1,   up:"每高一階多 1 輪。", text:"攻擊一次，命中則目標 AC −2，直到你下回合結束。"}]},

  {id:"mace", name:"錘類", stat:"力量",
   weapons:["短棒","輕錘","硬頭錘","戰錘","釘頭錘","鏈枷"],
   skills:[
    {name:"敲擊", kind:"近戰",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精。"}]},

  {id:"polearm", name:"長柄類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["長柄刀","戟","長矛","矛","三叉戟","長棍","鞭"],
   skills:[
    {name:"突刺", kind:"近戰",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精。"}]},

  {id:"dagger", name:"匕首類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["匕首","鐮刀"],
   skills:[
    {name:"快刺", kind:"近戰",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精；有「投擲」屬性時也能投擲。"},
    {id:"sneak_attack", name:"偷襲", style:"rogue", activation:"passive", kind:"被動", dmg:"物理", tier:0, text:"用武器攻擊命中時，如果目標 1 格內有你的隊友，多 1d6 傷害；1、3、5…級各多 1d6（等級除以 2 進位）。每回合一次。"},
    {id:"hamstring", name:"扎腿", kind:"近戰", req:["cutOrPierce","rangedWeapon"], tier:1,   up:"每高一階多 1 輪。", text:"攻擊一次；命中後目標下回合移動 −2 格。"}]},

  {id:"bow", name:"弓類", stat:"敏捷",
   weapons:["短弓","長弓","非凡長弓"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精。"}]},

  {id:"crossbow", name:"弩類", stat:"敏捷",
   weapons:["輕弩","手弩","重弩"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精；每回合只能射一次。"}]},

  // 火槍類（大爺 10-03）：只有普攻。大爺：手上拿什麼，能用的招式就照招式的要求出現（貫穿、釘住、近射等要「穿刺型遠程武器」「遠程武器」的照樣能用）
  {id:"firearm", name:"火槍類", stat:"敏捷",
   weapons:["火槍","手槍"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精；每回合只能射一次。"}]},

  {id:"thrown", name:"投擲類", stat:"力量（有「靈巧」的取力量、敏捷高的；用彈藥的用敏捷）",
   weapons:["標槍","飛鏢","投石索","吹箭筒"],
   skills:[
    {name:"投擲", kind:"遠程",     tier:0,   text:"造成武器傷害，帶「戰士風格：武器精通」時觸發武器專精。"}]},

  {id:"unarmed", name:"徒手", stat:"力量",
   weapons:["（沒拿武器）"],
   skills:[
    {name:"拳擊", kind:"近戰",     tier:0,   text:"造成 1 + 力量調整值傷害。"}]},


  {id:"shield", name:"盾牌", stat:"—",
   weapons:["盾牌"],
   skills:[
    {id:"shield_guard", name:"守護", style:"warrior", activation:"passive", kind:"被動", dmg:"", req:"shield", tier:0, text:"拿著盾牌時，周圍 1 格內的隊友每輪第一次被攻擊，那一下有劣勢；每位隊友每輪一次。不保護自己。"}]},

  // 法器：法杖／法書／法球三種，每件法器綁定一組法術（法杖另外能敲人），以法術主題命名
  //       使用屬性：每件固定隨機 INT／WIS／CHA
  {id:"arcane_staff", name:"奧術法杖", stat:"智力",
   weapons:["奧術法杖","霜雷法杖"],
   skills:[
    {name:"打擊", kind:"近戰", dmg:"物理",     tier:0,   text:"造成 1d6 + 力量調整值物理傷害。"},
    {id:"magic_missile", name:"魔法飛彈",  kind:"遠程", tier:1,   srd:true, multi:true, up:"每高一階多 1 發。", text:"射出 3 發必中飛彈，每發 1d4+1 力場傷害；每發各自點一個目標，可以分給不同敵人。"},
    {id:"shield_spell", name:"護盾術",  kind:"輔助",   tier:1,   srd:true, free:true, noUp:true, reaction:true, text:"敵人攻擊命中你時，花一個保留的免費動作施放：AC +5（可能讓這次攻擊變成沒中），直到你下回合開始。"},
    {id:"mage_armor", name:"法師護甲", style:"mage", activation:"passive", kind:"被動", dmg:"", tier:0, srd:true, text:"沒穿護甲或只穿布甲時，基礎 AC 變成 13 + 敏捷調整值（可以拿盾）。"}]},

  {id:"healing_book", name:"治癒法書", stat:"感知",
   weapons:["治癒法書"],
   skills:[
    {id:"healing_word", name:"治癒真言",  kind:"輔助", tier:1,   srd:true, free:true, up:"每高一階多恢復 1d4。", text:"恢復 1d4 + 施法屬性調整值生命值。"},
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

// 風格被動（10-09）：不屬於任何武器組的放這裡；招式本身寫 style 決定是哪一類風格
SKILL_GROUPS.push({id:"style",name:"風格",trait:true,weapons:[],stat:"—",skills:[
 {id:"turn_danger",name:"化險",style:"rogue",activation:"passive",kind:"被動",dmg:"",tier:0,reaction:true,text:"敵人攻擊命中你時，花一個保留的免費動作，讓這次傷害減半。"},
 {id:"aim",name:"瞄準",style:"rogue",activation:"passive",kind:"被動",dmg:"",tier:0,text:"這回合還沒移動時可以宣告瞄準：放棄這回合的移動，換這回合第一次攻擊有優勢。不花動作。"},
 {id:"cunning_action",name:"狡詐",style:"rogue",activation:"passive",kind:"被動",dmg:"",tier:0,text:"每回合一次，衝刺、撤離或潛行改用免費動作，不用主要動作。"},
 {id:"empowered_cantrip",name:"強化",style:"mage",activation:"passive",kind:"被動",dmg:"",tier:0,text:"戲法造成傷害時，加上施法屬性調整值（每個目標一次）。"},
 {id:"lore",name:"博學",style:"mage",activation:"passive",kind:"被動",dmg:"",tier:0,text:"智力檢定有優勢（不含攻擊骰）。被動智力檢定（例如聽懂異族語）+5。"},
 {id:"metamagic",name:"超魔",style:"mage",activation:"passive",kind:"被動",dmg:"",tier:0,text:"施法時多花一個免費動作，加一種加工（一次只能一種）：謹慎（範圍法術不打自己人）、瞬發（主要動作的法術改用免費動作放）、遠距（距離加倍，觸碰變 6 格）。"},
 {id:"weapon_mastery",name:"武器精通",style:"warrior",activation:"passive",kind:"被動",dmg:"",tier:0,text:"用武器攻擊時觸發武器專精（削弱、緩速、擦傷……）。沒帶就不會觸發專精。"}
]});
// 天生技能（大爺 10-10：怪物技能就是天生技能）：種族或怪物本身的能力，innate:true＝小傢伙們觀察學不走。
// 怪物身上用 special 帶（data/enemies.js）；小傢伙們的黑暗視覺是毛球族天生（RACE，js/state.js）。數值全部暫定
// 「充能」＝用過後每回合開始擲 d6，5～6 再充好（第一次一定能用）。實作在 js/battle/monster.js
SKILL_GROUPS.push({id:"natural",name:"天生技能",trait:true,weapons:[],stat:"—",skills:[
 {id:"bat_drain",name:"吸血",innate:true,kind:"近戰",dmg:"物理",tier:0,text:"咬一口；命中後回復造成傷害的一半。"},
 {id:"slime_spit",name:"酸液噴吐",innate:true,kind:"豁免",dmg:"強酸",tier:0,recharge:true,text:"3 格內一個敵人敏捷豁免；失敗受 2d6 強酸傷害，成功減半。充能。免疫強酸。"},
 {id:"loose_bones",name:"散骨",innate:true,activation:"passive",kind:"被動",dmg:"",tier:0,text:"箭和刺穿過骨頭縫：穿刺抗性。"},
 {id:"undead_fortitude",name:"不死韌性",innate:true,activation:"passive",kind:"被動",dmg:"",tier:0,text:"被打到 0 血時體質豁免（DC＝5＋這次傷害），成功就剩 1 血站著。光耀傷害不能撐。"},
 {id:"bandit_sand",name:"撒沙",innate:true,kind:"豁免",dmg:"",tier:0,once:true,text:"往貼身的敵人臉上撒沙：體質豁免，失敗則下次攻擊有劣勢。每場一次。"},
 {id:"orc_charge",name:"蠻衝",innate:true,kind:"近戰",dmg:"物理",tier:0,recharge:true,text:"衝向 3 格以外的敵人並攻擊；命中後目標力量豁免，失敗倒地。充能。"},
 {id:"ghost_wail",name:"驚嚇哀號",innate:true,kind:"豁免",dmg:"",tier:0,recharge:true,text:"4 格內的敵人感知豁免；失敗壓力 +15。充能。"},
 {id:"spider_web",name:"蛛網",innate:true,kind:"豁免",dmg:"",tier:0,recharge:true,text:"6 格內一個敵人敏捷豁免；失敗被蛛網纏住（跟網子一樣，花動作力量檢定掙脫）。充能。"},
 {id:"griffin_dive",name:"俯衝",innate:true,kind:"近戰",dmg:"物理",tier:0,recharge:true,text:"飛向 3 格以外的敵人並攻擊，有優勢；命中多 1d8。充能。"},
 {id:"owlbear_hug",name:"熊抱",innate:true,kind:"近戰",dmg:"物理",tier:0,text:"利爪攻擊；命中後目標力量或敏捷豁免，失敗被抓住。已經抓著人時不用。"},
 {id:"chimera_breath",name:"火焰吐息",innate:true,kind:"豁免",dmg:"火焰",tier:0,recharge:true,text:"前方 3 格錐形敏捷豁免；失敗受 3d6 火焰傷害，成功減半。充能。"},
 {id:"vampire_bite",name:"吸血鬼之咬",innate:true,kind:"近戰",dmg:"死靈",tier:0,recharge:true,text:"咬貼身的敵人；命中多 2d6 死靈傷害，並回復同樣的生命值。充能。"},
 {id:"lich_whisper",name:"死亡低語",innate:true,kind:"豁免",dmg:"死靈",tier:0,recharge:true,text:"8 格內一個看得到的敵人體質豁免；失敗受 3d8 死靈傷害，成功減半。充能。"},
 {id:"dk_hellstrike",name:"獄火斬",innate:true,kind:"近戰",dmg:"火焰",tier:0,recharge:true,text:"騎士劍攻擊；命中多 2d6 火焰傷害。充能。"},
 {id:"nimble",name:"靈巧脫逃",innate:true,activation:"passive",kind:"被動",dmg:"",tier:0,text:"免費動作撤離或躲藏（每回合用免費動作那格）。"},
 {id:"darkvision",name:"黑暗視覺",innate:true,activation:"passive",kind:"被動",dmg:"",tier:0,darkvision:12,text:"黑暗看成黑白；仍受樹、馬車及關門等遮擋。"}
]});
SKILL_GROUPS.forEach(g=>g.skills.forEach(s=>s.activation ||= "active"));

// 只供技能卡／技能表呈現，不參與技能結算。
const SKILL_AREA_TEXT={burning_hands:"前方 3 格錐形",bless:"6 格內",bane:"6 格內"};
SKILL_GROUPS.forEach(g=>g.skills.forEach(s=>{if(SKILL_AREA_TEXT[s.id])s.areaText=SKILL_AREA_TEXT[s.id];}));
