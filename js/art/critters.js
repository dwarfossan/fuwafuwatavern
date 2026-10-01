/* 小動物頭像（手繪 SVG） */
function critterSVG(id){
  const c = CRITTERS.find(x=>x.id===id).color;
  const eye = (x,y,r=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#1f1a24"/><circle cx="${x+1.3}" cy="${y-1.3}" r="${r/3}" fill="#fff"/>`;
  const blush = `<ellipse cx="32" cy="62" rx="6" ry="3.5" fill="#f08a9a" opacity=".55"/><ellipse cx="68" cy="62" rx="6" ry="3.5" fill="#f08a9a" opacity=".55"/>`;
  let ears="", face="", extra="";
  if(id==="tiger"){
    ears=`<circle cx="25" cy="28" r="12" fill="${c}"/><circle cx="75" cy="28" r="12" fill="${c}"/><circle cx="25" cy="28" r="6" fill="#f3c6cf"/><circle cx="75" cy="28" r="6" fill="#f3c6cf"/>`;
    face=`<circle cx="50" cy="56" r="34" fill="${c}"/>
      <path d="M44 24 L50 36 L56 24" stroke="#3b3a44" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M17 50 L29 53 M16 60 L28 60 M83 50 L71 53 M84 60 L72 60" stroke="#3b3a44" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="50" cy="68" rx="17" ry="12" fill="#ffffff"/>`;
    extra=`${eye(37,50)}${eye(63,50)}<path d="M46 62 L54 62 L50 66 Z" fill="#e0766e"/><path d="M50 66 Q46 71 42 69 M50 66 Q54 71 58 69" stroke="#1f1a24" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  } else if(id==="fox"){
    ears=`<path d="M18 12 L36 36 L16 44 Z" fill="${c}"/><path d="M82 12 L64 36 L84 44 Z" fill="${c}"/><path d="M22 20 L32 36 L21 40 Z" fill="#3a2f3b"/><path d="M78 20 L68 36 L79 40 Z" fill="#3a2f3b"/>`;
    face=`<path d="M14 42 Q50 22 86 42 Q86 74 50 90 Q14 74 14 42 Z" fill="${c}"/><path d="M28 60 Q50 56 72 60 Q64 84 50 90 Q36 84 28 60 Z" fill="#fbead6"/>`;
    extra=`${eye(36,52)}${eye(64,52)}<ellipse cx="50" cy="72" rx="4.5" ry="3.5" fill="#1f1a24"/>`;
  } else if(id==="wolf"){
    ears=`<path d="M20 6 L40 34 L16 40 Z" fill="${c}"/><path d="M80 6 L60 34 L84 40 Z" fill="${c}"/><path d="M23 16 L34 33 L21 37 Z" fill="#6e7690"/><path d="M77 16 L66 33 L79 37 Z" fill="#6e7690"/>`;
    face=`<path d="M14 40 Q50 24 86 40 L82 64 Q66 90 50 92 Q34 90 18 64 Z" fill="${c}"/>
      <path d="M30 58 Q50 52 70 58 Q62 86 50 90 Q38 86 30 58 Z" fill="#eef0f5"/>
      <path d="M40 30 L50 44 L60 30" fill="#eef0f5"/>`;
    extra=`${eye(37,51,4.8)}${eye(63,51,4.8)}
      <path d="M30 48 L44 48.6 L44 43 L30 43 Z M56 48.6 L70 48 L70 43 L56 43 Z" fill="${c}"/>
      <path d="M30 48 L44 48.6 M56 48.6 L70 48" stroke="#1f1a24" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="50" cy="70" rx="5" ry="3.8" fill="#1f1a24"/><path d="M45 78 Q50 81 55 78" stroke="#1f1a24" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  } else {
    // 默默＝狸貓（2026-10-01 大爺給參考圖）：咖啡色、深咖啡眼罩往外下垂、奶油色口鼻；額頭刷痕是默默指定的，保留
    ears=`<circle cx="24" cy="30" r="12" fill="${c}"/><circle cx="76" cy="30" r="12" fill="${c}"/><circle cx="24" cy="30" r="6" fill="#4a3226"/><circle cx="76" cy="30" r="6" fill="#4a3226"/>`;
    face=`<path d="M14 50 Q50 18 86 50 Q86 80 50 88 Q14 80 14 50 Z" fill="${c}"/>
      <path d="M50 30 L46 52 L54 52 Z" fill="#f3e2c8"/>
      <path d="M17 50 Q33 42 48 52 Q42 64 28 66 Q18 62 17 50 Z M83 50 Q67 42 52 52 Q58 64 72 66 Q82 62 83 50 Z" fill="#4a3226"/>
      <ellipse cx="50" cy="70" rx="16" ry="12" fill="#f3e2c8"/>`;
    extra=`${eye(35,53)}${eye(65,53)}<ellipse cx="50" cy="65" rx="4.5" ry="3.5" fill="#1f1a24"/><path d="M47 73 L53 73" stroke="#1f1a24" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${ears}${face}${blush}${extra}</svg>`;
}

/* 3/4 側臉（朝右），戰棋上的紙娃娃用；朝左時整隻鏡像。
   規則：五官右移、遠側眼睛小一點、腮紅貼臉兩側外緣、沒有嘴巴。貓科（嬌嬌）維持圓臉只移五官，而且有貓嘴 ω（嬌嬌指定）
   hurt＝被打中：眼睛換成 X_X（默默的眼睛在黑眼罩上，叉叉用淺色）；happy＝勝利：笑眼 ^ ^ */
function critterSide(id, hurt, happy){
  const c = CRITTERS.find(x=>x.id===id).color, INK="#1f1a24", S="#2a2630";
  const st = `stroke="${S}" stroke-width="3" stroke-linejoin="round"`;
  const xc = id==="raccoon" ? "#fbf4ee" : INK;
  const eye=(x,y,r)=> happy
    ? `<path d="M${x-r*1.3} ${y+r*.5} Q${x} ${y-r*1.4} ${x+r*1.3} ${y+r*.5}" stroke="${xc}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
    : hurt
    ? `<path d="M${x-r*1.25} ${y-r*1.25} L${x+r*1.25} ${y+r*1.25} M${x+r*1.25} ${y-r*1.25} L${x-r*1.25} ${y+r*1.25}" stroke="${xc}" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x+1.2}" cy="${y-1.3}" r="${r/3}" fill="#fff"/>`;
  const blush=(x1,y1,x2,y2)=>`<ellipse cx="${x1}" cy="${y1}" rx="5.5" ry="2.8" fill="#f08a9a" opacity=".6"/><ellipse cx="${x2}" cy="${y2}" rx="3.6" ry="2.3" fill="#f08a9a" opacity=".6"/>`;
  let s = "";
  if(id==="fox"){
    s = `<path d="M14 42 L24 3 L46 32 Z" fill="${c}" ${st}/><path d="M21 36 L25 14 L38 32 Z" fill="#3a2f3b"/>
      <path d="M58 30 L76 3 L85 36 Z" fill="${c}" ${st}/><path d="M65 29 L75 13 L80 33 Z" fill="#3a2f3b"/>
      <g transform="translate(0 6)">
        <path d="M12 42 Q12 24 32 22 L72 21 Q88 23 90 40 L91 50 Q97 56 92 63 Q78 80 56 92 Q38 94 26 80 Q10 64 12 42 Z" fill="${c}" ${st}/>
        <path d="M30 60 Q46 58 58 55 Q76 50 91 51 Q97 57 92 63 Q78 80 56 92 Q40 92 32 78 Q27 68 30 60 Z" fill="#fbead6"/>
        ${eye(40,46,4.4)}${eye(67,44,3.9)}<ellipse cx="89" cy="55" rx="5.2" ry="4" fill="${INK}"/>
        ${blush(18,57,85,46)}
      </g>`;
  } else if(id==="tiger"){
    // 圓臉比其他三隻窄，整顆以臉中心放大 1.15 倍對齊大家的臉寬
    s = `<g transform="translate(50 56) scale(1.15) translate(-50 -56)"><circle cx="27" cy="27" r="12" fill="${c}" ${st}/><circle cx="27" cy="27" r="6" fill="#f3c6cf"/>
      <circle cx="73" cy="25" r="11" fill="${c}" ${st}/><circle cx="73" cy="25" r="5.5" fill="#f3c6cf"/>
      <circle cx="50" cy="56" r="34" fill="${c}" ${st}/>
      <ellipse cx="60" cy="68" rx="16" ry="11.5" fill="#ffffff"/>
      <path d="M50 24 L56 36 L62 24" stroke="#3b3a44" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M17 50 L29 53 M16 59 L28 59 M83 49 L77 51 M84 57 L78 57" stroke="#3b3a44" stroke-width="3.5" stroke-linecap="round"/>
      ${eye(44,50,4.2)}${eye(69,49,3.8)}
      <path d="M56 61 L64 61 L60 65 Z" fill="#e0766e"/>
      <path d="M60 65 Q56.5 70.5 52 68.5 M60 65 Q63 69.5 66.5 68" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${blush(21,66,79,64)}</g>`;
  } else if(id==="wolf"){
    s = `<path d="M14 42 L20 2 L44 30 Z" fill="${c}" ${st}/><path d="M20 36 L22 12 L36 30 Z" fill="#6e7690"/>
      <path d="M58 28 L78 1 L85 35 Z" fill="${c}" ${st}/><path d="M65 28 L77 11 L81 31 Z" fill="#6e7690"/>
      <g transform="translate(0 6)">
        <path d="M12 40 Q12 24 32 22 L72 21 Q88 23 90 40 L91 50 Q97 56 92 63 Q80 78 60 90 Q40 94 28 82 Q12 66 12 40 Z" fill="${c}" ${st}/>
        <path d="M30 60 Q46 58 58 55 Q76 50 91 51 Q97 57 92 63 Q80 78 60 90 Q42 92 32 80 Q27 68 30 60 Z" fill="#eef0f5"/>
        <path d="M49 23 L55 35 L61 23 Z" fill="#eef0f5"/>
        ${eye(40,48,4.6)}${eye(70,46.5,4.2)}
        ${hurt || happy ? "" : `<path d="M34 46.5 L47 47 L47 41.5 L34 41.5 Z M64.5 45.3 L76 44.8 L76 40 L64.5 40 Z" fill="${c}"/>
        <path d="M34 46.5 L47 47 M64.5 45.3 L76 44.8" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`}
        <ellipse cx="89" cy="55" rx="5.2" ry="4" fill="${INK}"/>
        ${blush(18,57,85,46)}
      </g>`;
  } else {
    s = `<circle cx="22" cy="30" r="12" fill="${c}" ${st}/><circle cx="22" cy="30" r="6" fill="#4a3226"/>
      <circle cx="70" cy="23" r="10.5" fill="${c}" ${st}/><circle cx="70" cy="23" r="5" fill="#4a3226"/>
      <path d="M10 54 Q12 22 48 20 Q80 22 87 44 Q95 54 91 64 Q80 82 52 88 Q20 85 12 68 Q8 60 10 54 Z" fill="${c}" ${st}/>
      <path d="M46.2 26 Q47.6 23.7 50.2 24.6 Q55.2 32.5 52.8 44.5 Q49.8 33.5 46.2 26 Z" fill="#f3e2c8"/>
      <path d="M16 52 Q30 42 47 51 Q42 63 28 66 Q18 63 16 52 Z M60 49 Q70 41 81 47 Q78 58 68 60 Q61 57 60 49 Z" fill="#4a3226"/>
      <ellipse cx="74" cy="67" rx="15" ry="11" fill="#f3e2c8"/>
      ${eye(33,52.5,4.2)}${eye(70,49,3.8)}
      <ellipse cx="86" cy="60" rx="4.6" ry="3.6" fill="${INK}"/>
      ${blush(15,65,84,51)}`;
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
}
