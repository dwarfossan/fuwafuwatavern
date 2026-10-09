// 測試共用：等開機圖片全部讀完、解碼完（js/main.js prepareEntry 移除 body.image-boot），
// 同一步就會依網址進入 #battle／#town／#ambush 或封面，之後才能讀 state、B()。
// 10-06 6a76756 改成先讀完圖片才進遊戲，舊測試一打開就讀戰場會拿到 undefined。
export async function bootReady(page, timeout = 60000) {
  await page.waitForFunction(() => document.body && !document.body.classList.contains('image-boot'), null, { timeout });
}
// 10-09 好運：小傢伙攻擊／豁免失敗時會暫停問要不要重擲。測別的規則、要招式馬上跑完的測試先把好運用光。
export async function noLuck(page) {
  await page.evaluate(() => { state.luckUsed = {fox: 99, tiger: 99, wolf: 99, raccoon: 99}; });
}
