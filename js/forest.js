/* 森林（大爺 10-21）：手工地圖的探索＋戰鬥＋調查。資料、台詞在 data/forest.js
   - 大地圖點「森林」進去（enterForest）：借委託那套（BATTLES.quest、questStars 3、打完回大地圖、可以撤退）
   - 第一次：狼→哥布林前哨→德魯伊→奇美拉；地圖上的敵人全倒＝完成，給 ★★★ 委託的報酬。打完以後再來只有野獸（FOREST.again），沒有報酬
   - 調查點：探索中走到旁邊「調查」，智力檢定（一個地方只能調查一次），結果在 forestClue
   - 德魯伊：一開戰就喊；被敲暈＝這場打完醒來講出真相；被打死＝香香嘀咕一句
   - 石碑讀懂了：之後跟奇美拉那隊開戰時，全隊受到祝福（整場）
   state.forest＝{cleared, clues:{marks, map, stele, bones}}（調查過的記住，再來不能再調查） */
const forestState = () => (state.forest ||= {cleared:false, clues:{}});
const FOREST_KINDS = {T:"tree", b:"bush", "~":"stream", "=":"ford", L:"log", X:"crate", P:"powderBarrel", C:"chest", t:"trap"};
function forestBattle(){
  const F = FOREST, st = forestState(), cleared = st.cleared;
  const d = {name:F.name, seed:0, theme:"forest", w:F.map[0].length, h:F.map.length, tutorial:false, road:[], blocks:[], elev:[], party:F.party.map(p=>[...p]), foes:[], npcs:[],
    forest:true, quest:"forest", questStars:cleared ? 1 : 3, questHome:"forest", questLink:Math.max(0, WORLD.links.findIndex(l=>l.a==="town" && l.b==="forest")), noReward:cleared, after:"questDone"};
  F.map.forEach((row, y)=>[...row].forEach((c, x)=>{
    if(FOREST_KINDS[c]) d.blocks.push({x, y, kind:FOREST_KINDS[c], ...(c==="C" ? {locked:true, contents:[]} : {})});
    else if(c==="S") d.blocks.push({x, y, kind:st.clues.map ? "bush" : "tree", shortcut:true});   // 捷徑的密林
    else if(F.clues[c]){ const k = F.clues[c]; d.blocks.push({x, y, kind:"clue", clue:k.id, name:k.name, art:k.art, dc:k.dc, done:!!st.clues[k.id]}); }
  }));
  (cleared ? F.again : F.foes).forEach(f=>d.foes.push({...f, trapCharges:0}));
  return d;
}
function enterForest(){
  BATTLES.quest = forestBattle();
  state.page = "battle"; state.scout = null; startBattle("quest", false, "explore"); render(); window.scrollTo(0,0);
  const lines = forestState().cleared ? FOREST.againIntro : FOREST.intro;
  lines.forEach(([id, text], i)=>{ const u = B().units.find(v=>v.id===id); if(u) say(u, text, 500 + i*1700); });
}
// 調查（explore.js exploreInteract 呼叫）：ok＝檢定過了
function forestClue(o, ok, u){
  const b = B(), k = Object.values(FOREST.clues).find(c=>c.id===o.clue); if(!k) return;
  o.done = true; forestState().clues[k.id] = ok ? "ok" : "fail";
  blog(ok ? k.ok : k.fail, ok ? "skill" : "");
  if(!ok){ if(k.gold){ CRITTERS.forEach(c=>{ state.gold[c.id] = (state.gold[c.id]||0) + k.gold*GP; }); blog(`每隻拿到 ${k.gold} gp`); } return; }
  if(k.id==="marks") b.def.blocks.filter(q=>q.kind==="trap").forEach(q=>{ q.found = true; });
  if(k.id==="map"){ b.def.blocks.filter(q=>q.shortcut).forEach(q=>{ q.kind = "bush"; }); blog(k.opened, "skill"); }
  if(k.id==="stele") b.forestBless = true;
  if(k.id==="bones"){
    const pool = MAGIC_GOODS.filter(g=>g.rarity==="blue"||g.rarity==="yellow"), g = pool[Math.floor(Math.random()*pool.length)];
    if(g){ const it = makeMagicItem(g, `forest-bones-${Date.now()}`); u.backpack.push(it); (state.inv[u.id] ||= []).push(it.id); syncBattleBag(u); saveMarket(); blog(`${u.name}拿到了${it.n}`, "skill"); }
  }
}
// 開戰（enterExploreCombat／增援 呼叫）：德魯伊喊話、石碑的祝福
function forestCombatStart(){
  const b = B(); if(!b || !b.def.forest) return;
  const act = b.units.filter(u=>u.side==="foe" && u.combatActive && !u.dead);
  const dr = act.find(u=>u.type==="forest_druid" && !u.forestShout);
  if(dr){ dr.forestShout = true; say(dr, FOREST.druidShout, 300); }
  const boss = act.find(u=>u.type==="chimera");
  if(boss && !b.forestBossStart){ b.forestBossStart = true; blog(FOREST.bossShout, "kill");
    if(b.forestBless || forestState().clues.stele==="ok"){ b.units.filter(u=>isPcCritter(u) && !u.dead).forEach(u=>addStatus(u, "blessed", {via:"stele"})); blog(FOREST.clues.R.bless, "skill"); } }
}
// 一場打完回到探索（finishExploreCombat 呼叫）：德魯伊醒來講話
function forestCombatEnd(){
  const b = B(); if(!b || !b.def.forest || b.forestDruidDone) return;
  const dr = b.units.find(u=>u.type==="forest_druid"); if(!dr || !dr.dead) return;
  b.forestDruidDone = true;
  const lines = dr.ko ? FOREST.druidTalk : FOREST.druidDead;
  lines.forEach(([id, text], i)=>{ const u = id==="druid" ? dr : b.units.find(v=>v.id===id); if(u) say(u, text, 600 + i*1900); });
}
// 打贏（grantQuestReward 呼叫）
function forestWin(b){
  if(!b.def.forest) return;
  const st = forestState(); if(!st.cleared){ st.cleared = true; blog(FOREST.cleared, "kill"); }
  FOREST.win.forEach(([id, text], i)=>{ const u = b.units.find(v=>v.id===id && !v.down); if(u) say(u, text, 600 + i*1700); });
}
