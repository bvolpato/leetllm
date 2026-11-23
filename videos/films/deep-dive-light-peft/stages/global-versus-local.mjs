import { quantile } from '../arithmetic.mjs';
import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawGlobalVersusLocal(ctx, scene, state, api) {
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
      'Same total capacity · different competition populations',
    );
    const layer = (id, scores, y, global, target) =>
      focusScope(ctx, api, target, () => {
        const threshold = global ? 0.5 : quantile(scores, 0.5);
        chapterText(ctx, api, themeColors, 'Layer ' + id, 190, y + 30, 31, themeColors.blue);
        scores.forEach((v, i) => {
          const col = v > threshold ? themeColors.green : themeColors.pink;
          chapterPanel(
            ctx,
            api,
            themeColors,
            id + i + ' · ' + v.toFixed(1),
            490 + i * 330,
            y - 20,
            260,
            95,
            col,
            32,
          );
        });
        chapterText(
          ctx,
          api,
          themeColors,
          'cutoff ' + threshold.toFixed(2),
          1300,
          y + 35,
          31,
          themeColors.yellow,
        );
      });
    const global = beat === 0 && !done('lp-local-cut');
    layer('A', [0.1, 0.2], 430, global, global ? 'lp-global' : 'lp-local');
    layer('B', [0.8, 0.9], 650, global, global ? 'lp-global' : 'lp-local');
    focusScope(ctx, api, global ? 'lp-local' : 'lp-global', () =>
      chapterText(
        ctx,
        api,
        themeColors,
        global ? 'Global: keep 0 in A, 2 in B' : 'Layer-wise: keep 1 in A, 1 in B',
        960,
        840,
        34,
        themeColors.green,
        'center',
      ),
    );
    focusScope(ctx, api, 'lp-competition', () =>
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Both retain 2 of 4 · the selected functions and widths differ.',
      ),
    );
  }
}
export default {
  id: 'global-versus-local',
  draw: drawGlobalVersusLocal,
  cues: ['lp-global-cut', 'lp-local-cut', 'lp-competition'],
};
