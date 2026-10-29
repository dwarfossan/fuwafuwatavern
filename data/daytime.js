/* 日夜循環（大爺 10-28 定：白天／晚上兩段；10-29 加右上角的日夜圖示）。文字香香草稿、數字暫定
   邏輯 js/daytime.js；state.time＝{night, ticks, changedAt}
   - 白天：出門一趟（走到一個地點、走到委託的 ❗）算一格、打完一場委託或地城算一格，累積 nightAfter 格就天黑
   - 晚上：只有長休（旅店、酒館、露營、地城裡休息）會天亮，天亮後格數歸零
   - 晚上的效果：外面的戰場（委託地圖、森林）從明亮變微光（洞窟本來就黑、墓地本來就暗，不變）；
     裝備店、道具店打烊；不死系的委託只在晚上出現在地圖上；大地圖、城鎮街景蓋一層夜色 */
const DAYTIME = {
  draft:"香香",
  nightAfter:3,
  closedAtNight:["smith","items"],
  // 只在晚上出沒的委託：敵人裡有這些
  nightFoes:["vampire","ghost","lich","skeleton","skeleton_archer","zombie","ghoul","death_knight"],
  ui:{
    day:"白天", night:"晚上",
    dayLeft:"再 {n} 次出門或戰鬥就天黑。",
    dayHint:"出門走一趟、打一場委託或地城，都算一格。",
    nightHint:"外面變暗了（毛毛們有黑暗視覺，反而好偷襲）。裝備店、道具店打烊；不死的東西出來了。長休之後天亮。",
    fell:"天黑了。",
    closed:"{name}打烊了。明天再來吧。",
    nightOnly:"（只在晚上出沒）",
    nightOnlyPin:"白天找不到牠們——晚上再來吧。"
  }
};
