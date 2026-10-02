// 感知與搜索（大爺 10-02）：被動感知 10＋感知、主動搜索 d20＋感知，DC＝10＋敵人敏捷＋2；看穿或打倒後敵人背包打得開
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
 await pg.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 await pg.evaluate(()=>{ window.__nt=nextTurn; endTurn=()=>{}; nextTurn=()=>{}; B().tut=-1; });

 // 公式
 const f=await pg.evaluate(()=>{ const u=B().units.find(v=>v.side==='pc'), e=B().units.find(v=>v.type==='goblin');
   return {pp:passivePer(u)===10+u.mods.WIS, dc:pocketDC(e)}; });
 assert(f.pp);assert.equal(f.dc,14);ok('被動感知＝10＋感知；哥布林 DC 14');

 // 被動：感知不夠看不穿，夠了就看穿，寫進紀錄
 const p=await pg.evaluate(()=>{ const b=B(), e=b.units.find(v=>v.side==='foe'&&!foeHid(v)); b.pocketSeen={};
   b.units.filter(v=>v.side==='pc').forEach(v=>v.mods.WIS=-1); passivePocket(); const before=pocketKnown(e);
   b.units.find(v=>v.id==='wolf').mods.WIS=4; passivePocket();
   return {before, after:pocketKnown(e), log:b.log.slice(-2).map(l=>l.t).join(' / ')}; });
 assert.equal(p.before,false);assert.equal(p.after,true);assert.match(p.log,/香香.*看穿/);ok('被動感知夠高才看穿，紀錄寫出是誰');

 // 敵人卡片：沒看穿時背包鎖著、沒有可拖曳的裝備
 const c=await pg.evaluate(()=>{ const b=B(); b.pocketSeen={}; const e=b.units.find(v=>v.type==='goblin_archer'); b.info=e.id; b.gearBagOpen=true; refreshBattle();
   const card=document.querySelector('.bt-info');
   return {locked:!!card.querySelector('.backpack.locked'), drag:card.querySelectorAll('[data-gearitem]').length, lights:!!card.querySelector('.econ,.inf-slots'), abil:card.querySelectorAll('.status-ability').length, w:Math.round(card.getBoundingClientRect().width)}; });
 assert(c.locked);assert.equal(c.drag,0);assert(!c.lights);assert.equal(c.abil,6);ok(`敵人卡片：背包鎖著、不能拖、沒有燈號和熟練格、六圍 6 格（寬 ${c.w}px）`);

 // 主動搜索：從動作選單點，擲 20 一定成功；用掉免費動作；骰子面板顯示 FOUND
 const s=await pg.evaluate(async()=>{ const b=B(), u=cur(), e=b.units.find(v=>v.type==='goblin_archer');
   b.pocketSeen={}; b.info=null; b.freeUsed=false; b.actionUsed=false; b.busy=false; b.menu='act';
   const s0=[[1,0],[-1,0],[0,1],[0,-1],[2,0],[0,2]].map(([dx,dy])=>[u.x+dx,u.y+dy]).find(([x,y])=>!unitAt(x,y)&&!b.def.blocks.some(o=>o.x===x&&o.y===y));
   e.x=s0[0];e.y=s0[1]; refreshBattle();
   const btn=document.querySelector('[data-cmd="search"]'); const enabled=btn&&!btn.disabled; btn.click();
   const marked=!!document.querySelector(`#board-marks [data-tile="${e.x},${e.y}"]`)||b.mode?.key==='search';
   const rnd=Math.random; Math.random=()=>0.999; clickTile(e.x,e.y); Math.random=rnd;
   await new Promise(r=>setTimeout(r,900));
   return {enabled, marked, known:pocketKnown(e), free:b.freeUsed, action:b.actionUsed, res:b.panel?.rows?.[0]?.res, label:b.panel?.label}; });
 assert(s.enabled);assert(s.marked);assert(s.known);assert.equal(s.free,true);assert.equal(s.action,false);assert.equal(s.res,'found');
 ok(`搜索：用掉免費動作、不用動作，面板「${s.label}」FOUND`);

 // 看穿後背包打得開，看到箭袋
 const o=await pg.evaluate(()=>{ const b=B(), e=b.units.find(v=>v.type==='goblin_archer'); b.info=e.id; b.gearBagOpen=false; refreshBattle();
   document.querySelector('.bt-info [data-bagtoggle]').click();
   return document.querySelector('.bt-info .gear-bagitems')?.textContent||''; });
 assert.match(o,/箭袋/);ok('看穿後打開背包：看得到箭袋');

 // 搜索失敗；已看穿的不能再搜；打倒的敵人背包打得開
 const g=await pg.evaluate(()=>{ const b=B(), u=cur(), e=b.units.find(v=>v.type==='goblin'&&!v.dead);
   b.pocketSeen={}; b.freeUsed=false; e.x=u.x+1;e.y=u.y; const rnd=Math.random; Math.random=()=>0; doSearch(u,e); Math.random=rnd;
   const failKnown=pocketKnown(e); b.pocketSeen[e.id]=true; const again=searchTargets(u).includes(e);
   const d=b.units.find(v=>v.type==='goblin_shaman'); d.dead=true; return {failKnown, again, dead:pocketKnown(d)}; });
 assert.equal(g.failKnown,false);assert.equal(g.again,false);assert.equal(g.dead,true);ok('擲 1 搜不到；看穿過的不能再搜；打倒的背包打得開');

 // 四小隻卡片：頂端有被動感知；熟練格不在牠回合也看得到
 const pc=await pg.evaluate(()=>{ const b=B(), other=b.units.find(v=>v.side==='pc'&&v!==cur()); b.info=other.id; b.infoPage='status'; refreshBattle();
   const card=document.querySelector('.bt-info'); return {head:card.querySelector('.dim').textContent, slots:!!card.querySelector('.inf-slots'), econ:!!card.querySelector('.econ')}; });
 assert.match(pc.head,/被動感知 \d+/);assert(pc.slots);assert.equal(pc.econ,false);ok('四小隻卡片：被動感知、熟練格一律顯示；不是牠的回合不顯示燈號');

 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
