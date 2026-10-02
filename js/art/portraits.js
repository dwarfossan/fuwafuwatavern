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
const faceSrc = (id, face) => { const p = PORTRAITS[id]; return p.faces ? p.faces + (p.list.includes(face) ? face : p.def) + ".webp" : ""; };
function portraitHTML(id, face){
  return `<div class="portrait" data-portrait="${id}"><img class="pt-base" src="${PORTRAITS[id].base}" alt="">${PORTRAITS[id].faces ? `<img class="pt-face" src="${faceSrc(id, face)}" alt="">` : ""}</div>`;
}
// 換表情：只換臉那張的 src，底圖不動
function setPortraitFace(root, face){
  const img = root?.querySelector(".pt-face"), id = root?.querySelector(".portrait")?.dataset.portrait || root?.dataset.portrait;
  if(!img || !id) return;
  const src = faceSrc(id, face);
  if(!img.getAttribute("src").endsWith(src)) img.setAttribute("src", src);
}
// 先把所有臉載進來，換表情時才不會閃一下空白
(function preloadPortraits(){ if(typeof Image==="undefined") return;
  Object.keys(PORTRAITS).forEach(id=>{ const p = PORTRAITS[id]; [p.base, ...(p.list||[]).map(f=>p.faces+f+".webp")].forEach(s=>{ const i = new Image(); i.src = s; }); }); })();
