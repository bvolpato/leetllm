import { blend } from './arithmetic.mjs';
export function clearSegments(a, z, boxes) {
  const cuts = [];
  for (const box of boxes) {
    let lower = 0,
      upper = 1;
    for (const [axis, min, max] of [
      ['x', box.x, box.x + box.width],
      ['y', box.y, box.y + box.height],
    ]) {
      const delta = z[axis] - a[axis];
      if (Math.abs(delta) < 1e-12) {
        if (a[axis] < min || a[axis] > max) {
          lower = 1;
          upper = 0;
          break;
        }
      } else {
        const p = (min - a[axis]) / delta,
          q = (max - a[axis]) / delta;
        lower = Math.max(lower, Math.min(p, q));
        upper = Math.min(upper, Math.max(p, q));
      }
    }
    if (lower <= upper) cuts.push([lower, upper]);
  }
  cuts.sort((x, y) => x[0] - y[0]);
  let cursor = 0;
  const intervals = [];
  for (const [lower, upper] of cuts) {
    if (lower > cursor) intervals.push([cursor, lower]);
    cursor = Math.max(cursor, upper);
  }
  if (cursor < 1) intervals.push([cursor, 1]);
  return intervals.map((interval) =>
    interval.map((t) => ({
      x: blend(a.x, z.x, t),
      y: blend(a.y, z.y, t),
    })),
  );
}
