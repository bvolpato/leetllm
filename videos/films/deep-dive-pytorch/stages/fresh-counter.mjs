import { beforeFresh as saved, freshGood, freshBad } from '../arithmetic.mjs';
import { cueFraction } from '../cues.mjs';
import { drawStep, weightScale } from '../weight-scale.mjs';

export function drawFreshCounter(ctx, scene, state, api) {
  const { C } = api;
  const step = (id, b, a, z) => cueFraction(state, id, b, a, z);
  const advance = step('fresh-counts', 1, 0.24, 0.4) > 0;
  const rewind = step('fresh-rewind', 2, 0, 0.15) > 0;
  const repaired = step('fresh-recount', 2, 0.16, 0.28) > 0;
  const replay = step('pt-fresh-restored', 2, 0.3, 0.46);
  const complete = step('pt-fresh-correct', 1, 0.63, 0.74);
  const reset = step('pt-fresh-wrong', 1, 0.77, 0.88);
  const restart = rewind ? replay : reset;
  const after = repaired ? freshGood : freshBad;
  api.focus.target('fresh-history', () => {
    api.text(ctx, 'Checkpoint after gradients +0.50 and −0.25', 120, 252, 39, C.ink);
    if (step('fresh-zero', 0, 0.72, 0.87) > 0)
      api.text(ctx, 'Next gradient   0', 1380, 252, 39, C.yellow);
    api.text(
      ctx,
      'w   ' +
        saved.w.toFixed(6) +
        '         m   ' +
        saved.m.toFixed(5) +
        '         v   ' +
        saved.v.toFixed(8),
      120,
      330,
      48,
      C.yellow,
    );
    const fullCount = advance ? '2 → 3' : '2';
    const restartCount = rewind
      ? repaired
        ? replay > 0
          ? '2 → 3'
          : '2'
        : '0'
      : advance
        ? '0 → 1'
        : '0';
    api.text(ctx, 'Saved counter    ' + fullCount, 120, 455, 38, C.green);
    api.text(
      ctx,
      (repaired ? 'Repaired counter    ' : 'Reset counter    ') + restartCount,
      960,
      455,
      38,
      repaired ? C.green : C.pink,
    );
    if (advance) {
      const direction = (end) => ((saved.w - end.w) / 0.01).toFixed(4);
      if (!rewind || replay >= 1)
        api.text(
          ctx,
          'Both next moments     m = ' +
            freshGood.m.toFixed(4) +
            '     v = ' +
            freshGood.v.toFixed(9),
          120,
          390,
          32,
          C.muted,
        );
      api.text(ctx, 'Corrected direction   ' + direction(freshGood), 120, 524, 34, C.muted);
      if (!rewind || replay >= 1)
        api.text(ctx, 'Corrected direction   ' + direction(after), 960, 524, 34, C.muted);
    }
  });
  api.focus.target('fresh-ruler', () => {
    const x = weightScale(ctx, api, [0.984, 0.985, 0.986, 0.987, 0.988], 700, 1750, 634, 866, 3);
    api.text(ctx, 'Uninterrupted', 120, 716, 37, C.green);
    api.text(
      ctx,
      repaired ? 'Counter restored' : 'Counter reset',
      120,
      832,
      37,
      repaired ? C.green : C.pink,
    );
    drawStep(ctx, api, x, 702, saved.w, freshGood.w, complete, C.green);
    drawStep(ctx, api, x, 817, saved.w, after.w, restart, repaired ? C.green : C.pink);
    if (repaired && replay >= 1) {
      const alignedX = x(after.w);
      for (let y = 725; y <= 790; y += 16) api.line(ctx, alignedX, y, alignedX, y + 7, C.green, 3);
    }
    if (complete >= 1) api.text(ctx, freshGood.w.toFixed(6), 435, 715, 36, C.ink);
    if (restart >= 1) api.text(ctx, after.w.toFixed(6), 435, 831, 36, C.ink);
    let note = 'Step size uses the counter in both bias corrections';
    if (state.beat === 0)
      note =
        step('fresh-zero', 0, 0.72, 0.87) > 0
          ? 'Next g = 0. Will the weights agree?'
          : 'Next update';
    else if (rewind)
      note =
        replay >= 1
          ? 'Both runs reach ' + after.w.toFixed(6) + ' on step ' + after.step
          : 'Replay from w = ' + saved.w.toFixed(6);
    api.text(ctx, note, 960, 982, 41, C.ink, 'center');
  });
}
export default {
  id: 'fresh-counter',
  draw: drawFreshCounter,
  cues: [
    'fresh-zero',
    'fresh-counts',
    'pt-fresh-correct',
    'pt-fresh-wrong',
    'fresh-rewind',
    'fresh-recount',
    'pt-fresh-restored',
  ],
};
