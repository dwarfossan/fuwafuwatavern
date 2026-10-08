// 探索走路中游標碰到角色，角色不能跳回起點（10-08 大爺回報殘影、抽搐）
// 原因：.token:hover 的 CSS transform 蓋掉戰場角色 <g> 的 SVG 位移屬性；hover 只給擲屬性籌碼按鈕
import {chromium} from 'playwright';
import path from 'node:path';
import assert from 'node:assert/strict';
import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
  const pg=await br.newPage({viewport:{width:390,height:844}});const errors=[];pg.on('pageerror',e=>errors.push(e.message));
  await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(pg);await pg.waitForTimeout(300);
  assert.equal(await pg.evaluate(()=>B().phase),'explore');
  const id=await pg.evaluate(()=>exploreUnit().id),tok=pg.locator(`.board .token[data-moving-unit="${id}"]`);
  await pg.mouse.move(5,5);
  // 走路中途：用走路同一個就地同步入口移動角色
  const moved=await pg.evaluate(()=>{const v=exploreUnit();v.x+=1.5;syncExploreUnitTransforms();return document.querySelector(`.board .token[data-moving-unit="${v.id}"]`).getAttribute('transform');});
  assert(moved&&moved!=='translate(0 0)','角色有位移');
  const b=await tok.boundingBox();let hits=0;
  for(const [fx,fy] of [[.5,.3],[.5,.6],[.5,.85],[.3,.7],[.7,.5]]){
    await pg.mouse.move(b.x+b.width*fx,b.y+b.height*fy);await pg.waitForTimeout(30);
    const r=await tok.evaluate(e=>({hover:e.matches(':hover'),css:getComputedStyle(e).transform}));
    if(r.hover)hits++;
    assert.notEqual(r.css,'matrix(1, 0, 0, 1, 0, -2)','游標碰到角色不能套用籌碼的 hover 位移');
    assert.notEqual(r.css,'none','角色位移不能被清掉');
  }
  assert(hits>0,'測試要真的有碰到角色');
  // 擲屬性籌碼的 hover 仍保留
  await pg.evaluate(()=>{const el=document.createElement('button');el.className='token';el.textContent='15';document.body.appendChild(el);return true;});
  const c=pg.locator('body > button.token');await c.hover();await pg.waitForTimeout(250);
  assert.equal(await c.evaluate(e=>getComputedStyle(e).transform),'matrix(1, 0, 0, 1, 0, -2)','籌碼 hover 仍往上 2px');
  assert.deepEqual(errors,[]);
  console.log(`✓ 探索走路中游標碰到角色（${hits} 處）位移不被 hover 蓋掉；擲屬性籌碼 hover 照舊`);
}finally{await br.close();}
