# 測試清單

按本次改動挑相關的跑；規定（範圍、推送、失敗停止）只看根目錄 `README.md` 第 2 節。


```
npm i playwright              # 第一次才需要（雲端環境要裝 playwright@1.56.1；package.json 不要 commit）
node tests/smoke.mjs          # 冒煙：封面→擲屬性→序章→商店、大地圖→伏擊→戰鬥、快速戰鬥，加關鍵規則
node tests/layers.mjs         # 戰場分層：各層獨立更新、觸控點格、拖曳縮放、共用鏡頭
node tests/status-rows.mjs   # 共用排版比例、正負上下排、不顯示倒數、即時演出優先、卡片橫捲與390×844截圖
node tests/status-icons.mjs  # 20種共用圖示、藍紅底、燃燒說明、期限保留／解除與390×844截圖
node tests/status-art.mjs    # 狀態身上演出、地面、解除、分層與手機提示
node tests/status-card-shared.mjs # 劇情／城鎮／探索／戰鬥共用同一狀態卡
node tests/equipment-art.mjs # 共用裝備外觀、哥布林裝備、敵我穿戴与手機卡
node tests/round-shield.mjs # 普通盾牌無附帶技能、圓木盾購買與共用手持外觀
node tests/weapon-art-shared.mjs # 37普通武器一物一圖、魔法base、共用各介面／手持／掉落／投擲
node tests/orc-art.mjs       # 歐克外觀、現有裝備／護甲、共用動作與390×844測試截圖
node tests/forest-monster-art.mjs # 野豬、森林狼、食人草外觀／基本動作、共用戰場與狀態卡
node tests/new-monster-looks.mjs # 10-09 五種新外觀（獸人薩滿／英雄／酋長、哥布林英雄／酋長）與成年龍倒下趴姿
node tests/dragon-captain-art.mjs # 獨眼隊長、小龍、吐息到達時序／地面接續與手機截圖
DRAGON_LOOK=dragon_adult MONSTER_SHOTS=/tmp/adult-review node tests/dragon-captain-art.mjs # 同一套驗成年龍、成年／幼龍對照
node tests/equipment-shared.mjs # 裝備唯一讀寫、切組、卸裝／收納與跨場景保存
node tests/critter-art.mjs    # 四隻SVG六表情、換裝相容、受傷／勝利與分層
node tests/impact-timing.mjs # 投射命中時序、地面／身上效果延遲與到期整層清除
node tests/sfx-routing.mjs   # 實體音效依實際傷害／治療、弓弩命中與守護防禦事件路由
node tests/bgm-routing.mjs   # BGM 場景 routing：日常、放屁段落、大地圖、戰鬥與勝利
node tests/system-volume.mjs  # 共用喇叭：第一次玩預設 70%、靜音字樣、拖滑桿三處同步；劇情／戰鬥同一套；酒館牆 CSS
node tests/save-load.mjs     # 存讀檔：自動＋手動 3 格、安全的地方才能存、讀回、匯出入、首頁繼續冒險、回到標題開新局
node tests/layers-anim.mjs    # 攻擊者擲完骰會揮手（動作開始時場景層自己更新）
node tests/perception.mjs     # 被動感知、搜索、敵人狀態卡
node tests/ac.mjs             # 戰鬥中換裝 AC 跟著變
node tests/upgrades.mjs       # 升階效果（多傷害／多目標／多持續；範圍固定）、守護（守護另見 guard.mjs）
node tests/shop.mjs           # 手機商店：分類、觸控滑頁、防誤買、買賣位置與固定導航
node tests/mobile-ui.mjs      # 手機介面：封面、說明／角色泡泡、戰場與教學、大地圖、裝備標籤
node tests/unconscious.mjs    # 昏迷（10-09 取代死亡豁免）：歸零昏迷、輪不到、協助／治療才醒、戰後醒 1 血、四隻昏迷才輸；重新挑戰三次；選回酒館才出現卡姆傳送詛咒
node tests/area-hidden.mjs    # 範圍招波及躲著的（先現身再結算）；指定目標的招挑不到躲著的
node tests/concentration.mjs  # 專注（同時一個、受傷豁免、倒下中斷）、狩印、點心、次元背包
node tests/sealed-goods.mjs # 封印付費／領取、十次保底、週自選與跨週保存
node tests/magic-shop.mjs   # 每日魔法現貨、保存、裝備效果與手機購買
node tests/town-supplier.mjs # 首次離店送貨、商人貨源暗示與一次性事件
node tests/rule-bubbles.mjs  # 四隻不同見解、規則變色、移入／觸控與原技能說明
node tests/passive-skills.mjs # 主／被動、總5主動3、暗視12格與手機勾選
node tests/style-groups.mjs   # 風格：同類上限、混搭、上限加成、「戰士風格：反擊」名稱、被擋原因、敵我同一套
node tests/double-strike.mjs  # 戰士風格：連擊：主要動作普攻兩下不打折；沒帶／招式／裝填／打倒後不觸發；敵我一致
node tests/guard.mjs         # 戰士風格：守護：拿盾、1 格內隊友每輪第一次被攻擊劣勢；不保護自己；敵我一致
node tests/weapon-mastery.mjs # 戰士風格：武器精通：帶了才觸發專精；普攻與招式都觸發；敵我一致
node tests/rogue-style.mjs     # 俠盜風格：偷襲（隊友牽制、等級骰數、每回合一次）、狡詐（免費動作）、瞄準（放棄移動、第一次攻擊優勢）；敵我一致
node tests/mage-style.mjs      # 法師風格：法師護甲被動（13＋敏捷、可拿盾）、強化（戲法加施法屬性）、博學（被動智力 +5）
node tests/luck.mjs            # 好運：沒中／豁免失敗暫停問、重擲扣 1 顆、不用不扣、用完不問、重跑不重複扣、敵人不問、長休回滿
node tests/metamagic.mjs       # 範圍法術打到隊友（不打自己）；超魔：謹慎、瞬發、遠距、一次一種、免費動作不夠灰掉
node tests/starter-style.mjs   # 起始風格：序章大爺挨個問、四隻各自類別四選一、回答對應、寫進小筆記並帶著、改選換掉、進戰鬥生效
node tests/button-tips.mjs     # 按鈕說明泡泡：代價留按鈕、效果放泡泡；電腦移上跳出點下消失；手機按住看說明不觸發、短按照常
node tests/plus-one-bow.mjs    # +1 長弓：命中 +1、傷害 +1、不給狩印、商店不賣、商隊報酬改這把
node tests/spell-slot-turn.mjs # 每回合只能花一格熟練格施法：戲法與武器招式不算、下回合重置、敵我一致、按鈕原因
node tests/reactions.mjs      # 反應：保留免費動作、敵人命中暫停詢問、護盾術 AC+5／化險減半／不用、同骰重跑、沒保留不問、敵人回合照常結束
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
node tests/status-card-inplace.mjs # 劇情／城鎮狀態卡就地更新：小筆記分頁（唯讀）、升級（含序章光暈）、熟練格展開、換武器組，外框不重建
node tests/info-bars.mjs     # 狀態卡生命／經驗／壓力三條、頭像列壓力小條
node tests/about.mjs         # 關於／授權：封面與戰場主選單都打得開，SRD 5.1、5.2 官方原句完整
node tests/performance-lifecycle.mjs # 純 Node：肖像按需載入、鏡頭焦點與戰場計時器生命週期
node tests/performance-browser.mjs   # 390×844：封面零表情預載、離場停計時器、可見玩家不移鏡
node tests/cropped-portraits.mjs   # 裁切半身圖、48表情、共用頭像、商人單層與道具屋背景預載
node tests/chest-rarity.mjs       # 五階宝箱色票、共用劇情／探索造型、開啟與預設回退
node tests/world-chest.mjs        # 選取藍屏、城鎮背景、泡泡導航、四人開箱與一次獎勵、寶箱怪戰鬥／接續
node tests/world-travel.mjs       # 共用旅店／公會、分層地圖、導航／停走、到達／寶箱、觸控鏡頭回歸
node tests/scene-image-assets.mjs  # 七張劇情素材、牆面切換、原哥布林錨點、四街景入口與零追加下載
node tests/image-load-report.mjs # 98%失敗來源／耗時紀錄、HTTP／解碼／逾時與重試保存
node tests/image-startup.mjs        # 黑底四頭原位讀取、全圖片解碼、失敗重試、劇情四店零追加下載
node tests/image-display.mjs        # 圖片失敗重試、只等待下一句必要圖片、不誤推進劇情
node tests/reported-regressions.mjs # 大爺回報過的圖片問題：布隆底圖與表情一起顯示、序章／送別逐句零未載入
node tests/wait-layout.mjs          # 連按待機時先攻列固定高度、戰場不晃動（修正前後對照）
node tests/town-image-assets.mjs     # 城鎮 NPC：四組 WebP 已接用，首次店主肖像下載量低於原 PNG 的 20%
node tests/battle-loot.mjs   # 勝利戰利品、四背包分配、負重、同名多件／實例、消耗／地面與戰後接續
node tests/caravan.mjs       # 商隊戰後：打贏→繼續→商人道謝→四選一檢定（不能跳過）→報酬只發一次→走到城鎮
node tests/stealth-mode.mjs # 切戰棋不開戰、安靜不增援、真實隱藏外觀與移動、主動攻擊及視野
node tests/explore-combat.mjs # 原地切戰棋、小隊增援、奇襲、重試、返回探索及休息
node tests/world-objects.mjs # 板條箱／寶箱、移入／長按氣泡、火藥桶負重與動作、九格友傷與連鎖
node tests/explore-objects.mjs # 探索物件：寶箱、門、推箱、陷阱、原層保留
node tests/explore-watch.mjs # 潛行自動顯示可見敵人範圍、移動保留、地板更新與遮擋
node tests/cover-ground-height.mjs # 首次授權入口、原Seed高台高度／遮擋、燃燒去底色
node tests/explore-movement-review.mjs # 高台上下、實際繞障／手機移動、門、隱藏碰撞與四隻站位／本體
node tests/explore-hover.mjs     # 探索走路中游標碰到角色不跳回起點（籌碼 hover 不套到戰場角色）
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
node tests/starter-skills.mjs # 一個起始主動＋黑暗視覺、原配裝與後續學習
node tests/shared-focus-skills.mjs # 法器提供內容共用、同名法術距離／結算、手機卡片
node tests/focus-instance.mjs # 法器逐件固定隨機屬性、現貨、裝備卡與重試
node tests/resistance.mjs    # 抗性／傷害免疫、取整、原始類型、面板、專注、資料覆寫
node tests/stress.mjs        # 壓力：加減、50 換臉、100 失控（紅光晃動、AI 接手不打隊友）、回神、戰鬥結束、休息、回酒館
node tests/undead-art.mjs    # 10-10 素材包：不死、死亡騎士、人類外觀；巫妖法袍／吸血鬼禮服／平民服可穿；#doll 不死、人類兩列
node tests/camp.mjs          # 10-10 野外露營長休：挑一隻找食材、感知檢定、三種 CG、料理效果到下次長休／生命歸零消失
node tests/gear.mjs          # 套組視同帶著內容物、能放背包欄；彈袋（投石索、吹箭筒、火槍、手槍）；商店照賣單項
```
