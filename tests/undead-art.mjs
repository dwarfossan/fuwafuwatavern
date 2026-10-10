// 不死怪物外觀（10-10 素材包）：骷髏／巫妖／女吸血鬼共用紙娃娃、殭屍／幽靈整張圖；巫妖法袍、吸血鬼禮服是可以穿的裝備
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const br=await chromium.launch();
try{
 const pg=await br.newPage({viewport:{width:390,height:844}});const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 await pg.goto('file://'+path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html')+'#doll');
 await pg.waitForFunction(()=>typeof MONSTER_LOOK!=='undefined'&&MONSTER_LOOK.ghost);
 const r=await pg.evaluate(()=>{const P=new DOMParser(),ok=s=>!P.parseFromString(s,'image/svg+xml').querySelector('parsererror');
  const looks=['skeleton','lich','vampire','zombie','ghost','death_knight','death_knight_bare','human_male','human_female'];
  return {svg:looks.every(k=>{const L=MONSTER_LOOK[k];return ok(L.face)&&(!L.head||ok(L.head)&&ok(L.headHurt))&&ok(dollSVG({look:L,face:-1,x:0,y:0,w:140}))&&ok(dollSVG({look:L,down:true,x:0,y:0,w:140}));}),
   bones:dollSVG({look:MONSTER_LOOK.skeleton,x:0,y:0,w:140}).includes('M68 82 H74 V113 H68Z'),
   items:['巫妖法袍','吸血鬼禮服','平民服'].map(n=>{const it=ITEMS.find(i=>i.n===n);return it&&it.type==='armor'&&it.noShop&&!!armorArt(n).body;}),
   worn:dollSVG({id:'fox',color:'#e08a4a',armor:'巫妖法袍',x:0,y:0,w:140}).includes('#aa905d')};});
 assert(r.svg);console.log('✓ 不死、死亡騎士、人類外觀的頭、頭像、站立與倒下都是合法 SVG');
 assert(r.bones);console.log('✓ 骷髏用自己的骨頭身體（bodyArt）');
 assert.deepEqual(r.items,[true,true,true]);assert(r.worn);console.log('✓ 巫妖法袍、吸血鬼禮服是裝備，小傢伙穿上會換外觀（含皇冠）');
 await pg.waitForSelector('.demo-stage',{timeout:60000});await pg.locator('[data-demo="who:undead"]').click();
 assert.equal(await pg.locator('.demo-stage svg.doll').count(),7);await pg.locator('[data-demo="who:human"]').click();assert.equal(await pg.locator('.demo-stage svg.doll').count(),4);console.log('✓ #doll 測試頁「不死」七隻（含死亡騎士兩版）、「人類」四種組合');
 const hu=await pg.evaluate(()=>{const o={};for(const [k,n] of [['male',5],['female',10]])for(let i=1;i<=n;i++){const L=humanLook({sex:k,hair:String(i).padStart(2,'0'),beard:k==='male'?String(((i-1)%5)+1).padStart(2,'0'):null,ears:i%2?'elf':'human',hairColor:'#123456'});if(!L.head.includes('#123456')&&!L.tail.includes('#123456'))o[k+i]='no hair color';}
   o.front=new Set(['male','female'].flatMap(k=>[1,2,3,4,5].map(i=>humanLook({sex:k,hair:'0'+i}).face))).size===10&&humanLook({}).face.includes('data-front="human"')&&MONSTER_LOOK.death_knight.face.includes('data-front="death_knight"');
   o.skull=MONSTER_LOOK.skeleton.head===MONSTER_LOOK.lich.head;
   const f=humanLook({sex:'female'});o.fit=dollSVG({look:f,armor:'平民服',x:0,y:0,w:140}).includes('dl-gear-body" transform="translate(70 0) scale(.88 1)');return o;});
 assert.deepEqual(hu,{front:true,skull:true,fit:true});console.log('✓ 人類、死亡騎士有正面頭像（每種髮型不同）；骷髏用巫妖的頭');console.log('✓ 人類 15 種髮型都吃得到髮色、女性衣服跟著變窄');
 assert.deepEqual(errors,[]);console.log('✓ 沒有錯誤');
}finally{await br.close();}
