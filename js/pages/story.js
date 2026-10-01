/* 劇情場景：每個場景一份台詞；bg 是第一人稱背景；結尾按鈕依場景不同（back 為 null 就不顯示） */
const SCENES = {
  prologue: {script: SCRIPT,   bg:"tavern", back:["back2","回去重骰"],    next:["toShop","去看裝備"]},
  farewell: {script: FAREWELL, bg:"tavern", back:["backShop","回裝備"], next:["toMap","出門！"]},
  ambush:   {get script(){ return ambushScript(); }, bg:"road", back:null, next:["toBattle","戰鬥開始！"]}
};
function updateStoryLine(){
  const scene = SCENES[state.scene], line = scene.script[state.line], who = WHO(line.who);
  const last = state.line === scene.script.length-1, stage = document.getElementById("stage");
  if(!stage) return render();
  stage.classList.toggle("hugging", !!line.hug);
  stage.querySelector(".scene-bg")?.classList.toggle("bush-shake", !!line.shake);
  stage.querySelector(".dwarf")?.classList.toggle("talk", line.who==="dwarf");
  const dialog = stage.querySelector(".dialog");
  if(dialog){
    dialog.classList.toggle("narr", line.who==="narr");
    dialog.innerHTML = `${who.name?`<div class="speaker" style="--c:${who.color}">${who.name}</div>`:""}<p>${line.text}</p><span class="hint">${last?"":"▼ 點一下繼續"}</span>`;
  }
  const party = document.querySelector(".fp-page .party");
  party?.classList.toggle("cheer", !!line.hug);
  party?.querySelectorAll("[data-info]").forEach(el=>el.classList.toggle("speaking", el.dataset.info===line.who));
  const glow = stage.querySelector(".hug-glow");
  if(line.hug && !glow) stage.querySelector(".counter")?.insertAdjacentHTML("beforebegin", '<div class="hug-glow" aria-hidden="true"></div>');
  else if(!line.hug && glow) glow.remove();
  const progress = document.querySelector(".fp-page .progress");
  if(progress) progress.textContent = `${state.line+1} / ${scene.script.length}`;
  const next = document.getElementById(scene.next[0]);
  if(next){ next.disabled = !last; next.textContent = last ? scene.next[1] : "劇情進行中"; }
}

function renderStory(){
  const scene = SCENES[state.scene];
  const SCRIPT_ = scene.script;
  const line = SCRIPT_[state.line];
  const who = WHO(line.who);
  const last = state.line === SCRIPT_.length-1;

  const party = CRITTERS.map(c=>{
    const r = state.rolls[c.id];
    const minis = ABILITIES.map(a=>{
      const m = modOf(finalScore(c.id,a.k));
      return `<span class="${m>=2?"hi":m<0?"lo":""}">${a.n[0]}${fmt(m)}</span>`;
    }).join("");
    return `<button class="pf ${line.who===c.id?"speaking":""} ${state.info===c.id?"open":""}" data-info="${c.id}" style="--c:${c.color}" aria-label="查看${c.name}">
      ${critterSVG(c.id)}
      <span class="pf-name">${c.name}</span>
      <span class="pf-mods">${minis}</span>
    </button>`;
  }).join("");

  let info = "";
  if(state.info){
    const c = CRITTERS.find(x=>x.id===state.info);
    info = `<div class="info" style="--c:${c.color}">
      <div class="info-top">${critterSVG(c.id)}<div><h4>${c.name}</h4><div class="cls">${c.kind}</div>
      <div class="tags">${c.tags.map(t=>`<span>${t}</span>`).join("")}</div></div></div>
      <p>${c.intro}</p>
    </div>`;
  }

  return `<section class="page fp-page">
    <div class="stage ${line.hug?"hugging":""}" id="stage" role="button" tabindex="0" aria-label="下一句">
      ${scene.bg==="road" ? `<div class="scene-bg${line.shake?" bush-shake":""}">${roadAmbushSVG()}</div>` : `
      <div class="wall"></div>
      <div class="lamp" aria-hidden="true"></div>
      <div class="dwarf ${line.who==="dwarf"?"talk":""}">${DWARF_SVG}</div>
      ${line.hug?`<div class="hug-glow" aria-hidden="true"></div>`:""}
      <div class="counter" aria-hidden="true"></div>`}
      <div class="dialog ${line.who==="narr"?"narr":""}">
        ${who.name?`<div class="speaker" style="--c:${who.color}">${who.name}</div>`:""}
        <p>${line.text}</p>
        <span class="hint">${last?"":"▼ 點一下繼續"}</span>
      </div>
    </div>
    <div class="party ${line.hug?"cheer":""}" aria-label="隊伍">${party}</div>
    ${info}
    <div class="nav">
      ${scene.back ? `<button class="btn ghost" id="${scene.back[0]}">${scene.back[1]}</button>` : `<span></span>`}
      <span class="progress">${state.line+1} / ${SCRIPT_.length}</span>
      <button class="btn" id="${scene.next[0]}" ${last?"":"disabled"}>${last?scene.next[1]:"劇情進行中"}</button>
    </div>
  </section>`;
}
