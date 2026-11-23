import { binomialMass } from '../arithmetic.mjs';
import { samplingFilmData } from '../fixtures.mjs';
import { seededRandom } from 'vizmatic';
import { cueStep, samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionD,
  drawSamplingExtensionEquation,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
  drawSamplingExtensionRectangle,
  drawSamplingExtensionText,
} from '../defaults.mjs';
const random = seededRandom(1701);
const exampleBatch = Array.from({ length: 100 }, () => Number(random() < 0.72));

export function drawResolutionCount(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'resolution-count'),
    currentBeat = f.beat,
    progress = f.progress,
    bar = (q, x, v, width, color) => {
      const lo = q.point(x - width / 2, 0),
        hi = q.point(x + width / 2, v);
      drawSamplingExtensionRectangle(ctx, api, lo.x, hi.y, hi.x - lo.x, lo.y - hi.y, color);
    };
  api.focus.target('sp-resolution-count-visual', () => {
    if (currentBeat === 0) {
      const first = cueStep(state, 'resolution-first-four', 0, 0.08, 0.32);
      const rest = cueStep(state, 'sp-resolution-count-0', 0, 0.44, 0.73);
      const n = Math.floor(4 * first + 96 * rest);
      const resolved = exampleBatch.slice(0, n).reduce((sum, value) => sum + value, 0);
      api.text(ctx, 'One batch of 100 requests', 204, 312, 43, themeColors.ink);
      exampleBatch.forEach((flag, i) => {
        const x = 225 + 52 * (i % 20),
          y = 453 + 67 * Math.floor(i / 20);
        const color = i >= n ? themeColors.panel : flag ? themeColors.cyan : themeColors.pink;
        api.circle(ctx, x, y, 16, i < n && flag ? color : null, color, 3);
      });
      api.text(ctx, 'Requests drawn', 1510, 438, 35, themeColors.muted, 'center');
      api.text(ctx, String(n), 1510, 520, 57, themeColors.ink, 'center');
      api.text(ctx, 'Resolved', 1510, 655, 35, themeColors.cyan, 'center');
      api.text(ctx, String(resolved), 1510, 741, 57, themeColors.cyan, 'center');
      api.text(
        ctx,
        'Filled = resolved        Open pink = escalated',
        960,
        906,
        37,
        themeColors.ink,
        'center',
      );
      return;
    }
    if (currentBeat === 1) {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [45, 95],
        [0, 0.1],
        240,
        360,
        1060,
        460,
        'resolved among 100',
        'binomial probability',
      );
      for (let k = 46; k <= 45 + Math.floor(50 * progress); k++)
        bar(
          q,
          k,
          binomialMass(k, 100, 0.72),
          0.8,
          k === 72 ? themeColors.yellow : themeColors.blue,
        );
      drawSamplingExtensionNum(ctx, api, 'Expected count', '100 × .72 = 72', 405);
      drawSamplingExtensionNum(
        ctx,
        api,
        'Variance',
        progress === 1 ? '20.16' : 'n p (1 − p)',
        610,
        themeColors.cyan,
      );
      if (progress === 1)
        drawSamplingExtensionEquation(
          ctx,
          api,
          'P(X=72)\\approx0.089',
          1500,
          835,
          31,
          themeColors.yellow,
          'center',
        );
    } else {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0.5, 6.5],
        [60, 85],
        260,
        360,
        1050,
        455,
        'executed batch identity',
        'resolved / 100',
      );
      drawSamplingExtensionL(ctx, api, [q.point(0.5, 72), q.point(6.5, 72)], themeColors.yellow, 3);
      samplingFilmData.resolved.slice(0, Math.floor(progress * 6 + 0.00001)).forEach((v, i) => {
        const at = q.point(i + 1, v);
        drawSamplingExtensionD(ctx, api, at.x, at.y, themeColors.cyan, 14);
        drawSamplingExtensionText(ctx, api, v, at.x, 930, 30, themeColors.cyan, 'center');
      });
      drawSamplingExtensionNum(ctx, api, 'Assumed p', '0.72', 435);
      drawSamplingExtensionNum(
        ctx,
        api,
        'Observed range',
        progress === 1 ? '69–78' : 'building',
        650,
        themeColors.green,
      );
    }
    drawSamplingExtensionFooter(
      ctx,
      api,
      'Each request has the same independent 72% chance to resolve',
    );
  });
}
export default {
  id: 'resolution-count',
  draw: drawResolutionCount,
  cues: [
    'resolution-first-four',
    'sp-resolution-count-0',
    'sp-resolution-count-1',
    'sp-resolution-count-2',
  ],
};
