const test=require('node:test');
const assert=require('node:assert/strict');
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
  assert.deepEqual(logic.PERFORMANCE_RANGES.morningLine,[1.5,30]);
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

test('race finish returns each horse exactly once',()=>{
  const race=logic.buildRace(horses,conditions,42),order=logic.finishRace(race.field,race.condition,[.1,.2,.3,.4,.5,.6]);
  assert.equal(order.length,6);
  assert.equal(new Set(order).size,6);
});
