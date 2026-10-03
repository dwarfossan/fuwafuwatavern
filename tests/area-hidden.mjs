// 範圍招波及躲著的敵人（大爺 10-02：打的是一塊地方，躲在裡面的也會被打到，先現身再結算；指定目標的招還是打不到躲著的）
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
 await pg.evaluate(()=>{ endTurn=()=>{}; nextTurn=()=>{}; B().tut=-1; });

 // 每次：把哥布林 A 放到香香旁邊、藏起來，其他敵人移遠
 const run=(kind)=>pg.evaluate((kind)=>{ const b=B(), u=b.units.find(v=>v.id==='wolf');
   const foes=b.units.filter(v=>v.side==='foe'); foes.forEach((v,i)=>{ v.x=0; v.y=i; v.dead=false; v.down=false; v.hp=v.maxHp; v.statuses=[]; });
   const e=foes.find(v=>v.type==='goblin'); const free=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:u.x+dx,y:u.y+dy})).find(p=>!unitAt(p.x,p.y)&&!blocked(p.x,p.y));
   e.x=free.x; e.y=free.y; addStatus(e,'hidden',{val:30, roll:20});
   const n0=b.log.length; const rnd=Math.random; Math.random=()=>0.999;   // 擲最高：一定命中、豁免一定過，只看有沒有被選進去
   let hitList=[]; const wa=weaponAttack; weaponAttack=(a,t,o)=>{ hitList.push(t.id); return {hit:false}; };
   try{
     if(kind==='sweep') SKILL_IMPL.heavy[1].run(u);
     if(kind==='quake') SKILL_IMPL.mace[2].run(u);
     if(kind==='rain')  SKILL_IMPL.bow[2].run(u, {x:e.x, y:e.y});
     if(kind==='line')  SKILL_IMPL.crossbow[1].run(u, e);
     if(kind==='cone')  SKILL_IMPL.flame_orb[1].run(u, {x:e.x, y:e.y});
     if(kind==='multi'){ const t=foes.find(v=>v!==e); t.x=u.x+2; t.y=u.y; SKILL_IMPL.thrown[1].run(u, t); }
   } finally { Math.random=rnd; weaponAttack=wa; }
   return {hid:isHid(e), hitE:hitList.includes(e.id), log:b.log.slice(n0).map(l=>l.t).join(' / ')};
 }, kind);

 for(const [k,name] of [['sweep','橫掃'],['quake','震地'],['rain','箭雨'],['line','貫穿'],['cone','火焰錐']]){
   const r=await run(k);
   assert.equal(r.hid,false,name+'：躲著的應該現身');
   if(k==='sweep'||k==='line') assert.equal(r.hitE,true,name+'：應該打到躲著的');
   assert.match(r.log,/被波及，現身/);
   ok(`${name}：躲在範圍裡的被波及、現身`);
 }
 const m=await run('multi');
 assert.equal(m.hid,true);assert.equal(m.hitE,false);ok('多投（要指定目標）：躲著的不會被挑中、也不現身');
 assert.deepEqual(errors,[]);ok('沒有錯誤');
}finally{await br.close();}
