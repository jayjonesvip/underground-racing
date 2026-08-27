# Underground Racing

A mobile-first fictional horse-racing wagering game spun out of Cage Grind's Underground Buzz race modal. It is a plain HTML/CSS/JavaScript project with no build step.

## Play

Choose Betty, Bruce, or Carl, study each race's form and track fit, build a ticket, and grow a fictional-credit wallet. Track conditions change the value of speed, stamina, consistency, and each horse's surface preference.

The persistent circuit contains 200 fictional horses. Each horse is generated once and stored in the player's local save. Five complete virtual racing days are simulated when the world is created, so every horse begins with five actual results rather than fabricated form numbers. Each visible race updates its six runners while the other 194 horses compete in virtual races, giving every horse one new start per world day and retaining a rolling last five.

Each record keeps age/sex, trainer, jockey, assigned weight, starts and in-the-money record, actual simulated earnings per start, last-five finishes, current and top speed figures, class rating, early and late pace, workout time/rank, preferred distance and surface, equipment, medication notation, wet-track record, and recent race details. The mobile program promotes the most actionable portion of that data.

Race outcomes are committed by a deterministic seed when the card is created. Ability, class, pace, form, surface and distance fit, weight, workouts, and consistency drive most of the result. Seeded pace scenarios, trip variation, and rare incidents allow believable upsets. The same card cannot be rerolled by refreshing or changing a wager. Because this is a static client-only game, a technical player can inspect the seed and public algorithm; authoritative hidden results would require server-side resolution.

Visible race cards are assembled as competitive class bands: the seeded card selects an ability anchor, then matches it with the five nearest condition-adjusted runners from the 200-horse circuit. The morning line runs 2,000 alternate seeded versions of that matched field, converts each win share into fair fractional odds, and snaps it to a traditional ladder from 3/2 through 50/1. Unrounded probability and rating order break crowded buckets, with no more than two runners sharing a quoted line in a six-horse field.

Jockeys use conventional full names drawn from Cage Grind's American and Latin fighter-name pools, with the roster intentionally weighted toward Spanish-language names.

Generator bounds are informed by Equibase's public In Today list, Full Past Performance documentation, sample E-Graphs, and published speed-figure leaders: age 2–9, assigned weight 110–126 lb, 1–55 starts, speed/pace figures 35–120, class ratings 50–120, morning lines 3/2–30/1, recent finishes 1–12, and workouts 46.0–53.0 seconds. These are game-safe observed bands, not claims about absolute historical records.

The first playable wagering menu includes:

- Win
- Place
- Show
- Across the Board
- Exacta
- Exacta Box

Race presentation includes a synthesized starting bell, low track rumble and hoof texture, distinct win/loss cues, cyan highlighting for every horse covered by the ticket, and an official-result modal. Each player has neutral, happy-win, and mad-loss portraits that react when the ticket settles. Sounds require no downloaded audio assets and can be disabled with the persistent Sound toggle.

The ticket follows the beginner-friendly window sequence described by the [Churchill Downs Beginner's Guide](https://www.churchilldowns.com/wager/beginners-guide/): track, race, base amount, wager type, and program number. This is an entertainment game only; credits have no monetary value and no real-money wagering is offered.

## Local development

Open `index.html` directly, or serve the folder with any static server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Persistence

Character, wallet, current race, and recent ticket history are stored in browser `localStorage` under `underground-racing-save-v1`. At local midnight, a new daily meet begins at Race 1 while the wallet, horse records, and ledger persist. A race with a committed ticket always settles before the daily reset. Use the in-game Reset button to clear the full save.

## Tests

```bash
npm test
```

## Art assets

The three character identities and their happy-win and mad-loss expression variants were generated specifically for this game and optimized as WebP files in `assets/characters/`. The horse runner sprite was carried over from the Cage Grind prototype into `assets/horses/`.
