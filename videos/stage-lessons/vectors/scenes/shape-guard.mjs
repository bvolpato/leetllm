import { indicate, place } from 'vizmatic/stage';
import { label, mono, namedBox } from '../../kit-narrated.mjs';
import {
  accumulators,
  frame,
  ownedTable,
  REQUEST_X,
  REQUEST_W,
  REQUEST_Y,
  R,
  transpose,
  vectorText,
} from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns(2, 'loose');
  const repeat = s.value(0);
  const repeated = REQUEST_X.map(() => REQUEST_X[0]);
  const a = ownedTable(left, {
    title: 'Request measurements',
    rows: ['A', 'B', 'C'],
    columns: ['prompt', 'queue'],
    values: () => (repeat.value < 0.5 ? REQUEST_X : repeated),
    colors: ['cyan', 'cyan', 'cyan'],
  });
  const b = ownedTable(right, {
    title: 'Replacement weights',
    rows: ['prompt', 'queue', 'load'],
    columns: ['time', 'priority'],
    values: () => R,
    colors: ['blue', 'pink', 'dim'],
  });
  const repaired = ownedTable(right, {
    title: 'Two-feature weights',
    rows: ['prompt', 'queue'],
    columns: ['time', 'priority'],
    values: () => REQUEST_W,
    colors: ['blue', 'pink'],
  });
  const pair = ownedTable(left, {
    title: 'Request B',
    rows: ['prompt', 'queue', ''],
    columns: ['input value'],
    values: () => [...REQUEST_X[1].map((v) => [v]), ['']],
    colors: ['blue', 'pink'],
  });
  const pairVisible = pair.nodes.filter((node) => !pair.rows[2].includes(node));
  const emptyLane = namedBox('load = ?', {
    width: left.width * 0.75,
    height: b.bands[4].height * 0.75,
    color: 'red',
    dash: true,
  }).moveTo([left.cx, b.bands[4].cy]);
  const timeTerms = (weights) =>
    REQUEST_X[1].map((value, i) => value + ' × ' + weights[i][0]).join(' + ');
  const partial = 'B.time = ' + timeTerms(R);
  const missing = place(mono(partial + ' + ? × ' + R[2][0], { color: 'red' }), f.foot);
  const fixed = place(mono('B.time = ' + timeTerms(REQUEST_W), { color: 'yellow' }), f.foot);
  const result = place(
    mono('B.time = ' + timeTerms(REQUEST_W) + ' = ' + REQUEST_Y[1][0] + ' s', { color: 'yellow' }),
    f.foot,
  );
  const axes = place(mono('3 requests × 2 features', { color: 'cyan' }), f.foot);
  const [memoryTitle, ...orders] = right.rows([1, 2, 2], 'normal');
  const memory = [place(label('Values in memory'), memoryTitle)];
  for (const [i, values] of [repeated.flat(), transpose(repeated).flat()].entries()) {
    const [caption, sequence] = orders[i].rows(2, 'tight');
    memory.push(
      place(label(i === 0 ? 'Row by row' : 'Column by column'), caption),
      place(mono(vectorText(values), { color: 'cyan' }), sequence),
    );
  }
  const spectrum = accumulators(right, {
    title: 'Singular values',
    names: ['First', 'Second'],
    values: () => [Math.sqrt(repeated.length) * Math.hypot(...repeated[0]), 0],
  });
  const rank = place(
    mono('Repeated rows: ndim = 2, matrix rank = 1', { size: 36, color: 'cyan' }),
    f.foot,
  );
  const supplied = place(mono('B supplies 2 prompt blocks and 1 second in the queue'), f.foot);
  const question = place(mono('X (3, 2)  @  W (3, 2)  =  ?', { size: 38 }), f.foot);
  s.add(f.title, a.nodes, b.nodes, question);
  c.swap('match-b', a.nodes, pairVisible);
  c.swap('match-b', question, supplied);
  c.show('shape-unmatched', emptyLane, { after: true });
  c.swap('shape-unmatched', supplied, missing, { after: true });
  c.swap('shape-repair', b.nodes, repaired.nodes, { after: true });
  c.swap('shape-repair', [pairVisible, emptyLane], a.nodes, { after: true });
  c.swap('shape-repair', missing, fixed, { after: true });
  c.swap('repaired-time', fixed, result, { after: true });
  c.after('repaired-time', () => s.play(indicate(a.rows[1], { scale: 1, duration: 0.8 })));
  c.swap('shape-rank', result, axes);
  c.on('shape-rank', () => s.play(repeat.to(1, { duration: 1 })));
  c.swap('storage-orders', repaired.nodes, memory);
  c.swap('repeated-rank', axes, rank, { after: true });
  c.swap('singular-values', memory, spectrum.nodes);
}
