import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterTag,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawBackwardBias(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('backward-bias', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-backward-bias-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'One shared bias belongs after the reduction'
        : 'Backward input contributions share one replicated input',
    );
    if (!currentBeat) {
      chapterTag(ctx, api, 'input X', 170, 510, 310, themeColors.yellow);
      for (let i = 0; i < 2; i++) {
        chapterTag(
          ctx,
          api,
          'column shard ' + i,
          740,
          380 + i * 300,
          430,
          i ? themeColors.pink : themeColors.blue,
        );
        chapterArrow(
          ctx,
          api,
          500,
          545,
          720,
          415 + i * 300,
          i ? themeColors.pink : themeColors.blue,
        );
        if (done('backward-sum'))
          chapterArrow(
            ctx,
            api,
            730,
            480 + i * 180,
            490,
            585,
            i ? themeColors.pink : themeColors.blue,
          );
      }
      chapterText(
        ctx,
        api,
        done('backward-sum') ? '∇X = Σ shard contributions' : '∇X contributions pending',
        960,
        900,
        35,
        themeColors.green,
        'center',
      );
      chapterFooter(ctx, api, 'Sequence-parallel variants can change the collective layout');
    } else {
      const correct = done('bias-six'),
        wrong = done('bias-nine');
      chapterVector(ctx, api, ['partial 1', 'partial 2', 'shared bias 3'], 220, 420, 1480);
      chapterArrow(ctx, api, 620, 560, 930, 700, themeColors.blue);
      chapterArrow(ctx, api, 1160, 560, 990, 700, themeColors.pink);
      chapterText(
        ctx,
        api,
        correct ? '(1 + 2) + 3 = 6' : 'sum partials, then add bias once',
        960,
        765,
        43,
        themeColors.green,
        'center',
      );
      if (wrong) {
        chapterText(ctx, api, '(1 + 3) + (2 + 3) = 9', 960, 905, 42, themeColors.pink, 'center');
        chapterFooter(
          ctx,
          api,
          'Duplicated arithmetic changes the model even when communication succeeds',
        );
      }
    }
  });
  return true;
}
export default {
  id: 'backward-bias',
  draw: drawBackwardBias,
  cues: [
    'mg-backward-bias-b0',
    'mg-backward-sum',
    'mg-backward-bias-b1',
    'mg-bias-six',
    'mg-bias-nine',
  ],
};
