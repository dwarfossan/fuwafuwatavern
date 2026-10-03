// 進城固定劇情：所有檢定分支、偷包例外、商人離場與小隊成立。
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 const branches=await page.evaluate(()=>{
   const out=[];
   for(const pick of ['fox','tiger','wolf','raccoon'])for(const ok of [true,false]){
     state.caravan={pick,ok};const script=townArrivalScript();
     out.push({pick,ok,text:script.map(l=>l.text).join('\n'),draft:script.every(l=>l.draft==='GPT')});
   }return out;
 });
 for(const b of branches){
   assert.equal(b.text.includes('下次把箱子封好'),b.ok&&b.pick!=='raccoon');
   assert.equal(b.text.includes('退休了'),b.ok&&b.pick==='raccoon');
   assert(b.text.includes('毛絨絨小隊，成立'));assert(b.draft);
 }
 await page.evaluate(()=>{state.battle=null;state.modal=null;state.page='story';state.scene='townArrival';state.location='town';state.line=0;state.caravan={pick:'raccoon',ok:true};render();});
 assert.equal(await page.locator('.actor.merchant:not(.off)').count(),1);
 assert(await page.locator('#finishTownArrival').isDisabled());
 while(await page.evaluate(()=>SCENES.townArrival.script[state.line].on!=='none'))await page.locator('#stage').tap();
 assert.equal(await page.locator('.actor.merchant:not(.off)').count(),0);
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.actor.merchant')).opacity==='0');
 if(process.env.TOWN_SHOTS)await page.screenshot({path:path.join(process.env.TOWN_SHOTS,'town-goodbye.png')});
 while(await page.evaluate(()=>SCENES.townArrival.script[state.line].who!=='all'))await page.locator('#stage').tap();
 assert.equal(await page.locator('.pf.speaking').count(),4);
 if(process.env.TOWN_SHOTS)await page.screenshot({path:path.join(process.env.TOWN_SHOTS,'town-founding.png')});
 while(await page.evaluate(()=>state.line<SCENES.townArrival.script.length-1))await page.locator('#stage').tap();
 await page.locator('#finishTownArrival').tap();
 assert.equal(await page.evaluate(()=>state.townFounded),true);
 assert.equal(await page.evaluate(()=>state.page),'town');
 assert.equal(await page.locator('[data-town-place]').count(),4);
 assert.deepEqual(errors,[]);
 console.log('✓ eight branches, merchant leaves, four speak, mobile touch founding and finish');
}finally{await browser.close();}
