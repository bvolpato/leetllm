import { TAU } from '../fixtures.mjs';
export function drawPhaseWrap(ctx, scene, state, api) {
  return api.focus.target('phase-wrap-construction', () => paintPhaseWrap(ctx, scene, state, api));
}
function paintPhaseWrap(ctx, scene, state, api) {
  const { C: themeColors, text, math, circle, arrow, line, path, clamp, ease, lerp, phase } = api;
  const { beat, beatP } = state;
  const progress = ease(clamp(beatP));
  const drawText = (value, x, y, size = 36, color = themeColors.ink, align = 'left', font) =>
    text(ctx, value, x, y, size, color, align, font);
  const drawEquation = (value, x, y, size = 42, color = themeColors.ink, align = 'left') =>
    math(ctx, value, x, y, size, color, align);
  const drawArc = (x, y, r, from, to, color, width = 4, reveal = 1) => {
    const end = lerp(from, to, clamp(reveal));
    path(
      ctx,
      Array.from(
        {
          length: 81,
        },
        (_, i) => {
          const angle = lerp(from, end, i / 80);
          return {
            x: x + r * Math.cos(angle),
            y: y - r * Math.sin(angle),
          };
        },
      ),
      {
        color,
        width,
      },
    );
  };
  const drawVector = (x, y, length, angle, color, width = 7) => {
    const endpoint = {
      x: x + length * Math.cos(angle),
      y: y - length * Math.sin(angle),
    };
    arrow(ctx, x, y, endpoint.x, endpoint.y, color, width);
    return endpoint;
  };
  const drawDial = (x, y, radius, angles = [], colors = []) => {
    const boundary = circle(ctx, x, y, radius, 'transparent', '#293b59', 2);
    line(ctx, x - radius - 15, y, x + radius + 15, y, '#293b59', 2);
    line(ctx, x, y - radius - 15, x, y + radius + 15, '#293b59', 2);
    for (let tick = 0; tick < 12; tick++) {
      const a = (tick * TAU) / 12;
      line(
        ctx,
        x + (radius - 6) * Math.cos(a),
        y - (radius - 6) * Math.sin(a),
        x + radius * Math.cos(a),
        y - radius * Math.sin(a),
        '#3d5273',
        2,
      );
    }
    angles.forEach((angle, i) =>
      drawVector(x, y, radius * 0.91, angle, colors[i] ?? themeColors.cyan),
    );
    circle(ctx, x, y, 5, themeColors.ink);
    return boundary;
  };
  const drawPlot = (
    bounds,
    fn,
    minimumX,
    maximumX,
    minimumY,
    maximumY,
    color = themeColors.cyan,
    amount = 1,
  ) => {
    const { x, y, width, height } = bounds;
    const X = (value) => x + ((value - minimumX) / (maximumX - minimumX)) * width;
    const Y = (value) => y + height - ((value - minimumY) / (maximumY - minimumY)) * height;
    line(ctx, x, y + height, x + width, y + height, themeColors.muted, 2);
    line(ctx, x, y, x, y + height, themeColors.muted, 2);
    if (minimumY < 0 && maximumY > 0) line(ctx, x, Y(0), x + width, Y(0), '#293b59', 2);
    const points = Array.from(
      {
        length: 241,
      },
      (_, i) => {
        const value = lerp(minimumX, maximumX, (i / 240) * clamp(amount));
        return {
          x: X(value),
          y: Y(fn(value)),
        };
      },
    );
    path(ctx, points, {
      color,
      width: 5,
      clip: bounds,
    });
    return {
      X,
      Y,
    };
  };
  {
    const distance = beat === 0 ? 8 * phase(beatP, 0.01, 0.68) : beat === 1 ? 8 + 8 * progress : 16;
    const angle = 0.5 * distance,
      score = Math.cos(angle);
    api.focus.target('wrapping-frequency-pair', () =>
      drawDial(440, 560, 180, [0, angle], [themeColors.muted, themeColors.cyan]),
    );
    drawArc(440, 560, 78, 0, angle, themeColors.cyan, 4);
    drawEquation(String.raw`S_\Delta=\cos(0.5\Delta)`, 440, 300, 41, themeColors.cyan, 'center');
    const bounds = {
      x: 890,
      y: 390,
      width: 820,
      height: 400,
    };
    const { X, Y } = api.focus.target('oscillating-distance-curve', () =>
      drawPlot(
        bounds,
        (offset) => Math.cos(0.5 * offset),
        0,
        16,
        -1.15,
        1.15,
        themeColors.cyan,
        clamp(distance / 16),
      ),
    );
    api.focus.target('current-distance-score', () =>
      circle(ctx, X(distance), Y(score), 11, themeColors.yellow),
    );
    drawText('increasing distance', 1300, 850, 32, themeColors.muted, 'center');
    api.focus.reveal('phase-wrap-slower-frequency-pair-b2-1', () => {
      const other = distance + 4 * Math.PI;
      api.focus.target('slower-frequency-pair', () => {
        drawDial(310, 880, 62, [0.05 * distance], [themeColors.yellow]);
        drawDial(650, 880, 62, [0.05 * other], [themeColors.pink]);
      });
      drawText('Δ ' + distance.toFixed(2), 310, 985, 25, themeColors.yellow, 'center');
      drawText('Δ ' + other.toFixed(2), 650, 985, 25, themeColors.pink, 'center');
      drawText(
        'Continuous probes Δ and Δ+4π share the fast phase.',
        440,
        245,
        25,
        themeColors.muted,
        'center',
      );
    });
    drawText(`score ${score.toFixed(3)}`, 1300, 950, 39, themeColors.cyan, 'center', 'mono');
  }
}
export default {
  id: 'phase-wrap',
  draw: drawPhaseWrap,
  cues: [
    'phase-wrap-wrapping-frequency-pair-b1-1',
    'rp-phase-wrap-0-0',
    'rp-phase-wrap-0-1',
    'rp-phase-wrap-0-2',
    'rp-phase-wrap-0-3',
    'phase-wrap-slower-frequency-pair-b2-1',
    'rp-phase-wrap-1-0',
    'rp-phase-wrap-1-1',
    'rp-phase-wrap-1-2',
    'phase-wrap-current-distance-score-b3-1',
    'rp-phase-wrap-2-0',
    'rp-phase-wrap-2-1',
    'rp-phase-wrap-2-2',
  ],
};
