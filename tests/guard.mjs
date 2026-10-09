// 戰士風格：守護（大爺 10-09）：拿盾、周圍 1 格內的隊友每輪每人第一次被攻擊劣勢；不保護自己；
// 第二次不擋；別的隊友各自一次；2 格外不擋；沒盾、沒帶不擋；守護者回合開始重置；倒下不擋；敵我一致。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const b=B();b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;
  const U=id=>b.units.find(v=>v.id===id),g=U('tiger'),a1=U('fox'),a2=U('wolf'),f=b.units.find(v=>v.side==='foe');
  b.units.filter(v=>v.side==='foe'&&v!==f).forEach(v=>{v.dead=true;});
  const shield=makeItem(ITEMS.find(i=>i.n==='盾牌'),false,g);
  const setup=()=>{g.shield=shield;g.offhand=null;g.down=false;g.guarded={};if(!g.learned.some(n=>n.key==='shield_guard'))g.learned.push({key:'shield_guard',name:'守護'});g.activeSkills=['shield_guard'];
   [g,a1,a2].forEach(v=>{v.statuses=[];v.down=false;v.dead=false;});
   g.x=10;g.y=10;a1.x=10;a1.y=11;a2.x=11;a2.y=10;f.x=10;f.y=12;f.statuses=[];};
  // 每次攻擊看有沒有出現守護紀錄
  const hit=t=>{const n=B().log.length;attackRoll(f,t,{bonus:0});return B().log.slice(n).some(l=>/守護著/.test(l.t));};
  const out={};
  setup();out.first=hit(a1);out.second=hit(a1);out.other=hit(a2);out.self=hit(g);
  beginTurn(g);out.nextRound=hit(a1);
  setup();a1.y=12;f.y=13;out.far=hit(a1);
  setup();g.shield=null;out.noShield=hit(a1);
  setup();g.activeSkills=[];out.notCarried=hit(a1);
  setup();g.down=true;out.down=hit(a1);
  // 敵我一致：敵人帶守護保護旁邊的同伴
  const f2=b.units.find(v=>v.side==='foe'&&v!==f);f2.dead=false;f2.down=false;f2.statuses=[];f2.shield=shield;f2.learned=[{key:'shield_guard',name:'守護'}];f2.activeSkills=['shield_guard'];f2.guarded={};
  f.x=20;f.y=20;f2.x=21;f2.y=20;const n=B().log.length;attackRoll(a1,f,{bonus:0});out.foe=B().log.slice(n).some(l=>/守護著/.test(l.t));
  out.label=skillLabel(learnedSkillByKey('shield_guard').def);
  return out;
 });
 assert.deepEqual(r,{first:true,second:false,other:true,self:false,nextRound:true,far:false,noShield:false,notCarried:false,down:false,foe:true,label:'戰士風格：守護'});
 assert.deepEqual(errors,[]);
 console.log('✓ 守護：1 格內隊友每輪第一次劣勢、第二次不擋、各隊友各一次、不保護自己、回合開始重置；2 格外／沒盾／沒帶／倒下不擋；敵我一致');
}finally{await br.close();}
