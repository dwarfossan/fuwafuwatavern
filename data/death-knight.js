/* 死亡騎士（大爺 10-23）：主線重要角色之一，被打敗不會死。台詞全部是香香的草稿（draft），等大爺改
   ※ 其實是女的、女貴族的祖先，主線後面才揭曉——遊戲裡一律用「他」，劇情立繪只用戴頭盔那張（長髮那張一看就是女的）
   - 打到 0 血：單膝跪地、化成黑霧消失（算打倒：經驗、委託照給；不擲記仇，敲暈開關對他沒用）。第一次見面一句話都不說，被打退時才開口
   - 拿到韁繩（隊上有人帶著）之後：他用走的來；下一次接「黑馬騎士」先演一段討馬（只演一次，state.deathKnight.demanded）
   - 馬不會被討回去，只是嘴上討 */
const DEATH_KNIGHT = {
  draft:"香香",
  quest:"black_rider",          // 討馬那段接在哪個委託前面（data/quests.js 的 id）
  repelLog:"{name}單膝跪地——鎧甲裡冒出一團黑霧，整個人消失了。",
  repelSay:"……有意思。",
  // 討馬（{name}＝骨骨現在的名字）
  demand:[
    {who:"narr", text:"路中間站著一個穿黑甲的騎士。這次，他沒有騎馬。", on:"dk_helmet"},
    {who:"dk", text:"……把骨骨還給我。", on:"dk_helmet"}
  ],
  same:[   // 沒改名字（還叫骨骨）
    {who:"tiger", text:"欸？牠本來就叫骨骨？", mood:"confused", on:"dk_helmet"},
    {who:"fox", text:"……我們取的名字，跟他取的一模一樣。", mood:"awkward", on:"dk_helmet"},
    {who:"raccoon", text:"……品味一樣。", mood:"sly", on:"dk_helmet"}
  ],
  renamed:[   // 改過名字
    {who:"tiger", text:"欸？牠本來叫骨骨？", mood:"confused", on:"dk_helmet"},
    {who:"wolf", text:"……牠現在叫{name}了。", mood:"serious", on:"dk_helmet"},
    {who:"dk", text:"…………", on:"dk_helmet"}
  ],
  end:[{who:"dk", text:"……還來。", on:"dk_helmet"}]
};
