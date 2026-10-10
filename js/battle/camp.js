/* ======================== 野外露營長休（大爺 10-10） ========================
   探索中長休：休息框多一排「誰去找食材」→ 按長休照原本規則結算 → 擲 d20＋感知 對 CAMP_DC →
   成功：隨機一種食材做成料理，全隊吃下去得到效果（state.cookBuff，到下一次長休；生命歸零的那隻消失）
   失敗：單純長休（普通喝湯 CG）；擲出 1：單純長休（煮砸 CG）
   之後跑露營劇情（SCENES.camp），收拾營地回到探索。資料、台詞在 data/story.js 的 CAMP_* */
const mealOf = u => u?.side==="pc" && !u.down && !u.dead ? (state.cookBuff||{})[u.id] || null : null;
const mealStatus = id => (state.cookBuff||{})[id] ? [{k:"meal", food:state.cookBuff[id]}] : [];   // 單位建立時帶上（頭上、狀態卡的圖示）
// 長休開始：上一餐的效果結束
function clearMeals(b){ state.cookBuff = {}; (b?.units||[]).forEach(u=>{ u.statuses = (u.statuses||[]).filter(s=>s.k!=="meal"); }); }
// 生命歸零：這隻的料理效果消失（狀態在昏迷時已經整個清掉）
function loseMeal(u){ if(state.cookBuff && state.cookBuff[u.id]) delete state.cookBuff[u.id]; }
const campWild = b => !!b && b===B() && b.phase==="explore";
function campPickerHTML(b){
  if(!campWild(b)) return "";
  b.campWho ||= "wolf";
  return `<div class="camp-pick"><b>${CAMP_TEXT.pick}</b><div class="camp-heads">${CRITTERS.map(c=>`<button class="tab ${c.id===b.campWho?"on":""}" data-camp-who="${c.id}">${critterHead(c.id)}<span>${c.name}</span></button>`).join("")}</div></div>`;
}
// 長休結算完才擲：先結算（清掉上一餐），再決定這一餐
function startCamp(b){
  const u = b.units.find(v=>v.id===b.campWho && v.side==="pc") || b.units.find(v=>v.side==="pc");
  const r = d20(), total = r + (u.mods.WIS||0);
  const result = r===1 ? "bad" : total>=CAMP_DC ? "good" : "plain";
  const keys = Object.keys(CAMP_FOODS), food = result==="good" ? keys[Math.floor(Math.random()*keys.length)] : null;
  if(food){
    b.units.filter(v=>v.side==="pc" && CRITTERS.some(c=>c.id===v.id)).forEach(v=>{
      (state.cookBuff ||= {})[v.id] = food;
      v.statuses = v.statuses.filter(s=>s.k!=="meal"); v.statuses.push({k:"meal", food});
    });
    if(food==="honey") changeStressAll(v=>v-10);   // 蜂蜜麵包：壓力額外 −10
  }
  state.camp = {who:u.id, name:u.name, r, total, mod:u.mods.WIS||0, result, food};
  blog(`${u.name}去找食材：感知 d20=${r}${fmtN(u.mods.WIS||0)} = ${total} ${total>=CAMP_DC?"≥":"<"} DC ${CAMP_DC} → ${result==="good"?`找到${CAMP_FOODS[food].ingredient}！`:result==="bad"?"擲出 1……":"什麼都沒找到"}`, result==="good"?"skill":"miss");
  state.page = "story"; state.scene = "camp"; state.line = 0; state.info = null; render(); window.scrollTo(0,0);
}
function campScript(){
  const c = state.camp || {who:"wolf", result:"plain"}, T = CAMP_TEXT, art = c.result==="good" ? "campGood" : c.result==="bad" ? "campBad" : "campPlain";
  const L = (o) => ({art, draft:T.draft, ...o});
  const out = [L({who:"narr", text:"天色暗了，小傢伙們在野外搭起營地。"}), L({who:c.who, text:T.go[c.who]}),
    L({who:"narr", text:`${c.name}的感知檢定：d20=${c.r}${fmtN(c.mod||0)} = ${c.total}（DC ${CAMP_DC}）`})];
  if(c.result==="good"){
    const f = CAMP_FOODS[c.food];
    out.push(L({who:c.who, mood:c.who==="raccoon"?"sly":c.who==="wolf"?"smile":"happy", text:T.found[c.who].replace("{i}", f.ingredient)}));
    T.banter[c.food].forEach(l=>out.push(L(l)));
    out.push(L({who:"narr", text:T.cook.replace("{d}", f.dish)}));
    T.eat.forEach(l=>out.push(L(l)));
    out.push(L({who:"narr", text:T.buff.replace("{d}", f.dish).replace("{e}", f.effect)}));
  } else if(c.result==="bad"){
    out.push(L({who:c.who, mood:"confused", text:T.bad[c.who]}));
    T.badEat.forEach(l=>out.push(L(l)));
  } else {
    out.push(L({who:c.who, mood:c.who==="tiger"?"blank":c.who==="fox"?"awkward":c.who==="wolf"?"sigh":"down", text:T.miss[c.who]}));
    T.plain.forEach(l=>out.push(L(l)));
  }
  out.push(L({who:"narr", text:T.morning}));
  return out;
}
function finishCamp(){ state.camp = null; state.page = "battle"; render(); window.scrollTo(0,0); }
