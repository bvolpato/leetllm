import { coordinatePlot } from '../coordinate-plots.mjs';
import { RUNS } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { fmt } from '../arithmetic.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const step = RUNS.sgd.records[0];
  const move = cueProgress(state, 'opening-step', 0, 0.07, 0.16);
  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.text(ctx, 'Height = contribution to loss', 130, 224, 32, C.muted);
  api.focus.target('opening-tracks', () => {
    for (const [j, id] of ['opening-wall', 'opening-floor'].entries()) {
      api.focus.target(id, () => {
        coordinatePlot(ctx, api, j, {
          opening: true,
          before: step.before[j],
          after: step.next[j],
          move,
        });
        const result = move === 1 ? '   →   ' + fmt(step.next[j]).replace('-', '−') : '';
        api.text(
          ctx,
          step.before[j] + result,
          j ? 1395 : 525,
          920,
          78,
          j ? C.green : C.cyan,
          'center',
        );
      });
    }
  });
  api.focus.target('opening-question', () => {
    api.text(ctx, 'Learning rate   ' + step.eta, 960, 1015, 41, C.ink, 'center');
  });
  ctx.restore();
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['opening-step', 'opening-wall', 'opening-floor', 'opening-rate'],
};
