import { dot, place, to } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, P, transpose, BASE_OUTPUT, extendedFrame } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns(2, 'loose');
  const bias = s.value(0);
  const a = ownedTable(left, {
    title: 'P: input × output',
    rows: ['in 0', 'in 1'],
    columns: ['out 0', 'out 1', 'out 2'],
    values: () => P,
    colors: ['blue', 'pink'],
  });
  const b = ownedTable(right, {
    title: 'weight: output × input',
    rows: ['out 0', 'out 1', 'out 2'],
    columns: ['in 0', 'in 1'],
    values: () => transpose(P),
    colors: ['cyan', 'cyan', 'cyan'],
  });
  const moving = P.flatMap((r, i) =>
    r.map((v, j) => dot(12, i ? 'pink' : 'blue').moveTo(a.regions[i][j].point('center'))),
  );
  const targets = P.flatMap((r, i) => r.map((v, j) => b.regions[j][i].point('center')));
  const model = extendedFrame('linear-api', { beat: 2 }),
    biased = model.values,
    shift = biased[0].map((v, j) => v - BASE_OUTPUT[0][0][j]);
  const output = ownedTable(f.body, {
    title: 'input @ weight.T + bias',
    rows: ['bias', 'reset', 'my', 'password'],
    columns: ['out 0', 'out 1', 'out 2'],
    values: () => [shift, ...BASE_OUTPUT[0].map((r) => r.map((v, j) => v + shift[j] * bias.value))],
    colors: ['dim', 'green', 'green', 'cyan'],
  });
  const contract = place(mono('Linear(2, 3): (..., 2) → (..., 3)', { color: 'cyan' }), f.foot);
  const copies = BASE_OUTPUT[0].map((r, i) =>
    r.map((_, j) => dot(9, 'yellow').moveTo(output.regions[0][j].point('top left'))),
  );
  const unbiased = ownedTable(right, {
    title: 'unbiased H @ P',
    rows: ['reset', 'my', 'password'],
    columns: ['out 0', 'out 1', 'out 2'],
    values: () => BASE_OUTPUT[0],
    colors: ['green', 'green', 'cyan'],
    active: () => 2,
  });
  const relation = place(mono('0.5 = (0.5 + 0.5) / 2', { color: 'yellow' }), f.foot);
  s.add(
    f.title,
    a.nodes,
    b.nodes.filter((n) => !b.numbers.flat().includes(n)),
    contract,
  );
  c.hide('linear-store', [a.numbers, a.owners, b.owners], { lead: 0.4, fade: 0.15 });
  c.show('linear-store', moving);
  c.on('linear-store', () =>
    s.play(...moving.map((node, i) => to(node, (n) => n.moveTo(targets[i]), { duration: 3 }))),
  );
  c.hide('linear-store', moving, { after: true });
  c.show('linear-store', [a.numbers, a.owners, b.owners, b.numbers], { after: true, lead: -0.4 });
  c.swapAll('linear-bias', output.nodes, { keep: [f.title, contract] });
  c.show('linear-bias', copies, { lead: -0.5 });
  c.on(
    'linear-bias',
    () =>
      s.play(
        ...copies.flatMap((r, i) =>
          r.map((node, j) =>
            to(node, (n) => n.moveTo(output.regions[i + 1][j].point('top left')), { duration: 2 }),
          ),
        ),
      ),
    0.7,
  );
  c.hide('linear-bias', copies, { after: true });
  c.after('linear-bias', () => s.play(bias.to(1, { duration: 3 })));
  c.swapAll(2, [a.nodes, unbiased.nodes], { keep: [f.title] });
  c.show('linear-relation', relation);
}
