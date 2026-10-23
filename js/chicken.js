/* 失蹤的雞（支線，大爺 10-23）：文字、數字在 data/chicken.js
   state.chicken＝{stage, seed, ledger, path, whiteDead, eggs, ev}
     stage：(沒有)＝還沒接｜accepted＝接了、大地圖有 ❗｜report＝打完、回城鎮報告｜done
     ev：大地圖走到 ❗ 的那次事件 {link, t, look:{id,roll,mod,total,ok}, plan, roll, result}
   - 城鎮街上的 ❗（chickenStreetHTML）→ 劇情 chickenAsk → acceptChickenQuest
   - 大地圖 ❗（chickenPins，借委託的泡泡、走路、到達）→ chickenArrive → 劇情 chickenSearch（找雞、開標、揭穿／直接打）→ startChickenFight
   - 戰鬥：異界雞半血變身（chickenOnHurt）、惡魔不死（chickenRepel）、揭穿後雞群每輪一起啄（chickenRound）
   - 打完（grantQuestReward → chickenQuestEnd）→ 劇情 chickenEggs → finishChickenEggs → 城鎮 ❗ → 劇情 chickenEnd → finishChickenQuest（報酬） */
const ensureChicken = () => (state.chicken ||= {seed:1 + Math.floor(Math.random()*2147483646)});
const chickenOpen = () => !!(state.townFounded && state.innNightDone);
const chickenBest = stat => CRITTERS.reduce((best, c)=>modOf(finalScore(c.id,stat)) > modOf(finalScore(best.id,stat)) ? c : best, CRITTERS[0]);
const chickenLines = list => list.map(l=>({draft:CHICKEN.draft, ...l}));
const chickenGo = scene => { state.page = "story"; state.scene = scene; state.line = 0; state.info = null; render(); window.scrollTo(0,0); };

// ---------- 城鎮：街上的 ❗ ----------
function chickenStreetDue(){ if(!chickenOpen()) return null; const s = ensureChicken().stage; return !s ? "ask" : s==="report" ? "end" : null; }
function chickenStreetHTML(){
  const due = chickenStreetDue(); if(!due) return "";
  return `<button class="town-building town-event-bubble chicken-bubble" data-chicken-town="${due}" style="left:${CHICKEN.street.x}%;top:${CHICKEN.street.y}%" aria-label="${CHICKEN.title}"><b>${CHICKEN.street.place}</b><span>${CHICKEN.street.who}${due==="end" ? `／${CHICKEN.street.report}` : ""}</span><span class="town-event-symbol">${obsBubbleHTML("side")}</span></button>`;
}
function bindChickenStreet(){ document.querySelector("[data-chicken-town]")?.addEventListener("click", e=>chickenGo(e.currentTarget.dataset.chickenTown==="end" ? "chickenEnd" : "chickenAsk")); }
function acceptChickenQuest(){ ensureChicken().stage = "accepted"; sfx("pop"); state.page = "town"; render(); }

// ---------- 大地圖：❗ ----------
function chickenPins(){
  const C = state.chicken; if(!C || C.stage!=="accepted") return [];
  const links = orcLinks(); if(!links.length) return [];
  return [{id:"chicken", tpl:"chicken", stars:1, link:links[(C.seed + 1) % links.length], t:.6, seed:C.seed, accepted:true, done:false, chicken:true}];
}
const chickenPinTpl = id => id==="chicken" ? {title:CHICKEN.pin, foes:[]} : null;
function chickenArrive(q){
  const c = chickenBest("WIS"), mod = modOf(finalScore(c.id,"WIS")), roll = d20();
  state.chicken.ev = {link:q.link, t:q.t, look:{id:c.id, roll, mod, total:roll+mod, ok:roll+mod>=CHICKEN.findDc, flick:[0,1,2].map(()=>d20())}};
  state.chicken.ledger = state.chicken.ev.look.ok;
  chickenGo("chickenSearch");
}

// ---------- 劇情：找雞、開標、揭穿 ----------
function chickenSearchScript(){
  const e = state.chicken?.ev || {}, C = CHICKEN;
  const lines = [...chickenLines(C.search)];
  if(e.look) lines.push({who:e.look.id, text:C.lookLine, chickenRoll:"look", mood:"serious", on:"-"}, ...chickenLines(e.look.ok ? C.ledger : C.noLedger));
  lines.push(...chickenLines(C.bid), {who:"narr", text:C.ui.plan, chickenChoice:"plan", on:"demon_chicken"});
  if(e.plan==="expose"){
    lines.push(...chickenLines(C.exposeAsk), {who:e.roll.id, text:"……", chickenRoll:"expose", mood:"smug", on:"demon_chicken"});
    lines.push(...chickenLines(e.roll.ok ? C.exposeOk : [...C.exposeFail, ...C.fight]));
  }
  if(e.plan==="fight") lines.push(...chickenLines(C.fight));
  return lines;
}
const chickenSearchNext = () => state.chicken?.ev?.result ? ["startChickenFight", CHICKEN.ui.go] : ["startChickenFight", CHICKEN.ui.go];
function chickenEggsScript(){
  const C = CHICKEN, s = state.chicken || {};
  const lines = [...chickenLines(C.eggs), {who:"narr", text:C.ui.eggs, chickenChoice:"eggs", on:"-"}];
  if(s.eggs) lines.push(...chickenLines(s.eggs==="give" ? C.giveBack : C.toAuntie));
  return lines;
}
function chickenEndScript(){
  const C = CHICKEN, s = state.chicken || {};
  return chickenLines([...(s.whiteDead ? C.endDead : C.endAlive), ...(s.eggs==="auntie" ? C.endEggs : []), ...C.endPay, ...(s.whiteDead ? C.endDeadTail : C.endAliveTail)]);
}
const chickenChoicePending = line => !!(line && line.chickenChoice && state.chicken && !(line.chickenChoice==="plan" ? state.chicken.ev?.plan : state.chicken.eggs));
function chickenChoiceHTML(step){
  const U = CHICKEN.ui, r = chickenBest("CHA");
  const opts = step==="plan"
    ? [["expose", {...U.expose, sub:U.expose.sub.replace("{dc}", CHICKEN.exposeDc).replace("{who}", r.name).replace("{adv}", state.chicken.ledger ? U.adv : "")}], ["fight", U.fight]]
    : [["give", U.giveBack], ["auntie", U.toAuntie]];
  return `<div class="choice-list">${opts.map(([k,o])=>`<button class="choice" data-chicken-pick="${k}"><b>${o.label}</b><small>${o.sub}</small></button>`).join("")}</div>`;
}
function chickenRollHTML(kind){
  const e = state.chicken?.ev, a = kind==="look" ? e?.look : e?.roll; if(!a) return "";
  const dc = kind==="look" ? CHICKEN.findDc : CHICKEN.exposeDc, name = kind==="look" ? "感知檢定" : "魅力檢定";
  return `<div class="check-row">${name} ${diceFormulaHTML({dice:dieFace(20,a.roll,0,DICE_TUMBLE,a.flick,false),base:a.roll,total:a.total,result:a.ok?"hit":"miss",land:DICE_TUMBLE})}<span class="check-vs">${a.ok?"≥":"<"} ${dc}　${a.ok?"成功！":"失敗"}${a.adv?"（優勢）":""}</span></div>`;
}
async function chickenPick(k){
  const s = state.chicken; if(!s || s.asking || state.page!=="story") return;
  const sc = SCENES[state.scene], line = sc?.script[state.line]; if(!chickenChoicePending(line)) return;
  const from = sc.script.length;
  if(line.chickenChoice==="plan"){
    if(!["expose","fight"].includes(k)) return;
    const e = s.ev;
    if(k==="expose"){
      const c = chickenBest("CHA"), mod = modOf(finalScore(c.id,"CHA")), d = ()=>s.ledger ? Math.max(d20(), d20()) : d20();
      let roll = d(), total = roll + mod, ok = total >= CHICKEN.exposeDc;
      if(!ok){ s.asking = true; if(await luckReroll(c.id, `魅力檢定 ${roll}${fmtN(mod)}＝${total}，沒到 DC ${CHICKEN.exposeDc}`)){ roll = d(); total = roll + mod; ok = total >= CHICKEN.exposeDc; } s.asking = false; }
      e.roll = {id:c.id, roll, mod, total, ok, adv:!!s.ledger, flick:[0,1,2].map(()=>d20())};
      e.result = ok ? "expose" : "fight"; sfx(ok ? "win" : "miss");
    } else { e.result = "fight"; sfx("alert"); }
    e.plan = k;
  } else {
    if(!["give","auntie"].includes(k)) return;
    s.eggs = k; sfx("pop");
  }
  state.line = Math.min(from, sc.script.length - 1); render();
}

// ---------- 戰鬥 ----------
// fight：異界雞＋三隻雞（雞群護著會頭）｜expose：直接打惡魔原形，三隻雞站旁邊當 NPC、每輪一起啄
function startChickenFight(){
  const s = state.chicken, e = s?.ev; if(!e?.result || state.page!=="story") return;
  const path = e.result, l = WORLD.links[e.link] || WORLD.links[0], home = e.t < .5 ? l.a : l.b;
  state.location = home; state.mapSel = home; s.path = path;
  const foes = path==="expose" ? ["chicken_demon"] : ["demon_chicken","hen_white","hen_brown","rooster"];
  const d = generateQuestMap((s.seed + (s.fights = (s.fights||0) + 1)*7919)>>>0, {theme:QUEST_THEME[`${l.a}-${l.b}`]||"plain", foeList:foes, name:CHICKEN.title});
  // 雞群就在眼前：全部搬到小傢伙們前面幾格、同一隊
  const used = new Set([...d.blocks.filter(o=>!["bush","oil"].includes(o.kind)).map(o=>`${o.x},${o.y}`), ...d.party.map(p=>p.join(","))]);
  const [px, py] = d.party[0];
  const near = (tx, ty) => { for(let r=0; r<=5; r++) for(let dx=-r; dx<=r; dx++) for(let dy=-r; dy<=r; dy++){ const x = tx+dx, y = ty+dy, k = `${x},${y}`;
    if(x<1 || y<1 || x>=d.w-1 || y>=d.h-1 || used.has(k)) continue; used.add(k); return {x, y}; } return null; };
  d.foes.forEach((f,i)=>{ const p = near(px-7-(i%2), py-1+i); if(p){ f.x = p.x; f.y = p.y; } f.hidden = false; f.squad = 0; });
  if(path==="expose"){ const c = d.foes[0]; ["hen_white","hen_brown","rooster"].forEach((t,i)=>{ const p = near(c.x-1+i, c.y+(i===1?-2:2)); if(p) d.npcs.push({type:t, x:p.x, y:p.y, face:1}); }); }
  d.quest = "chicken"; d.questStars = 1; d.noReward = true; d.questLink = e.link; d.questHome = home; d.after = "questDone"; d.chicken = path;
  BATTLES.quest = d; state.page = "battle"; state.scout = null; startBattle("quest", false, "explore");
  if(B().phase!=="combat") enterExploreCombat("foe0", true);
  if(path==="fight") blog(CHICKEN.ui.hint, "skill");
  render(); window.scrollTo(0,0);
}
function chickenCombatStart(b, active){ if(b?.def.chicken) active.forEach(u=>u.surprised = false); }   // 面對面開打：沒有奇襲
// 異界雞血量剩一半（含一下打到 0）：變回惡魔原形，換惡魔的數值和招式（hurt 呼叫）
function chickenOnHurt(t){
  if(t.side!=="foe" || t.type!=="demon_chicken" || t.hp > t.maxHp/2) return;
  const e = ENEMIES.chicken_demon;
  Object.assign(t, {type:"chicken_demon", name:e.name, look:e.look, natural:e.natural, special:e.special, specialReady:true, scores:{...e.scores}, mods:abilityMods(e), baseAc:e.ac,
    hp:e.hp, maxHp:e.hp, resistances:[...(e.resistances||[])], damageImmunities:[...(e.damageImmunities||[])], speed:e.speed});
  blog(CHICKEN.ui.transformLog.replace("{name}", ENEMIES.demon_chicken.name), "kill"); fxHit(t, "spark"); sfx("alert");
  say(t, CHICKEN.ui.transformSay, 300);
}
// 惡魔打到 0 血：不死，化成黑煙飛走（算打倒）
function chickenRepel(t, at){
  t.dead = true; t.repelled = true; t.deadAt = impactAt();
  blog(CHICKEN.ui.repelLog.replace("{name}", t.name), "kill"); sfx("poof", at + 300); fxHit(t, "spark");
  say(t, CHICKEN.ui.repelSay, 200);
}
// 揭穿之後：每輪開始，還站著的雞一起啄惡魔（nextTurn 新一輪呼叫）
function chickenRound(){
  const b = B(); if(b?.def.chicken!=="expose" || b.phase!=="combat") return;
  const dm = b.units.find(u=>u.type==="chicken_demon" && !u.dead); if(!dm) return;
  const n = b.units.filter(u=>u.side==="npc" && ["hen_white","hen_brown","rooster"].includes(u.type)).length; if(!n) return;
  blog(CHICKEN.ui.swarm.replace("{name}", dm.name).replace("{n}", n), "skill");
  hurt(dm, rollDice(`${n}d4`).total, "穿刺", null);
}
// 打贏（grantQuestReward 呼叫）：記結果，接劇情（剩下的蛋）
function chickenQuestEnd(b){
  if(!b?.def.chicken || b.chickenEnded) return; b.chickenEnded = true;
  const s = ensureChicken(), w = b.units.find(u=>u.type==="hen_white" && u.side==="foe");
  s.whiteDead = !!(w && w.dead && !w.ko); s.stage = "eggs";
  state.afterQuestScene = "chickenEggs";
  b.chickenEnd = true;
}
const chickenEndHTML = () => B()?.chickenEnd ? `<p class="quest-reward owlbear-end">${CHICKEN.ui.end}</p>` : "";
function finishChickenEggs(){ const s = ensureChicken(); if(!s.eggs) return; s.stage = "report"; state.page = "map"; render(); window.scrollTo(0,0); }
function finishChickenQuest(){
  const s = ensureChicken(); if(s.stage!=="report") return;
  s.stage = "done";
  grantPartyGold(CHICKEN.gold);
  const it = ITEMS.find(i=>i.n===CHICKEN.item); if(it){ (state.inv.raccoon ||= []).push(makeItem(it, true, "raccoon").id); }
  if(s.whiteDead) changeStressAll(v=>v + CHICKEN.whiteStress);
  sfx("win"); state.page = "town"; render(); window.scrollTo(0,0);
}
