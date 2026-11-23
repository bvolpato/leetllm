import { assertEqual, dot, draw, group, line, place, to } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function searchSpace(s, c) {
  const [picture, foot] = area.rows([6, 1], 'wide');
  const [treeRegion, countRegion] = picture.columns([3, 1], 'loose');
  const levels = treeRegion.rows(4, 'loose');
  const points = levels.map((region, depth) =>
    region.columns(3 ** depth, 'none').map((cell) => cell.point('center')),
  );
  const nodes = points.map((level) => level.map((p) => dot(7, 'dim').moveTo(p)));
  const edges = points
    .slice(1)
    .flatMap((level, d) =>
      level.map((p, i) => line(points[d][Math.floor(i / 3)], p, { stroke: 'dim', width: 2 })),
    );
  const counts = [1, 3, 9, 27].map((n, d) =>
    place(mono(String(n), { color: d === 3 ? 'yellow' : 'dim' }), countRegion.rows(4, 'loose')[d]),
  );
  const result = place(label('3³ = 27 paths', { color: 'yellow' }), foot, 'left');
  assertEqual(3 ** 3, 27, 'three choices over three positions');
  const logCount = 100 * Math.log10(32000),
    exponent = Math.floor(logCount);
  assertEqual(exponent, 450, 'large vocabulary path-count exponent');
  assertEqual(
    Number((10 ** (logCount - exponent)).toFixed(2)),
    3.27,
    'large vocabulary path-count mantissa',
  );
  const large = place(mono('32,000¹⁰⁰ ≈ 3.27 × 10⁴⁵⁰', { size: 34 }), foot, 'right');
  const traveller = dot(14, 'yellow').moveTo(points[0][0]);
  const highlighted = [0, 1, 5].map((parent, d) =>
    line(points[d][parent], points[d + 1][[1, 5, 16][d]], { stroke: 'cyan', width: 5 }),
  );
  s.add(heading(c.title), edges, nodes, counts.slice(0, 3));
  c.show(
    'search-space-build-0',
    highlighted.map((e) => draw(e, { duration: 0.5 })),
  );
  c.show('search-space-build-1', [counts[3], result], { after: true });
  c.show('search-space-large-vocabulary', large);
  c.show('search-space-build-2', traveller);
  c.on('search-space-build-2', () => {
    for (const [d, i] of [
      [1, 1],
      [2, 5],
      [3, 16],
    ])
      s.play(to(traveller, (n) => n.moveTo(points[d][i]), { duration: 0.6 }));
  });
  c.clear([...edges, ...highlighted], 0.46, 0.2);
}
