import { gradientClamp, gradientPhase } from '../arithmetic.mjs';
import { gradientCue, gradientDone } from '../construction.mjs';
import {
  drawExtensionCaption,
  drawExtensionDot,
  drawExtensionEquation,
  drawExtensionText,
  withTarget,
} from '../defaults.mjs';
export function drawStableScale(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gradientClamp(state.beatP ?? 0),
    cues = state.cues;
  const progress = (id, beat, a = 0.1, z = 0.8) =>
    currentBeat < beat
      ? 0
      : currentBeat > beat
        ? 1
        : gradientCue(cues, id, gradientPhase(progress2, a, z));
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && gradientDone(cues, id, progress2 > at));
  const paint = () => {
    if (currentBeat === 0) {
      const pl = teaching.axes({
        x: 350,
        y: 430,
        width: 1300,
        height: 350,
        xDomain: [0, 6],
        yDomain: [-1, 1],
        xTicks: [0, 1, 2, 3, 4, 5, 6],
        yTicks: [-1, -0.5, 0, 0.5, 1],
        xLabel: 'update count',
        yLabel: '',
        fontSize: 25,
      });
      drawExtensionText(
        ctx,
        api,
        'signed distance from w = 2.5',
        1000,
        320,
        34,
        themeColors.yellow,
        'center',
      );
      const runs = [
        [0.1, themeColors.green, 'stable-iterate', 0.12, 0.4],
        [0.25, themeColors.yellow, 'stable-boundary', 0.42, 0.65],
        [0.26, themeColors.pink, 'stable-outside', 0.68, 0.89],
      ];
      for (const [index, [rate, color, cue, from, until]] of runs.entries()) {
        const n = Math.floor(6 * progress(cue, 0, from, until));
        const values = Array.from(
            {
              length: n + 1,
            },
            (_, i) => 0.5 * (1 - 8 * rate) ** i,
          ),
          pts = values.map((v, i) => pl.point(i, v));
        api.path(ctx, pts, {
          color,
          width: 4,
          clip: pl.bounds,
        });
        pts.forEach((pt) => {
          drawExtensionDot(ctx, api, pt.x, pt.y, color, 6);
        });
        drawExtensionText(
          ctx,
          api,
          'η ' + rate,
          1680,
          430 + index * 85,
          27,
          color,
        );
      }
      drawExtensionEquation(
        ctx,
        api,
        String.raw`d_{k+1}=(1-8\eta)d_k`,
        960,
        900,
        47,
        themeColors.yellow,
      );
      drawExtensionCaption(
        ctx,
        api,
        'Zero is the optimum. The sign records which side the weight is on.',
      );
    } else if (currentBeat === 1) {
      const pl = teaching.axes({
          x: 350,
          y: 410,
          width: 1250,
          height: 390,
          xDomain: [1, 10],
          yDomain: [0, 1],
          xTicks: [1, 2, 4, 6, 8, 10],
          yTicks: [0, 0.25, 0.5, 1],
          xLabel: 'fixed nonzero feature x',
          yLabel: '',
          fontSize: 25,
        }),
        pts = Array.from(
          {
            length: 181,
          },
          (_, i) => {
            const x = 1 + i / 20;
            return pl.point(x, 1 / x ** 2);
          },
        );
      api.path(ctx, pts, {
        color: themeColors.cyan,
        width: 5,
      });
      drawExtensionText(
        ctx,
        api,
        'stable upper boundary for this scalar squared loss',
        960,
        315,
        32,
        themeColors.cyan,
        'center',
      );
      drawExtensionEquation(
        ctx,
        api,
        String.raw`0<\eta<1/x^2\qquad d_{k+1}=(1-2x^2\eta)d_k`,
        960,
        920,
        43,
        themeColors.yellow,
      );
      drawExtensionCaption(
        ctx,
        api,
        'Double the input and the upper bound falls to a quarter of its previous value.',
      );
    } else {
      const show = done('units-gradient', 2, 0.65);
      for (const [i, x, w, grad, limit] of [
        [0, 2, 3, 4, 0.25],
        [1, 200, 0.03, 400, 0.000025],
      ]) {
        const yy = 430 + i * 300;
        drawExtensionText(
          ctx,
          api,
          i ? 'raw tokens' : '100-token blocks',
          210,
          yy - 90,
          31,
          i ? themeColors.cyan : themeColors.blue,
        );
        drawExtensionEquation(
          ctx,
          api,
          String.raw`${x}\times${w}=6`,
          810,
          yy,
          53,
          themeColors.yellow,
        );
        withTarget(ctx, api, 'units-gradients', () => {
          drawExtensionText(
            ctx,
            api,
            show || i === 0 ? 'gradient ' + grad : 'gradient ?',
            1350,
            yy - 25,
            34,
            themeColors.pink,
          );
          drawExtensionText(
            ctx,
            api,
            done('units-bound', 2, 0.85) || i === 0 ? '0 < η < ' + limit : '0 < η < ?',
            1350,
            yy + 45,
            29,
            themeColors.cyan,
          );
        });
      }
      drawExtensionCaption(
        ctx,
        api,
        'Same prediction and observed target · different parameter units',
      );
    }
  };
  withTarget(ctx, api, 'stable-scale-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'stable-scale',
  draw: drawStableScale,
  cues: [
    'stable-scale-b1',
    'stable-iterate',
    'stable-boundary',
    'stable-outside',
    'stable-scale-b2',
    'stable-scale-b3',
    'units-gradient',
    'units-bound',
  ],
};
