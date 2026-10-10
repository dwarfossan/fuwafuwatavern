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
function lootRecipients(){return (B()?.units||[]).filter(u=>(u.side==='pc'||u.side==='npc'&&u.partyMember===true)&&!u.dead&&!u.fled&&u.backpackEquip&&Array.isArray(u.backpack)).sort((a,b)=>{const rank=u=>{const i=CRITTERS.findIndex(c=>c.id===u.id);return i<0?CRITTERS.length:i;};return rank(a)-rank(b);});}
function lootRecipient(id){return lootRecipients().find(u=>u.id===id);}
function lootWeight(u){return u.side==='pc'?weightOf(u.id):[u.weapon,u.focus,u.armor,u.backpackEquip,u.offhand,u.offhand2,...(u.spare||[]),...(u.accessories||[]),...u.backpack].filter(Boolean).reduce((n,it)=>n+(Number(it.wt)||0),0);}
function lootFace(u){if(CRITTERS.some(c=>c.id===u.id))return `<svg viewBox="0 0 60 60" width="36" height="36">${faceSVG(u,4,4,52)}</svg>`;const look=MONSTER_LOOK[u.look];return look?`<svg viewBox="0 0 60 60" width="36" height="36">${faceSVG(u,4,4,52)}</svg>`:`<span aria-hidden="true">${townText(u.name.slice(0,1))}</span>`;}
// 多選：b.lootPicked 為勾選的 key 清單；整批放入，總重超過就整批不放（大爺 10-10）。
function lootPickedRows(){const b=B(),keys=b?.lootPicked||[];return battleLoot().filter(r=>!r.claimed&&keys.includes(r.key));}
function lootRowsWeight(rows){return rows.reduce((n,r)=>n+(Number(r.item.wt)||0),0);}
function lootOver(rows,u){return u?lootWeight(u)+lootRowsWeight(rows)-worldCapacity(u):0;}
function lootProblem(rows,u){rows=[].concat(rows);if(!u)return '已離場';const over=lootOver(rows,u);return over>1e-9?`超重 ${+over.toFixed(2)} lb`:'';}
function toggleLootPick(key){const b=B(),keys=b.lootPicked ||= [],i=keys.indexOf(key);if(i>=0)keys.splice(i,1);else keys.push(key);refreshBattle();}
function toggleLootAll(){const b=B(),rows=battleLoot().filter(r=>!r.claimed);b.lootPicked=lootPickedRows().length===rows.length?[]:rows.map(r=>r.key);refreshBattle();}
function claimBattleLoot(keys,id){
 const b=B();if(b?.result!=='win')return false;
 keys=[].concat(keys||[]);const rows=battleLoot().filter(r=>!r.claimed&&keys.includes(r.key)),u=lootRecipient(id);
 if(!rows.length||rows.length!==new Set(keys).size||lootProblem(rows,u))return false;
 for(const row of rows){row.claimed=true;row.remove();u.backpack.push(row.item);(state.inv[u.id] ||= []).push(row.item.id);}
 syncBattleBag(u);
 if(u.side==='npc')u.items=u.backpack.filter(it=>it.type==='consumable');b.lootPicked=(b.lootPicked||[]).filter(k=>!keys.includes(k));sfx('pop');refreshBattle();return true;
}
function lootItemIcon(it){
 if(it.type==='armor')return `<svg viewBox="38 76 64 66" width="28" height="28" aria-hidden="true">${armorSVG(it.base||it.n)}</svg>`;
 const key=equipmentArtKey(it);return key?iconSVG(key,28):'<span aria-hidden="true">◇</span>';
}
function battleLootHTML(){
 const b=B(),rows=battleLoot().filter(r=>!r.claimed),picked=lootPickedRows(),people=lootRecipients();
 const index=Math.max(0,people.findIndex(u=>u.id===b.lootRecipientId)),u=people[index];b.lootRecipientId=u?.id||null;
 const why=picked.length?lootProblem(picked,u):'',wt=+lootRowsWeight(picked).toFixed(2);
 const load=u?`${+lootWeight(u).toFixed(2)} → ${+(lootWeight(u)+wt).toFixed(2)} / ${worldCapacity(u)} lb`:'';
 const picker=picked.length?`<p class="loot-instruction">將 ${picked.length} 件（${wt} lb）放入：</p><div class="loot-picker"><div class="loot-confirm"><details class="loot-select"><summary aria-label="選擇背包">${u?lootFace(u):''}<span>${u?townText(u.name):'沒有可用背包'}</span><span aria-hidden="true">▾</span></summary><div class="loot-people" aria-label="隊員背包">${people.map(v=>`<button class="loot-person ${v===u?'on':''}" data-loot-person="${v.id}" aria-label="${townText(v.name)}的背包" aria-pressed="${v===u}">${lootFace(v)}<span>${townText(v.name)}</span></button>`).join('')||'<p>沒有可用背包</p>'}</div></details><button class="btn small" data-loot-to="${u?.id||''}" ${why||!u?'disabled':''}>放入背包</button></div><small class="loot-load ${why?'over':''}">${load}${why?' · '+why:''}</small></div>`:'<p class="loot-instruction">點物品勾選（可多選），再選背包；不要的可以留下。</p>';
 const all=rows.length?`<button class="loot-all" data-lootall>${picked.length===rows.length?'取消':'全選'}</button>`:'';
 return `<section class="victory-loot" aria-label="戰利品"><h3>戰利品 <small>剩 ${rows.length} 件${picked.length?` · 已選 ${picked.length} 件 · ${wt} lb`:''}</small>${all}</h3><div class="loot-list">${rows.map(r=>`<button class="loot-item ${picked.includes(r)?'on':''}" data-loot="${r.key}" aria-pressed="${picked.includes(r)}">${lootItemIcon(r.item)}<span><b>${townText(r.item.n)}</b><small>${townText(r.source)} · ${Number(r.item.wt)||0} lb</small></span></button>`).join('')||'<p>沒有剩餘戰利品。</p>'}</div>${picker}${b.def.after?'<button class="btn" id="afterWin">繼續 ▶</button>':''}</section>`;
}
