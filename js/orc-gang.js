/* 獨眼獸人強盜團（支線，大爺 10-23）：文字、數字在 data/orc-gang.js
   state.orcGang＝{seed, accepted, stage, grudge, claim, note, boardSeen}
     stage：wild（還沒碰過／碰過但隊長沒逃）｜fled（第一次隊長逃走了，會回來）｜done（隊長死了或被活捉）
     claim：{gold, kind} 還沒去公會領的賞金
   state.orcEvent＝路上遇到時的支線事件（劇情 orcEvent）：{link, t, seed, first, roll, second, result}
   - 公會委託板：通緝單（orcWantedHTML）；城鎮公會掛黃 ❗（orcGuildNotice）
   - 接了：大地圖上的 ❗（orcPins，借委託的泡泡、走路、到達）→ orcArrive
   - 沒接：大地圖走路時擲遭遇（orcTravelRoll／orcTrigger）→ 劇情 orcEvent → startOrcFight／resumeOrcTravel
   - 戰鬥：orcBattle 產生地圖；回合開始 orcTurnStart（褲子、逃走）；新一輪 orcLateJoin（躲著的趕來）；開戰 orcCombatSurprise
   - 打完：orcQuestEnd 記結果、算賞金；勝利畫面 orcEndHTML */
const ensureOrc = () => (state.orcGang ||= {seed:1 + Math.floor(Math.random()*2147483646), accepted:false, stage:"wild"});
const orcPosted = () => !!(state.townFounded && state.innNightDone);
const orcActive = () => orcPosted() && ensureOrc().stage!=="done";
const orcLinks = () => WORLD.links.map((l,i)=>[l,i]).filter(([l])=>l.a==="town" || l.b==="town").map(([,i])=>i);
const orcLinkOf = (a, b) => WORLD.links.findIndex(l=>(l.a===a && l.b===b) || (l.a===b && l.b===a));
const orcGrudge = () => { const id = state.orcGang?.grudge, g = id && grudgeById(id); return g && ["pending","active"].includes(g.status) ? g : null; };
const orcCrew = () => orcGrudge() ? ORC_GANG.crewReturn : ORC_GANG.crew;
const orcSeenWord = () => ["一","兩","三"][orcCrew().length - 2] || "幾";   // 看得到的：嘍囉少一隻（大便那隻），隊長藏著

// ---------- 公會：通緝單 ----------
function orcWantedHTML(){
  if(!orcPosted()) return "";
  const G = ensureOrc(), W = ORC_GANG.wanted, done = G.stage==="done";
  const reward = W.reward.replace("{g}", ORC_GANG.bounty).replace("{c}", Math.round(ORC_GANG.bounty*ORC_GANG.captureMul));
  const st = G.claim ? `<button class="btn small" data-orc-claim="1">${W.claim}（${G.claim.gold} gp）</button>`
    : done ? `<span class="quest-state done">${W.claimed}</span>`
    : G.accepted ? `<span class="quest-state">${W.accepted}</span>`
    : `<button class="btn small" data-orc-accept="1">${W.accept}</button>`;
  return `<div class="quest-card orc-wanted${done && !G.claim ? " done" : ""}" data-orc-card="1"><div class="quest-top"><b>${W.title}</b></div><p>${G.note || (G.stage==="fled" ? W.fledText : W.text)}</p><small>${QUEST_UI.client}：${W.client} · ${QUEST_UI.foes}：${W.foes}</small><small>${QUEST_UI.reward}：${reward}</small>${st}</div>`;
}
function bindOrcWanted(){
  if(!document.querySelector("[data-orc-card]")) return;
  const G = ensureOrc(); G.boardSeen = true;
  document.querySelector("[data-orc-accept]")?.addEventListener("click", ()=>{ if(!orcActive()) return; G.accepted = true; G.note = null; sfx("pop"); render(); });
  document.querySelector("[data-orc-claim]")?.addEventListener("click", ()=>{
    const c = G.claim; if(!c) return;
    grantPartyGold(c.gold); G.claim = null;
    G.note = ORC_GANG.wanted.claimText[c.kind].replace("{g}", c.gold);
    sfx("win"); render();
  });
}
const orcGuildNotice = () => orcPosted() && (!ensureOrc().boardSeen || !!ensureOrc().claim);

// ---------- 接了通緝：大地圖上的 ❗ ----------
function orcPins(){
  if(!orcActive() || !ensureOrc().accepted) return [];
  const G = ensureOrc(), links = orcLinks(); if(!links.length) return [];
  return [{id:"orc", tpl:"orc", stars:0, link:links[G.seed % links.length], t:.5, seed:G.seed, accepted:true, done:false, orc:true}];
}
const orcPinTpl = id => id==="orc" ? {title:ORC_GANG.wanted.pin, foes:[]} : null;
function orcArrive(q){ startOrcBattle(q.link, q.t, (q.seed + (state.orcGang.fights||0)*7919)>>>0, "camp"); }

// ---------- 沒接：路上遇到 ----------
// 開始走路時擲一次：經過城鎮的那段路才算（第一段經過城鎮的）
function orcTravelRoll(route){
  if(!orcActive() || ensureOrc().accepted || !route) return null;
  const leg = route.findIndex((p,i)=>i<route.length-1 && (p==="town" || route[i+1]==="town"));
  if(leg<0 || Math.random() >= ORC_GANG.encounter) return null;
  return {leg, t:ORC_GANG.at};
}
function orcTrigger(tr, p){
  tr.orcSeen = true; tr.alert = true; tr.running = false; state.worldLine = null;
  const a = tr.route[tr.leg], b = tr.route[tr.leg+1], link = orcLinkOf(a, b), l = WORLD.links[link];
  state.orcEvent = {link, t:l && l.a===a ? tr.t : 1 - tr.t, seed:1 + Math.floor(Math.random()*2147483646)};
  focusWorldParty(p); render();
  setTimeout(()=>{ if(state.travel!==tr || state.page!=="map") return; state.page = "story"; state.scene = "orcEvent"; state.line = 0; state.info = null; render(); }, 1200);
}
// 繞開時誰去看：被動感知最高的那隻
const orcRoller = () => CRITTERS.reduce((best, c)=>modOf(finalScore(c.id,"WIS")) > modOf(finalScore(best.id,"WIS")) ? c : best, CRITTERS[0]);
const orcLines = list => list.map(l=>({draft:ORC_GANG.draft, ...l, text:l.text.replaceAll("{n}", orcSeenWord())}));
function orcEventScript(){
  const e = state.orcEvent || {}, S = ORC_GANG;
  const lines = [...orcLines(S.signs), {who:"narr", text:S.ask, orcChoice:"signs"}];
  if(e.first==="fight") lines.push(...orcLines(S.fight));
  if(e.first==="sneak"){
    lines.push(...orcLines(S.sneak), {who:e.roll.id, text:S.rollLine, orcRoll:true, mood:"serious"});
    if(!e.roll.ok) lines.push(...orcLines(S.miss));
    else {
      lines.push(...orcLines(S.poop), {who:"narr", text:S.ask, orcChoice:"poop"});
      if(e.second) lines.push(...orcLines(e.second==="ambush" ? S.ambush : e.second==="fight" ? S.poopFight : S.leave));
    }
  }
  return lines;
}
const orcEventNext = () => ["fight","ambush"].includes(state.orcEvent?.result) ? ["startOrcFight","戰鬥開始！"] : ["resumeOrcTravel","繼續上路"];
const orcChoicePending = line => !!(line && line.orcChoice && state.orcEvent && !(line.orcChoice==="signs" ? state.orcEvent.first : state.orcEvent.second));
function orcChoiceHTML(step){
  const P = ORC_GANG.pick, r = orcRoller();
  const opts = step==="signs" ? [["fight", P.fight], ["sneak", {...P.sneak, sub:P.sneak.sub.replace("{dc}", ORC_GANG.dc).replace("{who}", r.name)}]] : [["ambush", P.ambush], ["fight", P.fight], ["leave", P.leave]];
  return `<div class="choice-list">${opts.map(([k,o])=>`<button class="choice" data-orc-pick="${k}"><b>${o.label}</b><small>${o.sub}</small></button>`).join("")}</div>`;
}
function orcRollHTML(){
  const a = state.orcEvent?.roll; if(!a) return "";
  return `<div class="check-row">感知檢定 ${diceFormulaHTML({dice:dieFace(20,a.roll,0,DICE_TUMBLE,a.flick,false),base:a.roll,total:a.total,result:a.ok?"hit":"miss",land:DICE_TUMBLE})}<span class="check-vs">${a.ok?"≥":"<"} ${ORC_GANG.dc}　${a.ok?"成功！":"失敗"}</span></div>`;
}
async function orcPick(k){
  const e = state.orcEvent; if(!e || e.asking || state.page!=="story" || state.scene!=="orcEvent") return;
  const line = SCENES.orcEvent.script[state.line]; if(!orcChoicePending(line)) return;
  const from = SCENES.orcEvent.script.length;
  if(line.orcChoice==="signs"){
    if(!["fight","sneak"].includes(k)) return;
    if(k==="sneak"){
      const c = orcRoller(), mod = modOf(finalScore(c.id,"WIS"));
      let roll = d20(), total = roll + mod, ok = total >= ORC_GANG.dc;
      if(!ok){ e.asking = true; if(await luckReroll(c.id, `感知檢定 ${roll}${fmtN(mod)}＝${total}，沒到 DC ${ORC_GANG.dc}`)){ roll = d20(); total = roll + mod; ok = total >= ORC_GANG.dc; } e.asking = false; }
      e.roll = {id:c.id, roll, mod, total, ok, flick:[0,1,2].map(()=>d20())};
      e.result = ok ? null : "miss"; sfx(ok ? "win" : "miss");
    } else { e.result = "fight"; sfx("alert"); }
    e.first = k;
  } else {
    if(!["ambush","fight","leave"].includes(k)) return;
    e.second = k; e.result = k; sfx(k==="leave" ? "pop" : "alert");
  }
  state.line = Math.min(from, SCENES.orcEvent.script.length - 1); render();
}
function resumeOrcTravel(){
  const tr = state.travel; state.orcEvent = null; state.worldLine = null; state.page = "map";
  if(tr?.route){ tr.alert = false; render(); startWorldTravel(tr); } else render();
}
function startOrcFight(){
  const e = state.orcEvent; if(!e || !["fight","ambush"].includes(e.result) || state.page!=="story") return;
  state.travel = null; state.worldLine = null; state.orcEvent = null;
  startOrcBattle(e.link, e.t, e.seed, e.result);
}

// ---------- 戰場 ----------
// variant：camp＝接了委託找上門（照常探索開場）｜fight＝正面打（看得到的嘍囉先開戰，其他的第 lateRound 輪趕來）｜ambush＝伏擊大便的那隻（牠被奇襲、褲子沒穿好，其他的第 lateRound 輪趕來）
function orcBattle(link, seed, variant){
  const l = WORLD.links[link] || WORLD.links[0], g = orcGrudge(), crew = orcCrew();
  const d = generateQuestMap(seed, {theme:QUEST_THEME[`${l.a}-${l.b}`]||"plain", foeList:[...crew, "orc_captain"], name:ORC_GANG.wanted.title});
  const cap = d.foes[crew.length];
  if(g && cap){ if(g.status==="pending") g.returns += 1; g.status = "active"; cap.grudge = g.id; cap.hidden = false; }
  if(variant!=="camp"){
    const used = new Set([...d.blocks.filter(o=>!["bush","oil"].includes(o.kind)).map(o=>`${o.x},${o.y}`), ...d.party.map(p=>p.join(","))]);
    d.foes.forEach(f=>used.add(`${f.x},${f.y}`));
    const px = d.party[0][0], py = d.party[0][1];
    const near = (tx, ty) => { for(let r=0; r<=5; r++) for(let dx=-r; dx<=r; dx++) for(let dy=-r; dy<=r; dy++){ const x = tx+dx, y = ty+dy, k = `${x},${y}`;
      if(x<1 || y<1 || x>=d.w-1 || y>=d.h-1 || used.has(k)) continue; used.add(k); return {x, y}; } return null; };
    const lead = variant==="ambush" ? [crew.length-1] : crew.map((_,i)=>i).slice(0, crew.length-1);
    const road = d.road.filter(([x])=>x===px-(variant==="ambush" ? 5 : 8));
    lead.forEach((i,n)=>{ const f = d.foes[i], [rx, ry] = road[n % Math.max(1, road.length)] || [px-6, py];
      used.delete(`${f.x},${f.y}`);
      const p = near(rx, variant==="ambush" ? ry + 3 : ry); if(p){ f.x = p.x; f.y = p.y; }
      f.hidden = false; f.squad = 0; });
    d.foes.forEach((f,i)=>{ if(!lead.includes(i)){ f.squad = 5; f.hidden = false; } });
    d.orcLead = lead;
  }
  const t = state.orcGang.fights = (state.orcGang.fights||0) + 1;
  d.quest = "orc"; d.questStars = 0; d.noReward = true; d.questLink = link; d.after = "questDone"; d.orcGang = variant; d.orcFight = t;
  return d;
}
function startOrcBattle(link, t, seed, variant){
  const l = WORLD.links[link] || WORLD.links[0], home = t < .5 ? l.a : l.b;
  state.location = home; state.mapSel = home;
  const d = orcBattle(link, seed, variant); d.questHome = home;
  BATTLES.quest = d; state.page = "battle"; state.scout = null; startBattle("quest", false, "explore");
  if(variant!=="camp" && B().phase!=="combat") enterExploreCombat("foe"+d.orcLead[0], true);   // 靠太近的話探索一開場就自動開戰了
  render(); window.scrollTo(0,0);
}
// 開戰時（enterExploreCombat 呼叫，不管是自動還是手動開戰）：掛上褲子、趕來的旗標；伏擊＝只有大便那隻被奇襲，正面打＝雙方都不算奇襲
function orcCombatSurprise(b, active){
  if(!b?.def.orcGang || b.def.orcGang==="camp" || b.orcOpened) return;
  b.orcOpened = true;
  const lead = b.def.orcLead || [];
  b.def.foes.forEach((f,i)=>{ const u = b.units.find(v=>v.id==="foe"+i); if(!u) return;
    if(lead.includes(i)){ if(b.def.orcGang==="ambush") u.pantsDown = true; } else u.orcLate = ORC_GANG.lateRound; });
  // 只有帶頭的那批先開打；躲著的就算被叫進來，也要等 lateRound 才動
  for(let i=active.length-1; i>=0; i--) if(active[i].orcLate) active.splice(i, 1);
  active.forEach(u=>{ u.surprised = b.def.orcGang==="ambush" && !!u.pantsDown; });
}
// 新一輪開始（nextTurn 呼叫）：躲著的趕過來
function orcLateJoin(){
  const b = B(); if(!b?.def.orcGang || b.phase!=="combat") return;
  const late = b.units.filter(u=>u.side==="foe" && u.orcLate && b.round>=u.orcLate && !u.combatActive && !u.dead && !u.fled);
  if(!late.length) return;
  late.forEach(u=>{ u.combatActive = true; u.surprised = false; u.orcLate = 0; u.init = d20() + u.mods.DEX + Math.random()*.1; });
  const cap = late.find(u=>u.type==="orc_captain") || late[0];
  blog(ORC_GANG.lateLog.replace("{name}", cap.name), "kill"); sfx("alert");
  b.units.sort((a,c)=>c.init-a.init);
}
// 回合開始（nextTurn 呼叫，奇襲那回合之後）：褲子沒穿好＝移動減半；第一次的隊長殘血＝逃走。回傳 true＝這回合交給這裡處理
function orcTurnStart(u){
  const b = B(); if(!b?.def.orcGang) return false;
  if(u.pantsDown){ u.pantsDown = false; b.moveLeft = Math.floor(b.moveLeft/2); blog(ORC_GANG.pantsLog.replace("{name}", u.name), "skill"); }
  if(u.type==="orc_captain" && !u.grudge && !u.fled && u.hp>0 && u.hp <= u.maxHp*ORC_GANG.fleeAt && ensureOrc().stage!=="fled"){
    b.busy = true; say(u, ORC_GANG.flee.say); refreshBattle();
    later(()=>{
      u.fled = true; b.orcFled = true; fxHit(u, "spark"); sfx("alert");
      blog(ORC_GANG.flee.log.replace("{name}", u.name), "kill");
      ORC_GANG.flee.lines.forEach(([id, text], i)=>{ const v = b.units.find(w=>w.id===id && !w.dead && !w.down); if(v) say(v, text, 500 + i*1600); });
      refreshBattle();
      later(()=>{ b.busy = false; if(!checkResult()) nextTurn(); }, 900);
    }, 1400);
    return true;
  }
  return false;
}
// 打完（打贏：grantQuestReward；撤退：retreatBattle）：記結果、算賞金
function orcQuestEnd(b){
  if(!b?.def.orcGang || b.orcEnded) return; b.orcEnded = true;
  const G = ensureOrc(), cap = b.units.find(u=>u.type==="orc_captain"); G.accepted = false; G.note = null;
  if(!cap) return;
  const add = (gold, kind) => { G.claim = {gold:(G.claim?.gold||0) + gold, kind}; };
  if(cap.fled){
    G.stage = "fled";
    state.grudges ||= [];
    const g = {id:`orc${Date.now().toString(36)}`, type:"orc_captain", look:ENEMIES.orc_captain.look, link:null, kind:"return", roll:0, scars:[], by:null, returns:0, status:"pending", orc:true};
    state.grudges.push(g); G.grudge = g.id;
    add(b.units.filter(u=>u.side==="foe" && u!==cap && u.dead).length * ORC_GANG.thugGold, "fled");
    b.orcEnd = "fled";
  } else if(cap.dead){
    const g = cap.grudge && grudgeById(cap.grudge); if(g) g.status = "done";
    G.stage = "done";
    add(Math.round(ORC_GANG.bounty * (cap.ko ? ORC_GANG.captureMul : 1)), cap.ko ? "captured" : "dead");
    b.orcEnd = cap.ko ? "captured" : "dead";
  }
}
const orcEndHTML = () => { const t = B()?.orcEnd; return t ? `<p class="quest-reward owlbear-end">${ORC_GANG.end[t]}</p>` : ""; };
// 回來的隊長：名字只加「老對手／宿敵」（綽號就是獨眼），喊自己那套
function orcGrudgeUnit(u){
  if(u.type!=="orc_captain" || !u.grudge) return;
  const g = grudgeById(u.grudge); if(!g?.orc) return;
  const tail = GRUDGE.nickTail[Math.max(1, g.returns)-1];
  u.name = ENEMIES.orc_captain.name + (tail ? `（${tail}）` : "");
  u.shoutList = ORC_GANG.shout;
}
