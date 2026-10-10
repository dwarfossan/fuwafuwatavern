/* 狀態／休息共用小筆記，不另做一套技能列。抄寫演出暫定 GPT。 */
function noteSkillRowHTML(n,u){
 const sk=learnedSkillByKey(n.key);
 return `<div class="note-skill-row"><div class="note-skill-main" data-skill-thought="${u.id}:${sk?.def.name||n.name}" tabindex="0">${sk?skillIcon(sk.group.id,sk.def,sk.impl,24):''}<span class="sk-n">${sk?skillLabel(sk.def):n.name}</span></div>${sk?`<button class="sk-info" data-skinfo="${sk.group.id}:${sk.idx}::${u.id}" aria-label="${n.name}的說明">ⓘ</button>`:''}</div>`;
}
// 小筆記勾選只有休息（旅店或外面露營）時能改（大爺 10-10）
function noteLockText(){return state.page==='battle'&&state.battle&&state.battle.phase!=='explore'?'戰鬥中配置已鎖定':'休息時才能換';}
function notebookPageHTML(u,b,rest=false){
 const learned=u.learned||[],total=notePages(u.id);b.notePages=b.notePages||{};
 const page=Math.min(Math.max(1,b.notePages[u.id]||1),total);b.notePages[u.id]=page;
 const entries=learned.slice((page-1)*NOTE_PAGE_SIZE,page*NOTE_PAGE_SIZE).map(n=>{
  const on=(u.activeSkills||[]).includes(n.key),copy=b.noteCopy?.[u.id]?.includes(n.key);
  return `<div class="note-entry ${copy?'note-copying':''}"><button class="note-check ${on?'on':''}" data-noteskill="${n.key}" ${rest?'':'disabled'} aria-label="${rest?'啟動技能':noteLockText()}：${n.name}">${on?'✓':''}</button><div>${noteSkillRowHTML(n,u)}<small>${isPassiveSkill(learnedSkillByKey(n.key))?'被動':'主動'} · ${n.from==='天生'?'天生技能':n.from==='起始技能'?'起始技能':`招式 · 從${n.from||'未知對手'}觀察學會`}</small>${copy?'<span class="copy-pencil" aria-label="正在抄寫">✎ 抄寫中……</span>':''}</div></div>`;
 }).join('');
 const pending=rest?(u.pendingLearned||[]):[];
 b.restPicks=b.restPicks||{};
 const picks=b.restPicks[u.id]??=pending.map(n=>n.key);
 const ling=(b.units||[]).find(x=>x.id==='fox');
 const teach=rest&&u.id!=='fox'?(ling?.learned||[]).filter(n=>!learned.some(x=>x.key===n.key)&&!pending.some(x=>x.key===n.key)):[];
 return `<div class="note-page"><div class="note-cap">${u.name}　小筆記 ${learned.length}/${noteCap(u.id)} · 攜帶 ${carriedSkillKeys(u).length}/5 · 主動 ${activeLearnedSkills(u).length}/3${rest?'':'　'+noteLockText()}</div>${b.noteBlock?.id===u.id&&b.noteBlock.text?`<div class="note-block" role="status">${b.noteBlock.text}</div>`:''}<div class="note-list">${entries||'<div class="note-empty">還沒有記下任何招式。</div>'}</div><div class="note-pager"><button data-notepage="${u.id}:${page-1}" ${page<=1?'disabled':''} aria-label="上一頁">‹</button><span>${page} / ${total}</span><button data-notepage="${u.id}:${page+1}" ${page>=total?'disabled':''} aria-label="下一頁">›</button></div>${rest?`<h4>這次理解，休息時抄寫</h4>${pending.length?pending.map(n=>`<div class="note-entry"><input type="checkbox" data-restpick="${u.id}:${n.key}" ${picks.includes(n.key)?'checked':''} aria-label="抄寫${n.name}"><div>${noteSkillRowHTML(n,u)}</div></div>`).join(''):'<small>這次沒有待抄的招式</small>'}${teach.length?`<h4>向玲玲學</h4>${teach.map(n=>`<button class="btn small ghost" data-teach="${u.id}:${n.key}">${n.name}</button>`).join('')}`:''}${learned.length>=noteCap(u.id)?`<h4>筆記已滿，先擦掉舊招</h4>${learned.map(n=>`<button class="btn small ghost" data-erase="${u.id}:${n.key}">橡皮擦：${n.name}</button>`).join('')}`:''}`:''}</div>`;
}
function restNotebookHTML(b){
 b.restWho=b.restWho||'fox';const u=b.units.find(u=>u.id===b.restWho&&u.side==='pc');
 return `<div class="rest-box"><div class="tabs rest-heads" role="tablist">${CRITTERS.map(c=>`<button class="tab ${c.id===b.restWho?'on':''}" data-rest-who="${c.id}" role="tab" aria-selected="${c.id===b.restWho}">${critterHead(c.id)}<span>${c.name}</span></button>`).join('')}</div><div class="gear-tabs"><span class="gear-tab on">小筆記</span></div>${notebookPageHTML(u,b,true)}<div class="rest-actions"><button class="btn small" id="shortRest" ${state.shortRestsUsed>=2?'disabled':''}>短休：熟練格每階回一半（今日 ${state.shortRestsUsed}/2）</button><button class="btn small" id="longRest">長休：熟練格回滿</button></div></div>`;
}
function restPickSelections(b){
 const out={};b.units.filter(u=>u.side==='pc').forEach(u=>out[u.id]=b.restPicks?.[u.id]??(u.pendingLearned||[]).map(n=>n.key));return out;
}
// 小筆記翻頁唯一入口（10-10 收成一份）：頁數記在這本筆記所屬的資料——
// 休息框用戰場或旅店的休息資料，狀態卡用 StatusCard.context；刷新交給各自的入口。
function bindNotePages(root=document){
 root.querySelectorAll('[data-notepage]').forEach(el=>modalListen(el,'click',e=>{
  e.stopPropagation();
  const [id,p]=el.dataset.notepage.split(':'),rest=!!el.closest('.rest-box'),battle=state.page==='battle'&&B();
  const b=rest?(battle?B():state.townRest):StatusCard.context(id);if(!b)return;
  (b.notePages ||= {})[id]=Math.max(1,+p||1);sfx('pop');
  if(rest&&!battle)render();else StatusCard.refreshCard(id);
 }));
}
function bindRestNotebook(b){
 const redraw=()=>{if(b===B())refreshBattle();else render();};
 const pencil=document.querySelector(".rest-box .copy-pencil"),box=document.querySelector(".rest-box");
 if(pencil && box){const delta=pencil.getBoundingClientRect().bottom-box.getBoundingClientRect().bottom;if(delta>0)box.scrollTop+=delta+12;}
 document.querySelectorAll('[data-rest-who]').forEach(el=>modalListen(el,'click',()=>{b.restWho=el.dataset.restWho;redraw();}));
 document.querySelectorAll('[data-restpick]').forEach(el=>modalListen(el,'change',()=>{const [id,key]=el.dataset.restpick.split(':');const keys=b.restPicks[id]||=[];if(el.checked&&!keys.includes(key))keys.push(key);else if(!el.checked)b.restPicks[id]=keys.filter(k=>k!==key);}));
 document.querySelectorAll('.rest-box [data-noteskill]').forEach(el=>modalListen(el,'click',()=>{const u=b.units.find(u=>u.id===b.restWho);if(!toggleCarriedSkill(u,el.dataset.noteskill)){b.noteBlock={id:u.id,text:carryBlockReason(u,el.dataset.noteskill)};sfx('bad');redraw();return;}b.noteBlock=null;syncLearnedState(b);redraw();}));
}
