import { gammaDensity } from '../arithmetic.mjs';
import { observations } from '../fixtures.mjs';
import { constructedFrame } from '../construction.mjs';
import { boundGeometry, fitted, symmetricFit, totalVarianceMle } from '../model.mjs';
import {
  axes,
  drawConstructedCurve,
  drawConstructedHead,
  drawConstructedLine,
  drawConstructedNote,
  drawConstructedPlot,
  drawConstructedText,
  equation,
  text,
  visualFocus,
} from '../defaults.mjs';
function drawConstructed(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    teaching = boundGeometry();
  api.focus.target('initialization-operation', () => {
    const revealed = f.started('em-symmetry-answer'),
      v = 900 + (totalVarianceMle - 900) * f.progress('em-symmetry-answer');
    drawConstructedHead(
      ctx,
      api,
      revealed
        ? 'Equal memberships keep both components identical'
        : 'Identical starts: can EM separate the two peaks?',
    );
    const p = drawConstructedPlot(
      ctx,
      api,
      240,
      390,
      1130,
      430,
      [0, 120],
      [0, 0.014],
      'latency (ms)',
      'density per ms',
      [0, 30, 60, 90, 120],
      [0, 0.007, 0.014],
    );
    api.focus.target('initialization-simulation-62', () => {
      drawConstructedCurve(
        ctx,
        api,
        p,
        (x) => 0.5 * gammaDensity(x, 60, v),
        0,
        120,
        themeColors.blue,
        8,
      );
      drawConstructedCurve(
        ctx,
        api,
        p,
        (x) => 0.5 * gammaDensity(x, 60, v),
        0,
        120,
        themeColors.pink,
        3,
      );
      observations.forEach((x) => {
        const q = p.point(x, 0);
        drawConstructedLine(ctx, api, q.x, q.y, q.x, q.y - 18, themeColors.yellow, 3);
      });
    });
    drawConstructedText(ctx, api, 'μ1 = μ2 = 60 ms', 1580, 430, 32, themeColors.cyan, 'center');
    if (revealed) {
      drawConstructedText(
        ctx,
        api,
        'each row: [0.5, 0.5]',
        1580,
        580,
        29,
        themeColors.yellow,
        'center',
      );
      drawConstructedText(ctx, api, 'N1 = N2 = 3', 1580, 715, 32, themeColors.yellow, 'center');
      drawConstructedText(
        ctx,
        api,
        'both variances ' + v.toFixed(3),
        1580,
        850,
        27,
        themeColors.cyan,
        'center',
      );
    }
    drawConstructedNote(ctx, api, 'Exact steps have no asymmetry to distinguish the components.');
  });
}
export function drawInitialization(ctx, scene, state, api) {
  if (state.beat === 0) return drawConstructed(ctx, scene, state, api);
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const mixModel = {
    weights: [0.5, 0.5],
    means: [30, 90],
    variances: [400, 400],
  };
  {
    if (currentBeat === 2) {
      const sd = 2 - 1.8 * phaseForBeat(2),
        floorSd = Math.max(1, sd);
      const graph = axes(
        ctx,
        api,
        250,
        390,
        980,
        420,
        [24, 32],
        [0, 2.1],
        'latency around one observed point · ms',
        'density / ms',
        [24, 26, 28, 30, 32],
        [0, 1, 2],
      );
      const points = Array.from(
        {
          length: 161,
        },
        (_, i) => 24 + i / 20,
      );
      visualFocus(ctx, api, 'initialization-collapse', () => {
        api.teaching.curve({
          plot: graph,
          points: points.map((x) => ({
            x,
            y: gammaDensity(x, 28, sd * sd),
          })),
          color: themeColors.pink,
          width: 5,
        });
        api.teaching.curve({
          plot: graph,
          points: points.map((x) => ({
            x,
            y: gammaDensity(x, 28, floorSd * floorSd),
          })),
          color: themeColors.green,
          width: 4,
        });
        const at = graph.point(28, 0);
        api.circle(ctx, at.x, at.y, 10, themeColors.yellow);
      });
      text(ctx, api, 'One observed point', 1400, 400, 30, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        'Unconstrained spread ' + sd.toFixed(2) + ' ms',
        1510,
        530,
        27,
        themeColors.pink,
        'center',
      );
      text(ctx, api, 'Variance floor: 1 ms²', 1510, 660, 27, themeColors.green, 'center');
      text(
        ctx,
        api,
        'Peak density ' + gammaDensity(28, 28, sd * sd).toFixed(2) + ' / ms',
        1510,
        780,
        27,
        themeColors.pink,
        'center',
      );
      {
      }
      return;
    }
    const comparison = [
      {
        label: 'separated start',
        row: 1.5,
        value: fitted.history.at(-1),
        color: themeColors.green,
      },
      {
        label: 'symmetric start',
        row: 0.7,
        value: symmetricFit.history.at(-1),
        color: themeColors.pink,
      },
    ];
    const graph = api.teaching.axes({
      x: 310,
      y: 400,
      width: 900,
      height: 380,
      xDomain: [-32, -15],
      yDomain: [0, 2.2],
      xLabel: 'final log likelihood · higher is farther right',
      yLabel: '',
      xTicks: [-30, -25, -20, -15],
      yTicks: [],
      formatX: (value) => `−${Math.abs(value)}`,
      fontSize: 25,
    });
    visualFocus(ctx, api, 'initialization-simulation-62', () =>
      comparison.forEach((item) => {
        const shownValue = api.lerp(-32, item.value, phaseForBeat(0));
        const end = graph.point(shownValue, item.row);
        const start = graph.point(-32, item.row);
        api.line(ctx, start.x, start.y, end.x, end.y, item.color, 14);
        api.circle(ctx, end.x, end.y, 11, item.color);
        text(ctx, api, item.label, 290, start.y + 8, 25, item.color, 'right');
        text(
          ctx,
          api,
          `−${Math.abs(shownValue).toFixed(2)}`,
          end.x + 18,
          end.y - 12,
          26,
          item.color,
        );
      }),
    );
    equation(
      ctx,
      api,
      String.raw`\mu_1=\mu_2=60\text{ ms}`,
      1470,
      580,
      43,
      themeColors.pink,
      'center',
    );
    visualFocus(
      ctx,
      api,
      'initialization-object-identical-components-keep-identical-responsibiliti-67',
      () =>
        text(
          ctx,
          api,
          'Identical components keep identical responsibilities.',
          1470,
          675,
          27,
          themeColors.ink,
          'center',
        ),
    );
    {
    }
  }
}
export default {
  id: 'initialization',
  draw: drawInitialization,
  cues: [
    'initialization-beat-1-focus-1',
    'initialization-beat-1-focus-2',
    'em-symmetry-answer',
    'initialization-beat-2-focus-1',
    'initialization-beat-3-focus-1',
  ],
};
