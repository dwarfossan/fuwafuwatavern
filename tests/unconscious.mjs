// 昏迷（大爺 10-09，取代 10-02 的死亡豁免）＋重新挑戰／回酒館（卡姆傳送詛咒只在玩家選回酒館時出現）
import {chromium} from 'playwright';import {noLuck} from './boot.mjs';   // 10-09 好運：敵人回合小傢伙豁免失敗會停下來問，等輪到我方的測試先把好運用光
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=(name)=>console.log('✓ '+name);
try{
 const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg.waitForFunction(()=>!document.body.classList.contains('image-boot'));
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await noLuck(pg); await pg.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 await pg.evaluate(()=>{ window.__nt=nextTurn; nextTurn=()=>{}; B().tut=-1; });

 // 昏迷（大爺 10-09，取代死亡豁免）：歸零就昏迷、不擲骰、輪不到；協助或治療才醒；戰後自動醒 1 血；四隻都昏迷＝輸
 const r=await pg.evaluate(()=>{ const b=B(), rnd=Math.random, out={};
   const u=b.units.find(v=>v.id==='fox'), w=b.units.find(v=>v.id==='wolf');
   const down=()=>{ u.hp=1; u.down=false; u.dead=false; hurt(u, 99, "物理", null); };
   down(); out.down=u.down; out.dead=u.dead; out.log=b.log.slice(-8).map(l=>l.t).join('|');
   out.noDeathSave=typeof deathSave==='undefined';
   // 輪不到昏迷的：把回合放在她前一位，換回合時會跳過她
   b.turn=(b.units.indexOf(u)-1+b.units.length)%b.units.length; window.__nt(); out.skipped=cur()!==u;
   // 狀態卡
   b.info=u.id; refreshBattle(); out.card=document.querySelector('.bt-info .dim')?.textContent||''; b.info=null;
   // 治療就醒
   heal(u,3); out.healDown=u.down; out.healHp=u.hp;
   // 協助（醫療檢定成功）就醒、1 血、倒地
   down(); w.x=u.x+1; w.y=u.y; b.actionUsed=false; Math.random=()=>0.95; doHelp(w,u); Math.random=rnd; out.helpDown=u.down; out.helpHp=u.hp; out.helpProne=!!has(u,'prone');
   return out; });
 assert.equal(r.down,true);assert.equal(r.dead,false);assert.match(r.log,/昏迷了/);ok('歸零：昏迷（不是死亡），紀錄寫「昏迷了」');
 assert.equal(r.noDeathSave,true);ok('死亡豁免已拿掉');
 assert.equal(r.skipped,true);ok('昏迷的輪不到回合');
 assert.match(r.card,/昏迷（隊友協助或治療才醒）/);ok('狀態卡寫昏迷');
 assert.equal(r.healDown,false);assert(r.healHp>0);ok('被治療就醒');
 assert.equal(r.helpDown,false);assert.equal(r.helpHp,1);assert(r.helpProne);ok('隊友協助成功就醒（1 血、倒地）');

 // 輸贏：三隻昏迷不算輸；四隻都昏迷＝輸；打贏時昏迷的自動醒 1 血
 const w=await pg.evaluate(()=>{ const b=B(), out={};
   const pcs=b.units.filter(v=>v.side==='pc');
   pcs.forEach((p,i)=>{ p.dead=false; p.hp=i?0:5; p.down=!!i; });
   out.three=checkResult();
   pcs[0].hp=0;pcs[0].down=true;
   out.four=checkResult(); out.result=b.result; refreshBattle();
   out.ov=document.querySelector('.bt-result')?.textContent.replace(/\s+/g,' ')||'';
   // 打贏：昏迷的醒來
   b.result=null; pcs.forEach((p,i)=>{p.down=i===1;p.hp=i===1?0:5;}); b.units.filter(v=>v.side==='foe').forEach(v=>{v.down=true;v.hp=0;});
   checkResult(); out.winResult=b.result; out.wokeHp=pcs[1].hp; out.wokeDown=pcs[1].down;
   return out; });
 assert.equal(w.three,false);ok('三隻昏迷：還沒輸');
 assert.equal(w.four,true);assert.equal(w.result,'lose');assert.match(w.ov,/四隻都昏迷了/);ok(`四隻都昏迷＝輸：「${w.ov.trim().slice(0,30)}」`);
 assert.equal(w.winResult,'win');assert.equal(w.wokeHp,1);assert.equal(w.wokeDown,false);ok('打贏時昏迷的自動醒來、1 血');

 // 四隻都昏迷時敵人回合不卡住：直接判輸
 const pg2=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 pg2.on('pageerror',e=>errors.push(e.message));
 await pg2.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg2.waitForFunction(()=>!document.body.classList.contains('image-boot'));
 await pg2.evaluate(()=>startBattle("ambush"));
 await noLuck(pg2); await pg2.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 const t=await pg2.evaluate(async()=>{ const b=B(); b.tut=-1;
   b.units.filter(v=>v.side==='pc').forEach(p=>{ p.hp=0; p.down=true; p.statuses=[]; });
   endTurn();
   for(let i=0;i<40 && !b.result;i++) await new Promise(r=>setTimeout(r,250));
   return {result:b.result}; });
 assert.equal(t.result,'lose');ok('全昏迷：換回合時直接判輸，不卡住');

 // 重新挑戰（大爺 10-02）：三次、還原開戰前、用完只剩傳送回酒館、長休回滿
 const pg3=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 pg3.on('pageerror',e=>errors.push(e.message));
 await pg3.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg3.waitForFunction(()=>!document.body.classList.contains('image-boot'));
 await pg3.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await noLuck(pg3); await pg3.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 const lose=()=>pg3.evaluate(()=>{ const b=B(); b.tut=-1; b.units.filter(v=>v.side==='pc').forEach(p=>{ p.hp=0; p.down=true; }); checkResult(); refreshBattle(); });
 const rt=await pg3.evaluate(()=>{ const out={};
   out.inv0=JSON.stringify(state.inv); out.prof0=JSON.stringify(state.proficiency);
   // 戰鬥中用掉東西、花掉格子
   const id=Object.keys(state.inv).find(k=>state.inv[k].length); state.inv[id].pop(); state.proficiency.fox=[0];
   return out; });
 await lose();
 const btn1=await pg3.evaluate(()=>({retry:document.getElementById('retry')?.textContent||'', home:!!document.getElementById('toTavern')}));
 await pg3.click('#retry'); await pg3.waitForTimeout(300);
 const after=await pg3.evaluate(()=>({inv:JSON.stringify(state.inv), prof:JSON.stringify(state.proficiency), left:state.retriesLeft, result:B().result, page:state.page}));
 assert.match(btn1.retry,/剩 3 次/);assert(btn1.home);ok('輸掉：「重新挑戰（剩 3 次）」和「回酒館」');
 assert.equal(after.inv,rt.inv0);assert.equal(after.prof,rt.prof0);assert.equal(after.left,2);assert.equal(after.result,null);ok('重新挑戰：道具、熟練格回到開戰前，剩 2 次');
 for(let i=0;i<2;i++){ await pg3.waitForFunction(()=>B()&&!B().busy,null,{timeout:60000}); await lose(); await pg3.click('#retry'); await pg3.waitForTimeout(300); }
 await pg3.waitForFunction(()=>B()&&!B().busy,null,{timeout:60000}); await lose();
 const btn0=await pg3.evaluate(()=>({retry:!!document.getElementById('retry'), home:!!document.getElementById('toTavern'), left:state.retriesLeft}));
 assert.equal(btn0.left,0);assert.equal(btn0.retry,false);assert(btn0.home);ok('三次用完：重新挑戰不見，只剩回酒館');
 const rest=await pg3.evaluate(()=>{ const b=B(); b.result='win'; takeRest('long'); return state.retriesLeft; });
 assert.equal(rest,3);ok('長休：重新挑戰回滿 3 次');
 // 上一場排好的換回合計時器，不能跑進新的一場（10-02：輸掉後 1.5 秒內按重新挑戰，新一場第一隻會被跳過）
 await pg3.evaluate(()=>{ const b=B(); b.result=null; b.units.forEach(v=>{ v.dead=false; v.down=false; v.statuses=[]; if(v.hp<=0)v.hp=5; });
   const e=b.units.find(v=>v.side==='foe'); b.turn=b.units.indexOf(e);
   b.units.filter(v=>v.side==='pc').forEach(p=>addStatus(p,'hidden',{val:30,roll:20}));   // 敵人找不到人：「東張西望」，0.7 秒後換回合
   aiTurn(e); });
 await lose(); await pg3.evaluate(()=>{ aiTurn=()=>{}; });   // 新一場的敵人先不動，只看回合有沒有被偷換（10-09：要在按重新挑戰前關，否則新一場敵人先攻時會在關掉前就出手換回合）
 await pg3.click('#retry');
 const t0=await pg3.evaluate(()=>({turn:B().turn, round:B().round}));
 await pg3.waitForTimeout(1500);
 const t1=await pg3.evaluate(()=>({turn:B().turn, round:B().round}));
 assert.deepEqual(t1,t0,'上一場的計時器讓新一場多換了一個回合');ok('馬上按重新挑戰：上一場排好的換回合不會跑進新的一場');
 await pg3.evaluate(()=>{ const b=B(); b.result=null; b.units.filter(v=>v.side==='pc').forEach(p=>{ p.hp=0; p.down=true; }); checkResult(); refreshBattle(); });
 const before=await pg3.evaluate(()=>/卡姆/.test(document.querySelector('.bt-result')?.textContent||''));
 await pg3.click('#toTavern'); await pg3.waitForTimeout(300);
 const kam=await pg3.evaluate(()=>document.querySelector('.bt-result')?.textContent.replace(/\s+/g,' ')||'');
 assert.equal(before,false);assert.match(kam,/卡姆的傳送詛咒/);ok('選「回酒館」才出現卡姆的傳送詛咒訊息');
 await pg3.click('#confirmTavern'); await pg3.waitForTimeout(400);
 const home=await pg3.evaluate(()=>({page:state.page, loc:state.location, battle:state.battle}));
 assert.equal(home.page,'map');assert.equal(home.loc,'tavern');assert.equal(home.battle,null);ok('回酒館：回到大地圖、站在酒館');

 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
