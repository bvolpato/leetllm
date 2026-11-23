import { sampleModel } from '../model.mjs';
import { edgeOriginalText } from '../defaults.mjs';
export function drawTraining(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('training', state),
    currentBeat = modelState.step;
  {
    api.focus.target('training-readout', () =>
      edgeOriginalText(
        ctx,
        api,
        `Aligned three-outcome logit model · temperature ${modelState.temperature.toFixed(1)} · updates ${modelState.steps}`,
        140,
        265,
        30,
        themeColors.muted,
      ),
    );
    const names = ['lookup', 'explain', 'review'];
    names.forEach((name, i) => {
      const x = 250 + i * 560;
      api.focus.target('teacher-probabilities', () =>
        api.rect(
          ctx,
          x,
          760 - modelState.teacher[i] * 390,
          135,
          modelState.teacher[i] * 390,
          themeColors.blue,
          undefined,
          0,
        ),
      );
      api.focus.target('student-probabilities', () =>
        api.rect(
          ctx,
          x + 170,
          760 - modelState.student[i] * 390,
          135,
          modelState.student[i] * 390,
          themeColors.green,
          undefined,
          0,
        ),
      );
      api.focus.target('training-readout-2', () =>
        edgeOriginalText(ctx, api, name, x + 150, 835, 31, themeColors.ink, 'center'),
      );
      api.focus.target('training-readout-3', () =>
        edgeOriginalText(
          ctx,
          api,
          `${modelState.teacher[i].toFixed(3)} / ${modelState.student[i].toFixed(3)}`,
          x + 150,
          915,
          28,
          themeColors.muted,
          'center',
        ),
      );
    });
    api.focus.target('training-readout-4', () =>
      edgeOriginalText(
        ctx,
        api,
        `Teacher / student probabilities · KL = ${modelState.loss.toFixed(5)}`,
        960,
        985,
        29,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'training',
  draw: drawTraining,
  cues: [
    'teacher-distribution',
    'outcome-preferences',
    'temperature-shares',
    'shared-events',
    'gradient-updates',
    'current-divergence',
  ],
};
