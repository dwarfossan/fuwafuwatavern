import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();
try{
const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];pg.on('pageerror',e=>errors.push(e.message));
await pg.addInitScript(()=>localStorage.setItem('fuwa-help-seen','{"shop":1}'));
await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
const r=await pg.evaluate(()=>{
 const base=ITEMS.find(i=>i.n==='火焰法球'),a=makeItem(base),b=makeItem(base);
 const stats=new Set(Array.from({length:150},()=>makeItem(base).stat));
 state.inv.fox=[a.id,b.id];const saved=JSON.stringify(state.inv.fox),views=[invItems('fox'),invItems('fox')];
 const same=JSON.stringify(state.inv.fox)===saved&&views[0][0]===a&&views[1][1]===b;
 const u={weapon:a,focus:null,mods:{INT:1,WIS:2,CHA:3}};
 const values=['INT','WIS','CHA'].map(stat=>{a.stat=stat;return [spellStat(u),u.mods[spellStat(u)],dcOf(u,spellStat(u))];});
 a.stat=views[0][0].stat;
 state.battle=null;state.page='shop';state.shopCat='法器';state.shopActive=0;state.gold.fox=100*GP;render();
 return {unique:a.id!==b.id,stats:[...stats].sort(),same,values};
});
assert(r.unique&&r.same);assert.deepEqual(r.stats,['CHA','INT','WIS']);assert.deepEqual(r.values,[['INT',1,11],['WIS',2,12],['CHA',3,13]]);
const before=await pg.locator('[data-buy]').first().getAttribute('data-buy');const stat=await pg.evaluate(id=>itemById(id).stat,before);
await pg.locator(`[data-buy="${before}"]`).tap();
assert(await pg.evaluate(({id,stat})=>state.inv.fox.includes(id)&&itemById(id).stat===stat,{id:before,stat}));
assert.notEqual(await pg.locator('[data-buy]').first().getAttribute('data-buy'),before);
await pg.locator('.shop-side summary').tap();await pg.locator(`.bag [data-iteminfo="${before}"]`).tap();
assert.match(await pg.locator('.modal').innerText(),/施法屬性/);assert((await pg.locator('.modal').innerText()).includes(await pg.evaluate(s=>ABILITIES.find(a=>a.k===s).n,stat)));
await pg.waitForTimeout(400);
if(process.env.REVIEW_SHOT)await pg.screenshot({path:process.env.REVIEW_SHOT});
await pg.locator('.md-x').tap();
const preserved=await pg.evaluate(()=>{startBattle('ambush');const a=invItems('fox').map(i=>[i.id,i.stat]);const e=B().units.filter(u=>u.focus).map(u=>[u.focus.id,u.focus.stat]);state.retriesLeft=3;retryBattle();return [JSON.stringify(a)===JSON.stringify(invItems('fox').map(i=>[i.id,i.stat])),JSON.stringify(e)===JSON.stringify(B().units.filter(u=>u.focus).map(u=>[u.focus.id,u.focus.stat]))];});
assert.deepEqual(preserved,[true,true]);assert.deepEqual(errors,[]);console.log('✓ 每件法器獨立固定屬性、三種可生成、商店現貨一致、裝備卡與重試保存');
}finally{await br.close();}
