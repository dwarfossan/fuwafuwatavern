# 表情檔名對照

檔名一律英文小寫（大爺 10-03：不要中英混用）。小傢伙們是 210×210 的頭像；大爺、卡姆的臉跟各自的無臉底圖一樣大，直接疊上去就對齊。

## `fox/` 🦊 玲玲

| 檔名 | 表情 |
|---|---|
| `normal.webp` | 平常 |
| `happy.webp` | 開心 |
| `smug.webp` | 得意 |
| `surprised.webp` | 驚訝 |
| `confused.webp` | 疑惑 |
| `awkward.webp` | 尷尬 |
| `guilty.webp` | 心虛 |
| `content.webp` | 滿足 |

## `tiger/` 🐯 嬌嬌

| 檔名 | 表情 |
|---|---|
| `normal.webp` | 平常 |
| `happy.webp` | 開心 |
| `fierce.webp` | 戰鬥 |
| `angry.webp` | 生氣 |
| `confused.webp` | 疑惑 |
| `blank.webp` | 呆滯 |
| `shy.webp` | 害羞 |
| `content.webp` | 滿足 |

## `wolf/` 🐺 香香

| 檔名 | 表情 |
|---|---|
| `normal.webp` | 平常 |
| `resigned.webp` | 無奈 |
| `serious.webp` | 認真 |
| `surprised.webp` | 驚訝 |
| `confused.webp` | 疑惑 |
| `angry.webp` | 生氣 |
| `smile.webp` | 微笑 |
| `sigh.webp` | 嘆氣 |

## `raccoon/` 🦝 默默（小狸貓；資料夾照遊戲程式裡的代號 raccoon）

| 檔名 | 表情 |
|---|---|
| `normal.webp` | 平常 |
| `happy.webp` | 開心 |
| `sly.webp` | 賊笑 |
| `surprised.webp` | 驚訝 |
| `confused.webp` | 疑惑 |
| `caught.webp` | 被抓包 |
| `down.webp` | 失落 |

## `dwarf/` 矮人大爺（疊在 portraits/dwarf_noface.webp 上）

| 檔名 | 表情 |
|---|---|
| `annoyed.webp` | 不爽 |
| `smile.webp` | 微笑 |
| `grin.webp` | 大笑 |
| `gritted.webp` | 咬牙 |
| `sad.webp` | 難過 |
| `surprised.webp` | 驚訝 |
| `smirk.webp` | 奸笑 |
| `shy.webp` | 害羞 |

## `kam/` 卡姆（疊在 portraits/kam_noface.webp 上）

| 檔名 | 表情 |
|---|---|
| `annoyed.webp` | 不爽 |
| `smile.webp` | 微笑 |
| `laugh.webp` | 大笑 |
| `gritted.webp` | 咬牙 |
| `sad.webp` | 難過 |
| `surprised.webp` | 驚訝 |
| `smirk.webp` | 奸笑 |
| `shy.webp` | 害羞 |

## liliana/ 莉莉安娜

sheet.png 為大爺提供的原始4欄3列表情表，依序 smile、happy、laugh、smirk、angry、annoyed、sad、surprised、shy、confused、serious、sly（命名暫定GPT）。只顯示眼部，眉毛與面紗沿用底圖；目前使用大爺 10-06 裁切的1000×1000半身底圖（遊戲WebP為600×600），表情表仍1448×1086。原1024×1536到新圖的座標位移為x−12、y＋128；定位見CSS .liliana-eyes，眼部遮罩與表情順序保留。

## mira/、ada/、brun/

米拉、艾妲、布隆均使用大爺原始4欄3列sheet.png，表情順序同liliana（名稱暫定GPT）。各自五官定位見CSS .mira-features／.ada-features／.brun-features。底圖改用大爺10-06裁切的1000×1000半身圖（遊戲WebP為600×600）；原圖到新圖座標位移：米拉x＋26、y＋1；艾妲x＋22、y−4；布隆x−1、y＋7。表情表不修改；位置／大小依像素位移換算，米拉臉部遮罩亦按相同座標轉換。

米拉表情表每格內容有平移差異，不能只切格；PORTRAITS.mira.offsets以鼻子為共同定位點逐格校正，CSS保持同一縮放。

## `owlcub/` 梟熊寶寶（大爺 10-21）

大爺給的 12 種表情（原檔 1254×1254，裁成貼齊腳底的正方形、縮成 384×384 WebP）。**每張都是整隻**，不是無臉底圖＋臉，所以換表情就整張換。原檔裡 `04-puzzled-preview.png` 下半截壞掉了，用同一張底圖的 neutral 補回下半身（臉的部分是原圖）。

只用在劇情場景（大爺 10-21）；戰場、先攻列、狀態卡照舊用 SVG（js/art/beasts.js）。

| 檔名 | 表情 |
|---|---|
| `neutral.webp` | 平常 |
| `happy.webp` | 開心 |
| `laugh.webp` | 大笑 |
| `puzzled.webp` | 疑惑 |
| `surprised.webp` | 驚訝 |
| `angry.webp` | 生氣 |
| `sad.webp` | 難過 |
| `crying.webp` | 哭 |
| `shy.webp` | 害羞 |
| `smug.webp` | 得意 |
| `sleepy.webp` | 想睡 |
| `afraid.webp` | 害怕 |

## `druid/` 林間德魯伊（大爺 10-22）

底圖 `assets/portraits/druid_noface.webp`，表情跟底圖一樣大（1254×1254），直接疊。

| 檔名 | 表情 |
|---|---|
| `cold.webp` | 冷淡（預設） |
| `contempt.webp` | 輕蔑 |
| `impatient.webp` | 不耐煩 |
| `cruel_smirk.webp` | 冷笑 |
| `angry.webp` | 生氣 |
| `alert.webp` | 警戒 |
| `skeptical.webp` | 懷疑 |
| `surprised.webp` | 驚訝 |
| `hurt.webp` | 受傷 |
| `sad.webp` | 難過 |
| `acknowledge.webp` | 認同 |
| `shout.webp` | 大喊 |

其他 10-22 的素材（一張圖、沒有表情，放 `assets/portraits/`）：`chimera.webp` 兇猛的奇美拉、`mantrap.webp` 食人花、`townsfolk_*.webp` 鎮民男女各 4 張


## `demon/` 惡魔（失蹤的雞，10-23）

跟 `portraits/demon_noface.webp` 一樣大（1536×1024），直接疊。

| 檔名 | 表情 |
|---|---|
| `smug.webp` | 得意 |
| `teasing.webp` | 調侃 |
| `laugh.webp` | 大笑 |
| `disdain.webp` | 輕蔑 |
| `skeptical.webp` | 懷疑 |
| `annoyed.webp` | 不耐煩 |
| `angry.webp` | 生氣 |
| `surprised.webp` | 驚訝 |
| `embarrassed.webp` | 害羞 |
| `pouting.webp` | 嘟嘴 |
| `worried.webp` | 擔心 |
| `smile.webp` | 微笑 |

## `dragon_lady/` 紅龍夫人・人形（10-28，大爺給的校準版）

跟 `portraits/dragon_lady_noface.webp` 一樣大（1024×1536），直接疊。原形是 `portraits/red_dragon_lady.webp`（一張圖）。

| 檔名 | 表情 |
|---|---|
| `regal.webp` | 高貴 |
| `warm_smile.webp` | 溫柔微笑 |
| `smirk.webp` | 得意 |
| `disdain.webp` | 輕蔑 |
| `skeptical.webp` | 懷疑 |
| `impatient.webp` | 不耐煩 |
| `furious.webp` | 震怒 |
| `command.webp` | 下令 |
| `surprised.webp` | 驚訝 |
| `regret.webp` | 懊悔 |
| `embarrassed.webp` | 害羞 |
| `laugh.webp` | 大笑 |
