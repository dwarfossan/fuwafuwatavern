/* 規則／角色見解：介面層的浮動泡泡，不改遊戲狀態或重畫場景。 */
const escapeUI=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ruleDictionary(){
 const d={...PROP_TEXT,...MASTERY_TEXT,...TERM_TEXT,
 'AC':'護甲等級：攻擊總和大於等於目標 AC 就命中。','DC':'難度：檢定或豁免總和大於等於這個數字即成功。',
 '動作':'每回合一次主動作。已用掉免費動作時，部分免費招式仍可改花動作。',
 '免費動作':'每回合一次；用掉後，能改花動作的招式仍可使用。',
 '生命值':'受傷扣除生命值；四小隻歸零倒下，開始死亡豁免。',
 '抗性':'對指定種類傷害減半，向下取整；同類抗性不疊加。',
 '免疫':'對指定種類傷害不受傷；傷害免疫優先於抗性，不等於狀態免疫。',
 '專注':'同時維持一個專注效果。受傷體質豁免，DC 為傷害一半，最少 10、最多 30；失敗或倒下中斷。',
 '掩護':'沿攻擊射線判定遮擋。半掩護 AC 與敏捷豁免 +2，四分之三掩護 +5。',
 '半掩護':'攻擊 AC 與敏捷豁免 +2；蒸氣提供半掩護，不擋偵測。',
 '藉機攻擊':'離開敵人的貼身攻擊範圍時可能挨一次反應攻擊；撤離、潛行等依原規則判斷。',
 '短休':'每日最多兩次，各階熟練格恢復上限的一半，無條件進位。休息時處理抄筆記。',
 '長休':'熟練格回滿、短休次數歸零、重新挑戰次數回滿。休息時處理抄筆記。',
 '力量':'用於力量型攻擊、推撞等判定；負重上限依力量值計算。',
 '敏捷':'用於遠程／靈巧攻擊、護甲加值與部分豁免。',
 '體質':'影響生命值、專注與解毒等豁免。',
 '智力':'用於智力檢定；法器若以智力施法，就使用智力調整值。',
 '感知':'用於察覺、搜索、觀察學習；被動感知為 10 加感知調整值。',
 '魅力':'用於魅力檢定；法器若以魅力施法，就使用魅力調整值。',
 '聲勢材':'聲需正常發聲；勢需可活動的空手；一般材可由法器替代。勢加一般材可共用法器手，有標價材料不能替代。',
 '移動':'依格子與地形計算移動；探索不限總格數，戰棋依回合移動資源。'};
 Object.entries(STATUS_NAME).forEach(([k,n])=>{if(STATUS_DESC[k])d[n]=STATUS_DESC[k];});
 for(const type of ['火焰','寒冷','閃電','毒素','強酸','力場','光耀','揮砍','穿刺','鈍擊']){
  d[type+'傷害']=`${type}是傷害種類；依目標對${type}的抗性或免疫結算，不自動附加狀態。`;
 }
 return d;
}
function rulesHTML(text){
 const d=ruleDictionary(),keys=Object.keys(d).sort((a,b)=>b.length-a.length),pattern=new RegExp(keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 let at=0,out='',m;const source=String(text??'');while((m=pattern.exec(source))){out+=escapeUI(source.slice(at,m.index))+`<span class="rule-term" tabindex="0" data-rule="${escapeUI(m[0])}">${escapeUI(m[0])}</span>`;at=m.index+m[0].length;}return out+escapeUI(source.slice(at));
}
let activeGameBubble=null;
function closeGameBubble(){document.getElementById('game-bubble')?.remove();activeGameBubble=null;}
function showGameBubble(el){
 let title,text,kind;
 if(el.dataset.rule){title=el.dataset.rule;text=ruleDictionary()[title];kind='rule';}
 else{const [id,name]=el.dataset.skillThought.split(':'),c=CRITTERS.find(c=>c.id===id);text=SKILL_THOUGHTS[name]?.lines[id];if(!c||!text)return;title=c.name;kind='thought';}
 if(!text)return;closeGameBubble();activeGameBubble=el;
 const bubble=document.createElement('div');bubble.id='game-bubble';bubble.className='game-bubble '+kind;bubble.setAttribute('role','tooltip');
 bubble.innerHTML=`<b>${escapeUI(title)}</b><p>${escapeUI(text)}</p>${kind==='thought'?'<small>台詞草稿</small>':''}`;document.body.appendChild(bubble);
 const rect=el.getBoundingClientRect(),w=bubble.offsetWidth,h=bubble.offsetHeight;
 bubble.style.left=Math.max(8,Math.min(rect.left,innerWidth-w-8))+'px';
 bubble.style.top=Math.max(8,Math.min(rect.top-h-8,innerHeight-h-8))+'px';
}
function bubbleTarget(el){return el?.closest?.('[data-rule],[data-skill-thought]');}
(function bindGameBubbles(){
 document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const el=bubbleTarget(e.target);if(el&&el!==activeGameBubble)showGameBubble(el);});
 document.addEventListener('pointerout',e=>{if(activeGameBubble&&bubbleTarget(e.relatedTarget)!==activeGameBubble)closeGameBubble();});
 document.addEventListener('focusin',e=>{const el=bubbleTarget(e.target);if(el)showGameBubble(el);});
 document.addEventListener('focusout',closeGameBubble);
 document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){const el=bubbleTarget(e.target);if(el)showGameBubble(el);}});
 document.addEventListener('pointerup',e=>{if(e.pointerType==='touch')closeGameBubble();});
 document.addEventListener('pointercancel',closeGameBubble);document.addEventListener('scroll',closeGameBubble,true);
})();
