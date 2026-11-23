import { forwardValue } from './arithmetic.mjs';
import { drawPixelTile } from './defaults.mjs';
import { TOP_PIXEL } from './fixtures.mjs';
import { image, imageNoise } from './model.mjs';

export const exposure = (alphaBar) =>
  image.map((clean, i) => forwardValue(clean, imageNoise[i], alphaBar));
export const blend = (from, to, p) => from.map((value, i) => value + p * (to[i] - value));

export function recoverClean(current, epsilon, alphaBar) {
  return (current - Math.sqrt(1 - alphaBar) * epsilon) / Math.sqrt(alphaBar);
}

export function ddimTerms(clean, epsilon, alphaT, alphaS, eta) {
  const sigma = eta * Math.sqrt((1 - alphaS) / (1 - alphaT)) * Math.sqrt(1 - alphaT / alphaS);
  const signal = Math.sqrt(alphaS) * clean;
  const direction = Math.sqrt(1 - alphaS - sigma ** 2) * epsilon;
  return { signal, direction, sigma, center: signal + direction };
}

export function worksheet(alphaT, alphaS) {
  const input = exposure(alphaT);
  const signal = input.map((x, i) => x - Math.sqrt(1 - alphaT) * imageNoise[i]);
  const recovered = input.map((x, i) => recoverClean(x, imageNoise[i], alphaT));
  const terms = recovered.map((x, i) => ddimTerms(x, imageNoise[i], alphaT, alphaS, 0));
  return {
    input,
    signal,
    recovered,
    scaled: terms.map((t) => t.signal),
    destination: terms.map((t) => t.center),
    reference: exposure(alphaS),
  };
}

// Measured phrases drive the delivered film. The beat fallback also gives stills a stable clock.
export function cueProgress(state, id, beat) {
  const cue = state.cues?.[id];
  if (cue) return cue.progress;
  return state.beat === beat ? state.beatP : Number(state.beat > beat);
}

export function afterPhrase(state, id, beat) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : cueProgress(state, id, beat) >= 1;
}

export function decimal(value, digits = 3) {
  const rounded = Number(value.toFixed(digits));
  return rounded.toFixed(digits).replace('-', '−');
}

export function drawExposure(
  ctx,
  api,
  { x, title, subtitle, pixels, selected = TOP_PIXEL, detail, color, reading, target },
) {
  const size = 480;
  return api.focus.target(target, () => {
    api.text(ctx, title, x + size / 2, 235, 39, color, 'center');
    if (subtitle) api.text(ctx, subtitle, x + size / 2, 281, 29, api.C.muted, 'center');
    if (pixels) {
      if (detail) {
        const patch = Array.from(
          { length: 25 },
          (_, i) => pixels[selected + (Math.floor(i / 5) - 2) * 16 + (i % 5) - 2],
        );
        drawPixelTile(ctx, api, x, 312, size, patch, 12);
      } else {
        drawPixelTile(ctx, api, x, 312, size, pixels, selected);
      }
      const ring = target === 'pixel-reference';
      api.circle(ctx, x + 38, 842, 13, ring ? api.C.bg : color, color, ring ? 4 : 2);
      api.text(
        ctx,
        reading ?? `Marked pixel   ${decimal(pixels[selected])}`,
        x + 70,
        854,
        36,
        color,
      );
    } else {
      api.rect(ctx, x, 312, size, size, api.C.bg, api.C.muted, 4);
      api.text(ctx, '?', x + size / 2, 583, 105, api.C.muted, 'center');
    }
  });
}

export function drawRuler(ctx, api, { left = -1, right = 1.25, ticks, reference, current }) {
  const at = (value) => 220 + (1480 * (value - left)) / (right - left);
  const y = 937;
  api.line(ctx, at(left), y, at(right), y, api.C.muted, 3);
  for (const tick of ticks ?? [-1, -0.5, 0, 0.5, 1]) {
    api.line(ctx, at(tick), y - 8, at(tick), y + 13, api.C.muted, 3);
    api.text(ctx, String(tick).replace('-', '−'), at(tick), y + 60, 29, api.C.muted, 'center');
  }
  if (reference !== undefined) api.circle(ctx, at(reference), y, 18, api.C.bg, api.C.cyan, 5);
  if (current !== undefined) api.circle(ctx, at(current), y, 10, api.C.yellow, api.C.bg, 2);
  api.text(ctx, 'Normalized pixel brightness', 960, 1046, 29, api.C.muted, 'center');
}

export function drawPair(ctx, api, { left, right, selected = TOP_PIXEL, notes, ruler }) {
  drawExposure(ctx, api, {
    ...left,
    selected,
    x: 177,
    color: api.C.cyan,
    target: 'pixel-reference',
  });
  drawExposure(ctx, api, {
    ...right,
    selected,
    x: 1263,
    color: api.C.yellow,
    target: 'pixel-working',
  });
  api.focus.target('pixel-method', () => {
    for (const [i, note] of notes.entries()) {
      api.text(
        ctx,
        note,
        960,
        427 + i * 72,
        i === 0 ? 31 : 37,
        i === 0 ? api.C.muted : api.C.ink,
        'center',
      );
    }
  });
  api.focus.target('pixel-brightness', () =>
    drawRuler(ctx, api, {
      ...ruler,
      reference: left.pixels?.[selected],
      current: right.pixels?.[selected],
    }),
  );
}
