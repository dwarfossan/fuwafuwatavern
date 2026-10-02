/* 大爺立繪（只取胸口以上）
   10-02 改版：大爺本人的造型——嬌小的女黑暗精靈、白長髮、紅眼、尖耳、鋸齒牙、小圓眼鏡、
   用頭髮編成的大鬍子（金屬髮扣）、吊帶工作圍裙。照四小隻的簡單風格：粗黑線、平塗
   viewBox 跟舊圖一樣（100 40 490 560），劇情的位置、抱抱放大、商店頭像都不用改 */
const DWARF_SVG = (()=>{
  const INK="#1c1a1a", SKIN="#7d4f3b", SKIN_D="#5f3a2b", HAIR="#f5f0e8", HAIR_D="#d8cfc4",
        RED="#d3262e", GOLD="#d1a33c", SHIRT="#efe2cc", VEST="#3d3160", APRON="#8b5532", STRAP="#6b3c22";
  const line = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
  // 一節一節的辮子：沿著點列放橢圓，前一節壓在後一節上
  const braid = (pts, rx, ry) => pts.map(([x,y,a])=>
    `<g transform="rotate(${a} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${HAIR}" ${line} stroke-width="4"/>
     <path d="M${x-rx*.62} ${y-ry*.35} L${x} ${y+ry*.45} L${x+rx*.62} ${y-ry*.35}" fill="none" stroke="${HAIR_D}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`).join("");
  const mirror = s => `<g transform="translate(690 0) scale(-1 1)">${s}</g>`;   // 以 x=345 左右翻
  const ear = `<path d="M262 262 L132 196 Q170 250 252 306 Z" fill="${SKIN}" ${line}/>
               <path d="M248 270 L170 222 Q196 258 246 292" fill="none" stroke="${SKIN_D}" stroke-width="4" stroke-linecap="round"/>`;
  const sideLock = `<path d="M262 200 C222 282 210 384 220 474 L262 472 C256 392 262 302 282 236 Z" fill="${HAIR}" ${line}/>
                    <path d="M246 290 C236 340 234 400 240 456" fill="none" stroke="${HAIR_D}" stroke-width="3" stroke-linecap="round"/>`;
  const eye = `<path d="M270 262 Q300 236 334 252 Q306 280 270 262 Z" fill="#fff" ${line} stroke-width="4"/>
               <circle cx="306" cy="258" r="10.5" fill="${RED}"/><path d="M306 251 L306 265" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
               <circle cx="302" cy="254" r="2.6" fill="#fff"/>
               <path d="M266 258 Q298 232 338 250" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>
               <path d="M276 226 Q300 220 330 232" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
  const strand = braid([[330,314,-4],[312,316,-14],[294,322,-32],[280,336,-62],[274,354,-86],[278,372,-104],[290,388,-126],[310,398,-150]], 13, 9);
  const mainBraid = braid([[345,392,0],[345,414,0],[345,436,0],[345,458,0],[345,480,0]], 22, 14);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 40 490 560" preserveAspectRatio="xMidYMax meet">
  <!-- 後面的長髮 -->
  <path d="M276 176 C214 214 160 330 142 470 C136 520 152 560 144 600 L546 600 C538 560 554 520 548 470 C530 330 476 214 414 176 Z" fill="${HAIR}" ${line}/>
  <path d="M190 320 C176 410 170 490 172 590 M500 320 C514 410 520 490 518 590 M210 420 C204 480 204 540 208 596 M480 420 C486 480 486 540 482 596" fill="none" stroke="${HAIR_D}" stroke-width="4" stroke-linecap="round"/>
  <!-- 身體：襯衫、背心、吊帶圍裙 -->
  <path d="M168 600 C172 528 206 482 262 466 L428 466 C484 482 518 528 522 600 Z" fill="${SHIRT}" ${line}/>
  <path d="M244 470 L300 600 L390 600 L446 470 L470 482 L470 600 L220 600 L220 482 Z" fill="${VEST}" ${line}/>
  <path d="M272 512 L418 512 L424 600 L266 600 Z" fill="${APRON}" ${line}/>
  <path d="M286 512 L258 468 M404 512 L432 468" stroke="${STRAP}" stroke-width="14" stroke-linecap="round"/>
  <path d="M286 512 L258 468 M404 512 L432 468" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
  <circle cx="286" cy="514" r="9" fill="${GOLD}" ${line} stroke-width="3.5"/><circle cx="404" cy="514" r="9" fill="${GOLD}" ${line} stroke-width="3.5"/>
  <path d="M300 556 L390 556" stroke="${STRAP}" stroke-width="4" stroke-dasharray="7 6"/>
  <!-- 脖子、耳朵、臉 -->
  <path d="M318 350 L372 350 L376 470 L314 470 Z" fill="${SKIN_D}" ${line}/>
  ${ear}${mirror(ear)}
  <ellipse cx="345" cy="266" rx="90" ry="104" fill="${SKIN}" ${line}/>
  <!-- 兩側垂下的頭髮、瀏海 -->
  ${sideLock}${mirror(sideLock)}
  <path d="M252 262 C238 160 292 120 345 120 C400 120 452 160 438 262 C432 212 416 192 400 188 L394 214 L376 182 L362 216 L346 178 L330 214 L314 182 L298 214 L290 190 C274 198 260 222 252 262 Z" fill="${HAIR}" ${line}/>
  <path d="M300 150 C320 140 360 138 384 150" fill="none" stroke="${HAIR_D}" stroke-width="4" stroke-linecap="round"/>
  <!-- 眼睛（紅、半瞇）、眉 -->
  ${eye}${mirror(eye)}
  <!-- 小圓眼鏡：掛在鼻尖，眼睛從上面看人 -->
  <circle cx="314" cy="292" r="20" fill="#fff" fill-opacity=".22" stroke="${GOLD}" stroke-width="4.5"/>
  <circle cx="376" cy="292" r="20" fill="#fff" fill-opacity=".22" stroke="${GOLD}" stroke-width="4.5"/>
  <path d="M334 290 Q345 282 356 290" fill="none" stroke="${GOLD}" stroke-width="4"/>
  <path d="M294 288 L272 280 M396 288 L418 280" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M342 298 Q346 306 352 302" fill="none" stroke="${SKIN_D}" stroke-width="3.5" stroke-linecap="round"/>
  <!-- 鋸齒牙的笑 -->
  <path d="M308 330 Q346 372 382 330 Q346 342 308 330 Z" fill="#3a1416" ${line} stroke-width="4"/>
  <path d="M311 332 L318 343 L325 336 L332 347 L339 338 L345 349 L351 338 L358 347 L365 336 L372 343 L379 332 Q346 341 311 332 Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M328 357 L334 349 L340 359 L346 350 L352 359 L358 349 L364 357" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <!-- 頭髮編成的大鬍子：兩條沿著臉頰的辮子在下巴會合，往下編成一條大辮子，金屬髮扣 -->
  ${strand}${mirror(strand)}
  ${mainBraid}
  <path d="M322 498 L368 498 L366 524 L324 524 Z" fill="${GOLD}" ${line} stroke-width="4"/>
  <path d="M330 506 L360 506" stroke="#8f6b1f" stroke-width="3" stroke-linecap="round"/>
  <path d="M326 524 C312 552 318 584 345 596 C372 584 378 552 364 524 Z" fill="${HAIR}" ${line}/>
  <path d="M338 536 C334 556 336 574 344 586 M352 536 C356 556 354 574 348 586" fill="none" stroke="${HAIR_D}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
})();
