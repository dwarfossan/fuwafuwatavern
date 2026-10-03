/* 新畫風立繪（大爺 10-03：大爺改用新圖，舊的 SVG 刪掉）
   無臉底圖＋表情臉兩張 <img> 疊在同一個位置（兩張一樣大，不用算座標，見 docs/現況.md 新畫風素材）
   表情檔名見 assets/faces/README.md；def＝沒指定表情時用的 */
const PORTRAITS = {
  dwarf: {base:"assets/portraits/dwarf_noface.webp", faces:"assets/faces/dwarf/", def:"smile",
          list:["annoyed","smile","grin","gritted","sad","surprised","smirk","shy"]},
  kam:   {base:"assets/portraits/kam_noface.webp",   faces:"assets/faces/kam/",   def:"smile",
          list:["annoyed","smile","laugh","gritted","sad","surprised","smirk","shy"]},
  // 商人：只有一張圖、沒有表情（大爺 10-03：情緒用泡泡框符號）
  merchant: {base:"assets/portraits/merchant.webp", faces:null}
};
// NPC 表情表以 CSS 取 4×3 格；原圖只轉 WebP，不重畫、不改去背。
const NPC_EXPRESSIONS=["normal","happy","laugh","smirk","angry","sad","cry","surprised","shy","worried","tired","wink"];
Object.assign(PORTRAITS,{
 lilianna:{name:"莉莉安娜",base:"assets/portraits/lilianna_noface.webp",sheet:"assets/faces/lilianna/sheet.webp",size:[1024,1536],crop:780,faceBox:[423,72,205,205],veil:true,head:[380,50,340],def:"normal"},
 mira:{name:"米拉",base:"assets/portraits/mira_noface.webp",sheet:"assets/faces/mira/sheet.webp",size:[926,1698],crop:890,faceBox:[398,224,190,190],head:[325,145,360],def:"happy"},
 ada:{name:"艾妲",base:"assets/portraits/ada_noface.webp",sheet:"assets/faces/ada/sheet.webp",size:[926,1698],crop:860,faceBox:[347,168,210,210],head:[280,90,360],def:"normal"},
 bronn:{name:"布隆",base:"assets/portraits/bronn_noface.webp",sheet:"assets/faces/bronn/sheet.webp",size:[1001,1572],crop:990,faceBox:[397,310,245,245],head:[330,285,400],def:"normal"}
});
function npcFaceStyle(p,face){const i=Math.max(0,NPC_EXPRESSIONS.indexOf(face||p.def));return `background-position:${(i%4)*100/3}% ${Math.floor(i/4)*50}%`;}
function npcPortraitHTML(id,face,head=false){const p=PORTRAITS[id],[w,h]=p.size,[x,y,fw,fh]=p.faceBox;
 const crop=head?p.head:[0,0,w,p.crop],cw=crop[2],ch=head?cw:crop[3];
 return `<div class="portrait npc-portrait ${head?"npc-head":"npc-half"}" data-portrait="${id}" style="aspect-ratio:${cw}/${ch}"><div class="pt-canvas" style="width:${w/cw*100}%;aspect-ratio:${w}/${h};left:${-crop[0]/cw*100}%;top:${-crop[1]/ch*100}%"><img class="pt-base" src="${p.base}" alt="${p.name}" draggable="false"><span class="pt-sheet" data-face="${face||p.def}" style="left:${x/w*100}%;top:${y/h*100}%;width:${fw/w*100}%;height:${fh/h*100}%;background-image:url('${p.sheet}');${p.veil?"clip-path:inset(40% 0 38% 0);":""}${npcFaceStyle(p,face)}"></span></div></div>`;
}
const faceSrc = (id, face) => { const p = PORTRAITS[id]; return p.faces ? p.faces + (p.list.includes(face) ? face : p.def) + ".webp" : ""; };
function portraitHTML(id, face){
  if(PORTRAITS[id].sheet)return npcPortraitHTML(id,face);
  return `<div class="portrait" data-portrait="${id}"><img class="pt-base" src="${PORTRAITS[id].base}" alt="">${PORTRAITS[id].faces ? `<img class="pt-face" src="${faceSrc(id, face)}" alt="">` : ""}</div>`;
}
// 換表情：只換臉那張的 src，底圖不動
function setPortraitFace(root, face){
  const portrait=root?.matches?.(".portrait")?root:root?.querySelector(".portrait"), sheet=portrait?.querySelector(".pt-sheet"),p=PORTRAITS[portrait?.dataset.portrait];
  if(sheet){sheet.dataset.face=NPC_EXPRESSIONS.includes(face)?face:p.def;sheet.style.cssText=sheet.style.cssText.replace(/background-position:[^;]+;?/g,"")+";"+npcFaceStyle(p,sheet.dataset.face);return;}

  const img = root?.querySelector(".pt-face"), id = root?.querySelector(".portrait")?.dataset.portrait || root?.dataset.portrait;
  if(!img || !id) return;
  const src = faceSrc(id, face);
  if(!img.getAttribute("src").endsWith(src)) img.setAttribute("src", src);
}
// 先把所有臉載進來，換表情時才不會閃一下空白
(function preloadPortraits(){ if(typeof Image==="undefined") return;
  Object.keys(PORTRAITS).forEach(id=>{ const p = PORTRAITS[id]; [p.base, ...(p.sheet?[p.sheet]:[]), ...(p.list||[]).map(f=>p.faces+f+".webp")].forEach(s=>{ const i = new Image(); i.src = s; }); }); })();

/* 四小隻的頭（大爺 10-03 給的新畫風，210×210，assets/faces/<id>/）：劇情卡片、擲屬性、商店、角色介紹用；戰場、大地圖維持 SVG
   表情檔名見 assets/faces/README.md；沒有的表情退回 normal */
const CRITTER_FACES = {
  fox:["normal","happy","smug","surprised","confused","awkward","guilty","content"],
  tiger:["normal","happy","fierce","angry","confused","blank","shy","content"],
  wolf:["normal","resigned","serious","surprised","confused","angry","smile","sigh"],
  raccoon:["normal","happy","sly","surprised","confused","caught","down"]
};
const critterFaceSrc = (id, mood) => `assets/faces/${id}/${(CRITTER_FACES[id]||[]).includes(mood) ? mood : "normal"}.webp`;
const critterHead = (id, mood) => `<img class="c-head" src="${critterFaceSrc(id, mood)}" alt="" draggable="false">`;
(function preloadCritterFaces(){ if(typeof Image==="undefined") return;
  Object.entries(CRITTER_FACES).forEach(([id,l])=>l.forEach(f=>{ const i = new Image(); i.src = `assets/faces/${id}/${f}.webp`; })); })();
