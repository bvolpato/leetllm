import { INITIAL, TEACHER } from '../fixtures.mjs';
import { studentTrace } from '../model.mjs';
import { distribution, text } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.05, 0.9);
  const teacher = stableSoftmax(TEACHER),
    initial = stableSoftmax(INITIAL);
  {
    const trace = studentTrace(),
      step = Math.round(40 * (currentBeat === 0 ? phaseForBeat(0) : 1)),
      current = trace[step];
    api.focus.target('information-path', () => {
      distribution(ctx, api, teacher, 230, 470, themeColors.blue, 'Teacher at … saw a', 1, 290);
      distribution(
        ctx,
        api,
        current.probs,
        1090,
        470,
        themeColors.cyan,
        'Student · update ' + step,
        1,
        290,
      );
    });
    api.focus.target('student-gradient', () => {
      text(ctx, api, 'KL ' + current.loss.toFixed(4), 960, 900, 43, themeColors.yellow, 'center');
      if (currentBeat > 0)
        text(
          ctx,
          api,
          'Fresh wording and policy checks still pending',
          960,
          980,
          32,
          themeColors.muted,
          'center',
        );
    });
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['transfer-b1-1', 'transfer-b2-1', 'transfer-b3-1'],
};
