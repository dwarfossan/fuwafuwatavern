import {chromium} from 'playwright';
import {bootReady} from './boot.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
try{
 await pg.goto('file://'+path.resolve('index.html')+'#battle');await bootReady(pg);await pg.waitForTimeout(500);
 await pg.evaluate(()=>{state.modal=null;B().phase="combat";gainXP(['fox'],900);B().info='fox';refreshBattle();});
 assert.equal(await pg.locator('.level-button.ready').count(),1);
 assert.equal(await pg.locator('.dl-level-aura').count(),0);
 await pg.locator('[data-levelup="fox"]').click();
 assert.equal(await pg.evaluate(()=>critterLevel('fox')),1);
 assert.equal(await pg.locator('.level-message').textContent(),'打完再升級');
 await pg.evaluate(()=>{B().phase='explore';const u=B().units.find(u=>u.id==='fox');state.initialHpDice.fox=10;u.maxHp=maxHpAt(1,u.mods.CON,'fox');u.hp=u.maxHp-2;/* 10-09：初始生命 1d10 可能只有 1～2，直接扣 2 會倒下，固定骰面讓「保留傷勢」可驗 */u.slots=[1];state.townRest=JSON.parse(JSON.stringify(B()));refreshBattle();});
 const before=await pg.evaluate(()=>{const u=B().units.find(u=>u.id==='fox');return {hp:u.hp,max:u.maxHp};});
 await pg.locator('[data-levelup="fox"]').click();
 const after=await pg.evaluate(()=>({lv:critterLevel('fox'),units:progressionUnits('fox').map(u=>({lv:u.level,hp:u.hp,max:u.maxHp,slots:u.slots,xp:u.xp})),saved:state.proficiency.fox}));
 assert.equal(after.lv,2);for(const u of after.units){assert.equal(u.lv,2);assert.equal(u.max-u.hp,2);assert(u.hp>before.hp);assert.deepEqual(u.slots,[2]);assert.equal(u.xp,900);}assert.deepEqual(after.saved,[2]);
 assert.equal(await pg.locator('.dl-level-aura').count(),2);assert.equal(await pg.locator('.dl-cheer').count(),2);
 await pg.waitForTimeout(400);await pg.screenshot({path:'/tmp/level-up-explore.png'});
 await pg.waitForTimeout(2600);assert.equal(await pg.locator('.dl-level-aura').count(),0);assert.equal(await pg.locator('.dl-cheer').count(),0);assert.equal(await pg.locator('.level-button.ready').count(),1);
 await pg.evaluate(()=>{state.battle=null;state.page='town';state.townPlace=null;render();});
 await pg.locator('[data-info="fox"]').click();assert.equal(await pg.locator('.character-status-card .status-paper .inf-doll>svg').count(),1);assert.match(await pg.locator('.character-status-card .status-paper .inf-doll>svg').evaluate(el=>getComputedStyle(el).transform),/matrix\(-1,/);assert.equal(await pg.locator('[data-levelup="fox"]').count(),1);
 await pg.evaluate(()=>{window.__keep=[...document.querySelectorAll('.modal-back,.status-paper,.status-abilities,.status-loadout')];});
 await pg.locator('[data-levelup="fox"]').click();assert.equal(await pg.evaluate(()=>critterLevel('fox')),3);
 // 10-10：升級只換卡上會變的部分，外框／裝備格／六圍不重建（重建會重播打開視窗的淡入＝閃一下）
 assert.equal(await pg.evaluate(()=>window.__keep.length>=4&&window.__keep.every(n=>n.isConnected)),true);assert.equal(await pg.locator('[data-anchor="fox"] .level-message').count(),1);assert.equal(await pg.locator('.dl-level-aura').count(),1);
 await pg.waitForTimeout(400);await pg.screenshot({path:'/tmp/level-up-town.png'});
 await pg.waitForTimeout(2600);assert.equal(await pg.locator('.dl-level-aura').count(),0);assert.equal(await pg.locator('.level-button.ready').count(),0);assert.equal(await pg.evaluate(()=>window.__keep.every(n=>n.isConnected)),true);
 await pg.evaluate(()=>{state.modal=null;state.page='story';state.scene='caravan';state.line=0;state.modal={kind:'character',id:'fox'};gainXP(['fox'],1800);render();});
 assert.equal(await pg.locator('.character-status-card .status-paper .inf-doll>svg').count(),1);assert.match(await pg.locator('.character-status-card .status-paper .inf-doll>svg').evaluate(el=>getComputedStyle(el).transform),/matrix\(-1,/);
 await pg.locator('[data-levelup="fox"]').click();assert.equal(await pg.evaluate(()=>critterLevel('fox')),4);
 await pg.evaluate(()=>{state.xp.fox=999999;state.level.fox=20;render();});assert.equal(await pg.locator('.level-button.ready').count(),0);assert.equal(await pg.evaluate(()=>levelUp('fox')),false);
 assert.deepEqual(errs,[]);console.log('✓ 手機點擊：戰鬥鎖定、探索／城鎮／劇情手動升級、資料同步、保留已用格與傷勢、共用歡呼光暈到期移除、逐級與滿級');
}finally{await br.close();}
