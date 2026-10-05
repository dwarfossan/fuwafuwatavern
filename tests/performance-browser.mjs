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
  console.log('PASS：封面零表情預載；探索計時器啟動／離場停止；可見玩家回合不移鏡。');
}finally{await browser.close();}
