import { fmt, mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeScalarGate } from '../model.mjs';
import { arrow, footer, mechanismLine, mechanismText, proportionStrip, tag } from '../defaults.mjs';
export function drawGateGradient(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-gate-gradient-mechanism', () => {
    const normalized = currentBeat === 2,
      z0 = Math.log(3),
      start = 180,
      end = 1050,
      yy = (v) => 820 - v * 800,
      xx = (z) => start + ((z + 1) / 4) * (end - start);
    mechanismText(
      ctx,
      api,
      'Same selected expert E(x)=2 · target=1 · p=0.75',
      960,
      290,
      34,
      themeColors.yellow,
    );
    mechanismLine(ctx, api, start, 820, end, 820);
    mechanismLine(ctx, api, start, 820, start, 365);
    const pts = Array.from(
      {
        length: 91,
      },
      (_, i) => {
        const z = -1 + (i * 4) / 90;
        return {
          x: xx(z),
          y: yy(moeScalarGate(1 / (1 + Math.exp(-z)), normalized).loss),
        };
      },
    );
    api.path(ctx, pts, {
      color: normalized ? themeColors.pink : themeColors.blue,
      width: 4,
    });
    mechanismText(
      ctx,
      api,
      'selected logit (other logit fixed at 0)',
      610,
      905,
      29,
      themeColors.muted,
    );
    mechanismText(ctx, api, '½(y−1)²', 245, 345, 30, themeColors.muted);
    const f = moeScalarGate(0.75, normalized),
      show = normalized ? resultComplete('normalized-output') : resultComplete('retained-loss');
    if (show) {
      api.circle(ctx, xx(z0), yy(f.loss), 12, normalized ? themeColors.pink : themeColors.blue);
      tag(
        ctx,
        api,
        'y = ' + fmt(f.output) + '   loss = ' + fmt(f.loss),
        1430,
        505,
        600,
        normalized ? themeColors.pink : themeColors.blue,
      );
    }
    if (resultComplete('retained-output') && !normalized) {
      proportionStrip(ctx, api, cols, [0.75, 0.25], 1230, 360, 400, [
        themeColors.blue,
        themeColors.panel,
      ]);
      mechanismText(ctx, api, '0.75 × 2 = 1.5', 1430, 650, 34, themeColors.blue);
    }
    if (resultComplete('retained-gradient') && !normalized) {
      const slope = f.gradient,
        dx = 0.6;
      arrow(
        ctx,
        api,
        xx(z0 - dx),
        yy(f.loss - slope * dx),
        xx(z0 + dx),
        yy(f.loss + slope * dx),
        themeColors.yellow,
        5,
      );
      mechanismText(ctx, api, 'local derivative = 3/16', 1430, 785, 36, themeColors.yellow);
    }
    if (normalized && resultComplete('normalized-flat')) {
      arrow(ctx, api, xx(0.6), yy(0.5), xx(1.6), yy(0.5), themeColors.yellow);
      mechanismText(ctx, api, 'local gate derivative = 0', 1430, 785, 34, themeColors.yellow);
    }
    if (currentBeat === 0)
      mechanismText(
        ctx,
        api,
        'Keep p, or normalize the sole gate to 1?',
        960,
        960,
        35,
        themeColors.yellow,
      );
    footer(ctx, api, 'Local scalar toy; expert identity is fixed away from a selection boundary.');
  });
}
export default {
  id: 'gate-gradient',
  draw: drawGateGradient,
  cues: [
    'mo-gate-gradient-op-0',
    'mo-gate-gradient-op-1',
    'mo-retained-output',
    'mo-retained-loss',
    'mo-retained-gradient',
    'mo-gate-gradient-op-2',
    'mo-normalized-output',
    'mo-normalized-flat',
  ],
};
