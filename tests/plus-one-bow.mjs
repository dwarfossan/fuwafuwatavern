// +1 長弓（大爺 10-09，取代商隊報酬的非凡長弓）：命中 +1、傷害 +1、照長弓規則（弓類招式、彈藥）、不給狩印、商店不賣。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady,noLuck} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123&phase=combat');await bootReady(p);await noLuck(p);
 const r=await p.evaluate(()=>{
  const b=B(),u=b.units.find(v=>v.id==='wolf'),e=b.units.find(v=>v.side==='foe');b.units.filter(v=>v.side==='foe'&&v!==e).forEach(v=>{v.dead=true;});
  const bow=ITEMS.find(i=>i.n==='+1 長弓'),plain=ITEMS.find(i=>i.n==='長弓');
  const ammo=ITEMS.find(i=>i.type==='gear'&&i.ammoFor==='bow');
  const hit=w=>{u.weapon=w;u.backpack=ammo?[ammo,ammo]:[];u.loadedAmmo=null;e.hp=e.maxHp=999;e.dead=e.down=false;e.statuses=[];e.x=u.x+4;e.y=u.y;
   const bonus=[];const ar=window.attackRoll;window.attackRoll=(a,t,o)=>{bonus.push(o.bonus);return {hit:true,crit:false};};
   const real=Math.random;Math.random=()=>0;weaponAttack(u,e,{});Math.random=real;window.attackRoll=ar;return {bonus:bonus[0],dmg:999-e.hp};};
  const a=hit(plain),c=hit(bow);
  return {hit:c.bonus-a.bonus,dmg:c.dmg-a.dmg,bowSkills:skillReqMet({...u,weapon:bow},{def:{req:'bow'}}),noMark:!(bow.grants||[]).includes('hunters_mark'),noShop:!!bow.noShop,reward:CARAVAN_REWARD.wolf.win.items.wolf};
 });
 assert.equal(r.hit,1,'命中 +1');assert.equal(r.dmg,1,'傷害 +1');assert(r.noMark,'不給狩印');assert(r.noShop,'商店不賣');assert.deepEqual(r.reward,['+1 長弓'],'商隊報酬');
 assert.deepEqual(errors,[]);
 console.log('✓ +1 長弓：命中 +1、傷害 +1、不給狩印、商店不賣、商隊報酬改這把');
}finally{await br.close();}
