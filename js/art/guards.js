/* 女貴族的護衛隊（墓地線，大爺 10-28 給的三張立繪 assets/portraits/guard_*.webp；香香照著畫、暫定）
   人類本體（humanLook）＋灰色鐵盔（盔頂一條稜、後面護頸）；身上穿裝備「護衛隊鏈甲衫」：藍色上衣、咖啡色皮帶交叉、皮腰帶
   隊長多一個鐵護肩（立繪上拿劍那個）。原圖朝右 */
(()=>{
 const INK="#2a2630";
 // 鐵盔畫在人類頭的原始座標裡（跟頭髮同一套），再套跟頭一樣的位移，側臉、頭像、受傷臉都對得上
 const helmet = `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
   <path d="M42 38 L39 56 L49 55 L50 38Z" fill="#8b9299"/>
   <path d="M40 36 Q41 12 70 11 Q98 12 99 33 L102 38 L38 38Z" fill="#a3aab1"/>
   <path d="M70 12 Q72 25 70 37 M54 15 Q52 26 54 37" fill="none" stroke="#6f767d" stroke-width="2.5"/>
   <path d="M38 38 L102 38" fill="none" stroke-width="3.5"/></g>`;
 const faceHelmet = `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round"><path d="M4 20 Q6 -16 50 -16 Q94 -16 96 20 L99 25 L1 25Z" fill="#a3aab1"/><path d="M50 -14 Q53 4 50 23 M26 -8 Q22 8 25 23" fill="none" stroke="#6f767d" stroke-width="3"/><path d="M1 25 L99 25" fill="none" stroke-width="4"/></g>`;
 const wrap = (svg, tf) => svg.replace(/<\/svg>\s*$/, `<g transform="${tf}">${helmet}</g></svg>`);
 const withHelmet = L => ({...L,
   face: L.face.replace(/<\/svg>\s*$/, faceHelmet + "</svg>"),   // 頭像是放大的臉：盔沿另外畫在畫框上緣
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
