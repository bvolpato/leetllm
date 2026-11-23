import { rayMix } from '../arithmetic.mjs';
import { rayChapterState, rayProgress } from '../construction.mjs';
import {
  arrow,
  chapterCard,
  chapterGrid,
  chapterText,
  footer,
  heading,
  packet,
  panel,
} from '../defaults.mjs';
export function drawSchedulerOwners(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('scheduler-owners', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat);
  api.focus.target('ray-scheduler-owners-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Execution and metadata take separate paths'
        : currentBeat === 1
          ? 'Send the argument to the existing actor process'
          : 'Logical admission and physical execution differ',
    );
    if (currentBeat < 2) {
      chapterCard(ctx, api, 'Driver / CoreWorker', 150, 360, 520, themeColors.blue);
      chapterCard(ctx, api, 'GCS cluster records', 1190, 360, 560, themeColors.yellow);
      panel(ctx, api, 150, 600, 650, 300, themeColors.blue);
      panel(ctx, api, 1070, 600, 680, 300, themeColors.cyan);
      chapterText(
        ctx,
        api,
        'Node A · raylet / task workers',
        475,
        655,
        29,
        themeColors.blue,
        'center',
      );
      chapterText(
        ctx,
        api,
        'Node B · actor L stays here',
        1410,
        655,
        29,
        themeColors.cyan,
        'center',
      );
      if (currentBeat === 0) {
        const x = rayMix(270, 610, progress);
        packet(ctx, api, 'task A', x, 755, themeColors.blue, 180);
        arrow(ctx, api, 680, 410, 1160, 410, themeColors.yellow);
        chapterText(
          ctx,
          api,
          'actor / node / group metadata',
          960,
          540,
          26,
          themeColors.yellow,
          'center',
        );
      } else {
        chapterCard(ctx, api, 'large argument', 210, 730, 420, themeColors.blue);
        chapterCard(ctx, api, 'Actor L · retained state', 1170, 730, 480, themeColors.cyan);
        const q = cueProgress('actor-fixed', 1);
        if (q > 0) {
          const x = rayMix(420, 1410, q);
          arrow(ctx, api, 420, 859, 1410, 859, themeColors.muted);
          api.line(ctx, 420, 859, x, 859, themeColors.yellow, 5);
          api.circle(ctx, x, 859, 12, themeColors.yellow);
          chapterText(ctx, api, 'value bytes', 935, 822, 28, themeColors.yellow, 'center');
        }
        chapterText(
          ctx,
          api,
          'Method invocation preserves the actor location',
          960,
          965,
          30,
          themeColors.yellow,
          'center',
        );
      }
    } else {
      chapterGrid(
        ctx,
        api,
        [
          ['Admission token', 'Physical core', 'Native threads'],
          ['Logical CPUs:1', 'not pinned', 'separate pools'],
        ],
        180,
        400,
        1540,
        220,
        themeColors.blue,
        30,
      );
      const x = rayMix(300, 1300, progress);
      packet(ctx, api, 'logical slot', x, 740, themeColors.yellow, 250);
      chapterText(
        ctx,
        api,
        'OpenMP thread count follows explicit CPU request unless overridden',
        960,
        900,
        31,
        themeColors.cyan,
        'center',
      );
    }
    footer(ctx, api, 'Ray schedules logical resources. The host enforces physical limits.');
  });
}
export default {
  id: 'scheduler-owners',
  draw: drawSchedulerOwners,
  cues: [
    'ray-scheduler-owners-op-0',
    'ray-scheduler-owners-op-1',
    'ray-actor-fixed',
    'ray-scheduler-owners-op-2',
  ],
};
