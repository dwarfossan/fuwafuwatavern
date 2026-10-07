// 狀態卡唯一入口：共同畫面、裝備讀寫與切換按鈕。
const StatusCard = {
  render: statusCardHTML,
  readGear(id){return Equipment.read(id);},
  setGear(id,load){return Equipment.set(id,load);},
  saveGear(u){return Equipment.save(u);},
  switchUnit(u,set=2){return Equipment.switchUnit(u,set);},
  switchWeapon(id){
    const u=critterStatusUnit(id);if(!u)return false;
    if(equipmentRequirement(u.spare?.[0],k=>abilityScore(u,k)))return false;
    return this.switchUnit(u,2);
  },
  context(id){
    if(state.page==="battle" && state.battle)return state.battle;
    state.statusCardUI ||= {};
    return state.statusCardUI[id] ||= {phase:"explore",infoPage:"status",gearBagOpen:false,statusTip:null,cardSlotsOpen:false};
  },
  bind(root){
    root.querySelectorAll("[data-bagtoggle],[data-cardslt],[data-statustip],[data-infopage]").forEach(el=>modalListen(el,"click",e=>{
      e.stopPropagation();const id=el.closest("[data-anchor]")?.dataset.anchor,b=this.context(id);
      if(el.hasAttribute("data-bagtoggle")){
        b.gearBagOpen=!b.gearBagOpen;
        const card=el.closest("[data-anchor]"),slot=card?.querySelector(".status-eqslot.backpack"),drawer=card?.querySelector("[data-gearbag]"),abilities=card?.querySelector("[data-status-abilities]");
        slot?.classList.toggle("on",b.gearBagOpen);if(drawer)drawer.hidden=!b.gearBagOpen;if(abilities)abilities.hidden=b.gearBagOpen;
        el.setAttribute("aria-label",`${b.gearBagOpen?"收起":"打開"}背包`);
        sfx("pop");return;
      }
      else if(el.hasAttribute("data-cardslt"))b.cardSlotsOpen=!b.cardSlotsOpen;
      else if(el.hasAttribute("data-statustip"))b.statusTip=b.statusTip===el.dataset.statustip?null:el.dataset.statustip;
      else b.infoPage=el.dataset.infopage;
      sfx("pop");refreshGameUI();
    }));
    bindGearDrag();
    root.querySelectorAll("[data-switchset]").forEach(el=>modalListen(el,"click",e=>{
      e.stopPropagation();const id=el.closest("[data-anchor]")?.dataset.anchor;
      if(this.switchWeapon(id)){sfx("pop");const u=critterStatusUnit(id);if(state.page==="battle"&&B())syncBattleGear(u);else refreshGameUI();}
    }));
  }
};

function statusCardHTML(v, b, embedded=false){
  const pct=v.hp/v.maxHp, held=embedded?[]:victimsOf(v);
  const statusItems=[...v.statuses.map((x,i)=>{const sb=STATUS_BADGE[x.k];return {s:x,key:`s${i}`,icon:sb?.[0]||null,good:sb?.[1]||0,n:stTurns(x),label:statusLabel(v,x),desc:statusExplain(v,x)}}),...held.map((x,i)=>({s:null,key:`h${i}`,icon:"grab",good:1,n:null,label:`抓住${x.name}`,desc:`目前正抓住${x.name}；依擒抱規則限制對方移動。`}))];
  const shownStatus=[], plainStatus=[]; statusItems.forEach(x=>{if(!x.icon){if(!plainStatus.some(y=>y.label===x.label))plainStatus.push(x);return;}const prev=shownStatus.find(y=>y.icon===x.icon);if(prev){if(x.n!=null)prev.n=Math.max(prev.n||0,x.n);return;}shownStatus.push({...x});});
  const groupedStatus=statusRows([...shownStatus,...plainStatus]);
  const statusBadgeHTML=(shownStatus.length||plainStatus.length)?`<div class="status-unit-badges">${groupedStatus.map(row=>`<div class="status-badge-row" data-countdown="${row.items.some(x=>x.n!=null)}" data-status-row="${row.good?"good":"bad"}" aria-label="${row.good?"正面狀態":"負面狀態"}">${row.items.map(x=>`<button class="status-unit-badge ${x.icon?"":"plain "}${x.good?"good":"bad"} ${b.statusTip===x.key?"on":""}" data-statustip="${x.key}" aria-label="${x.label}">${x.icon?`<svg viewBox="0 0 20 20">${ST_ICON[x.icon]||""}</svg>${x.n!=null?`<span class="turns">${x.n}</span>`:""}`:x.label}</button>`).join("")}</div>`).join("")}</div>`:"";
  const statusPop=b.statusTip?(()=>{const x=statusItems.find(y=>y.key===b.statusTip);return x?`<div class="status-pop"><b>${x.label}</b><br>${rulesHTML(x.desc)}</div>`:""})():"";
  // 狀態卡的紙娃娃朝左：這裡畫朝右（face:1），CSS 的 .status-paper .inf-doll>svg 整張翻過來
  const doll=v.side==="pc"?`<div class="inf-doll"><svg viewBox="-20 -10 180 170" width="150" height="145">${dollSVG({id:v.id,color:v.color,mood:v.svgMood,levelUpAt:v.levelUpAt,...dollGear(v),face:1,down:v.down,prone:!v.down&&!!has(v,"prone"),x:0,y:0,w:140,seed:v.id.length*3})}</svg></div>`:"";
  const page=v.side==="pc"?(b.infoPage||"status"):"status";
  const tabs=v.side==="pc"&&!embedded?`<div class="gear-tabs"><button class="gear-tab ${page==="status"?"on":""}" data-infopage="status">狀態</button><button class="gear-tab ${page==="notes"?"on":""}" data-infopage="notes">小筆記</button></div>`:"";
  const notes=v.side==="pc"&&!embedded?notebookPageHTML(v,b):"";
  let statusPage="";
  const armorIcon=it=>`<svg class="status-armoricon" viewBox="38 76 64 66" width="42" height="42" aria-hidden="true">${armorSVG(it.base||it.n)}</svg>`;
  const eqIcon=it=>{if(!it)return `<span class="status-eqempty">＋</span>`;if(it.type==="armor")return armorIcon(it);if(isBag(it))return `<svg viewBox="0 0 120 120" width="42" height="42" aria-hidden="true">${ITEM_ART.backpack||ITEM_RAW.backpack}</svg>`;const g=groupOf(it);return equipmentArtKey(it)?iconSVG(equipmentArtKey(it),38):`<span class="eq-text">${it.n}</span>`};
  const eqTip=it=>it?`${it.n}\n${it.cat||it.type||"裝備"}${it.wt!=null?`・${it.wt} lb`:""}`:"空裝備格";
  if(v.side==="pc"){
    const bagOpen=!!b.gearBagOpen;
    const abilities=`<div class="status-abilities" data-status-abilities ${bagOpen?"hidden":""}>${ABILITIES.map(a=>{const n=abilityScore(v,a.k),m=modOf(n);return `<div class="status-ability"><small>${a.n}</small><div class="ab-v"><b>${n}</b><span>${m>=0?"+":""}${m}</span></div></div>`}).join("")}</div>`;
    const sh1=v.shield?(Equipment.shieldItem(v,v.activeSet===2?"secondOff":"off")||{n:"盾牌",type:"shield",id:"shield",wt:6}):v.offhand||null;
    const eqSlot=(slot,it,label,cls,extra="")=>`<div class="status-eqslot ${cls}" data-gearslot="${slot}"><small>${label}</small>${it?`<button class="status-eqitem eq-tip" data-uid="${v.id}" data-gearitem="${slot}" data-tip="${eqTip(it)}" data-iteminfo="${it.id||""}">${eqIcon(it)}</button>`:eqIcon(null)}${extra}</div>`;
    const carried=[v.weapon,v.spare&&v.spare[0],sh1,v.offhand2,v.armor,...(v.accessories||[]),v.backpackEquip,...(v.backpack||[])].filter(Boolean);
    const load=carried.reduce((sum,it)=>sum+(Number(it.wt)||0),0), cap=abilityScore(v,"STR")*15*bagMul(v.backpackEquip), loadPct=Math.min(100,cap?load/cap*100:0);
    const bagIt=v.backpackEquip||null;
    const bag=`<div class="status-eqslot backpack ${bagOpen?"on":""}" data-gearslot="backpack"><small>背包</small>${bagIt?`<button class="status-eqitem status-bagbtn eq-tip" data-bagtoggle data-uid="${v.id}" data-gearitem="backpack" data-tip="${eqTip(bagIt)}" aria-label="${bagOpen?"收起":"打開"}背包"><svg viewBox="0 0 120 120" aria-hidden="true">${ITEM_ART.backpack||ITEM_RAW.backpack}</svg></button>`:`<span class="status-eqempty">＋</span>`}</div>`;
    const bagDrawer=`<div class="status-bagdrawer gear-bag" data-gearbag ${bagOpen?"":"hidden"}><div class="gear-load"><div class="gear-load-head"><span>負重</span><b>${+load.toFixed(1)} / ${cap} lb</b></div><div class="gear-load-track"><div class="gear-load-fill" style="width:${loadPct}%"></div></div></div><div class="gear-bagitems">${(v.backpack||[]).map((it,i)=>{const g=groupOf(it);return `<button class="gear-item eq-tip" data-uid="${v.id}" data-gearitem="bag:${i}" data-iteminfo="${it.id||""}" data-tip="${eqTip(it)}">${equipmentArtKey(it)?iconSVG(equipmentArtKey(it),24):""}<span>${it.n}</span></button>`}).join("")||`<span class="gear-empty bag-drop">背包是空的；可把裝備拖到這裡</span>`}</div></div>`;
    statusPage=`<div class="status-page"><div class="status-loadout" data-status-rows="${groupedStatus.length}"><div class="status-paper" data-status-rows="${groupedStatus.length}">${statusBadgeHTML}${statusPop}${doll}</div>${bag}${eqSlot("acc1",v.accessories&&v.accessories[0],"飾Ⅰ","acc1")}${eqSlot("acc2",v.accessories&&v.accessories[1],"飾Ⅱ","acc2")}${eqSlot("armor",v.armor,"身體","armor")}${eqSlot("weapon1",v.weapon,"主手","main",`<button class="status-switch" data-switchset title="切換武器配置" aria-label="切換武器配置">↻</button>`)}${isTwoHand(v.weapon)?`<div class="status-eqslot off locked" data-gearslot="offhand1"><small>副手</small><span class="gear-empty">雙手</span></div>`:eqSlot("offhand1",sh1,"副手","off")}</div>${bagDrawer}${abilities}</div>`;   // 背包／六圍固定留在 DOM，只切 hidden，避免手機開關閃爍
  } else {
    // 敵人、NPC：紙娃娃＋裝備格（不能拖）、六圍（介面沿用只顯示調整值，資料保存完整屬性值）；不顯示熟練格、燈號、小筆記
    // 背包：看穿（被動感知、搜索）或打倒之後才打得開（大爺 10-02）
    const big=`<div class="inf-doll"><svg viewBox="-20 -10 180 170" width="150" height="145">${v.look==="mimic"?mimicSVG(v,70,100):dollSVG({id:v.id,color:sideColor(v),look:MONSTER_LOOK[v.look],...dollGear(v),face:1,down:v.down,prone:!v.down&&!!has(v,"prone"),x:0,y:0,w:140,seed:v.id.length*3})}</svg></div>`;
    const roSlot=(it,label,cls)=>`<div class="status-eqslot ro ${cls}"><small>${label}</small>${it?`<button class="status-eqitem eq-tip" data-tip="${eqTip(it)}" data-iteminfo="${it.id||""}">${eqIcon(it)}</button>`:""}</div>`;
    const known=pocketKnown(v), bagOpen=known && !!b.gearBagOpen, items=v.backpack||[];
    const bag=known
      ? `<div class="status-eqslot backpack ro ${bagOpen?"on":""}"><small>背包</small><button class="status-eqitem status-bagbtn" data-bagtoggle aria-label="${bagOpen?"收起":"打開"}${v.name}的背包"><svg viewBox="0 0 120 120" aria-hidden="true">${ITEM_ART.backpack||ITEM_RAW.backpack}</svg></button></div>`
      : `<div class="status-eqslot backpack ro locked" title="還沒看穿牠身上帶了什麼"><small>背包</small><span class="status-eqempty">？</span></div>`;
    const drawer=`<div class="status-bagdrawer gear-bag"><div class="gear-bagitems">${items.map(it=>{const g=groupOf(it);return `<button class="gear-item eq-tip" data-iteminfo="${it.id||""}" data-tip="${eqTip(it)}">${equipmentArtKey(it)?iconSVG(equipmentArtKey(it),24):""}<span>${it.n}</span></button>`}).join("")||`<span class="gear-empty">身上沒帶東西</span>`}</div></div>`;
    const abilities=`<div class="status-abilities">${ABILITIES.map(a=>{const m=v.mods[a.k]||0;return `<div class="status-ability"><small>${a.n}</small><div class="ab-v"><b>${m>=0?"+":""}${m}</b></div></div>`}).join("")}</div>`;
    const main=v.weapon||v.focus||null;
    statusPage=`<div class="status-page"><div class="status-loadout" data-status-rows="${groupedStatus.length}"><div class="status-paper" data-status-rows="${groupedStatus.length}">${statusBadgeHTML}${statusPop}${big}</div>${bag}${roSlot(v.accessories&&v.accessories[0],"飾Ⅰ","acc1")}${roSlot(v.accessories&&v.accessories[1],"飾Ⅱ","acc2")}${roSlot(v.armor,"身體","armor")}${roSlot(main,"主手","main")}${isTwoHand(main)?`<div class="status-eqslot ro off locked"><small>副手</small><span class="gear-empty">雙手</span></div>`:roSlot(v.shield?(Equipment.shieldItem(v,v.activeSet===2?"secondOff":"off")||{n:"盾牌",type:"shield",id:"shield",wt:6}):null,"副手","off")}</div>${bagOpen?drawer:abilities}</div>`;
  }
  const pageBody=v.side==="pc"&&page==="notes"?notes:statusPage;
  return `<div class="${embedded?"character-status-card":"bt-ov"} bt-info gear-info ${v.side==="pc"?(page==="status"?"status-view":"notes-view"):"status-view foe-view"}" data-anchor="${v.id}" style="--c:${v.side==="npc"?sideColor(v):v.side==="pc"?v.color:"var(--bad)"};--info-scale:${page==="status"?(b.infoScale||1):1}">
    ${embedded?"":`<button class="inf-x" data-closeinfo aria-label="關閉">✕</button>`}
    <div class="bt-me"><div><h3>${v.name}${v.side==="pc"?`　${levelButtonHTML(v.id)}`:""}</h3><div class="dim">${v.gone==="teleport"?"被傳送回酒館":v.dead?"已被打倒":v.down?`倒下了（死亡豁免失敗 ${v.dsFail||0}/${DS_MAX}） · `:""}AC ${acOfUnit(v)} · 移動 ${v.speed}${v.side==="pc"?` · 被動感知 ${passivePer(v)}`:""}</div></div></div>
    ${infoBarsHTML(v, pct)}
    ${v.side==="pc" && econHTML(v,b,false)?`<div class="econ">${econHTML(v,b,false)}</div>`:""}
    ${v.side==="pc"?slotGridHTML(v,b):""}
    ${v.oaUsed&&!v.down&&!v.dead?`<div class="inf-g dim">這輪已經藉機攻擊過了</div>`:""}
    ${tabs}${pageBody}
  </div>`;
}

