import { dynamic, group, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  FOOT,
  Q,
  RAIL,
  RESIDUALS,
  correctedThreshold,
  latencyRuler,
  scoreRail,
} from '../parts.mjs';

export default function indexContract(s, c) {
  const rail = scoreRail(s);
  rail.active.set(Q.index);
  const ruler = latencyRuler(s);
  const step = s.value(0);
  const commandStep = s.value(0);
  const last = correctedThreshold(RESIDUALS, 0.9);
  const missing = correctedThreshold(RESIDUALS, 0.95);
  const display = [
    ['Sorted absolute errors (ms)', 'One-based rank k = 8'],
    [
      'np.partition(scores_array, k - 1)[k - 1]',
      'k = 8     index 7     radius ' + Q.threshold + ' ms',
    ],
    [
      'np.quantile(scores_array, level, method="higher")',
      'level = 8/9     index = ceil(8 × 8/9) = 8     radius ' + last.threshold + ' ms',
    ],
    [
      '90% target     k = 9     level = 9/9',
      'Both calls select index 8     radius ' + last.threshold + ' ms',
    ],
    [
      '95% target     k = ' + missing.rank + '     9 observed errors',
      'No observed score at rank 10     q = ∞',
    ],
  ];
  const readout = dynamic(() => {
    const command = display[commandStep.value][0];
    const result =
      step.value === commandStep.value
        ? display[step.value][1]
        : [
            '',
            'k = 8     index 7     radius ?',
            'level = 8/9     index ?     radius ?',
            'k = 9     index ?     radius ?',
            'Where is the tenth observed score?',
          ][commandStep.value];
    return [
      place(mono(command, { size: 38, color: 'cyan' }), RAIL, 'top'),
      place(mono(result, { size: 37, color: 'yellow' }), FOOT),
    ];
  });
  const labels = group(
    ...rail.slots
      .slice(0, 9)
      .map((slot, i) => note('i=' + i, { size: 30 }).moveTo([slot.cx, rail.baseline + 128])),
  );
  const underline = dynamic(() =>
    rail.active.value < 0
      ? []
      : [
          line(
            [rail.x(rail.active.value) - 32, rail.baseline + 150],
            [rail.x(rail.active.value) + 32, rail.baseline + 150],
            { stroke: 'yellow', width: 4 },
          ),
        ],
  );
  const title = heading(c.title);
  s.add(title, readout);
  c.take([rail.frame, rail.sticks, ruler.frame, ruler.point, ruler.limit]);
  c.on('partition', () => commandStep.set(1));
  c.show('direct', [labels, underline], { after: true });
  c.after('direct', () => step.set(1));
  c.on('level', () => commandStep.set(2));
  c.after('higher', () => {
    rail.active.set(last.index);
    step.set(2);
  });
  c.on('max', () => commandStep.set(3));
  c.after('ninety', () => step.set(3));
  c.on('missing', () => commandStep.set(4));
  c.after('infinite', () => {
    rail.active.set(-1);
    step.set(4);
  });
  const sizeRows = area.inset('wide').rows(2, 'loose');
  const sizes = [9, 19].map((n, i) => {
    const region = sizeRows[i];
    const rank = Math.ceil((n + 1) * 0.95);
    const slots = region.columns(20, 'tight');
    return group(
      place(label(n + ' calibration scores · 95% target', { size: 43 }), region, 'top left'),
      ...slots
        .slice(0, n + 1)
        .map((slot, j) =>
          rect(slot.width * 0.84, 62, {
            fill: j === n ? null : 'cyan',
            stroke: j + 1 === rank ? 'yellow' : 'dim',
            width: j + 1 === rank ? 5 : 2,
            dash: j === n ? [5, 5] : undefined,
          }).moveTo([slot.cx, region.cy]),
        ),
      place(
        mono(
          'ceil(' +
            (n + 1) +
            ' × .95) = ' +
            rank +
            (rank > n ? '     no finite score' : '     observed score at rank 19'),
          { size: 39, color: 'yellow' },
        ),
        region,
        'bottom left',
      ),
    );
  });
  c.swapAll('samples', sizes[0], { keep: [title] });
  c.show('minimum', sizes[1], { after: true });
}
