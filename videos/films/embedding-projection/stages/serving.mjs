import { coreBox, coreCueVisible, coreText } from '../defaults.mjs';
export function drawServing(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    coreText(
      ctx,
      api,
      'One fitted transform · same encoder and metric',
      960,
      280,
      36,
      themeColors.ink,
    );
    coreBox(
      ctx,
      api,
      'Saved mean [2, 2]\nretained direction [1, 1] / √2',
      590,
      365,
      740,
      135,
      themeColors.yellow,
    );
    coreBox(ctx, api, 'Document [3, 3]', 170, 590, 640, 100, themeColors.blue);
    coreBox(ctx, api, 'Query [4, 4]', 1110, 590, 640, 100, themeColors.cyan);
    const done = currentBeat > 0 || coreCueVisible(ctx, api, 'serving-apply');
    if (done) {
      coreBox(ctx, api, 'Center [1, 1] → coordinate √2', 170, 755, 640, 100, themeColors.blue);
      coreBox(ctx, api, 'Center [2, 2] → coordinate 2√2', 1110, 755, 640, 100, themeColors.cyan);
    }
    if (currentBeat === 2)
      coreText(
        ctx,
        api,
        'Held-out judged queries + complete bytes + latency decide deployment',
        960,
        970,
        32,
        themeColors.green,
      );
    else
      coreText(
        ctx,
        api,
        'Reuse the saved artifact before normalization and scoring',
        960,
        970,
        31,
        themeColors.muted,
      );
  }
  return;
}
export default {
  id: 'serving',
  draw: drawServing,
  cues: [
    'serving-fit',
    'serving-save',
    'serving-apply',
    'serving-search-representation',
    'serving-beat-2-focus-1',
    'serving-beat-2-focus-2',
    'serving-beat-3-focus-1',
    'serving-beat-3-focus-2',
  ],
};
