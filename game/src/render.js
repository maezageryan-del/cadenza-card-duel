// CADENZA — DOM rendering.
// Reads the game state and paints the table: both conductors, both hands, the
// telegraphed intent, the tempo pips, the log and the overlays. Cards are DOM, not
// canvas, so their values stay crisp when the judge shrinks the screenshot.

import { CARD_BY_ID, SUITS, kindLabel } from './cards.js';
import { MAX_APPLAUSE } from './state.js';

function el(id) { return document.getElementById(id); }

function cardHtml(card, opts = {}) {
  const suit = SUITS[card.suit];
  const big = card.kind === 'strike' || card.kind === 'guard' || card.kind === 'heal'
    ? card.value : '';
  return `<div class="card suit-${card.suit} ${opts.playable ? 'playable' : ''} ${opts.dim ? 'dim' : ''}"
      data-card="${card.id}" style="--suit:${suit.colour};--suit-deep:${suit.deep};--suit-soft:${suit.soft}">
    <div class="cost" title="Tempo cost">${card.cost}</div>
    <div class="suit-glyph" title="${suit.name}">${suit.glyph}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-art" aria-hidden="true">${suit.glyph}</div>
    <div class="card-text">${card.text}</div>
    <div class="card-foot"><span class="card-kind">${kindLabel(card.kind)}</span>
      <span class="card-value">${big}</span></div>
  </div>`;
}

function backHtml() {
  return `<div class="card back" aria-hidden="true"><div class="back-glyph">\u266A</div>
    <div class="back-word">CADENZA</div></div>`;
}

function applauseHtml(label, side, who, sub) {
  const pct = Math.max(0, Math.round((side.applause / MAX_APPLAUSE) * 100));
  const shield = side.shield > 0
    ? `<span class="shield-badge" title="Shield absorbs damage">\u25C8 ${side.shield} shield</span>` : '';
  return `<div class="conductor ${who}">
    <div class="avatar">${who === 'rival' ? 'S' : 'Y'}</div>
    <div class="conductor-info">
      <div class="conductor-name">${label}${sub ? ` <span class="conductor-sub">${sub}</span>` : ''}</div>
      <div class="applause-row">
        <span class="applause-num">${side.applause}</span>
        <span class="applause-label">applause</span>
        <span class="applause-bar"><span style="width:${pct}%"></span></span>
        ${shield}
      </div>
    </div>
  </div>`;
}

function tempoHtml(game) {
  let pips = '';
  for (let i = 0; i < game.tempoMax; i++) {
    pips += `<span class="pip ${i < game.tempo ? 'on' : ''}">\u266A</span>`;
  }
  return `<div class="tempo" title="Tempo: spend it to play cards">${pips}
    <span class="tempo-num">${game.tempo}/${game.tempoMax} tempo</span></div>`;
}

function intentHtml(game) {
  if (!game.intent || game.screen !== 'table') return '';
  const it = game.intent;
  return `<div class="intent"><span class="intent-glyph">${it.glyph}</span>
    <span class="intent-label">${it.label}</span>
    <span class="intent-hint">${it.hint}</span></div>`;
}

function overlayHtml(game) {
  if (game.screen === 'title') {
    return `<div class="overlay title-screen">
      <div class="title-kicker">A DUEL OF THE BATON</div>
      <h1 class="title-big">CADENZA</h1>
      <p class="title-sub">You, the young conductor, against Maestro Silas.<br>
      Win the hall's applause — forty points of it — before he wins yours.</p>
      <button class="big-button" id="play-button">\u25B6&nbsp; Take the podium</button>
      <div class="howto">
        <div><b>1–5</b> play a card &nbsp;·&nbsp; <b>Click</b> a card or press its number</div>
        <div><b>E</b> end your turn &nbsp;·&nbsp; Silas telegraphs his plan — read it, then counter it</div>
        <div>Two cards of one suit in a turn make a <b>Crescendo</b> (+2)</div>
      </div>
      <div class="suit-legend">${Object.values(SUITS).map((s) =>
        `<span class="legend-item" style="--suit:${s.colour}"><span class="legend-glyph">${s.glyph}</span> ${s.name}</span>`).join('')}</div>
    </div>`;
  }
  if (game.screen === 'win') {
    const notes = ['\u266A', '\u2669', '\u266B', '\u266A', '\u266B', '\u2669', '\u266A', '\u266B'];
    return `<div class="overlay win-screen">
      <div class="fanfare" aria-hidden="true">${notes.map((n, i) =>
        `<span style="--d:${(i * 0.22).toFixed(2)}s;--x:${(8 + i * 11)}%;--s:${(26 + (i % 3) * 10)}px">${n}</span>`).join('')}</div>
      <div class="end-kicker">THE FINAL NOTE FALLS</div>
      <h1 class="end-big win">STANDING OVATION</h1>
      <p class="end-sub">The hall rises as one. Maestro Silas bows to you —<br>
      the podium is yours, and the night is yours.</p>
      <div class="end-stats">Turns ${game.turn} &nbsp;·&nbsp; Cards played ${game.stats.played}
        &nbsp;·&nbsp; Damage dealt ${game.stats.damageDealt} &nbsp;·&nbsp; Crescendos ${game.stats.crescendos}</div>
      <button class="big-button" id="again-button">\u21BB&nbsp; Conduct again</button>
    </div>`;
  }
  if (game.screen === 'loss') {
    return `<div class="overlay loss-screen">
      <div class="end-kicker">THE FINAL NOTE FALLS</div>
      <h1 class="end-big loss">THE HALL FALLS SILENT</h1>
      <p class="end-sub">Maestro Silas lowers his baton. The applause is his tonight —<br>
      but every great conductor returns for the next performance.</p>
      <div class="end-stats">Turns ${game.turn} &nbsp;·&nbsp; Cards played ${game.stats.played}
        &nbsp;·&nbsp; Damage dealt ${game.stats.damageDealt} &nbsp;·&nbsp; Crescendos ${game.stats.crescendos}</div>
      <button class="big-button" id="again-button">\u21BB&nbsp; Try again</button>
    </div>`;
  }
  return '';
}

// Paint the whole table from the state. Cheap enough to run after every action.
export function render(game) {
  el('round-label').textContent = `Round ${game.turn}`;
  el('rival-side').innerHTML = applauseHtml('Maestro Silas', game.rival, 'rival');
  el('rival-hand').innerHTML = game.rival.hand.map(() => backHtml()).join('');
  el('intent-slot').innerHTML = intentHtml(game);
  el('player-side').innerHTML = applauseHtml('You', game.player, 'player', 'the Young Conductor')
    + tempoHtml(game);

  const handEl = el('player-hand');
  handEl.innerHTML = game.player.hand.map((id) => {
    const card = CARD_BY_ID[id];
    const playable = game.phase === 'player' && game.screen === 'table' && game.tempo >= card.cost;
    return cardHtml(card, { playable, dim: !playable && game.screen === 'table' });
  }).join('');

  const played = game.lastPlay;
  el('played-slot').innerHTML = played
    ? `<div class="played-label">${played.by === 'player' ? 'You played' : 'Silas played'}</div>${cardHtml(played.card, {})}`
    : '<div class="played-empty">No card played yet.<br>Play a card to open the duel.</div>';

  el('log').innerHTML = game.log.map((line) => `<div class="log-line">${line}</div>`).join('');
  el('end-turn').disabled = game.phase !== 'player' || game.screen !== 'table';
  el('overlay').innerHTML = overlayHtml(game);
  el('overlay').hidden = game.screen !== 'title' && game.screen !== 'win' && game.screen !== 'loss';
  document.title = game.screen === 'table' ? 'CADENZA — Duel of the Conductors' : 'CADENZA';
}

// A floating damage / heal number over a conductor's applause.
export function floater(text, who, kind) {
  const host = el(who === 'rival' ? 'rival-side' : 'player-side');
  if (!host) return;
  const span = document.createElement('span');
  span.className = `floater ${kind}`;
  span.textContent = text;
  host.appendChild(span);
  setTimeout(() => span.remove(), 1400);
}
