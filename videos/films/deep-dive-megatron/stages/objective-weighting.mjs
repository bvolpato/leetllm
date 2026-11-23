import { newChapterModel } from '../model.mjs';
import {
  chapterEquation,
  chapterFooter,
  chapterGrid,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawObjectiveWeighting(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('objective-weighting', state),
    { b: currentBeat } = modelState;
  const cueProgress = () =>
      api.focus.progress('mg-objective-weighting-b' + currentBeat, modelState.p),
    R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-objective-weighting-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Equal-weight SGD: reduce, own and update the same positions'
        : 'Each of the four valid tokens gets one vote',
    );
    if (!currentBeat) {
      chapterVector(
        ctx,
        api,
        ['replica 0', '1 token', 'mean 10'],
        220,
        410,
        1480,
        themeColors.blue,
      );
      chapterVector(
        ctx,
        api,
        ['replica 1', '3 tokens', 'mean 0'],
        220,
        590,
        1480,
        themeColors.pink,
      );
      if (done('objective-normalize')) {
        chapterEquation(ctx, api, '\\frac{1(10)+3(0)}{1+3}=2.5', 960, 840, 47, themeColors.green);
        chapterText(ctx, api, 'Equal mean of means = 5', 960, 940, 34, themeColors.pink, 'center');
      }
    } else {
      const r = modelState.sgd,
        n = Math.floor(cueProgress() * 4.9);
      chapterGrid(
        ctx,
        api,
        [
          ['position', '0', '1', '2', '3'],
          ['weights', ...r.w],
          ['replica 0', ...r.rows[0]],
          ['replica 1', ...r.rows[1]],
          ['mean gradient', ...r.gradient.map((v, i) => (i < n ? v : '…'))],
        ],
        160,
        360,
        1600,
        430,
        themeColors.blue,
        29,
      );
      if (done('sgd-updated'))
        chapterVector(
          ctx,
          api,
          r.updated.map((v) => v.toFixed(1)),
          550,
          875,
          1200,
          themeColors.green,
        );
      chapterFooter(ctx, api, 'Each owner subtracts 0.1 × mean gradient from its weights');
    }
  });
  return true;
}
export default {
  id: 'objective-weighting',
  draw: drawObjectiveWeighting,
  cues: [
    'mg-objective-weighting-b0',
    'mg-objective-normalize',
    'mg-objective-weighting-b1',
    'mg-sgd-updated',
  ],
};
