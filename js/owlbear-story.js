/* 梟熊寶寶劇情第一段（大爺 10-21）：文字、數字在 data/owlbear-story.js
   state.owlbear = {stage, day}：stage＝"cubFled"（敲暈寶寶，牠逃走了）｜"cubDead"（打死寶寶）｜"motherKO"（敲暈媽媽）
   - questBattle：第一次的梟熊委託（還沒有 state.owlbear）戰場標 d.owlbearStory
   - hurt() 打倒敵人時呼叫 owlbearOnDown：媽媽被打死 → 寶寶出場；寶寶被打死／敲暈 → 台詞、壓力
   - grantQuestReward（打贏）呼叫 owlbearQuestEnd：記結果，勝利畫面多一段
   - 大地圖走路：motherKO 之後第一次閒聊換成「一大一小的腳印」（owlbearTravelChat）
   第二段、第三段（流程寫在 data/owlbear-story.js 開頭）：owlbearPins／owlbearArrive／owlbearHuntBattle、owlbearCampStep／owlbearAfterCamp */
const owlbearStoryFor = q => !!q && q.tpl===OWLBEAR_STORY.quest && !state.owlbear;
function owlbearSay(lines, start=0){
  const b = B(); if(!b) return;
  lines.forEach(([id, text], i)=>{ const u = b.units.find(v=>v.id===id && !v.dead && !v.down); if(u) say(u, text, start + i*1700); });
}
// 寶寶出場：放在媽媽旁邊放得下的地方，排在這一輪下一個行動
function spawnOwlbearCub(mother){
  const b = B(), e = ENEMIES.owlbear_cub, proto = {side:"foe", type:"owlbear_cub", x:mother.x, y:mother.y};
  const p = freeSpotFor(proto, mother.x, mother.y, 4); if(!p) return null;
  const u = cur() || mother;
  const cub = {
    id:"cub", side:"foe", trapCharges:0, squad:mother.squad, type:"owlbear_cub", name:e.name, look:e.look, natural:e.natural, special:e.special,
    x:p.x, y:p.y, hp:e.hp, maxHp:e.hp, scores:{...e.scores}, mods:abilityMods(e), baseAc:e.ac, testSkill:null, testSkillUsed:false,
    resistances:[], damageImmunities:[], vulnerabilities:[],
    weapon:null, focus:null, shield:false, armor:null, spare:[], items:[], backpackEquip:null, backpack:[], born:null,
    learned:[], activeSkills:[], speed:e.speed, statuses:[], level:1, down:false, face:mother.face||1, oaUsed:false,
    combatActive:true, init:(u.init||0) - .001
  };
  b.units.splice(b.turn + 1, 0, cub);
  faceTo(cub, cur() || mother); fxHit(cub, "spark"); sfx("alert");
  return cub;
}
function owlbearOnDown(t, src){
  const b = B(); if(!b || !b.def.owlbearStory) return;
  const S = OWLBEAR_STORY;
  if(t.type==="owlbear" && !t.ko && !b.owlbearCub){
    const cub = spawnOwlbearCub(t); if(!cub) return;
    b.owlbearCub = cub.id;
    blog(S.appear.log, "kill"); blog(S.appear.hint, "skill");
    owlbearSay(S.appear.lines, 900);
  } else if(t.type==="owlbear_cub"){
    if(t.ko){ b.owlbearCubKO = true; owlbearSay(S.knocked.lines, 900); return; }
    b.owlbearCubKilled = true;
    blog(S.killed.log, "kill");
    b.units.filter(isCritter).filter(v=>!v.dead).forEach(v=>addStress(v, S.cubStress, S.killed.why));
    owlbearSay(S.killed.lines, 900);
  }
}
// 打贏：記結果（輸了、撤退不會走到這裡）
function owlbearQuestEnd(b){
  if(b && b.def.owlbearHunt && state.owlbear && state.owlbear.stage==="seen"){ state.owlbear.stage = "rescued"; state.owlbear.approach = 0; b.owlbearEnd = OWLBEAR_STORY.hunt.end; return; }
  if(!b || !b.def.owlbearStory || state.owlbear) return;
  const mother = b.units.find(v=>v.type==="owlbear");
  const stage = b.owlbearCubKilled ? "cubDead" : b.owlbearCub ? "cubFled" : mother && mother.ko ? "motherKO" : null;
  if(!stage) return;
  state.owlbear = {stage, day:ensureMarket().day};
  b.owlbearEnd = OWLBEAR_STORY.end[stage];
}
const owlbearEndHTML = () => { const t = B()?.owlbearEnd; return t ? `<p class="quest-reward owlbear-end">${t}</p>` : ""; };
// 大地圖閒聊（閒聊時間到了先問這裡，回傳一段台詞就換掉隨機閒聊）
//   敲暈媽媽之後：下一次走路看到大小腳印（只一次）
//   寶寶逃走之後：每趟走路擲一次（四隻最高的被動感知 對 notice.dc），過了＝發現被跟蹤（第二段開始）
function owlbearTravelChat(tr){
  const o = state.owlbear; if(!o) return null;
  if(o.stage==="motherKO" && !o.tracksSeen){ o.tracksSeen = true; return OWLBEAR_STORY.tracks; }
  if(o.stage==="cubFled" && tr && !tr.owlChecked){
    tr.owlChecked = true;
    const best = Math.max(...CRITTERS.map(c=>10 + Math.floor((abilityScore(c.id,"WIS")-10)/2)));
    if(best >= OWLBEAR_STORY.notice.dc){ o.stage = "followed"; return {lines:OWLBEAR_STORY.notice.lines}; }
  }
  return null;
}

// ---------- 第二段：大地圖上的 ❗（不是公會委託，但借用委託的泡泡、走路、到達流程） ----------
const OWL_LINK = () => Math.max(0, WORLD.links.findIndex(l=>l.a==="town" && l.b==="forest"));
function owlbearPins(){
  const o = state.owlbear; if(!o) return [];
  const pin = (id, t) => ({id, tpl:id, stars:0, link:OWL_LINK(), t, seed:(o.seed ||= 1 + Math.floor(Math.random()*2147483646)), accepted:true, done:false, story:id});
  if(o.stage==="followed") return [pin("owl1", .55)];
  if(o.stage==="seen" && ensureMarket().day > (o.seenDay||0)) return [pin("owl2", .6)];   // 換日以後（長休過）才出現
  return [];
}
const owlbearPinTpl = id => OWLBEAR_STORY.pins[id] ? {...OWLBEAR_STORY.pins[id], foes:[]} : null;
// 走到 ❗：第一個看劇情，第二個打獵人
function owlbearArrive(q){
  if(q.story==="owl1"){ state.page = "story"; state.scene = "owlbearSeen"; state.line = 0; state.info = null; render(); window.scrollTo(0,0); return; }
  BATTLES.quest = owlbearHuntBattle(q);
  state.page = "battle"; state.scout = null; startBattle("quest", false, "explore");
  const b = B(), cub = b.units.find(v=>v.side==="npc" && v.type==="owlbear_cub");
  if(cub) cub.statuses.push({k:"restrained", via:"net", dc:99});   // 被網子困住（只是看的，NPC 不行動）
  blog(OWLBEAR_STORY.hunt.log, "kill");
  render(); window.scrollTo(0,0);
  const u = exploreUnit(); OWLBEAR_STORY.hunt.lines.forEach(([id, text], i)=>{ if(u) say(u, text, 600 + i*1700); });
}
function finishOwlbearSeen(){
  const o = state.owlbear; if(!o || o.stage!=="followed") return;
  o.stage = "seen"; o.seenDay = ensureMarket().day;
  state.page = "map"; render(); window.scrollTo(0,0);
}
// 獵人：森林主題的委託地圖，寶寶（NPC）困在獵人營地旁邊
function owlbearHuntBattle(q){
  const d = generateQuestMap(q.seed, {theme:"forest", foeList:["hunter","hunter","hunter_archer"], name:OWLBEAR_STORY.pins.owl2.title});
  const used = new Set([...d.blocks.filter(o=>!["bush","oil"].includes(o.kind)).map(o=>`${o.x},${o.y}`), ...d.foes.map(f=>`${f.x},${f.y}`), ...d.party.map(p=>p.join(","))]);
  const f0 = d.foes.find(f=>!f.hidden) || d.foes[0];
  let spot = null;
  for(let r=1; r<=4 && !spot; r++) for(let dx=-r; dx<=r && !spot; dx++) for(let dy=-r; dy<=r && !spot; dy++){
    const x = f0.x+dx, y = f0.y+dy; if(x<0||y<0||x>=d.w||y>=d.h||used.has(`${x},${y}`)) continue; spot = {x, y};
  }
  if(spot) d.npcs.push({type:"owlbear_cub", x:spot.x, y:spot.y, face:-1});
  d.quest = q.id; d.questStars = 1; d.questHome = questHome(q); d.after = "questDone"; d.owlbearHunt = true;
  return d;
}

// ---------- 第三段：露營時慢慢靠近、加入；加入以後吃飯長大 ----------
// startCamp（一次）呼叫：決定這次露營多演哪一段，結果記在 state.camp.owl（campScript 每次重畫都會讀，所以不能在那裡加次數）
function owlbearCampStep(){
  const o = state.owlbear, S = OWLBEAR_STORY;
  if(o && o.stage==="rescued"){
    const n = (o.approach||0); o.approach = n + 1;
    const lines = S.approach.steps[Math.min(n, S.approach.steps.length-1)];
    if(o.approach >= S.approach.need){ o.stage = "joined"; state.pet = {type:S.growth[0].type, name:null, hp:ENEMIES[S.growth[0].type].hp, bones:false, fed:0}; state.petNameDue = true; }
    return lines;
  }
  if(o && o.stage==="joined" && state.pet){
    const p = state.pet; p.fed = (p.fed||0) + 1;
    const next = [...S.growth].reverse().find(g=>p.fed >= g.fed);
    if(next && next.type!==p.type){ p.type = next.type; p.hp = ENEMIES[p.type].hp; p.bones = false;
      const name = p.name || S.pet.defaultName;
      return (next.lines||[]).map(l=>({...l, text:l.text.replaceAll("{name}", name)})); }
  }
  return null;
}
// 露營完回到探索：剛加入就問名字
function owlbearAfterCamp(){
  const b = B(); if(!state.petNameDue || !b) return;
  delete state.petNameDue; b.steedNameAsk = {first:true, pet:true}; b.busy = true; refreshBattle();
}
