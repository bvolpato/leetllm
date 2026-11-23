import { assertEqual, dot, dynamic, line, place, table } from 'vizmatic/stage';
import { heading, mono } from '../../kit-narrated.mjs';
import {
  VALIDATION_STATES,
  BODY,
  OFFLINE_CASES,
  bundle,
  delayPlot,
  open,
  score,
  train,
} from '../parts.mjs';

const z = train.map((r) => (r.x - bundle.center) / bundle.scale);
const cross = z.reduce((sum, value, i) => sum + value * (train[i].y - bundle.intercept), 0);
const squared = z.reduce((sum, value) => sum + value * value, 0);
assertEqual(Number(cross.toFixed(1)), 1.2, 'training cross-product');
assertEqual(Number(squared.toFixed(1)), 1, 'training squared features');

export default function fit(s, c) {
  const [left, right] = BODY.columns([5, 3], 'loose');
  const [graph, equationRoom] = left.rows([5.5, 1.5], 'wide');
  const plot = delayPlot(s, graph);
  const [data, recipe] = right.rows([3, 3.1], 'wide');
  const trainPairs = place(
    table(
      [
        { key: 'minutes', label: 'Training delay (min)', mono: true },
        { key: 'late', label: 'Outcome' },
      ],
      [
        {
          id: 'on-time',
          minutes: train
            .filter((r) => r.y === 0)
            .map((r) => r.x)
            .join(', '),
          late: 'on time  (0)',
        },
        {
          id: 'late',
          minutes: train
            .filter((r) => r.y === 1)
            .map((r) => r.x)
            .join(', '),
          late: 'late  (1)',
        },
      ],
      { width: data.width, size: 35, leading: 2 },
    ),
    data,
  );
  const values = place(
    table(
      [
        { key: 'term', label: 'From training only' },
        { key: 'value', label: 'Value', mono: true, sample: '1.2 / 1.0' },
      ],
      [
        { id: 'mean', term: 'Impute / center', value: '·' },
        { id: 'range', term: 'Range', value: '·' },
        { id: 'fit', term: 'Cross / square sum', value: '·' },
        { id: 'line', term: 'Slope / intercept', value: '·' },
      ],
      { width: recipe.width, size: 32, leading: 1.7 },
    ),
    recipe,
  );
  const scores = place(
    table(
      [
        { key: 'id', label: 'Request', mono: true },
        { key: 'minutes', label: 'Min' },
        { key: 'value', label: 'Score', sample: '−0.10', mono: true },
      ],
      OFFLINE_CASES.map((r) => ({ id: r.id, minutes: r.x, value: '·' })),
      {
        width: data.width,
        size: 33,
        leading: 1.65,
        states: VALIDATION_STATES,
      },
    ),
    data,
  );
  const [eqA, eqB] = equationRoom.rows(2, 'tight');
  const transform = place(mono('z = (delay − 5) / 10', { size: 38, color: 'cyan' }), eqA);
  const formula = place(mono('score = 0.5 + 1.2 × z', { size: 38, color: 'green' }), eqB);
  const probe = OFFLINE_CASES.find((r) => r.id === 'eval-2');
  const value = score(bundle, probe.x);
  const test = place(mono('z = (8 − 5) / 10', { size: 38, color: 'cyan' }), eqA);
  const known = place(mono('z = (8 − 5) / 10 = 0.3', { size: 38, color: 'cyan' }), eqA);
  const answer = place(
    mono('score = 0.5 + 1.2 × 0.3 = ' + value.toFixed(2), { size: 35, color: 'green' }),
    eqB,
  );
  const start = [plot.px(probe.x), plot.py(0)];
  const end = [plot.px(probe.x), plot.py(value)];
  const startDot = dot(12, 'yellow').moveTo(start);
  const input = mono('8 min', { size: 30, color: 'yellow' }).moveTo([start[0], start[1] + 45]);
  const rise = s.value(0);
  const projection = dynamic(() => {
    if (rise.value <= 0) return [];
    const tip = [start[0], start[1] + (end[1] - start[1]) * rise.value];
    return [
      line(start, tip, { stroke: 'yellow', width: 4, dash: [9, 7] }),
      dot(13, 'yellow').moveTo(tip),
    ];
  });
  const title = heading(c.title);
  const question = heading('Would v1 warn at eight minutes?');
  const decision = heading('Eight minutes scores ' + value.toFixed(2) + ' and triggers a warning');
  open(s, c, title);
  s.add(plot.nodes, values, projection);
  c.show('fit-points', trainPairs);
  c.on('fit-mean', () =>
    s.play(values.setCell('mean', 'value', bundle.center), values.light('mean')),
  );
  c.on('fit-range', () =>
    s.play(values.setCell('range', 'value', bundle.scale), values.light('range')),
  );
  c.show('fit-transform', transform);
  c.on('fit-cross', () =>
    s.play(values.setCell('fit', 'value', cross.toFixed(1) + ' / ?'), values.light('fit')),
  );
  c.on('fit-square', () =>
    s.play(values.setCell('fit', 'value', cross.toFixed(1) + ' / ' + squared.toFixed(1))),
  );
  c.show('fit-line', formula);
  c.on('fit-line', () =>
    s.play(
      values.setCell('line', 'value', bundle.slope.toFixed(1) + ' / ' + bundle.intercept),
      values.light('line'),
      plot.lineOn.to(1, { duration: 1.05 }),
    ),
  );
  c.swap('fit-probe', trainPairs, scores);
  c.show('fit-probe', [startDot, input]);
  c.swap('fit-question', [title, transform], [question, test]);
  c.swap('fit-z', test, known);
  c.on('fit-rise', () => s.play(rise.to(1, { duration: 1 })));
  c.swap('fit-score', [question, formula], [decision, answer], { after: true, lead: 0 });
  c.after('fit-score', () =>
    s.play(scores.setCell(probe.id, 'value', value.toFixed(2)), scores.light(probe.id)),
  );
  c.on('fit-eval', () =>
    s.play(
      plot.evalOn.to(1, { duration: 0.85 }),
      ...OFFLINE_CASES.filter((r) => r.id !== probe.id).map((r) =>
        scores.setCell(r.id, 'value', score(bundle, r.x).toFixed(2)),
      ),
    ),
  );
  c.on('fit-negative', () => s.play(scores.light('eval-4', 'value')));
}
