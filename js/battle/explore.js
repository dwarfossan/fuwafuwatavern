/* 探索與戰棋共用 B()、尋路、walk 與四層渲染。v1 發現後只停，不開戰。 */
const exploring=()=>B()?.phase==="explore";
const exploreParty=()=>CRITTERS.map(c=>B().units.find(u=>u.id===c.id)).filter(u=>u&&!u.dead&&!u.down);
const exploreUnit=()=>B().units.find(u=>u.id===(B().exploreSolo||B().leader))||exploreParty()[0];
function beginExplore(){
 const b=B();b.phase="explore";b.leader=b.leader||"fox";b.exploreSolo=null;b.exploreStopped=false;b.exploreMarks={};b.exploreSneak=false;
 b.turn=b.units.findIndex(u=>u.id===b.leader);b.busy=false;b.mode=null;b.moveMode=false;b.menu=null;b.tut=-1;b.result=null;b.round=0;
 exploreDetect();refreshBattle();
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
 const pcs=exploreParty(),foes=b.units.filter(u=>u.side==="foe"&&!u.dead&&!u.down);b.exploreMarks={};
 // 我方也用同一條遮擋檢查；察覺範圍沿用移動格數、比較被動感知。
 for(const p of pcs)for(const e of foes)if(isHid(e)&&dist(p,e)<=senseRange(p)&&exploreSight(p,e)&&passivePer(p)>=has(e,"hidden").val)exploreReveal(e,p);
 for(const p of pcs){let alert=0;for(const e of foes){const range=ENEMIES[e.type].detectRange,d=dist(p,e);if(d>range+1||!exploreSight(e,p))continue;alert=Math.max(alert,1);
   if(d<=range&&(!isHid(p)||passivePer(e)>=has(p,"hidden").val)){
     alert=2;if(isHid(p))exploreReveal(p,e);if(isHid(e))reveal(e,"發現了小隊，現身！");b.exploreStopped=true;b.discoveredBy=e.id;
   }}b.exploreMarks[p.id]=alert;}
 if(b.exploreStopped)b.busy=false;
}
function explorePath(u,x,y){return reachable(u,10000).get(`${x},${y}`);}
function exploreMove(x,y){
 const b=B(),u=exploreUnit();if(b.busy||b.exploreStopped||!u||blocked(x,y))return;
 const path=explorePath(u,x,y);if(!path){blog(EXPLORE_UI.noPath);refreshBattle();return;}
 b.busy=true;b.info=null;b.exploreSteps=0;b.exploreGoal={x,y,id:u.id};
 const followers=b.exploreSolo?[]:exploreParty().filter(v=>v!==u);let i=0;
 function step(){
  if(B()!==b||!exploring())return;
  if(b.exploreStopped||(u.x===x&&u.y===y)){b.busy=false;b.exploreGoal=null;refreshBattle();return;}
  const next=explorePath(u,x,y);if(!next?.length){b.busy=false;b.exploreGoal=null;blog(EXPLORE_UI.blocked);refreshBattle();return;}
  const old=[{x:u.x,y:u.y},...followers.map(p=>({x:p.x,y:p.y}))],p=next[0];i++;
  // 隱藏單位不洩漏到尋路；實際接觸時不能重疊，停在上一格。
  const occupied=unitAt(p.x,p.y);if(occupied&&occupied!==u){b.busy=false;blog(EXPLORE_UI.blocked);refreshBattle();return;}
  walk(u,[p],()=>{
   if(b.exploreStopped){b.busy=false;refreshBattle();return;}
   let n=0;function follow(){if(b.exploreStopped||n>=followers.length){b.exploreSteps++;if(!touches.size&&!onScreen(u))centerCam(u.x,u.y-1,true);refreshBattle();later(step,140);return;}
    const f=followers[n],target=old[n++],fp=explorePath(f,target.x,target.y);if(fp?.length)walk(f,[fp[0]],follow);else follow();}
   follow();
  });
 }
 step();
}
function exploreClick(x,y){const b=B();if(b.busy||b.exploreStopped)return;const t=unitAt(x,y);
 if(t&&!foeHid(t)){b.info=b.info===t.id?null:t.id;refreshBattle();return;}exploreMove(x,y);
}
function exploreCmd(c){if(c==="gather")exploreGather();else if(c==="leader")exploreSetLeader();else if(c==="hide")exploreHide();}
