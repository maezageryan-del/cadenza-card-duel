# CADENZA — Duel of the Conductors

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/competitions/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/maezageryan-del/cadenza-card-duel/rank.svg)](https://make.fun/competitions/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/maezageryan-del/cadenza-card-duel/reward.svg)](https://make.fun/competitions/best-card-game-20261122-1826)

A complete HTML5 card game for the [make.fun best card game bounty](https://make.fun/competitions/best-card-game-20261122-1826).
You, the young conductor, against Maestro Silas — win the hall's applause (40 points)
before he wins yours.

## How it plays

- **Four suits, told apart by colour and shape**: Strings ♪ (violet), Winds ≋ (teal),
  Brass ▲ (gold), Percussion ● (crimson). Never by text alone.
- **Tempo** is energy: it grows each turn (up to 6). Every card costs tempo.
- **24 unique cards**: strikes, guards (shield), draws, heals, and setups.
- **Crescendo**: play two cards of one suit in a turn and the second gains +2.
- **Telegraphed rival**: Silas announces his plan at the start of your turn
  ("Silas will strike hard" / "Silas will guard" / "Silas will scheme") — and keeps
  his word. Read it, then counter it.
- **Controls**: click a card (or press 1–7) to play it, **E** or the End Turn button
  to end your turn, **Enter** to start / restart, **R** to restart.

## Screenshots

1. `1-table.jpg` — the table mid-duel (cover)
2. `2-title.jpg` — title screen
3. `3-win.jpg` — win screen: STANDING OVATION
4. `4-loss.jpg` — loss screen: THE HALL FALLS SILENT

## Play it

```sh
node serve.ts   # http://localhost:8080
```

Or open `game/index.html` in desktop Chrome. No network requests, no libraries,
no build step — plain static files under `game/`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library (`vendor/makefun-game.ts`).

## Layout

| File | Job |
| --- | --- |
| `game/index.html` | page shell |
| `game/src/style.css` | the concert-hall look |
| `game/src/cards.js` | suits, the 24-card catalogue, Crescendo rule |
| `game/src/state.js` | game state and turn rules |
| `game/src/ai.js` | Maestro Silas: telegraphed intent + play policy |
| `game/src/render.js` | DOM rendering of the table |
| `game/src/input.js` | keyboard + mouse |
| `game/src/shots.js` | fixed screenshot scenes (`?shot=`) |
| `game/src/main.js` | boot |
| `main.ts` | hand-in program |
| `serve.ts` | local static server |

## License

MIT — see [LICENSE](LICENSE).
