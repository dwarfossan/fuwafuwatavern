/* 名詞解釋：裝備屬性詞、武器專精、護甲說明（詳情卡用） */
const PROP_TEXT = {
  "輕型":"輕巧好拿，適合單手使用。",
  "靈巧":"可以用力量或敏捷攻擊，取比較高的那個。",
  "投擲":"可以丟出去做遠程攻擊（數字是射程，單位呎）。",
  "雙手":"要用兩隻手拿，不能同時拿盾。",
  "多用":"可以單手或雙手握；沒拿盾時用雙手，傷害骰變大（括號裡的數字）。",
  "重型":"很重的武器：近戰要力量 13、遠程要敏捷 13 才拿得動。",
  "觸及":"攻擊範圍比一般武器遠，可以打到 2 格外的敵人。",
  "裝填":"每次都要重新上膛，每回合只能射一次。",
  "彈藥":"遠程武器，需要箭或弩矢（數字是射程，單位呎）。貼身射擊有劣勢。"
};
const MASTERY_TEXT = {
  "削弱":"普攻命中後，目標下次攻擊有劣勢。",
  "緩速":"普攻命中後，目標下回合移動少 2 格。",
  "推擊":"普攻命中後，把目標推開 2 格。",
  "擊倒":"普攻命中後，目標做體質豁免，失敗就倒地（被近戰打有優勢）。",
  "困擾":"普攻命中後，你下次攻擊同一個目標有優勢。",
  "擦傷":"普攻沒打中時，仍然造成等於屬性調整值的傷害。",
  "橫掃":"普攻命中後，順勢攻擊旁邊另一個敵人（不加屬性傷害，每回合一次）。",
  "快擊":"雙持輕型武器時多攻擊一次。（目前還沒有雙持，暫時沒有效果）"
};
const TERM_TEXT = {
  "優勢":"擲兩顆 d20 取高的。", "劣勢":"擲兩顆 d20 取低的。",
  "豁免":"被法術或特殊效果影響時，擲 d20 + 屬性調整值，大於等於 DC 就成功抵抗。",
  "熟練格":"每個角色照等級有一階、二階……的格子（一級：一階 2 格）。普攻、戲法不用格子，其他招式每用一次用掉一格；休息才會回來。",
  "升階":"用比招式要求高的格子放，每高一階效果強一份。一階用完也可以拿高階的格子放。",
  // 技能類型：判定方式・傷害
  "近戰":"擲攻擊骰對目標 AC，打貼身（或觸及範圍內）的目標。", "遠程":"擲攻擊骰對目標 AC，打遠處的目標；貼身射擊有劣勢。",
  "輔助":"不打人：補血、加防、擺架式、幫隊友。",
  "物理":"武器或身體本身的力量造成的傷害（不分砍、戳、砸）。", "法術":"法術、神術造成、不帶元素的傷害，例如魔法飛彈。",
  "特殊":"武器、身體、法術以外的力量造成的傷害，例如氣。",
  "元素":"火焰、強酸這類傷害；不管從法術、道具還是龍嘴出來都算元素，標籤直接寫是哪一種。",
  "潛行劣勢":"穿著很吵，潛行檢定有劣勢。"
};
// 戰鬥中頭上跳出來的彈字：用英文（遊戲慣例，短、好認）。數字（-5、+3）不在這裡
// 要改字或做翻譯版就改這裡，不要寫死在程式裡
const POP_TEXT = {
  miss:"MISS",          // 沒打中、豁免成功沒被抓住／沒被打掉、躲開道具
  crit:"CRITICAL!",     // 爆擊的大字
  victory:"VICTORY",    // 勝利標題（大爺 10-02）
  disarm:"DISARM!", bound:"BOUND", bane:"BANE", spotted:"SPOTTED!", mark:"MARKED", yum:"YUM!",   // mark：狩印；yum：吃點心（10-03）
  teleport:"TELEPORT"   // 死亡豁免失敗三次，被卡姆傳送回酒館（暫定字）
};

// 手機頁面的說明泡泡；集中放資料，之後可翻譯。
const PAGE_UI = {
  coverIntro:"矮人大爺的酒館裡，四隻小動物要第一次去冒險。",
  coverNext:"先替她們擲出屬性，再聽聽她們的冒險計畫。",
  help:"說明", close:"關閉", tutorial:"教學",
  helpPages:{
    roll:{title:"怎麼分配屬性",text:"擲出 6 組 4d6，每組取最高的三顆相加，變成 6 個數字。把數字拖到屬性格子裡（或先點數字、再點格子），也可以按「自動分配」。格子裡的數字可以拖回籌碼盤或拖到別格互換。綠色標籤是背景加成，創角時屬性上限 20。"},
    shop:{title:"怎麼挑裝備",text:"每隻 100 gp。重甲有力量需求；「重型」武器近戰要力量 13、遠程要敏捷 13；負重上限是力量值 × 15 磅。點分類或在商品區左右滑切換，上下滑看商品；點「裝備」查看或退貨。"},
    map:{title:"怎麼看大地圖",text:"拖曳可上下左右移動，滾輪或雙指縮放。游標移到地點看介紹，點擊便沿路導航；手機先點看介紹，再點出發。途中可停下，四隻的臉標出現在的位置。"}
  }
};

// 關於／授權（10-04）：大爺 10-04 要短，只說部分用 AI、規則來自 SRD。
// 畫面上不能寫 D&D（商標，見 docs/授權與安全.md）；下面兩句英文是 CC-BY 要求的出處標示，官方原句不要改字、不能拿掉
const ABOUT = {
  title:"關於／授權",
  intro:"本作部分內容使用 AI 製作；規則取自 SRD 5.2、5.1。",
  srd:[
    {name:"SRD 5.2", en:'This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.'},
    {name:"SRD 5.1", en:'This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.'}
  ]
};
