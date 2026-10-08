// 戰鬥中換裝 AC 要跟著變（大爺 10-02：原本讀開戰前的背包清單，換裝後 AC 不變）
// 公式：沒穿 10＋敏捷；有穿＝護甲 AC＋敏捷（中甲最多 +2、重甲不加）；拿盾 +2
import {chromium} from 'playwright';
import {bootReady} from './boot.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=n=>console.log('✓ '+n);
try{
 const pg=await br.newPage({viewport:{width:390,height:844}});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');await bootReady(pg);
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg.waitForFunction(()=>B()&&B().units.length,null,{timeout:60000});
 const r=await pg.evaluate(()=>{
  const pcs=B().units.filter(v=>v.side==='pc'), start=pcs.map(u=>[u.id,acOfUnit(u),acOf(u.id)]);
  const swap=(id,name)=>{ const u=pcs.find(v=>v.id===id), i=u.backpack.findIndex(it=>it.n===name); if(i<0) return null; equipItemAt(u,`bag:${i}`,'armor'); return {armor:u.armor.n, ac:acOfUnit(u), dex:u.mods.DEX}; };
  const robe=swap('fox','+1 薩滿袍'), rags=swap('raccoon','破布衣');
  const tiger=pcs.find(v=>v.id==='tiger'), withShield=acOfUnit(tiger); equipItemAt(tiger,'offhand1','bag'); const noShield=acOfUnit(tiger);
  const wolf=pcs.find(v=>v.id==='wolf'), mid=acOfUnit(wolf), alt=swap('wolf','鑲釘皮甲');
  return {start,robe,rags,withShield,noShield,shieldNow:tiger.shield,mid,alt};
 });
 r.start.forEach(([id,a,b])=>assert.equal(a,b,`${id} 開戰時 AC 兩邊不一樣`));ok('開戰時：戰鬥 AC＝商店 AC（公式沒變）');
 assert.equal(r.robe.armor,'+1 薩滿袍');assert.equal(r.robe.ac,12+r.robe.dex);ok(`玲玲換上 +1 薩滿袍：AC ${r.robe.ac}（12＋敏捷 ${r.robe.dex}）`);
 assert.equal(r.rags.armor,'破布衣');assert.equal(r.rags.ac,10+r.rags.dex);ok(`默默換上破布衣：AC ${r.rags.ac}（10＋敏捷 ${r.rags.dex}）`);
 assert.equal(r.shieldNow,false);assert.equal(r.noShield,r.withShield-2);ok(`嬌嬌放下盾牌：AC ${r.withShield} → ${r.noShield}`);
 assert(r.alt);assert.equal(r.alt.ac,12+r.alt.dex);ok(`香香從鏈甲衫（${r.mid}）換鑲釘皮甲：AC ${r.alt.ac}（12＋敏捷）`);
 assert.deepEqual(errors,[]);ok('no browser errors');
}finally{await br.close();}
