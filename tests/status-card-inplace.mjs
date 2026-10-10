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
 // 10-10 劇情／城鎮的狀態卡也有小筆記分頁；勾選唯讀（休息才能換），翻頁就地更新
 // 切到小筆記時紙娃娃、六圍本來就會換掉，只檢查視窗外框
 await pg.evaluate(()=>{window.__keep=[...document.querySelectorAll('.modal-back,.modal')];});await pg.locator('[data-infopage="notes"]').tap();assert.equal(await pg.locator('.character-status-card .note-page').count(),1);assert(await kept());
 assert(await pg.locator('.character-status-card .note-check').evaluateAll(a=>a.length>0&&a.every(b=>b.disabled)));assert.match(await pg.locator('.character-status-card .note-cap').innerText(),/休息時才能換/);
 if(await pg.locator('.character-status-card [data-notepage]').count()>1){await pg.locator('.character-status-card [data-notepage]').last().tap();assert.equal(await pg.evaluate(()=>state.statusCardUI.fox.notePages.fox),2);assert(await kept());}
 await pg.locator('[data-infopage="status"]').tap();assert.equal(await pg.locator('.character-status-card .note-page').count(),0);
 // 城鎮：升到有兩階熟練格，展開／收起；換武器組
 await pg.evaluate(()=>{state.page='town';state.modal=null;gainXP(['fox'],1800);levelUp('fox');state.modal={kind:'character',id:'fox'};render();});
 await watch();await pg.locator('[data-cardslt]').first().tap();assert.equal(await pg.locator('.inf-slots.open').count(),1);assert(await kept());
 await pg.locator('[data-cardslt]').first().tap();assert.equal(await pg.locator('.inf-slots.open').count(),0);assert(await kept());
 if(await pg.locator('[data-switchset]').count()){await pg.locator('[data-switchset]').first().tap();await pg.waitForTimeout(100);assert(await kept());}
 // 小筆記翻頁唯一入口 bindNotePages：戰場狀態卡、探索露營、旅店休息都走它
 {const bp=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});bp.on('pageerror',e=>errs.push(e.message));
  await bp.goto('file://'+path.resolve('index.html')+'#battle');await bootReady(bp);await bp.waitForTimeout(300);
  await bp.evaluate(()=>{state.modal=null;B().phase='explore';B().info='fox';B().infoPage='notes';refreshBattle();});
  await bp.locator('.bt-info [data-notepage]').last().tap();assert.equal(await bp.evaluate(()=>B().notePages.fox),2);
  await bp.locator('.bt-info [data-notepage]').first().tap();assert.equal(await bp.evaluate(()=>B().notePages.fox),1);
  await bp.evaluate(()=>{B().info=null;refreshBattle();exploreCmd('rest');});await bp.locator('.rest-box [data-notepage]').last().tap();assert.equal(await bp.evaluate(()=>B().notePages.fox),2);assert.equal(await bp.locator('.rest-box').count(),1);
  await bp.close();}
 // 前面把 townRest 清掉測序章了，旅店另開一頁
 {const ip=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});ip.on('pageerror',e=>errs.push(e.message));await ip.goto('file://'+path.resolve('index.html')+'#town');await bootReady(ip);await ip.waitForTimeout(300);
  await ip.evaluate(()=>{state.page='town';openTownPlace('inn');});await ip.locator('#townAction').tap();await ip.locator('.rest-box [data-notepage]').last().tap();assert.equal(await ip.evaluate(()=>state.townRest.notePages.fox),2);assert.equal(await ip.locator('.rest-box').count(),1);await ip.close();}
 assert.deepEqual(errs,[]);console.log('✓ 劇情／城鎮狀態卡就地更新：小筆記分頁（唯讀、翻頁）、翻頁共用入口（戰場卡／露營／旅店）、升級（含序章光暈與收掉）、熟練格展開收起、換武器組，外框／紙娃娃／六圍不重建');
}finally{await br.close();}
