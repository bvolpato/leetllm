import {
  drawOriginalEquation,
  drawOriginalText,
  drawShortArrow,
  drawTransmission,
} from '../defaults.mjs';
export function drawPytorchLoop(ctx, scene, state, api) {
  const { C: themeColors, circle, rect } = api;
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
    const nodes = [
      {
        x: 290,
        title: 'zero_grad()',
        color: muted,
      },
      {
        x: 690,
        title: 'forward',
        color: cyan,
      },
      {
        x: 1090,
        title: 'backward()',
        color: yellow,
      },
      {
        x: 1490,
        title: 'optimizer.step()',
        color: green,
      },
    ];
    nodes.slice(0, -1).forEach((node, i) => {
      drawShortArrow(ctx, api, ctx, node.x + 155, 515, nodes[i + 1].x - 155, 515, muted, 4);
    });
    const links = [
      [445, 515, 535, 515],
      [845, 515, 935, 515],
      [1245, 515, 1335, 515],
    ];
    const phases =
      beat === 0
        ? [api.phase(beatP, 0.18, 0.66), 0, 0]
        : beat === 1
          ? [1, api.phase(beatP, 0.06, 0.4), api.phase(beatP, 0.48, 0.83)]
          : [1, 1, 1];
    links.forEach((link, i) =>
      drawTransmission(ctx, api, [...link, i === 2 ? green : yellow], phases[i]),
    );
    nodes.forEach((node, i) => {
      api.focus.target('pytorch-stage-' + i, () =>
        rect(ctx, node.x - 155, 460, 310, 110, panel, node.color, 20),
      );
      api.labelScope(
        ctx,
        {
          x: node.x - 155,
          y: 460,
          width: 310,
          height: 110,
        },
        () => {
          drawOriginalText(
            ctx,
            api,
            node.title,
            node.x,
            525,
            node.title === 'optimizer.step()' ? 28 : 32,
            node.color,
            'center',
            'mono',
          );
        },
        {
          padding: 16,
          id: node.title,
        },
      );
    });
    drawOriginalEquation(
      ctx,
      api,
      String.raw`\text{prediction}\to\text{loss}`,
      690,
      350,
      39,
      cyan,
      'center',
    );
    drawOriginalEquation(
      ctx,
      api,
      String.raw`\text{loss}\to\text{gradients}`,
      1090,
      660,
      37,
      yellow,
      'center',
    );
    drawOriginalEquation(
      ctx,
      api,
      String.raw`w\leftarrow w-\eta\nabla L`,
      1490,
      660,
      42,
      green,
      'center',
    );
    if (beat === 1)
      drawOriginalEquation(ctx, api, String.raw`\eta=0.1`, 1620, 710, 30, green, 'center');
    if (beat < 2) {
      const update =
        beat === 1 ? api.focus.progress('stored-weights-b2-2', api.phase(beatP, 0.55, 0.85)) : 0;
      if (beat === 1) {
        drawShortArrow(ctx, api, ctx, 860, 815, 1060, 815, green, 3);
        flowDot(860, 815, 1060, 815, update, green, 9);
      }
      rect(ctx, 210, 760, 650, 115, panel, blue, 18);
      rect(ctx, 1060, 760, 650, 115, panel, green, 18);
      drawOriginalText(ctx, api, 'gradient buffer', 535, 735, 30, blue, 'center');
      drawOriginalText(ctx, api, 'stored weights', 1385, 735, 30, green, 'center');
      const cleared =
        beat > 0 || api.focus.progress('pytorch-stage-0-b1-1', api.phase(beatP, 0.05, 0.16)) >= 1;
      const filled =
        beat === 1 && api.focus.progress('gradient-buffer-b2-1', api.phase(beatP, 0.06, 0.38)) >= 1;
      api.focus.target('gradient-buffer', () =>
        drawOriginalEquation(
          ctx,
          api,
          filled
            ? String.raw`(4,2)`
            : cleared
              ? String.raw`\mathtt{.grad = None}`
              : String.raw`\text{old gradients}`,
          535,
          830,
          43,
          filled ? yellow : blue,
          'center',
        ),
      );
      api.focus.target('stored-weights', () =>
        drawOriginalEquation(
          ctx,
          api,
          update >= 1 ? '(1.6,1.8)' : '(2,2)',
          1385,
          830,
          43,
          green,
          'center',
        ),
      );
    } else {
      drawOriginalText(
        ctx,
        api,
        'Back at weights (2, 2)    ·    Recompute the same loss',
        960,
        290,
        32,
        ink,
        'center',
      );
      const fill = api.focus.progress('fresh-gradient-b3-1', api.phase(beatP, 0.06, 0.46));
      const accumulation = api.focus.progress(
        'accumulated-gradient-b3-2',
        api.phase(beatP, 0.46, 0.84),
      );
      const incoming = [
        {
          route: [
            {
              x: 930,
              y: 935,
            },
            {
              x: 540,
              y: 935,
            },
            {
              x: 540,
              y: 870,
            },
          ],
          q: fill,
          color: blue,
        },
        {
          route: [
            {
              x: 990,
              y: 935,
            },
            {
              x: 1380,
              y: 935,
            },
            {
              x: 1380,
              y: 870,
            },
          ],
          q: accumulation,
          color: yellow,
        },
      ];
      incoming.forEach(({ route, q, color }) => {
        api.trace(ctx, route, q, color, 3);
        if (q > 0 && q < 1) {
          const point = api.pointAlongPath(route, q);
          circle(ctx, point.x, point.y, 7, color);
        }
      });
      rect(ctx, 220, 735, 640, 135, panel, blue, 18);
      rect(ctx, 1060, 735, 640, 135, panel, yellow, 18);
      drawOriginalText(ctx, api, 'clear before backward', 540, 715, 29, blue, 'center');
      drawOriginalText(ctx, api, 'keep the previous buffer', 1380, 715, 29, yellow, 'center');
      api.focus.target('fresh-gradient', () =>
        drawOriginalEquation(
          ctx,
          api,
          fill < 1 ? String.raw`\mathtt{.grad = None}` : String.raw`(4,2)`,
          540,
          820,
          43,
          blue,
          'center',
        ),
      );
      api.focus.target('accumulated-gradient', () =>
        drawOriginalEquation(
          ctx,
          api,
          accumulation < 1 ? String.raw`(4,2)` : String.raw`(8,4)`,
          1380,
          820,
          43,
          yellow,
          'center',
        ),
      );
      drawOriginalEquation(ctx, api, String.raw`+(4,2)`, 960, 910, 34, yellow, 'center');
      drawOriginalText(
        ctx,
        api,
        'each backward pass adds its gradients',
        960,
        1000,
        30,
        muted,
        'center',
      );
    }
    if (beat < 2)
      drawOriginalText(
        ctx,
        api,
        'backward fills the buffer → the optimizer applies it',
        960,
        955,
        32,
        muted,
        'center',
      );
    return;
  })();
  ctx.restore();
}
export default {
  id: 'pytorch-loop',
  draw: drawPytorchLoop,
  cues: [
    'pytorch-stage-0-b1-1',
    'pytorch-stage-1-b1-2',
    'gradient-buffer-b2-1',
    'stored-weights-b2-2',
    'fresh-gradient-b3-1',
    'accumulated-gradient-b3-2',
  ],
};
