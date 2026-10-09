// 分層後的演出：攻擊者先擲骰、晚一點才揮。場景層要在動作開始那一刻自己更新，不能等下一次有人重畫。
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
try{
 const pg=await br.newPage({viewport:{width:390,height:844}});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg.waitForFunction(()=>typeof B==="function"&&B()&&!document.body.classList.contains("image-boot"));
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 const r=await pg.evaluate(async()=>{
  const b=B(),u=cur(),f=b.units.find(v=>v.side!=='pc'&&!v.dead&&!foeHid(v));   // 躲著的敵人點不到，要挑看得到的
  const s=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[u.x+dx,u.y+dy]).find(([x,y])=>!unitAt(x,y)&&!b.def.blocks.some(o=>o.x===x&&o.y===y));
  // 開場敵人先動的話，攻擊者可能已經被抓住；拿弓（雙手）就不能射，整招被拒絕、什麼都不畫（10-03 查到的偶發失敗原因）。
  // 這個測試只驗揮手的圖層，先把擒抱解開
  if(grappled(u)) releaseGrapple(u); victimsOf(u).forEach(v=>releaseGrapple(v));
  f.x=s[0];f.y=s[1];refreshBattle();
  const seen=new Set(),orig=window.dollSVG;window.dollSVG=o=>{if(o.anim)seen.add(o.id);return orig(o);};
  pickSkill(unitSkills(u)[0].key);clickTile(f.x,f.y);
  await new Promise(r=>setTimeout(r,2000));window.dollSVG=orig;return {who:u.id,seen:[...seen]};
 });
 assert(r.seen.includes(r.who),`攻擊者的揮手沒有畫出來（看到：${r.seen}）`);console.log('✓ 攻擊者擲完骰會揮手');
 const cast=await pg.evaluate(async()=>{
  const b=B(),u=b.units.find(v=>v.id==='fox');b.flowEpoch=(b.flowEpoch||0)+1;window.nextTurn=()=>{};b.turn=b.units.indexOf(u);b.busy=false;b.actionUsed=b.freeUsed=false;u.dead=u.down=false;u.statuses=[];u.shield=false;u.weapon=u.focus=null;u.backpack=[ITEMS.find(it=>it.n==='材料包')];u.slots=[2];refreshBattle();
  const floor=document.querySelector('#board-floor').firstElementChild,token=document.querySelector(`.token[data-moving-unit="${u.id}"]`);
  doSkill(u,learnedSkillByKey('fire_shield'),u);
  await new Promise(r=>setTimeout(r,150));
  const active=!!token.querySelector('.act-cast');
  state.modal={kind:'item',id:ITEMS.find(it=>it.type==='focus'&&groupOf(it)?.id==='arcane_staff').id};refreshBattle();state.modal=null;refreshBattle();
  const retained=document.querySelector(`.token[data-moving-unit="${u.id}"]`)===token&&!!token.querySelector('.act-cast');
  await new Promise(r=>setTimeout(r,1000));refreshBattle();
  return {active,retained,ended:!token.querySelector('.act-cast'),floor:floor===document.querySelector('#board-floor').firstElementChild,status:!!has(u,'fireShield')};
 });
 for(const [k,v]of Object.entries(cast)){assert(v,'cast layers '+k);console.log('✓ cast layers '+k);}
 assert.deepEqual(errors,[]);console.log('✓ no browser errors');
}finally{await br.close();}
