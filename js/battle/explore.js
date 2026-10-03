/* 探索與戰棋共用 B()、格子尋路與四層渲染；探索用連續座標與身體碰撞。包含探索互動、原地切戰棋、小隊增援與返回探索。 */
const exploring=()=>B()?.phase==="explore";
const exploreParty=()=>CRITTERS.map(c=>B().units.find(u=>u.id===c.id)).filter(u=>u&&!u.dead&&!u.down);
const exploreUnit=()=>B().units.find(u=>u.id===(B().exploreSolo||B().leader)&&!u.dead&&!u.down)||exploreParty()[0]||B().units.find(u=>u.side==="pc");
function beginExplore(){
 const b=B();b.explorationMap=true;b.phase="explore";b.groundClockAt=Date.now();b.flowEpoch=(b.flowEpoch||0)+1;b.exploreStopReason=null;b.exploreObject=null;b.exploreRest=false;b.worldObject=null;b.objectTip=null;b.leader=b.leader||"fox";if(!exploreParty().some(u=>u.id===b.leader))b.leader=exploreParty()[0]?.id||"fox";b.exploreSolo=null;b.exploreStopped=false;b.exploreMarks={};b.exploreSneak=false;
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
function exploreSight(a,t){return canSeeInLight(a,t);}
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
// 探索位置是真實小數座標；格子僅作尋路與地形查詢，並非角色佔位。
const EXPLORE_SPEED=4; // 暫定 GPT：每秒四格，草叢／爬升仍依原移動成本減速。
function explorePositionClear(u,x,y,units=true){
 const b=B();if(x<0||y<0||x>b.def.w-1||y>b.def.h-1)return false;
 if(b.def.blocks.some(o=>TERRAIN[o.kind]?.solid&&Math.abs(o.x-x)<.62&&Math.abs(o.y-y)<.62))return false;
 return !units||!b.units.some(v=>v!==u&&!v.dead&&!v.fled&&Math.hypot(v.x-x,v.y-y)<(u.side==="pc"&&v===exploreUnit()&&u!==v ? .85 : .55));
}
function exploreSegmentClear(u,a,t,units=true){
 const n=Math.max(1,Math.ceil(Math.hypot(t.x-a.x,t.y-a.y)*20));
 for(let i=1;i<=n;i++)if(!explorePositionClear(u,a.x+(t.x-a.x)*i/n,a.y+(t.y-a.y)*i/n,units))return false;
 return true;
}
function exploreMove(x,y,done){
 const b=B(),u=exploreUnit();if(!exploring()||b.busy||b.exploreStopped||!u||u.down||u.dead||blocked(x,y)||has(u,"paralyzed"))return;
 const gx=Math.round(x),gy=Math.round(y),same=mapCell(u.x)===gx&&mapCell(u.y)===gy;
 const path=same?[]:explorePath(u,gx,gy);if(!path){blog(EXPLORE_UI.noPath);refreshBattle();return;}
 if(has(u,"prone")&&!hasVia(u,"prone","ground")){u.statuses=u.statuses.filter(s=>s.k!=="prone");blog(`${u.name}爬起來。`);}
 const route=path.map(p=>({...p}));
 if(route.length&&(u.x!==Math.round(u.x)||u.y!==Math.round(u.y))&&!exploreSegmentClear(u,u,route[0],false))route.unshift({x:Math.round(u.x),y:Math.round(u.y)});
 if(x!==gx||y!==gy)route.push({x,y});else if(!route.length)route.push({x,y});
 const moveId=b.exploreMoveId=(b.exploreMoveId||0)+1,epoch=b.flowEpoch;
 b.exploreIceTried={};b.busy=true;b.info=null;b.exploreSteps=0;b.exploreGoal={x:gx,y:gy,id:u.id};
 const followers=b.exploreSolo?[]:exploreParty().filter(v=>v!==u);
 let index=0,last=performance.now(),segment=null;
 const valid=()=>B()===b&&exploring()&&b.flowEpoch===epoch&&b.exploreMoveId===moveId;
 function stop(ok=false){[u,...followers].forEach(v=>delete v.exploreWalking);b.busy=false;b.exploreGoal=null;refreshBattle();if(ok)done?.();}
 function frame(now){
  if(!valid()){[u,...followers].forEach(v=>delete v.exploreWalking);if(B()===b)refreshBattle();return;}
  if(b.exploreStopped||u.dead||u.down){stop();return;}
  const dt=Math.min(.035,(now-last)/1000);last=now;
  if(!segment){
   if(index>=route.length){stop(true);return;}
   const old=[{x:u.x,y:u.y},...followers.map(v=>({x:v.x,y:v.y}))],target=route[index++];
   segment=[{v:u,target}];
   followers.forEach((v,i)=>{if(has(v,"paralyzed")||has(v,"prone"))return;const t=old[i];
    if(exploreSegmentClear(v,v,t,false))segment.push({v,target:t});
    else {const fp=explorePath(v,Math.round(t.x),Math.round(t.y));if(fp?.length)segment.push({v,target:fp[0]});}});
  }
  let moved=false,remaining=false;
  // 尾端先移，讓隊伍能一起走，也不會踩到前一隻的身體。
  for(const m of [...segment].reverse()){
   const v=m.v;if(v.dead||v.down)continue;const dx=m.target.x-v.x,dy=m.target.y-v.y,d=Math.hypot(dx,dy);
   if(d<.00001){delete v.exploreWalking;continue;}
   const speed=EXPLORE_SPEED/stepCost(mapCell(v.x),mapCell(v.y),Math.round(m.target.x),Math.round(m.target.y));
   const travel=Math.min(d,speed*dt),t={x:v.x+dx/d*travel,y:v.y+dy/d*travel};
   if(!exploreSegmentClear(v,v,t)){remaining=true;continue;}
   const prev={x:mapCell(v.x),y:mapCell(v.y)};v.x=travel===d?m.target.x:t.x;v.y=travel===d?m.target.y:t.y;v.exploreWalking=true;
   if(dx-dy)v.face=dx-dy>0?1:-1;moved=true;remaining ||= travel<d;
   if(prev.x!==mapCell(v.x)||prev.y!==mapCell(v.y)){
    if(v===u)b.exploreSteps++;sfx("step");
    if(!groundEnter(v,{})||exploreTraps(v)){stop();return;}
    if(pickUp(v))b.pickedUp=true;checkExposure();
   }
  }
  // 視野與距離直接讀連續座標，跨格以外也可能進入偵測範圍。
  exploreDetect();if(!valid()){[u,...followers].forEach(v=>delete v.exploreWalking);refreshBattle();return;}
  const lead=segment[0],leaderDone=Math.hypot(lead.target.x-u.x,lead.target.y-u.y)<.00001;
  if(!moved&&remaining&&!leaderDone){blog(EXPLORE_UI.blocked);stop();return;}
  if(leaderDone)segment=null;
  if(!touches.size&&!onScreen(u))centerCam(u.x,u.y-1,true);
  refreshBattle();requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
function exploreClick(x,y){const b=B();if(b.busy||b.exploreStopped)return;if(b.mode?.key==="placeBarrel"){placeBarrel(Math.round(x),Math.round(y));return;}const o=exploreObjectAt(Math.round(x),Math.round(y));if(o){exploreApproach(o);return;}const t=unitAt(x,y);
 if(t&&!foeHid(t)){b.info=b.info===t.id?null:t.id;refreshBattle();return;}exploreMove(x,y);
}
function exploreCmd(c){if(c==="place"){beginBarrelPlacement();return;}if(c==="cancelPlace"){B().mode=null;refreshBattle();return;}if(c==="combat"){enterExploreCombat(null,true);return;}if(c==="return"){if(B().manualCombat&&!alive("foe").length)finishExploreCombat();return;}if(c==="rest"){const b=B();if(!b.busy&&!b.exploreStopped){b.exploreRest=!b.exploreRest;refreshBattle();}return;}if(c==="resume"){const b=B();if(b.exploreStopReason!=="trap")return;b.exploreStopped=false;b.exploreStopReason=null;if(!exploreParty().length){enterExploreCombat(null,true);b.manualCombat=false;return;}if(!exploreParty().some(u=>u.id===b.leader)){b.leader=exploreParty()[0].id;b.exploreSolo=null;b.turn=b.units.findIndex(u=>u.id===b.leader);}exploreDetect();refreshBattle();return;}if(c==="close"){B().exploreObject=null;refreshBattle();return;}if(EXPLORE_ACTION_TEXT[c]){exploreInteract(c);return;}if(c==="gather")exploreGather();else if(c==="leader")exploreSetLeader();else if(c==="hide")exploreHide();}

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
  if(u&&u.side==="pc"&&!u.down&&mapCell(u.x)===o.x&&mapCell(u.y)===o.y&&!o.triggered){o.found=true;o.triggered=true;o.disarmed=true;hit=true;
   if(b.phase==='explore'){b.exploreStopped=true;b.exploreStopReason="trap";b.exploreMoveId=(b.exploreMoveId||0)+1;b.exploreGoal=null;b.exploreObject=null;b.busy=false;}else b.moveRolled=true;
   blog(EXPLORE_ACTION_TEXT.trapHit);hurt(u,rollDice(EXPLORE_CHECKS.trapDamage).total,EXPLORE_CHECKS.trapType,null);}
 }return hit;
}
function exploreInteract(action){
 const b=B(),o=b.exploreObject,u=b.units.find(u=>u.id===b.leader);if(!exploring()||b.busy||b.exploreStopped||!o||!u||u.down||u.dead||dist(u,o)>1||!EXPLORE_OBJECTS[o.kind]?.actions.includes(action))return;
 if(action==="pickup"){pickupBarrel(o,u);return;}
 const text=EXPLORE_ACTION_TEXT;
 if(action==="door"){if(o.kind==="doorOpen"&&unitAt(o.x,o.y)){blog(text.occupied);refreshBattle();return;}o.kind=o.kind==="door"?"doorOpen":"door";}
 else if(action==="push"){const dx=Math.sign(o.x-mapCell(u.x)),dy=Math.sign(o.y-mapCell(u.y)),x=o.x+dx,y=o.y+dy;if(blocked(x,y)||unitAt(x,y)||b.def.blocks.some(q=>q!==o&&q.x===x&&q.y===y)){blog(text.blocked);refreshBattle();return;}o.x=x;o.y=y;b.exploreObject=null;if(o.kind==="powderBarrel"&&groundAt(x,y)?.kind==="fire")explodeBarrel(o,u);}
 else if(action==="search"){o.searched=true;blog(text.searched);if(o.opened){if(!o.contents?.length)blog(text.empty);else{o.contents.forEach(it=>u.backpack.push(makeItem({...it})));o.contents=[];syncBattleBag(u);}}}
 else {if(o.kind==="chest"&&o.opened){blog(text.opened);refreshBattle();return;}
 const rule=EXPLORE_CHECKS[action];if(rule.tool&&!hasGear([u.backpackEquip,...u.backpack],rule.tool)){blog(text.needTool);refreshBattle();return;}
 const roll=d20(),value=roll+u.mods[rule.ability],ok=value>=rule.dc;blog(`${u.name}【${text[action]}】：${roll}＋${u.mods[rule.ability]}＝${value}／${rule.dc}，${ok?"OK":text.failed}`);
 if(ok){if(action==="disarm"){o.disarmed=true;b.exploreObject=null;}else{o.opened=true;o.locked=false;blog(text.opened);}}}
 exploreTraps();exploreDetect();refreshBattle();
}

function exploreAware(u,t){const range=u.side==="pc"?senseRange(u):ENEMIES[u.type].detectRange;return dist(u,t)<=range&&exploreSight(u,t)&&(!isHid(t)||passivePer(u)>=has(t,"hidden").val);}
// 就近對齊所有單位；限制同高度、原地面種類且線段不能穿障礙，不給額外移動利益。
function exploreAlignmentClear(u,t){
 if(!exploreSegmentClear(u,u,t,false))return false;
 const kind=groundAt(u.x,u.y)?.kind,cx=Math.round(u.x),cy=Math.round(u.y);
 const n=Math.max(1,Math.ceil(Math.hypot(t.x-u.x,t.y-u.y)*20));
 for(let i=1;i<=n;i++){const x=Math.round(u.x+(t.x-u.x)*i/n),y=Math.round(u.y+(t.y-u.y)*i/n);
  if(hAt(x,y)!==hAt(u.x,u.y)||groundAt(x,y)?.kind!==kind||B().def.blocks.some(o=>o.x===x&&o.y===y&&((o.kind==="trap"&&!o.disarmed)||(o.kind==="poisonSwamp"&&(x!==cx||y!==cy)))))return false;
 }return true;
}
function exploreAlignCombat(){
 const b=B(),units=b.units.filter(u=>!u.dead&&!u.fled),used=new Set(),positions=[];
 const candidates=units.map(u=>{const out=[],cx=Math.round(u.x),cy=Math.round(u.y),kind=groundAt(u.x,u.y)?.kind;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const x=cx+dx,y=cy+dy;
   if(blocked(x,y)||hAt(x,y)!==hAt(u.x,u.y)||groundAt(x,y)?.kind!==kind||
    b.def.blocks.some(o=>o.x===x&&o.y===y&&((o.kind==="trap"&&!o.disarmed)||(o.kind==="poisonSwamp"&&(x!==cx||y!==cy))))||
    !exploreAlignmentClear(u,{x,y}))continue;
   out.push({x,y,d:Math.hypot(x-u.x,y-u.y)});
  }return out.sort((a,c)=>a.d-c.d);});
 const order=units.map((u,i)=>i).sort((a,c)=>candidates[a].length-candidates[c].length);
 function assign(n){if(n===order.length)return true;const i=order[n];for(const p of candidates[i]){const k=`${p.x},${p.y}`;if(used.has(k))continue;used.add(k);positions[i]=p;if(assign(n+1))return true;used.delete(k);}return false;}
 if(!assign(0)){b.exploreMoveId=(b.exploreMoveId||0)+1;b.busy=false;b.exploreGoal=null;b.exploreStopped=false;blog(EXPLORE_UI.alignmentBlocked);refreshBattle();return false;}
 units.forEach((u,i)=>{u.x=positions[i].x;u.y=positions[i].y;delete u.exploreWalking;});return true;
}
function enterExploreCombat(targetId,manual=false){
 const b=B();if(!exploring()||b.exploreStopReason==="trap")return;const target=b.units.find(u=>u.id===targetId&&u.side==="foe"&&!u.fled&&!u.dead&&!u.down),leader=exploreUnit();
 const enemies=target?b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.dead&&!u.down&&(u.id===target.id||(target.squad!==undefined&&u.squad===target.squad))):[];
 const active=b.units.filter(u=>u.side==="pc"&&!u.dead).concat(enemies);
 // 在現身、排序以前個別記錄察覺；手動發起者知道自己要開始交戰。
 for(const u of active)u.surprised=enemies.length>0&&!(manual&&u===leader)&&!active.some(t=>t.side!==u.side&&(manual?exploreAware(u,t):b.exploreAwareness?.[u.id]?.includes(t.id)));
 if(!exploreAlignCombat())return;
 b.phase="combat";b.flowEpoch=(b.flowEpoch||0)+1;b.exploreMoveId=(b.exploreMoveId||0)+1;b.exploreGoal=null;b.busy=false;b.manualCombat=manual&&!target;b.exploreObject=null;b.exploreRest=false;b.round=0;b.turn=-1;b.result=null;b.panel=null;b.mode=null;b.moveMode=false;
 for(const u of b.units){u.combatActive=active.includes(u);u.init=u.combatActive?d20()+u.mods.DEX+Math.random()*.1:-Infinity;if(u.side==="npc")u.surprised=false;}
 b.units.sort((a,c)=>c.init-a.init);blog(EXPLORE_COMBAT.start);
 snapBattle(b.id);state.battleSnap.battle=JSON.parse(JSON.stringify(b));delete state.battleSnap.battle.def._h;
 nextTurn();refreshBattle();
}
function exploreReinforcements(){
 const b=B();if(!b.explorationMap||b.phase!=="combat")return;const pcs=b.units.filter(u=>u.side==="pc"&&!u.dead&&!u.down),join=new Set();
 for(const e of b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.combatActive&&!u.dead&&!u.down))if(pcs.some(p=>exploreAware(e,p)||(!b.manualCombat&&dist(e,p)<=EXPLORE_COMBAT.hear)))join.add(e.squad===undefined?e.id:e.squad);
 for(const e of b.units.filter(u=>u.side==="foe"&&!u.fled&&!u.combatActive&&!u.dead&&!u.down))if(join.has(e.squad===undefined?e.id:e.squad)){e.combatActive=true;e.surprised=false;e.init=d20()+e.mods.DEX+Math.random()*.1;blog(EXPLORE_COMBAT.reinforce);}
 if(join.size)b.manualCombat=false;
 // 只在新一輪開始重排；保留原本單位的先攻，不重擲。
 b.units.sort((a,c)=>c.init-a.init);
}
function finishExploreCombat(){const b=B();if(!b.explorationMap)return;syncLearnedState();b.units.filter(u=>u.side==="pc").forEach(syncBattleBag);b.units.forEach(u=>{u.combatActive=false;u.surprised=false;});b.panel=null;b.info=null;b.manualCombat=false;blog(EXPLORE_COMBAT.end);beginExplore();}

// 手動戰棋只是回合模式；被看到或主動攻擊才把敵方小隊加入先攻。
function engageExploreSquad(target,attacker=null){
 const b=B();if(!b.explorationMap||b.phase!=="combat"||!target||target.side!=="foe"||target.dead||target.down||target.fled)return;
 const squad=b.units.filter(e=>e.side==="foe"&&!e.dead&&!e.down&&!e.fled&&!e.combatActive&&(e===target||(target.squad!==undefined&&e.squad===target.squad)));
 for(const e of squad){e.surprised=!!attacker&&!exploreAware(e,attacker);e.combatActive=true;e.init=d20()+e.mods.DEX+Math.random()*.1;}
 if(squad.length){b.manualCombat=false;blog(EXPLORE_COMBAT.reinforce);}
 // 不在當前動作中重排，下一輪統一排序，保留目前行動者與先攻。
}
function detectTurnEnemies(){const b=B();if(!b.explorationMap||b.phase!=="combat")return;
 const pcs=b.units.filter(u=>u.side==="pc"&&!u.dead&&!u.down);
 for(const e of b.units.filter(u=>u.side==="foe"&&!u.combatActive&&!u.dead&&!u.down&&!u.fled))if(pcs.some(p=>exploreAware(e,p)))engageExploreSquad(e);
}
