// CADENZA — boot.
// Builds the first duel, wires input, paints the table, and exposes the live state
// for the headless checks (window.__gameState) and the screenshot signal
// (window.__shotReady). The rival's plan function lives on the game object so the
// turn rules in state.js can call it without importing the AI twice.

import { newGame, publicState } from './state.js';
import { chooseRivalPlays } from './ai.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { applyShot, shotFromUrl } from './shots.js';

let game;
const shot = shotFromUrl();

function currentGame() { return game; }

function paint() {
  render(game);
  window.__gameState = publicState(game);
}

function restart() {
  game = newGame((Math.random() * 1e9) | 0);
  game._rivalPlan = chooseRivalPlays;
  paint();
}

if (shot) {
  game = applyShot(shot);
} else {
  game = newGame();
}
game._rivalPlan = chooseRivalPlays;

bindInput(currentGame, paint, restart);
paint();

// The rival's turn runs synchronously inside endPlayerTurn; the renderer's floaters
// and the card animations need a beat to settle before a screenshot is taken.
window.__shotReady = false;
setTimeout(() => { window.__shotReady = true; }, shot ? 900 : 400);
