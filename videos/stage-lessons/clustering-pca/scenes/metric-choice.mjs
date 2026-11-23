import { arrow, column, dynamic, group, indicate, place, tex } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { COLORS, cosine, foot, left, mix, ribbon, right, scoreBars } from '../parts.mjs';

export default function scene(s, c) {
  const q = [1, 0],
    documents = [
      [1, 0.1],
      [8, 4],
    ],
    norms = documents.map((p) => Math.hypot(...p));
  const amount = s.value(0),
    zoom = s.value(1);
  const origin = left.inset('wide').point('bottom left');
  const unit = Math.min(left.width / 10, left.height / 6);
  const p = ([x, y]) => [origin[0] + x * unit * zoom.value, origin[1] - y * unit * zoom.value];
  const current = () =>
    documents.map((v, i) => v.map((x) => x * mix(1, 1 / norms[i], amount.value)));
  const vectors = dynamic(() =>
    group(
      arrow(p([0, 0]), p(q), { stroke: 'yellow', width: 5 }),
      ...current().map((v, i) => arrow(p([0, 0]), p(v), { stroke: COLORS[i], width: 6 })),
    ),
  );
  const [a, b, d] = right.rows([2, 2, 1], 'normal');
  const bars = scoreBars(
    a,
    ['charge', 'release'],
    documents.map((v) => v[0]),
    {
      max: 8,
      colors: ['cyan', 'blue'],
      format: (v) => v.toFixed(3),
    },
  );
  const normalized = scoreBars(
    a,
    ['charge', 'release'],
    documents.map((v) => cosine(q, v)),
    {
      max: 1,
      colors: ['cyan', 'blue'],
      format: (v) => v.toFixed(3),
    },
  );
  const keys = place(
    column(
      [
        label('Q = (1, 0)', { color: 'yellow', size: 34 }),
        label('source charge = (1, 0.1)', { color: 'cyan', size: 34 }),
        label('source release = (8, 4)', { color: 'blue', size: 34 }),
      ],
      { gap: 'normal' },
    ),
    b,
  );
  const invalid = place(note('Zero / nonfinite: reject'), d);
  const question = place(label('Closer direction?', { color: 'yellow', size: 38 }), d);
  const winner = place(label('Cosine winner: charge', { color: 'yellow', size: 34 }), d);
  const equation = place(tex('\\|u-v\\|^2=2-2u\\cdot v', { size: 40 }), foot);
  s.add(heading(c.title), vectors, keys);
  const rawName = place(label('Raw dot product', { size: 36 }), ribbon);
  const cosineName = place(label('Cosine with the query', { size: 36 }), ribbon);
  c.show('dot', [bars, rawName]);
  c.swap('cosine', [bars, rawName], [normalized, cosineName]);
  c.on('cosine', () => {
    s.play(amount.to(1, { duration: 1.2 }));
    s.play(zoom.to(7, { duration: 1.2 }));
  });
  c.show('invalid', invalid);
  c.swap('ask', invalid, question);
  c.swap('winner', question, winner, { after: true });
  c.show('identity', equation);
  c.on('contract', () => s.play(indicate(keys, { scale: 1 })));
}
