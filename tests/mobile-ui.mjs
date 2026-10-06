// 手機畫面回歸：封面、說明／角色泡泡；後續介面驗收也放這裡。
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
const ok=n=>console.log('✓ '+n);
try{
  const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});
  await pg.addInitScript(()=>{ try{ localStorage.setItem('fuwa-help-seen','{"roll":1,"shop":1,"map":1}'); }catch(e){} });   // 頁面說明第一次會自動打開（10-02），測試先當作看過
  const errors=[];pg.on('pageerror',e=>errors.push(e.message));
  await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html'));
 await pg.waitForFunction(()=>!document.body.classList.contains('image-boot'));
  await pg.waitForTimeout(500);
  const party=await pg.locator('.cover-party').evaluate(e=>{const r=e.getBoundingClientRect();return {ok:[...e.querySelectorAll('img')].length===4&&[...e.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),left:r.left,right:r.right,w:r.width}});
  assert(party.ok);assert(party.left>=0&&party.right<=390&&party.w>200);
  assert(!(await pg.locator('.sub').innerText()).includes('今晚'));ok('封面四小隻合照圖有載入、不超出手機寬，文案符合午後');
  if(process.env.MOBILE_SCREENSHOTS) await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/cover.png'});
  const sym=await pg.evaluate(()=>['sweat','shake','anger','note'].map(k=>{const d=document.createElement('div');d.innerHTML=obsBubbleHTML(k);const n=d.querySelectorAll('.obs-anim path,.obs-anim ellipse').length;return {k,n,dur:OBS_DUR[k]};}));
  assert(sym.every(x=>x.n>=2&&x.dur>0),JSON.stringify(sym));ok('泡泡框漫畫符號：滴汗、發抖線、生氣青筋、音符');
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
  assert.equal(await pg.locator('[role="dialog"] .gear-info.status-view').count(),1);
  assert.match(await pg.locator('[role="dialog"]').innerText(),/玲玲　Lv\.1[\s\S]*生命[\s\S]*經驗[\s\S]*壓力[\s\S]*主手[\s\S]*力量/);
  assert.equal(await pg.locator('[role="dialog"] .info-top').count(),0);
  const navAfter=await pg.locator('.fp-page>.nav').boundingBox();assert(Math.abs(nav.y-navAfter.y)<0.5,`${nav.y} → ${navAfter.y}`);   // 10-03：允許小於 0.5px 的次像素誤差（頭像圖片載入時會差 0.006px）
  assert(navAfter.y+navAfter.height<=844);
  if(process.env.MOBILE_SCREENSHOTS){await pg.waitForTimeout(250);await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/character.png'});}
  await pg.getByRole('button',{name:'關閉',exact:true}).click();assert.equal(await pg.evaluate(()=>state.line),line);
  assert.equal(await pg.evaluate(()=>state.info),null);ok('開頭頭像改用完整狀態卡，關閉不推進劇情、不移動底部');
  await pg.evaluate(()=>{grantStarterGear();render();});
  await pg.locator('[data-info="fox"]').click();
  assert.equal(await pg.locator('[role="dialog"] [data-switchset]').count(),1);
  assert.match(await pg.locator('[role="dialog"] .status-eqslot.main [data-tip]').getAttribute('data-tip'),/奧術法杖/);
  await pg.locator('[role="dialog"] [data-switchset]').click();
  assert.match(await pg.locator('[role="dialog"] .status-eqslot.main [data-tip]').getAttribute('data-tip'),/輕弩/);
  await pg.getByRole('button',{name:'關閉',exact:true}).click();
  assert.equal(await pg.evaluate(()=>{startBattle('ambush',false,'explore');const n=B().units.find(u=>u.id==='fox').weapon.n;state.battle=null;state.page='story';render();return n;}),'輕弩');
  ok('開頭狀態卡可切換武器，配置會延續到戰鬥');
  for(const id of ['tiger','wolf','raccoon']){
    await pg.locator(`[data-info="${id}"]`).click();
    assert.equal(await pg.locator('[role="dialog"] .gear-info.status-view').count(),1);
    await pg.keyboard.press('Escape');assert.equal(await pg.locator('[role="dialog"]').count(),0);
  }ok('四隻開頭狀態卡都能開啟，Escape 可關閉');
  await pg.evaluate(()=>{state.line=SCENES.prologue.script.length-1;updateStoryLine();});
  await pg.locator('#toShop').click();await pg.locator('[data-pagehelp="shop"]').click();
  assert((await pg.locator('[role="dialog"]').innerText()).includes('負重'));
  await pg.getByRole('button',{name:'關閉',exact:true}).click();
  assert((await pg.locator('#depart').boundingBox()).y<844);ok('商店規則泡泡可關閉，出發仍可見');
  await pg.evaluate(()=>{state.page='map';state.travel=null;render();});
  await pg.locator('[data-pagehelp="map"]').click();assert((await pg.locator('[role="dialog"]').innerText()).includes('現在的位置'));
  await pg.getByRole('button',{name:'關閉',exact:true}).click();ok('大地圖說明泡泡可開關');
  await pg.waitForTimeout(500);
  assert.equal(await pg.locator('#map-party .pf').count(),4);
  assert.equal(await pg.locator('#map-places image').count(),4);
  assert(await pg.locator('.map-frame').evaluate(e=>Math.abs(e.clientHeight/e.clientWidth-1.25)<.03));
  if(process.env.MOBILE_SCREENSHOTS) await pg.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/map.png'});
  for(const id of ['cave','forest','town','tavern']){
    await pg.evaluate(id=>{const l=WORLD.locations.find(l=>l.id===id),f=document.querySelector('.map-frame'),c=state.worldCamera;c.cam={x:f.clientWidth/2-l.x*c.zoom,y:f.clientHeight/2-l.y*c.zoom};applyWorldCamera();},id);
    await pg.locator(`[data-loc="${id}"] text`).click();assert.equal(await pg.evaluate(()=>state.mapSel),id);
  }
  ok('大地圖劇情同高、四毛固定下方，鏡頭移到各地點後皆可點選');
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
  // 骰子面板三列、四列（偷襲、範圍招）：整塊塞在螢幕裡，標題看得到（10-02 大爺選 a：每列變矮）
  {
    const p3=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await p3.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');
 await p3.locator('#board-floor').waitFor();
 await p3.evaluate(()=>startBattle("ambush")); // 固定規則驗收 fixture；#battle 的隨機場另測
    await p3.waitForFunction(()=>cur().side==='pc'&&!B().busy,null,{timeout:60000});
    await p3.evaluate(()=>{ endTurn=()=>{}; nextTurn=()=>{}; B().tut=-1; });
    for(const n of [3,4]){
      const top=await p3.evaluate(async n=>{ const b=B(), u=b.units.find(v=>v.id==='wolf'); b.panelHidden=false;
        const es=b.units.filter(v=>v.side==='foe'); es.forEach(e=>{e.hp=e.maxHp=99;});
        panelStart(u.name+'【測試】'); for(let i=0;i<n;i++) weaponAttack(u,es[i%es.length],{noMod:true}); panelEnd(); refreshBattle();
        await new Promise(r=>setTimeout(r,300));
        return Math.round(document.querySelector('#dicePanel .dp-head').getBoundingClientRect().top); },n);
      assert(top>=0,`${n} 列時標題被擠出畫面（top ${top}）`);
    }
    await p3.close(); ok('骰子面板三列、四列：標題留在畫面裡');
  }
  // 頁面說明第一次自動打開一次（10-02）：新的瀏覽器、沒看過
  {
    const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true}); const p2=await ctx.newPage();
    await p2.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html'));
    await p2.evaluate(()=>localStorage.removeItem('fuwa-help-seen')); await p2.reload(); await p2.waitForTimeout(300);
    await p2.locator('#start').click();
    assert((await p2.locator('[role="dialog"]').innerText()).includes('4d6'));
    await p2.getByRole('button',{name:'關閉',exact:true}).click();
    await p2.evaluate(()=>{state.page='cover';render();state.page='roll';render();});
    assert.equal(await p2.locator('[role="dialog"]').count(),0);
    await p2.reload(); await p2.waitForTimeout(300); await p2.locator('#start').click();
    assert.equal(await p2.locator('[role="dialog"]').count(),0);
    await ctx.close(); ok('頁面說明第一次自動打開，關掉後回來、重新整理都不再自動打開');
  }
  assert.deepEqual(errors,[]);ok('沒有瀏覽器錯誤');
}finally{await br.close();}
