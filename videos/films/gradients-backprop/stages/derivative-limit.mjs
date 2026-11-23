import { derivativeLoss } from '../arithmetic.mjs';
import {
  drawAxes,
  drawCurve,
  drawOriginalEquation,
  drawOriginalText,
  fadeConstruction,
} from '../defaults.mjs';
export function drawDerivativeLimit(ctx, scene, state, api) {
  const { C: themeColors, line, circle, rect } = api;
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
    const b = {
      left: 230,
      top: 370,
      right: 1040,
      bottom: 735,
    };
    drawAxes(ctx, api, b, String.raw`w`, String.raw`L`);
    const map = drawCurve(ctx, api, b, 2.45, 3.48, 0, 3.5, (w) => (2 * w - 5) ** 2, cyan, 5);
    const h =
      beat === 0
        ? api.lerp(0.24, 0.001, api.focus.progress('nearby-point-b1-1', api.phase(beatP, 0.1, 0.9)))
        : beat === 1
          ? 0.001
          : api.lerp(
              0.001,
              0.00001,
              api.focus.progress('secant-line-b3-1', api.phase(beatP, 0.12, 0.6)),
            );
    const w0 = 3,
      w1 = w0 + h;
    const x0 = map.X(w0),
      y0 = map.Y(1),
      x1 = map.X(w1),
      y1 = map.Y((2 * w1 - 5) ** 2);
    const tanX0 = map.X(2.75),
      tanX1 = map.X(3.3);
    const slope = 4 + 4 * h;
    const clip = {
      x: b.left,
      y: b.top,
      width: b.right - b.left,
      height: b.bottom - b.top,
    };
    api.focus.target('secant-line', () =>
      api.path(
        ctx,
        [
          {
            x: tanX0,
            y: map.Y(1 + slope * (2.75 - 3)),
          },
          {
            x: tanX1,
            y: map.Y(1 + slope * (3.3 - 3)),
          },
        ],
        {
          color: yellow,
          width: 4,
          clip,
        },
      ),
    );
    fadeConstruction(ctx, api, beat === 2 ? api.phase(beatP, 0.12, 0.6) : 0, () => {
      api.path(
        ctx,
        [
          {
            x: tanX0,
            y: map.Y(1 + 4 * (2.75 - 3)),
          },
          {
            x: tanX1,
            y: map.Y(1 + 4 * (3.3 - 3)),
          },
        ],
        {
          color: green,
          width: 4,
          clip,
        },
      );
    });
    api.focus.target('fixed-point', () => dot(x0, y0, pink, 13));
    api.focus.target('nearby-point', () => dot(x1, y1, yellow, 11));
    const algebraReady =
      beat === 2 ||
      (beat === 1 &&
        api.focus.progress('finite-expression-b2-1', api.phase(beatP, 0.3, 0.65)) >= 1);
    api.focus.target('finite-expression', () =>
      drawOriginalEquation(
        ctx,
        api,
        beat === 0
          ? String.raw`\frac{L(3+h)-L(3)}{h}`
          : algebraReady
            ? String.raw`\frac{(1+2h)^2-1}{h}=4+4h`
            : String.raw`\frac{(1+2h)^2-1}{h}=\;?`,
        960,
        270,
        49,
        ink,
        'center',
      ),
    );

    // The inset expands with 1/h, keeping both samples readable as they meet.
    const zoom = {
      left: 1205,
      top: 405,
      right: 1715,
      bottom: 700,
    };
    rect(ctx, 1140, 330, 635, 450, panel, '#52617a', 20);
    drawOriginalText(ctx, api, 'A closer look at the same points', 1458, 377, 28, ink, 'center');
    const z = drawCurve(
      ctx,
      api,
      zoom,
      3 - h * 0.22,
      3 + h * 1.22,
      1 - 1.5 * h,
      derivativeLoss(3 + h) + 1.5 * h,
      derivativeLoss,
      cyan,
      4,
    );
    const za = {
      x: z.X(3),
      y: z.Y(1),
    };
    const zb = {
      x: z.X(3 + h),
      y: z.Y(derivativeLoss(3 + h)),
    };
    api.path(ctx, [za, zb], {
      color: yellow,
      width: 4,
    });
    const tangentEnd = {
      x: z.X(3 + h),
      y: z.Y(1 + 4 * h),
    };
    if (beat === 2)
      fadeConstruction(ctx, api, api.phase(beatP, 0.12, 0.6), () => {
        api.path(ctx, [za, tangentEnd], {
          color: green,
          width: 3,
        });
      });
    line(ctx, za.x, za.y + 24, zb.x, za.y + 24, yellow, 2);
    line(ctx, zb.x, za.y + 24, zb.x, zb.y + 20, pink, 2);
    dot(za.x, za.y, pink, 11);
    dot(zb.x, zb.y, yellow, 11);
    drawOriginalEquation(ctx, api, String.raw`w`, za.x - 10, za.y - 30, 32, pink, 'right');
    drawOriginalEquation(ctx, api, String.raw`w+h`, zb.x - 15, zb.y - 30, 32, yellow, 'right');
    drawOriginalEquation(
      ctx,
      api,
      String.raw`h`,
      (za.x + zb.x) / 2,
      za.y + 65,
      32,
      yellow,
      'center',
    );
    drawOriginalEquation(
      ctx,
      api,
      String.raw`\text{window width}=1.44h`,
      1458,
      752,
      28,
      muted,
      'center',
    );
    api.focus.target('nudge-size', () =>
      drawOriginalEquation(ctx, api, `h=${h.toPrecision(3)}`, 635, 818, 36, yellow, 'center'),
    );
    drawOriginalText(ctx, api, 'secant slope', 1295, 825, 28, yellow, 'center');
    drawOriginalEquation(ctx, api, slope.toFixed(5), 1295, 885, 44, yellow, 'center');
    if (beat === 2) {
      drawOriginalText(ctx, api, 'tangent slope', 1630, 825, 28, green, 'center');
      api.focus.target('limiting-slope', () =>
        drawOriginalEquation(
          ctx,
          api,
          api.focus.progress('limiting-slope-b3-2', api.phase(beatP, 0.2, 0.65)) > 0 ? '4' : '?',
          1630,
          885,
          44,
          green,
          'center',
        ),
      );
    }
    fadeConstruction(ctx, api, beat === 2 ? api.phase(beatP, 0.2, 0.65) : 0, () => {
      drawOriginalEquation(
        ctx,
        api,
        String.raw`\lim_{h\to0}\frac{L(3+h)-L(3)}{h}=4`,
        960,
        985,
        39,
        green,
        'center',
      );
    });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'derivative-limit',
  draw: drawDerivativeLimit,
  cues: [
    'nearby-point-b1-1',
    'finite-expression-b2-1',
    'nudge-size-b2-2',
    'secant-line-b3-1',
    'limiting-slope-b3-2',
  ],
};
