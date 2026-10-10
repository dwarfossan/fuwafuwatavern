/* ---------- 測試頁：網址加 #doll ---------- */
const DEMO_MAIN = ["sword","heavy","axe","mace","polearm","dagger","bow","crossbow","thrown","unarmed","arcane_staff"];
const DEMO_OFF  = [null,"shield","healing_book","flame_orb"];
const DEMO_ARM  = [null, ...ITEMS.filter(i=>i.type==="armor").map(i=>i.n)];   // 全部護甲都能試穿
const DEMO_ACT  = ["slash","smash","combo","spin","thrust","guard","shoot","fire","throw","punch","cast","slam","hurt","hop"];
const ACT_NAME  = {slash:"揮砍",smash:"重劈",combo:"連擊",spin:"迴旋",thrust:"突刺",guard:"架式",shoot:"射擊",fire:"開槍",throw:"投擲",punch:"揮拳",cast:"施法",slam:"跳砸",hurt:"受傷",hop:"走路",down:"倒下"};
const GROUP_NAME = k => ({unarmed:"徒手"})[k] || (SKILL_GROUPS.find(g=>g.id===k)||{}).name || "無";
function renderDollDemo(){
  const d = state.demo || (state.demo = {main:"sword", off:"shield", armor:"鑲釘皮甲", anim:null, down:false});
  const now = Date.now();
  const live = d.anim && now - d.anim.t < DOLL_DUR[d.anim.k] ? {k:d.anim.k, el:now-d.anim.t} : null;
  const who = d.who==="goblin" ? [0,1,2,3].map(i=>({look:MONSTER_LOOK.goblin}))
    : d.who==="undead" ? ["skeleton","lich","vampire","zombie","ghost","death_knight","death_knight_bare"].map(k=>({look:MONSTER_LOOK[k]}))   // 10-10 不死素材
    : d.who==="human" ? [{sex:"male",hair:"01",beard:"01"},{sex:"male",hair:"04",beard:"04",hairColor:"#3a3030"},{sex:"female",hair:"04"},{sex:"female",hair:"10",ears:"elf",hairColor:"#d9c27a"}].map(o=>({look:humanLook(o)}))   // 10-10 人類素材（組合是展示用）
    : CRITTERS.map(c=>({id:c.id, color:c.color}));
  const dolls = who.map((w,i)=>`<svg viewBox="-20 -10 180 170" width="200" height="190">${dollSVG({...w, main:d.main, off:d.off, armor:d.armor, mood:d.mood, anim:live, face:-1, down:d.down, x:0, y:0, w:140, seed:i})}</svg>`).join("");
  const chips = (list, cur, key, name) => list.map(v=>`<button class="chip ${v===cur?"on":""}" data-demo="${key}:${v??""}">${name(v)}</button>`).join("");
  return `<section class="page">
    <div class="head"><div><h2>紙娃娃動作測試</h2><p class="rule">簡單身體＋浮空的手，掛上裝備圖示，動作即時演出。</p></div></div>
    <div class="demo-stage">${dolls}</div>
    <div class="demo-ctl">
      <div><b>動作</b>${DEMO_ACT.map(k=>`<button class="btn small" data-demo="anim:${k}">${ACT_NAME[k]}</button>`).join("")}
        <button class="btn small ghost" data-demo="down:">${d.down?"站起來":"倒下"}</button></div>
      <div><b>表情（暫定）</b>${chips(SVG_CRITTER_MOODS,d.mood||"normal","mood",v=>({normal:"平常",happy:"開心",hurt:"受傷",angry:"生氣",surprised:"驚訝",stressed:"壓力",frenzy:"失控",nervous:"緊張"})[v])}</div>
      <div><b>角色</b>${chips(["party","goblin","undead","human"], d.who||"party", "who", v=>({goblin:"哥布林",undead:"不死",human:"人類",party:"毛絨絨小隊"})[v])}</div>
      <div><b>主手</b>${chips(DEMO_MAIN, d.main, "main", GROUP_NAME)}</div>
      <div><b>副手</b>${chips(DEMO_OFF, d.off, "off", v=>v?GROUP_NAME(v):"空手")}</div>
      <div><b>護甲</b>${chips(DEMO_ARM, d.armor, "armor", v=>v||"沒穿")}</div>
    </div>
  </section>`;
}
function bindDollDemo(){
  document.querySelectorAll("[data-demo]").forEach(b=>b.addEventListener("click", ()=>{
    const [k, v] = b.dataset.demo.split(":"), d = state.demo;
    if(k==="anim") d.anim = {k:v, t:Date.now()};
    else if(k==="down") d.down = !d.down;
    else d[k] = v || null;
    render();
  }));
}
