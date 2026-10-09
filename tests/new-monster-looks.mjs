// 10-09 GPT 交付、大爺核准的外觀：五種新外觀（共用獸人／哥布林本體＋頭飾、戰痕、披風）與成年龍倒下趴姿。
// 只驗外觀：SVG 能解析、正面／側臉／受傷都帶頭飾、披風在、朝左鏡像、成年龍倒下不套旋轉、幼龍倒下不變。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const ok=svg=>!new DOMParser().parseFromString(svg.includes('xmlns')?svg:svg.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'),'image/svg+xml').querySelector('parsererror');
  const keys=['orc_shaman','orc_hero','orc_chief','goblin_hero','goblin_chief'],out={};
  for(const k of keys){const L=MONSTER_LOOK[k],base=MONSTER_LOOK[k.split('_')[0]];
   out[k]={exists:!!L,parse:[L.face,L.head,L.headHurt].every(ok),decorated:L.face!==base.face&&L.head!==base.head&&L.headHurt!==base.headHurt,tail:/<path/.test(L.tail),sameBody:L.body===base.body&&L.anchor===base.anchor};}
  const dr=o=>dollSVG({id:'d',look:MONSTER_LOOK.dragon_adult,face:1,x:0,y:0,w:140,seed:1,...o});
  const host=document.createElement('div');document.body.append(host);
  host.innerHTML=`<svg>${dr({down:true})}</svg>`;const prone=host.querySelector('.dragon-down-pose');
  out.dragon={prone:!!prone,noLie:prone&&!prone.querySelector('.dl-lie'),xx:/M192 102 L202 111/.test(dr({down:true}))};
  host.innerHTML=`<svg>${dr({down:true,face:-1})}</svg>`;out.dragon.left=/scale\(-1 1\)/.test(host.querySelector('.dl-face').getAttribute('transform')||'');
  host.innerHTML=`<svg>${dr({})}</svg>`;out.dragon.standUnchanged=!host.querySelector('.dragon-down-pose')&&!!host.querySelector('.dl-lie');
  host.innerHTML=`<svg>${dollSVG({id:'d',look:MONSTER_LOOK.dragon,face:1,x:0,y:0,w:140,seed:1,down:true})}</svg>`;out.dragon.youngUnchanged=!host.querySelector('.dragon-down-pose')&&!!host.querySelector('.dl-lie');
  host.remove();return out;
 });
 for(const k of ['orc_shaman','orc_hero','orc_chief','goblin_hero','goblin_chief'])assert.deepEqual(r[k],{exists:true,parse:true,decorated:true,tail:true,sameBody:true},k);
 assert.deepEqual(r.dragon,{prone:true,noLie:true,xx:true,left:true,standUnchanged:true,youngUnchanged:true});
 assert.deepEqual(errors,[]);
 console.log('✓ 五種新外觀（正面／側臉／受傷帶頭飾、披風、共用本體）＋成年龍倒下趴姿（不套旋轉、朝左、站姿與幼龍不變）');
}finally{await br.close();}
