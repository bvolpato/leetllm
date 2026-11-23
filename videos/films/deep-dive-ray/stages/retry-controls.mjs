import { rayChapterState, rayProgress } from '../construction.mjs';
import { arrow, chapterCard, chapterText, footer, heading } from '../defaults.mjs';
export function drawRetryControls(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('retry-controls', state),
    { b: currentBeat, p: progress } = modelState,
    done = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat) === 1;
  api.focus.target('ray-retry-controls-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Count the first attempt and each retry'
        : currentBeat === 1
          ? 'One process restart, zero method retries'
          : 'The write commits before the reply',
    );
    if (currentBeat === 0) {
      const four = done('task-four', 0),
        three = done('task-three', 0);
      for (let i = 0; i < 4; i++) {
        const live = three ? i < 3 : four ? true : i === 0;
        chapterCard(
          ctx,
          api,
          i === 0 ? 'initial' : 'retry' + i,
          170 + i * 420,
          440,
          370,
          live ? themeColors.blue : themeColors.muted,
          120,
          32,
        );
      }
      chapterText(
        ctx,
        api,
        three
          ? '2 retries → up to 3 executions'
          : four
            ? '3 retries by default → up to 4 executions'
            : 'System-failure retry budget',
        960,
        680,
        36,
        themeColors.yellow,
        'center',
      );
      chapterCard(
        ctx,
        api,
        done('exception-false', 0)
          ? 'Python exception retry: false'
          : 'Python exception eligibility separate',
        380,
        820,
        1160,
        themeColors.pink,
        90,
        31,
      );
    } else if (currentBeat === 1) {
      chapterCard(ctx, api, 'Actor restarts', 170, 400, 700, themeColors.blue);
      chapterCard(ctx, api, 'Actor method retries', 1050, 400, 700, themeColors.cyan);
      chapterCard(ctx, api, 'Process 101 → process 202', 170, 630, 700, themeColors.yellow);
      chapterCard(
        ctx,
        api,
        done('separate-restart', 1)
          ? 'Failed method: no replay'
          : 'Method policy stays independent',
        1050,
        630,
        700,
        done('separate-restart', 1) ? themeColors.pink : themeColors.muted,
      );
      chapterText(
        ctx,
        api,
        'Both actor settings default to 0',
        960,
        910,
        35,
        themeColors.yellow,
        'center',
      );
    } else {
      chapterCard(ctx, api, 'External effect committed', 170, 420, 700, themeColors.green);
      chapterCard(ctx, api, 'Actor died before reply', 1050, 420, 700, themeColors.pink);
      arrow(ctx, api, 890, 470, 1020, 470, themeColors.yellow);
      if (done('once-error', 2))
        chapterCard(
          ctx,
          api,
          'Caller error · effect may exist',
          370,
          720,
          1180,
          themeColors.yellow,
          120,
          37,
        );
      chapterText(
        ctx,
        api,
        'Stable operation ID + stored result protects effect replay',
        960,
        940,
        31,
        themeColors.green,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'Task system failures, Python exceptions, actor recreation and method replay are four separate controls',
    );
  });
}
export default {
  id: 'retry-controls',
  draw: drawRetryControls,
  cues: [
    'ray-retry-controls-op-0',
    'ray-task-four',
    'ray-task-three',
    'ray-exception-false',
    'ray-retry-controls-op-1',
    'ray-separate-restart',
    'ray-retry-controls-op-2',
    'ray-once-error',
  ],
};
