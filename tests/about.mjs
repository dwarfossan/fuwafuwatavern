// 關於／授權：封面和戰場主選單都打得開，SRD 5.1、5.2 官方英文原句完整（CC-BY 4.0 出處標示）
import {chromium} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../index.html'),shots=process.env.ABOUT_SHOTS;
const br=await chromium.launch(),pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errs=[];pg.on('pageerror',e=>errs.push(e.message));
const check=async()=>{
  const t=await pg.locator('.modal .about').innerText();
  assert(t.includes('This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.'),'5.2 原句');
  assert(t.includes('This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document.'),'5.1 原句');
  assert.equal((t.match(/Creative Commons Attribution 4\.0 International License/g)||[]).length,2);
  assert.equal(await pg.locator('.modal .about a[href="https://creativecommons.org/licenses/by/4.0/legalcode"]').count(),2,'授權網址可點、句點不算進網址');
  const box=await pg.locator('.modal').boundingBox();assert(box.x>=0&&box.x+box.width<=390,'手機不出界');
  assert(!(await pg.evaluate(()=>document.documentElement.scrollWidth>390)),'沒有橫向捲動');
};
try{
  await pg.goto('file://'+root);await pg.locator('[data-about]').click();await check();await pg.waitForTimeout(400);if(shots)await pg.screenshot({path:shots+'/about-cover.png'});
  await pg.locator('.md-x').click();assert.equal(await pg.locator('.modal').count(),0);
  await pg.goto('file://'+root+'#battle?seed=123');await pg.reload();await pg.waitForTimeout(600);
  await pg.locator('#gearToggle').click();await pg.locator('[data-sys="about"]').click();await check();await pg.waitForTimeout(400);if(shots)await pg.screenshot({path:shots+'/about-battle.png'});
  await pg.locator('.md-x').click();assert.equal(await pg.locator('.modal').count(),0);
  assert.deepEqual(errs,[]);console.log('✓ 封面、戰場主選單都打得開關於／授權；SRD 5.1、5.2 原句與授權連結完整；手機不出界');
}finally{await br.close();}
