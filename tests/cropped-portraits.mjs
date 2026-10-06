import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[],merchantRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/merchant.webp'))merchantRequests.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"roll":1,"shop":1}'));
 await page.goto('file://'+path.resolve('index.html')+'#town');await page.locator('[data-town-place]').first().waitFor();
 for(const [place,id] of [['inn','mira'],['guild','ada'],['smith','brun'],['items','liliana']]){
  await page.locator(`[data-town-place="${place}"]`).tap();
  const portrait=page.locator(`.actor.${id} .portrait`);await page.waitForFunction(id=>document.querySelector(`.actor.${id} .portrait`).classList.contains('portrait-ready'),id);
  const base=await portrait.locator('.pt-base').boundingBox();assert(Math.abs(base.width-base.height)<.01,'新底圖不得拉伸');
  const faces=await page.evaluate(id=>PORTRAITS[id].list,id);
  for(const [i,face] of faces.entries()){
   await page.evaluate(({id,face})=>setPortraitFace(document.querySelector('.actor.'+id),face),{id,face});
   assert.equal(await portrait.locator('.npc-face-sheet').getAttribute('data-face'),face);
   assert.equal(await portrait.locator('.npc-face-sheet').evaluate(e=>Number(e.style.getPropertyValue('--face'))),i);
   assert.deepEqual(await portrait.locator('.pt-base').boundingBox(),base,'換表情不得移動底圖');
   const features=await portrait.locator('.npc-face-sheet').boundingBox();assert(features.x>=base.x&&features.y>=base.y&&features.x+features.width<=base.x+base.width&&features.y+features.height<=base.y+base.height);
   await page.screenshot({path:`/tmp/cropped-${id}-${face}.png`,clip:{x:Math.max(0,features.x-18),y:Math.max(0,features.y-22),width:Math.min(190,390-Math.max(0,features.x-18)),height:Math.min(190,844-Math.max(0,features.y-22))}});
  }
  await page.evaluate(id=>setPortraitFace(document.querySelector('.actor.'+id),'smile'),id);
  await page.screenshot({path:`/tmp/cropped-${id}-town.png`});
  if(place==='smith'||place==='items'){
   await page.locator('#townAction').tap();assert(await page.locator('.quip .portrait').evaluate(e=>e.classList.contains('portrait-ready')));await page.screenshot({path:`/tmp/cropped-${id}-shop.png`});await page.locator('#leaveTownShop').tap();
  }
  if(place==='items'){
   await page.evaluate(()=>loadEntryImage(PORTRAITS.merchant.base));const before=merchantRequests.length;assert.equal(before,1,'進道具屋先背景請求商人單圖');
   await page.locator('#townStreet').tap();assert(await page.locator('.actor.merchant .portrait').evaluate(e=>e.classList.contains('portrait-ready')));assert.equal(await page.locator('.actor.merchant img').count(),1,'商人無表情層');assert.equal(merchantRequests.length,before,'送貨演出沿用已解碼商人圖');await page.waitForTimeout(1100);await page.screenshot({path:'/tmp/cropped-merchant-supplier.png'});
   await page.evaluate(()=>{state.scene='caravan';state.line=0;render();});await page.screenshot({path:'/tmp/cropped-merchant-caravan.png'});
  }else await page.locator('#townStreet').tap();
 }
 assert.deepEqual(errors,[]);console.log('PASS 390×844：四位店主48表情逐張切换／底圖不移動／新圖等比，兩店頭像與送貨商人單層預載');
}finally{await browser.close();}
