import { directedCue } from '../construction.mjs';
import { contentOutputs, contentWeights } from '../model.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawMaskAndPrefill(ctx, scene, state, api) {
  return api.focus.target('mask-and-prefill-construction', () =>
    paintMaskAndPrefill(ctx, scene, state, api),
  );
}
function paintMaskAndPrefill(ctx, scene, state, api) {
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
      directedCue(state, 'rp-mask-and-prefill-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
  const drawRectangle = (x, y, w, h, color = themeColors.panel, stroke = themeColors.muted) =>
    api.rect(ctx, x, y, w, h, color, stroke, 5);
  const formatVector = (values) =>
    '[' + values.map((v) => (Math.abs(v) < 1e-12 ? '0' : v.toFixed(4))).join(', ') + ']';
  const drawOutputRows = (values, x, y, heading, visible = values.length) => {
    drawText(heading, x, y, 32, themeColors.ink);
    values.forEach((row, i) =>
      drawText(i < visible ? formatVector(row) : '[ ?, ?, ? ]', x, y + 95 + i * 90, 29, colors[i]),
    );
  };
  {
    const order = currentBeat === 0 && resultComplete(0, 1) ? [2, 1, 0] : [0, 1, 2],
      names = ['dogs', 'chase', 'cats'];
    drawText(
      currentBeat === 0
        ? 'Permute rows and columns together'
        : 'Parallel prefill · logical positions 1,2,3',
      960,
      270,
      34,
      themeColors.cyan,
    );
    for (let row = 0; row < 3; row++) {
      drawText(names[order[row]], 220, 410 + row * 150, 29, colors[order[row]]);
      drawText(names[order[row]], 550 + row * 200, 335, 29, colors[order[row]]);
    }
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const allow = currentBeat === 0 || col <= row,
          w = contentWeights[order[row]][order[col]],
          x = 470 + col * 200,
          y = 370 + row * 150;
        drawRectangle(
          x,
          y,
          160,
          115,
          allow
            ? currentBeat === 0
              ? 'rgba(92,196,240,' + (0.15 + w * 0.7) + ')'
              : 'rgba(92,196,240,.3)'
            : themeColors.panel,
          allow ? themeColors.cyan : themeColors.pink,
        );
        drawText(
          currentBeat === 0 ? w.toFixed(3) : allow ? 'allow' : 'hide',
          x + 80,
          y + 70,
          30,
          allow ? themeColors.ink : themeColors.pink,
        );
      }
    if (currentBeat === 0) {
      drawOutputRows(
        order.map((i) => contentOutputs[i]),
        1490,
        360,
        'Output travels with token',
      );
      if (resultComplete(0, 3))
        drawText('Dropout disabled for the comparison', 1490, 865, 29, themeColors.yellow);
    } else {
      drawText('Query 2 cannot read key 3', 1470, 430, 34, themeColors.pink);
      if (resultComplete(1, 2))
        drawText('Same mask · rows may execute together', 1470, 570, 29, themeColors.cyan);
      if (resultComplete(1, 4)) {
        drawText('Identical V rows [1,1]', 1470, 745, 30, themeColors.yellow);
        drawText('Every permitted weighted average = [1,1]', 1470, 840, 27, themeColors.green);
      }
    }
    drawNote(
      currentBeat === 0
        ? 'Follow the token and its output row.'
        : 'Each row can read through its own position.',
    );
  }
  for (const segment of segments)
    for (const points of clearSegments(segment.a, segment.z, labels))
      api.path(ctx, points, {
        color: segment.color,
        width: segment.width,
      });
}
export default {
  id: 'mask-and-prefill',
  draw: drawMaskAndPrefill,
  cues: [
    'rp-mask-and-prefill-0-0',
    'rp-mask-and-prefill-0-1',
    'rp-mask-and-prefill-0-2',
    'rp-mask-and-prefill-0-3',
    'rp-mask-and-prefill-1-0',
    'rp-mask-and-prefill-1-1',
    'rp-mask-and-prefill-1-2',
    'rp-mask-and-prefill-1-3',
    'rp-mask-and-prefill-1-4',
  ],
};
