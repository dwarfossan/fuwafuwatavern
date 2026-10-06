const HOME_HEADS=["fox","tiger","wolf","raccoon"].map(id=>`assets/portraits/home_${id}.webp`);
function renderCover(loading=false){
  return `<section class="page cover ${loading?'cover-loading':''}">
    <div class="lanterns" aria-hidden="true"><span class="lantern"></span><span class="lantern"></span><span class="lantern"></span></div>
    <div class="sign">
      <div class="eyebrow">軟呼呼酒館</div>
      <h1>毛絨絨小隊</h1>
    </div>
    <p class="sub">${PAGE_UI.coverIntro}<br>${PAGE_UI.coverNext}</p>
    <div class="cover-party">${HOME_HEADS.map((src,i)=>`<img fetchpriority="high" decoding="async" ${loading?`data-image-source="${src}"`:`src="${src}"`} width="210" height="210" alt="${CRITTERS[i].name}">`).join('')}</div>
    ${loading?'<div class="image-startup" role="status"><label>讀取中 <span id="imageProgressText">0%</span></label><progress aria-label="圖片讀取進度" value="0" max="1"></progress><button class="btn small" id="retryImages" hidden>重試</button></div>':''}
    <button class="btn" id="start" ${loading?'disabled':''}>推開酒館大門</button>
    <button class="btn small ghost cover-about" data-about>關於／授權</button>
      </section>`;
}
