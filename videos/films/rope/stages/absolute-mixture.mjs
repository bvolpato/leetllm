import { absoluteExpansion } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawAbsoluteMixture(ctx, scene, state, api) {
  return api.focus.target('absolute-mixture-construction', () =>
    paintAbsoluteMixture(ctx, scene, state, api),
  );
}
function paintAbsoluteMixture(ctx, scene, state, api) {
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
      directedCue(state, 'rp-absolute-mixture-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
  const drawRectangle = (x, y, w, h, color = themeColors.panel, stroke = themeColors.muted) =>
    api.rect(ctx, x, y, w, h, color, stroke, 5);
  const formatVector = (values) =>
    '[' + values.map((v) => (Math.abs(v) < 1e-12 ? '0' : v.toFixed(4))).join(', ') + ']';
  {
    if (currentBeat < 2) {
      const shift = currentBeat === 1 ? 4 * cueProgress(1, 0) : 0,
        A =
          currentBeat === 1 && cueProgress(1, 1) > 0
            ? [
                [2, 0],
                [0, 1],
              ]
            : [
                [1, 0],
                [0, 1],
              ],
        model = absoluteExpansion(shift, A);
      drawText(
        'Supplied content q = [.8,.6], k = [.2,1] · θ = .5',
        960,
        265,
        31,
        themeColors.muted,
      );
      drawText(
        'Content + position at m = ' + (5 + shift).toFixed(2),
        500,
        365,
        31,
        themeColors.cyan,
      );
      drawText(
        'Content + position at n = ' + (2 + shift).toFixed(2),
        1420,
        365,
        31,
        themeColors.yellow,
      );
      drawText(
        formatVector(model.q) + ' + ' + formatVector(model.pq),
        500,
        445,
        29,
        themeColors.cyan,
      );
      drawText(
        formatVector(model.k) + ' + ' + formatVector(model.pk),
        1420,
        445,
        29,
        themeColors.yellow,
      );
      const names = [
        'content × content',
        'content × position',
        'position × content',
        'position × position',
      ];
      model.terms.forEach((value, i) => {
        const x = 280 + i * 450;
        drawRectangle(
          x - 165,
          570,
          330,
          155,
          themeColors.panel,
          i === 1 || i === 2 ? themeColors.pink : colors[i],
        );
        drawText(names[i], x, 620, 26, i === 1 || i === 2 ? themeColors.pink : colors[i]);
        drawText(
          currentBeat > 0 || resultComplete(0, 2) ? value.toFixed(4) : '?',
          x,
          690,
          37,
          colors[i],
        );
      });
      if (currentBeat === 1) {
        drawText(
          A[0][0] === 1
            ? 'Position-only identity projection'
            : 'Learned bilinear example A = diag(2,1)',
          960,
          815,
          34,
          themeColors.yellow,
        );
        drawText(
          'Position-only term: ' + model.terms[3].toFixed(4),
          960,
          900,
          37,
          themeColors.green,
        );
      } else if (resultComplete(0, 3))
        drawText(
          'Cross terms remain: ' + model.terms[1].toFixed(4) + ' and ' + model.terms[2].toFixed(4),
          960,
          870,
          35,
          themeColors.pink,
        );
      drawNote(
        currentBeat === 1
          ? 'Shared-shift invariance requires SᵀAS = A, beyond merely using equal projection matrices.'
          : 'Addition preserves width while creating four actual bilinear contributions.',
      );
    } else {
      const grow = cueProgress(2, 2),
        count = 1 + Math.floor(3 * grow),
        x = 350,
        y = 390;
      drawText('Construct the square projection from 256² blocks', 960, 270, 34, themeColors.cyan);
      for (let i = 0; i < count; i++) {
        drawRectangle(
          x + (i % 2) * 200,
          y + Math.floor(i / 2) * 200,
          200,
          200,
          themeColors.panel,
          themeColors.cyan,
        );
        drawText(
          '256 × 256',
          x + (i % 2) * 200 + 100,
          y + Math.floor(i / 2) * 200 + 110,
          27,
          themeColors.cyan,
        );
      }
      if (grow === 1) drawText('Whole square: 512 × 512', 550, 900, 31, themeColors.cyan);
      drawText('Addition: width d', 1380, 400, 36, themeColors.blue);
      if (cueProgress(2, 2) > 0)
        drawText('Concatenation: width 2d', 1380, 550, 36, themeColors.yellow);
      if (resultComplete(2, 4)) {
        drawText('65,536 → 262,144 entries', 1380, 735, 35, themeColors.green);
        drawText('4× for each retained square projection', 1380, 850, 30, themeColors.green);
      }
      drawNote(
        'An extra reduction projection would define a different width and parameter budget.',
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
  id: 'absolute-mixture',
  draw: drawAbsoluteMixture,
  cues: [
    'rp-absolute-mixture-0-0',
    'rp-absolute-mixture-0-1',
    'rp-absolute-mixture-0-2',
    'rp-absolute-mixture-0-3',
    'rp-absolute-mixture-1-0',
    'rp-absolute-mixture-1-1',
    'rp-absolute-mixture-1-2',
    'rp-absolute-mixture-1-3',
    'rp-absolute-mixture-1-4',
    'rp-absolute-mixture-2-0',
    'rp-absolute-mixture-2-1',
    'rp-absolute-mixture-2-2',
    'rp-absolute-mixture-2-3',
    'rp-absolute-mixture-2-4',
  ],
};
