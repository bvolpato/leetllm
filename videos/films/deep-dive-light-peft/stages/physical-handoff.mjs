import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterMatrix,
  chapterPanel,
  chapterStripe,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawPhysicalHandoff(ctx, scene, state, api) {
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
      'Three independent axes: base features, module placement, adapter rank',
    );
    focusScope(ctx, api, 'lp-feature-axes', () => {
      const selected = [0, 2, 3];
      if (!beat) {
        const ids = done('lp-axis-cut') ? selected : [0, 1, 2, 3];
        ['Q rows', 'K rows', 'V rows', 'O columns'].forEach((s, row) => {
          chapterText(ctx, api, themeColors, s, 200, 390 + row * 115, 29, themeColors.blue);
          ids.forEach((v, i) =>
            chapterPanel(
              ctx,
              api,
              themeColors,
              'H' + v,
              470 + i * 210,
              340 + row * 115,
              175,
              80,
              selected.includes(v) ? themeColors.green : themeColors.pink,
              30,
            ),
          );
        });
      } else
        chapterStripe(
          ctx,
          api,
          themeColors,
          ['H0', 'H2', 'H3'],
          570,
          350,
          'selected base feature IDs',
          undefined,
          themeColors.green,
          240,
          75,
        );
    });
    focusScope(ctx, api, 'lp-adapter-axes', () => {
      if (!beat)
        chapterText(
          ctx,
          api,
          themeColors,
          'Adapter feature axes follow the same original H IDs',
          960,
          850,
          31,
          themeColors.purple,
          'center',
        );
      else {
        chapterMatrix(
          ctx,
          api,
          themeColors,
          [
            ['H0', 'H2', 'H3'],
            ['H0', 'H2', 'H3'],
          ],
          320,
          580,
          'A feature columns · O input cut',
          themeColors.cyan,
          100,
        );
        chapterMatrix(
          ctx,
          api,
          themeColors,
          [
            ['H0', 'H0'],
            ['H2', 'H2'],
            ['H3', 'H3'],
          ],
          1240,
          580,
          'B feature rows · Q/K/V output cut',
          themeColors.purple,
          90,
        );
      }
    });
    focusScope(ctx, api, 'lp-load-order', () => {
      if (beat === 1)
        chapterText(
          ctx,
          api,
          themeColors,
          'base cuts → reserved keys → wrap / restore → paired rank cut',
          960,
          940,
          29,
          themeColors.yellow,
          'center',
        );
    });
    if (!beat)
      chapterFooter(
        ctx,
        api,
        themeColors,
        'FFN uses up output rows + down input columns; residual hidden width can stay fixed.',
      );
  }
}
export default {
  id: 'physical-handoff',
  draw: drawPhysicalHandoff,
  cues: ['lp-axis-cut', 'lp-ffn-axes', 'lp-adapter-axis', 'lp-load-order'],
};
