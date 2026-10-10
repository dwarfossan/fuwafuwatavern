// 野外露營長休（大爺 10-10）：挑一隻找食材、感知檢定、三種結果 CG、料理效果到下一次長休／生命歸零消失、旅店長休也會清掉
import {chromium} from 'playwright';
import {bootReady,noLuck} from './boot.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();const ok=n=>console.log('✓ '+n);
try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await p.addInitScript(()=>{window.NO_LUCK_ASK=true;});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle');await bootReady(p);
 await p.waitForFunction(()=>B()&&B().phase==='explore');
 const openRest=async()=>{await p.evaluate(()=>{const b=B();b.exploreRest=true;b.busy=false;b.exploreStopped=false;refreshBattle();});};
 // 成功：Math.random 固定 → d20=20、食材抽第 2 種（香草湯）
 await openRest();
 assert.equal(await p.locator('[data-camp-who]').count(),0);await p.locator('#longRest').tap();   // 按長休之後才問誰去找食材
 assert.equal(await p.locator('[data-camp-who]').count(),4);
 await p.evaluate(()=>{window.__r=Math.random;let n=0;Math.random=()=>[.99,.3][n++]??.5;});
 await p.locator('[data-camp-who="fox"]').tap();await p.evaluate(()=>{Math.random=window.__r;});
 const g=await p.evaluate(()=>({page:state.page,scene:state.scene,camp:state.camp,buff:state.cookBuff,meal:B().units.filter(u=>u.side==='pc').every(u=>u.statuses.some(s=>s.k==='meal'&&s.food==='soup'))}));
 assert.deepEqual([g.page,g.scene,g.camp.who,g.camp.result,g.camp.food],['story','camp','fox','good','soup']);assert(g.meal);assert.equal(Object.values(g.buff).length,4);
 assert.equal(await p.locator('.scene-art.on[data-art="campGood"]').count(),1);ok('玲玲找到香草：吃得好的 CG、全隊得到香草湯');
 while(await p.locator('#finishCamp:not([disabled])').count()===0)await p.locator('#stage').tap();
 const txt=await p.evaluate(()=>campScript().map(l=>l.text).join('|'));assert.match(txt,/香草/);assert.match(txt,/香草湯/);
 await p.locator('#finishCamp').tap();assert.equal(await p.evaluate(()=>state.page),'battle');ok('劇情有找食材的垃圾話，收拾營地回到探索');
 // 效果：香草湯豁免 +1、野莓 AC +1、烤肉串傷害 +1、蘑菇好運 +1；圖示與說明
 const fx=await p.evaluate(()=>{const u=B().units.find(v=>v.id==='wolf'),o={};
  state.cookBuff.wolf='berry';const ac0=(()=>{const k=state.cookBuff.wolf;delete state.cookBuff.wolf;const a=acOfUnit(u);state.cookBuff.wolf=k;return a;})();o.ac=acOfUnit(u)-ac0;
  state.cookBuff.wolf='mushroom';state.luckUsed={};o.luck=luckLeft(u);
  u.statuses=[{k:'meal',food:'soup'}];o.badge=badgeOf(u.statuses[0]);o.explain=statusExplain(u,u.statuses[0]);
  // 生命歸零：效果消失
  u.hp=1;hurt(u,5,'穿刺',null);o.downGone=!state.cookBuff.wolf&&!u.statuses.some(s=>s.k==='meal');u.down=false;u.hp=u.maxHp;return o;});
 assert.equal(fx.ac,1);assert.equal(fx.luck,3);assert.equal(fx.badge,'meal');assert.match(fx.explain,/香草湯/);assert(fx.downGone);
 ok('野莓派 AC +1、蘑菇燉菜好運 +1、料理圖示與說明、生命歸零效果消失');
 // 擲出 1：煮砸 CG、沒有效果；長休清掉上一餐
 await openRest();await p.locator('#longRest').tap();await p.evaluate(()=>{window.__r=Math.random;Math.random=()=>0;});await p.locator('[data-camp-who="tiger"]').tap();await p.evaluate(()=>{Math.random=window.__r;});
 const bad=await p.evaluate(()=>({r:state.camp.result,buff:Object.keys(state.cookBuff||{}).length}));assert.deepEqual(bad,{r:'bad',buff:0});
 assert.equal(await p.locator('.scene-art.on[data-art="campBad"]').count(),1);ok('擲出 1：煮砸 CG、沒有料理效果（上一餐也在長休時結束）');
 assert.deepEqual(errors,[]);ok('沒有錯誤');
}finally{await br.close();}
