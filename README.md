# 毛絨絨小隊（軟呼呼酒館）

瀏覽器上的 TRPG 風格遊戲，手機優先。四隻小動物住在矮人大爺的酒館，出門冒險學東西回家：
🦊 玲玲（狐狸）、🐯 嬌嬌（白虎）、🐺 香香（灰狼）、🦝 默默（狸貓）。

- 線上版：https://dwarfossan.github.io/fuwafuwatavern/
- 直接進快速戰鬥：https://dwarfossan.github.io/fuwafuwatavern/#battle

---

## 接手的 AI 先看這裡

### 1. 檔案結構（2026-10-01 重新拆分）

純 JavaScript，沒有框架、**沒有建置步驟、沒有打包**。`index.html` 用 `<script src>` 依順序載入下面的檔案，**順序就是相依順序**（後面的檔案可以用前面定義的東西）。

```
index.html          只放外框和載入順序
phone.html          電腦等寬螢幕開 index.html 會自動轉來這裡，把遊戲裝在 390 寬的框裡（只做手機版，10-02）
css/style.css       全部樣式
data/               遊戲資料：六圍、角色、裝備、技能、名詞、敵人與 NPC、戰場、台詞、劇情、大地圖
js/state.js         遊戲狀態
js/rules.js         擲骰、調整值、裝備規則
js/art/             手寫 SVG 美術：小傢伙們、大地圖、裝備圖示、紙娃娃、怪物、劇情背景；portraits.js 是大爺、卡姆的新畫風立繪（無臉底圖＋表情）
js/sfx.js           音效／BGM（實體檔優先，未對應事件維持 Web Audio 合成）
js/pages/           封面、擲屬性、劇情、商店、大地圖、紙娃娃測試頁（網址加 #doll）
js/battle/          engine.js 規則與流程 → skills.js 技能實作 → flow.js 回合、移動、AI → render.js 戰場畫面
js/ui/cards.js      裝備卡、技能卡、彈出視窗
js/ui/status-card.js 共用狀態卡（劇情／城鎮／探索／戰鬥）
js/equipment.js     裝備唯一讀寫／切組／換裝入口
js/main.js          頁面切換、事件綁定、快速戰鬥
tests/              測試（見第 2 節）
tools/skills_doc.mjs  從 data/skills.js 產生 docs/技能表.md
```

- 新增 js 檔要加進 `index.html`，而且要放在用到它的檔案前面
- 每個檔案開頭的註解寫著那段在做什麼，用函式名稱或中文註解搜尋就找得到
- **只改要改的那個檔案。不要整份重新輸出大檔案**（容易被截斷、漏掉程式）

### 2. 改完一定要跑測試

```
npm i playwright              # 第一次才需要（雲端環境要裝 playwright@1.56.1；package.json 不要 commit）
node tests/smoke.mjs          # 冒煙：封面→擲屬性→序章→商店、大地圖→伏擊→戰鬥、快速戰鬥，加關鍵規則
node tests/layers.mjs         # 戰場分層：各層獨立更新、觸控點格、拖曳縮放、共用鏡頭
node tests/status-art.mjs    # 狀態身上演出、地面、解除、分層與手機提示
node tests/status-card-shared.mjs # 劇情／城鎮／探索／戰鬥共用同一狀態卡
node tests/equipment-art.mjs # 共用裝備外觀、哥布林裝備、敵我穿戴与手機卡
node tests/equipment-shared.mjs # 裝備唯一讀寫、切組、卸裝／收納與跨場景保存
node tests/critter-art.mjs    # 四隻SVG六表情、換裝相容、受傷／勝利與分層
node tests/impact-timing.mjs # 投射命中時序、地面／身上效果延遲與到期整層清除
node tests/sfx-routing.mjs   # 實體音效依實際傷害／治療、弓弩命中與守護防禦事件路由
node tests/bgm-routing.mjs   # BGM 場景 routing：日常、放屁段落、大地圖、戰鬥與勝利
node tests/layers-anim.mjs    # 攻擊者擲完骰會揮手（動作開始時場景層自己更新）
node tests/perception.mjs     # 被動感知、搜索、敵人狀態卡
node tests/ac.mjs             # 戰鬥中換裝 AC 跟著變
node tests/upgrades.mjs       # 升階效果（多傷害／多目標／多持續；範圍固定）、守護
node tests/shop.mjs           # 手機商店：分類、觸控滑頁、防誤買、買賣位置與固定導航
node tests/mobile-ui.mjs      # 手機介面：封面、說明／角色泡泡、戰場與教學、大地圖、裝備標籤
node tests/death-save.mjs     # 死亡豁免：1 算兩次、20 醒來、三次失敗傳送、四隻都送走才輸；重新挑戰三次、傳送回酒館
node tests/area-hidden.mjs    # 範圍招波及躲著的（先現身再結算）；指定目標的招挑不到躲著的
node tests/guard.mjs          # 阻截敵我同一套：走進架式範圍挨一下、移動不能取消；躲著走的不會被阻截
node tests/concentration.mjs  # 專注（同時一個、受傷豁免、倒下中斷）、狩印、點心、次元背包
node tests/sealed-goods.mjs # 封印付費／領取、十次保底、週自選與跨週保存
node tests/magic-shop.mjs   # 每日魔法現貨、保存、裝備效果與手機購買
node tests/town-supplier.mjs # 首次離店送貨、商人貨源暗示與一次性事件
node tests/rule-bubbles.mjs  # 四隻不同見解、規則變色、移入／觸控與原技能說明
node tests/passive-skills.mjs # 主／被動、總5主動3、暗視12格與手機勾選
node tests/notebook.mjs      # 狀態／休息共用筆記、四頭像、選取保存與抄寫演出
node tests/battle-entry.mjs # 測試入口兩個戰鬥各觸控5次、隨機場與固定商隊戰
node tests/quick-town.mjs # #town直達、屬性裝備與旅店、購物／首次離店事件
node tests/starter-gear.mjs
node tests/story-moods.mjs    # 逐句觸控：僅說話者換表情、合聲、旁白／抱抱保留與重畫一致
node tests/free-attacks.mjs
node tests/liliana-art.mjs
node tests/town-npc-art.mjs   # 正式開場贈裝、100金保留、兩套配置與雙匕首、彈藥、不重複發放
node tests/town.mjs          # 圖形城鎮四場所、店內購物、旅店休息與筆記
node tests/town-arrival.mjs  # 進城告別分支、商人離場、小隊成立、手機對話
node tests/xp.mjs            # 經驗：SRD 門檻、打怪平分、商隊完成達升級門檻、升級加血與熟練格、探索戰也給
node tests/level-up.mjs      # 手動升級：戰鬥鎖定、探索／城鎮／劇情點擊、資料同步、歡呼光暈到期移除
node tests/info-bars.mjs     # 狀態卡生命／經驗／壓力三條、頭像列壓力小條
node tests/about.mjs         # 關於／授權：封面與戰場主選單都打得開，SRD 5.1、5.2 官方原句完整
node tests/performance-lifecycle.mjs # 純 Node：肖像按需載入、鏡頭焦點與戰場計時器生命週期
node tests/performance-browser.mjs   # 390×844：封面零表情預載、離場停計時器、可見玩家不移鏡
node tests/town-image-assets.mjs     # 城鎮 NPC：四組 WebP 已接用，首次店主肖像下載量低於原 PNG 的 20%
node tests/caravan.mjs       # 商隊戰後：打贏→繼續→商人道謝→四選一檢定（不能跳過）→報酬只發一次→走到城鎮
node tests/stealth-mode.mjs # 切戰棋不開戰、安靜不增援、真實隱藏外觀與移動、主動攻擊及視野
node tests/explore-combat.mjs # 原地切戰棋、小隊增援、奇襲、重試、返回探索及休息
node tests/world-objects.mjs # 板條箱／寶箱、移入／長按氣泡、火藥桶負重與動作、九格友傷與連鎖
node tests/explore-objects.mjs # 探索物件：寶箱、門、推箱、陷阱、原層保留
node tests/explore-watch.mjs # 潛行自動顯示可見敵人範圍、移動保留、地板更新與遮擋
node tests/explore-continuous.mjs # 連續座標、碰撞、踏步、陷阱／地面中斷與開戰就近佔位
node tests/explore.mjs       # 探索同頁分層、單人移動／切角色、潛行、偵測與停下
node tests/random-map.mjs    # 種子重現、50 張地圖出生點連通、隨機入口與固定伏擊
node tests/enemy-traps.mjs # 少量敵人佈陷阱、花動作、發現拆除、觸發停止與快照
node tests/damage-types.mjs # 力場／光耀原名、傷害與抗性隔離、手機紀錄
node tests/hidden-ground.mjs # 隱藏油感知、範圍與遮擋、敵人獨立知識、手機搜索
node tests/poison.mjs       # 中毒傷害、體質解毒、毒沼來源、秒／回合、手機狀態卡
node tests/ground-saves.mjs # 地面進入與解除豁免、持續失敗、來源隔離、手機麻痺／恢復
node tests/ground.mjs       # 地面反應、冰面、蒸氣、已知危險、秒／輪計時與手機施法
node tests/elements.mjs     # 冷電法器、戲法傷害與到期、手機瞄準施放
node tests/unit-scores.mjs # 敵我完整六圍、13門檻、怪物被動資料與手機狀態卡
node tests/casting-rules.mjs # 最高施法屬性、法器13門檻、裝備戲法抄寫與手機施放
node tests/components.mjs   # 聲勢材、空手、標價材料、禁止施法與手機提示
node tests/focus-instance.mjs # 法器逐件固定隨機屬性、現貨、裝備卡與重試
node tests/resistance.mjs    # 抗性／傷害免疫、取整、原始類型、面板、專注、資料覆寫
node tests/gear.mjs          # 套組視同帶著內容物、能放背包欄；彈袋（投石索、吹箭筒、火槍、手槍）；商店照賣單項
```

全部通過才可以推；看 exit code（0＝通過）。
測試只能證明「沒壞」，不代表新功能正常：新功能要另外在瀏覽器實際操作、截圖確認，並把能自動檢查的部分補進測試。
改了 `data/skills.js` 要跑 `node tools/skills_doc.mjs` 重新產生技能表。

### 3. 分支規則

- **只有 main 和 dev 兩條，不開工作分支**（大爺 10-02：dev 就是測試版，不要「測試版的測試版」）。所有 AI 直接推 dev（與 `AGENTS.md` 一致）
- 每做完一項就 commit＋push 到 dev，訊息寫清楚改了什麼
- 推之前測試要全過：dev 是大爺手機上測的版本，不能推壞掉的東西
- main 是正式網站的穩定版；合併 main 需要大爺明確指示，大爺測過 dev 不代表授權併 main

### 4. 給大爺測試

- **大爺測試一律開測試入口**：https://dwarfossan.github.io/fuwafuwatavern/test.html （大爺存成書籤）。打開時即時問 GitHub dev 最新是哪一筆，按「測試戰鬥」、「營救商隊」、「直達城鎮」或「從頭玩」跳到那一筆的指定版本網址（`raw.githack.com/.../<40 碼 commit>/index.html`）。推完跟大爺說「推好了」和 commit 前 7 碼就好，不用再貼網址
  - 入口頁是 main 上的 `test.html`，遊戲不讀它；改它要動 main，先問大爺
  - **不要給 `/dev/` 的網址**：githack 會記住「dev 指向哪一筆」，不知道多久才更新，大爺會看到舊版（10-02 發生兩次，以為程式被改回去）
- **合併進 main 之後**才用正式網站 https://dwarfossan.github.io/fuwafuwatavern/ （加 `#battle` 直接進快速戰鬥，推上 main 後一兩分鐘更新）
- **不要再傳下載用的單一檔案給大爺**，GitHub 才是唯一的版本
- **紙娃娃一律朝左**：戰場、狀態卡、紙娃娃測試頁，還有給大爺看的參考圖（2026-10-01、10-02 大爺）。紙娃娃的原圖是朝右畫的：戰場、測試頁、參考圖與狀態卡都直接傳 `face:-1`；10-04 起狀態卡不再用 CSS 整張鏡像補償，避免翻兩次

### 5. 實作紀律（大爺確認，所有 AI 都要遵守）

1. **大爺指定改哪一層，就改那一層。** 圖層、資料結構、規則、架構的要求，要真的改那一層，不能用外層 transform、逐物件補丁、反向補償冒充完成
2. **先提、再改。** 有更好的做法，先說理由，等大爺點頭。設計還沒定的地方先問，不要自己決定
3. **不要偷塞自己的東西。** 只改被要求的部分。自己寫的台詞、暫定的外觀，要標明是草稿／暫定
4. **大爺說的跟程式不一樣時，直接指出來**，不要默默照其中一邊改
5. **先複述理解，再動手**
6. **測試要如實描述。** 語法檢查（`node --check`）只代表能解析，不代表功能正常。有在瀏覽器實際跑過、截圖看過，才能說測過；沒測的就說沒測
7. **原本就有的問題：講出來，但不擅自修**
8. **不要把 workaround 疊成技術債。** 方向錯了就回到正確結構重做
9. **被要求判斷時給明確立場**，不要兩邊都講

10. **新系統若會讓畫面即時動，先定圖層。** 地板、標示、物件＋角色、介面要有獨立更新入口，不能每一步整頁重畫。
11. **戰鬥畫面讀了新的資料，要加進 `battleLayerKeys`**（`js/battle/render.js`）。戰鬥畫面靠比對這份清單決定哪一層要重畫；畫面讀了清單以外的資料（例如 `state.xxx` 的全域值），那層就不會更新，會卡在舊畫面
12. **驗收看結果，也看做法。** 畫面看起來對，但做法不是大爺要的（例如要求圖層，結果是逐物件補丁），就不算完成
13. **尊重前面的人留下的工程。** 接手是延續和維護，不是為了省時間用表面補丁破壞以後的可維護性

**鏡像實驗的教訓**：曾經用「整層鏡像再把字翻回來」和「每個物件原地翻面」想把畫面左右翻轉，都不對，已撤銷。
10-01 改「由右到左」的正確做法是**改資料**：大地圖地點 x 改成 1000−x；斜角戰場畫面左右相反＝格子 x、y 對調；開場朝向對調。沒有翻轉任何東西。

### 6. 其他規則

- 借用 SRD 的數值，每加一批就對照 SRD 5.2 核對一次
- **以手機為主**（大爺 2026-10-01）：畫面先照手機（寬 390、高 844）排好，電腦沿用同一套；只有真的放不下才另外寫電腦版的規則。改畫面一定要用手機尺寸截圖確認

- 玩家看得到的文字用**繁體中文**；頭上彈字用英文（MISS、CRITICAL! 等，在 `POP_TEXT`）
- 規則以 SRD 5.2 為底，會為了好玩改。遊戲裡不出現 D&D 的名稱或商標；從 D&D 借新東西前先看 `docs/授權與安全.md`
- 大爺的個人設定（自畫像等）不是遊戲內容，沒說要做就不要放進遊戲

---

## 文件

repo 的 `docs/` 是正本；claude.ai 專案裡放一模一樣的副本，改了要同步，不在專案裡另外改。

| 檔案 | 內容 |
|---|---|
| `AGENTS.md` | 給 GPT 等接手的 AI：先讀什麼、推到哪、怎麼跟大爺溝通、做完要更新什麼（Codex 會自動讀） |
| `docs/現況.md` | **先看這份**：做到哪、各系統、大爺的偏好、排隊中的、已知問題、環境 |
| `docs/熟練格規格.md` | 技能資源（熟練格、升階、休息） |
| `docs/小筆記規格.md` | 觀察學習、小筆記、小傢伙們特性 |
| `docs/狀態規格.md` | 17 個掛頭圖示狀態與其他狀態規則 |
| `docs/裝備與感知規格.md` | 被動感知、搜索、狀態卡、裝備三層與錨點、破布衣、+1 薩滿袍、AC |
| `docs/授權與安全.md` | 借了 SRD 的什麼、不能碰的（D&D 名稱、商標、SRD 以外的內容）、類似遊戲的案例、出處標示怎麼放 |
| `docs/技能表.md` | 每類武器的招式（`tools/skills_doc.mjs` 產生，不要手改） |
| `assets/` | 美術素材。遊戲用到：封面 `portraits/party_heads.webp`、送別出發段 `portraits/party.webp`、酒館劇情和商店小頭像的大爺／卡姆（無臉底圖＋`faces/dwarf`、`faces/kam`）、商隊戰後的商人 `portraits/merchant.webp`、小傢伙們的頭（劇情卡片、擲屬性、商店、角色介紹；戰場和大地圖還是 SVG）；哥布林插圖還沒用。`portraits/` 立繪（小傢伙們合照、小傢伙們合照頭像、大爺、卡姆、商人；大爺和卡姆各有一張無臉底圖 `*_noface`）、`faces/` 表情（小傢伙們的頭像 210×210；大爺、卡姆各 8 張臉，疊在無臉底圖上用；**檔名一律英文**，中英對照見 `assets/faces/README.md`）、`scenes/` 插圖（哥布林）；舊的：嬌嬌 Live2D 分層、大爺頭像、怪物圖。大爺 10-02 給的圖，已去背、縮成手機用、轉 webp；原圖不在 repo |


---

## 授權與出處

本作品包含取自 Wizards of the Coast LLC 的 System Reference Document 5.2（「SRD 5.2」）的內容，來源：https://www.dndbeyond.com/srd 。SRD 5.2 以 Creative Commons Attribution 4.0 International License 授權：https://creativecommons.org/licenses/by/4.0/legalcode 。

本作品包含取自 Wizards of the Coast LLC 的 System Reference Document 5.1（「SRD 5.1」）的內容，來源：https://dnd.wizards.com/resources/systems-reference-document 。SRD 5.1 以 Creative Commons Attribution 4.0 International License 授權：https://creativecommons.org/licenses/by/4.0/legalcode 。

目前借用的部分：屬性值與調整值算法、4d6 取高三、武器與護甲的數值（傷害、屬性、價格、重量、AC、力量需求）、武器專精名稱、部分道具與怪物數值、攀爬與跌落規則；專注規則、獵人印記（本作叫狩印）、次元背包、套組內容、彈袋、火槍與手槍（10-03）；奇襲個別判定（SRD 5.1，探索模式做好後生效）。
角色、世界觀、地圖、劇情、美術皆為本專案原創。
