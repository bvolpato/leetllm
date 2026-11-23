import { dot, dynamic, group, line, rect, tokens } from 'vizmatic/stage';
import {
  C,
  HEADS,
  block,
  body,
  change,
  foot,
  kvGroupForQuery,
  label,
  mono,
  note,
  place,
  point,
  range,
  readout,
  row,
  start,
} from '../parts.mjs';

export default function opening(s, c) {
  start(s, c.title);
  const [margin, privateCache, sharedCache] = body.columns([2, 5, 5], 'loose');
  const lanes = (region) => region.rows([1, 1, 1.5, 1.5, 2, 1], 'tight');
  const [, queries, , rain, fell] = lanes(margin);
  s.add(
    place(note('Query heads', { color: C.query }), queries, 'left'),
    place(tokens(['Rain'], { size: 68, color: 'ink' }), rain, 'left'),
  );
  c.show('next', place(tokens(['fell'], { size: 68, color: C.result }), fell, 'left'));

  const legend = row(
    [label('Key for matching', { color: C.key }), label('Value to mix', { color: C.value })],
    { gap: 'wide' },
  );
  s.add(place(legend, foot));

  for (const [region, heads] of [
    [privateCache, HEADS.mhaKV],
    [sharedCache, HEADS.gqaKV],
  ]) {
    const shared = heads === HEADS.gqaKV;
    const [title, ports, wires, saved, incoming, total] = lanes(region);
    if (shared) {
      readout(
        s,
        c,
        title,
        [
          [null, 'Shared histories'],
          ['name', 'Grouped-query attention', 'ink', true],
        ],
        { align: 'center', size: 47 },
      );
    } else s.add(place(label('Multi-head attention', { size: 47 }), title));

    const centers = range(heads).map((i) => point(saved, (i + 0.5) / heads, 0.5)[0]);
    const width = (region.width / HEADS.queries) * 0.82;
    const thickness = Math.min(saved.height * 0.26, 24);
    const pair = (x, y, fraction = 1) => {
      const w = width * fraction;
      const left = x - width / 2 + w / 2;
      return [
        block(w, thickness, left, y - thickness * 0.62, C.key, { radius: 3 }),
        block(w, thickness, left, y + thickness * 0.62, C.value, { radius: 3 }),
      ];
    };
    for (const i of range(HEADS.queries)) {
      const owner = kvGroupForQuery(i, HEADS.queries, heads);
      const x = point(ports, (i + 0.5) / HEADS.queries, 0.5)[0];
      const from = [x, wires.top];
      const to = [centers[owner], saved.point('center')[1] - thickness * 1.3];
      const wire = (color) => [
        line(from, to, { stroke: color, width: 4 }),
        dot(7, color).at(...from),
      ];
      s.add(
        mono('Q' + i, { size: 32, color: C.query }).at(x, ports.point('center')[1]),
        wire(C.query),
      );
      if (shared) {
        const highlight = wire(C.result);
        const cue = owner === 0 ? 'first-group' : 'second-group';
        c.show(cue, highlight);
        c.hide(owner === 0 ? 'second-group' : 'ask', highlight);
      }
    }
    const savedY = saved.point('center')[1];
    s.add(centers.flatMap((x) => pair(x, savedY)));
    const nextY = incoming.point('center')[1];
    if (!shared) {
      const focus = rect(width + 10, thickness * 2.8, {
        fill: null,
        stroke: C.result,
        width: 3,
        radius: 6,
      }).at(centers[0], nextY);
      c.show('pair', focus);
      c.hide('first-group', focus);
    }
    s.add(
      line([region.left, nextY + thickness * 1.8], [region.right, nextY + thickness * 1.8], {
        stroke: 'faint',
        width: 2,
      }),
    );
    const written = s.value(0);
    change(s, c, shared ? 'write' : 'private-write', written, heads, shared, shared ? 0.55 : 1.2);
    s.add(
      dynamic(() =>
        group(
          ...centers.flatMap((x, i) => {
            const fraction = Math.min(1, written.value - i);
            return fraction > 0 ? pair(x, nextY, fraction) : [];
          }),
        ),
      ),
    );
    const count = heads + ' new pairs';
    readout(
      s,
      c,
      total,
      shared
        ? [
            ['ask', 'How many new pairs?', C.result],
            ['write', count, C.result, true],
          ]
        : [['private-total', count, 'ink', true]],
      { align: 'center', size: 46 },
    );
  }
}
