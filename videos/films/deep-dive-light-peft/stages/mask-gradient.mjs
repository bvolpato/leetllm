import { spokenProgress } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterMath,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawMaskGradient(ctx, scene, state, api) {
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
      beat === 1
        ? 'Supplied scalar toy · one gradient step'
        : 'Train a gate first; select a shape later',
    );
    focusScope(ctx, api, 'lp-gate', () => {
      const gate = beat > 1 || (beat === 1 && done('lp-gate-update')) ? 0.59 : 1;
      chapterPanel(ctx, api, themeColors, 'head output 2', 220, 380, 375, 95, themeColors.blue);
      chapterPanel(
        ctx,
        api,
        themeColors,
        'gate m = ' + gate.toFixed(2),
        760,
        380,
        375,
        95,
        themeColors.yellow,
      );
      chapterPanel(
        ctx,
        api,
        themeColors,
        'output ' + (2 * gate).toFixed(2),
        1300,
        380,
        375,
        95,
        themeColors.green,
      );
      chapterArrow(ctx, api, themeColors, 610, 425, 730, 425, themeColors.blue);
      chapterArrow(ctx, api, themeColors, 1150, 425, 1270, 425, themeColors.yellow);
      chapterText(
        ctx,
        api,
        themeColors,
        'softmax + dropout → scalar gate → multiply V',
        960,
        560,
        31,
        themeColors.blue,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-gradient', () => {
      if (beat === 1) {
        chapterMath(ctx, api, themeColors, String.raw`\ell(m)=\tfrac12(2m)^2+0.1|m|`, 960, 675, 44);
        chapterText(
          ctx,
          api,
          themeColors,
          done('lp-task-grad') ? 'task derivative: 4' : 'task derivative?',
          590,
          780,
          32,
          themeColors.cyan,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          done('lp-l1-grad') ? 'L1 derivative: +0.1' : 'L1 derivative?',
          1320,
          780,
          32,
          themeColors.purple,
          'center',
        );
        if (done('lp-gate-update'))
          chapterMath(ctx, api, themeColors, String.raw`1-0.1(4+0.1)=0.59`, 960, 910, 43);
      } else {
        chapterText(
          ctx,
          api,
          themeColors,
          'Learned gate magnitude ≠ an exact survivor count',
          960,
          760,
          33,
          themeColors.yellow,
          'center',
        );
        if (beat === 2)
          chapterText(
            ctx,
            api,
            themeColors,
            'Actual example script penalty: 10⁻⁴ · later quantile chooses capacity',
            960,
            875,
            29,
            themeColors.cyan,
            'center',
          );
      }
    });
    chapterFooter(
      ctx,
      api,
      themeColors,
      'The .1 toy penalty explains the update; it is not the paper coefficient.',
    );
  }
}
export default {
  id: 'mask-gradient',
  draw: drawMaskGradient,
  cues: ['lp-gate-location', 'lp-task-grad', 'lp-l1-grad', 'lp-gate-update', 'lp-mask-budget'],
};
