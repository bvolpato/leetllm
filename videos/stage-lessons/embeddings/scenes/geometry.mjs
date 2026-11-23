import { assertEqual, column, dynamic, place } from 'vizmatic/stage';
import { dotProduct } from 'vizmatic';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { angleArc, cosine, fmt, LOW, MID, plane, TOP, vec } from '../parts.mjs';

export default function geometry(s, c) {
  const p = plane(s, {
    title: 'One fixed angle',
    range: [-0.28, 2.45],
    xName: 'coordinate 1',
    yName: 'coordinate 2',
  });
  const length = s.value(1);
  const u = [1, 0];
  const v = () => [length.value, length.value];
  const angle = angleArc(p, () => u, v, 'yellow', 0.55);
  const inputs = dynamic(
    () =>
      place(
        column(
          [mono('u = [1, 0]', { color: 'blue' }), mono('v = ' + vec(v()), { color: 'cyan' })],
          { gap: 'normal' },
        ),
        TOP,
        'left',
      ).nodes,
  );
  const scores = dynamic(
    () =>
      place(
        column(
          [
            mono('Dot product    ' + fmt(dotProduct(u, v())), { size: 42 }),
            mono('Cosine         ' + fmt(cosine(u, v())), { size: 42, color: 'yellow' }),
          ],
          { gap: 'normal' },
        ),
        MID,
        'left',
      ).nodes,
  );
  const initial = place(note('Dot product = sum of matching coordinate products'), LOW, 'left');
  const formula = place(
    column(
      [mono('cos = (u · v) / (‖u‖ ‖v‖)', { size: 40 }), note('Two nonzero vectors in one space')],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const ask = place(label('Double v. Which score changes?', { color: 'yellow' }), LOW, 'left');
  assertEqual(fmt(cosine(u, [2, 2])), fmt(cosine(u, [1, 1])), 'doubling preserves direction');
  assertEqual(dotProduct(u, [2, 2]), 2, 'doubled dot product');
  c.take(p.frame);
  s.add(
    heading(c.title),
    p.nodes,
    p.vector(() => u, 'blue'),
    p.vector(v, 'cyan'),
    inputs,
    initial,
  );
  c.show('score', [scores, angle]);
  c.swap('divide', initial, formula);
  c.swap('predict', formula, ask);
  c.swap('double', ask, formula);
  c.on('double', () => s.play(length.to(2, { duration: 1.4 })));
  c.on('unit', () => s.play(length.to(1 / Math.sqrt(2), { duration: 1.5 })));
  c.keep(p.frame);
}
