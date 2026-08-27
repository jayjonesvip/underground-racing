(function () {
  'use strict';
  const L = window.UndergroundLogic;
  const KEY = 'underground-racing-save-v1';
  const CHARACTERS = {
    betty: { name: 'Betty', image: 'assets/characters/betty.png' },
    bruce: { name: 'Bruce', image: 'assets/characters/bruce.png' },
    carl: { name: 'Carl', image: 'assets/characters/carl.png' }
  };
  const $ = selector => document.querySelector(selector);
  const state = load();
  let race = L.makeRace(state.raceSeed);
  let ticket = { type: 'win', first: '', second: '', amount: 10 };
  let selecting = 'first';
  let timer;

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY));
      if (parsed && CHARACTERS[parsed.character] && Number.isFinite(parsed.wallet)) return { character: parsed.character, wallet: Math.max(0, Math.round(parsed.wallet)), raceSeed: Number(parsed.raceSeed) || Date.now(), races: Number(parsed.races) || 0 };
    } catch (_) {}
    return { character: '', wallet: 1000, raceSeed: Date.now() & 0x7fffffff, races: 0 };
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function horse(id) { return race.field.find(h => h.id === id); }
  function typeLabel(type) { return type.toUpperCase(); }
  function toast(text) { clearTimeout(timer); $('#toast').textContent = text; $('#toast').classList.add('show'); timer = setTimeout(() => $('#toast').classList.remove('show'), 2400); }

  function start(character) {
    state.character = character; save(); $('#onboarding').hidden = true; $('#game').hidden = false;
    const profile = CHARACTERS[character]; $('#profileImage').src = profile.image; $('#profileName').textContent = profile.name;
    render();
  }
  function render() {
    $('#wallet').textContent = fmt(state.wallet) + ' CR';
    $('#raceNumber').textContent = race.number; $('#conditionIcon').textContent = race.condition.icon; $('#conditionName').textContent = race.condition.name.toUpperCase();
    $('#conditionNote').textContent = race.condition.note; $('#conditionBias').textContent = race.condition.bias;
    $('#horseField').innerHTML = race.field.map(h => `<button type="button" class="horse${h.id===ticket.first||h.id===ticket.second?' selected':''}" data-horse="${h.id}" style="--horse:${h.color}"><span class="silk">${h.lane}</span><span class="horse-main"><span class="horse-title"><b>${h.name}</b><em>${h.style} · ${h.trait}</em></span><span class="formline" aria-label="Recent finishes ${h.form.join(', ')}">${h.form.map(p=>`<i>${p}</i>`).join('')}</span><span class="stats">SPD ${h.speed} STA ${h.stamina} BRK ${h.break} MUD ${h.mud}</span></span><span class="odds"><small>ODDS</small><strong>${h.odds.toFixed(1)}–1</strong><b>FIT ${h.rating}</b></span></button>`).join('');
    updateTicket();
  }
  function updateTicket() {
    ticket.amount = Number($('#amount').value) || 0;
    const exacta = ticket.type === 'exacta'; $('#secondSelection').hidden = !exacta; $('#selectionInstruction').textContent = exacta ? 'Pick 1st, then 2nd — exact order' : 'Choose one horse';
    $('#firstSelection').textContent = ticket.first ? `${exacta?'1st · ':''}#${horse(ticket.first).lane} ${horse(ticket.first).name}` : `${exacta?'1st pick':'Choose a horse'}`;
    $('#secondSelection').textContent = ticket.second ? `2nd · #${horse(ticket.second).lane} ${horse(ticket.second).name}` : '2nd pick';
    const first = horse(ticket.first); const second = horse(ticket.second);
    $('#ticketLine').textContent = `The Switchyard · Race ${race.number} · ${ticket.amount || 0} CR to ${typeLabel(ticket.type)} · ${first ? '#'+first.lane+' '+first.name : 'Select a horse'}${exacta && second ? ' over #'+second.lane+' '+second.name : ''}`;
    let multiplier = first ? 1 + first.odds * (ticket.type==='place'?.48:ticket.type==='show'?.26:1) : 0;
    if (exacta) multiplier = first && second ? 1 + first.odds * second.odds * .72 : 0;
    $('#returnLine').textContent = multiplier ? `Estimated return: ${fmt(ticket.amount * multiplier)} CR if correct` : 'Potential return appears here';
    const error = L.validateTicket(ticket, race, state.wallet); $('#ticketError').textContent = error; $('#placeBet').disabled = !!error;
  }
  function selectHorse(id) {
    if (ticket.type === 'exacta') {
      if (selecting === 'first') { ticket.first = id; if (ticket.second === id) ticket.second = ''; selecting = 'second'; }
      else { if (ticket.first === id) { toast('Exacta needs two different horses.'); return; } ticket.second = id; selecting = 'first'; }
    } else ticket.first = id;
    render();
  }
  function runRace() {
    const error = L.validateTicket(ticket, race, state.wallet); if (error) return toast(error);
    state.wallet -= ticket.amount; save(); $('#wallet').textContent = fmt(state.wallet) + ' CR';
    const order = L.finishRace(race); const settlement = L.settleTicket(ticket, race, order);
    $('#raceOverlay').hidden = false; $('#raceCall').textContent = "THEY'RE AT THE GATE"; $('#raceTitle').textContent = `RACE ${race.number} · ${race.condition.name.toUpperCase()} ${race.distance}`;
    $('#result').hidden = true; $('#nextRace').hidden = true;
    $('#track').innerHTML = race.field.map(h => `<div class="lane"><img class="runner" data-runner="${h.id}" src="assets/game/racehorse-right.png" alt="${h.name}"><span>#${h.lane} ${h.name}</span></div>`).join('');
    let step = 0; const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; const maxSteps = reduced ? 1 : 8;
    const interval = setInterval(() => {
      step++; $('#raceCall').textContent = step < maxSteps * .55 ? 'DOWN THE BACKSTRETCH' : 'TURNING FOR HOME';
      order.forEach((id, place) => { const pct = Math.min(1, step / maxSteps) * (86 - place * 3); const jitter = step===maxSteps?0:Math.random()*4; const el = document.querySelector(`[data-runner="${id}"]`); el.style.setProperty('--x', `${(pct + jitter) * .78}%`); });
      if (step >= maxSteps) { clearInterval(interval); setTimeout(() => showResult(settlement), reduced ? 20 : 650); }
    }, reduced ? 40 : 520);
  }
  function showResult(settlement) {
    state.wallet += settlement.payout; state.races++; save(); $('#wallet').textContent = fmt(state.wallet) + ' CR';
    $('#raceCall').textContent = 'OFFICIAL RESULT'; const names = settlement.order.map(id => horse(id));
    $('#result').innerHTML = `<h3>${settlement.won ? `TICKET CASHED · +${fmt(settlement.profit)} CR` : 'TICKET MISSED'}</h3><ol>${names.map((h,i)=>`<li><strong>#${h.lane} ${h.name}</strong></li>`).join('')}</ol><p>${settlement.won ? `${fmt(settlement.payout)} credits returned to your play wallet.` : `${horse(ticket.first).name} finished #${settlement.position}.`}</p>`;
    $('#result').hidden = false; $('#nextRace').hidden = false;
  }
  function nextRace() {
    state.raceSeed = (state.raceSeed + 7919) & 0x7fffffff; save(); race = L.makeRace(state.raceSeed); ticket = { type: 'win', first: '', second: '', amount: 10 }; selecting = 'first'; $('#amount').value = 10; $('#raceOverlay').hidden = true; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', event => {
    const character = event.target.closest('[data-character]'); if (character) return start(character.dataset.character);
    const type = event.target.closest('[data-type]'); if (type) { ticket.type = type.dataset.type; ticket.second = ''; selecting='first'; document.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('active',b===type)); return render(); }
    const pick = event.target.closest('[data-horse]'); if (pick) return selectHorse(pick.dataset.horse);
    const chip = event.target.closest('[data-chip]'); if (chip) { $('#amount').value = Math.max(2, (Number($('#amount').value)||0) + Number(chip.dataset.chip)); return updateTicket(); }
  });
  $('#amount').addEventListener('input', updateTicket); $('#firstSelection').addEventListener('click',()=>{selecting='first';toast('Tap a horse in the field.');}); $('#secondSelection').addEventListener('click',()=>{selecting='second';toast('Tap the horse to finish second.');});
  $('#placeBet').addEventListener('click', runRace); $('#nextRace').addEventListener('click', nextRace); $('#formHelp').addEventListener('click',()=>$('#helpDialog').showModal()); $('.dialog-close').addEventListener('click',()=>$('#helpDialog').close());
  $('#profileButton').addEventListener('click',()=>{ if(confirm('Choose a different player? Your wallet and race history stay saved.')) { $('#onboarding').hidden=false; } });
  if (state.character) start(state.character); else { $('#onboarding').hidden=false; $('#game').hidden=true; }
})();
