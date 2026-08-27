const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/logic.js');

test('race generation is deterministic and provides useful form data', () => {
  const a = L.makeRace(12345); const b = L.makeRace(12345);
  assert.deepEqual(a, b); assert.equal(a.field.length, 6);
  assert.ok(a.field.every(h => h.rating > 0 && h.odds >= 1.2 && h.form.length === 5));
});
test('track condition materially changes horse ratings', () => {
  const horse = L.HORSES.find(h => h.id === 'velvet-switch');
  const fast = L.CONDITIONS.find(c => c.id === 'fast'); const sloppy = L.CONDITIONS.find(c => c.id === 'sloppy');
  assert.notEqual(L.conditionRating(horse, fast), L.conditionRating(horse, sloppy));
});
test('finish order contains every horse once', () => {
  const race = L.makeRace(900); const order = L.finishRace(race, [.1,.2,.3,.4,.5,.6]);
  assert.equal(order.length, 6); assert.equal(new Set(order).size, 6);
});
test('win, place, show and exacta settle correctly', () => {
  const race = L.makeRace(88); const order = race.field.map(h => h.id); const first = order[0]; const second = order[1];
  assert.equal(L.settleTicket({type:'win',first,amount:10},race,order).won,true);
  assert.equal(L.settleTicket({type:'place',first:second,amount:10},race,order).won,true);
  assert.equal(L.settleTicket({type:'show',first:order[2],amount:10},race,order).won,true);
  assert.equal(L.settleTicket({type:'exacta',first,second,amount:10},race,order).won,true);
  assert.equal(L.settleTicket({type:'exacta',first:second,second:first,amount:10},race,order).won,false);
});
test('ticket validation enforces minimum, wallet, and exacta order', () => {
  const race = L.makeRace(4); const first = race.field[0].id;
  assert.match(L.validateTicket({type:'win',first,amount:1},race,100),/minimum/);
  assert.match(L.validateTicket({type:'win',first,amount:101},race,100),/wallet/);
  assert.match(L.validateTicket({type:'exacta',first,second:first,amount:2},race,100),/different/);
  assert.equal(L.validateTicket({type:'win',first,amount:2},race,100),'');
});

