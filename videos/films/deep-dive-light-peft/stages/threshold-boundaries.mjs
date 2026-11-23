import { keepAbove } from '../arithmetic.mjs';
import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterMath,
  chapterStripe,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawThresholdBoundaries(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      beat
        ? 'Raw helper at ratio 0 versus the caller skip'
        : 'Linear interpolation + strict greater-than selection',
    );
    focusScope(ctx, api, 'lp-threshold', () => {
      const ties = beat === 0 && done('lp-ties'),
        values = ties ? [0.6, 0.6, 0.6, 0.6] : [0.2, 0.2, 0.2, 0.8],
        ratio = beat ? 0 : 0.25,
        r = keepAbove(values, ratio);
      chapterStripe(
        ctx,
        api,
        themeColors,
        values.map((v) => v.toFixed(1)),
        410,
        410,
        ties ? 'all-equal supplied case' : 'sorted supplied case',
        r.kept,
        themeColors.green,
        240,
        100,
      );
      chapterMath(
        ctx,
        api,
        themeColors,
        String.raw`(n-1)q=3\cdot${ratio}=${3 * ratio}\quad;\quad Q=${r.threshold.toFixed(1)}`,
        960,
        630,
        41,
      );
      chapterText(
        ctx,
        api,
        themeColors,
        'keep score > cutoff · ' + r.kept.length + ' survivors',
        960,
        745,
        35,
        r.kept.length ? themeColors.green : themeColors.pink,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-zero', () => {
      if (beat === 1) {
        const caller = done('lp-zero-caller');
        chapterText(
          ctx,
          api,
          themeColors,
          caller
            ? 'Caller ratio 0: skip helper → keep all 4'
            : 'Raw helper ratio 0: cutoff .2 → drop all three minima',
          960,
          885,
          31,
          caller ? themeColors.green : themeColors.pink,
          'center',
        );
      }
    });
    chapterFooter(
      ctx,
      api,
      themeColors,
      'Ratio 1 keeps none · check actual IDs, non-finite input and legal empty structures.',
    );
  }
}
export default {
  id: 'threshold-boundaries',
  draw: drawThresholdBoundaries,
  cues: ['lp-strict', 'lp-ties', 'lp-zero-helper', 'lp-zero-caller'],
};
