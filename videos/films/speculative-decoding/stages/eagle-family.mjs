import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawEagleFamily(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-eagle-family-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      'Follow the training target through the method revision',
      245,
    );
    if (currentBeat === 0) {
      drawConstructionsBox(ctx, api, 'Target pre-head feature', 150, 420, 570, themeColors.blue);
      api.arrow(ctx, 750, 460, 1020, 460, themeColors.cyan, 4);
      drawConstructionsBox(ctx, api, 'Draft predicted feature', 1060, 420, 680, themeColors.cyan);
      drawConstructionsBox(ctx, api, 'Sampled token input', 150, 700, 570, themeColors.yellow);
      api.arrow(ctx, 750, 740, 1020, 740, themeColors.yellow, 4);
      drawConstructionsBox(
        ctx,
        api,
        'Shared target LM head → tokens',
        1060,
        700,
        680,
        themeColors.blue,
      );
      drawConstructionsCenter(
        ctx,
        api,
        'Original EAGLE predicts the feature immediately before the LM head',
        1010,
        themeColors.muted,
      );
    } else if (currentBeat === 1 && !done(1, 'sd-eagle3-objective')) {
      drawConstructionsCenter(
        ctx,
        api,
        'Illustrative EAGLE-2 candidate confidence products',
        330,
        themeColors.blue,
        31,
      );
      const paths = [
        [0.8, 0.5],
        [0.6, 0.7],
      ];
      paths.forEach((v, i) => {
        const x = 320 + i * 900;
        drawConstructionsBox(ctx, api, 'draft root ' + v[0], x, 420, 400, themeColors.blue);
        api.arrow(ctx, x + 200, 520, x + 200, 615, themeColors.cyan, 4);
        drawConstructionsBox(ctx, api, 'child conditional ' + v[1], x, 660, 400, themeColors.cyan);
        if (done(1, 'sd-eagle-family-b1'))
          drawConstructionsText(
            ctx,
            api,
            'path ' + v[0] + ' × ' + v[1] + ' = ' + (v[0] * v[1]).toFixed(2),
            x + 200,
            865,
            34,
            i ? themeColors.green : themeColors.blue,
            'center',
          );
      });
      drawConstructionsCenter(
        ctx,
        api,
        done(1, 'sd-eagle-family-b1')
          ? 'Rerank these supplied path scores: 0.42 exceeds 0.40'
          : 'Multiply each candidate’s conditional confidence along its ancestry',
        1010,
        themeColors.muted,
      );
    } else {
      ['low', 'middle', 'high'].forEach((n, i) =>
        drawConstructionsBox(ctx, api, n + ' feature', 130 + i * 550, 365, 500, themeColors.blue),
      );
      for (let i = 0; i < 3; i++) api.arrow(ctx, 380 + i * 550, 475, 960, 620, themeColors.cyan, 3);
      drawConstructionsBox(
        ctx,
        api,
        'Fuse → direct token objective',
        600,
        660,
        720,
        themeColors.cyan,
      );
      drawConstructionsText(
        ctx,
        api,
        'Simulated multi-step drafting during training',
        960,
        870,
        32,
        themeColors.green,
        'center',
      );
      drawConstructionsCenter(
        ctx,
        api,
        currentBeat === 2
          ? 'Draft weights, features and tree buffers also occupy serving resources'
          : 'EAGLE-3 removes the feature-prediction constraint',
        1010,
        themeColors.yellow,
        30,
      );
    }
  });
  return;
}
export default {
  id: 'eagle-family',
  draw: drawEagleFamily,
  cues: ['sd-eagle-family-b0', 'sd-eagle-family-b1', 'sd-eagle3-objective', 'sd-eagle-family-b2'],
};
