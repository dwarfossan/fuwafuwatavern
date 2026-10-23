/* 獨眼獸人強盜團（支線，大爺 10-23）：數字、文字。台詞全部是香香的草稿（draft），等大爺改；數字暫定
   流程（邏輯 js/orc-gang.js）：
   - 進城住過第一晚後，公會委託板多一張通緝單（城鎮掛黃 ❗）
   - 沒接通緝：從城鎮出去的路，每趟擲遭遇骰 → 支線事件：發現痕跡、只看到幾隻嘍囉（隊長藏著）→ 正面打／繞開
       繞開：被動感知最高的那隻 d20＋感知 對 DC → 過了＝發現一隻在大便 → 伏擊／正面打／離開；沒過＝繞過去，什麼都沒發現
   - 接了通緝：城鎮旁的路上出現黃 ❗，走過去直接找上門（雙方正常開打）
   - 第一次：隊長血量掉到 1/4 以下、輪到他時就丟煙霧彈逃走（被一下秒掉就是死了，大爺：玩家自由）→ 一定記仇回來
   - 回公會領賞：隊長逃走＝打倒的嘍囉每隻 25 gp；打死 300 gp；敲暈（活捉）×1.5 */
const ORC_GANG = {
  draft:"香香",
  encounter:.15,          // 沒接通緝時，每趟擲遭遇骰的機率（只算經過城鎮的那段路）
  at:.4,                  // 遭遇在那段路走到哪裡
  dc:12,                  // 繞開時的感知檢定
  crew:["orc","orc","orc"],   // 第一次：隊長＋3 隻獸人
  crewReturn:["orc","orc"],   // 隊長逃走後回來：隊長＋2 隻新的嘍囉
  lateRound:2,            // 正面打／伏擊時，躲著的那幾隻第幾輪開始趕過來
  fleeAt:.25,             // 第一次：血量剩多少以下就逃
  thugGold:25,            // 隊長逃走時，打倒的嘍囉每隻（全隊合計）
  bounty:300,             // 隊長（全隊合計）
  captureMul:1.5,         // 活捉
  // 公會的通緝單
  wanted:{
    title:"通緝：獨眼隊長", client:"公會",
    text:"鎮外有一夥獸人強盜，帶頭的是個獨眼。商人、旅人都被搶過。死的活的都行——活的多給。",
    fledText:"獨眼上次跑了，還在城鎮附近晃。賞金照舊。",
    foes:"獨眼隊長＋獸人嘍囉",
    reward:"{g} gp（活捉 {c} gp）",
    accept:"接下通緝", accepted:"已接下 · 到地圖上點 ❗", claim:"領賞", claimed:"已結案", pin:"獨眼的營地",
    claimText:{fled:"人跑了？……嘍囉的份先給你們，{g} gp。", dead:"獨眼死了？好，賞金 {g} gp，拿去。", captured:"活捉？！幹得好。賞金加五成，{g} gp。"},
    got:"領到賞金 {g} gp（四隻平分）"
  },
  // 支線事件（{n}＝看到幾隻：兩／一）
  signs:[
    {who:"narr", text:"路邊的草被踩得亂七八糟，泥巴上有很大的腳印。"},
    {who:"wolf", text:"……獸人的味道。很臭。", mood:"serious"},
    {who:"raccoon", text:"前面。{n}隻。在烤東西。", mood:"sly"},
    {who:"fox", text:"可是腳印不只{n}組……其他的跑哪去了？", mood:"confused"},
    {who:"tiger", text:"管他的，直接衝過去揍牠們！", mood:"angry"}
  ],
  ask:"要怎麼做？",
  pick:{
    fight:{label:"正面打", sub:"直接衝過去"},
    sneak:{label:"繞開", sub:"感知檢定・難度 {dc}（{who}）"},
    ambush:{label:"伏擊", sub:"牠落單、來不及反應"},
    leave:{label:"離開", sub:"當作沒看到"}
  },
  fight:[{who:"tiger", text:"就是要這樣！", mood:"angry"}],
  sneak:[{who:"fox", text:"先繞過去，看清楚再說。", mood:"normal"}],
  rollLine:"……（豎起耳朵）",
  poop:[
    {who:"narr", text:"繞到樹叢後面——一隻獸人蹲在那裡，褲子脫到一半。"},
    {who:"raccoon", text:"……牠在大便。", mood:"sly"},
    {who:"tiger", text:"噁……", mood:"blank"},
    {who:"wolf", text:"……現在是最好的機會。", mood:"serious"}
  ],
  miss:[
    {who:"narr", text:"小心翼翼地繞了一大圈，什麼也沒發現。"},
    {who:"fox", text:"……算了，先走吧。", mood:"awkward"}
  ],
  ambush:[{who:"raccoon", text:"……趁現在。", mood:"sly"}],
  poopFight:[{who:"tiger", text:"偷襲太卑鄙了！正面來！", mood:"angry"}],
  leave:[{who:"fox", text:"……我們什麼都沒看到。走吧。", mood:"awkward"}],
  // 戰鬥中
  pantsLog:"{name}褲子還沒穿好，移動減半！",
  lateLog:"遠處傳來一聲吼——{name}帶人趕來了！",
  flee:{say:"嘖……臭毛球，給老子記住！", log:"{name}丟出煙霧彈，逃走了！",
    lines:[["tiger","他跑了！"], ["fox","……他會回來的。這種人都會。"]]},
  card:"記仇：上次被毛毛們打到丟煙霧彈逃跑",
  shout:["又是你們這群死畜生。上次的帳，今天一起算！", "臭毛球！我找你們找很久了！"],
  // 勝利畫面
  end:{fled:"獨眼隊長逃走了。回公會能領嘍囉的賞金。", dead:"獨眼隊長倒下了。回公會領賞吧。", captured:"獨眼隊長被敲暈了。綁起來，回公會領賞！"}
};
