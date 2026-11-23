import { delta } from '../fixtures.mjs';
import { cueEnded, cueProgress, focusOn, text } from '../defaults.mjs';

const plans = [
  { label: 'One frozen router', pool: 1, radius: 0.05, cue: 'plan-fixed' },
  { label: 'Prespecified pool', pool: 1000, radius: 0.1, cue: 'plan-wide' },
  { label: 'Same pool', pool: 1000, radius: 0.05, cue: 'plan-narrow' },
  { label: '5-point excess risk', pool: 1000, radius: 0.025, cue: 'plan-excess' },
];

export function drawSamplePlan(ctx, scene, state, api) {
  const { C } = api;
  focusOn(api, 'sample-design', () => {
    if (state.beat >= 4) {
      text(
        ctx,
        api,
        'Two illustrative users   ·   one square per turn',
        960,
        298,
        42,
        C.ink,
        'center',
      );
      for (const [i, turns] of [1, 9].entries()) {
        const y = 397 + i * 139;
        text(ctx, api, 'User ' + (i + 1), 225, y + 45, 39, C.ink);
        for (let j = 0; j < turns; j++)
          api.rect(ctx, 555 + j * 93, y, 75, 62, i ? C.blue : C.pink, undefined, 6);
        text(ctx, api, i ? '0 / 9 wrong' : '1 / 1 wrong', 1645, y + 42, 38, C.muted, 'center');
      }
      text(ctx, api, 'Per user', 560, 766, 40, C.muted, 'center');
      text(ctx, api, 'Per turn', 1360, 766, 40, C.muted, 'center');
      if (cueEnded(state, 'user-mean'))
        text(ctx, api, '(100% + 0%) / 2 = 50%', 560, 867, 43, C.yellow, 'center');
      if (cueEnded(state, 'turn-mean'))
        text(ctx, api, '1 / 10 = 10%', 1360, 867, 43, C.cyan, 'center');
      text(
        ctx,
        api,
        'The sampling unit determines which risk the estimate describes.',
        960,
        993,
        35,
        C.muted,
        'center',
      );
      return;
    }
    text(ctx, api, 'Independent cases sufficient at 95% confidence', 960, 279, 44, C.ink, 'center');
    for (const [i, plan] of plans.entries()) {
      if (i > state.beat) continue;
      const y = 389 + 137 * i;
      const n = Math.ceil(Math.log((2 * plan.pool) / delta) / (2 * plan.radius ** 2));
      const q = cueProgress(state, plan.cue);
      text(ctx, api, plan.label, 140, y, 40, C.ink);
      text(
        ctx,
        api,
        'M = ' +
          plan.pool.toLocaleString('en-US') +
          '   ·   radius ' +
          100 * plan.radius +
          ' points',
        140,
        y + 47,
        31,
        C.muted,
      );
      // Equal increments of length represent equal numbers of cases in all four rows.
      api.rect(ctx, 820, y - 25, 690, 41, C.panel, C.muted, 4);
      if (q > 0) api.rect(ctx, 820, y - 25, ((690 * n) / 8478) * q, 41, C.blue, undefined, 4);
      if (cueEnded(state, plan.cue))
        text(ctx, api, n.toLocaleString('en-US'), 1730, y + 11, 47, C.yellow, 'right');
    }
    text(
      ctx,
      api,
      'n ≥ ln(2M / δ) / (2ε²)     ·     Round up to a whole case.',
      960,
      985,
      42,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'sample-plan',
  draw: drawSamplePlan,
  cues: ['plan-fixed', 'plan-wide', 'plan-narrow', 'plan-excess', 'user-mean', 'turn-mean'],
};
