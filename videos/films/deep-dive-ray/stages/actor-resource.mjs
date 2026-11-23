import { rayChapterState, rayProgress } from '../construction.mjs';
import { chapterCard, chapterGrid, chapterText, footer, heading } from '../defaults.mjs';
export function drawActorResource(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('actor-resource', state),
    { b: currentBeat } = modelState,
    done = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat) === 1;
  api.focus.target('ray-actor-resource-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 2
        ? 'Default actor placement differs from an explicit lifetime CPU'
        : 'Two logical CPUs · explicit lifetime actor reservations',
    );
    if (currentBeat < 2) {
      const transfer = rayProgress(state, 'ray-actor-release', 1);
      const childRequested = currentBeat > 0 || rayProgress(state, 'ray-actor-child', 0) > 0;
      for (let i = 0; i < 2; i++) {
        if (i === 1 && transfer > 0 && !modelState.removed) {
          api.rect(ctx, 1020, 430, 700, 150, themeColors.panel, themeColors.muted, 4);
          continue;
        }
        const label =
          i === 0
            ? 'Actor L · CPU1'
            : modelState.removed
              ? 'Child task · CPU1'
              : modelState.held === 2
                ? 'Actor M · CPU1'
                : 'free';
        chapterCard(
          ctx,
          api,
          label,
          180 + i * 840,
          430,
          700,
          label === 'free'
            ? themeColors.muted
            : label.startsWith('Child')
              ? themeColors.green
              : themeColors.blue,
          150,
          33,
        );
      }
      if (childRequested) {
        chapterCard(ctx, api, 'L waits for child', 180, 700, 700, themeColors.yellow);
        if (!modelState.removed) {
          chapterCard(
            ctx,
            api,
            'Child request · 1 CPU',
            1020,
            700 - 270 * transfer,
            700,
            themeColors.yellow,
            150,
            33,
          );
        }
      }
      chapterText(
        ctx,
        api,
        modelState.childAdmitted
          ? '2 −1 actor −1 child =0 free'
          : transfer > 0
            ? 'Actor M releases its slot'
            : '2 − ' + modelState.held + ' reserved = ' + modelState.free + ' free',
        960,
        925,
        38,
        themeColors.yellow,
        'center',
      );
    } else {
      const doneDefault = done('actor-default', 2);
      chapterCard(ctx, api, 'Default actor · scheduling', 180, 440, 700, themeColors.blue);
      chapterCard(ctx, api, 'Default actor · running', 1020, 440, 700, themeColors.cyan);
      if (doneDefault) {
        chapterGrid(
          ctx,
          api,
          [['CPU1', 'placement token']],
          240,
          650,
          580,
          100,
          themeColors.blue,
          29,
        );
        chapterGrid(
          ctx,
          api,
          [['CPU0', 'running request']],
          1080,
          650,
          580,
          100,
          themeColors.cyan,
          29,
        );
      }
      chapterText(
        ctx,
        api,
        'Choose explicit resources for the real workload',
        960,
        920,
        34,
        themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'An explicit CPU reservation lasts for the life of the actor');
  });
}
export default {
  id: 'actor-resource',
  draw: drawActorResource,
  cues: [
    'ray-actor-resource-op-0',
    'ray-actor-two',
    'ray-actor-child',
    'ray-actor-held',
    'ray-actor-resource-op-1',
    'ray-actor-release',
    'ray-actor-resource-op-2',
    'ray-actor-default',
  ],
};
