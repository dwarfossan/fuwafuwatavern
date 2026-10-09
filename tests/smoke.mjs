// 冒煙測試：開遊戲、走劇情、跑戰鬥、檢查關鍵規則。有任何一項失敗就 exit 1。
// 用法：npm i playwright（第一次）→ node tests/smoke.mjs [index.html 的路徑，預設是 repo 根目錄的 index.html]
// 這份只能證明「沒壞」：每項規則抽幾個代表情況檢查，不是完整測試。
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(process.argv[2] || path.join(here, '..', 'index.html'));
const url = 'file://' + file;
let fails = 0, passes = 0;
const ok = (name, cond, info='') => { if(cond){ passes++; console.log('  ✓ ' + name); } else { fails++; console.log('  ✗ ' + name + (info ? '  → ' + info : '')); } };

const br = await chromium.launch();
async function open(hash='', viewport={width:390, height:844}){   // 只做手機版（10-02）：寬螢幕會轉到 phone.html
  const pg = await br.newPage({viewport});
  await pg.addInitScript(()=>{ try{ localStorage.setItem('fuwa-help-seen','{"roll":1,"shop":1,"map":1}'); }catch(e){} });   // 頁面說明第一次會自動打開（10-02），測試先當作看過
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url + hash);
 await pg.waitForFunction(()=>!document.body.classList.contains('image-boot'));
  if(hash==="#battle") await pg.evaluate(()=>startBattle("ambush")); // 原有規則用固定場景
  await pg.waitForTimeout(800);
  return {pg, errs};
}
// 擲屬性（每隻擲骰＋自動分配）
async function rollAll(pg){
  await pg.click('#start');
  for(const i of [0,1,2,3]){ await pg.click(`[data-tab="${i}"]`); await pg.click('#rollAll'); await pg.waitForTimeout(60); await pg.click('#autoAssign'); await pg.waitForTimeout(60); }
}

// ---------- 1. 封面、擲屬性、序章 ----------
console.log('封面 → 擲屬性 → 序章');
{
  const {pg, errs} = await open();
  ok('從封面開始', await pg.evaluate(()=>state.page) === 'cover');
  await rollAll(pg);
  ok('四隻都分配完', await pg.evaluate(()=>CRITTERS.every(c=>ABILITIES.every(a=>state.slot[c.id] && state.slot[c.id][a.k]!==undefined))));
  await pg.click('#next'); await pg.waitForTimeout(200);
  ok('進入序章', await pg.evaluate(()=>state.page==='story' && state.scene==='prologue'));
  const stage = await pg.evaluate(()=>{ window.__st=document.getElementById('stage'); return true; });
  await pg.mouse.click(200, 60); await pg.waitForTimeout(150);
  ok('點對話框以外的地方也會推進', await pg.evaluate(()=>state.line) === 1);
  ok('換台詞不整頁重畫', await pg.evaluate(()=>window.__st===document.getElementById('stage')));
  const total = await pg.evaluate(()=>SCENES.prologue.script.length);
  for(let i=0;i<total;i++){ /* 10-10 起始風格：停在選項時點第一個 */ if(await pg.locator('[data-style-pick]').count()) await pg.locator('[data-style-pick]').first().click(); else await pg.mouse.click(200, 60); await pg.waitForTimeout(40); }
  ok('序章最後一句「去看裝備」按鈕亮起', await pg.evaluate(()=>{ const b=document.getElementById('toShop'); return b && !b.disabled && b.textContent==='去看裝備'; }));
  await pg.click('#toShop'); await pg.waitForTimeout(200);
  ok('進入商店', await pg.evaluate(()=>state.page) === 'shop');
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

// ---------- 2. 大地圖旅行 → 伏擊劇情 → 察覺 → 戰鬥 ----------
console.log('大地圖 → 伏擊 → 戰鬥');
for(const spot of [true, false]){
  const {pg, errs} = await open();
  await rollAll(pg);
  await pg.evaluate(()=>{ CRITTERS.forEach(c=>{ state.gold[c.id]=100*GP; state.inv[c.id]=[]; }); state.page="map"; state.location="tavern"; state.travel={from:"tavern", to:"town", t:0, stop:.5, alert:false}; render(); startTravel(); });
  await pg.waitForTimeout(4300);
  ok(`旅行途中進入伏擊劇情（${spot?'有人察覺':'沒人察覺'}）`, await pg.evaluate(()=>state.page==='story' && state.scene==='ambush' && !!state.scout));
  const r = await pg.evaluate((spot)=>{
    const k = Object.keys(state.scout.foes)[0]; state.scout.foes[k].spotted = spot ? ["wolf"] : []; if(!spot) state.scout.foes[k].hide = 20;   // 沒人察覺＝躲好了（沒過 13 會直接現形）
    const s = SCENES.ambush.script; return {n:s.length, base:AMBUSH.length, shake:s.some(l=>l.shake), wolf:s.some(l=>l.who==='wolf' && l.text===SPOT_QUIP.wolf)};
  }, spot);
  ok('察覺的台詞與草叢晃動', spot ? (r.shake && r.wolf) : (!r.shake && r.n===r.base), JSON.stringify(r));
  // 被動感知演出：走到第一句察覺台詞時出現；沒人察覺就整段都不出現
  const sp = await pg.evaluate(()=>{ const out=[]; const n=SCENES.ambush.script.length;
    for(let i=0;i<n;i++){ state.line=i; updateStoryLine(); const L=SCENES.ambush.script[i];
      out.push({shake:!!L.shake, row:!!document.querySelector('.spot-row'), ok:document.querySelectorAll('.pf .obs-ok').length, fail:document.querySelectorAll('.pf .obs-fail').length,
        dice:[...document.querySelectorAll('.spot-cell .dp-n')].map(e=>e.textContent)}); }
    state.line=0; updateStoryLine(); return out; });
  ok('被動感知：察覺台詞時才出現、之後消失', sp.every(x=>x.row===x.shake), JSON.stringify(sp.map(x=>+x.row)));
  ok('被動感知：骰子都停在 10、成功 ❗ 失敗 ❓', spot ? sp.filter(x=>x.row).every(x=>x.dice.join()==='10,10,10,10' && x.ok===1 && x.fail===3) : sp.every(x=>!x.row));
  await pg.evaluate(()=>{ state.line = SCENES.ambush.script.length-1; render(); });
  // 捕捉開場、開始第一回合以前的真實狀態；不等待 AI 詠唱後再猜開場有沒有躲著。
  await pg.evaluate(()=>{const original=nextTurn;nextTurn=function(){
    if(!window.smokeOpening){const sh=B().units.find(u=>u.type==='goblin_shaman');window.smokeOpening={hidden:!!has(sh,'hidden'),npc:B().units.filter(u=>u.side==='npc').length};}
    return original();
  };});
  await pg.click('#toBattle'); await pg.waitForTimeout(500);
  const b = await pg.evaluate(()=>window.smokeOpening);
  ok('薩滿：有人察覺就現形、沒人察覺就躲著', b.hidden===!spot, JSON.stringify(b));
  ok('戰場上有商人（NPC）', b.npc === 1);
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

// ---------- 3. 快速戰鬥跑幾回合 ----------
console.log('快速戰鬥');
{
  const {pg, errs} = await open('#battle');
  ok('#battle 直接進戰鬥', await pg.evaluate(()=>state.page==='battle' && !!B()));
  ok('回合順序沒有 NPC、沒有躲著的敵人', await pg.evaluate(()=>document.querySelectorAll('.ord').length === B().units.filter(u=>u.side!=='npc' && !foeHid(u)).length));
  // 10-09 反應：直接待機會保留免費動作，敵人命中時會停下來問；測試一律選「不用」，讓回合繼續
  for(let i=0;i<30;i++){ const no=pg.locator('[data-react="none"]'); if(await no.count()){ try{ await no.first().click({timeout:400}); }catch{} }
    const btn=pg.locator('button:has-text("待機")'); if(await btn.count()){ try{ await btn.first().click({timeout:400}); }catch{} } await pg.waitForTimeout(450); }
  const r = await pg.evaluate(()=>({round:B().round, npcHp:B().units.find(u=>u.side==='npc').hp}));
  ok('敵人會行動、回合會前進', r.round >= 2, JSON.stringify(r));
  ok('沒有人攻擊商人', r.npcHp === 4);
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

// ---------- 4. 規則 ----------
console.log('規則');
{
  const {pg, errs} = await open('#battle');
  const r = await pg.evaluate(()=>{
    const b=B(); window.nextTurn=()=>{}; window.aiTurn=()=>{};
    const U=id=>b.units.find(u=>u.id===id), tig=U('tiger'), wolf=U('wolf'), fox=U('fox');
    const g=b.units.find(u=>u.type==='goblin'), arc=b.units.find(u=>u.type==='goblin_archer'), npc=b.units.find(u=>u.side==='npc');
    b.units.forEach(u=>{ u.hp=u.maxHp; u.down=false; u.dead=false; u.statuses=u.statuses.filter(s=>s.k==='hidden'); });
    const o={};
    // 高度
    tig.x=10; tig.y=17; o.climb = reachable(tig,10).get('8,17')?.cost;
    tig.x=10; tig.y=21; o.step = reachable(tig,10).get('8,21')?.cost;
    tig.x=8; tig.y=21; o.down1 = reachable(tig,10).get('9,21')?.cost;
    tig.x=8; tig.y=18; g.x=9; g.y=18; o.distCliff = dist(tig,g);
    tig.x=7; tig.y=18; g.x=8; g.y=18; g.maxHp=99; g.hp=99; push(tig,g,1); o.fall = {pos:[g.x,g.y], dmg:99-g.hp, prone:!!has(g,'prone')};
    g.statuses=[]; g.x=9; g.y=18; tig.x=10; tig.y=18; push(tig,g,1); o.wall=[g.x,g.y];
    wolf.x=5; wolf.y=14; arc.x=5; arc.y=20; o.coverBehind = coverOf(wolf,arc).by;
    arc.x=5; arc.y=17; o.coverEdge = coverOf(wolf,arc).v;
    // NPC
    o.npcHostile = hostile(npc,g) || hostile(npc,tig) || enemiesOf(g).includes(npc) || enemiesOf(tig).includes(npc);
    o.foeHostile = hostile(g,tig);
    // 小筆記
    o.cap = [noteCap('fox'), noteCap('tiger'), notePages('fox'), notePages('raccoon')];
    o.starterLv = STARTER_NOTES.fox.every(n=>n.lv===1);
    // 熟練格（全施法者表）、嬌嬌物理招免費升一階、一階用完拿高階的放、短休每階回一半
    o.table = [1,3,5,20].map(l=>slotMax({level:l}).join('/'));
    const ax = unitSkills(tig).find(s=>s.def.tier===1 && isPhysicalSkill(s) && canUp(s));
    const sp = learnedSkillByKey('magic_missile');   // 10-08：直接指定會升階的法術，不依賴誰的起始技能
    o.tiger = ax ? [upOf(tig,ax,1), upOf(tig,ax,2), upOf(wolf,ax,1), upOf(wolf,ax,2)] : null;
    o.spell = sp ? upOf(tig,sp,1) : null;   // 拿嬌嬌算：她的免費升階不管法術招
    const t3 = {id:'wolf', side:'foe', level:3, slots:[0,1]};
    o.fallback = ax ? [tiersFor(t3,ax).join(), skillReady(t3,ax), (t3.slots=[0,0], skillReady(t3,ax))] : null;
    const t5 = {id:'wolf', side:'foe', level:5, slots:[0,1,0]};
    o.short = slotMax(t5).map((m,i)=>Math.min(m,(t5.slots[i]||0)+Math.ceil(m/2))).join('/');
    // 投擲物圖樣
    o.proj = ['鍊金火','酸液瓶','網子','匕首'].map(n=>projArtKey(ITEMS.find(i=>i.n===n)));
    // 大地圖：方向、回程路線
    o.map = WORLD.locations.find(l=>l.id==='tavern').x > WORLD.locations.find(l=>l.id==='cave').x;
    const p1=roadPoint('tavern','town',.3), p2=roadPoint('town','tavern',.7); o.road = Math.abs(p1.x-p2.x)<1e-6 && Math.abs(p1.y-p2.y)<1e-6;
    // 戰場方向：四小隻在右、朝左
    o.dir = b.def.party.every(([x,y])=>x===15) && fox.face===-1;
    return o;
  });
  ok('爬兩層山壁花 4 格', r.climb===4, r.climb);
  ok('台階分兩次爬花 4 格', r.step===4, r.step);
  ok('往下一層不多花', r.down1===1, r.down1);
  ok('隔兩層高度差距離算 2', r.distCliff===2, r.distCliff);
  ok('推下 10 呎：1d6、倒地', r.fall.pos.join()==='9,18' && r.fall.dmg>=1 && r.fall.dmg<=6 && r.fall.prone, JSON.stringify(r.fall));
  ok('推不上兩層山壁', r.wall.join()==='9,18', r.wall);
  ok('台地後面有斷層掩護、邊緣沒有', r.coverBehind==='斷層' && r.coverEdge===0, `${r.coverBehind} / ${r.coverEdge}`);
  ok('NPC 不是任何人的敵人', r.npcHostile===false && r.foeHostile===true);
  ok('小筆記一頁 5 招：玲玲 3 頁 15 招、其他 2 頁 10 招', r.cap.join()==='15,10,3,2', r.cap);
  ok('起始技能記成 1 級', r.starterLv);
  ok('熟練格照全施法者表（1 級 2、3 級 4/2、5 級 4/3/2、20 級）', r.table.join(' ')==='2 4/2 4/3/2 4/3/3/3/3/2/2/1/1', r.table);
  ok('嬌嬌物理招免費升一階，別人不會', r.tiger && r.tiger.join()==='1,2,0,1', r.tiger);
  ok('嬌嬌的特性不管法術招', r.spell===0, r.spell);
  ok('一階用完拿二階的放；全用完就不能用', r.fallback && r.fallback.join()==='2,true,false', r.fallback);
  ok('短休每階回一半（無條件進位）', r.short==='2/3/1', r.short);
  ok('投擲物照物品換圖', r.proj.join()==='flask_fire,flask_acid,net,dagger', r.proj);
  ok('大地圖酒館在右、洞窟在左', r.map);
  ok('回程路線跟去程同一條路', r.road);
  ok('戰場四小隻在右、朝左', r.dir);

  // 觀察學習：DC 5＋怪物等級、向玲玲學用招式原本的等級
  const r2 = await pg.evaluate(()=>{
    const b=B(), U=id=>b.units.find(u=>u.id===id), ling=U('fox'), tig=U('tiger');
    const foe=b.units.find(u=>u.type==='goblin'); foe.level=7; b.observeRound=-1;
    const rnd=Math.random; Math.random=()=>0.999; observedSkill(foe,'t_key','測試招'); Math.random=rnd;
    const pend=ling.pendingLearned.find(x=>x.key==='t_key'); ling.learned.push({...pend});
    const at=tot=>{ const d=tot-(tig.mods.WIS||0); Math.random=()=>(d-1)/20+0.001; const k=learnFromLingling(tig,'t_key'); Math.random=rnd; tig.pendingLearned=[]; return k; };
    return {lv:pend.lv, dc11:at(11), dc12:at(12), mark:(b.marks||[]).some(m=>m.kind==='ok')};
  });
  ok('觀察成功記下怪物等級', r2.lv===7, r2.lv);
  ok('向玲玲學 DC＝5＋7：11 失敗、12 成功', r2.dc11===false && r2.dc12===true, JSON.stringify(r2));
  ok('觀察成功跳 ❗ 泡泡', r2.mark);

  // 頭上提示的縮放
  const r3 = await pg.evaluate(()=>{ const b=B(), zd=zoomDefault(); b.zoom=zd; const a=overlayK()*zd; b.zoom=.2; const c=overlayK()*.2; b.zoom=1.2; const d=overlayK()/(1/zd); return [a,c,d]; });   // 10-02 縮小改 .2：手機預設 .45，.3 還沒小到最少 60% 的門檻
  // 合併重複招式（2026-10-01）：用代號找得到、舊名稱不在、能不能用照新條件
  const r4 = await pg.evaluate(()=>{ const b=B(), tig=b.units.find(u=>u.id==='tiger'), W=n=>ITEMS.find(i=>i.n===n);
    const can=(w,id)=>{ tig.weapon=w?W(w):null; return skillReqMet(tig, learnedSkillByKey(id)); };
    return {gone:['逼退','回掃','絆倒','瞄腿','頭槌','連打','衝撞','重敲','連斬'].filter(n=>SKILL_GROUPS.some(g=>g.skills.some(s=>s.name===n))),
      impl:Object.keys(SKILL_BY_ID).filter(id=>!learnedSkillByKey(id).impl),
      len:SKILL_GROUPS.every(g=>!SKILL_IMPL[g.id] || SKILL_IMPL[g.id].length===g.skills.length),
      req:[can(null,'double_strike'),can('長劍','double_strike'),can('硬頭錘','double_strike'),can(null,'daze'),can('長柄刀','topple'),can('匕首','topple'),can('短弓','hamstring'),can('硬頭錘','hamstring')].map(Number).join(''),
      notes:Object.values(STARTER_NOTES).flat().every(n=>learnedSkillByKey(n.key)), foes:b.def.foes.every(f=>!f.testSkill || learnedSkillByKey(f.testSkill)),
      bowAnim: (()=>{ const w=b.units.find(u=>u.id==='wolf'); w.weapon=W('短弓'); return skillAnim(w, learnedSkillByKey('hamstring'), {x:w.x-6,y:w.y}); })() }; });
  ok('合併招式：舊名稱都不在、每招都有實作、組數對得上', r4.gone.length===0 && r4.impl.length===0 && r4.len, JSON.stringify(r4));
  ok('合併招式：武器條件（徒手連擊、長柄撞倒、拿弓扎腿…）', r4.req==='11111010', r4.req);
  ok('起始技能、敵人的 testSkill 都用代號找得到', r4.notes && r4.foes);
  ok('拿弓放扎腿用射箭的動作', r4.bowAnim==='shoot', r4.bowAnim);
  // 狀態精簡成 15 個（2026-10-01）：合併的狀態照新規則、凍結麻痺中毒
  const r5 = await pg.evaluate(()=>{ const b=B(), U=id=>b.units.find(u=>u.id===id), tig=U('tiger'), wolf=U('wolf'), g=b.units.find(u=>u.type==='goblin');
    const o={}, clr=()=>b.units.forEach(u=>{ u.statuses=[]; u.hp=u.maxHp; u.down=false; u.dead=false; });
    const icons=Object.values(STATUS_BADGE).map(x=>x[0]).filter(Boolean); o.icons=[icons.length, new Set(icons).size];
    o.oldGone=['grappled','pinned','hampered','shieldBroken','vex','guarded','parry','guard'].filter(k=>k in STATUS_BADGE || k in STATUS_NAME);
    const mv=u=>{ beginTurn(u); return b.moveLeft; };
    clr(); addStatus(tig,'slowed',{n:1}); addStatus(tig,'slowed',{via:'pin',stop:true}); o.pin=mv(tig);
    clr(); addStatus(tig,'slowed',{n:1,src:'a'}); addStatus(tig,'slowed',{src:'b'}); o.slowMax=tig.speed-mv(tig);
    clr(); const ac0=acOfUnit(tig); addStatus(tig,'acDown',{n:1}); addStatus(tig,'acDown',{via:'cleave',shield:true}); o.acMax=ac0-acOfUnit(tig);
    clr(); g.x=tig.x+1; g.y=tig.y; addStatus(g,'restrained',{via:'grapple',src:tig.id,dc:12}); o.grab=[grapplerOf(g)===tig, victimsOf(tig).includes(g), mv(g)];
    g.x=tig.x+3; checkGrapples(); o.release=!has(g,'restrained');
    clr(); addStatus(tig,'helped',{via:'vex',target:wolf.id}); attackRoll(tig,g,{}); o.vexKept=!!has(tig,'helped'); attackRoll(tig,wolf,{}); o.vexUsed=!has(tig,'helped');
    clr(); addStatus(wolf,'dodge',{via:'guard',once:true,by:tig.id}); attackRoll(g,wolf,{}); o.guardOnce=!has(wolf,'dodge');
    clr(); addStatus(tig,'frozen',{}); o.frozenMv=mv(tig); hurt(tig,1,'火焰',null); o.thaw=!has(tig,'frozen');
    clr(); addStatus(tig,'poisoned',{dc:13}); const hp=tig.hp; beginTurn(tig); const damaged=tig.hp<hp, oldRandom=Math.random;Math.random=()=>0;poisonSave(tig);const kept=!!has(tig,'poisoned');Math.random=()=>.99;poisonSave(tig);o.poison=[damaged,kept,!has(tig,'poisoned')];Math.random=oldRandom;
    clr(); addStatus(tig,'paralyzed',{}); beginTurn(tig); o.para=[b.skipTurn, !has(tig,'paralyzed')]; b.skipTurn=false;
    clr(); return o; });
  ok('狀態：頭上圖示剛好 19 種（10-03 大爺放寬：加狩印、專注；10-09 加燃燒、倒地）、不重複，舊的狀態代號都不在', r5.icons[0]===19 && r5.icons[1]===19 && r5.oldGone.length===0, JSON.stringify(r5.icons)+r5.oldGone);
  ok('狀態：釘住＝緩速歸零；緩速、破甲同名不疊加取大的', r5.pin===0 && r5.slowMax===3 && r5.acMax===3, JSON.stringify([r5.pin,r5.slowMax,r5.acMax]));
  ok('狀態：擒抱＝束縛（認得抓的人、不能移動、離開就鬆開）', r5.grab.join()==='true,true,0' && r5.release, JSON.stringify(r5.grab));
  ok('狀態：困擾＝只對那個目標的協助；守護＝只擋一次的閃避', r5.vexKept && r5.vexUsed && r5.guardOnce, JSON.stringify(r5));
  ok('狀態：凍結不能動、被火解凍；中毒扣血、體質豁免成功才解毒；麻痺跳過一回合', r5.frozenMv===0 && r5.thaw && r5.poison.join()==='true,true,true' && r5.para.join()==='true,true', JSON.stringify(r5));
  ok('頭上提示：預設縮放跟以前一樣、縮小時最少 60%、放大跟著地圖', Math.abs(r3[0]-1)<1e-9 && Math.abs(r3[1]-.6)<1e-9 && Math.abs(r3[2]-1)<1e-9, r3);
  ok('沒有錯誤', errs.length===0, errs.join(' / '));
  await pg.close();
}

await br.close();
console.log(`\n${passes} 項通過，${fails} 項失敗`);
process.exit(fails ? 1 : 0);
