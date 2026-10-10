// 範圍法術會打到隊友（大爺 10-10，照 D&D）＋法師風格：超魔（大爺 10-09）
// 燃燒之手：錐形內的隊友也受傷、施法者自己不受；武器範圍招照舊只打敵人。
// 超魔：謹慎（隊友不受）、瞬發（不花主要動作、花 2 個免費動作）、遠距（距離加倍、觸碰變 6 格）；一次只能一種；免費動作不夠灰掉。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady,noLuck} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123&phase=combat');await bootReady(p);await noLuck(p);
 const r=await p.evaluate(()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.tut=-1;
  const U=id=>b.units.find(v=>v.id===id),u=U('fox'),ally=U('tiger'),e=b.units.find(v=>v.side==='foe');
  b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  b.units.filter(v=>v.side==='pc'&&v!==u&&v!==ally).forEach(v=>{v.x=30;v.y=30;});
  for(const k of ['burning_hands','shocking_grasp','metamagic'])if(!u.learned.some(n=>n.key===k))u.learned.push({key:k,name:k});
  u.activeSkills=['burning_hands','shocking_grasp','metamagic'];u.weapon=null;u.focus=null;u.offhand=null;u.shield=false;u.backpack=[ITEMS.find(i=>i.n==='材料包')];
  const start=()=>{b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;b.actionUsed=false;b.freeUsed=0;u.slots=[4,2];u.slotSpellUsed=false;
   [u,ally,e].forEach(v=>{v.hp=v.maxHp=999;v.dead=v.down=false;v.statuses=[];});u.x=10;u.y=10;ally.x=11;ally.y=10;e.x=12;e.y=10;b.mode=null;};
  const bh=()=>unitSkills(u).find(s=>s.key==='burning_hands'),sg=()=>unitSkills(u).find(s=>s.key==='shocking_grasp');
  const out={};
  // 沒超魔：燃燒之手打到隊友與敵人，自己不受
  start();doSkillNow(u,bh(),{x:11,y:10});out.plain={ally:ally.hp<999,foe:e.hp<999,self:u.hp===999};
  // 謹慎
  start();pickSkill('burning_hands');out.opts=metaOptions(u,bh());aimMeta('careful');out.selected=B().mode.meta;
  doSkillNow(u,bh(),{x:11,y:10});out.careful={ally:ally.hp===999,foe:e.hp<999,free:B().freeUsed,action:B().actionUsed};
  // 一次只能一種：選瞬發會換掉謹慎
  start();pickSkill('burning_hands');aimMeta('careful');aimMeta('quick');out.one=B().mode.meta;aimMeta('quick');out.toggleOff=B().mode.meta;
  // 瞬發：不花主要動作、花 2 個免費動作
  start();pickSkill('burning_hands');aimMeta('quick');doSkillNow(u,bh(),{x:11,y:10});out.quick={action:B().actionUsed,free:B().freeUsed};
  // 免費動作不夠：瞬發不能選
  start();b.freeUsed=1;pickSkill('burning_hands');aimMeta('quick');out.quickBlocked=B().mode.meta||null;aimMeta('careful');out.carefulOk=B().mode.meta;
  // 遠距：電擊術觸碰 1 格 → 6 格
  start();e.x=15;e.y=10;ally.x=30;pickSkill('shocking_grasp');out.before=!!validTarget(u,sg(),15,10);aimMeta('far');out.after=!!validTarget(u,sg(),15,10);out.range=skillRange(u,sg());
  // 沒帶超魔：沒有選項
  u.activeSkills=['burning_hands'];out.none=metaOptions(u,bh()).length;
  start();ally.x=10;ally.y=11;e.x=11;e.y=10;const cleave=learnedSkillByKey('cleave')||null;
  return out;
 });
 assert.deepEqual(r.plain,{ally:true,foe:true,self:true},'範圍法術打到隊友、不打自己');
 assert.deepEqual(r.opts,['careful','quick'],'燃燒之手可選謹慎、瞬發（錐形沒有遠距）');assert.equal(r.selected,'careful');
 assert.deepEqual(r.careful,{ally:true,foe:true,free:1,action:true},'謹慎：隊友不受、多花一個免費動作');
 assert.equal(r.one,'quick','一次只能一種');assert.equal(r.toggleOff,null,'再點一次取消');
 assert.deepEqual(r.quick,{action:false,free:2},'瞬發：不花主要動作、花 2 個免費動作');
 assert.equal(r.quickBlocked,null,'免費動作不夠不能瞬發');assert.equal(r.carefulOk,'careful');
 assert.deepEqual([r.before,r.after,r.range],[false,true,6],'遠距：觸碰變 6 格');
 assert.equal(r.none,0,'沒帶沒有選項');
 // 手機截圖：瞄準列的超魔
 await p.evaluate(()=>{const b=B(),u=b.units.find(v=>v.id==='fox');u.activeSkills=['burning_hands','shocking_grasp','metamagic'];b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;b.actionUsed=false;b.freeUsed=0;u.slots=[4,2];u.slotSpellUsed=false;pickSkill('burning_hands');aimMeta('careful');});
 await p.waitForTimeout(400);await p.screenshot({path:'/tmp/claude-0/meta.png'});
 // 折疊（大爺 10-10，跟選階同一套）：平常一行顯示選了什麼；點「＋」展開；選好收起來
 assert.equal(await p.locator('.aim-cur [data-aim="m:careful"].on').count(),1,'收起時顯示謹慎');assert.equal(await p.locator('[data-aim="m:quick"]').count(),0,'平常收起來');
 await p.locator('[data-aim="mtoggle"]').tap();
 assert.deepEqual(await p.locator('.aim-tiers [data-aim^="m:"]').evaluateAll(s=>s.map(x=>[x.dataset.aim,x.disabled,x.querySelector('small')?.textContent||''])),
  [['m:far',true,'不能加距離'],['m:quick',false,'2 免費動作'],['m:none',false,'超魔']],'展開：其他項、灰掉寫原因');
 await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/meta-open.png'});
 await p.locator('[data-aim="m:quick"]').tap();assert.equal(await p.evaluate(()=>B().mode.meta),'quick');assert.equal(await p.locator('.aim-tiers [data-aim^="m:"]').count(),0,'選好收起來');
 await p.locator('[data-aim="mtoggle"]').tap();await p.locator('[data-aim="m:none"]').tap();assert.equal(await p.evaluate(()=>B().mode.meta),null,'選不用取消');
 // 法器戲法（火焰箭這類免費戲法）：只有遠距能選，其他灰掉寫原因
 const cantrip=await p.evaluate(()=>{const u=cur();const sk={...learnedSkillByKey('shocking_grasp'),def:{...learnedSkillByKey('shocking_grasp').def,free:true}};return META_ALL.map(m=>metaReason(u,sk,m));});
 assert.deepEqual(cantrip,['限範圍法術','已是免費動作','']);
 await p.screenshot({path:'/tmp/claude-0/meta2.png'});
 assert.deepEqual(errors,[]);
 console.log('✓ 範圍法術打到隊友、不打自己；超魔：謹慎、瞬發（2 個免費動作）、遠距（觸碰 6 格）、一次一種、不夠灰掉、手機瞄準列');
}finally{await br.close();}
