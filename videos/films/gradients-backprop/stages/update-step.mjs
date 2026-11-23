import { cueProgress } from '../latency-ruler.mjs';
import {
  drawAxes,
  drawCurve,
  drawOriginalEquation,
  drawOriginalText,
  drawShortArrow,
} from '../defaults.mjs';
export function drawUpdateStep(ctx, scene, state, api) {
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
    const b = {
      left: 285,
      top: 320,
      right: 1200,
      bottom: 755,
    };
    drawAxes(ctx, api, b, String.raw`w`, String.raw`L`);
    const map = drawCurve(ctx, api, b, 2.1, 3.5, 0, 5.2, (w) => (2 * w - 5) ** 2, cyan, 6);
    const move =
      beat === 0
        ? 0
        : beat === 1
          ? api.focus.progress('updated-weight-b2-1', api.phase(beatP, 0.1, 0.88))
          : 1;
    const w = api.lerp(3, 2.6, move);
    const nextTrial = cueProgress(state, api, 'rate-one-question', 3, 0.35, 0.55) > 0;
    const start = {
      x: map.X(3),
      y: map.Y(1),
    };
    const end = {
      x: map.X(w),
      y: map.Y((2 * w - 5) ** 2),
    };
    const route = Array.from(
      {
        length: 81,
      },
      (_, i) => {
        const pointW = api.lerp(3, 2.6, i / 80);
        return {
          x: map.X(pointW),
          y: map.Y((2 * pointW - 5) ** 2),
        };
      },
    );
    api.focus.target('downhill-path', () => api.trace(ctx, route, move, green, 8));
    dot(start.x, start.y, pink, 13);
    api.focus.target('updated-weight', () => dot(end.x, end.y, green, 13));
    line(ctx, start.x, start.y + 16, start.x, b.bottom, muted, 2);
    line(ctx, end.x, end.y + 15, end.x, b.bottom, green, 2);
    drawShortArrow(ctx, api, ctx, start.x, 820, end.x, 820, green, 5);
    api.focus.target('descent-equation', () =>
      drawOriginalEquation(
        ctx,
        api,
        String.raw`w_{\mathrm{new}}=w-\eta\nabla L`,
        960,
        270,
        50,
        ink,
        'center',
      ),
    );
    api.focus.target(nextTrial ? 'next-rate' : 'descent-calculation', () =>
      drawOriginalEquation(
        ctx,
        api,
        nextTrial ? String.raw`w_{\rm trial}=3-1\times4=\;?` :
          move < 1 ? String.raw`3-0.1\times4=\;?` : String.raw`3-0.1\times4=2.6`,
        960,
        875,
        43,
        nextTrial ? yellow : green,
        'center',
      ),
    );
    for (const [value, color] of [
      [3, pink],
      [2.6, green],
    ]) {
      if (value === 2.6 && beat === 0) continue;
      line(ctx, map.X(value), b.bottom - 5, map.X(value), b.bottom + 5, color, 2);
      drawOriginalEquation(ctx, api, String(value), map.X(value), 805, 31, color, 'center');
    }
    drawOriginalText(ctx, api, 'initial gradient: +4', 1530, 375, 33, pink, 'center');
    if (beat > 0) drawOriginalText(ctx, api, nextTrial ? 'first step: −0.4' : 'update: −0.4',
      1530, 445, 35, green, 'center');
    if (beat >= 2)
      api.focus.target('update-receipt', () => {
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\hat y=2.6\times2=5.2`,
          1530,
          585,
          36,
          green,
          'center',
        );
        drawOriginalEquation(
          ctx,
          api,
          String.raw`L=(5.2-5)^2=0.04`,
          1530,
          695,
          36,
          green,
          'center',
        );
      });
    drawOriginalText(
      ctx,
      api,
      nextTrial ? 'Will the loss fall below the starting loss of 1?' : 'take a step, then run the forward calculation again',
      960,
      965,
      31,
      muted,
      'center',
    );
    return;
  })();
  ctx.restore();
}
export default {
  id: 'update-step',
  draw: drawUpdateStep,
  cues: [
    'descent-equation-b1-1',
    'updated-weight-b2-1',
    'downhill-path-b3-1',
    'descent-calculation-b3-2',
    'step-choice-0-b1-1',
    'rate-one-question',
  ],
};
