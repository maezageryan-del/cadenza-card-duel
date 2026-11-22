// CADENZA — screenshot scenes.
// ?shot=title|table|win|loss puts the game into a fixed, readable state so the
// screenshots are real renders of the game's own code, taken in a browser.
// Nothing here is a mock: every scene is the live game with its state set, and the
// same screens are reachable by playing.

import { newGame } from './state.js';
import { nextIntent } from './ai.js';

function fixedHand(game, playerIds, rivalCount) {
  game.player.hand = [...playerIds];
  game.rival.hand = Array.from({ length: rivalCount }, (_, i) => game.rival.drawPile[i] ?? 'staccato');
}

export function applyShot(name) {
  const game = newGame(7); // fixed seed: the same table every time
  if (name === 'title') {
    game.screen = 'title';
    return game;
  }
  if (name === 'table') {
    // Mid-duel, turn 4: both conductors hurt, a shield up, a telegraphed attack,
    // a Crescendo about to land. This is the cover shot.
    game.screen = 'table';
    game.turn = 4;
    game.tempoMax = 5;
    game.tempo = 4;
    game.phase = 'player';
    game.player.applause = 22;
    game.player.shield = 4;
    game.rival.applause = 17;
    game.rival.shield = 0;
    game.intent = { kind: 'attack', label: 'Silas will strike hard', glyph: '\u25B2', hint: 'Guard up, or strike first.' };
    fixedHand(game,
      ['fanfare', 'bow-sweep', 'muted-strings', 'echo', 'serenade'],
      5);
    game.lastPlay = {
      by: 'player',
      card: { id: 'bow-sweep', name: 'Bow Sweep', suit: 'STR', cost: 2, kind: 'strike', value: 5, text: 'Deal 5 damage.' },
      bonus: 0, result: 'hits for 5',
    };
    game.log = [
      'You play Bow Sweep — hits for 5.',
      'Silas plays Trumpet Blast — hits for 6 (4 blocked).',
      'You play Muted Strings — gains 4 shield.',
      '— Turn 3 ends. Silas takes the baton. —',
    ];
    game.stats = { played: 6, damageDealt: 13, crescendos: 1 };
    return game;
  }
  if (name === 'win') {
    game.screen = 'win';
    game.phase = 'over';
    game.winner = 'player';
    game.turn = 8;
    game.player.applause = 14;
    game.rival.applause = 0;
    game.rival.shield = 0;
    game.player.shield = 0;
    fixedHand(game, ['grand-finale', 'fanfare', 'echo'], 3);
    game.lastPlay = {
      by: 'player',
      card: { id: 'grand-finale', name: 'Grand Finale', suit: 'BRS', cost: 4, kind: 'strike', value: 12, text: 'Deal 12 damage.' },
      bonus: 2, result: 'hits for 14  · crescendo +2',
    };
    game.log = [
      'You play Grand Finale — hits for 14  · crescendo +2.',
      'The hall rises — STANDING OVATION!',
    ];
    game.stats = { played: 15, damageDealt: 34, crescendos: 3 };
    return game;
  }
  if (name === 'loss') {
    game.screen = 'loss';
    game.phase = 'over';
    game.winner = 'rival';
    game.turn = 7;
    game.player.applause = 0;
    game.rival.applause = 19;
    game.player.shield = 0;
    game.rival.shield = 6;
    fixedHand(game, ['lullaby', 'soft-breeze'], 4);
    game.lastPlay = {
      by: 'rival',
      card: { id: 'thunder-beat', name: 'Thunder Beat', suit: 'PRC', cost: 3, kind: 'strike', value: 9, text: 'Deal 9 damage.' },
      bonus: 0, result: 'hits for 9',
    };
    game.log = [
      'Silas plays Thunder Beat — hits for 9.',
      'The hall falls silent…',
    ];
    game.stats = { played: 11, damageDealt: 11, crescendos: 0 };
    return game;
  }
  return game;
}

export function shotFromUrl() {
  const params = new URLSearchParams(location.search);
  return params.get('shot');
}

// Keep the rival honest after a scripted scene: the next intent follows the board.
export function refreshIntent(game) {
  if (game.screen === 'table') nextIntent(game);
}
