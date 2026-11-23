import { stableSoftmax } from 'vizmatic';
import { SCORES, VALUES } from '../fixtures.mjs';
import { full, rowClock, words } from '../row-workspace.mjs';

export function drawOperator(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const weights = SCORES.map((s) => Math.exp(s - full.m)),
    probabilities = stableSoftmax(SCORES);
  const terms = probabilities.map((p, i) => p * VALUES[i]);
  const cols = [808, 1200, 1592];
  const row = (target, label, y, entries, col, bars = false) =>
    api.focus.target(target, () => {
      api.text(ctx, label, 136, y, 37, C.muted);
      for (const [i, v] of entries.entries()) {
        api.text(ctx, v, cols[i], y, 43, col, 'center');
        if (bars) {
          const w = 240,
            left = cols[i] - w / 2;
          api.rect(ctx, left, y + 20, w, 16, C.panel, undefined, 0);
          api.rect(ctx, left, y + 20, w * probabilities[i], 16, C.cyan, undefined, 0);
        }
      }
    });
  api.focus.target('dense-pairs', () => {
    for (const [i, x] of cols.entries()) {
      api.text(ctx, words[i], x, 278, 43, C.blue, 'center');
      api.line(ctx, x - 141, 307, x + 141, 307, C.blue, 3);
    }
    const shown = ['key-fix', 'key-this', 'key-test'].filter(clock.started).length;
    row('dense-pairs', 'Scaled score', 390, SCORES.slice(0, shown), C.ink);
    row('dense-pairs', 'Scalar value', 485, VALUES.slice(0, shown), C.ink);
  });
  row(
    'dense-weights',
    'Weight relative to 3',
    590,
    clock.started('dense-weights') ? weights.map((w) => w.toFixed(3)) : [],
    C.blue,
  );
  row(
    'dense-shares',
    'Share of total weight',
    687,
    clock.started('dense-shares') ? probabilities.map((p) => (100 * p).toFixed(1) + '%') : [],
    C.cyan,
    clock.started('dense-shares'),
  );
  row(
    'dense-terms',
    'Share × value',
    827,
    clock.started('dense-terms') ? terms.map((v) => v.toFixed(3)) : [],
    C.yellow,
  );
  api.focus.target('dense-output', () =>
    api.text(
      ctx,
      clock.done('dense-output')
        ? 'Full-row output  ≈  ' + (full.u / full.l).toFixed(3)
        : 'Full-row output  =  ?',
      960,
      975,
      52,
      C.ink,
      'center',
    ),
  );
}

export default {
  id: 'operator',
  draw: drawOperator,
  cues: [
    'dense-input',
    'key-fix',
    'key-this',
    'key-test',
    'dense-weights',
    'dense-shares',
    'dense-terms',
    'dense-output',
  ],
};
