/* 快速戰鬥測試場。純資料產生器，不改固定伏擊；所有隨機配置由 seed 決定。
   數量／疏密預設暫定（GPT），可從 options 調整。通路按現有八方向移動驗證。 */
const RANDOM_MAP = {w:23,h:26,foes:4,bush:[18,42],tree:[12,28],crate:[4,10],wagon:[2,5],plateaus:2};
function mapRng(seed){let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
function randomMapConnected(d){
  const solid=new Set(d.blocks.filter(q=>q.kind!=="bush").map(q=>`${q.x},${q.y}`));
  const points=[...d.party,...d.foes.map(q=>[q.x,q.y])];
  if(points.some(([x,y])=>solid.has(`${x},${y}`)))return false;
  const seen=new Set([points[0].join(',')]),open=[points[0]];
  for(let i=0;i<open.length;i++){const [x,y]=open[i];for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
    if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
    if(nx<0||ny<0||nx>=d.w||ny>=d.h||solid.has(k)||seen.has(k))continue;seen.add(k);open.push([nx,ny]);
  }}
  return points.every(p=>seen.has(p.join(',')));
}
function generateRandomBattle(seed,options={}){
  const cfg={...RANDOM_MAP,...options},requestedSeed=seed>>>0;
  for(let attempt=0;attempt<100;attempt++){
    const used=(requestedSeed+attempt)>>>0,r=mapRng(used),int=(a,b)=>a+Math.floor(r()*(b-a+1));
    const d={name:"隨機測試場",seed:used,requestedSeed,w:cfg.w,h:cfg.h,tutorial:true,road:[],blocks:[],elev:[],party:[],foes:[],npcs:[]};
    const reserved=new Set(),pick=(x0,x1,y0,y1)=>{for(let n=0;n<2000;n++){const p=[int(x0,x1),int(y0,y1)],k=p.join(',');if(!reserved.has(k)){reserved.add(k);return p;}}throw Error("地圖空間不足");};
    // 出生區在兩側，預留周圍空格，避免一出生就被包住。
    for(let i=0;i<4;i++)d.party.push(pick(cfg.w-5,cfg.w-2,8,cfg.h-8));
    const types=Object.keys(ENEMIES);
    for(let i=0;i<cfg.foes;i++){const [x,y]=pick(1,7,6,cfg.h-6),type=types[int(0,types.length-1)],hidden=r()<.35;d.foes.push({type,x,y,hidden});if(hidden)d.blocks.push({x,y,kind:"bush"});}
    for(const [x,y] of [...d.party,...d.foes.map(q=>[q.x,q.y])])for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)reserved.add(`${x+dx},${y+dy}`);
    const row=int(10,15);d.road=roadRow([row,row+1],cfg.w);
    for(const kind of ["bush","tree","crate","wagon"]){const range=cfg[kind],count=Array.isArray(range)?int(...range):range;
      for(let i=0;i<count;i++){const [x,y]=pick(1,cfg.w-2,1,cfg.h-2);d.blocks.push({x,y,kind});}}
    for(let i=0;i<cfg.plateaus;i++){const x=int(1,cfg.w-7),y=int(1,cfg.h-7);d.elev.push({x0:x,y0:y,x1:x+4,y1:y+4,h:1},{x0:x+1,y0:y+1,x1:x+3,y1:y+3,h:2});}
    if(randomMapConnected(d))return d;
  }
  throw Error("隨機地圖連通檢查失敗");
}
