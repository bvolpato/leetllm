import { rayChapterState, rayProgress } from '../construction.mjs';
import { arrow, chapterCard, chapterGrid, chapterText, footer, heading } from '../defaults.mjs';
export function drawLocalLab(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('local-lab', state),
    { b: currentBeat, p: progress } = modelState,
    done = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat) === 1;
  api.focus.target('ray-local-lab-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Fresh pinned local runtime'
        : currentBeat === 1
          ? 'Bind each check to a consumed resource or new process'
          : 'A deliberate worker exit has one configured retry',
    );
    if (currentBeat === 0) {
      const rows = [
        ['Ray', '2.58.0'],
        ['Python', '3.12'],
        ['Logical CPUs', '2'],
        ['GPUs', '0'],
        ['Object-store budget', '80 MiB'],
        ['Existing cluster', 'not attached'],
      ];
      rows.forEach(([a, z], i) => {
        const x = 150 + (i % 2) * 850,
          y = 360 + Math.floor(i / 2) * 180;
        chapterCard(ctx, api, a, x, y, 720, themeColors.blue);
        if (progress > (i + 0.1) / 7)
          chapterText(ctx, api, z, x + 360, y + 143, 32, themeColors.cyan, 'center');
      });
    } else if (currentBeat === 1) {
      const group = done('lab-bundles', 1);
      chapterGrid(
        ctx,
        api,
        [
          ['CPU bundle 0', 'CPU bundle 1'],
          [group ? 'task ran' : 'reserved', group ? 'task ran' : 'reserved'],
        ],
        150,
        390,
        700,
        230,
        themeColors.blue,
        29,
      );
      chapterCard(ctx, api, 'Feature count', 1040, 390, 690, themeColors.green);
      if (done('lab-count', 1))
        chapterText(
          ctx,
          api,
          '3 · nested handles True',
          1385,
          590,
          36,
          themeColors.green,
          'center',
        );
      chapterCard(
        ctx,
        api,
        done('lab-newpid', 1) ? 'Actor PID: old → new' : 'Actor identity · awaiting restart',
        150,
        755,
        700,
        themeColors.yellow,
      );
      chapterText(
        ctx,
        api,
        done('lab-newpid', 1) ? 'different PID confirmed · count 0' : 'await changed identity',
        1385,
        815,
        31,
        done('lab-newpid', 1) ? themeColors.green : themeColors.muted,
        'center',
      );
    } else {
      const died = done('lab-exit', 2),
        retried = done('lab-retry', 2);
      chapterCard(
        ctx,
        api,
        'Attempt 1 · marker absent',
        160,
        400,
        690,
        died ? themeColors.pink : themeColors.blue,
      );
      chapterCard(
        ctx,
        api,
        died ? 'marker written · exit code 17' : 'worker running',
        160,
        590,
        690,
        died ? themeColors.pink : themeColors.muted,
      );
      chapterCard(
        ctx,
        api,
        'Attempt 2 · marker present',
        1050,
        400,
        690,
        retried ? themeColors.green : themeColors.muted,
      );
      if (retried) chapterCard(ctx, api, 'worker crash retried', 1050, 590, 690, themeColors.green);
      if (died) arrow(ctx, api, 880, 455, 1020, 455, themeColors.yellow);
      chapterText(
        ctx,
        api,
        retried ? 'Observed one worker-crash replay' : 'Single-node marker controls this fixture',
        960,
        885,
        33,
        retried ? themeColors.green : themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'Local run on one machine');
  });
}
export default {
  id: 'local-lab',
  draw: drawLocalLab,
  cues: [
    'ray-local-lab-op-0',
    'ray-local-lab-op-1',
    'ray-lab-bundles',
    'ray-lab-count',
    'ray-lab-newpid',
    'ray-local-lab-op-2',
    'ray-lab-exit',
    'ray-lab-retry',
  ],
};
