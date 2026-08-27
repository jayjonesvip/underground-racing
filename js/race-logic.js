(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.RACE_LOGIC=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const whole=(value,fallback=0)=>Number.isFinite(Number(value))?Math.floor(Number(value)):fallback;
  const PERFORMANCE_RANGES=Object.freeze({age:[2,9],weight:[110,126],starts:[1,55],speedFigure:[35,120],classRating:[50,120],paceFigure:[35,120],morningLine:[1.5,30],recentFinish:[1,12],workoutSeconds:[46,53]});
  const hashSeed=value=>{let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return hash>>>0};
  function seededRandom(seed){let value=whole(seed)>>>0;return()=>{value+=0x6D2B79F5;let n=value;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296}}
  function shuffle(list,random){const copy=list.slice();for(let index=copy.length-1;index>0;index--){const swap=Math.floor(random()*(index+1));[copy[index],copy[swap]]=[copy[swap],copy[index]]}return copy}

  function conditionFit(horse,condition){
    const bias=Number(horse?.conditionBias?.[condition.id])||0;
    return clamp(50+bias*10+(Number(horse.consistency)||0)*3,20,95);
  }

  function horseRating(horse,condition){
    const form=Array.isArray(horse.form)&&horse.form.length?horse.form:[5];
    const formScore=form.reduce((sum,finish)=>sum+(13-clamp(finish,1,12)),0)/form.length;
    const speedFigure=Number(horse.speedFigure)||50+(Number(horse.speed)||5)*4,classRating=Number(horse.classRating)||50+(Number(horse.consistency)||5)*4,earlyPace=Number(horse.earlyPace)||50+(Number(horse.break)||5)*4,latePace=Number(horse.latePace)||50+(Number(horse.stamina)||5)*4;
    const pace=condition.pace==='speed'?earlyPace*.16+latePace*.06:condition.pace==='stamina'?latePace*.16+earlyPace*.06:(earlyPace+latePace)*.11;
    const distanceBonus=!condition.distanceType||horse.distancePref==='versatile'||horse.distancePref===condition.distanceType?2:-2,surfaceBonus=!horse.surfacePref||horse.surfacePref==='dirt'?1:-1,weightAdjustment=(120-(Number(horse.weight)||120))*.12;
    const workoutField=Math.max(1,Number(horse.workoutField)||1),workoutBoost=(workoutField-clamp(Number(horse.workoutPosition)||workoutField,1,workoutField))/workoutField*2;
    return speedFigure*.43+classRating*.18+pace+formScore+(Number(horse.conditionBias?.[condition.id])||0)*1.8+distanceBonus+surfaceBonus+weightAdjustment+workoutBoost;
  }

  function buildRace(horses,conditions,seed,fieldSize=6){
    const random=seededRandom(seed),baseCondition=conditions[Math.floor(random()*conditions.length)],distances=[{distance:'6 FURLONGS',distanceType:'sprint'},{distance:'7 FURLONGS',distanceType:'sprint'},{distance:'1 MILE',distanceType:'route'}],condition={...baseCondition,...distances[Math.floor(random()*distances.length)],raceClass:76+Math.floor(random()*20)},field=shuffle(horses,random).slice(0,fieldSize).map((horse,index)=>({...horse,program:index+1}));
    const ratings=field.map(horse=>horseRating(horse,condition)),max=Math.max(...ratings);
    field.forEach((horse,index)=>{const gap=Math.max(0,max-ratings[index]),raw=1.6+gap*.28+(1-horse.consistency/10)*2;horse.rating=Number(ratings[index].toFixed(2));horse.odds=Math.max(PERFORMANCE_RANGES.morningLine[0],Math.min(PERFORMANCE_RANGES.morningLine[1],Math.round(raw*2)/2));horse.fit=conditionFit(horse,condition)});
    return {condition,field};
  }

  function finishRace(field,condition,rolls=[]){
    if(!Array.isArray(field)||field.length<3)return [];
    return field.map((horse,index)=>{
      const noise=(clamp(rolls[index]??Math.random(),0,.999999)-.5)*(13-horse.consistency);
      const late=condition.pace==='stamina'?horse.stamina*.22:horse.break*.12;
      return {id:horse.id,score:horse.rating+late+noise};
    }).sort((a,b)=>b.score-a.score).map(result=>result.id);
  }

  function applyRaceResult(horses,field,condition,finishOrder,raceId,purse=30000){
    const entries=new Map((field||[]).map(horse=>[horse.id,horse])),positions=new Map((finishOrder||[]).map((id,index)=>[id,index+1])),fieldSize=finishOrder.length,purseShares=[.6,.2,.1,.05];
    return (horses||[]).map(horse=>{
      const entry=entries.get(horse.id),finish=positions.get(horse.id);
      if(!entry||!finish)return horse;
      const performanceFigure=Math.round(clamp((Number(entry.rating)||horseRating(entry,condition))+17-finish*2,PERFORMANCE_RANGES.speedFigure[0],PERFORMANCE_RANGES.speedFigure[1]));
      const earned=Math.round(Math.max(0,Number(purse)||0)*(purseShares[finish-1]||0));
      const recentRace={raceId:String(raceId),finish,fieldSize,condition:condition.id,distance:condition.distance||'',classRating:condition.raceClass||0,speedFigure:performanceFigure};
      const recentRaces=[recentRace,...(Array.isArray(horse.recentRaces)?horse.recentRaces:[])].slice(0,5),starts=(Number(horse.starts)||0)+1,earnings=(Number(horse.earnings)||0)+earned,wet=condition.id==='muddy'||condition.id==='sloppy';
      return {...horse,starts,wins:(Number(horse.wins)||0)+(finish===1?1:0),places:(Number(horse.places)||0)+(finish===2?1:0),shows:(Number(horse.shows)||0)+(finish===3?1:0),earnings,earningsPerStart:Math.round(earnings/starts),speedFigure:performanceFigure,topSpeedFigure:Math.max(Number(horse.topSpeedFigure)||0,performanceFigure),form:recentRaces.map(result=>result.finish),recentRaces,wetStarts:(Number(horse.wetStarts)||0)+(wet?1:0),wetWins:(Number(horse.wetWins)||0)+(wet&&finish===1?1:0)};
    });
  }

  function balancedFields(horses,maxFieldSize=8){
    if(!horses.length)return [];
    const fieldCount=Math.ceil(horses.length/Math.max(3,maxFieldSize)),fields=Array.from({length:fieldCount},()=>[]);
    horses.forEach((horse,index)=>fields[index%fieldCount].push(horse));
    return fields.filter(field=>field.length>=3);
  }

  function simulateWorldRound(horses,conditions,seed,options={}){
    const excluded=new Set(options.excludeIds||[]),random=seededRandom(seed),eligible=shuffle((horses||[]).filter(horse=>!excluded.has(horse.id)),random),groups=balancedFields(eligible,options.fieldSize||8);let roster=(horses||[]).slice();
    groups.forEach((group,index)=>{
      const raceSeed=hashSeed(`${seed}|virtual|${index}`),race=buildRace(group,conditions,raceSeed,group.length),rollRandom=seededRandom(hashSeed(`${raceSeed}|finish`)),rolls=race.field.map(()=>rollRandom()),order=finishRace(race.field,race.condition,rolls),raceId=options.raceIdPrefix?`${options.raceIdPrefix}-${index+1}`:`V-${seed}-${index+1}`;
      roster=applyRaceResult(roster,race.field,race.condition,order,raceId,options.purse||30000);
    });
    return roster;
  }

  function seedWorld(horses,conditions,seed,rounds=5){
    let roster=(horses||[]).slice();
    for(let round=0;round<Math.max(0,whole(rounds));round++)roster=simulateWorldRound(roster,conditions,hashSeed(`${seed}|seed-round|${round}`),{raceIdPrefix:`H${round+1}`});
    return roster;
  }

  function ticketCost(type,stake){
    const amount=Math.max(0,whole(stake));
    return amount*({atb:3,exactaBox:2}[type]||1);
  }

  function validateTicket({type,stake,picks,wallet,field}){
    const validTypes=['win','place','show','atb','exacta','exactaBox'],amount=whole(stake),ids=new Set((field||[]).map(horse=>horse.id)),chosen=Array.isArray(picks)?picks.filter(id=>ids.has(id)):[];
    if(!validTypes.includes(type))return {ok:false,reason:'Choose a wager type.'};
    if(amount<2)return {ok:false,reason:'Minimum base wager is $2.'};
    const needed=type==='exacta'||type==='exactaBox'?2:1;
    if(chosen.length!==needed||new Set(chosen).size!==needed)return {ok:false,reason:needed===2?'Choose two different horses.':'Choose one horse.'};
    const cost=ticketCost(type,amount);
    if(cost>Math.max(0,whole(wallet)))return {ok:false,reason:'Not enough fictional credits in your wallet.'};
    return {ok:true,cost,stake:amount,picks:chosen};
  }

  function settleTicket(ticket,field,finishOrder){
    const first=finishOrder[0],second=finishOrder[1],third=finishOrder[2],horse=field.find(item=>item.id===ticket.picks[0]),secondHorse=field.find(item=>item.id===ticket.picks[1]);let payout=0;
    const straight=(threshold,multiplier)=>finishOrder.slice(0,threshold).includes(horse.id)?Math.round(ticket.stake*(1+horse.odds*multiplier)):0;
    if(ticket.type==='win'&&horse.id===first)payout=Math.round(ticket.stake*(horse.odds+1));
    if(ticket.type==='place')payout=straight(2,.48);
    if(ticket.type==='show')payout=straight(3,.28);
    if(ticket.type==='atb')payout=(horse.id===first?Math.round(ticket.stake*(horse.odds+1)):0)+straight(2,.48)+straight(3,.28);
    if(ticket.type==='exacta'&&ticket.picks[0]===first&&ticket.picks[1]===second)payout=Math.round(ticket.stake*(1+horse.odds*secondHorse.odds*1.35));
    if(ticket.type==='exactaBox'&&ticket.picks.includes(first)&&ticket.picks.includes(second))payout=Math.round(ticket.stake*(1+horse.odds*secondHorse.odds*1.15));
    return {won:payout>0,payout,profit:payout-ticket.cost,first,second,third};
  }

  return {PERFORMANCE_RANGES,clamp,hashSeed,seededRandom,conditionFit,horseRating,buildRace,finishRace,applyRaceResult,simulateWorldRound,seedWorld,ticketCost,validateTicket,settleTicket};
});
