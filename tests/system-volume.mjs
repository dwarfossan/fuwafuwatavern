// 10-10 共用喇叭：第一次玩預設 70%（以前是 0、整個沒聲音）；靜音寫「靜音」、滑桿留原音量；
// 拖滑桿解除靜音時喇叭圖示、框內小喇叭、數字一起更新；劇情與戰鬥同一套。另驗 style.css 211 行字面 \n 修好（酒館牆、劇情工具列對齊）。
import {chromium} from 'playwright';import {bootReady} from './boot.mjs';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch(),errs=[];
const look=pg=>pg.evaluate(()=>{const h=document.querySelector('[data-system-volume]'),m=document.querySelector('[data-system-mute]'),s=document.querySelector('[data-system-slider]'),n=document.querySelector('[data-system-number]');
 return {muted:SFX.isMuted(),vol:SFX.getVolume(),headOff:h.classList.contains('off'),headX:h.innerHTML.includes('M17 9l5 6'),popOff:m?m.classList.contains('off'):null,slider:s?s.value:null,num:n?n.textContent:null};});
const slide=async(pg,v)=>{await pg.locator('[data-system-slider]').fill(String(v));await pg.locator('[data-system-slider]').dispatchEvent('input');};
try{
 for(const where of ['story','battle']){
  const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve('index.html')+(where==='story'?'#town':'#battle'));await bootReady(pg);await pg.waitForTimeout(300);
  if(where==='story')await pg.evaluate(()=>{state.page='story';state.scene='prologue';state.line=0;render();});
  let r=await look(pg);assert.equal(r.vol,.7);assert.equal(r.muted,false);assert.equal(r.headX,false);
  await pg.locator('[data-system-volume]').tap();r=await look(pg);assert.equal(r.num,'70%');assert.equal(r.slider,'70');
  await pg.locator('[data-system-mute]').tap();r=await look(pg);assert.deepEqual([r.muted,r.headOff,r.headX,r.popOff,r.slider,r.num],[true,true,true,true,'70','靜音']);
  await slide(pg,40);r=await look(pg);assert.deepEqual([r.muted,r.headOff,r.headX,r.popOff,r.num],[false,false,false,false,'40%']);assert.equal(r.vol,.4);
  await slide(pg,0);r=await look(pg);assert.deepEqual([r.muted,r.headX,r.num],[true,true,'靜音']);
  await pg.locator('[data-system-mute]').tap();r=await look(pg);assert.deepEqual([r.muted,r.vol,r.headX,r.slider,r.num],[false,.4,false,'40','40%']);
  await pg.locator('[data-system-volume]').tap();await pg.locator('[data-system-volume]').tap();r=await look(pg);assert.equal(r.num,'40%');
  if(where==='story'){
   const css=await pg.evaluate(()=>({wall:getComputedStyle(document.querySelector('.wall')).backgroundImage,ml:getComputedStyle(document.querySelector('.page-tools')).marginLeft}));
   assert.match(css.wall,/repeating-linear-gradient/);assert.notEqual(css.ml,'0px');
  }
  await pg.close();
 }
 // 10-10 每一頁右上都有同一組喇叭＋齒輪；選單只列該頁用得到的
 {const cases=[['cover','',null,['關於／授權']],['roll','',()=>{state.page='roll';render();},['關於／授權','回到標題']],
   ['story','#town',()=>{state.page='story';state.scene='prologue';state.line=0;render();}],['shop','#town',()=>{state.page='shop';state.shopContext=null;render();}],
   ['map','#town',()=>{state.page='map';render();}],['street','#town',null],['venue','#town',()=>{openTownPlace('inn');}],
   ['rest','#town',()=>{openTownPlace('inn');state.townPanel='rest';render();}],['guild','#town',()=>{openTownPlace('guild');state.townPanel='guild';render();}],
   ['smith','#town',()=>{openTownPlace('smith');state.shopContext='smith';state.page='shop';render();}],['items','#town',()=>{openTownPlace('items');state.supplierSeen=true;state.shopContext='items';state.page='shop';render();}],['battle','#battle',null]];
  for(const [name,h,setup,menu=['繼續遊戲','隊伍','關於／授權','回到標題']] of cases){
   const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});pg.on('pageerror',e=>errs.push(name+': '+e.message));await pg.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"map":1,"shop":1,"roll":1}'));
   await pg.goto('file://'+path.resolve('index.html')+h);await bootReady(pg);await pg.waitForTimeout(200);if(setup)await pg.evaluate(setup);
   assert.equal(await pg.locator('[data-system-tools]').count(),1,name);
   const box=await pg.locator('[data-system-tools]').boundingBox();assert(box.y<60&&box.x+box.width>350,name+' 右上');
   await pg.locator('[data-system-menu]').tap();assert.deepEqual(await pg.locator('.sys-menu button').allInnerTexts(),menu,name);await pg.close();}}
 assert.deepEqual(errs,[]);console.log('✓ 共用喇叭：12 種畫面右上都有、選單照頁面、首次 70%、靜音字樣與滑桿、拖滑桿解除靜音三處同步、拉到 0 再按恢復；劇情／戰鬥同一套；酒館牆與工具列 CSS 生效');
}finally{await br.close();}
