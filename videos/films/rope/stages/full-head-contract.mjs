import { dot, rotateHead, rotatePair } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawFullHeadContract(ctx, scene, state, api) {
  return api.focus.target('full-head-contract-construction', () =>
    paintFullHeadContract(ctx, scene, state, api),
  );
}
function paintFullHeadContract(ctx, scene, state, api) {
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
      directedCue(state, 'rp-full-head-contract-' + beat + '-' + sentence, beat),
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
  const drawStrip = (values, y, inks = values.map(() => themeColors.cyan), names = null) => {
    values.forEach((value, i) => {
      const x = 170 + i * 200;
      drawRectangle(x, y, 170, 70, themeColors.panel, inks[i]);
      drawText(value, x + 85, y + 45, 29, inks[i]);
      if (names) drawText(names[i], x + 85, y - 20, 24, themeColors.muted);
    });
  };
  const formatVector = (values) =>
    '[' + values.map((v) => (Math.abs(v) < 1e-12 ? '0' : v.toFixed(4))).join(', ') + ']';
  {
    const q = [1, 0, 1, 0, 0.5, 1, -0.5, 2],
      k = [1, 0, 1, 0, 1, -1, 0.5, 1],
      f = [1, 0.01],
      rq = rotateHead(q, 5, f),
      rk = rotateHead(k, 2, f),
      pair = [dot(rq.slice(0, 2), rk.slice(0, 2)), dot(rq.slice(2, 4), rk.slice(2, 4))],
      suffix = dot(q.slice(4), k.slice(4)),
      score = dot(rq, rk);
    if (currentBeat === 0) {
      drawText('Supplied head width 8 · rotary prefix 4 · m=5, n=2', 960, 260, 33, themeColors.ink);
      drawStrip(
        q,
        350,
        q.map((_, i) => (i < 4 ? themeColors.cyan : themeColors.muted)),
        q.map((_, i) => (i < 4 ? 'rotary ' + i : 'suffix ' + i)),
      );
      drawStrip(
        k,
        470,
        k.map((_, i) => (i < 4 ? themeColors.yellow : themeColors.muted)),
      );
      if (cueProgress(0, 3) > 0) {
        drawStrip(
          rq.map((v) => v.toFixed(3)),
          635,
          rq.map((_, i) => (i < 4 ? themeColors.cyan : themeColors.muted)),
        );
        drawStrip(
          rk.map((v) => v.toFixed(3)),
          745,
          rk.map((_, i) => (i < 4 ? themeColors.yellow : themeColors.muted)),
        );
      }
      if (resultComplete(0, 4))
        drawText(
          'Full dot = ' +
            pair.map((v) => v.toFixed(4)).join(' + ') +
            ' + suffix ' +
            suffix.toFixed(4) +
            ' = ' +
            score.toFixed(4),
          960,
          940,
          34,
          themeColors.green,
        );
      drawNote(
        'Only the configured prefix rotates. The untouched suffix still contributes to the score.',
      );
    } else {
      drawClock(
        480,
        570,
        195,
        [Math.atan2(0.6, 0.8), 0.9 + Math.atan2(0.6, 0.8)],
        [themeColors.muted, themeColors.cyan],
      );
      drawText('Complex pair z = .8 + .6i', 480, 295, 34, themeColors.cyan);
      const z = rotatePair([0.8, 0.6], 0.9);
      drawText('z × (cos .9 + i sin .9)', 480, 865, 31, themeColors.yellow);
      drawText(formatVector(z), 480, 935, 32, themeColors.green);
      drawText('Full head attention scale', 1410, 350, 36, themeColors.ink);
      drawText(score.toFixed(4) + ' / √8', 1410, 505, 47, themeColors.yellow);
      if (resultComplete(1, 0))
        drawText('= ' + (score / Math.sqrt(8)).toFixed(4), 1410, 650, 49, themeColors.green);
      if (resultComplete(1, 3))
        drawText(
          'Pure rotation preserves norm; amplitude is separate.',
          1410,
          865,
          28,
          themeColors.muted,
        );
      drawNote(
        'A direct pair operation implements the same rotation without materializing a sparse matrix.',
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
  id: 'full-head-contract',
  draw: drawFullHeadContract,
  cues: [
    'rp-full-head-contract-0-0',
    'rp-full-head-contract-0-1',
    'rp-full-head-contract-0-2',
    'rp-full-head-contract-0-3',
    'rp-full-head-contract-0-4',
    'rp-full-head-contract-1-0',
    'rp-full-head-contract-1-1',
    'rp-full-head-contract-1-2',
    'rp-full-head-contract-1-3',
  ],
};
