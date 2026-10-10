// 按鈕說明泡泡（大爺 10-10）：效果說明放泡泡、代價／原因留在按鈕小字。
// 電腦：游標移上去跳出、點下去消失；手機：按住才跳出，按住看完放開不算點擊，短按照常點擊。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady,noLuck} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123&phase=combat');await bootReady(p);await noLuck(p);
 const setup=()=>p.evaluate(()=>{const b=B();b.tut=-1;const u=b.units.find(v=>v.id==='raccoon');b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;b.actionUsed=false;b.freeUsed=0;b.movedThisTurn=false;b.menu='move';refreshBattle();});
 await setup();
 const dash=p.locator('[data-cmd="dash"]');
 assert.equal(await dash.locator('small').innerText(),'用掉主要動作','代價留在按鈕上');
 assert.match(await dash.getAttribute('data-tip'),/移動 \+6/,'效果放泡泡');
 // 電腦：移上去跳出、點下去消失
 await dash.hover();await p.locator('#game-bubble').waitFor();await p.screenshot({path:'/tmp/claude-0/tip.png'});assert.match(await p.locator('#game-bubble').innerText(),/衝刺[\s\S]*移動 \+6/);
 await p.mouse.down();assert.equal(await p.locator('#game-bubble').count(),0,'點下去消失');await p.mouse.up();
 assert.equal(await p.evaluate(()=>B().actionUsed),true,'電腦點擊照常執行');
 // 手機：按住跳出，放開不算點擊（滑鼠先移開，免得重畫時滑鼠的移出事件把泡泡關掉）
 await p.mouse.move(0,0);await setup();
 const hold=await p.evaluate(async()=>{const el=document.querySelector('[data-cmd="disengage"]');const ev=(t)=>el.dispatchEvent(new PointerEvent(t,{pointerType:'touch',bubbles:true,isPrimary:true}));
  ev('pointerdown');await new Promise(r=>setTimeout(r,450));const shown=document.querySelector('#game-bubble')?.innerText||'';ev('pointerup');el.click();
  return {shown,closed:!document.querySelector('#game-bubble'),action:B().actionUsed};});
 assert.match(hold.shown,/撤離[\s\S]*藉機攻擊/);assert(hold.closed,'放開消失');assert.equal(hold.action,false,'按住看說明不會做動作');
 // 手機：短按照常點擊
 const tap=await p.evaluate(async()=>{const el=document.querySelector('[data-cmd="disengage"]');const ev=(t)=>el.dispatchEvent(new PointerEvent(t,{pointerType:'touch',bubbles:true,isPrimary:true}));
  ev('pointerdown');await new Promise(r=>setTimeout(r,80));ev('pointerup');el.click();return {bubble:!!document.querySelector('#game-bubble'),action:B().actionUsed};});
 assert.deepEqual(tap,{bubble:false,action:true},'短按：不跳泡泡、照常執行');
 assert.deepEqual(errors,[]);
 console.log('✓ 按鈕泡泡：代價留按鈕、效果放泡泡；電腦移上跳出點下消失；手機按住看說明不觸發、短按照常');
}finally{await br.close();}
