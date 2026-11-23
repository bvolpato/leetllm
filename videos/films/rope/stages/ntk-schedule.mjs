import { frequencySchedules } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawNtkSchedule(ctx, scene, state, api) {
  return api.focus.target('ntk-schedule-construction', () =>
    paintNtkSchedule(ctx, scene, state, api),
  );
}
function paintNtkSchedule(ctx, scene, state, api) {
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
      directedCue(state, 'rp-ntk-schedule-' + beat + '-' + sentence, beat),
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
  const drawFrequencyClocks = (frequencies, position, y = 505, r = 115) => {
    frequencies.forEach((frequency, i) => {
      const x = 300 + i * 440;
      drawClock(x, y, r, [position * frequency], [colors[i]]);
      drawText('pair ' + i, x, y - r - 35, 28, colors[i]);
      drawText('θ = ' + frequency.toPrecision(4), x, y + r + 65, 28, colors[i]);
    });
  };
  {
    const { C, teaching: g } = api,
      b = state.beat ?? 0;
    {
      const scale = b === 0 ? 4 : b === 1 ? 1 + 3 * cueProgress(1, 2) : 4,
        model = frequencySchedules(scale),
        frequencies = b === 0 ? model.pi : model.ntk;
      drawText('Same d = 8 clocks · supplied phase probe m = 16', 960, 265, 33, C.ink);
      drawFrequencyClocks(frequencies, 16, 490, 105);
      drawText(
        b === 0 ? 'Uniform PI · all ratios 0.25' : 'NTK scale ' + scale.toFixed(3),
        960,
        780,
        35,
        C.yellow,
      );
      if (b === 1) drawText('New base = base × s^(d/(d−2))', 960, 865, 39, C.ink);
      if (b > 0 && resultComplete(1, 2))
        drawText('θ′ᵢ / θᵢ = s^(−2i/(d−2))', 960, b === 1 ? 945 : 865, 37, C.cyan);
      if (b === 2) {
        drawText(
          'Ratios [' +
            frequencies.map((f, i) => (f / model.original[i]).toFixed(4)).join(', ') +
            ']',
          960,
          915,
          33,
          C.green,
        );
        if (resultComplete(2, 3))
          drawText(
            'Separate d = 128 worksheet: new base ≈ ' + Math.round(10000 * 4 ** (128 / 126)),
            960,
            975,
            27,
            C.muted,
          );
      }
      if (b === 0 && resultComplete(0, 1)) drawText('16383 / 4 = 4095.75', 960, 915, 38, C.green);
      drawNote(
        b === 2 && resultComplete(2, 4)
          ? 'Code Llama chose a base of 1,000,000 during long-context fine-tuning'
          : 'Four rotary pairs · eight coordinates',
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
  id: 'ntk-schedule',
  draw: drawNtkSchedule,
  cues: [
    'rp-ntk-schedule-0-0',
    'rp-ntk-schedule-0-1',
    'rp-ntk-schedule-0-2',
    'rp-ntk-schedule-0-3',
    'rp-ntk-schedule-1-0',
    'rp-ntk-schedule-1-1',
    'rp-ntk-schedule-1-2',
    'rp-ntk-schedule-1-3',
    'rp-ntk-schedule-2-0',
    'rp-ntk-schedule-2-1',
    'rp-ntk-schedule-2-2',
    'rp-ntk-schedule-2-3',
    'rp-ntk-schedule-2-4',
    'rp-ntk-schedule-2-5',
  ],
};
