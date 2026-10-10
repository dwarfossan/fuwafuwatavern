// 商隊戰後（10-03）：打贏伏擊 → 繼續 → 商人道謝 → 停在選項（不能跳過）→ 選一隻擲她擅長的屬性 → 報酬只發一次 → 繼續上路走到城鎮
import {chromium} from 'playwright';import {noLuck} from './boot.mjs';   // 10-09 好運：敵人回合小傢伙豁免失敗會停下來問，等輪到我方的測試先把好運用光
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=n=>console.log('✓ '+n);
try{
 const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});
 await pg.addInitScript(()=>{ try{ localStorage.setItem('fuwa-help-seen','{"roll":1,"shop":1,"map":1}'); }catch(e){} });
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg.waitForFunction(()=>!document.body.classList.contains('image-boot'));
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await noLuck(pg); await pg.waitForFunction(()=>cur()&&cur().side==='pc'&&!B().busy,null,{timeout:60000});
 await pg.evaluate(()=>{B().units.filter(v=>v.side==='foe').forEach(v=>{v.dead=true;v.hp=0;});checkResult();});
 await pg.locator('#afterWin').click();
 assert.equal(await pg.evaluate(()=>state.page+':'+state.scene+':'+(state.battle===null)),'story:caravan:true');
 assert.equal(await pg.locator('.actor.merchant:not(.off) .pt-base').count(),1);ok('打贏伏擊按「繼續」進商隊劇情，戰鬥收掉，商人上台');
 const fl=await pg.evaluate(()=>SCENES.caravan.script.findIndex(l=>l.who==='fox'&&l.mood));
 while(await pg.evaluate(f=>state.line<f,fl)) await pg.locator('#stage').click();
 const heads=await pg.evaluate(()=>[...document.querySelectorAll('.pf .c-head')].map(i=>i.getAttribute('src')));
 assert.equal(heads.length,4);assert(heads[0].endsWith('fox/'+(await pg.evaluate(f=>SCENES.caravan.script[f].mood,fl))+'.webp'));assert(heads[1].endsWith('tiger/happy.webp'),'玲玲發言時嬌嬌保留之前自己台詞的開心臉');
 ok('劇情卡片用新頭像，說話的那隻換表情（10-03）');
 while(await pg.evaluate(()=>!SCENES.caravan.script[state.line].choice)) await pg.locator('#stage').click();
 const line=await pg.evaluate(()=>state.line);
 await pg.locator('#stage').click();
 assert.equal(await pg.evaluate(()=>state.line),line);assert(await pg.locator('#toRoad').isDisabled());
 assert.equal(await pg.locator('[data-pick]').count(),4);ok('停在選項：點畫面不會跳過、「繼續上路」不能按、四個選項');
 // 每個選項的成功／失敗報酬（直接指定骰子）
 const res=await pg.evaluate(()=>{
  const want={fox:['INT'],tiger:['STR'],wolf:['WIS'],raccoon:['DEX']}, out={};
  const snap=()=>JSON.stringify([state.gold,state.inv]);
  const base=snap();
  for(const id of Object.keys(want)) for(const r of [20,1]){
   const [g,inv]=JSON.parse(base); state.gold=g; state.inv=inv; state.caravan={}; state.line=SCENES.caravan.script.findIndex(l=>l.choice);
   const g0={...state.gold}, n0=Object.fromEntries(CRITTERS.map(c=>[c.id,state.inv[c.id].length]));
   caravanPick(id,r); caravanPick(id,r);   // 第二次不能重複領
   const c=state.caravan; const items=Object.fromEntries(CRITTERS.map(x=>[x.id,state.inv[x.id].slice(n0[x.id]).map(i=>ITEMS.find(t=>t.id===i).n)]));
   out[id+r]={stat:c.stat, ok:c.ok, gold:CRITTERS.map(x=>(state.gold[x.id]-g0[x.id])/GP), items, rollLine:!!SCENES.caravan.script.find(l=>l.roll)};
  }
  return out;});
 for(const [id,st] of [['fox','INT'],['tiger','STR'],['wolf','WIS'],['raccoon','DEX']]){ assert.equal(res[id+20].stat,st); assert(res[id+20].ok); assert(!res[id+1].ok); assert(res[id+20].rollLine); }
 assert.deepEqual(res.fox20.gold,[200,200,200,200]);assert.deepEqual(res.fox1.gold,[100,100,100,100]);
 assert.deepEqual(res.tiger20.items,{fox:['點心','點心'],tiger:['點心','點心'],wolf:['點心','點心'],raccoon:['點心','點心']});
 assert.deepEqual(res.wolf20.items.wolf,['+1 長弓']);assert.deepEqual(res.raccoon20.items.raccoon,['次元背包']);
 assert.deepEqual(res.raccoon1.gold,[50,50,50,50]);assert.deepEqual(res.wolf1.items.wolf,[]);
 ok('四個選項用各自擅長的屬性；成功、失敗的報酬照表，只發一次');
 await pg.evaluate(()=>render());
 while(await pg.evaluate(()=>state.line<SCENES.caravan.script.length-1)) await pg.locator('#stage').click();
 await pg.locator('#toRoad').click();
 await pg.waitForFunction(()=>state.location==='town'&&!state.travel,null,{timeout:10000});
 assert.equal(await pg.evaluate(()=>state.page+':'+state.scene),'story:townArrival');ok('繼續上路：大地圖走到城鎮，接進城告別');
 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
