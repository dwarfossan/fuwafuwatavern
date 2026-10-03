/* 城鎮場所與人物：GPT 草稿；莉莉安娜身分由大爺指定，其餘名字／外觀暫定。 */
const TOWN_PLACES=[
 {id:'inn',name:'旅店',owner:'米菈',role:'旅店老闆娘',symbol:'bed',color:'#d3a472',draft:'GPT',line:'先坐下吧。桌子借你們攤小筆記，別把墨水打翻就好。',action:'休息／抄筆記'},
 {id:'smith',name:'裝備店',owner:'布隆',role:'鐵匠',symbol:'anvil',color:'#9bb3bd',draft:'GPT',line:'毛絨絨小隊？名字挺軟，裝備可不能軟。挑吧！',action:'挑選裝備'},
 {id:'guild',name:'公會',owner:'艾妲',role:'公會接待員',symbol:'board',color:'#a7ba85',draft:'GPT',line:'毛絨絨小隊……登記好了。希望下次是帶著報告回來，不是被人裝在籃子裡送回來。',action:'查看委託板'},
 {id:'items',name:'道具店',owner:'莉莉安娜',role:'神祕的老闆娘',symbol:'potion',color:'#bf9ec9',line:'歡迎，毛絨絨小隊。別急著問我怎麼知道……先看看你們需要什麼。',draft:'GPT',action:'挑選道具'}
];
const TOWN_UI={title:'城鎮',subtitle:'毛絨絨小隊，今天先去哪裡？',back:'回到街上',map:'大地圖',enter:'進入城鎮',draft:'人物、台詞草稿／素材暫定',guild:'委託板目前還沒有可承接的委託。',rest:'休息只沿用現有熟練格與筆記規則；目前沒有補血效果。',restUnavailable:'完成商隊護送後，就能在這裡休息、整理戰鬥中理解的招式。',buy:'挑好了就帶走吧。',sell:'收好了。再看看其他東西？'};

/* 第一次離開道具店：GPT 草稿，表情暫定。 */
const TOWN_SUPPLIER=[
 {who:'narr',text:'四小隻剛走出道具店，就看見熟悉的商人抱著貨箱，快步走進那扇門。'},
 {who:'wolf',text:'……剛才那個商人。',on:'none',mood:'serious'},
 {who:'fox',text:'他不是急著交貨嗎？原來是送這裡。',on:'none',mood:'confused'},
 {who:'raccoon',text:'難怪店裡什麼都有。',on:'none',mood:'sly'},
 {who:'tiger',text:'所以那些封印奇物，他也不知道裡面是什麼？',on:'none',mood:'confused'},
 {who:'fox',text:'……妳突然問到重點了。',on:'none',mood:'awkward'},
 {who:'wolf',text:'先別在門口說。走吧。',on:'none',mood:'serious'}
].map(l=>({...l,draft:'GPT'}));
