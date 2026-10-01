function renderCover(){
  return `<section class="page cover">
    <div class="lanterns" aria-hidden="true"><span class="lantern"></span><span class="lantern"></span><span class="lantern"></span></div>
    <div class="sign">
      <div class="eyebrow">軟呼呼酒館</div>
      <h1>毛絨絨小隊</h1>
    </div>
    <p class="sub">矮人大爺的小酒館裡，四隻小動物正準備第一次冒險。<br>先替牠們擲出屬性，再聽聽今晚的故事。</p>
    <div class="row-critters">${CRITTERS.map(c=>critterSVG(c.id)).join("")}</div>
    <button class="btn" id="start">推開酒館大門</button>
      </section>`;
}
