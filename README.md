# Underground Racing

A mobile-first fictional horse-racing wagering game spun out of Cage Grind's Underground Buzz race modal. It is a plain HTML/CSS/JavaScript project with no build step.

## Play

Choose Betty, Bruce, or Carl, study each race's form and track fit, build a ticket, and grow a fictional-credit wallet. Track conditions change the value of speed, stamina, consistency, and each horse's surface preference.

The rotating roster contains 36 fictional horses. Each record keeps age/sex, trainer, jockey, assigned weight, starts and in-the-money record, earnings per start, recent finishes, current and top speed figures, class rating, early and late pace, workout time/rank, preferred distance and surface, equipment, medication notation, wet-track record, and a recent trip comment. The mobile program promotes the most actionable portion of that data.

Jockeys use conventional full names drawn from Cage Grind's American and Latin fighter-name pools, with the roster intentionally weighted toward Spanish-language names.

Generator bounds are informed by Equibase's public In Today list, Full Past Performance documentation, sample E-Graphs, and published speed-figure leaders: age 2–9, assigned weight 110–126 lb, 1–55 starts, speed/pace figures 35–120, class ratings 50–120, morning lines 3/2–30/1, recent finishes 1–12, and workouts 46.0–53.0 seconds. These are game-safe observed bands, not claims about absolute historical records.

The first playable wagering menu includes:

- Win
- Place
- Show
- Across the Board
- Exacta
- Exacta Box

The ticket follows the beginner-friendly window sequence described by the [Churchill Downs Beginner's Guide](https://www.churchilldowns.com/wager/beginners-guide/): track, race, base amount, wager type, and program number. This is an entertainment game only; credits have no monetary value and no real-money wagering is offered.

## Local development

Open `index.html` directly, or serve the folder with any static server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Persistence

Character, wallet, current race, and recent ticket history are stored in browser `localStorage` under `underground-racing-save-v1`. Use the in-game Reset button to clear it.

## Tests

```bash
npm test
```

## Art assets

The three original character portraits were generated specifically for this game and optimized as WebP files in `assets/characters/`. The horse runner sprite was carried over from the Cage Grind prototype into `assets/horses/`.
