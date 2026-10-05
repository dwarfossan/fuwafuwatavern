import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

for(const name of ['title_bgm','daily_bgm','comedy_bgm','battle_bgm','victory_bgm'])
  assert(existsSync(path.resolve(`assets/bgm/${name}.mp3`)), `missing assets/bgm/${name}.mp3`);

const br=await chromium.launch();
try{
  const pg=await br.newPage({viewport:{width:390,height:844},hasTouch:true});
  await pg.goto('file://'+path.resolve('index.html')+'#battle?seed=123');
  await pg.waitForFunction(()=>typeof bgmTrackForState==='function');
  const r=await pg.evaluate(()=>{
    const pick=(page,scene=null,line=0,result=null)=>{state.page=page;state.scene=scene;state.line=line;state.battle=page==='battle'?{result}:null;return bgmTrackForState();};
    const comedyLine=FAREWELL.findIndex(line=>line.bgm==='comedy');
    return {tracks:BGM_TRACKS,cover:pick('cover'),prologue:pick('story','prologue'),farewell:pick('story','farewell',0),comedy:pick('story','farewell',comedyLine),map:pick('map'),town:pick('town'),battle:pick('battle',null,0,null),victory:pick('battle',null,0,'win'),lose:pick('battle',null,0,'lose')};
  });
  assert.deepEqual(r.tracks,{title:{src:'assets/bgm/title_bgm.mp3',loop:true},daily:{src:'assets/bgm/daily_bgm.mp3',loop:true},comedy:{src:'assets/bgm/comedy_bgm.mp3',loop:true},battle:{src:'assets/bgm/battle_bgm.mp3',loop:true},victory:{src:'assets/bgm/victory_bgm.mp3',loop:false}});
  assert.deepEqual(r,{tracks:r.tracks,cover:'title',prologue:'daily',farewell:'daily',comedy:'comedy',map:'title',town:'daily',battle:'battle',victory:'victory',lose:null});
  console.log('✓ BGM 場景 routing：酒館日常、放屁段落搞笑、大地圖封面、戰鬥、單次勝利曲');
}finally{await br.close();}
