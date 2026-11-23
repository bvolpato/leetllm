import { codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawMovingCard,
  drawRow,
} from '../defaults.mjs';
export function drawFreshWorkerPlan(ctx, scene, state, api) {
  api.focus.target('ci-fresh-worker-plan-trace', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = codingChapterState('fresh-worker-plan', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'New ideal worksheet · predict both finish times');
        drawRow(
          ctx,
          api,
          ['job A: wait 3 s + CPU 1 s', 'job B: wait 3 s + CPU 1 s'],
          200,
          410,
          1520,
          120,
          themeColors.blue,
          31,
        );
        drawChapterCard(
          ctx,
          api,
          'one GIL-enabled CPU lane',
          250,
          680,
          1420,
          100,
          themeColors.yellow,
          33,
        );
        drawChapterText(
          ctx,
          api,
          'startup = transfer = merge = 0 in this worksheet',
          960,
          870,
          30,
          themeColors.muted,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'Serial finish?  Overlapped-wait finish?',
          960,
          965,
          35,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'Build both schedules on the same seconds scale');
        const serialTime = 8 * q,
          parallelTime = 5 * q,
          intervals = [
            {
              id: 'saW',
              lane: 'serial',
              start: 0,
              end: 3,
              label: 'A waits',
              color: themeColors.blue,
            },
            {
              id: 'saC',
              lane: 'serial',
              start: 3,
              end: 4,
              label: 'A CPU',
              color: themeColors.green,
            },
            {
              id: 'sbW',
              lane: 'serial',
              start: 4,
              end: 7,
              label: 'B waits',
              color: themeColors.cyan,
            },
            {
              id: 'sbC',
              lane: 'serial',
              start: 7,
              end: 8,
              label: 'B CPU',
              color: themeColors.yellow,
            },
            {
              id: 'aW',
              lane: 'a',
              start: 0,
              end: 3,
              label: 'A waits',
              color: themeColors.blue,
            },
            {
              id: 'bW',
              lane: 'b',
              start: 0,
              end: 3,
              label: 'B waits',
              color: themeColors.cyan,
            },
            {
              id: 'aC',
              lane: 'cpu',
              start: 3,
              end: 4,
              label: 'A',
              color: themeColors.green,
            },
            {
              id: 'bC',
              lane: 'cpu',
              start: 4,
              end: 5,
              label: 'B',
              color: themeColors.yellow,
            },
          ];
        teaching.timeline({
          x: 200,
          y: 360,
          width: 1520,
          height: 450,
          domain: [0, 8],
          time: Math.max(serialTime, parallelTime),
          lanes: [
            {
              id: 'serial',
              label: 'Serial',
            },
            {
              id: 'a',
              label: 'Wait A',
            },
            {
              id: 'b',
              label: 'Wait B',
            },
            {
              id: 'cpu',
              label: 'one CPU',
            },
          ],
          intervals,
          ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8],
          fontSize: 22,
        });
        drawChapterCard(
          ctx,
          api,
          modelState.serialVisible ? 'serial: 8 s' : 'serial: ?',
          230,
          875,
          650,
          95,
          modelState.serialVisible ? themeColors.green : themeColors.yellow,
          34,
        );
        drawChapterCard(
          ctx,
          api,
          modelState.overlapVisible ? 'overlapped waits: 5 s' : 'overlapped waits: ?',
          1030,
          875,
          650,
          95,
          modelState.overlapVisible ? themeColors.green : themeColors.yellow,
          33,
        );
        drawFooter(ctx, api, 'The CPU stages are sequential; the waiting intervals overlap');
      } else {
        drawHeading(ctx, api, 'Return identities and merge in the parent');
        drawRow(ctx, api, ['A result', 'B result'], 230, 410, 1460, 110, themeColors.cyan, 35);
        drawMovingCard(ctx, api, 'A', 330, 650, 760, 650, q, themeColors.blue, 160);
        drawMovingCard(ctx, api, 'B', 1390, 650, 1030, 650, q, themeColors.cyan, 160);
        drawChapterCard(
          ctx,
          api,
          q >= 0.999999 ? 'parent records: A, B' : 'parent merge pending',
          500,
          845,
          920,
          115,
          q >= 0.999999 ? themeColors.green : themeColors.yellow,
          39,
        );
        drawFooter(
          ctx,
          api,
          'Local assertions establish the fixtures; runtime, persistence and throughput need their own evidence',
        );
      }
    }
  });
}
export default {
  id: 'fresh-worker-plan',
  draw: drawFreshWorkerPlan,
  cues: [
    'ci-fresh-worker-plan-0-build',
    'ci-fresh-worker-plan-1-build',
    'ci-fresh-worker-plan-serial',
    'ci-fresh-worker-plan-overlap',
    'ci-fresh-worker-plan-2-build',
  ],
};
