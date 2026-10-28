/* 女吸血鬼（10-28 大爺：參考立繪 assets/portraits/vampire_noface.webp 重畫；外觀暫定：香香）
   墓地線、每日委託「夜裡的貴婦」同一隻。原本是 10-10 的大頭娃娃（齊瀏海短髮、自己縮 0.85），改成跟人類一樣大的頭
   - 頭：人類女性的臉（實際大小的座標，不縮放）＋精靈耳、蒼白皮膚、紅眼、小尖牙；前髮側分蓋住額頭，黑長捲髮從背後垂到腰下
   - 衣服：裝備「吸血鬼禮服」——高立領、外黑內紅的長披風、黑禮服紅滾邊、紅馬甲綁帶、前面開衩；項鍊是紅寶石頸鍊
   - 誰穿禮服都一樣（四小隻也能撿來穿）；女吸血鬼自己另外在背後多一片往外飄的披風和長髮（tail）
   原圖朝右 */
(()=>{
 const INK="#2a2630", HAIR="#26212c", SKIN="#ecdde0", RED="#8e2333", REDL="#b8394a", BLK="#2c2530";
 const L = humanLook({sex:"female", hair:"01", ears:"elf", hairColor:HAIR, skin:SKIN});
 // 頭（座標＝紙娃娃座標，跟 js/art/humans.js 的人類頭同一套實際大小）：前髮換成側分，眼睛換紅，加尖牙
 const bangs = `<path d="M51 55 L53.5 42 Q62 31 79 34.5 Q88 38 90.5 47 L90 58 Q87 51 83 47.5 Q76 52 68 50.5 Q61 54 55 59Z" fill="${HAIR}" stroke="${INK}" stroke-width="1.95" stroke-linejoin="round"/>
   <path d="M60 41 Q70 37 80 40" fill="none" stroke="#4a4152" stroke-width="1.3" stroke-linecap="round"/>`;
 const fangs = `<path d="M70.2 69.9 L71.2 72.4 L72.2 69.8 M76.6 69.5 L77.5 71.9 L78.4 69.5" fill="#fff" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`;
 const vampHead = svg => svg
   .replace(/<g id="female-hair-01-front">[\s\S]*?<\/g>/, bangs)
   .replace(/(<ellipse cx="[\d.]+" cy="[\d.]+"[^>]*fill=")#2a2630"/g, '$1#b3243a"')
   .replace(/<\/g><\/g><\/svg>\s*$/, `${fangs}</g></g></svg>`);
 // 背後：黑長捲髮（左後方垂到腰下、右邊從肩後露一點）＋往外飄的披風
 const longHair = `<path d="M50 49 Q49 34 67 33 Q87 31 91 48 Q95 62 92 74 Q97 86 90 97 Q95 107 88 116 L82 110 Q86 100 82 91 Q86 81 83 70 L60 80 Q51 92 56 104 Q47 115 52 127 Q42 129 37 119 Q33 108 40 98 Q33 86 40 74 Q37 60 50 49Z" fill="${HAIR}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
   <path d="M44 78 Q40 90 45 100 M42 106 Q40 116 46 122" fill="none" stroke="#4a4152" stroke-width="1.6" stroke-linecap="round"/>`;
 const capeBack = `<path d="M52 84 Q34 104 22 136 L44 131 L58 137 L74 131 L92 137 L118 136 Q106 104 88 84Z" fill="${BLK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M52 86 Q37 106 27 133 L33 132 Q42 108 55 89Z M88 86 Q103 106 113 133 L107 132 Q98 108 85 89Z" fill="${RED}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
 // 吸血鬼禮服（紙娃娃座標）：誰穿都一樣
 const dress = `<g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
   <path d="M49 84 Q38 104 32 133 L56 131 L84 131 L108 133 Q102 104 91 84Z" fill="${BLK}" stroke-width="3"/>
   <path d="M49 86 Q40 106 36 131 L41 131 Q46 108 53 89Z M91 86 Q100 106 104 131 L99 131 Q94 108 87 89Z" fill="${RED}" stroke-width="1.5"/>
   <path d="M50 86 Q70 77 90 86 Q97 110 96 133 L44 133 Q43 110 50 86Z" fill="#3b3342" stroke-width="3.2"/>
   <path d="M51 90 Q47 110 47 131 M89 90 Q93 110 93 131" fill="none" stroke="${REDL}" stroke-width="1.8"/>
   <path d="M73 112 L78 133 L69 133Z" fill="#5a4c5e" stroke-width="1.6"/>
   <path d="M58 92 Q70 97 82 92 L80 110 Q70 114 60 110Z" fill="${RED}" stroke-width="2"/>
   <path d="M64 96 L76 104 M76 96 L64 104 M65 102 L75 109 M75 102 L65 109" fill="none" stroke="#2a1a20" stroke-width="1.2"/>
   <path d="M45 131 Q70 136 95 131" fill="none" stroke="${REDL}" stroke-width="2.2"/>
   <path d="M55 86 L42 60 L64 80Z M85 86 L98 60 L76 80Z" fill="${BLK}" stroke-width="2.6"/>
   <path d="M56 83 L46 65 L61 79Z M84 83 L94 65 L79 79Z" fill="${REDL}" stroke-width="1.3"/></g>`;
 const choker = `<g stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"><path d="M-9 -2 Q0 2 9 -2" fill="none" stroke="#1d1a22" stroke-width="2.6"/><path d="M0 0 L3 4 L0 8 L-3 4Z" fill="#c4283f"/></g>`;
 ARMOR_ART["吸血鬼禮服"] = {body:dress, neck:choker};
 // 頭像（先攻列、狀態卡）：正面的人類臉（js/art/humans.js humanFrontSVG），一樣換紅眼、加尖牙、蒼白皮膚
 const frontFace = L.face
   .replace(/(<ellipse cx="(41|59)" cy="54"[^>]*fill=")#2a2630"/g, '$1#b3243a"')
   .replace(/<\/svg>\s*$/, `<path d="M45.6 70 L46.6 73.2 L47.6 69.8 M52.4 69.8 L53.4 73.2 L54.4 70" fill="#fff" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/></svg>`);
 MONSTER_LOOK.vampire = {...L, feet:"#2a2430", bodyArt:L.bodyArt.replace(/#6b4a35/g,"#2a2430"), face:frontFace, head:vampHead(L.head), headHurt:vampHead(L.headHurt), tail:capeBack + longHair};
})();
