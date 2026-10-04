/* 封印帳本：抽取先結算保存；超重待領取，不能重抽或重扣。 */
function ensureSealWeek(m=ensureMarket()){
 const week=Math.floor((m.day-1)/7)+1;
 if(m.week!==week){
  m.week=week;m.prizes=['orange','gold'].map(r=>{
   const choices=MAGIC_GOODS.filter(g=>g.rarity===r),g=choices[(week-1)%choices.length];
   const id=`magic-week-${week}-${r}`;makeMagicItem(g,id,mapRng((m.seed^week)>>>0));return id;
  });saveMarket();
 }
 return m;
}
function sealRarity(r,pity){const rarity=r<.70?'blue':r<.95?'yellow':r<.99?'orange':'gold';return rarity==='blue'&&pity>=9?'yellow':rarity;}
function sealedGoodsHTML(){
 const m=ensureSealWeek(),owner=CRITTERS[state.shopActive].id,it=m.pending?itemById(m.pending):null;
 return `<section class="seal-panel"><button class="seal-question" id="sealOpen" aria-label="查看封印奇物">？</button><h3>封印奇物</h3><p>${money(SEAL_PRICE)}／份 · 封印印記 ${m.marks} 枚</p><p class="seal-small">魔法 70% · 稀有 25% · 傳奇 4% · 獨特 1%<br>連續九份未出稀有以上，第十份保證稀有以上。<br>距十次保底最多 ${10-m.pity} 份；印記與進度跨週保留。</p><small class="market-draft">抽價暫定／介紹台詞草稿 · 解封及印記兌換不可退換</small>
 ${it?`<div class="seal-pending">待領取：<button class="it-name" data-iteminfo="${it.id}" style="color:${MAGIC_RARITIES[it.rarity].color}">${it.n} ⓘ</button><p>${rulesHTML(it.desc)}</p><button class="btn small" id="sealClaim" ${blockReason(owner,it)?'disabled':''}>交給${CRITTERS[state.shopActive].name}</button>${blockReason(owner,it)?`<p>${blockReason(owner,it)}，可切換頭像領取。</p>`:''}</div>`:''}
 <h4>第 ${m.week} 週自選 · ${SEAL_EXCHANGE} 枚印記</h4><p class="seal-small">每七次長休換一週；以下裝備與效果公開。</p>${m.prizes.map(id=>{const p=itemById(id),r=MAGIC_RARITIES[p.rarity],why=sealExchangeProblem(id,owner);return `<div class="seal-prize"><button class="it-name" data-iteminfo="${id}" style="color:${r.color}">${r.name} · ${p.n} ⓘ</button><p>${rulesHTML(p.desc)}</p><button class="btn small" data-seal-exchange="${id}" ${why?'disabled':''}>自選這件</button>${why?`<small>${why}</small>`:''}</div>`;}).join('')}</section>`;
}
function openSeal(){const m=ensureSealWeek();state.modal={kind:m.sealSeen?'seal':'sealIntro',line:0};render();}
function sealModalHTML(m){
 if(m.kind==='sealIntro'){
  const l=SEAL_INTRO[m.line],c=CRITTERS.find(c=>c.id===l.who),venue=TOWN_PLACES.find(p=>p.id==='items');
  return `<div class="seal-speaker">${c?critterHead(c.id):`<div class="quip-face liliana-icon">${portraitHTML("liliana","smile")}</div>`}<strong>${c?c.name:venue.owner}</strong></div><p>${l.text}</p><small class="market-draft">台詞草稿</small><button class="btn" id="sealNext">${m.line===SEAL_INTRO.length-1?'看看封印奇物':'繼續'}</button>`;
 }
 const market=ensureSealWeek();return `<h3>解開封印奇物</h3><p>解封費 ${money(SEAL_PRICE)}（暫定），每份留一枚封印印記。</p><p>本次由${CRITTERS[state.shopActive].name}付款；開啟後不可退換。</p><p>若揹不動，寶物會留下等你領取。</p>${market.pending?'<p>請先領取上一件奇物。</p>':''}<button class="btn" id="sealDraw" ${market.pending||state.gold[CRITTERS[state.shopActive].id]<SEAL_PRICE?'disabled':''}>付費解封</button>`;
}
function drawSeal(owner=CRITTERS[state.shopActive].id){
 const m=ensureSealWeek();if(!m.sealSeen||m.pending||!state.gold.hasOwnProperty(owner)||state.gold[owner]<SEAL_PRICE)return false;
 const rng=mapRng((m.seed+Math.imul(m.totalDraws+1,2246822519))>>>0),rarity=sealRarity(rng(),m.pity),choices=MAGIC_GOODS.filter(g=>g.rarity===rarity),g=choices[Math.floor(rng()*choices.length)];
 const id=`magic-draw-${m.totalDraws+1}`,it=makeMagicItem(g,id,rng);it.noRefund=true;it.cost=0;
 state.gold[owner]-=SEAL_PRICE;m.totalDraws++;m.marks++;m.pity=rarity==='blue'?m.pity+1:0;m.pending=id;saveMarket();state.modal=null;render();return true;
}
function claimSeal(owner=CRITTERS[state.shopActive].id){
 const m=ensureMarket(),it=itemById(m.pending);if(!it||blockReason(owner,it))return false;
 state.inv[owner].push(it.id);Equipment.refresh(owner);m.pending=null;saveMarket();render();return true;
}
function sealExchangeProblem(id,owner){
 const m=state.market;if(!m?.prizes?.includes(id))return '不在本週自選名單';if(m.marks<SEAL_EXCHANGE)return '封印印記不足';
 const it=itemById(id);return blockReason(owner,{...it,cost:0});
}
function exchangeSeal(id,owner=CRITTERS[state.shopActive].id){
 const m=ensureSealWeek();if(sealExchangeProblem(id,owner))return false;
 const p=itemById(id),it={...p,id:`magic-exchange-${m.exchanges=(m.exchanges||0)+1}`,noRefund:true,cost:0};state.magicItems[it.id]=it;state.inv[owner].push(it.id);Equipment.refresh(owner);m.marks-=SEAL_EXCHANGE;saveMarket();render();return true;
}
function bindSeal(){
 document.getElementById('sealOpen')?.addEventListener('click',openSeal);
 document.getElementById('sealNext')?.addEventListener('click',()=>{if(state.modal.line<SEAL_INTRO.length-1)state.modal.line++;else {ensureMarket().sealSeen=true;saveMarket();state.modal={kind:'seal'};}render();});
 document.getElementById('sealDraw')?.addEventListener('click',()=>drawSeal());
 document.getElementById('sealClaim')?.addEventListener('click',()=>claimSeal());
 document.querySelectorAll('[data-seal-exchange]').forEach(el=>el.addEventListener('click',()=>exchangeSeal(el.dataset.sealExchange)));
}
