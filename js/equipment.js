// 裝備唯一資料與操作入口；所有場景及商店共用。
const Equipment={
  read(id){
    const inv=invItems(id).slice(),usable=it=>!equipmentRequirement(it,k=>abilityScore(id,k));
    const saved=state.startingGear?.[id],pool=inv.slice();
    const take=key=>{const i=pool.findIndex(it=>it.id===saved[key]&&usable(it));return i<0?null:pool.splice(i,1)[0];};
    if(saved){
      const weapon=take("main"),focus=take("focus"),off=take("off"),second=take("second"),offhand2=take("secondOff"),armor=take("armor"),backpackEquip=take("bag");
      const accessories=(saved.accessories||[]).map(i=>{const n=pool.findIndex(it=>it.id===i&&usable(it));return n<0?null:pool.splice(n,1)[0];}).filter(Boolean);
      // 舊配置尚未保存飾品時，沿用原本的前兩件。
      if(!saved.accessories)accessories.push(...pool.filter(it=>it.type==="accessory").slice(0,2));
      return {weapon,focus,spare:second?[second]:[],shield:off?.type==="shield",offhand:off?.type==="shield"?null:off,offhand2,armor,accessories,backpackEquip,backpack:pool.filter(it=>!accessories.includes(it)),activeSet:1};
    }
    const choose=pred=>{const i=pool.findIndex(it=>pred(it)&&usable(it));return i<0?null:pool.splice(i,1)[0];};
    const weapon=choose(it=>it.type==="weapon"||it.type==="focus"),second=choose(it=>it.type==="weapon"||it.type==="focus"),off=choose(it=>it.type==="shield"),armor=choose(it=>it.type==="armor"),accessories=[choose(it=>it.type==="accessory"),choose(it=>it.type==="accessory")].filter(Boolean),bag=bestBag(pool),backpackEquip=bag?choose(it=>it===bag):null;
    return {weapon,focus:null,spare:second?[second]:[],shield:!!off,offhand:null,offhand2:null,armor,accessories,backpackEquip,backpack:pool,activeSet:1};
  },
  set(id,load){ state.startingGear ||= {}; state.startingGear[id]=load; },
  save(u){
    if(!u||u.side!=="pc")return;
    const old=state.startingGear?.[u.id]||{},inv=invItems(u.id);
    const shieldId=slot=>{const it=inv.find(x=>x.id===old[slot]&&x.type==="shield")||inv.find(x=>x.type==="shield");return it?.id||null;};
    const itemId=(it,slot)=>it?.type==="shield"?(it.id&&inv.some(x=>x.id===it.id)?it.id:shieldId(slot)):it?.id||null;
    this.set(u.id,{main:itemId(u.weapon,"main"),focus:itemId(u.focus,"focus"),second:itemId(u.spare?.[0],"second"),off:u.shield?shieldId("off"):itemId(u.offhand,"off"),secondOff:itemId(u.offhand2,"secondOff"),armor:itemId(u.armor,"armor"),bag:itemId(u.backpackEquip,"bag"),accessories:(u.accessories||[]).map(x=>x.id)});
  },
  normalise(u){
  u.activeSet=u.activeSet===2?2:1;
  if(u.activeSet===1){
    if(isTwoHand(u.weapon)){u.shield=false;u.offhand=null;}
  }else{
    if(isTwoHand(u.spare&&u.spare[0])) u.offhand2=null;
  }
  },
  takeHeld(u,it){
    if(u.weapon===it)u.weapon=null;else if(u.focus===it)u.focus=null;else return false;
    if(u.side==="pc"){const i=(state.inv[u.id]||[]).indexOf(it.id);if(i>=0)state.inv[u.id].splice(i,1);syncBattleBag(u);}
    return true;
  },
  equipHeld(u,it){
    if(equipmentRequirement(it,k=>abilityScore(u,k)))return false;
    if(it.type==="focus")u.focus=it;else u.weapon=it;
    if(u.side==="pc"){(state.inv[u.id] ||= []).push(it.id);syncBattleBag(u);}
    return true;
  },
  switchUnit(u,set=2){
  if(!u||u.side!=="pc")return false;
  if(set===2 && (!u.spare?.[0] || equipmentRequirement(u.spare[0],k=>abilityScore(u,k))))return false;
  u.activeSet=set===2?2:1;
  // 戰鬥實際使用欄位永遠指向目前配置；切組不消耗任何動作。
  if(u.activeSet===2){
    const a=u.weapon, b=u.spare&&u.spare[0]||null;
    u.weapon=b; u.spare[0]=a;
    const sh=u.shield?{n:"盾牌",type:"shield",_shield:true}:u.offhand||null, next=u.offhand2; u.shield=next?.type==="shield";u.offhand=u.shield?null:next;u.offhand2=sh;
    u.activeSet=1; // 交換後目前組仍以 UI 的配置Ⅰ代表
  }
  this.normalise(u);
  syncBattleBag(u);
  return true;
  },
  refresh(id){
    const gear=this.read(id);
    progressionUnits(id).forEach(u=>{Object.assign(u,gear,{spare:gear.spare.slice(),accessories:gear.accessories.slice(),backpack:gear.backpack.slice()});syncBattleBag(u);});
  },
  move(u,from,to){
  if(!u || u.side!=="pc") return false;
  u.backpack=u.backpack||[]; u.spare=u.spare||[]; u.accessories=u.accessories||[];
  const shieldObj=()=>({n:"盾牌",type:"shield",_shield:true});
  const get=slot=>{
    if(slot==="weapon1")return u.weapon||null;
    if(slot==="weapon2")return u.spare[0]||null;
    if(slot==="offhand1")return u.shield?shieldObj():u.offhand||null;
    if(slot==="offhand2")return u.offhand2||null;
    if(slot==="armor")return u.armor||null;
    if(slot==="acc1")return u.accessories[0]||null;
    if(slot==="acc2")return u.accessories[1]||null;
    if(slot==="backpack")return u.backpackEquip||null;
    if(slot.startsWith("bag:"))return u.backpack[+slot.slice(4)]||null;
    return null;
  };
  const accepts=(slot,it)=>{
    if(!it)return true;
    if(slot!=="bag" && equipmentRequirement(it,k=>abilityScore(u,k)))return false;
    if(slot==="weapon1"||slot==="weapon2")return it.type==="weapon"||it.type==="focus";
    if(slot==="offhand1"||slot==="offhand2")return it.type==="shield"||(it.type==="weapon"&&!isTwoHand(it)&&weaponProps(it).includes("輕型"));
    if(slot==="armor")return it.type==="armor";
    if(slot==="acc1"||slot==="acc2")return it.type==="accessory";
    if(slot==="backpack")return isBag(it);
    if(slot==="bag")return true;
    return false;
  };
  const take=slot=>{
    const it=get(slot); if(!it)return null;
    if(slot==="weapon1")u.weapon=null;
    else if(slot==="weapon2")u.spare.splice(0,1);
    else if(slot==="offhand1"){u.shield=false;u.offhand=null;}
    else if(slot==="offhand2")u.offhand2=null;
    else if(slot==="armor")u.armor=null;
    else if(slot==="acc1")u.accessories.splice(0,1);
    else if(slot==="acc2")u.accessories.splice(1,1);
    else if(slot==="backpack")u.backpackEquip=null;
    else if(slot.startsWith("bag:"))u.backpack.splice(+slot.slice(4),1);
    return it;
  };
  const put=(slot,it)=>{
    if(!it)return;
    if(slot==="weapon1")u.weapon=it;
    else if(slot==="weapon2")u.spare[0]=it;
    else if(slot==="offhand1"){u.shield=it.type==="shield";u.offhand=u.shield?null:it;}
    else if(slot==="offhand2")u.offhand2=it;
    else if(slot==="armor")u.armor=it;
    else if(slot==="acc1")u.accessories[0]=it;
    else if(slot==="acc2")u.accessories[1]=it;
    else if(slot==="backpack")u.backpackEquip=it;
    else if(slot==="bag")u.backpack.push(it);
  };
  const a=get(from); if(!a)return false;
  const target=to==="bag"?null:get(to);
  if(!accepts(to,a)||(target&&!accepts(from.startsWith("bag:")?"bag":from,target)))return false;
  const moving=take(from);
  if(to==="bag")put("bag",moving);
  else{
    const displaced=take(to); put(to,moving);
    if(displaced){ if(from.startsWith("bag:"))put("bag",displaced); else put(from,displaced); }
  }
  // 雙手武器獨佔整組；裝上時該組副手自動收回背包。
  if((to==="weapon1"||from==="weapon1") && isTwoHand(u.weapon) && (u.shield||u.offhand)){u.backpack.push(u.shield?shieldObj():u.offhand);u.shield=false;u.offhand=null;}
  if((to==="weapon2"||from==="weapon2") && isTwoHand(u.spare[0]) && u.offhand2){u.backpack.push(u.offhand2);u.offhand2=null;}
  syncBattleBag(u);
  if(state.page==="battle" && B())blog(`${u.name}整理了裝備`,"skill");
  return true;
  },
};
