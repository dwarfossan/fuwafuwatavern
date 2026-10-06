/* 勝利戰利品：只搬移戰場實際剩餘物品，不生成掉落或重新抽物品。 */
function battleLoot(){
 const b=B();if(!b||b.result!=='win')return [];
 if(b.loot)return b.loot;
 const rows=[];
 const add=(item,source,remove)=>{if(item)rows.push({key:'loot-'+rows.length,item,source,remove,claimed:false});};
 b.units.filter(u=>u.side==='foe'&&u.dead&&!u.fled).forEach(u=>{
  for(const slot of ['weapon','focus','armor','backpackEquip','offhand','offhand2'])add(u[slot],u.name,()=>{u[slot]=null;});
  if(u.shield){const i=Number(u.id.replace('foe','')),it=state.battleSnap?.foeGear?.[i]?.find(it=>it.type==='shield');add(it,u.name,()=>{u.shield=false;});}
  for(const field of ['spare','accessories','backpack'])for(const it of u[field]||[])add(it,u.name,()=>{const i=u[field].indexOf(it);if(i>=0)u[field].splice(i,1);const n=(u.items||[]).indexOf(it);if(n>=0)u.items.splice(n,1);});
  // items 為背包的可用消耗品檢視；同一件不重複列入。
  for(const it of u.items||[])if(!(u.backpack||[]).includes(it))add(it,u.name,()=>{const i=u.items.indexOf(it);if(i>=0)u.items.splice(i,1);});
 });
 for(const drop of b.drops||[])add(drop.item,'地面',()=>{const i=b.drops.indexOf(drop);if(i>=0)b.drops.splice(i,1);});
 return b.loot=rows;
}
function lootRecipient(id){return B()?.units.find(u=>u.side==='pc'&&u.id===id&&!u.dead&&!u.fled);}
function lootProblem(row,u){if(!u)return '已離場';return weightOf(u.id)+(Number(row.item.wt)||0)>worldCapacity(u)+1e-9?'超重':'';}
function claimBattleLoot(key,id){
 const b=B();if(b?.result!=='win')return false;
 const row=battleLoot().find(r=>r.key===key&&!r.claimed),u=lootRecipient(id);if(!row||lootProblem(row,u))return false;
 row.claimed=true;row.remove();u.backpack.push(row.item);(state.inv[u.id] ||= []).push(row.item.id);syncBattleBag(u);
 b.lootSelected=null;sfx('pop');refreshBattle();return true;
}
function lootItemIcon(it){
 if(it.type==='armor')return `<svg viewBox="38 76 64 66" width="28" height="28" aria-hidden="true">${armorSVG(it.base||it.n)}</svg>`;
 const key=equipmentArtKey(it);return key?iconSVG(key,28):'<span aria-hidden="true">◇</span>';
}
function battleLootHTML(){
 const b=B(),rows=battleLoot().filter(r=>!r.claimed),selected=rows.find(r=>r.key===b.lootSelected);
 return `<section class="victory-loot" aria-label="戰利品"><h3>戰利品 <small>剩 ${rows.length} 件</small></h3><div class="loot-list">${rows.map(r=>`<button class="loot-item ${r===selected?'on':''}" data-loot="${r.key}">${lootItemIcon(r.item)}<span><b>${townText(r.item.n)}</b><small>${townText(r.source)} · ${Number(r.item.wt)||0} lb</small></span></button>`).join('')||'<p>沒有剩餘戰利品。</p>'}</div>${selected?`<p class="loot-instruction">將「${townText(selected.item.n)}」放入：</p><div class="loot-recipients">${CRITTERS.map(c=>{const u=lootRecipient(c.id),why=lootProblem(selected,u);return `<button class="btn small" data-loot-to="${c.id}" ${why?'disabled':''}>${c.name}<small>${u?`${+weightOf(u.id).toFixed(2)} / ${worldCapacity(u)} lb`:''}${why?' · '+why:''}</small></button>`;}).join('')}</div>`:'<p class="loot-instruction">點物品，再選背包；不要的可以留下。</p>'}${b.def.after?'<button class="btn" id="afterWin">繼續 ▶</button>':''}</section>`;
}
