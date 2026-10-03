import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),server=createServer(async(req,res)=>{try{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));const bytes=await readFile(file);res.setHeader('Content-Type',file.endsWith('.webp')?'image/webp':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.route('https://fonts.googleapis.com/**',route=>route.abort());
 let mode='slow',release;const gate=new Promise(r=>release=r);
 await p.route('**/assets/portraits/bronn_noface.webp*',async route=>{if(mode==='slow')await gate;if(mode==='fail')await route.abort();else await route.continue();});
 await p.goto(`http://127.0.0.1:${server.address().port}/index.html#town`,{waitUntil:'domcontentloaded'});
 await p.locator('[data-town-place="smith"]').tap();
 const portrait=p.locator('.town-owner .npc-portrait');
 assert.equal(await portrait.getAttribute('data-load'),'loading');assert(await portrait.locator('.pt-load').isVisible());
 if(process.env.NPC_LOAD_SHOTS)await p.screenshot({path:process.env.NPC_LOAD_SHOTS+'/loading.png'});
 mode='fail';release();await p.waitForFunction(()=>document.querySelector('.town-owner .npc-portrait')?.dataset.load==='error');
 assert(await portrait.getByText('立繪載入失敗',{exact:true}).isVisible());
 if(process.env.NPC_LOAD_SHOTS)await p.screenshot({path:process.env.NPC_LOAD_SHOTS+'/error.png'});
 mode='ok';await portrait.getByRole('button',{name:'重試立繪'}).tap();await p.waitForFunction(()=>document.querySelector('.town-owner .npc-portrait')?.dataset.load==='ready');
 assert.equal(await portrait.locator('.pt-canvas').evaluate(e=>getComputedStyle(e).visibility),'visible');
 assert(await portrait.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
 if(process.env.NPC_LOAD_SHOTS)await p.screenshot({path:process.env.NPC_LOAD_SHOTS+'/ready.png'});
 console.log('✓ 手機立繪延遲有提示、失敗自動重試一次與明示錯誤、手動重試恢復底圖與表情');
}finally{await br.close();await new Promise(r=>server.close(r));}
