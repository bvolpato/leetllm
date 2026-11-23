import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawEvidence(ctx, scene, state, api) {
  if (drawEvidenceContinuation(ctx, scene, state, api)) return;
  const { C: themeColors } = api,
    modelState = sampleModel('evidence', state),
    currentBeat = modelState.b;
  if (state.cues) {
  }
  {
    text(
      ctx,
      api,
      `Case region ${modelState.current.region} · required policy ${modelState.current.policy}`,
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    modelState.rows.forEach((doc, i) => {
      const y = 400 + i * 130;
      api.focus.target('policy-documents', () =>
        card(
          ctx,
          api,
          doc.id,
          160,
          y,
          410,
          doc.errors.length ? themeColors.pink : themeColors.green,
          85,
        ),
      );
      api.focus.target('admission-verdicts', () =>
        text(
          ctx,
          api,
          doc.errors.length
            ? `Rejected: ${doc.errors.join(' · ')}`
            : `Admitted · digest ${doc.digest.slice(0, 10)}`,
          680,
          y + 58,
          31,
          doc.errors.length ? themeColors.pink : themeColors.green,
        ),
      );
    });
    api.focus.target('admission-verdicts', () =>
      text(
        ctx,
        api,
        `${modelState.admitted.length} admissible policy records · ${modelState.admitted.length ? 'grounded policy available' : 'abstain and preserve reason'}`,
        960,
        1010,
        32,
        modelState.admitted.length ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
  }
}
function drawEvidenceContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C } = api;
  return true;
}
export default {
  id: 'evidence',
  draw: drawEvidence,
  cues: ['admit-policy', 'changed-bytes', 'missing-region'],
};
