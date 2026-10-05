import fs from 'node:fs';
import assert from 'node:assert/strict';

const portraits=fs.readFileSync('js/art/portraits.js','utf8');
const ids=['mira','ada','brun','liliana'];
let pngBytes=0,webpBytes=0;
for(const id of ids){
  const base=`assets/portraits/${id}_noface`;
  const sheet=`assets/faces/${id}/sheet`;
  assert(fs.existsSync(base+'.webp'),`${id} 底圖 WebP 缺失`);
  assert(fs.existsSync(sheet+'.webp'),`${id} 表情表 WebP 缺失`);
  assert.match(portraits,new RegExp(`${id}[\\s\\S]*?${id}_noface\\.webp`),`${id} 未改用 WebP 底圖`);
  assert.match(portraits,new RegExp(`${id}[\\s\\S]*?faces/${id}/sheet\\.webp`),`${id} 未改用 WebP 表情表`);
  pngBytes+=fs.statSync(base+'.png').size+fs.statSync(sheet+'.png').size;
  webpBytes+=fs.statSync(base+'.webp').size+fs.statSync(sheet+'.webp').size;
}
assert(webpBytes<pngBytes*.2,'WebP 總量應少於原 PNG 的 20%');
console.log(`PASS：城鎮 NPC 首次兩圖由 ${(pngBytes/1048576).toFixed(2)} MiB 降至 ${(webpBytes/1048576).toFixed(2)} MiB（${(100*(1-webpBytes/pngBytes)).toFixed(1)}%）。`);
