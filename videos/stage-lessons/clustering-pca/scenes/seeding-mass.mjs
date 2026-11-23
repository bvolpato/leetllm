import { assertEqual, column, dot, draw, line, place, rect, tex } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLORS,
  IDS,
  cloud,
  distance,
  foot,
  labels,
  right,
  rings,
  seedMass,
  xy,
} from '../parts.mjs';

export default function scene(s, c) {
  const map = cloud();
  c.take(map.chart);
  const first = seedMass([0]);
  const drawValue = 0.8;
  const selected = first.intervals.findIndex(([lo, hi]) => lo <= drawValue && drawValue < hi);
  assertEqual(IDS[selected], 'F', 'supplied draw lies in the interval for F');
  const next = seedMass([0, selected]);
  assertEqual(
    next.probabilities[4] < first.probabilities[4],
    true,
    'E loses mass after F is selected',
  );
  const [numbers, ticket, status] = right.rows([1.6, 1.15, 1.15], 'normal');
  const [totalRow, bRow, fRow] = numbers.rows(3, 'normal');
  const [axisTitle, band, scale] = ticket.rows([1, 1, 0.7], 'tight');
  const x = (u) => band.left + u * band.width;
  const start = rings(map, [xy[0]], ['cyan'])[0],
    addition = rings(map, [xy[selected]], ['pink'])[0];
  const leg = (i, source, color) =>
    line(map.p(xy[i]), map.p(xy[source]), { stroke: color, width: 4 }).zIndex(-2);
  const firstLegs = IDS.map((_, i) => leg(i, 0, 'cyan'));
  const newLegs = xy.flatMap((p, i) => {
    if (i === 0 || i === selected) return [];
    const closer = distance(p, xy[0]) <= distance(p, xy[selected]) ? 0 : selected;
    return [leg(i, closer, closer === selected ? 'pink' : 'cyan')];
  });
  const strip = (m) =>
    m.intervals.flatMap(([lo, hi], i) => {
      if (hi === lo) return [];
      const width = x(hi) - x(lo);
      const mid = (x(lo) + x(hi)) / 2;
      const segment = rect(width, 42, {
        fill: COLORS[labels[i]],
        stroke: 'surface',
        width: 2,
      }).moveTo([mid, band.cy]);
      return width > 32
        ? [segment, mono(IDS[i], { size: 31, color: 'surface' }).moveTo([mid, band.cy])]
        : [segment];
    });
  const beforeStrip = strip(first),
    afterStrip = strip(next);
  const details = (m, indices) => [
    place(mono(`Σ D² = ${m.total.toFixed(2)}`, { size: 38 }), totalRow, 'left'),
    ...indices.map((i, n) =>
      place(
        mono(
          `${IDS[i]}   ${m.weights[i].toFixed(2)}  →  ${(100 * m.probabilities[i]).toFixed(1)}%`,
          { size: 34, color: COLORS[labels[i]] },
        ),
        [bRow, fRow][n],
        'left',
      ),
    ),
  ];
  const weights = [1, 5].map((i, n) =>
    place(
      mono(`${IDS[i]}   D² = ${first.weights[i].toFixed(2)}`, {
        size: 34,
        color: COLORS[labels[i]],
      }),
      [bRow, fRow][n],
      'left',
    ),
  );
  const before = details(first, [1, 5]),
    after = details(next, [4, 5]);
  const ticks = [0, 1].map((u) =>
    mono(u.toFixed(0), { size: 29, color: 'dim' }).moveTo([x(u), scale.cy]),
  );
  const caption = place(note('Share of the next draw'), axisTitle);
  const mark = line([x(drawValue), band.cy + 23], [x(drawValue), scale.cy - 12], {
    stroke: 'yellow',
    width: 4,
  });
  const cursor = dot(7, 'yellow').moveTo([x(drawValue), band.cy + 23]);
  const probability = place(note('u = 0.8'), status, 'top');
  const ask = place(label('Which interval?', { size: 39, color: 'yellow' }), status);
  const pick = place(label('F gets the next seed', { size: 39, color: 'yellow' }), status);
  const reweight = place(note('D = distance to the nearest selected seed'), foot);
  const stop = place(note('If Σ D² = 0, the next draw is undefined.'), foot);
  const bound = place(
    column(
      [
        label('Expected starting inertia', { size: 36 }),
        tex('\\mathbb{E}[J_{seed}]\\leq 8(\\ln k+2)J^*', { size: 42 }),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  const greedy = place(
    column(
      [
        mono('scikit-learn 1.9.1', { size: 36 }),
        label('Greedy candidate trials', { size: 36 }),
        note('Set n_init to choose the restart count.'),
      ],
      { gap: 'normal' },
    ),
    right,
  );

  s.add(heading(c.title));
  c.show('first', start);
  c.show('small', draw(firstLegs[1]));
  c.show('large', draw(firstLegs[5]));
  c.show('weights', weights);
  c.show('normalize', [beforeStrip, ticks, caption, ...[2, 3, 4].map((i) => draw(firstLegs[i]))]);
  c.swap('normalize', weights, before);
  c.show('draw', [mark, cursor, probability], { after: true });
  c.show('predict', ask);
  c.swap('selected', ask, pick, { after: true });
  c.show('selected', addition, { after: true });
  c.hide('recompute', [pick, probability, cursor, mark]);
  c.swap(
    'recompute',
    [before, beforeStrip, firstLegs.slice(1)],
    [after, afterStrip, newLegs, reweight],
  );
  c.swap('zero', reweight, stop);
  c.hide('bound', [after, afterStrip, ticks, caption, stop]);
  c.show('bound', bound);
  c.swap('greedy', bound, greedy);
  c.keep(map.chart);
}
