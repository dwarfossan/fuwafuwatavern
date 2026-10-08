// 阻截（長柄架式）：走進範圍就挨一下，敵我同一套（大爺 10-02）；挨過打的移動不能取消；躲著走的不會被阻截
import {chromium} from 'playwright';
import {bootReady} from './boot.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=(name)=>console.log('✓ '+name);
try{
 const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');await bootReady(pg);
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
 await pg.evaluate(()=>{ endTurn=()=>{}; nextTurn=()=>{}; B().tut=-1; });

 // 把其他敵人移遠，哥布林 B 擺阻截架式站在 (gx,gy)；目前輪到的四小隻從 3 格外走到牠旁邊
 const setup=()=>pg.evaluate(async()=>{ const b=B(), u=cur();
   b.units.filter(v=>v.side==='foe').forEach((v,i)=>{ v.x=0; v.y=i; v.statuses=[]; v.dead=false; v.down=false; v.hp=v.maxHp; v.oaUsed=true; });
   const g=b.units.find(v=>v.type==='goblin'&&v!==b.units.find(w=>w.type==='goblin'));
   // 找一條直線：u 在 (x0,y)，g 在 (x0+4,y)，中間都能走
   let spot=null;
   for(let y=2;y<b.def.h-2&&!spot;y++) for(let x=2;x<b.def.w-6&&!spot;x++){
     const line=[0,1,2,3,4].map(i=>({x:x+i,y}));
     if(line.every(p=>!blocked(p.x,p.y)&&(!unitAt(p.x,p.y)||unitAt(p.x,p.y)===u))&&b.def.tiles?.[y]?.[x]!=='grass') spot=line; }
   u.x=spot[0].x; u.y=spot[0].y; u.statuses=[]; g.x=spot[4].x; g.y=spot[4].y;
   addStatus(g,'stance',{via:'guard', until:'start', of:g.id});
   b.moveLeft=6; b.movedThisTurn=false; b.actionUsed=false; b.busy=false; b.pendingMove=null; b.menu='root';
   const hits=[]; const wa=weaponAttack; weaponAttack=(a,t,o)=>{ hits.push(a.id+'>'+t.id); return {hit:false}; };
   pcMove(spot[3].x, spot[3].y);
   await new Promise(r=>{ const w=()=>b.busy?setTimeout(w,50):r(); setTimeout(w,50); });
   weaponAttack=wa;
   return {hits, gid:g.id, uid:u.id, stance:!!hasVia(g,'stance','guard'), pending:!!b.pendingMove, at:[u.x,u.y], to:[spot[3].x,spot[3].y], log:b.log.slice(-3).map(l=>l.t).join(' / ')};
 });

 const r=await setup();
 assert.deepEqual(r.at,r.to,'應該走到目的地');
 assert.deepEqual(r.hits,[r.gid+'>'+r.uid]);assert.equal(r.stance,false);assert.match(r.log,/阻截/);
 assert.equal(r.pending,false,'挨過打的移動不能取消');
 ok('四小隻走進敵人的阻截範圍：挨一下、架式用掉、這次移動不能取消');

 // 躲著走（例如沿著草叢）：還躲著的那一步不會被阻截。走到空地被看到會先現身，之後一樣會挨（checkExposure）
 const h=await pg.evaluate(()=>{ const b=B(), u=cur(), g=b.units.find(v=>hasVia(v,'stance','guard'))||b.units.find(v=>v.side==='foe');
   g.statuses=[]; addStatus(g,'stance',{via:'guard', until:'start', of:g.id}); addStatus(u,'hidden',{val:30,roll:20});
   u.x=g.x-1; u.y=g.y; const hits=[]; const wa=weaponAttack; weaponAttack=(a,t)=>{ hits.push(a.id); return {hit:false}; };
   checkGuards(u, {x:g.x-3, y:g.y}); weaponAttack=wa; return {hits, stance:!!hasVia(g,'stance','guard')}; });
 assert.deepEqual(h.hits,[]);assert.equal(h.stance,true);ok('躲著走進去：不會被阻截');

 assert.deepEqual(errors,[]);ok('沒有錯誤');
}finally{await br.close();}
