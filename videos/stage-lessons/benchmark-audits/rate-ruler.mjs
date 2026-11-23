import { dot, line } from 'vizmatic/stage';

// All marks share a zero-to-one scale, including the predeclared floor.
export function rateRuler(region, { low, high }, observed, floor) {
  const left = region.point('left'),
    right = region.point('right');
  const at = (rate, dy = 0) => [left[0] + rate * (right[0] - left[0]), left[1] + dy];
  const stroke = (a, b, color, width) => line(a, b, { stroke: color, width });
  return {
    axis: stroke(at(0), at(1), 'dim', 3),
    floor: stroke(at(floor, -30), at(floor, 30), 'yellow', 5),
    observed: dot(11, 'blue').moveTo(at(observed, -16)),
    interval: [
      stroke(at(low), at(high), 'cyan', 10),
      stroke(at(low, -14), at(low, 14), 'cyan', 5),
      stroke(at(high, -14), at(high, 14), 'cyan', 5),
    ],
    low: dot(13, 'cyan').moveTo(at(low)),
    at,
  };
}
