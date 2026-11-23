import { cueProgress, number } from '../latency-ruler.mjs';
import { precisionProbe } from '../arithmetic.mjs';
import {
  drawAxes,
  drawCurve,
  drawOriginalEquation,
  drawOriginalText,
} from '../defaults.mjs';
const slopeX = slope => 1080 + ((slope - 3.7) / 0.4) * 600;

export function drawGradientCheck(ctx, scene, state, api) {
  if (state.beat === 2) {
    return drawProbeSpacing(ctx, api, {
      rounded: cueProgress(state, api, 'stored-probes', 2, 0.1, 0.19),
      usual: cueProgress(state, api, 'rounded-slope-b3-1', 2, 0.53, 0.66),
      actual: 0,
    });
  }
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
    api.focus.target('centered-difference', () =>
      drawOriginalEquation(
        ctx,
        api,
        String.raw`\frac{L(w+\epsilon)-L(w-\epsilon)}{2\epsilon}`,
        960,
        260,
        46,
        ink,
        'center',
      ),
    );
    const main = {
      left: 250,
      top: 390,
      right: 820,
      bottom: 735,
    };
    drawAxes(ctx, api, main, String.raw`w`, String.raw`L`);
    const map = drawCurve(ctx, api, main, 2.35, 3.65, 0, 5.5, (w) => (2 * w - 5) ** 2, cyan, 5);
    const focus = {
      x: map.X(3),
      y: map.Y(1),
    };
    dot(focus.x, focus.y, yellow, 14);
    circle(ctx, focus.x, focus.y, 44, 'transparent', muted, 2);
    line(ctx, focus.x + 38, focus.y - 22, 1080, 370, muted, 2);
    line(ctx, focus.x + 38, focus.y + 22, 1080, 720, muted, 2);
    rect(ctx, 1080, 320, 640, 430, panel, '#52617a', 16);
    const zoom = {
      left: 1100,
      top: 385,
      right: 1700,
      bottom: 705,
    };
    const epsilon = beat === 0 ? api.lerp(0.035, 0.000001, api.phase(beatP, 0.1, 0.85)) : 0.000001;
    const [mantissa, exponent] = epsilon.toExponential(1).split('e');
    drawOriginalEquation(
      ctx,
      api,
      String.raw`\epsilon=${mantissa}\times10^{${Number(exponent)}}`,
      1400,
      360,
      29,
      yellow,
      'center',
    );
    const scale = epsilon * 1.25;
    const zoomMap = drawCurve(
      ctx,
      api,
      zoom,
      3 - scale,
      3 + scale,
      1 - 4.3 * scale,
      1 + 4.3 * scale,
      (w) => (2 * w - 5) ** 2,
      cyan,
      5,
    );
    const leftPoint = {
      x: zoomMap.X(3 - epsilon),
      y: zoomMap.Y((2 * (3 - epsilon) - 5) ** 2),
    };
    const midPoint = {
      x: zoomMap.X(3),
      y: zoomMap.Y(1),
    };
    const rightPoint = {
      x: zoomMap.X(3 + epsilon),
      y: zoomMap.Y((2 * (3 + epsilon) - 5) ** 2),
    };
    line(ctx, leftPoint.x, leftPoint.y, rightPoint.x, rightPoint.y, yellow, 4);
    api.focus.target('lower-probe', () => dot(leftPoint.x, leftPoint.y, blue, 8));
    dot(midPoint.x, midPoint.y, green, 8);
    api.focus.target('upper-probe', () => dot(rightPoint.x, rightPoint.y, pink, 8));
    drawOriginalEquation(
      ctx,
      api,
      String.raw`w-\epsilon`,
      leftPoint.x + 20,
      leftPoint.y - 65,
      30,
      blue,
    );
    drawOriginalEquation(
      ctx,
      api,
      String.raw`w+\epsilon`,
      rightPoint.x + 20,
      rightPoint.y + 48,
      30,
      pink,
      'right',
    );
    drawOriginalText(
      ctx,
      api,
      'the view magnifies as the nudge shrinks',
      1400,
      795,
      28,
      muted,
      'center',
    );
    line(ctx, 1050, 835, 1710, 835, muted, 3);
    const exactX = slopeX(4);
    api.focus.target('analytical-slope', () => line(ctx, exactX, 812, exactX, 858, green, 5));
    drawOriginalText(ctx, api, beat === 0 ? 'reference slope 4' : 'reference 4 · float64 agrees',
      exactX, 900, 28, green, 'center');
    return;
  })();
  ctx.restore();
}
export default {
  id: 'gradient-check',
  draw: drawGradientCheck,
  cues: [
    'lower-probe-b1-1',
    'centered-difference-b1-2',
    'analytical-slope-b2-1',
    'stored-probes',
    'stored-probe-losses',
    'rounded-slope-b3-1',
  ],
};

export function drawProbeSpacing(ctx, api, { rounded, usual, actual }) {
  const { C, text, line, circle, focus } = api;
  const probe = precisionProbe(true);
  const x = offset => 1010 + 565 * offset;
  const scale = 1e6;
  const low = (probe.lowerWeight - 3) * scale, high = (probe.upperWeight - 3) * scale;
  text(ctx, 'Distance from weight 3, in millionths', 1010, 275, 37, C.ink, 'center');
  for (const tick of [-1, 0, 1]) {
    if (tick === 0) {
      for (const y of [410, 510]) line(ctx, x(tick), y, x(tick), y + 15, C.muted, 2);
    } else line(ctx, x(tick), 340, x(tick), 540, C.muted + '66', 2);
    text(ctx, number(tick), x(tick), 326, 29, C.muted, 'center');
  }
  function span(y, label, left, right, color) {
    text(ctx, label, 140, y + 8, 32, color);
    line(ctx, x(left), y, x(right), y, color, 4);
    circle(ctx, x(left), y, 11, color);
    circle(ctx, x(right), y, 11, color);
    text(ctx, 'spacing  ' + number(right - left, 7), x(0), y - 27, 35, color, 'center');
  }
  span(410, 'Requested', -1, 1, C.muted);
  if (rounded > 0) focus.target('stored-weights-probe', () => {
    span(510, 'Float32', api.lerp(-1, low, rounded), api.lerp(1, high, rounded), C.cyan);
    if (rounded === 1) {
      text(ctx, 'w−  ' + number(probe.lowerWeight, 10), x(low), 580, 31, C.cyan, 'center');
      text(ctx, 'w+  ' + number(probe.upperWeight, 10), x(high), 580, 31, C.cyan, 'center');
    }
  });
  line(ctx, 1050, 835, 1710, 835, C.muted, 3);
  const exactX = slopeX(4);
  line(ctx, exactX, 814, exactX, 856, C.green, 5);
  text(ctx, 'reference 4', exactX, 900, 30, C.green, 'center');
  focus.target('probe-losses', () => {
    text(ctx, 'L− = ' + probe.minus.toFixed(9), x(low), 643, 35, C.ink, 'center');
    text(ctx, 'L+ = ' + probe.plus.toFixed(9), x(high), 643, 35, C.ink, 'center');
  });
  if (rounded === 1) {
    const numerator = number(probe.lossDifference * scale, 7);
    text(ctx, 'L+ − L−  ≈  ' + numerator + ' × 10⁻⁶', 1010, 730, 40, C.ink, 'center');
    text(ctx, 'Divide by the requested gap', 180, 812, 30, C.muted);
    text(ctx, numerator + ' / 2   ≈   ' + (usual === 1 ? number(probe.slope, 3) : '?'),
      180, 866, 39, C.yellow);
    const movedX = slopeX(api.lerp(4, probe.slope, usual));
    focus.target('rounded-slope', () =>
      line(ctx, movedX, 812, movedX, 858, C.yellow, 5));
    if (usual === 1) {
      text(ctx, 'float32 · ' + number(probe.slope, 3), movedX, 900, 30, C.yellow, 'center');
      text(ctx, 'requested gap', movedX, 966, 30, C.yellow, 'center');
    }
    if (actual > 0) focus.target('actual-spacing-slope', () => {
      text(ctx, 'Divide by the stored gap', 180, 935, 30, C.muted);
      text(ctx, numerator + ' / ' + number(probe.storedSpacing * scale, 7) + '   ≈   ' +
        (actual === 1 ? probe.slopeAtStoredSpacing : '?'), 180, 986, 39, C.cyan);
      const storedX = slopeX(api.lerp(probe.slope, probe.slopeAtStoredSpacing, actual));
      circle(ctx, storedX, 835, 8, C.cyan);
      if (actual === 1) text(ctx, 'stored gap · ' + probe.slopeAtStoredSpacing, storedX, 966, 30, C.cyan, 'center');
    });
  }
}
