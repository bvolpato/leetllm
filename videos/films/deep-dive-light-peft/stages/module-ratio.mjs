import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterMath,
  chapterMatrix,
  chapterPanel,
  chapterSubtitle,
  focusScope,
} from '../defaults.mjs';
export function drawModuleRatio(ctx, scene, state, api) {
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
      beat === 2
        ? 'Invalid measurement must remain distinguishable from quietness'
        : 'Output-change magnitude / baseline magnitude',
    );
    if (beat < 2) {
      focusScope(ctx, api, 'lp-norm', () => {
        chapterMatrix(
          ctx,
          api,
          themeColors,
          [[6, 8]],
          310,
          430,
          'baseline coordinates',
          themeColors.blue,
          110,
        );
        chapterMatrix(
          ctx,
          api,
          themeColors,
          [[0.3, 0.4]],
          1150,
          430,
          'adapter change',
          themeColors.purple,
          110,
        );
        if (beat > 0 || done('lp-norm-base'))
          chapterMath(
            ctx,
            api,
            themeColors,
            String.raw`\sqrt{6^2+8^2}=10`,
            470,
            690,
            41,
            themeColors.blue,
          );
        if (beat > 0 || done('lp-norm-delta'))
          chapterMath(
            ctx,
            api,
            themeColors,
            String.raw`\sqrt{0.3^2+0.4^2}=0.5`,
            1320,
            690,
            41,
            themeColors.purple,
          );
      });
      focusScope(ctx, api, 'lp-ratio', () =>
        chapterMath(
          ctx,
          api,
          themeColors,
          beat > 0 || done('lp-module-ratio')
            ? String.raw`\rho=0.5/10=0.05`
            : String.raw`\rho=\|\Delta y\|_2/\|y_{base}\|_2`,
          960,
          840,
          44,
        ),
      );
      focusScope(ctx, api, 'lp-token-mean', () => {
        if (beat === 1)
          chapterFooter(
            ctx,
            api,
            themeColors,
            'Mean over non-padding tokens · numerator includes scale/dropout; base denominator includes bias.',
          );
      });
      if (!beat) chapterFooter(ctx, api, themeColors, 'L2 norm: square, sum, then square root.');
    } else
      focusScope(ctx, api, 'lp-invalid', () => {
        chapterPanel(
          ctx,
          api,
          themeColors,
          'baseline [0,0] · norm 0',
          210,
          410,
          650,
          120,
          themeColors.blue,
          33,
        );
        chapterPanel(
          ctx,
          api,
          themeColors,
          'change [0,0] · norm 0',
          1060,
          410,
          650,
          120,
          themeColors.purple,
          33,
        );
        chapterMath(
          ctx,
          api,
          themeColors,
          String.raw`0/0\rightarrow\text{non-finite}`,
          960,
          650,
          46,
          themeColors.pink,
        );
        chapterPanel(
          ctx,
          api,
          themeColors,
          done('lp-sanitize')
            ? 'saved score 0 · invalid observations: 1'
            : 'raw invalid measurement · investigate',
          470,
          785,
          980,
          110,
          themeColors.pink,
          32,
        );
        chapterFooter(
          ctx,
          api,
          themeColors,
          'Changing an invalid value to zero does not create evidence for deletion.',
        );
      });
  }
}
export default {
  id: 'module-ratio',
  draw: drawModuleRatio,
  cues: [
    'lp-norm-base',
    'lp-norm-delta',
    'lp-module-ratio',
    'lp-nonpadding',
    'lp-invalid',
    'lp-sanitize',
  ],
};
