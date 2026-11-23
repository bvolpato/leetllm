import { gammaDensity, logLikelihood, mixtureDensity } from '../arithmetic.mjs';
import { constructedFrame } from '../construction.mjs';
import { fitted, symmetricFit } from '../model.mjs';
import {
  drawConstructedCurve,
  drawConstructedHead,
  drawConstructedLine,
  drawConstructedNote,
  drawConstructedPlot,
  drawConstructedText,
} from '../defaults.mjs';
const validationTimes = [29, 31, 88, 92];

export function drawModelChecks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    colors = [themeColors.blue, themeColors.pink];
  api.focus.target('model-checks-operation', () => {
    drawConstructedHead(
      ctx,
      api,
      currentBeat <= 1
        ? 'Four held-out request times'
        : currentBeat === 2
          ? 'A larger family can contain the same density'
          : 'Component names can change while the density stays fixed',
    );
    const p = drawConstructedPlot(
      ctx,
      api,
      220,
      370,
      1120,
      460,
      [-10, 120],
      [0, 0.14],
      'latency (ms)',
      'density / ms',
      [0, 30, 60, 90, 120],
      [0, 0.07, 0.14],
    );
    drawConstructedCurve(
      ctx,
      api,
      p,
      (x) => mixtureDensity(x, fitted.model),
      -10,
      120,
      themeColors.green,
      5,
    );
    if (currentBeat <= 1) {
      drawConstructedCurve(
        ctx,
        api,
        p,
        (x) => mixtureDensity(x, symmetricFit.model),
        -10,
        120,
        themeColors.pink,
        4,
      );
      const height = f.progress('model-checks-heights', 0);
      validationTimes.forEach((x) => {
        const mark = p.point(x, 0);
        const upper = p.point(x, mixtureDensity(x, fitted.model));
        const lower = p.point(x, mixtureDensity(x, symmetricFit.model));
        const topY = api.lerp(mark.y, upper.y, height);
        drawConstructedLine(ctx, api, mark.x, mark.y, mark.x, topY, themeColors.yellow, 3);
        api.circle(ctx, mark.x, mark.y, 6, themeColors.yellow);
        if (topY <= lower.y) api.circle(ctx, lower.x, lower.y, 6, themeColors.pink);
        if (height === 1) api.circle(ctx, upper.x, upper.y, 6, themeColors.green);
      });
      for (const [i, center] of fitted.model.means.entries()) {
        if (f.completed('model-checks-spread', 0)) {
          const numerator = Math.round(3 * fitted.model.variances[i]);
          drawConstructedText(ctx, api, 'Variance   ' + numerator + '/3 ms²',
            p.point(center, 0).x, 340, 28, themeColors.green, 'center');
        }
        const pair = validationTimes.slice(i * 2, i * 2 + 2).join(' and ');
        drawConstructedText(ctx, api, pair + ' ms', p.point(center, 0).x, 992, 33,
          themeColors.yellow, 'center');
      }
      drawConstructedText(ctx, api, 'Mean log density', 1570, 372, 31, themeColors.ink, 'center');
      const scores = [
        { label: 'Separated peaks', fit: fitted, cue: 'em-validation-separated', color: themeColors.green },
        { label: 'Identical peaks', fit: symmetricFit, cue: 'em-validation-symmetric', color: themeColors.pink },
      ];
      scores.forEach(({ label, fit, cue, color }, i) => {
        const y = 494 + i * 191;
        drawConstructedText(ctx, api, label, 1570, y, 34, color, 'center');
        if (f.completed(cue, 1)) {
          const average = logLikelihood(validationTimes, fit.model) / validationTimes.length;
          drawConstructedText(ctx, api, average.toFixed(2), 1570, y + 75, 55, color, 'center');
        }
      });
    } else if (currentBeat === 2) {
      const t = f.progress('model-nesting', 2),
        duplicate = {
          weights: [0.5 - 0.25 * t, 0.25 * t, 0.5],
          means: [30, 30, 90],
          variances: [8 / 3, 8 / 3, 32 / 3],
        };
      duplicate.weights.forEach((w, k) =>
        drawConstructedCurve(
          ctx,
          api,
          p,
          (x) => w * gammaDensity(x, duplicate.means[k], duplicate.variances[k]),
          -10,
          120,
          [themeColors.blue, themeColors.cyan, themeColors.pink][k],
          3,
        ),
      );
      if (f.started('model-nesting')) {
        drawConstructedText(
          ctx,
          api,
          'weights [' + duplicate.weights.map((w) => w.toFixed(3)).join(', ') + ']',
          1560,
          440,
          27,
          themeColors.cyan,
          'center',
        );
        drawConstructedText(
          ctx,
          api,
          'means [30, 30, 90]',
          1560,
          550,
          29,
          themeColors.cyan,
          'center',
        );
        drawConstructedText(
          ctx,
          api,
          'same summed density',
          1560,
          710,
          31,
          themeColors.green,
          'center',
        );
      }
      drawConstructedNote(
        ctx,
        api,
        'The two copies share the original weight.',
      );
    } else {
      const swap = f.started('model-label-swap');
      fitted.model.weights.forEach((w, k) =>
        drawConstructedCurve(
          ctx,
          api,
          p,
          (x) => w * gammaDensity(x, fitted.model.means[k], fitted.model.variances[k]),
          -10,
          120,
          colors[swap ? 1 - k : k],
          3,
        ),
      );
      drawConstructedText(
        ctx,
        api,
        'component 1: mean ' + (swap ? 90 : 30),
        1560,
        440,
        29,
        themeColors.blue,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        'component 2: mean ' + (swap ? 30 : 90),
        1560,
        590,
        29,
        themeColors.pink,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        'mixture unchanged',
        1560,
        740,
        34,
        themeColors.green,
        'center',
      );
      drawConstructedNote(
        ctx,
        api,
        'Both names describe the same mixture density.',
      );
    }
  });
}
export default {
  id: 'model-checks',
  draw: drawModelChecks,
  cues: [
    'model-checks-0',
    'model-checks-spread',
    'model-checks-heights',
    'em-validation-separated',
    'em-validation-symmetric',
    'model-checks-1',
    'model-nesting',
    'model-checks-2',
    'model-label-swap',
  ],
};
