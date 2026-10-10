/* 探索介面文字；外觀暫定（GPT），不新增角色台詞。 */
const EXPLORE_UI={title:"探索",turn:"戰棋",hiddenCount:"已隱藏",enter:"進入探索",group:"群體行動",individual:"個體行動",gather:"集合",leader:"設為隊長",sneak:"潛行",unsneak:"停止潛行",found:"被發現了！",stopped:"全隊已停下",resume:"繼續探索",hint:"點地面移動；點頭像切換個體",blocked:"路線受阻",noPath:"沒有可走的路",combat:"進入戰棋",alignmentBlocked:"附近沒有可安全對齊的空格，請先移到較寬敞的位置。"};

// 互動資料：檢定為大爺 10-03 同意；測試場物件數量與圖形暫定（GPT）。
const EXPLORE_OBJECTS={chest:{name:"寶箱",actions:["unlock","pry"]},door:{name:"門",actions:["door"]},doorOpen:{name:"門",actions:["door"]},trap:{name:"陷阱",actions:["disarm"]},crate:{name:"板條箱",actions:["push"]},powderBarrel:{name:"火藥桶",actions:["pickup","push"]}};
const EXPLORE_CHECKS={unlock:{ability:"DEX",dc:13},pry:{ability:"STR",dc:13,tool:"鐵撬"},disarm:{ability:"DEX",dc:13},trapDC:13,trapDamage:"1d6",trapType:"穿刺"};
const EXPLORE_ACTION_TEXT={search:"搜索",unlock:"開鎖",pry:"撬開",door:"開／關門",disarm:"拆除",push:"推一格",close:"返回",resume:"繼續探索",needTool:"需要鐵撬",failed:"檢定失敗",opened:"寶箱已開啟",empty:"裡面沒有東西",foundTrap:"發現陷阱",trapHit:"踩中陷阱！",searched:"搜索完成",blocked:"前方被擋住",occupied:"有人站在門口，不能關門"};

const EXPLORE_COMBAT={hear:8,rest:"休息／抄筆記",return:"回到探索",start:"切入戰棋",end:"戰鬥結束，回到探索",reinforce:"敵方小隊加入戰鬥",surprised:"措手不及，第一回合不能行動"};

// 少量敵人陷阱（大爺 10-03 同意）：每隻 1 份，花動作放相鄰空格。
const ENEMY_TRAPS={count:1,placed:"放下陷阱"};

// 自訂火藥桶：10-03 大爺確認；外觀及物件 AC 暫定 GPT，不引用其他遊戲數值。
const POWDER_BARREL={damage:"2d6",type:"火焰",dc:13,weight:20,count:2,ac:10};
const WORLD_OBJECT_TEXT={pickup:"收進背包",place:"放置火藥桶",cancel:"取消放置",tooHeavy:"揹不動，火藥桶仍留在地面",placed:"放下火藥桶",picked:"收起火藥桶",exploded:"火藥桶爆炸！",placeHint:"點相鄰空格放置",chestLocked:"上鎖；可搜索、開鎖或用鐵撬撬開",chestOpen:"已開啟；可搜索裡面的物品",crate:"可推一格；提供半掩護",door:"可開關；關門時擋路與視線",trap:"已發現；可拆除",barrel:"20 磅；可收納、放置；探索可推動",blast:"攻擊破壞／火焰引爆；所在格＋周圍八格",chain:"敵我皆傷；相鄰火藥桶連鎖爆炸",carryAction:"20 磅；用掉主要動作",placeAction:"相鄰空格；用掉主要動作"};
EXPLORE_ACTION_TEXT.pickup=WORLD_OBJECT_TEXT.pickup;
