import { gammaDensity, varianceObjective } from '../arithmetic.mjs';
import { observations } from '../fixtures.mjs';
import { constructedFrame } from '../construction.mjs';
import { boundGeometry } from '../model.mjs';
import {
  drawConstructedCurve,
  drawConstructedEquation,
  drawConstructedHead,
  drawConstructedLine,
  drawConstructedNote,
  drawConstructedPlot,
  drawConstructedText,
} from '../defaults.mjs';
export function drawVarianceConstraint(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    teaching = boundGeometry();
  api.focus.target('variance-constraint-operation', () => {
    if (currentBeat === 0) {
      drawConstructedHead(
        ctx,
        api,
        'One positive-weight point spike · another component covers the rest',
      );
      const sd = 2 - 1.8 * f.progress('variance-collapse'),
        p = drawConstructedPlot(
          ctx,
          api,
          220,
          390,
          1140,
          440,
          [0, 120],
          [0, 1.1],
          'latency (ms)',
          'weighted density / ms',
          [0, 28, 60, 90, 120],
          [0, 0.5, 1],
        );
      drawConstructedCurve(
        ctx,
        api,
        p,
        (x) => 0.5 * gammaDensity(x, 28, sd * sd),
        0,
        120,
        themeColors.pink,
        5,
      );
      drawConstructedCurve(
        ctx,
        api,
        p,
        (x) => 0.5 * gammaDensity(x, 90, 900),
        0,
        120,
        themeColors.blue,
        4,
      );
      observations.forEach((x) => {
        const q = p.point(x, 0);
        drawConstructedLine(ctx, api, q.x, q.y, q.x, q.y - 15, themeColors.yellow, 3);
      });
      drawConstructedText(
        ctx,
        api,
        'shrinking sd ' + sd.toFixed(3) + ' ms',
        1580,
        525,
        30,
        themeColors.pink,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        'positive second component',
        1580,
        665,
        25,
        themeColors.blue,
        'center',
      );
      drawConstructedNote(
        ctx,
        api,
        'As the pink peak narrows, the broad component still covers the other five requests.',
      );
    } else if (currentBeat === 1) {
      drawConstructedHead(ctx, api, 'Separate worksheet · N = 4, S = 1 · fixed floor v ≥ 1');
      const p = drawConstructedPlot(
        ctx,
        api,
        250,
        380,
        1120,
        470,
        [0.05, 2.5],
        [-5, 1],
        'variance v',
        'variance-dependent Q',
        [0.25, 1, 1.25, 2],
        [-4, -2, 0],
      );
      drawConstructedCurve(ctx, api, p, varianceObjective, 0.05, 2.5, themeColors.muted, 4);
      const floor = p.point(1, -5);
      drawConstructedLine(ctx, api, floor.x, 380, floor.x, 850, themeColors.green, 4);
      if (f.completed('variance-optimum', 1)) {
        const q = p.point(0.25, varianceObjective(0.25));
        api.circle(ctx, q.x, q.y, 12, themeColors.pink);
        drawConstructedText(ctx, api, 'S/N = 0.25', 1570, 440, 32, themeColors.pink, 'center');
      }
      if (f.completed('variance-floor', 1)) {
        const q = p.point(1, varianceObjective(1));
        api.circle(ctx, q.x, q.y, 13, themeColors.green);
        drawConstructedText(ctx, api, 'clamp = 1.00', 1570, 600, 32, themeColors.green, 'center');
      }
      if (f.completed('variance-ridge', 1)) {
        const q = p.point(1.25, varianceObjective(1.25));
        api.circle(ctx, q.x, q.y, 12, themeColors.yellow);
        drawConstructedText(
          ctx,
          api,
          'add ridge = 1.25',
          1570,
          760,
          31,
          themeColors.yellow,
          'center',
        );
      }
      drawConstructedEquation(
        ctx,
        api,
        String.raw`Q(v)=-\frac N2\log v-\frac S{2v}+constant`,
        960,
        970,
        38,
        themeColors.cyan,
      );
    } else {
      drawConstructedHead(ctx, api, 'The same feasible space bounds every update');
      drawConstructedText(
        ctx,
        api,
        'Apply the same floor to each variance update',
        960,
        370,
        33,
        themeColors.pink,
        'center',
      );
      const q = drawConstructedPlot(
        ctx,
        api,
        280,
        440,
        1320,
        160,
        [0, 3],
        [0, 1],
        'variance (ms²)',
        '',
        [0, 1, 2, 3],
        [],
      );
      const floor = q.point(1, 0.5);
      drawConstructedLine(ctx, api, floor.x, 425, floor.x, 585, themeColors.green, 4);
      const v = 0.25 + 0.75 * f.progress('variance-feasible'),
        point = q.point(v, 0.5);
      api.circle(ctx, point.x, point.y, 14, themeColors.yellow);
      drawConstructedText(ctx, api, 'v ≥ 1', floor.x + 60, 520, 36, themeColors.green);
      drawConstructedEquation(
        ctx,
        api,
        String.raw`p(x)\leq\frac1{\sqrt{2\pi v_{min}}}`,
        960,
        780,
        47,
        themeColors.cyan,
      );
      drawConstructedText(
        ctx,
        api,
        'Fixed floor 1 → finite density ceiling ' +
          (1 / Math.sqrt(2 * Math.PI)).toFixed(6) +
          ' / ms',
        960,
        940,
        33,
        themeColors.green,
        'center',
      );
    }
  });
}
export default {
  id: 'variance-constraint',
  draw: drawVarianceConstraint,
  cues: [
    'variance-constraint-0',
    'variance-collapse',
    'variance-constraint-1',
    'variance-optimum',
    'variance-floor',
    'variance-ridge',
    'variance-constraint-2',
    'variance-feasible',
  ],
};
