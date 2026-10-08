// 狀態卡三條（生命／經驗／壓力，名稱｜條｜數字）與頭像列壓力小條（大爺 10-04）
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {bootReady} from './boot.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html');
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
try{
  await pg.goto('file://'+root+'#battle?seed=123');await bootReady(pg);await pg.waitForTimeout(700);
  await pg.evaluate(()=>{const f=B().units.find(u=>u.id==='fox');f.stress=40;f.xp=150;f.hp=Math.max(1,f.maxHp-2);B().info='fox';refreshBattle();});
  await pg.waitForTimeout(300);
  const card=await pg.evaluate(()=>{const g=document.querySelector('.inf-bars');const ls=[...g.querySelectorAll('.ib-l')].map(e=>e.textContent),ns=[...g.querySelectorAll('.ib-n')].map(e=>e.textContent),bars=[...g.querySelectorAll('.ib-bar')].map(e=>e.getBoundingClientRect()),f=B().units.find(u=>u.id==='fox');
    return {ls,ns,ws:bars.map(r=>Math.round(r.width)),xs:bars.map(r=>Math.round(r.left)),fill:[...g.querySelectorAll('.ib-bar i')].map(i=>i.style.width),dim:document.querySelector('.bt-me .dim').textContent,hp:`${f.hp}/${f.maxHp}`};});
  assert.deepEqual(card.ls,['生命','經驗','壓力']);assert.equal(card.ns[0],card.hp);assert.equal(card.ns[1],'150/300');assert.equal(card.ns[2],'40/100');
  assert.equal(new Set(card.ws).size,1,'三條一樣長');assert.equal(new Set(card.xs).size,1,'左邊對齊');assert.equal(card.fill[1],'50%');assert.equal(card.fill[2],'40%');
  assert(!card.dim.includes('生命'),'生命數字不再重複寫在上面那行');
  await pg.evaluate(()=>{B().info=B().units.find(u=>u.side==='foe').id;refreshBattle();});await pg.waitForTimeout(300);
  assert.deepEqual(await pg.evaluate(()=>[...document.querySelectorAll('.inf-bars .ib-l')].map(e=>e.textContent)),['生命'],'敵人只有生命');
  const row=await pg.evaluate(()=>{B().info=null;refreshBattle();return [...document.querySelectorAll('.order .ord')].map(o=>({pc:!!o.dataset.exploreUnit,bar:o.querySelector('.ord-stress i')?.style.width??null}));});
  assert(row.filter(r=>r.pc).every(r=>r.bar!==null)&&row.filter(r=>!r.pc).every(r=>r.bar===null),'只有四小隻頭像有壓力條');
  assert(row.some(r=>r.bar==='40%'));
  assert(!(await pg.evaluate(()=>document.documentElement.scrollWidth>390)));
  assert.deepEqual(errs,[]);console.log('✓ 狀態卡生命／經驗／壓力三條等長對齊、數字在條旁；敵人只有生命；頭像列只有四小隻有壓力小條');
}finally{await br.close();}
