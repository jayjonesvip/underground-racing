const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const logic=require('../js/race-logic.js');

const conditions=[{id:'fast',pace:'speed'},{id:'muddy',pace:'stamina'}];
const horses=Array.from({length:8},(_,index)=>({id:`h${index}`,name:`Horse ${index}`,speed:5+index%5,stamina:9-index%5,break:4+index%6,consistency:5+index%5,form:[1+index%5,2,3],conditionBias:{fast:index%2,muddy:(index+1)%2}}));

test('race cards are deterministic and expose useful wagering fields',()=>{
  const first=logic.buildRace(horses,conditions,1234),repeat=logic.buildRace(horses,conditions,1234);
  assert.deepEqual(first,repeat);
  assert.equal(first.field.length,6);
  assert.equal(new Set(first.field.map(horse=>horse.id)).size,6);
  for(const horse of first.field){assert.ok(horse.program>=1&&horse.program<=6);assert.ok(horse.odds>=1.5);assert.ok(horse.fit>=20&&horse.fit<=95)}
  assert.match(first.condition.distance,/6 FURLONGS|7 FURLONGS|1 MILE/);
  assert.ok(first.condition.raceClass>=76&&first.condition.raceClass<=95);
});

test('Equibase-derived generator ranges remain explicit and bounded',()=>{
  assert.deepEqual(logic.PERFORMANCE_RANGES.speedFigure,[35,120]);
  assert.deepEqual(logic.PERFORMANCE_RANGES.classRating,[50,120]);
  assert.deepEqual(logic.PERFORMANCE_RANGES.paceFigure,[35,120]);
  assert.deepEqual(logic.PERFORMANCE_RANGES.weight,[110,126]);
  assert.deepEqual(logic.PERFORMANCE_RANGES.morningLine,[1.5,50]);
});

test('jockey roster reuses the American and Latin Cage Grind name pools',()=>{
  const source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
  for(const name of ['Rafael Garcia','Santiago Morales','Adrian Rivera','Randy Jones','Marcus Davis'])assert.match(source,new RegExp(name));
  assert.match(source,/jockey:jockeys\[Math\.floor\(random\(\)\*jockeys\.length\)\]/);
});

test('race presentation includes audio, ticket lanes, and result modal controls',()=>{
  const script=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8'),css=fs.readFileSync(require.resolve('../css/styles.css'),'utf8');
  assert.match(script,/AudioContext\|\|window\.webkitAudioContext/);
  assert.match(script,/function startBell\(/);
  assert.match(script,/function startRaceAudio\(/);
  assert.match(script,/function outcomeSound\(won\)/);
  assert.match(script,/function finishTime\(position\)\{return 8000\+Math\.max\(0,position\)\*350\}/);
  assert.match(script,/function progressAtTime\(position,elapsed\)/);
  assert.match(script,/function markLaneFinished\(lane,position\)/);
  assert.match(script,/raceFrame=requestAnimationFrame\(frame\)/);
  assert.match(css,/\.track\.running \.runner\{transition:none\}/);
  assert.match(css,/@keyframes finish-flash/);
  assert.match(script,/ticket-lane/);
  for(const id of ['soundToggle','resultDialog','resultAvatar','resultModalTitle','reviewFinish','modalNextRace'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(css,/\.lane\.ticket-lane/);
  assert.match(css,/\.result-dialog/);
  assert.match(css,/\.result-avatar/);
  assert.match(css,/\.result-avatar\{[^}]*border-radius:12px/);
});

test('each player has neutral, winning, and losing portraits wired to settlement',()=>{
  const script=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
  for(const name of ['betty','bruce','carl']){
    assert.match(script,new RegExp(`asset:'assets/characters/${name}\\.webp'`));
    assert.match(script,new RegExp(`happyAsset:'assets/characters/${name}-happy\\.webp'`));
    assert.match(script,new RegExp(`madAsset:'assets/characters/${name}-mad\\.webp'`));
    for(const mood of ['happy','mad'])assert.equal(fs.existsSync(require.resolve(`../assets/characters/${name}-${mood}.webp`)),true);
  }
  assert.match(script,/setCharacterMood\(won\?'happy':'mad'\)/);
  assert.match(script,/\$\('#nextRace'\)\.addEventListener\('click',\(\)=>setCharacterMood\(\)\)/);
});

test('landing screen separates new and returning player journeys',()=>{
  const script=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8'),css=fs.readFileSync(require.resolve('../css/styles.css'),'utf8');
  assert.match(html,/id="landingScreen"/);
  assert.match(script,/function recentStats\(\)/);
  assert.match(script,/id="newCareer"/);
  assert.match(script,/id="continueCareer"/);
  for(const label of ['WALLET','RECENT TICKETS','WIN RATE','RECENT NET'])assert.match(script,new RegExp(label));
  assert.match(script,/renderLanding\(\);/);
  assert.match(script,/if\(selectedCharacter\(\)\)ensureRace\(\);/);
  assert.match(css,/\.landing-hero/);
  assert.match(css,/\.landing-stats/);
});

test('daily meets reset the race number at local midnight without clearing progress',()=>{
  const script=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
  assert.match(script,/function localDateKey|const localDateKey=/);
  assert.match(script,/meetDate:localDateKey\(\)/);
  assert.match(script,/function syncDailyMeet\(\)/);
  assert.match(script,/state\.meetDate===today\|\|state\.pendingTicket/);
  assert.match(script,/state\.raceNumber=1/);
  assert.match(script,/next\.setHours\(24,0,0,100\)/);
  assert.match(script,/visibilitychange/);
  assert.match(script,/`\$\{state\.seed\}\|\$\{state\.meetDate\}\|\$\{state\.raceNumber\}`/);
});

test('horse identity combinations produce exactly 200 unique names',()=>{
  const names=logic.buildUniqueNames(['Midnight Bell'],Array.from({length:25},(_,index)=>`Lead ${index}`),Array.from({length:20},(_,index)=>`Tail ${index}`),200);
  assert.equal(names.length,200);
  assert.equal(new Set(names).size,200);
  assert.ok(new Set(names.slice(1).map(name=>name.split(' ')[1])).size>20);
});

test('track conditions change the rating of specialists',()=>{
  const specialist={speed:7,stamina:7,break:7,consistency:7,form:[2,2,2],conditionBias:{fast:2,muddy:-2}};
  assert.ok(logic.horseRating(specialist,conditions[0])>logic.horseRating(specialist,conditions[1]));
});

test('ticket costs account for combinations',()=>{
  assert.equal(logic.ticketCost('win',5),5);
  assert.equal(logic.ticketCost('atb',5),15);
  assert.equal(logic.ticketCost('exactaBox',5),10);
});

test('ticket validation enforces selections, minimum, and wallet',()=>{
  const field=logic.buildRace(horses,conditions,12).field;
  assert.equal(logic.validateTicket({type:'win',stake:1,picks:[field[0].id],wallet:100,field}).ok,false);
  assert.equal(logic.validateTicket({type:'exacta',stake:2,picks:[field[0].id],wallet:100,field}).ok,false);
  assert.equal(logic.validateTicket({type:'exactaBox',stake:10,picks:[field[0].id,field[1].id],wallet:15,field}).ok,false);
  assert.deepEqual(logic.validateTicket({type:'exactaBox',stake:5,picks:[field[0].id,field[1].id],wallet:10,field}),{ok:true,cost:10,stake:5,picks:[field[0].id,field[1].id]});
});

test('straight, across-board, and exacta tickets settle correctly',()=>{
  const field=[{id:'a',odds:2},{id:'b',odds:3},{id:'c',odds:5}],finish=['a','b','c'];
  assert.deepEqual(logic.settleTicket({type:'win',stake:2,cost:2,picks:['a']},field,finish),{won:true,payout:6,profit:4,first:'a',second:'b',third:'c'});
  assert.equal(logic.settleTicket({type:'place',stake:2,cost:2,picks:['b']},field,finish).won,true);
  assert.equal(logic.settleTicket({type:'show',stake:2,cost:2,picks:['c']},field,finish).won,true);
  assert.ok(logic.settleTicket({type:'atb',stake:2,cost:6,picks:['a']},field,finish).payout>6);
  assert.equal(logic.settleTicket({type:'exacta',stake:2,cost:2,picks:['a','b']},field,finish).won,true);
  assert.equal(logic.settleTicket({type:'exactaBox',stake:2,cost:4,picks:['b','a']},field,finish).won,true);
  assert.equal(logic.settleTicket({type:'exacta',stake:2,cost:2,picks:['b','a']},field,finish).won,false);
});

test('ticket projections expose the same returns used by settlement',()=>{
  const field=[{id:'a',odds:2},{id:'b',odds:3},{id:'c',odds:5}],win={type:'win',stake:2,cost:2,picks:['a']},across={type:'atb',stake:2,cost:6,picks:['a']},exacta={type:'exacta',stake:2,cost:2,picks:['a','b']};
  assert.deepEqual(logic.projectTicketReturns(win,field),[{label:'IF 1ST',payout:6,profit:4}]);
  assert.deepEqual(logic.projectTicketReturns(across,field),[{label:'IF 1ST',payout:13,profit:7},{label:'IF 2ND',payout:7,profit:1},{label:'IF 3RD',payout:3,profit:-3}]);
  assert.equal(logic.projectTicketReturns(exacta,field)[0].payout,logic.settleTicket(exacta,field,['a','b','c']).payout);
  assert.equal(logic.projectTicketReturns(across,field)[0].payout,logic.settleTicket(across,field,['a','b','c']).payout);
});

test('wagering window renders projected return and net before purchase',()=>{
  const script=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8'),css=fs.readFileSync(require.resolve('../css/styles.css'),'utf8');
  assert.match(html,/id="potentialReturn"/);
  assert.match(script,/function renderPotentialReturns\(cost\)/);
  assert.match(script,/LOGIC\.projectTicketReturns/);
  assert.match(script,/POTENTIAL RETURN/);
  assert.match(css,/\.potential-return/);
});

test('mobile wagering keeps a live ticket dock and expandable review sheet',()=>{
  const script=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8'),css=fs.readFileSync(require.resolve('../css/styles.css'),'utf8');
  for(const id of ['ticketPanel','mobileTicketDock','mobileTicketToggle','mobileTicketPick','mobileTicketCost','mobileTicketReturn','ticketBackdrop','closeTicket','mobileQuickControls','mobileStraightTypes','mobileMoreBets','mobileExoticTypes','mobileStakeDown','mobileStakeValue','mobileStakeUp','mobilePlaceBet'])assert.match(html,new RegExp(`id="${id}"`));
  for(const step of ['BET TYPE','SELECTION','BASE WAGER'])assert.match(html,new RegExp(`<span>${step}</span>`));
  assert.match(script,/function setTicketSheet\(open\)/);
  assert.match(script,/mobileTicketReturn/);
  assert.match(script,/highestReturn/);
  assert.match(script,/function stepMobileStake\(direction\)/);
  assert.match(script,/function toggleMobileMore\(\)/);
  assert.match(script,/chooseBetType\(button\.dataset\.mobileBetType,true\)/);
  assert.match(script,/mobilePlaceBet.*placeBet/);
  assert.match(script,/atb:\{label:'BOX'/);
  assert.match(html,/>BOX<\/button>/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/\.mobile-ticket-dock/);
  assert.match(css,/\.ticket-panel\.mobile-open/);
  assert.match(css,/\.mobile-quick-controls/);
  assert.match(css,/\.mobile-exotic-types/);
  assert.match(css,/\.mobile-place-bet/);
});

test('race finish returns each horse exactly once',()=>{
  const race=logic.buildRace(horses,conditions,42),order=logic.finishRace(race.field,race.condition,[.1,.2,.3,.4,.5,.6]);
  assert.equal(order.length,6);
  assert.equal(new Set(order).size,6);
});

test('a committed race seed always resolves to the same result',()=>{
  const race=logic.buildRace(horses,conditions,123456),seed=logic.hashSeed(`${race.seed}|official-result`),first=logic.resolveRace(race.field,race.condition,seed),repeat=logic.resolveRace(race.field,race.condition,seed);
  assert.deepEqual(first,repeat);
  assert.equal(first.order.length,6);
  assert.equal(new Set(first.order).size,6);
  assert.ok(['hot','slow','honest'].includes(first.paceScenario));
  assert.equal(first.finishMargin,Number((first.details[0].score-first.details[1].score).toFixed(3)));
});

test('seeded results expose real close-finish margins for photo decisions',()=>{
  const race=logic.buildRace(horses,conditions,24680);let photo=null;
  for(let seed=1;seed<=500&&!photo;seed++){const result=logic.resolveRace(race.field,race.condition,seed);if(result.finishMargin<=.75)photo=result}
  assert.ok(photo);
  assert.ok(photo.finishMargin>=0&&photo.finishMargin<=.75);
});

test('reward state increments streaks, resets losses, and preserves personal bests',()=>{
  const first=logic.updateRewardState({winStreak:0,personalBestPayout:0},{won:true,payout:18});
  assert.deepEqual(first,{winStreak:1,personalBestPayout:18,newPersonalBest:true});
  const repeat=logic.updateRewardState(first,{won:true,payout:12});
  assert.deepEqual(repeat,{winStreak:2,personalBestPayout:18,newPersonalBest:false});
  const record=logic.updateRewardState(repeat,{won:true,payout:40});
  assert.deepEqual(record,{winStreak:3,personalBestPayout:40,newPersonalBest:true});
  assert.deepEqual(logic.updateRewardState(record,{won:false,payout:0}),{winStreak:0,personalBestPayout:40,newPersonalBest:false});
});

test('settlement dopamine effects are wired to real ticket and race data',()=>{
  const script=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8'),css=fs.readFileSync(require.resolve('../css/styles.css'),'utf8');
  for(const id of ['streakBadge','streakCount','photoFinishBanner','winFlash','personalBestToast'])assert.match(html,new RegExp(`id="${id}"`));
  for(const fn of ['snapBetSlip','animateWallet','payoutOdds','winningCopy','triggerBigWin','revealResult'])assert.match(script,new RegExp(`function ${fn}\\(`));
  assert.match(script,/if\(added\)snapBetSlip\(\)/);
  assert.match(script,/LOGIC\.updateRewardState\(state,result\)/);
  assert.match(script,/payoutOdds\(ticket,result\)>=20/);
  assert.match(script,/Number\(resolution\.finishMargin\)<=\.75/);
  assert.match(script,/winningCopy\(ticket,result\)/);
  assert.doesNotMatch(script,/favoriteHorseIds|data-favorite/);
  for(const animation of ['bet-slip-snap','big-win-shake','win-flash','photo-reveal'])assert.match(css,new RegExp(animation));
});

test('morning lines use traditional increments and avoid large tied groups',()=>{
  const field=Array.from({length:6},(_,index)=>({id:`line-${index}`,rating:100-index})),probabilities={'line-0':.38,'line-1':.24,'line-2':.15,'line-3':.08,'line-4':.08,'line-5':.07},prices=logic.priceMorningLine(field,probabilities),counts={};
  for(const price of Object.values(prices)){assert.ok(logic.MORNING_LINE_LADDER.includes(price));counts[price]=(counts[price]||0)+1}
  assert.ok(Math.max(...Object.values(counts))<=2);
  assert.ok(prices['line-0']<=prices['line-5']);
});

test('visible cards match horses into competitive ability bands',()=>{
  const roster=Array.from({length:200},(_,index)=>({id:`matched-${index}`,speed:4+index%7,stamina:4+(index*3)%7,break:4+(index*5)%7,consistency:4+(index*2)%7,speedFigure:48+index%59,classRating:50+(index*7)%71,earlyPace:35+(index*11)%86,latePace:35+(index*13)%86,weight:110+index%17,workoutPosition:1+index%18,workoutField:24,form:[1+index%8,1+(index*3)%8,1+(index*5)%8],distancePref:['sprint','route','versatile'][index%3],surfacePref:'dirt',style:['FRONT','PRESSER','CLOSER','VOLATILE'][index%4],conditionBias:{fast:index%3,muddy:(index+2)%3}})),seen=new Set();
  for(let seed=1;seed<=30;seed++){
    const field=logic.buildRace(roster,conditions,seed).field,ratings=field.map(horse=>horse.rating),odds=field.map(horse=>horse.odds);
    field.forEach(horse=>seen.add(horse.id));
    assert.ok(Math.max(...ratings)-Math.min(...ratings)<4);
    assert.ok(odds.filter(price=>price>=30).length<=1);
    assert.ok(odds.filter(price=>price<=20).length>=5);
  }
  assert.ok(seen.size>50);
});

test('seeded trip variance permits occasional longshot wins without erasing form',()=>{
  const field=[100,98,96,94,92,90].map((rating,index)=>({id:`seeded-${index}`,rating,consistency:6+index%3,stamina:7,break:7,style:['FRONT','PRESSER','CLOSER'][index%3]})),wins=Array(6).fill(0);
  for(let index=0;index<2000;index++){const winner=logic.resolveRace(field,conditions[0],logic.hashSeed(`distribution-${index}`)).order[0];wins[Number(winner.split('-')[1])]++}
  assert.ok(wins[0]>wins[5]);
  assert.ok(wins[0]/2000>.35);
  assert.ok((wins[3]+wins[4]+wins[5])/2000>.05);
});

test('five virtual world rounds give every horse five real results',()=>{
  const world=Array.from({length:200},(_,index)=>({id:`world-${index}`,name:`World Horse ${index}`,speed:4+index%7,stamina:4+(index*3)%7,break:4+(index*5)%7,consistency:4+(index*2)%7,speedFigure:55+index%50,classRating:60+index%45,earlyPace:50+index%60,latePace:50+(index*2)%60,weight:110+index%17,starts:0,wins:0,places:0,shows:0,earnings:0,topSpeedFigure:0,wetStarts:0,wetWins:0,form:[],recentRaces:[],conditionBias:{fast:index%3,muddy:(index+1)%3}}));
  const seeded=logic.seedWorld(world,conditions,98765,5),repeat=logic.seedWorld(world,conditions,98765,5);
  assert.deepEqual(seeded,repeat);
  assert.equal(seeded.length,200);
  for(const horse of seeded){
    assert.equal(horse.starts,5);
    assert.equal(horse.form.length,5);
    assert.equal(horse.recentRaces.length,5);
    assert.equal(horse.wins+horse.places+horse.shows<=horse.starts,true);
    assert.equal(horse.earningsPerStart,Math.round(horse.earnings/horse.starts));
  }
});

test('a world round leaves featured runners alone while every other horse races once',()=>{
  const world=Array.from({length:24},(_,index)=>({id:`circuit-${index}`,name:`Circuit Horse ${index}`,speed:7,stamina:7,break:7,consistency:7,starts:5,form:[1,2,3,4,5],conditionBias:{fast:1,muddy:0}})),excluded=world.slice(0,6).map(horse=>horse.id);
  const advanced=logic.simulateWorldRound(world,conditions,456,{excludeIds:excluded,raceIdPrefix:'DAY'});
  for(const horse of advanced)assert.equal(horse.starts,excluded.includes(horse.id)?5:6);
});
