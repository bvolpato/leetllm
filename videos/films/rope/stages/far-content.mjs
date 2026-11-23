import { softmax } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawFarContent(ctx, scene, state, api) {
  return api.focus.target('far-content-construction', () =>
    paintFarContent(ctx, scene, state, api),
  );
}
function paintFarContent(ctx, scene, state, api) {
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
      directedCue(state, 'rp-far-content-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
  const drawRectangle = (x, y, w, h, color = themeColors.panel, stroke = themeColors.muted) =>
    api.rect(ctx, x, y, w, h, color, stroke, 5);
  {
    const advantage = currentBeat === 0 ? Math.round(65 * cueProgress(0, 2) * 1000) / 1000 : 65,
      penalty = 64,
      far = advantage - penalty,
      weights = softmax([far, 0, -Infinity]);
    drawText(
      'Supplied two permitted keys · Δ = 16,384 · slope 1/256',
      960,
      265,
      32,
      themeColors.muted,
    );
    drawText('Far key content ' + advantage.toFixed(3), 500, 375, 36, themeColors.cyan);
    drawText('Distance penalty −64', 500, 475, 36, themeColors.pink);
    drawText('Current far logit = ' + far.toFixed(3), 500, 595, 40, themeColors.yellow);
    drawText('Self key logit = 0', 1460, 375, 36, themeColors.cyan);
    drawText('Future key: −∞ → mass 0', 1460, 510, 34, themeColors.pink);
    if (currentBeat > 0 || resultComplete(0, 1))
      drawText(
        'Equal-content odds exp(−64) ≈ ' + Math.exp(-64).toExponential(3),
        1460,
        625,
        29,
        themeColors.muted,
      );
    const width = 1500;
    drawRectangle(210, 760, width, 75, themeColors.panel, themeColors.muted);
    if (weights[0] > 0)
      api.rect(ctx, 210, 760, width * weights[0], 75, themeColors.yellow, undefined, 0);
    if (weights[1] > 0)
      api.rect(
        ctx,
        210 + width * weights[0],
        760,
        width * weights[1],
        75,
        themeColors.cyan,
        undefined,
        0,
      );
    drawText('far ' + weights[0].toExponential(4), 500, 915, 31, themeColors.yellow);
    drawText('self ' + weights[1].toFixed(6), 1450, 915, 31, themeColors.cyan);
    if (currentBeat === 1 && resultComplete(1, 3))
      drawText(
        'Reported 1.3B comparison: train 1024 → evaluate 2048 · ≈11% in that setup',
        960,
        985,
        25,
        themeColors.muted,
      );
    drawNote(
      currentBeat === 0 && !resultComplete(0, 2)
        ? 'Compare the far key and the self-key after the distance penalty.'
        : currentBeat === 0
        ? 'A 65-point content advantage can cover a 64-point distance penalty.'
        : 'This head gives the distant key more weight than the self-key.',
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
  id: 'far-content',
  draw: drawFarContent,
  cues: [
    'rp-far-content-0-0',
    'rp-far-content-0-1',
    'rp-far-content-0-2',
    'rp-far-content-0-3',
    'rp-far-content-1-0',
    'rp-far-content-1-1',
    'rp-far-content-1-2',
    'rp-far-content-1-3',
  ],
};
