function renderCover(){
  return `<section class="page cover">
    <div class="lanterns" aria-hidden="true"><span class="lantern"></span><span class="lantern"></span><span class="lantern"></span></div>
    <div class="sign">
      <div class="eyebrow">軟呼呼酒館</div>
      <h1>毛絨絨小隊</h1>
    </div>
    <p class="sub">${PAGE_UI.coverIntro}<br>${PAGE_UI.coverNext}</p>
    <img fetchpriority="high" decoding="async" class="cover-party" src="assets/portraits/party_heads.webp" width="1100" height="396" alt="玲玲、嬌嬌、香香、默默">
    <button class="btn" id="start">推開酒館大門</button>
    <button class="btn small ghost cover-about" data-about>關於／授權</button>
      </section>`;
}
