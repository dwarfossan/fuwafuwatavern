// 手機商店：分類切換、商品捲動、買賣位置、手勢防誤買及固定導航。
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const ok=name=>console.log('✓ '+name);
try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  await page.addInitScript(()=>{ try{ localStorage.setItem('fuwa-help-seen','{"roll":1,"shop":1,"map":1}'); }catch(e){} });   // 頁面說明第一次會自動打開（10-02），測試先當作看過
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
  await page.waitForFunction(()=>B()?.units.length);
  await page.evaluate(()=>{
    CRITTERS.forEach(c=>{state.inv[c.id]=[];state.gold[c.id]=100*GP;});
    state.page='shop';state.shopCat=CATS[0];render();
  });
  await page.waitForTimeout(500); // 換頁動畫結束後量測
  const geometry=()=>page.evaluate(()=>{
    const r=document.querySelector('#depart').getBoundingClientRect();
    return {bottom:r.bottom,height:innerHeight,doc:document.documentElement.scrollHeight,
      list:document.querySelector('.shop-list').clientHeight,
      tabs:[...document.querySelectorAll('[data-stab]')].map(e=>e.getBoundingClientRect().y)};
  });
  const g=await geometry();
  assert(g.bottom<=g.height && g.doc<=g.height+1 && g.list>200);
  assert.equal(new Set(g.tabs).size,1);ok('390×844：四隻同排、出發可見、商品有獨立捲動區');
  for(const cat of await page.evaluate(()=>CATS)){
    await page.locator(`[data-cat="${cat}"]`).click();
    assert.equal(await page.evaluate(()=>state.shopCat),cat);
    assert((await geometry()).bottom<=844);
  }
  ok('九類都能直接點，角色卡不擋分類');
  await page.locator('[data-cat="簡易近戰"]').click();
  await page.locator('.shop-list').evaluate(e=>e.scrollTop=130);
  const before=await page.locator('.shop-list').evaluate(e=>e.scrollTop);
  await page.locator('[data-buy]').last().click();
  // click 會自動把最後一件捲入視野；以真正買下時的位置驗證後續重畫。
  const afterBuy=await page.locator('.shop-list').evaluate(e=>e.scrollTop);
  assert(afterBuy>=before);assert.equal(await page.evaluate(()=>state.inv.fox.length),1);
  await page.locator('.shop-side summary').click();
  await page.locator('[data-sell]').click();
  assert.equal(await page.evaluate(()=>state.inv.fox.length),0);
  assert(await page.evaluate(()=>state.gold.fox===100*GP));
  assert(Math.abs(await page.locator('.shop-list').evaluate(e=>e.scrollTop)-afterBuy)<2);
  assert((await geometry()).bottom<=844);ok('買／退錢與背包正確，裝備展開不推走出發，位置保留');
  await page.locator('.shop-side summary').click();
  await page.locator('[data-cat="護甲"]').click();
  await page.locator('[data-cat="簡易近戰"]').click();
  assert(Math.abs(await page.locator('.shop-list').evaluate(e=>e.scrollTop)-afterBuy)<2);
  await page.locator('[data-stab="1"]').click();
  assert(Math.abs(await page.locator('.shop-list').evaluate(e=>e.scrollTop)-afterBuy)<2);
  ok('切分類再回來、切角色都保留商品位置');

  const session=await page.context().newCDPSession(page);
  async function swipe(x,y,dx,dy){
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=6;step++){
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*step/6,y:y+dy*step/6}]});
    }
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(150);
  }
  const box=await page.locator('.shop-list').boundingBox();
  await swipe(box.x+box.width*.75,box.y+80,-150,0);
  assert.equal(await page.evaluate(()=>state.shopCat),'簡易遠程');
  await swipe(box.x+box.width*.25,box.y+80,150,0);
  assert.equal(await page.evaluate(()=>state.shopCat),'簡易近戰');
  await swipe(box.x+box.width*.25,box.y+80,150,0);
  assert.equal(await page.evaluate(()=>state.shopCat),'簡易近戰');ok('真觸控事件左右切分類，第一頁不循環');
  await page.locator('.shop-list').evaluate(e=>e.scrollTop=0);
  await swipe(box.x+100,box.y+box.height-25,0,-170);
  assert.equal(await page.evaluate(()=>state.shopCat),'簡易近戰');
  assert(await page.locator('.shop-list').evaluate(e=>e.scrollTop)>0);
  assert.equal(await page.evaluate(()=>state.inv.tiger.length),0);ok('上下滑只捲商品，不切分類、不誤買');
  await page.locator('[data-cat="法器"]').click();
  const buy=await page.locator('[data-buy]').first().boundingBox();
  await swipe(buy.x+buy.width/2,buy.y+buy.height/2,-130,0);
  assert.equal(await page.evaluate(()=>state.shopCat),'道具');
  assert.equal(await page.evaluate(()=>state.inv.tiger.length),0);ok('從買按鈕開始滑也不誤買');
  await page.locator('[data-cat="冒險用品"]').click();
  await swipe(box.x+box.width*.75,box.y+80,-150,0);
  assert.equal(await page.evaluate(()=>state.shopCat),'冒險用品');ok('最後一頁不循環');
  await page.locator('[data-cat="簡易近戰"]').click();
  await page.locator('[data-stab="0"]').click();
  await page.locator('.shop-list').evaluate(e=>e.scrollTop=0);
  if(process.env.SHOP_SCREENSHOT) await page.screenshot({path:process.env.SHOP_SCREENSHOT});
  await page.locator('#depart').click();
  assert.equal(await page.evaluate(()=>state.scene),'farewell');ok('出發接回既有送別流程');
  const kam=await page.evaluate(()=>{state.line=FAREWELL.findIndex(l=>l.who==='kam');updateStoryLine();
    const a=document.querySelector('.actor.kam'),d=document.querySelector('.actor.dwarf');
    return {kamOn:!a.classList.contains('off'),dwarfOff:d.classList.contains('off'),face:a.querySelector('.pt-face').getAttribute('src')};});
  assert(kam.kamOn&&kam.dwarfOff&&kam.face.startsWith('assets/faces/kam/'),JSON.stringify(kam));ok('卡姆登場：舞台換卡姆、表情圖');
  await page.evaluate(()=>{state.line=0;updateStoryLine();});
  assert.equal(await page.locator('.scene-art.on').count(),0);
  await page.evaluate(()=>{state.line=FAREWELL.findIndex(l=>l.art);updateStoryLine();});
  await page.waitForTimeout(300);
  const art=await page.locator('.scene-art.on img').evaluate(e=>({ok:e.complete&&e.naturalWidth>0}));
  assert(art.ok);
  assert.equal(await page.evaluate(()=>FAREWELL[FAREWELL.length-1].art),'party');ok('送別出發段換成四小隻合照插圖，最後一句還在插圖上');
  assert.deepEqual(errors,[]);ok('沒有瀏覽器錯誤');
}finally{await browser.close();}
