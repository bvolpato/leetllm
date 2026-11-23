import { assertEqual, circle, dot, dynamic, group, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { distance, transferDocuments, transferQuery } from '../parts.mjs';

export default function scene(s, c) {
  const docs = transferDocuments;
  const q = transferQuery;
  const middle = docs.filter((doc) => doc.point[0] === q[0]);
  const full = docs.map((doc) => distance(doc.point, q));
  const projected = docs.map((doc) => Math.abs(doc.point[0] - q[0]));
  const tied = docs.filter((_, i) => projected[i] === Math.min(...projected));
  const fullWinner = docs[full.indexOf(Math.min(...full))];
  const storageWinner = tied[0];
  const spread = [0, 1].map((j) => docs.reduce((sum, d) => sum + d.point[j] ** 2, 0));
  assertEqual(
    [0, 1].every((j) => docs.reduce((sum, d) => sum + d.point[j], 0) === 0),
    true,
    'both corpus means are zero',
  );
  assertEqual(
    docs.reduce((sum, d) => sum + d.point[0] * d.point[1], 0),
    0,
    'the coordinate axes are principal axes',
  );
  assertEqual(spread[0] > spread[1], true, 'PC1 is horizontal');
  assertEqual(tied.map((d) => d.id).join(','), 'B,L,R', 'three documents at the projected query');
  assertEqual(
    fullWinner.id + storageWinner.id,
    'LB',
    'the same storage order yields L in 2D and B in 1D',
  );

  const [order, overview, names, graph, readings, outcome] = area.rows(
    [0.8, 1.5, 0.7, 3.45, 0.75, 0.85],
    'tight',
  );
  const orderSlots = order.columns([2, 1, 1, 1, 1, 1], 'normal');
  const ordered = docs.map((d, i) => place(mono(d.id, { size: 39 }), orderSlots[i + 1]));
  const flag = (id, color) =>
    circle(32, { stroke: color, width: 4 }).moveTo(
      orderSlots[docs.findIndex((d) => d.id === id) + 1].point('center'),
    );
  const [axisLabel, spreadRegion] = overview.columns([1.1, 5.5], 'normal');
  const px = (x) => spreadRegion.cx + (x * spreadRegion.width) / 47;
  const axisY = spreadRegion.cy + 17;
  const axis = line([px(-22), axisY], [px(22), axisY], { stroke: 'dim', width: 3 });
  const pins = [-20, 0, 20].flatMap((x) => {
    const ids = docs.filter((d) => d.point[0] === x).map((d) => d.id);
    if (x === q[0]) ids.push('Q');
    const text = ids.join(' ') + '   ' + x;
    return [
      dot(9, 'cyan').moveTo([px(x), axisY]),
      mono(text, { size: 30, color: 'cyan' }).moveTo([px(x), axisY - 38]),
    ];
  });
  const weights = [1.5, 1, 1, 1, 1];
  const titleSlots = names.columns(weights, 'normal');
  const tracks = graph.columns(weights, 'normal');
  const values = readings.columns(weights, 'normal');
  const entries = [...middle, { id: 'Q', text: 'Query', point: q }];
  const height = s.value(1);
  const y = (v) => graph.cy - (v * graph.height) / 8.4;
  const startX = tracks[0].right - 36;
  const axes = [-3, 0, 3].flatMap((v) => [
    line([startX - 8, y(v)], [startX + 8, y(v)], { stroke: 'dim', width: 3 }),
    mono(String(v), { size: 28, color: 'dim' }).moveTo([startX - 45, y(v)]),
  ]);
  const rails = tracks
    .slice(1)
    .map((r) => line([r.cx, y(-3.7)], [r.cx, y(3.7)], { stroke: 'dim', width: 2, opacity: 0.65 }));
  const zeroLine = line([startX, y(0)], [tracks.at(-1).cx, y(0)], { stroke: 'dim', width: 3 });
  const labels = entries.map((d, i) =>
    place(
      label(d.id + '   ' + ['Billing', 'Sign-in', 'Runbook', 'Query'][i], {
        size: 35,
        color: d.id === 'Q' ? 'yellow' : 'ink',
      }),
      titleSlots[i + 1],
    ),
  );
  const dots = dynamic(() =>
    group(
      ...entries.map((d, i) =>
        dot(14, d.id === 'Q' ? 'yellow' : 'cyan').moveTo([
          tracks[i + 1].cx,
          y(d.point[1] * height.value),
        ]),
      ),
      mono((q[1] * height.value).toFixed(1), { size: 30, color: 'yellow' }).moveTo([
        tracks.at(-1).cx + 64,
        y(q[1] * height.value),
      ]),
    ),
  );
  const toQuery = dynamic(() => {
    const qy = y(q[1] * height.value);
    return group(
      line([tracks[1].cx, qy], [tracks.at(-1).cx, qy], {
        stroke: 'yellow',
        width: 3,
        opacity: 0.8,
      }),
      ...middle.map((d, i) =>
        line([tracks[i + 1].cx, y(d.point[1] * height.value)], [tracks[i + 1].cx, qy], {
          stroke: 'cyan',
          width: 6,
        }),
      ),
    );
  }).zIndex(-1);
  // During projection the query and the documents lose the same fraction of their height.
  const liveDistances = middle.map((d, i) =>
    dynamic(() =>
      mono((Math.abs(d.point[1] - q[1]) * height.value).toFixed(1), {
        size: 39,
        color: 'cyan',
      }).moveTo(values[i + 1].point('center')),
    ),
  );
  const message = (text, color = 'ink') => place(label(text, { size: 38, color }), outcome);
  const baseline = message('All five searched    ·    L returns sign-in help', 'yellow');
  const percentage = message(
    `PC1 keeps ${((100 * spread[0]) / (spread[0] + spread[1])).toFixed(1)}% of corpus variance`,
  );
  const tie = message('Nearest distance 0    ·    B, L and R tie');
  const prediction = message('Which tied ID comes first in storage?', 'yellow');
  const wrong = message('All five searched    ·    B returns billing help', 'pink');
  const repair = message('Open another list, or restore the second coordinate?', 'yellow');
  const final = message(
    'One coordinate: B, billing    ·    Both coordinates: L, sign-in',
    'yellow',
  );
  const flatRing = flag(fullWinner.id, 'yellow'),
    firstRing = flag(storageWinner.id, 'pink'),
    recovered = flag(fullWinner.id, 'yellow');

  const storage = place(label('Storage order', { size: 36 }), orderSlots[0], 'left');
  const searched = place(note(`Storage order   ·   ${docs.length}/${docs.length} searched`), orderSlots[0], 'left');
  s.add(heading(c.title), storage, ordered);
  const [axisTitle, axisShare] = axisLabel.rows(2, 'tight');
  c.show('policies', [
    place(note('PC1 position'), axisTitle, 'bottom left'),
    axis,
    ...pins.slice(0, 2),
    ...pins.slice(4),
  ]);
  c.show('middle', pins.slice(2, 4));
  c.show('height', [
    place(note('Height above PC1'), titleSlots[0], 'left'),
    labels,
    axes,
    zeroLine,
    rails,
    dots,
  ]);
  c.show('dist', [toQuery, place(note('Distance to Q'), values[0], 'left'), liveDistances]);
  c.show('baseline', [baseline, flatRing], { after: true });
  c.swap('baseline', storage, searched, { after: true });
  c.swap('variance', baseline, percentage, { after: true });
  c.show(
    'variance',
    place(
      note(`${((100 * spread[0]) / (spread[0] + spread[1])).toFixed(1)}% of spread`),
      axisShare,
      'top left',
    ),
    { after: true },
  );
  c.hide('project', flatRing);
  c.on('project', () => s.play(height.to(0, { duration: 1.8 })));
  c.swap('tie', percentage, tie, { after: true });
  c.swap('predict', tie, prediction);
  c.swap('wrong', prediction, wrong, { after: true });
  c.show('wrong', firstRing, { after: true });
  c.swap('repair-question', wrong, repair);
  c.hide('restore', [repair, firstRing]);
  c.after('restore', () => s.play(height.to(1, { duration: 1.4 })));
  c.show('answer', [final, recovered], { after: true });
}
