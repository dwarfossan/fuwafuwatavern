/* 女貴族的護衛隊（墓地線，大爺 10-28 給的三張立繪 assets/portraits/guard_*.webp；香香照著畫、暫定）
   頭照立繪重畫（盔跟頭一體），身體沿用人類紙娃娃（humanLook）；身上穿裝備「護衛隊鏈甲衫」：藍色上衣、咖啡色皮帶交叉、皮腰帶
   隊長多一個鐵護肩（立繪上拿劍那個）。原圖朝右 */
(()=>{
 const INK="#2a2630";
 // 頭照立繪重畫（10-28 大爺：要照立繪重畫頭，不是在人類頭上蓋一頂盔）：盔跟頭是一體的
 //   灰色鍋盔（盔頂幾道稜、盔沿一圈、兩側往下包住耳朵）、壓低的粗眉毛、瞪人的眼睛、往下撇的嘴
 //   側臉 3/4 朝右，大小跟人類的頭一樣（頭的範圍約 x 28–78、y 30–95）；身體、手、裝備沿用人類紙娃娃
 const SKIN = {guard:"#e2a878", archer:"#d99c6c", captain:"#e2a878"}, HAIR = "#4a3020";
 const sideHead = (who, hurt) => { const sk = SKIN[who], I = INK;
   const eyes = hurt ? `<path d="M47 67 L56 76 M56 67 L47 76 M64 65 L71 72 M71 65 L64 72" stroke="${I}" stroke-width="3.2" stroke-linecap="round"/>`
     : `<ellipse cx="52" cy="71" rx="4.4" ry="5" fill="#fff" stroke-width="1.6"/><circle cx="53.4" cy="71.6" r="2.6" fill="${I}" stroke="none"/><ellipse cx="68" cy="69.5" rx="3.4" ry="4.2" fill="#fff" stroke-width="1.6"/><circle cx="69" cy="70" r="2.1" fill="${I}" stroke="none"/>`;
   const brow = `<path d="M44 62 L57 66.5 M63 65 L73 61.5" stroke="${HAIR}" stroke-width="4" stroke-linecap="round"/>`;
   const mouth = hurt ? `<path d="M58 87 Q64 82 70 87" fill="none" stroke="${I}" stroke-width="2.4" stroke-linecap="round"/>` : `<path d="M57 86 Q63 83 70 86" fill="none" stroke="${I}" stroke-width="2.6" stroke-linecap="round"/>`;
   const beard = who==="captain" ? `<path d="M57 81 Q63 77 71 81 Q66 83 63 82 Q60 83 57 81Z" fill="${HAIR}" stroke="${I}" stroke-width="1.6" stroke-linejoin="round"/><path d="M40 82 Q46 92 58 94" fill="none" stroke="#b07a52" stroke-width="2" stroke-dasharray="1.5 3" stroke-linecap="round"/>` : "";
   return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="${I}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
     <path d="M34 58 Q33 82 44 90 Q54 96 64 93 Q76 88 78 74 Q80 64 77 56Z" fill="${sk}"/>
     <path d="M34 58 L36 72 L40 66Z" fill="${HAIR}" stroke-width="2"/>
     <path d="M74 73 L78.5 77 L74 79" fill="none" stroke-width="2.2"/>
     ${beard}${brow}${eyes}${mouth}
     <path d="M30 56 L28 76 L37 78 L40 58Z" fill="#8b9299"/>
     <path d="M31 56 Q31 27 55 26 Q77 27 79 53Z" fill="#a3aab1"/>
     <path d="M55 27 Q57 40 55 53 M41 31 Q38 42 40 54 M68 30 Q71 41 69 53" fill="none" stroke="#6f767d" stroke-width="2.4"/>
     <path d="M27 54 Q55 47 83 52 L83 57.5 Q55 53 27 59.5Z" fill="#8b9299"/></g></svg>`; };
 // 頭像（先攻列、狀態卡）：正面
 const frontHead = who => { const sk = SKIN[who], I = INK;
   const beard = who==="captain" ? `<path d="M38 70 Q44 65 50 68 Q56 65 62 70 Q56 73 50 71 Q44 73 38 70Z" fill="${HAIR}" stroke="${I}" stroke-width="1.8" stroke-linejoin="round"/>` : "";
   return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-front="guard"><g stroke="${I}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
     <path d="M27 48 Q27 78 50 86 Q73 78 73 48Z" fill="${sk}"/>
     <path d="M33 52 L46 56 M67 52 L54 56" stroke="${HAIR}" stroke-width="4"/>
     <ellipse cx="41" cy="61" rx="4.2" ry="4.8" fill="#fff" stroke-width="1.6"/><circle cx="41.8" cy="61.5" r="2.5" fill="${I}" stroke="none"/><ellipse cx="59" cy="61" rx="4.2" ry="4.8" fill="#fff" stroke-width="1.6"/><circle cx="58.2" cy="61.5" r="2.5" fill="${I}" stroke="none"/>
     <path d="M50 63 L48 69 L52 69" fill="none" stroke-width="1.8"/>${beard}
     <path d="M43 76 Q50 73 57 76" fill="none" stroke-width="2.2"/>
     <path d="M22 44 L20 66 L29 67 L30 46Z M78 44 L80 66 L71 67 L70 46Z" fill="#8b9299"/>
     <path d="M23 45 Q23 13 50 12 Q77 13 77 45Z" fill="#a3aab1"/>
     <path d="M50 13 Q52 28 50 44 M36 17 Q32 30 34 44 M64 17 Q68 30 66 44" fill="none" stroke="#6f767d" stroke-width="2.2"/>
     <path d="M18 43 Q50 37 82 43 L82 48 Q50 42.5 18 48Z" fill="#8b9299"/></g></svg>`; };
 const guardLook = (who, base) => ({...base, face:frontHead(who), head:sideHead(who, false), headHurt:sideHead(who, true), tail:""});
 // 護衛隊鏈甲衫：藍上衣＋交叉皮帶＋皮腰帶（數值跟鏈甲衫一樣，見 data/items.js）
 const tunic = `<path d="M50 86 Q70 74 90 86 Q98 110 92 128 L84 125 L78 132 L70 127 L62 132 L56 125 L48 128 Q42 110 50 86 Z" fill="#3f63a8" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
   <path d="M54 88 L86 118 M86 88 L54 118" stroke="#6b4428" stroke-width="5.5" fill="none" stroke-linecap="round"/>
   <path d="M54 88 L86 118 M86 88 L54 118" stroke="${INK}" stroke-width="1.2" fill="none" stroke-dasharray="3 4"/>
   <path d="M48 113 Q70 120 92 113" stroke="#6b4428" stroke-width="6" fill="none"/><rect x="65" y="111" width="10" height="9" rx="1.5" fill="#c9a24a" stroke="${INK}" stroke-width="2"/>`;
 ARMOR_ART["護衛隊鏈甲衫"] = {body:tunic};
 MONSTER_LOOK.guard = guardLook("guard", humanLook({sex:"male", skin:SKIN.guard}));
 MONSTER_LOOK.guard_archer = guardLook("archer", humanLook({sex:"male", skin:SKIN.archer}));
 MONSTER_LOOK.guard_captain = guardLook("captain", humanLook({sex:"male", skin:SKIN.captain}));   // 隊長多兩撇鬍子；鐵護肩畫在他的裝備「護衛隊長鏈甲衫」上
 ARMOR_ART["護衛隊長鏈甲衫"] = {body:tunic + `<path d="M84 84 Q98 82 102 96 Q94 100 86 96Z" fill="#a3aab1" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="93" cy="90" r="2.2" fill="#6f767d"/>`};
})();
