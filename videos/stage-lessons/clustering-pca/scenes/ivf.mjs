import { assertEqual, circle, dot, draw, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLORS,
  IDS,
  centroids,
  cloud,
  coarseDistances,
  distance,
  foot,
  labels,
  left,
  query,
  ribbon,
  right,
  rings,
  xy,
} from '../parts.mjs';

export default function scene(s, c) {
  const map = cloud(left, { assigned: true });
  const centers = rings(map, centroids);
  const cells = map.chart.cells(centroids);
  const q = map.p(query);
  const point = dot(13, 'yellow').moveTo(q);
  const qName = label('Q', { size: 33, color: 'yellow' }).moveTo([q[0] - 18, q[1] + 38]);
  const lists = centroids.map((_, k) => xy.map((__, i) => i).filter((i) => labels[i] === k));
  const order = coarseDistances
    .map((_, k) => k)
    .sort((a, b) => coarseDistances[a] - coarseDistances[b]);
  const distances = xy.map((p) => distance(query, p));
  const search = (nprobe) => {
    const candidates = order.slice(0, nprobe).flatMap((k) => lists[k]);
    const best = candidates.reduce((a, b) => (distances[a] <= distances[b] ? a : b));
    return { id: IDS[best], point: xy[best], scans: candidates.length };
  };
  const one = search(1),
    two = search(2);
  assertEqual(one.id + two.id, 'CB', 'one probe misses B and two probes recover B');
  const rows = right.rows([1, 1, 1, 0.9], 'normal');
  const records = lists.map((members, k) => {
    const [center, docs] = rows[k].rows(2, 'tight');
    const [name, coarseValue] = center.columns([1.65, 1], 'tight');
    const heading = place(
      label(['Left center', 'Upper center', 'Right center'][k], { size: 33, color: COLORS[k] }),
      name,
      'left',
    );
    const value = place(
      mono(coarseDistances[k].toFixed(3), { size: 32, color: COLORS[k] }),
      coarseValue,
      'right',
    );
    const memberNames = place(
      mono(members.map((i) => IDS[i]).join('     '), { size: 35, color: 'dim' }),
      docs,
      'left',
    );
    const measured = place(
      mono(members.map((i) => IDS[i] + ' ' + distances[i].toFixed(3)).join('   '), {
        size: 33,
      }),
      docs,
      'left',
    );
    return {
      heading,
      value,
      memberNames,
      measured,
      radius: line(q, map.p(centroids[k]), { stroke: COLORS[k], width: 3 }).zIndex(-2),
      legs: members.map((i) => line(q, map.p(xy[i]), { stroke: COLORS[k], width: 4 }).zIndex(-2)),
    };
  });
  const prompt = place(label('Can this list return B?', { size: 38, color: 'yellow' }), rows[3]);
  const reset = place(
    label(one.id + '   Missing reset link', { size: 37, color: 'pink' }),
    rows[3],
  );
  const billing = place(
    label(two.id + '   Duplicate payment', { size: 37, color: 'yellow' }),
    rows[3],
  );
  const answerRing = (p) => circle(21, { stroke: 'yellow', width: 5 }).moveTo(map.p(p));
  const firstWinner = answerRing(one.point),
    repaired = answerRing(two.point);
  const oneWork = place(
    note(
      `1 list    ·    ${centroids.length} center distances + ${one.scans} document distances = ${centroids.length + one.scans}`,
    ),
    foot,
  );
  const twoWork = place(
    note(
      `2 lists    ·    ${centroids.length} center distances + ${two.scans} document distances = ${centroids.length + two.scans}`,
    ),
    foot,
  );
  const comparison = place(
    note(
      `Two probes: ${centroids.length + two.scans} distances    ·    Flat search: ${xy.length} distances    ·    Both returned B`,
    ),
    foot,
  );
  s.add(heading(c.title), map.chart);
  c.show('query', [
    point,
    qName,
    place(
      note('Duplicate charge    ·    Original coordinates    ·    Full search returned B'),
      ribbon,
    ),
  ]);
  c.show('route', [centers, ...records.flatMap((r) => [r.heading, r.memberNames])]);
  c.show(
    'coarse',
    records.flatMap((r) => [r.value, draw(r.radius)]),
  );
  c.show('predict', prompt);
  const upper = records[order[0]],
    next = records[order[1]];
  c.hide(
    'one',
    records.map((r) => r.radius),
  );
  c.swap('one', upper.memberNames, upper.measured);
  c.show('one', [oneWork, ...upper.legs.map((leg) => draw(leg))]);
  c.on('one', () => s.play(cells[order[0]].shade()));
  c.swap('wrong', prompt, reset, { after: true });
  c.show('wrong', firstWinner, { after: true });
  c.swap('two', oneWork, twoWork);
  c.hide('two', [firstWinner, reset]);
  c.swap('two', next.memberNames, next.measured);
  c.show(
    'two',
    next.legs.map((leg) => draw(leg)),
  );
  c.on('two', () => s.play(cells[order[1]].shade()));
  c.show('winner', [repaired, billing], { after: true });
  c.swap('work', twoWork, comparison, { after: true });
  c.keep(map.chart);
}
