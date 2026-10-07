import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('fuwa-help-seen','{"shop":1,"battle":1}')}catch{}});
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
 const result=await p.evaluate(()=>{
  const group=id=>SKILL_GROUPS.find(g=>g.id===id),base=n=>ITEMS.find(it=>it.n===n);
  const words=[SKILL_IMPL.healing_book[0],SKILL_IMPL.shaman_totem[1]],fires=[focusCantripSkill(group('arcane_staff')).impl,SKILL_IMPL.flame_orb[0],SKILL_IMPL.shaman_totem[0]];
  if(words[0]!==words[1]||fires.some(s=>s!==fires[0]))throw Error('duplicate implementations');
  if(SKILL_IMPL.arcane_staff[0]!==focusStrikeSkill(group('arcane_staff')).impl)throw Error('staff strike duplicated');
  const u={...B().units.find(u=>u.id==='fox'),learned:[],activeSkills:[],armor:null,accessories:[],backpackEquip:null,shield:false,offhand:null};
  const names={};for(const it of ITEMS.filter(it=>it.type==='focus')){
   const sk=equipmentSkills(it,probeUnit(it));u.weapon=it;u.focus=null;
   const actual=unitSkills(u),card=new DOMParser().parseFromString(itemCardHTML(it),'text/html');
   const listed=[...card.querySelectorAll('.md-sk>span:not(.skicon)')].map(e=>e.textContent);
   const expected=sk.map(s=>s.def.name);if(JSON.stringify(listed)!==JSON.stringify(expected))throw Error(it.n+' card mismatch');
   if(sk.some(s=>!actual.some(x=>x.key===s.key&&x.def.name===s.def.name&&x.impl.run.toString()===s.impl.run.toString())))throw Error(it.n+' battle mismatch');names[it.n]=expected;
  }
  if(/魔法飛彈|護盾術|法師護甲/.test(itemCardHTML(base('奧術法杖'))))throw Error('learned skills listed as grants');
  if(/治療傷口|祝福術/.test(itemCardHTML(base('治癒法書'))))throw Error('book learned skills listed');
  if(/燃燒之手|火焰護盾/.test(itemCardHTML(base('火焰法球'))))throw Error('orb learned skills listed');
  if(itemCardHTML(base('短劍')).includes('data-skinfo')||itemCardHTML(base('盾牌')).includes('data-skinfo'))throw Error('ordinary item skills');
  const magic={...base('長弓'),grants:['hunters_mark']};if(!itemCardHTML(magic).includes('狩印'))throw Error('lost explicit grants');
  // 檢查治療目標與距離邊界，保留自己及倒地隊友，拒絕敵人／死亡者。
  const healer={...u,x:0,y:0,side:'pc'},target={...u,id:'target',x:6,y:0,dead:false,down:true};const oldUnits=B().units;
  B().units=[healer,target];const s={def:group('healing_book').skills[0],impl:words[0]};
  if(validTarget(healer,s,6,0)!==target)throw Error('heal at 6 rejected');target.x=7;if(validTarget(healer,s,7,0))throw Error('heal at 7 accepted');
  target.x=6;target.dead=true;if(validTarget(healer,s,6,0))throw Error('heal dead');target.dead=false;target.side='foe';if(validTarget(healer,s,6,0))throw Error('heal enemy');
  if(validTarget(healer,s,0,0)!==healer)throw Error('heal self');B().units=oldUnits;
  // 以固定結算替身檢查同一共享實作的傷害骰、升階與地面火焰反應。
  const saved={attackRoll,hurt,dmgRoll,groundReact,heal,rollDice};const damage=[],ground=[],heals=[],dice=[];
  attackRoll=()=>({hit:true,crit:false});hurt=(t,n,type)=>damage.push([n,type]);dmgRoll=(die,mod=0)=>{dice.push(die);return (die==='1d6'?6:die==='1d4'?4:10)+mod};groundReact=(x,y,type)=>ground.push(type);heal=(t,n)=>heals.push(n);rollDice=die=>{dice.push(die);return {total:8}};const oldUp=B().up;B().up=1;
  const attacker={mods:{STR:2,INT:3}},victim={id:'v',x:1,y:0};words[0].run(attacker,victim);words[1].run(attacker,victim);
  fires[0].run(attacker,victim);fires[0].run(attacker,{x:2,y:0});FOCUS_STRIKE_IMPLS.staff.run(attacker,victim);FOCUS_STRIKE_IMPLS.other.run(attacker,victim);
  ({attackRoll,hurt,dmgRoll,groundReact,heal,rollDice}=saved);B().up=oldUp;
  state.battle=null;state.page='shop';state.shopCat='法器';state.shopActive=0;render();
  return {wordRanges:words.map(s=>s.range()),fireRanges:fires.map(s=>s.range()),damage,ground,heals,dice,names,staff:shopItem(base('奧術法杖')).id};
 });
 assert.deepEqual(result.wordRanges,[6,6]);assert.deepEqual(result.fireRanges,[12,12,12]);assert.deepEqual(result.damage,[[10,'火焰'],[8,'鈍擊'],[6,'鈍擊']]);assert.deepEqual(result.heals,[11,11]);assert.deepEqual(result.ground,['火焰','火焰']);assert.deepEqual(result.dice,['2d4','2d4','1d10','1d6','1d4']);
 await p.locator(`.shop-list [data-iteminfo="${result.staff}"]`).tap();assert.deepEqual(await p.locator('.md-sk>span:not(.skicon)').allTextContents(),['打擊','火焰箭']);
 await p.locator('.md-sk').filter({hasText:'火焰箭'}).tap();assert.match(await p.locator('.modal').innerText(),/12 格（60 呎）/);
 await p.locator('.modal [data-iteminfo]').tap();await p.locator('.md-sk').filter({hasText:'打擊'}).tap();assert.match(await p.locator('.modal').innerText(),/1d6/);
 if(process.env.FOCUS_SHOT){await p.locator('.modal [data-iteminfo]').tap();await p.waitForTimeout(500);await p.screenshot({path:process.env.FOCUS_SHOT});}
 assert.deepEqual(errors,[]);console.log('✓ 治癒真言共用6格、火焰箭共用12格、距離與目標邊界、傷害骰／升階／地面反應、全法器卡與戰鬥一致、特殊grants、390×844觸控詳情');
}finally{await br.close();}
