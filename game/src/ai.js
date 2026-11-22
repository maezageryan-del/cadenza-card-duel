// CADENZA — Maestro Silas, the rival conductor.
// Silas telegraphs his plan at the start of your turn and then keeps his word:
// the intent banner you read is the category he will actually play. That is the
// duel's readable core — you can guard against a strike, or press while he draws.
// kind: attack | guard | scheme (draw / heal / setup).

import { CARD_BY_ID } from './cards.js';

const INTENTS = {
  attack: { kind: 'attack', label: 'Silas will strike hard', glyph: '\u25B2', hint: 'Guard up, or strike first.' },
  guard: { kind: 'guard', label: 'Silas will guard', glyph: '\u25CF', hint: 'His shield is coming — play through it or draw.' },
  scheme: { kind: 'scheme', label: 'Silas will scheme', glyph: '\u266A', hint: 'He draws and plots — punish him now.' },
};

// Pick the plan for the coming rival turn from the board, honestly.
export function chooseIntent(game) {
  const rival = game.rival;
  const player = game.player;
  if (rival.applause <= 10) {
    // Hurt and cornered: mostly guard, sometimes scheme for a heal.
    return game.rand() < 0.6 ? INTENTS.guard : INTENTS.scheme;
  }
  if (player.applause <= 8) {
    // The kill is in sight: press the attack.
    return INTENTS.attack;
  }
  const roll = game.rand();
  if (roll < 0.55) return INTENTS.attack;
  if (roll < 0.8) return INTENTS.guard;
  return INTENTS.scheme;
}

function affordable(hand, tempo) {
  return hand.filter((id) => CARD_BY_ID[id].cost <= tempo);
}

// Build the rival's play list for this turn, following the telegraphed kind.
export function chooseRivalPlays(game) {
  const rival = game.rival;
  const intent = game.intent ? game.intent.kind : 'attack';
  let tempo = rival.tempo;
  const hand = [...rival.hand];
  const plays = [];

  const byKind = (kinds) => hand.filter((id) => kinds.includes(CARD_BY_ID[id].kind));
  const takeCheapest = (pool) => {
    const ok = pool.filter((id) => CARD_BY_ID[id].cost <= tempo);
    if (!ok.length) return null;
    ok.sort((a, b) => CARD_BY_ID[a].cost - CARD_BY_ID[b].cost);
    return ok[0];
  };
  const takeStrongest = (pool) => {
    const ok = pool.filter((id) => CARD_BY_ID[id].cost <= tempo);
    if (!ok.length) return null;
    ok.sort((a, b) => CARD_BY_ID[b].value - CARD_BY_ID[a].value);
    return ok[0];
  };
  // Crescendo: a second card of the same suit as the first gains +2, so the
  // rival prefers to follow its own lead with the same suit.
  const takeSameSuit = (pool) => {
    if (!plays.length) return null;
    const suit = CARD_BY_ID[plays[0]].suit;
    const ok = pool.filter((id) => CARD_BY_ID[id].suit === suit && CARD_BY_ID[id].cost <= tempo);
    if (!ok.length) return null;
    ok.sort((a, b) => CARD_BY_ID[b].value - CARD_BY_ID[a].value);
    return ok[0];
  };
  const spend = (id) => {
    if (!id) return;
    plays.push(id);
    tempo -= CARD_BY_ID[id].cost;
    hand.splice(hand.indexOf(id), 1);
  };

  if (intent === 'attack') {
    // Two strikes if the tempo allows, strongest first, then the same suit
    // again for the Crescendo bonus, then a guard if hurt.
    spend(takeStrongest(byKind(['strike'])));
    spend(takeSameSuit(byKind(['strike'])) ?? takeStrongest(byKind(['strike'])));
    if (rival.applause <= 14) spend(takeCheapest(byKind(['guard'])));
  } else if (intent === 'guard') {
    spend(takeStrongest(byKind(['guard'])));
    spend(takeStrongest(byKind(['guard'])));
    spend(takeCheapest(byKind(['strike'])));
  } else {
    // scheme: draw or heal first, then one strike if tempo remains.
    spend(takeCheapest(byKind(['draw', 'heal', 'setup'])));
    spend(takeCheapest(byKind(['draw', 'heal'])));
    spend(takeCheapest(byKind(['strike'])));
  }
  // Whatever the plan, never end the turn with tempo unspent on a free card.
  const free = hand.find((id) => CARD_BY_ID[id].cost === 0);
  if (free) spend(free);
  return plays;
}

// After the rival's turn, telegraph the NEXT turn's plan.
export function nextIntent(game) {
  game.intent = chooseIntent(game);
  return game.intent;
}
