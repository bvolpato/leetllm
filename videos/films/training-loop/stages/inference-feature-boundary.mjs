import { loopBound } from '../arithmetic.mjs';
import { loopCueStarted } from '../construction.mjs';
import { arrow, box, footer, heading } from '../defaults.mjs';
export function drawInferenceFeatureBoundary(ctx, scene, state, api) {
  api.focus.target('inference-feature-boundary-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = loopBound(state.beatP ?? 0);
    const cueStarted = (name, fallback = progress > 0.4) =>
      loopCueStarted(state.cues, name, fallback);
    {
      const repaired =
        currentBeat > 1 ||
        (currentBeat === 1 && cueStarted('loop-inference-clone', progress > 0.65));
      heading(
        ctx,
        api,
        'Extracted constants can cross a boundary without reconnecting the extractor',
      );
      box(ctx, api, 'frozen extractor', 190, 400, 520, 100, themeColors.blue, 33);
      box(ctx, api, 'inference features [−.27,.27]', 1000, 400, 740, 100, themeColors.yellow, 31);
      arrow(ctx, api, 750, 450, 960, 450, themeColors.blue);
      arrow(ctx, api, 1370, 525, 1370, 660, repaired ? themeColors.green : themeColors.red);
      box(
        ctx,
        api,
        repaired ? 'clone outside inference mode' : 'head cannot save inference tensor',
        880,
        690,
        900,
        100,
        repaired ? themeColors.green : themeColors.red,
        31,
      );
      box(
        ctx,
        api,
        repaired ? 'head gradients available' : 'head backward blocked',
        190,
        800,
        560,
        95,
        repaired ? themeColors.green : themeColors.red,
        30,
      );
      footer(
        ctx,
        api,
        'The clone creates ordinary constants; it does not restore the missing extractor graph',
      );
    }
    return true;
  });
}
export default {
  id: 'inference-feature-boundary',
  draw: drawInferenceFeatureBoundary,
  cues: [
    'inference-feature-boundary-beat-0',
    'inference-feature-boundary-beat-1',
    'loop-inference-clone',
    'inference-feature-boundary-beat-2',
  ],
};
