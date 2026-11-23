import { ciDone, ciProgress, codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawLine,
  drawMovingCard,
} from '../defaults.mjs';
export function drawSchedulerWorkers(ctx, scene, state, api) {
  api.focus.target('ci-scheduler-workers-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('scheduler-workers', state),
      currentBeat = modelState.beat,
      progress2 = modelState.p,
      q = modelState.q;
    {
      drawHeading(
        ctx,
        api,
        currentBeat === 0
          ? 'Claim under the condition, work outside, publish back inside'
          : 'Ran and exhausted is failed; never ready is blocked',
      );
      const progress = q,
        phaseIndex = Math.min(3, Math.floor(progress * 4)),
        published = currentBeat === 0 && ciDone(state, 'ci-scheduler-workers-publish'),
        returning =
          currentBeat === 1 ||
          (state.cues?.['ci-scheduler-workers-publish']
            ? state.cues['ci-scheduler-workers-publish'].phase !== 'before'
            : q > 0.5);
      drawLine(ctx, api, 200, 370, 800, 370, themeColors.yellow);
      drawLine(ctx, api, 200, 370, 200, 850, themeColors.yellow);
      drawLine(ctx, api, 200, 850, 800, 850, themeColors.yellow);
      drawLine(ctx, api, 800, 370, 800, 580, themeColors.yellow);
      drawLine(ctx, api, 800, 740, 800, 850, themeColors.yellow);
      drawChapterText(
        ctx,
        api,
        'condition-protected state',
        500,
        420,
        29,
        themeColors.yellow,
        'center',
      );
      drawChapterCard(
        ctx,
        api,
        published ? 'ready heap: deploy' : phaseIndex ? 'ready heap: empty' : 'ready heap: test',
        250,
        480,
        500,
        90,
        themeColors.cyan,
        28,
      );
      drawChapterCard(
        ctx,
        api,
        published ? 'deploy remaining: 0' : 'deploy remaining: 1',
        250,
        690,
        500,
        90,
        themeColors.yellow,
        28,
      );
      drawChapterCard(
        ctx,
        api,
        currentBeat === 1
          ? 'test: failed receipt'
          : phaseIndex > 1
            ? 'test result receipt'
            : 'worker executes test',
        1120,
        440,
        600,
        120,
        themeColors.blue,
        33,
      );
      drawMovingCard(
        ctx,
        api,
        currentBeat === 1 ? 'test: failed' : returning ? 'test: success' : 'test ID',
        returning ? 1190 : 330,
        590,
        returning ? 330 : 1190,
        590,
        currentBeat === 1
          ? q
          : returning
            ? ciProgress(state, 'ci-scheduler-workers-publish')
            : Math.min(1, q * 2),
        themeColors.cyan,
        280,
      );
      if (currentBeat === 0)
        drawChapterCard(
          ctx,
          api,
          ciDone(state, 'ci-scheduler-workers-publish')
            ? 'publish success → wake + recheck'
            : 'outcome publication pending',
          1050,
          830,
          700,
          90,
          themeColors.green,
          29,
        );
      else {
        drawChapterCard(
          ctx,
          api,
          'test ran · attempts exhausted → FAILED',
          220,
          895,
          730,
          85,
          themeColors.pink,
          27,
        );
        drawChapterCard(
          ctx,
          api,
          'deploy never ready → BLOCKED',
          1020,
          895,
          700,
          85,
          themeColors.muted,
          27,
        );
      }
      drawFooter(
        ctx,
        api,
        'The actual article scheduler is sequential; this is the required concurrent handoff',
      );
    }
  });
}
export default {
  id: 'scheduler-workers',
  draw: drawSchedulerWorkers,
  cues: [
    'ci-scheduler-workers-0-build',
    'ci-scheduler-workers-publish',
    'ci-scheduler-workers-1-build',
  ],
};
