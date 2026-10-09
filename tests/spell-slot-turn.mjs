// 每回合只能花一格熟練格施法（大爺 10-09，照 D&D 2024）：戲法、武器招式不算；下一回合重置；敵我同一套；按鈕顯示原因。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;enterExploreCombat(null,true);b.flowEpoch=(b.flowEpoch||0)+1;
  const u=b.units.find(v=>v.id==='fox'),tiger=b.units.find(v=>v.id==='tiger');
  b.units.filter(v=>v.side==='foe').forEach(v=>{v.dead=true;});
  for(const key of ['magic_missile','shield_spell'])if(!u.learned.some(n=>n.key===key))u.learned.push({key,name:key});
  u.activeSkills=['magic_missile','shield_spell'];u.slots=[4,2];u.statuses=[];u.down=false;u.dead=false;
  b.turn=b.units.indexOf(u);b.busy=false;beginTurn(u);
  const shield=learnedSkillByKey('shield_spell'),missile=learnedSkillByKey('magic_missile');
  const before=turnLimitProblem(u,missile);
  doSkill(u,shield,u);
  const after=turnLimitProblem(u,missile),slotsAfter=slotsOf(u)[0];
  const cantrip=unitSkills(u).find(s=>s.def.components&&!(s.def.tier>0));
  const cantripOk=cantrip?turnLimitProblem(u,cantrip):'(無戲法)';
  // 武器招式不受限：嬌嬌破甲
  tiger.slotSpellUsed=true;const sunder=learnedSkillByKey('sunder');const weaponOk=turnLimitProblem(tiger,sunder);tiger.slotSpellUsed=false;
  // 下一回合重置
  beginTurn(u);const reset=turnLimitProblem(u,missile);
  // 敵我同一套：敵人法術一樣受限
  const foe=b.units.find(v=>v.side==='foe');foe.slotSpellUsed=true;const bane=learnedSkillByKey('bane');const foeBlocked=turnLimitProblem(foe,bane);
  // 介面：施過法後魔法飛彈按鈕顯示原因
  u.slotSpellUsed=true;b.menu='skills';refreshBattle();
  return {before,after,slotsAfter,cantripOk,weaponOk,reset,foeBlocked};
 });
 assert.equal(r.before,'','還沒施法可以放');
 assert.equal(r.after,'本回合已花熟練格施過法','施過一格後第二個要格子的法術被擋');
 assert.equal(r.slotsAfter,3,'護盾術確實花了一格');
 assert.equal(r.cantripOk,'','戲法不算');
 assert.equal(r.weaponOk,'','武器招式不算');
 assert.equal(r.reset,'','下一回合重置');
 assert.equal(r.foeBlocked,'本回合已花熟練格施過法','敵人同樣受限');
 assert.match(await p.locator('body').innerText(),/本回合已花熟練格施過法/,'技能選單顯示原因');
 assert.deepEqual(errors,[]);
 console.log('✓ 每回合一格熟練格施法：護盾術後魔法飛彈被擋、戲法與武器招式不算、下回合重置、敵我一致、按鈕顯示原因');
}finally{await br.close();}
