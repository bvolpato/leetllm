import { CACHE_POSITIONS } from '../fixtures.mjs';
import { directedCue } from '../construction.mjs';
import { cacheFixture } from '../model.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawCachedLayer(ctx, scene, state, api) {
  return api.focus.target('cached-layer-construction', () =>
    paintCachedLayer(ctx, scene, state, api),
  );
}
function paintCachedLayer(ctx, scene, state, api) {
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
      directedCue(state, 'rp-cached-layer-' + beat + '-' + sentence, beat),
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
    const { C, teaching: g } = api,
      b = state.beat ?? 0;
    {
      const model = cacheFixture();
      if (b === 0) {
        drawText('One key actor · logical token 800', 960, 265, 35, C.ink);
        for (let i = 0; i < 3; i++) {
          drawText('slot ' + i, 170, 410 + i * 185, 31, C.muted);
          drawRectangle(305, 345 + i * 185, 690, 130, 'transparent', '#33415a');
        }
        const top = 345 + 370 * cueProgress(0, 2);
        drawRectangle(320, top, 660, 120, C.panel, C.yellow);
        drawText('K800 · already rotated', 650, top + 40, 31, C.yellow);
        drawText(formatVector(model.keys[0]), 650, top + 90, 27, C.yellow);
        drawText('Logical position = 800', 1450, 400, 37, C.yellow);
        drawText('Phase schedule [1, .01]', 1450, 535, 32, C.cyan);
        if (resultComplete(0, 3)) drawText('New query uses logical 802', 1450, 690, 32, C.cyan);
        if (cueProgress(0, 4) > 0)
          drawText('A second R800 would change the stored key', 1450, 850, 28, C.pink);
        drawNote(
          'Storage moves the same key actor; its logical position and existing rotation remain attached.',
        );
      } else {
        const count = b === 1 ? Math.floor(3 * cueProgress(1, 1) + 1e-9) : 3,
          wrong = b > 1 || (b === 1 && cueProgress(1, 3) > 0);
        drawText(
          'Actual fixed CPU fixture · slots 0/1/2 = tokens 800/801/802',
          960,
          265,
          32,
          C.ink,
        );
        model.keys.forEach((row, i) => {
          drawRectangle(130, 355 + i * 175, 690, 135, C.panel, colors[i]);
          drawText(
            'slot ' + i + ' · K' + CACHE_POSITIONS[i] + ' · V=e' + i,
            475,
            400 + i * 175,
            29,
            colors[i],
          );
          drawText(formatVector(row), 475, 455 + i * 175, 26, colors[i]);
        });
        drawOutputRows(model.full, 1120, 340, 'Full causal reference');
        const shown = model.incremental.map((row, i) => (i === 2 && wrong ? model.reset : row));
        drawOutputRows(
          shown,
          1620,
          340,
          wrong ? 'Query reset rejected' : 'Prefix-by-prefix cache',
          wrong && b === 1 && !resultComplete(1, 3) ? 2 : count,
        );
        if (b === 1 && resultComplete(1, 1) && !wrong)
          drawText('All three outputs match', 1390, 785, 32, C.green);
        if (wrong) drawText('Wrong final query phase index: 0', 1410, 790, 30, C.pink);
        if (wrong && b === 1 && !resultComplete(1, 3))
          drawText('Recompute the final row before comparing', 1410, 880, 28, C.muted);
        else
          drawText(
            wrong
              ? 'Last row differs with the wrong query position'
              : 'Current query sees only its own prefix',
            1410,
            880,
            29,
            wrong ? C.pink : C.cyan,
          );
        drawNote(
          'With identity value rows, each output coordinate gives the weight on one key.',
        );
      }
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
  id: 'cached-layer',
  draw: drawCachedLayer,
  cues: [
    'rp-cached-layer-0-0',
    'rp-cached-layer-0-1',
    'rp-cached-layer-0-2',
    'rp-cached-layer-0-3',
    'rp-cached-layer-0-4',
    'rp-cached-layer-1-0',
    'rp-cached-layer-1-1',
    'rp-cached-layer-1-2',
    'rp-cached-layer-1-3',
    'rp-cached-layer-2-0',
    'rp-cached-layer-2-1',
    'rp-cached-layer-2-2',
    'rp-cached-layer-2-3',
  ],
};
