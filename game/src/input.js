// CADENZA — keyboard and mouse input.
// Click a card (or press its number key 1–7) to play it; E or the End Turn button
// ends the turn; Enter starts from the title screen and restarts after a win or a
// loss; R restarts mid-game. Every control does what it says it does.
// getGame is a function returning the live game object, so a restart (which swaps
// the object) keeps every handler pointing at the current duel.

import { playCard, endPlayerTurn, startGame } from './state.js';

export function bindInput(getGame, renderFn, onRestart) {
  const root = document.getElementById('app');

  root.addEventListener('click', (ev) => {
    const game = getGame();
    const cardEl = ev.target.closest('[data-card]');
    if (cardEl && !cardEl.classList.contains('back')) {
      if (playCard(game, cardEl.dataset.card)) renderFn();
      return;
    }
    if (ev.target.closest('#end-turn')) {
      endPlayerTurn(game);
      renderFn();
      return;
    }
    if (ev.target.closest('#play-button')) {
      startGame(game);
      renderFn();
      return;
    }
    if (ev.target.closest('#again-button')) {
      onRestart();
      return;
    }
    if (ev.target.closest('#restart-button')) {
      onRestart();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const game = getGame();
    const key = ev.key.toLowerCase();
    if (game.screen === 'title' && (key === 'enter' || key === ' ')) {
      ev.preventDefault();
      startGame(game);
      renderFn();
      return;
    }
    if ((game.screen === 'win' || game.screen === 'loss') && (key === 'enter' || key === 'r')) {
      onRestart();
      return;
    }
    if (game.screen !== 'table') return;
    if (key >= '1' && key <= '7') {
      const idx = Number(key) - 1;
      const id = game.player.hand[idx];
      if (id && playCard(game, id)) renderFn();
      return;
    }
    if (key === 'e') {
      endPlayerTurn(game);
      renderFn();
      return;
    }
    if (key === 'r') onRestart();
  });
}
