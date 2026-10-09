// 起始風格（大爺 10-10）：序章大爺挨個問，玩家從那隻的風格類別（照角色先定）挑一個；
// 停在選項不能點下一句；選完那隻回答對應台詞；寫進小筆記並帶著；回頭改選會換掉；進戰鬥被動生效。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#town');await p.locator('[data-town-place]').first().waitFor();
 await p.evaluate(()=>{state.learned={};state.activeSkills={};state.starterStyle={};state.page='story';state.scene='prologue';state.line=SCRIPT.findIndex(l=>l.styleChoice==='fox');render();});
 const picks={fox:'metamagic',tiger:'weapon_mastery',wolf:'aim',raccoon:'sneak_attack'};
 const styles=await p.evaluate(()=>Object.fromEntries(Object.entries(STARTER_STYLE).map(([id,s])=>[id,[s.style,Object.keys(s.answers).every(k=>learnedSkillByKey(k).def.style===s.style)&&Object.keys(s.answers).length===4]])));
 assert.deepEqual(styles,{fox:['mage',true],tiger:['warrior',true],wolf:['rogue',true],raccoon:['rogue',true]},'每隻四個選項都是她的風格類別');
 for(const [id,key] of Object.entries(picks)){
  await p.locator(`[data-style-who="${id}"]`).first().waitFor();
  assert.equal(await p.locator('[data-style-pick]').count(),4,id+' 四個選項');
  const line=await p.evaluate(()=>state.line);await p.locator('#stage').tap({position:{x:20,y:20}});assert.equal(await p.evaluate(()=>state.line),line,'停在選項');
  await p.locator(`[data-style-pick="${key}"]`).tap();
  assert.equal(await p.locator('#stage p').innerText(),await p.evaluate(([id,key])=>STARTER_STYLE[id].answers[key],[id,key]),id+' 回答對應選擇');
  await p.locator('#stage').tap();
 }
 const r=await p.evaluate(()=>({style:state.starterStyle,learned:Object.fromEntries(CRITTERS.map(c=>[c.id,state.learned[c.id].map(n=>n.key)])),carried:Object.fromEntries(CRITTERS.map(c=>[c.id,state.activeSkills[c.id]]))}));
 assert.deepEqual(r.style,picks);
 for(const [id,key] of Object.entries(picks)){assert(r.learned[id].includes(key),id+' 寫進小筆記');assert(r.carried[id].includes(key),id+' 帶著');}
 // 回頭改選：換掉上一個
 const re=await p.evaluate(()=>{state.line=SCRIPT.findIndex(l=>l.styleChoice==='tiger');pickStarterStyle('tiger','shield_guard');return {l:state.learned.tiger.map(n=>n.key),c:state.activeSkills.tiger};});
 assert(re.l.includes('shield_guard')&&!re.l.includes('weapon_mastery'),'改選換掉小筆記');assert(re.c.includes('shield_guard')&&!re.c.includes('weapon_mastery'),'改選換掉攜帶');
 // 進戰鬥生效
 const inBattle=await p.evaluate(()=>{state.page='battle';startBattle('ambush');return Object.fromEntries(B().units.filter(u=>u.side==='pc').map(u=>[u.id,passiveSkills(u).map(s=>s.key).filter(k=>k!=='darkvision')]));});
 assert.deepEqual(inBattle,{fox:['metamagic'],tiger:['shield_guard'],wolf:['aim'],raccoon:['sneak_attack']});
 assert.deepEqual(errors,[]);
 console.log('✓ 起始風格：四隻各自類別四選一、停在選項、回答對應、寫進小筆記並帶著、改選換掉、進戰鬥生效');
}finally{await br.close();}
