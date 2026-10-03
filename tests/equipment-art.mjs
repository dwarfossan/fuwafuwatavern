import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
 const r=await p.evaluate(()=>{
  window.nextTurn=()=>{};startBattle('ambush');const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;b.tut=-1;b.turn=0;
  const parse=s=>!new DOMParser().parseFromString(s,'image/svg+xml').querySelector('parsererror');
  for(const [k,a]of Object.entries(ITEM_ART))if(!parse(`<svg xmlns="http://www.w3.org/2000/svg">${a}</svg>`))throw Error(k);
  for(const u of b.units){if(!parse(unitDoll(u,false)))throw Error(u.id);}
  const a=ITEMS.find(i=>i.n==='短棒'),c=ITEMS.find(i=>i.n==='彎刀');
  const sh=b.units.find(u=>u.focus?.n==='薩滿圖騰');sh.statuses=[];b.info=sh.id;b.infoPage='status';refreshBattle();
  const v=CRITTERS[0],d=dollSVG({id:v.id,color:v.color,...dollGear(sh),face:-1,x:0,y:0,w:140});
  return {club:equipmentArtKey(a),scimitar:equipmentArtKey(c),magic:equipmentArtKey({...c,n:'測試彎刀',base:c.n}),teeth:armorArt('+1 薩滿袍').neck.includes('<path'),same:parse(d),held:HELD.club.gy===112&&HELD.scimitar.gy===106};
 });assert.equal(r.club,'club');assert.equal(r.scimitar,'scimitar');assert.equal(r.magic,'scimitar');assert(r.teeth&&r.same&&r.held);
 await p.locator('.foe-view [data-iteminfo]').first().tap();assert(await p.evaluate(()=>!!state.modal));
 if(process.env.EQUIP_SHOT)await p.screenshot({path:process.env.EQUIP_SHOT});
 assert.deepEqual(errors,[]);console.log('✓ 共用裝備SVG、短棒彎刀、魔法base、敵我薩滿袍與手機裝備卡');
}finally{await br.close();}
