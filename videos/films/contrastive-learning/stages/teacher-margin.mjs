import { drawAxis, drawCells, drawLine, drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawTeacherMargin(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-teacher-margin-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('teacher-margin-mechanism', () => {
    drawText(
      ctx,
      api,
      'Teacher agreement and relevance are different tests',
      960,
      290,
      35,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      drawCells(ctx, api, [0.2, 0.8], 350, 430, 560, 90, themeColors.blue);
      drawText(ctx, api, 'approved', 630, 390, 30, themeColors.green);
      drawText(ctx, api, 'non-match', 1190, 390, 30, themeColors.pink);
      if (resultComplete('difference'))
        drawText(
          ctx,
          api,
          resultComplete('result')
            ? 'Teacher margin .20 − .80 = −.60'
            : 'Teacher margin .20 − .80 = pending',
          960,
          670,
          39,
          resultComplete('result') ? themeColors.cyan : themeColors.muted,
        );
      if (resultComplete('wrong')) {
        drawPill(ctx, api, 'Student margin −.60 → MSE 0', 960, 820, 1300, themeColors.green);
        drawText(ctx, api, 'Wrong passage still wins', 960, 940, 34, themeColors.pink);
      }
      drawNote(ctx, api, 'Retain relevance labels while comparing the two score contracts');
    } else {
      const plot = drawAxis(ctx, api, 350, 530, 1200, 140, [-4, 4], [0, 1]);
      drawLine(ctx, api, 650, 600, 1250, 600, themeColors.cyan, 16);
      drawText(ctx, api, 'cosine margin −2 … +2', 960, 470, 36, themeColors.cyan);
      api.circle(ctx, plot.point(3.5, 0.5).x, 600, 12, themeColors.pink);
      drawText(ctx, api, 'teacher logit gap may exceed range', 960, 790, 35, themeColors.pink);
      if (resultComplete('scale'))
        drawPill(
          ctx,
          api,
          'Evaluate scaling or a compatible student score',
          960,
          920,
          1450,
          themeColors.yellow,
        );
      drawNote(ctx, api, 'Temperature changes competition · raw cosine remains bounded');
    }
  });
}
export default {
  id: 'teacher-margin',
  draw: drawTeacherMargin,
  cues: [
    'cl-teacher-margin-difference',
    'cl-teacher-margin-result',
    'cl-teacher-margin-wrong',
    'cl-teacher-margin-range',
    'cl-teacher-margin-scale',
  ],
};
