// 好運（毛球族天生，大爺 10-09）：長休後 2 顆；小傢伙攻擊沒中、豁免失敗時暫停問；重擲用新結果、扣 1 顆；
// 不用不扣；用完不再問；暫停重跑不會重複扣；長休回滿；敵人不問。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 // 骰子：第一次全擲 0（d20=1 沒中）；回答時重跑沿用同一組，重擲的新骰用 0.99（20）
 const setup=async(used)=>p.evaluate(used=>{
  state.page='battle';state.scout=null;startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.tut=-1;b.busy=false;state.luckUsed={tiger:used};
  const u=b.units.find(v=>v.id==='tiger'),e=b.units.filter(v=>v.side==='foe'&&!isRanged(v)).sort((x,y)=>x.id<y.id?-1:1)[0];
  b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  e.x=u.x+1;e.y=u.y;e.hp=e.maxHp=999;e.statuses=[];u.statuses=[];b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;
  window.__real=Math.random;Math.random=()=>0;
  const sk=unitSkills(u).find(s=>s.idx===0&&HAS_BASIC(s.group));doSkill(u,sk,e);Math.random=window.__real;
  return {pending:!!B().reactPending,luck:!!B().reactPending?.info.luck,left:B().reactPending?.info.left,hp:e.hp};
 },used);
 const answer=async c=>{await p.evaluate(()=>{Math.random=()=>0.99;});await p.locator(`[data-react="${c}"]`).tap();await p.evaluate(()=>{Math.random=window.__real;});await p.waitForTimeout(150);
  return p.evaluate(()=>{const e=B().units.filter(v=>v.side==='foe'&&!v.dead)[0];return {pending:!!B().reactPending,used:state.luckUsed.tiger||0,hp:e.hp,log:B().log.slice(-10).map(l=>l.t).join('|')};});};

 const s1=await setup(0);assert.deepEqual([s1.pending,s1.luck,s1.left,s1.hp],[true,true,2,999],'沒中：暫停問好運、還沒扣、還沒傷害');
 await p.screenshot({path:'/tmp/claude-0/luck.png'});
 const a1=await answer('luck');assert.equal(a1.pending,false);assert.equal(a1.used,1,'用了一顆');assert(a1.hp<999,'重擲命中造成傷害：'+a1.log);assert.match(a1.log,/好運骰重擲/);
 await setup(0);const a2=await answer('none');assert.equal(a2.used,0,'不用不扣');assert.equal(a2.hp,999);
 const s3=await setup(2);assert.equal(s3.pending,false,'用完不再問');
 // 暫停重跑不重複扣：連續兩次好運詢問（連擊兩下都沒中）
 const twice=await p.evaluate(()=>{
  state.page='battle';startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.tut=-1;b.busy=false;state.luckUsed={};
  const u=b.units.find(v=>v.id==='tiger'),e=b.units.filter(v=>v.side==='foe'&&!isRanged(v)).sort((x,y)=>x.id<y.id?-1:1)[0];b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  e.x=u.x+1;e.y=u.y;e.hp=e.maxHp=999;if(!u.learned.some(n=>n.key==='double_strike'))u.learned.push({key:'double_strike',name:'連擊'});u.activeSkills=['double_strike'];
  b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;Math.random=()=>0;doSkill(u,unitSkills(u).find(s=>s.idx===0&&HAS_BASIC(s.group)),e);Math.random=window.__real;return !!B().reactPending;});
 assert(twice);
 for(let k=0;k<2;k++){await p.evaluate(()=>{Math.random=()=>0;});await p.locator('[data-react="luck"]').tap();await p.evaluate(()=>{Math.random=window.__real;});await p.waitForTimeout(100);}
 assert.equal(await p.evaluate(()=>state.luckUsed.tiger),2,'兩次各扣一顆，不重複');
 assert.equal(await p.evaluate(()=>!!B().reactPending),false,'用完就不再問');
 // 豁免：敵人對小傢伙的豁免型招式失敗時也問；敵人自己失敗不問
 assert.equal(await p.evaluate(()=>{state.luckUsed={};const b=B(),e=b.units.find(v=>v.side==='foe');REACT_RUN=null;let threw=false;try{REACT_RUN={answers:[],n:0,luck:{}};Math.random=()=>0;saveRoll(e,'DEX',30);}catch(x){threw=true;}finally{Math.random=window.__real;REACT_RUN=null;}return threw;}),false,'敵人不問');
 assert.equal(await p.evaluate(()=>{state.luckUsed={};const u=B().units.find(v=>v.id==='fox');let info=null;try{REACT_RUN={answers:[],n:0,luck:{}};Math.random=()=>0;saveRoll(u,'DEX',30);}catch(x){info=x.info;}finally{Math.random=window.__real;REACT_RUN=null;}return info&&info.luck&&info.kind;}),'豁免','小傢伙豁免失敗會問');
 // 長休回滿
 assert.deepEqual(await p.evaluate(()=>{state.luckUsed={tiger:2};const b=B();b.result=null;b.phase='explore';b.exploreRest=true;b.busy=false;b.exploreStopped=false;b.reactPending=null;takeRest('long',{});return state.luckUsed;}),{},'長休回滿');
 assert.deepEqual(errors,[]);
 console.log('✓ 好運：沒中／豁免失敗暫停問、重擲用新結果扣 1 顆、不用不扣、用完不問、重跑不重複扣、敵人不問、長休回滿');
}finally{await br.close();}
