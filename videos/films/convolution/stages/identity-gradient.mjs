import { residualSlice } from '../arithmetic.mjs';
import {
  chapterCueProgress,
  chapterOutline,
  chapterText,
  constructionFocus,
  formatChapterValue,
} from '../defaults.mjs';
export function drawIdentityGradient(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  constructionFocus(ctx, api, 'identity-gradient', () => {
    const canceled = currentBeat > 0 && chapterCueProgress(ctx, api, 'cancel-identity') > 0,
      slope = canceled ? -1 : 0.2,
      gate = currentBeat === 1 ? chapterCueProgress(ctx, api, 'relu-gate') : 0,
      model = residualSlice(slope, 3, gate > 0 ? 0 : 1),
      { branch, total } = model,
      q =
        currentBeat === 0
          ? chapterCueProgress(ctx, api, 'identity-sum')
          : currentBeat === 1
            ? chapterCueProgress(ctx, api, 'cancel-identity')
            : 1;
    chapterText(ctx, api, 'incoming gradient 3', 1470, 350, 38, themeColors.pink, 'center');
    chapterText(
      ctx,
      api,
      'branch slope ' + formatChapterValue(slope),
      960,
      425,
      34,
      themeColors.cyan,
      'center',
    );
    chapterText(ctx, api, 'identity slope 1', 960, 690, 34, themeColors.blue, 'center');
    api.arrow(ctx, 1350, 380, 1150, 470, themeColors.pink, 4);
    api.arrow(ctx, 1350, 380, 1150, 735, themeColors.pink, 4);
    const x = 400 + api.phase(q, 0, 0.5) * 200;
    api.arrow(ctx, 1100, 480, x, 480, themeColors.cyan, 5);
    api.arrow(ctx, 1100, 735, x, 735, themeColors.blue, 5);
    chapterText(ctx, api, formatChapterValue(branch), 800, 555, 46, themeColors.cyan, 'center');
    chapterText(ctx, api, model.identity, 800, 810, 46, themeColors.blue, 'center');
    if (q === 1) {
      chapterText(ctx, api, 'input gradient', 370, 880, 31, themeColors.muted, 'center');
      chapterText(
        ctx,
        api,
        gate > 0 ? 0 : formatChapterValue(total),
        370,
        980,
        58,
        canceled ? themeColors.pink : themeColors.green,
        'center',
      );
    }
    if (gate > 0) {
      chapterOutline(ctx, api, 1270, 280, 410, 170, themeColors.pink, 4);
      chapterText(
        ctx,
        api,
        'ReLU gate 0 → local incoming 0',
        1460,
        580,
        28,
        themeColors.pink,
        'center',
      );
    }
    if (currentBeat === 2) {
      chapterText(
        ctx,
        api,
        'Input gradient = branch contribution + shortcut contribution',
        960,
        960,
        32,
        themeColors.yellow,
        'center',
      );
      chapterText(
        ctx,
        api,
        'ResNet experiments: 50 / 101 / 152 layers',
        960,
        1030,
        29,
        themeColors.muted,
        'center',
      );
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'identity-gradient',
  draw: drawIdentityGradient,
  cues: [
    'identity-gradient-b1',
    'identity-sum',
    'identity-gradient-b2',
    'cancel-identity',
    'relu-gate',
    'identity-gradient-b3',
  ],
};
