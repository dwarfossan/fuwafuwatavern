function renderShop(){
  const c = CRITTERS[state.shopActive];
  const id = c.id;
  const tabs = CRITTERS.map((x,i)=>`
    <button class="tab" role="tab" aria-selected="${i===state.shopActive}" data-stab="${i}">
      ${critterSVG(x.id)}<span>${x.name}</span><span class="done">${money(state.gold[x.id])}</span>
    </button>`).join("");
  const cats = CATS.map(k=>`<button class="chip ${k===state.shopCat?"on":""}" data-cat="${k}">${k}</button>`).join("");
  const rows = ITEMS.filter(i=>i.cat===state.shopCat && !i.noShop).map(it=>{
    const why = blockReason(id,it);
    let spec="";
    if(it.type==="weapon") spec = `${it.dmg}${it.props.length?" · "+it.props.join("、"):""} · 專精：${it.mastery}`;
    else if(it.type==="armor") spec = `AC ${it.ac}${it.dex==="full"?" + 敏捷":it.dex==="max2"?" + 敏捷（最多 2）":""}${it.str?` · 力量 ${it.str}`:""}${it.cloth?" · 不算護甲（法師護甲照開）":""}${it.stealth?" · 潛行劣勢":""}`;
    else if(it.type==="shield") spec = "AC +2";
    else if(it.type==="consumable") spec = `${it.desc} · 戰鬥中用掉免費動作`;
    else if(it.type==="focus") spec = `${ABILITIES.find(a=>a.k===it.stat).n}施法 · ${it.spells}`;
    return `<div class="item ${why?"blocked":""}">
      <div class="it-main"><button class="it-name" data-iteminfo="${it.id}" title="看詳細介紹">${it.n}<span class="it-i">ⓘ</span></button> <small>${it.en}</small><div class="it-spec">${spec}</div></div>
      <div class="it-side"><span class="it-cost">${money(it.cost)}</span><span class="it-wt">${it.wt} lb</span></div>
      <button class="btn small" data-buy="${it.id}" ${why?"disabled":""}>買</button>
      ${why?`<div class="it-why">${why}</div>`:""}
    </div>`;
  }).join("");
  const bag = invItems(id).map((it,idx)=>`<li><button class="it-name" data-iteminfo="${it.id}">${it.n}</button><button class="btn small ghost" data-sell="${idx}">退</button></li>`).join("")
            || `<li class="empty">還沒買東西</li>`;
  const wt = weightOf(id), cap = capOf(id);
  return `<section class="page">
    <div class="head"><div>
      <h2>大爺的裝備牆</h2>
      <p class="rule">每隻 100 gp。重甲有力量需求；「重型」武器近戰要力量 13、遠程要敏捷 13；負重上限是力量值 × 15 磅。</p>
    </div></div>
    <div class="quip"><div class="quip-face">${DWARF_SVG}</div><p>${state.quip}</p></div>
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="shop">
      <div class="shop-list">
        <div class="chips">${cats}</div>
        <div class="items">${rows}</div>
      </div>
      <aside class="shop-side">
        <div class="side-top">${critterSVG(id)}<div><h3>${c.name}</h3>
          <div class="mini-stats">力量 ${scoreK(id,"STR")} · 敏捷 ${scoreK(id,"DEX")}</div></div></div>
        <div class="stat-row"><span>剩餘</span><b>${money(state.gold[id])}</b></div>
        <div class="stat-row"><span>護甲等級 AC</span><b>${acOf(id)}</b></div>
        <div class="stat-row"><span>負重</span><b>${+wt.toFixed(2)} / ${cap} lb</b></div>
        <div class="bar"><i style="width:${Math.min(100,wt/cap*100)}%"></i></div>
        <ul class="bag">${bag}</ul>
      </aside>
    </div>
    <div class="nav">
      <button class="btn ghost" id="backStory">回到酒館</button>
      <button class="btn" id="depart">出發！</button>
    </div>
  </section>`;
}
