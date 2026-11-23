import { rareEventBudget } from '../arithmetic.mjs';
import { cueStep } from '../construction.mjs';

const q = 1 / 10000;
const firstN = 5000;
const targetN = rareEventBudget(q);
const empty = (n) => Math.exp(n * Math.log1p(-q));

export function drawRareBudget(ctx, scene, state, api) {
  const { C } = api;
  const budget = cueStep(state, 'sp-rare-budget-0', 0, 0.38, 0.7);
  const inspect = cueStep(state, 'sp-rare-budget-1', 1, 0.13, 0.52);
  const extend = cueStep(state, 'sp-rare-budget-2', 2, 0.35, 0.69);
  const n = Math.round(firstN * inspect + (targetN - firstN) * extend);
  api.focus.target('sp-rare-budget-visual', () => {
    const plot = api.teaching.axes({
      x: 245,
      y: 362,
      width: 1010,
      height: 431,
      xDomain: [0, 32000],
      yDomain: [0, 1],
      xTicks: [0, 5000, 15000, 30000],
      yTicks: [0, 0.5, 1],
      xLabel: 'independent requests',
      yLabel: 'chance of zero failures',
    });
    api.text(ctx, 'Failure chance per request    1 / 10,000', 245, 248, 37, C.ink);
    if (budget > 0) {
      const pin = plot.point(firstN, 0);
      api.line(ctx, pin.x, plot.point(0, 1).y, pin.x, pin.y, C.muted, 2);
      api.text(ctx, 'Run budget', 1502, 393, 32, C.muted, 'center');
      api.text(
        ctx,
        (state.beat === 2 ? n : firstN).toLocaleString('en-US'),
        1502,
        471,
        52,
        C.ink,
        'center',
      );
    }
    if (state.beat === 2) {
      api.path(ctx, [plot.point(0, 0.05), plot.point(32000, 0.05)], { color: C.yellow, width: 3 });
      api.text(ctx, '5% chance of missing every failure', 710, 980, 36, C.yellow, 'center');
    }
    if (inspect > 0) {
      const trace = Array.from({ length: 161 }, (_, i) =>
        plot.point((n * i) / 160, empty((n * i) / 160)),
      );
      api.path(ctx, trace, { color: C.cyan, width: 6 });
      const at = trace.at(-1);
      api.circle(ctx, at.x, at.y, 13, C.cyan);
      if (inspect === 1) {
        api.text(ctx, 'Expected failures', 1502, 562, 32, C.muted, 'center');
        api.text(ctx, (n * q).toFixed(2), 1502, 627, 44, C.ink, 'center');
        api.text(ctx, 'Chance of zero', 1502, 715, 32, C.muted, 'center');
        api.text(ctx, (100 * empty(n)).toFixed(1) + '%', 1502, 793, 52, C.cyan, 'center');
      }
    }
    if (state.beat === 1) api.math(ctx, 'P(K=0)=(1-q)^N', 710, 980, 43, C.ink, 'center');
  });
}

export default {
  id: 'rare-budget',
  draw: drawRareBudget,
  cues: ['sp-rare-budget-0', 'sp-rare-budget-1', 'sp-rare-budget-2'],
};
