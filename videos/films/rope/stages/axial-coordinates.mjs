import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawAxialCoordinates(ctx, scene, state, api) {
  return api.focus.target('axial-coordinates-construction', () =>
    paintAxialCoordinates(ctx, scene, state, api),
  );
}
function paintAxialCoordinates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    labels = [],
    segments = [];
  const drawText = (value, x, y, size = 30, color = themeColors.ink, align = 'center') => {
    const text = String(value);
    ctx.save();
    ctx.font = lessonFont(size);
    const width = ctx.measureText(text).width;
    ctx.restore();
    labels.push({
      x: x - (align === 'center' ? width / 2 : align === 'right' ? width : 0) - 4,
      y: y - size - 4,
      width: width + 8,
      height: size + 8,
    });
    return api.text(ctx, text, x, y, size, color, align);
  };
  const cueProgress = (beat, sentence) =>
      directedCue(state, 'rp-axial-coordinates-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
  const drawRectangle = (x, y, w, h, color = themeColors.panel, stroke = themeColors.muted) =>
    api.rect(ctx, x, y, w, h, color, stroke, 5);
  const queueSegment = (x, y, u, v, color = themeColors.muted, width = 3) =>
    segments.push({
      a: {
        x,
        y,
      },
      z: {
        x: u,
        y: v,
      },
      color,
      width,
    });
  const drawClock = (x, y, r, angles, inks = colors, lengths = []) => {
    api.circle(ctx, x, y, r, 'transparent', '#33415a', 2);
    queueSegment(x - r, y, x + r, y, '#33415a', 2);
    queueSegment(x, y - r, x, y + r, '#33415a', 2);
    angles.forEach((a, i) => {
      const scale = lengths[i] ?? 1,
        at = {
          x: x + r * 0.86 * scale * Math.cos(a),
          y: y - r * 0.86 * scale * Math.sin(a),
        };
      queueSegment(x, y, at.x, at.y, inks[i] ?? themeColors.cyan, 5);
      api.circle(ctx, at.x, at.y, 6, inks[i] ?? themeColors.cyan);
    });
  };
  {
    if (currentBeat < 2) {
      const shift = currentBeat === 1 ? Math.round(4 * cueProgress(1, 3)) : 0,
        shiftW = currentBeat === 1 ? Math.round(7 * cueProgress(1, 3)) : 0,
        q = [1 + shift, 1 + shiftW],
        k = [shift, 1 + shiftW],
        lost = currentBeat === 1 && cueProgress(1, 4) > 0;
      drawText('Actual patch locations · height ↓, width →', 560, 265, 32, themeColors.muted);
      for (let h = 0; h < 6; h++)
        for (let w = 0; w < 9; w++)
          drawRectangle(145 + w * 88, 340 + h * 88, 80, 80, 'transparent', '#28374a');
      [
        [q, themeColors.cyan, 'Q'],
        [k, themeColors.yellow, 'K'],
      ].forEach(([p, color, name]) => {
        const x = 185 + p[1] * 88,
          y = 380 + p[0] * 88;
        api.circle(ctx, x, y, 23, color);
        drawText(name, x, y + 10, 27, themeColors.bg);
      });
      drawText('Encoded height pair', 1460, 310, 32, themeColors.cyan);
      drawClock(
        1460,
        490,
        120,
        [lost ? 0 : q[0] * 0.5, lost ? 0 : k[0] * 0.5],
        [themeColors.cyan, themeColors.yellow],
      );
      drawText(
        'Height IDs ' + (lost ? '0 / 0' : q[0] + ' / ' + k[0]),
        1460,
        685,
        30,
        lost ? themeColors.pink : themeColors.cyan,
      );
      drawText('Width IDs ' + q[1] + ' / ' + k[1], 1460, 765, 30, themeColors.yellow);
      if (currentBeat === 1 && resultComplete(1, 2))
        drawText(
          'score = ' +
            (lost ? (resultComplete(1, 4) ? '2.000000' : '?') : (Math.cos(0.5) + 1).toFixed(6)),
          1460,
          900,
          43,
          lost ? themeColors.pink : themeColors.green,
        );
      drawNote(
        lost
          ? 'The patches remain physically distinct; dropping height IDs makes only their encoded positions coincide.'
          : 'Two independent coordinate differences contribute to the fixed-vector score.',
      );
    } else {
      [2, 4].forEach((width, j) => {
        const x = 160 + j * 650;
        drawText('Raster width ' + width, x + 220, 300, 34, colors[j]);
        for (let h = 0; h < 2; h++)
          for (let w = 0; w < width; w++) {
            drawRectangle(x + w * 95, 390 + h * 120, 85, 95, themeColors.panel, colors[j]);
            drawText(h * width + w, x + w * 95 + 42, 450 + h * 120, 29, colors[j]);
          }
        drawText('Vertical neighbor gap: ' + width, x + 220, 750, 32, themeColors.yellow);
      });
      drawText('Reported Qwen2.5-VL axes', 1530, 330, 31, themeColors.ink);
      drawText('text: [p,p,p]', 1530, 500, 34, themeColors.cyan);
      drawText('image: [t,h,w]', 1530, 640, 34, themeColors.yellow);
      drawText('Processor defines allocation + continuation', 1530, 810, 25, themeColors.muted);
      drawNote(
        'This two-axis toy is separate from the checkpoint’s complete multimodal processor.',
      );
    }
  }
  for (const segment of segments)
    for (const points of clearSegments(segment.a, segment.z, labels))
      api.path(ctx, points, {
        color: segment.color,
        width: segment.width,
      });
}
export default {
  id: 'axial-coordinates',
  draw: drawAxialCoordinates,
  cues: [
    'rp-axial-coordinates-0-0',
    'rp-axial-coordinates-0-1',
    'rp-axial-coordinates-0-2',
    'rp-axial-coordinates-0-3',
    'rp-axial-coordinates-1-0',
    'rp-axial-coordinates-1-1',
    'rp-axial-coordinates-1-2',
    'rp-axial-coordinates-1-3',
    'rp-axial-coordinates-1-4',
    'rp-axial-coordinates-1-5',
    'rp-axial-coordinates-2-0',
    'rp-axial-coordinates-2-1',
    'rp-axial-coordinates-2-2',
    'rp-axial-coordinates-2-3',
  ],
};
