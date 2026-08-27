(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.UndergroundLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CONDITIONS = [
    { id: 'fast', name: 'Fast', icon: '☀', note: 'Hard, dry dirt rewards early speed.', speed: 5, stamina: -1, bias: 'Front runners' },
    { id: 'good', name: 'Good', icon: '◐', note: 'A fair, lightly packed surface with little bias.', speed: 1, stamina: 1, bias: 'Balanced' },
    { id: 'sloppy', name: 'Sloppy', icon: '☂', note: 'Standing water favors mud form and patient trips.', speed: -3, stamina: 2, bias: 'Mud runners' },
    { id: 'heavy', name: 'Heavy', icon: '≋', note: 'Deep going punishes weak stamina late.', speed: -5, stamina: 6, bias: 'Stamina' }
  ];

  const HORSES = [
    { id: 'midnight-bell', name: 'Midnight Bell', color: '#58d7ff', speed: 89, stamina: 74, break: 94, mud: 58, style: 'Front', trait: 'Gate rocket', form: [2, 1, 4, 1, 3] },
    { id: 'southpaw-sally', name: 'Southpaw Sally', color: '#ff6574', speed: 80, stamina: 92, break: 71, mud: 83, style: 'Closer', trait: 'Late kick', form: [4, 2, 1, 2, 1] },
    { id: 'neon-thunder', name: 'Neon Thunder', color: '#c58aff', speed: 95, stamina: 68, break: 82, mud: 64, style: 'Stalker', trait: 'Boom or bust', form: [1, 6, 2, 5, 1] },
    { id: 'iron-hoof', name: 'Iron Hoof', color: '#d6dde5', speed: 77, stamina: 96, break: 70, mud: 91, style: 'Closer', trait: 'Deep-ground grinder', form: [3, 3, 2, 2, 2] },
    { id: 'copper-ghost', name: 'Copper Ghost', color: '#f0a34d', speed: 86, stamina: 82, break: 86, mud: 72, style: 'Stalker', trait: 'Clean-trip pro', form: [5, 1, 3, 1, 4] },
    { id: 'velvet-switch', name: 'Velvet Switch', color: '#7ce3a1', speed: 83, stamina: 86, break: 78, mud: 96, style: 'Closer', trait: 'Loves the slop', form: [6, 4, 3, 1, 2] }
  ];

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function mulberry(seed) {
    let value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      let n = value;
      n = Math.imul(n ^ n >>> 15, n | 1);
      n ^= n + Math.imul(n ^ n >>> 7, n | 61);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }
  function averageForm(form) { return form.reduce((sum, place) => sum + (7 - place), 0) / form.length; }
  function conditionRating(horse, condition) {
    const base = horse.speed * .42 + horse.stamina * .31 + horse.break * .14 + averageForm(horse.form) * 2.1;
    const surface = condition.id === 'sloppy' || condition.id === 'heavy' ? (horse.mud - 75) * .22 : 0;
    const style = condition.id === 'fast' && horse.style === 'Front' ? 3 : condition.id === 'heavy' && horse.style === 'Closer' ? 3 : 0;
    return Math.round((base + condition.speed * horse.speed / 100 + condition.stamina * horse.stamina / 100 + surface + style) * 10) / 10;
  }
  function makeRace(seed) {
    const random = mulberry(seed);
    const condition = CONDITIONS[Math.floor(random() * CONDITIONS.length)];
    const field = HORSES.map((horse, index) => ({ ...horse, lane: index + 1, rating: conditionRating(horse, condition) }));
    const strengths = field.map(horse => Math.exp((horse.rating - 76) / 8));
    const total = strengths.reduce((a, b) => a + b, 0);
    field.forEach((horse, index) => {
      horse.chance = strengths[index] / total;
      horse.odds = Math.max(1.2, Math.round(((1 / horse.chance - 1) * .86) * 10) / 10);
    });
    return { seed, number: (seed % 8) + 1, distance: condition.id === 'heavy' ? '1 ⅛ MILE' : '1 MILE', condition, field };
  }
  function finishRace(race, rolls) {
    const random = rolls ? null : mulberry(race.seed ^ 0x9E3779B9);
    return race.field.map((horse, index) => {
      const roll = rolls ? clamp(rolls[index], .0001, .9999) : random();
      const noise = -Math.log(-Math.log(roll)) * 5.8;
      const volatility = horse.id === 'neon-thunder' ? (roll - .5) * 9 : 0;
      return { id: horse.id, score: horse.rating + noise + volatility };
    }).sort((a, b) => b.score - a.score).map(entry => entry.id);
  }
  function validateTicket(ticket, race, wallet) {
    const types = ['win', 'place', 'show', 'exacta'];
    if (!types.includes(ticket.type)) return 'Choose a wager type.';
    const amount = Number(ticket.amount);
    if (!Number.isInteger(amount) || amount < 2) return 'The minimum ticket is 2 credits.';
    if (amount > wallet) return 'That ticket exceeds your wallet.';
    if (!race.field.some(h => h.id === ticket.first)) return 'Choose your first horse.';
    if (ticket.type === 'exacta' && (!race.field.some(h => h.id === ticket.second) || ticket.first === ticket.second)) return 'Exacta needs two different horses in exact order.';
    return '';
  }
  function settleTicket(ticket, race, order) {
    const horse = race.field.find(h => h.id === ticket.first);
    const position = order.indexOf(ticket.first) + 1;
    let won = false;
    let multiplier = 0;
    if (ticket.type === 'win') { won = position === 1; multiplier = horse.odds + 1; }
    if (ticket.type === 'place') { won = position <= 2; multiplier = 1 + horse.odds * .48; }
    if (ticket.type === 'show') { won = position <= 3; multiplier = 1 + horse.odds * .26; }
    if (ticket.type === 'exacta') {
      const second = race.field.find(h => h.id === ticket.second);
      won = order[0] === ticket.first && order[1] === ticket.second;
      multiplier = 1 + horse.odds * second.odds * .72;
    }
    const payout = won ? Math.max(Number(ticket.amount), Math.round(Number(ticket.amount) * multiplier)) : 0;
    return { won, payout, profit: payout - Number(ticket.amount), position, order };
  }
  return { CONDITIONS, HORSES, makeRace, finishRace, validateTicket, settleTicket, conditionRating };
});

