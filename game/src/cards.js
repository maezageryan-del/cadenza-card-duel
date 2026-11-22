// CADENZA — card catalogue.
// Four suits, one per instrument family. Every suit is told apart by colour AND
// by shape (its glyph), never by text alone, so a card stays readable at thumbnail
// size. Every card has a Tempo cost and one clear job: strike, guard, draw, heal
// or set up the next card. Names are original; nothing here copies a commercial game.

export const SUITS = {
  STR: { key: 'STR', name: 'Strings', glyph: '\u266A', colour: '#9b8cff', deep: '#5b4fd8', soft: '#241f4d' },
  WND: { key: 'WND', name: 'Winds', glyph: '\u224B', colour: '#3ecfc0', deep: '#0f8a7e', soft: '#0e2f2b' },
  BRS: { key: 'BRS', name: 'Brass', glyph: '\u25B2', colour: '#f5b942', deep: '#a86f00', soft: '#3d2c05' },
  PRC: { key: 'PRC', name: 'Percussion', glyph: '\u25CF', colour: '#f0566a', deep: '#a11e33', soft: '#3d0f17' },
};

// kind: strike (damage), guard (shield), draw, heal, setup (buffs the next card),
// weaken (softens the rival's next strike).
// value: damage / shield / cards drawn / applause healed / buff amount.
export const CARDS = [
  { id: 'staccato', name: 'Staccato Pluck', suit: 'STR', cost: 1, kind: 'strike', value: 3, text: 'Deal 3 damage.' },
  { id: 'bow-sweep', name: 'Bow Sweep', suit: 'STR', cost: 2, kind: 'strike', value: 5, text: 'Deal 5 damage.' },
  { id: 'violin-flourish', name: 'Violin Flourish', suit: 'STR', cost: 3, kind: 'strike', value: 8, text: 'Deal 8 damage.' },
  { id: 'zephyr', name: 'Zephyr Note', suit: 'WND', cost: 1, kind: 'strike', value: 3, text: 'Deal 3 damage.' },
  { id: 'flute-run', name: 'Flute Run', suit: 'WND', cost: 2, kind: 'strike', value: 5, text: 'Deal 5 damage.' },
  { id: 'gale-chord', name: 'Gale Chord', suit: 'WND', cost: 3, kind: 'strike', value: 7, text: 'Deal 7 damage.' },
  { id: 'trumpet-blast', name: 'Trumpet Blast', suit: 'BRS', cost: 2, kind: 'strike', value: 6, text: 'Deal 6 damage.' },
  { id: 'fanfare', name: 'Fanfare', suit: 'BRS', cost: 3, kind: 'strike', value: 8, text: 'Deal 8 damage.' },
  { id: 'drum-roll', name: 'Drum Roll', suit: 'PRC', cost: 1, kind: 'strike', value: 4, text: 'Deal 4 damage.' },
  { id: 'thunder-beat', name: 'Thunder Beat', suit: 'PRC', cost: 3, kind: 'strike', value: 9, text: 'Deal 9 damage.' },
  { id: 'muted-strings', name: 'Muted Strings', suit: 'STR', cost: 1, kind: 'guard', value: 4, text: 'Gain 4 shield.' },
  { id: 'soft-breeze', name: 'Soft Breeze', suit: 'WND', cost: 2, kind: 'guard', value: 6, text: 'Gain 6 shield.' },
  { id: 'brass-wall', name: 'Brass Wall', suit: 'BRS', cost: 2, kind: 'guard', value: 7, text: 'Gain 7 shield.' },
  { id: 'deep-drum', name: 'Deep Drum', suit: 'PRC', cost: 1, kind: 'guard', value: 5, text: 'Gain 5 shield.' },
  { id: 'repeat-sign', name: 'Repeat Sign', suit: 'STR', cost: 2, kind: 'draw', value: 2, text: 'Draw 2 cards.' },
  { id: 'echo', name: 'Echo', suit: 'WND', cost: 1, kind: 'draw', value: 2, text: 'Draw 2 cards.' },
  { id: 'encore-call', name: 'Encore Call', suit: 'BRS', cost: 2, kind: 'draw', value: 2, text: 'Draw 2 cards.' },
  { id: 'warm-applause', name: 'Warm Applause', suit: 'PRC', cost: 2, kind: 'heal', value: 5, text: 'Restore 5 applause.' },
  { id: 'lullaby', name: 'Lullaby', suit: 'STR', cost: 2, kind: 'heal', value: 4, text: 'Restore 4 applause.' },
  { id: 'serenade', name: 'Serenade', suit: 'WND', cost: 3, kind: 'heal', value: 7, text: 'Restore 7 applause.' },
  { id: 'crescendo', name: 'Crescendo', suit: 'STR', cost: 2, kind: 'setup', value: 3, text: 'Your next card this turn gains +3.' },
  { id: 'diminuendo', name: 'Diminuendo', suit: 'WND', cost: 2, kind: 'weaken', value: 3, text: 'The rival\u2019s next strike deals 3 less.' },
  { id: 'grand-finale', name: 'Grand Finale', suit: 'BRS', cost: 4, kind: 'strike', value: 12, text: 'Deal 12 damage.' },
  { id: 'overture', name: 'Overture', suit: 'PRC', cost: 0, kind: 'draw', value: 1, text: 'Draw 1 card. Gain 1 tempo.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// A 30-card deck: the full catalogue plus a second copy of six workhorse cards.
export function buildDeck() {
  const extra = ['staccato', 'zephyr', 'drum-roll', 'muted-strings', 'repeat-sign', 'warm-applause'];
  return [...CARDS.map((c) => c.id), ...extra];
}

export function shuffle(deck, rand) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Crescendo rule: two cards of the same suit played in one turn make the second
// one stronger. Returns the bonus the card now being played earns.
export function crescendoBonus(playedThisTurn, card) {
  if (!playedThisTurn.length) return 0;
  const same = playedThisTurn.filter((p) => p.suit === card.suit).length;
  return same >= 1 ? 2 : 0;
}

export function kindLabel(kind) {
  return { strike: 'Strike', guard: 'Guard', draw: 'Draw', heal: 'Heal', setup: 'Setup', weaken: 'Weaken' }[kind] ?? kind;
}
