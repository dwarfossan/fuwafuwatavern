/* 眉毛（大爺 2026-10-01）：玲玲、默默是往上拱的弧形眉（好奇、隨和），香香是平一點、壓低的眉（冷靜，配半閉眼），嬌嬌是豆眉
   front＝正面頭像、side＝戰場的 3/4 側臉（近側在左、遠側在右而且小一點）。座標跟各自的臉同一個 100×100 畫布
   一般表情保留各隻眉形；其他表情由 critterExpression 畫出 */
const BROWS = {
  fox:     {kind:"line", color:"#9a4f2a", front:["M29 44 Q36 39 43 44","M57 44 Q64 39 71 44"], side:["M33 37 Q40 32 47 36","M62 35 Q67 31 72 34"]},
  wolf:    {kind:"line", color:"#3f4558", front:["M29 40.5 Q37 37.5 45 39.5","M55 39.5 Q63 37.5 71 40.5"], side:["M33 37.5 Q40 35 48 37","M64 36 Q70 34 76 35.5"]},
  raccoon: {kind:"line", color:"#4a3226", front:["M26 40 Q33 35 41 39","M59 39 Q67 35 74 40"], side:["M24 40 Q31 35 39 39","M64 37.5 Q70 33.5 76 37"]},
  // 嬌嬌：豆眉 [cx, cy, rx, ry]
  tiger:   {kind:"dot", color:"#c9c6d0", edge:"#6f6c7a", front:[[33,41,4.2,2.7],[67,41,4.2,2.7]], side:[[40,41,3.8,2.5],[68,40.5,3.2,2.2]]}
};
function browSVG(id, view){
  const b = BROWS[id]; if(!b) return "";
  if(b.kind==="dot") return b[view].map(([x,y,rx,ry])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${b.color}" stroke="${b.edge}" stroke-width="1.3"/>`).join("");
  return b[view].map(d=>`<path d="${d}" stroke="${b.color}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join("");
}

/* 四小隻 SVG 重畫：外觀暫定 GPT（10-03）。平塗、粗黑框，頭部仍為100×100。
   六表情共用 front／side 五官；不更動圖片立繪、裝備錨點或戰鬥規則。 */
const SVG_CRITTER_MOODS = ["normal","happy","hurt","angry","surprised","nervous","stressed"];
// 壓力 50 以上的臉（大爺 10-10 給參考圖）：每隻各自一張，失控（100）沿用同一張臉再加紅光、晃動
function stressedFace(id, side){
  const ink="#292530", eyes=side?[[39,49,5],[68,47,4.2]]:[[35,51,5],[65,51,5]];
  const path=(d,color=ink,w=2.8)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dot=([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r}" fill="${ink}"/><circle cx="${x+1.3}" cy="${y-1.3}" r="1.5" fill="#fff"/>`;
  const [[lx,ly,lr],[rx,ry,rr]]=eyes;
  const nx=side?(id==="tiger"?61:86):50, ny=side?(id==="tiger"?64:60):67;
  const mx=side?(id==="tiger"?61:69):50, my=side?(id==="tiger"?ny+9:76):ny+10;   // 嘴的中心（側臉在口鼻下方）
  let f=`<ellipse cx="${side?23:25}" cy="63" rx="5" ry="2.5" fill="#e99b9e" opacity=".65"/><ellipse cx="${side?82:75}" cy="${side?59:63}" rx="${side?3.5:5}" ry="2.5" fill="#e99b9e" opacity=".65"/>`;
  const openMouth=(cx,cy,w,h,fangs)=>`<path d="M${cx-w} ${cy-h*.35}Q${cx} ${cy-h*.6} ${cx+w} ${cy-h*.35}Q${cx+w*.85} ${cy+h} ${cx} ${cy+h}Q${cx-w*.85} ${cy+h} ${cx-w} ${cy-h*.35}Z" fill="#6b2b3a" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>`
    +`<ellipse cx="${cx}" cy="${cy+h*.68}" rx="${w*.5}" ry="${h*.28}" fill="#e88a9a"/>`
    +(fangs?`<path d="M${cx-w*.62} ${cy-h*.42}l${w*.18} ${h*.5}l${w*.18} ${-h*.52}Z M${cx+w*.26} ${cy-h*.52}l${w*.18} ${h*.5}l${w*.18} ${-h*.4}Z" fill="#fff" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/>`:"");
  if(id==="fox"){   // 玲玲：一邊挑眉一邊壓眉，咬牙
    f+=dot(eyes[0])+dot(eyes[1]);
    f+=path(`M${lx-6} ${ly-8}Q${lx} ${ly-14} ${lx+6} ${ly-9}`)+path(`M${rx-6} ${ry-7}L${rx+6} ${ry-12}`);
    const w=side?7:9.5, h=side?4:5, x=mx-w, y=my-h;
    f+=`<rect x="${x}" y="${y}" width="${w*2}" height="${h*2}" rx="1.6" fill="#fff" stroke="${ink}" stroke-width="2.2"/>`;
    f+=path(`M${x} ${my}h${w*2}`,ink,1.4)+[1,2,3].map(i=>path(`M${x+w*2*i/4} ${y}v${h*2}`,ink,1.4)).join("");
  }else if(id==="wolf"){   // 香香：平眉、圓眼、波浪嘴、臉頰兩條緊張線（不畫汗滴）
    f+=dot(eyes[0])+dot(eyes[1]);
    f+=path(`M${lx-6} ${ly-9}h12`,ink,3)+path(`M${rx-6} ${ry-9}h12`,ink,3);
    const w=side?3:4;
    f+=path(`M${mx-w*1.5} ${my}q${w*.375} -2.4 ${w*.75} 0t${w*.75} 0t${w*.75} 0t${w*.75} 0`,ink,2);
    const cx=side?20:18, cy=side?52:55;
    f+=path(`M${cx} ${cy}l2.5 5.5M${cx+4} ${cy-1}l2.5 5.5`,ink,1.8);
  }else if(id==="tiger"){   // 嬌嬌：>< 眼、張大嘴吼、露獠牙
    f+=path(`M${lx-lr} ${ly-lr}L${lx+lr} ${ly}L${lx-lr} ${ly+lr}`,ink,3)+path(`M${rx+rr} ${ry-rr}L${rx-rr} ${ry}L${rx+rr} ${ry+rr}`,ink,3);
    f+=openMouth(mx,my,side?9:11,side?8:9,true);
  }else{   // 默默：死魚眼、O 嘴
    const brow="#2a1c16";
    f+=eyes.map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r+1.8}" ry="${r}" fill="#f6f0e2" stroke="${ink}" stroke-width="1.8"/>`+path(`M${x-r} ${y-1}h${r*2}`,ink,1.8)+path(`M${x-r+.8} ${y+1.8}h${r*2-1.6}`,ink,1.6)).join("");
    f+=path(`M${lx-6} ${ly-9}Q${lx} ${ly-11} ${lx+6} ${ly-9}`,brow,2.6)+path(`M${rx-6} ${ry-9}Q${rx} ${ry-11} ${rx+6} ${ry-9}`,brow,2.6);
    f+=openMouth(mx,my+1,side?3.4:4.2,side?5:6,false);
  }
  f+=`<path d="M${nx-4} ${ny-2}Q${nx} ${ny-4} ${nx+4} ${ny-2}Q${nx+3} ${ny+2} ${nx} ${ny+3}Q${nx-3} ${ny+2} ${nx-4} ${ny-2}Z" fill="${id==="tiger"?'#c77e82':ink}"/>`;
  return `<g class="critter-expression" data-expression="stressed">${f}</g>`;
}
function critterExpression(id, view, mood="normal"){
  mood=SVG_CRITTER_MOODS.includes(mood)?mood:"normal";
  if(mood==="stressed")return stressedFace(id, view==="side");
  const side=view==="side", mask=id==="raccoon", ink="#292530", line=mask?"#fff3dd":ink;
  const eyes=side?[[39,49,5],[68,47,4.2]]:[[35,51,5],[65,51,5]];
  const path=(d,color=line,w=2.8)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  let face=eyes.map(([x,y,r])=>{
    if(mood==="hurt")return path(`M${x-r} ${y-r}l${r*2} ${r*2}m0 ${-r*2}l${-r*2} ${r*2}`);
    if(mood==="happy")return path(`M${x-r} ${y+1}Q${x} ${y-r-2} ${x+r} ${y+1}`);
    if(mood==="nervous")return path(`M${x-r} ${y+1}l${r*2} -2`)+`<circle cx="${x}" cy="${y+3}" r="2" fill="${line}"/>`;
    const calm=id==="wolf"&&mood==="normal";
    return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${mood==="surprised"?r+1:calm?3:r}" fill="${ink}" stroke="${mask?'#bfa184':ink}" stroke-width=".8"/><circle cx="${x+1.3}" cy="${y-1.3}" r="1.5" fill="#fff"/>`+(calm?path(`M${x-r-1} ${y-3}l${r*2+2} 0`,ink,2):"");
  }).join("");
  face+=`<ellipse cx="${side?23:25}" cy="63" rx="5" ry="2.5" fill="#e99b9e" opacity=".65"/><ellipse cx="${side?82:75}" cy="${side?59:63}" rx="${side?3.5:5}" ry="2.5" fill="#e99b9e" opacity=".65"/>`;
  if(mood==="normal"||mood==="happy")face+=browSVG(id,view);
  else face+=eyes.map(([x,y,r],i)=>mood==="angry"?path(`M${x-r-1} ${y-10+(i?4:0)}l${r*2+2} ${i?-4:4}`,mask?"#f3e2c8":ink,2.5):path(`M${x-r-1} ${y-9}q${r+1} -5 ${r*2+2} -1`,mask?"#f3e2c8":ink,2.4)).join("");
  const nx=side?(id==="tiger"?61:86):50,ny=side?(id==="tiger"?64:60):67;
  face+=`<path d="M${nx-4} ${ny-2}Q${nx} ${ny-4} ${nx+4} ${ny-2}Q${nx+3} ${ny+2} ${nx} ${ny+3}Q${nx-3} ${ny+2} ${nx-4} ${ny-2}Z" fill="${id==="tiger"?'#c77e82':ink}"/>`;
  // 側臉狐狸／狼／狸貓維持原本無嘴；白虎保留貓嘴。
  if(!side||id==="tiger"){
    if(mood==="surprised")face+=`<ellipse cx="${nx}" cy="${ny+10}" rx="3.5" ry="4.5" fill="${ink}"/>`;
    else if(mood==="nervous")face+=path(`M${nx-6} ${ny+10}l3 -2 3 2 3 -2 3 2`,ink,2);
    else if(mood==="happy")face+=`<path d="M${nx-6} ${ny+7}Q${nx} ${ny+10} ${nx+6} ${ny+7}Q${nx} ${ny+20} ${nx-6} ${ny+7}Z" fill="${ink}"/><path d="M${nx-3} ${ny+12}q3 -2 6 0" stroke="#e99b9e" stroke-width="2.5"/>`;
    else if(id==="tiger")face+=path(`M${nx} ${ny+3}q-3 7 -8 4m8 -4q3 7 8 4`,ink,2);
    else face+=path(`M${nx-4} ${ny+10}q4 ${mood==="angry"?-3:2} 8 0`,ink,2);
  }
  return `<g class="critter-expression" data-expression="${mood}">${face}</g>`;
}
function critterDrawing(id,view,mood){
  const c=CRITTERS.find(x=>x.id===id)?.color||"#9c7655", side=view==="side", ink="#292530";
  const shape=(d,fill=c)=>`<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;
  let s="";
  if(id==="tiger"||id==="raccoon"){
    const inner=id==="tiger"?"#e6bdc3":"#5c4031";
    s=shape("M14 37Q8 17 23 16Q36 16 35 34Z")+shape("M63 30Q64 12 79 16Q93 20 84 39Z");
    s+=`<ellipse cx="23" cy="27" rx="6" ry="7" fill="${inner}"/><ellipse cx="77" cy="26" rx="5" ry="6" fill="${inner}"/>`;
  }else{
    s=shape("M14 41L21 5Q24 2 28 8L45 33Z")+shape("M58 31L76 5Q80 1 82 8L88 40Z");
    s+=`<path d="M21 31L24 14L35 31Z M68 29L77 14L81 33Z" fill="${id==="fox"?'#664044':'#69768b'}"/>`;
  }
  const round=id==="tiger";
  s+=shape(round?"M16 43Q18 24 48 23Q78 22 85 44L90 55L84 57L89 65L82 65Q76 87 51 89Q25 88 17 68L10 65L15 58L10 54Z":side?"M12 42Q15 23 45 23Q78 21 87 43L90 50Q99 55 92 65Q78 84 54 91Q31 90 20 73L11 69L15 61L8 56Z":"M14 42Q18 24 50 24Q82 24 86 42L93 53L86 58L91 65L81 68Q72 86 50 91Q28 86 19 68L9 65L14 58L7 53Z");
  if(id==="tiger"){
    s+=`<ellipse cx="${side?61:50}" cy="70" rx="19" ry="14" fill="#fffaf0"/><path d="M42 26L50 37L58 26M17 46l12 5M14 58l13 1M83 46l-9 5M87 58l-11 1" fill="none" stroke="#48434b" stroke-width="4" stroke-linecap="round"/>`;
  }else if(id==="raccoon"){
    s+=`<path d="M47 27Q52 27 54 44L49 41Z" fill="#f3e2c8"/><path d="M16 47Q31 40 47 49Q46 63 27 68L19 62Z M${side?'58 45Q70 38 82 45Q83 58 68 63L59 56':'53 49Q69 40 84 47L81 62L73 68Q54 63 53 49'}Z" fill="#4a3226"/><ellipse cx="${side?74:50}" cy="72" rx="${side?18:23}" ry="14" fill="#f3e2c8"/>`;
  }else{
    s+=`<path d="${side?'M27 61Q45 62 59 55Q75 50 91 51L93 62Q76 84 54 89Q35 87 27 61Z':'M17 59L31 63L39 59L50 69L61 59L69 63L83 59Q74 83 50 89Q26 83 17 59Z'}" fill="${id==="fox"?'#fff0d8':'#edf0f5'}"/>`;
    if(id==="wolf")s+=`<path d="M44 25L51 37L59 25Z" fill="#edf0f5"/>`;
  }
  return `<g data-critter="${id}" data-view="${view}">${s}${critterExpression(id,view,mood)}</g>`;
}
function critterSVG(id,mood="normal"){
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${critterDrawing(id,"front",mood)}</svg>`;
}
// 相容原有受傷／勝利布林參數，也可直接傳六表情名稱。
function critterSide(id,hurt=false,happy=false){
  const mood=typeof hurt==="string"?hurt:happy?"happy":hurt?"hurt":"normal";
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${critterDrawing(id,"side",mood)}</svg>`;
}
