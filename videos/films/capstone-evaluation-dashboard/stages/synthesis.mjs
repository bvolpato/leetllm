import { dashboardCue, dashboardStarted, sum } from '../arithmetic.mjs';
import { dashboardText as text } from '../defaults.mjs';
import { plan } from '../fixtures.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const expand = state.beat > 0 ? 1 : dashboardCue(state, 'plan-slots', state.beatP);
  const target = sum(plan.map(([, count]) => count));
  const retained = sum(plan.map(([, , n]) => n));
  api.focus.target('fixture-plan', () => {
    text(ctx, api, 'One place per planned fixture', 130, 292, 36, C.ink);
    text(ctx, api, 'Retained / target', 1735, 292, 31, C.muted, 'right');
    plan.forEach(([slice, count, observed], i) => {
      const y = 385 + 102 * i;
      text(ctx, api, slice, 130, y + 12, 33, C.ink);
      for (let j = 0; j < count; j++) {
        const x = 600 + j * 32;
        if (j < observed) api.rect(ctx, x, y - 15, 24, 30, C.green, C.green, 3);
        else if (expand * count > j) api.rect(ctx, x, y - 15, 24, 30, C.bg, C.muted, 3);
      }
      text(
        ctx,
        api,
        expand >= 1 ? observed + ' / ' + count : observed,
        1735,
        y + 12,
        35,
        observed ? C.green : C.yellow,
        'right',
      );
    });
    const regional = state.beat > 0 && dashboardStarted(state, 'regional-case', state.beatP > 0.2);
    text(
      ctx,
      api,
      regional
        ? 'Which regional policy applied on the effective date?'
        : retained + ' retained fixtures',
      130,
      936,
      40,
      regional ? C.yellow : C.green,
    );
    if (expand >= 1)
      text(ctx, api, target - retained + ' still to collect', 1735, 936, 34, C.muted, 'right');
  });
}
export default { id: 'synthesis', draw: drawSynthesis, cues: ['plan-slots', 'regional-case'] };
