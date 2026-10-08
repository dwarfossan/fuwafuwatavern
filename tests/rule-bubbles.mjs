import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {bootReady} from './boot.mjs';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const check=await p.evaluate(()=>[...new Set(SKILL_GROUPS.flatMap(g=>g.skills.map(s=>s.name)))].map(n=>({name:n,data:SKILL_THOUGHTS[n]})));
 for(const row of check){assert(row.data,row.name);assert.equal(row.data.draft,'GPT');assert.equal(new Set(Object.values(row.data.lines)).size,4);}
 await p.evaluate(()=>{const f=B().units.find(u=>u.id==='fox');if(!f.learned.some(n=>n.key==='magic_missile'))f.learned.unshift({key:'magic_missile',name:'魔法飛彈',lv:1});B().busy=false;B().exploreRest=true;B().tut=99;refreshBattle();});
 const texts=[];
 for(const id of ['fox','tiger','wolf','raccoon']){
  await p.locator(`[data-rest-who="${id}"]`).click();
  const el=p.locator('.note-skill-main').first();await el.hover();assert(await p.locator('#game-bubble.thought').isVisible());texts.push(await p.locator('#game-bubble').textContent());
  await p.mouse.move(1,1);assert.equal(await p.locator('#game-bubble').count(),0);
 }
 assert.equal(new Set(texts).size,4);
 await p.locator('[data-rest-who="fox"]').click();await p.locator('[data-skinfo]').first().click();
 const rule=p.locator('.md-effect [data-rule="力場傷害"]');await rule.hover();assert(await p.locator('#game-bubble.rule').isVisible());assert((await p.locator('#game-bubble').textContent()).includes('抗性'));assert.equal(await p.locator('#game-bubble.thought').count(),0);
 if(process.env.RULE_SHOT)await p.screenshot({path:process.env.RULE_SHOT});
 await p.mouse.move(1,1);assert.equal(await p.locator('#game-bubble').count(),0);await p.locator('.md-x').click();
 // 手機按住看見解，放開關閉，不改抄寫勾選。
 await p.locator('.note-skill-main').first().dispatchEvent('pointerdown',{pointerType:'touch',pointerId:5});assert(await p.locator('#game-bubble.thought').isVisible());
 await p.locator('.note-skill-main').first().dispatchEvent('pointerup',{pointerType:'touch',pointerId:5});assert.equal(await p.locator('#game-bubble').count(),0);
 assert.deepEqual(errors,[]);console.log('✓ every skill has four different draft thoughts, hover separation, original skill modal, colored rule, touch release');
}finally{await br.close();}
