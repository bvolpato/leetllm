import { alibiSlopes, softmax } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawAlibiSpectrum(ctx, scene, state, api) {
  return api.focus.target('alibi-spectrum-construction', () =>
    paintAlibiSpectrum(ctx, scene, state, api),
  );
}
function paintAlibiSpectrum(ctx, scene, state, api) {
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
      directedCue(state, 'rp-alibi-spectrum-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink];
  const drawRectangle = (x, y, w, h, color = themeColors.panel, stroke = themeColors.muted) =>
    api.rect(ctx, x, y, w, h, color, stroke, 5);
  const drawStrip = (values, y, inks = values.map(() => themeColors.cyan), names = null) => {
    values.forEach((value, i) => {
      const x = 170 + i * 200;
      drawRectangle(x, y, 170, 70, themeColors.panel, inks[i]);
      drawText(value, x + 85, y + 45, 29, inks[i]);
      if (names) drawText(names[i], x + 85, y - 20, 24, themeColors.muted);
    });
  };
  {
    if (currentBeat === 0) {
      const slopes = alibiSlopes(8);
      drawText('Eight heads · mₕ = 2^(−8h/8)', 960, 270, 35, themeColors.ink);
      slopes.forEach((s, i) => {
        const x = 180 + i * 225;
        drawText('head ' + (i + 1), x, 375, 28, colors[i % 4]);
        drawText('1/' + 2 ** (i + 1), x, 455, 31, colors[i % 4]);
        if (resultComplete(0, 1)) {
          const height = (250 * s) / 0.5;
          drawRectangle(x - 60, 930 - height, 120, height, colors[i % 4], undefined);
        }
        drawText('bias at Δ16', x, 530, 23, themeColors.muted);
        if (resultComplete(0, 1)) drawText((-16 * s).toFixed(4), x, 590, 25, colors[i % 4]);
      });
    } else if (currentBeat === 1) {
      drawText('H = 3: begin with two-head schedule', 960, 270, 35, themeColors.ink);
      drawStrip(['1/16', '1/256'], 380, [themeColors.cyan, themeColors.blue]);
      if (cueProgress(1, 1) > 0) {
        drawText('Doubled four-head source · take indices 0,2', 960, 570, 31, themeColors.yellow);
        drawStrip(['1/4', '1/16', '1/64', '1/256'], 650, [
          themeColors.green,
          themeColors.muted,
          themeColors.yellow,
          themeColors.muted,
        ]);
      }
      if (resultComplete(1, 2))
        drawText('Final order: [1/16, 1/256, 1/4]', 1150, 925, 37, themeColors.green);
    } else {
      const penalty = -10 * 0.5;
      drawText('10 positions back × slope ½ = 5 points off the older key', 960, 260, 39);
      const odds = resultComplete(2, 0) ? ' ≈ ' + Math.exp(penalty).toFixed(4) : '';
      drawText('Older / self = exp(−5)' + odds, 960, 368, 47, themeColors.yellow);
      const distributions = [[penalty, 0]];
      if (cueProgress(2, 2) > 0) distributions.push([penalty, 0, 0]);
      distributions.forEach((logits, row) => {
        const y = 508 + row * 237;
        drawText(logits.length + ' visible keys', 398, y + 54, 37, themeColors.ink, 'right');
        const inks = [themeColors.pink, themeColors.cyan, themeColors.blue];
        const names = ['Older', 'Self', 'New key'];
        let left = 470;
        softmax(logits).forEach((weight, i) => {
          const width = 1280 * weight;
          api.rect(ctx, left, y, width, 79, inks[i], undefined, 0);
          left += width;
          drawText(
            names[i] + '  ' + (100 * weight).toFixed(2) + '%',
            625 + i * 455,
            y + 149,
            37,
            inks[i],
          );
        });
      });
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
  id: 'alibi-spectrum',
  draw: drawAlibiSpectrum,
  cues: [
    'rp-alibi-spectrum-0-0',
    'rp-alibi-spectrum-0-1',
    'rp-alibi-spectrum-0-2',
    'rp-alibi-spectrum-1-0',
    'rp-alibi-spectrum-1-1',
    'rp-alibi-spectrum-1-2',
    'rp-alibi-spectrum-1-3',
    'rp-alibi-spectrum-2-0',
    'rp-alibi-spectrum-2-1',
    'rp-alibi-spectrum-2-2',
    'rp-alibi-spectrum-2-3',
  ],
};
