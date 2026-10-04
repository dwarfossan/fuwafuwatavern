/* 新畫風立繪（大爺 10-03：大爺改用新圖，舊的 SVG 刪掉）
   無臉底圖＋表情臉兩張 <img> 疊在同一個位置（兩張一樣大，不用算座標，見 docs/現況.md 新畫風素材）
   表情檔名見 assets/faces/README.md；def＝沒指定表情時用的 */
const NPC_FACE_NAMES=["smile","happy","laugh","smirk","angry","annoyed","sad","surprised","shy","confused","serious","sly"];
const TOWN_PORTRAIT={inn:"mira",smith:"brun",guild:"ada",items:"liliana"};
const PORTRAITS = {
  mira:{offsets:[[0.0,0.0],[3.1768,1.3812],[7.4586,-0.8287],[10.3591,0.9669],[0.5525,10.0829],[2.3481,7.8729],[6.3536,8.1492],[9.2541,7.5967],[0.5525,16.989],[2.9006,19.4751],[7.1823,15.7459],[9.6685,17.2652]],base:"assets/portraits/mira_noface.png",faces:null,def:"smile",list:NPC_FACE_NAMES,sheet:"assets/faces/mira/sheet.png"},
  ada:{base:"assets/portraits/ada_noface.png",faces:null,def:"smile",list:NPC_FACE_NAMES,sheet:"assets/faces/ada/sheet.png"},
  brun:{base:"assets/portraits/brun_noface.png",faces:null,def:"smile",list:NPC_FACE_NAMES,sheet:"assets/faces/brun/sheet.png"},

  liliana:{base:"assets/portraits/liliana_noface.png",faces:null,def:"smile",list:["smile","happy","laugh","smirk","angry","annoyed","sad","surprised","shy","confused","serious","sly"],sheet:"assets/faces/liliana/sheet.png"},
  dwarf: {base:"assets/portraits/dwarf_noface.webp", faces:"assets/faces/dwarf/", def:"smile",
          list:["annoyed","smile","grin","gritted","sad","surprised","smirk","shy"]},
  kam:   {base:"assets/portraits/kam_noface.webp",   faces:"assets/faces/kam/",   def:"smile",
          list:["annoyed","smile","laugh","gritted","sad","surprised","smirk","shy"]},
  // 商人：只有一張圖、沒有表情（大爺 10-03：情緒用泡泡框符號）
  merchant: {base:"assets/portraits/merchant.webp", faces:null}
};
const faceSrc = (id, face) => { const p = PORTRAITS[id]; return p.faces ? p.faces + (p.list.includes(face) ? face : p.def) + ".webp" : ""; };
const sheetFaceStyle=(id,face)=>{const p=PORTRAITS[id],i=Math.max(0,p.list.indexOf(face||p.def)),xy=p.offsets?.[i]||[0,0];return `--face:${i};--face-x:${xy[0]}%;--face-y:${xy[1]}%`;};
function portraitHTML(id, face){
  if(PORTRAITS[id].sheet)return `<div class="portrait" data-portrait="${id}"><img class="pt-base" src="${PORTRAITS[id].base}" alt=""><div class="npc-face-sheet ${id==='liliana'?'liliana-eyes':id+'-features'}" data-face="${face||"smile"}" style="${sheetFaceStyle(id,face)}"><img src="${PORTRAITS[id].sheet}" alt=""></div></div>`;
  return `<div class="portrait" data-portrait="${id}"><img class="pt-base" src="${PORTRAITS[id].base}" alt="">${PORTRAITS[id].faces ? `<img class="pt-face" src="${faceSrc(id, face)}" alt="">` : ""}</div>`;
}
// 換表情：只換臉那張的 src，底圖不動
function setPortraitFace(root, face){
  const eyes=root?.querySelector(".npc-face-sheet");if(eyes){const id=eyes.closest(".portrait").dataset.portrait;const i=Math.max(0,PORTRAITS[id].list.indexOf(face));eyes.dataset.face=PORTRAITS[id].list[i];eyes.setAttribute("style",sheetFaceStyle(id,face));return;}
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
