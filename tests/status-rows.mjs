import{chromium}from'playwright';import assert from'node:assert/strict';import path from'node:path';import fs from'node:fs';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{try{localStorage.setItem('fuwa-help-seen','{"battle":1}')}catch{}});
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 const r=await p.evaluate(()=>{
  window.nextTurn=()=>{};startBattle('ambush');const b=B(),u=b.units.find(v=>v.id==='fox');b.flowEpoch=(b.flowEpoch||0)+1;b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;b.tut=-1;u.anim=null;u.statuses=[];render();
  const floor=document.querySelector('#board-floor').firstElementChild,token=document.querySelector('.token[data-moving-unit="fox"]'),hp=u.hp;
  const hud=()=>document.querySelector('.hud[data-moving-unit="fox"]'),rows=()=>[...hud().querySelectorAll('[data-status-row]')];
  u.statuses=[{k:'shieldSpell',until:'end'},{k:'burning'},{k:'dazed',until:'end'},{k:'blessed'},{k:'slowed',until:'end'}];refreshBattle();
  if(rows().map(n=>n.dataset.statusRow).join(',')!=='bad,good')throw Error('HUD row order');
  const bad=rows()[0],good=rows()[1],barY=hud().children[1].getAttribute('y');
  if([...bad.querySelectorAll('[data-st]')].map(n=>n.dataset.st).join(',')!=='fire,daze,slow'||[...good.querySelectorAll('[data-st]')].map(n=>n.dataset.st).join(',')!=='shieldStar,sun')throw Error('incorrect grouping');
  if(bad.getBoundingClientRect().bottom>good.getBoundingClientRect().top+0.1)throw Error('row overlap');
  for(const row of rows()){const nodes=[...row.querySelectorAll('[data-st]')],xs=nodes.map(n=>Number(n.getAttribute('transform').match(/translate\(([-.\d]+)/)[1]));if(Math.abs(xs[0]+xs.at(-1)+20)>1e-8)throw Error('row not centered');}
  if(document.querySelector('.st-countdowns,.st-n'))throw Error('HUD countdown remains');
  const pitch=()=>{const rs=rows();return Number(rs[1].querySelector('[data-st]').getAttribute('transform').split(' ')[1].slice(0,-1))-Number(rs[0].querySelector('[data-st]').getAttribute('transform').split(' ')[1].slice(0,-1));};
  const withCount=pitch();if(withCount!==20)throw Error('rows must touch');u.statuses.forEach(s=>{delete s.until;delete s.left;});refreshBattle();
  if(pitch()!==withCount||hud().querySelector('.st-countdowns'))throw Error('countdown changes row spacing or leaves stale overlay');
  u.statuses=u.statuses.filter(s=>STATUS_BADGE[s.k][1]);refreshBattle();if(rows().length!==1||rows()[0]!==good||rows()[0].querySelector('[data-st]').getAttribute('transform').split(' ')[1]!== '-20)')throw Error('single good row/identity');
  if(hud().children[1].getAttribute('y')!==barY)throw Error('health bar moved');
  u.statuses=[{k:'burning'}];refreshBattle();if(rows().length!==1||rows()[0].dataset.statusRow!=='bad')throw Error('single bad row');u.statuses=[];refreshBattle();if(rows().length)throw Error('empty row retained');
  if(floor!==document.querySelector('#board-floor').firstElementChild||token!==document.querySelector('.token[data-moving-unit="fox"]')||u.hp!==hp)throw Error('floor/body/HP changed');
  const pcs=CRITTERS.map(c=>b.units.find(v=>v.id===c.id));pcs.forEach((v,i)=>{v.x=5+(i%2)*3;v.y=17+Math.floor(i/2)*3;v.anim=null;v.statuses=i===0?[{k:'burning'},{k:'slowed',until:'end'},{k:'blessed'},{k:'shieldSpell',until:'end'}]:i===1?[{k:'blessed'},{k:'helped'}]:i===2?[{k:'sapped'},{k:'acDown'}]:[];});b.info=null;b.menu='root';b.marks=[];b.bubbles=[];refreshBattle();centerCam(6.5,18.5);
  window.__rowFixture={floor,token};return {hp};
 });
 const dir=process.env.STATUS_ROWS_SHOTS;if(dir)fs.mkdirSync(dir,{recursive:true});await p.waitForTimeout(350);if(dir)await p.screenshot({path:path.join(dir,'01-two-rows.png')});
 if(dir){await p.evaluate(()=>{const u=B().units.find(v=>v.id==='fox');u.statuses.filter(s=>STATUS_BADGE[s.k][1]).forEach(s=>delete s.until);refreshBattle();});await p.screenshot({path:path.join(dir,'04-tight-no-count.png')});await p.evaluate(()=>{B().units.find(v=>v.id==='fox').statuses.find(s=>s.k==='shieldSpell').until='end';refreshBattle();});}
 const overlay=await p.evaluate(()=>{const b=B(),now=Date.now();b.marks=[{id:'wolf',kind:'ok',t:now,dur:5000}];b.bubbles=[{id:'fox',text:'先看我說話！',t:now,dur:5000}];refreshBattle();const sc=document.querySelector('#board-scene'),hud=sc.querySelector('.hud[data-moving-unit="fox"]'),mark=sc.querySelector('.obs'),bubble=sc.querySelector('.bark');const after=n=>!!(hud.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING);return after(mark)&&after(bubble)&&!!hud.querySelector('[data-status-row="bad"]')&&!!hud.querySelector('[data-status-row="good"]');});assert(overlay,'immediate effects rendered above status HUD');await p.waitForTimeout(200);if(dir)await p.screenshot({path:path.join(dir,'02-dialog-priority.png')});
 await p.evaluate(()=>{const b=B();b.marks=[];b.bubbles=[];b.info='fox';b.infoPage='status';refreshBattle();});assert.deepEqual(await p.locator('.status-badge-row').evaluateAll(ns=>ns.map(n=>n.dataset.statusRow)),['bad','good']);assert.equal(await p.locator('.status-badge-row[data-status-row="bad"] .status-unit-badge').count(),2);assert.equal(await p.locator('.status-badge-row[data-status-row="good"] .status-unit-badge').count(),2);
 assert(await p.evaluate(()=>{const c=document.querySelector('.status-paper');const doll=c.querySelector('.inf-doll>svg').getBoundingClientRect(),main=c.parentNode.querySelector('.status-eqslot.main').getBoundingClientRect();return c.querySelector('.status-unit-badges').getBoundingClientRect().bottom<=doll.top&&doll.bottom<=main.top;}),'two rows do not cover card portrait');
 assert.equal(await p.locator('.st-countdowns,.st-n,.status-unit-badge .turns').count(),0);

 assert(await p.evaluate(()=>{
  const hud=document.querySelector('.hud[data-moving-unit="fox"]'),card=document.querySelector('.status-unit-badges');
  const measure=(root,isHud)=>{const rows=[...root.querySelectorAll(isHud?'[data-status-row]':'.status-badge-row')],faces=rows.map(row=>[...row.querySelectorAll(isHud?'[data-st]>rect':'.status-unit-badge svg>rect')].map(n=>n.getBoundingClientRect()));const size=faces[0][0].width;
   return [(faces[1][0].top-faces[0][0].top)/size,(faces[0][1].left-faces[0][0].left)/size];};
  const a=measure(hud,true),b=measure(card,false);return a.every((n,i)=>Math.abs(n-b[i])<.02)&&a.every((n,i)=>Math.abs(n-[1,1.2][i])<.02);
 }),'HUD/card actual row pitch, spacing share size-normalized geometry');
 if(dir)await p.screenshot({path:path.join(dir,'03-card-rows.png')});await p.locator('[data-statustip][aria-label="燃燒"]').tap();assert.match(await p.locator('.status-pop').innerText(),/1d4/);
 await p.evaluate(()=>{const b=B(),u=b.units.find(v=>v.id==='fox');u.statuses=Object.entries(STATUS_BADGE).filter(([,a])=>a[0]).map(([k])=>({k}));b.statusTip=null;refreshBattle();});assert.equal(await p.locator('.status-badge-row').count(),2);assert.equal(await p.locator('.status-unit-badge').count(),18);const long=await p.locator('.status-badge-row[data-status-row="bad"]').evaluate(el=>el.scrollWidth>el.clientWidth&&getComputedStyle(el).flexWrap==='nowrap');assert(long,'long negative row scrolls instead of adding third row');await p.locator('[data-statustip][aria-label="燃燒"]').scrollIntoViewIfNeeded();await p.locator('[data-statustip][aria-label="燃燒"]').tap();assert.match(await p.locator('.status-pop').innerText(),/燃燒/);
 await p.evaluate(()=>{const b=B(),u=b.units.find(v=>v.id==='fox');u.statuses=[];b.info=null;b.statusTip=null;refreshBattle();if(document.querySelector('.token[data-moving-unit="fox"]')!==__rowFixture.token||document.querySelector('#board-floor').firstElementChild!==__rowFixture.floor)throw Error('overlay cycle rebuilt body/floor');});assert.equal(await p.locator('.bark,.obs').count(),0);assert.deepEqual(errors,[]);console.log('✓ HUD／共用卡上負下正、單類無空排、居中／圖示貼齊／無倒數且期限保留／血條定位、移除保留子層、對話與驚嘆號優先且清除還原、18狀態卡兩排橫捲、觸控說明、地板／角色／HP保留；390×844截圖');
}finally{await br.close();}
