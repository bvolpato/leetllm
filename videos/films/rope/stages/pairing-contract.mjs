import { dot, rotateHead } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { pairingTrace } from '../model.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawPairingContract(ctx, scene, state, api) {
  return api.focus.target('pairing-contract-construction', () =>
    paintPairingContract(ctx, scene, state, api),
  );
}
function paintPairingContract(ctx, scene, state, api) {
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
      directedCue(state, 'rp-pairing-contract-' + beat + '-' + sentence, beat),
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
  {
    const model = pairingTrace(),
      wrong = currentBeat === 1 && cueProgress(1, 1) > 0 && !resultComplete(1, 2),
      converted = currentBeat > 1 || (currentBeat === 1 && resultComplete(1, 2)),
      layout = wrong || converted ? 'split' : 'adjacent',
      q = converted ? model.permutation.map((i) => model.q[i]) : model.q,
      k = converted ? model.permutation.map((i) => model.k[i]) : model.k,
      pairs =
        layout === 'adjacent'
          ? [
              [0, 1],
              [2, 3],
            ]
          : [
              [0, 2],
              [1, 3],
            ],
      score = dot(rotateHead(q, 5, [1, 0.01], layout), rotateHead(k, 2, [1, 0.01], layout));
    drawText('Q at 5 · K at 2 · frequencies [1,.01]', 960, 260, 32, themeColors.muted);
    const xs = [420, 780, 1140, 1500];
    [q, k].forEach((row, j) =>
      row.forEach((v, i) => {
        drawRectangle(
          xs[i] - 100,
          360 + j * 230,
          200,
          85,
          themeColors.panel,
          j ? themeColors.yellow : themeColors.cyan,
        );
        drawText(v, xs[i], 415 + j * 230, 39, j ? themeColors.yellow : themeColors.cyan);
        drawText(
          (converted ? ['x₀', 'x₁', 'y₀', 'y₁'] : ['x₀', 'y₀', 'x₁', 'y₁'])[i],
          xs[i],
          325 + j * 230,
          28,
          themeColors.muted,
        );
      }),
    );
    pairs.forEach(([a, z], i) => {
      const y = 495 + i * 35;
      queueSegment(xs[a], 455, xs[a], y, colors[i], 4);
      queueSegment(xs[a], y, xs[z], y, colors[i], 4);
      queueSegment(xs[z], y, xs[z], 455, colors[i], 4);
    });
    drawText(
      layout === 'adjacent'
        ? 'Adjacent coordinates'
        : 'Split-half coordinates' + (converted ? ' · converted' : ' · unconverted'),
      960,
      795,
      36,
      wrong ? themeColors.pink : themeColors.cyan,
    );
    if (currentBeat > 0)
      drawText(
        'dot = ' +
          (wrong
            ? resultComplete(1, 1)
              ? score.toFixed(6)
              : '?'
            : converted
              ? score.toFixed(6)
              : resultComplete(1, 0)
                ? score.toFixed(6)
                : '?'),
        960,
        890,
        47,
        wrong ? themeColors.pink : themeColors.green,
      );
    if (currentBeat > 0) drawText('Both norms remain √30', 960, 960, 28, themeColors.muted);
    drawNote(
      currentBeat === 2
        ? 'Convert affected Q/K projection outputs and biases inside the rotary prefix, then compare outputs.'
        : 'The same numeric coordinates can be paired differently even when their norms stay fixed.',
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
  id: 'pairing-contract',
  draw: drawPairingContract,
  cues: [
    'rp-pairing-contract-0-0',
    'rp-pairing-contract-0-1',
    'rp-pairing-contract-0-2',
    'rp-pairing-contract-0-3',
    'rp-pairing-contract-1-0',
    'rp-pairing-contract-1-1',
    'rp-pairing-contract-1-2',
    'rp-pairing-contract-1-3',
    'rp-pairing-contract-2-0',
    'rp-pairing-contract-2-1',
    'rp-pairing-contract-2-2',
    'rp-pairing-contract-2-3',
  ],
};
