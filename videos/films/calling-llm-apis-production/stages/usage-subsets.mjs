import { usageReceipt, totalInput, writes, output, reasoning, rates } from '../model.mjs';
import { cueClock } from '../cued-trace.mjs';

export function drawUsageSubsets(ctx, scene, state, api) {
  const { C } = api;
  const clock = cueClock(scene, state);
  const original = usageReceipt(1200);
  const shift = Math.round(400 * clock.p('cache-shift'));
  const current = usageReceipt(original.cached + shift);
  const left = 155,
    width = 1610;
  const x = (tokens) => left + (width * tokens) / totalInput;
  const cachedShown =
    state.beat > 0 ? current.cached : Math.round(original.cached * clock.p('split-cached'));
  const writesShown = state.beat > 0 ? writes : Math.round(writes * clock.p('split-writes'));
  const ordinaryShown = totalInput - cachedShown - writesShown;
  api.focus.target('input-strip', () => {
    api.text(ctx, totalInput.toLocaleString('en-US') + ' input tokens', left, 281, 48, C.ink);
    if (state.beat >= 1)
      api.text(
        ctx,
        'Fictional USD rates per million tokens',
        left + width,
        280,
        32,
        C.muted,
        'right',
      );
    let start = 0;
    const pieces = [
      [ordinaryShown, clock.after('ordinary-input') ? C.blue : C.muted],
      [cachedShown, C.cyan],
      [writesShown, C.yellow],
    ];
    for (const [size, color] of pieces) {
      if (size > 0)
        api.rect(ctx, x(start), 343, (width * size) / totalInput, 87, color, undefined, 0);
      start += size;
    }
    const labels = [
      ['Ordinary', current.ordinary, rates.ordinary, C.blue, left],
      ['Cache read', current.cached, rates.cached, C.cyan, 731],
      ['Cache write', writes, rates.writes, C.yellow, 1330],
    ];
    labels.forEach(([name, count, rate, color, column], i) => {
      const known = clock.after(['ordinary-input', 'split-cached', 'split-writes'][i]);
      api.text(ctx, name, column, 513, 33, color);
      const amount = known ? String(count) : '?';
      api.text(
        ctx,
        amount + (clock.after('input-rates') ? ' × $' + rate.toFixed(2) : ''),
        column,
        581,
        44,
        C.ink,
      );
    });
  });
  api.focus.target('output-total', () => {
    api.text(ctx, 'Output', left, 710, 35, C.green);
    if (clock.started('output-includes')) {
      api.text(ctx, output + ' total', left, 771, 45, C.ink);
      api.text(
        ctx,
        clock.after('split-output')
          ? current.visible + ' visible  +  ' + reasoning + ' reasoning'
          : 'Includes ' + reasoning + ' reasoning',
        527,
        770,
        36,
        C.muted,
      );
      if (clock.after('output-rate'))
        api.text(ctx, output + ' × $' + rates.output.toFixed(2), 1330, 768, 41, C.ink);
    }
  });
  api.focus.target('price', () => {
    api.line(ctx, left, 856, left + width, 856, C.muted, 2);
    if (state.beat === 1 && clock.started('price-divisor'))
      api.text(ctx, 'Sum of products  ÷  1,000,000', 1725, 977, 37, C.muted, 'right');
    if (state.beat < 2)
      api.text(
        ctx,
        clock.after('baseline-price')
          ? 'Estimated cost     $' + original.cost.toFixed(5)
          : 'Estimated cost     ?',
        left,
        977,
        45,
        C.ink,
      );
    else {
      api.text(ctx, 'First request    $' + original.cost.toFixed(5), left, 975, 43, C.muted);
      const result = clock.after('replay-price');
      api.text(
        ctx,
        'Replay    ' + (result ? '$' + current.cost.toFixed(5) : '?'),
        992,
        977,
        51,
        result ? C.green : C.ink,
      );
    }
  });
}

export default {
  id: 'usage-subsets',
  draw: drawUsageSubsets,
  cues: [
    'split-cached',
    'split-writes',
    'ordinary-input',
    'output-includes',
    'split-output',
    'input-rates',
    'output-rate',
    'price-divisor',
    'baseline-price',
    'cache-shift',
    'replay-price',
  ],
};
