/* 吐息演出入口：範圍與命中處理由呼叫者提供，尚未定義正式龍技能／數值。 */
const DRAGON_BREATH_TIMING={windup:700,flight:450,fade:450};
DOLL_DUR.breath=1600;
DOLL_IMPACT.breath=DRAGON_BREATH_TIMING.windup;
function dragonBreath(u,dir,{range,onImpact}={}){
 const b=B(),tm=DRAGON_BREATH_TIMING;
 if(!b||state.page!=='battle'||b.busy||u?.look!=='dragon'||!b.units.includes(u)||u.dead||u.down||!Number.isInteger(range)||range<1||!Number.isFinite(dir?.x)||!Number.isFinite(dir?.y)||dir.x===u.x&&dir.y===u.y)return false;
 const tiles=coneTiles(u,dir,range).filter(p=>p.x>=0&&p.y>=0&&p.x<b.def.w&&p.y<b.def.h);
 faceTo(u,dir);u.anim={k:'breath',t:Date.now()};b.busy=true;
 (b.fx ||= []).push({kind:'dragon-breath',x:u.x,y:u.y,face:u.face||1,tx:dir.x,ty:dir.y,range,t:u.anim.t+tm.windup,dur:tm.flight+tm.fade});
 later(()=>{const old=b.impact;b.impact=0;try{onImpact?.(tiles,u);}finally{b.impact=old;refreshBattle();}},tm.windup+tm.flight);
 later(()=>{b.busy=false;u.anim=null;refreshBattle();},DOLL_DUR.breath);
 refreshBattle();return true;
}
function dragonBreathSVG(f,now){
 if(now<f.t||now>=f.t+f.dur)return '';
 const a=iso(f.x,f.y),z=iso(f.tx,f.ty),dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy);
 if(!len)return '';
 const x=a.x+f.face*40,y=a.y+TH/2-67,angle=Math.atan2(dy,dx)*180/Math.PI;
 const distance=Math.max(55,len/Math.max(Math.abs(f.tx-f.x),Math.abs(f.ty-f.y))*f.range-30),spread=distance*.32;
 return `<g class="dragon-breath" transform="translate(${x} ${y}) rotate(${angle})" pointer-events="none"><g class="dragon-flame" style="animation-delay:${f.t-now}ms"><path d="M0 0 Q${distance*.4} ${-spread*.5} ${distance} ${-spread} L${distance*.88} ${-spread*.28} L${distance*1.06} 0 L${distance*.88} ${spread*.28} L${distance} ${spread} Q${distance*.4} ${spread*.5} 0 0Z" fill="#e76b42" stroke="#2a2630" stroke-width="3" stroke-linejoin="round"/><path d="M0 0 L${distance*.85} ${-spread*.38} L${distance*.72} 0 L${distance*.93} ${spread*.4} Z" fill="#f2b441"/><path d="M0 0 L${distance*.66} ${-spread*.15} L${distance*.8} ${spread*.15} Z" fill="#fff0b4"/></g></g>`;
}
