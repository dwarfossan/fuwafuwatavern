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
