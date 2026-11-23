import { TAU } from '../fixtures.mjs';
import { rotatePair } from '../arithmetic.mjs';
export function drawRotation(ctx, scene, state, api) {
  return api.focus.target('rotation-construction', () => paintRotation(ctx, scene, state, api));
}
function paintRotation(ctx, scene, state, api) {
  const { C: themeColors, text, math, circle, arrow, line, path, clamp, ease, lerp } = api;
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
  {
    const position = beat === 0 ? 0 : beat === 1 ? 3 * progress : 3 + 2 * progress;
    const frequency = 0.5,
      angle = position * frequency;
    api.focus.target('rotating-coordinate-pair', () =>
      drawDial(570, 600, 235, [angle], [themeColors.cyan]),
    );
    api.focus.target('original-coordinate-pair', () => {
      circle(ctx, 570 + 235 * 0.91, 600, 7, 'transparent', themeColors.muted, 2);
      drawText('original unit arrow', 570, 910, 27, themeColors.muted, 'center');
    });
    api.focus.target('position-rotation-angle', () =>
      drawArc(570, 600, 95, 0, angle, themeColors.yellow, 6),
    );
    drawText('one coordinate pair', 570, 295, 36, themeColors.cyan, 'center');
    api.focus.target('position-frequency-product', () =>
      drawEquation(String.raw`\phi=m\theta`, 1220, 385, 65, themeColors.ink, 'center'),
    );
    drawText(`position   ${position.toFixed(2)}`, 1040, 515, 37, themeColors.cyan, 'left', 'mono');
    drawText(
      `frequency  ${frequency.toFixed(2)}`,
      1040,
      585,
      37,
      themeColors.muted,
      'left',
      'mono',
    );
    drawText(
      `angle      ${angle.toFixed(2)} rad`,
      1040,
      655,
      37,
      themeColors.yellow,
      'left',
      'mono',
    );
    const [x, y] = rotatePair([1, 0], angle);
    api.focus.reveal('rotation-preserved-vector-length-b3-1', () => {
      api.focus.target('rotated-coordinates', () =>
        drawText(
          `[${x.toFixed(3)}, ${y.toFixed(3)}]`,
          1220,
          785,
          40,
          themeColors.cyan,
          'center',
          'mono',
        ),
      );
      api.focus.target('preserved-vector-length', () =>
        drawEquation(String.raw`\|q^{(m)}\|=\|q\|=1`, 1220, 885, 44, themeColors.green, 'center'),
      );
    });
    {
    }
  }
}
export default {
  id: 'rotation',
  draw: drawRotation,
  cues: [
    'rotation-rotating-coordinate-pair-b1-1',
    'rp-rotation-0-0',
    'rp-rotation-0-1',
    'rp-rotation-0-2',
    'rotation-position-frequency-product-b2-1',
    'rp-rotation-1-0',
    'rp-rotation-1-1',
    'rp-rotation-1-2',
    'rotation-preserved-vector-length-b3-1',
    'rp-rotation-2-0',
    'rp-rotation-2-1',
    'rp-rotation-2-2',
  ],
};
