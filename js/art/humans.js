/* 人類（GPT 畫、大爺 10-10 給的素材包，香香接成紙娃娃資料）：只有外觀，沒有數值、敵人配置
   大爺：人類素材是延伸各種族的基礎（精靈耳就是第一個例子）。頭比四小隻小、身體比較高、有脖子
   - humanLook({sex, hair, beard, ears, hairColor, beardColor, skin}) 組出一種外觀；性別只是展示分類，髮型可以跨用
   - 疊的順序照素材說明：後髮（畫在身體後面，用 tail 的位置）→ 耳朵 → 臉 → 前髮 → 鬍子
   - 女性身體比較窄：身上的衣服、護甲照素材的 outfit-fit 一起縮（gearFit）
   - 平民服：素材裡的衣服，做成可以穿的衣服（數值暫定，香香）
   原圖朝右（10-21 統一規格：所有單位原圖朝右，要朝左就由 face:-1 翻）；不要永久翻轉來源 */
const HUMAN_PARTS = {"hair": {"male-01": {"back": "<g id=\"male-hair-01-back\"></g>", "front": "<g id=\"male-hair-01-front\"><path d=\"M41 40 L41 25 L50 27 L52 15 L64 19 L75 12 L81 19 L94 20 L100 35 L95 45 L88 33 L55 32 L47 45Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "俐落短髮"}, "male-02": {"back": "<g id=\"male-hair-02-back\"></g>", "front": "<g id=\"male-hair-02-front\"><path d=\"M40 42 Q38 18 62 13 Q86 8 98 26 L99 42 L89 33 L79 24 Q59 40 45 35Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "側分髮"}, "male-03": {"back": "<g id=\"male-hair-03-back\"></g>", "front": "<g id=\"male-hair-03-front\"><path d=\"M41 43 L40 26 Q47 10 69 11 Q94 10 99 32 L96 43 L87 30 Q69 24 52 32 L47 44Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M49 26 Q64 16 85 23\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "後梳髮"}, "male-04": {"back": "<g id=\"male-hair-04-back\"></g>", "front": "<g id=\"male-hair-04-front\"><path d=\"M40 43 Q31 34 40 28 Q34 19 46 18 Q43 7 56 12 Q64 1 73 11 Q85 4 89 16 Q103 13 100 27 Q109 34 97 45 L88 34 Q77 39 67 31 Q56 40 46 34Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "捲髮"}, "male-05": {"back": "<g id=\"male-hair-05-back\"></g>", "front": "<g id=\"male-hair-05-front\"><path d=\"M40 42 Q36 24 52 15 Q72 4 90 19 L99 34 L94 43 L86 30 Q66 27 50 33 L47 43Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M39 25 Q22 23 27 12 Q35 4 44 16Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "束髮"}, "female-01": {"back": "<g id=\"female-hair-01-back\"><path d=\"M39 34 Q39 12 66 12 Q95 9 101 35 L99 92 L85 88 L76 69 L52 86 L35 90Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-01-front\"><path d=\"M40 42 L45 24 Q60 8 82 15 L99 28 L99 45 L88 34 L83 26 Q62 43 43 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "側分長髮"}, "female-02": {"back": "<g id=\"female-hair-02-back\"><path d=\"M39 34 Q40 9 71 11 Q99 13 101 38 L100 76 L88 79 L80 67 L49 75 L36 73Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-02-front\"><path d=\"M39 42 Q38 17 68 12 Q96 12 99 40 L85 31 L70 25 Q57 39 43 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "短鮑伯"}, "female-03": {"back": "<g id=\"female-hair-03-back\"><path d=\"M38 35 Q39 10 69 10 Q99 10 101 38 L101 93 L82 91 L52 92 L35 93Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-03-front\"><path d=\"M40 41 L43 24 Q69 10 95 25 L98 42 L83 40 L78 31 L74 40 L59 40 L55 32 L51 41Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "齊瀏海長髮"}, "female-04": {"back": "<g id=\"female-hair-04-back\"><path d=\"M45 26 Q24 9 24 35 L21 76 L30 91 L44 78 L40 46Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-04-front\"><path d=\"M40 43 Q39 15 67 11 Q94 10 99 32 L96 44 L85 30 Q68 28 48 35 L46 44Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "高馬尾"}, "female-05": {"back": "<g id=\"female-hair-05-back\"><path d=\"M43 59 Q25 53 27 73 L23 94 Q40 96 47 79 L48 66Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-05-front\"><path d=\"M40 42 Q39 16 68 13 Q95 13 99 36 L96 44 L88 33 L80 27 Q59 42 44 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "低馬尾"}, "female-06": {"back": "<g id=\"female-hair-06-back\"><path d=\"M43 34 Q23 22 24 44 L21 79 L30 88 L44 70Z M96 33 Q114 23 113 45 L118 77 L108 86 L98 65Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-06-front\"><path d=\"M40 42 Q39 15 69 11 Q96 12 99 41 L85 33 L73 24 L62 34 L44 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "雙馬尾"}, "female-07": {"back": "<g id=\"female-hair-07-back\"><path d=\"M39 22 Q26 10 37 3 Q50 -3 56 11Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-07-front\"><path d=\"M40 43 Q38 19 64 12 Q93 8 99 34 L95 44 L86 29 Q63 27 47 37 L45 45Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "盤髮"}, "female-08": {"back": "<g id=\"female-hair-08-back\"><path d=\"M39 32 Q40 11 68 11 Q96 9 101 34 L102 51 Q114 64 103 73 Q115 87 101 95 L84 87 L77 70 L51 83 Q38 100 28 88 Q22 77 34 68 Q25 53 37 46Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-08-front\"><path d=\"M40 43 Q37 19 64 13 Q90 8 98 34 L96 45 L84 29 Q72 43 60 33 Q51 43 43 37Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "波浪長髮"}, "female-09": {"back": "<g id=\"female-hair-09-back\"><path d=\"M43 55 Q30 64 38 73 Q27 81 36 89 Q30 102 44 107 Q56 99 47 90 Q57 81 47 74 Q56 65 49 58Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-09-front\"><path d=\"M40 43 Q38 17 67 12 Q96 10 99 36 L95 44 L86 31 L78 24 Q58 42 44 37Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "單側辮髮"}, "female-10": {"back": "<g id=\"female-hair-10-back\"><path d=\"M38 34 Q39 11 68 12 Q98 12 101 35 L101 89 L89 93 L79 72 L49 84 L35 91Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "front": "<g id=\"female-hair-10-front\"><path d=\"M40 42 Q40 20 66 13 Q92 13 99 36 L95 44 L84 28 L72 23 Q61 37 45 36Z\" fill=\"var(--hair-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M45 30 Q63 44 86 29\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "精靈式半束髮"}}, "beards": {"01": {"art": "<g id=\"beard-01\"><path d=\"M76 60 Q67 56 61 64 Q67 69 75 65 L79 62 Q82 65 88 66 L93 61 Q84 57 79 60Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "八字鬍"}, "02": {"art": "<g id=\"beard-02\"><path d=\"M68 68 Q79 72 88 66 L86 79 L78 85 L70 79Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "山羊鬍"}, "03": {"art": "<g id=\"beard-03\"><path d=\"M44 52 L53 60 L58 69 Q75 76 89 65 L99 53 L97 68 Q91 81 77 84 Q55 83 45 67Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "短絡腮鬍"}, "04": {"art": "<g id=\"beard-04\"><path d=\"M44 53 L52 60 L59 67 Q75 73 90 64 L99 53 L97 73 L91 89 L80 98 L73 92 L65 95 L52 81 L45 68Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "長鬍鬚"}, "05": {"art": "<g id=\"beard-05\"><path d=\"M47 59 L59 68 Q78 75 93 62 L96 73 L84 84 Q91 89 82 94 Q90 101 79 107 Q66 104 74 96 Q65 90 73 84 L58 80Z\" fill=\"var(--beard-color, #6b4a35)\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M74 92 L84 92 M74 101 L83 101\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "name": "編辮鬍"}}, "ears": {"human": "<g id=\"ears-human\"><path d=\"M44 43 L35 39 L36 51 L45 57Z\" fill=\"var(--skin-color, #e8bb9b)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>", "elf": "<g id=\"ears-elf\"><path d=\"M45 43 L23 29 L30 49 L45 57Z\" fill=\"var(--skin-color, #e8bb9b)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M30 37 L40 49\" fill=\"none\" stroke=\"#2a2630\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g>"}, "base": {"male": {"body": "<g id=\"human-body\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\"><g transform=\"\"><path d=\"M52 87 Q69 77 88 88 L92 126 L82 134 L56 134 L47 122Z\" fill=\"#bba795\" /><path d=\"M58 127 L58 137 M81 127 L81 137\" stroke=\"#6b4a35\" stroke-width=\"9\" /><ellipse cx=\"57\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /><ellipse cx=\"83\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /></g></g>", "neck": "<path id=\"human-neck\" d=\"M63 74 L63 86 Q73 94 81 84 L81 75Z\" fill=\"#e8bb9b\" stroke=\"#2a2630\" stroke-width=\"3\" />", "tunic": "<g id=\"civilian-tunic\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M48 85 Q70 78 92 86 L96 107 L92 129 Q70 138 47 130 L43 107Z\" fill=\"#638a83\" /><path d=\"M59 83 L71 96 L82 83\" fill=\"none\" stroke=\"#bed0b8\" stroke-width=\"2.5\" /><path d=\"M47 111 Q71 118 94 110\" fill=\"none\" stroke=\"#6b4a35\" stroke-width=\"5\" /><path d=\"M67 111 L77 112 L77 118 L67 117Z\" fill=\"#bda366\" stroke-width=\"1.5\" /><path d=\"M71 97 L73 109 M72 119 L72 133\" fill=\"none\" stroke=\"#426963\" stroke-width=\"2\" /></g>", "fit": "", "headAttr": "stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" transform=\"translate(72 78) scale(0.65) translate(-72 -78)\"", "face": "<path d=\"M43 37 Q44 15 68 16 Q93 16 97 37 L99 54 Q96 71 77 78 Q57 78 44 63Z\" fill=\"#e8bb9b\" /><ellipse cx=\"63\" cy=\"48\" rx=\"5\" ry=\"6.5\" fill=\"#2a2630\" stroke=\"none\" /><ellipse cx=\"87\" cy=\"46\" rx=\"4\" ry=\"5.5\" fill=\"#2a2630\" stroke=\"none\" /><circle cx=\"64\" cy=\"47\" r=\"1.7\" fill=\"#fff2dd\" stroke=\"none\" /><circle cx=\"87\" cy=\"45\" r=\"1.4\" fill=\"#fff2dd\" stroke=\"none\" /><path d=\"M76 53 L83 57 L77 59 M65 65 Q75 70 85 63\" fill=\"none\" stroke-width=\"2\" /><path d=\"M57 38 L68 40 M83 37 L91 37\" fill=\"none\" stroke=\"#6b4a35\" stroke-width=\"3\" />", "arms": "<g id=\"human-arms\" transform=\"\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linecap=\"round\"><path d=\"M48 92 L40 105 M91 92 L100 105\" stroke=\"#638a83\" stroke-width=\"9\" /><circle cx=\"40\" cy=\"107\" r=\"7.5\" fill=\"#e8bb9b\" /><circle cx=\"100\" cy=\"107\" r=\"7.5\" fill=\"#e8bb9b\" /></g>"}, "female": {"body": "<g id=\"human-body\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\"><g transform=\"translate(70 0) scale(.88 1) translate(-70 0)\"><path d=\"M55 86 Q70 80 85 86 Q93 96 86 104 L87 113 Q89 121 94 128 L84 134 L54 134 L46 128 Q53 119 53 111 L54 104 Q47 94 55 86Z\" fill=\"#bba795\" /><path d=\"M58 127 L58 137 M81 127 L81 137\" stroke=\"#6b4a35\" stroke-width=\"9\" /><ellipse cx=\"57\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /><ellipse cx=\"83\" cy=\"138\" rx=\"10\" ry=\"4.5\" fill=\"#6b4a35\" /></g></g>", "neck": "<path id=\"human-neck\" d=\"M63 74 L63 86 Q73 94 81 84 L81 75Z\" fill=\"#e8bb9b\" stroke=\"#2a2630\" stroke-width=\"3\" />", "tunic": "<g id=\"civilian-tunic\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><path d=\"M54 85 Q70 80 86 86 Q95 96 87 104 L89 114 Q91 123 97 129 Q70 140 43 130 Q49 121 51 113 L53 104 Q46 96 54 85Z\" fill=\"#638a83\" /><path d=\"M61 84 L71 96 L80 84\" fill=\"none\" stroke=\"#bed0b8\" stroke-width=\"2.5\" /><path d=\"M51 112 Q71 117 90 112\" fill=\"none\" stroke=\"#6b4a35\" stroke-width=\"5\" /><path d=\"M67 111 L77 112 L77 118 L67 117Z\" fill=\"#bda366\" stroke-width=\"1.5\" /><path d=\"M71 97 L72 109 M72 119 L72 133\" fill=\"none\" stroke=\"#426963\" stroke-width=\"2\" /><path d=\"M56 98 Q62 104 69 100 M75 100 Q81 104 87 98\" fill=\"none\" stroke=\"#426963\" stroke-width=\"2\" stroke-linecap=\"round\" /></g>", "fit": "translate(70 0) scale(.88 1) translate(-70 0)", "headAttr": "stroke=\"#2a2630\" stroke-width=\"3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" transform=\"translate(72 78) scale(.65 .64) translate(-72 -78)\"", "face": "<path d=\"M43 37 Q44 15 68 16 Q93 16 97 37 L99 54 Q96 71 77 78 Q57 78 44 63Z\" fill=\"#e8bb9b\" /><ellipse cx=\"63\" cy=\"48\" rx=\"5\" ry=\"6.5\" fill=\"#2a2630\" stroke=\"none\" /><ellipse cx=\"87\" cy=\"46\" rx=\"4\" ry=\"5.5\" fill=\"#2a2630\" stroke=\"none\" /><circle cx=\"64\" cy=\"47\" r=\"1.7\" fill=\"#fff2dd\" stroke=\"none\" /><circle cx=\"87\" cy=\"45\" r=\"1.4\" fill=\"#fff2dd\" stroke=\"none\" /><path d=\"M76 53 L83 57 L77 59 M65 65 Q75 70 85 63\" fill=\"none\" stroke-width=\"2\" /><path d=\"M58 39 L67 40 M84 38 L90 38\" fill=\"none\" stroke=\"#59403a\" stroke-width=\"2\" /><path d=\"M58 46 L55 44\" fill=\"none\" stroke-width=\"2\" />", "arms": "<g id=\"human-arms\" transform=\"translate(70 0) scale(.88 1) translate(-70 0)\" stroke=\"#2a2630\" stroke-width=\"3\" stroke-linecap=\"round\"><path d=\"M54 92 L44 105 M86 92 L96 105\" stroke=\"#638a83\" stroke-width=\"9\" /><circle cx=\"44\" cy=\"107\" r=\"7\" fill=\"#e8bb9b\" /><circle cx=\"96\" cy=\"107\" r=\"7\" fill=\"#e8bb9b\" /></g>"}}};
ARMOR_ART["平民服"] = {body:HUMAN_PARTS.base.male.tunic};
// 大爺 10-22：人類表情改嚴肅一點（眉毛往中間壓、加粗，嘴巴拉平）；側臉、正面一起改
HUMAN_PARTS.base.male.face = HUMAN_PARTS.base.male.face.replace('M65 65 Q75 70 85 63','M66 66 Q75 64 84 65').replace('M57 38 L68 40 M83 37 L91 37','M57 36 L68 41 M82 40 L91 36').replace('M57 36 L68 41 M82 40 L91 36" fill="none" stroke="#6b4a35" stroke-width="3"','M57 36 L68 41 M82 40 L91 36" fill="none" stroke="#6b4a35" stroke-width="4.6" stroke-linecap="round"');
HUMAN_PARTS.base.female.face = HUMAN_PARTS.base.female.face.replace('M65 65 Q75 70 85 63','M66 66 Q75 64 84 65').replace('M58 39 L67 40 M84 38 L90 38','M58 37 L67 41 M83 40 L90 37').replace('M58 37 L67 41 M83 40 L90 37" fill="none" stroke="#59403a" stroke-width="2"','M58 37 L67 41 M83 40 L90 37" fill="none" stroke="#59403a" stroke-width="3.6" stroke-linecap="round"');
const HUMAN_FEMALE_SHAPE = {id:"human-female",
  d:"M54 85 Q70 80 86 86 Q95 96 87 104 L89 114 Q91 123 97 129 Q70 140 43 130 Q49 121 51 113 L53 104 Q46 96 54 85Z",
  edge:"M48.5 92 Q46 96 53 104 L51 113 Q49 121 43 130 Q70 140 97 129 Q91 123 89 114 L87 104 Q95 96 92.5 92",
  // 胸甲、半身板甲的胸板原本是照圓桶身體畫的橢圓，女性換成跟著胸線往外、腰部收進來的形狀（大爺 10-22）
  swap:[["M49 85 Q70 75 91 85 Q93 104 84 114 Q70 120 56 114 Q47 104 49 85 Z", "M50 85 Q70 77 90 85 Q96 96 87 104 L86 110 Q70 118 54 110 L53 104 Q44 96 50 85 Z"],
        ['<ellipse cx="62" cy="97" rx="4" ry="6"', '<ellipse cx="60" cy="95" rx="4" ry="5"']]};
var humanLook = function({sex="male", hair="01", beard=null, ears="human", hairColor="#6b4a35", beardColor=hairColor, skin="#e8bb9b"}={}){
  const B = HUMAN_PARTS.base[sex], H = HUMAN_PARTS.hair[`${sex}-${hair}`] || HUMAN_PARTS.hair[`${sex}-01`];
  const col = s => (s||"").replace(/var\(--hair-color,[^)]*\)/g, hairColor).replace(/var\(--beard-color,[^)]*\)/g, beardColor).replace(/var\(--skin-color,[^)]*\)/g, skin);
  const face = B.face.replace(/#e8bb9b/g, skin).replace(/stroke="#(6b4a35|59403a)"/g, `stroke="${hairColor}"`);   // 10-22 大爺：側臉眉毛跟著髮色
  const inner = f => `<g ${B.headAttr}>${col(HUMAN_PARTS.ears[ears])}${f}${col(H.front)}${beard ? col(HUMAN_PARTS.beards[beard].art) : ""}</g>`;
  const hurtFace = face.replace(/<ellipse cx="(63|87)" cy="(4[68])"[^>]*\/>/g, (m,x,y)=>`<path d="M${x-5} ${y-5} L${+x+5} ${+y+5} M${+x+5} ${y-5} L${x-5} ${+y+5}" stroke="#2a2630" stroke-width="3"/>`).replace(/<circle cx="(64|87)" cy="4[57]"[^>]*\/>/g, "");
  const svg = g => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
  const placed = f => `<g transform="scale(1.3158) translate(-32 -6)">${inner(f)}</g>`;
  return {face: svg(`<g transform="translate(50 54) scale(2.3) translate(-71 -57)">${inner(face)}</g>`),
    head: svg(placed(face)), headHurt: svg(placed(hurtFace)),
    body:"#bba795", skin, feet:"#6b4a35", belly:false,
    tail: `<g ${B.headAttr}>${col(H.back)}</g>`,                                  // 後髮：畫在身體後面
    bodyArt: B.body + B.neck.replace(/#e8bb9b/g, skin), gearFit: B.fit || "",   // 10-22 大爺：手臂拿掉，跟其他紙娃娃一樣只有浮空的手
    gearShape: sex==="female" ? HUMAN_FEMALE_SHAPE : null,                      // 10-22：女性護甲照腰身、臀部的輪廓（跟素材的平民服同一個形狀）
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

// 矮人大爺（大爺 10-22 給了兩張戰棋原圖：便服、穿鎧甲）：原圖就是大爺要的造型，香香照原圖描成遊戲的畫風
//   大爺是 145cm 的矮小女黑暗精靈，「鬍子」是兩側頭髮編成辮子垂到胸前（沒有八字鬍）
//   照原圖：米白長髮垂到肩、尖耳、發亮的圓眼鏡（看不到眼睛）、胸前的格紋辮子；臉比原圖小一點、沒有手臂（只有浮空的手）
//   便服：紫色長外套＋白襯衫＋吊帶皮圍裙（正面）；鎧甲：大型體型（2×2），深灰板甲＋亮灰胸板＋橘色大護肩＋大鐵拳，頭微微朝右
// 只有外觀，沒有數值、沒有放進任何戰鬥（要不要上場、什麼時候上場再跟大爺確認）
{
  const INK="#2a2630", SK="#7a4f33", SKD="#5e3a24", HR="#f3e6cf", HRD="#d8c7a6", GL="#c9932f", GOLD="#d9b44a";
  const p=(d,f,w=3)=>`<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const ln=(d,c=HRD,w=1.8)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const svg=g=>`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
  // 發亮的圓眼鏡（原圖：鏡片整片發光、看不到眼睛）；受傷＝鏡片裂開＋叉叉
  const lens=(x,y,r,hurt,w=2.4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${hurt?"#d8cfae":"#fff1b8"}" stroke="${INK}" stroke-width="${w}"/><circle cx="${x}" cy="${y}" r="${r-1.6}" fill="none" stroke="${GL}" stroke-width="${w*.75}"/>`
    + (hurt ? `<path d="M${x-r*.45} ${y-r*.45} L${x+r*.45} ${y+r*.45} M${x+r*.45} ${y-r*.45} L${x-r*.45} ${y+r*.45}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/>`
            : `<circle cx="${x}" cy="${y}" r="${r*.42}" fill="#fffbe8"/>`);
  // 頭（紙娃娃座標畫，放進 100×100 的頭圖；跟人類的 placed 一樣換算）。k＝臉縮小的比例（以下巴為中心）
  const headDoll = (hurt, k=.86) => `<g transform="translate(70 68) scale(${k}) translate(-70 -68)">`
    + p("M33 24 L48 31 L45 41 Z", SK) + ln("M37 26 L46 32", SKD) + p("M107 22 L92 30 L95 40 Z", SK) + ln("M103 24 L94 31", SKD)   // 尖耳朝兩側斜上
    + p("M51 36 Q50 20 70 18 Q90 20 89 36 L88 52 Q85 66 70 69 Q55 66 52 52 Z", SK)                                            // 臉
    + p("M46 46 Q42 18 58 10 Q70 4 82 10 Q98 18 94 46 L89 36 L86 25 L82 31 L78 21 L74 29 L70 19 L66 29 L62 21 L58 31 L54 25 L51 36 Z", HR)   // 頭頂＋鋸齒瀏海
    + ln("M60 12 Q70 8 80 12")
    + lens(62,37,6.4,hurt) + lens(78,37,6.4,hurt) + ln("M68.4 37 L71.6 37", INK, 2.4) + ln("M55.6 36 L49 34 M84.4 36 L91 34", GL, 2.2)
    + p("M68.5 44 Q70 42.5 71.5 44 Q71.5 47 70 47.5 Q68.5 47 68.5 44 Z", SKD, 1.8)
    + ln(hurt ? "M66 53 Q70 50.5 74 53" : "M66 52.5 Q70 54 74 52.5", INK, 2)
    + p("M51 40 Q49 58 60 70 L66 71 L64 61 Q57 53 57 43 Z", HR, 2.6) + p("M89 40 Q91 58 80 70 L74 71 L76 61 Q83 53 83 43 Z", HR, 2.6)   // 兩側頭髮編的鬍子
    + ln("M52 48 L56 51 M53 56 L58 59 M57 63 L62 66 M88 48 L84 51 M87 56 L82 59 M83 63 L78 66")
    + p("M62 64 Q70 70 78 64 L76 72 Q70 75 64 72 Z", HR, 2.4) + `<rect x="65" y="67" width="10" height="4.5" rx="1.5" fill="${GOLD}" stroke="${INK}" stroke-width="1.8"/>`
    + `</g>`;
  const asHead = g => svg(`<g transform="scale(1.3158) translate(-32 -6)">${g}</g>`);
  // 胸前的格紋辮子（原圖：一整片交叉編的辮子，金扣收尾）
  const lattice = (x, y0, y1, w=7) => p(`M${x-w} ${y0} L${x+w} ${y0} L${x+w*.8} ${y1-6} L${x} ${y1} L${x-w*.8} ${y1-6} Z`, HR, 2.4)
    + ln(Array.from({length:Math.floor((y1-y0-6)/5)},(_,i)=>`M${x-w*.85} ${y0+3+i*5} L${x+w*.85} ${y0+8+i*5} M${x+w*.85} ${y0+3+i*5} L${x-w*.85} ${y0+8+i*5}`).join(" "), "#b9a88a", 1.4)
    + `<rect x="${x-w*.75}" y="${y1-10}" width="${w*1.5}" height="4.5" rx="1.5" fill="${GOLD}" stroke="${INK}" stroke-width="1.8"/>`;
  // 便服身體（取代紙娃娃的圓身體）：紫色長外套、白襯衫、吊帶皮圍裙
  const coat = p("M50 72 Q70 64 90 72 Q97 98 99 128 Q70 137 41 128 Q43 98 50 72 Z", "#4f3f5c", 3.2)
    + p("M59 72 Q70 69 81 72 L84 129 Q70 132 56 129 Z", "#efe4cf", 2.6)
    + p("M57 92 L83 92 L87 130 Q70 135 53 130 Z", "#8a5a32", 2.8) + p("M63 111 L77 111 L76 122 L64 122 Z", "#7a4c28", 2)
    + ln("M58 92 L60 72 M82 92 L80 72", "#5a3a22", 3.2) + `<circle cx="59" cy="94" r="2.1" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/><circle cx="81" cy="94" r="2.1" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/>`;
  const hairBack = p("M47 30 Q38 52 43 80 L53 77 Q50 58 53 38 Z", HR, 3) + p("M93 30 Q102 52 97 80 L87 77 Q90 58 87 38 Z", HR, 3);   // 長髮垂到肩
  // 正面頭像：直接用頭（臉照原圖大小）
  const face = svg(`<g transform="translate(50 50) scale(1.55) translate(-70 -44)">${hairBack}${headDoll(false,1)}</g>`);
  MONSTER_LOOK.dwarf = {face, head:asHead(headDoll(false)), headHurt:asHead(headDoll(true)), skin:SK, belly:false, body:"#4f3f5c", feet:"#5a3e2e",
    tail: hairBack, bodyArt: coat, extra: lattice(70, 70, 112), anchor: {head:[50,30,.85], neck:[70,92]}};
  // 鎧甲：整隻一張圖（140×150，腳底 y≈139），大型單位在戰場上放大 1.45 倍，線畫 2.4（放大後≈3.5）
  const q=(d,f,w=2.4)=>`<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const fist = (cx, cy, s=1) => q(`M${cx-19*s} ${cy-4} L${cx-8*s} ${cy-16} L${cx+12*s} ${cy-14} L${cx+19*s} ${cy} L${cx+10*s} ${cy+15} L${cx-11*s} ${cy+14} Z`, "#e0923a")
    + q(`M${cx-12*s} ${cy-4} L${cx-5*s} ${cy-10} L${cx+8*s} ${cy-9} L${cx+12*s} ${cy} L${cx+6*s} ${cy+9} L${cx-7*s} ${cy+8} Z`, "#8c919b") + ln(`M${cx-3*s} ${cy-6} L${cx-3*s} ${cy+5} M${cx+3*s} ${cy-6} L${cx+3*s} ${cy+5}`, INK, 1.8);
  const suit = hurt =>
      q("M42 102 L66 102 L66 124 L42 124 Z", "#5f6470") + q("M76 100 L98 100 L98 120 L76 120 Z", "#5f6470")                        // 腿
    + q("M32 122 L70 120 L73 138 L30 139 Z", "#6f7480") + q("M78 116 L112 114 L118 130 L80 133 Z", "#6f7480") + ln("M35 127 L69 125 M82 121 L112 119", "#8c919b", 2)   // 鐵靴（右腳在後面一點）
    + q("M36 44 Q72 34 112 42 L114 98 Q74 110 36 100 Z", "#5f6470")                                                               // 軀幹
    + q("M62 60 Q80 55 98 60 L96 84 L80 94 L64 84 Z", "#c9cdd4") + ln("M74 66 L74 82 M86 66 L86 82", "#9aa0aa", 2.2)                // 亮灰胸板
    + `<circle cx="47" cy="78" r="2.4" fill="${INK}"/><circle cx="106" cy="76" r="2.4" fill="${INK}"/>`
    + q("M38 94 Q74 104 113 92 L113 102 Q74 114 38 104 Z", "#3e3a3c") + `<rect x="72" y="96" width="11" height="9" rx="1.5" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>`   // 腰帶金扣
    + q("M14 62 Q10 36 32 34 Q52 34 53 56 L50 64 Z", "#e0923a") + ln("M21 45 Q30 38 41 40", "#f4b868", 3) + q("M13 60 L51 60 L49 70 L15 72 Z", "#8c919b")      // 左護肩
    + q("M128 58 Q132 32 110 30 Q92 31 93 52 L95 60 Z", "#e0923a") + ln("M103 36 Q115 33 124 41", "#f4b868", 3) + q("M128 56 L94 56 L96 66 L126 68 Z", "#8c919b")  // 右護肩
    + fist(22, 92) + fist(113, 88, .9)                                                                                               // 鐵拳（沒有手臂，浮在兩側）
    + `<svg x="50" y="-6" width="48" height="48" viewBox="0 0 100 100" overflow="visible"><g transform="scale(1.3158) translate(-32 -6)">${hairBack}${headDoll(hurt, .9)}</g></svg>`
    + lattice(76, 38, 70, 6);                                                                                                        // 胸前的辮子
  const armorFace = svg(q("M4 100 Q6 76 26 74 L74 74 Q94 76 96 100 Z", "#5f6470", 3) + q("M2 92 Q0 70 18 68 Q32 68 32 84 Z M98 92 Q100 70 82 68 Q68 68 68 84 Z", "#e0923a", 3)
    + `<g transform="translate(50 46) scale(1.3) translate(-70 -44)">${hairBack}${headDoll(false,1)}</g>`);
  MONSTER_LOOK.dwarf_armored = {kind:"dwarf_armored", size:"大型", art:suit(false), face:armorFace,
    render:o=>undeadStaticDollSVG({...o, look:{...o.look, art:(o.down||o.anim?.k==="hurt") ? suit(true) : suit(false)}})};
}
// 矮人大爺便服（大爺 10-22 第二版）：照原圖的造型（頭、身體的圖樣），整隻改成 45 度側臉朝右；頭跟人類的頭一樣大、身體用紙娃娃的位置
{
  const INK="#2a2630", SK="#7a4f33", SKD="#5e3a24", HR="#f3e6cf", HRD="#d8c7a6", GL="#c9932f", GOLD="#d9b44a", PU="#4f3f5c", PUD="#3d3048";
  const p=(d,f,w=2.6)=>`<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const ln=(d,c=HRD,w=1.6)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const svg=g=>`<svg viewBox="0 0 100 100" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
  const glow=(x,y,rx,ry,hurt)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${hurt?"#d8cfae":"#fff1b8"}" stroke="${INK}" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="${rx-1.3}" ry="${ry-1.3}" fill="none" stroke="${GL}" stroke-width="1.5"/>`
    + (hurt ? `<path d="M${x-rx*.5} ${y-ry*.5} L${x+rx*.5} ${y+ry*.5} M${x+rx*.5} ${y-ry*.5} L${x-rx*.5} ${y+ry*.5}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` : `<ellipse cx="${x}" cy="${y}" rx="${rx*.42}" ry="${ry*.42}" fill="#fffbe8"/>`);
  // 頭（紙娃娃座標，跟人類的頭同一個位置、差不多大）：照原圖——頭髮像頭盔一樣包住整張臉、兩側垂到下巴，
  //   耳朵從頭髮兩側往外橫伸，大大的發亮眼鏡，鬍子是一條一條菱形編的辮子（不是一整團）
  const zig = (x,y0,y1,w=2.6) => { let d=`M${x} ${y0}`; for(let y=y0,i=0;y<y1;y+=3.4,i++) d+=` L${x+(i%2?-w:w)} ${y+3.4}`; return ln(d, "#b9a88a", 1.3); };
  const head = hurt =>
      p("M95 55 L106 49 L102 62 L96 64 Z", SK)                                                                              // 遠側的耳朵
    + p("M48 66 Q44 35 68 29 Q90 25 99 38 Q104 48 101 68 L98 84 L54 86 L50 82 Z", HR)                                       // 頭髮：寬寬一頂，包住整張臉
    + p("M56 50 L96 47 L95 68 Q90 80 77 82 Q63 80 57 70 Z", SK)                                                            // 臉
    + p("M53 54 L57 44 L62 50 L69 35 L76 48 L84 36 L89 47 L94 42 L97 52 Q101 33 80 30 Q56 31 53 54 Z", HR)                  // 鋸齒瀏海（三個大尖）
    + ln("M62 34 Q75 29 88 32")
    + p("M55 57 L37 50 L41 64 L54 66 Z", SK) + ln("M51 58 L42 54 L44 62", SKD)                                           // 近側的耳朵，往外橫伸
    + glow(68,57,7.6,5.6,hurt) + glow(86.5,56,6.2,5.3,hurt) + ln("M75.6 57 L80.3 56.6", INK, 2) + ln("M60.4 57.5 L55 57 M92.7 55.8 L96 55", GL, 2)
    + p("M80 61 Q84 61.5 83.5 64.5 Q81.5 66 80 65", SKD, 1.6)
    + `<path d="M73 66.5 Q78 69 84 66 L83 69 Q78 71 74 69 Z" fill="#3a2620"/>`                                             // 鬍子縫裡露出一點嘴
    + p("M54 61 Q59 66 65 63 Q71 67 76 65 Q78 67 80 65 Q86 68 92 63 Q96 62 98 59 L98 76 Q93 90 78 94 Q61 93 55 80 Z", HR) // 頭髮編的大鬍子
    + zig(60,68,86) + zig(67,68,90) + zig(87,67,90) + zig(93.5,64,82,2.2)                                                  // 一條一條的辮子紋
    + ln("M74 70 L78 74 L82 70 M74 76 L78 80 L82 76 M74 82 L78 86 L82 82", "#b9a88a", 1.3);
  // 胸前的格紋辮子、兩條側辮的金扣
  const lattice = (x,y0,y1,w=6) => p(`M${x-w} ${y0} L${x+w} ${y0} L${x+w*.8} ${y1-5} L${x} ${y1} L${x-w*.8} ${y1-5} Z`, HR, 2.2)
    + ln(Array.from({length:Math.floor((y1-y0-5)/4.5)},(_,i)=>`M${x-w*.8} ${y0+2+i*4.5} L${x+w*.8} ${y0+6.5+i*4.5} M${x+w*.8} ${y0+2+i*4.5} L${x-w*.8} ${y0+6.5+i*4.5}`).join(" "), "#b9a88a", 1.2)
    + `<rect x="${x-w*.75}" y="${y1-9}" width="${w*1.5}" height="4" rx="1.2" fill="${GOLD}" stroke="${INK}" stroke-width="1.6"/>`;
  const cuff = (x,y) => p(`M${x-3} ${y-6} L${x+3} ${y-6} L${x+3} ${y+2} L${x} ${y+6} L${x-3} ${y+2} Z`, HR, 1.8) + `<rect x="${x-4}" y="${y-1}" width="8" height="4" rx="1.2" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/>`;
  // 身體（45 度：前襟、圍裙、辮子往右偏，遠側那半邊窄一點）
  const coat = p("M47 128 Q74 138 99 129 L100 134 Q74 143 46 134 Z", "#efe4cf", 2.4)                                     // 下襬露出來的白襯衫
    + p("M52 90 Q72 82 93 89 Q100 110 100 131 Q74 140 46 131 Q46 110 52 90 Z", PU, 3)                                    // 紫色長外套
    + ln("M60 91 L57 129 M91 92 L95 128", PUD, 2.2)
    + p("M66 88 Q76 85 86 88 L88 131 Q76 134 64 131 Z", "#efe4cf", 2.4)                                                    // 白襯衫
    + p("M63 103 L88 103 L91 132 Q76 137 61 132 Z", "#8a5a32", 2.6) + p("M69 117 L82 117 L81 126 L70 126 Z", "#7a4c28", 1.8)   // 吊帶皮圍裙
    + ln("M64 103 L66 88 M87 103 L85 88", "#5a3a22", 2.6) + `<circle cx="64.5" cy="104.5" r="1.8" fill="${GOLD}" stroke="${INK}" stroke-width="1.3"/><circle cx="87.5" cy="104.5" r="1.8" fill="${GOLD}" stroke="${INK}" stroke-width="1.3"/>`;
  const hairBack = p("M53 62 Q44 82 48 100 L58 98 Q54 84 59 70 Z", HR, 2.6);
  const asHead = g => svg(`<g transform="scale(1.3158) translate(-32 -6)">${g}</g>`);
  MONSTER_LOOK.dwarf = {face: svg(`<g transform="translate(50 52) scale(1.6) translate(-74 -60)">${head(false)}</g>`), head:asHead(head(false)), headHurt:asHead(head(true)),
    skin:SK, belly:false, body:PU, feet:"#5a3e2e", tail:hairBack, bodyArt:coat, extra: lattice(77, 88, 118) + cuff(64,92) + cuff(89,91), anchor:{head:[56,42,.8], neck:[76,92]}};
}
