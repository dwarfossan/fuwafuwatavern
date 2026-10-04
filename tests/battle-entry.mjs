import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const br=await chromium.launch();
try {
 for(const [hash,id,phase] of [['#battle','random','explore'],['#ambush','ambush','combat']]) {
  for(let i=0;i<Number(process.env.ENTRY_RUNS||5);i++) {
   const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   if(process.env.ENTRY_HTML) {
    await p.route('https://api.github.com/**',r=>r.fulfill({json:{sha:'local-review',commit:{committer:{date:'2026-10-04T09:00:00Z'},message:'入口驗收'}}}));
    await p.route('https://raw.githack.com/**',r=>{
     const url=new URL(r.request().url());
     const rel=url.pathname.split('/local-review/')[1];
     r.fulfill({path:path.resolve(rel)});
    });
    await p.goto('file://'+path.resolve(process.env.ENTRY_HTML));
    assert.deepEqual(await p.locator('a.btn').allTextContents(),['測試戰鬥','營救商隊','直達城鎮','從頭玩']);
    await p.locator(`a[href$="${hash}"]`).tap();
   } else await p.goto('file://'+path.resolve('index.html')+hash);
   if(id==='ambush'){
    assert.deepEqual(await p.evaluate(()=>({page:state.page,scene:state.scene,line:state.line,battle:!!state.battle})),{page:'story',scene:'ambush',line:0,battle:false});
    await p.locator('.scene-bg img').evaluate(img=>img.decode());
    await p.waitForTimeout(500);
    if(process.env.REVIEW_DIR)await p.screenshot({path:path.join(process.env.REVIEW_DIR,'ambush-story.png')});
    while(!await p.locator('#toBattle').isEnabled())await p.locator('.dialog').tap();
    await p.locator('#toBattle').tap();
   }
   await p.waitForFunction(()=>typeof B==='function'&&B());
   const actual=await p.evaluate(()=>({id:B().id,phase:B().phase,pcs:B().units.filter(u=>u.side==='pc').length,foes:B().units.filter(u=>u.side==='foe').length,merchant:B().units.some(u=>u.type==='merchant'),after:B().def.after}));
   assert.equal(actual.id,id);assert.equal(actual.phase,phase);assert.equal(actual.pcs,4);assert.equal(actual.foes,4);
   if(id==='ambush'){assert(actual.merchant);assert.equal(actual.after,'caravan');}
   assert.deepEqual(errors,[]);
   if(process.env.REVIEW_DIR&&i===0)await p.screenshot({path:path.join(process.env.REVIEW_DIR,id+'.png')});
   await p.close();
  }
  console.log(`✓ ${hash}：390×844入口${Number(process.env.ENTRY_RUNS||5)}次，${id}/${phase}，四隻與四敵${id==='ambush'?'、商人及戰後商隊':''}`);
 }
}finally{await br.close();}
