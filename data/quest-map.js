/* 委託地圖產生器（大爺 10-21：測試場太亂，委託另外畫一種）。#battle 測試場照舊用 random-map.js。
   版面：小傢伙從右邊沿著路走進來，路彎彎曲曲通到左邊；敵人主力在左邊紮營，一部分躲在路邊草叢。
   地形一團一團放（不是整張亂撒），看委託在哪條路上分三種主題（draft：香香，數量都暫定）：
   - forest 林道：路兩旁成片樹林，路邊一條條草叢，草叢裡可能有油
   - mountain 山路：路夾在兩邊的山坡（一層一層往上）中間，有一段窄道；路上可能有陷阱；敵營旁有一塊高台
   - plain 平原道路：空曠，幾叢草、幾棵樹，路邊停著翻倒的貨車，可能有一小片水
   敵人是哥布林／獸人／強盜：營地有箱子、火藥桶、一個寶箱（搶來的貨）。大型怪物身邊留空地（2×2 以上）。
   每張圖做完都驗證：路上沒擋、所有人都走得到彼此。同一個 seed 一定畫出同一張。 */
const QUEST_MAP = {w:23, h:26};
const QUEST_THEME = {"town-forest":"forest", "town-cave":"mountain", "tavern-town":"plain"};
const QUEST_CAMP_FOES = new Set(["goblin","goblin_archer","goblin_shaman","orc","bandit","bandit_archer"]);
const QUEST_SNEAKY = new Set(["goblin","goblin_archer","bandit","bandit_archer","skeleton_archer","giant_spider"]);   // 會躲草叢的
function generateQuestMap(seed, options={}){
  const theme = options.theme || "plain", foeList = options.foeList || ["goblin","goblin","goblin_archer"], requestedSeed = seed>>>0;
  const big = t => ["大型","巨型","超巨型"].includes(ENEMIES[t]?.size) || !!ENEMIES[t]?.mount;
  for(let attempt=0; attempt<200; attempt++){
    const used = (requestedSeed + attempt)>>>0, r = mapRng(used), int = (a,b)=>a+Math.floor(r()*(b-a+1)), chance = p=>r()<p;
    const W = QUEST_MAP.w, H = QUEST_MAP.h;
    const d = {name:options.name||"委託", seed:used, requestedSeed, theme, w:W, h:H, tutorial:false, road:[], blocks:[], elev:[], party:[], foes:[], npcs:[]};
    const key = (x,y)=>`${x},${y}`, inMap = (x,y)=>x>=0&&y>=0&&x<W&&y<H;
    const taken = new Map();   // 格子 → 放了什麼（每格只放一樣東西）
    const keep = new Set();    // 要留空的格子（路、出生點、大怪物身邊）
    const put = (x,y,kind,extra={})=>{ const k=key(x,y); if(!inMap(x,y)||taken.has(k)||keep.has(k)) return false; taken.set(k,kind); d.blocks.push({x,y,kind,...extra}); return true; };
    // ---- 路：從右邊到左邊，兩格寬，每隔幾格往上或往下彎一格 ----
    const cy = []; let y = int(10,14);
    for(let x=W-1; x>=0; x--){ cy[x] = y; if(x%3===0 && chance(.6)) y = Math.max(6, Math.min(H-8, y + (chance(.5)?1:-1))); }
    const road = new Set();
    for(let x=0; x<W; x++) for(const yy of [cy[x], cy[x]+1]){ road.add(key(x,yy)); d.road.push([x,yy]); }
    // 斜著彎的地方補一格，路才不會斷成鋸齒
    for(let x=1; x<W; x++) if(cy[x]!==cy[x-1]){ const yy = cy[x]>cy[x-1] ? cy[x-1]+2 : cy[x-1]-1; if(!road.has(key(x,yy))){ road.add(key(x,yy)); d.road.push([x,yy]); } }
    road.forEach(k=>keep.add(k));
    const offRoad = (x,y)=>{ let n=99; for(let dy=-6;dy<=6;dy++) if(road.has(key(x,y+dy))) n=Math.min(n,Math.abs(dy)); return n; };   // 離路幾格（同一欄）
    const side = (x,y)=>y < cy[x] ? -1 : 1;
    // ---- 出生點：小傢伙在右邊路上 ----
    const px = W-3; d.party.push([px, cy[px]], [px, cy[px]+1], [px+1, cy[px+1]], [px+1, cy[px+1]+1]);
    d.party.forEach(([x,y])=>{ for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) keep.add(key(x+dx,y+dy)); });
    // ---- 敵人：主力在左邊路旁紮營；會躲的小怪一部分躲在中段路邊 ----
    const n = foeList.length, camp = foeList.some(t=>QUEST_CAMP_FOES.has(t));
    const sneakIdx = n>=3 ? foeList.map((t,i)=>i).filter(i=>QUEST_SNEAKY.has(foeList[i]) && !big(foeList[i])).slice(-Math.min(2, n-2)) : [];
    const campX = int(3,5), campY = cy[campX];
    const foeAt = new Set();
    const roomFor = (x,y,s)=>{ for(let dx=-1;dx<=s;dx++) for(let dy=-1;dy<=s;dy++){ const k=key(x+dx,y+dy); if(!inMap(x+dx,y+dy)||foeAt.has(k)) return false; } return true; };
    const ambushX = int(9,12), ambushSide = chance(.5) ? -1 : 1;
    let ambushN = 0, campN = 0;
    for(let i=0; i<n; i++){
      const t = foeList[i], hidden = sneakIdx.includes(i), s = big(t) ? 2 : 1;
      let spot = null;
      for(let tries=0; tries<400 && !spot; tries++){
        let x, yy;
        if(hidden){ x = ambushX + int(-1,2); yy = ambushSide<0 ? cy[x] - int(2,3) : cy[x] + 1 + int(2,3); }
        else { x = campX + int(-2,3); yy = campY + int(-3,4); }
        if(!inMap(x,yy) || x<1 || yy<1 || x+s>W-1 || yy+s>H-1) continue;
        if(!roomFor(x,yy,s)) continue;
        // 一開場就看到小傢伙們會直接開戰（跳過探索）：離出生點要比牠的偵測距離多 2 格
        const det = (ENEMIES[t]?.detectRange||6) + 2;
        if(d.party.some(([qx,qy])=>Math.max(Math.abs(qx-x),Math.abs(qy-yy)) <= det)) continue;
        spot = [x,yy];
      }
      if(!spot) break;
      const [x,yy] = spot;
      for(let dx=0;dx<s;dx++) for(let dy=0;dy<s;dy++) foeAt.add(key(x+dx,yy+dy));
      if(s>1) for(let dx=-1;dx<=s;dx++) for(let dy=-1;dy<=s;dy++) keep.add(key(x+dx,yy+dy));   // 大型的身邊留空
      else keep.add(key(x,yy));
      d.foes.push({type:t, x, y:yy, hidden, trapCharges:ENEMY_TRAPS.count, squad: hidden ? 9 : Math.floor((campN++)/2)});
      if(hidden){ ambushN++; keep.delete(key(x,yy)); put(x,yy,"bush"); keep.add(key(x,yy)); }
    }
    if(d.foes.length < n) continue;
    // 躲的那邊再長一叢草，看起來像本來就在那裡
    if(ambushN){ d.foes.filter(f=>f.hidden).forEach(f=>{ for(let k=0;k<4;k++) put(f.x+int(-1,1), f.y+int(-1,1), "bush"); }); }
    // ---- 一團一團的地形 ----
    const blob = (x0,y0,size,kind,ok=()=>true)=>{ const cells=[[x0,y0]]; let placed=0;
      for(let i=0;i<cells.length && placed<size;i++){ const [x,yy]=cells[i]; if(ok(x,yy) && put(x,yy,kind)) placed++;
        const nb=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]].sort(()=>r()-.5); nb.forEach(([dx,dy])=>{ if(r()<.75) cells.push([x+dx,yy+dy]); }); }
      return placed; };
    const notOnEdgeOfRoad = (x,yy)=>offRoad(x,yy)>=2;
    const randCell = (minOff, maxOff=99)=>{ for(let i=0;i<300;i++){ const x=int(0,W-1), yy=int(0,H-1); const o=offRoad(x,yy); if(o>=minOff && o<=maxOff && !taken.has(key(x,yy)) && !keep.has(key(x,yy))) return [x,yy]; } return null; };
    if(theme==="forest"){
      // 樹林：路兩邊各幾大片，離路至少兩格
      for(let i=0;i<int(8,10);i++){ const c=randCell(3); if(c) blob(c[0],c[1],int(6,11),"tree",notOnEdgeOfRoad); }
      // 草叢：沿著路邊一段一段
      for(let i=0;i<int(5,7);i++){ const x=int(1,W-2), s=chance(.5)?-1:1, yy = s<0 ? cy[x]-1 : cy[x]+2; blob(x,yy,int(3,5),"bush",(xx,y2)=>offRoad(xx,y2)<=2); }
      for(let i=0;i<int(3,5);i++){ const c=randCell(2); if(c) blob(c[0],c[1],int(2,4),"bush"); }
      if(chance(.35)){ const c=randCell(4); if(c) blob(c[0],c[1],int(2,3),"poisonSwamp"); }
    } else if(theme==="mountain"){
      // 山坡：路上方和下方各一片，越遠越高（一層、兩層），中間有一段窄道貼著路
      const pass = int(9,13);
      for(const s of [-1,1]){
        for(let x=0;x<W;x++){
          const near = Math.abs(x-pass)<=2 ? 1 : 2;           // 窄道那段山坡貼到路邊一格
          const edge = s<0 ? cy[x]-near : cy[x]+1+near;        // 山坡從這一格開始往外
          const far = s<0 ? 0 : H-1;
          const a = Math.min(edge,far), b = Math.max(edge,far);
          d.elev.push({x0:x, y0:a, x1:x, y1:b, h:1});
          const e2 = edge + s*int(2,3), a2=Math.min(e2,far), b2=Math.max(e2,far); if((s<0?e2>=0:e2<=H-1)) d.elev.push({x0:x, y0:a2, x1:x, y1:b2, h:2});
        }
      }
      // 敵營旁邊一塊高台（三層）給射手站
      const hx = Math.max(0,campX-2), hs = chance(.5)?-1:1, hy = hs<0 ? Math.max(0,cy[hx]-5) : Math.min(H-4,cy[hx]+4);
      d.elev.push({x0:hx, y0:hy, x1:hx+2, y1:hy+2, h:3});
      for(let i=0;i<int(3,6);i++){ const c=randCell(4); if(c) blob(c[0],c[1],int(1,2),"tree"); }
      for(let i=0;i<int(3,5);i++){ const c=randCell(2); if(c) blob(c[0],c[1],int(2,4),"bush"); }
      // 窄道的路上埋陷阱（路格本來留空，陷阱可以踩，所以特別放）
      for(let i=0;i<int(1,2);i++){ const x=pass+int(-1,1), yy=cy[x]+int(0,1), k=key(x,yy); if(!taken.has(k)){ taken.set(k,"trap"); d.blocks.push({x,y:yy,kind:"trap"}); } }
    } else {
      // 平原：幾叢草、零星的樹、一小片水、路邊一台翻倒的貨車
      for(let i=0;i<int(4,6);i++){ const c=randCell(2); if(c) blob(c[0],c[1],int(2,4),"bush"); }
      for(let i=0;i<int(5,8);i++){ const c=randCell(3); if(c) blob(c[0],c[1],int(1,2),"tree"); }
      if(chance(.5)){ const c=randCell(4); if(c) blob(c[0],c[1],int(3,6),"water"); }
      const wx = int(13,16), ws = chance(.5)?-1:1, wy = ws<0 ? cy[wx]-1 : cy[wx]+2;
      if(put(wx,wy,"wagon")){ put(wx+1,wy,"crate"); if(chance(.5)) put(wx-1,wy+ws,"crate"); }
    }
    // ---- 營地：箱子、火藥桶、寶箱 ----
    if(camp){
      const ring = []; for(let dx=-3;dx<=3;dx++) for(let dy=-4;dy<=5;dy++){ const x=campX+dx, yy=campY+dy; if(inMap(x,yy) && x>=1 && offRoad(x,yy)>=1) ring.push([x,yy]); }
      ring.sort(()=>r()-.5);
      let crates=int(2,4), barrels=int(1,2), chest=1;
      for(const [x,yy] of ring){
        if(crates && put(x,yy,"crate")) crates--;
        else if(barrels && put(x,yy,"powderBarrel")) barrels--;
        else if(chest && put(x,yy,"chest",{locked:true,contents:[]})) chest--;
        if(!crates && !barrels && !chest) break;
      }
    } else if(chance(.4)){ const c=randCell(3); if(c) put(c[0],c[1],"chest",{locked:true,contents:[]}); }
    // ---- 林道草叢裡的油 ----
    if(theme==="forest"){
      const grass = d.blocks.filter(o=>o.kind==="bush" && !d.foes.some(f=>f.x===o.x&&f.y===o.y));
      for(let i=0;i<int(1,3)&&grass.length;i++){ const o=grass.splice(int(0,grass.length-1),1)[0]; d.blocks.push({kind:"oil",x:o.x,y:o.y,dc:13,found:false}); }
    }
    if(questMapOk(d)) return d;
  }
  throw Error("委託地圖產生失敗");
}
// 驗證：路上沒有擋路的東西、每個人（大型的整塊）都走得到小傢伙那邊
function questMapOk(d){
  if(!randomMapConnected(d)) return false;
  const solid = new Set(d.blocks.filter(q=>!["bush","trap","doorOpen","water","oil","poisonSwamp"].includes(q.kind)).map(q=>`${q.x},${q.y}`));
  if(d.road.some(([x,y])=>solid.has(`${x},${y}`))) return false;
  return true;
}
