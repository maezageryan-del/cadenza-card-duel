// CADENZA — the hand-in program (Node 22, standard library only).
// The game itself is plain static files under game/ (game/index.html and its ES
// modules, no library, no network request). This program hands it in: it copies
// game/ and screenshots/ from beside this file into /output and writes
// /output/dossier.json — the summary the judge reads — with the vendored make.fun
// library (vendor/makefun-game.ts, the kit's copy, unchanged).
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function checkHandIn(): void {
  if (!existsSync(join(gameDir, 'index.html'))) {
    fail('game/index.html is missing — the game cannot open.');
  }
  if (!existsSync(shotsDir)) fail('screenshots/ is missing — the entry needs 3 or 4 screenshots.');
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    fail(`screenshots/ holds ${shots.length} images; the entry needs 3 or 4.`);
  }
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > 262144) fail(`screenshots/${name} is ${size} bytes; the cap is 256 KiB.`);
  }
}

checkHandIn();

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB, more than 993 files in game/ or 48 MiB of game
// files in all, or a path under game/ over 1000 bytes. game/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

const gameFiles = readdirSync(join(out, 'game'), { recursive: true }).length;
console.log(`CADENZA handed in: ${gameFiles} game entries, ${readdirSync(join(out, 'screenshots')).length} screenshots, dossier ${dossier.length} bytes -> ${out}`);
