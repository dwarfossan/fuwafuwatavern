import {chromium}from'playwright';import assert from'node:assert/strict';import path from'node:path';
import {bootReady} from './boot.mjs';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  window.nextTurn=()=>{};startBattle('ambush');const b=B();b.turn=0;b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.tut=-1;b.phase='explore';b.exploreMarks={};
  const u=b.units.find(u=>u.id==='fox');u.statuses=[];u.anim=null;refreshBattle();const floor=document.querySelector('#board-floor').innerHTML,hp=u.hp;
  const parse=s=>!new DOMParser().parseFromString(s,'image/svg+xml').querySelector('parsererror');
  const checks=[];for(const k of ['frozen','paralyzed','poisoned','bleed','restrained']){u.statuses=[{k}];refreshBattle();checks.push(!!document.querySelector(`[data-body-status="${k}"]`));if(!parse(statusBodyFX(u,100,100)))throw Error(k);}
  u.dead=true;const dead=statusBodyFX(u,0,0)==='';u.dead=false;u.down=true;const down=parse(statusBodyFX(u,0,0));u.down=false;u.statuses=[];refreshBattle();const clear=!document.querySelector('.status-body-fx');
  b.groundEffects={};for(const [i,kind]of ['fire','ice','charged','steam'].entries())b.groundEffects[i]={kind,x:8+i,y:8,leftMs:6000};refreshBattle();
  const ground=['fire','ice','charged','steam'].every(k=>document.querySelector(`[data-ground="${k}"]`));
  const sameFloor=floor===document.querySelector('#board-floor').innerHTML;
  u.statuses=[{k:'poisoned',via:'ground',dc:13}];b.info=u.id;b.infoPage='status';refreshBattle();
  return {checks,dead,down,clear,ground,sameFloor,sameHp:hp===u.hp};
 });assert(r.checks.every(Boolean));assert(r.dead&&r.down&&r.clear&&r.ground&&r.sameFloor&&r.sameHp);
 await p.locator('[data-statustip][aria-label="中毒"]').tap();assert.match(await p.locator('.status-pop').innerText(),/體質豁免/);await p.waitForTimeout(200);
 if(process.env.STATUS_SHOT)await p.screenshot({path:process.env.STATUS_SHOT});assert.deepEqual(errors,[]);console.log('✓ 狀態演出五類、倒地／死亡／解除、四地面、只更新場景與手機毒素提示');
}finally{await br.close();}
