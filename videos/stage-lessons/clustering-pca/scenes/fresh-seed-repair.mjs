import { assertEqual, column, line, place, to } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLORS, cloud, foot, left, lloyd, ribbon, right, rings, scoreBars } from '../parts.mjs';

export default function scene(s, c) {
  const points = [
    [0, 0],
    [0, 2],
    [8, 0],
    [8, 2],
  ];
  const names = ['R0', 'R1', 'R2', 'R3'];
  const square = points.map(([x, y]) => [x / 4, y]);
  const map = cloud(left, {
    coords: square,
    names,
    x: [-1, 9],
    y: [-1, 3],
    sides: ['under', 'over', 'under', 'over'],
  });
  const starts = [
    [points[0], points[1]],
    [points[0], points[2]],
  ];
  const fits = starts.map((seeds) => lloyd(points, seeds));
  assertEqual(fits.map((fit) => fit.inertia).join(','), '64,4', 'rectangle restart comparison');
  const centers = rings(map, starts[0]);
  const [scores, evidence, centersRegion] = right.rows([3, 1, 1.7], 'normal');
  const comparison = scoreBars(scores, ['Left seeds', 'Bottom seeds'], [0, 0], {
    max: fits[0].inertia,
    showValues: false,
    colors: ['blue', 'cyan'],
  });
  const prompt = place(
    label('New means?   Squared error?', { size: 34, color: 'yellow' }),
    evidence,
  );
  const totals = fits.map((fit, run) => {
    const length = Math.sqrt(fit.inertia / points.length);
    return place(
      mono(`4 × ${length}² = ${fit.inertia}`, { size: 43, color: COLORS[run] }),
      evidence,
    );
  });
  const descriptions = fits.map((fit) =>
    place(
      column(
        fit.centers.map((p, i) => mono(`C${i}  (${p.join(', ')})`, { size: 36, color: COLORS[i] })),
        { gap: 'tight' },
      ),
      centersRegion,
    ),
  );
  const wires = fits.map((fit, run) =>
    points.map((p, i) => {
      const k = fit.labels[i];
      return line(map.p(p), map.p(starts[run][k]), { stroke: COLORS[k], width: 5 }).zIndex(-2);
    }),
  );
  const settledWires = fits.map((fit) =>
    points.map((p, i) =>
      line(map.p(p), map.p(fit.centers[fit.labels[i]]), {
        stroke: COLORS[fit.labels[i]],
        width: 5,
      }).zIndex(-2),
    ),
  );
  const assign = (run) => names.map((id, i) => map.chart.assign(id, 'g' + fits[run].labels[i]));
  const move = (dest) =>
    centers.map((ring, i) => to(ring, (n) => n.moveTo(map.p(dest[i])), { duration: 0.8 }));
  s.add(heading(c.title), map.chart, place(note('Height 2    ·    Two groups'), ribbon));
  c.after('stretch', () =>
    s.play(
      map.chart.move(Object.fromEntries(names.map((id, i) => [id, points[i]])), { duration: 1.0 }),
    ),
  );
  c.show('seeds', centers);
  c.show('assign', wires[0]);
  c.on('assign', () => s.play(...assign(0)));
  c.show('predict', prompt);
  c.hide('mean', wires[0]);
  c.on('mean', () => s.play(...move(fits[0].centers)));
  c.show('mean', [descriptions[0], settledWires[0]], { after: true });
  c.swap('bad', prompt, totals[0], { after: true });
  c.show('bad', comparison, { after: true });
  c.after('bad', () => s.play(comparison.update([fits[0].inertia, 0])));
  const settled = place(note('Same nearest centers on reassignment'), foot);
  c.show('settled', settled, { after: true });
  c.hide('restart', [settledWires[0], settled, descriptions[0], totals[0]]);
  c.on('restart', () =>
    s.play(...move(starts[1]), ...names.map((id) => map.chart.assign(id, 'none'))),
  );
  c.show('newpairs', wires[1]);
  c.on('newpairs', () => s.play(...assign(1)));
  c.hide('bettermean', wires[1]);
  c.on('bettermean', () => s.play(...move(fits[1].centers)));
  c.show('bettermean', [descriptions[1], settledWires[1]], { after: true });
  c.show('good', totals[1], { after: true });
  c.show(
    'good',
    place(
      note(
        `Squared error    ·    Left-edge seeds: ${fits[0].inertia}    ·    Bottom-edge seeds: ${fits[1].inertia}`,
      ),
      foot,
    ),
    { after: true },
  );
  c.after('good', () => s.play(comparison.update(fits.map((fit) => fit.inertia))));
}
