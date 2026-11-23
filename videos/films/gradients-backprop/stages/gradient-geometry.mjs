import {
  drawOriginalEquation,
  drawOriginalText,
  drawSegment,
  drawShortArrow,
} from '../defaults.mjs';
export function drawGradientGeometry(ctx, scene, state, api) {
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
  const dot = (x, y, color, r = 12) => marker(x, y, color, r);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (() => {
    const left = 350,
      right = 1050,
      top = 320,
      bottom = 820,
      unit = 500;
    const xMin = 1.4,
      xMax = 2.8,
      yMin = 1.4,
      yMax = 2.4;
    const xAt = (wp) => left + (wp - xMin) * unit;
    const yAt = (wq) => bottom - (wq - yMin) * unit;
    const x0 = xAt(2),
      y0 = yAt(2);
    // Exact contours for L=(2 w_p + w_q - 5)^2: each level is a pair of parallel lines.
    for (const c of [5, 5.5, 6, 6.5, 7, 7.5]) {
      const wp0 = Math.max(xMin, (c - yMax) / 2);
      const wp1 = Math.min(xMax, (c - yMin) / 2);
      if (wp0 > wp1) continue;
      const ya = yAt(c - 2 * wp0),
        yb = yAt(c - 2 * wp1);
      const reveal =
        beat === 0
          ? api.focus.progress(
              'equal-loss',
              api.phase(beatP, 0.03 + (c - 5) * 0.09, 0.45 + (c - 5) * 0.09),
            )
          : 1;
      api.focus.target('loss-contours', () =>
        drawSegment(
          ctx,
          api,
          xAt(wp0),
          ya,
          xAt(wp1),
          yb,
          c === 5 ? green : c === 6 ? cyan : '#465774',
          c === 5 || c === 6 ? 4 : 2,
          reveal,
        ),
      );
      if (c === 5 || c === 6)
        drawOriginalText(
          ctx,
          api,
          `loss ${(c - 5) ** 2}`,
          xAt(wp0) + 28,
          ya - 25,
          26,
          c === 5 ? green : cyan,
        );
    }
    drawShortArrow(ctx, api, ctx, left, bottom, right, bottom, muted, 3);
    drawShortArrow(ctx, api, ctx, left, bottom, left, top, muted, 3);
    api.focus.target('parameter-axes', () =>
      drawOriginalEquation(ctx, api, String.raw`w_p`, right - 5, bottom + 48, 32, blue, 'right'),
    );
    api.focus.target('parameter-axes', () =>
      drawOriginalEquation(ctx, api, String.raw`w_q`, left + 8, top + 25, 32, cyan),
    );
    for (const value of [1.5, 2, 2.5]) {
      line(ctx, xAt(value), bottom - 5, xAt(value), bottom + 5, muted, 2);
      drawOriginalText(ctx, api, String(value), xAt(value), bottom + 38, 27, muted, 'center');
    }
    for (const value of [1.5, 2]) {
      line(ctx, left - 5, yAt(value), left + 5, yAt(value), muted, 2);
      drawOriginalText(ctx, api, String(value), left - 20, yAt(value) + 9, 27, muted, 'right');
    }
    drawOriginalText(ctx, api, 'equal-loss contours', 1510, 365, 30, muted, 'center');
    dot(x0, y0, pink, 15);
    drawOriginalEquation(ctx, api, String.raw`(w_p,w_q)=(2,2)`, 1510, 305, 30, pink, 'center');
    const q =
      beat === 0
        ? 0
        : beat === 1
          ? api.focus.progress('assemble-direction', api.phase(beatP, 0.06, 0.7))
          : 1;
    const scale = 0.08 * q;
    const up = {
      x: x0 + 4 * unit * scale,
      y: y0 - 2 * unit * scale,
    };
    const down = {
      x: x0 - 4 * unit * scale,
      y: y0 + 2 * unit * scale,
    };
    api.focus.target('uphill-gradient', () =>
      drawShortArrow(ctx, api, ctx, x0, y0, up.x, up.y, yellow, 6),
    );
    if (beat > 0) {
      api.focus.target('uphill-gradient', () =>
        drawOriginalEquation(ctx, api, String.raw`\nabla L=(4,2)`, 1510, 580, 38, yellow, 'center'),
      );
      api.focus.target('uphill-gradient', () =>
        drawOriginalText(ctx, api, 'uphill', 1510, 520, 30, yellow, 'center'),
      );
    }
    if (beat === 2) {
      const descend = api.focus.progress('reverse-gradient', api.phase(beatP, 0.1, 0.76));
      api.focus.target('downhill-update', () => {
        drawShortArrow(
          ctx,
          api,
          ctx,
          x0,
          y0,
          api.lerp(x0, down.x, descend),
          api.lerp(y0, down.y, descend),
          green,
          6,
        );
      });
      api.focus.target('downhill-update', () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`-\nabla L=(-4,-2)`,
          1510,
          730,
          36,
          green,
          'center',
        ),
      );
      api.focus.target('downhill-update', () =>
        drawOriginalText(ctx, api, 'downhill', 1510, 670, 30, green, 'center'),
      );
      const wp = 2 - 0.32 * descend,
        wq = 2 - 0.16 * descend;
      api.focus.target('updated-loss', () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`L(w_p,w_q)\approx${((2 * wp + wq - 5) ** 2).toFixed(2)}`,
          1510,
          850,
          35,
          green,
          'center',
        ),
      );
    }
    if (beat > 1 || (beat === 1 && api.focus.progress('normal-direction', q) > 0)) {
      const n = {
        x: (2 / Math.sqrt(5)) * 24,
        y: (-1 / Math.sqrt(5)) * 24,
      };
      const tangent = {
        x: (1 / Math.sqrt(5)) * 24,
        y: (2 / Math.sqrt(5)) * 24,
      };
      api.focus.target('contour-normal', () => {
        line(ctx, x0 + n.x, y0 + n.y, x0 + n.x + tangent.x, y0 + n.y + tangent.y, ink, 2);
        line(
          ctx,
          x0 + n.x + tangent.x,
          y0 + n.y + tangent.y,
          x0 + tangent.x,
          y0 + tangent.y,
          ink,
          2,
        );
      });
    }
    drawOriginalEquation(ctx, api, String.raw`2w_p+w_q=6`, 1510, 445, 34, cyan, 'center');
    drawOriginalEquation(ctx, api, String.raw`L=0:\;2w_p+w_q=5`, 960, 965, 34, green, 'center');
    return;
  })();
  ctx.restore();
}
export default {
  id: 'gradient-geometry',
  draw: drawGradientGeometry,
  cues: [
    'equal-loss',
    'coordinate-sensitivity',
    'assemble-direction',
    'normal-direction',
    'reverse-gradient',
    'prompt-moves-more',
  ],
};
