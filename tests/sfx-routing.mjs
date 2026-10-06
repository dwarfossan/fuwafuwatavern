import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';

for(const name of ['arrow_hit','arrow_shoot','dark_magic','fire_magic','ice_magic','heal_magic','poison_magic','shield_block','sword_slash','light_punch','lightning_magic'])
  assert(existsSync(path.resolve(`assets/sfx/${name}.mp3`)), `missing assets/sfx/${name}.mp3`);
const br=await chromium.launch();
try{
  const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});
  await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 await pg.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
  await pg.waitForFunction(()=>typeof SFX!=='undefined');
  const r=await pg.evaluate(()=>{
    const seen=[], old=SFX.play;
    SFX.play=(name)=>seen.push(name);
    const take=fn=>{seen.length=0;fn();return [...seen];};
    const b=B(), pc=b.units.find(u=>u.side==='pc'), foe=b.units.find(u=>u.side==='foe');
    b.impact=0; b.panel=null; b._pend=[];
    const hit=type=>take(()=>{ foe.hp=20; foe.maxHp=20; foe.dead=false; foe.down=false; hurt(foe,1,type,pc); });
    const ordinaryArrow=take(()=>{
      const bow=ITEMS.find(i=>i.n==='短弓'), arrows=ITEMS.find(i=>i.ammoFor==='bow');
      Object.assign(pc,{weapon:bow,backpack:[arrows],items:[],x:1,y:1,down:false,dead:false});
      Object.assign(foe,{baseAc:0,hp:20,maxHp:20,dead:false,down:false,x:4,y:1});
      Math.random=()=>.5; weaponAttack(pc,foe,{});
    });
    const elementalArrow=take(()=>{
      const bow={...ITEMS.find(i=>i.n==='短弓'),extraDamage:{type:'火焰',amount:1}}, arrows=ITEMS.find(i=>i.ammoFor==='bow');
      Object.assign(pc,{weapon:bow,backpack:[arrows],items:[],x:1,y:1,down:false,dead:false});
      Object.assign(foe,{baseAc:0,hp:20,maxHp:20,dead:false,down:false,x:4,y:1});
      Math.random=()=>.5; weaponAttack(pc,foe,{});
    });
    const arrowMiss=take(()=>{ foe.baseAc=999; weaponAttack(pc,foe,{}); });
    const healNone=take(()=>{ pc.hp=pc.maxHp; pc.down=false; heal(pc,1); });
    const healSome=take(()=>{ pc.hp=pc.maxHp-2; heal(pc,1); });
    const shoot=take(()=>animSfx('shoot'));
    const shield=take(()=>{
      const guard=b.units.filter(u=>u.side==='pc')[1];
      Object.assign(guard,{x:2,y:1,down:false,dead:false});
      Object.assign(pc,{x:1,y:1,down:false,dead:false,statuses:[{k:'dodge',once:true,by:guard.id}]});
      Object.assign(foe,{x:1,y:3,down:false,dead:false});
      attackRoll(foe,pc,{});
    });
    const result={files:{...SFX_FILES},slash:hit('揮砍'),blunt:hit('鈍擊'),fire:hit('火焰'),cold:hit('寒冷'),lightning:hit('閃電'),poison:hit('毒素'),ordinaryArrow,elementalArrow,arrowMiss,healNone,healSome,shoot,shield};
    SFX.play=old;
    return result;
  });
  assert.deepEqual(r.files,{arrow_shoot:'assets/sfx/arrow_shoot.mp3',arrow_hit:'assets/sfx/arrow_hit.mp3',hit_slash:'assets/sfx/sword_slash.mp3',hit_blunt:'assets/sfx/light_punch.mp3',hit_fire:'assets/sfx/fire_magic.mp3',hit_cold:'assets/sfx/ice_magic.mp3',hit_lightning:'assets/sfx/lightning_magic.mp3',hit_poison:'assets/sfx/poison_magic.mp3',heal:'assets/sfx/heal_magic.mp3',shield_block:'assets/sfx/shield_block.mp3'});
  assert.deepEqual(r.slash.slice(0,1),['hit_slash']);
  assert.deepEqual(r.blunt.slice(0,1),['hit_blunt']);
  assert.deepEqual(r.fire.slice(0,1),['hit_fire']);
  assert.deepEqual(r.cold.slice(0,1),['hit_cold']);
  assert.deepEqual(r.lightning.slice(0,1),['hit_lightning']);
  assert.deepEqual(r.poison.slice(0,1),['hit_poison']);
  assert(r.ordinaryArrow.includes('arrow_hit'));
  assert(!r.elementalArrow.includes('arrow_hit') && r.elementalArrow.includes('hit_fire'));
  assert(!r.arrowMiss.includes('arrow_hit'));
  assert(!r.healNone.includes('heal') && r.healSome.includes('heal'));
  assert.deepEqual(r.shoot,['arrow_shoot']);
  assert(r.shield.includes('shield_block'));
  console.log('✓ 實體音效依實際傷害／治療／弓弩命中／守護防禦事件路由，未命中不播箭矢命中');
}finally{await br.close();}
