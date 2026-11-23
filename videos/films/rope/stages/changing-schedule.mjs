import { CACHE_K, CACHE_POSITIONS } from '../fixtures.mjs';
import { dot, rotateHead, softmax } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { cacheFixture } from '../model.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawChangingSchedule(ctx, scene, state, api) {
  return api.focus.target('changing-schedule-construction', () =>
    paintChangingSchedule(ctx, scene, state, api),
  );
}
function paintChangingSchedule(ctx, scene, state, api) {
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
      directedCue(state, 'rp-changing-schedule-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
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
      const model = cacheFixture(),
        progress = b === 0 ? cueProgress(0, 2) : 1,
        phaseF =
          progress < 0.5
            ? [1 * (1 - 2 * progress), 0.01 * (1 - 2 * progress)]
            : [2 * progress - 1, 0.005 * (2 * progress - 1)],
        currentKeys = CACHE_K.map((k, i) => rotateHead(k, CACHE_POSITIONS[i], phaseF)),
        weights = softmax(currentKeys.map((k) => dot(model.newQuery, k) / 2));
      if (b === 0) {
        drawText('Query uses [1,.005] · stored keys begin under [1,.01]', 960, 265, 32, C.ink);
        drawText(
          progress === 0
            ? 'Mixed schedules'
            : progress < 0.5
              ? 'Inverse old rotation'
              : progress < 1
                ? 'Apply the new rotation'
                : 'Keys use the new schedule',
          960,
          355,
          35,
          progress === 1 ? C.green : C.yellow,
        );
        currentKeys.forEach((row, i) => {
          drawText('K' + CACHE_POSITIONS[i], 180, 490 + i * 130, 31, colors[i]);
          drawText(formatVector(row), 680, 490 + i * 130, 30, colors[i]);
        });
        drawText('New full-pass target', 1480, 435, 32, C.green);
        drawText(formatVector(model.repaired), 1480, 535, 29, C.green);
        drawText('Current fixed-layer output', 1480, 700, 32, C.cyan);
        drawText(
          resultComplete(0, 1) ? formatVector(weights) : '[ ?, ?, ? ]',
          1480,
          800,
          29,
          C.cyan,
        );
        if (resultComplete(0, 4))
          drawText('Re-rotated fixed keys match the new full pass', 960, 950, 31, C.green);
        drawNote(
          'The first half undoes the actual old rotation; the second applies the actual new rotation at the same IDs.',
        );
      } else {
        drawText(
          'Illustrative later-layer dependency · Knext = first two output coordinates',
          960,
          265,
          31,
          C.ink,
        );
        const old = model.full[2].slice(0, 2),
          next = model.repaired.slice(0, 2),
          delta = Math.hypot(...old.map((v, i) => v - next[i]));
        drawOutputRows([model.full[2]], 510, 390, 'Earlier attention: old schedule');
        drawOutputRows([model.repaired], 1450, 390, 'Earlier attention: new schedule');
        drawText('Old Knext ' + formatVector(old), 510, 690, 32, C.yellow);
        drawText('Required Knext ' + formatVector(next), 1450, 690, 32, C.green);
        drawText('Feature difference norm = ' + delta.toExponential(5), 960, 855, 34, C.pink);
        drawNote(
          'A fresh prefix pass recomputes the features used by every later layer.',
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
  id: 'changing-schedule',
  draw: drawChangingSchedule,
  cues: [
    'rp-changing-schedule-0-0',
    'rp-changing-schedule-0-1',
    'rp-changing-schedule-0-2',
    'rp-changing-schedule-0-3',
    'rp-changing-schedule-0-4',
    'rp-changing-schedule-1-0',
    'rp-changing-schedule-1-1',
    'rp-changing-schedule-1-2',
    'rp-changing-schedule-1-3',
    'rp-changing-schedule-1-4',
  ],
};
