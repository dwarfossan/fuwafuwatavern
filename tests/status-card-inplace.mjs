// 10-10：劇情／城鎮的狀態卡只就地更新——升級、熟練格展開、換武器組都不重建外框（重建會重播淡入＝閃）；
// 沒有戰場／旅店單位時（序章）升級也有歡呼光暈，2.4 秒後收掉。
import {chromium} from 'playwright';import {bootReady} from './boot.mjs';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch(),errs=[];
try{
 const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+path.resolve('index.html')+'#town');await bootReady(pg);await pg.waitForTimeout(300);
 const watch=()=>pg.evaluate(()=>{window.__keep=[...document.querySelectorAll('.modal-back,.modal,.status-paper .inf-doll,.status-abilities')];return window.__keep.length;});
 const kept=()=>pg.evaluate(()=>window.__keep.every(n=>n.isConnected));
 // 序章：沒有戰場也沒有旅店資料
 await pg.evaluate(()=>{state.battle=null;state.townRest=null;state.page='story';state.scene='prologue';state.line=0;gainXP(['fox'],900);state.modal={kind:'character',id:'fox'};render();});
 assert.equal(await watch(),4);
 await pg.locator('[data-levelup="fox"]').tap();
 assert.equal(await pg.evaluate(()=>critterLevel('fox')),2);assert.equal(await pg.locator('.dl-level-aura').count(),1);assert(await kept());
 assert.equal(await pg.locator('[data-anchor="fox"] .level-message').count(),1);
 await pg.waitForTimeout(2600);assert.equal(await pg.locator('.dl-level-aura').count(),0);assert(await kept());
 // 城鎮：升到有兩階熟練格，展開／收起；換武器組
 await pg.evaluate(()=>{state.page='town';state.modal=null;gainXP(['fox'],1800);levelUp('fox');state.modal={kind:'character',id:'fox'};render();});
 await watch();await pg.locator('[data-cardslt]').first().tap();assert.equal(await pg.locator('.inf-slots.open').count(),1);assert(await kept());
 await pg.locator('[data-cardslt]').first().tap();assert.equal(await pg.locator('.inf-slots.open').count(),0);assert(await kept());
 if(await pg.locator('[data-switchset]').count()){await pg.locator('[data-switchset]').first().tap();await pg.waitForTimeout(100);assert(await kept());}
 assert.deepEqual(errs,[]);console.log('✓ 劇情／城鎮狀態卡就地更新：升級（含序章光暈與收掉）、熟練格展開收起、換武器組，外框／紙娃娃／六圍不重建');
}finally{await br.close();}
