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
js/art/             手寫 SVG 美術：四小隻、大爺、大地圖、裝備圖示、紙娃娃、怪物、劇情背景
js/sfx.js           音效（Web Audio 當場合成）
js/pages/           封面、擲屬性、劇情、商店、大地圖、紙娃娃測試頁（網址加 #doll）
js/battle/          engine.js 規則與流程 → skills.js 技能實作 → flow.js 回合、移動、AI → render.js 戰場畫面
js/ui/cards.js      裝備卡、技能卡、彈出視窗
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
node tests/layers-anim.mjs    # 攻擊者擲完骰會揮手（動作開始時場景層自己更新）
node tests/perception.mjs     # 被動感知、搜索、敵人狀態卡
node tests/ac.mjs             # 戰鬥中換裝 AC 跟著變
node tests/upgrades.mjs       # 升階效果（多傷害／多目標／多持續；範圍固定）、守護
node tests/shop.mjs           # 手機商店：分類、觸控滑頁、防誤買、買賣位置與固定導航
node tests/mobile-ui.mjs      # 手機介面：封面、說明／角色泡泡、戰場與教學、大地圖、裝備標籤
node tests/death-save.mjs     # 死亡豁免：1 算兩次、20 醒來、三次失敗傳送、四隻都送走才輸；重新挑戰三次、傳送回酒館
node tests/area-hidden.mjs    # 範圍招波及躲著的（先現身再結算）；指定目標的招挑不到躲著的
node tests/guard.mjs          # 阻截敵我同一套：走進架式範圍挨一下、移動不能取消；躲著走的不會被阻截
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

- **大爺測試一律開測試入口**：https://dwarfossan.github.io/fuwafuwatavern/test.html （大爺存成書籤）。打開時即時問 GitHub dev 最新是哪一筆，按「快速戰鬥」或「從頭玩」跳到那一筆的指定版本網址（`raw.githack.com/.../<40 碼 commit>/index.html`）。推完跟大爺說「推好了」和 commit 前 7 碼就好，不用再貼網址
  - 入口頁是 main 上的 `test.html`，遊戲不讀它；改它要動 main，先問大爺
  - **不要給 `/dev/` 的網址**：githack 會記住「dev 指向哪一筆」，不知道多久才更新，大爺會看到舊版（10-02 發生兩次，以為程式被改回去）
- **合併進 main 之後**才用正式網站 https://dwarfossan.github.io/fuwafuwatavern/ （加 `#battle` 直接進快速戰鬥，推上 main 後一兩分鐘更新）
- **不要再傳下載用的單一檔案給大爺**，GitHub 才是唯一的版本
- **紙娃娃一律朝左**：戰場、狀態卡、紙娃娃測試頁，還有給大爺看的參考圖（2026-10-01、10-02 大爺）。紙娃娃的原圖是朝右畫的：戰場、測試頁、參考圖傳 `face:-1`；狀態卡是 CSS 把整張翻過來（`.status-paper .inf-doll>svg`），那裡要傳 `face:1`，不要翻兩次

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
| `docs/小筆記規格.md` | 觀察學習、小筆記、四小隻特性 |
| `docs/狀態規格.md` | 15 個狀態 |
| `docs/裝備與感知規格.md` | 被動感知、搜索、狀態卡、裝備三層與錨點、破布衣、+1 薩滿袍、AC |
| `docs/授權與安全.md` | 借了 SRD 的什麼、不能碰的（D&D 名稱、商標、SRD 以外的內容）、類似遊戲的案例、出處標示怎麼放 |
| `docs/技能表.md` | 每類武器的招式（`tools/skills_doc.mjs` 產生，不要手改） |
| `assets/` | 美術素材（嬌嬌 Live2D 分層、大爺頭像、怪物圖），遊戲目前沒有用到 |


---

## 授權與出處

本作品包含取自 Wizards of the Coast LLC 的 System Reference Document 5.2（「SRD 5.2」）的內容，來源：https://www.dndbeyond.com/srd 。SRD 5.2 以 Creative Commons Attribution 4.0 International License 授權：https://creativecommons.org/licenses/by/4.0/legalcode 。

本作品包含取自 Wizards of the Coast LLC 的 System Reference Document 5.1（「SRD 5.1」）的內容，來源：https://dnd.wizards.com/resources/systems-reference-document 。SRD 5.1 以 Creative Commons Attribution 4.0 International License 授權：https://creativecommons.org/licenses/by/4.0/legalcode 。

目前借用的部分：屬性值與調整值算法、4d6 取高三、武器與護甲的數值（傷害、屬性、價格、重量、AC、力量需求）、武器專精名稱、部分道具與怪物數值、攀爬與跌落規則；奇襲個別判定（SRD 5.1，探索模式做好後生效）。
角色、世界觀、地圖、劇情、美術皆為本專案原創。
