import { cohort, drawCohort, drawRankRuler, targetRank } from '../cohort.mjs';
import { cueStep } from '../construction.mjs';
import { transferFrame } from '../model.mjs';

export function drawTakeaway(ctx, scene, state, api) {
  const { C } = api;
  const f = transferFrame(state);
  const rank = cueStep(state, 'transfer-rank', 0, 0.3, 0.73);
  api.focus.target('transfer-cohort', () => {
    drawCohort(
      ctx,
      api,
      cohort.byTen,
      cohort.byFifteen - cohort.byTen,
      cohort.size - cohort.byFifteen,
      { includeLater: f.progress === 1 },
    );
    api.text(ctx, 'Same 250 requests', 192, 226, 34, C.ink);
  });
  api.focus.target('transfer-fraction', () => {
    api.text(ctx, '10 s', 996, 226, 31, C.muted, 'right');
    api.line(ctx, 1017, 215, 1327, 215, C.muted, 3);
    api.circle(ctx, 1017 + 310 * f.progress, 215, 11, C.yellow);
    api.text(ctx, '15 s', 1348, 226, 31, C.muted);
    api.text(ctx, 'Timer', 1632, 225, 35, C.yellow, 'right');
    drawRankRuler(ctx, api, f.timely, rank === 1, !f.known);
    const fraction = f.known
      ? `${f.timely} / ${f.denominator} = ${(100 * f.timely / f.denominator).toFixed(1)}% finish by ${f.deadline} s`
      : 'Deadline moving · later group spans 10 to 15 s';
    api.text(ctx, fraction, 1690, 972, 36, f.known ? C.cyan : C.muted, 'right');
  });
  api.focus.target('transfer-tail', () => {
    if (f.p95Known) {
      api.math(ctx, '\\operatorname{p95}>15\\text{ seconds}', 192, 972, 43, C.yellow);
    } else if (rank === 1) {
      api.text(ctx, '95% requires ' + targetRank + ' finishes', 192, 972, 39, C.ink);
    }
  });
}

export default {
  id: 'takeaway',
  draw: drawTakeaway,
  cues: ['transfer-rank', 'transfer-deadline', 'transfer-p95'],
};
