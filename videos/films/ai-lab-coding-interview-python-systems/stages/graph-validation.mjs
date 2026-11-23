import { ciDone, codingChapterState } from '../construction.mjs';
import {
  drawArrow,
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawLine,
  drawRow,
} from '../defaults.mjs';
export function drawGraphValidation(ctx, scene, state, api) {
  api.focus.target('ci-graph-validation-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('graph-validation', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'Validate the whole graph before any independent task runs');
        const nodes = [
          ['ready R', 260, 480],
          ['A', 1000, 420],
          ['B', 1440, 650],
        ];
        nodes.forEach(([label, x, y], i) =>
          drawChapterCard(
            ctx,
            api,
            label,
            x,
            y,
            260,
            110,
            i ? themeColors.blue : themeColors.green,
            34,
          ),
        );
        drawArrow(ctx, api, 1290, 485, 1430, 640, themeColors.cyan);
        drawLine(ctx, api, 1550, 790, 1110, 790, themeColors.pink, 4);
        drawArrow(ctx, api, 1110, 790, 1110, 565, themeColors.pink);
        drawRow(
          ctx,
          api,
          q > 0.5
            ? ['A: active', 'B: active', 'back to A']
            : ['A: unseen', 'B: unseen', 'stack empty'],
          780,
          885,
          1000,
          90,
          themeColors.yellow,
          26,
        );
        drawChapterText(
          ctx,
          api,
          ciDone(state, 'ci-graph-validation-cycle')
            ? 'cycle → reject before run'
            : 'run effects: 0',
          470,
          780,
          31,
          themeColors.pink,
          'center',
        );
        drawFooter(ctx, api, 'An independent ready node does not bypass whole-graph prevalidation');
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'A heap tuple combines priority with a deterministic name tie-break');
        const picked = q > 0.3,
          ready = ciDone(state, 'ci-graph-validation-ready');
        drawChapterCard(
          ctx,
          api,
          picked ? '(1, docs)' : '(1, build)',
          810,
          370,
          330,
          85,
          themeColors.yellow,
          30,
        );
        if (!picked) {
          drawChapterCard(ctx, api, '(1, docs)', 430, 550, 330, 85, themeColors.blue, 30);
          drawLine(ctx, api, 900, 475, 680, 530);
        }
        drawChapterCard(
          ctx,
          api,
          ready ? '(2, ship)' : 'ship: waiting for build',
          1190,
          550,
          420,
          85,
          ready ? themeColors.blue : themeColors.muted,
          26,
        );
        if (ready) drawLine(ctx, api, 1060, 475, 1350, 530);
        drawChapterCard(
          ctx,
          api,
          picked ? 'pop: build' : 'input: docs then build',
          220,
          750,
          650,
          100,
          themeColors.cyan,
          30,
        );
        drawChapterCard(
          ctx,
          api,
          ready ? 'ship deps: 0 → enqueue' : 'ship deps: 1 → withheld',
          1050,
          750,
          650,
          100,
          themeColors.green,
          30,
        );
        drawFooter(
          ctx,
          api,
          'Only eligible tasks enter the heap; publication releases the waiting dependent',
        );
      } else {
        drawHeading(ctx, api, 'One task keeps its priority through immediate retries');
        const index = Math.min(3, Math.floor(q * 4));
        drawRow(
          ctx,
          api,
          [
            'build attempt 1',
            index > 0 ? 'False → requeue' : 'pending',
            index > 1 ? 'build attempt 2' : 'pending',
            index > 2 ? 'docs runs later' : 'pending',
          ],
          170,
          420,
          1580,
          110,
          themeColors.yellow,
          26,
        );
        drawChapterCard(ctx, api, 'actual False', 250, 680, 580, 100, themeColors.yellow, 34);
        drawChapterCard(ctx, api, 'string "False"', 1090, 680, 580, 100, themeColors.pink, 34);
        drawChapterText(ctx, api, 'retry under cap', 540, 865, 28, themeColors.yellow, 'center');
        drawChapterText(
          ctx,
          api,
          'reject invalid result type',
          1380,
          865,
          28,
          themeColors.pink,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'Exceptions abort this sequential scheduler; recursion depth is a separate implementation limit',
        );
      }
    }
  });
}
export default {
  id: 'graph-validation',
  draw: drawGraphValidation,
  cues: [
    'ci-graph-validation-0-build',
    'ci-graph-validation-cycle',
    'ci-graph-validation-1-build',
    'ci-graph-validation-ready',
    'ci-graph-validation-2-build',
  ],
};
