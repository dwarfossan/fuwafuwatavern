// 森林主線（10-22）：公會艾妲紅 ❗ → 第一次（霧擋著溪、狼＋哥布林）→ 遇到德魯伊 → 第二次（霧散、食人花、調查花粉線索）→ 撞見 → 奇美拉（花粉讓牠睡一回合、火焰抗性）→ ★★★ → 回公會報告 → 之後只有野獸
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {noLuck} from './boot.mjs';
const shot=process.env.SHOT_DIR?(p,n)=>p.screenshot({path:path.join(process.env.SHOT_DIR,n)}):async()=>{};
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('fuwa-help-seen','{"shop":1,"map":1}');window.NO_AFTER_TALK=true;});
 await p.goto('file://'+path.resolve('index.html')+'#town');await p.locator('[data-town-place]').first().waitFor();await noLuck(p);
 // 還沒接主線：森林進不去
 assert.ok(await p.evaluate(()=>{state.main={};state.dungeons={};state.location='forest';state.page='map';render();enterWorldLocation();return state.page==='map'&&/公會/.test(document.getElementById('map-message').textContent);}),'還沒接主線：森林不開');
 // 公會：紅 ❗、對話「哥布林的消息」講完 → investigate
 await p.evaluate(()=>{state.townFounded=true;state.innNightDone=true;state.page='town';state.townPlace=null;render();});
 assert.equal(await p.locator('[data-town-place="guild"] .obs-main').count(),1,'公會有紅 ❗');await shot(p,'fm-town.png');
 await p.evaluate(()=>openTownPlace('guild'));await p.locator('#townMainTalk').click();
 const n=await p.evaluate(()=>mainTalkLines('start').length);   // 後面接驅除哥布林那句（10-28）
 for(let i=0;i<n;i++)await p.locator('#townTalkNext').click();
 assert.equal(await p.evaluate(()=>mainStage()),'investigate');assert.equal(await p.locator('#townMainTalk').count(),0);
 // 大地圖：森林紅 ❗
 assert.equal(await p.evaluate(()=>{state.page='map';render();return document.querySelectorAll('.main-pin[data-loc="forest"]').length;}),1,'森林紅 ❗（洞窟另外也有一個，10-28）');
 // 第一次：霧擋著溪
 const reach=()=>p.evaluate(()=>{const b=B(),fox=b.units.find(u=>u.id==='fox'),paths=reachable({...fox,x:37,y:13},100000);const can=(x,y)=>[...paths.keys()].some(k=>{const [a,c]=k.split(',').map(Number);return Math.max(Math.abs(a-x),Math.abs(c-y))<=1;});return {D:can(17,12),E:can(6,14),F:can(2,2)};});
 await p.evaluate(()=>{state.location='forest';enterWorldLocation();});
 assert.equal(await p.evaluate(()=>B().def.stage),'investigate');assert.deepEqual(await reach(),{D:true,E:false,F:false},'霧擋著溪');
 const clear=sq=>p.evaluate(async sq=>{const b=B(),es=b.units.filter(v=>v.squad===sq&&!v.dead),e0=es[0];if(!e0)return {phase:b.phase,skipped:true};exploreParty().forEach(v=>{v.x=e0.x+2;v.y=e0.y;});
  if(b.phase!=='combat')enterExploreCombat(e0.id,true);await new Promise(r=>setTimeout(r,500));const pc=b.units.find(isPcCritter);
  const boss=b.units.find(v=>v.type==='chimera'),info={drowsy:boss?!!has(boss,'paralyzed'):null,res:b.units.filter(isPcCritter).every(v=>(v.resistances||[]).includes('火焰'))};
  for(const v of b.units.filter(v=>v.side==='foe'&&v.combatActive&&!v.dead)){state.knockout={};b.meleeBy=null;hurt(v,999,'穿刺',pc);}
  checkResult();await new Promise(r=>setTimeout(r,1200));return {phase:b.phase,result:b.result,...info};},sq);
 assert.equal((await clear(1)).phase,'explore');
 const w1=await clear(2);assert.equal(w1.result,'win');
 await p.evaluate(()=>finishQuest());assert.equal(await p.evaluate(()=>state.page+'/'+state.scene),'story/forestDruidMeet');assert.equal(await p.evaluate(()=>mainStage()),'met');
 await p.waitForTimeout(800);await shot(p,'fm-druid.png');
 await p.evaluate(()=>finishForestScene());
 // 第二次：霧散了；食人花；調查兩處花粉線索 → 撞見
 await p.evaluate(()=>enterWorldLocation());
 assert.equal(await p.evaluate(()=>B().def.stage),'met');assert.equal((await reach()).E,true,'霧散了');
 assert.deepEqual(await p.evaluate(()=>[...new Set(B().units.filter(u=>u.side==='foe').map(u=>u.type))].sort()),['boar','mantrap']);
 const inv=clue=>p.evaluate(async clue=>{const b=B(),o=b.def.blocks.find(q=>q.clue===clue);if(!o)return 'missing';const near=[[1,0],[0,1],[-1,0],[0,-1]].map(([dx,dy])=>({x:o.x+dx,y:o.y+dy})).find(c=>!blocked(c.x,c.y));exploreParty().forEach(v=>{v.x=near.x;v.y=near.y;});b.exploreStopped=false;b.busy=false;b.exploreObject=o;const r=Math.random;Math.random=()=>.95;try{await exploreInteract('investigate');}finally{Math.random=r;}return dungeonState('forest').clues[clue];},clue);
 // 調查的時候被食人花、野豬發現就先打掉
 await clear(3);await clear(4);
 assert.equal(await inv('claws'),'ok');assert.equal(await inv('pouch'),'ok');
 await p.waitForTimeout(1600);
 assert.equal(await p.evaluate(()=>state.page+'/'+state.scene),'story/forestReveal','調查兩處：撞見德魯伊');assert.equal(await p.evaluate(()=>mainStage()),'boss');
 await p.waitForTimeout(600);await shot(p,'fm-reveal.png');
 // 頭目戰：一進去就打；花粉讓奇美拉睡一回合、看過爪痕有火焰抗性
 await p.evaluate(()=>startForestBoss());await p.waitForTimeout(400);
 assert.equal(await p.evaluate(()=>B().phase),'combat');
 const g0=await p.evaluate(()=>state.gold.fox);
 const boss=await clear(5);assert.ok(boss.drowsy,'花粉：奇美拉第一回合動不了');assert.ok(boss.res,'爪痕：火焰抗性');assert.equal(boss.result,'win');
 assert.equal(await p.evaluate(g0=>(state.gold.fox-g0)/GP,g0),100);
 await p.evaluate(()=>finishQuest());assert.equal(await p.evaluate(()=>state.scene),'forestAfter');assert.equal(await p.evaluate(()=>mainStage()),'report');
 // 回公會報告 → done；森林之後只有野獸
 await p.evaluate(()=>{finishForestScene();state.page='town';openTownPlace('guild');});await p.locator('#townMainTalk').click();
 const m=await p.evaluate(()=>FOREST.main.report.length);for(let i=0;i<m;i++)await p.locator('#townTalkNext').click();
 assert.equal(await p.evaluate(()=>mainStage()),'done');
 const again=await p.evaluate(()=>{state.location='forest';enterWorldLocation();const b=B();return {types:[...new Set(b.units.filter(u=>u.side==='foe').map(u=>u.type))].sort(),noReward:b.def.noReward,mist:b.def.blocks.some(o=>o.kind==='mist')};});
 assert.deepEqual(again.types,['boar','forest_wolf','giant_spider']);assert.ok(again.noReward&&!again.mist);
 assert.deepEqual(errors,[]);
 console.log('✓ 森林主線：公會紅 ❗、霧擋溪、遇到德魯伊、霧散、花粉線索撞見、奇美拉（花粉、火焰抗性）★★★、回公會報告、之後只有野獸');
}finally{await br.close();}
