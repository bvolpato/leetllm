import { evidenceBound, logLikelihood, restrictedModel } from '../arithmetic.mjs';
import { observations } from '../fixtures.mjs';
import { constructedFrame } from '../construction.mjs';
import { boundGeometry } from '../model.mjs';
import { drawConstructedCurve, drawConstructedPlot } from '../defaults.mjs';

const fit = boundGeometry();
const score = (mean) => logLikelihood(observations, restrictedModel(mean));
const bound = (rows, mean) => evidenceBound(observations, rows, restrictedModel(mean));

export function drawTouchingBound(ctx, scene, state, api) {
  const { C } = api;
  const f = constructedFrame(state);
  const move = f.progress('bound-move', 1);
  const tighten = f.progress('bound-tighten', 3);
  const mean = fit.oldMean + (fit.newMean - fit.oldMean) * move;
  const rows = fit.qOld.map((row, i) =>
    row.map((v, k) => v + (fit.qNew[i][k] - v) * tighten));
  const likelihood = score(mean);
  const lower = bound(rows, mean);
  const label = (s, px, py, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, px, py, size, color, align);

  api.focus.target('bound-plot', () => {
    label('First mean   ' + mean.toFixed(2) + ' ms', 165, 263, 40);
    label('Second mean 90 ms     Both variances 400 ms²     Equal priors', 165, 315, 26, C.muted);
    const plot = drawConstructedPlot(ctx, api, 179, 426, 865, 346, [20, 80], [-36, -26],
      'first mean (ms)', 'log likelihood and lower bound', [20, 40, 60, 80], [-36, -32, -28]);
    drawConstructedCurve(ctx, api, plot, score, 20, 80, C.green, 6);
    if (tighten > 0) {
      drawConstructedCurve(ctx, api, plot, (v) => bound(fit.qOld, v), 20, 80, C.muted, 2);
    }
    drawConstructedCurve(ctx, api, plot, (v) => bound(rows, v), 20, 80, C.yellow, 4);
    const hi = plot.point(mean, likelihood);
    const lo = plot.point(mean, lower);
    api.line(ctx, lo.x, 772, lo.x, lo.y, C.muted, 2);
    api.line(ctx, lo.x, lo.y, hi.x, hi.y, C.ink, 4);
    api.circle(ctx, hi.x, hi.y, 13, C.green);
    api.circle(ctx, lo.x, lo.y, 7, C.yellow);
    label('Likelihood  ' + likelihood.toFixed(3), 178, 919, 32, C.green);
    label('Bound  ' + lower.toFixed(3), 664, 919, 32, C.yellow);
  });

  api.focus.target('bound-memberships', () => {
    label('Share of each request', 1140, 263, 38);
    label('First', 1250, 337, 27, C.blue);
    label('Second', 1485, 337, 27, C.pink);
    label('First share', 1655, 337, 26, C.muted);
    rows.forEach(([first, second], i) => {
      const y = 386 + 72 * i;
      const width = 376;
      label(observations[i] + ' ms', 1140, y + 30, 28);
      api.rect(ctx, 1250, y, first * width, 38, C.blue, undefined, 0);
      api.rect(ctx, 1250 + first * width, y, second * width, 38, C.pink, undefined, 0);
      label(first.toFixed(3), 1660, y + 31, 29, C.blue);
    });
    label(tighten === 0 ? 'Shares computed at 70 ms' :
      tighten < 1 ? 'Updating the six shares' : 'Shares recomputed at ' + mean.toFixed(2) + ' ms',
      1140, 838, 26, C.muted);
    if (f.beat < 2) {
      label('Weighted sum / effective count', 1140, 905, 27, C.muted);
      label(fit.numerator.toFixed(3) + ' / ' + fit.count.toFixed(3) +
        (move >= 1 ? ' ≈ ' + mean.toFixed(2) + ' ms' : ' = ? ms'), 1140, 968, 32, C.blue);
    } else {
      label('Gap   ' + Math.max(0, likelihood - lower).toFixed(3) + ' nats', 1140, 923, 36, C.ink);
    }
  });
  if (f.beat === 2 || (f.beat === 3 && tighten === 0)) {
    api.focus.target('bound-question', () => label('Which can move here, likelihood or bound?',
      178, 1006, 33, C.yellow));
  }
  if (f.beat >= 4) {
    label(fit.oldLikelihood.toFixed(3) + '   ≤   ' + fit.oldBoundNew.toFixed(3) + '   ≤   ' +
      fit.newLikelihood.toFixed(3), 178, 1006, 36, C.ink);
  }
}
export default {
  id: 'touching-bound',
  draw: drawTouchingBound,
  cues: ['bound-freeze', 'bound-move', 'bound-compare', 'bound-predict', 'bound-tighten', 'bound-chain'],
};
