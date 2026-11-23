import { cueProgress } from '../latency-ruler.mjs';
import { derivativeLoss } from '../arithmetic.mjs';
import {
  drawAxes,
  drawOriginalEquation,
  drawOriginalText,
  drawSegment,
  fadeConstruction,
} from '../defaults.mjs';
export function drawProbeNeighbor(ctx, scene, state, api) {
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
      left: 300,
      top: 320,
      right: 1620,
      bottom: 760,
    };
    drawAxes(ctx, api, b, String.raw`w`, String.raw`L`);
    const map = {
      X: w => b.left + (w - 2.99965) / 0.00165 * (b.right - b.left),
      Y: loss => b.bottom - (loss - 0.9988) / 0.007 * (b.bottom - b.top),
    };
    const w0 = 3;
    const h = 0.001;
    const w1 = w0 + h;
    const y0 = derivativeLoss(w0);
    const y1 = derivativeLoss(w1);
    const a = {
      x: map.X(w0),
      y: map.Y(y0),
    };
    const b2 = {
      x: map.X(w1),
      y: map.Y(y1),
    };
    const ratioReady =
      beat === 2 && api.focus.progress('finite-answer', api.phase(beatP, 0.2, 0.7)) >= 1;
    api.focus.target('finite-ratio', () =>
      drawOriginalEquation(
        ctx,
        api,
        beat === 2
          ? ratioReady
            ? String.raw`\frac{1.004004-1}{0.001}=4.004`
            : String.raw`\frac{1.004004-1}{0.001}=\;?`
          : String.raw`L(w)=(2w-5)^2`,
        950,
        260,
        44,
        ink,
        'center',
      ),
    );
    const nudge = cueProgress(state, api, 'nudged-weight-b1-1', 0, 0.72, 0.96);
    const w = w0 + h * nudge;
    const moving = { x: map.X(w), y: map.Y(derivativeLoss(w)) };
    if (nudge > 0) {
      const samples = Array.from({length: 25}, (_, i) => {
        const weight = w0 + i / 24 * (w - w0);
        return {x: map.X(weight), y: map.Y(derivativeLoss(weight))};
      });
      api.path(ctx, samples, {color: cyan, width: 5});
    }
    const reveal = beat === 2 ? api.phase(beatP, 0.05, 0.6) : 0;
    api.focus.target('weight-nudge', () =>
      drawSegment(ctx, api, a.x, a.y, b2.x, a.y, yellow, 3, nudge),
    );
    api.focus.target('loss-change', () => line(ctx, moving.x, a.y, moving.x, moving.y, pink, 3));
    drawSegment(ctx, api, a.x, a.y, b2.x, b2.y, green, 6, reveal);
    api.focus.target('original-weight', () => dot(a.x, a.y, pink, 11));
    if (nudge > 0) api.focus.target('nudged-weight', () => dot(moving.x, moving.y, yellow, 11));
    line(ctx, a.x, a.y + 14, a.x, b.bottom, pink, 2);
    if (nudge > 0) line(ctx, moving.x, moving.y + 14, moving.x, b.bottom, yellow, 2);
    drawOriginalEquation(ctx, api, String.raw`w=3`, a.x, 820, 34, pink, 'center');
    drawOriginalEquation(ctx, api, String.raw`w=3.001`, b2.x, 820, 34, yellow, 'center');
    fadeConstruction(ctx, api, nudge === 1 ? 1 : 0, () => {
      drawOriginalEquation(
        ctx,
        api,
        String.raw`\Delta w=${(h * nudge).toFixed(6)}`,
        650,
        410,
        34,
        yellow,
        'center',
      );
      drawOriginalEquation(
        ctx,
        api,
        String.raw`\Delta L=${(derivativeLoss(w0 + h * nudge) - y0).toFixed(6)}`,
        650,
        470,
        34,
        pink,
        'center',
      );
    });
    drawOriginalText(
      ctx,
      api,
      `L(3) = 1       L(3.001) = ${nudge >= 1 ? '1.004004' : '?'}`,
      960,
      885,
      31,
      muted,
      'center',
    );
    fadeConstruction(ctx, api, ratioReady ? 1 : 0, () => {
      drawOriginalText(
        ctx,
        api,
        'loss change ÷ weight change = 4.004',
        960,
        930,
        36,
        green,
        'center',
      );
    });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'probe-neighbor',
  draw: drawProbeNeighbor,
  cues: [
    'probe-start',
    'nudged-weight-b1-1',
    'original-weight-b2-1',
    'nudge-receipt',
    'finite-ratio-b3-1',
    'finite-answer',
  ],
};
