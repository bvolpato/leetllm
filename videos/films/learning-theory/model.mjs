import { bounds, fixedSampleLosses, triangleFixture } from './fixtures.mjs';
export function searchSnapshot(progress) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new RangeError('search progress must be from 0 through 1');
  const index = Math.min(bounds.length - 1, Math.floor(progress * bounds.length));
  return {
    ...bounds[index],
    index,
    visible: bounds.slice(0, index + 1),
  };
}
export function separatorForMask(mask) {
  if (!Number.isInteger(mask) || mask < 0 || mask > 7)
    throw new RangeError('mask must be an integer from 0 through 7');
  const positive = triangleFixture.filter((_, i) => (mask >> i) & 1);
  const negative = triangleFixture.filter((_, i) => !((mask >> i) & 1));
  if (positive.length === 0)
    return {
      a: 0,
      b: -1,
      threshold: 60,
    };
  if (negative.length === 0)
    return {
      a: 0,
      b: -1,
      threshold: -70,
    };
  const mean = (points) =>
    points.reduce(
      (acc, point) => [acc[0] + point[0] / points.length, acc[1] + point[1] / points.length],
      [0, 0],
    );
  const plus = mean(positive),
    minus = mean(negative);
  const a = plus[0] - minus[0],
    b = plus[1] - minus[1];
  const threshold = (a * (plus[0] + minus[0])) / 2 + (b * (plus[1] + minus[1])) / 2;
  return {
    a,
    b,
    threshold,
  };
}
export function fixedSampleCollection(progress) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new RangeError('Collection progress must be between zero and one');
  const count = Math.min(40, Math.floor(progress * 40 + 1e-9));
  const losses = fixedSampleLosses.slice(0, count);
  return {
    count,
    losses,
    errors: losses.reduce((sum, loss) => sum + loss, 0),
    complete: count === 40,
  };
}
