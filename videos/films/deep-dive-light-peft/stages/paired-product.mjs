import { beatCue, rankFixture } from '../model.mjs';
import { clamp01, multiply } from '../arithmetic.mjs';
import { RANK_SELECTION } from '../construction.mjs';

const correct = rankFixture(RANK_SELECTION.kept);
const other = rankFixture(correct.kept, [0, 2]);
const masked = multiply(
  correct.B,
  correct.activation.map((v, i) => (correct.kept.includes(i) ? v : 0)),
);
const vector = (values) => '[' + values.join(', ').replaceAll('-', '−') + ']';

export function drawPairedProduct(ctx, scene, state, api) {
  const { C } = api;
  const activate = beatCue(state, 0, 'lp-rank-activation', 0.06, 0.31);
  const mask = beatCue(state, 0, 'lp-pair-mask', 0.38, 0.52);
  const reference = beatCue(state, 0, 'lp-pair-sum', 0.74, 0.96);
  const compact = beatCue(state, 1, 'lp-pair-cut', 0.02, 0.3);
  const swap = beatCue(state, 1, 'lp-pair-swap', 0.52, 0.73);
  const wrongTerms = beatCue(state, 2, 'lp-wrong-terms', 0.04, 0.47);
  const wrongResult = beatCue(state, 2, 'lp-wrong-pair', 0.53, 0.86);
  const repair = beatCue(state, 3, 'lp-pair-restore', 0.03, 0.36);
  const confirmed = beatCue(state, 3, 'lp-pair-confirm', 0.42, 0.65);
  const beat = state.beat ?? 0;
  const text = (s, x, y, size, c = C.ink) => api.text(ctx, s, x, y, size, c, 'center');
  const candidate = swap > 0 && repair === 0 ? other : correct;

  text('x = ' + vector(correct.input), 335, 245, 36, C.yellow);
  text('Stored weights  ·  unscaled product', 1325, 245, 32, C.muted);
  const centers = [193, 465, 790, 1135, 1570];
  ['Rank', 'Row of A', 'Activation', 'Column of B', 'Contribution'].forEach((label, i) =>
    text(label, centers[i], 341, 34, C.muted),
  );

  correct.A.forEach((row, i) => {
    const slot = correct.kept.indexOf(i),
      retained = slot >= 0;
    const alpha = retained ? 1 : (1 - clamp01(compact * 2)) * (1 - 0.56 * mask);
    if (alpha <= 0) return;
    const y = 425 + 90 * (retained ? api.lerp(i, slot, clamp01(2 * compact - 1)) : i);
    const moved = (slot + 0.5) / correct.kept.length;
    const dataColumn = retained && swap >= moved && repair < moved ? other.columns[slot] : i;
    const column = correct.B.map((b) => b[dataColumn]);
    const ready = activate >= (i + 1) / correct.A.length;
    const h = !retained && mask === 1 ? 0 : correct.activation[i];
    const terms = column.map((value) => value * h);
    const showTerms = mask === 1 && (swap === 0 || wrongTerms === 1 || repair > 0);
    api.components.fade(alpha, () => {
      api.focus.target('pair-rows', () => {
        text('r' + (i + 1), centers[0], y, 46, retained && mask > 0 ? C.cyan : C.ink);
        text(vector(row), centers[1], y, 43);
        text(ready ? String(h) : '·', centers[2], y, 46, C.yellow);
      });
      api.focus.target('pair-columns', () => {
        text('r' + (dataColumn + 1) + '   ' + vector(column), centers[3], y, 43, C.blue);
        text(showTerms ? vector(terms) : '·', centers[4], y, 43, C.cyan);
      });
    });
  });
  api.line(ctx, 125, 762, 1795, 762, C.muted, 2);
  api.focus.target('pair-reference', () => {
    text('Masked full-width reference', 473, 829, 33, C.muted);
    text(reference === 1 ? vector(masked) : 'B × masked activations', 473, 911, 52, C.ink);
  });
  api.focus.target('pair-check', () => {
    const result = (wrongResult === 1 && repair === 0) || confirmed === 1;
    const equal = candidate.output.every((v, i) => v === masked[i]);
    if (beat > 0) {
      text('Two-column candidate', 1390, 829, 33, C.muted);
      text(
        result ? vector(candidate.output) : '[?, ?]',
        1390,
        911,
        52,
        result ? (equal ? C.green : C.pink) : C.ink,
      );
      text(
        result ? 'sliced == masked    ' + (equal ? 'True' : 'False') : 'sliced == masked    ?',
        1390,
        990,
        32,
        result ? (equal ? C.green : C.pink) : C.yellow,
      );
    } else {
      text('Survivors  r2, r4', 1390, 911, 42, C.cyan);
    }
  });
}
export default {
  id: 'paired-product',
  draw: drawPairedProduct,
  cues: [
    'lp-rank-activation',
    'lp-pair-mask',
    'lp-pair-sum',
    'lp-pair-cut',
    'lp-pair-swap',
    'lp-wrong-terms',
    'lp-wrong-pair',
    'lp-pair-restore',
    'lp-pair-confirm',
  ],
};
