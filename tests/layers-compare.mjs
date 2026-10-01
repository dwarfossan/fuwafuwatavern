// 390×844 改前／改後截圖與 CPU 4× 數字；凍結時間、AI 與動畫。
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.argv[2]) throw new Error('用法：node tests/layers-compare.mjs 改前repo [輸出目錄] [本機font-css]');
const output=path.resolve(process.argv[3]||path.join(root,'docs/layers-stage1'));fs.mkdirSync(output,{recursive:true});
const br=await chromium.launch();
const results={};
for(const [repo,dir] of Object.entries({baseline:path.resolve(process.argv[2]),fuwafuwatavern:root})){
 const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await ctx.addInitScript(()=>{
  let seed=42; Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  Date.now=()=>1800000000000;
  window.setTimeout=()=>0; window.setInterval=()=>0;
 });
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+path.resolve(dir,'index.html')+'#battle');
 if(process.argv[4]){const css=path.resolve(process.argv[4]);const fonts=fs.readFileSync(css,'utf8').replaceAll('./files/','file://'+path.join(path.dirname(css),'files')+'/');await pg.addStyleTag({content:fonts+'*{font-family:"Noto Sans TC",sans-serif!important}'});await pg.evaluate(()=>document.fonts.ready);}
 await pg.addStyleTag({content:'*,*::before,*::after{animation-play-state:paused!important;transition:none!important}'});
 await pg.evaluate(()=>{const b=B();b.turn=b.units.findIndex(v=>v.id==='fox');b.busy=false;b.tut=-1;b.focusReq=false;b.moveLeft=6;b.actionUsed=false;b.freeUsed=false;b.moveMode=false;b.mode=null;b.menu='root';render();centerCam(cur().x,cur().y-1);});
 await pg.evaluate(()=>document.querySelector(".enter")?.classList.remove("enter"));
 const setup=async(name,capture=true)=>{
 await pg.evaluate(name=>{const b=B();b.turn=b.units.findIndex(v=>v.id==='fox');b.mode=null;b.moveMode=false;b.info=null;b.panel=null;b.menu='root';
 if(name==='move') b.moveMode=true;
 if(name==='attack'){b.turn=b.units.findIndex(v=>v.id==='wolf');b.mode={key:unitSkills(cur())[0].key};}
 if(name==='status'){b.info=cur().id;b.infoPage='status';}
 if(name==='dice') b.panel={label:'攻擊',rows:[{t:Date.now()-5000,rolls:[17],used:17,total:22,flick:[3,8,12,17],faces:[{sides:6,v:4}],dmg:6,kind:'atk',res:'hit',tname:'哥布林A',type:'物理'}]};
 render();},name);
 await pg.evaluate(()=>document.fonts.ready);
 if(capture) await pg.screenshot({path:path.join(output,`${repo}-${name}.png`)});
 };
 for(const n of ['battle','move','attack','status','dice'])await setup(n);
 // Include elevated floor highlights and occlusion, absent from the initial camera.
 await pg.evaluate(()=>{const b=B(),v=cur();v.x=2;v.y=21;b.mode=null;b.info=null;b.panel=null;b.moveMode=true;render();centerCam(3,21);});
 await pg.evaluate(()=>document.fonts.ready);
 await pg.screenshot({path:path.join(output,`${repo}-cliff.png`)});
 await setup('move',false);
 const cdp=await ctx.newCDPSession(pg);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 results[repo]={errs,measurements:await pg.evaluate(()=>{
  const measure=fn=>{for(let i=0;i<5;i++)fn();const times=[];for(let i=0;i<30;i++){const t=performance.now();fn();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {median:times[15],p95:times[28],samples:times,nodes:document.querySelectorAll('#app *').length};};
  const r={render:measure(()=>render())};
  if(typeof updateBoardMarks==='function')r.marks=measure(()=>updateBoardMarks());
  return r;
 })};
 if(repo==='fuwafuwatavern') results[repo].identity=await pg.evaluate(()=>{
  const f=document.getElementById('board-floor'),m=document.getElementById('board-marks'),o=document.getElementById('board-scene'),ft=f.firstElementChild,mt=m.firstElementChild,ot=o.firstElementChild,wrap=document.querySelector('.board-wrap'),ui=document.querySelector('[data-battle-ui="head"]').firstElementChild;
  B().moveMode=true;updateBoardMarks();
  const markOnly=f.firstElementChild===ft&&o.firstElementChild===ot&&document.querySelector('[data-battle-ui="head"]').firstElementChild===ui&&m.firstElementChild!==mt;
  const markChild=m.firstElementChild;updateBoardFloor();
  const floorOnly=m.firstElementChild===markChild&&o.firstElementChild===ot;
  const floorChild=f.firstElementChild;render();
  const renderKeepsFloor=f.firstElementChild===floorChild&&document.getElementById('board-floor')===f&&document.querySelector('.board-wrap')===wrap;
  return {markOnly,floorOnly,renderKeepsFloor};
 });
 await ctx.close();
}
await br.close();fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,(k,v)=>k==='samples'?undefined:v,2));
