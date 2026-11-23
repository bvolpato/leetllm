import { mean, predict } from '../arithmetic.mjs';
import { rows } from '../fixtures.mjs';
import { fittedStump } from '../model.mjs';
import { drawConstructionText as label } from '../defaults.mjs';

export function drawImportanceExplanation(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  if (beat < 2) {
    const shuffled =
      beat === 1 && api.focus.progress('shuffle-features', api.phase(p, 0.15, 0.35)) > 0;
    label(ctx, api, 'Split credit on 40 training rows', 750, 350, 36);
    if (shuffled) label(ctx, api, 'F1 drop on 2,000 held-out rows', 1480, 350, 36);
    [
      ['Continuous noise', 0.92, 0.003],
      ['Binary predictor', 0.08, 0.097],
    ].forEach(([name, mdi, drop], i) => {
      const y = 525 + i * 202;
      label(ctx, api, name, 110, y + 18, 36, C.ink, 'left');
      api.rect(ctx, 526, y - 25, 430 * mdi, 46, C.pink, undefined, 3);
      label(ctx, api, mdi.toFixed(3), 1110, y + 16, 38, C.pink, 'right');
      api.focus.target('held-out-drops', () => {
        if (shuffled) {
          api.rect(ctx, 1225, y - 25, (404 * drop) / 0.1, 46, C.cyan, undefined, 3);
          label(ctx, api, drop.toFixed(3), 1810, y + 16, 38, C.cyan, 'right');
        } else if (beat === 1) label(ctx, api, '?', 1460, y + 18, 38, C.muted);
      });
    });
    label(
      ctx,
      api,
      shuffled
        ? 'Same forest and held-out labels     ·     Shuffle SD in F1: 0.007 for each feature'
        : 'Each split gets credit in proportion to the training rows it reaches.',
      960,
      948,
      34,
      C.muted,
    );
    return;
  }
  const base = mean(rows.map((r) => predict(fittedStump, r)));
  const conditional = mean(rows.map((r) => predict(fittedStump, [rows[2][0], r[1]])));
  const amount = api.focus.progress('shap-contribution', api.phase(p, 0.35, 0.57));
  const v = api.lerp(base, conditional, amount);
  const x = (n) => 305 + n * 1320;
  const y = 559;
  label(ctx, api, 'R3   ·   ambiguity 2.0   ·   policy support 3', 960, 310, 42);
  api.line(ctx, x(0), y, x(1), y, C.muted, 4);
  [0, 0.2, 0.5, 1].forEach((n) => {
    api.line(ctx, x(n), y - 12, x(n), y + 19, C.muted, 3);
    label(ctx, api, n.toFixed(2), x(n), y + 73, 36, C.muted);
  });
  label(ctx, api, 'Review score', 960, y + 150, 38);
  api.focus.target('shap-values', () => {
    api.circle(ctx, x(base), y, 20, C.panel, C.cyan, 3);
    api.line(ctx, x(v), y, x(base), y, C.cyan, 7);
    api.circle(ctx, x(v), y, 23, C.cyan);
    label(
      ctx,
      api,
      amount === 0 ? 'Training background' : 'Fix R3’s ambiguity',
      x(v),
      y - 80,
      35,
      C.cyan,
    );
    label(
      ctx,
      api,
      'Background  ' +
        base.toFixed(2) +
        '     −     Ambiguity  ' +
        (base - v).toFixed(2) +
        '     +     Support  0.00     =     ' +
        v.toFixed(2),
      960,
      835,
      39,
    );
  });
  label(ctx, api, 'Actual label: needed review', 960, 985, 38, C.pink);
}
export default {
  id: 'importance-explanation',
  draw: drawImportanceExplanation,
  cues: ['shuffle-features', 'shap-contribution'],
};
