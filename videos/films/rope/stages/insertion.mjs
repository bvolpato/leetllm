import { TAU } from '../fixtures.mjs';
export function drawInsertion(ctx, scene, state, api) {
  return api.focus.target('insertion-construction', () => paintInsertion(ctx, scene, state, api));
}
function paintInsertion(ctx, scene, state, api) {
  const { C: themeColors, text, rect, circle, arrow, line, clamp, ease, phase } = api;
  const { beat, beatP } = state;
  const progress = ease(clamp(beatP));
  const drawText = (value, x, y, size = 36, color = themeColors.ink, align = 'left', font) =>
    text(ctx, value, x, y, size, color, align, font);
  const showLayer = (amount, paint) => api.components.fade(clamp(amount), paint);
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
  const drawTile = (value, x, y, width, height, color = themeColors.cyan, size = 36) => {
    return api.components.card({
      label: value,
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      fill: themeColors.panel,
      stroke: color,
      radius: 18,
      padding: 14,
      id: `tile-${value}`,
      fontSize: size,
      textColor: color,
      baselineOffset: size * 0.34,
    });
  };
  {
    const ys = [375, 600, 825];
    const names = ['Absolute', 'RoPE', 'ALiBi'];
    const accents = [themeColors.blue, themeColors.cyan, themeColors.yellow];
    ys.forEach((y, row) => {
      drawText(names[row], 170, y - 80, 35, accents[row]);
      const nodes = [
        api.focus.target('embedding-insertion-' + row, () =>
          drawTile('embedding', 300, y, 260, 90, row === 0 ? accents[row] : themeColors.muted, 30),
        ),
        api.focus.target('qk-insertion-' + row, () => {
          if (row !== 1) return drawTile('Q and K', 790, y, 240, 90, themeColors.muted, 34);
          const box = rect(ctx, 670, y - 45, 240, 90, themeColors.panel, themeColors.cyan, 14);
          drawText('Q, K', 735, y + 12, 30, themeColors.cyan, 'center');
          drawDial(
            850,
            y,
            25,
            [1.5 * stage(1), 0.5 * stage(1)],
            [themeColors.cyan, themeColors.yellow],
          );
          return box;
        }),
        api.focus.target('score-insertion-' + row, () =>
          drawTile('scores', 1260, y, 235, 90, row === 2 ? accents[row] : themeColors.muted, 34),
        ),
        drawTile('weights', 1700, y, 220, 90, themeColors.muted, 32),
      ];
      for (let i = 0; i < nodes.length - 1; i++)
        api.connect(ctx, nodes[i], nodes[i + 1], {
          color: '#405778',
          width: 3,
          gap: 12,
        });
      showLayer(stage(row), () => {
        const x = [300, 790, 1260][row];
        drawText(
          ['add position vector', 'rotate coordinate pairs', 'add distance bias'][row],
          x,
          y + 100,
          28,
          accents[row],
          'center',
        );
        circle(ctx, x, y - 63, 8, accents[row]);
      });
    });
  }
}
export default {
  id: 'insertion',
  draw: drawInsertion,
  cues: [
    'insertion-embedding-insertion-0-b1-1',
    'rp-insertion-0-0',
    'rp-insertion-0-1',
    'insertion-qk-insertion-1-b2-1',
    'rp-insertion-1-0',
    'rp-insertion-1-1',
    'rp-insertion-1-2',
    'insertion-score-insertion-2-b3-1',
    'rp-insertion-2-0',
    'rp-insertion-2-1',
    'rp-insertion-2-2',
  ],
};
