// 公開機率／保底、週自選與領取交易；手機操作實際付費。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
import {bootReady} from './boot.mjs';
const br=await chromium.launch();try{
 const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.addInitScript(()=>{localStorage.removeItem('fuwa-market-v1');localStorage.setItem('fuwa-help-seen','{"shop":1}');});
 await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(pg);
 await pg.evaluate(()=>{state.battle=null;state.page='shop';state.shopContext='items';state.shopCat='魔法物品';state.shopActive=0;state.inv.fox=[];state.gold.fox=1000*GP;state.rolls.fox=Object.fromEntries(ABILITIES.map(a=>[a.k,[6,6,6,1]]));state.market={day:1,seed:123,stockDay:0,stock:[],marks:0,pity:0,totalDraws:0};render();});
 assert.deepEqual(await pg.evaluate(()=>[sealRarity(.699,0),sealRarity(.7,0),sealRarity(.95,0),sealRarity(.99,0),sealRarity(0,9)]),['blue','yellow','orange','gold','yellow']);
 assert(await pg.evaluate(()=>rulesHTML('負重與狩印').includes('data-rule="負重"')&&ruleDictionary()['狩印']===SKILL_GROUPS.flatMap(g=>g.skills).find(s=>s.id==='hunters_mark').text));await pg.locator('#sealOpen').tap();assert.match(await pg.locator('.modal').innerText(),/這個問號/);
 for(let i=0;i<8;i++)await pg.locator('#sealNext').tap();
 assert(await pg.evaluate(()=>ensureMarket().sealSeen));await pg.locator('#sealDraw').tap();
 assert.equal(await pg.evaluate(()=>state.market.totalDraws),1);assert.equal(await pg.evaluate(()=>state.market.marks),1);assert.equal(await pg.evaluate(()=>state.gold.fox),995*100);
 if(process.env.REVIEW_SHOTS)await pg.screenshot({path:path.join(process.env.REVIEW_SHOTS,'seal-result.png')});
 const pending=await pg.evaluate(()=>state.market.pending);await pg.locator('#sealClaim').tap();assert(await pg.evaluate(id=>state.inv.fox.includes(id)&&itemById(id).noRefund,pending));
 const results=await pg.evaluate(()=>{
  const m=ensureSealWeek();const initial=m.prizes.map(id=>itemById(id).key);let maxBlue=0,blue=0;const before=state.gold.fox;
  for(let i=0;i<49;i++){if(!drawSeal('fox')||!claimSeal('fox'))throw Error('draw/claim');const it=itemById(state.inv.fox.at(-1));blue=it.rarity==='blue'?blue+1:0;maxBlue=Math.max(maxBlue,blue);}
  const paid=before-state.gold.fox,marks=m.marks,total=m.totalDraws;const bad=exchangeSeal('test-invalid','fox');const prize=m.prizes[0],source=itemById(prize),gold=state.gold.fox;
  const redeemed=exchangeSeal(prize,'fox'),noPay=gold===state.gold.fox,remaining=m.marks,it=itemById(state.inv.fox.at(-1)),same=it.n===source.n&&JSON.stringify(it.grants)===JSON.stringify(source.grants)&&JSON.stringify(it.resistances)===JSON.stringify(source.resistances)&&it.wt===source.wt;
  m.pity=7;m.marks=12;for(let i=0;i<7;i++)advanceMarketDay();ensureSealWeek();const carry=m.pity===7&&m.marks===12,week=m.week,changed=JSON.stringify(initial)!==JSON.stringify(m.prizes.map(id=>itemById(id).key));
  // 買不起不扣款、不增加任何計數。
  const totalBefore=m.totalDraws;state.gold.fox=0;const broke=drawSeal('fox')===false&&m.totalDraws===totalBefore&&m.marks===12;state.gold.fox=100*GP;
  drawSeal('fox');const id=m.pending,money=state.gold.fox,count=m.totalDraws;const second=!drawSeal('fox')&&state.gold.fox===money&&m.totalDraws===count;
  // 超重不丟獎、不重抽；移開重量後可領，不能領兩次。
  const oldInv=state.inv.fox;state.inv.fox=Array.from({length:100},()=>ITEMS.find(i=>i.n==='鏈甲').id);const blocked=!claimSeal('fox')&&m.pending===id;state.inv.fox=oldInv;const claim=claimSeal('fox'),twice=!claimSeal('fox');
  saveMarket();const saved=JSON.stringify(m);state.market=null;ensureMarket();const persistent=JSON.stringify(state.market)===JSON.stringify({...JSON.parse(saved),items:state.magicItems});
  return {maxBlue,paid,marks,total,bad,redeemed,same,noRefund:it.noRefund,noPay,remaining,carry,week,changed,broke,second,blocked,claim,twice,persistent};
 });
 assert(results.maxBlue<=9);assert.equal(results.paid,49*5*100);assert.equal(results.marks,50);assert.equal(results.total,50);assert.equal(results.bad,false);assert(results.redeemed&&results.same&&results.noRefund&&results.noPay);assert.equal(results.remaining,0);assert(results.carry&&results.changed);assert.equal(results.week,2);assert(results.broke&&results.second&&results.blocked&&results.claim&&results.twice&&results.persistent);
 await pg.evaluate(()=>{state.shopScroll['魔法物品']=0;state.market.marks=50;state.inv.fox=[];render();});const chosen=await pg.locator('[data-seal-exchange]').first().getAttribute('data-seal-exchange');await pg.locator(`[data-seal-exchange="${chosen}"]`).tap();assert.equal(await pg.evaluate(()=>state.market.marks),0);assert.equal(await pg.evaluate(()=>itemById(state.inv.fox.at(-1)).key),'night_coat');await pg.evaluate(()=>{state.shopScroll['魔法物品']=0;render();});if(process.env.REVIEW_SHOTS)await pg.screenshot({path:path.join(process.env.REVIEW_SHOTS,'seal-week.png')});assert.deepEqual(errors,[]);
 console.log('✓ 手機初次問號劇情／付費／領取、機率邊界、50抽與十次保底、週公開自選、跨週保存、無款／超重／重複防護');
}finally{await br.close();}
