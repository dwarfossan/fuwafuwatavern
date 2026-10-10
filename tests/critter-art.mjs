// SVG 六表情、原受傷／勝利演出、換裝錨點與分層更新。
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const br=await chromium.launch();
try{
 const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await pg.waitForFunction(()=>B()&&!B().busy&&cur()?.side==='pc');
 const r=await pg.evaluate(()=>{
  window.nextTurn=()=>{};window.endTurn=()=>{};
  const parse=s=>new DOMParser().parseFromString(s,'image/svg+xml');
  const checks=[];
  for(const c of CRITTERS){
   const variants=new Set();
   for(const m of SVG_CRITTER_MOODS){
    for(const view of ['front','side']){
     const s=view==='front'?critterSVG(c.id,m):critterSide(c.id,m), d=parse(s);
     if(d.querySelector('parsererror')||d.querySelector('[data-expression]')?.getAttribute('data-expression')!==m)throw Error(c.id+'/'+m+'/'+view);
     variants.add(s);
    }
   }
   checks.push(variants.size);
   if(!critterSide(c.id,true).includes('data-expression="hurt"')||!critterSide(c.id,false,true).includes('data-expression="happy"'))throw Error('legacy');
   const d=parse(dollSVG({id:c.id,color:c.color,armor:'+1 薩滿袍',main:'handaxe',face:-1,x:0,y:0,w:140}));
   if(d.querySelector('parsererror')||!d.querySelector('[data-view="side"]'))throw Error('doll');
  }
  const b=B(),u=b.units.find(v=>v.side==='pc');b.units.forEach(v=>v.anim=null);refreshBattle();
  const floor=document.querySelector('#board-floor').innerHTML, scene=document.querySelector('#board-scene').innerHTML;
  u.svgMood='nervous';refreshBattle();
  const changed=document.querySelector('#board-scene').innerHTML!==scene, sameFloor=document.querySelector('#board-floor').innerHTML===floor;
  u.anim={k:'hurt',t:Date.now()};refreshBattle();
  const hurt=document.querySelector('#board-scene [data-expression="hurt"]')!==null;
  u.anim=null;b.result='win';refreshBattle();
  const happy=document.querySelector('#board-scene [data-expression="happy"]')!==null;
  return {checks,moodCount:SVG_CRITTER_MOODS.length,changed,sameFloor,hurt,happy};
 });
 assert.deepEqual(r.checks,Array(4).fill(r.moodCount*2));assert(r.changed&&r.sameFloor);assert(r.hurt&&r.happy);
 console.log('✓ 四隻 × 正側臉 × 六表情；紙娃娃、受傷／勝利、只更新場景');
 // 實際手機點角色 HUD，打開原本狀態卡。
 await pg.evaluate(()=>{const b=B();b.result=null;b.phase='explore';b.exploreWho='fox';b.units.forEach(v=>{v.anim=null;v.down=false;v.dead=false;v.svgMood='normal';});refreshBattle();});
 await pg.locator('[data-explore-unit="fox"]').tap();
 await pg.evaluate(()=>{B().info='fox';B().infoPage='status';refreshBattle();});
 await pg.waitForTimeout(150);
 if(process.env.ART_SHOT)await pg.screenshot({path:process.env.ART_SHOT});
 await pg.goto('file://'+path.resolve('index.html')+'#doll');await pg.reload();
 await pg.waitForSelector('[data-demo^="anim:"]');assert(!(await pg.evaluate(()=>[...document.querySelectorAll('[data-demo^="anim:"]')].some(e=>/undefined/.test(e.textContent)))),'紙娃娃動作按鈕不能有 undefined');
 await pg.locator('[data-demo="mood:nervous"]').tap();
 assert.equal(await pg.locator('.demo-stage [data-expression="nervous"]').count(),4);
 await pg.locator('[data-demo="anim:hurt"]').tap();
 assert.equal(await pg.locator('.demo-stage .dl-xeyes [data-expression="hurt"]').count(),4);
 await pg.locator('[data-demo="mood:happy"]').tap();
 assert.equal(await pg.locator('.demo-stage [data-expression="happy"]').count(),4);
 if(process.env.ART_DEMO_SHOT)await pg.screenshot({path:process.env.ART_DEMO_SHOT});
 assert.deepEqual(errors,[]);console.log('✓ 390×844 原狀態卡與瀏覽器無錯誤');
}finally{await br.close();}
