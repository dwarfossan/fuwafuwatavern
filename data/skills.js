/* 裝備 → 技能（第一版草案）
   規則：沒有職業。普攻跟著手上的武器；招式靠觀察學習、記在小筆記（見 docs/小筆記規格.md）。
   - id：招式的固定代號，小筆記、敵人的 testSkill 都用它（不要用組裡的第幾招，組裡增減招式時編號會位移）
   - 招式記的是「樣子」，用什麼做出來看 req（可以是陣列＝任一種都行）。招式放在哪一組只是「出處」
   - 2026-10-01 大爺：重複的招合併（震暈＋頭槌、扎腿＋瞄腿、橫掃＋回掃、衝撞＋絆倒→撞倒、重敲＋逼退→擊退、連斬＋連打→連擊）
   - 武器按「類別」：固定普攻（不用熟練格）＋這一類原本的招式（用熟練格）。
     沒有大招這種突然很特別的招式（大爺決定）；說明和實作都不寫死武器名稱，只看武器屬性（投擲、觸及、靈巧……），以後好替換
   - 盾牌 1 招（自動觸發的防禦）；護甲只給被動數值，不給主動技能
   - 法器分法杖／法書／法球，每件綁定一組 3 個法術，以主題命名（施法屬性：法杖智力、法書感知、法球魅力）
   共通數字：命中 = d20 + 屬性調整值 + 2 ≥ 目標 AC；豁免 DC = 8 + 2 + 屬性調整值；
             生命值（1 級）= 8 + 體質調整值；地圖 1 格 = 5 呎
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

const SKILL_GROUPS = [
  {id:"sword", name:"劍類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["短劍","長劍","刺劍","彎刀"],
   skills:[
    {name:"斬擊", kind:"近戰",     tier:0,   text:"近戰攻擊，造成武器傷害，觸發武器專精。"},
    {id:"parry_riposte", name:"架開反擊", kind:"近戰", req:"meleeWeapon", tier:1,   text:"攻擊一次；直到你下回合開始，第一次被近戰攻擊時 AC +2，對方沒打中就立刻反擊一次。"},
    {id:"double_strike", name:"連擊", kind:"近戰", req:["blade","unarmed"], tier:1,   text:"攻擊兩次，第二下不加屬性。"}]},

  {id:"heavy", name:"雙手重武器", stat:"力量",
   weapons:["巨劍","巨斧","巨錘","巨棒"],
   skills:[
    {name:"重擊", kind:"近戰",     tier:0,   text:"近戰攻擊，造成武器傷害，觸發武器專精。"},
    {id:"cleave", name:"橫掃", kind:"近戰", req:["twoHandMelee","longWeapon"], tier:1,   text:"對攻擊範圍內的每個敵人各攻擊一次（有「觸及」的武器打得到 2 格外），傷害只算武器骰、不加屬性。"},
    {id:"power_strike", name:"蓄力重擊", kind:"近戰", req:"twoHandMelee", tier:1,   text:"這回合不能移動；攻擊一次，命中時多 1 顆武器骰。"},
    {id:"topple", name:"撞倒", kind:"近戰", req:["twoHandMelee","longWeapon","unarmed"], tier:1,   up:"每高一階，豁免難度 +1。", text:"攻擊一次，命中的話目標自己選力量或敏捷豁免（能反抗就擋、能躲就閃），失敗就倒地。"}]},

  {id:"axe", name:"斧類", stat:"力量",
   weapons:["手斧","戰斧","戰鎬"],
   skills:[
    {name:"劈砍", kind:"近戰",     tier:0,   text:"近戰攻擊，造成武器傷害，觸發武器專精。"},
    {id:"sunder", name:"破甲", kind:"近戰", req:"meleeWeapon", tier:1,   up:"每高一階，AC 再 −1。", text:"攻擊一次，命中則目標 AC −2，直到你下回合結束。"},
    {id:"bleed", name:"放血", kind:"近戰", req:"cutOrPierce", tier:1,   up:"每高一階多流血 1 次。", text:"攻擊一次，命中的話目標流血：接下來 2 次輪到他時，回合開始各受 1d4 傷害。"},
    {id:"shield_split", name:"劈盾", kind:"近戰", req:"slashWeapon", tier:1,   text:"攻擊一次，命中的話目標的盾牌到你下回合開始前不算（AC −2）。"}]},

  {id:"mace", name:"錘類", stat:"力量",
   weapons:["短棒","輕錘","硬頭錘","戰錘","釘頭錘","鏈枷"],
   skills:[
    {name:"敲擊", kind:"近戰",     tier:0,   text:"近戰攻擊，造成武器傷害，觸發武器專精。"},
    {id:"daze", name:"震暈", kind:"近戰", req:"bluntOrUnarmed", tier:1,   up:"每高一階，豁免難度 +1。", text:"攻擊一次，命中則目標做體質豁免，失敗的話下回合只能移動或行動二選一。"},
    {id:"quake", name:"震地", kind:"豁免", dmg:"", req:"bluntOrUnarmed", tier:1,   up:"每高一階，範圍往外多 1 圈。", text:"重重砸向地面：身邊一圈的敵人做敏捷豁免，失敗就倒地（不造成傷害）。"},
    {id:"knockback", name:"擊退", kind:"近戰", req:"meleeOrUnarmed", tier:1,   up:"每高一階多推 1 格。", text:"攻擊一次，命中的話把目標推開 1 格，你跟上一步。"}]},

  {id:"polearm", name:"長柄類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["長柄刀","戟","長矛","矛","三叉戟","長棍","鞭"],
   skills:[
    {name:"突刺", kind:"近戰",     tier:0,   text:"近戰攻擊，有「觸及」的武器可以打 2 格遠。觸發武器專精。"},
    {id:"guard_stance", name:"阻截", kind:"輔助", req:"longWeapon", tier:1,   free:true, text:"免費動作：擺好架式，直到你下回合開始，第一個走進你攻擊範圍的敵人會立刻被你攻擊一次。"}]},

  {id:"dagger", name:"匕首類", stat:"力量（有「靈巧」的武器取力量、敏捷高的）",
   weapons:["匕首","鐮刀"],
   skills:[
    {name:"快刺", kind:"近戰",     tier:0,   text:"近戰攻擊，造成武器傷害，觸發武器專精。有「投擲」的武器也可以丟出去。"},
    {id:"sneak_attack", name:"偷襲", kind:"近戰", req:"lightMelee", tier:1,   up:"每高一階，偷襲傷害多 1d6。", text:"攻擊一次，如果目標旁邊有你的隊友，命中時多 2d6 傷害。"},
    {id:"dash_stab", name:"閃身刺", kind:"近戰", req:"lightMelee", tier:1,   up:"每高一階可以多閃 1 格。", text:"先閃到 2 格內、目標身旁的空位（不會被藉機攻擊，不算移動），再攻擊一次。"},
    {id:"hamstring", name:"扎腿", kind:"近戰", req:["cutOrPierce","rangedWeapon"], tier:1,   up:"每高一階，移動多 −1 格。", text:"攻擊一次（近戰或遠程都行），命中的話目標下回合移動 −2 格。"}]},

  {id:"bow", name:"弓類", stat:"敏捷",
   weapons:["短弓","長弓"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"遠程攻擊，造成武器傷害，觸發武器專精。"},
    {id:"aimed_shot", name:"瞄準射擊", kind:"遠程", req:"rangedWeapon", tier:1,   text:"本回合不能移動；攻擊一次，命中 +2，傷害多 1 顆武器骰。"},
    {id:"arrow_rain", name:"箭雨", kind:"豁免", req:"bow", tier:1,   up:"每高一階，範圍往外多 1 圈。", text:"指定 3×3 格的區域，區域內的敵人做敏捷豁免，失敗受 1 顆武器骰傷害。"},
    {id:"suppress", name:"壓制射擊", kind:"遠程", req:"rangedWeapon", tier:1,   text:"攻擊一次，命中的話目標削弱（下次攻擊有劣勢）。"}]},

  {id:"crossbow", name:"弩類", stat:"敏捷",
   weapons:["輕弩","手弩","重弩"],
   skills:[
    {name:"射擊", kind:"遠程",     tier:0,   text:"遠程攻擊，造成武器傷害，觸發武器專精（裝填：每回合只能射一次）。"},
    {id:"pierce_shot", name:"貫穿", kind:"遠程", req:"piercingProjectile", tier:1,   text:"朝一個方向射出，直線上的每個敵人各攻擊一次。"},
    {id:"pin", name:"釘住", kind:"遠程", req:"piercingProjectile", tier:1,   text:"攻擊一次，命中的話目標到他自己的回合結束前都不能移動。"},
    {id:"point_blank", name:"近射", kind:"遠程", req:"rangedWeapon", tier:1,   text:"攻擊一次，貼身射擊也沒有劣勢。"}]},

  {id:"thrown", name:"投擲類", stat:"力量（有「靈巧」的取力量、敏捷高的；用彈藥的用敏捷）",
   weapons:["標槍","飛鏢","投石索","吹箭筒"],
   skills:[
    {name:"投擲", kind:"遠程",     tier:0,   text:"遠程攻擊，造成武器傷害，觸發武器專精。"},
    {id:"multi_throw", name:"連投", kind:"遠程", req:"thrown", tier:1,   up:"每高一階多投 1 個不同目標。", text:"對兩個不同目標各攻擊一次。"},
    {id:"precise_throw", name:"精準一擲", kind:"遠程", req:"thrown", tier:1,   text:"攻擊有優勢，命中的話目標削弱（下次攻擊有劣勢）。"}]},

  {id:"unarmed", name:"徒手", stat:"力量",
   weapons:["（沒拿武器）"],
   skills:[
    {name:"拳擊", kind:"近戰",     tier:0,   text:"近戰攻擊，造成 1 + 力量調整值的傷害。"},
    {id:"suplex", name:"摔投", kind:"近戰", req:"unarmed", tier:1,   up:"每高一階多 1d6 傷害。", text:"要先擒抱住目標：把他摔到 1 格外，目標倒地並受 1d6 傷害，擒抱結束。"}]},


  {id:"shield", name:"盾牌", stat:"—",
   weapons:["盾牌"],
   skills:[
    {id:"shield_guard", name:"舉盾護友", kind:"輔助", req:"shield", tier:0,   free:true, text:"免費動作：指定一名貼身的隊友，直到你下回合開始，打他的第一次攻擊有劣勢。"}]},

  // 法器：法杖／法書／法球三種，每件法器綁定一組法術（法杖另外能敲人），以法術主題命名
  //       施法屬性：法杖＝智力、法書＝感知、法球＝魅力
  {id:"arcane_staff", name:"奧術法杖", stat:"智力",
   weapons:["奧術法杖"],
   skills:[
    {name:"打擊", kind:"近戰", dmg:"物理",     tier:0,   text:"用法杖敲人：近戰攻擊，1d6 + 力量調整值的物理傷害。"},
    {id:"magic_missile", name:"魔法飛彈", req:"focus", kind:"遠程", tier:1,   srd:true, multi:true, up:"每高一階多 1 發。", text:"射出 2 發必中飛彈，每發 1d4+1 力場傷害；每發各自點一個目標，可以分給不同敵人。"},
    {id:"shield_spell", name:"護盾術", req:"focus", kind:"輔助",   tier:1,   srd:true, free:true, noUp:true, text:"免費動作：直到你下回合開始，AC +5。"},
    {id:"mage_armor", name:"法師護甲", req:"focus", kind:"輔助", tier:1, srd:true, noUp:true, text:"沒穿護甲或只穿布甲時，整場戰鬥的基礎 AC 變成 13 + 敏捷調整值。"}]},

  {id:"healing_book", name:"治癒法書", stat:"感知",
   weapons:["治癒法書"],
   skills:[
    {id:"healing_word", name:"治癒真言", req:"focus", kind:"輔助", tier:1,   srd:true, free:true, up:"每高一階多恢復 1d4。", text:"免費動作：6 格內一名隊友恢復 1d4 + 感知調整值的生命值。"},
    {id:"cure_wounds", name:"治療傷口", req:"focus", kind:"輔助", tier:1,   srd:true, up:"每高一階多恢復 2d8。", text:"碰觸一名隊友，恢復 2d8 + 感知調整值的生命值。"},
    {id:"bless", name:"祝福術", req:"focus", kind:"輔助",   tier:1, srd:true, up:"每高一階多 1 名隊友。", text:"最多 3 名隊友整場戰鬥的攻擊和豁免多擲 1d4 加上去。"}]},

  {id:"flame_orb", name:"火焰法球", stat:"魅力",
   weapons:["火焰法球"],
   skills:[
    {name:"火焰箭", req:"focus", kind:"遠程", dmg:"火焰",   tier:0,   srd:true, text:"遠程法術攻擊，1d10 火焰傷害。"},
    {id:"burning_hands", name:"燃燒之手", req:"focus", kind:"豁免", dmg:"火焰", tier:1,   srd:true, up:"每高一階多 1d6。", text:"前方 3 格錐形，範圍內做敏捷豁免，失敗受 3d6 火焰傷害，成功減半。"},
    {id:"fire_shield", name:"火焰護盾", req:"focus", kind:"輔助", tier:1, up:"每高一階，反燒多 1d6。", text:"整場戰鬥中，近戰打中你的敵人會受 1d6 火焰傷害。"}]},

  // 薩滿圖騰：哥布林薩滿的法器（商店不賣），施法屬性感知
  {id:"shaman_totem", name:"薩滿圖騰", stat:"感知",
   weapons:["薩滿圖騰"],
   skills:[
    {name:"火焰箭", req:"focus", kind:"遠程", dmg:"火焰",   tier:0,   srd:true, text:"12 格內遠程法術攻擊，1d10 火焰傷害。"},
    {id:"totem_healing_word", name:"治癒真言", req:"focus", kind:"輔助", tier:1,   srd:true, free:true, up:"每高一階多恢復 1d4。", text:"免費動作：12 格內一名同伴恢復 1d4 + 感知調整值的生命值。"},
    {id:"bane", name:"災禍術", req:"focus", kind:"豁免", dmg:"",   tier:1, srd:true, up:"每高一階多 1 個目標。", text:"6 格內最多 3 個看得到的敵人做魅力豁免，失敗的話攻擊和豁免 −1d4，直到施法者倒下。"}]}
];
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
const HAS_BASIC = g => !FOCUS_GROUPS.includes(g.id) || g.id==="arcane_staff";   // 這組的第 0 招是基本攻擊（法杖能打擊，其他法器第 0 招是法術）
// 技能表用：這組基本攻擊可能出現的名稱，例如「斬擊／刺擊」
const basicNames = g => [...new Set(g.weapons.map(n=>basicName(g, (typeof ITEMS!=="undefined" ? ITEMS : []).find(i=>i.n===n))))].join("／");
// 傷害種類給玩家看的名字：物理三種合併成物理；力場、光耀算法術；元素照寫
const DMG_SHOWN = {"揮砍":"物理", "穿刺":"物理", "鈍擊":"物理", "流血":"物理", "力場":"法術", "光耀":"法術"};
const dmgShown = t => DMG_SHOWN[t] || t;
