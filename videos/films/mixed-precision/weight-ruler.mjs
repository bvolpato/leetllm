import { fp16 } from './arithmetic.mjs';

export const one = 1;
export const below = one - 2 ** -11;
export const above = one + 2 ** -10;
export const decrement = 0.0001;

export function weightAfter(weight, delta, store) {
  return store(weight + store(delta));
}

export function weightHistory(count) {
  const rows = [{ master: one, copy: one, direct: one }];
  for (let i = 1; i <= count; i++) {
    const previous = rows[i - 1];
    const master = weightAfter(previous.master, -decrement, Math.fround);
    rows.push({
      master,
      copy: fp16(master),
      direct: weightAfter(previous.direct, -decrement, fp16),
    });
  }
  return rows;
}

const xAt = (weight) => 830 + (weight - one) * 860000;

export function drawWeightLane(
  ctx,
  api,
  { label, y, half, color, delta, requested, landing, midpoints = false },
) {
  const { C } = api;
  const destination = weightAfter(one, delta, half ? fp16 : Math.fround);
  api.text(ctx, label, 110, y + 12, 39, color);
  api.line(ctx, 340, y, 1760, y, half ? C.muted : color, half ? 3 : 7);
  const ticks = half ? [below, one, above] : [one];
  for (const tick of ticks) {
    const x = xAt(tick);
    api.line(ctx, x, y - 18, x, y + 18, color, 4);
    api.text(ctx, tick === one ? '1' : tick.toFixed(8), x, y + 64, 32, C.ink, 'center');
  }
  if (midpoints) {
    for (const neighbor of [below, above]) {
      const x = xAt((neighbor + one) / 2);
      api.line(ctx, x, y - 14, x, y + 14, C.pink, 4);
    }
  }
  const target = xAt(one + delta * requested);
  if (requested > 0) {
    api.line(ctx, xAt(one), y - 83, target, y - 83, C.yellow, 4);
    api.line(ctx, target, y - 93, target, y - 70, C.yellow, 4);
  }
  // The traveling dot traces the cast. Only its landing is a stored value.
  const x = target + (xAt(destination) - target) * landing;
  const markerY = y - 64 + 64 * landing;
  api.circle(ctx, x, markerY, 12, landing === 1 ? color : C.yellow);
  return { destination, storedX: xAt(destination) };
}
