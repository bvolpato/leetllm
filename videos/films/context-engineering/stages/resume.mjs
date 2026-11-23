import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalText, drawVisualFocus } from '../defaults.mjs';
export function drawResume(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('resume', state),
    currentBeat = modelState.step;
  {
    drawOriginalText(
      ctx,
      api,
      'Trusted expected receipt · recomputed current bytes',
      140,
      260,
      31,
      themeColors.muted,
    );
    drawVisualFocus(ctx, api, 'resume-simulation-30', () =>
      [
        [
          'Artifact',
          modelState.expectedArtifact,
          modelState.artifactHash,
          modelState.artifactMatch,
        ],
        ['Input revision', modelState.expectedInput, modelState.inputHash, modelState.inputMatch],
      ].forEach(([name, expected, actual, pass], i) => {
        const y = 365 + i * 250;
        drawOriginalText(ctx, api, name, 160, y, 32, themeColors.ink);
        drawOriginalText(
          ctx,
          api,
          `Expected: ${expected.slice(0, 20)}`,
          500,
          y,
          29,
          themeColors.muted,
        );
        drawOriginalText(
          ctx,
          api,
          `Current:  ${actual.slice(0, 20)}`,
          500,
          y + 85,
          29,
          pass ? themeColors.green : themeColors.pink,
        );
        drawVisualFocus(ctx, api, 'resume-object-pass-match-changed-34', () =>
          drawOriginalCard(
            ctx,
            api,
            pass ? 'match' : 'changed',
            1430,
            y - 40,
            330,
            pass ? themeColors.green : themeColors.pink,
          ),
        );
      }),
    );
    drawVisualFocus(ctx, api, 'resume-next-task', () =>
      drawOriginalCard(
        ctx,
        api,
        modelState.passed
          ? 'Next: inspect callback · RUNNABLE'
          : 'Next: inspect callback · BLOCKED',
        420,
        880,
        1080,
        modelState.passed ? themeColors.green : themeColors.pink,
        90,
      ),
    );
  }
}
export default {
  id: 'resume',
  draw: drawResume,
  cues: [
    'resume-beat-1-focus-1',
    'resume-beat-1-focus-2',
    'resume-beat-2-focus-1',
    'resume-beat-3-focus-1',
  ],
};
