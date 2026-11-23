import { dot, matrixProduct, place, to } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, productOwners, H, WORDS, gram, transpose } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns(2, 'loose');
  const edit = s.value(0);
  const rows = () => H[0].map(([x, y], t) => [x + (t === 2 ? edit.value : 0), y]);
  const baseline = gram(H[0]);
  const original = ownedTable(left, {
    title: 'Token vectors',
    rows: ['reset', 'my', 'password'],
    columns: ['f0', 'f1'],
    values: rows,
    colors: ['green', 'green', 'cyan'],
  });
  const transposed = ownedTable(right, {
    title: 'copy: token columns',
    rows: ['f0', 'f1'],
    columns: ['reset', 'my', 'password'],
    values: () => transpose(H[0]),
    colors: ['dim', 'dim'],
  });
  const moving = H[0].flatMap((r, i) =>
    r.map((v, j) => dot(12, j ? 'pink' : 'blue').moveTo(original.regions[i][j].point('center'))),
  );
  const target = H[0].flatMap((r, i) => r.map((v, j) => transposed.regions[j][i].point('center')));
  const product = place(
    matrixProduct(H[0], transpose(H[0]), {
      colors: ['cyan', 'cyan'],
      size: 38,
      cell: 130,
      width: f.body.width - 320,
      names: ['token rows', 'token columns', 'token × token'],
    }),
    f.body,
  );
  const owners = productOwners(product, 'scores');
  const changed = ownedTable(right, {
    title: 'Raw scores',
    rows: WORDS[0],
    columns: WORDS[0],
    values: () => gram(rows()),
    cellColor: (i, j) => (gram(rows())[i][j] !== baseline[i][j] ? 'yellow' : 'dim'),
  });
  const foot = place(
    mono('rows / columns: reset, my, password', { size: 36, color: 'cyan' }),
    f.foot,
  );
  s.add(
    f.title,
    original.nodes,
    transposed.nodes.filter((n) => !transposed.numbers.flat().includes(n)),
    foot,
  );
  c.hide('score-transpose', [original.numbers, original.owners, transposed.owners], {
    lead: 0.4,
    fade: 0.15,
  });
  c.show('score-transpose', moving);
  c.on('score-transpose', () =>
    s.play(...moving.map((node, i) => to(node, (n) => n.moveTo(target[i]), { duration: 3 }))),
  );
  c.hide('score-transpose', moving, { after: true });
  c.show(
    'score-transpose',
    [original.numbers, original.owners, transposed.owners, transposed.numbers],
    { after: true, lead: -0.4 },
  );
  c.swapAll('score-reset', [product, owners], { keep: [f.title, foot] });
  for (const [id, i, j] of [
    ['score-reset', 0, 0],
    ['score-my', 0, 1],
    ['score-password', 0, 2],
    ['score-self', 2, 2],
  ]) {
    c.on(
      id,
      () => {
        s.play(product.pair(i, j, { duration: 0.3 }));
      },
      0.8,
    );
    c.after(id, () => {
      product.line.set('opacity', 0);
      s.play(product.addTerm(2, { duration: 0.3 }));
      s.play(product.store({ duration: 0.3 }));
    });
  }
  c.after('score-length', () => s.play(product.complete({ duration: 1 })));
  c.on('score-diagonal', () => {
    for (let i = 0; i < H[0].length; i++)
      s.play(product.c.light({ row: i, col: i }, { duration: 0.6 }));
  });
  c.swapAll('compare-edit', [original.nodes, changed.nodes], { keep: [f.title] });
  c.on('repeat-edit', () => s.play(edit.to(1, { duration: 1.5 })));
}
