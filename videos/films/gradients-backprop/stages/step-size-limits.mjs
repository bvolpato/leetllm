import { cueProgress } from '../latency-ruler.mjs';
import { derivativeLoss } from '../arithmetic.mjs';
import {
  drawAxes,
  drawCurve,
  drawOriginalEquation,
  drawOriginalText,
  drawShortArrow,
} from '../defaults.mjs';
export function drawStepSizeLimits(ctx, scene, state, api) {
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
      left: 230,
      top: 330,
      right: 1170,
      bottom: 700,
    };
    drawAxes(ctx, api, b, String.raw`w`, String.raw`L`);
    const map = drawCurve(ctx, api, b, -1.2, 3.55, 0, 55, (w) => (2 * w - 5) ** 2, cyan, 5);
    const start = {
      x: map.X(3),
      y: map.Y(1),
    };
    const guide = (x, from, to, color) => {
      const labelTop = b.bottom + 6,
        labelBottom = b.bottom + 52;
      if (from < labelTop) line(ctx, x, from, x, Math.min(to, labelTop), color, 2);
      if (to > labelBottom) line(ctx, x, Math.max(from, labelBottom), x, to, color, 2);
    };
    const targets = [
      {
        rate: 0.1,
        color: yellow,
        lane: 790,
        progress: 1,
      },
      {
        rate: 0.125,
        color: green,
        lane: 845,
        progress: cueProgress(state, api, 'step-choice-1-b2-1', 1, 0.03, 0.27),
      },
      {
        rate: 1,
        color: red,
        lane: 900,
        progress: cueProgress(state, api, 'step-choice-2-b1-2', 0, 0.07, 0.21),
      },
    ];
    const close = {
      left: 1330,
      top: 330,
      right: 1710,
      bottom: 580,
    };
    const closeMap = drawCurve(ctx, api, close, 2.4, 2.75, 0, 0.27, derivativeLoss, cyan, 4);
    drawOriginalText(ctx, api, 'a close view of the bottom', 1520, 275, 28, muted, 'center');
    line(ctx, close.left, close.bottom, close.right, close.bottom, muted, 2);
    for (const [i, target] of targets.entries()) {
      const q = target.progress;
      if (q === 0 && target.rate !== 1) continue;
      const landing = 3 - 4 * target.rate;
      const w = api.lerp(3, landing, q);
      const end = {
        x: map.X(w),
        y: map.Y(derivativeLoss(w)),
      };
      if (q === 1 && landing >= 2.4 && landing <= 2.75) {
        circle(ctx, closeMap.X(landing), closeMap.Y(derivativeLoss(landing)), 5, target.color);
        drawOriginalEquation(ctx, api, String(landing), closeMap.X(landing), 630, 29, target.color, 'center');
      }
      guide(start.x, start.y + 12, target.lane, '#52617a');
      guide(end.x, end.y + 10, target.lane, target.color);
      drawShortArrow(ctx, api, ctx, start.x, target.lane, end.x, target.lane, target.color, 4);
      if (q > 0.015)
        api.focus.target('step-choice-' + i, () =>
          circle(ctx, end.x, end.y, 7, target.color, themeColors.bg, 2),
        );
      api.focus.target('step-choice-' + i, () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\eta=${target.rate}`,
          1450,
          target.lane + 8,
          32,
          target.color,
          'right',
        ),
      );
      if (q === 1) {
        const reported = target.rate === 1 ? cueProgress(state, api, 'step-overshoot-loss', 0, 0.33, 0.49) : 1;
        api.focus.target(target.rate === 1 ? 'overshoot-loss' : 'step-choice-' + i, () =>
          drawOriginalText(ctx, api, 'loss ' + (reported === 1 ? Number(derivativeLoss(landing).toFixed(4)) : '?'),
            1500, target.lane + 8, 30, target.color));
      }
    }
    if (beat === 2) {
      const probe = api.phase(beatP, 0.08, 0.85);
      const probeW = api.lerp(3, -1, probe),
        probeLoss = (2 * probeW - 5) ** 2;
      const slope = 4 * (2 * probeW - 5);
      const tangent = [probeW - 0.3, probeW + 0.3].map((w) => ({
        x: map.X(w),
        y: map.Y(probeLoss + slope * (w - probeW)),
      }));
      api.focus.target('changing-tangent', () =>
        api.path(ctx, tangent, {
          color: ink,
          width: 4,
          clip: {
            x: b.left,
            y: b.top,
            width: b.right - b.left,
            height: b.bottom - b.top,
          },
        }),
      );
      dot(map.X(probeW), map.Y(probeLoss), ink, 10);
      drawOriginalText(
        ctx,
        api,
        'local slope changes along the route',
        1515,
        705,
        27,
        ink,
        'center',
      );
    }
    dot(start.x, start.y, ink, 12);
    for (const w of [-1, 0, 1, 2, 3]) {
      line(ctx, map.X(w), b.bottom - 5, map.X(w), b.bottom + 5, muted, 2);
      drawOriginalText(ctx, api, String(w), map.X(w), b.bottom + 38, 28, muted, 'center');
    }
    drawOriginalEquation(
      ctx,
      api,
      String.raw`\left.\frac{dL}{dw}\right|_{w=3}=4`,
      780,
      285,
      37,
      ink,
      'center',
    );
    const askRate = beat === 0 && cueProgress(state, api, 'exact-rate-question', 0, 0.75, 0.86) > 0;
    api.focus.target('exact-rate', () => drawOriginalText(
      ctx,
      api,
      askRate ? 'What rate × 4 gives a step of 0.5?' :
        beat === 2 ? 'measure the loss after the move' : 'same local slope · different step lengths',
      960,
      940,
      33,
      muted,
      'center',
    ));
    return;
  })();
  ctx.restore();
}
export default {
  id: 'step-size-limits',
  draw: drawStepSizeLimits,
  cues: ['step-choice-2-b1-2', 'step-overshoot-loss', 'exact-rate-question', 'step-choice-1-b2-1', 'changing-tangent-b3-1'],
};
