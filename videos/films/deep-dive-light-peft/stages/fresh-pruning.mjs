import { beatCue, headFixture } from '../model.mjs';
import { drawHeadComparison, drawShiftedCases } from '../head-comparison.mjs';

const fresh = headFixture([2, 0]);
const passed = 7,
  cases = 10,
  required = 8;

export function drawFreshPruning(ctx, scene, state, api) {
  const { C } = api;
  const values = beatCue(state, 0, 'lp-fresh-contributions', 0.33, 0.67);
  const sumA = beatCue(state, 1, 'lp-fresh-a', 0.08, 0.22) === 1;
  const sumB = beatCue(state, 1, 'lp-fresh-b', 0.27, 0.43) === 1;
  const rejected = beatCue(state, 1, 'lp-fresh-cache', 0.46, 0.57) === 1 && !fresh.cacheCompatible;
  const tests = beatCue(state, 1, 'lp-fresh-cases', 0.65, 0.85);
  const rate = beatCue(state, 2, 'lp-fresh-rate', 0.04, 0.27) === 1;
  const held = beatCue(state, 2, 'lp-fresh-hold', 0.29, 0.48) === 1 && passed < required;
  const replay = beatCue(state, 2, 'lp-fresh-replay', 0.55, 0.74);
  if (replay === 0) {
    drawHeadComparison(ctx, api, fresh, {
      values,
      pack: 1,
      sumA,
      sumB,
      inputTarget: 'lp-fresh-input',
      sourceTarget: 'lp-fresh-values',
      aTarget: 'lp-fresh-a',
      bTarget: 'lp-fresh-b',
    });
    api.focus.target('lp-fresh-cache', () => {
      const msg = rejected
        ? 'REJECT A’s cached state for B'
        : 'Can B use A’s cached state for this token?';
      api.text(ctx, msg, 130, 883, 34, rejected ? C.pink : C.yellow);
    });
  }
  api.focus.target('lp-fresh-gate', () => {
    if (replay > 0) {
      api.text(ctx, 'Replay the same three inputs', 130, 302, 52, C.ink);
      api.text(ctx, 'Pruned base B', 130, 553, 45, C.ink);
      api.text(ctx, 'Original checkpoint', 130, 722, 45, C.ink);
      for (let i = passed; i < cases; i++) {
        const slot = i - passed;
        const x = 835 + 320 * slot;
        api.text(ctx, 'Case ' + (i + 1), x, 435, 39, C.ink, 'center');
        api.rect(ctx, x - 101, 486, 202, 96, C.panel, C.pink, 9);
        api.text(ctx, 'Failed', x, 550, 43, C.pink, 'center');
        const progress = api.clamp(replay * (cases - passed) - slot);
        if (progress > 0) {
          api.line(ctx, x, 583, x, 583 + 66 * progress, C.yellow, 4);
          api.components.fade(progress, () => {
            api.rect(ctx, x - 101, 651, 202, 96, C.panel, C.yellow, 9);
            api.text(ctx, '?', x, 716, 50, C.yellow, 'center');
          });
        }
      }
    }
    if (tests > 0 || rate || held) {
      api.text(ctx, 'B · shifted cases', 130, 957, 34, C.ink);
      drawShiftedCases(ctx, api, passed, cases, required, Math.max(tests, Number(rate || held)));
      const verdict = held
        ? 'HOLD  ·  ' + passed + '/' + cases + ' passed (' + (100 * passed) / cases + '%)'
        : rate
          ? 'Pass rate  ' + (100 * passed) / cases + '%'
          : 'Release B?';
      api.text(ctx, verdict, 1530, 957, 38, held ? C.pink : C.ink, 'center');
    }
  });
}
export default {
  id: 'fresh-pruning',
  draw: drawFreshPruning,
  cues: [
    'lp-fresh-input',
    'lp-fresh-contributions',
    'lp-fresh-a',
    'lp-fresh-b',
    'lp-fresh-cache',
    'lp-fresh-cases',
    'lp-fresh-rate',
    'lp-fresh-hold',
    'lp-fresh-replay',
  ],
};
