/* ======================== 詳情卡：裝備卡、技能卡（裝備店與戰鬥共用） ======================== */

// 技能圖示：類別圖示 + 角標（數字＝要用幾階的熟練格、自＝自動觸發；普攻沒有角標）
function tierOf(def, impl){
  if(impl && impl.passive) return {tag:"自", label:"自動觸發", cls:"t-auto"};
  if(def.tier) return {tag:String(def.tier), label:`用一格${TIER_NAME[def.tier]}以上的熟練格${def.free?"・免費動作":""}`, cls:"t-sig"};
  return {tag:"", label:`不用熟練格・隨時可用${def.free?"・免費動作":""}`, cls:"t-basic"};
}
function skillIcon(groupId, def, impl, size=22){
  const t = tierOf(def, impl);
  return `<span class="skicon ${t.cls}" style="--s:${size}px">${iconSVG(groupId, size-6)}${t.tag?`<i>${t.tag}</i>`:""}</span>`;
}

// 用裝備做一個假角色，算出射程等數字（裝備店裡沒有真正的角色）
function probeUnit(item, real){
  if(real) return real;
  return {side:"pc", weapon:item&&item.type==="weapon"?item:null, focus:item&&item.type==="focus"?item:null,
          shield:item&&item.type==="shield", mods:{STR:0,DEX:0,CON:0,INT:0,WIS:0,CHA:0}, statuses:[]};
}
const TARGET_TEXT = {enemy:"單一敵人", ally:"單一隊友", self:"自己（或自己周圍）", area:"指定一塊範圍", cone:"前方錐形", line:"一整條直線", shadow:"瞬移到敵人身旁"};
function skillStatText(group, item){
  if(item && item.type==="focus") return ABILITIES.find(a=>a.k===item.stat).n;
  if(group.id==="unarmed") return "力量";
  if(group.id==="shield") return "—";
  if(!item) return group.stat;
  if(item.props.some(p=>p.startsWith("彈藥"))) return "敏捷";
  if(item.props.includes("靈巧")) return "力量或敏捷（取高）";
  return "力量";
}

// ---------- 裝備卡 ----------
function itemCardHTML(it){
  const rows = [];
  if(it.type==="weapon"){
    rows.push(["傷害", it.dmg.split(" ")[0] + " 物理"]);   // 揮砍、穿刺、鈍擊都算物理
    it.props.forEach(p=>{ const k=p.split(" ")[0]; rows.push([p, PROP_TEXT[k]||""]); });
    const m = it.mastery.split(" ")[0];
    rows.push([`專精：${it.mastery}`, MASTERY_TEXT[m]||""]);
  } else if(it.type==="armor"){
    rows.push(["護甲等級", `AC ${it.ac}${it.dex==="full"?" + 敏捷調整值":it.dex==="max2"?" + 敏捷調整值（最多 +2）":"（不加敏捷）"}`]);
    rows.push(["分類", it.tier]);
    if(it.cloth) rows.push(["衣服", "不算穿護甲：法師護甲照樣可以用。"]);
    if(it.str) rows.push(["力量需求", `力量 ${it.str} 以上才能穿`]);
    if(it.stealth) rows.push(["潛行劣勢", TERM_TEXT["潛行劣勢"]]);
    rows.push(["技能", "護甲不給主動技能，只提高 AC。"]);
  } else if(it.type==="shield"){
    rows.push(["護甲等級", "AC +2"]);
  } else if(it.type==="focus"){
    rows.push(["施法屬性", ABILITIES.find(a=>a.k===it.stat).n]);
    rows.push(["說明", "拿著法器就能施放它附帶的法術；招式仍依小筆記與施展條件。"]);
  } else if(it.type==="consumable"){
    rows.push(["效果", it.desc]);
    rows.push(["使用", `戰鬥中從「道具」選單使用，${it.use&&it.use.action?"用掉動作":"用掉免費動作（每回合一次）"}。用完就沒了。${it.use&&it.use.kind==="eat"?"":"丟給貼身的隊友＝交給他。"}`]);
  } else {
    rows.push(["說明", it.desc || "冒險用品，目前沒有戰鬥效果。"]);   // 套組、彈袋、箭袋等有寫 desc 的照寫（10-03）
  }
  rows.push(["價格／重量", `${money(it.cost)}／${it.wt} 磅`]);
  const g = groupOf(it);
  const on = g ? (it.elementFocus?g.skills.slice(0,1):g.skills).map((s,i)=>({s,i,gid:g.id})) : [];
  if(it.elementFocus)(it.grants||[]).forEach(key=>{const f=SKILL_BY_ID[key];if(f)on.push({s:f.g.skills[f.idx],i:f.idx,gid:f.g.id});});
  const skills = g ? `<h4 class="md-sub">${on.length===1?"給的技能":`給的${["","一","兩","三","四","五"][on.length]||on.length}個技能`}</h4>
    <div class="md-skills">${on.map(({s,i,gid})=>{ const im=(SKILL_IMPL[gid]||[])[i];
      return `<button class="md-sk" data-skinfo="${gid}:${i}:${it.id}">${skillIcon(gid,s,im,34)}<span>${s.name}</span><small>${tierOf(s,im).label.split("・")[0]}</small></button>`; }).join("")}</div>
    <p class="dim md-hint">點技能看詳細說明</p>` : "";
  return `<div class="md-head">${g?iconSVG(g.id,34):""}<div><h3>${it.n}</h3><div class="dim">${it.en}・${it.cat}</div></div></div>
    <dl class="md-rows">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>${skills}`;
}

// ---------- 技能卡 ----------
function skillCardHTML(groupId, idx, item, unit){
  const g = SKILL_GROUPS.find(x=>x.id===groupId), im = (SKILL_IMPL[groupId]||[])[idx];
  let s = g.skills[idx];
  if(idx===0 && HAS_BASIC(g) && g.id!=="shield")        // 基本攻擊名稱看武器；沒指定武器（技能總表）就列出這組可能的名稱
    s = {...s, name: g.id==="arcane_staff" || g.id==="unarmed" ? "打擊" : item && item.type==="weapon" ? basicName(g, item) : basicNames(g)};
  const t = tierOf(s, im);
  const u = probeUnit(item, unit);
  let range = "—";
  if(im && im.range){ const r = im.range(u); range = r<=1 ? "貼身（1 格）" : `${r} 格（${r*5} 呎）`; }
  const rows = [
    ["類型", skillType(g, s)],
    ["使用", t.label],
    ["目標", im && im.passive ? "條件符合時自動觸發" : TARGET_TEXT[im && im.target] || "—"],
    ["距離", im && im.passive ? "—" : range],
    ["屬性", skillStatText(g, item)]
  ];
  if(s.components)rows.push(["聲勢材",componentsText(s.components)]);
  if(s.req) rows.push(["施展條件", reqText(s.req)]);
  if(idx===0 && item && item.type==="weapon"){ const m=item.mastery.split(" ")[0]; rows.push([`專精：${m}`, MASTERY_TEXT[m]||""]); }
  if(s.tier) rows.push(["升階", s.noUp ? "不能升階" : s.up || "每高一階，命中時多 1 顆武器骰。"]);
  if(s.srd) rows.push(["出處", "SRD 5.2"]);
  return `<div class="md-head">${skillIcon(groupId,s,im,44)}<div><h3>${s.name}</h3></div></div>
    <p class="md-effect">${s.text}</p>
    ${unit && unit.slots && s.tier ? `<p class="md-cd">${unit.name}還有熟練格：${slotsText(unit)}</p>` : ""}
    <dl class="md-rows">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
    ${item && state.modal && state.modal.back ? `<button class="btn small ghost" data-iteminfo="${item.id}">← 回到${item.n}</button>` : ""}`;
}

// ---------- 彈出視窗 ----------
function pageHelpHTML(key){
  return `<button class="page-help" data-pagehelp="${key}" aria-label="${PAGE_UI.helpPages[key].title}">ⓘ ${PAGE_UI.help}</button>`;
}
function closeDetailModal(){
  const m=state.modal;
  state.modal=null;
  if(m?.kind==="character") state.info=null;
  refreshGameUI();
  if(m?.kind==="character") document.querySelector(`[data-info="${m.id}"]`)?.focus({preventScroll:true});
  if(m?.kind==="help") document.querySelector(`[data-pagehelp="${m.id}"]`)?.focus({preventScroll:true});
}
function renderModal(){
  const m = state.modal; if(!m) return "";
  let body = "";
  if(m.kind==="item") body = itemCardHTML(itemById(m.id));
  if(m.kind==="help"){
    const h=PAGE_UI.helpPages[m.id];
    body=`<h3 class="page-bubble-title">${h.title}</h3><p class="page-bubble-text">${h.text}</p>`;
  }
  if(m.kind==="character"){
    const c=CRITTERS.find(x=>x.id===m.id);
    body=`<div class="info" style="--c:${c.color}"><div class="info-top">${critterHead(c.id)}<div><h4>${c.name}</h4><div class="cls">${c.kind}</div><div class="tags">${c.tags.map(t=>`<span>${t}</span>`).join("")}</div></div></div><p>${c.intro}</p></div>`;
  }
  if(m.kind==="skill"){
    const unit = m.unit ? (state.battle||state.townRest)?.units.find(v=>v.id===m.unit) : null;
    body = skillCardHTML(m.group, m.idx, m.item ? itemById(m.item) : null, unit);
  }
  return `<div class="modal-back" data-close="1"><div class="modal ${["help","character"].includes(m.kind)?"page-bubble":""}" role="dialog" aria-modal="true">
    <button class="md-x" data-close="1" aria-label="關閉">✕</button>${body}</div></div>`;
}
const modalEvents=new WeakMap();
function modalListen(el,type,fn){
  let types=modalEvents.get(el);if(!types){types=new Set();modalEvents.set(el,types);}
  if(types.has(type))return;types.add(type);el.addEventListener(type,fn);
}
function refreshGameUI(){ if(state.page==="battle" && B())refreshBattle();else render(); }
function bindModal(){
  document.querySelectorAll("[data-close]").forEach(el=>modalListen(el,"click", e=>{ if(e.target===el) closeDetailModal(); }));
  document.querySelectorAll("[data-pagehelp]").forEach(el=>modalListen(el,"click",()=>{state.modal={kind:"help",id:el.dataset.pagehelp};refreshGameUI();}));
  document.querySelectorAll("[data-iteminfo]").forEach(el=>modalListen(el,"click", e=>{ if(!el.dataset.iteminfo)return; e.stopPropagation(); state.modal={kind:"item", id:el.dataset.iteminfo}; refreshGameUI(); }));
  document.querySelectorAll("[data-skinfo]").forEach(el=>modalListen(el,"click", e=>{
    e.stopPropagation();
    const [group, idx, item, unit] = el.dataset.skinfo.split(":");
    state.modal = {kind:"skill", group, idx:+idx, item:item||null, unit:unit||null, back: state.modal && state.modal.kind==="item"};
    refreshGameUI();
  }));
}
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && state.modal) closeDetailModal(); });

// 全域返回／取消：滑鼠右鍵一律當作遊戲的「返回」鍵，不開瀏覽器選單。
// 只撤銷尚未確定的 UI／選擇；已經結算的攻擊、移動途中事件等不倒帶。
function gameBack(){
  if(state.modal){
    // 技能詳情若是從物品詳情進來，先回物品；否則關閉詳情。
    if(state.modal.kind==="skill" && state.modal.back && state.modal.item){
      state.modal={kind:"item",id:state.modal.item};
    }else {closeDetailModal();sfx("back");return true;}
    sfx("back"); refreshGameUI(); return true;
  }
  if(state.page==="battle"){
    const b=B(); if(!b || b.busy) return false;
    if(b.sysPop){ b.sysPop=null; sfx("back"); refreshGameUI(); return true; }
    if(b.gearBagOpen){ b.gearBagOpen=false; sfx("back"); refreshGameUI(); return true; }
    if(b.info){ b.info=null; sfx("back"); refreshGameUI(); return true; }
    if(b.pendingMove){ sfx("back"); confirmMove(false); return true; }
    if(b.mode){ aimCancel(); return true; }
    if(b.moveMode){ b.moveMode=false; b.menu="move"; sfx("back"); refreshGameUI(); return true; }
    if(b.menu && b.menu!=="root"){
      b.menu=["skills","shove"].includes(b.menu)?"act":"root";
      sfx("back"); refreshGameUI(); return true;
    }
    return false;
  }
  // 劇情角色小卡先收起，不直接跳頁。
  if(state.info){ state.info=null; sfx("back"); refreshGameUI(); return true; }
  // 其他頁面沿用畫面上既有的返回按鈕，避免另外維護第二套路徑。
  const back=document.querySelector("#backShop,#backStory,#back2,#back");
  if(back){ sfx("back"); back.click(); return true; }
  return false;
}
document.addEventListener("contextmenu", e=>{
  e.preventDefault();
  gameBack();
});
