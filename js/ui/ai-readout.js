/* 戰場文字摘要（大爺 10-20）：戰場是 SVG 圖，讀網頁文字的工具（瀏覽器 AI 側邊欄）看不出誰站哪格、剩多少血。
   這裡把「玩家畫面上本來就看得到的」戰場資訊寫成文字，放在畫面外的 #aiReadout（index.html，視覺隱藏）。
   phone.html 的唸稿區會連同遊戲其他文字一起抄到外層。
   只寫看得到的：躲著的敵人（foeHid）、沒發現的陷阱、沒發現的油一律不寫；探索中只有目前操作的那隻在地圖上。
   更新：戰場的場景層或介面層有變動就重寫（updateBattleFrame），換頁時 render() 清掉，不留舊資料。 */
const READOUT_GROUND = {fire:"燃燒的地面", ice:"冰面", charged:"帶電水面", steam:"蒸氣"};
const READOUT_OBJECTS = {chest:"寶箱", door:"門（關著）", doorOpen:"門（開著）", powderBarrel:"火藥桶", poisonSwamp:"毒沼", water:"水面"};
function battleReadoutText(){
  const b = state.page==="battle" ? B() : null; if(!b) return "";
  const u = b.phase==="explore" ? exploreUnit() : cur();
  const at = v => `(${mapCell(v.x)},${mapCell(v.y)})`;
  const seen = v => !v.fled && !foeHid(v) && !(b.phase==="explore" && v.side==="pc" && v!==exploreUnit());
  const statusText = v => { const s = [...new Set(v.statuses.map(x=>STATUS_NAME[x.k]).filter(Boolean))]; return s.length ? `，狀態：${s.join("、")}` : ""; };
  const unitLine = v => {
    const m = mountOf(v), r = riderOf(v), far = u && u!==v && !v.dead ? `，離${nameFor(u)} ${dist(u,v)} 格` : "";
    const hp = v.ko ? KO_UI.status : v.dead ? "已倒下" : v.down ? (v.pet ? "昏過去了" : v.steed ? "散成骨頭" : "昏迷") : `生命 ${v.hp}/${v.maxHp}`;
    return `・${v.name}：${hp}，位置 ${at(v)}${far}${m ? `，騎著${m.name}` : ""}${r ? `，被${r.name}騎著` : ""}${isPcCritter(v) ? `，壓力 ${stressOf(v)}` : ""}${statusText(v)}`;
  };
  const L = [];
  L.push(`【戰場摘要】${b.def.name||""}　${b.phase==="explore" ? "探索中" : `戰棋第 ${b.round} 回合`}${b.result ? `　結果：${b.result==="win"?"勝利":"失敗"}` : ""}`);
  if(b.phase==="explore" && u) L.push(`探索中只操作 ${u.name}，其他隊員跟在後面、不在地圖上。`);
  else if(u && !b.result) L.push(`現在輪到：${nameFor(u)}${playerControlled(u) ? `（玩家操作；剩移動 ${b.moveLeft} 格，主要動作${b.actionUsed?"已用":"可用"}，免費動作剩 ${Math.max(0,2-(b.freeUsed||0))}）` : "（電腦行動中）"}`);
  L.push(`座標 (x,y)，地圖 ${b.def.w}×${b.def.h}；相鄰 8 格（含斜角）都算 1 格。`);
  L.push("我方："); b.units.filter(v=>v.side==="pc" && seen(v)).forEach(v=>L.push(unitLine(v)));
  const foes = b.units.filter(v=>v.side==="foe" && seen(v) && (!v.dead || inCombat(v) || b.phase==="explore"));
  L.push(foes.length ? "看得到的敵人：" : "看得到的敵人：沒有"); foes.forEach(v=>L.push(unitLine(v)));
  const npcs = b.units.filter(v=>v.side==="npc" && !v.dead); if(npcs.length){ L.push("其他人："); npcs.forEach(v=>L.push(unitLine(v))); }
  const objs = b.def.blocks.filter(o=>READOUT_OBJECTS[o.kind] || (o.kind==="trap" && o.found && !o.disarmed) || (o.kind==="oil" && o.found));
  if(objs.length) L.push("地圖上的東西：" + objs.map(o=>`${o.kind==="trap"?"陷阱（已發現）":o.kind==="oil"?"油":READOUT_OBJECTS[o.kind]}${at(o)}${o.kind==="chest"&&o.opened?"已打開":""}`).join("、"));
  const ground = Object.values(b.groundEffects||{}).filter(g=>READOUT_GROUND[g.kind] && (g.visualAt||0)<=Date.now());
  if(ground.length) L.push("地面效果：" + ground.map(g=>`${READOUT_GROUND[g.kind]}${at(g)}`).join("、"));
  return L.join("\n");
}
function updateAiReadout(){
  const el = document.getElementById("aiReadout"); if(!el) return;
  const t = battleReadoutText();
  if(el.textContent !== t) el.textContent = t;
}
