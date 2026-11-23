import { assertEqual, column, dynamic, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { negativeSamplingState } from '../../../films/embeddings/model.mjs';
import { fmt, mix, vec } from '../parts.mjs';

export default function negativeStep(s, c) {
  const before = negativeSamplingState(0);
  const after = negativeSamplingState(1);
  assertEqual(vec(after.updated), '[1.081, 0.008]', 'updated center');
  assertEqual(fmt(after.loss), '0.827', 'loss after the center update');
  const [centerBox, header, ...rest] = area.rows([0.9, 0.6, 1, 1, 1, 1.65, 1], 'normal');
  const [sumBox, foot] = rest.slice(3);
  const columns = (r) => r.columns([1, 1.1, 0.7, 1.15, 1.6], 'normal');
  const titles = [
    'Training draw',
    'Output row',
    'Initial score',
    'Loss slope',
    'Slope × output row',
  ];
  const heads = columns(header);
  const center = place(
    mono('Center input   ' + vec(before.center), { color: 'blue', size: 49 }),
    centerBox,
    'left',
  );
  const rows = before.terms.map((term, i) => {
    const lane = rest[i];
    const cells = columns(lane);
    const color = i === 0 ? 'cyan' : 'pink';
    return {
      draw: place(label(['Observed', 'Noise 1', 'Noise 2'][i], { color }), cells[0], 'left'),
      output: place(mono(vec(term.values), { size: 36 }), cells[1], 'left'),
      score: place(mono(fmt(before.scores[i]), { size: 40 }), cells[2], 'left'),
      slope: place(
        column(
          [
            mono(i === 0 ? 'σ(s) − 1' : 'σ(s)', { size: 29 }),
            mono(fmt(term.weight), { size: 39, color }),
          ],
          { gap: 4, align: 'left' },
        ),
        cells[3],
        'left',
      ),
      term: place(
        mono(vec(term.values.map((x) => x * term.weight)), { size: 36, color }),
        cells[4],
        'left',
      ),
      rule: line(lane.point('bottom left'), lane.point('bottom right'), {
        stroke: 'grid',
        width: 2,
      }),
    };
  });
  const lossRule = place(
    column(
      [
        mono('L = −log σ(positive score) − Σ log σ(−noise score)', { size: 38 }),
        note('σ(s) = 1 / (1 + exp(−s))'),
      ],
      { gap: 'normal' },
    ),
    sumBox,
    'left',
  );
  const sum = place(
    column(
      [
        mono('Center gradient    ' + vec(before.gradient), { size: 44 }),
        mono('New center = old center − 0.1 × gradient', { size: 38, color: 'blue' }),
      ],
      { gap: 'normal' },
    ),
    sumBox,
    'left',
  );
  const ask = place(
    label('Will the observed score rise or fall?', { color: 'yellow' }),
    foot,
    'left',
  );
  const fraction = s.value(0);
  const current = () => negativeSamplingState(0, mix(before.center, after.updated, fraction.value));
  const actual = dynamic(() =>
    place(
      mono('Center input   ' + vec(current().updated), { color: 'blue', size: 49 }),
      centerBox,
      'left',
    ),
  );
  const metrics = dynamic(() => {
    const step = current();
    return place(
      mono(
        'Observed score  ' +
          fmt(before.positiveScore) +
          ' → ' +
          fmt(step.positiveScore) +
          '       Loss  ' +
          fmt(before.loss) +
          ' → ' +
          fmt(step.loss),
        { size: 40, color: 'yellow' },
      ),
      foot,
      'left',
    );
  });
  s.add(
    heading(c.title),
    center,
    rows.map((r) => r.rule),
    titles.map((v, i) => place(note(v), heads[i], 'left')),
  );
  c.show('observed', [rows[0].draw, rows[0].output, rows[0].score]);
  c.show(
    'noise',
    rows.slice(1).flatMap((r) => [r.draw, r.output, r.score]),
  );
  c.show('loss', lossRule);
  c.show('positive', [rows[0].slope, rows[0].term]);
  c.show(
    'negative',
    rows.slice(1).flatMap((r) => [r.slope, r.term]),
  );
  c.swap('add', lossRule, sum);
  c.show('predict', ask);
  c.swap('step', [center, ask], [actual, metrics]);
  c.on('step', () => s.play(fraction.to(1, { duration: 1.6 })));
}
