import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { arrow, mechanismLine, mechanismText, rectangle } from '../defaults.mjs';
export function drawResidencyBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cueProgress = (i) => moeCue(state, 'residency-budget-op-' + i, 'progress'),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-residency-budget-mechanism', () => {
    mechanismText(
      ctx,
      api,
      'One stored pool; one-token active work',
      960,
      285,
      35,
      themeColors.yellow,
    );
    const total = 38,
      budget = 14,
      x = 220,
      u = 39;
    rectangle(ctx, api, x, 400, total * u, 115, themeColors.panel, themeColors.blue);
    rectangle(ctx, api, x, 400, 6 * u, 115, themeColors.cyan);
    for (let i = 0; i < 8; i++)
      rectangle(
        ctx,
        api,
        x + (6 + i * 4) * u,
        400,
        4 * u,
        115,
        i === 0 ? themeColors.blue : i === 2 ? themeColors.yellow : themeColors.panel,
        themeColors.muted,
      );
    mechanismText(
      ctx,
      api,
      '3B shared + 8 × 2B experts; two-byte weights',
      960,
      355,
      32,
      themeColors.blue,
    );
    if (resultComplete('residency-pool'))
      mechanismText(ctx, api, 'Complete pool: 38 decimal GB', 960, 580, 38, themeColors.cyan);
    if (resultComplete('residency-gap')) {
      mechanismLine(ctx, api, x + budget * u, 640, x + budget * u, 850, themeColors.pink, 5);
      rectangle(ctx, api, x, 690, budget * u, 70, themeColors.blue);
      mechanismText(
        ctx,
        api,
        '14 GB device budget',
        x + (budget * u) / 2,
        825,
        31,
        themeColors.blue,
      );
      mechanismText(
        ctx,
        api,
        '24 GB shortfall before KV/workspace',
        1250,
        825,
        34,
        themeColors.pink,
      );
    }
    if (currentBeat === 1) {
      const move = cueProgress(1);
      for (let i = 0; i < 4; i++)
        rectangle(ctx, api, 280 + i * 420, 880 + 30 * move, 250, 20, themeColors.panel, cols[i]);
      mechanismText(
        ctx,
        api,
        'Resident shards · quantized formats · fetched weights',
        960,
        960,
        31,
        themeColors.yellow,
      );
    }
    if (currentBeat === 2) {
      const t = cueProgress(2);
      arrow(ctx, api, 380, 910, 380 + 900 * t, 910, themeColors.pink);
      mechanismText(
        ctx,
        api,
        'Task gradient 0 can coexist with momentum / weight decay',
        960,
        960,
        31,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'residency-budget',
  draw: drawResidencyBudget,
  cues: [
    'mo-residency-budget-op-0',
    'mo-residency-pool',
    'mo-residency-gap',
    'mo-residency-budget-op-1',
    'mo-residency-budget-op-2',
  ],
};
