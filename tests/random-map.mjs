import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const url='file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html');
const errors=[];pg.on('pageerror',e=>errors.push(e.message));
try{
 await pg.addInitScript(()=>{window.__realTimeout=window.setTimeout;window.setTimeout=()=>0;window.setInterval=()=>0;});
 await pg.goto(url+'#battle?seed=123&phase=combat');
 const first=await pg.evaluate(()=>JSON.stringify(generateRandomBattle(123)));
 assert.equal(await pg.evaluate(()=>B().def.seed),123);
 assert.equal(first,await pg.evaluate(()=>JSON.stringify(generateRandomBattle(123))));
 assert.notEqual(first,await pg.evaluate(()=>JSON.stringify(generateRandomBattle(124))));
 const maps=await pg.evaluate(()=>Array.from({length:50},(_,seed)=>generateRandomBattle(seed)));
 // 獨立 BFS，不用產生器自身的驗證當作測試結果。
 for(const d of maps){assert.equal(d.w,23);assert.equal(d.h,26);assert.equal(d.foes.length,4);assert(d.elev.some(e=>e.h===2));
  const blocks=new Set(d.blocks.filter(q=>q.kind!=='bush').map(q=>`${q.x},${q.y}`));
  const points=[...d.party,...d.foes.map(q=>[q.x,q.y])],seen=new Set([points[0].join(',')]),queue=[points[0]];
  assert.equal(new Set(points.map(p=>p.join(','))).size,8);
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
   const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(nx<0||ny<0||nx>=d.w||ny>=d.h||blocks.has(k)||seen.has(k))continue;seen.add(k);queue.push([nx,ny]);}}
  assert(points.every(p=>seen.has(p.join(','))),'種子 '+d.seed+' 不連通');
 }
 assert(await pg.getByText('Seed 123',{exact:false}).isVisible());
 await pg.evaluate(()=>{const b=B();b.turn=b.units.findIndex(u=>u.id==='fox');b.busy=false;b.tut=-1;b.moveMode=false;render();centerCam(cur().x,cur().y);});
 await pg.locator('[data-cmd="move"]').click();
 await pg.locator('[data-cmd="walk"]').count().then(async n=>{if(n)await pg.locator('[data-cmd="walk"]').click();});
 // 真觸控點相鄰可達格，沿用遊戲移動；只恢復演出計時，不讓 AI 換回合。
 const dest=await pg.evaluate(()=>{window.setTimeout=window.__realTimeout;const b=B(),u=cur();for(const [k,pth] of reachable(u,b.moveLeft)){if(!pth.length)continue;const [x,y]=k.split(',').map(Number),p=iso(x,y),r=document.querySelector('.board-wrap').getBoundingClientRect(),z=camZoom(),cx=r.left+b.cam.x+p.x*z,cy=r.top+b.cam.y+(p.y+TH/2)*z,el=document.elementFromPoint(cx,cy);if(el?.closest('[data-tile]')?.dataset.tile===k)return {x,y,cx,cy};}return null;});
 assert(dest,'可點的可達格');await pg.touchscreen.tap(dest.cx,dest.cy);
 await pg.waitForFunction(p=>cur().x===p.x&&cur().y===p.y,dest);
 await pg.getByRole('button',{name:'確認',exact:true}).count().then(async n=>{if(n)await pg.getByRole('button',{name:'確認',exact:true}).click();});
 if(process.env.RANDOM_SCREENSHOT)await pg.screenshot({path:process.env.RANDOM_SCREENSHOT});
 await pg.reload();assert.equal(await pg.evaluate(()=>JSON.stringify(generateRandomBattle(B().def.seed))),first);
 await pg.goto(url+'#battle');assert.equal(await pg.evaluate(()=>B().id),'random');assert(Number.isInteger(await pg.evaluate(()=>B().def.seed)));
 await pg.evaluate(()=>startBattle('ambush'));assert.equal(await pg.evaluate(()=>B().def.after),'caravan');
 assert.deepEqual(errors,[]);console.log('✓ 固定種子重現、不同種子不同、50 種子連通、隨機入口、固定伏擊保留、手機種子顯示');
}finally{await br.close();}
