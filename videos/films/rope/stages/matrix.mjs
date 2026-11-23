import { TAU } from '../fixtures.mjs';
export function drawMatrix(ctx, scene, state, api) {
  return api.focus.target('matrix-construction', () => paintMatrix(ctx, scene, state, api));
}
function paintMatrix(ctx, scene, state, api) {
  const { C: themeColors, text, math, circle, arrow, line, path, clamp, ease, lerp, phase } = api;
  const { beat, beatP } = state;
  const progress = ease(clamp(beatP));
  const drawText = (value, x, y, size = 36, color = themeColors.ink, align = 'left', font) =>
    text(ctx, value, x, y, size, color, align, font);
  const drawEquation = (value, x, y, size = 42, color = themeColors.ink, align = 'left') =>
    math(ctx, value, x, y, size, color, align);
  const showLayer = (amount, paint) => api.components.fade(clamp(amount), paint);
  const stage = (index, start = 0.08, end = 0.8) =>
    beat > index ? 1 : beat < index ? 0 : phase(beatP, start, end);
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
    const angle = beat === 0 ? progress * 0.9 : beat === 1 ? 0.9 : 0.9 + progress * 0.7;
    const x = 500,
      y = 605,
      radius = 215;
    drawDial(x, y, radius);
    api.focus.target('rotated-horizontal-basis', () =>
      drawVector(x, y, radius * 0.83, angle, themeColors.cyan, 5),
    );
    api.focus.target('rotated-vertical-basis', () =>
      drawVector(x, y, radius * 0.83, angle + Math.PI / 2, themeColors.yellow, 5),
    );
    showLayer(stage(1), () =>
      api.focus.target('rotated-basis-combination', () => {
        const build = stage(1),
          first = clamp(2 * build),
          second = clamp(2 * build - 1),
          unit = radius * 0.83;
        const a = {
            x: x + 0.8 * unit * Math.cos(angle),
            y: y - 0.8 * unit * Math.sin(angle),
          },
          z = {
            x: a.x + 0.6 * unit * Math.cos(angle + Math.PI / 2),
            y: a.y - 0.6 * unit * Math.sin(angle + Math.PI / 2),
          };
        if (first > 0)
          arrow(
            ctx,
            x,
            y,
            x + 0.8 * unit * first * Math.cos(angle),
            y - 0.8 * unit * first * Math.sin(angle),
            themeColors.cyan,
            8,
          );
        if (second > 0)
          arrow(
            ctx,
            a.x,
            a.y,
            a.x + (z.x - a.x) * second,
            a.y + (z.y - a.y) * second,
            themeColors.yellow,
            8,
          );
        if (second === 1)
          drawVector(x, y, unit, angle + Math.atan2(0.6, 0.8), themeColors.green, 8);
        drawText('0.8 e₁ + 0.6 e₂', 500, 925, 28, themeColors.muted, 'center');
      }),
    );
    drawArc(x, y, 80, 0, angle, themeColors.cyan, 4);
    drawText('Two basis directions turn together', 500, 300, 33, themeColors.muted, 'center');
    api.focus.target('rotation-matrix', () =>
      drawEquation(
        String.raw`R(\phi)=\begin{pmatrix}\cos\phi&-\sin\phi\\\sin\phi&\cos\phi\end{pmatrix}`,
        1290,
        460,
        49,
        themeColors.ink,
        'center',
      ),
    );
    const c = Math.cos(angle),
      s = Math.sin(angle);
    api.focus.target('rotation-first-column', () =>
      drawText(
        `column 1   [${c.toFixed(3)}, ${s.toFixed(3)}]`,
        1000,
        660,
        31,
        themeColors.cyan,
        'left',
        'mono',
      ),
    );
    api.focus.target('rotation-second-column', () =>
      drawText(
        `column 2   [${(-s).toFixed(3)}, ${c.toFixed(3)}]`,
        1000,
        725,
        31,
        themeColors.yellow,
        'left',
        'mono',
      ),
    );
    showLayer(stage(1), () =>
      drawEquation(
        String.raw`R(\phi)\begin{pmatrix}0.8\\0.6\end{pmatrix}`,
        1290,
        875,
        47,
        themeColors.green,
        'center',
      ),
    );
    {
    }
  }
}
export default {
  id: 'matrix',
  draw: drawMatrix,
  cues: [
    'matrix-rotated-horizontal-basis-b1-1',
    'matrix-rotated-vertical-basis-b1-2',
    'rp-matrix-0-0',
    'rp-matrix-0-1',
    'rp-matrix-0-2',
    'matrix-rotation-matrix-b2-1',
    'rp-matrix-1-0',
    'rp-matrix-1-1',
    'matrix-rotated-horizontal-basis-b3-1',
    'rp-matrix-2-0',
    'rp-matrix-2-1',
    'rp-matrix-2-2',
    'rp-matrix-2-3',
  ],
};
