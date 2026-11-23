import { categoricalUpdate, groupStatistics } from '../arithmetic.mjs';
import { equation, text } from '../defaults.mjs';
import { spokenProgress } from '../drawing.mjs';
export function drawUpdate(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const p = spokenProgress(api, state);
  const stats = groupStatistics([1, 0, 1, 0]);
  const updated = categoricalUpdate(stats.advantages, p('update-b2-1', 1, 0.1, 0.5));
  {
    text(ctx, api, '14 × 12     ·     R1 and R3 passed', 960, 305, 40, themeColors.ink, 'center');
    api.focus.target('initial-probabilities', () =>
      teaching.bars({
        x: 320,
        y: 410,
        width: 650,
        height: 330,
        values: [0.25, 0.25, 0.25, 0.25],
        labels: ['R1', 'R2', 'R3', 'R4'],
        colors: [themeColors.blue, themeColors.blue, themeColors.blue, themeColors.blue],
        max: 0.4,
        showValues: true,
        format: (v) => v.toFixed(2),
        fontSize: 29,
        progress: 1,
      }),
    );
    api.focus.target('updated-probabilities', () =>
      teaching.bars({
        x: 1080,
        y: 410,
        width: 570,
        height: 330,
        values: updated.probabilities,
        labels: ['R1', 'R2', 'R3', 'R4'],
        colors: [themeColors.green, themeColors.pink, themeColors.green, themeColors.pink],
        max: 0.4,
        showValues: true,
        format: (v) => v.toFixed(2),
        fontSize: 29,
        progress: 1,
      }),
    );
    text(ctx, api, 'Sampling policy before the step', 645, 830, 31, themeColors.muted, 'center');
    text(
      ctx,
      api,
      'Current policy · normalized at every step',
      1365,
      830,
      29,
      themeColors.muted,
      'center',
    );
    api.focus.target('probability-mass', () =>
      equation(
        ctx,
        api,
        String.raw`P(R1)+P(R3)\approx${updated.rewardedMass.toFixed(3)},\qquad\sum_i p_i=1`,
        960,
        915,
        39,
        themeColors.yellow,
      ),
    );
  }
}
export default {
  id: 'update',
  draw: drawUpdate,
  cues: ['update-b1-1', 'update-b2-1', 'update-b3-1'],
};
