import { temperature } from '../model.mjs';
import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawCalibration(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const Tscale =
      state.cues && modelState.b
        ? 1 + api.focus.progress('calibration-b2-1', modelState.p)
        : modelState.temperatureScale;
    const urgentScore = temperature(0.3, Tscale),
      crossed = urgentScore >= 0.35;
    const current = {
      urgentScore,
      routineScore: 1 - urgentScore,
      crossed,
      route: crossed ? 'HUMAN REVIEW' : 'GUARDED AGENT',
    };
    api.focus.target('temperature-scores', () =>
      teaching.bars({
        x: 420,
        y: 430,
        width: 1080,
        height: 340,
        values: [current.routineScore, current.urgentScore],
        labels: ['Routine score', 'Urgent score'],
        colors: [themeColors.blue, themeColors.cyan],
        max: 1,
        showValues: true,
        format: (v) => v.toFixed(3),
        fontSize: 31,
        gap: 220,
      }),
    );
    api.focus.target('threshold-route', () => {
      api.line(ctx, 390, 651, 1110, 651, themeColors.yellow, 3);
      api.line(ctx, 1335, 651, 1530, 651, themeColors.yellow, 3);
      text(ctx, api, 'review cutoff 0.35', 1710, 615, 26, themeColors.yellow, 'right');
    });
    api.focus.target('temperature-scale', () =>
      text(
        ctx,
        api,
        'Positive temperature ' + Tscale.toFixed(2) + ' · routine remains the argmax',
        960,
        300,
        34,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('threshold-route', () =>
      text(
        ctx,
        api,
        'Threshold route: ' + current.route,
        960,
        900,
        38,
        current.crossed ? themeColors.yellow : themeColors.blue,
        'center',
      ),
    );
  }
}
export default {
  id: 'calibration',
  draw: drawCalibration,
  cues: ['calibration-b1-1', 'calibration-b1-2', 'calibration-b2-1', 'calibration-b2-2'],
};
