/* 怪物跟著毛毛們的等級浮動（大爺 10-29）：數字在 data/scaling.js
   - partyLevelAvg：四隻的平均等級（四捨五入）
   - scaleFoes(units)：startBattle 建好單位後呼叫；只動 side==="foe" 的
     u.scaleLv＝高出基準幾級；u.scaleHit＝命中、豁免難度加值（attackRoll、dcOf 用）；u.scaleDmg＝每次傷害加值（hurt 用）；
     生命 maxHp、經驗 xpMul 照倍率乘 */
const partyLevelAvg = () => Math.round(CRITTERS.reduce((a,c)=>a + critterLevel(c.id), 0) / CRITTERS.length);
const scaleDelta = () => Math.max(0, partyLevelAvg() - SCALING.base);
function scaleFoes(units){
  const d = scaleDelta(); if(!d) return;
  units.filter(u=>u.side==="foe").forEach(u=>{
    u.scaleLv = d;
    u.maxHp = u.hp = Math.max(1, Math.round(u.maxHp * (1 + SCALING.hpPer*d)));
    u.scaleHit = Math.round(SCALING.hitPer*d);
    u.scaleDmg = Math.round(SCALING.dmgPer*d);
    u.xpMul = (u.xpMul || 1) * (1 + SCALING.xpPer*d);
  });
}
