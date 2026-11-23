import { clamp, cueDone, cueProgress, phase } from '../construction.mjs';
import { normalizedCalibrationConstruction, normalizedIntervalConstruction } from '../model.mjs';
import { axis, caption, dot, equation, intervalRow, line, text } from '../defaults.mjs';
export function drawNormalizedScore(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = clamp(state.beatP ?? 0),
    cues = state.cues;
  const reveal = (id, beat, a = 0.08, z = 0.8) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : cueProgress(cues, id, phase(progress2, a, z));
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress2 >= at));
  const paint = () => {
    const calibrated = done('cf-normalized-q', 1, 0.3);
    if (currentBeat === 0) {
      const amount = reveal('cf-normalized-divide', 0, 0.25, 0.7);
      text(ctx, api, 'C3 · one fixed calibration record', 960, 300, 34, themeColors.cyan, 'center');
      const pl = axis(ctx, api, [35, 45], 440, '', [35, 37, 40, 43, 45]);
      const prediction = pl.point(40, 0.5).x,
        observed = pl.point(43, 0.5).x;
      dot(ctx, api, prediction, 480, themeColors.yellow, 13);
      dot(ctx, api, observed, 480, themeColors.cyan, 13);
      text(ctx, api, 'prediction 40', prediction, 420, 29, themeColors.yellow, 'center');
      text(ctx, api, 'observed 43', observed, 420, 29, themeColors.cyan, 'center');
      line(ctx, api, prediction, 480, observed, 480, themeColors.cyan, 8);
      text(ctx, api, 'absolute residual 3 ms', 960, 565, 31, themeColors.cyan, 'center');
      text(ctx, api, 'frozen scale 2 ms', 960, 625, 30, themeColors.yellow, 'center');
      const rulerX = 650,
        unit = 180;
      line(ctx, api, 650, 820, 650 + 2 * 180, 820, themeColors.border, 3);
      for (let i = 0; i <= 2; i++) {
        line(ctx, api, 650 + i * 180, 805, 650 + i * 180, 835, themeColors.muted, 2);
        text(ctx, api, i, 650 + i * 180, 870, 24, themeColors.muted, 'center');
      }
      if (amount > 0) line(ctx, api, 650, 820, 650 + 1.5 * 180 * amount, 820, themeColors.cyan, 12);
      if (done('cf-normalized-divide', 0, 0.7))
        equation(
          ctx,
          api,
          String.raw`\frac{3\,\mathrm{ms}}{2\,\mathrm{ms}}=1.5`,
          1370,
          850,
          45,
          themeColors.cyan,
        );
      else
        text(
          ctx,
          api,
          'measure the residual in frozen-scale units',
          960,
          935,
          29,
          themeColors.muted,
          'center',
        );
      caption(ctx, api, 'The scale is fixed independently; the resulting score has no units.');
    } else if (!calibrated) {
      const construction = normalizedCalibrationConstruction(
        reveal('cf-normalized-scales', 1, 0.02, 0.3),
      );
      text(
        ctx,
        api,
        'The same records · a separately calibrated score',
        960,
        285,
        34,
        themeColors.cyan,
        'center',
      );
      for (const row of construction) {
        const x = 230 + (row.index % 3) * 575,
          y = 380 + Math.floor(row.index / 3) * 155;
        text(ctx, api, row.id, x, y, 25, themeColors.muted);
        text(ctx, api, 'residual ' + row.residual + ' ms', x, y + 44, 26, themeColors.cyan);
        if (row.amount > 0) {
          text(ctx, api, 'scale ' + row.scale + ' ms', x + 270, y + 44, 26, themeColors.yellow);
          if (row.amount === 1)
            equation(
              ctx,
              api,
              String.raw`\frac{${row.residual}}{${row.scale}}${row.score === Number(row.score.toFixed(3)) ? '=' : '\\approx'}${Number(row.score.toFixed(3))}`,
              x + 190,
              y + 102,
              33,
              themeColors.cyan,
            );
        }
      }
      const ordered = construction
        .filter((x) => x.amount === 1)
        .sort((a, z) => a.score - z.score || a.index - z.index);
      ordered.forEach((row, i) => {
        const x = 245 + i * 180;
        text(ctx, api, row.id, x, 905, 21, themeColors.muted, 'center');
        text(ctx, api, Number(row.score.toFixed(3)), x, 945, 28, themeColors.cyan, 'center');
      });
      caption(ctx, api, 'Sort the normalized scores, then apply the corrected rank.');
    } else {
      const pl = axis(
        ctx,
        api,
        [20, 65],
        790,
        'response latency · milliseconds',
        [20, 30, 40, 50, 60],
      );
      text(ctx, api, 'rank 8 · normalized q = 2', 960, 280, 34, themeColors.yellow, 'center');
      const ids = ['first', 'second', 'third', 'fourth'];
      for (let i = 0; i < 4; i++) {
        const progress =
          currentBeat > 1 ? 1 : reveal('cf-normalized-' + ids[i], 1, 0.4 + i * 0.1, 0.5 + i * 0.1);
        const s = normalizedIntervalConstruction(i, progress),
          y = 375 + i * 109;
        text(ctx, api, 'E' + (i + 1), 170, y + 8, 27, themeColors.muted);
        dot(ctx, api, pl.point(s.center, 0.5).x, y, themeColors.yellow, 8);
        text(ctx, api, 'scale ' + s.scale + ' ms', 1740, y + 8, 25, themeColors.muted, 'right');
        if (progress > 0)
          intervalRow(ctx, api, pl, y, s.center, s.radius, s.outcome, {
            showEndpoints: s.complete,
            showOutcome: currentBeat > 1 && done('cf-normalized-four', 2, 0.2),
            color: themeColors.cyan,
          });
      }
      if (done('cf-normalized-four', 2, 0.2))
        text(
          ctx,
          api,
          '4 / 4 covered · widths 12, 14, 8, 24 ms',
          960,
          940,
          32,
          themeColors.green,
          'center',
        );
      else
        text(
          ctx,
          api,
          'Each radius = calibrated q × that input’s frozen scale',
          960,
          940,
          29,
          themeColors.muted,
          'center',
        );
      caption(ctx, api, 'Four supplied test cases · a separately calibrated normalized score.');
    }
  };
  if (api.focus) api.focus.target(`${'normalized-score'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'normalized-score',
  draw: drawNormalizedScore,
  cues: [
    'normalized-score-b1',
    'cf-normalized-divide',
    'normalized-score-b2',
    'cf-normalized-q',
    'cf-normalized-intervals',
    'cf-normalized-scales',
    'cf-normalized-first',
    'cf-normalized-second',
    'cf-normalized-third',
    'cf-normalized-fourth',
    'normalized-score-b3',
    'cf-normalized-four',
  ],
};
