/* 人類（GPT 畫、大爺 10-10 給的素材包，香香接成紙娃娃資料）：只有外觀，沒有數值、敵人配置
   大爺：人類素材是延伸各種族的基礎（精靈耳就是第一個例子）。頭比四小隻小、身體比較高、有脖子
   - humanLook({sex, hair, beard, ears, hairColor, beardColor, skin}) 組出一種外觀；性別只是展示分類，髮型可以跨用
   - 疊的順序照素材說明：後髮（畫在身體後面，用 tail 的位置）→ 耳朵 → 臉 → 前髮 → 鬍子
   - 女性身體比較窄：身上的衣服、護甲照素材的 outfit-fit 一起縮（gearFit）
   - 平民服：素材裡的衣服，做成可以穿的衣服（數值暫定，香香）
   原圖朝右（10-21 統一規格：所有單位原圖朝右，要朝左就由 face:-1 翻）；不要永久翻轉來源 */
const HUMAN_PARTS = {"hair": {"male-01": {"back": "<g id=\"male-hair-01-back\"></g>", "front": "<g id=\"male-hair-01-front\"><path d=\"M41 40 L41 25 L50 27 L52 15 L64 19 L75 12 L81 19 L94 20 L100 35 L95 45 L88 33 L55 32 L47 45Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "俐落短髮"}, "male-02": {"back": "<g id=\"male-hair-02-back\"></g>", "front": "<g id=\"male-hair-02-front\"><path d=\"M40 42 Q38 18 62 13 Q86 8 98 26 L99 42 L89 33 L79 24 Q59 40 45 35Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "側分髮"}, "male-03": {"back": "<g id=\"male-hair-03-back\"></g>", "front": "<g id=\"male-hair-03-front\"><path d=\"M41 43 L40 26 Q47 10 69 11 Q94 10 99 32 L96 43 L87 30 Q69 24 52 32 L47 44Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M49 26 Q64 16 85 23\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "後梳髮"}, "male-04": {"back": "<g id=\"male-hair-04-back\"></g>", "front": "<g id=\"male-hair-04-front\"><path d=\"M40 43 Q31 34 40 28 Q34 19 46 18 Q43 7 56 12 Q64 1 73 11 Q85 4 89 16 Q103 13 100 27 Q109 34 97 45 L88 34 Q77 39 67 31 Q56 40 46 34Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "捲髮"}, "male-05": {"back": "<g id=\"male-hair-05-back\"></g>", "front": "<g id=\"male-hair-05-front\"><path d=\"M40 42 Q36 24 52 15 Q72 4 90 19 L99 34 L94 43 L86 30 Q66 27 50 33 L47 43Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M39 25 Q22 23 27 12 Q35 4 44 16Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "束髮"}, "female-01": {"back": "<g id=\"female-hair-01-back\"><path d=\"M39 34 Q39 12 66 12 Q95 9 101 35 L99 92 L85 88 L76 69 L52 86 L35 90Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-01-front\"><path d=\"M40 42 L45 24 Q60 8 82 15 L99 28 L99 45 L88 34 L83 26 Q62 43 43 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "側分長髮"}, "female-02": {"back": "<g id=\"female-hair-02-back\"><path d=\"M39 34 Q40 9 71 11 Q99 13 101 38 L100 76 L88 79 L80 67 L49 75 L36 73Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-02-front\"><path d=\"M39 42 Q38 17 68 12 Q96 12 99 40 L85 31 L70 25 Q57 39 43 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "短鮑伯"}, "female-03": {"back": "<g id=\"female-hair-03-back\"><path d=\"M38 35 Q39 10 69 10 Q99 10 101 38 L101 93 L82 91 L52 92 L35 93Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-03-front\"><path d=\"M40 41 L43 24 Q69 10 95 25 L98 42 L83 40 L78 31 L74 40 L59 40 L55 32 L51 41Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "齊瀏海長髮"}, "female-04": {"back": "<g id=\"female-hair-04-back\"><path d=\"M45 26 Q24 9 24 35 L21 76 L30 91 L44 78 L40 46Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-04-front\"><path d=\"M40 43 Q39 15 67 11 Q94 10 99 32 L96 44 L85 30 Q68 28 48 35 L46 44Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "高馬尾"}, "female-05": {"back": "<g id=\"female-hair-05-back\"><path d=\"M43 59 Q25 53 27 73 L23 94 Q40 96 47 79 L48 66Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-05-front\"><path d=\"M40 42 Q39 16 68 13 Q95 13 99 36 L96 44 L88 33 L80 27 Q59 42 44 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "低馬尾"}, "female-06": {"back": "<g id=\"female-hair-06-back\"><path d=\"M43 34 Q23 22 24 44 L21 79 L30 88 L44 70Z M96 33 Q114 23 113 45 L118 77 L108 86 L98 65Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-06-front\"><path d=\"M40 42 Q39 15 69 11 Q96 12 99 41 L85 33 L73 24 L62 34 L44 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "雙馬尾"}, "female-07": {"back": "<g id=\"female-hair-07-back\"><path d=\"M39 22 Q26 10 37 3 Q50 -3 56 11Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-07-front\"><path d=\"M40 43 Q38 19 64 12 Q93 8 99 34 L95 44 L86 29 Q63 27 47 37 L45 45Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "盤髮"}, "female-08": {"back": "<g id=\"female-hair-08-back\"><path d=\"M39 32 Q40 11 68 11 Q96 9 101 34 L102 51 Q114 64 103 73 Q115 87 101 95 L84 87 L77 70 L51 83 Q38 100 28 88 Q22 77 34 68 Q25 53 37 46Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-08-front\"><path d=\"M40 43 Q37 19 64 13 Q90 8 98 34 L96 45 L84 29 Q72 43 60 33 Q51 43 43 37Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "波浪長髮"}, "female-09": {"back": "<g id=\"female-hair-09-back\"><path d=\"M43 55 Q30 64 38 73 Q27 81 36 89 Q30 102 44 107 Q56 99 47 90 Q57 81 47 74 Q56 65 49 58Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-09-front\"><path d=\"M40 43 Q38 17 67 12 Q96 10 99 36 L95 44 L86 31 L78 24 Q58 42 44 37Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "單側辮髮"}, "female-10": {"back": "<g id=\"female-hair-10-back\"><path d=\"M38 34 Q39 11 68 12 Q98 12 101 35 L101 89 L89 93 L79 72 L49 84 L35 91Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-10-front\"><path d=\"M40 42 Q40 20 66 13 Q92 13 99 36 L95 44 L84 28 L72 23 Q61 37 45 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M45 30 Q63 44 86 29\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "精靈式半束髮"}}, "beards": {"01": {"art": "<g id=\"beard-01\"><path d=\"M76 60 Q67 56 61 64 Q67 69 75 65 L79 62 Q82 65 88 66 L93 61 Q84 57 79 60Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "八字鬍"}, "02": {"art": "<g id=\"beard-02\"><path d=\"M68 68 Q79 72 88 66 L86 79 L78 85 L70 79Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "山羊鬍"}, "03": {"art": "<g id=\"beard-03\"><path d=\"M44 52 L53 60 L58 69 Q75 76 89 65 L99 53 L97 68 Q91 81 77 84 Q55 83 45 67Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "短絡腮鬍"}, "04": {"art": "<g id=\"beard-04\"><path d=\"M44 53 L52 60 L59 67 Q75 73 90 64 L99 53 L97 73 L91 89 L80 98 L73 92 L65 95 L52 81 L45 68Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "長鬍鬚"}, "05": {"art": "<g id=\"beard-05\"><path d=\"M47 59 L59 68 Q78 75 93 62 L96 73 L84 84 Q91 89 82 94 Q90 101 79 107 Q66 104 74 96 Q65 90 73 84 L58 80Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M74 92 L84 92 M74 101 L83 101\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "編辮鬍"}}, "ears": {"human": "<g id=\"ears-human\"><path d=\"M44 43 L35 39 L36 51 L45 57Z\" fill=\"var(--skin-color, #e8bb9b)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "elf": "<g id=\"ears-elf\"><path d=\"M45 43 L23 29 L30 49 L45 57Z\" fill=\"var(--skin-color, #e8bb9b)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M30 37 L40 49\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>"}, "base": {"male": {"body": "<g id=\"human-body\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\"><g transform=\"\"><path d=\"M52 87 Q69 77 88 88 L92 126 L82 134 L56 134 L47 122Z\" fill=\"#bba795\" /><path d=\"M58 127 L58 137 M81 127 L81 137\" stroke=\"#6b4a35\" stroke-width=\"9\" /><ellipse cx=\"57\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /><ellipse cx=\"83\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /></g></g>", "neck": "<path id=\"human-neck\" d=\"M63 74 L63 86 Q73 94 81 84 L81 75Z\" fill=\"#e8bb9b\" stroke=\"#2a2630\" stroke-width=\"3\" />", "tunic": "<g id=\"civilian-tunic\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M48 85 Q70 78 92 86 L96 107 L92 129 Q70 138 47 130 L43 107Z\" fill=\"#638a83\" /><path d=\"M59 83 L71 96 L82 83\" fill=\"none\" stroke=\"#bed0b8\" stroke-width=\"2.5\" /><path d=\"M47 111 Q71 118 94 110\" fill=\"none\" stroke=\"#6b4a35\" stroke-width=\"5\" /><path d=\"M67 111 L77 112 L77 118 L67 117Z\" fill=\"#bda366\" stroke-width=\"1.5\" /><path d=\"M71 97 L73 109 M72 119 L72 133\" fill=\"none\" stroke=\"#426963\" stroke-width=\"2\" /></g>", "fit": "", "headAttr": "stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" transform=\"translate(72 78) scale(0.65) translate(-72 -78)\"", "face": "<path d=\"M43 37 Q44 15 68 16 Q93 16 97 37 L99 54 Q96 71 77 78 Q57 78 44 63Z\" fill=\"#e8bb9b\" /><ellipse cx=\"63\" cy=\"48\" rx=\"5\" ry=\"6.5\" fill=\"#2a2630\" stroke=\"none\" /><ellipse cx=\"87\" cy=\"46\" rx=\"4\" ry=\"5.5\" fill=\"#2a2630\" stroke=\"none\" /><circle cx=\"64\" cy=\"47\" r=\"1.7\" fill=\"#fff2dd\" stroke=\"none\" /><circle cx=\"87\" cy=\"45\" r=\"1.4\" fill=\"#fff2dd\" stroke=\"none\" /><path d=\"M76 53 L83 57 L77 59 M65 65 Q75 70 85 63\" fill=\"none\" stroke-width=\"2\" /><path d=\"M57 38 L68 40 M83 37 L91 37\" fill=\"none\" stroke=\"#6b4a35\" stroke-width=\"3\" />", "arms": "<g id=\"human-arms\" transform=\"\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linecap=\"round\"><path d=\"M48 92 L40 105 M91 92 L100 105\" stroke=\"#638a83\" stroke-width=\"9\" /><circle cx=\"40\" cy=\"107\" r=\"7.5\" fill=\"#e8bb9b\" /><circle cx=\"100\" cy=\"107\" r=\"7.5\" fill=\"#e8bb9b\" /></g>"}, "female": {"body": "<g id=\"human-body\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\"><g transform=\"translate(70 0) scale(.88 1) translate(-70 0)\"><path d=\"M55 86 Q70 80 85 86 Q93 96 86 104 L87 113 Q89 121 94 128 L84 134 L54 134 L46 128 Q53 119 53 111 L54 104 Q47 94 55 86Z\" fill=\"#bba795\" /><path d=\"M58 127 L58 137 M81 127 L81 137\" stroke=\"#6b4a35\" stroke-width=\"9\" /><ellipse cx=\"57\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /><ellipse cx=\"83\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /></g></g>", "neck": "<path id=\"human-neck\" d=\"M63 74 L63 86 Q73 94 81 84 L81 75Z\" fill=\"#e8bb9b\" stroke=\"#2a2630\" stroke-width=\"3\" />", "tunic": "<g id=\"civilian-tunic\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M54 85 Q70 80 86 86 Q95 96 87 104 L89 114 Q91 123 97 129 Q70 140 43 130 Q49 121 51 113 L53 104 Q46 96 54 85Z\" fill=\"#638a83\" /><path d=\"M61 84 L71 96 L80 84\" fill=\"none\" stroke=\"#bed0b8\" stroke-width=\"2.5\" /><path d=\"M51 112 Q71 117 90 112\" fill=\"none\" stroke=\"#6b4a35\" stroke-width=\"5\" /><path d=\"M67 111 L77 112 L77 118 L67 117Z\" fill=\"#bda366\" stroke-width=\"1.5\" /><path d=\"M71 97 L72 109 M72 119 L72 133\" fill=\"none\" stroke=\"#426963\" stroke-width=\"2\" /><path d=\"M56 98 Q62 104 69 100 M75 100 Q81 104 87 98\" fill=\"none\" stroke=\"#426963\" stroke-width=\"2\" stroke-linecap=\"round\" /></g>", "fit": "translate(70 0) scale(.88 1) translate(-70 0)", "headAttr": "stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" transform=\"translate(72 78) scale(.65 .64) translate(-72 -78)\"", "face": "<path d=\"M43 37 Q44 15 68 16 Q93 16 97 37 L99 54 Q96 71 77 78 Q57 78 44 63Z\" fill=\"#e8bb9b\" /><ellipse cx=\"63\" cy=\"48\" rx=\"5\" ry=\"6.5\" fill=\"#2a2630\" stroke=\"none\" /><ellipse cx=\"87\" cy=\"46\" rx=\"4\" ry=\"5.5\" fill=\"#2a2630\" stroke=\"none\" /><circle cx=\"64\" cy=\"47\" r=\"1.7\" fill=\"#fff2dd\" stroke=\"none\" /><circle cx=\"87\" cy=\"45\" r=\"1.4\" fill=\"#fff2dd\" stroke=\"none\" /><path d=\"M76 53 L83 57 L77 59 M65 65 Q75 70 85 63\" fill=\"none\" stroke-width=\"2\" /><path d=\"M58 39 L67 40 M84 38 L90 38\" fill=\"none\" stroke=\"#59403a\" stroke-width=\"2\" /><path d=\"M58 46 L55 44\" fill=\"none\" stroke-width=\"2\" />", "arms": "<g id=\"human-arms\" transform=\"translate(70 0) scale(.88 1) translate(-70 0)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linecap=\"round\"><path d=\"M54 92 L44 105 M86 92 L96 105\" stroke=\"#638a83\" stroke-width=\"9\" /><circle cx=\"44\" cy=\"107\" r=\"7\" fill=\"#e8bb9b\" /><circle cx=\"96\" cy=\"107\" r=\"7\" fill=\"#e8bb9b\" /></g>"}}};
ARMOR_ART["平民服"] = {body:HUMAN_PARTS.base.male.tunic+`<path d="M48 92 L40 105 M91 92 L100 105" stroke="#2a2630" stroke-width="13" stroke-linecap="round"/><path d="M48 92 L40 105 M91 92 L100 105" stroke="#638a83" stroke-width="9" stroke-linecap="round"/>`};
// 大爺 10-22：人類表情改嚴肅一點（眉毛往中間壓、加粗，嘴巴拉平）；側臉、正面一起改
HUMAN_PARTS.base.male.face = HUMAN_PARTS.base.male.face.replace('M65 65 Q75 70 85 63','M66 66 Q75 64 84 65').replace('M57 38 L68 40 M83 37 L91 37','M57 36 L68 41 M82 40 L91 36').replace('M57 36 L68 41 M82 40 L91 36" fill="none" stroke="#6b4a35" stroke-width="3"','M57 36 L68 41 M82 40 L91 36" fill="none" stroke="#6b4a35" stroke-width="4.6" stroke-linecap="round"');
HUMAN_PARTS.base.female.face = HUMAN_PARTS.base.female.face.replace('M65 65 Q75 70 85 63','M66 66 Q75 64 84 65').replace('M58 39 L67 40 M84 38 L90 38','M58 37 L67 41 M83 40 L90 37').replace('M58 37 L67 41 M83 40 L90 37" fill="none" stroke="#59403a" stroke-width="2"','M58 37 L67 41 M83 40 L90 37" fill="none" stroke="#59403a" stroke-width="3.6" stroke-linecap="round"');
const HUMAN_FEMALE_SHAPE = {id:"human-female",
  d:"M54 85 Q70 80 86 86 Q95 96 87 104 L89 114 Q91 123 97 129 Q70 140 43 130 Q49 121 51 113 L53 104 Q46 96 54 85Z",
  edge:"M48.5 92 Q46 96 53 104 L51 113 Q49 121 43 130 Q70 140 97 129 Q91 123 89 114 L87 104 Q95 96 92.5 92",
  // 胸甲、半身板甲的胸板原本是照圓桶身體畫的橢圓，女性換成跟著胸線往外、腰部收進來的形狀（大爺 10-22）
  swap:[["M55 90 Q70 84 85 90 Q90 104 84 114 Q70 120 56 114 Q50 104 55 90 Z", "M52 88 Q70 82 88 88 Q95 96 87 104 L86 110 Q70 118 54 110 L53 104 Q45 96 52 88 Z"],
        ['<ellipse cx="62" cy="97" rx="4" ry="6"', '<ellipse cx="60" cy="95" rx="4" ry="5"']]};
var humanLook = function({sex="male", hair="01", beard=null, ears="human", hairColor="#6b4a35", beardColor=hairColor, skin="#e8bb9b"}={}){
  const B = HUMAN_PARTS.base[sex], H = HUMAN_PARTS.hair[`${sex}-${hair}`] || HUMAN_PARTS.hair[`${sex}-01`];
  const col = s => (s||"").replace(/var\(--hair-color,[^)]*\)/g, hairColor).replace(/var\(--beard-color,[^)]*\)/g, beardColor).replace(/var\(--skin-color,[^)]*\)/g, skin);
  const face = B.face.replace(/#e8bb9b/g, skin).replace(/stroke="#(6b4a35|59403a)"/g, `stroke="${hairColor}"`);   // 10-22 大爺：側臉眉毛跟著髮色
  const inner = f => `<g ${B.headAttr}>${col(HUMAN_PARTS.ears[ears])}${f}${col(H.front)}${beard ? col(HUMAN_PARTS.beards[beard].art) : ""}</g>`;
  const hurtFace = face.replace(/<ellipse cx="(63|87)" cy="(4[68])"[^>]*\/>/g, (m,x,y)=>`<path d="M${x-5} ${y-5} L${+x+5} ${+y+5} M${+x+5} ${y-5} L${x-5} ${+y+5}" stroke="#2a2630" stroke-width="3"/>`).replace(/<circle cx="(64|87)" cy="4[57]"[^>]*\/>/g, "");
  const svg = g => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
  const placed = f => `<g transform="scale(1.3158) translate(-32 -6)">${inner(f)}</g>`;
  const arms = `<path d="M48 92 L40 105 M91 92 L100 105" stroke="#2a2630" stroke-width="13" stroke-linecap="round"/><path d="M48 92 L40 105 M91 92 L100 105" stroke="${skin}" stroke-width="9" stroke-linecap="round"/>`;
  return {face: svg(`<g transform="translate(50 54) scale(2.3) translate(-71 -57)">${inner(face)}</g>`),
    head: svg(placed(face)), headHurt: svg(placed(hurtFace)),
    body:"#bba795", skin, feet:"#6b4a35", belly:false,
    tail: `<g ${B.headAttr}>${col(H.back)}</g>`,                                  // 後髮：畫在身體後面
    bodyArt: B.body + B.neck.replace(/#e8bb9b/g, skin) + arms, gearFit: B.fit || "",
    gearShape: sex==="female" ? HUMAN_FEMALE_SHAPE : null,
    sleeves: "M48 92 L40 105 M91 92 L100 105",                                    // 10-22：穿護甲時手臂蓋上袖子                      // 10-22：女性護甲照腰身、臀部的輪廓（跟素材的平民服同一個形狀）
    anchor: {head:[50,44,.8], neck:[72,88]},                                     // 頭小一號：頭飾、項鍊對準人類的頭（暫定）
    human: {sex, hair, beard, ears}};
};
MONSTER_LOOK.human_male = humanLook({sex:"male"});
MONSTER_LOOK.human_female = humanLook({sex:"female"});

// ---------- 正面回合頭像（大爺 10-10 要正面；香香畫，外觀暫定） ----------
// 素材只有朝右的 3/4 側臉，正面是照每種髮型、鬍子、耳朵的特徵另外畫的簡化版；髮色、鬍色、膚色跟著 humanLook 的參數
function humanFrontSVG({sex="male", hair="01", beard=null, ears="human", hairColor="#6b4a35", beardColor=hairColor, skin="#e8bb9b"}={}){
  const INK="#2a2630", p=(d,f,w=2.6)=>`<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const H=hairColor, k=`${sex}-${hair}`;
  // 頭髮在臉後面的部分（長髮兩側、馬尾、包頭）
  const back = {
    "female-01":p("M27 46 Q22 76 30 92 L44 86 L40 52 Z M73 46 Q78 76 70 92 L56 86 L60 52 Z",H),
    "female-02":p("M27 46 Q24 64 30 74 L40 72 L40 52 Z M73 46 Q76 64 70 74 L60 72 L60 52 Z",H),
    "female-03":p("M27 46 Q22 78 29 94 L42 88 L40 52 Z M73 46 Q78 78 71 94 L58 88 L60 52 Z",H),
    "female-04":p("M66 24 Q86 14 88 34 Q90 54 80 66 Q82 46 72 34 Z",H),
    "female-05":p("M70 58 Q84 66 80 88 Q74 78 66 72 Z",H),
    "female-06":p("M28 44 Q12 56 18 80 Q26 68 32 58 Z M72 44 Q88 56 82 80 Q74 68 68 58 Z",H),
    "female-07":`<circle cx="50" cy="18" r="9" fill="${H}" stroke="${INK}" stroke-width="2.6"/>`,
    "female-08":p("M27 46 Q18 62 26 74 Q20 84 30 94 L44 86 L40 52 Z M73 46 Q82 62 74 74 Q80 84 70 94 L56 86 L60 52 Z",H),
    "female-09":p("M70 56 Q80 70 74 92 L66 90 Q70 74 64 62 Z",H)+`<path d="M68 66 L76 70 M67 74 L75 78 M67 82 L74 86" stroke="${INK}" stroke-width="1.6"/>`,
    "female-10":p("M27 46 Q22 76 30 92 L44 86 L40 52 Z M73 46 Q78 76 70 92 L56 86 L60 52 Z",H)+`<circle cx="50" cy="22" r="6" fill="${H}" stroke="${INK}" stroke-width="2.4"/>`,
    "male-05":`<circle cx="50" cy="17" r="7" fill="${H}" stroke="${INK}" stroke-width="2.6"/>`
  }[k] || "";
  // 耳朵（精靈耳往外上方尖）
  const ear = ears==="elf"
    ? p("M28 52 L12 38 L18 58 L29 63 Z",skin)+p("M72 52 L88 38 L82 58 L71 63 Z",skin)
    : p("M28 50 Q20 52 22 60 Q24 66 30 64 Z",skin)+p("M72 50 Q80 52 78 60 Q76 66 70 64 Z",skin);
  const face = p("M28 50 Q28 26 50 26 Q72 26 72 50 Q72 72 50 80 Q28 72 28 50 Z",skin)
    + `<ellipse cx="41" cy="54" rx="3.4" ry="4.4" fill="${INK}"/><ellipse cx="59" cy="54" rx="3.4" ry="4.4" fill="${INK}"/><circle cx="42" cy="52.6" r="1.2" fill="#fff2dd"/><circle cx="60" cy="52.6" r="1.2" fill="#fff2dd"/>`
    + `<path d="M34 44 L45 48 M55 48 L66 44" stroke="${H}" stroke-width="${sex==="female"?3.6:4.4}" stroke-linecap="round"/>`
    + `<path d="M50 58 L48 64 L52 64" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`
    + (beard==="01"||beard==="03"||beard==="04"||beard==="05" ? "" : `<path d="M44 70 Q50 68.5 56 70" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`)
    + `<ellipse cx="34" cy="63" rx="4" ry="2" fill="#e99b9e" opacity=".5"/><ellipse cx="66" cy="63" rx="4" ry="2" fill="#e99b9e" opacity=".5"/>`;
  // 頭頂與瀏海
  const front = {
    "male-01":p("M27 48 Q26 22 50 22 Q74 22 73 48 L68 38 Q60 34 50 36 Q40 34 32 38 Z",H),
    "male-02":p("M27 48 Q26 22 50 22 Q74 22 73 48 L70 40 Q58 32 40 40 L34 36 Z",H),
    "male-03":p("M28 44 Q28 20 50 20 Q72 20 72 44 Q62 30 50 30 Q38 30 28 44 Z",H),
    "male-04":p("M26 48 Q22 40 27 34 Q25 24 34 24 Q38 16 46 20 Q52 14 58 20 Q66 16 68 25 Q77 26 74 35 Q78 42 73 48 L68 38 Q50 30 32 38 Z",H),
    "male-05":p("M27 48 Q26 22 50 22 Q74 22 73 48 Q64 32 50 32 Q36 32 27 48 Z",H),
    "female-01":p("M27 52 Q24 22 50 22 Q76 22 73 52 L66 36 Q50 32 40 44 L36 36 Z",H),
    "female-02":p("M26 56 Q22 22 50 22 Q78 22 74 56 L68 40 L62 44 L56 38 L50 44 L44 38 L38 44 L32 40 Z",H),
    "female-03":p("M27 52 Q24 22 50 22 Q76 22 73 52 L70 44 L30 44 Z",H),
    "female-04":p("M27 50 Q26 22 50 22 Q74 22 73 50 Q66 34 50 34 Q36 36 27 50 Z",H),
    "female-05":p("M27 50 Q26 22 50 22 Q74 22 73 50 L64 38 Q52 34 42 40 L34 38 Z",H),
    "female-06":p("M27 50 Q26 22 50 22 Q74 22 73 50 L66 40 L58 36 L50 41 L42 36 L34 40 Z",H),
    "female-07":p("M27 50 Q26 24 50 24 Q74 24 73 50 Q64 36 50 36 Q36 36 27 50 Z",H),
    "female-08":p("M26 54 Q20 22 50 22 Q80 22 74 54 Q70 40 60 40 Q56 34 50 38 Q44 34 40 40 Q30 40 26 54 Z",H),
    "female-09":p("M27 50 Q26 22 50 22 Q74 22 73 50 L62 36 Q48 34 36 42 Z",H),
    "female-10":p("M27 52 Q24 22 50 22 Q76 22 73 52 Q64 36 50 37 Q36 36 27 52 Z",H)
  }[k] || p("M27 48 Q26 22 50 22 Q74 22 73 48 Q62 34 50 34 Q38 34 27 48 Z",H);
  const B=beardColor;
  const beardArt = !beard ? "" : {
    "01":p("M38 67 Q44 62 50 66 Q56 62 62 67 Q56 70 50 68 Q44 70 38 67 Z",B,2),                                          // 八字鬍
    "02":p("M44 70 Q50 68 56 70 L54 82 Q50 86 46 82 Z",B,2)+`<path d="M44 69 Q50 72 56 69" fill="none" stroke="${INK}" stroke-width="1.8"/>`,   // 山羊鬍
    "03":p("M29 56 Q32 76 50 82 Q68 76 71 56 L66 60 Q62 70 50 72 Q38 70 34 60 Z",B,2)+p("M40 67 Q50 63 60 67 Q50 71 40 67 Z",B,1.8),   // 短絡腮鬍
    "04":p("M29 56 Q30 86 50 98 Q70 86 71 56 L66 60 Q62 70 50 72 Q38 70 34 60 Z",B,2)+p("M40 67 Q50 63 60 67 Q50 71 40 67 Z",B,1.8),   // 長鬍鬚
    "05":p("M30 56 Q34 76 50 80 Q66 76 70 56 L65 60 Q61 70 50 72 Q39 70 35 60 Z",B,2)+p("M46 78 L54 78 L53 96 L47 96 Z",B,2)+`<path d="M47 84 L53 86 M47 90 L53 92" stroke="${INK}" stroke-width="1.5"/><circle cx="50" cy="97" r="2.5" fill="#bda366" stroke="${INK}" stroke-width="1.5"/>`   // 編辮鬍
  }[beard] || "";
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-front="human">${back}${ear}${face}${front}${beardArt}</svg>`;
}
{
  const side = humanLook;
  humanLook = o => ({...side(o), face:humanFrontSVG(o||{})});
  MONSTER_LOOK.human_male = humanLook({sex:"male"});
  MONSTER_LOOK.human_female = humanLook({sex:"female"});
  // 盜賊頭目（大爺 10-21，記仇進化）：黑髮＋絡腮鬍、曬黑一點；身上的鑲釘皮甲是裝備（外觀暫定：香香）
  // 林間德魯伊（大爺 10-21 森林，香香畫、暫定）：波浪長髮、葉子頭冠、綠色長袍
  { const INK="#2a2630", L=humanLook({sex:"female", hair:"08", hairColor:"#7a4a2a", skin:"#f0c9a6", ears:"elf"});   // 10-22：照大爺給的立繪改成精靈耳
    const leaves=(cx,cy,k)=>`<g transform="translate(${cx} ${cy}) scale(${k})">${[[-22,4,-30],[-11,-3,-12],[0,-6,0],[11,-3,12],[22,4,30]].map(([x,y,a])=>`<path d="M${x} ${y} q-4 -9 0 -15 q4 6 0 15z" transform="rotate(${a} ${x} ${y})" fill="#6f9a4c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`).join("")}<path d="M-24 6 Q0 -6 24 6" fill="none" stroke="#7a5230" stroke-width="3" stroke-linecap="round"/></g>`;
    const deco=(svg,art)=>svg.replace(/<\/svg>\s*$/,art+"</svg>");
    const robe=HUMAN_PARTS.base.female.tunic.replace(/#638a83/g,"#4f7a45").replace(/#bed0b8/g,"#c9dca0").replace(/#426963/g,"#3a5c33").replace(/#6b4a35/g,"#7a5230").replace(/#bda366/g,"#d9b44a");
    MONSTER_LOOK.forest_druid = {...L, face:deco(L.face, leaves(50,24,1.1)), head:deco(L.head, leaves(56,38,.9)), headHurt:deco(L.headHurt, leaves(56,38,.9)),
      extra:`<g transform="${HUMAN_PARTS.base.female.fit}">${robe}</g>`}; }
  MONSTER_LOOK.bandit_captain = humanLook({sex:"male", hair:"03", beard:"03", hairColor:"#2b2523", beardColor:"#2b2523", skin:"#d4a27e"});
}

// 矮人大爺（大爺 10-22 給了兩張戰棋草圖：便服、穿鎧甲，要改成跟戰場其他單位同一套畫風）
// 大爺是 145cm 的矮小女黑暗精靈，「鬍子」是兩側頭髮編成辮子在下巴綁起來，不是真的鬍子（沒有八字鬍，嘴巴看得到）
// 只有外觀，沒有數值、沒有放進任何戰鬥（要不要上場、什麼時候上場再跟大爺確認）
//   便服：照紙娃娃規格（3/4 側臉朝右、大頭、圓身體、浮空圓球手、橢圓腳；外框 3～3.5），襯衫＋深紫背心＋吊帶圍裙
//   鎧甲：大型體型（2×2，戰場放大 1.45 倍），整套盔甲包住全身，只有頭露出來；深灰板甲＋亮灰胸板＋橘色大護肩＋大鐵拳（外觀暫定：香香）
{
  const INK="#2a2630", SK="#7a4f33", SKD="#5e3a24", HR="#f3e6cf", HRD="#d8c7a6", GL="#c9932f";
  const p=(d,f,w=3.5)=>`<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const ln=(d,c=HRD,w=2)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // 圓眼鏡：鏡片半透明，看得到紅眼睛；受傷＝叉叉
  const lens=(x,y,r,hurt)=>(hurt
      ? `<path d="M${x-3.5} ${y-3.5} L${x+3.5} ${y+3.5} M${x+3.5} ${y-3.5} L${x-3.5} ${y+3.5}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
      : `<ellipse cx="${x+.5}" cy="${y+.5}" rx="${r*.38}" ry="${r*.5}" fill="#c0392b"/><circle cx="${x+1.2}" cy="${y-1}" r="${r*.16}" fill="#fff"/>`)
    + `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff3c8" fill-opacity=".35" stroke="${INK}" stroke-width="2.6"/><circle cx="${x}" cy="${y}" r="${r-2.2}" fill="none" stroke="${GL}" stroke-width="2"/>`
    + `<path d="M${x-r*.55} ${y-r*.2} Q${x-r*.35} ${y-r*.6} ${x} ${y-r*.65}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
  const svg=g=>`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
  // 頭髮編的「鬍子」：兩側髮束沿著臉頰往下，在下巴綁成一束（下面接胸口的辮子）
  const hairBeard = (l, r, c, w=15) => p(`M${l-1} 56 Q${l-5} 82 ${c-12} 94 L${c-4} 97 L${c-3} 86 Q${l+w} 80 ${l+w-3} 60 Z`, HR)
    + p(`M${r+1} 54 Q${r+5} 80 ${c+12} 94 L${c+4} 97 L${c+3} 86 Q${r-w+2} 78 ${r-w+4} 58 Z`, HR)
    + p(`M${c-12} 86 Q${c} 93 ${c+12} 86 L${c+9} 99 Q${c} 104 ${c-9} 99 Z`, HR, 3)
    + ln(`M${l+2} 64 L${l+8} 69 M${l+3} 74 L${l+10} 79 M${l+7} 83 L${l+13} 87 M${r-2} 64 L${r-8} 69 M${r-3} 74 L${r-10} 79 M${r-7} 83 L${r-13} 87`) + `<rect x="${c-6}" y="92" width="12" height="5" rx="1.5" fill="#d9b44a" stroke="${INK}" stroke-width="2"/>`;
  // 3/4 側臉（朝右）
  const sideInner = hurt =>
      p("M73 46 L95 30 L87 55 L75 61 Z", SK) + ln("M78 48 L90 36 L85 52", SKD)
    + p("M28 54 Q28 24 54 22 Q78 24 78 54 Q78 80 54 88 Q30 80 28 54 Z", SK)
    + p("M23 64 Q16 30 34 17 Q54 5 74 15 Q87 23 82 45 L76 36 L70 44 L64 31 L57 42 L50 29 L43 41 L37 33 Q33 46 33 64 Z", HR)
    + ln("M40 18 Q54 13 68 18")
    + p("M33 51 L7 35 L15 60 L31 67 Z", SK) + ln("M28 53 L13 41 L18 58", SKD)
    + ln("M38 42 L53 45 M61 44 L75 41", HR, 3)
    + lens(46,53,7.5,hurt) + lens(68,52,6.6,hurt) + ln("M53.5 53 L61.4 52.5", INK, 2.6) + ln("M38.5 52 L30 51", GL, 2.4)
    + p("M61 59 Q67 59 66 64 Q63 66 60 64 Z", SKD, 2.2)
    + ln(hurt ? "M54 72 Q59 69.5 64 72" : "M54 71 Q59 72.5 64 70.5", INK, 2.4)
    + hairBeard(31, 76, 54);
  const side = hurt => svg(sideInner(hurt));
  // 正面（先攻列、狀態卡用）
  const frontInner =
      p("M27 50 L5 34 L13 60 L29 66 Z", SK) + p("M73 50 L95 34 L87 60 L71 66 Z", SK)
    + p("M26 54 Q26 24 50 22 Q74 24 74 54 Q74 80 50 88 Q26 80 26 54 Z", SK)
    + p("M20 64 Q14 30 30 17 Q50 5 70 17 Q86 30 80 64 L68 64 Q68 46 64 34 L58 42 L52 30 L46 42 L40 31 L36 36 Q32 46 32 64 Z", HR)
    + ln("M32 42 L46 45 M54 45 L68 42", HR, 3)
    + lens(40,53,7.2,false) + lens(60,53,7.2,false) + ln("M47.2 53 L52.8 53", INK, 2.6)
    + p("M47 60 Q50 58 53 60 Q53 64 50 65 Q47 64 47 60 Z", SKD, 2.2)
    + ln("M44 71 Q50 72.5 56 71", INK, 2.4)
    + hairBeard(27, 73, 50, 10);
  const front = svg(frontInner);
  // 胸口的辮子（紙娃娃座標；下巴中心在頭的 x≈54 → 紙娃娃 x≈73）
  const braid = (x,y0,n,s=1) => Array.from({length:n},(_,i)=>p(`M${x} ${y0+i*8*s} l${-5*s} ${4.5*s} l${5*s} ${4.5*s} l${5*s} ${-4.5*s} Z`, HR, 2.4)).join("")
    + `<rect x="${x-4*s}" y="${y0+n*8*s-1}" width="${8*s}" height="${5*s}" rx="1.5" fill="#d9b44a" stroke="${INK}" stroke-width="2"/>`
    + p(`M${x-3*s} ${y0+n*8*s+4*s} L${x} ${y0+n*8*s+11*s} L${x+3*s} ${y0+n*8*s+4*s} Z`, HR, 2);
  // 便服：白襯衫（身體色）＋深紫背心兩側＋吊帶皮圍裙
  const casual = p("M50 86 Q56 82 61 84 L57 129 Q51 128 48 127 Q42 110 50 86 Z", "#4f3f5c", 3) + p("M90 86 Q84 82 79 84 L83 129 Q89 128 92 127 Q98 110 90 86 Z", "#4f3f5c", 3)
    + p("M58 93 L82 93 L86 130 Q70 136 54 130 Z", "#8a5a32", 3) + p("M63 112 L77 112 L76 123 L64 123 Z", "#7a4c28", 2)
    + ln("M58 93 L55 84 M82 93 L85 84", "#5a3a22", 3.5) + `<circle cx="59" cy="95" r="2.2" fill="#d9b44a" stroke="${INK}" stroke-width="1.5"/><circle cx="81" cy="95" r="2.2" fill="#d9b44a" stroke="${INK}" stroke-width="1.5"/>`;
  MONSTER_LOOK.dwarf = {face:front, head:side(false), headHurt:side(true), skin:SK, belly:false, body:"#efe4cf", feet:"#5a3e2e",
    tail: p("M54 30 Q38 62 46 100 L58 97 Q53 70 60 40 Z", HR, 3),                // 後面的長髮，從身體左後方露出來
    anchor: {head:[54,26,1.05], neck:[73,94]}, extra: casual + braid(73,82,3,1.1)};
  // 鎧甲：整隻一張圖（140×150，腳底 y≈140），大型單位在戰場上會放大 1.45 倍，所以線畫 2.4（放大後≈3.5）
  const q=(d,f,w=2.4)=>`<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const fist = dx => q(`M${2+dx} 92 L${18+dx} 84 L${34+dx} 92 L${34+dx} 110 L${18+dx} 118 L${2+dx} 110 Z`, "#e0923a")
    + q(`M${8+dx} 96 L${20+dx} 92 L${28+dx} 98 L${28+dx} 108 L${20+dx} 112 L${8+dx} 108 Z`, "#8c919b") + ln(`M${16+dx} 98 L${16+dx} 106 M${21+dx} 97 L${21+dx} 107`, INK, 1.8);
  const suit = hurt =>
      q("M40 102 L62 102 L63 126 L40 126 Z", "#5f6470") + q("M78 102 L100 102 L100 126 L77 126 Z", "#5f6470")
    + q("M28 124 L64 122 L66 138 L27 140 Z", "#6f7480") + q("M76 122 L108 120 L114 136 L78 138 Z", "#6f7480") + ln("M32 129 L62 127 M80 127 L108 125", "#8c919b", 2)
    + q("M28 56 Q70 44 112 56 L114 100 Q70 112 26 100 Z", "#5f6470")
    + q("M50 62 Q70 56 90 62 L88 90 L70 98 L52 90 Z", "#c9cdd4") + ln("M62 70 L62 86 M78 70 L78 86", "#9aa0aa", 2.2)
    + `<circle cx="40" cy="80" r="2.4" fill="${INK}"/><circle cx="100" cy="80" r="2.4" fill="${INK}"/>`
    + q("M27 96 Q70 108 113 96 L113 106 Q70 118 27 106 Z", "#3e3a3c") + `<rect x="64" y="102" width="12" height="9" rx="1.5" fill="#d9b44a" stroke="${INK}" stroke-width="2"/>`
    + q("M48 50 Q70 42 92 50 L90 58 Q70 52 50 58 Z", "#3e3a3c")
    + q("M6 64 Q4 36 28 34 Q50 34 50 56 L48 66 Z", "#e0923a") + ln("M14 46 Q24 38 36 40", "#f4b868", 3) + q("M6 64 L48 64 L46 74 L8 76 Z", "#8c919b")
    + q("M134 64 Q136 36 112 34 Q90 34 90 56 L92 66 Z", "#e0923a") + ln("M104 40 Q116 38 126 46", "#f4b868", 3) + q("M134 64 L92 64 L94 74 L132 76 Z", "#8c919b")
    + fist(0) + fist(104)
    + `<svg x="44" y="-4" width="54" height="54" viewBox="0 0 100 100" overflow="visible">${sideInner(hurt)}</svg>`
    + p("M60 50 L54 46 L60 42 L66 46 Z", HR, 2);                                  // 辮子尾巴塞進領口
  const armorFront = svg(q("M4 100 Q6 76 26 74 L74 74 Q94 76 96 100 Z", "#5f6470", 3) + q("M2 92 Q0 70 18 68 Q32 68 32 84 Z M98 92 Q100 70 82 68 Q68 68 68 84 Z", "#e0923a", 3)
    + `<g transform="translate(50 50) scale(.82) translate(-50 -56)">${frontInner}</g>`);
  MONSTER_LOOK.dwarf_armored = {kind:"dwarf_armored", size:"大型", art:suit(false), face:armorFront,
    render:o=>undeadStaticDollSVG({...o, look:{...o.look, art:(o.down||o.anim?.k==="hurt") ? suit(true) : suit(false)}})};
}
