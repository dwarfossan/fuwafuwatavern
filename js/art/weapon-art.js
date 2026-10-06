/* 武器外觀唯一表：只分外觀，不改技能組、裝備數值。原創SVG造型暫定GPT。
   同一 RAW 用於手持／掉落／投擲，ART 只包旋轉縮放供各介面使用。 */
const WEAPON_ART_MAP={
 '短棒':'club','匕首':'dagger','巨棒':'greatclub','手斧':'handaxe','標槍':'javelin','輕錘':'light_hammer','硬頭錘':'mace','長棍':'quarterstaff','鐮刀':'sickle','矛':'spear',
 '飛鏢':'dart','輕弩':'crossbow','短弓':'bow','投石索':'sling','戰斧':'axe','鏈枷':'flail','長柄刀':'glaive','巨斧':'greataxe','巨劍':'heavy','戟':'polearm','長劍':'sword','巨錘':'maul','釘頭錘':'morningstar','長矛':'pike','刺劍':'rapier','彎刀':'scimitar','短劍':'shortsword','三叉戟':'trident','戰錘':'warhammer','戰鎬':'warpick','鞭':'whip','吹箭筒':'blowgun','手弩':'hand_crossbow','重弩':'heavy_crossbow','長弓':'longbow','火槍':'firearm','手槍':'pistol'
};
const WEAPON_HELD={};
(()=>{
 const ink='#2a2630',steel='#c9d0dc',wood='#a0703f',gold='#e0ab45',leather='#6b4a35';
 const p=(d,c,w=5)=>`<path d="${d}" fill="${c}" stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const line=(d,c=ink,w=3)=>p(d,'none',w).replace(`stroke="${ink}"`,`stroke="${c}"`);
 const shaft=(top=-15,bottom=140,width=5)=>p(`M${60-width} ${top} H${60+width} V${bottom} H${60-width}Z`,wood);
 const grip=(top=94,bottom=125)=>p(`M54 ${top} H66 V${bottom} H54Z`,leather)+line(`M55 ${top+9} L65 ${top+12} M55 ${top+20} L65 ${top+23}`,'#3b302c',2);
 const blade=(tip=-15,shoulder=5,bottom=81,width=8)=>p(`M60 ${tip} L${60+width} ${shoulder} V${bottom} H${60-width} V${shoulder}Z`,steel)+line(`M60 ${tip+10} V${bottom-4}`,'#8c97ab',2);
 const guard=p('M31 83 H89 V92 H31Z',gold);
 const scaled=(raw,k,x=60,y=106)=>`<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">${raw}</g>`;
 const add=(key,raw,base,meta={})=>{
  ITEM_RAW[key]=`<g data-weapon-art="${key}">${raw}</g>`;
  ITEM_ART[key]=`<g transform="translate(60 60) scale(.62) translate(-60 -52) rotate(-32 60 52)">${ITEM_RAW[key]}</g>`;
  WEAPON_HELD[key]={base,...meta};
 };
 add('shortsword',blade(15,29,81,9)+guard+grip()+p('M53 128 H67 V135 H53Z',gold),'sword');
 add('rapier',blade(-35,-16,80,3.5)+p('M29 85 Q32 67 61 77 Q91 73 92 89 Q78 103 63 93Z',gold)+grip()+p('M58 126 H64 V135 H58Z',gold),'sword');
 add('greataxe',shaft(-14,140,7)+p('M60 -12 Q92 -38 112 -22 Q129 10 106 45 Q84 31 60 33 Q36 31 14 45 Q-9 10 8 -22 Q28 -38 60 -12Z',steel)+p('M51 -14 H69 V41 H51Z','#8c97ab',4),'heavy',{gy:100,two:128});
 add('maul',shaft(18,142,7)+p('M16 -18 H104 V29 H16Z',steel)+p('M16 -18 H29 V29 H16Z','#8c97ab',3)+p('M91 -18 H104 V29 H91Z','#8c97ab',3),'heavy',{gy:100,two:128});
 add('greatclub',p('M50 140 L45 38 Q32 9 42 -16 Q60 -40 80 -17 Q89 8 76 38 L70 140Z',wood)+line('M51 -3 L50 26 M61 38 L60 119','#6e4a32',4),'heavy',{gy:100,two:128});
 add('handaxe',scaled(ITEM_RAW.axe,.7,60,112),'axe');
 add('light_hammer',shaft(29,139,4)+p('M36 3 H84 V28 H36Z',steel),'mace');
 add('warhammer',shaft(22,139)+p('M25 -8 H87 V28 H25Z',steel)+p('M87 -4 L113 7 L87 19Z',steel),'mace');
 add('morningstar',shaft(28,139)+p('M60 -30 L68 -15 L83 -23 L84 -5 L102 0 L91 13 L99 28 L80 31 L72 48 L60 36 L48 48 L40 31 L21 28 L29 13 L18 0 L36 -5 L37 -23 L52 -15Z',steel),'mace');
 add('flail',shaft(32,139)+line('M60 32 Q68 -19 93 2 M78 -2 L91 13 M87 3 L99 18',steel,6)+p('M102 13 L110 7 L115 19 L128 19 L124 30 L132 39 L119 43 L117 55 L106 48 L94 52 L94 39 L84 32 L96 26Z',steel),'mace');
 add('warpick',shaft(8,139)+p('M28 -4 L67 -12 Q91 -11 115 13 Q82 5 67 17 L28 17Z',steel),'axe');
 add('quarterstaff',shaft(-35,145)+p('M53 -35 H67 V-18 H53Z',gold,3)+p('M53 126 H67 V145 H53Z',gold,3),'polearm');
 add('spear',shaft(17,144)+blade(-36,-8,25,9),'polearm');
 add('javelin',shaft(25,137,3.5)+blade(-17,2,30,6),'thrown',{gy:102,ang:15});
 add('pike',shaft(-5,152,4)+blade(-48,-27,4,6),'polearm',{s:.34});
 add('glaive',shaft(13,146)+p('M54 26 Q43 -9 77 -43 Q79 -2 67 26Z',steel)+p('M48 25 H72 V35 H48Z',gold,3),'polearm');
 add('trident',shaft(33,145)+p('M35 -28 L41 -16 V13 H54 V-26 L60 -43 L66 -26 V13 H79 V-16 L85 -28 V22 Q60 40 35 22Z',steel),'polearm');
 add('sickle',grip(89,125)+p('M55 89 Q26 73 36 36 Q45 5 81 18 Q113 30 91 59 Q99 32 77 29 Q54 24 52 50 Q48 69 66 76Z',steel),'dagger');
 add('whip',grip(100,132)+line('M60 100 Q19 83 32 55 Q45 30 91 47 Q120 58 94 84 Q81 96 76 83',ink,9)+line('M60 100 Q19 83 32 55 Q45 30 91 47 Q120 58 94 84 Q81 96 76 83',leather,4),'polearm',{gy:113,ang:20,two:null});
 add('dart',shaft(49,101,2.5)+blade(7,27,49,5)+p('M57 84 L46 105 L57 99 M63 84 L74 105 L63 99Z','#e0766e',3),'thrown',{gy:74});
 add('sling',line('M54 18 Q29 10 32 54 L48 90 M66 20 Q92 7 88 55 L70 90',ink,8)+line('M54 18 Q29 10 32 54 L48 90 M66 20 Q92 7 88 55 L70 90','#d8c49a',3)+p('M47 82 Q60 72 73 82 L71 107 Q60 116 49 107Z',leather),'thrown',{gy:25,ang:12});
 add('blowgun',shaft(-25,128,3.5)+p('M53 -26 H67 V-13 H53Z',gold,3)+p('M53 113 H67 V129 H53Z',gold,3),'thrown',{gy:105,ang:75});
 add('longbow',scaled(ITEM_RAW.bow,1.2,95,60),'bow',{s:.56});
 add('hand_crossbow',scaled(ITEM_RAW.crossbow,.66,60,112),'crossbow',{s:.4,two:null});
 add('heavy_crossbow',scaled(ITEM_RAW.crossbow,1.18,60,112)+p('M44 106 H76 V119 H44Z',steel,3),'crossbow',{two:65});
 // 輕弩的第二手托在弩身；手弩保留單手。
 WEAPON_HELD.crossbow={base:'crossbow',two:65};
})();
