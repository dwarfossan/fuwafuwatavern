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

 // 潛行統一（大爺 10-02）：沒過 13＝沒躲好；察覺用被動感知不擲骰；搜索一起找 6 格內躲著的
 const h=await pg.evaluate(()=>{ const b=B(), u=cur(), rnd=Math.random, out={};
   const e=b.units.find(v=>v.side==='foe'&&!v.dead&&!v.down&&v.type!=='goblin_shaman'); e.statuses=e.statuses.filter(s=>s.k!=='hidden');
   e.x=u.x+2; e.y=u.y; b.units.filter(v=>v.side==='pc').forEach(v=>v.statuses=v.statuses.filter(s=>s.k!=='hidden'));
   // 劇情伏擊：擲 1 沒過 13，四隻都看到
   Math.random=()=>0; scoutBattle('ambush'); out.scoutAll=Object.values(state.scout.foes)[0].spotted.length; out.scoutHide=Object.values(state.scout.foes)[0].hide;
   Math.random=()=>0.999; scoutBattle('ambush'); out.scoutHigh=Object.values(state.scout.foes)[0].hide; state.scout=null;
   // 潛行擲 1：沒躲好
   Math.random=()=>0; out.failHide=tryHide(e); out.failHidden=foeHid(e); Math.random=rnd;
   // 被動察覺：剛好等於就發現、差 1 就沒發現，跟亂數無關
   e.statuses.push({k:'hidden', val:15}); u.mods.WIS=4; Math.random=()=>0; perceive(u); out.passiveLow=foeHid(e);
   u.mods.WIS=5; perceive(u); out.passiveEq=foeHid(e); Math.random=rnd;
   // 搜索四周：擲 20 找到、擲 1 找不到也不寫紀錄
   u.mods.WIS=0; e.statuses.push({k:'hidden', val:15}); b.freeUsed=false; b.actionUsed=false;
   const n0=b.log.length; Math.random=()=>0; doSearch(u,null); out.searchLowHidden=foeHid(e); out.leak=b.log.slice(n0).some(l=>/躲著|發現/.test(l.t));
   b.freeUsed=false; Math.random=()=>0.999; doSearch(u,null); out.searchHighHidden=foeHid(e); Math.random=rnd;
   // 附近沒有能看穿的，搜索按鈕照樣能按（不然等於告訴玩家附近有東西）
   b.units.filter(v=>v.side==='foe').forEach(v=>b.pocketSeen[v.id]=true); b.freeUsed=false; b.actionUsed=false; b.busy=false; b.mode=null; b.menu='act'; refreshBattle();
   const btn=document.querySelector('[data-cmd="search"]'); out.btn=!!btn&&!btn.disabled;
   return out; });
 assert.equal(h.scoutAll,4);assert(h.scoutHide<13);assert(h.scoutHigh>=13);ok(`伏擊：薩滿擲不到 13（${h.scoutHide}）四隻都看到；擲高（${h.scoutHigh}）照數字比`);
 assert.equal(h.failHide,false);assert.equal(h.failHidden,false);ok('潛行沒過 13：沒躲好');
 assert.equal(h.passiveLow,true);assert.equal(h.passiveEq,false);ok('察覺用被動感知：14 找不到 15、15 找到 15，亂數不影響');
 assert.equal(h.searchLowHidden,true);assert.equal(h.leak,false);assert.equal(h.searchHighHidden,false);ok('搜索四周：擲 20 找到躲著的；擲 1 找不到也不洩漏');
 assert(h.btn);ok('附近沒東西可看穿，搜索照樣能按');

 // 拿掉 ???（大爺 10-02）：躲著的敵人不在先攻列；被察覺時面板攤開潛行骰和被動感知；從藏身處出手補演出
 const v2=await pg.evaluate(()=>{ const b=B(), u=cur(), rnd=Math.random, out={};
   const sh=b.units.find(v=>v.type==='goblin_shaman'); sh.dead=false; sh.down=false; sh.hp=sh.maxHp;
   sh.statuses=sh.statuses.filter(s=>s.k!=='hidden'); sh.statuses.push({k:'hidden',val:19,roll:17}); refreshBattle();
   out.ord=document.querySelectorAll('.ord').length; out.need=b.units.filter(v=>v.side!=='npc'&&!foeHid(v)).length;
   const t=b.units.find(v=>v.side==='pc'&&!v.down&&!v.dead); sh.x=t.x+3; sh.y=t.y;
   out.pcs=b.units.filter(v=>v.side==='pc'&&!v.dead&&!v.down).length;   // 出手前算：火焰箭可能把目標打倒
   const bolt=foeUsable(sh).find(s=>s.def.name==='火焰箭'); b.marks=[]; doSkill(sh,bolt,t);
   out.rows=b.panel.rows.slice(0,2).map(r=>`${r.tname}:${r.rolls[0]}→${r.total}:${r.res}${r.still?':still':''}`);
   out.marks=b.marks.filter(m=>m.kind==='sneak').length;
   out.revealed=!foeHid(sh);
   // 察覺成功：面板「X【察覺】」、頭上 !
   sh.statuses=sh.statuses.filter(s=>s.k!=='hidden'); sh.statuses.push({k:'hidden',val:5,roll:3}); sh.x=u.x+1; sh.y=u.y; b.marks=[];
   perceive(u); out.spotLabel=b.panel.label; out.spotRows=b.panel.rows.map(r=>`${r.tname}:${r.res}`).join(','); out.spotMark=b.marks.some(m=>m.id===u.id&&m.kind==='ok');
   return out; });
 assert.equal(v2.ord,v2.need);ok('先攻列沒有躲著的敵人（拿掉 ???）');
 assert.deepEqual(v2.rows,['潛行:17→19:hide','被動:10→'+v2.rows[1].split('→')[1].split(':')[0]+':fail:still']);assert.equal(v2.marks,v2.pcs);assert(v2.revealed);
 ok(`從藏身處出手：面板先攤潛行 17→19、被動感知（骰子停 10），四小隻頭上都跳 ?（${v2.rows.join(' / ')}）`);
 assert.match(v2.spotLabel,/【察覺】/);assert.equal(v2.spotRows,'潛行:hide,被動:found');assert(v2.spotMark);ok('察覺成功：面板「察覺」、潛行骰對被動感知，發現的那隻頭上 !');

 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
