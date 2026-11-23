import { labels, strengths } from '../fixtures.mjs';
import { svdFrame } from '../model.mjs';
import { arrow, caption, curve, equation, line, plane, target, text } from '../defaults.mjs';
export function drawSvdRotate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  const f = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  const circle = (plot, scale, color, width = 3) =>
    curve(
      ctx,
      api,
      plot,
      Array.from(
        {
          length: 121,
        },
        (_, i) => {
          const a = (i / 120) * Math.PI * 2;
          return [Math.cos(a) * scale[0], Math.sin(a) * scale[1]];
        },
      ),
      color,
      width,
    );
  const grid = (plot, map, min = -1, max = 1, step = 0.5, lineColor = '#8d9cb955') => {
    for (let k = min; k <= max + 1e-9; k += step)
      for (const ends of [
        [
          [min, k],
          [max, k],
        ],
        [
          [k, min],
          [k, max],
        ],
      ])
        curve(ctx, api, plot, ends.map(map), lineColor, 2);
  };
  const outputRow = (values, y = 830, prefix = 'svd-ticket-') =>
    values.forEach((v, i) =>
      target(ctx, api, prefix + i, () => {
        const x = 300 + i * 470;
        api.rect(ctx, x, y, 380, 108, themeColors.panel, colors[i], 2, 8);
        text(ctx, api, 't' + i + ' · ' + labels[i], x + 190, y + 31, 24, colors[i], 'center');
        text(ctx, api, v === null ? '?' : f(v, 3), x + 190, y + 82, 42, colors[i], 'center');
      }),
    );
  {
    const step = 0;
    const cues = {
      ...state.cues,
      ...(step === 1
        ? {
            'svd-output': {
              phase: 'before',
              progress: 0,
            },
          }
        : step === 2
          ? {
              'singular-strengths': {
                phase: 'after',
                progress: 1,
              },
            }
          : {}),
    };
    const c = svdFrame({
        ...state,
        beat: step ? 1 : 0,
        cues,
      }),
      q = plane(ctx, api, [-3, 3, -1.65, 1.65], 180, 290, 1560, step === 2 ? 465 : 560, '', '');
    equation(ctx, api, 'A=U\\Sigma V^T', 960, 240, 46, themeColors.ink);
    text(
      ctx,
      api,
      step === 0
        ? 'Feature space → singular coordinates'
        : step === 1
          ? 'Singular coordinates → stretched coordinates'
          : 'Stretched coordinates → ticket outputs',
      960,
      280,
      27,
      themeColors.muted,
      'center',
    );
    if (step < 2) {
      const map = (v) => {
        const a = c.angle,
          x = v[0] * Math.cos(a) - v[1] * Math.sin(a),
          y = v[0] * Math.sin(a) + v[1] * Math.cos(a);
        return [x * (1 + (strengths[0] - 1) * c.scale), y];
      };
      grid(q, map, -1.25, 1.25, 0.25);
      circle(q, [1 + (strengths[0] - 1) * c.scale, 1], themeColors.cyan, 4);
      target(ctx, api, step ? 'singular-strengths' : 'svd-input-basis', () => {
        arrow(ctx, api, q, [0, 0], step ? c.scaled : c.rotated, themeColors.green, 8);
        equation(
          ctx,
          api,
          step ? '\\Sigma=\\operatorname{diag}(\\sqrt3,1)' : 'V^Tx',
          960,
          940,
          48,
          step ? themeColors.yellow : themeColors.green,
        );
      });
    } else {
      grid(q, (v) => v, -1.5, 1.5, 0.5);
      target(ctx, api, 'svd-output', () => {
        if (c.partProgress.some((p) => p > 0)) {
          line(ctx, api, q, [0, 0], c.firstOutputCoordinates, themeColors.yellow, 5);
          line(
            ctx,
            api,
            q,
            c.firstOutputCoordinates,
            c.fixedOutputCoordinates,
            themeColors.pink,
            5,
          );
          arrow(
            ctx,
            api,
            q,
            [0, 0],
            c.fixedOutputCoordinates,
            c.partProgress[1] > 0 ? themeColors.green : themeColors.yellow,
            8,
          );
        }
      });
      outputRow(c.output);
      caption(
        ctx,
        api,
        'The output plane is a two-dimensional view of three-coordinate ticket space',
      );
    }
    if (step < 2)
      caption(
        ctx,
        api,
        step
          ? 'The same input and the same grid stretch together'
          : 'Keep following the same green input',
      );
  }
}
export default {
  id: 'svd-rotate',
  draw: drawSvdRotate,
  cues: ['svd-input-basis'],
};
