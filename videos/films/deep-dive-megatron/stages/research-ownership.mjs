import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterTag,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawResearchOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('research-ownership', state),
    { b: currentBeat } = modelState;
  api.focus.target('mg-research-ownership-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Project source and external assets retain separate terms'
        : 'Predict the communication before reading the implementation',
    );
    if (!currentBeat) {
      const labels = [
        'column → local GeLU → row',
        'pipeline / tensor / data schedule',
        'SP + selective recomputation',
        'attention ↔ expert folding',
      ];
      labels.forEach((v, i) => {
        chapterTag(
          ctx,
          api,
          v,
          270,
          360 + i * 135,
          1380,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
          85,
        );
      });
      chapterFooter(
        ctx,
        api,
        'Each contribution answers a different ownership or redundancy question',
      );
    } else {
      chapterTag(ctx, api, 'NVIDIA-led source', 200, 440, 600, themeColors.blue, 110);
      chapterArrow(ctx, api, 830, 495, 1080, 495);
      chapterTag(ctx, api, 'tests + sign-off', 1130, 440, 600, themeColors.cyan, 110);
      chapterText(
        ctx,
        api,
        'Weights · tokenizer · datasets · third-party notices',
        960,
        780,
        36,
        themeColors.pink,
        'center',
      );
      chapterFooter(
        ctx,
        api,
        'Check the repository license and the terms for each asset in the training run',
      );
    }
  });
  return true;
}
export default {
  id: 'research-ownership',
  draw: drawResearchOwnership,
  cues: ['mg-research-ownership-b0', 'mg-research-ownership-b1'],
};
