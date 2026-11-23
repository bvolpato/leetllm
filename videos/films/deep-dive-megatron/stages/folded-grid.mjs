import { newChapterModel } from '../model.mjs';
import { chapterFooter, chapterText, chapterTitle } from '../defaults.mjs';
export function drawFoldedGrid(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('folded-grid', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-folded-grid-mechanism', () => {
    chapterTitle(ctx, api, 'One fixed 256-rank population · two factorizations');
    const fold = currentBeat ? 1 : R('folded-population'),
      folded = fold === 1;
    for (let r = 0; r < 256; r++) {
      const x = 170 + (r % 32) * 49 * (1 - fold) + (r % 64) * 24 * fold,
        y = 385 + Math.floor(r / 32) * 58 * (1 - fold) + Math.floor(r / 64) * 130 * fold,
        size = 38 - 20 * fold;
      api.rect(
        ctx,
        x,
        y,
        size,
        size,
        r === 13 ? themeColors.yellow : folded ? themeColors.pink : themeColors.blue,
      );
    }
    chapterText(
      ctx,
      api,
      'Attention: 4 TP × 2 CP × 8 DP × 4 PP',
      960,
      900,
      33,
      themeColors.blue,
      'center',
    );
    if (folded)
      chapterText(
        ctx,
        api,
        'Experts: 1 ETP × 64 EP × 1 EDP × 4 PP',
        960,
        960,
        33,
        themeColors.pink,
        'center',
      );
    chapterFooter(
      ctx,
      api,
      currentBeat && done('matched-pipeline')
        ? 'Both generators retain the same pipeline partition'
        : 'A correct product is a first check; shape, routing and placement checks remain',
    );
  });
  return true;
}
export default {
  id: 'folded-grid',
  draw: drawFoldedGrid,
  cues: ['mg-folded-grid-b0', 'mg-folded-population', 'mg-folded-grid-b1', 'mg-matched-pipeline'],
};
