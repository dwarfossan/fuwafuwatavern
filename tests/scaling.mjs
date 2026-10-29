// 怪物跟著毛毛們的等級浮動（大爺 10-29）：2 級＝原本數字；每高一級生命 ×1.3、命中／豁免難度／傷害每 2 級 +1、經驗跟生命同倍率；1 級不變
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"shop":1,"map":1}'));
 await p.goto('file://'+path.resolve('index.html')+'#town');await p.locator('[data-town-place]').first().waitFor();
 const at=L=>p.evaluate(L=>{
  CRITTERS.forEach(c=>{(state.level||={})[c.id]=L;(state.xp||={})[c.id]=XP_NEXT[L-1];});
  BATTLES.quest=generateQuestMap(77,{theme:'plain',foeList:['goblin','orc'],name:'t'});BATTLES.quest.quest=null;
  startBattle('quest',false,'combat');
  const g=B().units.find(u=>u.type==='goblin'),o=B().units.find(u=>u.type==='orc');
  return {g:g.maxHp,o:o.maxHp,hit:g.scaleHit||0,dmg:g.scaleDmg||0,xp:+(g.xpMul||1).toFixed(2),dc:dcOf(g,'DEX')-(8+2+g.mods.DEX)};
 },L);
 const base={g:await p.evaluate(()=>ENEMIES.goblin.hp),o:await p.evaluate(()=>ENEMIES.orc.hp)};
 assert.deepEqual(await at(1),{...base,hit:0,dmg:0,xp:1,dc:0},'1 級不變');
 assert.deepEqual(await at(2),{...base,hit:0,dmg:0,xp:1,dc:0},'2 級＝原本數字');
 const l3=await at(3);assert.deepEqual(l3,{g:Math.round(base.g*1.3),o:Math.round(base.o*1.3),hit:1,dmg:1,xp:1.3,dc:1},'3 級');
 const l4=await at(4);assert.deepEqual(l4,{g:Math.round(base.g*1.6),o:Math.round(base.o*1.6),hit:1,dmg:1,xp:1.6,dc:1},'4 級');
 const l6=await at(6);assert.deepEqual([l6.hit,l6.dmg],[2,2],'6 級命中、傷害 +2');
 // 傷害加值真的加上去：4 級的哥布林打一下，比原本多 1
 const d=await p.evaluate(()=>{const g=B().units.find(u=>u.type==='goblin'),t=B().units.find(u=>u.side==='pc');t.hp=t.maxHp=999;hurt(t,3,'穿刺',g);return 999-t.hp;});
 assert.equal(d,3+2,'6 級的傷害 +2');
 assert.deepEqual(errors,[]);
 console.log('✓ 怪物浮動：1、2 級不變；3、4 級生命 ×1.3／×1.6、命中豁免傷害 +1；6 級 +2；經驗同倍率');
}finally{await br.close();}
