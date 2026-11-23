import { TAU } from '../fixtures.mjs';
import { softmax } from '../arithmetic.mjs';
export function drawRouting(ctx, scene, state, api) {
  return api.focus.target('routing-construction', () => paintRouting(ctx, scene, state, api));
}
function paintRouting(ctx, scene, state, api) {
  const { C: themeColors, text, math, rect, circle, arrow, line, clamp, ease } = api;
  const { beat, beatP } = state;
  const progress = ease(clamp(beatP));
  const drawText = (value, x, y, size = 36, color = themeColors.ink, align = 'left', font) =>
    text(ctx, value, x, y, size, color, align, font);
  const drawEquation = (value, x, y, size = 42, color = themeColors.ink, align = 'left') =>
    math(ctx, value, x, y, size, color, align);
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
    const position = beat === 0 ? 3 : beat === 1 ? 3 + 3 * progress : 6;
    const frequency = 0.55,
      keyPositions = [0, 1, 2],
      baseAngles = [0, 0.8, -0.5];
    const colors = [themeColors.yellow, themeColors.blue, themeColors.pink];
    const scores = baseAngles.map(
      (baseAngle, i) =>
        Math.cos(baseAngle + keyPositions[i] * frequency - position * frequency) / Math.sqrt(2),
    );
    const weights = softmax(scores);
    drawText(
      `query position ${position.toFixed(2)}`,
      680,
      280,
      33,
      themeColors.cyan,
      'right',
      'mono',
    );
    api.focus.target('routed-query', () =>
      drawDial(960, 365, 90, [position * frequency], [themeColors.cyan]),
    );
    drawEquation(
      String.raw`a_j=\operatorname{softmax}_j\left(\frac{q^\top k_j}{\sqrt{2}}\right)`,
      1420,
      345,
      36,
      themeColors.ink,
      'center',
    );
    const barX = 470,
      barY = 970,
      barWidth = 980;
    let consumed = 0;
    const mixture = weights.map((weight, i) => {
      const node = api.focus.target('rotary-source-weight-' + i, () =>
        rect(ctx, barX + consumed * barWidth, barY, weight * barWidth, 30, colors[i], undefined, 0),
      );
      consumed += weight;
      return node;
    });
    weights.forEach((weight, i) => {
      const x = 410 + i * 550;
      const key = api.focus.target('positioned-source-key-' + i, () =>
        drawDial(x, 640, 83, [baseAngles[i] + keyPositions[i] * frequency], [colors[i]]),
      );
      const value = api.focus.target('unrotated-value-' + i, () =>
        rect(ctx, x - 125, 780, 250, 120, themeColors.panel, colors[i], 18),
      );
      api.container(
        ctx,
        value,
        () => {
          drawText(`value ${i + 1}`, x, 822, 28, colors[i], 'center');
          drawText(
            `[${[0, 1, 2].map((channel) => (channel === i ? '1' : '0')).join(', ')}]`,
            x,
            871,
            30,
            colors[i],
            'center',
            'mono',
          );
        },
        {
          id: `value-basis-${i}`,
          padding: 12,
        },
      );
      api.connect(ctx, key, value, {
        color: colors[i],
        width: 3 + weight * 15,
        gap: 16,
      });
      api.connect(ctx, value, mixture[i], {
        color: colors[i],
        width: 2 + weight * 15,
        gap: 12,
      });
      drawText(`key at ${keyPositions[i]}`, x, 520, 31, colors[i], 'center');
      drawText(`${(weight * 100).toFixed(1)}%`, x + 145, 765, 32, colors[i], 'center', 'mono');
    });
    drawText('output components', 1525, 998, 28, themeColors.green);
  }
}
export default {
  id: 'routing',
  draw: drawRouting,
  cues: [
    'routing-routed-query-b1-1',
    'rp-routing-0-0',
    'rp-routing-0-1',
    'rp-routing-0-2',
    'routing-rotary-source-weight-0-b2-1',
    'rp-routing-1-0',
    'rp-routing-1-1',
    'rp-routing-1-2',
    'routing-unrotated-value-0-b3-1',
    'rp-routing-2-0',
    'rp-routing-2-1',
    'rp-routing-2-2',
  ],
};
