import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"shop":1}'));
 await p.goto('file://'+path.resolve('index.html')+'#town');
 assert.equal(await p.locator('[data-town-place]').count(),4);assert.equal(await p.locator('#board-floor').count(),0);
 assert(await p.evaluate(()=>state.battle===null&&state.location==='town'&&state.townFounded&&state.townRest.units.filter(u=>u.side==='pc').length===4&&CRITTERS.every(c=>state.rolls[c.id]&&state.inv[c.id].length)));
 await p.locator('[data-town-place="items"]').tap();assert.equal(await p.locator('.town-page .portrait[data-portrait="liliana"]').count(),1);await p.locator('#townAction').tap();assert.equal(await p.evaluate(()=>state.shopContext),'items');await p.evaluate(()=>leaveTownShop());
 await p.locator('#townStreet').tap();assert.equal(await p.evaluate(()=>state.scene),'townSupplier');await p.evaluate(()=>{state.supplierSeen=true;state.page='town';state.townPlace=null;render();});
 await p.locator('[data-town-place="inn"]').tap();await p.locator('#townAction').tap();assert.equal(await p.locator('#longRest').count(),1);await p.locator('#longRest').tap();assert.equal(await p.evaluate(()=>state.page),'town');
 await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>B()),null);assert.deepEqual(errors,[]);
 if(process.env.REVIEW_SHOT)await p.screenshot({path:process.env.REVIEW_SHOT});console.log('✓ #town直達四店、準備屬性裝備／旅店資料、購物／商人事件／休息、沒有戰場計時器');
}finally{await br.close();}
