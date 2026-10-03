/* 封印奇物：大爺定機率／保底與週更新；價格、台詞 GPT 暫定／草稿。 */
const SEAL_PRICE=5*GP,SEAL_EXCHANGE=50;
const SEAL_INTRO=[
 {who:'fox',text:'這個問號……是什麼裝備？'},
 {who:'liliana',text:'封印奇物。付一份解封費，把裡面的東西帶走；封印拆開以前，我也不替你挑。'},
 {who:'wolf',text:'也就是先付錢，再知道買到什麼。'},
 {who:'liliana',text:'魔法、稀有、傳奇、獨特，機會都寫在這裡。連開十份，至少有一件稀有以上。'},
 {who:'raccoon',text:'那一直沒拿到想要的呢？'},
 {who:'liliana',text:'每解開一份，留一枚封印印記。五十枚，就從本週公布的傳奇或獨特物品裡挑一件。換週也不會收走你們的印記。'},
 {who:'tiger',text:'所以不是運氣差，是我的寶物還在後面排隊！'},
 {who:'wolf',text:'……先看看妳口袋裡有多少錢。'}
].map(l=>({...l,draft:'GPT'}));
