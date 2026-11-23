import { newChapterModel } from '../model.mjs';
import { chapterFooter, chapterGrid, chapterTag, chapterText, chapterTitle } from '../defaults.mjs';
export function drawPrecisionRecipes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('precision-recipes', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-precision-recipes-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'When does the scale pick up the outlier?'
        : currentBeat === 1
          ? 'Block scales belong to operand groups'
          : 'Compare the same update before timing the new recipe',
    );
    if (currentBeat === 0) {
      const values = [1, 2, 3, 4, 1, 2, 3, 32],
        current = done('current-amax');
      values.forEach((v, i) => {
        const x = 200 + i * 205,
          h = v * 12;
        api.rect(ctx, x, 850 - h, 130, h, i === 7 ? themeColors.pink : themeColors.blue);
        chapterText(ctx, api, String(v), x + 65, 915, 30);
      });
      chapterText(
        ctx,
        api,
        current ? 'current amax = 32' : 'preceding amax = 4',
        960,
        360,
        36,
        current ? themeColors.cyan : themeColors.yellow,
        'center',
      );
      chapterFooter(
        ctx,
        api,
        'Delayed scaling uses earlier maxima   ·   current scaling reads this tensor',
      );
    } else if (currentBeat === 1) {
      for (let block = 0; block < 3; block++) {
        chapterText(ctx, api, 'block ' + block, 180 + block * 575, 385, 30, themeColors.cyan);
        for (let j = 0; j < 32; j++)
          api.rect(
            ctx,
            180 + block * 575 + (j % 8) * 60,
            440 + Math.floor(j / 8) * 70,
            48,
            53,
            themeColors.blue,
          );
        if (done('block-scales'))
          chapterTag(ctx, api, 'one MXFP8 scale', 180 + block * 575, 800, 470, themeColors.yellow);
      }
      chapterFooter(
        ctx,
        api,
        'NVFP4 uses smaller blocks   ·   the optimizer has its own storage precision',
      );
    } else {
      chapterGrid(
        ctx,
        api,
        [
          ['same fixed batch', 'BF16 reference', 'candidate'],
          ['logits / loss', 'retained', 'compare tolerance'],
          ['gradients / update', 'retained', 'compare tolerance'],
          ['validation / reload', 'retained', 'must pass'],
        ],
        220,
        390,
        1480,
        440,
        themeColors.blue,
        29,
      );
      chapterFooter(ctx, api, 'Time the accepted recipe on the target GPUs with the same workload');
    }
  });
  return true;
}
export default {
  id: 'precision-recipes',
  draw: drawPrecisionRecipes,
  cues: [
    'mg-precision-recipes-b0',
    'mg-current-amax',
    'mg-precision-recipes-b1',
    'mg-block-scales',
    'mg-precision-recipes-b2',
  ],
};
