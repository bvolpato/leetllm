import { historyFixture, spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterLine,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawHistorySanitization(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    const h = historyFixture();
    chapterSubtitle(ctx, api, themeColors, 'Retain observation time and invalid-count identity');
    focusScope(ctx, api, 'lp-history', () => {
      h.history.forEach((v, i) => {
        const color =
          i < 3 ? themeColors.muted : Number.isFinite(v) ? themeColors.cyan : themeColors.pink;
        chapterPanel(
          ctx,
          api,
          themeColors,
          Number.isFinite(v) ? v.toFixed(1) : 'invalid',
          175 + i * 265,
          435,
          235,
          115,
          color,
          34,
        );
        chapterText(ctx, api, themeColors, String(i + 1), 292 + i * 265, 610, 29, color, 'center');
      });
      chapterLine(ctx, api, themeColors, 970, 665, 1720, 665, themeColors.yellow, 4);
      chapterText(
        ctx,
        api,
        themeColors,
        'later half: observations 4–6',
        1330,
        740,
        31,
        themeColors.yellow,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-history-mean', () => {
      if (beat === 1) {
        chapterText(
          ctx,
          api,
          themeColors,
          done('lp-invalid-mean')
            ? 'zero-fill: (.2 + 0 + .4) / 3 = .2'
            : 'zero-fill: denominator 3',
          540,
          850,
          29,
          themeColors.pink,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          done('lp-dropped-mean') ? 'drop: (.2 + .4) / 2 = .3' : 'drop: denominator 2',
          1370,
          850,
          29,
          themeColors.cyan,
          'center',
        );
      } else
        chapterText(
          ctx,
          api,
          themeColors,
          'Backbone arrays: final step · module/rank: later-half mean',
          960,
          875,
          31,
          themeColors.blue,
          'center',
        );
    });
    chapterFooter(
      ctx,
      api,
      themeColors,
      'One invalid observation remains in the receipt under either arithmetic choice.',
    );
  }
}
export default {
  id: 'history-sanitization',
  draw: drawHistorySanitization,
  cues: ['lp-window', 'lp-invalid-mean', 'lp-dropped-mean'],
};
