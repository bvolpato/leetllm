import { CASES } from '../fixtures.mjs';
import { caseNames, cueClock } from '../report-picture.mjs';
import { sampleModel } from '../model.mjs';

export function drawFeedback(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  const move = at('use-feedback');
  const fresh = at('freeze-next') > 0;
  const model = sampleModel('feedback', { beat: 0, beatP: 0.08 + move * 0.78 });
  const used = model.development.length;
  api.focus.target('split', () => {
    api.text(ctx, 'Development evidence', 125, 270, 38, C.cyan);
    api.text(ctx, 'Reserved for testing', 735, 270, 38, C.yellow);
    api.text(ctx, 'Independent final test', 1345, 270, 38, C.muted);
    CASES.forEach((row, i) => {
      const wasReserved = row.source === 'holdout';
      const progress = wasReserved ? Math.max(0, Math.min(1, move * 2 - (i - 2))) : 1;
      const x = 735 - 610 * progress;
      const y = 341 + i * 112;
      api.components.card({
        x,
        y,
        width: 465,
        height: 81,
        label: caseNames[i],
        fontSize: 34,
        fill: C.panel,
        stroke: progress === 1 ? C.cyan : C.yellow,
        textColor: C.ink,
      });
    });
    api.text(ctx, used + ' development cases', 125, 875, 35, C.cyan);
  });
  api.focus.target('fresh-cases', () => {
    if (fresh) {
      model.final.forEach((name, i) => {
        api.text(ctx, name, 1345, 400 + i * 112, 30, C.ink);
      });
      api.text(
        ctx,
        model.scored + ' of ' + model.final.length + ' scored',
        1345,
        875,
        35,
        C.yellow,
      );
    }
    api.text(ctx, 'Fresh evaluation pending', 1345, 965, 30, C.muted);
  });
}
export default {
  id: 'feedback',
  draw: drawFeedback,
  cues: ['reserved-rollback', 'use-feedback', 'freeze-next', 'protect-final'],
};
