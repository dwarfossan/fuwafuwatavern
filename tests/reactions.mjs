// 反應（大爺 10-09）：自己回合沒用完的免費動作保留到敵人回合；敵人命中時暫停詢問；
// 護盾術（AC +5，可能擋下）、化險（傷害減半）、不用；同一組骰子重跑結果一致；沒保留就不問；選完敵人回合照常結束。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 // 共用前置：固定商隊戰，玲玲帶護盾術＋化險、站在一隻哥布林旁邊，其他敵人移開；骰子固定
 const setup=async(reserve,roll)=>p.evaluate(([reserve,roll])=>{
  state.page='battle';state.scout=null;startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.tut=-1;b.busy=false;
  const u=b.units.find(v=>v.id==='fox'),e=b.units.filter(v=>v.side==='foe'&&!isRanged(v)).sort((x,y)=>x.id<y.id?-1:1)[0];   // 固定同一隻近戰哥布林
  b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  for(const key of ['shield_spell','turn_danger'])if(!u.learned.some(n=>n.key===key))u.learned.push({key,name:key});
  u.activeSkills=['shield_spell','turn_danger'];u.slots=[4,2];u.statuses=[];u.hp=u.maxHp=40;u.down=false;
  u.reserveFree=reserve;e.x=u.x+1;e.y=u.y;e.statuses=[];
  b.turn=b.units.indexOf(e);window.__real=Math.random;Math.random=()=>roll;
  const sk=unitSkills(e).find(s=>s.impl&&s.impl.target==='enemy');window.__e=e.id;window.__sk=sk.key;
  window.__roll=roll;doSkill(e,sk,u);Math.random=window.__real;
  const c=B();return {pending:!!c.reactPending,hp:c.units.find(v=>v.id==='fox').hp,opts:c.reactPending?.info.opts||[]};
 },[reserve,roll]);
 // 傷害骰是回答之後才擲的（暫停在命中、擲傷害之前），回答時也固定骰子才能比較
 const answer=async(choice)=>{await p.evaluate(()=>{Math.random=()=>window.__roll;});await p.locator(`[data-react="${choice}"]`).tap();await p.evaluate(()=>{Math.random=window.__real;});await p.waitForTimeout(150);
  return p.evaluate(()=>{const u=B().units.find(v=>v.id==='fox');return {hp:u.hp,reserve:u.reserveFree,shield:!!has(u,'shieldSpell'),slots:slotsOf(u)[0],log:B().log.slice(-8).map(l=>l.t).join('|'),pending:!!B().reactPending};});};

 // 1. 有保留免費動作、被命中：暫停詢問，還沒扣血
 const s1=await setup(2,0.9);
 assert.equal(s1.pending,true,'命中時暫停');assert.equal(s1.hp,40,'選之前不扣血');assert.deepEqual(s1.opts,['shield','halve']);
 await p.screenshot({path:'/tmp/claude-0/react.png'});
 const none=await answer('none');
 assert.equal(none.pending,false);assert(none.hp<40,'不用：照常扣血');assert.equal(none.reserve,2,'不用不消耗');const full=40-none.hp;

 // 2. 化險：同一組骰子，傷害是一半
 await setup(2,0.9);const halve=await answer('halve');
 assert.equal(40-halve.hp,Math.floor(full/2),`化險：${full} → ${40-halve.hp}`);assert.equal(halve.reserve,1);assert.match(halve.log,/化險/);

 // 3. 護盾術：AC +5、花一格熟練格、保留少一個；擲 0.55（d20=12）時多半會擋下
 await setup(2,0.55);const sh=await answer('shield');
 assert.equal(sh.shield,true);assert.equal(sh.reserve,1);assert.equal(sh.slots,3);assert.match(sh.log,/護盾術/);

 // 4. 沒有保留免費動作：不問，直接打
 const s4=await setup(0,0.9);assert.equal(s4.pending,false);assert(s4.hp<40);

 // 5. 自己回合結束：沒用完的免費動作變成保留；自己回合開始清掉
 const keep=await p.evaluate(()=>{const b=B(),u=b.units.find(v=>v.id==='fox');b.turn=b.units.indexOf(u);b.freeUsed=1;b.result=null;endTurn();const r1=u.reserveFree;beginTurn(u);return [r1,u.reserveFree];});
 assert.deepEqual(keep,[1,0],'結束回合保留 1 個、回合開始清掉');

 // 6. 護盾術不能在自己回合主動放
 assert.equal(await p.evaluate(()=>turnLimitProblem(B().units.find(v=>v.id==='fox'),learnedSkillByKey('shield_spell'))),'敵人攻擊命中時才能用');

 // 7. 選完之後敵人回合照常結束（不會卡住）
 await setup(2,0.9);await answer('none');
 await p.waitForFunction(()=>{const c=cur();return !B().reactPending&&(c?.id!==window.__e||B().result);},null,{timeout:10000});

 assert.deepEqual(errors,[]);
 console.log(`✓ 反應：命中暫停詢問、不用照扣（${full}）、化險減半、護盾術 AC+5 扣格與保留、沒保留不問、回合保留與清除、護盾術不能主動放、選完敵人回合照常結束`);
}finally{await br.close();}
