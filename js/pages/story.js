/* 劇情場景：每個場景一份台詞；bg 是第一人稱背景；結尾按鈕依場景不同（back 為 null 就不顯示） */
const SCENES = {
  worldChest:{get script(){return worldChestScript();},bg:'road',back:null,get next(){return state.worldChest?.status==='mimic'?['startWorldMimic','戰鬥開始！']:['resumeWorldTravel','繼續上路'];}},
  prologue: {script: SCRIPT,   bg:"tavern", back:["back2","回去重骰"],    next:["toShop","去看裝備"]},
  farewell: {script: FAREWELL, bg:"tavern", back:["backShop","回裝備"], next:["toMap","出門！"]},
  tavernReturn: {script: TAVERN_RETURN, bg:"tavern", actors:["dwarf"], back:null, next:["toTavern","進酒館"]},
  tavernRest: {script: TAVERN_REST, bg:"town", back:null, next:["finishTavernRest","隔天早上"]},   // 酒館睡覺：旅店 CG＋在家的台詞（10-11）   // 過夜後回酒館（10-11）
  ambush:   {get script(){ return ambushScript(); }, bg:"road", back:null, next:["toBattle","戰鬥開始！"]},
  caravan:  {get script(){ return caravanScript(); }, bg:"road", actors:["merchant"], back:null, next:["toRoad","繼續上路"]},
  townSupplier: {script:TOWN_SUPPLIER,bg:"town",actors:["merchant"],back:null,next:["finishSupplier","回到街上"]},
  townArrival: {get script(){return townArrivalScript();}, bg:"town", actors:["merchant"], back:null, next:["finishTownArrival","進城逛逛"]},
  camp: {get script(){return campScript();}, bg:"road", back:null, next:["finishCamp","收拾營地"]},   // 野外露營長休（10-10）
  innRest: {script:INN_REST, bg:"town", back:null, next:["finishInnRest","隔天早上"]}   // 旅店長休 CG＋交換心得（10-10）
};
/* ---------- 商隊戰後（大爺 10-03，資料在 data/story.js 的 CARAVAN_*） ---------- */
const STAT_NAME = k => ABILITIES.find(a=>a.k===k).n;
function townArrivalScript(){
  const c=state.caravan||{}, exposed=c.ok && ["fox","tiger","wolf"].includes(c.pick);
  return [...TOWN_GOODBYE[exposed?"exposed":"hurry"], ...TOWN_FOUNDING,
    ...((c.pick==="raccoon" && c.ok)?TOWN_BAG_CHAT:[]), ...TOWN_WHERE_NEXT];
}
function caravanScript(){
  const c = state.caravan || {};
  if(!c.pick) return CARAVAN_INTRO;                // 還沒選：停在選項那句
  const p = CARAVAN_PICKS.find(x=>x.id===c.pick), who = CRITTERS.find(x=>x.id===c.pick);
  return [...CARAVAN_INTRO, {who:c.pick, text:p.say, roll:true}, ...CARAVAN_RESULT[c.pick][c.ok?"win":"lose"], ...CARAVAN_OUTRO];
}
// 選好誰出面：擲 d20＋那一項的調整值，發報酬（只發一次），接著往下演
async function caravanPick(id, roll=d20()){   // roll：測試可以指定
  const c = state.caravan = state.caravan || {};
  if(c.pick || c.asking) return;
  const p = CARAVAN_PICKS.find(x=>x.id===id); if(!p) return;
  const mod = modOf(finalScore(id, p.stat)); let total = roll + mod, ok = total >= CARAVAN_DC;
  if(!ok){ c.asking = true; if(await luckReroll(id, `檢定 ${roll}${fmtN(mod)}＝${total}，沒到 DC ${CARAVAN_DC}`)){ roll = d20(); total = roll + mod; ok = total >= CARAVAN_DC; } c.asking = false; }
  Object.assign(c, {pick:id, stat:p.stat, roll, mod, total, ok, flick:[0,1,2].map(()=>1+Math.floor(Math.random()*20))});
  const r = CARAVAN_REWARD[id][ok ? "win" : "lose"];
  grantPartyGold(r.gold);
  CRITTERS.forEach(x=>{
    state.inv[x.id] = state.inv[x.id] || [];
    [...((r.items||{}).all||[]), ...((r.items||{})[x.id]||[])].forEach(n=>{ const it = ITEMS.find(i=>i.n===n); if(it) state.inv[x.id].push(makeItem(it).id); });
  });
  // 護送完成的經驗（大爺 10-04：商隊後可手動升到等級 2）：每隻 CARAVAN_XP，不夠升級門檻的補到門檻
  CRITTERS.forEach(x=>gainXP([x.id], Math.max(CARAVAN_XP, XP_NEXT[1] - critterXP(x.id))));
  sfx(ok ? "win" : "miss");
  state.line++; render();
}
// 起始風格（大爺 10-10）：選了就寫進小筆記並帶著；回頭改選會換掉上一個
const styleChoicePending = line => !!(line && line.styleChoice && !(state.starterStyle||{})[line.styleChoice]);
function pickStarterStyle(id, key){
  const st = STARTER_STYLE[id]; if(!st || !st.answers[key]) return;
  state.starterStyle ||= {}; const old = state.starterStyle[id]; state.starterStyle[id] = key;
  let notes = (state.learned[id] || starterNotes(id)).filter(n=>n.key!==old || n.key===key);
  if(!notes.some(n=>n.key===key)) notes = [...notes, {key, name:learnedSkillByKey(key).def.name, from:"起始風格", lv:1}];
  state.learned[id] = notes;
  const carry = (state.activeSkills[id] || notes.slice(0,5).map(n=>n.key)).filter(k=>k!==old);
  state.activeSkills[id] = carry.includes(key) ? carry : [...carry, key];
  sfx("pop"); state.line++; render();
}
function styleChoicesHTML(id){
  const st = STARTER_STYLE[id], c = CRITTERS.find(x=>x.id===id);
  return `<div class="choice-list">${Object.keys(st.answers).map(k=>{ const sk = learnedSkillByKey(k);
    return `<button class="choice" data-style-pick="${k}" data-style-who="${id}" style="--c:${c.color}"><b>${sk.def.name}</b><small>${sk.def.text}</small></button>`; }).join("")}</div>`;
}
// 對話框內容：一般台詞；選項那句換成四個按鈕；檢定那句多一排骰子
function dialogInner(line, who, done){
  let extra = line.worldChestChoice?worldChestChoices():line.chestRoll?worldChestRollHTML(line.chestRoll):"";
  if(styleChoicePending(line)) extra = styleChoicesHTML(line.styleChoice);
  if(line.choice && !(state.caravan||{}).pick)
    extra = `<div class="choice-list">${CARAVAN_PICKS.map(p=>{ const c = CRITTERS.find(x=>x.id===p.id), m = modOf(finalScore(p.id, p.stat));
      return `<button class="choice" data-pick="${p.id}" style="--c:${c.color}"><b>${c.name}</b><span>${p.say}</span><small>${STAT_NAME(p.stat)} ${m>=0?"+":"−"}${Math.abs(m)}・難度 ${CARAVAN_DC}</small></button>`; }).join("")}</div>`;
  if(line.roll){ const c = state.caravan;
    extra = `<div class="check-row">${STAT_NAME(c.stat)}檢定 ${diceFormulaHTML({dice:dieFace(20,c.roll,0,DICE_TUMBLE,c.flick,false),base:c.roll,total:c.total,result:c.ok?"hit":"miss",land:DICE_TUMBLE})}<span class="check-vs">${c.ok?"≥":"<"} ${CARAVAN_DC}　${c.ok?"成功！":"失敗"}</span></div>`; }
  return `${who.name?`<div class="speaker" style="--c:${who.color}">${who.name}</div>`:""}<p>${line.text}</p>${extra}<span class="hint">${done||line.choice||line.worldChestChoice||styleChoicePending(line)?"":"▼ 點一下繼續"}</span>`;
}
const storyWho = line => WHO(line.who);   // 合聲名牌一律「全員」（10-10 大爺，原本送別寫「小傢伙們」）
const markHTML = line => line.mark ? obsBubbleHTML(line.mark) : "";
const critterMark = (id,line) => line.who==="all" ? line.marks?.[id] : line.who===id ? line.critterMark : null;
/* 劇情裡的被動感知演出（大爺 2026-10-01）
   只在察覺台詞（line.shake）時出現，而且 ambushScript 只有至少一隻察覺到才會插入那幾句，所以全失敗時什麼都不顯示（不劇透）
   每隻：骰子停在 10（被動不擲骰）＋感知調整值＝總和；成功跳 ❗、失敗跳 ❓（跟戰鬥同一個泡泡），成功的卡片抖一下
   順序（大爺）：骰子先出來，停 SPOT_SYMBOL_DELAY 毫秒才跳符號、抖卡片，兩個演出才不會疊在一起 */
const SPOT_SYMBOL_DELAY = 1000;
function spotRowHTML(){
  const who = scoutSpotters();
  // 躲的敵人擲的潛行骰也攤開（大爺 10-02：DM 明著骰給你看），放在標題列，下面四格照舊對齊四張卡片
  const sc = state.scout, hit = sc && Object.entries(sc.foes).find(([,x])=>x.spotted.length);
  let title = "被動感知";
  if(hit){
    const [i, x] = hit, foe = ENEMIES[BATTLES[sc.battle].foes[i].type], m = abilityMods(foe).DEX;
    const flick = [0,1,2].map(()=>1 + Math.floor(Math.random()*20));
    title = `${foe.name}潛行 ${diceFormulaHTML({dice:dieFace(20,x.roll,0,DICE_TUMBLE,flick,false),base:x.roll,total:x.hide,result:x.spotted.length?"miss":"hide",land:DICE_TUMBLE})}${x.hide < HIDE_DC ? "（沒躲好）" : ""}　被動感知`;
  }
  return `<div class="spot-row" aria-label="被動感知"><span class="spot-title">${title}</span>${CRITTERS.map(c=>{
    const m = modOf(finalScore(c.id,"WIS")), ok = who.includes(c.id);
    return `<div class="spot-cell">${diceFormulaHTML({dice:dieFace(20,10,0,0,[],false,null,true),base:10,total:10+m,result:ok?"hit":"miss"})}</div>`;
  }).join("")}</div>`;
}
function showSpot(on){
  const stage = document.getElementById("stage"), party = document.querySelector(".fp-page .party");
  if(!stage || !party) return;
  const had = !!stage.querySelector(".spot-row");
  if(on && !had){
    stage.insertAdjacentHTML("beforeend", spotRowHTML());
    const who = scoutSpotters();
    party.querySelectorAll("[data-info]").forEach(el=>{ const ok = who.includes(el.dataset.info);
      el.insertAdjacentHTML("beforeend", obsBubbleHTML(ok ? "ok" : "fail", SPOT_SYMBOL_DELAY));
      if(ok){ el.style.setProperty("--spot-delay", SPOT_SYMBOL_DELAY+"ms"); el.classList.add("spot-hit"); } });
  }
  if(!on && had){
    stage.querySelector(".spot-row").remove();
    party.querySelectorAll(".obs").forEach(e=>e.remove()); party.querySelectorAll(".spot-hit").forEach(e=>e.classList.remove("spot-hit"));
  }
  stage.querySelector(".dialog")?.classList.toggle("with-spot", !!on);
}

/* 酒館舞台上的人（10-03 改新畫風立繪）：台詞的 on 指定誰站在舞台上（預設大爺）；
   face 是站在台上那位這句的表情，沒寫就用預設（PORTRAITS[id].def） */
// 只在自己的台詞（或全體合聲）換表情；由劇本回溯，局部更新與整頁重畫一致。
function critterMood(id, line, index=state.line){
  const script = state.page==="story" && line.who ? SCENES[state.scene]?.script : null;
  const lines = script ? script.slice(0,index+1) : [line];
  let mood = "normal";
  for(const spoken of lines){
    if(spoken.who===id || spoken.who==="all")
      mood = spoken.mood || spoken.moods?.[id] || "normal";
  }
  return mood;
}
const stageActors = () => { const sc = SCENES[state.scene]; return sc.actors || (sc.bg==="tavern" ? ["dwarf", "kam"] : []); };   // 沒寫 actors：酒館＝大爺、卡姆，其他場景沒人
const onStage = (line,index=state.line) => {
  if(state.scene==="prologue" && !SCENES.prologue.script.slice(0,index+1).some(l=>l.who==="dwarf"))return null;
  return line.on || stageActors()[0];
};
const actorFace = (id, line,index=state.line) => onStage(line,index)===id && line.face ? line.face : PORTRAITS[id].def;

function updateStoryLine(){
  const scene = SCENES[state.scene], line = scene.script[state.line], who = storyWho(line);
  const last = state.line === scene.script.length-1, stage = document.getElementById("stage");
  if(!stage) return render();
  if(line.grantStarter)grantStarterGear();
  stage.classList.toggle("hugging", !!line.hug);
  stage.querySelectorAll(".scene-art").forEach(el=>el.classList.toggle("on", el.dataset.art===line.art));
  stage.querySelector(".equipment-wall")?.classList.toggle("on",storyBackground(state.line)==="equipmentWall");
  stage.querySelector(".scene-bg")?.classList.toggle("bush-shake", !!line.shake);
  showSpot(!!line.shake);
  if(state.scene==='worldChest'){const chest=stage.querySelector('.story-chest');if(chest)chest.outerHTML=worldChestStage(line);}
  const mk = stage.querySelector(".story-mark"); if(mk) mk.innerHTML = markHTML(line);
  stageActors().forEach(id=>{ const el = stage.querySelector(".actor."+id); if(!el) return;
    el.classList.toggle("off", onStage(line)!==id); el.classList.toggle("talk", line.who===id);
    setPortraitFace(el, actorFace(id, line)); });
  const dialog = stage.querySelector(".dialog");
  if(dialog){
    dialog.classList.toggle("narr", line.who==="narr");
    dialog.innerHTML = dialogInner(line, who, last);
  }
  const party = document.querySelector(".fp-page .party");
  party?.classList.toggle("cheer", !!line.hug);
  party?.classList.toggle("curse-flash", !!line.curse);
  party?.querySelectorAll("[data-info]").forEach(el=>{ el.classList.toggle("speaking", el.dataset.info===line.who || line.who==="all");
    const img = el.querySelector(".c-head"), src = critterFaceSrc(el.dataset.info, critterMood(el.dataset.info, line));
    if(img && (img.dataset.imageSource||img.getAttribute("src"))!==src) swapPreparedStoryImage(img,src);
    el.querySelectorAll(".story-critter-mark").forEach(x=>x.remove());
    const mark=critterMark(el.dataset.info,line);if(mark)el.insertAdjacentHTML("beforeend",`<span class="story-critter-mark">${obsBubbleHTML(mark)}</span>`); });
  const glow = stage.querySelector(".hug-glow");
  if(line.hug && !glow) stage.querySelector(".counter")?.insertAdjacentHTML("beforebegin", '<div class="hug-glow" aria-hidden="true"></div>');
  else if(!line.hug && glow) glow.remove();
  const progress = document.querySelector(".fp-page .progress");
  if(progress) progress.textContent = `${state.line+1} / ${scene.script.length}`;
  const next = document.getElementById(scene.next[0]);
  const done = last && !line.worldChestChoice && !(line.choice && !(state.caravan||{}).pick) && !styleChoicePending(line);   // 停在選項上不算演完
  if(next){ next.disabled = !done; next.textContent = done ? scene.next[1] : "劇情進行中"; }
  syncBGM();
  prepareStoryImages(state.line+1);
}

function storyPartyHTML(line={}){
  const party = CRITTERS.map(c=>{
    const minis = ABILITIES.map(a=>{
      const m = modOf(finalScore(c.id,a.k));
      return `<span class="${m>=2?"hi":m<0?"lo":""}">${a.n[0]}${fmt(m)}</span>`;
    }).join("");
    const mark=critterMark(c.id,line);
    return `<button class="pf ${line.who===c.id||line.who==="all"?"speaking":""} ${state.info===c.id?"open":""}" data-info="${c.id}" style="--c:${c.color}" aria-label="查看${c.name}">
      ${critterHead(c.id, critterMood(c.id, line))}
      <span class="pf-name">${c.name}</span>
      <span class="pf-mods">${minis}</span>
      ${mark?`<span class="story-critter-mark">${obsBubbleHTML(mark)}</span>`:""}
    </button>`;
  }).join("");
  return `<div class="party ${line.hug?"cheer":""} ${line.curse?"curse-flash":""}" aria-label="隊伍">${party}</div>`;
}

const storyImageLoads=new Map();
const storyDecodedImages=new Map();
function swapPreparedStoryImage(img,src){
 let ready=storyDecodedImages.get(src);
 if(ready?.isConnected&&ready!==img)ready=ready.cloneNode(true);
 if(!ready){delete img.dataset.imageSource;img.src=src;bindPortraitLoading();return;}
 ready.dataset.imageSource=src;
 for(const attr of [...img.attributes])if(attr.name!=="src"&&attr.name!=="data-image-source")ready.setAttribute(attr.name,attr.value);
 ready.onload=null;ready.onerror=null;
 img.replaceWith(ready);
 bindPortraitLoading();
}
function prepareStoryImages(index=state.line){
 const scene=SCENES[state.scene], line=scene.script[index], urls=new Set();
 if(!line)return Promise.resolve([]);
 const add=src=>{if(src)urls.add(src);};
 const actor=onStage(line,index);
 if(PORTRAITS[actor]){const p=PORTRAITS[actor];add(p.base);add(p.sheet);if(p.faces)add(faceSrc(actor,actorFace(actor,line,index)));}
 for(const c of CRITTERS)add(critterFaceSrc(c.id,critterMood(c.id,line,index)));
 add(scene.image);if(line.art)add(STORY_ART[line.art]);
 return Promise.allSettled([...urls].map(src=>{
  if(!storyImageLoads.has(src)){
   const pending=loadEntryImage(src).then(img=>{storyDecodedImages.set(src,img);}).catch(error=>{storyImageLoads.delete(src);throw error;});
   storyImageLoads.set(src,pending);
  }
  return storyImageLoads.get(src);
 }));
}
function storyBackground(index=state.line){return SCENES[state.scene].script.slice(0,index+1).findLast(l=>l.background)?.background;}
function renderStory(){
  prepareStoryImages().then(()=>{if(state.page==="story")prepareStoryImages(state.line+1);});
  const scene = SCENES[state.scene];
  const SCRIPT_ = scene.script;
  const line = SCRIPT_[state.line];
  const who = storyWho(line);
  if(line.grantStarter)grantStarterGear();
  const last = state.line === SCRIPT_.length-1;

  const actorsHTML = stageActors().map(id=>`<div class="actor ${id} ${onStage(line)===id?"":"off"} ${line.who===id?"talk":""}">${portraitHTML(id, actorFace(id, line))}</div>`).join("");
  const done = last && !line.worldChestChoice && !(line.choice && !(state.caravan||{}).pick) && !styleChoicePending(line);
  return `<section class="page fp-page ${state.scene==='townSupplier'?'supplier-story':''}">
    <div class="story-head"><span></span>${pageToolsHTML()}</div>\n    <div class="stage ${line.hug?"hugging":""}" id="stage" role="button" tabindex="0" aria-label="下一句">
      ${["road","town","shopfront"].includes(scene.bg) ? `<div class="scene-bg${line.shake?" bush-shake":""}">${scene.image?`<img draggable="false" fetchpriority="high" decoding="async" src="${scene.image}" alt="哥布林攔截商隊">`:scene.bg==="shopfront"?townShopFrontSVG():scene.bg==="town"?`<img draggable="false" src="${SCENE_ART.town}" alt="城鎮街景">`:`<img draggable="false" src="${SCENE_ART.road}" alt="郊外道路">${state.scene==="ambush"?roadAmbushSVG():state.scene==="worldChest"?worldChestStage(line):''}`}</div>${actorsHTML}` : `
      <div class="wall"></div>
      ${state.scene==='prologue'?`<div class="scene-bg equipment-wall ${storyBackground()==='equipmentWall'?'on':''}"><img draggable="false" src="${SCENE_ART.equipmentWall}" alt="翻轉後的裝備牆"></div>`:''}
      <div class="lamp" aria-hidden="true"></div>
      ${actorsHTML}
      ${line.hug?`<div class="hug-glow" aria-hidden="true"></div>`:""}
      <div class="counter" aria-hidden="true"></div>`}
      ${[...new Set(SCRIPT_.map(l=>l.art).filter(Boolean))].map(k=>`<div class="scene-art ${line.art===k?"on":""}" data-art="${k}" aria-hidden="true"><img src="${STORY_ART[k]}" alt=""></div>`).join("")}
      <div class="story-mark" aria-hidden="true">${markHTML(line)}</div>
      <div class="dialog ${line.who==="narr"?"narr":""}">${dialogInner(line, who, last)}</div>
    </div>
    ${storyPartyHTML(line)}
    <div class="nav">
      ${scene.back ? `<button class="btn ghost" id="${scene.back[0]}">${scene.back[1]}</button>` : `<span></span>`}
      <span class="progress">${state.line+1} / ${SCRIPT_.length}</span>
      <button class="btn" id="${scene.next[0]}" ${done?"":"disabled"}>${done?scene.next[1]:"劇情進行中"}</button>
    </div>
  </section>`;
}
