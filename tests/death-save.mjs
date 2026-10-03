// 死亡豁免（大爺 10-02，SRD 5.2，選 B）：倒下的四小隻每回合擲 d20；1 算兩次失敗、20 醒來；失敗三次被卡姆傳送回酒館；四隻都送走才算輸
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=(name)=>console.log('✓ '+name);
try{
 const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 await pg.evaluate(()=>{ window.__nt=nextTurn; nextTurn=()=>{}; B().tut=-1; });

 // 擲骰結果：Math.random 固定，d20 = 1 + floor(r*20)
 const roll = v => (v-1)/20 + 0.001;
 const r=await pg.evaluate(async(rolls)=>{ const b=B(), rnd=Math.random, out={};
   const u=b.units.find(v=>v.id==='fox');
   const down=()=>{ u.hp=1; u.down=false; u.dead=false; u.gone=null; hurt(u, 99, "物理", null); };
   const ds=v=>{ Math.random=()=>v; const res=deathSave(u); Math.random=rnd; return res; };
   down(); out.downFail=u.dsFail;
   out.r12=ds(rolls[12]); out.f12=u.dsFail;
   out.r5=ds(rolls[5]); out.f5=u.dsFail;
   out.r1=ds(rolls[1]); out.f1=u.dsFail; out.gone=u.gone; out.dead=u.dead;
   out.card=(()=>{ b.info=u.id; refreshBattle(); const t=document.querySelector('.bt-info .dim')?.textContent||''; b.info=null; return t; })();
   // 20：自己醒來（1 血、倒地）
   down(); u.dsFail=2; out.r20=ds(rolls[20]); out.hp20=u.hp; out.down20=u.down; out.prone20=!!has(u,'prone'); out.f20=u.dsFail;
   // 治療：失敗次數歸零
   down(); u.dsFail=2; heal(u, 3); out.healF=u.dsFail; out.healDown=u.down;
   // 倒下的時候狀態卡寫失敗次數
   down(); u.dsFail=1; b.info=u.id; refreshBattle(); out.downCard=document.querySelector('.bt-info .dim')?.textContent||''; b.info=null;
   return out; }, Object.fromEntries([1,5,12,20].map(v=>[v,roll(v)])));
 assert.equal(r.downFail,0);
 assert.equal(r.r12,'stay');assert.equal(r.f12,0);ok('擲 12：撐住，不算失敗');
 assert.equal(r.r5,'stay');assert.equal(r.f5,1);ok('擲 5：失敗一次');
 assert.equal(r.r1,'gone');assert.equal(r.f1,3);assert.equal(r.gone,'teleport');assert.equal(r.dead,true);ok('擲 1 算兩次失敗，滿三次被傳送走');
 assert.match(r.card,/被傳送回酒館/);ok('被送走的狀態卡寫「被傳送回酒館」');
 assert.equal(r.r20,'up');assert.equal(r.hp20,1);assert.equal(r.down20,false);assert(r.prone20);assert.equal(r.f20,0);ok('擲 20：自己醒來（1 血、倒地），失敗歸零');
 assert.equal(r.healF,0);assert.equal(r.healDown,false);ok('被治療：站起來、失敗歸零');
 assert.match(r.downCard,/死亡豁免失敗 1\/3/);ok('倒下時狀態卡寫死亡豁免失敗次數');

 // 輸贏：四隻都倒下還在擲豁免不算輸；四隻都被送走才算輸，結果畫面寫傳送回酒館
 const w=await pg.evaluate(()=>{ const b=B(), out={};
   const pcs=b.units.filter(v=>v.side==='pc');
   pcs.forEach(p=>{ p.dead=false; p.gone=null; p.hp=0; p.down=true; p.dsFail=0; });
   out.allDown=checkResult();
   pcs.forEach(p=>{ p.dead=true; p.gone='teleport'; });
   out.allGone=checkResult(); out.result=b.result; refreshBattle();
   out.ov=document.querySelector('.bt-result')?.textContent.replace(/\s+/g,' ')||'';
   return out; });
 assert.equal(w.allDown,false);ok('四隻都倒下、還在擲死亡豁免：不算輸');
 assert.equal(w.allGone,true);assert.equal(w.result,'lose');assert.match(w.ov,/傳送回酒館/);ok(`四隻都被送走才算輸：「${w.ov.trim().slice(0,30)}」`);

 // 倒下的四小隻照樣輪到回合（擲豁免），敵人回合沒有人可打也不會卡住
 const pg2=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 pg2.on('pageerror',e=>errors.push(e.message));
 await pg2.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg2.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg2.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 const t=await pg2.evaluate(async()=>{ const b=B(); b.tut=-1;
   b.units.filter(v=>v.side==='pc').forEach(p=>{ p.hp=0; p.down=true; p.dsFail=0; p.statuses=[]; });
   const seen=new Set(); const start=b.round;
   endTurn();
   for(let i=0;i<120 && !b.result && b.round<start+2;i++){ await new Promise(r=>setTimeout(r,250)); const u=cur(); if(u) seen.add(u.side+(u.down?':down':''));
     if(u && u.side==='pc' && !u.down && !u.dead && !b.busy) endTurn(); }   // 擲到 20 醒過來就輪到玩家：測試替她按待機
   return {seen:[...seen], round:b.round-start, logs:b.log.filter(l=>/死亡豁免/.test(l.t)).length, result:b.result}; });
 assert(t.seen.includes('pc:down'));assert(t.logs>0);assert(t.round>=1||t.result);ok(`全倒：倒下的照樣輪到擲死亡豁免、敵人回合不卡住（${t.logs} 次豁免，過了 ${t.round} 輪${t.result?'，結果 '+t.result:''}）`);

 // 重新挑戰（大爺 10-02）：三次、還原開戰前、用完只剩傳送回酒館、長休回滿
 const pg3=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 pg3.on('pageerror',e=>errors.push(e.message));
 await pg3.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg3.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg3.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 const lose=()=>pg3.evaluate(()=>{ const b=B(); b.tut=-1; b.units.filter(v=>v.side==='pc').forEach(p=>{ p.dead=true; p.gone='teleport'; }); checkResult(); refreshBattle(); });
 const rt=await pg3.evaluate(()=>{ const out={};
   out.inv0=JSON.stringify(state.inv); out.prof0=JSON.stringify(state.proficiency);
   // 戰鬥中用掉東西、花掉格子
   const id=Object.keys(state.inv).find(k=>state.inv[k].length); state.inv[id].pop(); state.proficiency.fox=[0];
   return out; });
 await lose();
 const btn1=await pg3.evaluate(()=>({retry:document.getElementById('retry')?.textContent||'', home:!!document.getElementById('toTavern')}));
 await pg3.click('#retry'); await pg3.waitForTimeout(300);
 const after=await pg3.evaluate(()=>({inv:JSON.stringify(state.inv), prof:JSON.stringify(state.proficiency), left:state.retriesLeft, result:B().result, page:state.page}));
 assert.match(btn1.retry,/剩 3 次/);assert(btn1.home);ok('輸掉：「重新挑戰（剩 3 次）」和「傳送回酒館」');
 assert.equal(after.inv,rt.inv0);assert.equal(after.prof,rt.prof0);assert.equal(after.left,2);assert.equal(after.result,null);ok('重新挑戰：道具、熟練格回到開戰前，剩 2 次');
 for(let i=0;i<2;i++){ await pg3.waitForFunction(()=>B()&&!B().busy,null,{timeout:60000}); await lose(); await pg3.click('#retry'); await pg3.waitForTimeout(300); }
 await pg3.waitForFunction(()=>B()&&!B().busy,null,{timeout:60000}); await lose();
 const btn0=await pg3.evaluate(()=>({retry:!!document.getElementById('retry'), home:!!document.getElementById('toTavern'), left:state.retriesLeft}));
 assert.equal(btn0.left,0);assert.equal(btn0.retry,false);assert(btn0.home);ok('三次用完：重新挑戰不見，只剩傳送回酒館');
 const rest=await pg3.evaluate(()=>{ const b=B(); b.result='win'; takeRest('long'); return state.retriesLeft; });
 assert.equal(rest,3);ok('長休：重新挑戰回滿 3 次');
 // 上一場排好的換回合計時器，不能跑進新的一場（10-02：輸掉後 1.5 秒內按重新挑戰，新一場第一隻會被跳過）
 await pg3.evaluate(()=>{ const b=B(); b.result=null; b.units.forEach(v=>{ v.dead=false; v.down=false; v.gone=null; v.statuses=[]; });
   const e=b.units.find(v=>v.side==='foe'); b.turn=b.units.indexOf(e);
   b.units.filter(v=>v.side==='pc').forEach(p=>addStatus(p,'hidden',{val:30,roll:20}));   // 敵人找不到人：「東張西望」，0.7 秒後換回合
   aiTurn(e); });
 await lose(); await pg3.click('#retry');
 const t0=await pg3.evaluate(()=>{ aiTurn=()=>{}; return {turn:B().turn, round:B().round}; });   // 新一場的敵人先不動，只看回合有沒有被偷換
 await pg3.waitForTimeout(1500);
 const t1=await pg3.evaluate(()=>({turn:B().turn, round:B().round}));
 assert.deepEqual(t1,t0,'上一場的計時器讓新一場多換了一個回合');ok('馬上按重新挑戰：上一場排好的換回合不會跑進新的一場');
 await pg3.evaluate(()=>{ const b=B(); b.result=null; b.units.filter(v=>v.side==='pc').forEach(p=>{ p.dead=true; }); checkResult(); refreshBattle(); });
 await pg3.click('#toTavern'); await pg3.waitForTimeout(400);
 const home=await pg3.evaluate(()=>({page:state.page, loc:state.location, battle:state.battle}));
 assert.equal(home.page,'map');assert.equal(home.loc,'tavern');assert.equal(home.battle,null);ok('傳送回酒館：回到大地圖、站在酒館');

 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
