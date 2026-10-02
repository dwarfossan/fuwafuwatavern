function renderCover(){
  return `<section class="page cover">
    <div class="lanterns" aria-hidden="true"><span class="lantern"></span><span class="lantern"></span><span class="lantern"></span></div>
    <div class="sign">
      <div class="eyebrow">軟呼呼酒館</div>
      <h1>毛絨絨小隊</h1>
    </div>
    <p class="sub">${PAGE_UI.coverIntro}<br>${PAGE_UI.coverNext}</p>
    <div class="row-critters">${CRITTERS.map(c=>critterSVG(c.id)).join("")}</div>
    <button class="btn" id="start">推開酒館大門</button>
      </section>`;
}
