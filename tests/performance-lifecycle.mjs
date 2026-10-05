import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(file,'utf8');
const portraits=read('js/art/portraits.js');
const render=read('js/battle/render.js');
const ground=read('js/battle/ground.js');
const main=read('js/main.js');
const explore=read('js/battle/explore.js');

assert.equal(/\bnew Image\s*\(/.test(portraits),false,'表情圖不可在開機時用 Image 預載');
assert.equal(/preload(?:Portraits|CritterFaces)/.test(portraits),false,'不可保留表情圖預載器');

const bind=render.slice(render.indexOf('function bindBattle(){'),render.indexOf('function bindModal(){'));
assert.equal(/u\.side==="pc"\)\s*centerCam/.test(bind),false,'玩家回合不可無條件置中鏡頭');
assert.match(bind,/!touches\.size && !foeHid\(u\) && !onScreen\(u\)/,'焦點只在單位離開視野時移鏡');

assert.match(render,/function syncBattleUiTimer\(\)/,'100ms UI 輪詢需有生命週期同步器');
assert.match(render,/clearInterval\(battleUiTimer\)/,'離開戰場需停止 100ms UI 輪詢');
assert.match(ground,/function syncGroundClockTimer\(\)/,'200ms 地面時鐘需有生命週期同步器');
assert.match(ground,/clearInterval\(groundClockTimer\)/,'離開探索需停止 200ms 地面時鐘');
assert.match(main,/syncBattleUiTimer\(\).*syncGroundClockTimer\(\)/s,'換頁時需同步停止戰場計時器');
assert.match(explore,/b\.phase="combat"[\s\S]{0,400}syncGroundClockTimer\(\)/,'探索切入戰鬥要立刻停止地面時鐘');

console.log('PASS：按需載入肖像、離屏才跟鏡、戰場 100ms／探索 200ms 輪詢皆受生命週期管理。');
