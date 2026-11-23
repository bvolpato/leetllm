import { bounded } from '../arithmetic.mjs';
import { drawExpandedText, drawExpandedTile, drawExpandedTitle } from '../defaults.mjs';
export function drawWeightedDdp(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z),
    cue = (id, a = 0.1, z = 0.8) => {
      const c = state.cues?.[id];
      return c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : bounded(c.progress)
        : cueProgress(a, z);
    };
  {
    drawExpandedTitle(ctx, api, 'Same four targets · squared loss at prediction w = 0');
    const rows = [[1], [3, 3, 3]],
      colors = [themeColors.blue, themeColors.pink];
    rows.forEach((targets, r) => {
      const y = 400 + r * 240;
      drawExpandedText(ctx, api, 'Rank ' + r, 200, y + 45, 33, colors[r]);
      targets.forEach((v, j) =>
        drawExpandedTile(
          ctx,
          api,
          'y=' + v + ' · g=' + -2 * v,
          430 + j * 250,
          y,
          220,
          85,
          colors[r],
        ),
      );
      const factor = currentBeat === 2 ? (r === 0 ? 0.5 : 1.5) : 1;
      drawExpandedText(ctx, api, 'local mean ' + -2 * targets[0], 1350, y + 35, 30, colors[r]);
      if (currentBeat === 2)
        drawExpandedText(
          ctx,
          api,
          '× ' + factor + ' = ' + -2 * targets[0] * factor,
          1350,
          y + 100,
          32,
          themeColors.yellow,
        );
    });
    if (currentBeat === 0)
      drawExpandedText(
        ctx,
        api,
        'Input batches must be assigned by the data pipeline',
        960,
        930,
        34,
        themeColors.muted,
        'center',
      );
    if (currentBeat === 1) {
      const split = cueProgress(0.15, 0.65);
      drawExpandedText(
        ctx,
        api,
        'Equal rank mean: (−2 − 6) / 2 = −4',
        960,
        875,
        38,
        themeColors.pink,
        'center',
      );
      if (split > 0.9)
        drawExpandedText(
          ctx,
          api,
          'Pooled target mean: (−2 − 6 − 6 − 6) / 4 = −5',
          960,
          985,
          38,
          themeColors.green,
          'center',
        );
    }
    if (currentBeat === 2) {
      const done = cue('weighted-average');
      drawExpandedText(
        ctx,
        api,
        'N × local valid count / global valid count',
        960,
        850,
        36,
        themeColors.yellow,
        'center',
      );
      api.focus.target('weighted-result', () =>
        drawExpandedText(
          ctx,
          api,
          done > 0.8 ? '((−2 × 0.5) + (−6 × 1.5)) / 2 = −5' : 'Weighted rank average = ?',
          960,
          950,
          42,
          themeColors.green,
          'center',
        ),
      );
      drawExpandedText(
        ctx,
        api,
        'Count valid targets across the whole update; coordinate an empty-update skip',
        960,
        1030,
        27,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'weighted-ddp',
  draw: drawWeightedDdp,
  cues: ['weighted-average'],
};
