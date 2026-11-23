import { SAMPLING_COUNTS } from '../../../films/speculative-decoding/fixtures.mjs';
import { decomposition, sampleProposal } from '../../../films/speculative-decoding/arithmetic.mjs';
import { C, arrow, cue, fmt, line, note, page, pct, rect, text } from './press.mjs';

const tokens = ['noon', 'dawn', 'dusk'];
const empty = [0.4, 0.5, 0.1],
  after = [
    [0.1, 0.6, 0.3],
    [0.6, 0.2, 0.2],
    [0.3, 0.2, 0.5],
  ],
  q = [0.6, 0.3, 0.1];
function run(uniforms, finish) {
  const draft = [0.05, 0.05].map((u) => sampleProposal(q, u));
  let prior = empty;
  for (const [i, t] of draft.entries()) {
    const d = decomposition(prior, q);
    if (uniforms[i] >= d.acceptance[t])
      return [...draft.slice(0, i), sampleProposal(d.residual, finish)].map((k) => tokens[k]);
    prior = after[t];
  }
  return [...draft, sampleProposal(prior, finish)].map((k) => tokens[k]);
}
export const runs = [run([0.9], 0.1), run([0.1, 0.9], 0.95), run([0.1, 0.1], 0.2)];
export const pairs = SAMPLING_COUNTS.map((n, i) => ({
  first: Math.floor(i / 3),
  second: i % 3,
  n,
  observed: n / 60000,
  target: empty[Math.floor(i / 3)] * after[Math.floor(i / 3)][i % 3],
}));
export function tableRound(g, c) {
  const b = c.beat.beatIndex;
  if (b < 2) {
    page(g, 'FIXED PROBABILITIES  /  draft “noon noon”', 'Which row owns the correction?');
    const cols = [532, 846, 1170];
    tokens.forEach((w, i) => text(g, w, cols[i], 332, 46, C.ink, 'Serif', 'center'));
    const said = (phrase) => b === 1 && c.elapsed + 1e-9 >= c.wordCue(phrase).end;
    const first = cue(c, 1, 'Use the empty-prefix row', 0.65);
    const second = cue(c, 1, 'Now the row after noon', 0.65);
    const bonus = cue(c, 1, 'With both noons accepted');
    const route = bonus ? 0 : second || first;
    const active = second ? 1 : 0;
    const activeY = 414 + 100 * active;
    if (route) rect(g, 99, activeY - 57, 1240 * route, 82, C.white, C.keep);
    const showDeficits = second
      ? said('has deficits on dawn and dusk')
      : said('Only dawn has a deficit');
    [empty, after[0], q].forEach((row, j) => {
      const y = 414 + 100 * j;
      text(
        g,
        ['p   empty', 'p   after noon', 'q   both rows'][j],
        114,
        y,
        39,
        j === 2 ? C.draft : C.ink,
      );
      row.forEach((v, i) => {
        rect(g, cols[i] - 98, y - 37, v * 255, 39, j === 2 ? C.violet : C.green);
        text(g, fmt(v), cols[i] + 126, y, 38, C.ink, 'Mono', 'right');
      });
    });
    const receipts = ['emits dawn', 'selects dusk', 'gives dawn'];
    for (const [i, shown] of [first, second, bonus].entries()) {
      const done = said(receipts[i]);
      if (!shown) continue;
      const y = 370 + 146 * i;
      text(g, ['Reject at 1', 'Reject at 2', 'All pass'][i], 1410, y, 33, C.quiet);
      if (done) text(g, runs[i].join('  '), 1410, y + 58, 43, C.keep, 'Serif');
    }
    if (route === 1) line(g, 1339, activeY - 14, 1398, activeY - 14, C.keep, 4);
    if (route && showDeficits) {
      const row = active ? after[0] : empty;
      text(g, 'Deficit max(p − q, 0)', 114, 759, 33, C.quiet);
      row.forEach((probability, i) => {
        const deficit = Math.max(0, probability - q[i]);
        rect(g, cols[i] - 98, 722, deficit * 255, 39, C.gold);
        text(g, fmt(deficit), cols[i] + 126, 759, 38, C.repair, 'Mono', 'right');
      });
    }
    text(g, 'Each target row scores the next word for its own prefix.', 114, 845, 37, C.quiet);
    return;
  }
  if (b === 3 && cue(c, 3, 'compare serial and verification logits')) {
    page(g, 'LOGIT CHECK  /  compare before sampling', 'Did both passes score the same history?');
    text(g, 'Serial pass', 160, 377, 49, C.ink, 'Serif');
    text(g, 'Verify pass', 160, 603, 49, C.ink, 'Serif');
    for (const y of [350, 577]) {
      text(g, 'The bird sang', 538, y + 36, 57, C.ink, 'Serif');
      arrow(g, 917, y + 12, 1114, y + 12, C.keep);
      text(g, 'scores for next token', 1164, y + 33, 48, C.keep, 'Serif');
    }
    note(g, 'Match tokens, positions, mask and cache. Compare logits within a stated tolerance.');
    return;
  }
  page(g, 'ORDERED PAIRS  /  60,000 source trials', 'Do both words follow the target?');
  const observed = cue(c, 2, 'fixed-seed run observed');
  const complete = cue(c, 2, 'other eight');
  const xs = [658, 1086, 1514],
    ys = [435, 581, 727];
  tokens.forEach((w, i) => {
    text(g, w, xs[i], 319, 45, C.ink, 'Serif', 'center');
    text(g, 'First   ' + w, 117, ys[i], 41, C.ink, 'Serif');
  });
  pairs.forEach(({ first, second, target, observed: rate }) => {
    const xc = xs[second],
      y = ys[first];
    const current = first === 0 && second === 1;
    if (!complete && !current) return;
    const x = xc - 140;
    rect(g, x, y - 35, target * 480, 28, C.keep);
    text(g, pct(target, 1), x + 290, y - 7, 33, C.keep, 'Mono', 'right');
    if (observed) {
      rect(g, x, y + 8, rate * 480, 28, C.pencil);
      text(g, pct(rate, 1), x + 290, y + 35, 33, C.draft, 'Mono', 'right');
    }
  });
  note(
    g,
    complete
      ? 'Target in green     •     observed in violet     •     largest absolute error ' +
          fmt(Math.max(...pairs.map((v) => Math.abs(v.target - v.observed))), 4)
      : 'P(noon, dawn) = P(noon) × P(dawn | noon)',
  );
}
