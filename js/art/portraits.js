/* 新畫風立繪（大爺 10-03：大爺改用新圖，舊的 SVG 刪掉）
   無臉底圖＋表情臉兩張 <img> 疊在同一個位置（兩張一樣大，不用算座標，見 docs/現況.md 新畫風素材）
   表情檔名見 assets/faces/README.md；def＝沒指定表情時用的 */
const PORTRAITS = {
  liliana:{base:"assets/portraits/liliana_noface.png",faces:null,def:"smile",list:["smile","happy","laugh","smirk","angry","annoyed","sad","surprised","shy","confused","serious","sly"],sheet:"assets/faces/liliana/sheet.png"},
  dwarf: {base:"assets/portraits/dwarf_noface.webp", faces:"assets/faces/dwarf/", def:"smile",
          list:["annoyed","smile","grin","gritted","sad","surprised","smirk","shy"]},
  kam:   {base:"assets/portraits/kam_noface.webp",   faces:"assets/faces/kam/",   def:"smile",
          list:["annoyed","smile","laugh","gritted","sad","surprised","smirk","shy"]},
  // 商人：只有一張圖、沒有表情（大爺 10-03：情緒用泡泡框符號）
  merchant: {base:"assets/portraits/merchant.webp", faces:null}
};
const faceSrc = (id, face) => { const p = PORTRAITS[id]; return p.faces ? p.faces + (p.list.includes(face) ? face : p.def) + ".webp" : ""; };
function portraitHTML(id, face){
  if(id==="liliana")return `<div class="portrait" data-portrait="liliana"><img class="pt-base" src="${PORTRAITS[id].base}" alt=""><div class="liliana-eyes" data-face="${face||"smile"}" style="--face:${Math.max(0,PORTRAITS[id].list.indexOf(face||"smile"))}"><img src="${PORTRAITS[id].sheet}" alt=""></div></div>`;
  return `<div class="portrait" data-portrait="${id}"><img class="pt-base" src="${PORTRAITS[id].base}" alt="">${PORTRAITS[id].faces ? `<img class="pt-face" src="${faceSrc(id, face)}" alt="">` : ""}</div>`;
}
// 換表情：只換臉那張的 src，底圖不動
function setPortraitFace(root, face){
  const eyes=root?.querySelector(".liliana-eyes");if(eyes){const i=Math.max(0,PORTRAITS.liliana.list.indexOf(face));eyes.dataset.face=PORTRAITS.liliana.list[i];eyes.style.setProperty("--face",i);return;}
  const img = root?.querySelector(".pt-face"), id = root?.querySelector(".portrait")?.dataset.portrait || root?.dataset.portrait;
  if(!img || !id) return;
  const src = faceSrc(id, face);
  if(!img.getAttribute("src").endsWith(src)) img.setAttribute("src", src);
}
// 先把所有臉載進來，換表情時才不會閃一下空白
(function preloadPortraits(){ if(typeof Image==="undefined") return;
  Object.keys(PORTRAITS).forEach(id=>{ const p = PORTRAITS[id]; [p.base, ...(p.sheet?[p.sheet]:(p.list||[]).map(f=>p.faces+f+".webp"))].forEach(s=>{ const i = new Image(); i.src = s; }); }); })();

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
