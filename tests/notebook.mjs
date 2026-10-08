import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {bootReady} from './boot.mjs';
const browser=await chromium.launch();try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 await p.evaluate(()=>{const b=B();b.busy=false;b.exploreRest=true;b.tut=99;b.units.filter(u=>u.side==='pc').forEach(u=>{u.slots=[0];u.pendingLearned=[];});b.units.find(u=>u.id==='fox').pendingLearned=[{key:'burning_hands',name:'燃燒之手',from:'測試',lv:1}];b.units.find(u=>u.id==='wolf').pendingLearned=[{key:'ray_of_frost',name:'寒冷射線',from:'測試',lv:1}];refreshBattle();});
 assert.equal(await p.locator('[data-rest-who]').count(),4);assert.equal(await p.locator('.rest-box .note-cap').count(),1);
 await p.locator('[data-rest-who="wolf"]').tap();await p.locator('[data-restpick="wolf:ray_of_frost"]').uncheck();
 await p.locator('[data-rest-who="fox"]').tap();await p.locator('.rest-box [data-skinfo]').first().tap();assert(await p.locator('.modal .md-effect').isVisible());await p.locator('.md-x').tap();
 await p.locator('#shortRest').tap();
 assert(await p.evaluate(()=>state.learned.fox.some(n=>n.key==='burning_hands')));assert(!(await p.evaluate(()=>state.learned.wolf.some(n=>n.key==='ray_of_frost'))));
 assert.equal(await p.locator('.copy-pencil').count(),1);
 const pencil=await p.locator('.copy-pencil').boundingBox();assert(pencil.y>=0&&pencil.y+pencil.height<=844);
 if(process.env.NOTE_SHOT)await p.screenshot({path:process.env.NOTE_SHOT});
 await p.waitForFunction(()=>!B().noteCopy);assert.equal(await p.locator('.copy-pencil').count(),0);
 // 城鎮也使用同一份狀態小筆記元件與四頭像。
 await p.evaluate(()=>{B().result='win';leaveBattleTo('caravan');state.page='town';state.townPlace='inn';state.townPanel='rest';render();});
 assert.equal(await p.locator('[data-rest-who]').count(),4);await p.locator('[data-rest-who="raccoon"]').tap();assert((await p.locator('.note-cap').textContent()).includes('默默'));
 assert.deepEqual(errors,[]);console.log('✓ shared status notebook, head switching, preserved copy choices, original skill UI, copy animation, town reuse');
}finally{await browser.close();}
