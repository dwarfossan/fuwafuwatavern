/* 手工地圖的地城（大爺 10-21）：森林、洞窟共用。資料、台詞在 data/forest.js、data/cave.js（DUNGEONS 登記）
   - 大地圖點那個地點進去（enterDungeon）：借委託那套（BATTLES.quest、可以撤退、打完回大地圖那裡）
   - 第一次：照 foes 排的小隊；地圖上的敵人全倒＝完成，給 ★★★ 委託的報酬（每隻 100 gp＋魔法物品）。打完以後再來只有 again 那批，沒有報酬
   - 調查點（智力檢定，一個地方只能調查一次，失敗頂多錯過）：效果照 clue.effect
       revealTraps 陷阱全部標出來／shortcut 捷徑（S 格變成能走的）／loot 隨機魔法物品／boss:"bless"|"fireResist"|"rockfall" 打頭目時的好處
   - talker（森林的德魯伊）：一開戰就喊；被敲暈＝那場打完醒來講話，打死＝香香嘀咕一句
   state.dungeons[id]＝{cleared, clues:{id:"ok"|"fail"}}（state.forest 是舊的森林存檔，讀進來沿用） */
function dungeonState(id){
  state.dungeons ||= {};
  if(id==="forest" && state.forest && !state.dungeons.forest) state.dungeons.forest = state.forest;   // 10-21 早一點的存檔
  return (state.dungeons[id] ||= {cleared:false, clues:{}});
}
const forestState = () => dungeonState("forest");
const DUNGEON_KINDS = {T:"tree", W:"rock", b:"bush", "~":"stream", "=":"ford", L:"log", X:"crate", P:"powderBarrel", C:"chest", t:"trap", F:"brazier", g:"gravel"};
function dungeonBattle(id){
  const D = DUNGEONS[id], st = dungeonState(id), cleared = st.cleared;
  const d = {name:D.name, seed:0, theme:D.theme||"forest", w:D.map[0].length, h:D.map.length, tutorial:false, road:[], blocks:[], elev:[], party:D.party.map(p=>[...p]), foes:[], npcs:[],
    dungeon:id, forest:id==="forest", lighting:D.lighting, lights:(D.lights||[]).map(l=>({...l})),
    quest:id, questStars:cleared ? 1 : 3, questHome:D.home||id, questLink:Math.max(0, WORLD.links.findIndex(l=>l.a==="town" && l.b===(D.home||id))), noReward:cleared, after:"questDone"};
  D.map.forEach((row, y)=>[...row].forEach((c, x)=>{
    if(DUNGEON_KINDS[c]){ d.blocks.push({x, y, kind:DUNGEON_KINDS[c], ...(c==="C" ? {locked:true, contents:[]} : {})}); if(c==="F") d.lights.push({x, y, bright:2, dim:4}); }   // 火盆＝光源
    else if(c==="S") d.blocks.push({x, y, kind:st.clues[D.shortcutClue]==="ok" ? D.shortcutOpen : D.shortcutClosed, shortcut:true});   // 捷徑
    else if(D.clues[c]){ const k = D.clues[c]; d.blocks.push({x, y, kind:"clue", clue:k.id, name:k.name, art:k.art, dc:k.dc, done:!!st.clues[k.id]}); }
  }));
  // 岩壁深處（四周都是岩壁）：畫成平平的黑，不畫成一塊塊石頭，畫面才看得到路（10-21）
  const rockAt = (x,y)=>x<0||y<0||x>=d.w||y>=d.h||D.map[y][x]==="W";
  d.blocks.forEach(o=>{ if(o.kind==="rock" && [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].every(([dx,dy])=>rockAt(o.x+dx,o.y+dy))) o.deep = true; });
  (cleared ? D.again : D.foes).forEach(f=>d.foes.push({...f, trapCharges:0}));
  return d;
}
function enterDungeon(id){
  BATTLES.quest = dungeonBattle(id);
  state.page = "battle"; state.scout = null; startBattle("quest", false, "explore"); render(); window.scrollTo(0,0);
  const D = DUNGEONS[id], lines = dungeonState(id).cleared ? D.againIntro : D.intro;
  (lines||[]).forEach(([who, text], i)=>{ const u = B().units.find(v=>v.id===who); if(u) say(u, text, 500 + i*1700); });
}
const enterForest = () => enterDungeon("forest");
const dungeonOf = b => b && b.def.dungeon && DUNGEONS[b.def.dungeon];
// 調查（explore.js exploreInteract 呼叫）：ok＝檢定過了
function forestClue(o, ok, u){
  const b = B(), D = dungeonOf(b); if(!D) return;
  const k = Object.values(D.clues).find(c=>c.id===o.clue); if(!k) return;
  o.done = true; dungeonState(b.def.dungeon).clues[k.id] = ok ? "ok" : "fail";
  blog(ok ? k.ok : k.fail, ok ? "skill" : "");
  if(!ok){ if(k.gold){ CRITTERS.forEach(c=>{ state.gold[c.id] = (state.gold[c.id]||0) + k.gold*GP; }); blog(`每隻拿到 ${k.gold} gp`); } return; }
  if(k.effect==="revealTraps") b.def.blocks.filter(q=>q.kind==="trap").forEach(q=>{ q.found = true; });
  if(k.effect==="shortcut"){ b.def.blocks.filter(q=>q.shortcut).forEach(q=>{ q.kind = D.shortcutOpen; }); if(k.opened) blog(k.opened, "skill"); }
  if(k.effect==="loot"){
    const pool = MAGIC_GOODS.filter(g=>g.rarity==="blue"||g.rarity==="yellow"), g = pool[Math.floor(Math.random()*pool.length)];
    if(g){ const it = makeMagicItem(g, `${b.def.dungeon}-${k.id}-${Date.now()}`); u.backpack.push(it); (state.inv[u.id] ||= []).push(it.id); syncBattleBag(u); saveMarket(); blog(`${u.name}拿到了${it.n}`, "skill"); }
  }
  if(k.trapsFound) b.def.blocks.filter(q=>q.kind==="trap").forEach(q=>{ q.found = true; });
}
// 開戰（enterExploreCombat／增援 呼叫）：talker 喊話、打頭目時調查得到的好處
function forestCombatStart(){
  const b = B(), D = dungeonOf(b); if(!D) return;
  const act = b.units.filter(u=>u.side==="foe" && u.combatActive && !u.dead), st = dungeonState(b.def.dungeon);
  const tk = D.talker && act.find(u=>u.type===D.talker.type && !u.dungeonShout);
  if(tk){ tk.dungeonShout = true; say(tk, D.talker.shout, 300); }
  const boss = act.find(u=>u.type===D.boss);
  if(boss && !b.dungeonBossStart){ b.dungeonBossStart = true; if(D.bossShout) blog(D.bossShout, "kill");
    const pcs = b.units.filter(u=>isPcCritter(u) && !u.dead);
    Object.values(D.clues).filter(k=>k.boss && st.clues[k.id]==="ok").forEach(k=>{
      if(k.boss==="bless") pcs.forEach(u=>addStatus(u, "blessed", {via:"stele"}));
      if(k.boss==="fireResist") pcs.forEach(u=>{ u.resistances ||= []; if(!u.resistances.includes("火焰")) u.resistances.push("火焰"); });
      if(k.boss==="rockfall"){ const n = rollDice("4d6").total; fxHit(boss, "burst"); hurt(boss, n, "鈍擊", null); }
      if(k.bossText) blog(k.bossText, "skill");
    }); }
}
// 一場打完回到探索（finishExploreCombat 呼叫）：talker 醒來講話
function forestCombatEnd(){
  const b = B(), D = dungeonOf(b); if(!D || !D.talker || b.dungeonTalkDone) return;
  const tk = b.units.find(u=>u.type===D.talker.type); if(!tk || !tk.dead) return;
  b.dungeonTalkDone = true;
  (tk.ko ? D.talker.talk : D.talker.dead).forEach(([who, text], i)=>{ const u = who==="talker" ? tk : b.units.find(v=>v.id===who); if(u) say(u, text, 600 + i*1900); });
}
// 打贏（grantQuestReward 呼叫）
function forestWin(b){
  const D = dungeonOf(b); if(!D) return;
  const st = dungeonState(b.def.dungeon); if(!st.cleared){ st.cleared = true; blog(D.cleared, "kill"); }
  (D.win||[]).forEach(([who, text], i)=>{ const u = b.units.find(v=>v.id===who && !v.down); if(u) say(u, text, 600 + i*1700); });
}
