import { place, rect, to, arrow, dot, seq } from 'vizmatic/stage';
import { addTitle, work, caption, CASE } from '../parts.mjs';

export default function tradeoff(s, c) {
  addTitle(s, c);
  const [map, signal] = work.rows([3, 1]);
  const zones = map.columns(3, 'loose');
  const frames = zones.map((r) =>
    place(rect(r.width, r.height * 0.97, { fill: 'surface', stroke: null, radius: 30 }), r),
  );
  const rows = zones.map((r) => r.rows([1, 1, 1], 'normal'));
  const adapter = caption(rows[0][2], 'Adapter', 'cyan', 46);
  const gate = caption(rows[0][1], 'Gateway', 'blue', 46);
  const source = caption(rows[2][1], 'Source quota', 'dim', 46);
  const names = ['Shared process', 'Separate service', 'Upstream source'].map((name, i) =>
    caption(rows[i][0], name, 'dim', 34),
  );
  const stations = rows.map((r) => r[2].point('center'));
  const wires = stations
    .slice(1)
    .map((end, i) => arrow(stations[i], end, { stroke: i ? 'dim' : 'cyan', width: 4, pad: 12 }));
  const packet = dot(11, 'cyan').moveTo(stations[0]);
  const labelY = stations[0][1] + 47;
  const request = caption(rows[0][2], CASE.request, 'cyan', 34).moveTo([stations[0][0], labelY]);
  const follow = (node, offset) =>
    seq(
      ...stations
        .slice(1)
        .map(([x, y]) => to(node, (n) => n.moveTo([x, y + offset]), { duration: 0.95 })),
    );
  const initially = caption(signal, 'The gateway and adapter ship together.');
  const risk = caption(signal, 'One adapter can exhaust the shared budget.', 'yellow');
  const split = caption(signal, 'Two release schedules and two resource budgets.', 'cyan');
  const remote = caption(signal, 'Every lookup now crosses a network hop.', 'yellow');
  const question = caption(signal, 'Where is the wait?', 'yellow');
  const fixed = caption(signal, 'Same quota.', 'yellow');
  s.add(frames, names, gate, adapter, source, initially);
  c.on('local', () => s.play(to(frames[0], (n) => n.fill('grid'))));
  c.swap('risk', initially, risk);
  c.on('split', () =>
    s.play(
      to(adapter, (n) => place(n, rows[1][1])),
      { duration: 1 },
    ),
  );
  c.swap('isolates', risk, split);
  c.show('hop', [wires, packet, request]);
  c.on('hop', () => s.play(follow(packet, 0), follow(request, labelY - stations[0][1])), 0.35);
  c.swap('hop', split, remote);
  c.swap('reverse', remote, question);
  c.on('quota', () => s.play(to(frames[2], (n) => n.fill('gridStrong'))));
  c.swap('still', question, fixed, { after: true });
}
