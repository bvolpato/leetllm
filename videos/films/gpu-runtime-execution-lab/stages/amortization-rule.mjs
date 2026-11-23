import { graphCost, graphPrices } from '../arithmetic.mjs';
import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawAmortizationRule(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const { setupUs, eagerUs, replayUs } = graphPrices;
  const saving = eagerUs - replayUs;
  const tie = setupUs / saving;
  const baseMs = graphCost(tie).eager;
  const format = (n) => n.toLocaleString('en-US');
  if (state.beat <= 1) {
    const n = Math.floor(tie * p('cost-count'));
    const remaining = setupUs - n * saving;
    api.focus.target('setup-cost', () => {
      txt('Setup still to recover', 160, 293, 37, C.muted);
      txt(
        p('cost-setup') < 1 ? '12 ms' : format(remaining) + ' µs',
        1730,
        300,
        54,
        C.yellow,
        'right',
      );
      api.rect(ctx, 160, 347, 1570, 69, C.panel, C.muted, 8);
      if (remaining > 0)
        api.rect(ctx, 166, 353, (1558 * remaining) / setupUs, 57, C.yellow, undefined, 4);
      txt(format(n) + ' compatible runs', 161, 480, 38, C.ink);
    });
    api.focus.target('run-costs', () => {
      txt('Eager   ' + eagerUs + ' µs / run', 160, 600, 40, C.blue);
      txt('Replay   ' + replayUs + ' µs / run', 900, 600, 40, C.cyan);
      txt(
        p('cost-repaid') >= 1
          ? 'Saving per run     18 − 12 = 6 µs'
          : 'Saving per run     18 − 12 = ?',
        960,
        724,
        46,
        C.ink,
        'center',
      );
    });
    api.focus.target('cost-totals', () => {
      const both = p('gr-amortization-rule-b1-s2') >= 1;
      txt(
        both
          ? '2,000 runs   ·   both ' + baseMs + ' ms'
          : n === tie
            ? '12,000 µs ÷ 6 µs per run = 2,000 runs'
            : 'How many runs recover setup?',
        960,
        853,
        48,
        C.yellow,
        'center',
      );
      if (p('cost-tie-ask') > 0)
        txt('Time saved if we stop here   =   ?', 960, 963, 37, C.ink, 'center');
    });
    return;
  }
  if (state.beat === 2) {
    const left = 545,
      unit = 58,
      max = 20;
    api.focus.target('cost-totals', () => {
      txt('First ' + format(tie) + ' runs', 155, 310, 35, C.muted);
      txt(baseMs + ' ms each', 155, 378, 55, C.ink);
      txt('Time above the tie on run ' + format(tie + 1) + '   (µs)', left, 430, 39, C.ink);
      api.line(ctx, left, 494, left + max * unit, 494, C.muted, 2);
      for (const i of [0, 6, 12, 18, 20]) {
        api.line(ctx, left + i * unit, 488, left + i * unit, 506, C.muted, 2);
        txt(i, left + i * unit, 548, 31, C.muted, 'center');
      }
    });
    const row = (label, id, value, key, y, color, target) =>
      api.focus.target(target, () => {
        const progress = p(id);
        txt(label, 155, y + 45, 39, color);
        api.rect(ctx, left, y, max * unit, 53, C.panel, undefined, 5);
        if (progress > 0) api.rect(ctx, left, y, unit * value * progress, 53, color, undefined, 5);
        if (progress === 1)
          txt(graphCost(tie + 1)[key].toFixed(3) + ' ms total', 155, y + 100, 30, color);
      });
    row('Eager', 'cost-eager-extra', eagerUs, 'eager', 578, C.blue, 'eager-extra');
    row('Replay', 'cost-replay-extra', replayUs, 'graph', 730, C.cyan, 'graph-extra');
    api.focus.target('cost-gap', () => {
      if (p('cost-first-saving') > 0) {
        for (const x of [replayUs, eagerUs])
          api.line(ctx, left + unit * x, 824, left + unit * x, 850, C.yellow, 4);
        api.line(ctx, left + unit * replayUs, 849, left + unit * eagerUs, 849, C.yellow, 4);
        txt(
          saving + ' µs saved',
          left + (unit * (replayUs + eagerUs)) / 2,
          914,
          42,
          C.yellow,
          'center',
        );
      }
    });
    return;
  }
  const equalPrices = p('cost-flat') >= 1;
  api.focus.target('cost-formula', () => {
    txt('First cheaper run', 160, 322, 38, C.muted);
    txt('floor(setup ÷ saving per run) + 1', 160, 410, 58, C.ink);
    txt(
      'For a positive saving, with setup and saving in the same time unit',
      160,
      482,
      32,
      C.muted,
    );
  });
  api.focus.target('run-costs', () => {
    txt('Eager   ' + (equalPrices ? replayUs : eagerUs) + ' µs / run', 160, 650, 42, C.blue);
    txt('Replay   ' + replayUs + ' µs / run', 960, 650, 42, C.cyan);
  });
  api.focus.target('setup-cost', () => {
    txt(
      equalPrices
        ? 'Saving 0 µs / run     ·     setup still due ' + format(setupUs) + ' µs'
        : '12,000 ÷ 6 = 2,000     ·     first cheaper run 2,001',
      960,
      852,
      45,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'amortization-rule',
  draw: drawAmortizationRule,
  cues: [
    'cost-setup',
    'cost-prices',
    'cost-question',
    'cost-repaid',
    'cost-count',
    'gr-amortization-rule-b1-s2',
    'cost-tie-ask',
    'cost-zoom',
    'cost-eager-extra',
    'cost-replay-extra',
    'cost-first-saving',
    'cost-rule',
    'cost-flat',
    'cost-unpaid',
  ],
};
