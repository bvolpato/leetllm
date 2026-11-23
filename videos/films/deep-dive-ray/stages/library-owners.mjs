import { rayClamp, rayMix } from '../arithmetic.mjs';
import { rayChapterState } from '../construction.mjs';
import {
  arrow,
  chapterCard,
  chapterGrid,
  chapterText,
  footer,
  heading,
  packet,
} from '../defaults.mjs';
export function drawLibraryOwners(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('library-owners', state),
    { b: currentBeat, p: progress } = modelState;
  api.focus.target('ray-library-owners-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Data blocks obey a consumer’s backpressure'
        : currentBeat === 1
          ? 'Train coordinates workers; Tune coordinates trials'
          : 'Sampling, learning and model serving keep their own contracts',
    );
    if (currentBeat === 0) {
      chapterCard(ctx, api, 'Dataset blocks', 160, 400, 520, themeColors.blue);
      chapterCard(ctx, api, 'Batch transform', 1230, 400, 520, themeColors.cyan);
      for (let i = 0; i < 4; i++) {
        const q = rayClamp(progress * 4 - i);
        if (q > 0)
          packet(ctx, api, 'block' + i, rayMix(230, 1350, q), 540 + i * 85, themeColors.cyan, 200);
      }
      chapterText(
        ctx,
        api,
        'Slow sink retains ready blocks → upstream admission waits',
        960,
        905,
        32,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const stage = Math.min(3, Math.floor(progress * 4)),
        labels = [
          ['Owner', 'Worker / trial0', 'Worker / trial1', 'Recorded artifact'],
          [
            'Train',
            stage < 1 ? 'compute pending' : 'gradient ready',
            stage < 2 ? 'compute pending' : 'gradient ready',
            stage < 3 ? 'checkpoint pending' : 'checkpoint saved',
          ],
          [
            'Tune',
            stage < 1 ? 'trial queued' : 'metric reported',
            stage < 2 ? 'trial queued' : 'metric reported',
            stage < 3 ? 'policy waiting' : 'search / stop decision',
          ],
        ];
      chapterGrid(ctx, api, labels, 150, 400, 1600, 350, themeColors.blue, 27);
      chapterText(
        ctx,
        api,
        'Illustrative orchestration state; model and objective correctness stay external',
        960,
        900,
        29,
        themeColors.yellow,
        'center',
      );
    } else {
      chapterCard(ctx, api, 'RLlib sampling workers', 170, 390, 700, themeColors.blue);
      chapterCard(ctx, api, 'Serve request ingress', 1050, 390, 700, themeColors.cyan);
      chapterCard(ctx, api, 'Learner · consumes sample batch', 170, 720, 700, themeColors.blue);
      chapterCard(ctx, api, 'Selected engine replica', 1050, 720, 700, themeColors.cyan);
      const y = rayMix(520, 625, progress);
      packet(ctx, api, 'sample batch', 400, y, themeColors.blue, 240);
      packet(ctx, api, 'request R7', 1280, y, themeColors.cyan, 240);
      arrow(ctx, api, 520, 490, 520, y - 8, themeColors.blue);
      arrow(ctx, api, 1400, 490, 1400, y - 8, themeColors.cyan);
      arrow(ctx, api, 520, y + 73, 520, 710, themeColors.blue);
      arrow(ctx, api, 1400, y + 73, 1400, 710, themeColors.cyan);
      chapterText(
        ctx,
        api,
        'Application: reward / environment',
        520,
        930,
        27,
        themeColors.yellow,
        'center',
      );
      chapterText(
        ctx,
        api,
        'Engine: token work / kernels',
        1400,
        930,
        27,
        themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'Higher-level libraries compose the same task, actor and reference runtime');
  });
}
export default {
  id: 'library-owners',
  draw: drawLibraryOwners,
  cues: ['ray-library-owners-op-0', 'ray-library-owners-op-1', 'ray-library-owners-op-2'],
};
