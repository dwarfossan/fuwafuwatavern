// 戰士風格：連擊（大爺 10-09）：只有主要動作的普攻攻擊兩次、兩下都不打折（不帶 noMod）；
// 沒帶不觸發；招式、副手攻擊不觸發；帶「裝填」的武器不觸發；第一下打倒就不再打；敵我一致。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;
  const u=b.units.find(v=>v.id==='tiger'),e=b.units.find(v=>v.side==='foe');
  b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  const calls=[];const real=window.weaponAttack;window.weaponAttack=(a,t,o={})=>{calls.push({who:a.id,noMod:!!o.noMod,mastery:!!o.mastery});return real(a,t,o);};
  const reset=()=>{calls.length=0;e.hp=e.maxHp=999;e.dead=false;e.down=false;e.x=u.x+1;e.y=u.y;u.statuses=[];b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;};
  const basic=who=>unitSkills(who).find(s=>s.idx===0&&HAS_BASIC(s.group)&&!s.def.turnLimit);
  const run=(who,sk,t)=>{doSkillNow(who,sk,t);return calls.filter(c=>c.who===who.id).length;};
  if(!u.learned.some(n=>n.key==='double_strike'))u.learned.push({key:'double_strike',name:'連擊'});
  u.activeSkills=[];
  reset();const without=run(u,basic(u),e);
  u.activeSkills=['double_strike'];
  reset();const withIt=run(u,basic(u),e);const both=calls.map(c=>[c.noMod,c.mastery]);
  const log=B().log.slice(-12).map(l=>l.t).join('|');
  // 招式不觸發：破甲
  reset();const sunder=learnedSkillByKey('sunder');const skill=sunder?run(u,sunder,e):1;
  // 第一下打倒就停
  reset();e.hp=1;Math.random=(()=>{const m=Math.random;return ()=>0.99;})();const killed=run(u,basic(u),e);
  // 裝填武器不觸發
  const keep=u.weapon;u.weapon=makeItem(ITEMS.find(i=>i.n==='輕弩'),false,u);e.x=u.x+3;
  reset();e.x=u.x+3;const loading=run(u,basic(u),e);u.weapon=keep;
  // 敵我一致
  e.learned=[{key:'double_strike',name:'連擊'}];e.activeSkills=['double_strike'];
  reset();const t2=u;u.hp=u.maxHp=999;b.turn=b.units.indexOf(e);beginTurn(e);const foe=run(e,basic(e),u);
  window.weaponAttack=real;
  return {without,withIt,both,log,skill,killed,loading,foe};
 });
 assert.equal(r.without,1,'沒帶：普攻一次');
 assert.equal(r.withIt,2,'帶了：普攻兩次');
 assert.deepEqual(r.both,[[false,true],[false,true]],'兩下都不打折、都觸發專精');
 assert.match(r.log,/戰士風格：連擊：再攻擊一次/);
 assert.equal(r.skill,1,'招式不觸發');
 assert.equal(r.killed,1,'第一下打倒就不再打');
 assert.equal(r.loading,1,'裝填武器不觸發');
 assert.equal(r.foe,2,'敵人帶了一樣兩次');
 assert.deepEqual(errors,[]);
 console.log('✓ 連擊：主要動作普攻兩下、不打折、各自專精；沒帶／招式／裝填／打倒後不觸發；敵我一致');
}finally{await br.close();}
