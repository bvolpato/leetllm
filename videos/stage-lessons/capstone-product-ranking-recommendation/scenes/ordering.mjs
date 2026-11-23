import { dynamic, line, place } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, dcg, open, ORDERING_PRODUCTS } from '../parts.mjs';

export default function ordering(s, c) {
  const [head, board, total, foot] = open(s, c).rows([1, 4.4, 0.85, 0.85], 'wide');
  const cols = r => r.columns([1.65, 1, 1.65], 'wide');
  const [leftHead, , rightHead] = cols(head);
  const [left, , right] = cols(board);
  const leftRows = left.rows(3, 'wide'), rightRows = right.rows(3, 'wide');
  const control = ORDERING_PRODUCTS;
  const ideal = [...control].sort((a, b) => b.grade - a.grade);
  const observed = dcg(control.map(p => p.grade)), best = dcg(ideal.map(p => p.grade));
  const gain = (p, i) => ((2 ** p.grade - 1) / Math.log2(i + 2)).toFixed(3);
  const card = p => namedBox(p.id + '   grade ' + p.grade, { width: 280, height: 85, color: COLOR[p.id] });
  const at = (r, x) => [x, r.cy];
  const endpoints = control.map((p, i) => {
    const j = ideal.findIndex(other => other.id === p.id);
    return { p, i, j, start: at(leftRows[i], left.right), end: at(rightRows[j], right.left) };
  });
  const header = place(label('Control · returned order'), leftHead);
  s.add(header, place(label('Best order for these grades'), rightHead));
  for (const { p, i } of endpoints) {
    s.add(place(card(p), leftRows[i], 'right'));
    s.add(place(note('Rank ' + (i + 1)), leftRows[i], 'left'));
  }
  rightRows.forEach((r, i) => s.add(place(note('Rank ' + (i + 1)), r, 'right')));
  const discounts = control.map((p, i) => mono(gain(p, i) + ' of ' + (2 ** p.grade - 1), { size: 32, color: COLOR[p.id] })
    .moveTo([leftRows[i].right - 140, leftRows[i].cy + 69]));
  c.show('position-gains', discounts);
  const [first, , last] = cols(total);
  const sum = place(mono('DCG  ' + observed.toFixed(3), { size: 43 }), first);
  c.show('position-control', sum, { after: true });
  const question = place(label('Which printer gains the most from first place?', { color: 'yellow' }), foot);
  c.show('position-question', question);
  c.hide('position-order', question);
  const travel = s.value(0);
  const slopes = dynamic(() => endpoints.map(({ p, start, end }) =>
    line(start, start.map((v, i) => v + (end[i] - v) * Math.max(0.001, travel.value)), { stroke: COLOR[p.id], width: 5 })));
  c.show('position-order', slopes);
  c.on('position-order', () => s.play(travel.to(1, { duration: 0.9 })));
  c.show('position-order', endpoints.flatMap(({ p, j }) => [
    place(card(p), rightRows[j], 'left'), mono(gain(p, j), { size: 32, color: COLOR[p.id] })
      .moveTo([rightRows[j].left + 140, rightRows[j].cy + 69]),
  ]), { lead: -0.85 });
  c.show('position-ideal', place(mono('Ideal DCG  ' + best.toFixed(3), { size: 43 }), last), { after: true });
  const comparison = place(mono('NDCG@3    ' + (observed / best).toFixed(3) + '  →  1.000      Recall@3    2/2  →  2/2', { size: 38 }), foot);
  c.show('position-normalize', comparison, { after: true });
}
