import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await p.evaluate(()=>{state.battle=null;state.modal=null;state.page='town';state.townPlace='items';state.caravan={pick:'raccoon',ok:true};render();});await p.locator('#townStreet').tap();assert.equal(await p.evaluate(()=>state.scene),'townSupplier');assert(await p.locator('.actor.merchant').isVisible());
 await p.locator('#stage').tap();await p.waitForFunction(()=>getComputedStyle(document.querySelector('.actor.merchant')).opacity==='0');
 assert(!(await p.evaluate(()=>SCENES.townSupplier.script.map(l=>l.text).join())).includes('走私'));
 if(process.env.SUPPLIER_SHOT)await p.screenshot({path:process.env.SUPPLIER_SHOT});
 while(await p.evaluate(()=>state.line<SCENES.townSupplier.script.length-1))await p.locator('#stage').tap();await p.locator('#finishSupplier').tap();assert.equal(await p.evaluate(()=>state.supplierSeen),true);
 await p.locator('[data-town-place="items"]').tap();await p.locator('#townStreet').tap();assert.equal(await p.evaluate(()=>state.page),'town');assert.deepEqual(errors,[]);console.log('✓ first exit sees supplier delivery, no new smuggling knowledge, departure once only');
}finally{await br.close();}
