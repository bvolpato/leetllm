import { column, indicate, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, V, accumulation, maskedMean, vec, mix } from '../parts.mjs';
export default function pooling(s, c) {
  const values = [V.bank, V.river, V.water],
    mean = maskedMean(values, [1, 1, 1]),
    sum = mean.map((v) => v * values.length),
    divide = s.value(0);
  const p = plane(s, {
    range: [-0.15, 2.8],
    title: 'valid states → masked mean',
    xName: 'coordinate 1',
    yName: 'coordinate 2',
  });
  const acc = accumulation(
    s,
    p,
    values.map((v, i) => ({ values: v, weight: 1, color: ['blue', 'cyan', 'cyan'][i] })),
  );
  const output = p.vector(() => mix(sum, mean, divide.value), 'yellow');
  const rows = place(
    column(
      values.map((v, i) =>
        mono(`${['bank', 'river', 'water'][i]} ${vec(v)} × 1`, {
          size: 36,
          color: i ? 'cyan' : 'blue',
        }),
      ),
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const rule = place(
    column(
      [
        label('masked mean'),
        mono('Σ mask × state / Σ mask', { size: 36 }),
        note('only valid positions enter the sum'),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const result = place(
    column([mono(`mean ${vec(mean)}`, { color: 'yellow' }), note('denominator = 3 valid states')], {
      gap: 'normal',
    }),
    LOW,
    'left',
  );
  const pad = place(
    column(
      [
        mono('padding [1, 1] × 0', { color: 'dim', size: 36 }),
        note('zero contribution, no extra divisor'),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, rows, rule);
  c.show('rule', acc.drawing);
  c.on('rule', () => s.play(acc.progress.to(3, { duration: 1.8 })));
  c.show('mean', output);
  c.after('mean', () => s.play(divide.to(1, { duration: 1.5 })));
  c.show('mean', result, { after: true });
  c.swap('padding', rule, pad);
  c.on('denominator', () => s.play(indicate(result, { scale: 1, color: 'yellow' })));
  c.on('contract', () => s.play(indicate([rows, pad, result], { scale: 1, color: 'yellow' })));
  c.keep(p.frame);
}
