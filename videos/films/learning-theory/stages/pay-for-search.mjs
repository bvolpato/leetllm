import { cueEnded, cueProgress, focusOn, text } from '../defaults.mjs';
import { riskCheck, drawRiskRuler } from '../risk-ruler.mjs';
import { delta } from '../fixtures.mjs';

export function drawPayForSearch(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 3) {
    focusOn(api, 'repeat-batches', () => {
      const batches = ['AA', 'AB', 'BA', 'BB'];
      const count = Math.ceil(batches.length * cueProgress(state, 'repeat-search'));
      text(
        ctx,
        api,
        'Toy queue   ·   A and B are equally likely on each independent draw',
        960,
        264,
        38,
        C.ink,
        'center',
      );
      const xs = [350, 800, 1230, 1620];
      for (const [i, label] of [
        'Ticket pair',
        'Always route A',
        'Always route B',
        'Fewer errors',
      ].entries())
        text(ctx, api, label, xs[i], 363, 36, C.muted, 'center');
      let sum = 0;
      for (const [i, pair] of batches.entries()) {
        const y = 435 + i * 104;
        const errorsA = [...pair].filter((type) => type === 'B').length;
        const errorsB = pair.length - errorsA;
        const minimum = Math.min(errorsA, errorsB);
        sum += minimum / pair.length;
        [...pair].forEach((type, j) => {
          const x = xs[0] - 45 + j * 90;
          api.circle(ctx, x, y, 31, type === 'A' ? C.blue : C.cyan);
          text(ctx, api, type, x, y + 12, 36, C.bg, 'center');
        });
        for (const [j, errors] of [errorsA, errorsB].entries()) {
          const selected = i < count && errors === minimum;
          text(
            ctx,
            api,
            errors + ' / 2',
            xs[j + 1],
            y + 13,
            43,
            selected ? C.yellow : C.ink,
            'center',
          );
        }
        if (i < count) text(ctx, api, 50 * minimum + '%', xs[3], y + 13, 45, C.yellow, 'center');
      }
      const mean = (100 * sum) / batches.length;
      const result = cueEnded(state, 'winning-mean')
        ? 'Mean winning sample error   ' + mean + '%'
        : 'Choose the lower error on each pair.';
      text(ctx, api, result, 960, 913, 43, C.yellow, 'center');
      text(ctx, api, 'Population error of either router   50%', 960, 991, 35, C.muted, 'center');
    });
    return;
  }
  const fixed = riskCheck(4, 40);
  const thousand = state.beat >= 2;
  const pool = thousand ? 1000 : 10;
  const searched = riskCheck(4, 40, pool);
  const change = thousand ? 'sweep-thousand' : 'sweep-ten';
  const progress = cueProgress(state, change);
  const precedingRadius = thousand ? riskCheck(4, 40, 10).radius : fixed.radius;
  const extension =
    (precedingRadius + (searched.radius - precedingRadius) * progress) / searched.radius;
  const rows = [
    {
      name: 'One fixed prompt',
      detail: 'M = 1',
      check: fixed,
      y: 475,
      showObserved: true,
      extension: 1,
      showUpper: true,
    },
  ];
  if (state.beat >= 1)
    rows.push({
      name: 'Sweep winner',
      detail: 'M = ' + pool.toLocaleString('en-US'),
      check: searched,
      y: 670,
      showObserved: true,
      extension,
      showUpper: cueEnded(state, change),
    });
  focusOn(api, 'search-ruler', () => {
    text(
      ctx,
      api,
      '4 wrong routes on 40 tickets in each comparison',
      960,
      260,
      41,
      C.ink,
      'center',
    );
    drawRiskRuler(ctx, api, {
      min: 0,
      max: 0.5,
      ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      rows,
      axisY: 790,
    });
  });
  focusOn(api, 'failure-budget', () => {
    const message = [
      'Two-sided Hoeffding upper bound   ·   95% confidence',
      'Split the 5% failure allowance across 10 prespecified prompts.',
      '1,000 × ' +
        (delta / 1000).toFixed(5) +
        ' = ' +
        delta.toFixed(2) +
        ' total failure allowance',
      'Repeated batches can select different winners.',
      'Prompt written after inspecting a miss? Freeze it and draw fresh tickets.',
    ][state.beat];
    text(ctx, api, message, 960, 942, 40, C.ink, 'center');
    const foot =
      state.beat === 4
        ? 'A saved prompt count cannot measure all the choices available during editing.'
        : 'Radius = √[ln(2M / 0.05) / (2 × 40)]' +
          (progress === 1
            ? '   ≈   ' + (100 * searched.radius).toFixed(1) + ' percentage points'
            : '');
    text(ctx, api, foot, 960, 1013, 32, C.muted, 'center');
  });
}
export default {
  id: 'pay-for-search',
  draw: drawPayForSearch,
  cues: [
    'fixed-end',
    'sweep-ten',
    'sweep-thousand',
    'repeat-search',
    'winning-mean',
    'adaptive-prompt',
  ],
};
