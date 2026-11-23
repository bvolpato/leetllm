import { dynamic, line, place, rect, to, unitChart } from 'vizmatic/stage';
import { captions, frame, plot, point, record } from '../parts.mjs';
import { label } from '../../kit-narrated.mjs';

export default function drAssumptions(s, c) {
  frame(
    s,
    'When does the error product vanish?',
    'Bias contribution on a supported action',
    'Conditions for this calculation',
  );
  const [product, split] = plot.rows([2, 1], 'wide');
  const base = point(product, 0.12, 0.83),
    w = product.width * 0.72,
    h = product.height * 0.65;
  const ex = s.value(1),
    ey = s.value(1);
  const axes = [
    line(base, [base[0] + w, base[1]], { stroke: 'dim', width: 3 }),
    line(base, [base[0], base[1] - h], { stroke: 'dim', width: 3 }),
  ];
  const box = dynamic(() =>
    ex.value * ey.value > 0.002
      ? rect(w * ex.value, h * ey.value, {
          stroke: 'yellow',
          fill: 'yellow',
          opacity: 0.55,
          width: 3,
        }).at(base[0] + (w * ex.value) / 2, base[1] - (h * ey.value) / 2)
      : [],
  );
  const halves = split.columns(2, 'wide'),
    names = ['Model fit', 'Held-out evaluation'];
  const rows = halves.map((r, i) => {
    const [top, b] = r.rows([1, 2]);
    return [
      place(label(names[i], { size: 33 }), top),
      place(
        unitChart([{ count: 20, color: 'dim' }], { rows: 4, cell: 16, gap: 6, shape: 'square' }),
        b,
      ),
    ];
  });
  const [x, y, bias] = record(s, [
    ['Width: propensity factor', '1 − e / ê'],
    ['Height: reward error', 'predicted − true'],
    ['Bias contribution', 'Width × height', 'yellow'],
  ]);
  s.add(...axes, box, rows.flat());
  c.after('zero', () => s.play(ex.to(0, { duration: 1.1 })));
  x(c, 'zero', '0 with matched weights', true);
  bias(c, 'zero', '0', true);
  c.on('approximate', () => s.play(ex.to(0.65), ey.to(0.55), { duration: 1 }));
  x(c, 'approximate', '1 − e / ê');
  bias(c, 'approximate', 'Residual area');
  c.on('fit', () => s.play(...rows[0][1].marks.map((m) => to(m, (n) => n.fill('yellow')))));
  c.on('evaluate', () => s.play(...rows[1][1].marks.map((m) => to(m, (n) => n.fill('ink')))));
  c.on('matched', () => s.play(ey.to(0, { duration: 1 })));
  y(c, 'matched', '0 with matched means');
  bias(c, 'matched', '0 in this fixture');
  captions(s, c, 'The rectangle shows the magnitude of one bias contribution.', [
    ['zero', 'Only an exact match collapses the corresponding dimension.', true],
    ['fit', 'Fit the nuisance models on one sample and evaluate them on held-out outcomes.'],
    ['matched', 'Matching the reward model collapses the height.'],
    ['support', 'An unsupported action still has no observed reward to check.'],
  ]);
}
