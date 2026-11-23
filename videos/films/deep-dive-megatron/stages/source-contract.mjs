import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterTag,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawSourceContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('source-contract', state),
    { b: currentBeat } = modelState;
  api.focus.target('mg-source-contract-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Keep implementation and experiment versions together'
        : 'Rank groups depend on the axis sizes and their order',
    );
    if (!currentBeat) {
      chapterTag(ctx, api, 'commit …4422a96', 220, 430, 600, themeColors.blue, 100);
      chapterArrow(ctx, api, 850, 480, 1050, 480);
      chapterTag(ctx, api, 'rank generator', 1100, 430, 600, themeColors.cyan, 100);
      chapterVector(ctx, api, ['TP 4', 'CP 2', 'DP 4', 'PP 2'], 330, 690, 1260);
      chapterFooter(ctx, api, '4 × 2 × 4 × 2 = 64 ranks   ·   extra rematerialization factors = 1');
    } else {
      const rows = [
        ['Core', 'layers / groups / schedule'],
        ['Reference trainer', 'data / tokenizer / logs'],
        ['Bridge', 'state mapping / workflow'],
      ];
      rows.forEach(([k, v], i) => {
        chapterTag(
          ctx,
          api,
          k,
          240,
          365 + i * 165,
          420,
          [themeColors.blue, themeColors.cyan, themeColors.pink][i],
        );
        chapterText(ctx, api, v, 780, 410 + i * 165, 32);
      });
      chapterFooter(
        ctx,
        api,
        'Record versions for Core, Bridge, Transformer Engine, CUDA, NCCL and PyTorch',
      );
    }
  });
  return true;
}
export default {
  id: 'source-contract',
  draw: drawSourceContract,
  cues: ['mg-source-contract-b0', 'mg-source-contract-b1'],
};
