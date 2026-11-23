import { cueDone } from '../construction.mjs';
import { SERVICE_CHECK } from '../model.mjs';
import { chapterText, focusTargets, footer, panel } from '../defaults.mjs';
export function drawRecoveryBoundary(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const z = SERVICE_CHECK;
    focusTargets(ctx, api, ['recovery-both'], () => {
      chapterText(
        ctx,
        api,
        `Successful p95: ${z.successfulP95Ms} < ${z.latencyLimitMs} ms`,
        960,
        345,
        35,
        themeColors.green,
        'center',
      );
      chapterText(
        ctx,
        api,
        `All attempts: ${z.attempts - z.timeouts} / ${z.attempts} = ${100 * z.successFraction}% < 99%`,
        960,
        440,
        35,
        themeColors.pink,
        'center',
      );
      chapterText(ctx, api, 'PASS and FAIL → HOLD', 960, 540, 41, themeColors.pink, 'center');
    });
    focusTargets(ctx, api, ['recovery-route'], () => {
      panel(ctx, api, 200, 655, 620, 125, themeColors.blue);
      panel(ctx, api, 1100, 655, 620, 125, themeColors.purple);
      chapterText(
        ctx,
        api,
        'Old path serves later requests',
        510,
        730,
        30,
        themeColors.blue,
        'center',
      );
      chapterText(
        ctx,
        api,
        'Candidate share returns to 0',
        1410,
        730,
        29,
        themeColors.purple,
        'center',
      );
    });
    focusTargets(ctx, api, ['recovery-effect'], () => {
      const done = currentBeat > 1 || cueDone(state, 'recovery-effect', 1, 0.55);
      panel(ctx, api, 450, 845, 1020, 95, themeColors.yellow);
      chapterText(
        ctx,
        api,
        done
          ? 'Existing audit record remains after route rollback'
          : 'Completed effect: audit record',
        960,
        905,
        32,
        themeColors.yellow,
        'center',
      );
    });
    footer(
      ctx,
      api,
      'Future request routing and recovery of completed effects are distinct contracts',
    );
  }
}
export default {
  id: 'recovery-boundary',
  draw: drawRecoveryBoundary,
  cues: ['recovery-both', 'recovery-route', 'recovery-effect'],
};
