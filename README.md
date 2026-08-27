# Underground Racing

A standalone, mobile-first browser horse-racing wagering game. It uses fictional credits only: there are no deposits, purchases, withdrawals, prizes, or real-money wagers.

## Play

1. Choose Betty, Bruce, or Carl on first launch.
2. Read the track condition and each horse's recent form, running style, trait, speed, stamina, break, mud score, condition fit, and odds.
3. Build a ticket in order: wager type, horse selection, and amount.
4. Place the fictional wager, watch the race, collect any return, and move to the next changing card.

Playable wagers:

- **Win** — selected horse must finish first.
- **Place** — selected horse must finish first or second.
- **Show** — selected horse must finish in the top three.
- **Exacta** — select first and second in exact order.

The UI also explains Exacta Boxes, Trifectas, Superfectas, and Daily Doubles without crowding the first playable version. The ticket flow was informed by the [official Churchill Downs beginner guide](https://www.churchilldowns.com/wager/beginners-guide/).

## Local development

No build step is required. Serve the repository root with any static server, for example:

```sh
python -m http.server 8080
```

Then visit `http://localhost:8080`. Run logic tests with `npm test` (Node 20+ recommended).

## Persistence

The selected character, fictional-credit wallet, race sequence, and completed-race count are stored in `localStorage` under `underground-racing-save-v1`. Clearing site data resets the game to 1,000 fictional credits and character selection.

## Design and simulation

Track conditions rotate among Fast, Good, Sloppy, and Heavy. Ratings combine speed, stamina, break, five-race form, running style, mud aptitude, and the current surface. Odds derive from those condition-adjusted ratings. Results use the same ratings plus controlled uncertainty, so handicapping matters without making a race certain.

The horse marker was selectively copied from Cage Grind's Underground Buzz feature. The expanded form model, condition system, ticketing, settlement logic, and all character portraits are original to this standalone project. The Cage Grind repository is not modified.

## Deployment

The site is deployed as static files through GitHub Pages from the `main` branch repository root. With branch-based Pages enabled, pushes to `main` are published without a build step.
