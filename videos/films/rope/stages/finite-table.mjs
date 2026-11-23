import { absoluteRow } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawFiniteTable(ctx, scene, state, api) {
  return api.focus.target('finite-table-construction', () =>
    paintFiniteTable(ctx, scene, state, api),
  );
}
function paintFiniteTable(ctx, scene, state, api) {
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
      directedCue(state, 'rp-finite-table-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
  const drawRectangle = (x, y, w, h, color = themeColors.panel, stroke = themeColors.muted) =>
    api.rect(ctx, x, y, w, h, color, stroke, 5);
  {
    drawText('Learned position table · 4096 rows', 520, 285, 35, themeColors.blue);
    ['0', '1', '…', '4094', '4095'].forEach((id, i) => {
      drawRectangle(230, 350 + i * 105, 580, 80, themeColors.panel, themeColors.blue);
      drawText('row ' + id + ' · learned coordinates', 520, 400 + i * 105, 29, themeColors.blue);
    });
    if (cueProgress(0, 1) > 0) {
      drawRectangle(230, 885, 580, 80, 'transparent', themeColors.pink);
      drawText('4096 · no stored row', 520, 935, 31, themeColors.pink);
    }
    drawText('Formula row at position 4096', 1430, 350, 34, themeColors.cyan);
    if (resultComplete(0, 3)) {
      const row = absoluteRow(4096);
      row.forEach((v, i) =>
        drawText(
          (i % 2 ? 'cos' : 'sin') + ' ' + Math.floor(i / 2) + ' = ' + v.toFixed(4),
          1430,
          445 + i * 58,
          28,
          colors[Math.floor(i / 2)],
        ),
      );
    }
    if (currentBeat === 1) {
      drawText('Each coordinate lies between −1 and 1', 1430, 930, 29, themeColors.yellow);
    }
    drawNote('A formula can define a new row while a cached implementation still needs capacity.');
  }
  for (const segment of segments)
    for (const points of clearSegments(segment.a, segment.z, labels))
      api.path(ctx, points, {
        color: segment.color,
        width: segment.width,
      });
}
export default {
  id: 'finite-table',
  draw: drawFiniteTable,
  cues: [
    'rp-finite-table-0-0',
    'rp-finite-table-0-1',
    'rp-finite-table-0-2',
    'rp-finite-table-0-3',
    'rp-finite-table-1-0',
    'rp-finite-table-1-1',
    'rp-finite-table-1-2',
    'rp-finite-table-1-3',
  ],
};
