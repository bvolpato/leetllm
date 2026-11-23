import { linearFixture, spokenProgress } from '../model.mjs';
import {
  chapterArrow,
  chapterLine,
  chapterMath,
  chapterMatrix,
  chapterSubtitle,
  chapterText,
  chapterVector,
  focusScope,
} from '../defaults.mjs';
export function drawParallelProduct(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    const f = linearFixture();
    chapterSubtitle(ctx, api, themeColors, 'Stored linear convention · one shared input');
    focusScope(ctx, api, 'lp-input', () => {
      chapterVector(ctx, api, themeColors, f.input, 140, 440, 'x', themeColors.yellow);
      chapterLine(ctx, api, themeColors, 210, 630, 210, 785, themeColors.yellow);
      chapterArrow(ctx, api, themeColors, 210, 785, 350, 785, themeColors.yellow);
    });
    focusScope(ctx, api, 'lp-base', () => {
      chapterMatrix(ctx, api, themeColors, f.W, 380, 370, 'frozen W', themeColors.blue, 90);
      chapterArrow(ctx, api, themeColors, 265, 510, 350, 510, themeColors.blue);
      chapterVector(
        ctx,
        api,
        themeColors,
        done('lp-base') || beat > 0 ? f.base : ['?', '?'],
        710,
        370,
        'W x',
        themeColors.blue,
        90,
      );
    });
    focusScope(ctx, api, 'lp-adapter', () => {
      chapterMatrix(ctx, api, themeColors, f.A, 380, 705, 'stored A', themeColors.cyan, 78);
      chapterVector(
        ctx,
        api,
        themeColors,
        beat > 1 || q('lp-a') > 0.98 ? f.activation : ['?', '?'],
        690,
        705,
        'A x',
        themeColors.cyan,
        78,
      );
      chapterMatrix(ctx, api, themeColors, f.B, 910, 705, 'stored B', themeColors.purple, 78);
      chapterVector(
        ctx,
        api,
        themeColors,
        beat > 1 || done('lp-b') ? f.unscaled : ['?', '?'],
        1220,
        705,
        'B A x',
        themeColors.purple,
        78,
      );
      chapterArrow(ctx, api, themeColors, 580, 785, 650, 785, themeColors.cyan);
      chapterArrow(ctx, api, themeColors, 820, 785, 875, 785, themeColors.cyan);
      chapterArrow(ctx, api, themeColors, 1100, 785, 1180, 785, themeColors.purple);
    });
    focusScope(ctx, api, 'lp-sum', () => {
      chapterText(ctx, api, themeColors, 'scale ½', 1415, 900, 29, themeColors.purple, 'center');
      chapterVector(
        ctx,
        api,
        themeColors,
        beat > 1 || done('lp-combine') ? f.output : ['?', '?'],
        1560,
        420,
        'combined',
        themeColors.green,
        90,
      );
      chapterArrow(ctx, api, themeColors, 830, 465, 1515, 465, themeColors.blue);
      chapterArrow(ctx, api, themeColors, 1350, 785, 1598, 650, themeColors.purple);
    });
    focusScope(ctx, api, 'lp-general', () => {
      if (beat === 2)
        chapterMath(
          ctx,
          api,
          themeColors,
          String.raw`r d_{in} + d_{out} r\quad\text{pairs / token}`,
          960,
          950,
          37,
        );
      else
        chapterText(
          ctx,
          api,
          themeColors,
          'A: rank rows · B: matching rank columns',
          960,
          950,
          28,
          themeColors.muted,
          'center',
        );
    });
  }
}
export default {
  id: 'parallel-product',
  draw: drawParallelProduct,
  cues: ['lp-input', 'lp-base', 'lp-a', 'lp-b', 'lp-combine', 'lp-general'],
};
