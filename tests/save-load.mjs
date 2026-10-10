// 10-10 存檔／讀檔：1 自動＋3 手動、只在安全的地方存、讀檔還原、匯出／匯入、首頁「繼續冒險」、回到標題開新局
import {chromium} from 'playwright';import {bootReady} from './boot.mjs';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs/promises';import os from 'node:os';
const br=await chromium.launch(),errs=[],dialogs=[];
const url=h=>'file://'+path.resolve('index.html')+h;
try{
 const ctx=await br.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dialogs.push(d.message());d.accept();});
 const open=async h=>{await pg.goto(url(h));await pg.reload();await bootReady(pg);await pg.waitForTimeout(250);};
 const menu=async a=>{await pg.locator('[data-system-menu]').tap();await pg.locator(`[data-system-action="${a}"]`).tap();};
 // 新遊戲：沒存檔，首頁沒有「繼續冒險」
 await open('');assert.equal(await pg.locator('#continueGame').count(),0);
 // 進城鎮（安全的地方）自動存檔
 await open('#town');const auto=await pg.evaluate(()=>readSave('auto'));assert(auto&&auto.v===1&&auto.state.page==='town');
 assert.equal(auto.state.battle,undefined);assert.equal(auto.state.modal,undefined);
 // 手動存到 1
 await pg.evaluate(()=>{openTownPlace('smith');});const gold=await pg.evaluate(()=>state.gold.fox);
 await menu('save');assert.equal(await pg.locator('.save-slot').count(),4);assert.equal(await pg.locator('[data-save-to]').count(),3);
 await pg.locator('[data-save-to="1"]').tap();assert.match(await pg.locator('.save-msg').innerText(),/已存到「存檔 1」/);
 const meta=await pg.evaluate(()=>readSave('1').meta);assert.equal(meta.place,'裝備店');assert.deepEqual(meta.levels,[1,1,1,1]);
 // 覆蓋要確認
 await pg.locator('[data-save-to="1"]').tap();assert(dialogs.some(t=>/蓋掉「存檔 1」/.test(t)));
 // 改掉進度再讀檔：回到存檔當時
 await pg.evaluate(()=>{state.modal=null;state.gold.fox=0;state.townPlace=null;state.xp.fox=999;render();});
 await menu('load');await pg.locator('[data-load-from="1"]').tap();assert(dialogs.some(t=>/沒存的進度會不見/.test(t)));
 assert.deepEqual(await pg.evaluate(()=>[state.page,state.townPlace,state.gold.fox,state.xp?.fox||0,state.modal]),['town','smith',gold,0,null]);
 // 匯出存檔 1 → 匯入到 3
 await menu('load');const [dl]=await Promise.all([pg.waitForEvent('download'),pg.locator('[data-save-export="1"]').tap()]);
 const file=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'save-')),'s.json');await dl.saveAs(file);
 await pg.locator('[data-save-import="3"]').setInputFiles(file);await pg.waitForFunction(()=>!!readSave('3'));
 assert.equal(await pg.evaluate(()=>JSON.stringify(readSave('3'))===JSON.stringify(readSave('1'))),true);
 // 壞檔案匯入：拒絕、不寫
 const badFile=file.replace('s.json','bad.json');await fs.writeFile(badFile,'{"hello":1}');
 await pg.locator('[data-save-import="2"]').setInputFiles(badFile);await pg.waitForTimeout(200);assert.match(await pg.locator('.save-msg').innerText(),/不是存檔檔案/);assert.equal(await pg.evaluate(()=>readSave('2')),null);
 // 太新的版本：顯示且不能讀
 await pg.evaluate(()=>{const d=readSave('1');d.v=99;writeSave('2',d);state.modal={kind:'save',mode:'load'};render();});assert.match(await pg.locator('.save-slot').nth(2).innerText(),/版本太新/);assert(await pg.locator('[data-load-from="2"]').isDisabled());
 // 戰鬥／探索、劇情中不能存
 await open('#battle');await menu('save');assert.match(await pg.locator('.save-block').innerText(),/不能存檔/);assert(await pg.locator('[data-save-to="1"]').isDisabled());
 assert.equal(await pg.evaluate(()=>{state.modal=null;state.battle=null;state.page='story';state.scene='prologue';state.line=0;render();return saveBlockReason();}),'劇情進行中不能存檔');
 // 首頁：有存檔就有「繼續冒險」，讀最新那格；選單只有讀檔、關於
 await open('');assert.equal(await pg.locator('#continueGame').count(),1);await pg.locator('#continueGame').tap();await pg.waitForTimeout(300);
 assert.equal(await pg.evaluate(()=>state.page),'town');
 // 回到標題：確認後開新局（進度清空），存檔還在
 await menu('title');assert(dialogs.some(t=>/回到標題/.test(t)));assert.deepEqual(await pg.evaluate(()=>[state.page,Object.keys(state.sets).length,Object.keys(state.gold).length,!!readSave('1')]),['cover',0,0,true]);
 // 開新遊戲：有自動存檔時先確認
 const n=dialogs.length;await pg.locator('#start').tap();await pg.waitForTimeout(300);assert(dialogs.slice(n).some(t=>/自動存檔/.test(t)));
 assert.deepEqual(errs,[]);console.log('✓ 存讀檔：進城自動存、手動 3 格、覆蓋與讀檔確認、讀回原狀、匯出入、壞檔／新版擋下、戰鬥劇情不能存、首頁繼續冒險、回到標題開新局');
}finally{await br.close();}
