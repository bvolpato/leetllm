import { samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionD,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
  drawSamplingExtensionRectangle,
} from '../defaults.mjs';
export function drawMassAndSupport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'mass-and-support'),
    currentBeat = f.beat,
    progress = f.progress,
    bar = (q, x, v, width, color) => {
      const lo = q.point(x - width / 2, 0),
        hi = q.point(x + width / 2, v);
      drawSamplingExtensionRectangle(ctx, api, lo.x, hi.y, hi.x - lo.x, lo.y - hi.y, color);
    };
  api.focus.target('sp-mass-and-support-visual', () => {
    if (currentBeat === 0) {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [-0.5, 1.5],
        [0, 1],
        300,
        365,
        900,
        450,
        'resolution outcome',
        'probability mass',
      );
      bar(q, 0, 0.28 * progress, 0.25, themeColors.pink);
      bar(q, 1, 0.72 * progress, 0.25, themeColors.green);
      drawSamplingExtensionNum(
        ctx,
        api,
        'Mass at 0 / 1',
        progress === 1 ? '0.28 / 0.72' : 'building',
        410,
      );
      drawSamplingExtensionNum(
        ctx,
        api,
        'Total mass',
        progress === 1 ? '1.00' : '?',
        610,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0, 0.6],
        [0, 2.5],
        280,
        365,
        1020,
        450,
        'duration (seconds)',
        'density / second',
      );
      const x = q.point(0, 2),
        z = q.point(0.5, 0);
      drawSamplingExtensionRectangle(
        ctx,
        api,
        x.x,
        x.y,
        z.x - x.x,
        z.y - x.y,
        themeColors.blue + '50',
      );
      drawSamplingExtensionL(
        ctx,
        api,
        [q.point(0, 0), q.point(0, 2), q.point(0.5, 2), q.point(0.5, 0)],
        themeColors.blue,
        4,
      );
      const frac = f.go('sp-uniform-area', state.beatP);
      const a = q.point(0.1, 2),
        end = q.point(0.1 + 0.2 * frac, 0);
      drawSamplingExtensionRectangle(
        ctx,
        api,
        a.x,
        a.y,
        Math.max(0.5, end.x - a.x),
        end.y - a.y,
        themeColors.cyan + '80',
      );
      drawSamplingExtensionNum(ctx, api, 'Height', '2 / s', 385);
      drawSamplingExtensionNum(
        ctx,
        api,
        'Width × height',
        frac === 1 ? '0.2 × 2 = 0.4' : 'area building',
        590,
        themeColors.yellow,
      );
    } else {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [-0.5, 1.5],
        [0, 1],
        300,
        365,
        1000,
        450,
        'resolution outcome',
        'cumulative probability',
      );
      drawSamplingExtensionL(
        ctx,
        api,
        [
          q.point(-0.5, 0),
          q.point(0, 0),
          q.point(0, 0.28),
          q.point(1, 0.28),
          q.point(1, 1),
          q.point(1.5, 1),
        ],
        themeColors.cyan,
        5,
      );
      drawSamplingExtensionD(
        ctx,
        api,
        q.point(0, 0.28).x,
        q.point(0, 0.28).y,
        themeColors.yellow,
        11,
      );
      drawSamplingExtensionD(ctx, api, q.point(1, 1).x, q.point(1, 1).y, themeColors.yellow, 11);
      drawSamplingExtensionNum(ctx, api, 'P(R ≤ 0)', '0.28', 410);
      drawSamplingExtensionNum(ctx, api, 'P(R ≤ 1)', '1.00', 610, themeColors.green);
    }
    drawSamplingExtensionFooter(
      ctx,
      api,
      currentBeat === 1
        ? 'Probability is interval area; density height carries inverse-time units'
        : 'Declared support first; probability masses and CDF jumps retain the same outcomes',
    );
  });
}
export default {
  id: 'mass-and-support',
  draw: drawMassAndSupport,
  cues: [
    'sp-mass-and-support-0',
    'sp-mass-and-support-1',
    'sp-uniform-area',
    'sp-mass-and-support-2',
  ],
};
