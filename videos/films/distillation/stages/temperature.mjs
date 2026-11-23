import { INITIAL, TEACHER } from '../fixtures.mjs';
import { distribution, equation } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawTemperature(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.05, 0.9);
  const teacher = stableSoftmax(TEACHER),
    initial = stableSoftmax(INITIAL);
  {
    const temp =
      currentBeat === 0
        ? 1 + 3 * api.focus.progress('temperature-b1-1', phaseForBeat(0))
        : currentBeat === 1
          ? 4
          : 4 + 8 * api.focus.progress('temperature-b3-1', phaseForBeat(2));
    equation(ctx, api, `T=${temp.toFixed(1)}`, 960, 300, 50, themeColors.yellow, 'center');
    api.focus.target('soft-teacher', () =>
      distribution(ctx, api, stableSoftmax(TEACHER, temp), 260, 475, themeColors.blue, 'Teacher'),
    );
    api.focus.target('soft-student', () =>
      distribution(ctx, api, stableSoftmax(INITIAL, temp), 1080, 475, themeColors.cyan, 'Student'),
    );
    api.focus.target('temperature-rule', () =>
      equation(
        ctx,
        api,
        String.raw`p_i^{(T)}=\frac{e^{z_i/T}}{\sum_j e^{z_j/T}}`,
        960,
        925,
        49,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'temperature',
  draw: drawTemperature,
  cues: ['temperature-b1-1', 'temperature-b2-1', 'temperature-b3-1', 'temperature-b3-2'],
};
