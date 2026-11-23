import { riskAtRatio } from '../arithmetic.mjs';
import { cueEnded, glow, line, text } from '../defaults.mjs';
export function drawInterpolationRisk(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cue = (id) => state.cues?.[id],
    begun = (id) => Boolean(cue(id) && cue(id).phase !== 'before');
  const main = () => {
    if (currentBeat >= 3) {
      const { C } = api;
      text(
        ctx,
        api,
        'Two samples, two coefficients in both designs',
        960,
        296,
        44,
        C.ink,
        'center',
      );
      const copy = cueEnded(state, 'copy-column');
      for (const [i, rows] of [
        [
          [1, 0],
          [0, 1],
        ],
        copy
          ? [
              [1, 1],
              [0, 0],
            ]
          : [
              [1, 0],
              [0, 1],
            ],
      ].entries()) {
        const cx = i ? 1390 : 520;
        text(
          ctx,
          api,
          i ? (copy ? 'Repeated column' : 'Second design') : 'Identity design',
          cx,
          410,
          37,
          C.muted,
          'center',
        );
        rows.forEach((row, j) =>
          row.forEach((value, k) => {
            const x = cx - 105 + 125 * k,
              y = 465 + 100 * j;
            api.rect(ctx, x, y, 88, 77, C.panel, i ? C.yellow : C.blue, 6);
            text(ctx, api, String(value), x + 44, y + 54, 48, C.ink, 'center');
          }),
        );
        if (cueEnded(state, 'square-designs'))
          text(
            ctx,
            api,
            i ? 'One independent column' : 'Two independent columns',
            cx,
            778,
            39,
            C.ink,
            'center',
          );
      }
      const note = cueEnded(state, 'square-designs')
        ? 'Adding (1, −1) to the weights leaves both predictions on the right unchanged.'
        : copy
          ? 'Which design lets you change the weights without changing either prediction?'
          : 'Each column gives the effect of one weight on both predictions.';
      text(ctx, api, note, 960, 962, 37, C.cyan, 'center');
      return;
    }
    const plot = api.teaching.axes({
      x: 210,
      y: 350,
      width: 1200,
      height: 520,
      xDomain: [0, 4],
      yDomain: [0, 6],
      xLabel: 'parameters / samples',
      yLabel: 'excess squared prediction risk',
      xTicks: [0, 1, 2, 3, 4],
      yTicks: [0, 1, 2, 3, 4, 5, 6],
      fontSize: 27,
    });
    for (const [lo, hi] of [
      [0.03, 0.85],
      [1.2, 4],
    ]) {
      const points = Array.from(
        {
          length: 120,
        },
        (_, i) => {
          const x = lo + ((hi - lo) * i) / 119;
          return {
            x,
            y: riskAtRatio(x),
          };
        },
      );
      api.teaching.curve({
        plot,
        points,
        color: themeColors.yellow,
        width: 5,
        progress: 1,
      });
    }
    if (currentBeat === 0 && begun('follow-branch')) {
      const ratio = 1.2 + 2.8 * cue('follow-branch').progress;
      const at = plot.point(ratio, riskAtRatio(ratio));
      api.circle(ctx, at.x, at.y, 15, themeColors.cyan);
    }
    const ratio = 2,
      risk = riskAtRatio(ratio),
      point = plot.point(ratio, risk),
      inputReady = currentBeat > 1 || begun('gamma-two-inputs'),
      resultReady = currentBeat > 1 || cueEnded(state, 'gamma-two-result');
    if (inputReady) {
      if (resultReady)
        glow(ctx, api, themeColors.yellow, () =>
          api.circle(ctx, point.x, point.y, 13, themeColors.yellow),
        );
      else line(ctx, api, point.x, 350, point.x, 870, themeColors.muted, 2);
      text(ctx, api, `γ = ${ratio.toFixed(2)}`, 1610, 390, 40, themeColors.yellow, 'center');
    } else text(ctx, api, 'γ = parameters / samples', 1610, 390, 28, themeColors.muted, 'center');
    const bias = 1 - 1 / ratio,
      variance = 1 / (ratio - 1);
    if (resultReady) {
      text(ctx, api, `bias² ${bias.toFixed(2)}`, 1610, 520, 36, themeColors.blue, 'center');
      text(ctx, api, `variance ${variance.toFixed(2)}`, 1610, 610, 36, themeColors.pink, 'center');
      text(ctx, api, `total ${risk.toFixed(2)}`, 1610, 730, 49, themeColors.green, 'center');
      if (currentBeat === 1 && cueEnded(state, 'noisy-response')) {
        text(ctx, api, 'Including response noise', 1610, 824, 30, themeColors.muted, 'center');
        text(ctx, api, (risk + 1).toFixed(2), 1610, 882, 43, themeColors.ink, 'center');
      }
    } else text(ctx, api, 'Squared bias + variance', 1610, 610, 25, themeColors.muted, 'center');
    text(
      ctx,
      api,
      'Specified Gaussian linear limit · signal² = noise variance = 1 · minimum norm',
      960,
      990,
      31,
      themeColors.muted,
      'center',
    );
  };
  // The cue target is the actual spatial construction for this scene.
  if (api.focus) api.focus.target(`${'interpolation-risk'}-construction`, main);
  else main();
}
export default {
  id: 'interpolation-risk',
  draw: drawInterpolationRisk,
  cues: [
    'interpolation-risk-voice-1',
    'follow-branch',
    'interpolation-risk-voice-2',
    'gamma-two-inputs',
    'gamma-two-result',
    'noisy-response',
    'interpolation-risk-voice-3',
    'copy-column',
    'square-designs',
  ],
};
