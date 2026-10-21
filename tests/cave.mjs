// 洞窟（10-21）：大地圖點洞窟進去、整張是黑的（火盆、入口天光照亮）、每區走得到、火把（佔手、照亮、敵人看得更遠）、四個調查點、打頭目時落石＋火焰抗性、紅龍 ★★★ 報酬、再來只有野獸
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {noLuck} from './boot.mjs';
const shot=process.env.SHOT_DIR?(p,n)=>p.screenshot({path:path.join(process.env.SHOT_DIR,n)}):async()=>{};
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('fuwa-help-seen','{"shop":1,"map":1}');window.NO_AFTER_TALK=true;});
 await p.goto('file://'+path.resolve('index.html')+'#town');await p.locator('[data-town-place]').first().waitFor();await noLuck(p);
 await p.evaluate(()=>{state.dungeons={};state.location='cave';state.mapSel='cave';state.page='map';render();enterWorldLocation();});
 const r0=await p.evaluate(()=>{const b=B(),fox=b.units.find(u=>u.id==='fox'),paths=reachable({...fox,x:37,y:13},100000);
  const can=(x,y)=>[...paths.keys()].some(k=>{const [a,c]=k.split(',').map(Number);return Math.max(Math.abs(a-x),Math.abs(c-y))<=1;});
  return {phase:b.phase,dungeon:b.def.dungeon,light:[lightAt(37,13),lightAt(16,9),lightAt(28,12)],reach:[can(28,12),can(23,10),can(16,11),can(8,13),can(6,15),can(2,3),can(1,3),can(6,8)],shown:b.units.filter(u=>u.side==='foe'&&!foeHid(u)&&!['bat','slime'].includes(u.type)).length,dark:document.querySelectorAll('.dark-floor').length};});
 assert.equal(r0.phase,'explore');assert.equal(r0.dungeon,'cave');
 assert.deepEqual(r0.light,['bright','bright','dark'],'入口有天光、火盆旁邊亮、其他地方黑');
 assert.deepEqual(r0.reach,[true,true,true,true,true,true,true,true],'每一區都走得到（不靠捷徑）');
 assert.equal(r0.shown,0,'深處的敵人還看不到（入口看得到蝙蝠洞）');assert.ok(r0.dark>100,'畫面上暗的地方蓋一層黑');
 await p.waitForTimeout(600);await shot(p,'cave-enter.png');
 // 火把：有帶就能點；點了佔一隻手（盾牌先不算）、周圍變亮、敵人遠遠就看得到
 const t=await p.evaluate(()=>{const b=B(),u=exploreUnit();const away=b.units.filter(v=>v.side==='foe');away.forEach(v=>v.fled=true);   // 只測火把本身，先讓敵人不在
 u.backpack.push(makeItem(ITEMS.find(i=>i.n==='火把')));const okMenu=torchMenuOk();const sh=u.shield;exploreParty().forEach(v=>{v.x=23;v.y=12;});
  const before=lightAt(25,12);toggleTorch();const after=lightAt(25,12);const r={okMenu,before,after,hand:!freeHand(u)||!u.weapon,shield:sh?!u.shield:true,lit:u.torch};toggleTorch();away.forEach(v=>v.fled=false);return {...r,off:!u.torch,shieldBack:sh?u.shield:true};});
 assert.ok(t.okMenu);assert.equal(t.before,'dark');assert.equal(t.after,'bright');assert.ok(t.lit&&t.shield&&t.off&&t.shieldBack,JSON.stringify(t));
 // 黑暗中看不見＝劣勢（人類沒有黑暗視覺）
 assert.equal(await p.evaluate(()=>{const b=B(),u=b.units.find(isPcCritter),h={...u,id:'x',side:'foe',type:'bandit',learned:[],activeSkills:[]};h.x=u.x+1;h.y=u.y;return lightVision(h,u);}),'blind');
 const tp=(x,y)=>p.evaluate(({x,y})=>{const b=B();exploreParty().forEach(v=>{v.x=x;v.y=y;});b.exploreStopped=false;b.busy=false;refreshBattle();},{x,y});
 const inv=clue=>p.evaluate(async clue=>{const b=B(),o=b.def.blocks.find(q=>q.clue===clue);b.exploreObject=o;const r=Math.random;Math.random=()=>.95;try{await exploreInteract('investigate');}finally{Math.random=r;}return dungeonState('cave').clues[clue];},clue);
 const clear=sq=>p.evaluate(async sq=>{const b=B(),es=b.units.filter(v=>v.squad===sq&&!v.dead),e0=es[0];exploreParty().forEach(v=>{v.x=e0.x+2;v.y=e0.y;});
  if(b.phase!=='combat')enterExploreCombat(e0.id,true);await new Promise(r=>setTimeout(r,500));const pc=b.units.find(isPcCritter);
  const boss=b.units.find(v=>v.type==='red_wyrmling'),hp0=boss?.hp,res=b.units.filter(isPcCritter).every(v=>(v.resistances||[]).includes('火焰'));
  for(const v of b.units.filter(v=>v.side==='foe'&&v.combatActive&&!v.dead)){state.knockout={};b.meleeBy=null;hurt(v,999,'鈍擊',pc);}
  checkResult();await new Promise(r=>setTimeout(r,1500));return {phase:b.phase,result:b.result,res,bossHit:boss?boss.maxHp-hp0:0};},sq);
 assert.equal((await clear(1)).phase,'explore');
 await tp(23,11);assert.equal(await inv('notes'),'ok');assert.ok(await p.evaluate(()=>B().def.blocks.filter(o=>o.shortcut).every(o=>o.kind==='gravel')),'礦工筆記：塌方挖開');
 assert.equal((await clear(2)).phase,'explore');
 assert.equal((await clear(3)).phase,'explore');
 await tp(7,8);assert.equal(await inv('rockfall'),'ok');assert.ok(await p.evaluate(()=>B().def.blocks.filter(o=>o.kind==='trap').every(o=>o.found)),'落石機關：陷阱一起看出來');
 await tp(7,15);assert.equal(await inv('altar'),'ok');
 await tp(2,2);assert.equal(await inv('hoard'),'ok');
 const g0=await p.evaluate(()=>state.gold.fox);
 const boss=await clear(4);assert.ok(boss.res,'祭壇：打紅龍時火焰抗性');assert.ok(boss.bossHit>0,'落石砸到紅龍');assert.equal(boss.result,'win');
 const w=await p.evaluate(g0=>({gold:(state.gold.fox-g0)/GP,item:B().questReward?.item,cleared:dungeonState('cave').cleared}),g0);
 assert.equal(w.gold,100);assert.ok(w.item);assert.ok(w.cleared);
 const again=await p.evaluate(()=>{finishQuest();const loc=state.location;enterDungeon('cave');const b=B();return {loc,types:[...new Set(b.units.filter(u=>u.side==='foe').map(u=>u.type))].sort(),noReward:b.def.noReward};});
 assert.equal(again.loc,'cave');assert.deepEqual(again.types,['bat','giant_spider','slime']);assert.ok(again.noReward);
 assert.deepEqual(errors,[]);
 console.log('✓ 洞窟：進去、黑暗＋光源、每區走得到、火把、黑暗看不見、四個調查點、落石＋火焰抗性、紅龍 ★★★ 報酬、再來只有野獸');
}finally{await br.close();}
