import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const br=await chromium.launch();
try{
 const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve('index.html')+'#town');
 await pg.locator('[data-town-place]').first().waitFor();
 const cases=['prologue','farewell','caravan','townArrival','townSupplier'].map(scene=>({scene}));
 for(const pick of ['fox','tiger','wolf','raccoon'])for(const ok of [false,true])cases.push({scene:'caravan',pick,ok});
 for(const {scene,pick,ok} of cases){
  await pg.evaluate(({scene,pick,ok})=>{state.caravan=pick?{pick,ok,stat:'INT',roll:10,mod:0,total:10,flick:[]}:{};state.page='story';state.starterStyle={};state.scene=scene;state.line=0;state.info=null;render();},{scene,pick,ok});
  const lines=await pg.evaluate(()=>SCENES[state.scene].script);
  const expected={fox:'normal',tiger:'normal',wolf:'normal',raccoon:'normal'};
  for(let i=0;i<lines.length;i++){
   if(i){/* 10-10 起始風格：選項那句要點選項才會往下 */if(lines[i-1].styleChoice)await pg.locator('[data-style-pick]').first().tap();else await pg.locator('#stage').tap();await pg.waitForFunction(i=>state.line===i,i);}
   const line=lines[i];
   for(const id of Object.keys(expected))if(line.who===id||line.who==='all')expected[id]=line.mood||line.moods?.[id]||'normal';
   const faces=()=>pg.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.party [data-info]')].map(el=>[el.dataset.info,el.querySelector('.c-head').getAttribute('src')])));
   const want=await pg.evaluate(expected=>Object.fromEntries(Object.entries(expected).map(([id,mood])=>[id,critterFaceSrc(id,mood)])),expected);
   assert.deepEqual(await faces(),want,`${scene} 第${i+1}句只更新說話者`);
   await pg.evaluate(()=>render());
   assert.deepEqual(await faces(),want,`${scene} 第${i+1}句重畫保留表情`);
   const marks=await pg.locator('.party .story-critter-mark .obs').evaluateAll(es=>es.map(e=>e.className.baseVal));
   const markCount=line.who==='all'?Object.keys(line.marks||{}).length:line.critterMark?1:0;
   assert.equal(marks.length,markCount,`${scene} 第${i+1}句符號只跟著說話者`);
   if(scene==='farewell'&&line.text==='……詛咒？'){
    assert.equal(line.who,'all');assert.equal(marks.length,4);
    assert.deepEqual(marks.map(x=>x.match(/obs-(\w+)/)[1]),['fail','ok','fail','ok']);
    assert.match((await faces()).tiger,/\/tiger\/blank\.webp$/);
   }
   // 選項停在這句，後面的分支由既有商隊測試驗證。
   if(line.choice&&!pick)break;
  }
 }
 assert.deepEqual(errors,[]);
 console.log('✓ 五個劇情逐句觸控：說話者換臉、旁白／NPC／抱抱保留、合聲一起換、整頁重畫一致');
}finally{await br.close();}
