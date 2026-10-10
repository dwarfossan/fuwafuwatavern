// 每日委託（10-10）＋委託怪物技能：公會接委託 → 地圖 ❗ → 走過去開打 → 全倒給報酬回地圖；每種怪物技能實際放一次
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {noLuck} from './boot.mjs';
const shot=process.env.SHOT_DIR?(p,n)=>p.screenshot({path:path.join(process.env.SHOT_DIR,n)}):async()=>{};
const br=await chromium.launch();try{
 const p=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"shop":1,"map":1}'));
 await p.goto('file://'+path.resolve('index.html')+'#town');await p.locator('[data-town-place]').first().waitFor();
 // 公會委託板：三個（★／★★／★★★），接下
 await p.locator('[data-town-place="guild"]').tap();await p.locator('#townAction').tap();
 assert.equal(await p.locator('.quest-card').count(),3);
 assert.deepEqual(await p.evaluate(()=>state.quests.list.map(q=>q.stars)),[1,2,3]);
 await shot(p,'quest-board.png');
 for(let i=0;i<3;i++)await p.locator('[data-quest-accept]').first().tap();
 assert.equal(await p.locator('[data-quest-accept]').count(),0);
 // 同一天重開還是同一批；長休換日換新的
 const day=await p.evaluate(()=>state.quests.day);
 assert.equal(await p.evaluate(()=>{const a=JSON.stringify(state.quests.list.map(q=>q.tpl));ensureQuests();return JSON.stringify(state.quests.list.map(q=>q.tpl))===a;}),true);
 // 大地圖：三個泡泡；點第一個 → 出發
 await p.evaluate(()=>{state.page='map';state.mapSel='town';render();});
 assert.equal(await p.locator('.quest-pin').count(),3);
 const q0=await p.evaluate(()=>state.quests.list[0]);
 await p.locator(`.quest-pin[data-quest="${q0.id}"]`).dispatchEvent('click');
 assert.equal(await p.locator('#questGo').count(),1);
 await shot(p,'quest-map.png');
 await p.locator('#questGo').tap();
 assert.equal(await p.evaluate(()=>!!state.travel?.quest),true);
 await p.evaluate(()=>{const tr=state.travel;tr.leg=tr.route.length-2;tr.t=tr.stopT;});   // 快轉到泡泡的位置
 await p.waitForFunction(()=>state.page==='battle'&&B()?.def.quest,null,{timeout:10000});
 const info=await p.evaluate(()=>({phase:B().phase,types:B().def.foes.map(f=>f.type),tpl:questTpl(questById(B().def.quest)).foes,tut:B().tut}));
 assert.equal(info.phase,'explore');assert.deepEqual(info.types,info.tpl);assert.equal(info.tut,-1);
 await p.waitForTimeout(600);await shot(p,'quest-battle.png');
 // 全倒＝委託完成：報酬當場給、勝利畫面顯示
 const before=await p.evaluate(()=>CRITTERS.map(c=>state.gold[c.id]));
 await p.evaluate(()=>{B().units.filter(u=>u.side==='foe').forEach(u=>{u.hp=0;u.dead=true;});checkResult();});
 assert.equal(await p.evaluate(()=>B().result),'win');
 assert.equal(await p.locator('.quest-reward').count(),1);
 const [each,want]=await p.evaluate(()=>[B().questReward.each,Math.floor(QUEST_REWARD[1].gold/4)]);assert.equal(each,want);
 assert.deepEqual(await p.evaluate(()=>CRITTERS.map(c=>state.gold[c.id])),before.map(g=>g+each*100));
 await shot(p,'quest-win.png');
 await p.locator('#afterWin').tap();
 assert.equal(await p.evaluate(()=>state.page),'map');
 assert.equal(await p.evaluate(id=>questById(id).done,q0.id),true);
 assert.equal(await p.locator('.quest-pin').count(),2);
 assert.equal(await p.evaluate(()=>WORLD.locations.some(l=>l.id===state.location)),true);
 // ★★★ 一定給魔法物品
 await p.evaluate(()=>{const q=state.quests.list[2];BATTLES.quest=questBattle(q);state.page='battle';startBattle('quest',false,'explore');B().units.filter(u=>u.side==='foe').forEach(u=>{u.hp=0;u.dead=true;});checkResult();});
 const r3=await p.evaluate(()=>B().questReward);assert(r3.item,'★★★ 沒給魔法物品');
 await p.evaluate(()=>finishQuest());
 // 換日：長休後委託換掉
 await p.evaluate(()=>advanceMarketDay());assert.equal(await p.evaluate(()=>ensureQuests().day),day+1);
 assert.equal(await p.evaluate(()=>state.quests.list.every(q=>!q.accepted)),true);

 // 怪物技能：每一招放一次，看效果、沒有錯誤
 await noLuck(p);
 const keys=await p.evaluate(()=>Object.values(ENEMIES).filter(e=>e.special&&e.stars).map(e=>e.special).filter((k,i,a)=>a.indexOf(k)===i));
 for(const key of keys){
  const res=await p.evaluate(async key=>{
   const type=Object.keys(ENEMIES).find(k=>ENEMIES[k].special===key);
   BATTLES.mtest=generateRandomBattle(77,{foes:1,foeList:[type],tutorial:false,bush:[0,0],tree:[0,0],crate:[0,0],wagon:[0,0],plateaus:0,water:0,poisonSwamp:0,oil:0,trap:0,door:0,chest:0,powderBarrel:0});
   BATTLES.mtest.foes[0].hidden=false;
   state.page='battle';startBattle('mtest',false,'combat');render();
   const b=B(),e=b.units.find(u=>u.side==='foe'),pc=b.units.find(u=>u.side==='pc');
   b.units.filter(u=>u.side==='pc').forEach(u=>{u.reserveFree=0;});
   const sk=learnedSkillByKey(key);
   if(sk.impl.passive){
    if(key==='undead_fortitude'){let saved=false;for(let i=0;i<30&&!saved;i++){e.hp=1;e.dead=false;hurt(e,1,'揮砍',pc);saved=e.hp===1&&!e.dead;}return {ok:saved,why:'不死韌性沒撐過'};}
    return {ok:(e.resistances||[]).includes('穿刺'),why:'散骨沒有穿刺抗性'};
   }
   const rush=['orc_charge','griffin_dive'].includes(key);
   // 站位：衝鋒類隔 4 格，其他貼身
   e.x=pc.x-(rush?4:1);e.y=pc.y;b.moveLeft=e.speed;
   const t=sk.impl.target==='self'?e:sk.impl.target==='cone'?{x:pc.x,y:pc.y}:pc;
   const hp0=pc.hp,st0=JSON.stringify(pc.statuses),stress0=pc.stress||0;
   let used=false;
   for(let i=0;i<12&&!used;i++){
    b.busy=false;b.result=null;pc.hp=pc.maxHp;pc.down=false;pc.statuses=[];
    if(rush){e.x=pc.x-4;e.y=pc.y;b.moveLeft=e.speed;e.specialReady=true;b.turn=b.units.indexOf(e);used=monsterTurn(e);await new Promise(r=>setTimeout(r,2500));}
    else {doSkill(e,sk,t);used=true;}
   }
   await new Promise(r=>setTimeout(r,300));
   return {ok:used,why:'沒放出來',log:b.log.slice(-4).map(l=>l.t||l.text||l)};
  },key);
  assert(res.ok,`${key}：${res.why} ${JSON.stringify(res.log||'')}`);
 }
 await p.evaluate(()=>{state.battle=null;});
 assert.deepEqual(errors,[]);
 console.log(`✓ 委託：公會接三個（★～★★★）、地圖泡泡、走過去開打、全倒給報酬回地圖、★★★ 給魔法物品、換日換委託；${keys.length} 種怪物技能都能放`);
}finally{await br.close();}
