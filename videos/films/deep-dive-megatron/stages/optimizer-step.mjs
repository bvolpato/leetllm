import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterEquation,
  chapterFooter,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawOptimizerStep(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('optimizer-step', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-optimizer-step-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Separate six replicated bytes from twelve shardable bytes'
        : 'Owned reduced slices become the next full model buffer',
    );
    if (!currentBeat) {
      const r = modelState.sgd;
      chapterVector(ctx, api, r.rows[0], 240, 375, 1440, themeColors.blue);
      chapterVector(ctx, api, r.rows[1], 240, 495, 1440, themeColors.pink);
      chapterArrow(ctx, api, 750, 600, 500, 700, themeColors.blue);
      chapterArrow(ctx, api, 1170, 600, 1420, 700, themeColors.pink);
      for (let owner = 0; owner < 2; owner++) {
        const values = done('all-gather')
          ? r.updated.slice(owner * 2, owner * 2 + 2)
          : done('reduce-scatter')
            ? r.owned[owner]
            : ['…', '…'];
        chapterVector(
          ctx,
          api,
          values,
          220 + owner * 850,
          750,
          600,
          owner ? themeColors.pink : themeColors.blue,
        );
      }
      if (done('all-gather')) {
        chapterVector(
          ctx,
          api,
          r.updated.map((v) => v.toFixed(1)),
          300,
          900,
          1320,
          themeColors.green,
        );
        chapterFooter(
          ctx,
          api,
          'All-gather reconstructs the parameter buffer; scaling follows the declared objective',
        );
      }
    } else {
      const d = done('seven-half-bytes') ? 8 : 1,
        parts = [2, 4, 4 / d, 8 / d],
        names = ['BF16 model', 'FP32 main grad', 'FP32 master / d', 'Adam moments / d'];
      let x = 200;
      parts.forEach((v, i) => {
        const w = (1500 * v) / 18;
        api.rect(
          ctx,
          x,
          450,
          w,
          180,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
        );
        chapterText(
          ctx,
          api,
          names[i],
          200 + i * 405,
          760,
          26,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
        );
        chapterText(ctx, api, v.toFixed(2) + ' B', 200 + i * 405, 830, 29);
        x += w;
      });
      if (d === 8)
        chapterEquation(
          ctx,
          api,
          String.raw`6+\frac{12}{8}=7.5\ \mathrm{bytes/parameter}`,
          960,
          950,
          39,
          themeColors.green,
        );
      chapterFooter(
        ctx,
        api,
        '1 decimal GB = 1,000,000,000 bytes · activations and temporary peaks are extra',
      );
    }
  });
  return true;
}
export default {
  id: 'optimizer-step',
  draw: drawOptimizerStep,
  cues: [
    'mg-optimizer-step-b0',
    'mg-reduce-scatter',
    'mg-all-gather',
    'mg-optimizer-step-b1',
    'mg-seven-half-bytes',
  ],
};
