import { TEST_OUTCOMES, TEST_PREDICTIONS } from '../fixtures.mjs';
import { clamp, cueDone, phase } from '../construction.mjs';
import { axis, caption, intervalRow, text } from '../defaults.mjs';
export function drawCoverage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const pl = axis(
        ctx,
        api,
        [20, 65],
        750,
        'response latency · milliseconds',
        [20, 30, 40, 50, 60],
      ),
      count = currentBeat > 0 ? 4 : Math.min(4, Math.floor(4 * phase(progress, 0.04, 0.9)));
    for (let i = 0; i < 4; i++) {
      const yy = 370 + i * 110;
      text(ctx, api, 'E' + (i + 1), 180, yy + 8, 27, themeColors.muted);
      if (i < count)
        intervalRow(ctx, api, pl, yy, TEST_PREDICTIONS[i], 8, TEST_OUTCOMES[i], {
          color: themeColors.cyan,
        });
    }
    if (done('cf-observed-coverage', 1, 0.3))
      text(
        ctx,
        api,
        '3 covered / 4 evaluated = 75% · every width = 16 ms',
        960,
        950,
        32,
        themeColors.green,
        'center',
      );
    caption(
      ctx,
      api,
      currentBeat === 2
        ? 'Retain counts, widths, versions and predefined groups.'
        : 'A fixed-calibration test frequency differs from the marginal theorem.',
    );
  };
  if (api.focus) api.focus.target(`${'coverage'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'coverage',
  draw: drawCoverage,
  cues: ['coverage-b1', 'coverage-b2', 'cf-observed-coverage', 'coverage-b3'],
};
