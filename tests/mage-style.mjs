// 法師風格（大爺 10-09）：法師護甲（被動：沒穿護甲／布甲 AC＝13＋敏捷，可拿盾；穿輕甲以上不算）、
// 強化（戲法傷害加施法屬性，每個目標一次；一階法術不加；沒帶不加）、博學（被動智力 +5，聽懂異族語）。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.tut=-1;
  const u=b.units.find(v=>v.id==='fox'),e=b.units.find(v=>v.side==='foe');
  b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  const learn=(...keys)=>{for(const k of keys)if(!u.learned.some(n=>n.key===k))u.learned.push({key:k,name:k});u.activeSkills=keys;};
  const out={};
  // 法師護甲
  u.mods={...u.mods,DEX:2};u.statuses=[];u.armor=null;u.shield=false;learn();out.plain=acOfUnit(u);
  learn('mage_armor');out.mage=acOfUnit(u);u.shield=true;out.mageShield=acOfUnit(u);u.shield=false;
  u.armor=ITEMS.find(i=>i.type==='armor'&&!i.cloth&&i.n==='皮甲');out.leather=acOfUnit(u)===armorAC(u.armor,false,2);u.armor=null;
  out.mageArmorCard=skillLabel(learnedSkillByKey('mage_armor').def);
  // 強化：電擊術（戲法），施法屬性調整值 +3
  u.mods={...u.mods,INT:3,WIS:0,CHA:0};u.weapon=null;u.focus=null;u.offhand=null;u.backpack=[ITEMS.find(i=>i.n==='材料包')];e.x=u.x+1;e.y=u.y;
  const cast=(keys,sk)=>{learn(...keys);e.hp=e.maxHp=999;e.dead=e.down=false;e.statuses=[];b.turn=b.units.indexOf(u);beginTurn(u);b.busy=false;b.actionUsed=false;b.freeUsed=0;u.slots=[4,2];const n=B().log.length;Math.random=()=>0.9;doSkillNow(u,learnedSkillByKey(sk),e);Math.random=real;return {hurt:999-e.hp,emp:B().log.slice(n).some(l=>/強化：\+3/.test(l.t))};};
  const real=Math.random;
  const a=cast(['shocking_grasp'],'shocking_grasp'),c=cast(['shocking_grasp','empowered_cantrip'],'shocking_grasp');
  out.empower={without:a.emp,with:c.emp,diff:c.hurt-a.hurt};
  e.x=u.x+3;const mm=cast(['magic_missile','empowered_cantrip'],'magic_missile');out.empowerSpell=mm.emp;
  // 博學：異族語被動智力 10+INT(+5)
  b.units.filter(v=>v.side==='pc').forEach(v=>{v.mods={...v.mods,INT:0};});u.mods.INT=1;
  learn();const lang=Object.entries(LANGS).find(([k,v])=>v>11&&v<=16);out.lang=lang?.[0];
  out.loreOff=!!understoodBy(lang[0]).who;learn('lore');out.loreOn=understoodBy(lang[0]).who?.id;
  return out;
 });
 assert.equal(r.mage,13+2,'法師護甲 13＋敏捷');assert.equal(r.mageShield,17,'可拿盾');assert(r.leather,'穿皮甲不算');assert.equal(r.mageArmorCard,'法師風格：法師護甲');
 assert.deepEqual(r.empower,{without:false,with:true,diff:3},'強化：戲法 +3');
 assert.equal(r.empowerSpell,false,'一階法術不加');
 assert.equal(r.loreOff,false,`沒帶聽不懂 ${r.lang}`);assert.equal(r.loreOn,'fox','博學聽懂');
 assert.deepEqual(errors,[]);
 console.log('✓ 法師風格：法師護甲（13＋敏捷、可拿盾、皮甲不算）、強化（戲法 +施法屬性、一階法術不加）、博學（被動智力 +5）');
}finally{await br.close();}
