import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterMatrix,
  chapterStripe,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawQuantizedVersusSliced(ctx, scene, state, api) {
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
      'Weight storage and executed dimensions are separate axes',
    );
    focusScope(ctx, api, 'lp-bits', () => {
      const narrow = q('lp-pack') > 0.6 || beat > 0;
      chapterText(
        ctx,
        api,
        themeColors,
        'Store each toy weight',
        470,
        350,
        30,
        themeColors.blue,
        'center',
      );
      for (let row = 0; row < 4; row++)
        for (let bit = 0; bit < 8; bit++)
          api.rect(
            ctx,
            230 + bit * 58,
            400 + row * 55,
            42,
            38,
            bit < (narrow ? 2 : 8) ? themeColors.blue : themeColors.panel,
            themeColors.muted,
            0,
          );
      chapterText(
        ctx,
        api,
        themeColors,
        narrow ? '2 bits / weight' : '8 bits / weight',
        470,
        680,
        30,
        themeColors.blue,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-shape', () => {
      const cut = beat === 1 && done('lp-slice');
      chapterMatrix(
        ctx,
        api,
        themeColors,
        Array.from(
          {
            length: cut ? 3 : 4,
          },
          () => [1, 2, 3, 4],
        ),
        1100,
        380,
        cut ? '3 × 4 after physical cut' : '4 × 4 tensor',
        cut ? themeColors.green : themeColors.cyan,
        74,
      );
      chapterText(
        ctx,
        api,
        themeColors,
        cut ? 'Physical shape: 3 × 4' : 'Quantized shape: 4 × 4',
        1260,
        795,
        29,
        cut ? themeColors.green : themeColors.cyan,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-slice', () => {
      if (beat === 1) {
        const cut = q('lp-slice');
        chapterText(
          ctx,
          api,
          themeColors,
          'Physical coordinate cut',
          470,
          760,
          31,
          themeColors.green,
          'center',
        );
        chapterStripe(
          ctx,
          api,
          themeColors,
          ['0', '1', '2', '3'],
          220,
          810,
          'selected rows',
          cut > 0.6 ? [0, 2, 3] : [0, 1, 2, 3],
          themeColors.green,
          110,
          70,
        );
        chapterText(
          ctx,
          api,
          themeColors,
          cut > 0.95 ? '3 × 4: fewer rows execute' : 'Choose original coordinate IDs',
          1260,
          885,
          29,
          themeColors.green,
          'center',
        );
      }
    });
    focusScope(ctx, api, 'lp-scope', () =>
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Toy bit widths · Light-PEFT + QLoRA combination was not benchmarked in this paper.',
      ),
    );
  }
}
export default {
  id: 'quantized-versus-sliced',
  draw: drawQuantizedVersusSliced,
  cues: ['lp-pack', 'lp-same-shape', 'lp-slice', 'lp-combination'],
};
