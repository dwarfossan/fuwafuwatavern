/* ======================== 流程 ======================== */
// 頁面說明：第一次進那頁自動打開一次，看過就不再自動打開（之後點 ⓘ 叫出來）。記在瀏覽器裡，跟音效設定一樣（10-02）
function autoHelpOnce(){
  const page=state.page;
  if(!PAGE_UI.helpPages[page] || state.modal || state.travel) return;
  let seen={}; try{ seen=JSON.parse(localStorage.getItem("fuwa-help-seen")||"{}"); }catch(e){}
  if(seen[page]) return;
  seen[page]=1; try{ localStorage.setItem("fuwa-help-seen", JSON.stringify(seen)); }catch(e){}
  state.modal={kind:"help", id:page};
}
function render(){
  if(typeof closeGameBubble==="function")closeGameBubble();
  const app = document.getElementById("app");
  // 只有換頁（或換劇情場景）時才播淡入動畫，避免每次點擊都閃一下
  const key = state.page + ":" + state.scene;
  const entering = key !== render.last; render.last = key;
  if(state.page==="battle" && B() && app.querySelector("#board-floor") && refreshBattle.battle===B()){
    updateBattleFrame(); return;
  }
  rememberShopView(app);
  autoHelpOnce();
  app.classList.toggle('shop-screen',state.page==='shop');
  app.classList.toggle('battle-screen',state.page==='battle');
  app.classList.toggle('map-screen',state.page==='map');
  app.innerHTML = state.page==="cover" ? renderCover() : state.page==="roll" ? renderRoll() : state.page==="shop" ? renderShop() : state.page==="map" ? renderMap() : state.page==="town" ? renderTown() : state.page==="battle" ? renderBattle() : state.page==="doll" ? renderDollDemo() : renderStory();
  if(state.page==="battle" && B()){ document.getElementById("board-floor").terrainKey=boardTerrainKey(); refreshBattle.battle=B(); refreshBattle.keys=null; }
  app.insertAdjacentHTML("beforeend", renderModal());
  if(entering) app.firstElementChild?.classList.add("enter");
  bind();
  bindModal();
  if(state.page==="battle" && B()) refreshBattle.keys=battleLayerKeys();
}

// 大地圖：棋子沿路走到 stop 的位置停下，跳出驚嘆號，接著切到第一人稱伏擊劇情
function startTravel(){
  const tr = state.travel;
  let last = performance.now();
  const step = now=>{
    if(state.page!=="map" || state.travel!==tr) return;
    tr.t = Math.min(tr.stop, tr.t + (now-last)/4400);  // 整段路約 4.4 秒
    last = now;
    const p = roadPoint(tr.from, tr.to, tr.t);
    document.getElementById("party-marker")?.setAttribute("transform", `translate(${p.x} ${p.y})`);
    if(tr.t < tr.stop){ requestAnimationFrame(step); return; }
    if(tr.arrive){
      state.travel = null; state.location = tr.arrive;
      if(tr.arrive==="town" && !state.townFounded){state.page="story";state.scene="townArrival";state.line=0;state.info=null;}
      render(); return;
    }
    tr.alert = true; render();
    setTimeout(()=>{
      if(state.travel!==tr) return;
      scoutBattle("ambush");
      state.travel = null; state.page = "story"; state.scene = "ambush"; state.line = 0; state.info = null;
      render(); window.scrollTo(0,0);
    }, 1500);
  };
  requestAnimationFrame(step);
}

// 屬性變了，已買的裝備可能不再符合限制：全部退貨重挑
function resetGear(c){
  if(state.inv[c.id] && state.inv[c.id].length){
    state.inv[c.id] = []; state.gold[c.id] = 100*GP;
    state.quip = `${c.name}屬性變了？裝備全退回來，錢拿去重挑！`;
  }
}
// 由格子分配同步出 state.rolls（規則函式都讀 rolls）
function syncRolls(id){
  const r = {};
  ABILITIES.forEach(a=>{ const i = state.slot[id][a.k]; if(i!==null && i!==undefined) r[a.k] = state.sets[id][i]; });
  state.rolls[id] = r;
}
// 擲 6 組 4d6（取高三），再由玩家分配
function rollAll(){
  const c = CRITTERS[state.active];
  state.sets[c.id] = ABILITIES.map(()=>roll4());
  state.slot[c.id] = {};
  state.sel = null;
  syncRolls(c.id);
  resetGear(c);
  // 不演 4d6：玩家只在意最後的數字和怎麼分配（大爺決定），直接跳出 6 個數字籌碼
  state.chipPop = true; render(); state.chipPop = false;   // 只有剛擲出來那一次跳，之後分配重畫不再跳（10-02）
}
// 自動分配：最高的給背景 +2、次高給 +1，其餘依 力量→魅力 的順序由高到低填入
function autoAssign(){
  const c = CRITTERS[state.active];
  const sets = state.sets[c.id];
  const order = Object.keys(c.bg).sort((a,b)=>c.bg[b]-c.bg[a]);
  ABILITIES.forEach(a=>{ if(!order.includes(a.k)) order.push(a.k); });
  const byHigh = sets.map((_,i)=>i).sort((a,b)=>scoreOf(sets[b])-scoreOf(sets[a]));
  state.slot[c.id] = {};
  order.forEach((k,n)=> state.slot[c.id][k] = byHigh[n]);
  state.sel = null;
  syncRolls(c.id);
  resetGear(c);
  render();
}
// 把第 i 組數值移到 dest（屬性代號，或 "tray" 放回籌碼盤）；目標格已有數值就互換
function moveSet(i, dest){
  const c = CRITTERS[state.active];
  const slot = state.slot[c.id];
  const from = ABILITIES.map(a=>a.k).find(k=>slot[k]===i) || null;
  if(dest==="tray"){
    if(from) slot[from] = null;
  } else {
    if(from===dest){ state.sel = null; render(); return; }
    const occupant = slot[dest];
    slot[dest] = i;
    if(from) slot[from] = (occupant===undefined ? null : occupant);
  }
  state.sel = null;
  syncRolls(c.id);
  resetGear(c);
  render();
}
// 籌碼：拖曳（滑鼠與觸控共用 pointer 事件）＋點選
function bindTokens(){
  document.querySelectorAll("[data-chip]").forEach(el=>{
    el.addEventListener("pointerdown", e=>{
      if(e.button!==undefined && e.button!==0) return;
      const i = +el.dataset.chip, sx = e.clientX, sy = e.clientY;
      let ghost = null, over = null;
      const move = ev=>{
        if(!ghost){
          if(Math.hypot(ev.clientX-sx, ev.clientY-sy) < 6) return;
          ghost = el.cloneNode(true); ghost.classList.add("ghost"); ghost.classList.remove("pop","sel");
          document.body.appendChild(ghost); el.classList.add("lifted");
        }
        ghost.style.left = ev.clientX+"px"; ghost.style.top = ev.clientY+"px";
        const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-slot],[data-tray]");
        if(over!==t){ over?.classList.remove("over"); t?.classList.add("over"); over = t; }
        ev.preventDefault();
      };
      const up = ev=>{
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        if(ghost){
          ghost.remove(); el.classList.remove("lifted"); over?.classList.remove("over");
          const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-slot],[data-tray]");
          if(t) moveSet(i, t.dataset.slot || "tray");
        } else {
          // 沒拖動＝點選：再點一次取消
          state.sel = state.sel===i ? null : i; render();
        }
      };
      window.addEventListener("pointermove", move, {passive:false});
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
  });
  // 已選中籌碼時，點格子或籌碼盤放下
  document.querySelectorAll("[data-slot],[data-tray]").forEach(z=>z.addEventListener("click", e=>{
    if(state.sel===null || e.target.closest("[data-chip]")) return;
    moveSet(state.sel, z.dataset.slot || "tray");
  }));
}

function bind(){
  const $ = id => document.getElementById(id);
  $("finishSupplier")?.addEventListener("click",()=>{state.supplierSeen=true;state.page="town";state.townPlace=null;state.townPanel=null;render();window.scrollTo(0,0);});
  $("finishTownArrival")?.addEventListener("click",()=>{state.townFounded=true;state.page="town";state.townPlace=null;render();window.scrollTo(0,0);});
  $("enterTown")?.addEventListener("click",()=>{state.page="town";state.townPlace=null;render();});
  $("leaveTownShop")?.addEventListener("click",leaveTownShop);
  if(state.page==="town")bindTown();
  $("start")?.addEventListener("click", ()=>{state.page="roll";render()});
  $("back")?.addEventListener("click", ()=>{state.page="cover";render()});
  $("back2")?.addEventListener("click", ()=>{state.page="roll";render()});
  $("next")?.addEventListener("click", ()=>{state.page="story";state.scene="prologue";state.line=0;state.info=null;render();window.scrollTo(0,0)});
  const stage = $("stage");
  if(state.page==="story" && stage) showSpot(!!SCENES[state.scene].script[state.line].shake);   // 整頁重畫時補上被動感知
  const adv = ()=>{ const sc = SCENES[state.scene].script, ln = sc[state.line];
    if(ln && ln.choice && !(state.caravan||{}).pick) return;                 // 停在選項：要先選
    if(state.line < sc.length-1){ state.line++; updateStoryLine(); $("stage")?.focus({preventScroll:true}); } };
  document.querySelector(".fp-page")?.addEventListener("click", e=>{
    const pk = e.target.closest("[data-pick]"); if(pk){ caravanPick(pk.dataset.pick); return; }   // 商隊：選誰出面（10-03）
    if(e.target.closest("button, .info, .nav")) return;
    adv();
  });
  stage?.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); adv(); } });
  document.querySelectorAll("[data-info]").forEach(b=>b.addEventListener("click", ()=>{
    state.info=b.dataset.info; state.modal={kind:"character",id:state.info}; render();
  }));

  $("toShop")?.addEventListener("click", ()=>{
    CRITTERS.forEach(c=>{ if(state.gold[c.id]===undefined){ state.gold[c.id]=100*GP; state.inv[c.id]=[]; } });
    state.shopContext=null;state.page="shop"; render(); window.scrollTo(0,0);
  });
  $("backStory")?.addEventListener("click", ()=>{state.page="story";state.scene="prologue";render()});
  $("depart")?.addEventListener("click", ()=>{state.page="story";state.scene="farewell";state.line=0;state.info=null;render();window.scrollTo(0,0)});
  $("backShop")?.addEventListener("click", ()=>{state.page="shop";render()});
  $("toMap")?.addEventListener("click", ()=>{
    state.page="map"; state.location="tavern"; state.mapSel=null;
      state.travel = {from:"tavern", to:"town", t:0, stop:.5, alert:false};
    render(); window.scrollTo(0,0); startTravel();
  });
  $("toBattle")?.addEventListener("click", ()=>{state.page="battle"; startBattle("ambush"); window.scrollTo(0,0)});
  // 商隊戰後：跟馬車一起從半路走到城鎮（10-03）
  $("toRoad")?.addEventListener("click", ()=>{
    state.page="map"; state.location="tavern"; state.mapSel=null;
    state.travel = {from:"tavern", to:"town", t:.5, stop:1, alert:false, arrive:"town"};
    render(); window.scrollTo(0,0); startTravel();
  });
  if(state.page==="battle") bindBattle();
  if(state.page==="doll") bindDollDemo();
  if(state.page==="map") bindMap();
  document.querySelectorAll("[data-loc]").forEach(g=>{
    const go = ()=>{ state.mapSel = g.dataset.loc; render(); };
    g.addEventListener("click", go);
    g.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(); } });
  });
  document.querySelectorAll("[data-stab]").forEach(b=>b.addEventListener("click", ()=>{state.shopActive=+b.dataset.stab;render()}));
  if(state.page==="shop"){bindShop();bindSeal();}
  document.querySelectorAll("[data-magic-buy]").forEach(el=>el.addEventListener("click",()=>buyMagic(el.dataset.magicBuy)));
  document.querySelectorAll("[data-buy]").forEach(b=>b.addEventListener("click", ()=>{
    const id = CRITTERS[state.shopActive].id, it = itemById(b.dataset.buy);
    if(blockReason(id,it)) return;
    state.gold[id] -= it.cost; state.inv[id].push(makeItem(it).id); if(it.baseId)delete state.shopFocusStock[it.baseId];
    state.quip = state.shopContext?TOWN_UI.buy:pick(DWARF_QUIPS.buy); render();
  }));
  document.querySelectorAll("[data-sell]").forEach(b=>b.addEventListener("click", ()=>{
    const id = CRITTERS[state.shopActive].id;
    if(itemById(state.inv[id][+b.dataset.sell])?.noRefund)return;
    const [x] = state.inv[id].splice(+b.dataset.sell,1);
    state.gold[id] += itemById(x).cost;
    state.quip = state.shopContext?TOWN_UI.sell:pick(DWARF_QUIPS.sell); render();
  }));
  // 滑到被擋的按鈕上時，大爺吐槽一句
  document.querySelectorAll(".item.blocked").forEach(el=>el.addEventListener("click", e=>{
    if(e.target.closest("[data-iteminfo]")) return;
    const why = el.querySelector(".it-why").textContent;
    const k = why.includes("力量")||why.includes("敏捷") ? "str" : why.includes("金幣") ? "gold" : why.includes("揹") ? "weight" : "dup";
    state.quip = state.shopContext?why:pick(DWARF_QUIPS[k]); render();
  }));
  $("rollAll")?.addEventListener("click", rollAll);
  $("autoAssign")?.addEventListener("click", autoAssign);
  bindTokens();
  document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click", ()=>{
    state.active = +b.dataset.tab; state.sel = null; render();
  }));
}

// 測試用：網址後面加 #battle 直接進戰鬥（自動擲屬性、自動分配、給一套預設裝備）
function quickBattle(battleId="ambush",phase="combat"){
  // 香香是遊俠（隊伍的萬金油），穿中甲（大爺指定，也順便測中甲）；買不起或背不動才退回輕甲
  // 道具、備用武器是測試用（快速戰鬥每隻多給 50 gp 買道具，正式商店還是 100 gp）：
  // 玲玲藥水＋鍊金火、嬌嬌網子＋酸液、香香短劍（測換武器）＋網子＋藥水、默默鍊金火＋酸液
  // 玲玲多帶 +1 薩滿袍、默默多帶破布衣（10-02，測戰鬥中換身體裝備、AC 跟著變；商店不賣，只有快速戰鬥有）
  // 護甲對應 SRD（2026-10-01）：布甲→法袍、輕甲→鑲釘皮甲、中甲→鏈甲衫（香香是遊俠要潛行，不用有潛行劣勢的鱗甲）、重甲→鏈甲
  const kit = {fox:["背包","奧術法杖","輕弩","矢匣","法袍","+1 薩滿袍","治療藥水","鍊金火"], tiger:["背包","戰斧","輕弩","矢匣","盾牌","鏈甲","鏈甲衫","網子","酸液瓶"], wolf:["背包","短弓","箭袋","鏈甲衫","鑲釘皮甲","短劍","網子","治療藥水"], raccoon:["背包","短弓","箭袋","鑲釘皮甲","破布衣","鍊金火","酸液瓶"]};
  CRITTERS.forEach((c,i)=>{
    state.active = i;
    state.sets[c.id] = ABILITIES.map(()=>roll4()); state.slot[c.id] = {};
    const order = Object.keys(c.bg).sort((a,b)=>c.bg[b]-c.bg[a]); ABILITIES.forEach(a=>{ if(!order.includes(a.k)) order.push(a.k); });
    const hi = state.sets[c.id].map((_,j)=>j).sort((a,b)=>scoreOf(state.sets[c.id][b])-scoreOf(state.sets[c.id][a]));
    order.forEach((k,n)=> state.slot[c.id][k] = hi[n]);
    syncRolls(c.id);
    state.gold[c.id] = 150*GP; state.inv[c.id] = [];
    kit[c.id].forEach(n=>{ const it = ITEMS.find(x=>x.n===n); if(!blockReason(c.id,it)){ state.gold[c.id]-=it.cost; state.inv[c.id].push(makeItem(it).id); } });
  });
  state.page = "battle"; startBattle(battleId,false,phase);
}
// 快速城鎮驗收：沿用快速場的四隻屬性／裝備，保存旅店筆記資料，收掉戰場。
function quickTown(){
  BATTLES.random=generateRandomBattle(123);quickBattle("random","explore");
  state.townRest=JSON.parse(JSON.stringify(B()));state.townRest.busy=false;state.townRest.exploreStopped=false;
  state.battle=null;state.scout=null;state.travel=null;state.location="town";state.townFounded=true;
  state.townPlace=null;state.townPanel=null;state.shopContext=null;state.page="town";render();
}
if(location.hash==="#town")quickTown();
else if(/^#battle(?:\?|$)/.test(location.hash)){
  const raw=new URLSearchParams(location.hash.split("?")[1]||"").get("seed");
  const seed=raw!==null && /^\d+$/.test(raw)?Number(raw)>>>0:crypto.getRandomValues(new Uint32Array(1))[0];
  BATTLES.random=generateRandomBattle(seed); quickBattle("random",new URLSearchParams(location.hash.split("?")[1]||"").get("phase")==="combat"?"combat":"explore");
}
else { if(location.hash==="#doll") state.page = "doll"; render(); }
