import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const file=path.join(process.cwd(),new URL(req.url,'http://localhost').pathname),body=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/index.html`,br=await chromium.launch();
try{
 for(const [kind,hash,asset,place]of [['cover','','home_fox.webp'],['ambush','#ambush','caravan_encounter.webp'],['head','#town','fox/normal.webp'],['npc','#town','brun/sheet.webp','smith']]){
  const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let fail=true;const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',r=>r.request().url().includes(asset)&&fail?r.abort():r.continue());await p.goto(url+hash);await p.locator('#retryImages:not([hidden])').waitFor();fail=false;await p.locator('#retryImages').tap();await p.locator('.cover:not(.cover-loading),[data-town-place],#stage').first().waitFor();fail=true;await p.evaluate(asset=>{entryImageLoads.clear();entryDecodedImages.clear();entryImageURLs.clear();storyImageLoads.clear();storyDecodedImages.clear();},asset);if(place)await p.locator(`[data-town-place="${place}"]`).tap();
  await p.evaluate(()=>render());const notice=place?p.locator('.actor .portrait-error'):p.locator('.image-error-message');await notice.waitFor();assert(await notice.isVisible());await p.screenshot({path:`/tmp/image-error-${kind}.png`});
  const before=await p.evaluate(()=>({page:state.page,line:state.line,modal:state.modal}));fail=false;await notice.tap();
  await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
  assert.equal(await p.locator('.image-error-message,.portrait-error').count(),0);assert.deepEqual(await p.evaluate(()=>({page:state.page,line:state.line,modal:state.modal})),before);assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS 封面／商隊插圖／頭像／NPC：失敗提示可見，點擊重試成功，不觸發原按鈕或劇情');
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let unused=0;
 await p.goto(url+'#town');await p.locator('[data-town-place]').first().waitFor();await p.route('**/wolf/sigh.webp',r=>{unused++;return r.abort();});await p.evaluate(()=>{state.page='story';state.scene='prologue';state.line=0;render();});
 await p.locator('#stage').tap({position:{x:30,y:40}});await p.waitForFunction(()=>state.line===1);assert.equal(unused,0);assert.equal(await p.locator('.story-image-wait').count(),0);
 console.log('PASS 無關表情失敗不被請求、不阻擋下一句');
 const target=await p.evaluate(()=>{const lines=SCENES.prologue.script;for(let i=1;i<lines.length;i++){const l=lines[i];if(CRITTER_FACES[l.who]&&(l.mood||l.moods?.[l.who])&&critterMood(l.who,lines[i-1],i-1)!==critterMood(l.who,l,i))return {index:i,src:critterFaceSrc(l.who,critterMood(l.who,l,i))};}throw Error('缺少換表情案例');});
 await p.evaluate(()=>{storyImageLoads.clear();storyDecodedImages.clear();entryImageLoads.clear();entryDecodedImages.clear();entryImageURLs.clear();});let delayed=0;
 await p.route('**/'+target.src,async r=>{delayed++;await new Promise(resolve=>setTimeout(resolve,700));await r.continue();});
 await p.evaluate(index=>{state.line=index-1;render();},target.index);
 await p.locator('#stage').tap({position:{x:30,y:40}});await p.locator('.story-image-wait').waitFor();assert.equal(await p.evaluate(()=>state.line),target.index-1);
 await p.waitForFunction(i=>state.line===i,target.index);assert(delayed>0);assert.equal(await p.locator('.story-image-wait').count(),0);
 const broken=await p.locator('.party img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);
 await p.unroute('**/'+target.src);await p.route('**/'+target.src,r=>r.abort());
 await p.evaluate(index=>{storyImageLoads.clear();storyDecodedImages.clear();entryImageLoads.clear();entryDecodedImages.clear();entryImageURLs.clear();state.line=index-1;render();},target.index);
 await p.locator('#stage').tap({position:{x:30,y:40}});await p.waitForFunction(i=>state.line===i,target.index);
 await p.locator('.party .image-error-message').waitFor();assert.equal(await p.locator('.story-image-wait').count(),0);await p.close();
 console.log('PASS 下一句必要表情慢載入：有提示、完成後換句、頭像完整');
 const q=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let fail=true;
 await q.goto(url+'#town');await q.locator('[data-town-place]').first().waitFor();await q.route('**/*',r=>r.request().url().includes('dwarf_noface.webp')&&fail?r.abort():r.continue());await q.evaluate(()=>{entryImageLoads.clear();entryDecodedImages.clear();entryImageURLs.clear();storyImageLoads.clear();storyDecodedImages.clear();});await q.evaluate(()=>{state.page='story';state.scene='prologue';state.line=2;render();});await q.locator('.actor.dwarf .portrait-error').waitFor();fail=false;
 await q.locator('.actor.dwarf .portrait-error').tap({position:{x:150,y:80}});await q.waitForFunction(()=>document.querySelector('.actor.dwarf .portrait').classList.contains('portrait-ready'));assert.equal(await q.evaluate(()=>state.line),2);
 await q.locator('#stage').tap({position:{x:30,y:40}});await q.waitForFunction(()=>state.line===3);assert(await q.locator('.actor.dwarf .portrait').evaluate(el=>[...el.querySelectorAll('img')].every(i=>i.naturalWidth&&getComputedStyle(i).visibility==='visible')));
 await q.screenshot({path:'/tmp/image-story-retry.png'});await q.close();console.log('PASS 劇情人物重試成功且不跳句，之後正常換句與顯示');
}finally{await br.close();await new Promise(r=>server.close(r));}
