import { arrow, arc, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import { area, label, mono } from '../kit-narrated.mjs';
import { PASSAGES, QUERY } from '../../films/embedding-geometry/fixtures.mjs';

export const guides = PASSAGES.map(({ id, vector }, i) => ({
  id,
  vector,
  name: ['Rotation', 'Audit'][i],
  color: ['green', 'pink'][i],
}));
export { QUERY };

const [body, footer] = area.rows([7, 1], 'wide');
const [plotArea, scoreArea] = body.columns([3, 2], 'loose');
export { plotArea, scoreArea, footer };

export function guidePlot(extent = () => 4.6, region = plotArea) {
  const origin = [region.left + 58, region.bottom - 105];
  const scale = () => Math.min((region.width - 170) / extent(), region.height - 175);
  const p = ([x, y]) => [origin[0] + x * scale(), origin[1] - y * scale()];
  const span = ([x, y], [u, v], options) => line(p([x, y]), p([u, v]), options);
  const grid = dynamic(() => {
    const height = (origin[1] - region.top - 65) / scale();
    const step = extent() < 2 ? 0.5 : extent() > 6 ? 2 : 1;
    const marks = [];
    for (let x = step; x <= extent() + 0.0001; x += step) {
      marks.push(span([x, 0], [x, height], { stroke: 'faint', width: 2 }));
      const [cx, cy] = p([x, 0]);
      marks.push(mono(String(x), { color: 'dim', size: 29 }).moveTo([cx, cy + 72]));
    }
    for (let y = step; y <= height; y += step) {
      marks.push(span([0, y], [extent(), y], { stroke: 'faint', width: 2 }));
      const [cx, cy] = p([0, y]);
      marks.push(mono(String(y), { color: 'dim', size: 29 }).moveTo([cx - 38, cy]));
    }
    return group(
      ...marks,
      span([0, 0], [extent(), 0], { stroke: 'dim', width: 3 }),
      span([0, 0], [0, height], { stroke: 'dim', width: 3 }),
      dot(6, 'dim').moveTo(origin),
    );
  });
  const vector = (value, name, color, offset, backed) => {
    const shaft = () => arrow(origin, p(value()), { stroke: color, width: 6, tip: 17, pad: 0 });
    const caption = () => {
      const end = p(value());
      return label(name, { size: 36, color }).moveTo([end[0] + offset[0], end[1] + offset[1]]);
    };
    if (!backed) return dynamic(() => group(shaft(), caption()));
    const foreground = dynamic(() => {
      const letter = caption();
      const { width, height } = letter.bounds();
      const backing = rect(width + 10, height + 10, { fill: 'bg', stroke: null }).moveTo(letter);
      return group(backing, letter);
    }).zIndex(1);
    return [dynamic(shaft), foreground];
  };
  const angle = (value, radius, color, query = () => QUERY) =>
    dynamic(() => {
      const [x, y] = value(),
        [qx, qy] = query();
      const ends = [-Math.atan2(y, x), -Math.atan2(qy, qx)].sort((a, b) => a - b);
      return arc(radius, ends[0], ends[1], { stroke: color, width: 5 }).at(...origin);
    });
  const gap = (value, query = () => QUERY) =>
    dynamic(() => span(query(), value(), { stroke: 'yellow', width: 6, dash: [9, 7] }));
  const drop = (value, color) =>
    dynamic(() => {
      const [x, y] = value();
      return group(
        span([x, y], [x, 0], { stroke: color, width: 3, dash: [8, 7] }),
        dot(8, color).moveTo(p([x, 0])),
      );
    });
  const unitArc = dynamic(() =>
    arc(scale(), -Math.PI / 2, 0, {
      stroke: 'dim',
      width: 3,
    }).at(...origin),
  );
  return { grid, vector, angle, gap, drop, unitArc, point: p };
}

export function guideArrows(
  plot,
  {
    query = () => QUERY,
    vectors = () => guides.map((g) => g.vector),
    queryOffset = [0, 35],
    unitCircle = false,
  } = {},
) {
  const auditOffset = unitCircle ? [36, -54] : [27, -27];
  return [
    plot.vector(query, 'q', 'cyan', queryOffset, unitCircle),
    ...guides.map((g, i) =>
      plot.vector(() => vectors()[i], g.id, g.color, i ? auditOffset : [27, -13], unitCircle),
    ),
  ].flat();
}
