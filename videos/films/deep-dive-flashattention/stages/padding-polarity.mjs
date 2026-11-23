import { gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionFooter,
  drawExtensionL,
  drawExtensionText,
  drawExtensionVector,
} from '../defaults.mjs';
export function drawPaddingPolarity(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('padding-polarity', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      drawExtensionText(
        ctx,
        api,
        'Same supplied values · scores[0,0]',
        960,
        300,
        35,
        themeColors.yellow,
        'center',
      );
      drawExtensionVector(
        ctx,
        api,
        ['real V10', 'padding V1000'],
        280,
        400,
        1360,
        105,
        themeColors.blue,
      );
      if (currentBeat === 0) {
        drawExtensionVector(
          ctx,
          api,
          ['MHA padding: False', 'MHA padding: True'],
          280,
          610,
          1360,
          90,
          themeColors.pink,
        );
        drawExtensionText(
          ctx,
          api,
          'True excludes padding',
          960,
          850,
          37,
          themeColors.pink,
          'center',
        );
      } else if (currentBeat === 1) {
        drawExtensionVector(
          ctx,
          api,
          modelState.keep.map((v) => 'SDPA keep: ' + v),
          280,
          610,
          1360,
          90,
          modelState.right ? themeColors.cyan : themeColors.pink,
        );
        const active = modelState.right ? 0 : 1;
        drawExtensionL(
          ctx,
          api,
          620 + active * 680,
          715,
          960,
          850,
          modelState.right ? themeColors.cyan : themeColors.pink,
          4,
        );
        drawExtensionText(
          ctx,
          api,
          modelState.right ? 'O = 10' : modelState.wrong ? 'O = 1000' : 'O = ?',
          960,
          925,
          52,
          modelState.right
            ? themeColors.green
            : modelState.wrong
              ? themeColors.pink
              : themeColors.muted,
          'center',
        );
      } else {
        drawExtensionVector(
          ctx,
          api,
          ['real / past', 'padding / past', 'real / future'],
          250,
          570,
          1440,
          95,
          themeColors.blue,
        );
        drawExtensionVector(
          ctx,
          api,
          ['allow', 'exclude', 'exclude'],
          250,
          750,
          1440,
          95,
          themeColors.cyan,
        );
        drawExtensionFooter(
          ctx,
          api,
          'Allow-set = causal AND real; additive biases have a different translation',
        );
      }
    }
  });
}
export default {
  id: 'padding-polarity',
  draw: drawPaddingPolarity,
  cues: [
    'fa-padding-polarity-0',
    'fa-padding-polarity-1',
    'fa-padding-wrong',
    'fa-padding-right',
    'fa-padding-polarity-2',
  ],
};
