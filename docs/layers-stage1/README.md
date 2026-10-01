# 戰場分層第一段交接（2026-10-01）

基準：dev `0cb2c9f90a80b8f4f3ea7cbe6cc2d4f03a187a54`，與大爺提供的 ZIP 一致。只提交 layers，不合併 dev／main。第一段到此停下，第二、三段要等大爺比對額度後決定。

程式 commit：`288eb32b1e167d89c27a59231d806c185c4e1021`（戰場分層第一段：獨立地板與標示，保留斜角遮擋及共用鏡頭）。之後一筆提交本報告、截圖、原始量測與驗收腳本的字型等待。

## 結構與更新入口

| 層 | DOM／更新函式 | 完成情況 |
|---|---|---|
| 地板 | `#board-floor`／`updateBoardFloor()`，js/battle/render.js | 格子、道路、台地與山壁。開戰產生；戰鬥中依地形 key 改變才重建內容 |
| 標示 | `#board-marks`／`updateBoardMarks()`，js/battle/render.js | SVG paint server 定義藍／紅填色，射程、當回合發光、目標提示。只替換此層內容 |
| 物件＋角色 | `#board-scene`／`updateBoardScene()`，js/battle/render.js | 第一段必要的更新入口；每次 render 仍整層重畫。角色走動只更新此層的呼叫分流尚未做 |
| 介面 | `[data-battle-ui]` 五個槽／`battleInterfaceHTML()`、`updateBattleFrame()`，js/battle/render.js | 第一段必要的外框拆分。每次 render 仍更新五槽並重綁事件；第三段才按介面狀態分流 |

標示填色引用原有地板 polygon，沒有逐物件 patch、HTML diff、延遲或節流。台地幾何定義在地板層，以原生 SVG use 在場景中按照原有深度合成。台地頂面可點、山壁不當成頂面；輪廓遮擋判定沿用原本的高度 box。三個戰場層在同一個 SVG 裡，因此 applyCam 平移／縮放共用。爆擊 class 與鏡頭原點可在同一個 SVG 切換並解除。

js/main.js 的 render 在已有戰場外框時直接呼叫 updateBattleFrame，保留 #app、section、board-wrap、SVG 和地板節點。切到其他頁或首次進戰鬥才建立完整頁面。modal 是獨立節點，每次更新移除旧 modal 再產生新 modal，沒有重複疊加。

engine.js、skills.js、data/、flow.js 的規則及行動流程均未改。README 補上交接要求的「新系統若會讓畫面即時動，先定圖層」。

## 驗證

- node --check：修改的 JS 與新增兩份測試脚本通過。
- 改前 node tests/smoke.mjs：60 通過，0 失敗，exit 0。
- 改後 node tests/smoke.mjs：60 通過，0 失敗，exit 0。
- node tests/layers.mjs：16 項通過，包括獨立層 DOM 保留、地形改變重建、平地／台地的原生觸控點格、拖曳、雙指縮放、共用鏡頭、爆擊鏡頭解除、modal、重開及離開戰鬥。
- 沒有瀏覽器 pageerror。沒有真實手機手感測試；大爺仍需在手機確認。
- 原有两份指定文件「給GPT_寫程式的基本邏輯.md」「給GPT_網址與複製檔案.md」不在 ZIP、dev tree、docs 中；名稱搜尋亦未找到。依 PDF 的凍結回合／原生觸控提醒、README、晚上交接及實際原始碼施工，沒有假稱讀過。

## 390×844 截圖

兩邊固定相同随机種子、時間與戰鬥狀態，凍結 AI 及動畫。為讓雲端環境顯示繁體字，驗收瀏覽器注入相同的本機 Noto Sans TC；這不進遊戲樣式。每個狀態均保存 before／after，沒有只靠煙測宣稱畫面一致。

| 狀態 | 改前 | 改後 | 不同像素 | 最大 RGB 通道差（0–255） |
|---|---|---|---:|---:|
| 一般戰場 | [圖](baseline-battle.png) | [圖](fuwafuwatavern-battle.png) | 0 | 0 |
| 選移動藍格 | [圖](baseline-move.png) | [圖](fuwafuwatavern-move.png) | 22103 | 2 |
| 香香弓攻擊紅格 | [圖](baseline-attack.png) | [圖](fuwafuwatavern-attack.png) | 386 | 2 |
| 狀態卡 | [圖](baseline-status.png) | [圖](fuwafuwatavern-status.png) | 0 | 0 |
| 骰子面板 | [圖](baseline-dice.png) | [圖](fuwafuwatavern-dice.png) | 0 | 0 |
| 台地藍格及遮擋 | [圖](baseline-cliff.png) | [圖](fuwafuwatavern-cliff.png) | 11113 | 3 |

一般戰場、狀態卡、骰子面板逐像素相同。藍／紅格與台地有 2–3/255 的透明填色捨入差異，視覺檢查沒有布局或幾何差異；不能說六張都逐像素一樣。分離的 paint server 不疊第二片半透明地板，保留原始單一格子描邊。沒有改遊戲的顏色設定來掩蓋差異。

## CPU 4× 效能

Chromium 153.0.8010.0／Playwright 1.62.1，CDP Emulation.setCPUThrottlingRate rate 4。使用相同台地角色位置、移動標示狀態；各入口暖身 5 次，量測 30 次，下面是最後一批的中位數與 p95。原始樣本在 results.json，像素數據在 pixel-comparison.json。時間量的是函式同步執行，未另計完成 GPU paint 的耗時，也不是手機實機 FPS。

| 更新入口 | 中位數 ms | p95 ms | #app 後代節點 |
| 改前整頁 render() | 125.8 | 177.8 | 1711 |
| 改後 render()（標示＋物件＋全部介面） | 152.8 | 411.5 | 2232 |
| 改後只 updateBoardMarks() | 3.9 | 11.4 | 2232 |

**這一段不能宣稱完整更新變快。** 本批完整更新變慢；其他批次也有波動。標示入口已能獨立更新且快很多，但 render 的物件與介面還未分流，場景也增加原生 SVG 引用節點。第二、三段要再量真正角色走一格的端到端成本。本段沒有把「只更新標示」說成「角色走一格已只更新角色」。DOM 節點數是頁面總數，不是本次重建數。

重跑：npm 提供 playwright 與對應 Chromium，執行 `node tests/layers.mjs`；改前原始碼另放一份，執行 `node tests/layers-compare.mjs /改前repo /輸出目錄 [本機Noto-Sans-TC-400.css]`。字型參數可省略，但無 CJK 字型的環境會顯示缺字。原有 smoke 檔未改。

## 還沒完成與原有問題

- 第二段：移動／血量／狀態變更只更新物件＋角色的分流。
- 第三段：只更新改變的介面槽；進一步拆 bindBattle 及 flow/cards/engine 等 broad render 呼叫。
- 戰鬥內的 broad render 已不會替換整個 #app，但仍會更新標示、完整物件＋角色、全部五個介面槽。首次進戰鬥、回標題及其他頁切換保留完整頁面重建。
- 原有射程紅框被台地蓋住的順序保留，沒有擅自調到最上面；晚上交接提到的狀態卡裝備圖示蓋字、沒進商店直接開戰的問題也未修。
- 本段沒有新增探索模式、台詞、技能或規則。

以下列出第二／三段仍要分類的 broad render 呼叫（行號是本段版本）：

### js/battle/flow.js（44 行，單行可能有多次呼叫）

- `14`：if(u.dead || u.down){ render(); setTimeout(()=>{ if(!checkResult()) nextTurn(); }, 900); return; }
- `16`：if(B().skipTurn){ B().busy = true; render(); setTimeout(()=>{ B().busy = false; if(!checkResult() && cur()===u) endTurn(); }, 1100); return; }
- `18`：render();
- `69`：if(!alive("foe").length){ b.result = "win"; blog("勝利！哥布林全被打倒了！", "kill"); sfx("win", 900); render(); return true; }
- `70`：if(!alive("pc").length){ b.result = "lose"; blog("四隻都倒下了……", "kill"); sfx("lose", 900); render(); return true; }
- `119`：render();
- `132`：render();
- `183`：if(u.down || u.dead || b.result){ render(); return; }
- `186`：render();
- `193`：if(ok){ b.menu = "root"; render(); return; }
- `198`：render();
- `207`：if(sk && fromTwoHanded(u, sk) && inGrapple(u)){ blog(`${sk.def.name}：擒抱中不能用雙手武器`); render(); return; }
- `209`：if(sk.impl.can && !sk.impl.can(u)){ blog(`${sk.def.name}：${sk.impl.why}`); render(); return; }
- `215`：render();
- `223`：b.tier = t; b.up = n; b.tierOpen = false; sfx("pop"); render();   // 選好就收起來
- `226`：function aimTierToggle(){ const b = B(); if(!b.mode || b.busy) return; b.tierOpen = !b.tierOpen; sfx("pop"); render(); }
- `235`：b.mode = null; b.up = 0; b.tier = 0; b.tierOpen = false; sfx("back"); render(); }
- `256`：if(b.mode.key==="help"){ const a = helpTarget(u, x, y); if(a) doHelp(u, a); else { b.mode = null; b.menu = "act"; render(); } return; }
- `258`：if(it && a && itemTargets(u, it).includes(a)) useItem(u, it, a); else { b.mode = null; b.menu = "items"; render(); } return; }
- `260`：if(a && g.targets(u).includes(a)) doGenAct(u, b.mode.key, a); else { b.mode = null; b.menu = "act"; render(); } return; }
- `265`：if(b.mode.darts.length >= sk.impl.darts()) doSkill(u, sk, b.mode.darts); else render();
- `270`：else { b.mode = null; b.up = 0; b.tier = 0; b.menu = "act"; render(); }
- `274`：if(t){ b.info = b.info===t.id ? null : t.id; sfx(b.info ? "pop" : "back"); render(); return; }
- `276`：if((b.menu && b.menu!=="root") || b.info || b.moveMode){ b.menu = null; b.info = null; b.moveMode = false; render(); }
- `419`：syncLearnedState(); b.restDone=true; blog(kind==="short"?`短休完成（今天 ${state.shortRestsUsed}/2）`:`長休完成，熟練格全部恢復。`,"skill"); render(); return true;
- `459`：render();
- `480`：if(key==="disarm"){ tryDisarm(u, t); b.impact = 0; panelEnd(); if(checkResult()) return; if(u.side==="pc") afterShow(u, 1300 + DICE_LEAD); else render(); return; }
- `489`：if(u.side==="pc") afterShow(u, 1100 + DICE_LEAD); else render();
- `498`：if(u.side==="pc") afterShow(u, 700); else render();
- `547`：if(!k || it.ammoFor!==k){ blog(`${it.n}不能用在目前的武器上`); render(); return; }
- `548`：spendFree(u); u.loadedAmmo=it; blog(`${u.name}切換成${it.n}，下一次射擊會使用它`, "skill"); sfx("pop"); render(); return;
- `581`：if(u.side==="pc") afterShow(u, Math.max(900, (b.impactEnd||0) - Date.now() + 500)); else render();
- `593`：render();
- `600`：if(u.side==="pc") afterShow(u, 600); else render();
- `608`：if(u.side==="pc") afterShow(u, 700); else render();
- `655`：else render();
- `660`：b.busy = true; b.menu = null; render();
- `665`：render();
- `761`：if(!canAct()){ render(); setTimeout(endTurn, 500); return; }        // 主動作拿去補血了：這回合就這樣
- `798`：render(); setTimeout(endTurn, wait); });
- `827`：render();
- `837`：if(e.dead || e.down || b.result){ render(); if(!b.result) setTimeout(endTurn, settle(700)); return; }
- `844`：render(); setTimeout(endTurn, wait);
- `878`：tryHide(e); render(); setTimeout(endTurn, 1000); return;

### js/battle/render.js（23 行，單行可能有多次呼叫）

- `340`：window.addEventListener("resize", ()=>{ if(B() && document.querySelector(".board-wrap")){ render(); } });
- `966`：// 否則像背包圖示的 click 會在 pointerup 時被 render() 吃掉，導致背包無法打開。
- `970`：if(equipItemAt(u,d.from,to)){ b.info=u.id; render(); }
- `1220`：document.querySelectorAll("[data-item]").forEach(el=>el.addEventListener("click", ()=>{ sfx("pop"); const b = B(); b.menu = null; b.mode = {key:"item", item:el.dataset.item}; render(); }));
- `1223`：document.querySelectorAll("[data-sltoggle]").forEach(el=>el.addEventListener("click", ()=>{ slotLightsOpen = !slotLightsOpen; sfx("pop"); render(); }));
- `1228`：document.getElementById("sndToggle")?.addEventListener("click", (e)=>{ e.stopPropagation(); b.sysPop=b.sysPop==="volume"?null:"volume"; render(); });
- `1229`：document.getElementById("gearToggle")?.addEventListener("click", (e)=>{ e.stopPropagation(); b.sysPop=b.sysPop==="menu"?null:"menu"; render(); });
- `1230`：document.getElementById("volMute")?.addEventListener("click", (e)=>{ e.stopPropagation(); SFX.toggleMuted(); if(!SFX.isMuted()) sfx("pop"); render(); });
- `1232`：document.querySelectorAll("[data-sys]").forEach(el=>el.addEventListener("click",()=>{ const a=el.dataset.sys; b.sysPop=null; if(a==="continue"){render();return;} if(a==="party"){const p=b.units.find(x=>x.side==="pc"); if(p){b.info=p.id;b.infoPage="status";} render();return;} if(a==="title"){state.page="cover";render();window.scrollTo(0,0);} }));
- `1233`：document.querySelector("[data-closeinfo]")?.addEventListener("click", ()=>{ B().info = null; render(); });
- `1234`：document.querySelectorAll("[data-infopage]").forEach(el=>el.addEventListener("click", ()=>{ B().infoPage=el.dataset.infopage; sfx("pop"); render(); }));
- `1235`：document.querySelector("[data-bagtoggle]")?.addEventListener("click", e=>{ e.stopPropagation(); const b=B(); b.gearBagOpen=!b.gearBagOpen; sfx("pop"); render(); });
- `1236`：document.querySelector("[data-switchset]")?.addEventListener("click", e=>{ e.stopPropagation(); const b=B(),u=b.units.find(x=>x.id===b.info); if(u){switchWeaponSet(u,2); syncBattleBag(u); sfx("pop"); render();} });
- `1237`：document.querySelectorAll("[data-statustip]").forEach(el=>el.addEventListener("click", ()=>{ const b=B(),k=el.dataset.statustip; b.statusTip=b.statusTip===k?null:k; sfx("pop"); render(); }));
- `1238`：document.querySelectorAll("[data-notepage]").forEach(el=>el.addEventListener("click", ()=>{ const [id,p]=el.dataset.notepage.split(":"); const b=B(); b.notePages=b.notePages||{}; b.notePages[id]=Math.max(1,+p||1); sfx("pop"); render(); }));
- `1245`：sfx("pop"); render();
- `1248`：document.querySelectorAll("[data-teach]").forEach(el=>el.addEventListener("click",()=>{ const [id,key]=el.dataset.teach.split(":"); const u=B().units.find(x=>x.id===id); if(u){learnFromLingling(u,key);render();} }));
- `1249`：document.querySelectorAll("[data-erase]").forEach(el=>el.addEventListener("click",()=>{ const [id,key]=el.dataset.erase.split(":"); const u=B().units.find(x=>x.id===id); if(u&&eraseNote(u,key)){syncLearnedState();render();} }));
- `1255`：document.getElementById("logOpen")?.addEventListener("click", ()=>{ const b = B(); b.logLv = ((b.logLv||0) + 1) % 3; if(b.logLv===2) b.logStick = true; sfx("pop"); render(); });
- `1256`：document.getElementById("logPanel")?.addEventListener("click", ()=>{ B().logLv = 0; sfx("back"); render(); });
- `1258`：document.getElementById("dicePanel")?.addEventListener("click", ()=>{ B().panelHidden = true; sfx("back"); render(); });   // 點一下收起來（想看回合順序時）
- `1264`：document.getElementById("tutNext")?.addEventListener("click", ()=>{ B().tut++; render(); });
- `1266`：document.getElementById("tutClose")?.addEventListener("click", ()=>{ B().tut = TUTORIAL.length; render(); });

### js/ui/cards.js（11 行，單行可能有多次呼叫）

- `109`：document.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", e=>{ if(e.target===el){ state.modal=null; render(); } }));
- `110`：document.querySelectorAll("[data-iteminfo]").forEach(el=>el.addEventListener("click", e=>{ if(!el.dataset.iteminfo)return; e.stopPropagation(); state.modal={kind:"item", id:el.dataset.iteminfo}; render(); }));
- `115`：render();
- `118`：document.addEventListener("keydown", e=>{ if(e.key==="Escape" && state.modal){ state.modal=null; render(); } });
- `128`：sfx("back"); render(); return true;
- `132`：if(b.sysPop){ b.sysPop=null; sfx("back"); render(); return true; }
- `133`：if(b.gearBagOpen){ b.gearBagOpen=false; sfx("back"); render(); return true; }
- `134`：if(b.info){ b.info=null; sfx("back"); render(); return true; }
- `137`：if(b.moveMode){ b.moveMode=false; b.menu="move"; sfx("back"); render(); return true; }
- `140`：sfx("back"); render(); return true;
- `145`：if(state.info){ state.info=null; sfx("back"); render(); return true; }

### js/battle/engine.js（2 行，單行可能有多次呼叫）

- `547`：setTimeout(()=>{ if(B()===b) render(); }, delay + 20);
- `560`：render();

