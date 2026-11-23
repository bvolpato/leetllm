import { mechanismEquation, mechanismFocus, mechanismText } from '../defaults.mjs';
export function drawTrainingCompute(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress2 = Math.max(0, Math.min(1, state.beatP ?? 0));
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, 'training-compute-mechanism', () => {
    const progress = currentBeat < 2 ? 0 : api.focus.progress('training-compute-beat-3-focus-1', 0),
      n = 7 + 7 * progress,
      d = 980 / n,
      w = n * 60,
      h = d * 3,
      baseY = 935;
    mechanismFocus(ctx, api, 'training-compute-simulation-47', () => {
      mechanismEquation(ctx, api, String.raw`C\approx6ND`, 960, 285, 53, themeColors.yellow);
      mechanismText(
        ctx,
        api,
        currentBeat === 0
          ? 'Equal-area dense-training planning worksheet'
          : 'Equal-area worksheet · estimated C = 5.88 zettaFLOPs',
        960,
        395,
        33,
        themeColors.muted,
        'center',
      );
      api.rect(ctx, 450, baseY - h, w, h, themeColors.blue + '55', themeColors.blue, 3);
      api.line(ctx, 450, baseY, 1500, baseY, themeColors.muted, 3);
      api.line(ctx, 450, baseY, 450, 450, themeColors.muted, 3);
      mechanismText(
        ctx,
        api,
        n.toFixed(1) + 'B parameters',
        450 + w / 2,
        1010,
        34,
        themeColors.blue,
        'center',
      );
    });
    mechanismFocus(
      ctx,
      api,
      'training-compute-object-row-tokens-1e9-tofixed-0-b-training-tokens-49',
      () =>
        mechanismText(
          ctx,
          api,
          d.toFixed(0) + 'B tokens',
          280,
          baseY - h / 2,
          34,
          themeColors.cyan,
          'center',
        ),
    );
    mechanismText(
      ctx,
      api,
      currentBeat === 2
        ? 'Double width → halve height · area stays fixed'
        : 'N = 7B · D = 140B · 6 × 7B × 140B',
      1120,
      465,
      29,
      themeColors.yellow,
      'center',
    );
  });
  return;
}
export default {
  id: 'training-compute',
  draw: drawTrainingCompute,
  cues: [
    'training-compute-beat-1-focus-1',
    'training-compute-beat-2-focus-1',
    'training-compute-beat-3-focus-1',
    'training-compute-beat-3-focus-2',
  ],
};
