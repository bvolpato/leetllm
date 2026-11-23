import { complete, paddedWorkingSet, sentence } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterFooter,
  drawChapterGrid,
  drawChapterText,
  drawChapterValues,
} from '../defaults.mjs';
export function drawFreshPlan(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'fresh-plan', beat, index),
    resultComplete = (beat, index) => complete(state, 'fresh-plan', beat, index);
  api.focus.target('fresh-plan-construction', () => {
    drawFreshPlan();
  });
  function drawFreshPlan() {
    const ws = paddedWorkingSet([7, 11, 5], 3, currentBeat > 0 ? [1, 0] : []),
      residentDone = resultComplete(1, 0),
      gatherDone = resultComplete(1, 1),
      prefetchDone = resultComplete(1, 2);
    drawChapterText(
      ctx,
      api,
      'New worksheet · N = 3 · parameter-only budget = 30 elements',
      960,
      285,
      34,
      themeColors.yellow,
      'center',
    );
    drawChapterValues(ctx, api, 'Logical tensor lengths', [7, 11, 5], 345, themeColors.blue);
    drawChapterValues(
      ctx,
      api,
      'Retained local shards',
      residentDone ? ws.shards : ['?', '?', '?'],
      505,
      themeColors.blue,
    );
    const gatherProgress = sentenceProgress(1, 1),
      prefetchProgress = sentenceProgress(1, 2);
    drawChapterText(ctx, api, 'Full gather L1', 150, 735, 29, themeColors.cyan);
    if (gatherProgress > 0)
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 12,
            },
            (_, i) => (i < Math.floor(gatherProgress * 12) ? (i < 11 ? 'p' + i : 'pad') : ''),
          ),
        ],
        660,
        675,
        1070,
        85,
        themeColors.cyan,
        26,
      );
    else
      drawChapterCard(
        ctx,
        api,
        'Separate full allocation · predict its capacity',
        660,
        675,
        1070,
        themeColors.muted,
        85,
        29,
      );
    drawChapterText(ctx, api, 'Prefetch L0', 150, 865, 29, themeColors.pink);
    if (prefetchProgress > 0)
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 9,
            },
            (_, i) => (i < Math.floor(prefetchProgress * 9) ? (i < 7 ? 'p' + i : 'pad') : ''),
          ),
        ],
        660,
        805,
        1070,
        85,
        themeColors.pink,
        28,
      );
    else
      drawChapterCard(
        ctx,
        api,
        'Additional full allocation · predict its capacity',
        660,
        805,
        1070,
        themeColors.muted,
        85,
        29,
      );
    const total = prefetchDone ? 30 : gatherDone ? 21 : residentDone ? 9 : null;
    if (total !== null)
      drawChapterText(
        ctx,
        api,
        'Live parameter elements: ' +
          (prefetchDone ? '9 + 12 + 9 = 30' : gatherDone ? '9 + 12 = 21' : '3 + 4 + 2 = 9'),
        960,
        970,
        38,
        prefetchDone ? themeColors.green : themeColors.yellow,
        'center',
      );
    else
      drawChapterFooter(
        ctx,
        api,
        'Predict resident + full gather + full prefetch · answers held',
        970,
        themeColors.yellow,
      );
    if (currentBeat === 2)
      drawChapterFooter(
        ctx,
        api,
        'The 30 parameter elements stay live · gradients, optimizer, activations and workspace need more capacity',
        1040,
        themeColors.pink,
      );
  }
}
export default {
  id: 'fresh-plan',
  draw: drawFreshPlan,
  cues: [
    'ds-fresh-plan-b0-s0',
    'ds-fresh-plan-b0-s1',
    'ds-fresh-plan-b0-s2',
    'ds-fresh-plan-b0-s3',
    'ds-fresh-plan-b0-s4',
    'ds-fresh-plan-b0-s5',
    'ds-fresh-plan-b0-s6',
    'ds-fresh-plan-b1-s0',
    'ds-fresh-plan-b1-s1',
    'ds-fresh-plan-b1-s2',
    'ds-fresh-plan-b1-s3',
    'ds-fresh-plan-b2-s0',
    'ds-fresh-plan-b2-s1',
    'ds-fresh-plan-b2-s2',
    'ds-fresh-plan-b2-s3',
  ],
};
