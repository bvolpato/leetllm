import { TAU } from '../fixtures.mjs';
import { rotaryScore } from '../arithmetic.mjs';
export function drawPairSum(ctx, scene, state, api) {
  return api.focus.target('pair-sum-construction', () => paintPairSum(ctx, scene, state, api));
}
function paintPairSum(ctx, scene, state, api) {
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
    const distance = beat === 0 ? 2 * progress : beat === 1 ? 2 + 6 * progress : 8 + 4 * progress;
    const frequencies = [0.5, 0.05],
      colors = [themeColors.cyan, themeColors.yellow];
    const scores = frequencies.map((frequency) => Math.cos(distance * frequency));
    drawText(
      'Supplied pairs: norm product 1 · content phase 0',
      960,
      235,
      27,
      themeColors.muted,
      'center',
    );
    frequencies.forEach((frequency, i) => {
      const x = [390, 910][i],
        angle = distance * frequency;
      api.focus.target('frequency-dot-pair-' + i, () =>
        drawDial(x, 545, 160, [0, angle], [themeColors.muted, colors[i]]),
      );
      drawArc(x, 545, 70, 0, angle, colors[i], 3);
      drawText(`frequency ${frequency}`, x, 300, 35, colors[i], 'center');
      drawText(`pair score ${scores[i].toFixed(3)}`, x, 805, 32, colors[i], 'center', 'mono');
      const y = 450 + i * 230;
      drawText(`pair ${i + 1}`, 1570, y - 70, 31, colors[i], 'center');
      line(ctx, 1350, y, 1790, y, themeColors.muted, 3);
      line(ctx, 1570, y - 24, 1570, y + 24, themeColors.muted, 2);
      const endpoint = 1570 + 200 * scores[i];
      api.focus.target('frequency-contribution-' + i, () =>
        line(ctx, 1570, y, endpoint, y, colors[i], 22),
      );
      api.focus.target('frequency-contribution-' + i, () =>
        circle(ctx, endpoint, y, 10, colors[i]),
      );
      drawText(scores[i].toFixed(3), 1570, y + 75, 36, colors[i], 'center', 'mono');
    });
    const score = rotaryScore([1, 0, 1, 0], [1, 0, 1, 0], 0, distance, frequencies);
    drawEquation(
      String.raw`q^\top k=\sum_i q_i^\top R(\Delta\theta_i)k_i`,
      780,
      950,
      38,
      themeColors.ink,
      'center',
    );
    api.focus.target('head-summed-score', () =>
      drawText(`sum ${score.toFixed(3)}`, 1590, 950, 43, themeColors.green, 'center', 'mono'),
    );
    drawText(
      `relative offset ${distance.toFixed(2)}`,
      650,
      870,
      33,
      themeColors.muted,
      'center',
      'mono',
    );
  }
}
export default {
  id: 'pair-sum',
  draw: drawPairSum,
  cues: [
    'pair-sum-head-summed-score-b1-1',
    'rp-pair-sum-0-0',
    'rp-pair-sum-0-1',
    'pair-sum-frequency-contribution-0-b2-1',
    'pair-sum-frequency-contribution-1-b2-2',
    'rp-pair-sum-1-0',
    'rp-pair-sum-1-1',
    'rp-pair-sum-1-2',
    'rp-pair-sum-1-3',
    'pair-sum-frequency-dot-pair-1-b3-1',
    'rp-pair-sum-2-0',
    'rp-pair-sum-2-1',
    'rp-pair-sum-2-2',
  ],
};
