// CADENZA — game state and turn rules.
// One object holds the whole duel. No DOM lives here: render.js reads this state
// and input.js calls these functions. Keeping the model separate from the rendering
// is what lets the headless checks play the game end to end without a screen.

import { CARD_BY_ID, buildDeck, shuffle, crescendoBonus } from './cards.js';
import { nextIntent } from './ai.js';

export const MAX_APPLAUSE = 40;
export const MAX_HAND = 7;
export const MAX_TEMPO = 6;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSide(deck) {
  return {
    applause: MAX_APPLAUSE,
    shield: 0,
    hand: [],
    drawPile: deck,
    discard: [],
    weakenNext: 0, // reduces the next strike this side suffers
    setupBonus: 0, // added to this side's next card this turn
    playedThisTurn: [],
  };
}

export function newGame(seed = 20261123) {
  const rand = mulberry32(seed);
  const game = {
    seed,
    rand,
    screen: 'title', // title | table | win | loss
    turn: 1,
    tempo: 3,
    tempoMax: 3,
    phase: 'player', // player | rival | over
    player: makeSide(shuffle(buildDeck(), rand)),
    rival: makeSide(shuffle(buildDeck(), rand)),
    log: [],
    lastPlay: null, // { by, card, bonus, result } — the most recent card, for animation
    intent: null, // the rival's telegraphed plan for the coming turn
    winner: null,
    stats: { played: 0, damageDealt: 0, crescendos: 0 },
  };
  drawCards(game.player, 5, game);
  drawCards(game.rival, 5, game);
  game.intent = { kind: 'attack', label: 'Silas will strike hard', glyph: '\u25B2' };
  return game;
}

export function drawCards(side, n, game) {
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= MAX_HAND) break;
    if (!side.drawPile.length) {
      if (!side.discard.length) break;
      side.drawPile = shuffle(side.discard, game.rand);
      side.discard = [];
    }
    side.hand.push(side.drawPile.pop());
  }
}

function dealDamage(game, target, amount, source) {
  const shielded = Math.min(target.shield, amount);
  target.shield -= shielded;
  const through = amount - shielded;
  target.applause = Math.max(0, target.applause - through);
  return { shielded, through };
}

function applyCard(game, side, foe, cardId) {
  const card = CARD_BY_ID[cardId];
  const idx = side.hand.indexOf(cardId);
  if (idx === -1) return null;
  side.hand.splice(idx, 1);
  side.discard.push(cardId);

  const bonus = crescendoBonus(side.playedThisTurn, card) + side.setupBonus;
  side.setupBonus = 0;
  side.playedThisTurn.push(card);
  if (bonus > 0 && crescendoBonus(side.playedThisTurn.slice(0, -1), card) > 0) {
    game.stats.crescendos += 1;
  }

  let result = '';
  if (card.kind === 'strike') {
    let amount = card.value + bonus;
    if (side === game.player && game.rival.weakenNext > 0) {
      amount = Math.max(0, amount - game.rival.weakenNext);
      game.rival.weakenNext = 0;
    }
    if (side === game.rival && game.player.weakenNext > 0) {
      amount = Math.max(0, amount - game.player.weakenNext);
      game.player.weakenNext = 0;
    }
    const hit = dealDamage(game, foe, amount, side);
    result = `hits for ${amount}` + (hit.shielded ? ` (${hit.shielded} blocked)` : '');
    if (side === game.player) game.stats.damageDealt += hit.through;
  } else if (card.kind === 'guard') {
    side.shield += card.value + bonus;
    result = `gains ${card.value + bonus} shield`;
  } else if (card.kind === 'draw') {
    drawCards(side, card.value, game);
    result = `draws ${card.value}`;
    if (card.id === 'overture') {
      game.tempo = Math.min(MAX_TEMPO, game.tempo + 1);
    }
  } else if (card.kind === 'heal') {
    const healed = Math.min(MAX_APPLAUSE - side.applause, card.value + bonus);
    side.applause += healed;
    result = `restores ${healed} applause`;
  } else if (card.kind === 'setup') {
    side.setupBonus = card.value;
    result = `next card gains +${card.value}`;
  } else if (card.kind === 'weaken') {
    foe.weakenNext = card.value;
    result = `softens the rival\u2019s next strike by ${card.value}`;
  }
  if (bonus > 0) result += `  \u00B7 crescendo +${bonus}`;
  return { card, bonus, result };
}

export function canPlay(game, cardId) {
  if (game.screen !== 'table' || game.phase !== 'player') return false;
  const card = CARD_BY_ID[cardId];
  return card && game.tempo >= card.cost && game.player.hand.includes(cardId);
}

// The player plays one card. Returns the play record, or null when illegal.
export function playCard(game, cardId) {
  if (!canPlay(game, cardId)) return null;
  const card = CARD_BY_ID[cardId];
  game.tempo -= card.cost;
  game.stats.played += 1;
  const play = applyCard(game, game.player, game.rival, cardId);
  if (!play) return null;
  game.lastPlay = { by: 'player', ...play };
  game.log.unshift(`You play ${card.name} — ${play.result}.`);
  game.log.length = Math.min(game.log.length, 6);
  checkEnd(game);
  return play;
}

// The rival plays its whole turn at once (the renderer animates it card by card).
// intent is the telegraphed plan from the previous turn — the rival keeps its word.
export function rivalTurn(game, plan) {
  game.phase = 'rival';
  game.rival.shield = 0; // the rival's old shield expires as its new turn begins
  const plays = plan(game);
  for (const cardId of plays) {
    const card = CARD_BY_ID[cardId];
    if (!card || game.rival.tempo < card.cost) continue;
    game.rival.tempo -= card.cost;
    const play = applyCard(game, game.rival, game.player, cardId);
    if (!play) continue;
    game.lastPlay = { by: 'rival', ...play };
    game.log.unshift(`Silas plays ${card.name} — ${play.result}.`);
    game.log.length = Math.min(game.log.length, 6);
    if (checkEnd(game)) break;
  }
  if (game.screen !== 'win' && game.screen !== 'loss') {
    startPlayerTurn(game);
  }
  return plays;
}

export function startPlayerTurn(game) {
  game.turn += 1;
  game.tempoMax = Math.min(MAX_TEMPO, 2 + game.turn);
  game.tempo = game.tempoMax;
  game.player.playedThisTurn = [];
  game.rival.playedThisTurn = [];
  game.player.shield = 0; // the player's old shield expires as the new turn begins
  drawCards(game.player, 2, game);
  game.phase = 'player';
  nextIntent(game); // telegraph the rival's plan for the turn now beginning
}

export function endPlayerTurn(game) {
  if (game.screen !== 'table' || game.phase !== 'player') return;
  game.log.unshift(`— Turn ${game.turn} ends. Silas takes the baton. —`);
  game.rival.tempo = Math.min(MAX_TEMPO, 2 + game.turn);
  rivalTurn(game, game._rivalPlan);
}

export function checkEnd(game) {
  if (game.rival.applause <= 0) {
    game.screen = 'win';
    game.phase = 'over';
    game.winner = 'player';
    game.log.unshift('The hall rises — STANDING OVATION!');
    return true;
  }
  if (game.player.applause <= 0) {
    game.screen = 'loss';
    game.phase = 'over';
    game.winner = 'rival';
    game.log.unshift('The hall falls silent…');
    return true;
  }
  return false;
}

export function startGame(game) {
  game.screen = 'table';
  game.phase = 'player';
  game.log.unshift('The duel begins. Play a card, then end your turn.');
}

// Serialised for the headless checks: state + score, updated every render.
export function publicState(game) {
  return {
    screen: game.screen,
    phase: game.phase,
    turn: game.turn,
    tempo: game.tempo,
    tempoMax: game.tempoMax,
    applause: { player: game.player.applause, rival: game.rival.applause },
    shield: { player: game.player.shield, rival: game.rival.shield },
    hand: game.player.hand.length,
    rivalHand: game.rival.hand.length,
    intent: game.intent ? game.intent.kind : null,
    winner: game.winner,
    stats: { ...game.stats },
  };
}
