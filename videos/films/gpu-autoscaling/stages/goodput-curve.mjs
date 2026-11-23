import { serviceTrial } from '../arithmetic.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const trials = [
  [100, 92],
  [120, 105],
].map(([offered, qualified]) => ({
  offered,
  qualified,
  ...serviceTrial(offered, qualified, 10),
}));
const scale = (f) => 410 + f * 1320;
const required = 0.9;

export function drawGoodputCurve(ctx, scene, state, api) {
  const { C } = api;
  const seen = [
    cueProgress(state, 'first-trial', 0, 0.45, 0.92),
    cueProgress(state, 'higher-load', 1, 0.08, 0.67),
  ];
  api.focus.target('service-trials', () => {
    api.text(
      ctx,
      'Share of all offered requests meeting both latency targets',
      150,
      258,
      38,
      C.ink,
    );
    for (const [i, t] of trials.entries()) {
      if (i && seen[i] === 0) continue;
      const y = 408 + i * 234;
      api.text(ctx, t.offeredRPS + ' offered/s', 146, y + 41, 34, C.ink);
      api.rect(ctx, scale(0), y, scale(1) - scale(0), 61, C.panel, C.muted, 3);
      const n = Math.floor(seen[i] * t.qualified);
      if (n) api.rect(ctx, scale(0), y, scale(n / t.offered) - scale(0), 61, C.cyan, undefined, 3);
      if (seen[i] === 1) {
        api.text(
          ctx,
          t.qualified + ' / ' + t.offered + ' qualified  =  ' + t.attainment * 100 + '%',
          scale(0),
          y + 128,
          36,
          C.ink,
        );
        api.text(
          ctx,
          t.qualifiedRPS.toFixed(1) + ' qualified/s',
          scale(1),
          y + 128,
          36,
          C.cyan,
          'right',
        );
      }
    }
    const x = scale(required);
    api.line(ctx, x, 382, x, 485, C.yellow, 4);
    if (seen[1]) api.line(ctx, x, 623, x, 721, C.yellow, 4);
    api.text(ctx, '90% required', x, 351, 34, C.yellow, 'center');
  });
  api.focus.target('trial-decision', () => {
    const selected = afterClause(state, 'tested-capacity', 2, 0.38);
    const message = selected
      ? 'Highest passing tested load  ·  ' + trials[0].offeredRPS + ' offered requests/s'
      : seen[1] === 1
        ? 'Which offered rate meets the promise?'
        : 'Same workload  ·  10 seconds per trial';
    api.text(ctx, message, 960, 950, 43, C.ink, 'center');
  });
}
export default {
  id: 'goodput-curve',
  draw: drawGoodputCurve,
  cues: ['first-trial', 'higher-load', 'tested-capacity'],
};
