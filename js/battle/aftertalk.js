/* 戰後閒聊（大爺 10-11）：戰鬥中記下小傢伙們的笑點（B().fun），打贏後挑最多 2 件、跳 2～4 句的閒聊。
   記在 B() 裡：反應／好運快照重跑時跟著戰場還原，不會重複記。台詞 data/barks.js 的 AFTER_TALK */
const FUN_RANK = {frenzy:6, lastKill:5, down:4, fumble:4, crit:3, pickup:3, prone:2, luck:2};
function funNote(k, u, extra){
  const b = B(); if(!b || !u || u.side!=="pc" || !CRITTERS.some(c=>c.id===u.id)) return;
  (b.fun ||= []).push({k, who:u.id, ...(extra||{})});
}
function afterTalkLines(b){
  const seen = new Set(), pick = [], name = id => CRITTERS.find(c=>c.id===id).name;
  [...(b.fun||[])].sort((x,y)=>(FUN_RANK[y.k]||0)-(FUN_RANK[x.k]||0)).forEach(f=>{
    if(pick.length<2 && !seen.has(f.k) && AFTER_TALK[f.k]?.self){ seen.add(f.k); pick.push(f); } });
  const lines = [];
  pick.forEach(f=>{   // 每隻一套（10-11）：當事那隻講自己的，旁邊隨機一隻照自己的個性回應
    const T = AFTER_TALK[f.k], others = CRITTERS.map(c=>c.id).filter(id=>id!==f.who), other = others[Math.floor(Math.random()*others.length)];
    const fill = (id, l) => ({who:id, mood:l.mood, text:l.text.replace(/\{self\}/g,name(f.who)).replace(/\{t\}/g,f.t||"敵人")});
    const a = fill(f.who, T.self[f.who]), b2 = fill(other, T.other[other]);
    lines.push(...(T.order==="other" ? [b2, a] : [a, b2]));
  });
  return lines;
}
// 打贏、離開戰鬥時呼叫：有笑點就排一段閒聊（全域彈窗，蓋在下一個畫面上），沒有就不演
function queueAfterTalk(b){
  if(!b) return;
  const lines = b.result==="lose" ? [] : afterTalkLines(b);
  b.fun = [];
  if(lines.length && !window.NO_AFTER_TALK) state.modal = {kind:"afterTalk", lines, i:0};   // NO_AFTER_TALK：測試用
}
function afterTalkHTML(m){
  const l = m.lines[m.i], c = CRITTERS.find(x=>x.id===l.who);
  return `<div class="after-talk"><div class="after-head">${critterHead(l.who, l.mood)}</div><div class="after-body"><b style="color:${c.color}">${c.name}</b><p>${l.text}</p></div></div><div class="after-nav"><button class="btn ghost" data-aftertalk="skip">略過</button><button class="btn" data-aftertalk="next">${m.i<m.lines.length-1?"▼ 繼續":"好"}</button></div>`;
}
function afterTalkStep(a){
  const m = state.modal; if(m?.kind!=="afterTalk") return;
  if(a==="next" && m.i<m.lines.length-1) m.i++; else state.modal = null;
  refreshGameUI();
}
