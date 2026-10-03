/* 戰場互動物件；沿用 blocks、背包、豁免／hurt 與分層渲染。 */
const powderItem=()=>ITEMS.find(it=>it.placeable==="powderBarrel");
const powderCount=u=>(u?.backpack||[]).filter(it=>it.placeable==="powderBarrel").length;
const worldActor=()=>exploring()?exploreUnit():cur();
function worldCanAct(u=worldActor()){const b=B();return !!u&&u.side==="pc"&&!u.dead&&!u.down&&!has(u,"paralyzed")&&!b.busy&&!b.result&&(exploring()?!b.exploreStopped:u===cur()&&canAct());}
function carriedWeight(u){return [u.weapon,u.spare?.[0],u.shield?{wt:6}:null,u.offhand2,u.armor,...(u.accessories||[]),u.backpackEquip,...(u.backpack||[])].filter(Boolean).reduce((n,it)=>n+(Number(it.wt)||0),0);}
const worldCapacity=u=>abilityScore(u,"STR")*15*bagMul(u.backpackEquip);
function barrelTarget(o){return {id:`barrel-${o.x}-${o.y}`,name:EXPLORE_OBJECTS.powderBarrel.name,x:o.x,y:o.y,side:"object",combatActive:true,baseAc:POWDER_BARREL.ac,hp:1,maxHp:1,mods:{STR:0,DEX:0,CON:0,INT:0,WIS:0,CHA:0},statuses:[],worldObject:o};}
function placeableCell(u,x,y){const b=B();return Number.isInteger(x)&&Number.isInteger(y)&&dist(u,{x,y})<=1&&!blocked(x,y)&&!unitAt(x,y)&&!b.def.blocks.some(o=>o.x===x&&o.y===y)&&(!exploring()||!b.units.some(v=>!v.dead&&!v.fled&&Math.abs(v.x-x)<.62&&Math.abs(v.y-y)<.62));}
function beginBarrelPlacement(){const b=B(),u=worldActor();if(!worldCanAct(u)||!powderCount(u))return;b.exploreObject=null;b.worldObject=null;b.menu=null;b.moveMode=false;b.mode={key:"placeBarrel"};refreshBattle();}
function placeBarrel(x,y){const b=B(),u=worldActor(),it=u?.backpack?.find(it=>it.placeable==="powderBarrel");if(!worldCanAct(u)||!it||!placeableCell(u,x,y))return false;
 dropItem(u,it);const o={x,y,kind:"powderBarrel"};b.def.blocks.push(o);b.mode=null;b.menu=null;if(!exploring())useAction(u);blog(WORLD_OBJECT_TEXT.placed);if(groundAt(x,y)?.kind==="fire")explodeBarrel(o,u);refreshBattle();return true;
}
function pickupBarrel(o,u=worldActor()){const b=B(),it=powderItem();if(!worldCanAct(u)||!b.def.blocks.includes(o)||o.kind!=="powderBarrel"||dist(u,o)>1)return false;
 if(carriedWeight(u)+it.wt>worldCapacity(u)){blog(WORLD_OBJECT_TEXT.tooHeavy);refreshBattle();return false;}
 u.backpack.push(it);(state.inv[u.id] ||= []).push(it.id);syncBattleBag(u);b.def.blocks.splice(b.def.blocks.indexOf(o),1);b.exploreObject=null;b.worldObject=null;b.objectTip=null;if(!exploring())useAction(u);blog(WORLD_OBJECT_TEXT.picked);refreshBattle();return true;
}
function worldInteract(action){const b=B();if(action==="close"){b.worldObject=null;refreshBattle();return;}if(action==="pickup")pickupBarrel(b.worldObject);}
// 每桶先移除再擴散；相鄰桶只進佇列一次，可同時傷到友軍及藏身單位。
function explodeBarrel(first,source=null){const b=B();if(!b.def.blocks.includes(first)||first.kind!=="powderBarrel")return false;const queue=[first],seen=new Set(queue),ownPanel=!b.act;if(ownPanel)panelStart(WORLD_OBJECT_TEXT.exploded);
 for(let i=0;i<queue.length;i++){const o=queue[i],at=b.def.blocks.indexOf(o);if(at<0)continue;b.def.blocks.splice(at,1);if(b.exploreObject===o)b.exploreObject=null;if(b.worldObject===o)b.worldObject=null;b.objectTip=null;blog(WORLD_OBJECT_TEXT.exploded,"skill");
  const tiles=[];for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const x=o.x+dx,y=o.y+dy;if(x>=0&&y>=0&&x<b.def.w&&y<b.def.h){tiles.push({x,y});fxHit({x,y},"fire");}}
  const inside=t=>Math.abs(mapCell(t.x)-o.x)<=1&&Math.abs(mapCell(t.y)-o.y)<=1;
  const damage=rollDice(POWDER_BARREL.damage).total;
  for(const u of b.units.filter(u=>!u.dead&&!u.fled&&inside(u))){if(isHid(u))reveal(u);const saved=saveRoll(u,"DEX",POWDER_BARREL.dc,o);hurt(u,saved?Math.floor(damage/2):damage,POWDER_BARREL.type,source);}
  for(const other of b.def.blocks.filter(q=>q.kind==="powderBarrel"&&inside(q)))if(!seen.has(other)){seen.add(other);queue.push(other);}
  // 火焰接現有草叢／油／水反應，火藥桶由本佇列統一結算。
  for(const p of tiles)if(!b.def.blocks.some(q=>q.kind==="powderBarrel"&&q.x===p.x&&q.y===p.y))groundReact(p.x,p.y,"火焰");
 }
 if(ownPanel)panelEnd();sfx("bang",b.impact||0);
 if(exploring()&&!exploreParty().length){enterExploreCombat(null,true);b.manualCombat=false;}
 refreshBattle();return true;
}
function objectTipLines(o){const t=WORLD_OBJECT_TEXT;if(o.kind==="powderBarrel")return [t.barrel,t.blast,t.chain];return [o.kind==="chest"?(o.opened?t.chestOpen:t.chestLocked):o.kind==="crate"?t.crate:o.kind==="trap"?t.trap:t.door];}
