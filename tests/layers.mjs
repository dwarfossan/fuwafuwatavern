// 第一段分層驗收：DOM 隔離、真實觸控點格、共用鏡頭。規則不在這裡重測。
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];pg.on('pageerror',e=>errors.push(e.message));
// 凍結 AI／演出定時器，避免回合自行前進；觸控仍用瀏覽器原生事件。
await pg.addInitScript(()=>{window.setTimeout=()=>0;window.setInterval=()=>0;let s=42;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);});
try{
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await pg.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
 await pg.evaluate(()=>{const b=B();b.turn=b.units.findIndex(v=>v.id==='fox');b.busy=false;b.tut=-1;b.focusReq=false;b.mode=null;b.moveMode=false;render();});
 const identity=await pg.evaluate(()=>{
  const ids=['board-floor','board-marks','board-scene'];
  const layers=ids.map(id=>document.getElementById(id));
  const children=layers.map(e=>e.firstElementChild);const ui=document.querySelector('[data-battle-ui="head"]').firstElementChild;
  B().moveMode=true;updateBoardMarks();
  const marksOnly=layers[0].firstElementChild===children[0]&&layers[2].firstElementChild===children[2]&&document.querySelector('[data-battle-ui="head"]').firstElementChild===ui&&layers[1].firstElementChild===children[1];
  const mark=layers[1].firstElementChild;updateBoardFloor();
  const floorOnly=layers[1].firstElementChild===mark&&layers[2].firstElementChild===children[2];
  const floor=layers[0].firstElementChild,wrap=document.querySelector('.board-wrap'),board=document.querySelector('.board');render();
  const retained=ids.every((id,i)=>document.getElementById(id)===layers[i])&&layers[0].firstElementChild===floor&&document.querySelector('.board-wrap')===wrap&&document.querySelector('.board')===board;
  const old=layers[0].firstElementChild;bumpFloor();function bumpFloor(){B().def.road=[...B().def.road,[0,0]];render();}
  const terrain=layers[0].firstElementChild!==old;
  return {marksOnly,floorOnly,retained,terrain};
 });
 for(const [k,v] of Object.entries(identity)){assert(v,k);console.log('✓ '+k);}
 // 選攻擊只允許必要的標示／指令列更新；場景與未變的 UI 節點必須保留。
 const aimStable=await pg.evaluate(()=>{
  const b=B(),u=cur(),sk=unitSkills(u).find(s=>s.impl&&!s.impl.passive&&s.impl.target);
  if(!sk)return false;
  b.mode=null;b.menu='skills';refreshBattle();
  const scene=document.getElementById('board-scene').firstElementChild;
  const head=document.querySelector('[data-battle-ui="head"]').firstElementChild;
  const order=document.querySelector('[data-battle-ui="order"]').firstElementChild;
  const dice=document.querySelector('[data-battle-ui="dice"]').firstElementChild;
  chooseSkill(sk.key);
  return document.getElementById('board-scene').firstElementChild===scene
    &&document.querySelector('[data-battle-ui="head"]').firstElementChild===head
    &&document.querySelector('[data-battle-ui="order"]').firstElementChild===order
    &&document.querySelector('[data-battle-ui="dice"]').firstElementChild===dice;
 });
 assert(aimStable);console.log('✓ 選攻擊不重建場景與未變 UI');
 const uiMorph=await pg.evaluate(()=>{
  const b=B(), hud=document.querySelector('[data-battle-ui="hud"]'), hudChild=hud.firstElementChild, marks=document.getElementById('board-marks').firstElementChild, scene=document.getElementById('board-scene').firstElementChild;
  b.menu=b.menu==='root'?'skills':'root';refreshBattle();
  return {hud:hud.firstElementChild===hudChild,marks:document.getElementById('board-marks').firstElementChild===marks,scene:document.getElementById('board-scene').firstElementChild===scene};
 });
 assert(uiMorph.hud&&uiMorph.marks&&uiMorph.scene);console.log('✓ 玩家 UI 切換就地更新，不拔 layer DOM');
 // 對每種格子送原生 touch，驗證 SVG use 不會吞掉 data-tile。
 await pg.evaluate(()=>{window.__tile=null;clickTile=(x,y)=>{window.__tile=[x,y]};B().moveMode=false;B().mode=null;render();});
 for(const [x,y,moving] of [[10,15,false],[10,15,true],[2,21,false],[2,21,true]]){
  const pos=await pg.evaluate(({x,y,moving})=>{const b=B();cur().x=x;cur().y=y;b.moveLeft=6;b.moveMode=moving;render();centerCam(x,y);const r=document.querySelector('.board-wrap').getBoundingClientRect(),p=iso(x,y),z=camZoom();return {x:r.left+b.cam.x+p.x*z,y:r.top+b.cam.y+(p.y+TH/2+8)*z};},{x,y,moving});
  // 改點旁邊的空格，以免點到角色模型。精確找可點且可見的 top polygon。
  const hit=await pg.evaluate(({x,y})=>{
   const b=B(),r=document.querySelector('.board-wrap').getBoundingClientRect(),z=camZoom();
   for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const tx=x+dx,ty=y+dy,p=iso(tx,ty),cx=r.left+b.cam.x+p.x*z,cy=r.top+b.cam.y+(p.y+TH/2)*z;const el=document.elementFromPoint(cx,cy);if(el?.closest('[data-tile]')?.dataset.tile===`${tx},${ty}`)return {cx,cy,tx,ty};}
   return null;
  },{x,y});
  assert(hit,'可見空格');await pg.touchscreen.tap(hit.cx,hit.cy);
  assert.deepEqual(await pg.evaluate(()=>window.__tile),[hit.tx,hit.ty]);console.log(`✓ touch ${moving?'highlight':'floor'} ${x},${y}`);
 }
 const cdp=await pg.context().newCDPSession(pg);
 const old=await pg.evaluate(()=>({cam:{...B().cam},z:camZoom()}));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:170,y:340}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:210,y:380}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert(await pg.evaluate(old=>B().cam.x!==old.cam.x||B().cam.y!==old.cam.y,old));console.log('✓ touch drag');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:130,y:350,id:1},{x:230,y:350,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:350,id:1},{x:260,y:350,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert(await pg.evaluate(z=>camZoom()>z,old.z));console.log('✓ touch pinch');
 assert(await pg.evaluate(()=>['board-floor','board-marks','board-scene'].every(id=>document.getElementById(id).closest('.board')===document.querySelector('.board'))));console.log('✓ shared camera');
 // 爆擊拉近解除時，留下同一個 SVG；重開戰鬥、離開戰鬥與 modal 仍可正常顯示。
 await pg.evaluate(()=>{window.__svg=document.querySelector('.board');B().critOn={x:cur().x,y:cur().y};render();});
 assert(await pg.evaluate(()=>document.querySelector('.board')===window.__svg&&window.__svg.classList.contains('crit-zoom')));
 await pg.evaluate(()=>{B().critOn=null;render();});assert(await pg.evaluate(()=>!window.__svg.classList.contains('crit-zoom')&&!window.__svg.style.transformOrigin));console.log('✓ critical camera');
 await pg.evaluate(()=>{state.modal={kind:'item',id:ITEMS[0].id};render();render();});assert.equal(await pg.locator('.modal-back').count(),1);
 await pg.evaluate(()=>{state.modal=null;render();});assert.equal(await pg.locator('.modal-back').count(),0);console.log('✓ modal lifecycle');
 const hud=await pg.evaluate(()=>{ const sc=document.querySelector('#board-scene')||document.querySelector('.board'); const all=[...sc.querySelectorAll('.token, .hud')];
   const lastToken=all.map(e=>e.classList.contains('token')).lastIndexOf(true), firstHud=all.findIndex(e=>e.classList.contains('hud'));
   const live=B().units.filter(v=>!v.dead&&!foeHid(v)).length;
   return {order:firstHud>lastToken, n:sc.querySelectorAll('.hud[data-tile]').length, live, ol:sc.querySelectorAll('.hid-ol').length}; });
 assert(hud.order);assert.equal(hud.n,hud.live);assert.equal(hud.ol,0);console.log('✓ 血條在最上層、每隻都能點，沒有剪影外框（10-03）');
 await pg.evaluate(()=>startBattle('ambush'));assert(await pg.evaluate(()=>!!document.getElementById('board-floor')));console.log('✓ retry battle');
 await pg.evaluate(()=>{state.page='cover';render();});assert.equal(await pg.locator('.board').count(),0);console.log('✓ leave battle');
 assert.deepEqual(errors,[]);console.log('✓ no browser errors');
}finally{await br.close();}
