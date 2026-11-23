import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawText } from '../defaults.mjs';
export function drawCacheEconomics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-cache-economics-${i}-${j}`;
    if (state.cues && !Object.hasOwn(state.cues, key))
      throw Error('Unknown voice narration cue: ' + key);
    return state.cues?.[key];
  };
  const cueVisible = (i, j) => {
    const c = cue(i, j);
    return c ? c.phase !== 'before' : currentBeat > i || (currentBeat === i && beatProgress > 0.02);
  };
  const cueComplete = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after' || c.progress >= 1
      : currentBeat > i || (currentBeat === i && beatProgress > 0.98);
  };
  const withStageFocus = (name, paint) => api.focus.target(`va-cache-economics-${name}`, paint);
  {
    withStageFocus('buckets', () => {
      drawText(
        ctx,
        api,
        'Disjoint text-input buckets · supplied prices',
        150,
        290,
        30,
        themeColors.blue,
      );
      m.costRows.forEach((r, i) => {
        const y = 350 + i * 150;
        drawBox(
          ctx,
          api,
          150,
          y,
          r.tokens * 0.75,
          70,
          [themeColors.cyan, themeColors.yellow, themeColors.blue][i],
        );
        drawText(
          ctx,
          api,
          r.name,
          950,
          y + 43,
          29,
          [themeColors.cyan, themeColors.yellow, themeColors.blue][i],
        );
        if (cueVisible(1, 0))
          drawText(
            ctx,
            api,
            r.tokens + ' × $' + r.rate.toFixed(2) + ' / million',
            1190,
            y + 43,
            28,
            themeColors.ink,
          );
      });
    });
    withStageFocus('products', () => {
      drawText(ctx, api, 'count × its rate', 150, 850, 30, themeColors.yellow);
      if (cueComplete(1, 1))
        drawText(ctx, api, 'numerator = 400 + 1250 + 400 = 2050', 660, 850, 32, themeColors.yellow);
    });
    withStageFocus('input-total', () => {
      const c = state.cues?.['va-cache-economics-1-input-cost'];
      const ready = c ? c.phase === 'after' : currentBeat >= 2;
      drawText(
        ctx,
        api,
        ready ? '$0.00205 text input' : 'divide numerator by 1,000,000',
        150,
        930,
        34,
        ready ? themeColors.green : themeColors.muted,
      );
    });
    withStageFocus('other-billing', () => {
      if (cueVisible(1, 2))
        drawText(
          ctx,
          api,
          'Supplied prices · input subtotal',
          1700,
          880,
          27,
          themeColors.muted,
          'right',
        );
      if (cueVisible(1, 3))
        drawText(
          ctx,
          api,
          '+ text output + audio input/output (their own units)',
          1700,
          930,
          27,
          themeColors.muted,
          'right',
        );
    });
  }
}
export default {
  id: 'cache-economics',
  draw: drawCacheEconomics,
  cues: [
    'va-cache-economics-0-0',
    'va-cache-economics-0-1',
    'va-cache-economics-0-2',
    'va-cache-economics-0-3',
    'va-cache-economics-1-0',
    'va-cache-economics-1-1',
    'va-cache-economics-1-input-cost',
    'va-cache-economics-1-2',
    'va-cache-economics-1-3',
    'va-cache-economics-2-0',
    'va-cache-economics-2-1',
    'va-cache-economics-2-2',
  ],
};
