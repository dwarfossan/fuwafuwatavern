// 俠盜風格（大爺 10-09）：
// 偷襲：武器攻擊命中、目標 1 格內有隊友 → 多 ceil(等級/2)d6，每回合一次；沒隊友、沒帶不加；敵我一致
// 狡詐：每回合一次，衝刺／撤離／潛行改花免費動作（主要動作還在）；第二次照常花主要動作；按鈕顯示「狡詐：免費動作」
// 瞄準：還沒移動才能宣告；移動歸零；第一次攻擊優勢、第二次沒有；移動過就不能宣告；按鈕在走位選單
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.tut=-1;
  const U=id=>b.units.find(v=>v.id===id),u=U('raccoon'),ally=U('tiger'),e=b.units.find(v=>v.side==='foe');
  b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  const learn=(who,...keys)=>{for(const k of keys)if(!who.learned.some(n=>n.key===k))who.learned.push({key:k,name:k});who.activeSkills=keys;};
  const real=Math.random;const out={};
  const start=who=>{b.turn=b.units.indexOf(who);beginTurn(who);b.busy=false;b.actionUsed=false;b.freeUsed=0;b.movedThisTurn=false;b.moveLeft=b.baseMove=6;};
  const place=()=>{[u,ally].forEach(v=>{v.statuses=[];v.down=false;});e.statuses=[];e.hp=e.maxHp=999;e.dead=false;e.down=false;u.x=10;u.y=10;e.x=11;e.y=10;ally.x=12;ally.y=10;};
  const sneakLog=n=>B().log.slice(n).some(l=>/偷襲：隊友在旁邊牽制/.test(l.t));
  // 偷襲
  learn(u,'sneak_attack');place();start(u);u.level=3;Math.random=()=>0.9;
  let n=B().log.length;weaponAttack(u,e,{});out.sneak=sneakLog(n);out.dice=B().log.slice(n).find(l=>/偷襲/.test(l.t))?.t.match(/多 (\d)d6/)?.[1];
  n=B().log.length;weaponAttack(u,e,{});out.sneakTwice=sneakLog(n);
  start(u);ally.x=13;n=B().log.length;weaponAttack(u,e,{});out.noAlly=sneakLog(n);
  learn(u);place();start(u);n=B().log.length;weaponAttack(u,e,{});out.notCarried=sneakLog(n);
  e.learned=[{key:'sneak_attack',name:'偷襲'}];e.activeSkills=['sneak_attack'];const f2=b.units.find(v=>v.side==='foe'&&v!==e);f2.dead=false;f2.down=false;f2.x=u.x;f2.y=u.y+1;
  ally.hp=ally.maxHp=999;start(e);n=B().log.length;weaponAttack(e,u,{});out.foe=sneakLog(n);f2.dead=true;e.learned=[];e.activeSkills=[];
  Math.random=real;
  // 狡詐
  learn(u,'cunning_action');place();start(u);
  battleCmd('disengage');out.cunning1={action:B().actionUsed,free:B().freeUsed,dis:!!has(u,'disengage')};
  battleCmd('dash');out.cunning2={action:B().actionUsed,free:B().freeUsed};
  learn(u);start(u);battleCmd('dash');out.noCunning={action:B().actionUsed,free:B().freeUsed};
  learn(u,'cunning_action');start(u);b.menu='move';refreshBattle();
  // 瞄準
  learn(u,'aim');place();start(u);
  out.aimMenu=null;
  battleCmd('aim');out.aim={move:B().moveLeft,status:!!has(u,'aiming'),action:B().actionUsed};
  const adv=[];const ar=window.attackRoll;window.attackRoll=(a,t,o)=>{const before=!!has(a,'aiming');const res=ar(a,t,o);adv.push(before&&!has(a,'aiming'));return res;};
  weaponAttack(u,e,{});weaponAttack(u,e,{});window.attackRoll=ar;out.aimUsed=adv;
  start(u);b.movedThisTurn=true;out.aimAfterMove=aimReady(u);
  learn(u);start(u);out.aimNotCarried=aimReady(u);
  return out;
 });
 assert.equal(r.sneak,true,'偷襲：隊友在旁加傷');assert.equal(r.dice,'2','3 級 2d6');
 assert.equal(r.sneakTwice,false,'每回合一次');assert.equal(r.noAlly,false,'沒隊友不加');assert.equal(r.notCarried,false,'沒帶不加');assert.equal(r.foe,true,'敵人一樣');
 assert.deepEqual(r.cunning1,{action:false,free:1,dis:true},'狡詐：撤離花免費動作');
 assert.deepEqual(r.cunning2,{action:true,free:1},'第二次花主要動作');
 assert.deepEqual(r.noCunning,{action:true,free:0},'沒帶照舊花主要動作');
 assert.deepEqual(r.aim,{move:0,status:true,action:false},'瞄準：移動歸零、不花動作');
 assert.deepEqual(r.aimUsed,[true,false],'第一次攻擊用掉瞄準');
 assert.equal(r.aimAfterMove,false,'移動過不能瞄準');assert.equal(r.aimNotCarried,false,'沒帶不能瞄準');
 assert.deepEqual(errors,[]);
 console.log('✓ 俠盜風格：偷襲（隊友牽制、等級骰數、每回合一次、敵我一致）、狡詐（免費動作每回合一次）、瞄準（放棄移動、第一次攻擊優勢）');
}finally{await br.close();}
