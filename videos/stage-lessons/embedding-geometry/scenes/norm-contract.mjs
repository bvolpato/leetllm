import { METRICS } from '../../../films/embedding-geometry/fixtures.mjs';
import { area, heading, label, mono, note, chip, tint } from '../../kit-narrated.mjs';
import {
  table,
  place,
  row,
  column,
  arrayCells,
  numberLine,
  barChart,
  axes,
  dynamic,
  group,
  rect,
  line,
  dot,
  arrow,
  draw,
  indicate,
  to,
  fade,
  morph,
  assertEqual,
} from 'vizmatic/stage';
import { robustUnit, cosine, scalarEncode } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function normContract(s, c) {
  const [main, foot] = area.rows([6, 2], 'wide');
  const unit = robustUnit([1e300, 1e300]);
  assertEqual(unit.join(','), robustUnit([1e-300, 1e-300]).join(','), 'same extreme direction');
  assertEqual(Math.round(unit[0] * 1000), 707, 'equal direction');
  const tab = place(
    table(
      [
        { key: 'input', label: 'input' },
        { key: 'scaled', label: 'divide by max', sample: '1, 1' },
        { key: 'unit', label: 'unit direction', sample: '0.707, 0.707' },
        { key: 'status', label: 'path', sample: 'reject nonfinite', marks: true },
      ],
      [
        { id: 'large', input: '10³⁰⁰, 10³⁰⁰', scaled: null, unit: null, status: null },
        { id: 'small', input: '10⁻³⁰⁰, 10⁻³⁰⁰', scaled: null, unit: null, status: null },
        { id: 'zero', input: '0, 0', scaled: null, unit: null, status: null },
        { id: 'bad', input: 'empty / nonfinite', scaled: null, unit: null, status: null },
      ],
      { size: 36, width: main.width },
    ),
    main,
  );
  const chart = place(
    barChart(
      [
        { label: 'A', value: METRICS[0].cosine, color: 'green' },
        { label: 'B', value: METRICS[1].cosine, color: 'pink' },
      ],
      { width: 700, height: 130, max: 3, labelSize: 34, showValues: false, horizontal: true },
    ),
    foot.columns([1, 1])[0],
  );
  const caption = place(
    column([label('Fixed unit guides'), note('Dot each guide with the same query')], {
      gap: 'normal',
    }),
    foot.columns([1, 1])[1],
  );
  s.add(heading(c.title), tab);
  c.show(2, [chart, caption]);
  c.after('invalid', () =>
    s.play(
      tab.setCell('zero', 'status', { value: 'reject zero', state: 'fail' }),
      tab.setCell('bad', 'status', { value: 'invalid input', state: 'fail' }),
      { duration: 0.5 },
    ),
  );
  c.on('scale', () =>
    s.play(...['large', 'small'].map((id) => tab.setCell(id, 'scaled', { value: '1, 1' })), {
      duration: 0.6,
    }),
  );
  c.after('result', () =>
    s.play(
      ...['large', 'small'].map((id) =>
        tab.setCell(id, 'unit', { value: unit.map((v) => v.toFixed(3)).join(', ') }),
      ),
      { duration: 0.6 },
    ),
  );
  c.on('factor', () =>
    s.play(
      chart.update(
        METRICS.map((r) => r.cosine * 2),
        { duration: 2 },
      ),
    ),
  );
  c.on('contract', () => s.play(indicate(caption, { scale: 1 })));
}
