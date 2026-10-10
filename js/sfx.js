/* ======================== 音效：實體檔優先，Web Audio 合成 fallback ========================
   用法：sfx("hit_blunt", 延遲毫秒)。延遲用來對齊演出（例如箭飛行後才「打中」）。
   SFX_FILES 有檔案的就播放檔案，沒有對應檔案的事件照舊合成。
   手機瀏覽器要先點一下畫面才能出聲，第一次點擊時會自動解鎖。 */

const SFX_FILES = {
  arrow_shoot: "assets/sfx/arrow_shoot.mp3",
  arrow_hit: "assets/sfx/arrow_hit.mp3",
  hit_slash: "assets/sfx/sword_slash.mp3",
  hit_blunt: "assets/sfx/light_punch.mp3",
  hit_fire: "assets/sfx/fire_magic.mp3",
  hit_cold: "assets/sfx/ice_magic.mp3",
  hit_lightning: "assets/sfx/lightning_magic.mp3",
  hit_poison: "assets/sfx/poison_magic.mp3",
  heal: "assets/sfx/heal_magic.mp3",
  shield_block: "assets/sfx/shield_block.mp3"
};

const SFX = (()=>{
  let ctx = null, master = null, noiseBuf = null;
  const files = {};             // 名稱 → AudioBuffer（載好的音效檔）
  let muted = false, volume = .7, lastVolume = .7;
  try {
    muted = localStorage.getItem("fuwa-mute")==="1";
    // 沒存過（第一次玩）就維持預設 .7；以前 Number(null)=0 會讓新玩家整個沒聲音（10-10 修）
    const raw = localStorage.getItem("fuwa-volume"), v = raw===null ? NaN : Number(raw);
    if(Number.isFinite(v) && v>=0 && v<=1) volume=v;
    if(volume>0) lastVolume=volume;
  } catch(e){}
  const recent = new Map();     // 同一個聲音同一瞬間只播一次（一招打很多下時不會爆音）

  function init(){
    if(ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : volume; master.connect(ctx.destination);
    // 白噪音（咻聲、打擊聲的材料）
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    Object.entries(SFX_FILES).forEach(([k,url])=>{
      fetch(url).then(r=>r.arrayBuffer()).then(a=>ctx.decodeAudioData(a)).then(buf=>files[k]=buf).catch(()=>{});
    });
    return ctx;
  }
  const unlock = ()=>{ const c = init(); if(c && c.state==="suspended") c.resume(); };
  ["pointerdown","keydown","touchstart"].forEach(ev=>window.addEventListener(ev, unlock, {passive:true}));

  // ---------- 合成零件 ----------
  // 音調：f0 → f1 滑音，攻擊 a 秒後指數衰減到 dur
  function tone(t, {type="sine", f0, f1=f0, dur=.15, gain=.2, a=.005, lp=0}){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if(f1!==f0) o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t+dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t+a);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    let node = o;
    if(lp){ const f = ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g); g.connect(master); o.start(t); o.stop(t+dur+.05);
  }
  // 噪音：經過濾波器，頻率 f0 → f1 掃過去
  function noise(t, {dur=.15, gain=.2, f0=1000, f1=f0, q=1, kind="bandpass", a=.005}){
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = kind; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); if(f1!==f0) f.frequency.exponentialRampToValueAtTime(f1, t+dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t+a);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()*.5); s.stop(t+dur+.05);
  }
  const notes = (t, list, o) => list.forEach(([f, dt, dur])=>tone(t+dt, {...o, f0:f, dur:dur||o.dur}));

  // ---------- 音效表 ----------
  const LIB = {
    // 揮動、出手
    swing:     t=>noise(t, {dur:.17, gain:.95, f0:500, f1:2600, q:1.3}),
    swing_big: t=>{ noise(t, {dur:.26, gain:.85, f0:300, f1:1800, q:1.1}); tone(t, {type:"sine", f0:110, f1:70, dur:.2, gain:.12}); },
    twang:     t=>{ tone(t, {type:"sawtooth", f0:220, f1:200, dur:.28, gain:.22, lp:1600}); tone(t, {type:"triangle", f0:440, f1:430, dur:.12, gain:.1});
                    noise(t+.02, {dur:.14, gain:.35, f0:2500, f1:900, q:1.5}); },
    throw:     t=>noise(t, {dur:.24, gain:.85, f0:400, f1:1600, q:1.6}),
    // 槍聲（10-03）：短而重的爆音＋低頻悶響＋一點迴音
    bang:      t=>{ noise(t, {dur:.09, gain:1, f0:2600, f1:500, kind:"lowpass", a:.001}); tone(t, {type:"sine", f0:140, f1:45, dur:.22, gain:.55});
                    noise(t+.03, {dur:.35, gain:.25, f0:900, f1:200, kind:"lowpass"}); },
    cast:      t=>{ notes(t, [[660,0],[880,.05],[1100,.1],[1320,.15]], {type:"sine", dur:.2, gain:.09}); noise(t, {dur:.3, gain:.05, f0:5000, q:4}); },
    guard:     t=>{ noise(t, {dur:.07, gain:.75, f0:1800, q:3}); tone(t, {type:"square", f0:620, f1:520, dur:.06, gain:.06, lp:2500}); },
    // 打中
    hit_blunt: t=>{ tone(t, {type:"sine", f0:170, f1:50, dur:.16, gain:.6}); noise(t, {dur:.06, gain:.35, f0:900, kind:"lowpass"}); },
    hit_slash: t=>{ noise(t, {dur:.08, gain:.4, f0:3200, f1:1500, q:.8}); tone(t, {type:"triangle", f0:320, f1:110, dur:.1, gain:.3}); },
    hit_pierce:t=>{ tone(t, {type:"square", f0:950, f1:300, dur:.04, gain:.1, lp:3000}); noise(t, {dur:.035, gain:.28, f0:4500, kind:"highpass"}); tone(t+.01, {type:"sine", f0:150, f1:60, dur:.1, gain:.4}); },
    hit_fire:  t=>{ noise(t, {dur:.35, gain:.4, f0:1400, f1:250, kind:"lowpass"}); tone(t, {type:"sawtooth", f0:130, f1:60, dur:.3, gain:.12, lp:600}); },
    hit_magic: t=>{ notes(t, [[1320,0],[1760,.04],[2200,.08]], {type:"sine", dur:.22, gain:.1}); tone(t, {type:"triangle", f0:880, f1:440, dur:.18, gain:.12}); },
    miss:      t=>noise(t, {dur:.2, gain:.55, f0:2600, f1:700, q:1.4}),
    // 被打中的叫聲（配 X_X）
    ouch_pc:   t=>tone(t+.02, {type:"sine", f0:950, f1:420, dur:.2, gain:.16}),
    ouch_foe:  t=>tone(t+.02, {type:"square", f0:320, f1:130, dur:.2, gain:.08, lp:1300}),
    // 倒下
    poof:      t=>{ noise(t, {dur:.4, gain:.35, f0:1600, f1:200, kind:"lowpass"}); tone(t, {type:"sine", f0:420, f1:80, dur:.35, gain:.18}); },
    down:      t=>notes(t, [[523,0],[440,.16],[349,.32,.4]], {type:"triangle", dur:.24, gain:.15}),
    // 其他
    level_up: t=>notes(t, [[523,0,.2],[659,.12,.2],[784,.24,.2],[1047,.4,.65]], {type:"triangle", gain:.12}),
    heal:      t=>notes(t, [[523,0],[659,.07],[784,.14],[1047,.21,.4]], {type:"sine", dur:.3, gain:.12}),
    help:      t=>notes(t, [[784,0],[1047,.08,.25]], {type:"triangle", dur:.18, gain:.1}),
    step:      t=>{ tone(t, {type:"sine", f0:180+Math.random()*60, dur:.05, gain:.1}); noise(t, {dur:.03, gain:.04, f0:700, kind:"lowpass"}); },
    alert:     t=>notes(t, [[1250,0],[1250,.07]], {type:"square", dur:.045, gain:.1}),
    turn:      t=>notes(t, [[784,0],[1047,.09,.22]], {type:"triangle", dur:.15, gain:.11}),
    // 介面
    pop:       t=>tone(t, {type:"sine", f0:520, f1:800, dur:.07, gain:.13}),
    back:      t=>tone(t, {type:"sine", f0:620, f1:380, dur:.07, gain:.11}),
    // 爆擊：低沉的轟＋高音的亮點
    crit:      t=>{ tone(t, {type:"sine", f0:90, f1:40, dur:.5, gain:.6}); noise(t, {dur:.3, gain:.5, f0:1200, f1:150, kind:"lowpass"});
                    notes(t+.05, [[1568,0],[2093,.06,.4]], {type:"triangle", dur:.25, gain:.12}); },
    // 勝敗
    win:       t=>notes(t, [[523,0,.14],[659,.12,.14],[784,.24,.14],[1047,.36,.3],[784,.6,.12],[1047,.72,.6]], {type:"triangle", gain:.14}),
    lose:      t=>notes(t, [[392,0,.3],[349,.3,.3],[294,.6,.3],[262,.9,.8]], {type:"triangle", gain:.13})
  };

  function play(name, delay=0){
    if(muted) return;
    const c = init(); if(!c || c.state!=="running") return;
    const t = c.currentTime + Math.max(0, delay)/1000;
    const key = name + "@" + Math.round(t*40);            // 25ms 內同名只播一次
    if(recent.has(key)) return; recent.set(key, 1); if(recent.size>200) recent.clear();
    if(files[name]){ const s = c.createBufferSource(); s.buffer = files[name]; s.connect(master); s.start(t); return; }
    const f = LIB[name]; if(f) f(t);
  }
  function setMuted(m){
    muted = m; try { localStorage.setItem("fuwa-mute", m?"1":"0"); } catch(e){}
    if(master) master.gain.value = m ? 0 : volume;
    BGM.setMuted();
  }
  function setVolume(v){
    volume = Math.max(0,Math.min(1,Number(v)||0));
    if(volume>0){ lastVolume=volume; muted=false; } else muted=true;
    try { localStorage.setItem("fuwa-volume", String(volume)); localStorage.setItem("fuwa-mute", muted?"1":"0"); } catch(e){}
    if(master) master.gain.value = muted ? 0 : volume;
    BGM.setVolume();
  }
  function toggleMuted(){
    if(muted && volume===0) volume=lastVolume||.7;
    setMuted(!muted);
  }
  // 測試用：離線算出某個音效的波形（tools/tests/sfx_test.py 用來檢查音量、長度，並匯出試聽檔）
  function renderOffline(name, secs=1.8, rate=44100){
    const off = new OfflineAudioContext(1, Math.round(secs*rate), rate);
    const keep = [ctx, master, noiseBuf];
    ctx = off; master = off.createGain(); master.gain.value = .7; master.connect(off.destination);
    noiseBuf = off.createBuffer(1, rate, rate); const d = noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    LIB[name](0.02);
    [ctx, master, noiseBuf] = keep;
    return off.startRendering().then(buf=>Array.from(buf.getChannelData(0)));
  }
  return {play, setMuted, toggleMuted, setVolume, isMuted:()=>muted, getVolume:()=>volume, names:Object.keys(LIB), renderOffline};
})();
// 反應／好運的快照重跑（10-11）：試跑期間的音效先排隊，真的跑完才播；中途暫停詢問就丟掉，重跑時再播，不會播兩次
let SFX_HOLD = null;
const sfx = (name, delay) => SFX_HOLD ? SFX_HOLD.push([name, delay, Date.now()]) : SFX.play(name, delay);
function sfxRelease(play){ const q = SFX_HOLD || []; SFX_HOLD = null; if(play) q.forEach(([n, d, t])=>SFX.play(n, Math.max(0, (d||0) - (Date.now()-t)))); }

// ---------- BGM：同一個主音量、單一 HTMLAudioElement 淡出後換曲 ----------
const BGM_TRACKS = {
  title:   {src:"assets/bgm/title_bgm.mp3", loop:true},
  daily:   {src:"assets/bgm/daily_bgm.mp3", loop:true},
  comedy:  {src:"assets/bgm/comedy_bgm.mp3", loop:true},
  battle:  {src:"assets/bgm/battle_bgm.mp3", loop:true},
  victory: {src:"assets/bgm/victory_bgm.mp3", loop:false}
};
const BGM = (()=>{
  const MIX = .336, FADE = 280;   // 背景音樂占總音量的比例；10-10 大爺：再小聲 20%（.42→.336），效果音才聽得到
  let audio = null, current = null, desired = null, finished = null, change = 0, fadeTimer = null;
  const level = ()=>SFX.isMuted() ? 0 : SFX.getVolume()*MIX;
  function ensure(){
    if(audio) return audio;
    audio = new Audio(); audio.preload = "metadata";
    audio.addEventListener("ended", ()=>{ if(!audio.loop){ current=null; finished=desired; } });
    return audio;
  }
  function fade(to, done){
    const a=ensure(), from=a.volume, began=performance.now();
    clearInterval(fadeTimer);
    fadeTimer=setInterval(()=>{
      const p=Math.min(1,(performance.now()-began)/FADE); a.volume=from+(to-from)*p;
      if(p===1){ clearInterval(fadeTimer); fadeTimer=null; if(done)done(); }
    },16);
  }
  function retry(){
    if(!desired || current!==desired || finished===desired || !audio?.paused) return;
    audio.play().then(()=>fade(level())).catch(()=>{});
  }
  function sync(track){
    const spec=BGM_TRACKS[track];
    if(!spec){ stop(); return; }
    if(desired===track && (current===track || (!spec.loop && finished===track))) return;
    desired=track; finished=null; const token=++change, a=ensure();
    const start=()=>{
      if(token!==change) return;
      a.pause(); a.src=spec.src; a.loop=spec.loop; a.currentTime=0; a.volume=0; current=track;
      a.play().then(()=>fade(level())).catch(()=>{});
    };
    if(current && !a.paused) fade(0,start); else start();
  }
  function stop(){
    desired=null; finished=null; current=null; change++;
    if(audio && !audio.paused) fade(0,()=>audio.pause());
  }
  ["pointerdown","keydown","touchstart"].forEach(ev=>window.addEventListener(ev,retry,{passive:true}));
  return {sync, stop, retry, setMuted:()=>{if(audio&&!audio.paused)fade(level());}, setVolume:()=>{if(audio&&!audio.paused)fade(level());}, getTrack:()=>desired};
})();
function bgmTrackForState(){
  if(state.page==="battle") return B()?.result==="win" ? "victory" : B()?.result ? null : "battle";
  if(state.page==="cover" || state.page==="map") return "title";
  if(state.page==="town" || state.page==="shop") return "daily";
  if(state.page==="story"){
    const script=SCENES[state.scene]?.script||[];
    const cue=script.slice(0,state.line+1).map(line=>line.bgm).filter(Boolean).at(-1);
    return cue || (["ambush","caravan"].includes(state.scene) ? "title" : "daily");
  }
  return null;
}
const syncBGM = ()=>BGM.sync(bgmTrackForState());

// 動作 → 出手的聲音（跟紙娃娃動畫對齊：揮動在打中前一點點、射箭在放手那一刻）
const HIT_SFX = {"寒冷":"hit_cold", "閃電":"hit_lightning", "毒素":"hit_poison", "揮砍":"hit_slash", "穿刺":"hit_pierce", "鈍擊":"hit_blunt", "火焰":"hit_fire", "力場":"hit_magic", "光耀":"hit_magic", "流血":"hit_pierce", "強酸":"hit_magic", "死靈":"hit_magic"};
function animSfx(k, lead=0){                 // lead：先擲骰，出招往後延幾毫秒
  const imp = (DOLL_IMPACT[k] || 0) + lead;
  if(k==="shoot") return sfx("arrow_shoot", imp);
  if(k==="fire")  return sfx("bang", imp);
  if(k==="throw") return sfx("throw", imp - 60);
  if(k==="cast")  return sfx("cast", 60 + lead);
  if(k==="guard") return sfx("guard", 120 + lead);
  if(k==="smash" || k==="slam" || k==="spin") return sfx("swing_big", imp - 150);
  if(k==="combo"){ sfx("swing", imp - 100); sfx("swing", imp + 180); sfx("swing", imp + 420); return; }
  sfx("swing", Math.max(lead, imp - 110));
}
