// 風格（大爺 10-09）：同類上限、不同類混搭、上限加成、名稱顯示「戰士風格：反擊」、被擋時小筆記顯示原因、敵我同一套。
// 第二個戰士風格與俠盜風格被動只是測試 fixture，不是遊戲內容。
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {bootReady} from './boot.mjs';
const br=await chromium.launch();
try{
 const p=await br.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'#battle?seed=123');await bootReady(p);
 const r=await p.evaluate(()=>{
  const b=B(),u=b.units.find(u=>u.id==='tiger');b.flowEpoch=(b.flowEpoch||0)+1;b.busy=false;
  const add=(id,name,style)=>{const g=SKILL_GROUPS.find(g=>g.id==='natural'),def={id,name,style,activation:'passive',kind:'被動',tier:0,text:'僅測試'};g.skills.push(def);SKILL_BY_ID[id]={g,idx:g.skills.length-1};};
  add('fixture_warrior','測試戰士','warrior');add('fixture_rogue','測試俠盜','rogue');
  for(const key of ['counterattack','fixture_warrior','fixture_rogue'])if(!u.learned.some(n=>n.key===key))u.learned.push({key,name:key});
  u.activeSkills=[];
  const first=toggleCarriedSkill(u,'counterattack');
  const second=toggleCarriedSkill(u,'fixture_warrior');
  const reason=carryBlockReason(u,'fixture_warrior');
  const mix=toggleCarriedSkill(u,'fixture_rogue');
  // 存檔被改成同類兩個時，carriedSkillKeys 也只認上限內的
  u.activeSkills=['counterattack','fixture_warrior'];const capped=carriedSkillKeys(u).filter(k=>skillStyle(learnedSkillByKey(k))==='warrior').length;
  u.styleBonus={warrior:1};const bonus=carriedSkillKeys(u).filter(k=>skillStyle(learnedSkillByKey(k))==='warrior').length;u.styleBonus=null;
  const label=skillLabel(learnedSkillByKey('counterattack').def);
  // 敵我同一套：敵人的被動清單一樣受上限
  const e=b.units.find(v=>v.side==='foe');e.learned=[{key:'counterattack',name:'反擊'},{key:'fixture_warrior',name:'測試戰士'}];e.activeSkills=['counterattack','fixture_warrior'];
  const foeCapped=carriedSkillKeys(e).length;
  u.activeSkills=['counterattack','fixture_rogue'];b.info='tiger';b.infoPage='notes';refreshBattle();
  return {first,second,reason,mix,capped,bonus,label,foeCapped};
 });
 assert.equal(r.first,true,'第一個戰士風格可以勾');
 assert.equal(r.second,false,'同類第二個被擋');
 assert.equal(r.reason,'戰士風格只能帶 1 個');
 assert.equal(r.mix,true,'不同類可以混搭');
 assert.equal(r.capped,1,'超過上限的存檔只認上限內');
 assert.equal(r.bonus,2,'上限加成可以多帶');
 assert.equal(r.label,'戰士風格：反擊');
 assert.equal(r.foeCapped,1,'敵人同樣受同類上限');
 // 手機實際點：小筆記顯示名稱、被擋時顯示原因
 await p.evaluate(()=>{const b=B();b.info=null;b.phase='explore';b.exploreRest=true;b.restWho='tiger';refreshBattle();});
 await p.locator('.rest-box').first().waitFor();const names=await p.locator('.rest-box .note-skill-row .sk-n').allInnerTexts();
 assert(names.includes('戰士風格：反擊'),'小筆記顯示風格名稱：'+names.join('、'));
 // fixture 在第二頁時先翻頁
 const btn=p.locator('.rest-box [data-noteskill="fixture_warrior"]');
 while(!(await btn.count())){const next=p.locator('.rest-box [data-notepage]').last();await next.tap();}
 await btn.tap();assert.match(await p.locator('.rest-box .note-block').innerText(),/戰士風格只能帶 1 個/);
 assert.deepEqual(errors,[]);
 console.log('✓ 風格：同類上限、混搭、上限加成、名稱「戰士風格：反擊」、被擋原因、敵我同一套');
}finally{await br.close();}
