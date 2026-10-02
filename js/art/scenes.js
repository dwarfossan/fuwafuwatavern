/* 第一人稱場景背景（從四隻的眼睛看出去） */
function roadAmbushSVG(){
  const INK = "#2a2630";
  // 巢狀 <svg> 不支援 transform，左右翻轉要包在 <g> 裡
  const gob = (x,y,w,flip,weapon)=>{
    const s = storyGoblinSVG(weapon).replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${w*440/350}" `);
    return flip ? `<g transform="translate(${2*x+w} 0) scale(-1 1)">${s}</g>` : s;
  };
  return `<svg viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fbde0"/><stop offset="1" stop-color="#f3dcae"/></linearGradient>
      <linearGradient id="field" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb462"/><stop offset="1" stop-color="#5f8744"/></linearGradient>
    </defs>
    <rect width="1600" height="600" fill="url(#sky)"/>
    <g fill="#fffaf0" opacity=".9">
      <ellipse cx="260" cy="150" rx="90" ry="28"/><ellipse cx="320" cy="135" rx="60" ry="30"/>
      <ellipse cx="1240" cy="110" rx="110" ry="30"/><ellipse cx="1180" cy="98" rx="60" ry="28"/>
    </g>
    <path d="M0 560 Q200 470 420 520 Q640 450 860 510 Q1100 440 1320 500 Q1480 470 1600 520 L1600 600 L0 600 Z" fill="#7a9a52" stroke="${INK}" stroke-width="3"/>
    <rect y="560" width="1600" height="540" fill="url(#field)"/>
    <path d="M0 560 L1600 560" stroke="${INK}" stroke-width="3"/>
    <!-- 往遠方延伸的道路 -->
    <path d="M430 1100 L785 560 L815 560 L1170 1100 Z" fill="#d9c08e"/>
    <path d="M430 1100 L785 560 M1170 1100 L815 560" stroke="#8a6a44" stroke-width="8"/>
    <path d="M800 600 L800 620 M800 680 L800 715 M800 800 L800 850 M800 960 L800 1030" stroke="#c4a877" stroke-width="10" stroke-linecap="round"/>
    ${Array.from({length:40},(_,i)=>{const x=(i*397)%1600, y=600+((i*211)%480); return `<path d="M${x-6} ${y} q3 -12 6 0 q3 -14 6 0" stroke="#4f7a3a" stroke-width="3" fill="none" stroke-linecap="round"/>`}).join("")}
    <!-- 翻倒的馬車與散落的貨物 -->
    <g>
      <path d="M380 690 L640 640 L668 760 L408 810 Z" fill="#9a6a3e" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M394 740 L654 690 M402 776 L662 726" stroke="#6e4a32" stroke-width="5"/>
      <path d="M380 690 Q500 560 640 640" fill="#efe3c8" stroke="${INK}" stroke-width="5"/>
      <path d="M440 650 Q470 610 520 600 M560 612 Q600 618 626 634" stroke="#cbbd9e" stroke-width="4" fill="none"/>
      <circle cx="430" cy="640" r="46" fill="none" stroke="#6e4a32" stroke-width="12"/><circle cx="430" cy="640" r="46" fill="none" stroke="${INK}" stroke-width="3"/>
      <path d="M430 594 L430 686 M384 640 L476 640 M398 608 L462 672 M462 608 L398 672" stroke="#6e4a32" stroke-width="6"/>
      <rect x="640" y="800" width="70" height="56" fill="#b0834f" stroke="${INK}" stroke-width="4"/><path d="M640 828 L710 828 M675 800 L675 856" stroke="#6e4a32" stroke-width="4"/>
      <ellipse cx="340" cy="850" rx="48" ry="30" fill="#e8d6b0" stroke="${INK}" stroke-width="4"/><circle cx="374" cy="846" r="6" fill="#d8733a"/><circle cx="386" cy="860" r="6" fill="#e0766e"/><circle cx="364" cy="866" r="6" fill="#d8733a"/>
    </g>
    <!-- 路邊的草叢（哥布林薩滿躲在裡面；被動察覺有人過的話，劇情裡會晃）
         10-02 移到馬車前面（位置暫定）：原本在 x 80～320，手機的畫面只看得到中間 x 360～1240，草叢整個被切掉
         外層 g 負責位置，內層 .story-bush 給 CSS 晃動用（CSS 的 transform 會蓋掉 SVG 的 transform 屬性） -->
    <g transform="translate(310 110) scale(.9)"><g class="story-bush">
      <ellipse cx="200" cy="668" rx="120" ry="16" fill="#000" opacity=".18"/>
      <circle cx="140" cy="630" r="46" fill="#4f7d42" stroke="${INK}" stroke-width="5"/>
      <circle cx="262" cy="634" r="44" fill="#4f7d42" stroke="${INK}" stroke-width="5"/>
      <circle cx="200" cy="608" r="58" fill="#5a8a48" stroke="${INK}" stroke-width="5"/>
      <path d="M100 664 L300 664" stroke="#4f7d42" stroke-width="10"/>
      <circle cx="180" cy="590" r="14" fill="#7aa864"/><circle cx="252" cy="620" r="9" fill="#7aa864"/><circle cx="128" cy="618" r="8" fill="#7aa864"/>
    </g></g>
    <!-- 三隻哥布林：弓手（後方）、短棒、彎刀（跟戰鬥裡的裝備一致） -->
    ${gob(1000,470,230,true,"bow")}
    ${gob(530,500,250,false,"club")}
    ${gob(760,530,300,false,"scimitar")}
  </svg>`;
}
