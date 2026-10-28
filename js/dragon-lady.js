/* 紅龍夫人・怪獸家長（大爺 10-28）：文字、數字在 data/dragon-lady.js
   state.main.dragon：(沒有) → done；state.dragonLady＝{pick, roll, gift}（劇情進行中暫存）
   - 幼龍不會死：hurt() 打到 0 血呼叫 wyrmRepel（engine.js）
   - 城鎮街上：洞窟回報完（caveStage()==="done"）才出現紅 ❗（dragonStreetHTML）
   - 劇情 dragonLady：選項 dragonPick → 道歉／講道理（魅力檢定，可用好運重擲）／頂嘴 → finishDragonLady 結算 */
const dragonDue = () => !!(state.townFounded && caveStage()==="done" && !(state.main ||= {}).dragon);
const ensureDragon = () => (state.dragonLady ||= {});
const dragonRoller = () => CRITTERS.reduce((best, c)=>modOf(finalScore(c.id,"CHA")) > modOf(finalScore(best.id,"CHA")) ? c : best, CRITTERS[0]);

// ---------- 幼龍：哭著飛走 ----------
function wyrmRepel(t, at){
  t.dead = true; t.repelled = true; t.deadAt = impactAt();
  blog(DRAGON_LADY.wyrmLog.replace("{name}", t.name), "kill"); sfx("poof", at + 300); fxHit(t, "spark");
  say(t, DRAGON_LADY.wyrmSay, 200);
}

// ---------- 洞窟第一次打完：原形立繪哭著飛走 ----------
const wyrmFleeScript = () => DRAGON_LADY.flee.map(l=>({draft:DRAGON_LADY.draft, ...l}));
function finishWyrmFlee(){ state.page = "map"; state.mapSel = state.location = "cave"; render(); window.scrollTo(0,0); }

// ---------- 城鎮街上 ----------
function dragonStreetHTML(){
  if(!dragonDue()) return "";
  const S = DRAGON_LADY.street;
  return `<button class="town-building town-event-bubble dragon-bubble" data-dragon-lady="1" style="left:${S.x}%;top:${S.y}%" aria-label="${S.place}／${S.who}"><b>${S.place}</b><span>${S.who}</span><span class="town-event-symbol">${obsBubbleHTML("main")}</span></button>`;
}
function bindDragonStreet(){ document.querySelector("[data-dragon-lady]")?.addEventListener("click", startDragonLady); }
function startDragonLady(){
  if(!dragonDue()) return;
  state.dragonLady = {};
  state.page = "story"; state.scene = "dragonLady"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}

// ---------- 劇情 ----------
// 女兒現身之後（有 withFace 的那句起），媽媽在畫面上時女兒都站在旁邊（with）
const dragonLines = list => { let shown = false; return list.map(l=>{ if(l.withFace) shown = true;
  const keep = shown && ["dragon_lady","red_dragon_lady"].includes(l.on);
  return {draft:DRAGON_LADY.draft, ...l, ...(keep ? {with:"wyrmling", withFace:l.withFace || "pout"} : {})}; }); };
function dragonScript(){
  const D = DRAGON_LADY, e = ensureDragon();
  const L = [...D.intro, ...(state.crossline?.preached ? D.preached : []), {...D.ask, dragonChoice:true}];
  if(e.pick==="sorry") L.push(...D.sorry);
  if(e.pick==="reason"){
    L.push({who:e.roll.id, text:D.rollLine, dragonRoll:true, mood:"normal", on:"dragon_lady", face:"skeptical"});
    L.push(...(e.roll.ok ? D.reasonOk.map(l=>({...l, text:l.text.replace("{who}", CRITTERS.find(c=>c.id===e.roll.id).name).replace("{item}", e.gift?.n || "")})) : D.reasonFail));
  }
  if(e.pick==="talkback") L.push(...D.talkback);
  return dragonLines(L);
}
const dragonChoicePending = line => !!(line && line.dragonChoice && !ensureDragon().pick);
function dragonChoiceHTML(){
  const P = DRAGON_LADY.pick, r = dragonRoller();
  return `<div class="choice-list">${["sorry","reason","talkback"].map(k=>`<button class="choice" data-dragon-pick="${k}"><b>${P[k].label}</b><small>${P[k].sub.replace("{dc}", DRAGON_LADY.dc).replace("{who}", r.name)}</small></button>`).join("")}</div>`;
}
function dragonRollHTML(){
  const a = ensureDragon().roll; if(!a) return "";
  return `<div class="check-row">魅力檢定 ${diceFormulaHTML({dice:dieFace(20,a.roll,0,DICE_TUMBLE,a.flick,false),base:a.roll,total:a.total,result:a.ok?"hit":"miss",land:DICE_TUMBLE})}<span class="check-vs">${a.ok?"≥":"<"} ${DRAGON_LADY.dc}　${a.ok?"成功！":"失敗"}</span></div>`;
}
async function dragonPick(k){
  const e = ensureDragon(); if(e.pick || e.asking || state.page!=="story" || state.scene!=="dragonLady") return;
  if(!["sorry","reason","talkback"].includes(k)) return;
  const from = SCENES.dragonLady.script.length;
  if(k==="reason"){
    const c = dragonRoller(), mod = modOf(finalScore(c.id,"CHA"));
    let roll = d20(), total = roll + mod, ok = total >= DRAGON_LADY.dc;
    if(!ok){ e.asking = true; if(await luckReroll(c.id, `魅力檢定 ${roll}${fmtN(mod)}＝${total}，沒到 DC ${DRAGON_LADY.dc}`)){ roll = d20(); total = roll + mod; ok = total >= DRAGON_LADY.dc; } e.asking = false; }
    e.roll = {id:c.id, roll, mod, total, ok, flick:[0,1,2].map(()=>d20())};
    if(ok){ const pool = MAGIC_GOODS.filter(g=>g.rarity==="blue"||g.rarity==="yellow"), g = pool[Math.floor(Math.random()*pool.length)];
      if(g) e.gift = {key:g.key, n:g.n, to:c.id}; }
    sfx(ok ? "win" : "miss");
  } else sfx(k==="talkback" ? "alert" : "pop");
  e.pick = k;
  state.line = Math.min(from, SCENES.dragonLady.script.length - 1); render();
}
// 演完：發獎勵、記結果（只發一次）
function finishDragonLady(){
  const e = ensureDragon(); if(!e.pick || !dragonDue()) return;
  (state.main ||= {}).dragon = "done"; state.main.dragonResult = e.pick==="reason" ? (e.roll?.ok ? "reasonOk" : "reasonFail") : e.pick;
  if(e.pick==="sorry") grantPartyGold(DRAGON_LADY.gold);
  if(e.pick==="reason" && e.roll?.ok && e.gift){ const g = MAGIC_GOODS.find(x=>x.key===e.gift.key); if(g){ const it = makeMagicItem(g, `dragon-lady-${Date.now()}`); (state.inv[e.gift.to] ||= []).push(it.id); saveMarket(); } }
  if(e.pick==="talkback") changeStressAll(v=>v + DRAGON_LADY.stress);
  state.dragonLady = null; state.page = "town"; state.townPlace = null; render(); window.scrollTo(0,0);
}
