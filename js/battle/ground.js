/* 共用地面反應：B().groundEffects，原場景層；數值與圖形暫定 GPT。
   探索毫秒／戰棋每輪 6000ms。選單、提示、背景不走探索時鐘。 */
const GROUND_RULES={fire:{ms:18000},ice:{ms:18000,dc:13},charged:{ms:6000},steam:{ms:6000}};
const groundAt=(x,y)=>B()?.groundEffects?.[`${x},${y}`];
const GROUND_REACTIONS={bush:{火焰:'fire'},oil:{火焰:'fire'},water:{火焰:'steam',寒冷:'ice',閃電:'charged'},ice:{火焰:'steam'}};
function groundReaction(x,y,type){const b=B(),o=b?.def.blocks.find(o=>o.x===x&&o.y===y),old=groundAt(x,y);return GROUND_REACTIONS[old?.kind==='ice'?'ice':o?.kind]?.[type];}
const groundCanReact=(x,y,type)=>!!groundReaction(x,y,type);
function groundReact(x,y,type){
 const b=B(),o=b.def.blocks.find(o=>o.x===x&&o.y===y),kind=groundReaction(x,y,type);
 if(!kind)return false;
 (b.groundEffects ||= {})[`${x},${y}`]={x,y,kind,left:GROUND_RULES[kind].ms};
 if(o?.kind==='oil')o.found=true;
 b.units.filter(u=>!u.dead&&!u.down&&u.x===x&&u.y===y).forEach(u=>groundEnter(u,{iceTried:true}));
 blog(`地面反應：${{fire:'燃燒',ice:'結冰',charged:'帶電水面',steam:'蒸氣'}[kind]}`,'skill');refreshBattle();return true;
}
function groundStopMove(u){
 const b=B();if(u===cur())b.moveRolled=true;
 if(b.phase==='explore'){b.exploreMoveId=(b.exploreMoveId||0)+1;b.busy=false;b.exploreGoal=null;}
}
// 地面狀態共用進入／解除豁免，地面本身的秒／輪期限不受影響。
const GROUND_STATUS_RULES={burning:{stat:'DEX',dc:13},paralyzed:{stat:'CON',dc:13},prone:{stat:'DEX',dc:13},poisoned:{stat:'CON',dc:13}};
function groundStatusRoll(u,k,dc){const r=GROUND_STATUS_RULES[k];panelStart(`${u.name}【${STATUS_NAME[k]}豁免】`);const ok=saveRoll(u,r.stat,dc);panelEnd();return ok;}
function groundAfflict(u,k,dc=GROUND_STATUS_RULES[k].dc){
 if(u.dead||has(u,k))return false;
 if(groundStatusRoll(u,k,dc))return false;
 if(k==='prone'){knockProne(u);Object.assign(has(u,k),{via:'ground',dc});}
 else addStatus(u,k,{via:'ground',dc});
 blog(`${u.name}地面豁免失敗，${STATUS_NAME[k]}！`,'skill');return true;
}
function groundStatusSave(u){
 let attempted=poisonSave(u);if(u.dead)return attempted;
 for(const s of [...u.statuses])if(s.via==='ground'&&s.k!=='poisoned'&&GROUND_STATUS_RULES[s.k]){
  attempted=true;if(groundStatusRoll(u,s.k,s.dc??GROUND_STATUS_RULES[s.k].dc)){
   u.statuses=u.statuses.filter(x=>x!==s);blog(`${u.name}豁免成功，解除${STATUS_NAME[s.k]}。`,'skill');
  }
 }
 return attempted;
}
function groundPoison(u){const o=B().def.blocks.find(o=>o.x===u.x&&o.y===u.y&&o.kind==='poisonSwamp');return o?groundAfflict(u,'poisoned',o.dc??13):false;}
function groundEnter(u,move={}){
 groundPoison(u);
 const b=B(),fx=groundAt(u.x,u.y);if(!fx)return true;
 if(fx.kind==='fire')groundAfflict(u,'burning');
 if(fx.kind==='charged'){groundAfflict(u,'paralyzed');if(has(u,'paralyzed')){groundStopMove(u);return false;}}
 if(b.phase==='explore'){b.exploreIceTried ||= {};move.iceTried ||= !!b.exploreIceTried[u.id];}
 if(fx.kind==='ice'&&!move.iceTried){move.iceTried=true;if(b.phase==='explore')b.exploreIceTried[u.id]=true;if(groundAfflict(u,'prone',GROUND_RULES.ice.dc)){groundStopMove(u);blog(`${u.name}滑倒，停止這次移動。`,'skill');return false;}}
 return true;
}
function groundAdvance(ms,combat=false){
 const b=B();if(!b)return;let changed=false;
 const existing=Object.values(b.groundEffects||{}),spread=[];
 // 只以本輪開始時已存在的火蔓延一次，不能同一輪一路燒穿地圖。
 if(combat)for(const f of existing)if(f.kind==='fire')for(const o of b.def.blocks)if(o.kind==='bush'&&Math.max(Math.abs(o.x-f.x),Math.abs(o.y-f.y))===1&&!groundAt(o.x,o.y))spread.push(o);
 for(const f of existing){f.left-=ms;if(f.left<=0){delete b.groundEffects[`${f.x},${f.y}`];changed=true;}}
 if(!combat){
  b.groundPulse=(b.groundPulse||0)+ms;
  while(b.groundPulse>=6000){b.groundPulse-=6000;for(const u of b.units)if(!u.dead){
   groundPoison(u);if(poisonDamage(u))changed=true;
   if(!u.dead&&!u.down&&has(u,'burning')){hurt(u,rollDice('1d4').total,'火焰',null);changed=true;}
   if(groundStatusSave(u))changed=true;
  }
   // 探索的六秒也算一次地面蔓延；沒有角色回合或行動次數。
   for(const f of Object.values(b.groundEffects||{}))if(f.kind==='fire')for(const o of b.def.blocks)if(o.kind==='bush'&&Math.max(Math.abs(o.x-f.x),Math.abs(o.y-f.y))===1&&!groundAt(o.x,o.y))spread.push(o);
  }
 }
 for(const o of spread)if(!groundAt(o.x,o.y))groundReact(o.x,o.y,'火焰');
 if(changed){if(b.phase==="explore"&&!alive("pc").length){enterExploreCombat(null,true);b.manualCombat=false;}else if(b.phase==="combat")checkResult();refreshBattle();}
}
function groundClockPaused(){const b=B();return !b||b.phase!=='explore'||document.hidden||state.modal||b.info||b.sysPop||b.exploreRest||b.exploreObject||b.exploreStopped;}
function groundClock(now=Date.now()){
 const b=B();if(!b)return;const old=b.groundClockAt;b.groundClockAt=now;if(old==null||groundClockPaused())return;groundAdvance(Math.max(0,now-old));
}
setInterval(()=>groundClock(),200);
document.addEventListener('visibilitychange',()=>{if(B())B().groundClockAt=Date.now();});
function groundKnown(u){
 groundDetect(u);const b=B();u.knownGround ||= [];const range=ENEMIES[u.type]?.detectRange||senseRange(u);
 for(const f of [...Object.values(b.groundEffects||{}),...b.def.blocks.filter(o=>o.kind==='poisonSwamp')])if(f.kind!=='steam'&&dist(u,f)<=range&&coverOf(u,f).v<.75&&!u.knownGround.includes(`${f.x},${f.y}`))u.knownGround.push(`${f.x},${f.y}`);
}
function groundAvoid(u,x,y){
 if(u.side!=='foe')return false;const f=groundAt(x,y)||B().def.blocks.find(o=>o.x===x&&o.y===y&&o.kind==='poisonSwamp');if(!f||f.kind==='steam'||!u.knownGround?.includes(`${x},${y}`))return false;
 return !(f.kind==='fire'&&u.damageImmunities?.includes('火焰'));
}
function groundEffectSVG(f){
 const p=iso(f.x,f.y),cx=p.x,cy=p.y+TH/2,ink='#2a2630';
 const colors={fire:'#f49d43',ice:'#9ddde9',charged:'#8bc6d9',steam:'#dedde2'};
 let art=`<polygon points="${diamond(f.x,f.y)}" fill="${colors[f.kind]}" opacity=".7" stroke="${ink}" stroke-width="2"/>`;
 if(f.kind==='fire')art+=`<path d="M${cx-18} ${cy+6} Q${cx-32} ${cy-7} ${cx-9} ${cy-26} L${cx-7} ${cy-9} L${cx+5} ${cy-36} Q${cx+34} ${cy-6} ${cx+17} ${cy+7} Z" fill="#ee6945" stroke="${ink}" stroke-width="3"/>`;
 if(f.kind==='ice')art+=`<path d="M${cx-30} ${cy} L${cx+24} ${cy-8} M${cx-15} ${cy+8} L${cx+10} ${cy-5}" stroke="white" stroke-width="4"/>`;
 if(f.kind==='charged')art+=`<path d="M${cx+8} ${cy-19} L${cx-12} ${cy+1} L${cx+3} ${cy+1} L${cx-8} ${cy+18}" fill="none" stroke="#fff49b" stroke-width="5"/>`;
 if(f.kind==='steam')art+=`<path d="M${cx-24} ${cy+3} C${cx-52} ${cy-13} ${cx-15} ${cy-25} ${cx-7} ${cy-18} C${cx-7} ${cy-42} ${cx+28} ${cy-41} ${cx+25} ${cy-19} C${cx+57} ${cy-20} ${cx+48} ${cy+8} ${cx+21} ${cy+6} Z" fill="#dedde2" opacity=".75" stroke="${ink}" stroke-width="2"/>`;
 return `<g class="ground-effect" data-ground="${f.kind}" data-tile="${f.x},${f.y}">${art}</g>`;
}

// 隱藏油：每個觀察者各自知道；只有我方察覺才揭露畫面。DC13 暫定 GPT。
function groundDetect(u,total=passivePer(u),range=u.side==='foe'?(ENEMIES[u.type]?.detectRange??senseRange(u)):senseRange(u)){
 if(u.dead||u.down||u.side==='npc')return 0;u.knownGround ||= [];let count=0;
 for(const o of B().def.blocks.filter(o=>o.kind==='oil')){const key=`${o.x},${o.y}`;if(u.knownGround.includes(key)||dist(u,o)>range||coverOf(u,o).v>=.75||total<(o.dc??13))continue;
 u.knownGround.push(key);count++;if(u.side==='pc'&&!o.found){o.found=true;blog(`${u.name}察覺草叢底下的油。`,'skill');}}return count;
}
