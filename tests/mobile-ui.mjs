// 手機畫面回歸：封面、說明／角色泡泡；後續介面驗收也放這裡。
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=n=>console.log('✓ '+n);
try{
  const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errors=[];pg.on('pageerror',e=>errors.push(e.message));
  await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html'));
  await pg.waitForTimeout(500);
  const faces=await pg.locator('.row-critters>svg').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,right:r.right}}));
  assert.equal(faces.length,4);assert.equal(new Set(faces.map(e=>e.y)).size,1);assert(faces.every(e=>e.right<=390));
  assert(!(await pg.locator('.sub').innerText()).includes('今晚'));ok('封面四隻同排，文案符合午後');
  if(process.env.MOBILE_SCREENSHOTS) await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/cover.png'});
  await pg.locator('#start').click();
  assert.equal(await pg.locator('.rule').count(),0);
  await pg.locator('[data-pagehelp="roll"]').click();
  assert((await pg.locator('[role="dialog"]').innerText()).includes('4d6'));
  await pg.getByRole('button',{name:'關閉',exact:true}).click();
  assert.equal(await pg.locator('[role="dialog"]').count(),0);ok('屬性說明可開關，不占頁首');
  for(let i=0;i<4;i++){
    await pg.locator(`[data-tab="${i}"]`).click();await pg.locator('#rollAll').click();await pg.locator('#autoAssign').click();
  }
  await pg.locator('#next').click();await pg.waitForTimeout(500);
  const nav=await pg.locator('.fp-page>.nav').boundingBox();
  const line=await pg.evaluate(()=>state.line);
  await pg.locator('[data-info="fox"]').click();
  assert((await pg.locator('[role="dialog"]').innerText()).includes('愛研究'));
  const navAfter=await pg.locator('.fp-page>.nav').boundingBox();assert.equal(nav.y,navAfter.y);
  assert(navAfter.y+navAfter.height<=844);
  if(process.env.MOBILE_SCREENSHOTS){await pg.waitForTimeout(250);await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/character.png'});}
  await pg.getByRole('button',{name:'關閉',exact:true}).click();assert.equal(await pg.evaluate(()=>state.line),line);
  assert.equal(await pg.evaluate(()=>state.info),null);ok('角色介紹覆蓋顯示，關閉不推進劇情、不移動底部');
  await pg.locator('[data-info="tiger"]').click();await pg.keyboard.press('Escape');
  assert.equal(await pg.locator('[role="dialog"]').count(),0);ok('角色泡泡 Escape 可關閉');
  await pg.evaluate(()=>{state.line=SCENES.prologue.script.length-1;updateStoryLine();});
  await pg.locator('#toShop').click();await pg.locator('[data-pagehelp="shop"]').click();
  assert((await pg.locator('[role="dialog"]').innerText()).includes('負重'));
  await pg.getByRole('button',{name:'關閉',exact:true}).click();
  assert((await pg.locator('#depart').boundingBox()).y<844);ok('商店規則泡泡可關閉，出發仍可見');
  await pg.evaluate(()=>{state.page='map';state.travel=null;render();});
  await pg.locator('[data-pagehelp="map"]').click();assert((await pg.locator('[role="dialog"]').innerText()).includes('現在的位置'));
  await pg.getByRole('button',{name:'關閉',exact:true}).click();ok('大地圖說明泡泡可開關');
  await pg.waitForTimeout(500);
  const map=await pg.locator('.map-frame').boundingBox();
  assert(map.height>500);
  assert(await pg.locator('.map-frame').evaluate(e=>e.scrollWidth>e.clientWidth));
  assert(await pg.locator('.worldmap .loc text').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>15)));
  assert(await pg.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
  if(process.env.MOBILE_SCREENSHOTS) await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/map.png'});
  const mapLeft=await pg.locator('.map-frame').evaluate(e=>e.scrollLeft);
  const cdp=await pg.context().newCDPSession(pg);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:map.x+60,y:map.y+120}]});
  for(let i=1;i<=6;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:map.x+60+i*25,y:map.y+120}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await pg.waitForTimeout(250);
  assert(await pg.locator('.map-frame').evaluate(e=>e.scrollLeft)<mapLeft);
  await pg.locator('[data-pagehelp="map"]').click();
  const kept=await pg.locator('.map-frame').evaluate(e=>e.scrollLeft);
  await pg.getByRole('button',{name:'關閉',exact:true}).click();
  assert.equal(await pg.locator('.map-frame').evaluate(e=>e.scrollLeft),kept);
  for(const id of ['cave','forest','town','tavern']){
    await pg.locator(`[data-loc="${id}"]`).click();assert.equal(await pg.evaluate(()=>state.mapSel),id);
  }
  ok('大地圖填滿剩餘高度，地名放大，觸控滑動、四地點與說明位置保留正常');
  await pg.evaluate(()=>{window.setTimeout=()=>0;quickBattle();});await pg.waitForTimeout(500);
  await pg.evaluate(()=>{const b=B();b.turn=b.units.findIndex(u=>u.id==='fox');b.busy=false;b.tut=0;refreshBattle();});
  const boardWithTutorial=await pg.locator('.board-wrap').boundingBox();
  const tutorial=await pg.locator('.tut').boundingBox();
  assert(tutorial.y+tutorial.height<=boardWithTutorial.y);
  assert(boardWithTutorial.y+boardWithTutorial.height>=830);
  assert.equal(await pg.locator('.board-wrap .tut').count(),0);
  if(process.env.MOBILE_SCREENSHOTS) await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/battle-tutorial.png'});
  const floor=await pg.locator('#board-floor').evaluate(e=>{window.mobileFloor=e;return true;});
  await pg.locator('#tutNext').click();assert.equal(await pg.evaluate(()=>B().tut),1);
  await pg.locator('#tutClose').click();assert.equal(await pg.locator('.tut').count(),0);
  const board=await pg.locator('.board-wrap').boundingBox();
  assert(board.height>boardWithTutorial.height);assert(board.y<140);assert(board.height>650);
  assert(await pg.locator('#board-floor').evaluate(e=>e===window.mobileFloor));
  assert(await pg.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
  ok('教學位於戰場外，知道了／關閉可用；關閉後戰場擴大，地板圖層保留');
  if(process.env.MOBILE_SCREENSHOTS) await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/battle.png'});
  const ids=await pg.evaluate(()=>B().units.filter(u=>u.side!=='npc').map(u=>u.id));
  for(const id of ids){
    await pg.evaluate(id=>{B().info=id;B().infoPage='status';refreshBattle();},id);
    const separated=await pg.locator('.status-eqslot').evaluateAll(es=>es.every(e=>{
      const label=e.querySelector('small'),icon=e.querySelector('.status-eqitem');
      return !icon || label.getBoundingClientRect().bottom<=icon.getBoundingClientRect().top;
    }));assert(separated,id+' 裝備圖示蓋字');
  }
  await pg.evaluate(()=>{B().info='tiger';refreshBattle();});await pg.waitForTimeout(250);
  if(process.env.MOBILE_SCREENSHOTS) await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/status.png'});
  ok('四小隻與敵人的裝備格標籤、圖示各占獨立位置');
  assert.deepEqual(errors,[]);ok('沒有瀏覽器錯誤');
}finally{await br.close();}
