function shopCategories(){return state.shopContext==="smith"?CATS.filter(k=>!["法器","道具","冒險用品"].includes(k)):state.shopContext==="items"?[...CATS.filter(k=>["法器","道具","冒險用品"].includes(k)),MAGIC_SHOP_UI.cat]:CATS;}
function renderShop(){
  const venue=TOWN_PLACES.find(p=>p.id===state.shopContext);
  const c = CRITTERS[state.shopActive];
  const id = c.id;
  const tabs = CRITTERS.map((x,i)=>`
    <button class="tab" role="tab" aria-selected="${i===state.shopActive}" data-stab="${i}">
      ${critterHead(x.id)}<span>${x.name}</span><span class="done">${money(state.gold[x.id])}</span>
    </button>`).join("");
  const cats = shopCategories().map(k=>`<button class="chip ${k===state.shopCat?"on":""}" data-cat="${k}" aria-pressed="${k===state.shopCat}">${k}</button>`).join("");
  const rows = state.shopContext==="items" && state.shopCat===MAGIC_SHOP_UI.cat ? sealedGoodsHTML()+magicStockHTML() : ITEMS.filter(i=>i.cat===state.shopCat && !i.noShop).map(shopItem).map(it=>{
    const why = blockReason(id,it);
    let spec="";
    if(it.type==="weapon") spec = `${it.dmg}${it.props.length?" · "+it.props.join("、"):""} · 專精：${it.mastery}`;
    else if(it.type==="armor") spec = `${it.tier} · AC ${it.ac}${it.dex==="full"?" + 敏捷":it.dex==="max2"?" + 敏捷（最多 2）":""}${it.str?` · 力量 ${it.str}`:""}${it.cloth?" · 不算護甲（法師護甲照開）":""}${it.stealth?" · 潛行劣勢":""}`;
    else if(it.type==="shield") spec = "AC +2";
    else if(it.type==="consumable") spec = `${it.desc} · 戰鬥中用掉免費動作`;
    else if(it.type==="focus") spec = `${ABILITIES.find(a=>a.k===it.stat).n} 13 以上 · ${it.spells}`;
    return `<div class="item ${why?"blocked":""}">
      <div class="it-main"><button class="it-name" data-iteminfo="${it.id}" title="看詳細介紹">${it.n}<span class="it-i">ⓘ</span></button> <small>${it.en}</small><div class="it-spec">${rulesHTML(spec)}</div></div>
      <div class="it-side"><span class="it-cost">${money(it.cost)}</span><span class="it-wt">${it.wt} lb</span></div>
      <button class="btn small" data-buy="${it.id}" ${why?"disabled":""}>買</button>
      ${why?`<div class="it-why">${why}</div>`:""}
    </div>`;
  }).join("");
  const bag = invItems(id).map((it,idx)=>`<li><button class="it-name" data-iteminfo="${it.id}">${it.n}</button>${it.noRefund?'<small>不可退換</small>':`<button class="btn small ghost" data-sell="${idx}">退</button>`}</li>`).join("")
            || `<li class="empty">還沒買東西</li>`;
  const wt = weightOf(id), cap = capOf(id);
  return `<section class="page shop-page" data-shop-category="${state.shopCat}">
    <div class="head"><div>
      <h2>${venue?venue.name:"大爺的裝備牆"}</h2>
    </div>${pageHelpHTML("shop")}</div>
    <div class="quip">${venue?"":`<div class="quip-face">${portraitHTML("dwarf")}</div>`}<p>${state.quip}</p></div>
    <div class="tabs" role="tablist" aria-label="${SHOP_UI.characters}">${tabs}</div>
    <details class="shop-side" ${state.shopBagOpen?"open":""}>
      <summary>
        <span class="shop-stat"><span>剩餘</span><b>${money(state.gold[id])}</b></span>
        <span class="shop-stat"><span>AC</span><b>${acOf(id)}</b></span>
        <span class="shop-stat"><span>負重</span><b>${+wt.toFixed(2)} / ${cap} lb</b></span>
        <span class="shop-bag-label">${SHOP_UI.gear}<span class="shop-bag-arrow">▾</span></span>
      </summary>
      <div class="shop-gear">
        <div class="mini-stats">力量 ${scoreK(id,"STR")} · 敏捷 ${scoreK(id,"DEX")}</div>
        <div class="bar"><i style="width:${Math.min(100,wt/cap*100)}%"></i></div>
        <ul class="bag">${bag}</ul>
      </div>
    </details>
    <div class="chips" aria-label="${SHOP_UI.categories}">${cats}</div>
    <div class="shop-list" role="region" aria-label="${state.shopCat} ${SHOP_UI.products}" tabindex="0">
      <div class="items">${rows}</div>
    </div>
    <div class="nav">
      ${venue?`<button class="btn ghost" id="leaveTownShop">回到${venue.name}</button>`:`<button class="btn ghost" id="backStory">回到酒館</button><button class="btn" id="depart">出發！</button>`}
    </div>
  </section>`;
}

// 買賣、詳細卡、切角色都會重新 render；從舊頁面記住位置，不讀已改過的 shopCat。
function rememberShopView(app){
  const page=app.querySelector('.shop-page');
  if(!page) return;
  state.shopScroll[page.dataset.shopCategory]=page.querySelector('.shop-list').scrollTop;
  state.shopBagOpen=page.querySelector('.shop-side').open;
}
function selectShopCategory(cat){
  if(cat===state.shopCat || !shopCategories().includes(cat)) return;
  state.shopCat=cat; render();
}
function bindShop(){
  const list=document.querySelector('.shop-list');
  if(!list) return;
  list.scrollTop=state.shopScroll[state.shopCat]||0;
  document.querySelector('.shop-side').addEventListener('toggle',e=>{state.shopBagOpen=e.currentTarget.open;});
  document.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>selectShopCategory(b.dataset.cat)));

  // 垂直交給原生捲動；水平手勢切分類。滑動到買／介紹按鈕不應觸發 click。
  let gesture=null, suppressClickUntil=0;
  list.addEventListener('pointerdown',e=>{
    if(!e.isPrimary || e.button!==0) return;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0,axis:null};
  });
  list.addEventListener('pointermove',e=>{
    if(!gesture || gesture.id!==e.pointerId) return;
    gesture.dx=e.clientX-gesture.x; gesture.dy=e.clientY-gesture.y;
    if(!gesture.axis && Math.max(Math.abs(gesture.dx),Math.abs(gesture.dy))>12){
      gesture.axis=Math.abs(gesture.dx)>Math.abs(gesture.dy)*1.3?'x':'y';
      if(gesture.axis==='x') list.setPointerCapture(e.pointerId);
    }
  });
  list.addEventListener('pointerup',e=>{
    if(!gesture || gesture.id!==e.pointerId) return;
    const g=gesture; gesture=null;
    if(g.axis) suppressClickUntil=performance.now()+500;
    if(g.axis==='x' && Math.abs(g.dx)>=48){
      const cats=shopCategories(),i=cats.indexOf(state.shopCat)+(g.dx<0?1:-1);
      if(cats[i]) selectShopCategory(cats[i]); // 首尾不循環
    }
  });
  list.addEventListener('pointercancel',()=>{gesture=null;suppressClickUntil=performance.now()+500;});
  list.addEventListener('click',e=>{
    if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}
  },true);
}
