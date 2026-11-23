import { assertEqual, dot, dynamic, group, line } from 'vizmatic/stage';
import { label, mono, note } from '../kit-narrated.mjs';
import { DROP_FIXTURE, LEFT } from './parts.mjs';

const names = ['query', 'rotation', 'access', 'merge'];
export const clauses = DROP_FIXTURE.map(({ point }, i) => ({
  name: names[i],
  coordinates: point,
  color: ['cyan', 'green', 'pink', 'blue'][i],
}));

export function distanceFromQuery(clause, depth) {
  const [x, y, z] = clause.coordinates;
  return Math.hypot(x, y, z * depth);
}

// The opening and the replay use the same oblique view. The rail in the replay
// measures Euclidean distance in the represented space, independent of the camera.
export function policyWindow(s) {
  const depth = s.value(0);
  const origin = [LEFT.left + LEFT.width * 0.17, LEFT.bottom - 110];
  const unit = LEFT.height * 0.23;
  const pointAt = ([x, y, z]) => [
    origin[0] + x * unit + z * unit * 0.46,
    origin[1] - y * unit - z * unit * 0.32,
  ];
  const at = (word, p, dx, dy, color, size = 37) =>
    label(word, { color, size }).moveTo([p[0] + dx, p[1] + dy]);
  const axes = [
    line(pointAt([-0.45, 0, 0]), pointAt([3.9, 0, 0]), { stroke: 'dim', width: 3 }),
    line(pointAt([0, -0.42, 0]), pointAt([0, 2.8, 0]), { stroke: 'dim', width: 3 }),
    at('x', pointAt([3.9, 0, 0]), 30, 0, 'dim'),
    at('y', pointAt([0, 2.8, 0]), 0, -26, 'dim'),
    ...[1, 2, 3].map((x) =>
      line(pointAt([x, -0.04, 0]), pointAt([x, 0.04, 0]), { stroke: 'dim', width: 3 }),
    ),
    ...[1, 2].map((y) =>
      line(pointAt([-0.04, y, 0]), pointAt([0.04, y, 0]), { stroke: 'dim', width: 3 }),
    ),
  ];
  const depthAxis = [
    line(origin, pointAt([0, 0, 8.5]), { stroke: 'dim', width: 3, dash: [12, 10] }),
    at('z', pointAt([0, 0, 8.5]), 64, 26, 'dim'),
    ...[2, 4, 6, 8].map((z) => {
      const [x, y] = pointAt([0, 0, z]);
      return group(
        line([x - 5, y - 7], [x + 5, y + 7], { stroke: 'dim', width: 3 }),
        mono(String(z), { size: 30, color: 'dim' }).moveTo([x + 8, y + 47]),
      );
    }),
  ];
  const offsets = [
    [-61, 45],
    [72, 44],
    [85, 0],
    [64, -116],
  ];
  const marks = clauses.map(({ coordinates: [x, y, z], name, color }, i) =>
    dynamic(() => {
      const p = pointAt([x, y, z * depth.value]);
      const marker =
        i === 3
          ? group(dot(24, color), dot(15, 'bg'), dot(10, depth.value === 0 ? 'cyan' : color))
          : dot(i === 0 ? 10 : 15, color);
      const leader =
        i === 3
          ? [line([p[0] + 10, p[1] - 24], [p[0] + 42, p[1] - 88], { stroke: color, width: 2 })]
          : [];
      return group(...leader, marker.moveTo(p), at(name, p, ...offsets[i], color));
    }),
  );
  const nearest = (d) =>
    clauses.slice(1).reduce((a, b) => (distanceFromQuery(a, d) < distanceFromQuery(b, d) ? a : b));
  assertEqual(nearest(0).name, 'merge', 'nearest clause in the inspection map');
  assertEqual(nearest(1).name, 'rotation', 'nearest clause in the full fixture');
  const scale = note('One tick = one coordinate unit').moveTo([LEFT.cx, LEFT.bottom - 12]);
  return { depth, axes, depthAxis, marks, scale };
}
