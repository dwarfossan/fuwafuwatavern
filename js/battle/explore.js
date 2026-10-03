/* 探索與戰棋共用 B()、尋路、walk 與四層渲染。包含探索互動、原地切戰棋、小隊增援與返回探索。 */
const exploring=()=>B()?.phase==="explore";
const exploreParty=()=>CRITTERS.map(c=>B().units.find(u=>u.id===c.id)).filter(u=>u&&!u.dead&&!u.down);
const exploreUnit=()=>B().units.find(u=>u.id===(B().exploreSolo||B().leader)&&!u.dead&&!u.down)||exploreParty()[0]||B().units.find(u=>u.side==="pc");
function beginExplore(){
 const b=B();b.explorationMap=true;b.phase="explore";b.groundClockAt=Date.now();b.flowEpoch=(b.flowEpoch||0)+1;b.exploreStopReason=null;b.exploreObject=null;b.exploreRest=false;b.leader=b.leader||"fox";if(!exploreParty().some(u=>u.id===b.leader))b.leader=exploreParty()[0]?.id||"fox";b.exploreSolo=null;b.exploreStopped=false;b.exploreMarks={};b.exploreSneak=false;
 b.turn=b.units.findIndex(u=>u.id===b.leader);b.busy=false;b.mode=null;b.moveMode=false;b.menu=null;b.tut=-1;b.result=null;b.round=0;
 exploreTraps();exploreDetect();refreshBattle();
}
function exploreSelect(id){const b=B();if(b.busy||b.exploreStopped)return;const p=exploreParty().find(u=>u.id===id);if(!p)return;b.exploreSolo=id;b.turn=b.units.indexOf(p);b.info=null;refreshBattle();}
function exploreGather(){const b=B();if(b.busy||b.exploreStopped)return;b.exploreSolo=null;b.turn=b.units.findIndex(u=>u.id===b.leader);refreshBattle();}
function exploreSetLeader(){const b=B();if(b.busy||b.exploreStopped)return;b.leader=exploreUnit().id;exploreGather();}
function exploreHide(){
 const b=B();if(b.busy||b.exploreStopped)return;
 const pcs=b.exploreSolo?[exploreUnit()]:exploreParty();
 b.exploreSneak=!b.exploreSneak;
 for(const u of pcs){if(!b.exploreSneak){reveal(u);continue;}if(isHid(u))continue;const why=hideBlock(u);if(why)blog(`${u.name}：${why}`);else tryHide(u);}
 exploreDetect();refreshBattle();
}
function exploreSight(a,t){return coverOf(a,t).v<.75;}
function exploreReveal(hiddenUnit,observer){panelStart(`${observer.name}【察覺】`);stealthRow(hiddenUnit,observer,true);panelEnd();obsMark(observer,"ok");reveal(hiddenUnit,"被察覺了，現身！");}
function exploreDetect(){
 const b=B();if(!exploring())return;
 const pcs=exploreParty(),foes=b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.dead&&!u.down);b.exploreMarks={};[...pcs,...foes].forEach(u=>groundDetect(u));
 b.exploreAwareness=Object.fromEntries([...pcs,...foes].map(u=>[u.id,(u.side==="pc"?foes:pcs).filter(t=>exploreAware(u,t)).map(t=>t.id)]));
 // 我方也用同一條遮擋檢查；察覺範圍沿用移動格數、比較被動感知。
 for(const p of pcs)for(const e of foes)if(isHid(e)&&dist(p,e)<=senseRange(p)&&exploreSight(p,e)&&passivePer(p)>=has(e,"hidden").val)exploreReveal(e,p);
 for(const p of pcs){let alert=0;for(const e of foes){const range=ENEMIES[e.type].detectRange,d=dist(p,e);if(d>range+1||!exploreSight(e,p))continue;alert=Math.max(alert,1);
   if(d<=range&&(!isHid(p)||passivePer(e)>=has(p,"hidden").val)){
     alert=2;if(isHid(p))exploreReveal(p,e);if(isHid(e))reveal(e,"發現了小隊，現身！");b.exploreStopped=true;b.discoveredBy=e.id;
   }}b.exploreMarks[p.id]=alert;}
 if(b.exploreStopped){b.busy=false;if(b.exploreStopReason!=="trap")enterExploreCombat(b.discoveredBy,false);}
}
function explorePath(u,x,y){return reachable(u,10000).get(`${x},${y}`);}
function exploreMove(x,y,done){
 const b=B(),u=exploreUnit();if(!exploring()||b.busy||b.exploreStopped||!u||u.down||u.dead||blocked(x,y))return;
 const path=explorePath(u,x,y);if(!path){blog(EXPLORE_UI.noPath);refreshBattle();return;}
 if(has(u,"paralyzed"))return;
 if(has(u,"prone")){u.statuses=u.statuses.filter(s=>s.k!=="prone");blog(`${u.name}爬起來。`);}
 const moveId=b.exploreMoveId=(b.exploreMoveId||0)+1;
 b.exploreIceTried={};b.busy=true;b.info=null;b.exploreSteps=0;b.exploreGoal={x,y,id:u.id};
 const followers=b.exploreSolo?[]:exploreParty().filter(v=>v!==u);let i=0;
 function step(){
  if(B()!==b||!exploring()||b.exploreMoveId!==moveId)return;
  if(b.exploreStopped||(u.x===x&&u.y===y)){b.busy=false;b.exploreGoal=null;refreshBattle();if(!b.exploreStopped&&u.x===x&&u.y===y)done?.();return;}
  const next=explorePath(u,x,y);if(!next?.length){b.busy=false;b.exploreGoal=null;blog(EXPLORE_UI.blocked);refreshBattle();return;}
  const old=[{x:u.x,y:u.y},...followers.map(p=>({x:p.x,y:p.y}))],p=next[0];i++;
  // 隱藏單位不洩漏到尋路；實際接觸時不能重疊，停在上一格。
  const occupied=unitAt(p.x,p.y);if(occupied&&occupied!==u){b.busy=false;blog(EXPLORE_UI.blocked);refreshBattle();return;}
  walk(u,[p],()=>{
   if(b.exploreMoveId!==moveId)return;
   if(b.exploreStopped){b.busy=false;refreshBattle();return;}
   let n=0;function follow(){if(b.exploreMoveId!==moveId)return;if(b.exploreStopped||n>=followers.length){b.exploreSteps++;if(!touches.size&&!onScreen(u))centerCam(u.x,u.y-1,true);refreshBattle();later(step,140);return;}
    const f=followers[n],target=old[n++];if(has(f,"paralyzed")||has(f,"prone")){follow();return;}const fp=explorePath(f,target.x,target.y);if(fp?.length)walk(f,[fp[0]],follow);else follow();}
   follow();
  });
 }
 step();
}
function exploreClick(x,y){const b=B();if(b.busy||b.exploreStopped)return;const o=exploreObjectAt(x,y);if(o){exploreApproach(o);return;}const t=unitAt(x,y);
 if(t&&!foeHid(t)){b.info=b.info===t.id?null:t.id;refreshBattle();return;}exploreMove(x,y);
}
function exploreCmd(c){if(c==="combat"){const b=B(),t=b.units.find(u=>u.id===b.info&&u.side==="foe"&&!u.fled&&!u.dead)||b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.dead&&!u.down&&!foeHid(u)).sort((a,c)=>dist(exploreUnit(),a)-dist(exploreUnit(),c))[0];enterExploreCombat(t?.id,true);return;}if(c==="return"){if(B().manualCombat&&!alive("foe").length)finishExploreCombat();return;}if(c==="rest"){const b=B();if(!b.busy&&!b.exploreStopped){b.exploreRest=!b.exploreRest;refreshBattle();}return;}if(c==="resume"){const b=B();if(b.exploreStopReason!=="trap")return;b.exploreStopped=false;b.exploreStopReason=null;if(!exploreParty().length){enterExploreCombat(null,true);b.manualCombat=false;return;}if(!exploreParty().some(u=>u.id===b.leader)){b.leader=exploreParty()[0].id;b.exploreSolo=null;b.turn=b.units.findIndex(u=>u.id===b.leader);}exploreDetect();refreshBattle();return;}if(c==="close"){B().exploreObject=null;refreshBattle();return;}if(EXPLORE_ACTION_TEXT[c]){exploreInteract(c);return;}if(c==="gather")exploreGather();else if(c==="leader")exploreSetLeader();else if(c==="hide")exploreHide();}

// 互動不另開頁面：選單在原指令列，物件在 blocks，傷害仍走 hurt。
const exploreObjectAt=(x,y)=>B().def.blocks.find(o=>o.x===x&&o.y===y&&EXPLORE_OBJECTS[o.kind]&&(o.kind!=="trap"||o.found)&&!o.disarmed);
function exploreApproach(o){
 const b=B(),leader=b.units.find(u=>u.id===b.leader);if(!leader||leader.down||leader.dead)return;
 b.exploreSolo=null;b.turn=b.units.indexOf(leader);b.exploreObject=null;
 const open=()=>{if(B()===b&&!b.exploreStopped&&dist(leader,o)<=1){b.exploreObject=o;b.info=null;refreshBattle();}};
 if(dist(leader,o)<=1){open();return;}
 const paths=reachable(leader,10000),candidates=[];for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const x=o.x+dx,y=o.y+dy,p=paths.get(`${x},${y}`);if(p&&!unitAt(x,y)&&!blocked(x,y))candidates.push({x,y,n:p.length});}
 candidates.sort((a,b)=>a.n-b.n);const t=candidates[0];if(t)exploreMove(t.x,t.y,open);else{blog(EXPLORE_UI.noPath);refreshBattle();}
}
function exploreTraps(u){
 const b=B();let hit=false;for(const o of b.def.blocks.filter(o=>o.kind==="trap"&&!o.disarmed)){
  if(!o.found&&exploreParty().some(p=>dist(p,o)<=senseRange(p)&&exploreSight(p,o)&&passivePer(p)>=EXPLORE_CHECKS.trapDC)){o.found=true;blog(EXPLORE_ACTION_TEXT.foundTrap);}
  if(u&&u.side==="pc"&&!u.down&&u.x===o.x&&u.y===o.y&&!o.triggered){o.found=true;o.triggered=true;o.disarmed=true;hit=true;
   if(b.phase==='explore'){b.exploreStopped=true;b.exploreStopReason="trap";b.exploreMoveId=(b.exploreMoveId||0)+1;b.exploreGoal=null;b.exploreObject=null;b.busy=false;}else b.moveRolled=true;
   blog(EXPLORE_ACTION_TEXT.trapHit);hurt(u,rollDice(EXPLORE_CHECKS.trapDamage).total,EXPLORE_CHECKS.trapType,null);}
 }return hit;
}
function exploreInteract(action){
 const b=B(),o=b.exploreObject,u=b.units.find(u=>u.id===b.leader);if(!exploring()||b.busy||b.exploreStopped||!o||!u||u.down||u.dead||dist(u,o)>1||!EXPLORE_OBJECTS[o.kind]?.actions.includes(action))return;
 const text=EXPLORE_ACTION_TEXT;
 if(action==="door"){if(o.kind==="doorOpen"&&unitAt(o.x,o.y)){blog(text.occupied);refreshBattle();return;}o.kind=o.kind==="door"?"doorOpen":"door";}
 else if(action==="push"){const dx=Math.sign(o.x-u.x),dy=Math.sign(o.y-u.y),x=o.x+dx,y=o.y+dy;if(blocked(x,y)||unitAt(x,y)||b.def.blocks.some(q=>q!==o&&q.x===x&&q.y===y)){blog(text.blocked);refreshBattle();return;}o.x=x;o.y=y;b.exploreObject=null;}
 else if(action==="search"){o.searched=true;blog(text.searched);if(o.opened){if(!o.contents?.length)blog(text.empty);else{o.contents.forEach(it=>u.backpack.push(makeItem({...it})));o.contents=[];syncBattleBag(u);}}}
 else {if(o.kind==="chest"&&o.opened){blog(text.opened);refreshBattle();return;}
 const rule=EXPLORE_CHECKS[action];if(rule.tool&&!hasGear([u.backpackEquip,...u.backpack],rule.tool)){blog(text.needTool);refreshBattle();return;}
 const roll=d20(),value=roll+u.mods[rule.ability],ok=value>=rule.dc;blog(`${u.name}【${text[action]}】：${roll}＋${u.mods[rule.ability]}＝${value}／${rule.dc}，${ok?"OK":text.failed}`);
 if(ok){if(action==="disarm"){o.disarmed=true;b.exploreObject=null;}else{o.opened=true;o.locked=false;blog(text.opened);}}}
 exploreTraps();exploreDetect();refreshBattle();
}

function exploreAware(u,t){const range=u.side==="pc"?senseRange(u):ENEMIES[u.type].detectRange;return dist(u,t)<=range&&exploreSight(u,t)&&(!isHid(t)||passivePer(u)>=has(t,"hidden").val);}
function enterExploreCombat(targetId,manual=false){
 const b=B();if(!exploring()||b.exploreStopReason==="trap")return;const target=b.units.find(u=>u.id===targetId&&u.side==="foe"&&!u.fled&&!u.dead&&!u.down),leader=exploreUnit();
 const enemies=target?b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.dead&&!u.down&&(u.id===target.id||(target.squad!==undefined&&u.squad===target.squad))):[];
 const active=b.units.filter(u=>u.side==="pc"&&!u.dead).concat(enemies);
 // 在現身、排序以前個別記錄察覺；手動發起者知道自己要開始交戰。
 for(const u of active)u.surprised=enemies.length>0&&!(manual&&u===leader)&&!active.some(t=>t.side!==u.side&&(manual?exploreAware(u,t):b.exploreAwareness?.[u.id]?.includes(t.id)));
 b.phase="combat";b.flowEpoch=(b.flowEpoch||0)+1;b.exploreMoveId=(b.exploreMoveId||0)+1;b.exploreGoal=null;b.busy=false;b.manualCombat=manual&&!target;b.exploreObject=null;b.exploreRest=false;b.round=0;b.turn=-1;b.result=null;b.panel=null;b.mode=null;b.moveMode=false;
 for(const u of b.units){u.combatActive=active.includes(u);u.init=u.combatActive?d20()+u.mods.DEX+Math.random()*.1:-Infinity;if(u.side==="npc")u.surprised=false;}
 b.units.sort((a,c)=>c.init-a.init);blog(EXPLORE_COMBAT.start);
 snapBattle(b.id);state.battleSnap.battle=JSON.parse(JSON.stringify(b));delete state.battleSnap.battle.def._h;
 nextTurn();refreshBattle();
}
function exploreReinforcements(){
 const b=B();if(!b.explorationMap||b.phase!=="combat")return;const pcs=b.units.filter(u=>u.side==="pc"&&!u.dead&&!u.down),join=new Set();
 for(const e of b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.combatActive&&!u.dead&&!u.down))if(pcs.some(p=>exploreAware(e,p)||dist(e,p)<=EXPLORE_COMBAT.hear))join.add(e.squad===undefined?e.id:e.squad);
 for(const e of b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.combatActive&&!u.dead&&!u.down))if(join.has(e.squad===undefined?e.id:e.squad)){e.combatActive=true;e.surprised=false;e.init=d20()+e.mods.DEX+Math.random()*.1;blog(EXPLORE_COMBAT.reinforce);}
 // 只在新一輪開始重排；保留原本單位的先攻，不重擲。
 b.units.sort((a,c)=>c.init-a.init);
}
function finishExploreCombat(){const b=B();if(!b.explorationMap)return;syncLearnedState();b.units.filter(u=>u.side==="pc").forEach(syncBattleBag);b.units.forEach(u=>{u.combatActive=false;u.surprised=false;});b.panel=null;b.info=null;b.manualCombat=false;blog(EXPLORE_COMBAT.end);beginExplore();}
