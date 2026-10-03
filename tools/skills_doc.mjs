// 技能表產生器：讀 data/skills.js（＋道具、施展條件的名稱），寫出 docs/技能表.md
// 用法：node tools/skills_doc.mjs　　改了 data/skills.js、data/items.js 的武器就重跑一次（2026-10-02 重寫，舊的 10-01 刪掉了）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
// 施展條件的中文名在 js/battle/flow.js 的 REQ_TEXT（那支檔案相依太多，只取這一段）
const reqSrc = read('js/battle/flow.js').match(/const REQ_TEXT = \{[\s\S]*?\n\};/)[0];
const ctx = vm.createContext({});
vm.runInContext([read('data/items.js'), read('data/skills.js'), reqSrc,
  'globalThis.__out = {SKILL_GROUPS, REQ_TEXT, skillType, componentsText, basicNames, HAS_BASIC, ITEMS};'].join('\n;\n'), ctx);
const {SKILL_GROUPS, REQ_TEXT, skillType, componentsText, basicNames, HAS_BASIC} = ctx.__out;

const TIER = ["不用格子","一階","二階","三階","四階","五階","六階","七階","八階","九階"];
const reqText = r => !r ? "—" : (Array.isArray(r) ? r : [r]).map(x=>REQ_TEXT[x]||x).join("或");
const cell = s => String(s).replace(/\|/g, "／").replace(/\n/g, " ");
function upText(s){
  if(!s.tier) return "—";
  if(s.noUp) return "不能升階";
  if(s.up) return s.up;
  return "每高一階，命中時多 1 顆武器骰";      // 程式：沒寫 up 的招，升階＝命中時多武器骰（js/battle/skills.js 的 canUp、doSkill 的 upDice）
}

const out = [];
out.push(`# 裝備 → 技能表

> 由 \`tools/skills_doc.mjs\` 從 \`data/skills.js\` 自動產生，**不要手改**；改了技能就重跑：\`node tools/skills_doc.mjs\`
> 招式放在哪一類只是「出處」，誰能用看「施展條件」。技能的來源是觀察學習＋小筆記（\`docs/小筆記規格.md\`），沒有職業。

**共通數字**：命中 = d20 + 屬性調整值 + 2 ≥ 目標 AC｜豁免 DC = 8 + 2 + 屬性調整值｜生命值（1 級）= 8 + 體質調整值｜1 格 = 5 呎｜檢定直接用六圍

**熟練格**（見 \`docs/熟練格規格.md\`）：每個角色照等級有一階、二階……的格子（全施法者的表，一級是一階 2 格）。普攻、戲法不用格子；其他招式每用一次用掉一格。**升階**：用比要求高的格子放，每高一階多一份升階效果；一階用完也可以拿高階的格子放。

**類型**＝判定方式・傷害。判定方式：**近戰**／**遠程**＝擲攻擊骰對 AC；**豁免**＝對方擲豁免；**輔助**＝不打人。一招有兩段的，照第一段擲的骰算。傷害：**物理**＝武器或身體本身的力量；**法術**＝法術、神術不帶元素的；**特殊**＝其他力量；**元素**優先，帶元素的直接寫元素（火焰、強酸……）。輔助和不造成傷害的招只寫判定方式。

**基本攻擊**的名稱看手上的武器：砍的**斬擊**、戳的**刺擊**、砸的**打擊**（含徒手、法杖）、用彈藥的**射擊**、投擲類的**投擲**。

**法器**：法杖／法書／法球，每件綁定一組法術；法杖另外能敲人。施法屬性：法杖＝智力、法書＝感知、法球＝魅力。標 ✦ 的法術取自 SRD 5.2。
`);
let n = 0;
for(const g of SKILL_GROUPS){
  out.push(`## ${g.name}\n`);
  out.push(`${g.id==="shield" ? "裝備" : "武器"}：${g.weapons.length ? g.weapons.join("、") : "（沒拿武器）"}｜屬性：${g.stat}\n`);
  out.push(`| 技能 | 類型 | 熟練格 | 施展條件 | 聲勢材 | 效果 | 升階 |\n|---|---|---|---|---|---|---|`);
  g.skills.forEach((s, i)=>{
    const name = i===0 && HAS_BASIC(g) && !s.tier && s.kind!=="輔助" ? basicNames(g) : s.name;   // 基本攻擊照武器取名（盾牌第一招不是攻擊）
    const cost = TIER[s.tier||0] + (s.free ? "・免費動作" : "");
    out.push(`| ${cell(name)}${s.srd ? " ✦" : ""} | ${cell(skillType(g, s))} | ${cost} | ${cell(reqText(s.req))} | ${cell(componentsText(s.components))} | ${cell(s.text)} | ${cell(upText(s))} |`);
    n++;
  });
  out.push("");
}
fs.writeFileSync(path.join(root, 'docs/技能表.md'), out.join("\n"));
console.log(`docs/技能表.md：${SKILL_GROUPS.length} 類、${n} 招`);
