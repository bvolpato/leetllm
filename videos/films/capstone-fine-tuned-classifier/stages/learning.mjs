import { trainHead } from '../model.mjs';
import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawLearning(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    if (state.cues)
      modelState.head = trainHead(
        modelState.b ? 12 : Math.floor(12 * api.focus.progress('learning-b1-3', modelState.p)),
      );
    api.focus.target('class-probabilities', () =>
      teaching.bars({
        x: 280,
        y: 430,
        width: 760,
        height: 350,
        values: modelState.head.p,
        labels: ['Routine', 'Urgent target'],
        colors: [themeColors.blue, themeColors.green],
        max: 1,
        showValues: true,
        format: (v) => v.toFixed(3),
        fontSize: 30,
        gap: 150,
      }),
    );
    text(ctx, api, 'Current logits', 1430, 400, 34, themeColors.ink, 'center');
    api.focus.target('current-logits', () =>
      text(
        ctx,
        api,
        modelState.head.z.map((v) => v.toFixed(3)).join(' , '),
        1430,
        510,
        40,
        themeColors.cyan,
        'center',
      ),
    );
    text(ctx, api, 'Cross-entropy', 1430, 650, 32, themeColors.ink, 'center');
    api.focus.target('correct-class-loss', () =>
      text(ctx, api, modelState.head.loss.toFixed(3), 1430, 740, 56, themeColors.yellow, 'center'),
    );
    api.focus.target('head-gradient', () =>
      api.math(
        ctx,
        String.raw`\frac{\partial\ell}{\partial z_j}=p_j-\mathbf1[j=y]`,
        960,
        930,
        44,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'learning',
  draw: drawLearning,
  cues: ['learning-b1-1', 'learning-b1-2', 'learning-b1-3', 'learning-b2-1', 'learning-b2-2'],
};
