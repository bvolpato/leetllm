import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionLine,
  constructionNote,
  constructionRectangle,
  constructionText,
} from '../defaults.mjs';
export function drawServingComparison(ctx, scene, state, api) {
  api.focus.target('pl-serving-comparison-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['serving-comparison'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['serving-comparison'][beat]
      )
        throw Error('Invalid placement sentence serving-comparison/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'serving-comparison'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['serving-comparison'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        constructionText(
          ctx,
          api,
          'Logical token blocks → noncontiguous retained cache',
          150,
          285,
          34,
          C.cyan,
        );
        const slots = [0, 4, 1, 6, 3],
          colors = [C.blue, C.cyan, C.green, C.yellow, C.pink];
        slots.forEach((slot, i) => {
          const y = 375 + i * 100,
            ty = 360 + slot * 70,
            col = colors[i];
          constructionLine(ctx, api, 530, y + 32, 1180, ty + 30, col);
          constructionCell(
            ctx,
            api,
            'Tokens ' + i * 16 + '–' + (i * 16 + 15),
            150,
            y,
            360,
            65,
            col,
          );
          constructionCell(ctx, api, 'KV slot ' + slot, 1200, ty, 470, 60, col);
          const u = op(0, 0);
          if (u > 0 && u < 1) {
            const x = 550 + (1150 - 550) * u,
              py = y + 32 + (ty + 30 - y - 32) * u;
            constructionRectangle(ctx, api, x - 10, py - 10, 20, 20, col, true);
          }
        });
        constructionNote(
          ctx,
          api,
          'Same block color and identity at both ends; these are not OS pages',
        );
      } else {
        const runs = [
          { label: 'Two replicas', p95: 760, rate: 195 },
          { label: 'One tensor-parallel worker', p95: 910, rate: 255 },
        ];
        const revealed = op(1, 2) > 0;
        const verdict = op(1, 3) > 0;
        constructionText(
          ctx,
          api,
          'Two GPUs  /  same arrivals, prompts and quality  /  supplied replay',
          140,
          268,
          34,
        );
        constructionText(ctx, api, 'First visible token · p95', 640, 387, 33, C.blue);
        constructionText(ctx, api, 'Aggregate output rate', 1280, 387, 33, C.cyan);
        constructionText(ctx, api, 'At most 800 ms', 640, 446, 29, C.muted);
        constructionText(ctx, api, 'At least 180 tokens/s', 1280, 446, 29, C.muted);
        for (const [i, run] of runs.entries()) {
          const y = 550 + 170 * i;
          constructionText(ctx, api, run.label, 140, y + 16, 32);
          for (const [x, value, max, goal, color] of [
            [640, run.p95, 1000, 800, C.blue],
            [1280, run.rate, 300, 180, C.cyan],
          ]) {
            const w = 420;
            constructionRectangle(ctx, api, x, y, w, 32, C.muted);
            if (revealed) constructionRectangle(ctx, api, x, y, (w * value) / max, 32, color, true);
            constructionLine(
              ctx,
              api,
              x + (w * goal) / max,
              y - 10,
              x + (w * goal) / max,
              y + 44,
              C.yellow,
            );
          }
          if (revealed) {
            constructionText(ctx, api, run.p95 + ' ms', 640, y + 93, 33, C.blue);
            constructionText(ctx, api, run.rate + ' tokens/s', 1280, y + 93, 33, C.cyan);
          }
        }
        if (verdict) {
          const accepted = runs.filter((run) => run.p95 <= 800 && run.rate >= 180);
          constructionText(
            ctx,
            api,
            accepted[0].label + ' meet both replay requirements.',
            140,
            960,
            38,
            C.green,
          );
        }
      }
    }
  });
}
export default {
  id: 'serving-comparison',
  draw: drawServingComparison,
  cues: [
    'pl-serving-comparison-0-0',
    'pl-serving-comparison-0-1',
    'pl-serving-comparison-0-2',
    'pl-serving-comparison-1-0',
    'pl-serving-comparison-1-1',
    'pl-serving-comparison-1-2',
    'pl-serving-comparison-1-3',
  ],
};
