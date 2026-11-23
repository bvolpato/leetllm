import { roundTrip } from '../encoding.mjs';
import { motion, settled } from '../timing.mjs';

const previous = 10;
const peak = roundTrip(500, previous / 448);

export function peakRuler(
  ctx,
  api,
  input,
  decoded,
  scaleMax,
  extent = scaleMax,
  inputText = 'Source  ' + input,
) {
  const { C } = api;
  const x = (v) => 235 + (1430 * v) / peak.original;
  const y = 438;
  api.line(ctx, x(0), y, x(500), y, C.muted, 3);
  for (const tick of [0, 100, 200, 300, 400, 500]) {
    api.line(ctx, x(tick), y - 10, x(tick), y + 12, C.muted, 3);
    api.text(ctx, tick, x(tick), y + 60, 29, C.muted, 'center');
  }
  api.text(ctx, 'Activation units', 160, 252, 34, C.ink);
  api.line(ctx, x(0), y + 103, x(extent), y + 103, C.yellow, 6);
  api.line(ctx, x(extent), y + 87, x(extent), y + 115, C.yellow, 4);
  api.text(ctx, 'Peak used to choose the scale   ' + scaleMax, 235, y + 165, 31, C.yellow);
  api.line(ctx, x(input), y - 83, x(input), y - 20, C.blue, 4);
  api.circle(ctx, x(input), y - 15, 11, C.blue);
  api.text(ctx, inputText, x(input), y - 107, 42, C.blue, 'center');
  if (decoded !== null) {
    api.circle(ctx, x(decoded), y + 14, 11, C.cyan);
    const left = decoded < 250;
    api.text(
      ctx,
      'Operand  ' + decoded,
      x(decoded) + (left ? 28 : -28),
      y - 24,
      38,
      C.cyan,
      left ? 'left' : 'right',
    );
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const bracket = motion(state, 'intro-spike', 0);
  const capped = settled(state, 'intro-cap', 1);
  const read = settled(state, 'intro-read', 2);
  const loss = settled(state, 'intro-loss', 2);
  const left = 235;
  const width = 1430;
  const divisions = peak.original / previous;
  const unitWidth = width / divisions;
  api.focus.target('peak-ruler', () => {
    api.text(ctx, 'Incoming activation', left, 255, 36, C.ink);
    api.text(ctx, peak.original, left - 4, 400, 150, C.blue);
    for (let i = 0; i < divisions; i++) {
      api.rect(ctx, left + i * unitWidth, 438, unitWidth - 3, 70, C.blue, undefined, 0);
    }
    if (bracket > 0) {
      const height = 70 * bracket;
      api.rect(
        ctx,
        left,
        508 - height,
        unitWidth - 3,
        height,
        read ? C.cyan : C.yellow,
        undefined,
        0,
      );
    }
    api.line(ctx, left, 540, left + unitWidth, 540, C.yellow, 5);
    api.line(ctx, left, 526, left, 548, C.yellow, 4);
    api.line(ctx, left + unitWidth, 526 - 14 * bracket, left + unitWidth, 548, C.yellow, 4);
    api.text(ctx, 'Previous peak   ' + previous, left, 604, 36, C.yellow);
    if (loss) {
      const lost = Math.abs(peak.error);
      api.line(ctx, left + unitWidth + 8, 540, left + width, 540, C.pink, 4);
      api.text(
        ctx,
        lost + ' lost   (' + (100 * lost) / peak.original + '%)',
        left + width,
        604,
        40,
        C.pink,
        'right',
      );
    }
  });
  api.focus.target('peak-code', () => {
    const digits = peak.code.toString(2).padStart(8, '0');
    const filled = Math.floor(8 * motion(state, 'intro-cap', 1));
    api.text(ctx, 'One E4M3 byte', left, 743, 36, C.ink);
    for (let i = 0; i < 8; i++) {
      const x = left + 66 * i;
      api.rect(ctx, x, 780, 62, 86, C.panel, i < filled ? C.yellow : C.muted, 4);
      if (i < filled) api.text(ctx, digits[i], x + 31, 841, 45, C.ink, 'center', 'mono');
    }
    if (capped) api.text(ctx, 'Stored value   ' + peak.value, left, 943, 41, C.ink);
    api.text(ctx, 'Reconstruction scale', 895, 743, 36, C.yellow);
    api.text(ctx, previous + ' / 448', 895, 847, 59, C.yellow);
  });
  api.focus.target('peak-product', () => {
    api.text(ctx, 'Multiplier input', 1410, 743, 36, C.ink);
    api.text(ctx, read ? peak.reconstructed : '?', 1410, 847, 72, read ? C.cyan : C.muted);
    if (capped) {
      const equation =
        peak.value + ' × (' + previous + ' / 448) = ' + (read ? peak.reconstructed : '?');
      api.text(ctx, equation, 895, 943, 42, read ? C.cyan : C.ink);
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-spike', 'intro-cap', 'intro-question', 'intro-read', 'intro-loss'],
};
