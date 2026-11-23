import { common, labels } from '../fixtures.mjs';
import { pairedSignFrame } from '../model.mjs';
import { arrow, caption, curve, equation, plane, target, text } from '../defaults.mjs';
export function drawSvdSign(ctx, scene, state, api) {
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
    const c = pairedSignFrame(state),
      input = plane(ctx, api, [-1.3, 1.3, -1.3, 1.3], 210, 325, 650, 330),
      output = plane(ctx, api, [-1.3, 1.3, -1.3, 1.3], 1060, 325, 650, 330);
    text(ctx, api, 'input singular direction', 535, 280, 34, themeColors.yellow, 'center');
    text(ctx, api, 'output singular direction', 1385, 280, 34, themeColors.cyan, 'center');
    circle(input, [1, 1], '#8d9cb944', 2);
    circle(output, [1, 1], '#8d9cb944', 2);
    const pair = (plot, vector, color) => {
      for (const [sign, opacity] of [
        [1, 1 - c.progress],
        [-1, c.progress],
      ]) {
        ctx.save();
        ctx.globalAlpha *= opacity;
        arrow(
          ctx,
          api,
          plot,
          [0, 0],
          vector.map((v) => sign * v),
          color,
          8,
        );
        ctx.restore();
      }
    };
    target(ctx, api, 'signed-right', () => pair(input, common, themeColors.yellow));
    target(ctx, api, 'signed-left', () => pair(output, [1, 0], themeColors.cyan));
    equation(
      ctx,
      api,
      'v_1=' + (c.sign < 0 ? '-' : '') + '[1,1]^T/\\sqrt2',
      535,
      750,
      37,
      themeColors.yellow,
    );
    equation(
      ctx,
      api,
      'u_1=' + (c.sign < 0 ? '-' : '') + '[1,1,2]^T/\\sqrt6',
      1385,
      750,
      37,
      themeColors.cyan,
    );
    target(ctx, api, 'signed-coordinate', () =>
      equation(
        ctx,
        api,
        (c.sign < 0 ? '(-c_1)(-u_1)' : 'c_1u_1') + '=[1/2,1/2,1]^T',
        960,
        805,
        40,
        themeColors.green,
      ),
    );
    outputRow(c.output, 865);
    caption(
      ctx,
      api,
      'A paired convention change keeps the contribution and all three reconstructed outputs fixed',
    );
  }
}
export default {
  id: 'svd-sign',
  draw: drawSvdSign,
  cues: ['signed-right'],
};
