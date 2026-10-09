import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs';
const browser=await chromium.launch();try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('fuwa-help-seen','{"battle":1}')}catch{}});
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 const r=await p.evaluate(()=>{
  window.nextTurn=()=>{};startBattle('ambush');const b=B(),u=b.units.find(v=>v.id==='fox');b.flowEpoch=(b.flowEpoch||0)+1;b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;b.tut=-1;u.anim=null;u.statuses=[];render();
  const floor=document.querySelector('#board-floor').firstElementChild,token=document.querySelector('.token[data-moving-unit="fox"]'),hp=u.hp;
  const entries=Object.entries(STATUS_BADGE).filter(([,a])=>a[0]);if(entries.length!==19)throw Error('19 status icons required');
  const expected={good:'rgb(82, 127, 170)',bad:'rgb(168, 93, 97)'};
  for(const [k,[icon,good]]of entries){
   if(new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${ST_ICON[icon]}</svg>`,'image/svg+xml').querySelector('parsererror'))throw Error(k+' invalid SVG');
   u.statuses=[{k,n:3,until:'end',left:1}];b.info=u.id;b.infoPage='status';refreshBattle();
   const hud=document.querySelector('.hud[data-moving-unit="fox"] [data-st]'),card=document.querySelector('.status-unit-badge');
   if(hud?.dataset.st!==icon||card?.getAttribute('aria-label')!==STATUS_NAME[k])throw Error(k+' missing shared icon');
   const expectedSVG=document.createElementNS('http://www.w3.org/2000/svg','svg');expectedSVG.innerHTML=ST_ICON[icon];
   if(card.querySelector('[data-status-art]').innerHTML!==expectedSVG.innerHTML)throw Error(k+' card uses different art');
   if(getComputedStyle(hud.querySelector('rect')).fill!==expected[good?'good':'bad']||getComputedStyle(card.querySelector('rect')).fill!==expected[good?'good':'bad'])throw Error(k+' palette mismatch');
   if(document.querySelector('.st-countdowns,.st-n,.status-unit-badge .turns'))throw Error(k+' visible countdown remains');
   if(stTurns(u.statuses[0])!==(k==='bleed'?3:2)||u.statuses[0].left!==1||u.statuses[0].until!=='end'||!statusExplain(u,u.statuses[0]).includes(String(k==='bleed'?3:2)))throw Error(k+' duration data/explanation changed');
  }
  u.statuses=[{k:'bleed',n:2},{k:'bleed',n:4}];refreshBattle();if(document.querySelectorAll('.hud[data-moving-unit="fox"] [data-st]').length!==1||u.statuses[1].n!==4)throw Error('duplicate badge/duration');
  u.statuses=entries.map(([k])=>({k}));refreshBattle();if(document.querySelectorAll('.hud[data-moving-unit="fox"] [data-st]').length!==5)throw Error('HUD display limit changed');
  u.dead=true;if(statusBadges(u,0,0)!=='')throw Error('dead HUD');u.dead=false;
  u.statuses=[];refreshBattle();if(document.querySelector('.hud[data-moving-unit="fox"] [data-st]')||document.querySelector('.status-unit-badge'))throw Error('status removal leaves icon');
  if(floor!==document.querySelector('#board-floor').firstElementChild||token!==document.querySelector('.token[data-moving-unit="fox"]')||hp!==u.hp)throw Error('floor/token/HP changed');
  const pcs=CRITTERS.map(c=>b.units.find(v=>v.id===c.id));const groups=[['burning','poisoned','frozen','bleed','dazed'],['blessed','shieldSpell','stance','helped','dodge'],['slowed','restrained','sapped','acDown'],['bane','marked','conc','paralyzed']];
  pcs.forEach((v,i)=>{v.x=5+(i%2)*3;v.y=17+Math.floor(i/2)*3;v.statuses=groups[i].map(k=>({k}));v.anim=null;});b.info=null;b.menu='root';b.units.filter(v=>v.side==='foe').forEach(v=>v.statuses=[]);refreshBattle();centerCam(6.5,18.5);
  return {count:entries.length,names:entries.map(([k])=>STATUS_NAME[k])};
 });assert.equal(r.count,19);await p.waitForTimeout(500);
 const dir=process.env.STATUS_ICON_SHOTS;if(dir){fs.mkdirSync(dir,{recursive:true});await p.screenshot({path:path.join(dir,'01-battle.png')});}
 await p.evaluate(()=>{B().info='fox';B().infoPage='status';refreshBattle();});await p.locator('[data-statustip][aria-label="燃燒"]').tap();assert.match(await p.locator('.status-pop').innerText(),/1d4 火焰傷害/);
 assert.equal(await p.locator('[data-statustip][aria-label="燃燒"]').evaluate(el=>getComputedStyle(el.querySelector('rect')).fill),'rgb(168, 93, 97)','selected burning retains debuff background');
 if(dir)await p.screenshot({path:path.join(dir,'02-burning-card.png')});
 await p.evaluate(()=>{const u=B().units.find(v=>v.id==='fox');u.statuses=[];B().statusTip=null;refreshBattle();});assert.equal(await p.locator('.status-unit-badge').count(),0);
 if(dir){await p.evaluate(()=>{
  const cards=Object.entries(STATUS_BADGE).filter(([,a])=>a[0]).map(([k,[icon,good]])=>`<section><svg viewBox="0 0 20 20" style="background:var(${good?'--status-good':'--status-bad'})">${ST_ICON[icon]}</svg><b>${STATUS_NAME[k]}</b><svg class="small" viewBox="0 0 20 20" style="background:var(${good?'--status-good':'--status-bad'})">${ST_ICON[icon]}</svg></section>`).join('');document.body.className='';document.body.innerHTML=`<style>body{padding:16px}h2{font-size:20px;margin:0 0 15px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}section{display:flex;align-items:center;flex-direction:column;gap:8px;padding:14px 5px;background:#352e3b;border-radius:12px}section svg{width:50px;height:50px;border:2px solid #211923;border-radius:8px}section svg.small{width:24px;height:24px;border-width:1px;border-radius:4px}b{font-size:14px}</style><h2>遊戲共用圖示・18種</h2><main>${cards}</main>`;
 });await p.screenshot({path:path.join(dir,'03-icons.png'),fullPage:true});}
 assert.deepEqual(errors,[]);console.log('✓ 19種共用SVG／藍紅底／燃燒觸控說明、倒數已移除／期限保留／去重／5圖示限制、死亡／解除、地板與角色節點及HP保留；390×844實際戰場與卡片');
}finally{await browser.close();}
