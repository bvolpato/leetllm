import { first, full, rowClock } from '../row-workspace.mjs';
import { VALUES } from '../fixtures.mjs';

export function drawGeneralizedMerge(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const factor = Math.exp(first.m - full.m),
    local = first.u / first.l,
    dense = full.u / full.l;
  const last = VALUES[2];
  if (state.beat === 3) {
    api.focus.target('merge-rule', () => {
      api.text(ctx, 'Common reference     m = max(mA, mB)', 140, 330, 48, C.ink);
      for (const [i, name] of ['A', 'B'].entries()) {
        const x = 145 + 840 * i;
        api.text(ctx, 'Block ' + name, x, 455, 42, i ? C.yellow : C.blue);
        if (clock.started('general-rule'))
          api.math(ctx, 'a_{' + name + '}=e^{m_{' + name + '}-m}', x, 565, 53, C.ink);
        if (clock.started('general-sums')) {
          api.math(ctx, 'a_{' + name + '} \\ell_{' + name + '}', x, 692, 52, C.ink);
          api.math(ctx, 'a_{' + name + '} N_{' + name + '}', x + 310, 692, 52, C.ink);
        }
      }
      api.line(ctx, 145, 761, 1740, 761, C.muted, 2);
      if (clock.done('general-divide'))
        api.math(
          ctx,
          'O=\\dfrac{a_A N_A+a_B N_B}{a_A\\ell_A+a_B\\ell_B}',
          960,
          907,
          54,
          C.cyan,
          'center',
        );
    });
    return;
  }
  const votes = state.beat === 2;
  const fixed = clock.done('fix-ratio'),
    shares = clock.done('true-shares');
  const pos = (v) => 245 + ((v - 10) / 35) * 1415;
  const convertedValue = first.u * Math.exp((first.m - full.m) * clock.progress('fix-ratio'));
  const fraction = api.lerp(0.5, (first.l * factor) / full.l, clock.progress('true-shares'));
  let candidate;
  if (votes && clock.done('equal-mean')) candidate = fraction * local + (1 - fraction) * last;
  if (!votes && clock.done('outside-blend')) candidate = (convertedValue + last) / full.l;
  api.focus.target('merge-formula', () => {
    if (votes) {
      api.text(ctx, 'How much of the row belongs to each tile?', 200, 301, 42, C.ink);
      const w = 1100;
      api.rect(ctx, 240, 373, w * fraction, 53, C.blue, undefined, 0);
      api.rect(ctx, 240 + w * fraction, 373, w * (1 - fraction), 53, C.yellow, undefined, 0);
      api.text(ctx, 'First tile   ' + (fraction * 100).toFixed(1) + '%', 240, 484, 36, C.blue);
      api.text(
        ctx,
        'Last tile   ' + ((1 - fraction) * 100).toFixed(1) + '%',
        1340,
        484,
        36,
        C.yellow,
        'right',
      );
    } else {
      api.text(ctx, 'Weighted value sum', 200, 305, 36, C.muted);
      api.text(ctx, 'Total weight', 200, 439, 36, C.muted);
      api.text(
        ctx,
        convertedValue.toFixed(3) + '  +  ' + last,
        820,
        312,
        53,
        fixed ? C.blue : C.pink,
      );
      api.text(ctx, (first.l * factor).toFixed(3) + '  +  1', 820, 446, 53, C.blue);
      api.line(ctx, 802, 358, 1355, 358, C.ink, 3);
    }
  });
  api.focus.target('merge-ruler', () => {
    api.text(ctx, 'Output', 172, 637, 32, C.muted);
    api.line(ctx, pos(10), 727, pos(45), 727, C.muted, 4);
    api.line(ctx, pos(10), 727, pos(40), 727, C.blue, 10);
    for (const v of VALUES) {
      api.line(ctx, pos(v), 714, pos(v), 745, C.ink, 3);
      api.text(ctx, v, pos(v), 798, 34, C.ink, 'center');
    }
    api.line(ctx, pos(dense), 655, pos(dense), 704, C.blue, 4);
    api.circle(ctx, pos(dense), 704, 10, C.blue);
    api.text(ctx, 'Dense  ' + dense.toFixed(3), pos(dense), 635, 34, C.blue, 'center');
    if (candidate != null) {
      const color = (fixed && !votes) || shares ? C.green : C.pink;
      api.circle(ctx, pos(candidate), 750, 13, color);
      api.line(ctx, pos(candidate), 762, pos(candidate), 835, color, 3);
      api.text(ctx, 'Merge  ' + candidate.toFixed(3), pos(candidate), 892, 39, color, 'center');
    } else api.text(ctx, 'Where will the merge land?', 960, 903, 40, C.ink, 'center');
  });
}

export default {
  id: 'generalized-merge',
  draw: drawGeneralizedMerge,
  cues: [
    'broken-ratio',
    'outside-blend',
    'fix-ratio',
    'equal-votes',
    'equal-mean',
    'true-shares',
    'general-rule',
    'general-sums',
    'general-divide',
  ],
};
