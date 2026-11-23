import { batchGradientState } from '../arithmetic.mjs';
import {
  boundaryAnchor,
  connectionEndpoints,
  drawGraphBox,
  drawOriginalEquation,
  drawOriginalText,
  drawShortArrow,
  drawTransmission,
  fadeConstruction,
} from '../defaults.mjs';
export function drawPathAccumulation(ctx, scene, state, api) {
  const { C: themeColors, line, circle } = api;
  const progress2 = api.clamp(state.p ?? 0);
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? progress2);
  const { ink, muted, cyan, blue, yellow, pink, green, red, panel } = themeColors;
  const haloCenters = [];
  const marker = (x, y, color, r = 12, hollow = false) => {
    const radius = r + 7;
    const haloOpacity = haloCenters.reduce(
      (opacity, previous) =>
        Math.min(
          opacity,
          api.phase(Math.hypot(x - previous.x, y - previous.y) - previous.radius - radius, 0, 12),
        ),
      1,
    );
    if (haloOpacity > 0) {
      ctx.save();
      ctx.globalAlpha *= haloOpacity;
      circle(ctx, x, y, radius, 'transparent', color, 2);
      if (ctx.globalAlpha > 0.2)
        haloCenters.push({
          x,
          y,
          radius,
        });
      ctx.restore();
    }
    circle(ctx, x, y, r, hollow ? 'transparent' : color, hollow ? color : themeColors.bg, 3);
  };
  const hollowDot = (x, y, color, r = 12) => marker(x, y, color, r, true);
  const flowDot = (x1, y1, x2, y2, phase, color, r = 9) => {
    if (phase <= 0 || phase >= 1) return;
    const q = api.ease(api.clamp(phase));
    const remaining = Math.hypot(x2 - x1, y2 - y1) * (1 - q);
    const clearance = 13 + r + 8 + 3;
    ctx.save();
    ctx.globalAlpha *= api.phase(phase, 0, 0.07) * api.phase(remaining, clearance, clearance + 16);
    hollowDot(api.lerp(x1, x2, q), api.lerp(y1, y2, q), color, r);
    ctx.restore();
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (() => {
    if (beat < 2) {
      const q =
        beat === 0
          ? api.phase(beatP, 0.08, 0.86) * 0.4
          : 0.48 +
            0.52 *
              api.focus.progress('prompt-path-contribution-b2-1', api.phase(beatP, 0.05, 0.65));
      const nodes = [
        {
          x: 310,
          y: 555,
          w: 235,
          h: 126,
          title: String.raw`\text{shared }w`,
          value: '2 s',
          color: yellow,
        },
        {
          x: 790,
          y: 390,
          w: 260,
          h: 126,
          title: String.raw`w x_p`,
          value: '2 × 2 = 4',
          color: blue,
        },
        {
          x: 790,
          y: 720,
          w: 260,
          h: 126,
          title: String.raw`w x_q`,
          value: '2 × 1 = 2',
          color: cyan,
        },
        {
          x: 1270,
          y: 555,
          w: 235,
          h: 126,
          title: String.raw`\hat{y}`,
          value: '6',
          color: green,
        },
        {
          x: 1660,
          y: 555,
          w: 180,
          h: 126,
          title: String.raw`L`,
          value: '1',
          color: pink,
        },
      ];
      const edges = [
        [0, 1, blue],
        [0, 2, cyan],
        [1, 3, blue],
        [2, 3, cyan],
        [3, 4, pink],
      ].map(([from, to, color]) => connectionEndpoints(ctx, api, nodes[from], nodes[to], color));
      const order = [4, 2, 3, 0, 1];
      edges.forEach(([x1, y1, x2, y2]) => line(ctx, x1, y1, x2, y2, '#34415a', 2));
      order.forEach((index, step) => {
        const start = step === 0 ? 0 : step < 3 ? 0.2 : 0.48;
        const end = step === 0 ? 0.23 : step < 3 ? 0.5 : 0.88;
        drawTransmission(ctx, api, edges[index], api.phase(q, start, end), true);
      });
      nodes.forEach((node, i) =>
        api.focus.target('shared-node-' + i, () => drawGraphBox(ctx, api, node)),
      );
      api.focus.target('prompt-path-contribution', () =>
        drawOriginalEquation(ctx, api, String.raw`\text{path }p:\;4`, 790, 285, 35, blue, 'center'),
      );
      api.focus.target('queue-path-contribution', () =>
        drawOriginalEquation(ctx, api, String.raw`\text{path }q:\;2`, 790, 840, 35, cyan, 'center'),
      );
      const returning = api.phase(q, 0.48, 0.88);
      if (returning > 0) {
        drawOriginalEquation(
          ctx,
          api,
          '4',
          api.lerp(630, 440, returning),
          api.lerp(310, 420, returning),
          38,
          blue,
          'center',
        );
        drawOriginalEquation(
          ctx,
          api,
          '2',
          api.lerp(630, 440, returning),
          api.lerp(800, 700, returning),
          38,
          cyan,
          'center',
        );
      }
      fadeConstruction(
        ctx,
        api,
        beat === 1
          ? api.focus.progress('shared-gradient-sum-b2-2', api.phase(q, 0.7, 0.96))
          : api.phase(q, 0.7, 0.96),
        () => {
          api.focus.target('shared-gradient-sum', () =>
            drawOriginalEquation(
              ctx,
              api,
              String.raw`\frac{\partial L}{\partial w}=4+2=6`,
              350,
              780,
              40,
              yellow,
              'center',
            ),
          );
        },
      );
      drawOriginalText(ctx, api, 'Prompt  200 tokens ÷ 100 tokens = 2       Queue  1 s ÷ 1 s = 1',
        960, 880, 30, muted, 'center');
      drawOriginalText(
        ctx,
        api,
        'separate routes · one stored parameter',
        960,
        930,
        33,
        muted,
        'center',
      );
    } else {
      drawOriginalText(
        ctx,
        api,
        'new batch · both weights reset to zero',
        960,
        280,
        35,
        ink,
        'center',
      );
      drawOriginalText(ctx, api, 'row 1', 280, 370, 31, blue);
      drawOriginalText(ctx, api, 'row 2', 280, 485, 31, cyan);
      drawOriginalText(ctx, api, 'row 3', 280, 600, 31, yellow);
      drawOriginalText(ctx, api, 'row 4', 280, 715, 31, pink);
      const rows = [370, 485, 600, 715];
      const batch = batchGradientState();
      const contributions = batch.rows.map(row => row.gradient[0]);
      const cols = [blue, cyan, yellow, pink];
      const collect = api.focus.progress('row-gradient-sum-arrives', api.phase(beatP, 0.28, 0.55));
      const divide = api.focus.progress('row-gradient-mean-b3-1', api.phase(beatP, 0.68, 0.88));
      const q = 0.55 * collect + 0.45 * divide;
      const sum = {
        x: 850,
        y: 540,
        r: 78,
      };
      rows.forEach((y, i) => {
        const start = {
            x: 650,
            y,
          },
          end = boundaryAnchor(ctx, api, sum, start);
        line(ctx, 400, y, start.x, start.y, cols[i], 3);
        drawShortArrow(ctx, api, ctx, start.x, start.y, end.x, end.y, cols[i], 3);
        drawOriginalEquation(
          ctx,
          api,
          String(contributions[i]),
          485,
          y - 28,
          38,
          cols[i],
          'center',
        );
        const rowQ = api.phase(q, i * 0.06, 0.34 + i * 0.06);
        const route = [
          {
            x: 400,
            y,
          },
          start,
          end,
        ];
        api.trace(ctx, route, rowQ, cols[i], 5);
      });
      api.focus.target('row-gradient-sum', () => circle(ctx, 850, 540, 78, panel, green, 3));
      const arrived = contributions.filter((_, i) => q >= 0.34 + i * 0.06).length;
      const total = contributions.slice(0, arrived).reduce((sum, value) => sum + value, 0);
      drawOriginalEquation(ctx, api, String(total), 850, 555, 42, green, 'center');
      drawOriginalText(ctx, api, 'sum of derivatives', 850, 425, 30, green, 'center');
      drawShortArrow(ctx, api, ctx, 928, 540, 1168, 540, muted, 4);
      flowDot(928, 540, 1168, 540, api.phase(q, 0.55, 0.7), green, 10);
      api.focus.target('row-gradient-mean', () => circle(ctx, 1230, 540, 62, panel, yellow, 3));
      drawOriginalEquation(ctx, api, String.raw`\div4`, 1230, 555, 39, yellow, 'center');
      drawShortArrow(ctx, api, ctx, 1292, 540, 1552, 540, muted, 4);
      flowDot(1292, 540, 1552, 540, api.phase(q, 0.72, 0.88), green, 10);
      circle(ctx, 1630, 540, 78, panel, green, 3);
      const meanReady =
        api.focus.progress('row-gradient-mean-b3-1', api.phase(beatP, 0.78, 0.92)) >= 1;
      drawOriginalEquation(ctx, api, meanReady ? String(batch.gradient[0]) : '?', 1630, 552, 47, ink, 'center');
      drawOriginalText(ctx, api, 'prompt gradient', 1630, 425, 30, green, 'center');
      drawOriginalText(
        ctx,
        api,
        'Mean squared loss   ' + batch.loss + ' s²',
        960,
        780,
        34,
        muted,
        'center',
      );
      drawOriginalEquation(
        ctx,
        api,
        meanReady
          ? String.raw`\frac{-5-20-39-80}{4}=-36`
          : String.raw`\frac{\text{sum of prompt contributions}}{4}`,
        960,
        880,
        42,
        yellow,
        'center',
      );
    }
    return;
  })();
  ctx.restore();
}
export default {
  id: 'path-accumulation',
  draw: drawPathAccumulation,
  cues: [
    'shared-node-0-b1-1',
    'prompt-path-contribution-b2-1',
    'shared-gradient-sum-b2-2',
    'row-gradient-sum-arrives',
    'row-gradient-mean-b3-1',
  ],
};
