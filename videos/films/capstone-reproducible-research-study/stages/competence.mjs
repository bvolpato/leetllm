import { seedRows } from '../fixtures/seed-rows.mjs';
import { cueProgress } from '../evidence.mjs';

const evaluations = 200;
const { final_sparse, final_shaped } = seedRows[18];
const counts = [final_sparse, final_shaped].map((rate) => Math.round(evaluations * rate));

export function drawCompetence(ctx, scene, state, api) {
  const { C } = api;
  const reveal = cueProgress(state, 'open-absolute-scores', 1, 0.08, 0.55);
  api.focus.target('evaluation-scores', () => {
    api.text(
      ctx,
      'Seed 18   /   Frozen policies   /   200 evaluation episodes each',
      135,
      260,
      38,
      C.ink,
    );
    api.text(ctx, 'Difference in goal-reaching rate', 950, 383, 34, C.muted, 'center');
    api.text(
      ctx,
      `${100 * (final_shaped - final_sparse)} percentage points`,
      950,
      482,
      72,
      C.yellow,
      'center',
    );
    const start = 405,
      width = 1200;
    counts.forEach((count, i) => {
      const y = 588 + i * 133,
        color = i ? C.cyan : C.blue;
      api.text(ctx, i ? 'Shaped' : 'Sparse', 150, y + 37, 37, color);
      api.rect(ctx, start, y, width, 51, C.panel, C.muted, 2);
      const n = Math.floor(reveal * count);
      if (n) api.rect(ctx, start, y, (width * n) / evaluations, 51, color, undefined, 0);
      api.line(ctx, start + width / 2, y - 8, start + width / 2, y + 58, C.ink, 3);
      api.text(
        ctx,
        reveal === 0 ? '?' : String(n),
        1690,
        y + 41,
        42,
        reveal ? color : C.ink,
        'center',
      );
    });
    api.text(ctx, '100 goals', start + width / 2, 835, 29, C.muted, 'center');
    api.text(
      ctx,
      reveal === 0
        ? 'Could both learners have missed the goal more than half the time?'
        : reveal === 1
          ? `Both reached the goal ${counts[0]} times out of ${evaluations}.`
          : 'Goals reached on the original reward',
      960,
      957,
      38,
      C.ink,
      'center',
    );
  });
}
export default { id: 'competence', draw: drawCompetence, cues: ['open-absolute-scores'] };
