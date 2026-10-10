/* 長休推進遊戲日，有限現貨與逐件屬性固定；商店帳本持久保存，不是全遊戲存檔。 */
function saveMarket(){try{localStorage.setItem(MARKET_KEY,JSON.stringify({...state.market,items:state.magicItems}));}catch(e){}}
function ensureMarket(){
 if(!state.market){
  let saved;try{saved=JSON.parse(localStorage.getItem(MARKET_KEY)||'null');}catch(e){}
  if(saved&&Number.isInteger(saved.day)&&saved.day>=1&&Number.isInteger(saved.seed)&&saved.items&&typeof saved.items==='object'){
   state.market=saved;state.magicItems={...saved.items,...state.magicItems};
  }else state.market={day:1,seed:crypto.getRandomValues(new Uint32Array(1))[0],stockDay:0,stock:[],marks:0,pity:0,totalDraws:0};
 }
 const m=state.market;
 if(m.stockDay!==m.day){
  const rng=mapRng((m.seed+Math.imul(m.day,2654435761))>>>0);
  const low=MAGIC_GOODS.filter(g=>g.rarity==='blue'||g.rarity==='yellow'),high=MAGIC_GOODS.filter(g=>g.rarity==='orange'||g.rarity==='gold');
  m.stock=Array.from({length:6},(_,i)=>{const choices=i===5?high:low,g=choices[Math.floor(rng()*choices.length)];const id=`magic-day-${m.day}-${i}`;makeMagicItem(g,id,rng);return {id,sold:false};});m.stockDay=m.day;saveMarket();
 }
 return m;
}
function makeMagicItem(g,id,rng=Math.random){
 const base=ITEMS.find(i=>i.n===g.base);if(!base)throw Error('missing base '+g.base);
 const it={...base,...g,id,base:base.base||g.base,baseId:base.id,noShop:false,cost:g.cost*GP,wt:Math.round(base.wt*(g.weightMul??1)*100)/100};
 if(g.acBonus)it.ac=base.ac+g.acBonus;
 if(it.type==='focus')it.stat=['INT','WIS','CHA'][Math.floor(rng()*3)];
 state.magicItems[id]=it;return it;
}
function advanceMarketDay(){const m=ensureMarket();m.day++;ensureMarket();saveMarket();}
function magicStockHTML(){
 const m=ensureMarket();return `<p class="market-day">${MAGIC_SHOP_UI.stock} · 第 ${m.day} ${MAGIC_SHOP_UI.day} · ${MAGIC_SHOP_UI.refresh}</p><small class="market-draft">${MAGIC_SHOP_UI.draft}</small>${m.stock.map(row=>{
  const it=itemById(row.id),r=MAGIC_RARITIES[it.rarity],why=row.sold?MAGIC_SHOP_UI.sold:blockReason(CRITTERS[state.shopActive].id,it);
  return `<div class="item ${why?'blocked':''}"><div class="it-main"><button class="it-name" data-iteminfo="${it.id}" style="color:${r.color}">${it.type==='weapon'?iconSVG(equipmentArtKey(it),24):''}${it.n} ⓘ</button><small style="color:${r.color}">${r.name}</small><div class="it-spec">${rulesHTML(it.desc)}</div></div><div class="it-side"><span class="it-cost">${money(it.cost)}</span><span class="it-wt">${it.wt} lb</span></div><button class="btn small" data-magic-buy="${it.id}" ${why?'disabled':''}>買</button>${why?`<div class="it-why">${why}</div>`:''}</div>`;
 }).join('')}`;
}
function buyMagic(id,owner=CRITTERS[state.shopActive].id){
 const m=ensureMarket(),row=m.stock.find(s=>s.id===id),it=itemById(id);
 if(!row||row.sold||!it||blockReason(owner,it))return false;
 state.gold[owner]-=it.cost;state.inv[owner].push(it.id);Equipment.refresh(owner);row.sold=true;saveMarket();state.quip=TOWN_UI.buy;render();return true;
}
function equippedMagic(u){return [u.weapon,u.focus,u.armor,u.backpackEquip,...(u.accessories||[])].filter(Boolean);}
function itemResistances(u){return [...new Set(equippedMagic(u).flatMap(it=>it.resistances||[]))];}
