/* 梟熊寶寶劇情第一段（大爺 10-21）：文字、數字在 data/owlbear-story.js
   state.owlbear = {stage, day}：stage＝"cubFled"（敲暈寶寶，牠逃走了）｜"cubDead"（打死寶寶）｜"motherKO"（敲暈媽媽）
   - questBattle：第一次的梟熊委託（還沒有 state.owlbear）戰場標 d.owlbearStory
   - hurt() 打倒敵人時呼叫 owlbearOnDown：媽媽被打死 → 寶寶出場；寶寶被打死／敲暈 → 台詞、壓力
   - grantQuestReward（打贏）呼叫 owlbearQuestEnd：記結果，勝利畫面多一段
   - 大地圖走路：motherKO 之後第一次閒聊換成「一大一小的腳印」（owlbearTravelChat） */
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
  if(!b || !b.def.owlbearStory || state.owlbear) return;
  const mother = b.units.find(v=>v.type==="owlbear");
  const stage = b.owlbearCubKilled ? "cubDead" : b.owlbearCub ? "cubFled" : mother && mother.ko ? "motherKO" : null;
  if(!stage) return;
  state.owlbear = {stage, day:ensureMarket().day};
  b.owlbearEnd = OWLBEAR_STORY.end[stage];
}
const owlbearEndHTML = () => { const t = B()?.owlbearEnd; return t ? `<p class="quest-reward owlbear-end">${t}</p>` : ""; };
// 大地圖閒聊：敲暈媽媽之後，下一次走路看到大小腳印（只一次）
function owlbearTravelChat(){
  const o = state.owlbear; if(!o || o.stage!=="motherKO" || o.tracksSeen) return null;
  o.tracksSeen = true;
  return OWLBEAR_STORY.tracks;
}
