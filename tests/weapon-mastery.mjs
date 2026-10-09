// 戰士風格：武器精通（大爺 10-09）：帶了才觸發武器專精；普攻、招式都觸發；沒帶不觸發；敵我一致。
// 用硬頭錘（專精：削弱），骰子固定必中，看目標有沒有掛上「削弱」。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;
  const u=b.units.find(v=>v.id==='tiger'),e=b.units.find(v=>v.side==='foe');
  b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  const mace=makeItem(ITEMS.find(i=>i.n==='硬頭錘'),false,u);
  const real=Math.random;Math.random=()=>0.9;
  const reset=(a,t)=>{a.weapon=mace;a.statuses=[];t.statuses=[];t.hp=t.maxHp=999;t.dead=false;t.down=false;t.x=a.x+1;t.y=a.y;};
  const sapped=t=>!!has(t,'sapped');
  if(!u.learned.some(n=>n.key==='weapon_mastery'))u.learned.push({key:'weapon_mastery',name:'武器精通'});
  const out={};
  u.activeSkills=[];reset(u,e);weaponAttack(u,e,{mastery:true});out.without=sapped(e);
  u.activeSkills=['weapon_mastery'];reset(u,e);weaponAttack(u,e,{mastery:true});out.basic=sapped(e);
  reset(u,e);weaponAttack(u,e,{});out.skill=sapped(e);   // 招式呼叫 weaponAttack 不帶 mastery 旗標，也要觸發
  // 敵我一致
  reset(e,u);u.hp=u.maxHp=999;e.learned=[];e.activeSkills=[];weaponAttack(e,u,{mastery:true});out.foeWithout=sapped(u);
  e.learned=[{key:'weapon_mastery',name:'武器精通'}];e.activeSkills=['weapon_mastery'];reset(e,u);weaponAttack(e,u,{mastery:true});out.foeWith=sapped(u);
  Math.random=real;
  out.label=skillLabel(learnedSkillByKey('weapon_mastery').def);
  return out;
 });
 assert.deepEqual(r,{without:false,basic:true,skill:true,foeWithout:false,foeWith:true,label:'戰士風格：武器精通'});
 assert.deepEqual(errors,[]);
 console.log('✓ 武器精通：沒帶不觸發專精、帶了普攻與招式都觸發、敵我一致');
}finally{await br.close();}
