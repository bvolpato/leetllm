import { TAU } from '../fixtures.mjs';
export function drawInterpolation(ctx, scene, state, api) {
  return api.focus.target('interpolation-construction', () =>
    paintInterpolation(ctx, scene, state, api),
  );
}
function paintInterpolation(ctx, scene, state, api) {
  const { C: themeColors, text, math, rect, circle, arrow, line, clamp, ease, lerp, phase } = api;
  const { beat, beatP } = state;
  const progress = ease(clamp(beatP));
  const drawText = (value, x, y, size = 36, color = themeColors.ink, align = 'left', font) =>
    text(ctx, value, x, y, size, color, align, font);
  const drawEquation = (value, x, y, size = 42, color = themeColors.ink, align = 'left') =>
    math(ctx, value, x, y, size, color, align);
  const stage = (index, start = 0.08, end = 0.8) =>
    beat > index ? 1 : beat < index ? 0 : phase(beatP, start, end);
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
  const drawFooter = (value, color = themeColors.muted) =>
    drawText(value, 960, 988, 30, color, 'center');
  {
    const compression = stage(0, 0.28, 0.65),
      scale = lerp(1, 4, compression);
    const x = (value) => 210 + (value / 16384) * 1490;
    const positions = [0, 4096, 8192, 12288, 16383];
    drawText(
      'target coordinates: a four-times-longer window',
      960,
      285,
      36,
      themeColors.ink,
      'center',
    );
    line(ctx, 210, 420, 1700, 420, themeColors.muted, 3);
    positions.forEach((position) => {
      line(ctx, x(position), 410, x(position), 430, themeColors.muted, 3);
      drawText(String(position), x(position), 375, 29, themeColors.muted, 'center', 'mono');
    });
    rect(ctx, 185, 570, 430, 160, 'transparent', themeColors.yellow, 15);
    positions.forEach((position, i) => {
      const y = lerp(460, 645, compression),
        mapped = position / scale;
      api.focus.target('compressed-position-' + i, () =>
        circle(
          ctx,
          x(mapped),
          y,
          11,
          [
            themeColors.cyan,
            themeColors.blue,
            themeColors.green,
            themeColors.pink,
            themeColors.yellow,
          ][i],
        ),
      );
    });
    drawText('original training range', 400, 800, 30, themeColors.yellow, 'center');
    api.focus.target('position-interpolation-rule', () =>
      drawEquation(String.raw`m'=m/s`, 1220, 615, 59, themeColors.ink, 'center'),
    );
    drawText(`scale ${scale.toFixed(2)}`, 1220, 700, 37, themeColors.cyan, 'center', 'mono');
    api.focus.reveal('interpolation-adjacent-interpolated-phase-b2-1', () => {
      const phaseStep = 0.8 / scale;
      api.focus.target('adjacent-interpolated-phase', () =>
        drawDial(1040, 870, 67, [0, phaseStep], [themeColors.muted, themeColors.cyan]),
      );
      drawText(
        `adjacent phase ${phaseStep.toFixed(3)} rad`,
        1450,
        880,
        31,
        themeColors.cyan,
        'center',
        'mono',
      );
    });
    drawFooter('Geometric example: interpolation also reduces every local phase step.');
  }
}
export default {
  id: 'interpolation',
  draw: drawInterpolation,
  cues: [
    'interpolation-position-interpolation-rule-b1-1',
    'rp-interpolation-0-0',
    'rp-interpolation-0-1',
    'rp-interpolation-0-2',
    'interpolation-adjacent-interpolated-phase-b2-1',
    'rp-interpolation-1-0',
    'rp-interpolation-1-1',
    'rp-interpolation-1-2',
    'interpolation-compressed-position-2-b3-1',
    'rp-interpolation-2-0',
    'rp-interpolation-2-1',
    'rp-interpolation-2-2',
  ],
};
