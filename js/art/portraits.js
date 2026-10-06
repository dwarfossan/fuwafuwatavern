/* 新畫風立繪（大爺 10-03：大爺改用新圖，舊的 SVG 刪掉）
   無臉底圖＋表情臉兩張 <img> 疊在同一個位置（兩張一樣大，不用算座標，見 docs/現況.md 新畫風素材）
   表情檔名見 assets/faces/README.md；def＝沒指定表情時用的 */
const NPC_FACE_NAMES=["smile","happy","laugh","smirk","angry","annoyed","sad","surprised","shy","confused","serious","sly"];
const TOWN_PORTRAIT={inn:"mira",smith:"brun",guild:"ada",items:"liliana"};
const PORTRAITS = {
  mira:{offsets:[[0.0,0.0],[3.1768,1.3812],[7.4586,-0.8287],[10.3591,0.9669],[0.5525,10.0829],[2.3481,7.8729],[6.3536,8.1492],[9.2541,7.5967],[0.5525,16.989],[2.9006,19.4751],[7.1823,15.7459],[9.6685,17.2652]],base:"assets/portraits/mira_noface.webp",faces:null,def:"smile",list:NPC_FACE_NAMES,sheet:"assets/faces/mira/sheet.webp"},
  ada:{base:"assets/portraits/ada_noface.webp",faces:null,def:"smile",list:NPC_FACE_NAMES,sheet:"assets/faces/ada/sheet.webp"},
  brun:{base:"assets/portraits/brun_noface.webp",faces:null,def:"smile",list:NPC_FACE_NAMES,sheet:"assets/faces/brun/sheet.webp"},

  liliana:{base:"assets/portraits/liliana_noface.webp",faces:null,def:"smile",list:["smile","happy","laugh","smirk","angry","annoyed","sad","surprised","shy","confused","serious","sly"],sheet:"assets/faces/liliana/sheet.webp"},
  dwarf: {base:"assets/portraits/dwarf_noface.webp", faces:"assets/faces/dwarf/", def:"smile",
          list:["annoyed","smile","grin","gritted","sad","surprised","smirk","shy"]},
  kam:   {base:"assets/portraits/kam_noface.webp",   faces:"assets/faces/kam/",   def:"smile",
          list:["annoyed","smile","laugh","gritted","sad","surprised","smirk","shy"]},
  // 商人：只有一張圖、沒有表情（大爺 10-03：情緒用泡泡框符號）
  merchant: {base:"assets/portraits/merchant.webp", faces:null}
};
const faceSrc = (id, face) => { const p = PORTRAITS[id]; return p.faces ? p.faces + (p.list.includes(face) ? face : p.def) + ".webp" : ""; };
const MIRA_FACE_CLIP="M0.491361,0.135453h0.001080v0.001178h-0.001080zM0.489201,0.136631h0.003240v0.001178h-0.003240zM0.487041,0.137809h0.004320v0.001178h-0.004320zM0.484881,0.138987h0.006479v0.001178h-0.006479zM0.482721,0.140165h0.007559v0.001178h-0.007559zM0.480562,0.141343h0.009719v0.001178h-0.009719zM0.478402,0.142521h0.010799v0.001178h-0.010799zM0.476242,0.143698h0.012959v0.001178h-0.012959zM0.474082,0.144876h0.014039v0.001178h-0.014039zM0.471922,0.146054h0.016199v0.001178h-0.016199zM0.469762,0.147232h0.018359v0.001178h-0.018359zM0.572354,0.147232h0.001080v0.001178h-0.001080zM0.466523,0.148410h0.021598v0.001178h-0.021598zM0.571274,0.148410h0.002160v0.001178h-0.002160zM0.464363,0.149588h0.022678v0.001178h-0.022678zM0.570194,0.149588h0.003240v0.001178h-0.003240zM0.462203,0.150766h0.024838v0.001178h-0.024838zM0.570194,0.150766h0.003240v0.001178h-0.003240zM0.460043,0.151943h0.026998v0.001178h-0.026998zM0.569114,0.151943h0.005400v0.001178h-0.005400zM0.457883,0.153121h0.029158v0.001178h-0.029158zM0.568035,0.153121h0.006479v0.001178h-0.006479zM0.454644,0.154299h0.031317v0.001178h-0.031317zM0.566955,0.154299h0.007559v0.001178h-0.007559zM0.452484,0.155477h0.033477v0.001178h-0.033477zM0.565875,0.155477h0.008639v0.001178h-0.008639zM0.450324,0.156655h0.035637v0.001178h-0.035637zM0.564795,0.156655h0.010799v0.001178h-0.010799zM0.447084,0.157833h0.038877v0.001178h-0.038877zM0.563715,0.157833h0.011879v0.001178h-0.011879zM0.444924,0.159011h0.041037v0.001178h-0.041037zM0.562635,0.159011h0.012959v0.001178h-0.012959zM0.442765,0.160188h0.042117v0.001178h-0.042117zM0.561555,0.160188h0.014039v0.001178h-0.014039zM0.439525,0.161366h0.045356v0.001178h-0.045356zM0.560475,0.161366h0.016199v0.001178h-0.016199zM0.436285,0.162544h0.048596v0.001178h-0.048596zM0.559395,0.162544h0.017279v0.001178h-0.017279zM0.433045,0.163722h0.051836v0.001178h-0.051836zM0.558315,0.163722h0.019438v0.001178h-0.019438zM0.431965,0.164900h0.052916v0.001178h-0.052916zM0.557235,0.164900h0.020518v0.001178h-0.020518zM0.429806,0.166078h0.055076v0.001178h-0.055076zM0.556156,0.166078h0.021598v0.001178h-0.021598zM0.428726,0.167256h0.057235v0.001178h-0.057235zM0.555076,0.167256h0.023758v0.001178h-0.023758zM0.426566,0.168433h0.059395v0.001178h-0.059395zM0.553996,0.168433h0.024838v0.001178h-0.024838zM0.426566,0.169611h0.059395v0.001178h-0.059395zM0.552916,0.169611h0.026998v0.001178h-0.026998zM0.425486,0.170789h0.060475v0.001178h-0.060475zM0.551836,0.170789h0.029158v0.001178h-0.029158zM0.424406,0.171967h0.061555v0.001178h-0.061555zM0.550756,0.171967h0.030238v0.001178h-0.030238zM0.424406,0.173145h0.062635v0.001178h-0.062635zM0.548596,0.173145h0.033477v0.001178h-0.033477zM0.423326,0.174323h0.063715v0.001178h-0.063715zM0.547516,0.174323h0.034557v0.001178h-0.034557zM0.423326,0.175501h0.064795v0.001178h-0.064795zM0.498920,0.175501h0.001080v0.001178h-0.001080zM0.546436,0.175501h0.036717v0.001178h-0.036717zM0.423326,0.176678h0.064795v0.001178h-0.064795zM0.498920,0.176678h0.002160v0.001178h-0.002160zM0.545356,0.176678h0.038877v0.001178h-0.038877zM0.422246,0.177856h0.066955v0.001178h-0.066955zM0.498920,0.177856h0.002160v0.001178h-0.002160zM0.543197,0.177856h0.041037v0.001178h-0.041037zM0.422246,0.179034h0.066955v0.001178h-0.066955zM0.498920,0.179034h0.003240v0.001178h-0.003240zM0.542117,0.179034h0.043197v0.001178h-0.043197zM0.422246,0.180212h0.068035v0.001178h-0.068035zM0.498920,0.180212h0.004320v0.001178h-0.004320zM0.541037,0.180212h0.045356v0.001178h-0.045356zM0.422246,0.181390h0.069114v0.001178h-0.069114zM0.498920,0.181390h0.004320v0.001178h-0.004320zM0.538877,0.181390h0.048596v0.001178h-0.048596zM0.422246,0.182568h0.070194v0.001178h-0.070194zM0.500000,0.182568h0.004320v0.001178h-0.004320zM0.538877,0.182568h0.049676v0.001178h-0.049676zM0.422246,0.183746h0.071274v0.001178h-0.071274zM0.500000,0.183746h0.005400v0.001178h-0.005400zM0.538877,0.183746h0.050756v0.001178h-0.050756zM0.422246,0.184923h0.072354v0.001178h-0.072354zM0.500000,0.184923h0.006479v0.001178h-0.006479zM0.537797,0.184923h0.052916v0.001178h-0.052916zM0.422246,0.186101h0.073434v0.001178h-0.073434zM0.501080,0.186101h0.006479v0.001178h-0.006479zM0.537797,0.186101h0.053996v0.001178h-0.053996zM0.422246,0.187279h0.074514v0.001178h-0.074514zM0.502160,0.187279h0.006479v0.001178h-0.006479zM0.537797,0.187279h0.055076v0.001178h-0.055076zM0.422246,0.188457h0.076674v0.001178h-0.076674zM0.502160,0.188457h0.007559v0.001178h-0.007559zM0.537797,0.188457h0.056156v0.001178h-0.056156zM0.422246,0.189635h0.078834v0.001178h-0.078834zM0.503240,0.189635h0.008639v0.001178h-0.008639zM0.538877,0.189635h0.056156v0.001178h-0.056156zM0.422246,0.190813h0.090713v0.001178h-0.090713zM0.538877,0.190813h0.058315v0.001178h-0.058315zM0.422246,0.191991h0.091793v0.001178h-0.091793zM0.538877,0.191991h0.059395v0.001178h-0.059395zM0.422246,0.193168h0.093952v0.001178h-0.093952zM0.538877,0.193168h0.061555v0.001178h-0.061555zM0.423326,0.194346h0.095032v0.001178h-0.095032zM0.539957,0.194346h0.061555v0.001178h-0.061555zM0.423326,0.195524h0.096112v0.001178h-0.096112zM0.521598,0.195524h0.003240v0.001178h-0.003240zM0.539957,0.195524h0.063715v0.001178h-0.063715zM0.424406,0.196702h0.102592v0.001178h-0.102592zM0.541037,0.196702h0.063715v0.001178h-0.063715zM0.425486,0.197880h0.104752v0.001178h-0.104752zM0.541037,0.197880h0.065875v0.001178h-0.065875zM0.426566,0.199058h0.106911v0.001178h-0.106911zM0.542117,0.199058h0.065875v0.001178h-0.065875zM0.427646,0.200236h0.110151v0.001178h-0.110151zM0.543197,0.200236h0.063715v0.001178h-0.063715zM0.428726,0.201413h0.113391v0.001178h-0.113391zM0.543197,0.201413h0.063715v0.001178h-0.063715zM0.430886,0.202591h0.176026v0.001178h-0.176026zM0.421166,0.203769h0.003240v0.001178h-0.003240zM0.435205,0.203769h0.170626v0.001178h-0.170626zM0.421166,0.204947h0.007559v0.001178h-0.007559zM0.437365,0.204947h0.167387v0.001178h-0.167387zM0.422246,0.206125h0.181425v0.001178h-0.181425zM0.422246,0.207303h0.181425v0.001178h-0.181425zM0.422246,0.208481h0.180346v0.001178h-0.180346zM0.422246,0.209658h0.179266v0.001178h-0.179266zM0.423326,0.210836h0.176026v0.001178h-0.176026zM0.423326,0.212014h0.174946v0.001178h-0.174946zM0.424406,0.213192h0.172786v0.001178h-0.172786zM0.425486,0.214370h0.169546v0.001178h-0.169546zM0.428726,0.215548h0.165227v0.001178h-0.165227zM0.426566,0.216726h0.165227v0.001178h-0.165227zM0.427646,0.217903h0.161987v0.001178h-0.161987zM0.428726,0.219081h0.158747v0.001178h-0.158747zM0.429806,0.220259h0.155508v0.001178h-0.155508zM0.430886,0.221437h0.151188v0.001178h-0.151188zM0.433045,0.222615h0.145788v0.001178h-0.145788zM0.434125,0.223793h0.141469v0.001178h-0.141469zM0.436285,0.224971h0.131749v0.001178h-0.131749zM0.437365,0.226148h0.125270v0.001178h-0.125270zM0.439525,0.227326h0.126350v0.001178h-0.126350zM0.441685,0.228504h0.129590v0.001178h-0.129590zM0.442765,0.229682h0.134989v0.001178h-0.134989zM0.444924,0.230860h0.129590v0.001178h-0.129590zM0.447084,0.232038h0.125270v0.001178h-0.125270zM0.449244,0.233216h0.119870v0.001178h-0.119870zM0.451404,0.234393h0.112311v0.001178h-0.112311zM0.454644,0.235571h0.098272v0.001178h-0.098272zM0.456803,0.236749h0.098272v0.001178h-0.098272zM0.458963,0.237927h0.099352v0.001178h-0.099352zM0.461123,0.239105h0.097192v0.001178h-0.097192zM0.463283,0.240283h0.089633v0.001178h-0.089633zM0.466523,0.241461h0.080994v0.001178h-0.080994zM0.468683,0.242638h0.072354v0.001178h-0.072354zM0.470842,0.243816h0.063715v0.001178h-0.063715zM0.473002,0.244994h0.053996v0.001178h-0.053996zM0.476242,0.246172h0.034557v0.001178h-0.034557zM0.478402,0.247350h0.014039v0.001178h-0.014039z";
const sheetFaceStyle=(id,face)=>{const p=PORTRAITS[id],i=Math.max(0,p.list.indexOf(face||p.def)),xy=p.offsets?.[i]||[0,0];return `--face:${i};--face-x:${xy[0]}%;--face-y:${xy[1]}%`;};
function portraitHTML(id, face){
  if(PORTRAITS[id].sheet)return `<div class="portrait" data-portrait="${id}"><img fetchpriority="high" decoding="async" class="pt-base" src="${PORTRAITS[id].base}" alt="">${id==='mira'?`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="mira-face-clip" clipPathUnits="objectBoundingBox"><path transform="translate(.026 .001) scale(.926 1.698)" d="${MIRA_FACE_CLIP}"/></clipPath></defs></svg><div class="mira-face-window">`:""}<div class="npc-face-sheet ${id==='liliana'?'liliana-eyes':id+'-features'}" data-face="${face||"smile"}" style="${sheetFaceStyle(id,face)}"><img fetchpriority="high" decoding="async" src="${PORTRAITS[id].sheet}" alt=""></div>${id==='mira'?"</div>":""}</div>`;
  return `<div class="portrait" data-portrait="${id}"><img fetchpriority="high" decoding="async" class="pt-base" src="${PORTRAITS[id].base}" alt="">${PORTRAITS[id].faces ? `<img class="pt-face" src="${faceSrc(id, face)}" alt="">` : ""}</div>`;
}
// 底圖與表情必須一起顯示；單張先到不能露出無臉人物。
function retryDisplayImage(img){
 const src=img.dataset.imageSource||img.getAttribute('src');
 img.dataset.imageSource=src;
 entryImageFailures.delete(src);
 const url=new URL(src,document.baseURI);url.searchParams.set('image_retry',String(++retryDisplayImage.serial));
 img.src=url.href;
}
retryDisplayImage.serial=0;
function bindPortraitLoading(root=document){
 root.querySelectorAll('.portrait').forEach(el=>{
  const sync=()=>{
   const imgs=[...el.querySelectorAll('img')];
   imgs.forEach(i=>{if(i.naturalWidth)entryImageFailures.delete(i.dataset.imageSource||i.getAttribute('src'));});
   const failed=imgs.some(i=>!i.naturalWidth&&(i.complete||entryImageFailures.has(i.dataset.imageSource||i.getAttribute('src'))));
   const ready=imgs.every(i=>i.complete&&i.naturalWidth);
   el.classList.toggle('portrait-ready',ready);
   el.classList.toggle('portrait-error',failed);
   el.setAttribute('aria-label',failed?'人物圖片載入失敗，點擊重試':ready?'':'人物圖片載入中');
   el.setAttribute('role','button');el.tabIndex=failed?0:-1;
  };
  el.querySelectorAll('img').forEach(i=>{i.onload=sync;i.onerror=sync;});
  const retry=e=>{if(!el.classList.contains('portrait-error'))return;e.preventDefault();e.stopPropagation();el.querySelectorAll('img').forEach(i=>{if(!i.naturalWidth)retryDisplayImage(i);});sync();};
  el.onclick=retry;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')retry(e);};
  sync();
 });
 root.querySelectorAll('img:not(.portrait img)').forEach(img=>{
  const sync=()=>{
   const src=img.dataset.imageSource||img.getAttribute('src');
   if(img.naturalWidth)entryImageFailures.delete(src);
   const failed=!img.naturalWidth&&(img.complete||entryImageFailures.has(src));
   let notice=img.nextElementSibling?.matches('.image-error-message,.image-loading-message')?img.nextElementSibling:null;
   img.classList.toggle('image-pending',failed||!img.complete);
   if(failed||!img.complete){
    if(!notice){notice=document.createElement('span');img.after(notice);
     const retry=e=>{e.preventDefault();e.stopPropagation();if(notice.getAttribute('role')!=='button')return;retryDisplayImage(img);sync();};notice.onclick=retry;notice.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')retry(e);};}
    notice.className=failed?'image-error-message':'image-loading-message';notice.setAttribute('role',failed?'button':'status');notice.tabIndex=failed?0:-1;
    notice.textContent=failed?(entryImageFailures.get(src)==='timeout'?'圖片下載逾時，點擊重試':'圖片載入失敗，點擊重試'):'圖片載入中…';
    if(getComputedStyle(img.parentElement).position==='static')img.parentElement.classList.add('image-error-host');
    Object.assign(notice.style,{left:img.offsetLeft+'px',top:img.offsetTop+'px',width:img.offsetWidth+'px',height:Math.max(32,img.offsetHeight)+'px'});
   }else notice?.remove();
  };
  img.onload=sync;img.onerror=sync;sync();
 });
}
// 換表情：只換臉那張的 src，底圖不動
function setPortraitFace(root, face){
  const eyes=root?.querySelector(".npc-face-sheet");if(eyes){const id=eyes.closest(".portrait").dataset.portrait;const i=Math.max(0,PORTRAITS[id].list.indexOf(face));eyes.dataset.face=PORTRAITS[id].list[i];eyes.setAttribute("style",sheetFaceStyle(id,face));return;}
  const img = root?.querySelector(".pt-face"), id = root?.querySelector(".portrait")?.dataset.portrait || root?.dataset.portrait;
  if(!img || !id) return;
  const src = faceSrc(id, face);
  if((img.dataset.imageSource||img.getAttribute("src"))!==src){
    if(typeof swapPreparedStoryImage==="function"&&state.page==="story")swapPreparedStoryImage(img,src);
    else img.setAttribute("src", src);
  }
}
// 肖像與表情只在對應畫面出現時由 <img> 載入；封面不搶先下載整組表情圖。

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
