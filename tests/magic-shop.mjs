// 每日現貨、固定實例與實際裝備效果；手機購買。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';
const br=await chromium.launch();try{
const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];pg.on('pageerror',e=>errors.push(e.message));
await pg.addInitScript(()=>{localStorage.removeItem('fuwa-market-v1');localStorage.setItem('fuwa-help-seen','{"shop":1}');});
await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
const r=await pg.evaluate(()=>{
 const b=B(),u=b.units.find(u=>u.id==='fox');b.units.filter(u=>u.side==='foe').forEach(u=>u.dead=true);b.busy=false;
 const good=k=>MAGIC_GOODS.find(g=>g.key===k),hunter=makeMagicItem(good('hunter_bow'),'test-hunter'),armor=makeMagicItem(good('guard_leather'),'test-armor'),fire=makeMagicItem(good('fire_leather'),'test-fire'),bow=makeMagicItem(good('flame_bow'),'test-bow'),light=makeMagicItem(good('light_sword'),'test-light'),focus=makeMagicItem(good('light_staff'),'test-focus',()=>.8);
 u.armor=armor;const armorGain=acOfUnit(u)-armorAC(ITEMS.find(i=>i.n==='皮甲'),u.shield,u.mods.DEX);u.armor=fire;u.resistances=[];u.damageImmunities=[];const resist=damageAfterResistance(u,7,'火焰');u.armor=null;const absent=damageAfterResistance(u,7,'火焰');u.focus=null;u.weapon=bow;u.backpack=[ITEMS.find(i=>i.n==='箭袋')];
 const target=b.units.find(u=>u.side==='foe');target.dead=false;target.down=false;target.hp=target.maxHp=100;target.resistances=[];target.damageImmunities=[];
 const oldAttack=attackRoll,oldDamage=dmgRoll;attackRoll=()=>({hit:true,crit:false});dmgRoll=()=>4;weaponAttack(u,target);const hit=100-target.hp;attackRoll=()=>({hit:false,crit:false});weaponAttack(u,target);const miss=100-target.hp;let reactions=0;const oldGround=groundReact;groundReact=()=>reactions++;attackRoll=()=>({hit:true,crit:false});target.hp=2;weaponAttack(u,target);groundReact=oldGround;attackRoll=oldAttack;dmgRoll=oldDamage;target.dead=true;
 state.market={day:1,seed:123,stockDay:0,stock:[],marks:0,pity:0,totalDraws:0};const m=ensureMarket(),first=JSON.stringify(m.stock);ensureMarket();const stable=first===JSON.stringify(m.stock);saveMarket();state.market=null;ensureMarket();const reload=first===JSON.stringify(state.market.stock);
 const before=state.market.day;b.phase='explore';takeRest('short',{},b);const short=state.market.day===before;takeRest('long',{},b);const long=state.market.day===before+1;
 state.battle=null;state.page='shop';state.shopContext='items';state.shopCat='魔法物品';state.shopActive=0;state.inv.fox=[];state.gold.fox=1000*GP;state.rolls.fox=Object.fromEntries(ABILITIES.map(a=>[a.k,[6,5,5,1]]));render();
 return {reactions,hunterAmmo:ammoKind(hunter),hunterGrant:hunter.grants.includes('hunters_mark'),armorGain,resist,absent,hit,miss,light:light.wt,base:ITEMS.find(i=>i.n==='短劍').wt,stat:focus.stat,group:groupOf(bow).id,stable,reload,short,long};
});
assert.equal(r.reactions,1);assert.equal(r.hunterAmmo,'bow');assert(r.hunterGrant);assert.equal(r.armorGain,1);assert.equal(r.resist,3);assert.equal(r.absent,7);assert.equal(r.hit,5);assert.equal(r.miss,5);assert.equal(r.light,r.base/2);assert.equal(r.stat,'CHA');assert(r.group);assert(r.stable&&r.reload&&r.short&&r.long);
const id=await pg.locator('[data-magic-buy]:not([disabled])').first().getAttribute('data-magic-buy');await pg.locator(`[data-magic-buy="${id}"]`).tap();
assert(await pg.evaluate(id=>state.inv.fox.includes(id)&&ensureMarket().stock.find(s=>s.id===id).sold,id));assert(await pg.locator(`[data-magic-buy="${id}"]`).isDisabled());
assert(await pg.evaluate(id=>{const gold=state.gold.fox;const twice=buyMagic(id);return !twice&&state.gold.fox===gold;},id));
if(process.env.REVIEW_SHOT)await pg.screenshot({path:process.env.REVIEW_SHOT});assert.deepEqual(errors,[]);console.log('✓ 魔法現貨固定／保存、短休不換長休換、裝備 AC／抗性／減重／附加傷害、390×844 購買防重複');
}finally{await br.close();}
