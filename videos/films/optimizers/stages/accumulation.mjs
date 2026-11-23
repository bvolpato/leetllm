import { fmt } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { ACCUMULATION } from '../fixtures.mjs';
import { itemShares, signed } from '../item-shares.mjs';
import {
  drawAccumulationAndClippingTarget,
  drawAccumulationAndClippingText,
} from '../defaults.mjs';

function distributedWindow(ctx, state, api) {
  const { C: themeColors } = api;
  const phase = (id, b) => cueProgress(state, id, b);
  api.text(
    ctx,
    '4 items per microbatch  ×  3 backward calls  ×  2 processes',
    170,
    272,
    38,
    themeColors.ink,
  );
  drawAccumulationAndClippingTarget(ctx, api, 'effective-batch', () => {
    for (let rank = 0; rank < 2; rank++) {
      const y = 405 + rank * 115;
      drawAccumulationAndClippingText(
        ctx,
        api,
        themeColors,
        'rank ' + rank,
        180,
        y + 30,
        29,
        themeColors.muted,
      );
      for (let micro = 0; micro < 3; micro++)
        for (let item = 0; item < 4; item++) {
          const x = 390 + micro * 430 + item * 78,
            color = rank ? themeColors.green : themeColors.cyan;
          api.rect(ctx, x, y, 61, 48, undefined, color, 2);
          const identity = rank * 12 + micro * 4 + item + 1;
          if (identity <= Math.floor(phase('effective-batch', 2) * 24))
            drawAccumulationAndClippingText(
              ctx,
              api,
              themeColors,
              String(identity),
              x + 30.5,
              y + 32,
              23,
              color,
              'center',
            );
        }
    }
    drawAccumulationAndClippingText(
      ctx,
      api,
      themeColors,
      phase('effective-batch', 2) === 1
        ? 'Effective count = 24 items per optimizer update'
        : 'Effective count = ?',
      960,
      640,
      34,
      themeColors.yellow,
      'center',
    );
  });
  const operations = [
    ['window-backward', 'Finish all 3 backward calls per rank'],
    ['window-unscale', 'Unscale once'],
    ['window-clip', 'Clip once'],
    ['window-step', 'Optimizer step once'],
    ['window-schedule', 'Per-update schedule once'],
    ['window-clear', 'Clear gradients'],
  ];
  operations.forEach(([id, label], i) =>
    drawAccumulationAndClippingTarget(ctx, api, id, () => {
      const p = phase(id, 2),
        y = 715 + i * 52;
      api.circle(
        ctx,
        260,
        y - 10,
        10,
        p === 1 ? themeColors.green : themeColors.bg,
        p > 0 ? themeColors.yellow : themeColors.muted,
        2,
      );
      drawAccumulationAndClippingText(
        ctx,
        api,
        themeColors,
        label,
        300,
        y,
        28,
        p > 0 ? themeColors.ink : themeColors.muted,
      );
    }),
  );
  drawAccumulationAndClippingText(
    ctx,
    api,
    themeColors,
    'Completed optimizer updates: ' + (phase('window-step', 2) === 1 ? 1 : 0),
    1140,
    825,
    34,
    themeColors.green,
  );
  drawAccumulationAndClippingText(
    ctx,
    api,
    themeColors,
    'AMP scale stays fixed across this window.',
    1140,
    925,
    29,
    themeColors.muted,
  );
}

function weightRuler(ctx, api, rate, wrongMove, repairMove) {
  const { C } = api;
  const w = ACCUMULATION.start;
  const x = (weight) => 300 + (weight - w) * 5400;
  const y = 824;
  api.line(ctx, x(w), y, x(1.24), y, C.muted, 3);
  api.circle(ctx, x(w), y, 9, C.ink);
  api.text(ctx, 'start  ' + w, x(w), y + 65, 30, C.ink, 'center');
  for (const [i, [g, move, color, id]] of [
    [ACCUMULATION.wrong, wrongMove, C.pink, 'accum-wrong-step'],
    [ACCUMULATION.weighted, repairMove, C.green, 'accum-repair'],
  ].entries()) {
    if (move <= 0) continue;
    api.focus.target(id, () => {
      const end = w - rate * g;
      const level = y - 20 - 26 * i;
      api.line(ctx, x(w), level, x(w + (end - w) * move), level, color, 6);
      if (move === 1) {
        api.line(ctx, x(end), level, x(end), y + 13, color, 3);
        api.circle(ctx, x(end), level, 9, color);
        api.text(
          ctx,
          (i ? 'By item  ' : 'By batch  ') + fmt(end),
          x(end),
          y + 66,
          40,
          color,
          'center',
        );
      }
    });
  }
}

export function drawAccumulation(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat === 2) return distributedWindow(ctx, state, api);
  const { C } = api;
  const f = ACCUMULATION;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  api.text(
    ctx,
    'Intended loss    ·    mean squared error over three items    ·    w = 1',
    180,
    240,
    36,
    C.ink,
  );
  const derivatives = q('accum-derivatives', 0, 0.18, 0.33);
  const groups = q('accum-groups', 0, 0.68, 0.85);
  const wrong = q('accum-divide', 1, 0.02, 0.16);
  const repair = q('accum-weights', 1, 0.43, 0.58);
  itemShares(ctx, api, f, {
    halfPerBatch: wrong * (1 - repair),
    grouped: groups > 0,
    showMeans: groups === 1,
    showGradients: derivatives === 1,
    showFractions: beat === 1,
    target: 'item-strip',
  });
  if (beat === 0) {
    api.focus.target('accum-full', () =>
      api.text(
        ctx,
        q('accum-full', 0, 0.42, 0.57) === 1
          ? 'Full mean   (' + f.gradients.map(signed).join('  ') + ') / 3 = ' + signed(f.weighted)
          : 'Each derivative is 2(w − target)',
        960,
        785,
        45,
        C.ink,
        'center',
      ),
    );
    if (groups === 1)
      api.text(ctx, 'What happens if each batch gets half?', 960, 947, 47, C.yellow, 'center');
    return;
  }
  const wrongGradient = q('accum-wrong', 1, 0.16, 0.24);
  const fixedGradient = q('accum-correct-gradient', 1, 0.6, 0.72);
  api.focus.target('combined-gradient', () => {
    const label =
      fixedGradient === 1
        ? 'Item shares     g = ' + signed(f.weighted)
        : wrongGradient === 1 && repair === 0
          ? 'Equal batch shares     g = ' + signed(f.wrong)
          : 'Accumulated gradient';
    api.text(ctx, label, 960, 710, 39, C.ink, 'center');
  });
  weightRuler(
    ctx,
    api,
    0.1,
    q('accum-wrong-step', 1, 0.27, 0.36),
    q('accum-repair', 1, 0.74, 0.84),
  );
  api.focus.target('accum-forward', () =>
    api.text(
      ctx,
      q('accum-forward', 1, 0.89, 0.96) > 0
        ? 'Same item forwards    ·    count the items or valid tokens actually used'
        : 'One SGD update from w = 1    ·    rate 0.1',
      960,
      990,
      32,
      C.muted,
      'center',
    ),
  );
}
export default {
  id: 'accumulation',
  draw: drawAccumulation,
  cues: [
    'accum-items',
    'accum-derivatives',
    'accum-full',
    'accum-groups',
    'accum-divide',
    'accum-wrong',
    'accum-wrong-step',
    'accum-weights',
    'accum-repair',
    'accum-forward',
    'accum-correct-gradient',
    'effective-batch',
    'window-backward',
    'window-unscale',
    'window-clip',
    'window-step',
    'window-schedule',
    'window-clear',
  ],
};
