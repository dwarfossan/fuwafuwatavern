import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 const r=await p.evaluate(()=>{
  const expected={fox:'shield_spell',tiger:'sunder',wolf:'aimed_shot',raccoon:'hamstring'};
  state.learned={};state.activeSkills={};window.nextTurn=()=>{};startBattle('ambush');const b=B();b.busy=false;b.tut=-1;b.turn=0;
  const checks=b.units.filter(u=>u.side==='pc').sort((a,b)=>CRITTERS.findIndex(c=>c.id===a.id)-CRITTERS.findIndex(c=>c.id===b.id)).map(u=>{
   const initial=starterNotes(u.id),active=activeLearnedSkills(u),passive=passiveSkills(u);
   if(initial.length!==2||active.length!==1||active[0].key!==expected[u.id]||passive.length!==1||passive[0].key!=='darkvision')throw Error(u.id+' starter mismatch');
   if(!skillReqMet(u,active[0]))throw Error(u.id+' starting gear cannot use skill');
   if(!attackSkills(u).length||darkvisionRange(u)!==12)throw Error(u.id+' basic attack or darkvision lost');
   return [u.id,active[0].def.name,passive[0].def.name];
  });
  // 學到第二招後仍可攜帶；起始縮減不是技能上限縮成一個。
  const fox=b.units.find(u=>u.id==='fox');fox.learned.push({key:'magic_missile',name:'魔法飛彈'});if(!toggleCarriedSkill(fox,'magic_missile')||activeLearnedSkills(fox).length!==2)throw Error('later learning blocked');
  syncLearnedState();startBattle('ambush');if(!B().units.find(u=>u.id==='fox').learned.some(n=>n.key==='magic_missile'))throw Error('existing learned skill removed');
  const cards=checks.map(([id,name,passive])=>`<section style="display:flex;align-items:center;gap:12px;padding:22px 8px;border-bottom:1px solid #67565e">${critterHead(id)}<div><b>${CRITTERS.find(c=>c.id===id).name}</b><p>主動：${name}<br>被動：${passive}</p></div></section>`).join('');
  document.body.className='';document.body.innerHTML=`<style>main section img{width:90px;height:90px;object-fit:contain}</style><main style="padding:16px"><h2>初始小筆記</h2>${cards}</main>`;return checks;
 });assert.deepEqual(r,[['fox','護盾術','黑暗視覺'],['tiger','破甲','黑暗視覺'],['wolf','瞄準射擊','黑暗視覺'],['raccoon','扎腿','黑暗視覺']]);
 if(process.env.STARTER_SHOT)await p.screenshot({path:process.env.STARTER_SHOT});assert.deepEqual(errors,[]);console.log('✓ 四位初始一主動＋黑暗視覺、原配裝能使用、普攻保留、後續學習／再次開戰保留');
}finally{await br.close();}
