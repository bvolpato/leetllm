import { dot, dynamic, matrixProduct, place, rect, to } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { frame, H, P, fmt } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [top, lower] = f.body.rows([5, 3], 'loose');
  const product = place(
    matrixProduct([H[0][2]], P, {
      size: 40,
      cell: 120,
      width: top.width,
      names: ['password', 'P', 'password output'],
      colors: ['cyan', 'cyan'],
    }),
    top,
  );
  const [head, plot, ticks] = lower.rows([1.2, 3, 1], 'normal');
  const first = s.value(0),
    second = s.value(0),
    join = s.value(0);
  const terms = H[0][2].map((v, i) => v * P[i][2]);
  const left = plot.left,
    unit = plot.width;
  const rowA = plot.top + plot.height / 4,
    rowB = plot.bottom - plot.height / 4;
  const rail = rect(unit, plot.height / 4, { stroke: 'grid', fill: 'surface' }).moveTo([
    plot.cx,
    rowA,
  ]);
  const heading = place(label('two matching products → one accumulator', { size: 34 }), head);
  const bars = [first, second].map((amount, i) =>
    dynamic(() => {
      const width = Math.max(0.001, terms[i] * amount.value * unit);
      const offset = i ? terms[0] * join.value * unit : 0;
      const y = i ? rowB + (rowA - rowB) * join.value : rowA;
      return rect(width, plot.height / 4, {
        fill: i ? 'pink' : 'blue',
        stroke: i ? 'pink' : 'blue',
      }).moveTo([left + offset + width / 2, y]);
    }),
  );
  const ruler = [0, terms[0], terms[0] + terms[1], 1].map((v) =>
    mono(fmt(v), { size: 29, color: 'dim' }).moveTo([left + v * unit, ticks.cy]),
  );
  const quarterNames = [
    mono(fmt(H[0][2][0]) + ' × ' + fmt(P[0][2]) + ' = ' + fmt(terms[0]), {
      color: 'blue',
      size: 34,
    }),
    mono(fmt(H[0][2][1]) + ' × ' + fmt(P[1][2]) + ' = ' + fmt(terms[1]), {
      color: 'pink',
      size: 34,
    }),
  ];
  const footSlots = f.foot.columns(3, 'loose');
  quarterNames.forEach((n, i) => place(n, footSlots[i]));
  const total = place(
    mono(fmt(terms[0]) + ' + ' + fmt(terms[1]) + ' = ' + fmt(terms.reduce((a, b) => a + b, 0)), {
      color: 'yellow',
      size: 34,
    }),
    footSlots[2],
  );
  const transfer = dot(12, 'yellow').moveTo([left + (terms[0] + terms[1]) * unit, rowA]);
  const target = product.c.region({ row: 0, col: 2 }).point('top');
  const relation = place(mono('out 2 = ½ × (out 0 + out 1)', { color: 'cyan' }), f.foot);
  s.add(f.title, product, rail, bars, ruler, heading);
  c.on('dot-first', () => {
    s.play(product.pair(0, 2, { duration: 0.6 }));
    product.line.set('opacity', 0);
  });
  c.after('dot-quarter', () => s.play(first.to(1, { duration: 0.45 })));
  c.show('dot-quarter', quarterNames[0], { after: true });
  c.after('dot-second', () => {
    s.play(second.to(1, { duration: 0.6 }));
    s.play(join.to(1, { duration: 0.8 }));
  });
  c.show('dot-second', quarterNames[1], { after: true });
  c.show('dot-accumulate', [total, transfer], { after: true });
  c.after('dot-accumulate', () => {
    s.play(to(transfer, (n) => n.moveTo(target), { duration: 0.6 }));
    s.play(product.addTerm(2, { duration: 0.1 }));
    s.play(product.store({ duration: 0.2 }));
  });
  c.hide('dot-accumulate', transfer, { after: true, lead: -1 });
  c.on('output-relation', () => s.play(product.complete({ duration: 1 })));
  c.swap('output-relation', [...quarterNames, total], relation, { after: true });
}
