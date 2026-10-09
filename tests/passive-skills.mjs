// 共用配置限制、被動生效與黑暗視覺距離／遮擋；額外被動僅測試fixture。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await p.waitForFunction(()=>typeof B==='function'&&B()&&!document.body.classList.contains('image-boot'));
const r=await p.evaluate(()=>{
 const b=B(),u=b.units.find(u=>u.id==='fox');b.busy=false;b.exploreRest=true;b.tut=99;b.units.filter(u=>u.side==='foe').forEach(u=>u.dead=true);
 const all=SKILL_GROUPS.flatMap(g=>g.skills).every(s=>['active','passive'].includes(s.activation));
 const four=b.units.filter(u=>u.side==='pc').every(u=>u.learned.some(n=>n.key==='darkvision')&&darkvisionRange(u)===12);
 // 上限驗收明確提供三個已學主動，不依賴起始角色自帶三招。
 for(const key of ['magic_missile','mage_armor'])if(!u.learned.some(n=>n.key===key))u.learned.push({key,name:learnedSkillByKey(key).def.name});
 const existing=u.learned.map(n=>({...n}));
 for(let i=0;i<4;i++){const key='fixture_passive_'+i,def={id:key,name:'測試被動'+i,activation:'passive',kind:'被動',tier:0,text:'僅測試'};const g=SKILL_GROUPS.find(g=>g.id==='natural');g.skills.push(def);SKILL_BY_ID[key]={g,idx:g.skills.length-1};u.learned.push({key,name:def.name});}
 u.learned.push({key:'burning_hands',name:'燃燒之手'});u.activeSkills=['magic_missile','shield_spell','mage_armor','darkvision'];const fourth=!toggleCarriedSkill(u,'burning_hands'),fifth=toggleCarriedSkill(u,'fixture_passive_0'),sixth=!toggleCarriedSkill(u,'fixture_passive_1');syncLearnedState();const saved=state.activeSkills.fox.length===5;
 u.activeSkills=['magic_missile'];for(let i=0;i<4;i++)toggleCarriedSkill(u,'fixture_passive_'+i);const oneFour=carriedSkillKeys(u).length===5&&activeLearnedSkills(u).length===1;u.activeSkills=['darkvision',...Array.from({length:4},(_,i)=>'fixture_passive_'+i)];const zeroFive=activeLearnedSkills(u).length===0&&unitSkills(u).some(s=>s.def.basicAttack||s.idx===0)&&!unitSkills(u).some(isPassiveSkill);
 u.activeSkills=['darkvision'];b.def.blocks=[];b.def.elev=[];delete b.def._h;u.x=0;u.y=0;const t={x:12,y:0};const edge=visionAt(u,t,'dark');t.x=13;const far=visionAt(u,t,'dark');t.x=12;b.def.blocks=[{x:6,y:0,kind:'tree'}];const tree=visionAt(u,t,'dark');b.def.blocks=[{x:6,y:0,kind:'door'}];const door=visionAt(u,t,'dark');b.def.blocks=[];toggleCarriedSkill(u,'darkvision');const off=visionAt(u,t,'dark'),selfOff=visionAt(u,u,'dark');
 u.learned=existing;u.activeSkills=['magic_missile','shield_spell','mage_armor','darkvision'];refreshBattle();return {all,four,fourth,fifth,sixth,saved,oneFour,zeroFive,edge,far,tree,door,off,selfOff};
});for(const k of ['all','four','fourth','fifth','sixth','saved','oneFour','zeroFive'])assert(r[k],k);assert.equal(r.edge,'gray');assert.equal(r.far,'blind');assert.equal(r.tree,'blocked');assert.equal(r.door,'blocked');assert.equal(r.off,'blind');assert.equal(r.selfOff,'blind');
const counter=await p.evaluate(()=>{
 const b=B(),d=b.units.find(u=>u.id==='fox'),a=b.units.find(u=>u.side==='foe');a.dead=false;a.down=false;d.dead=false;d.down=false;d.surprised=false;
 const learned=d.learned.map(x=>({...x})),carried=[...(d.activeSkills||[])],weapon=d.weapon,focus=d.focus,backpack=[...(d.backpack||[])],apos={x:a.x,y:a.y},dpos={x:d.x,y:d.y},ahp=a.hp;
 d.learned.push({key:'counterattack',name:'反擊'});d.activeSkills=['counterattack'];d.focus=null;
 const bow=ITEMS.find(i=>i.n==='長弓'),ammo=ITEMS.find(i=>i.type==='gear'&&i.ammoFor==='bow');d.weapon=bow;d.backpack=ammo?[ammo]:[];
 d.x=0;d.y=0;a.x=5;a.y=0;
 const old=Math.random,seq=[0,0,.999,.999,.5,.5,.5];Math.random=()=>seq.length?seq.shift():.5;
 attackRoll(a,d,{bonus:-99,ranged:true});Math.random=old;
 const ranged=a.hp<ahp;
 a.hp=ahp;a.down=false;a.dead=false;a.statuses=[];/* 10-09：第一段反擊可能把弓手射倒，只補血不還原倒下 */d.x=0;d.y=0;a.x=1;a.y=0;d.weapon=null;const mods=d.mods;d.mods={...mods,STR:2};/* 10-09：徒手傷害 1＋力量，玲玲力量隨機為 8 時是 0 傷害，看不出有沒有反擊 */
 const seq2=[0,0,.999,.999,.5,.5,.5];Math.random=()=>seq2.length?seq2.shift():.5;
 weaponAttack(a,d,{});Math.random=old;
 const unarmed=a.hp<ahp;d.mods=mods;
 d.learned=learned;d.activeSkills=carried;d.weapon=weapon;d.focus=focus;d.backpack=backpack;a.x=apos.x;a.y=apos.y;d.x=dpos.x;d.y=dpos.y;a.hp=ahp;
 return {ranged,unarmed};
});assert(counter.ranged,'遠程攻擊骰失手可觸發反擊');assert(counter.unarmed,'徒手反擊可觸發');
assert.match(await p.locator('.note-cap').innerText(),/攜帶 4\/5 · 主動 3\/3/);await p.locator('.rest-box [data-noteskill="darkvision"]').tap();assert.equal(await p.evaluate(()=>darkvisionRange(B().units.find(u=>u.id==='fox'))),0);await p.locator('.rest-box [data-noteskill="darkvision"]').tap();assert.equal(await p.evaluate(()=>darkvisionRange(B().units.find(u=>u.id==='fox'))),12);
if(process.env.REVIEW_SHOT)await p.screenshot({path:process.env.REVIEW_SHOT});await p.locator('[data-skinfo^="natural:"]').tap();assert.match(await p.locator('.modal').innerText(),/被動/);assert.doesNotMatch(await p.locator('.modal').innerText(),/物理/);assert.match(await p.locator('.modal').innerText(),/60 呎/);assert.deepEqual(errors,[]);console.log('✓ 全技能分類、總5／主動3、1主4被／0主5被、保存5個、普攻保留、黑暗視覺12格／黑白／遮擋／勾選、手機筆記與原技能卡');
}finally{await br.close();}
