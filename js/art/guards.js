/* 女貴族的護衛隊（墓地線，大爺 10-28 給的三張立繪 assets/portraits/guard_*.webp；香香照著畫、暫定）
   人類本體（humanLook）＋灰色鐵盔（盔頂一條稜、後面護頸）；身上穿裝備「護衛隊鏈甲衫」：藍色上衣、咖啡色皮帶交叉、皮腰帶
   隊長多一個鐵護肩（立繪上拿劍那個）。原圖朝右 */
(()=>{
 const INK="#2a2630";
 // 鐵盔畫在人類頭的原始座標裡（臉 x 43–99、頭頂 y 15、眉毛 y 37），貼著頭頂戴、盔沿壓在眉毛上方；
 // 戴盔的時候把前髮拿掉（不然頭髮會從盔沿底下戳出來），側臉、頭像、受傷臉都套跟頭一樣的位移（10-28 大爺：沒戴好又太大）
 const helmet = `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
   <path d="M44 35 L42 48 L48 47 L49 35Z" fill="#8b9299"/>
   <path d="M43 35 Q44 12 70 11 Q95 12 97 34Z" fill="#a3aab1"/>
   <path d="M70 12 Q71 23 70 34 M56 14 Q54 24 56 34" fill="none" stroke="#6f767d" stroke-width="2"/>
   <path d="M41 36 Q70 31 100 34 L100 37 Q70 34.5 41 39.5Z" fill="#8b9299"/></g>`;
 // 頭像是另一張正面的臉（js/art/humans.js humanFrontSVG：頭 x 28–72、頭頂 y 26、眉毛 y 44），鐵盔另外照它畫，蓋住前髮
 const frontHelmet = `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
   <path d="M26 42 L24 57 L31 56 L32 42Z M74 42 L76 57 L69 56 L68 42Z" fill="#8b9299"/>
   <path d="M25 43 Q25 17 50 16 Q75 17 75 43Z" fill="#a3aab1"/>
   <path d="M50 17 Q51 30 50 42 M37 20 Q34 31 36 42 M63 20 Q66 31 64 42" fill="none" stroke="#6f767d" stroke-width="2"/>
   <path d="M22 43 Q50 38 78 43 L78 47 Q50 42.5 22 47Z" fill="#8b9299"/></g>`;
 const noHair = svg => svg.replace(/<g id="male-hair-\d+-front">[\s\S]*?<\/g>/g, "");
 const wrap = (svg, tf) => noHair(svg).replace(/<\/svg>\s*$/, `<g transform="${tf}">${helmet}</g></svg>`);
 const withHelmet = L => ({...L,
   face: L.face.replace(/<\/svg>\s*$/, frontHelmet + "</svg>"),
   head: wrap(L.head, "scale(1.3158) translate(-32 -6)"),
   headHurt: wrap(L.headHurt, "scale(1.3158) translate(-32 -6)")});
 MONSTER_LOOK.guard = withHelmet(humanLook({sex:"male", hair:"01", hairColor:"#5a3b26", skin:"#e2b089"}));
 MONSTER_LOOK.guard_archer = withHelmet(humanLook({sex:"male", hair:"02", hairColor:"#4a3020", skin:"#d9a47c"}));
 const cap = withHelmet(humanLook({sex:"male", hair:"01", beard:"01", hairColor:"#5a3b26", beardColor:"#5a3b26", skin:"#e2b089"}));
 MONSTER_LOOK.guard_captain = cap;   // 隊長留鬍子；鐵護肩畫在他的裝備「護衛隊長鏈甲衫」上
 // 護衛隊鏈甲衫：藍上衣＋交叉皮帶＋皮腰帶（數值跟鏈甲衫一樣，見 data/items.js）
 const tunic = `<path d="M50 86 Q70 74 90 86 Q98 110 92 128 L84 125 L78 132 L70 127 L62 132 L56 125 L48 128 Q42 110 50 86 Z" fill="#3f63a8" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
   <path d="M54 88 L86 118 M86 88 L54 118" stroke="#6b4428" stroke-width="5.5" fill="none" stroke-linecap="round"/>
   <path d="M54 88 L86 118 M86 88 L54 118" stroke="${INK}" stroke-width="1.2" fill="none" stroke-dasharray="3 4"/>
   <path d="M48 113 Q70 120 92 113" stroke="#6b4428" stroke-width="6" fill="none"/><rect x="65" y="111" width="10" height="9" rx="1.5" fill="#c9a24a" stroke="${INK}" stroke-width="2"/>`;
 ARMOR_ART["護衛隊鏈甲衫"] = {body:tunic};
 ARMOR_ART["護衛隊長鏈甲衫"] = {body:tunic + `<path d="M84 84 Q98 82 102 96 Q94 100 86 96Z" fill="#a3aab1" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="93" cy="90" r="2.2" fill="#6f767d"/>`};
})();
