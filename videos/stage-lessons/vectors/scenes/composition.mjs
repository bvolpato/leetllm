import { indicate, matrixProduct, place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import {
  frame,
  vectorPlane,
  ownedTable,
  R,
  COMPOSED,
  P,
  transform,
  H,
  scale,
  vectorText,
} from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns([3, 2], 'loose');
  const a = s.value(0),
    b = s.value(0),
    d = s.value(0),
    e = s.value(0),
    g = s.value(0),
    mode = s.value(0),
    selected = s.value(-1);
  const input = H[0][2],
    midway = transform(input),
    pieces = R.map((r, i) => scale(r, midway[i])),
    directPieces = COMPOSED.map((r, i) => scale(r, input[i]));
  const result = COMPOSED[0].map((_, j) =>
    input.reduce((total, v, i) => total + v * COMPOSED[i][j], 0),
  );
  const p = vectorPlane(left, { title: 'two routes, one endpoint', max: 1.5 });
  const one = p.mark(() => [pieces[0][0] * a.value, 0], 'blue');
  const two = p.mark(
    () => [pieces[0][0] * a.value, pieces[1][1] * b.value],
    'pink',
    () => [pieces[0][0] * a.value, 0],
  );
  const three = p.mark(
    () => [
      pieces[0][0] * a.value + pieces[2][0] * d.value,
      pieces[1][1] * b.value + pieces[2][1] * d.value,
    ],
    'cyan',
    () => [pieces[0][0] * a.value, pieces[1][1] * b.value],
  );
  const direct = p.mark(
    () => [
      directPieces[0][0] * e.value + directPieces[1][0] * g.value,
      directPieces[0][1] * e.value + directPieces[1][1] * g.value,
    ],
    'yellow',
  );
  const [inputSlot, mapSlot] = right.rows([1.5, 4], 'loose');
  const intermediate = ownedTable(inputSlot, {
    title: 'password after P',
    rows: ['password'],
    columns: ['coord 0', 'coord 1', 'coord 2'],
    values: () => [midway],
    colors: ['cyan'],
    activeCell: () => [0, selected.value],
  });
  const table = ownedTable(mapSlot, {
    title: 'second map R',
    rows: ['row 0', 'row 1', 'row 2'],
    columns: ['out 0', 'out 1'],
    values: () => R,
    colors: ['blue', 'pink', 'cyan'],
    active: () => selected.value,
  });
  const combined = ownedTable(right, {
    title: 'combined map P @ R',
    rows: ['in 0', 'in 1'],
    columns: ['out 0', 'out 1'],
    values: () => COMPOSED,
    colors: ['blue', 'pink'],
  });
  const answer = place(
    mono('password: both routes → ' + vectorText(result), { color: 'yellow' }),
    f.foot,
  );
  const product = place(
    matrixProduct(P, R, {
      colors: ['cyan', 'cyan'],
      size: 38,
      cell: 112,
      width: f.body.width,
      names: ['P', 'R', 'P @ R'],
    }),
    f.body,
  );
  s.add(f.title, p.nodes, table.nodes, intermediate.nodes, one, two, three, direct);
  c.on('downstream-first', () => {
    selected.set(0);
    s.play(
      a.to(1, { duration: 1.2 }),
      indicate(table.owners[0], { color: 'yellow', scale: 1, duration: 1.2 }),
    );
  });
  c.after('downstream-first', () => selected.set(-1));
  c.on('downstream-second', () => {
    selected.set(1);
    s.play(
      b.to(1, { duration: 1.2 }),
      indicate(table.owners[1], { color: 'yellow', scale: 1, duration: 1.2 }),
    );
  });
  c.after('downstream-second', () => selected.set(-1));
  c.on('downstream-third', () => {
    selected.set(2);
    s.play(
      d.to(1, { duration: 2 }),
      indicate(table.owners[2], { color: 'yellow', scale: 1, duration: 2 }),
    );
  });
  c.after('downstream-third', () => selected.set(-1));
  c.swapAll('compose-matrices', product, { keep: [f.title] });
  c.on(
    'compose-matrices',
    () => {
      s.play(product.compute(0, 0, { duration: 2 }));
      s.play(product.complete({ duration: 2 }));
      s.play(mode.to(1, { duration: 0.1 }));
    },
    0.6,
  );
  c.swapAll('direct-first', [p.nodes, combined.nodes, one, two, three, direct], {
    keep: [f.title],
  });
  c.on('direct-first', () => s.play(e.to(1, { duration: 1.2 })), 0.4);
  c.on('direct-second', () => s.play(g.to(1, { duration: 1.2 })));
  c.show('direct-second', answer, { after: true });
  c.clear(p.lines, 0.46, 0.2);
}
