/* 路旁寶箱：發現時決定所有隨機資料；劇情重畫、暫停及戰鬥重試不重擲。 */
const WORLD_CHEST_TIERS=[['common',10,5,10],['uncommon',12,10,20],['rare',15,20,40],['epic',18,40,80],['legendary',20,80,160]];
function createWorldChest(rng=Math.random){
 const [rarity,dc,min,max]=WORLD_CHEST_TIERS[Math.min(4,Math.floor(rng()*5))];
 return {rarity,dc,gold:min+Math.floor(rng()*(max-min+1)),mimic:rng()<.1,status:'locked',attempts:[],paid:false};
}
function worldChestScript(){
 const e=state.worldChest,lines=WORLD_CHAT.chest.lines.slice(0,5);
 if(!e)return [...lines,{who:'narr',text:WORLD_CHAT.chestEnd.choose,worldChestChoice:true}];
 for(const a of e.attempts){
  lines.push({who:a.id,text:WORLD_CHAT.chestTry[a.id].try,chestRoll:a,mood:'normal'});
  lines.push({who:a.id,text:e.mimic?WORLD_CHAT.chestEnd[a.ok?'unlockMimic':'lockedMimic']:WORLD_CHAT.chestTry[a.id][a.ok?'win':'lose'],mood:WORLD_CHAT.chestTry[a.id][a.ok?'winMood':'loseMood'],critterMark:a.ok?'ok':'fail',chestView:a.ok&&!e.mimic?'opened':'closed'});
 }
 if(e.status==='locked')lines.push({who:'narr',text:WORLD_CHAT.chestEnd.choose,worldChestChoice:true});
 else if(e.status==='opened')lines.push({who:'narr',text:WORLD_CHAT.chestEnd.gold.replace('{gold}',e.gold).replace('{share}',money(Math.round(e.gold*GP/CRITTERS.length))),chestView:'opened'});
 else if(e.status==='failed')lines.push({who:'wolf',text:WORLD_CHAT.chestEnd.failed,mood:'sigh'});
 else if(e.status==='mimic'||e.status==='fighting')lines.push({who:'narr',text:WORLD_CHAT.chestEnd.reveal,chestView:'mimic'},{who:'all',text:WORLD_CHAT.chestEnd.mimic,moods:{fox:'surprised',tiger:'blank',wolf:'surprised',raccoon:'surprised'},marks:Object.fromEntries(CRITTERS.map(c=>[c.id,'ok'])),chestView:'mimic'});
 else if(e.status==='defeated')return [{who:'wolf',text:WORLD_CHAT.chestEnd.defeated,mood:'sigh',chestView:'defeated'},{who:'fox',text:WORLD_CHAT.chestEnd.resume,mood:'normal',chestView:'defeated'}];
 return lines;
}
function worldChestChoices(){
 const e=state.worldChest;if(!e)return '';
 return `<div class="choice-list">${CRITTERS.map(c=>{const used=e.attempts.some(a=>a.id===c.id),m=modOf(finalScore(c.id,'DEX'));return `<button class="choice" data-chest-pick="${c.id}" style="--c:${c.color}" ${used?'disabled':''}><b>${c.name}${used?'（已試）':''}</b><small>敏捷 ${fmt(m)}・難度 ${e.dc}</small></button>`;}).join('')}</div>`;
}
function worldChestRollHTML(a){return `<div class="check-row">敏捷檢定 ${diceFormulaHTML({dice:dieFace(20,a.roll,0,DICE_TUMBLE,a.flick,false),base:a.roll,total:a.total,result:a.ok?'hit':'miss',land:DICE_TUMBLE})}<span class="check-vs">${a.ok?'≥':'<'} ${state.worldChest.dc}　${a.ok?'成功！':'失敗'}</span></div>`;}
function worldChestPick(id,roll){
 const e=state.worldChest;if(state.page!=='story'||state.scene!=='worldChest'||e?.status!=='locked'||!SCENES.worldChest.script[state.line]?.worldChestChoice||!CRITTERS.some(c=>c.id===id)||e.attempts.some(a=>a.id===id))return;
 roll??=d20();const mod=modOf(finalScore(id,'DEX')),total=roll+mod,ok=total>=e.dc,index=5+e.attempts.length*2;
 e.attempts.push({id,roll,mod,total,ok,flick:[0,1,2].map(()=>d20())});
 if(e.mimic)e.status='mimic';
 else if(ok){e.status='opened';if(!e.paid){e.paid=true;grantPartyGold(e.gold);}}
 else if(e.attempts.length===CRITTERS.length)e.status='failed';
 state.line=index;sfx(ok?'win':'miss');render();
}
function worldChestStage(){
 const e=state.worldChest||{},script=worldChestScript(),view=script.slice(0,state.line+1).findLast(l=>l.chestView)?.chestView||'closed';
 return `<svg class="story-chest ${view!=='closed'?'chest-result':''}" viewBox="0 0 600 740" aria-label="路旁寶箱">${view==='mimic'||view==='defeated'?mimicSVG({...e,down:view==='defeated'},300,400):chestSVG({...e,opened:view==='opened'},300,400)}</svg>`;
}
function startWorldMimic(){
 const e=state.worldChest;if(e?.status!=='mimic'||state.page!=='story'||state.scene!=='worldChest'||state.line!==worldChestScript().length-1)return;
 e.status='fighting';BATTLES.worldMimic.foes[0].rarity=e.rarity;state.page='battle';state.scout=null;startBattle('worldMimic');render();window.scrollTo(0,0);
}
