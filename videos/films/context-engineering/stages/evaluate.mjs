import { sampleModel } from '../model.mjs';
import { drawOriginalText, drawVisualFocus } from '../defaults.mjs';
export function drawEvaluate(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('evaluate', state),
    currentBeat = modelState.step;
  {
    drawOriginalText(
      ctx,
      api,
      'Executed source-lookup reader · six paired questions',
      140,
      260,
      31,
      themeColors.muted,
    );
    ['Question / required source', 'Baseline', 'Candidate'].forEach((value, i) =>
      drawOriginalText(ctx, api, value, [150, 1050, 1430][i], 355, 29, themeColors.muted),
    );
    modelState.baseline.rows.forEach((row, i) => {
      const y = 445 + i * 70,
        candidate = modelState.candidate.rows[i];
      drawOriginalText(
        ctx,
        api,
        `${row.question} · ${row.source}${row.critical ? ' · critical' : ''}`,
        150,
        y,
        28,
        row.critical ? themeColors.yellow : themeColors.ink,
      );
      drawVisualFocus(ctx, api, 'evaluate-object-row-pass-answer-found-unknown-37', () =>
        drawOriginalText(
          ctx,
          api,
          row.pass ? 'answer found' : 'unknown',
          1050,
          y,
          28,
          row.pass ? themeColors.green : themeColors.pink,
        ),
      );
      if (currentBeat > 0)
        drawVisualFocus(ctx, api, 'evaluate-object-candidate-pass-answer-found-unknown-38', () =>
          drawOriginalText(
            ctx,
            api,
            candidate.pass ? 'answer found' : 'unknown',
            1430,
            y,
            28,
            candidate.pass ? themeColors.green : themeColors.pink,
          ),
        );
    });
    drawVisualFocus(ctx, api, 'evaluate-object-baseline-tally', () =>
      drawOriginalText(
        ctx,
        api,
        `Baseline ${modelState.baseline.score}/6`,
        150,
        920,
        32,
        themeColors.cyan,
      ),
    );
    if (currentBeat > 0)
      drawVisualFocus(ctx, api, 'evaluate-object-candidate-tally', () =>
        drawOriginalText(
          ctx,
          api,
          `· candidate ${modelState.candidate.score}/6`,
          500,
          920,
          32,
          themeColors.cyan,
        ),
      );
    if (currentBeat === 2)
      drawOriginalText(
        ctx,
        api,
        `Protected-case gate: ${modelState.approved ? 'approve' : 'reject'}`,
        1160,
        920,
        32,
        themeColors.pink,
      );
    {
    }
  }
}
export default {
  id: 'evaluate',
  draw: drawEvaluate,
  cues: [
    'evaluate-beat-1-focus-1',
    'evaluate-beat-1-focus-2',
    'evaluate-beat-2-focus-1',
    'evaluate-beat-3-focus-1',
  ],
};
