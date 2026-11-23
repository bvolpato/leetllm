import { boxOf, draw, polyline, place, seq, to, par } from 'vizmatic/stage';
import { namedBox } from '../../kit-narrated.mjs';
import { sections } from '../../../films/prefix-reuse/fixtures.mjs';
import { commonPrefix } from '../../../films/prefix-reuse/arithmetic.mjs';
import { board, body, caption, pointAt, readings } from '../parts.mjs';

export default function promptOrder(s, c) {
  board(s, c, 'Where should the request ID go?', 'Serialized sections · one unit per section');
  const bands = body.rows([2, 2, 1], 'tight');
  const runs = ['ID A', 'ID B'].map((id, i) => {
    const [travel, base] = bands[i].rows([1, 1], 'tight');
    const slots = base.columns(4, 'normal'),
      path = travel.columns(4, 'normal');
    const names = [id, ...sections];
    const nodes = names.map((name, j) =>
      place(
        namedBox(name, { width: slots[j].width * 0.9, height: 68, color: j ? 'blue' : 'pink' }),
        slots[j],
      ),
    );
    return { nodes, slots, path, id };
  });
  const { slots, nodes } = runs[1];
  const half = boxOf(nodes[1]).width / 2;
  const start = slots[0].cx - half,
    end = slots[2].cx + half;
  const y = bands[2].cy;
  const bracket = polyline(
    [
      [start, y - 18],
      [start, y],
      [end, y],
      [end, y - 18],
    ],
    { stroke: 'green', width: 5 },
  );
  const shared = commonPrefix([...sections, runs[0].id], [...sections, runs[1].id]);
  const measure = caption(shared + ' matching sections', slots[3], {
    color: 'green',
    size: 36,
  }).moveTo([slots[3].cx, y]);
  s.add(runs.map((r) => r.nodes));
  c.on('variable-first', () => s.play(...runs.map((r) => pointAt(r.nodes[0].frame))));
  c.on('stable-first', () =>
    s.play(
      ...runs.map(({ nodes, slots, path }) =>
        seq(
          to(nodes[0], (n) => place(n, path[0])),
          par(
            to(nodes[0], (n) => place(n, path[3])),
            ...nodes.slice(1).map((n, i) => to(n, (v) => place(v, slots[i]))),
          ),
          to(nodes[0], (n) => place(n, slots[3])),
        ),
      ),
      { duration: 2.8 },
    ),
  );
  c.on('final-input', () =>
    s.play(...runs.map((r) => to(r.nodes[1].frame, (n) => n.stroke('yellow')))),
  );
  c.after('shared-history', () => s.play(draw(bracket), { duration: 0.36 }));
  c.show('shared-history', measure, { after: true });
  c.on('retained-identities', () => s.play(...runs.map((r) => pointAt(r.nodes[0].frame))));
  readings(s, c, 'Compare request A with request B.', [
    ['immediate-divergence', 'With the ID first, 0 sections match.', 'red', 'stable-first'],
    ['shared-history', 'The request IDs now follow the shared history.', 'green'],
    ['serialized-order', 'A timestamp or a changed line ending can break the match.', 'pink'],
  ]);
}
