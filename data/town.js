/* 城鎮場所與人物：GPT 草稿；莉莉安娜身分由大爺指定，其餘名字／外觀暫定。 */
const TOWN_PLACES=[
 {id:'inn',name:'旅店',owner:'米拉',role:'旅店老闆娘',symbol:'bed',color:'#d3a472',draft:'GPT',line:'先坐下吧。桌子借你們攤小筆記，別把墨水打翻就好。',action:'休息／抄筆記'},
 {id:'smith',name:'裝備店',owner:'布隆',role:'鐵匠',symbol:'anvil',color:'#9bb3bd',draft:'GPT',line:'毛絨絨小隊？名字挺軟，裝備可不能軟。挑吧！',action:'挑選裝備'},
 {id:'guild',name:'公會',owner:'艾妲',role:'公會接待員',symbol:'board',color:'#a7ba85',draft:'GPT',line:'毛絨絨小隊……登記好了。希望下次是帶著報告回來，不是被人裝在籃子裡送回來。',action:'查看委託板'},
 {id:'items',name:'道具店',owner:'莉莉安娜',role:'神祕的老闆娘',symbol:'potion',color:'#bf9ec9',line:'歡迎，毛絨絨小隊。別急著問我怎麼知道……先看看你們需要什麼。',draft:'GPT',action:'挑選道具'}
];
const TOWN_UI={innFirstNightTitle:"教學：旅店休息",innFirstNight:"進城第一晚，大家都累壞了，先在旅店住一晚吧。按下發亮的「長休」：熟練格回滿、壓力下降，還能把這次理解的招式抄進小筆記。",title:'城鎮',subtitle:'毛絨絨小隊，今天先去哪裡？',back:'回到街上',map:'大地圖',enter:'進入城鎮',draft:'台詞／場景草稿',guild:'委託板目前還沒有可承接的委託。',rest:'休息只沿用現有熟練格與筆記規則；目前沒有補血效果。',restUnavailable:'完成商隊護送後，就能在這裡休息、整理戰鬥中理解的招式。',buy:'挑好了就帶走吧。',sell:'收好了。再看看其他東西？'};

/* 第一次離開道具店：GPT 草稿，表情暫定。 */
const TOWN_SUPPLIER=[
 {who:'narr',text:'小傢伙們剛走出道具店，就看見熟悉的商人抱著貨箱，快步走進那扇門。'},
 {who:'wolf',text:'……剛才那個商人。',on:'none',mood:'serious'},
 {who:'fox',text:'他不是急著交貨嗎？原來是送這裡。',on:'none',mood:'confused'},
 {who:'raccoon',text:'難怪店裡什麼都有。',on:'none',mood:'sly'},
 {who:'tiger',text:'所以那些封印奇物，他也不知道裡面是什麼？',on:'none',mood:'confused'},
 {who:'fox',text:'……妳突然問到重點了。',on:'none',mood:'awkward'},
 {who:'wolf',text:'先別在門口說。走吧。',on:'none',mood:'serious'}
].map(l=>({...l,draft:'GPT'}));

/* 店內對話（大爺 10-10）：四位店主都能聊「自我介紹／這個城鎮／閒聊」。台詞全是香香的草稿（draft），等大爺改
   閒聊每次隨機一段。莉莉安娜照《地下城藝術》的 GM（說書人）口吻寫：什麼都知道、話只說一半 */
const TOWN_TALK_TOPICS = {intro:"自我介紹", town:"這個城鎮", chat:"閒聊"};
const TOWN_TALK = {draft:"香香",
  inn:{
    intro:["我是米拉，這間旅店的老闆娘。","床是曬過的，早餐是不等人的。"],
    town:["這鎮子不大，可商隊都愛在這兒歇腳，消息也跟著貨一起進來。","鎮外的森林最近怪怪的，西邊丘陵還有個洞窟。要去哪，先來我這兒睡飽再說。"],
    chat:[["小筆記寫完記得收好。上次有客人把墨水打翻在我的床單上，洗了三天。"],
          ["昨晚樓上咚的一聲……是誰掉下床了？","……我不問。床沒壞就好。"],
          ["你們四個睡覺都擠在一張床上？房間錢可是照一間算的喔。"]]
  },
  smith:{
    intro:["布隆，打鐵的。這條街上叮叮咚咚響的，就是我。","刀鈍了、盾裂了，拿來。錢不夠先記帳——記清楚，我會去收。"],
    town:["鎮上就我一個鐵匠，所以別跟我殺價。","公會的艾妲嘴巴利，人不壞。委託接了就做完，這鎮上的人記性都很好。"],
    chat:[["盾牌不是拿來當雪橇的。對，我說的就是你，白色那隻。"],
          ["你們的武器誰保養的？……還行。下次別拿石頭亂刮。"],
          ["個子小，拿的傢伙就得順手。太重的別硬扛，扛不動的劍跟沒劍一樣。"]]
  },
  guild:{
    intro:["艾妲，公會接待。委託、報酬、失蹤登記，都歸我管。","最後一項，希望不用替你們填。"],
    town:["這裡委託不多，可每一件都有人等著結果。","森林那邊，最近送進來的回報有點多。……我只是說說。"],
    chat:[["毛絨絨小隊……登記的時候，我的手抖了一下。"],
          ["委託板是空的，不代表沒事。是事情還沒寫上來。"],
          ["報告寫短一點。上次有人交了一整本日記，還附插圖。"]]
  },
  items:{
    intro:["莉莉安娜。這間店的主人……暫時是。","我看過很多冒險者，從第一步看到最後一步。你們的故事，才剛翻開第一頁。"],
    town:["這座城鎮像一張剛攤開的地圖。哪裡有寶藏、哪裡有陷阱，我都知道。","但說出來就不好玩了，對吧？"],
    chat:[["骰子很誠實。擲出 1 的時候，別怪它。"],
          ["那位商人送來的貨……我不問來源。你們也別問。"],
          ["封印奇物？想看就付錢。命運不收賒帳。"],
          ["你們的小筆記……很有意思。看別人一眼就學走，這種事，可不是每個人都做得到。"]]
  }
};

/* 酒館（大爺 10-11）：回家劇情演完後的酒館，跟店家同一套版面。台詞全是香香草稿，大爺看過再改。
   吃飯：每天一次，全隊吃到一道隨機料理（效果同露營料理，到下次長休）；睡覺：長休＋旅店那張 CG；
   聊天：選大爺或卡姆，再挑話題；摸摸頭：跳出四隻頭像，點一下壓力 −PET_STRESS */
const PET_STRESS = 2;   // 暫定
const TAVERN_UI = {idle:"回來啦。要吃飯、睡覺，還是陪大爺聊聊？", eat:"吃飯", sleep:"睡覺", talk:"聊天", pet:"摸摸頭", leave:"出門",
  ate:"今天已經吃過了", noBed:"進城之後才有床位資料", talkWho:"要跟誰聊？", petTitle:"摸摸頭（點頭像）", petDone:"摸好了", stress:"壓力",
  meal:"大爺今天煮了{food}！大家吃得肚子圓滾滾。", dwarfName:"矮人大爺", kamName:"卡姆", draft:"香香"};
const TAVERN_TALK_TOPICS = {recent:"最近怎樣", chat:"閒聊"};
const TAVERN_TALK = {draft:"香香",
  dwarf:{
    recent:[{text:"外面好玩嗎？受傷了沒？……沒有就好，大爺可是很擔心的。哈哈！", face:"grin"},{text:"錢不夠就說，大爺這裡別的沒有，酒跟飯管夠。", face:"smile"}],
    chat:[
      [{text:"你們知道嗎？大爺年輕的時候，一個人扛過三桶麥酒走上山！", face:"grin"},{text:"……好啦，是兩桶。第三桶在半路喝掉了。", face:"shy"}],
      [{text:"卡姆又在嫌大爺的鬍子了。這可是頭髮編的，很難得的！", face:"smirk"}],
      [{text:"吧檯底下那箱？什麼箱？大爺不知道你們在說什麼。", face:"gritted"}]
    ]},
  kam:{
    recent:[{text:"傷，給我看。", face:"annoyed"},{text:"……沒事就好。下次別逞強。", face:"smile"}],
    chat:[
      [{text:"詛咒還在。放心。", face:"smile"},{text:"倒下了就回來。這裡是家。", face:"smile"}],
      [{text:"老大今天又偷喝庫存。三瓶。我數了。你們別學他。", face:"annoyed"}],
      [{text:"外面的東西，不能亂吃。", face:"annoyed"},{text:"……老大煮的，可以。", face:"shy"}]
    ]}
};
/* 睡覺：長休後的 CG（沿用旅店那張，台詞換成在家的版本） */
const TAVERN_REST = [
  {who:"narr", art:"inn", draft:"香香", text:"酒館樓上的小房間，被子是大爺曬過的味道。"},
  {who:"tiger", art:"inn", draft:"香香", mood:"happy", text:"還是家裡的枕頭最好抱——！"},
  {who:"fox", art:"inn", draft:"香香", mood:"content", text:"明天出門前，先把小筆記整理好。"},
  {who:"wolf", art:"inn", draft:"香香", mood:"content", text:"……樓下大爺的打呼聲，好安心。"},
  {who:"raccoon", art:"inn", draft:"香香", mood:"sly", text:"……（抱著從吧檯底下摸來的東西睡著了）"},
  {who:"narr", art:"inn", draft:"香香", text:"一夜好眠。"}
];
