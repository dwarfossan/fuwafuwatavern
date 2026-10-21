/* 被敲暈的敵人之後怎麼了（大爺 10-21）：資料、文字在 data/grudge.js，傷疤造型在 js/art/scars.js
   state.grudges＝[{id, type, look, link, kind, roll, scars:[{type, by}], by, returns, status}]
     status：pending（等著回來）、news（不幹了／報恩，等大地圖閒聊講出來）、done（結束）
   - 委託打完（贏、撤退）：被敲暈的各擲 1d20（grudgeRollAll）；回來的仇人被打死＝結束，又被敲暈＝再擲一次、傷疤疊上去
   - 之後接同一條路的委託：等著回來的仇人混進敵人裡（grudgeFoes／grudgeMark），開場套上綽號、變強、傷疤（applyGrudgeUnit）
   - 碰面時喊一句、優先打上次打暈牠的那隻（aiHp）；狀態卡多一行
   - 不幹了、報恩：之後在大地圖走路時用閒聊講出來，報恩順便給錢（grudgeTravelChat） */
const grudgeCat = type => GRUDGE.category[type] || "beast";
const grudgeKindOf = type => ["揮砍","穿刺","鈍擊","火焰"].includes(type) ? type : "其他";
const grudgeById = id => (state.grudges||[]).find(g=>g.id===id) || null;
// 跟劇情有關的不擲（劇情自己決定結局）
const grudgeExempt = (b, u) => !!(b.def.owlbearStory && ["owlbear","owlbear_cub"].includes(u.type));
function grudgeResult(r){ const row = GRUDGE.table.find(([a,z])=>r>=a && r<=z); return row ? row[2] : "gone"; }
function grudgeRollAll(b){
  if(!b || !b.def.quest || b.grudgeRolled) return; b.grudgeRolled = true;
  const q = questById(b.def.quest), link = q ? q.link : b.def.questLink;
  state.grudges ||= [];
  // 回來的仇人被打死：這段恩怨結束
  b.units.filter(u=>u.side==="foe" && u.grudge && u.dead && !u.ko).forEach(u=>{ const g = grudgeById(u.grudge); if(g) g.status = "done"; });
  // 還站著（撤退了）：牠還會再來
  b.units.filter(u=>u.side==="foe" && u.grudge && !u.dead).forEach(u=>{ const g = grudgeById(u.grudge); if(g && g.status==="active") g.status = g.returns >= GRUDGE.maxReturns ? "done" : "pending"; });
  b.units.filter(u=>u.side==="foe" && u.ko && !grudgeExempt(b, u)).forEach(u=>{
    const r = 1 + Math.floor(Math.random()*20), kind = grudgeResult(r), scar = {type:u.koType || "鈍擊", by:u.koBy || null};
    let g = u.grudge && grudgeById(u.grudge);
    if(g){ g.scars.push(scar); g.kind = kind; g.roll = r; g.by = scar.by || g.by; }
    else { g = {id:`g${Date.now().toString(36)}${Math.floor(Math.random()*1e4)}`, type:u.type, look:u.baseLook || u.look, link, kind, roll:r, scars:[scar], by:scar.by, returns:0};
      state.grudges.push(g); }
    g.status = ["return","gang","train"].includes(kind) ? (g.returns >= GRUDGE.maxReturns ? "done" : "pending") : ["retire","grateful"].includes(kind) ? "news" : "done";
  });
}
// 委託開場：同一條路上等著回來的仇人（一次最多一個）→ 加進敵人名單，找幫手的多帶兩個同種的
function grudgeFoes(q){
  const g = (state.grudges||[]).find(g=>["pending","active"].includes(g.status) && g.link===q.link && ENEMIES[g.type]);
  if(!g) return null;
  if(g.status==="pending") g.returns += 1;   // active＝上次打輸了、牠還在等：同一次回來，不重算
  g.status = "active";
  return {g, extra:[g.type, ...(g.kind==="gang" ? [g.type, g.type] : [])]};
}
// 產生好地圖之後：把仇人那一格標起來（名單的第 n 個）
function grudgeMark(d, from, info){ if(!info || !d.foes[from]) return; d.foes[from].grudge = info.g.id; d.foes[from].hidden = false; }
// 戰鬥開始建單位時：綽號、變強、傷疤
function applyGrudgeUnit(u, id){
  const g = grudgeById(id); if(!g) return;
  const n = Math.max(1, g.returns), train = g.kind==="train", cat = grudgeCat(g.type), last = g.scars[g.scars.length-1] || {type:"鈍擊"};
  u.grudge = g.id; u.grudgeBy = g.by; u.baseLook = g.look || u.look;
  u.level = (u.level||1) + n + (train ? 1 : 0);
  u.maxHp = u.hp = Math.round(u.maxHp * (1 + GRUDGE.hpPer*n));
  if(train){ u.baseAc += GRUDGE.trainAc; if(!u.special) u.special = GRUDGE.trainSkill[cat] || null; }
  u.xpMul = 1 + GRUDGE.xpPer*n;
  u.name = `${GRUDGE.nick[grudgeKindOf(last.type)]}${ENEMIES[g.type].name}${GRUDGE.nickTail[n-1] ? `（${GRUDGE.nickTail[n-1]}）` : ""}`;
  const base = GRUDGE.scarBase(u.baseLook);
  if(base && MONSTER_LOOK[u.baseLook]){ const key = `${u.baseLook}~${g.id}~${g.scars.length}`; MONSTER_LOOK[key] ||= scarredLook(MONSTER_LOOK[u.baseLook], base, g.scars); u.look = key; }
}
// AI 挑目標：上次打暈牠的那隻優先（血量排序時當成最少血）
const aiHp = (e, p) => e && e.grudgeBy && p.id===e.grudgeBy ? -1000 : p.hp;
const grudgePull = (e, p) => e && e.grudgeBy && p.id===e.grudgeBy ? 6 : 0;   // 走過去時，往牠那邊多走 6 格也願意
// 碰面：看得到的仇人第一次輪到戰鬥時喊一句
function grudgeShoutAll(){
  const b = B(); if(!b || b.phase!=="combat") return;
  b.units.filter(u=>u.side==="foe" && u.grudge && !u.grudgeShouted && !u.dead && !u.down && !foeHid(u) && inCombat(u)).forEach((u,i)=>{
    u.grudgeShouted = true;
    const by = b.units.find(v=>v.id===u.grudgeBy), byName = by ? by.name : "你們", list = GRUDGE.shout[grudgeCat(u.type)] || GRUDGE.shout.beast;
    blog(GRUDGE.shoutLog.replace("{name}", u.name).replace("{by}", byName), "kill");
    say(u, list[Math.floor(Math.random()*list.length)].replaceAll("{by}", byName), 400 + i*1500);
  });
}
function grudgeLineHTML(v){
  const g = v.grudge && grudgeById(v.grudge); if(!g) return "";
  const last = g.scars[g.scars.length-1] || {}, by = CRITTERS.find(c=>c.id===last.by);
  return `<div class="dim race-line grudge-line">${GRUDGE.card(by ? by.name : "小傢伙們", GRUDGE.how[grudgeKindOf(last.type)], g.returns)}</div>`;
}
// 大地圖閒聊：不幹了、報恩的消息（一次講一個）
function grudgeTravelChat(tr){
  const g = (state.grudges||[]).find(g=>g.status==="news"); if(!g || (tr && tr.grudgeTold)) return null;
  if(tr) tr.grudgeTold = true;
  g.status = "done";
  const name = ENEMIES[g.type]?.name || "", cat = grudgeCat(g.type), news = g.kind==="grateful" ? GRUDGE.grateful : GRUDGE.retire, src = news[cat] || news.undead;   // 沒腦子的不死用不死那套旁白
  const lines = src.map(l=>({...l, text:l.text.replaceAll("{type}", name)}));
  if(g.kind==="grateful"){ CRITTERS.forEach(c=>{ state.gold[c.id] = (state.gold[c.id]||0) + GRUDGE.giftGold*GP; }); lines.push({who:"narr", text:GRUDGE.giftLog.replace("{g}", GRUDGE.giftGold)}); }
  return {lines};
}
