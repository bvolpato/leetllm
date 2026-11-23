import { complete } from '../arithmetic.mjs';
import { common, contrast } from '../fixtures.mjs';
import { basisFrame } from '../model.mjs';
import { arrow, caption, curve, equation, line, plane, target, text } from '../defaults.mjs';
export function drawBasis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
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
  {
    const c = basisFrame(state),
      bounds = currentBeat === 0 ? [-1.6, 1.6, -1.6, 1.6] : [-0.3, 3.6, -0.5, 2.8],
      q = plane(ctx, api, bounds, 170, 325, 1580, 535);
    if (currentBeat === 0) {
      circle(q, [1, 1], '#8d9cb966', 2);
      target(ctx, api, 'unit-directions', () => {
        const scale = Math.SQRT2 + (1 - Math.SQRT2) * c.units;
        arrow(
          ctx,
          api,
          q,
          [0, 0],
          common.map((v) => v * scale),
          themeColors.blue,
        );
        arrow(
          ctx,
          api,
          q,
          [0, 0],
          contrast.map((v) => v * scale),
          themeColors.pink,
        );
      });
      if (complete(c.units)) {
        equation(ctx, api, 'v_1=\\frac1{\\sqrt2}[1,1]^T', 530, 270, 39, themeColors.blue);
        equation(ctx, api, 'v_2=\\frac1{\\sqrt2}[-1,1]^T', 1390, 270, 39, themeColors.pink);
      } else {
        text(ctx, api, 'Common   ↗', 530, 270, 39, themeColors.blue, 'center');
        text(ctx, api, 'Contrast   ↖', 1390, 270, 39, themeColors.pink, 'center');
      }
      if (complete(c.units))
        api.path(
          ctx,
          [
            [0, 0],
            common.map((v) => 0.22 * v),
            common.map((v, i) => 0.22 * (v + contrast[i])),
            contrast.map((v) => 0.22 * v),
          ].map((v) => q.point(...v)),
          {
            color: themeColors.muted,
            width: 3,
          },
        );
      text(
        ctx,
        api,
        complete(c.units)
          ? 'unit length · perpendicular directions'
          : 'same directions · normalize their lengths',
        960,
        950,
        33,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      arrow(ctx, api, q, [0, 0], c.x, '#f4d47766', 3);
      target(ctx, api, 'common-component', () => {
        arrow(
          ctx,
          api,
          q,
          [0, 0],
          c.parts[0].map((v) => v * c.first),
          themeColors.blue,
        );
      });
      target(ctx, api, 'contrast-component', () => {
        if (c.second > 0) arrow(ctx, api, q, c.parts[0], c.combined, themeColors.pink);
      });
      const p = q.point(...c.x);
      text(ctx, api, '(3 slow, 1 rollback)', p.x + 35, p.y - 25, 34, themeColors.yellow);
      const built = complete(c.second) ? '[2,2]+[1,-1]=[3,1]'
        : complete(c.first) ? '(x\\cdot v_1)v_1=[2,2]' : 'x=[3,1]';
      equation(ctx, api, built, 960, 265, 41, c.second > 0 ? themeColors.pink : themeColors.blue);
    } else {
      curve(
        ctx,
        api,
        q,
        [
          [-0.5, -0.5],
          [3.25, 3.25],
        ],
        '#6fa9ff66',
        3,
      );
      target(ctx, api, 'projection-residual', () => {
        arrow(ctx, api, q, [0, 0], c.current, themeColors.yellow);
        line(ctx, api, q, c.current, c.x, themeColors.pink, 4);
        const p = q.point(...c.x);
        text(ctx, api, 'original row', p.x + 32, p.y - 25, 31, themeColors.pink);
        if (complete(c.discard)) {
          api.path(
            ctx,
            [
              [2, 2],
              [2.14, 2.14],
              [2.28, 2],
              [2.14, 1.86],
            ].map((v) => q.point(...v)),
            {
              color: themeColors.yellow,
              width: 3,
            },
          );
          const z = q.point(2, 2);
          text(ctx, api, '(2, 2)', z.x - 35, z.y - 25, 36, themeColors.yellow, 'right');
        }
      });
      equation(
        ctx,
        api,
        complete(c.discard)
          ? '\\operatorname{proj}_{v_1}x=[2,2]^T'
          : '\\text{nearest point on the blue line?}',
        960,
        265,
        44,
        themeColors.yellow,
      );
    }
    caption(
      ctx,
      api,
      currentBeat === 2
        ? 'A perpendicular residual cannot be shortened by sliding along the retained line'
        : currentBeat === 1
          ? 'This row counts mentions of each issue.'
          : 'Dot products measure coordinates along unit directions',
    );
  }
}
export default {
  id: 'basis',
  draw: drawBasis,
  cues: ['unit-directions', 'common-component', 'contrast-component', 'projection-residual'],
};
