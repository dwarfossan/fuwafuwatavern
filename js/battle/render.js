  let ov = "";
  if(b.result){
    // 勝利：只放一條常見的勝利標題，不擋操作（大爺 10-02：拿掉整個勝利視窗）
    if(b.result==="win") ov = `<div class="bt-victory" aria-live="polite"><div class="bv-band"></div><div class="bv-content"><div class="bv-title">${POP_TEXT.victory}</div>${b.def.after ? `<button class="btn bt-after" id="afterWin">繼續 ▶</button>` : ""}</div></div>`;   // 打完有後續劇情（伏擊→商隊，10-03）
    else ov = `<div class="bt-ov bt-result ${b.result}">
      <h3>${b.result==="win"?"勝利！":"傳送回酒館……"}</h3>