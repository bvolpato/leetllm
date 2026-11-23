import { CLOCK_FREQUENCIES, TAU } from '../fixtures.mjs';
import { absoluteRow } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawAbsoluteWaves(ctx, scene, state, api) {
  return api.focus.target('absolute-waves-construction', () =>
    paintAbsoluteWaves(ctx, scene, state, api),
  );
}
function paintAbsoluteWaves(ctx, scene, state, api) {
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
      directedCue(state, 'rp-absolute-waves-' + beat + '-' + sentence, beat),
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
    const position =
        currentBeat === 0
          ? 0
          : currentBeat === 1
            ? Math.round(2 * cueProgress(1, 0) * 100) / 100
            : 2,
      row = absoluteRow(position);
    drawText(
      'd = 8 · sine stored first · position m = ' + position.toFixed(2),
      960,
      265,
      34,
      themeColors.ink,
    );
    drawFrequencyClocks(CLOCK_FREQUENCIES, position, 470, 105);
    row.forEach((value, i) =>
      drawText(
        currentBeat === 0
          ? resultComplete(0, 3)
            ? value.toFixed(3)
            : '?'
          : currentBeat > 1 || resultComplete(1, 0)
            ? value.toFixed(3)
            : '?',
        195 + i * 220,
        710,
        31,
        colors[Math.floor(i / 2)],
      ),
    );
    if (currentBeat === 1 && cueProgress(1, 2) > 0) {
      const content = [1, 0, 0.5, 0.2, 1, -1, 0, 0.5];
      drawText('Same supplied token x + PE(m)', 960, 805, 32, themeColors.yellow);
      content.forEach((v, i) =>
        drawText(
          resultComplete(1, 2) ? (v + row[i]).toFixed(3) : '?',
          195 + i * 220,
          890,
          31,
          colors[Math.floor(i / 2)],
        ),
      );
    }
    if (currentBeat === 2) {
      drawText('Separate d = 512 wavelength calculation', 960, 790, 31, themeColors.yellow);
      [0, 64, 510].forEach((r, i) =>
        drawText(
          'r ' + r + ' → λ ≈ ' + Math.round(TAU * 10000 ** (r / 512)),
          400 + i * 550,
          885,
          31,
          colors[i],
        ),
      );
    }
    drawNote(
      currentBeat === 2
        ? 'r = first coordinate index; pair index i = r/2.'
        : 'The dials use cosine on x and sine on y; the stored encoding row is sine-first.',
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
  id: 'absolute-waves',
  draw: drawAbsoluteWaves,
  cues: [
    'rp-absolute-waves-0-0',
    'rp-absolute-waves-0-1',
    'rp-absolute-waves-0-2',
    'rp-absolute-waves-0-3',
    'rp-absolute-waves-1-0',
    'rp-absolute-waves-1-1',
    'rp-absolute-waves-1-2',
    'rp-absolute-waves-1-3',
    'rp-absolute-waves-2-0',
    'rp-absolute-waves-2-1',
    'rp-absolute-waves-2-2',
    'rp-absolute-waves-2-3',
  ],
};
