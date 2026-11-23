import { toBfloat16 } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawPositionPrecision(ctx, scene, state, api) {
  return api.focus.target('position-precision-construction', () =>
    paintPositionPrecision(ctx, scene, state, api),
  );
}
function paintPositionPrecision(ctx, scene, state, api) {
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
      directedCue(state, 'rp-position-precision-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
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
    const { C, teaching: g } = api,
      b = state.beat ?? 0;
    {
      const original = [4096, 4097],
        bad = b === 0 && cueProgress(0, 1) > 0,
        positions = bad ? original.map(toBfloat16) : original;
      drawText('Requested integer IDs remain attached to the two rows', 960, 265, 34, C.ink);
      original.forEach((id, i) => {
        const x = 500 + i * 920;
        drawText('Requested ' + id, x, 360, 37, colors[i]);
        drawClock(x, 590, 165, [positions[i]], [bad ? C.pink : colors[i]]);
        drawText('Phase input ' + positions[i], x, 830, 34, bad ? C.pink : colors[i]);
        if (b > 0 || resultComplete(0, 3))
          drawText(
            'cos ≈ ' + Math.cos(positions[i]).toFixed(6),
            x,
            925,
            36,
            bad ? C.pink : C.green,
          );
      });
      drawNote(
        b === 0
          ? 'Casting the IDs to bfloat16 gives both rows the same angle.'
          : 'Integer IDs → float32 phases → two distinct angles',
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
  id: 'position-precision',
  draw: drawPositionPrecision,
  cues: [
    'rp-position-precision-0-0',
    'rp-position-precision-0-1',
    'rp-position-precision-0-2',
    'rp-position-precision-0-3',
    'rp-position-precision-0-4',
    'rp-position-precision-1-0',
    'rp-position-precision-1-1',
    'rp-position-precision-1-2',
    'rp-position-precision-1-3',
  ],
};
