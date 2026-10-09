import {chromium} from 'playwright';
import {bootReady,noLuck} from './boot.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const shots=process.env.OBJECT_SHOTS;
const shot=async name=>{if(shots){await fs.mkdir(shots,{recursive:true});await page.screenshot({path:path.join(shots,name+'.png')});}};
const tapTile=async(x,y)=>{const p=await page.evaluate(({x,y})=>{const r=document.querySelector('.board-wrap').getBoundingClientRect(),p=iso(x,y),z=camZoom();return {x:r.left+B().cam.x+p.x*z,y:r.top+B().cam.y+(p.y+TH/2)*z};},{x,y});await page.touchscreen.tap(p.x,p.y);};
const boxPoint=async selector=>{const r=await page.locator(selector).boundingBox();assert(r);return {x:r.x+r.width/2,y:r.y+r.height/2};};
try{
 await page.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#battle?seed=123');await bootReady(page);await noLuck(page);
 assert.equal(await page.evaluate(()=>B().def.blocks.filter(o=>o.kind==='powderBarrel').length),2);
 await page.evaluate(()=>{const b=B();b.flowEpoch++;b.def.blocks=[];b.def.elev=[];delete b.def._h;b.groundEffects={};b.busy=false;b.result=null;b.exploreStopped=false;b.phase='explore';b.exploreObject=null;b.leader='fox';b.turn=b.units.findIndex(u=>u.id==='fox');b.units.forEach((u,i)=>{u.x=u.side==='pc'?16:1;u.y=u.side==='pc'?18+i:i+1;u.hp=u.maxHp=100;u.dead=u.down=false;u.statuses=[];});const u=exploreUnit();u.x=16;u.y=18;u.backpack=[];syncBattleBag(u);state.inv[u.id]=[];b.def.blocks=[{kind:'powderBarrel',x:18,y:18},{kind:'crate',x:18,y:20},{kind:'chest',x:20,y:18,locked:true},{kind:'trap',x:19,y:19,found:false}];refreshBattle();centerCam(18,18);window.__floor=document.getElementById('board-floor').firstElementChild;window.__scene=document.getElementById('board-scene');});
 assert.equal(await page.locator('[data-world-object]').count(),3,'隱藏陷阱不公開');
 const p=await boxPoint('[data-world-object="18,18"]'),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
 await page.waitForTimeout(520);assert(await page.locator('.world-object-tip').isVisible());assert((await page.locator('.world-object-tip').textContent()).includes('周圍八格'));await shot('barrel-hold');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
 assert.equal(await page.locator('.world-object-tip').count(),0);assert.equal(await page.evaluate(()=>B().busy),false,'長按不啟動走路');assert.equal(await page.evaluate(()=>B().exploreObject),null);
 await page.mouse.move(p.x,p.y);await page.waitForTimeout(80);assert(await page.locator('.world-object-tip').isVisible(),'滑鼠移入');await page.mouse.move(5,5);assert.equal(await page.locator('.world-object-tip').count(),0,'移出收起');
 await page.evaluate(()=>{B().cam.y-=150;applyCam();});await shot('slatted-crate-and-chest');
 await page.evaluate(()=>{const u=exploreUnit();u.x=17;u.y=18;u.backpack=[{wt:10000}];B().exploreObject=B().def.blocks.find(o=>o.kind==='powderBarrel');refreshBattle();});
 await page.locator('[data-explore-cmd="pickup"]').click();assert.equal(await page.evaluate(()=>powderCount(exploreUnit())),0);assert(await page.evaluate(()=>blocked(18,18)),'超重保留桶');
 await page.evaluate(()=>{exploreUnit().backpack=[];refreshBattle();});await page.locator('[data-explore-cmd="pickup"]').click();assert.equal(await page.evaluate(()=>powderCount(exploreUnit())),1);assert.equal(await page.evaluate(()=>blocked(18,18)),false);assert.equal(await page.evaluate(()=>weightOf('fox')),20,'持久背包重量');
 await page.locator('[data-explore-cmd="place"]').click();assert.equal(await page.locator('#mark-fill-18-18').count(),1,'放置格標示');
 assert.equal(await page.evaluate(()=>placeBarrel(18,20)),false,'遠格不能放');await tapTile(18,18);await page.waitForFunction(()=>!B().mode);assert.equal(await page.evaluate(()=>powderCount(exploreUnit())),0);assert.equal(await page.evaluate(()=>weightOf('fox')),0);assert(await page.evaluate(()=>blocked(18,18)));await shot('barrel-placed');assert(await page.evaluate(()=>document.getElementById('board-floor').firstElementChild===window.__floor),'收納與放置不重畫地板');
 await page.evaluate(()=>{const b=B(),u=exploreUnit();b.phase='combat';b.explorationMap=true;b.actionUsed=false;b.freeUsed=false;b.mode=null;b.menu=null;b.worldObject=null;u.combatActive=true;refreshBattle();clickTile(18,18);});
 await page.locator('[data-worldcmd="pickup"]').click();assert(await page.evaluate(()=>B().actionUsed),'戰棋收納用動作');
 assert.equal(await page.evaluate(()=>{beginBarrelPlacement();return B().mode;}),null,'沒有動作不能開始放置');
 await page.evaluate(()=>{B().actionUsed=false;B().menu='items';refreshBattle();});await page.locator('[data-placebarrel]').click();assert.equal(await page.evaluate(()=>B().mode.key),'placeBarrel');
 assert.equal(await page.evaluate(()=>placeBarrel(18,20)),false);assert.equal(await page.evaluate(()=>B().actionUsed),false);await tapTile(18,18);await page.waitForFunction(()=>B().actionUsed);assert(await page.evaluate(()=>blocked(18,18)));
 // 同一桶爆一次；每桶自己的九格，友軍、隱藏敵人、抗性共用原傷害流程。
 const blast=await page.evaluate(()=>{const b=B();b.phase='explore';b.busy=false;b.actionUsed=false;b.groundEffects={};b.def.blocks=[{kind:'powderBarrel',x:14,y:14},{kind:'powderBarrel',x:15,y:14}];b.units.forEach(u=>{u.x=1;u.y=1;u.statuses=[];u.hp=u.maxHp=100;u.dead=u.down=false;u.mods.DEX=-20;u.resistances=[];});const positions={fox:[13,13],tiger:[14,15],wolf:[16,14],raccoon:[17,14]};for(const [id,[x,y]] of Object.entries(positions)){const u=b.units.find(u=>u.id===id);u.x=x;u.y=y;}const wolf=b.units.find(u=>u.id==='wolf');wolf.resistances=['火焰'];const e=b.units.find(u=>u.side==='foe');e.x=13;e.y=14;e.statuses=[{k:'hidden',val:100}];Math.random=()=>.5;const first=b.def.blocks[0];explodeBarrel(first);const second=explodeBarrel(first);return {barrels:b.def.blocks.length,hp:Object.fromEntries(b.units.filter(u=>u.side==='pc').map(u=>[u.id,u.hp])),foe:e.hp,hidden:isHid(e),second};});
 assert.deepEqual(blast,{barrels:0,hp:{fox:92,tiger:84,wolf:96,raccoon:100},foe:92,hidden:false,second:false});
 const saved=await page.evaluate(()=>{const b=B(),u=b.units.find(u=>u.id==='fox');b.def.blocks=[{kind:'powderBarrel',x:14,y:14}];u.hp=100;u.mods.DEX=20;explodeBarrel(b.def.blocks[0]);return u.hp;});assert.equal(saved,96,'敏捷成功減半');
 // 普攻使用原武器射程、命中和傷害；火焰箭、錐形火焰也能引爆。
 const attack=await page.evaluate(()=>{const b=B(),u=b.units.find(u=>u.id==='fox');b.phase='combat';b.manualCombat=true;b.actionUsed=false;b.busy=false;b.turn=b.units.indexOf(u);b.groundEffects={};b.def.blocks=[{kind:'powderBarrel',x:14,y:14}];u.x=13;u.y=14;u.hp=100;u.weapon=null;u.focus=null;u.mods.STR=10;Math.random=()=>.7;const sk=attackSkill(u),t=validTarget(u,sk,14,14);if(t)doSkill(u,sk,t);return {target:!!t,left:b.def.blocks.length,action:b.actionUsed};});assert.deepEqual(attack,{target:true,left:0,action:true});
 await page.evaluate(()=>{B().flowEpoch++;B().busy=false;B().phase='explore';B().def.blocks=[{kind:'powderBarrel',x:18,y:18}];groundReact(18,18,'火焰');});assert.equal(await page.evaluate(()=>B().def.blocks.length),0,'火焰引爆');
 const down=await page.evaluate(()=>{const b=B();b.phase='explore';b.busy=false;b.exploreStopped=false;b.exploreStopReason=null;b.groundEffects={};b.def.blocks=[{kind:'powderBarrel',x:14,y:14}];const points=[[13,13],[14,13],[15,13],[15,15]];b.units.filter(u=>u.side==='pc').forEach((u,i)=>{[u.x,u.y]=points[i];u.hp=1;u.down=u.dead=false;u.mods.DEX=-20;u.statuses=[];});explodeBarrel(b.def.blocks[0]);const out={phase:b.phase,down:b.units.filter(u=>u.side==='pc').every(u=>u.down)};b.flowEpoch++;return out;});assert.deepEqual(down,{phase:'combat',down:true},'全隊炸倒進入死亡豁免流程');
 assert(await page.evaluate(()=>document.getElementById('board-scene')===window.__scene),'保留分層');
 assert.deepEqual(errors,[]);console.log('✓ 原創物件外觀、桌機移入／手機長按不誤走、隱藏陷阱隔離、20磅負重、收納放置動作與失敗不消耗、九格友傷與連鎖、敏捷減半／抗性／藏身、普通攻擊及火焰、原圖層保留');
}finally{await browser.close();}
