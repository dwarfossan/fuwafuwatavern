import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file='file://'+path.join(root,'index.html');
const browser=await chromium.launch();
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const faceRequests=[];
  page.on('request',request=>{if(request.url().includes('/assets/faces/'))faceRequests.push(request.url());});
  await page.goto(file,{waitUntil:'load'});
  await page.waitForTimeout(300);
  assert.equal(faceRequests.length,0,'封面不可預載表情圖');

  await page.goto(file+'?perf=town#town',{waitUntil:'load'});
  await page.waitForTimeout(300);
  for(const id of ['inn','smith','guild','items']){
    await page.locator(`[data-town-place="${id}"]`).click();
    await page.waitForFunction(()=>[...document.querySelectorAll('.actor .portrait img')].every(img=>img.complete&&img.naturalWidth>0));
    const townImages=await page.locator('.actor .portrait img').evaluateAll(images=>images.map(img=>img.getAttribute('src')));
    assert(townImages.length===2&&townImages.every(src=>src.endsWith('.webp')),`${id} 店主應載入兩張 WebP`);
    await page.locator('#townStreet').click();
  }

  await page.goto(file+'?perf=explore#battle?phase=explore',{waitUntil:'load'});
  await page.waitForTimeout(500);
  let timers=await page.evaluate(()=>({
    phase:B().phase,
    ui:globalThis.eval('battleUiTimer !== null'),
    ground:globalThis.eval('groundClockTimer !== null')
  }));
  assert.equal(timers.phase,'explore');
  assert.equal(timers.ui,true,'戰場內須啟動 UI 計時器');
  assert.equal(timers.ground,true,'探索中須啟動地面時鐘');

  timers=await page.evaluate(()=>{
    state.page='map';render();
    return {ui:globalThis.eval('battleUiTimer === null'),ground:globalThis.eval('groundClockTimer === null')};
  });
  assert.deepEqual(timers,{ui:true,ground:true},'離開戰場須停止兩個計時器');

  await page.goto(file+'?perf=combat#battle?phase=combat',{waitUntil:'load'});
  await page.waitForTimeout(500);
  const camera=await page.evaluate(()=>{
    const b=B(),index=b.units.findIndex(u=>u.side==='pc'),u=b.units[index];
    b.turn=index;b.busy=false;b.result=null;
    centerCam(u.x,u.y-1,false);
    const before={...b.cam};b.focusReq=true;bindBattle();
    return {focusCleared:!b.focusReq,stationary:before.x===b.cam.x&&before.y===b.cam.y,onScreen:onScreen(u)};
  });
  assert.deepEqual(camera,{focusCleared:true,stationary:true,onScreen:true},'可見的玩家回合不得強制置中鏡頭');

  const waitSetup=await page.evaluate(()=>{
    const b=B(),pcs=b.units.filter(u=>u.side==='pc'),rest=b.units.filter(u=>u.side!=='pc');
    b.explorationMap=false;b.units=[pcs[0],pcs[1],...rest];b.turn=0;b.busy=false;b.result=null;
    beginTurn(pcs[0]);centerCam(pcs[1].x,pcs[1].y-1,false);b.focusReq=false;refreshBattle();
    return {before:{...b.cam},next:pcs[1].id,visible:onScreen(pcs[1]),button:!!document.querySelector('[data-cmd="wait"]')};
  });
  assert.equal(waitSetup.visible,true,'待機前下一位玩家須在畫面內');
  assert.equal(waitSetup.button,true,'玩家回合須顯示待機按鈕');
  await page.locator('[data-cmd="wait"]').click();
  await page.waitForTimeout(80);
  const afterWait=await page.evaluate(before=>({
    next:cur().id,
    stationary:before.x===B().cam.x&&before.y===B().cam.y,
    focusCleared:!B().focusReq
  }),waitSetup.before);
  assert.deepEqual(afterWait,{next:waitSetup.next,stationary:true,focusCleared:true},'點待機後可見的下一位玩家不得強制置中鏡頭');
  console.log('PASS：封面零表情預載；四店 WebP 肖像；探索計時器啟動／離場停止；可見玩家焦點及實際待機均不移鏡。');
}finally{await browser.close();}
