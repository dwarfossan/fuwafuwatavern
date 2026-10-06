/* 第一人稱場景背景（從四隻的眼睛看出去） */
// 城門代表圖（GPT 暫定）：正式素材日後替換，重要部分留在手機中央。
function townGateSVG(){
  return `<svg viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="1600" height="1100" fill="#b8d4d8"/>
    <path d="M0 590 Q400 390 800 550 T1600 500 V1100 H0Z" fill="#7f986b"/>
    <g stroke="#302b32" stroke-width="12" stroke-linejoin="round">
      <path d="M240 390H1360V920H240Z" fill="#baa890"/>
      <path d="M530 920V460 Q800 180 1070 460V920" fill="#625449"/>
      <path d="M620 920V490 Q800 280 980 490V920" fill="#e1c699"/>
      <path d="M360 390V240H520V390M1080 390V240H1240V390" fill="#baa890"/>
      <path d="M540 1100L700 730H900L1060 1100" fill="#cfb38a"/>
      <path d="M670 600H780V735H670ZM840 540H940V735H840Z" fill="#e2b98a"/>
      <path d="M650 600L725 520L800 600M820 540L890 475L960 540" fill="#a45d50"/>
    </g></svg>`;
}
// 劇情專用素材；戰場與狀態卡仍使用原 SVG。
const SCENE_ART={equipmentWall:"assets/scenes/equipment_wall.webp",road:"assets/scenes/road.webp",town:"assets/scenes/town.webp",cart:"assets/scenes/cart.webp",bow:"assets/scenes/goblin_bow.webp",club:"assets/scenes/goblin_club.webp",sword:"assets/scenes/goblin_sword.webp",mapMarker:"assets/scenes/map_marker.webp"};
function sceneAssetURL(src){return entryImageURLs.get(src)||src;}
function roadAmbushSVG(encounter=true){
 const INK="#2a2630";
 // 以原商隊合成背景600×740的構圖比對三隻大小／站位，透明方形圖等比。
 const gob=(x,y,w,key)=>`<image data-scene-asset="${key}" href="${sceneAssetURL(SCENE_ART[key])}" x="${x}" y="${y}" width="${w}" height="${w}"/>`;
 return `<svg viewBox="0 0 600 740" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">

 ${encounter?`<image data-scene-asset="cart" href="${sceneAssetURL(SCENE_ART.cart)}" x="-12" y="222" width="150" height="${150*1000/700}"/><svg width="600" height="740" viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMax slice">
    <g transform="translate(910 17)"><g class="story-bush">
      <ellipse cx="200" cy="668" rx="120" ry="16" fill="#000" opacity=".18"/>
      <circle cx="140" cy="630" r="46" fill="#4f7d42" stroke="${INK}" stroke-width="5"/>
      <circle cx="262" cy="634" r="44" fill="#4f7d42" stroke="${INK}" stroke-width="5"/>
      <circle cx="200" cy="608" r="58" fill="#5a8a48" stroke="${INK}" stroke-width="5"/>
      <path d="M100 664 L300 664" stroke="#4f7d42" stroke-width="10"/>
      <circle cx="180" cy="590" r="14" fill="#7aa864"/><circle cx="252" cy="620" r="9" fill="#7aa864"/><circle cx="128" cy="618" r="8" fill="#7aa864"/>
    </g></g>
 </svg>${gob(195,135,260,'bow')}${gob(10,270,310,'club')}${gob(200,310,400,'sword')}`:''}
 </svg>`;
}

// 莉莉安娜店外代表圖，GPT 暫定；原商人素材演出送貨。
function townShopFrontSVG(){return `<svg viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="1600" height="1100" fill="#aa94b1"/><g stroke="#302b32" stroke-width="14" stroke-linejoin="round"><path d="M360 400L800 150L1240 400V980H360Z" fill="#796679"/><path d="M360 400L800 150L1240 400" fill="none"/><path d="M700 980V500Q860 370 1020 500V980" fill="#342c3a"/><path d="M450 430H610V650H450Z" fill="#d4bd8c"/><path d="M580 300H900V420H580Z" fill="#c7abcf"/><path d="M0 980H1600V1100H0Z" fill="#b69a85"/></g><svg x="640" y="270" width="200" height="190" viewBox="0 0 100 100">${townSymbolSVG('potion').replace(/<svg[^>]*>|<\/svg>/g,'')}</svg></svg>`;}
