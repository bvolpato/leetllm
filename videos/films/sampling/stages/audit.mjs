import { cohort, drawCohort, drawCountBracket } from '../cohort.mjs';
import { auditFrame, durationCdf } from '../model.mjs';

export function drawAudit(ctx, scene, state, api) {
  const { C } = api;
  const f = auditFrame(state);
  api.focus.target('audit-cohort', () => {
    api.text(ctx, '250 requests observed for 15 seconds', 192, 229, 34, C.ink);
    drawCohort(ctx, api, f.timely, f.later, f.unfinished, {
      excluded: f.completedProgress * (1 - f.repair),
    });
  });
  api.focus.target('audit-fraction', () => {
    const counting = f.completedOnly || state.beat > 1;
    if (counting) {
      const counted =
        cohort.byFifteen * f.completedProgress + (cohort.size - cohort.byFifteen) * f.repair;
      drawCountBracket(ctx, api, counted, f.repair === 1 ? C.cyan : C.yellow);
      let population = 'Report denominator pending';
      let fraction = cohort.byTen + ' / ?';
      if (f.fractionKnown) {
        population = f.denominator === cohort.size ? 'All arrivals' : 'Completed requests only';
        fraction = cohort.byTen + ' / ' + f.denominator + ' = ' + (100 * f.fraction).toFixed(1) + '%';
      }
      api.text(ctx, population, 204, 881, 39, f.fractionKnown ? C.ink : C.muted);
      api.text(ctx, fraction, 1190, 881, 49, C.ink);
    }
  });
  api.focus.target('audit-comparison', () => {
    if (state.beat >= 3) {
      api.text(
        ctx,
        'Model at 10 s    ' + (100 * durationCdf(10)).toFixed(1) + '%',
        192,
        976,
        37,
        C.blue,
      );
      if (f.compare)
        api.text(
          ctx,
          'Gap    ' + (100 * (durationCdf(10) - f.fraction)).toFixed(1) + ' percentage points',
          1670,
          976,
          37,
          C.pink,
          'right',
        );
    }
  });
}

export default {
  id: 'audit',
  draw: drawAudit,
  cues: [
    'audit-timely',
    'audit-later',
    'audit-unfinished',
    'audit-completed-only',
    'audit-denominator',
    'audit-compare',
  ],
};
