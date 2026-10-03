# 表情檔名對照

檔名一律英文小寫（大爺 10-03：不要中英混用）。四小隻是 210×210 的頭像；大爺、卡姆的臉跟各自的無臉底圖一樣大，直接疊上去就對齊。

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

## 城鎮 NPC（10-04 大爺提供）
`lilianna/` 莉莉安娜、`mira/` 米拉、`ada/` 艾妲、`bronn/` 布隆各有 `sheet.webp`，保留原透明 4×3 表情表。由左到右、由上到下：normal 平常、happy 開心、laugh 大笑、smirk 得意、angry 生氣、sad 難過、cry 哭泣、surprised 驚訝、shy 害羞、worried 擔心、tired 疲倦、wink 眨眼。表情命名為 GPT 暫定。
全身無臉底圖在 `assets/portraits/<id>_noface.webp`；原圖只轉 WebP，半身與頭像用 CSS 視窗裁切，沒有另外重畫或壓扁。尺寸、半身裁切和臉部對位由 PORTRAITS 設定，npcPortraitHTML 讓底圖與表情共用完整畫布；setPortraitFace 只換表情表格位。莉莉安娜保留原面紗與底圖眉毛，CSS 僅顯示表情眼睛，鼻口／眼淚落在面紗後面。
