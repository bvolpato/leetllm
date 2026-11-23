import { group, polygon, rect } from 'vizmatic/stage';
import { mono } from '../kit-narrated.mjs';

export function edgeGrid(region, values, kind, side) {
  const x0 = region.point('center')[0] - (values[0].length * side) / 2;
  const y0 = region.point('center')[1] - (values.length * side) / 2;
  const center = (r, col) => [x0 + (col + 0.5) * side, y0 + (r + 0.5) * side];
  const frames = [],
    entries = [];
  values.forEach((row, r) =>
    row.forEach((v, col) => {
      const pixel = kind === 'pixels';
      const fill = pixel ? (v === 1 ? '#dce4e7' : v === 0 ? '#172632' : '#77909b') : 'surface';
      frames.push(
        rect(side - 3, side - 3, { fill, stroke: 'grid', width: 1 }).moveTo(center(r, col)),
      );
      const color =
        pixel && v > 0 ? '#111d28' : !pixel && v < 0 ? 'pink' : !pixel && v > 0 ? 'cyan' : 'ink';
      const value = !pixel && v > 0 ? '+' + v : String(v).replace('-', '−');
      entries.push(mono(value, { size: 38, color }).moveTo(center(r, col)));
    }),
  );
  function footprint(r, col) {
    const [cx, cy] = center(r, col);
    const steps = [
      [-0.5, -1.5],
      [0.5, -1.5],
      [0.5, -0.5],
      [1.5, -0.5],
      [1.5, 0.5],
      [0.5, 0.5],
      [0.5, 1.5],
      [-0.5, 1.5],
      [-0.5, 0.5],
      [-1.5, 0.5],
      [-1.5, -0.5],
      [-0.5, -0.5],
    ];
    return polygon(
      steps.map(([dx, dy]) => [cx + dx * side, cy + dy * side]),
      { fill: null, stroke: 'yellow', width: 6 },
    );
  }
  return { frames: group(...frames), entries, footprint, center };
}

export const responseRows = (flat) => [flat.slice(0, 3), flat.slice(3, 6), flat.slice(6, 9)];
