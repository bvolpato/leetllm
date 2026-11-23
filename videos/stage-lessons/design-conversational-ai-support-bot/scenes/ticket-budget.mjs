import { assertEqual, boxOf, dynamic, fitted, line, place, rect, table } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { MAIN, FOOT, open, supportCost } from '../parts.mjs';

export default function budget(s, c) {
  open(s, c, 'handoff');
  const INPUT = { first: [2000, 1280, 130], revision: [2170, 1920, 130], fallback: [2000, 0, 130] };
  const RATE = { fresh: 2.5, cached: 0.25, output: 15 },
    CAP = 0.02,
    GENERATION_CAP = CAP / 2;
  const first = supportCost(...INPUT.first),
    revision = supportCost(...INPUT.revision),
    fallback = supportCost(...INPUT.fallback);
  const bill = first.total + revision.total,
    reservedFallback = first.reserve + fallback.total;
  const TIME = { reads: 180, draft: 940, check: 10, fallback: 1100, deadline: 2500 };
  const normalTime = TIME.reads + 2 * (TIME.draft + TIME.check);
  const fallbackTime = TIME.reads + TIME.draft + TIME.fallback + TIME.check;
  const monthly = revision.total * 50 * 30;
  const near = (a, b, name) => assertEqual(Math.abs(a - b) < 1e-12, true, name);
  near(first.total, 0.00407, 'The first bill matches the narration.');
  near(revision.total, 0.003055, 'The revision bill matches the narration.');
  near(bill, 0.007125, 'The two-draft total matches.');
  near(reservedFallback, 0.01645, 'Timeout reservation plus fallback charge.');
  near(first.freshCost, (first.fresh * RATE.fresh) / 1e6, 'Fresh input has its own rate.');
  assertEqual(normalTime, 2080, 'The normal request time.');
  assertEqual(TIME.deadline - normalTime, 420, 'The deadline margin.');
  assertEqual(fallbackTime, 2230, 'The fallback request time.');
  const dollars = (n) => '$' + n.toFixed(6);
  const [formulaArea, ledgerArea, barArea, summaryArea] = MAIN.rows([0.6, 3.7, 2.6, 0.7], 'normal');
  const productRule = place(
    note(
      'fresh × ' +
        RATE.fresh.toFixed(2) +
        ' + cached × ' +
        RATE.cached +
        ' + output × ' +
        RATE.output,
      { color: 'yellow' },
    ),
    formulaArea,
  );
  const sumRule = place(
    note(
      '(fresh × ' +
        RATE.fresh.toFixed(2) +
        ' + cached × ' +
        RATE.cached +
        ' + output × ' +
        RATE.output +
        ') ÷ 1M → USD',
      { color: 'yellow' },
    ),
    formulaArea,
  );
  const rows = [
    ['input', 'total − cached = fresh', 'tokens'],
    ['cached', 'cached reads', '$' + RATE.cached + '/M'],
    ['fresh', 'fresh input', '$' + RATE.fresh.toFixed(2) + '/M'],
    ['output', 'output', '$' + RATE.output + '/M'],
    ['bill', 'charge USD', 'sum / 1M'],
    ['reserve', 'reserve USD', 'fresh + 300 out'],
  ];
  const ledger = place(
    fitted(ledgerArea, (width) =>
      table(
        [
          { key: 'category' },
          { key: 'rate' },
          { key: 'first', label: 'first draft', sample: '1920 × 0.25 = 480', marks: true },
          { key: 'revision', label: 'revision', sample: '1920 × 0.25 = 480', marks: true },
        ],
        rows.map(([id, category, rate]) => ({
          id,
          category,
          rate,
          first: { value: '', state: 'pending' },
          revision: { value: '', state: 'pending' },
        })),
        { width, size: 30, leading: 1.5 },
      ),
    ),
    ledgerArea,
  );
  const [scaleArea, chargesArea, reserveArea] = barArea.rows([0.7, 1, 1], 'tight');
  const barRows = [chargesArea, reserveArea];
  const scaleCells = scaleArea.columns(3, 'normal');
  const scale = [
    place(note('$0'), scaleCells[0], 'left'),
    place(note('$' + GENERATION_CAP.toFixed(2), { color: 'dim' }), scaleCells[1]),
    place(note('$' + CAP.toFixed(2) + ' / task', { color: 'yellow' }), scaleCells[2], 'right'),
  ];
  const ceilingMarks = barRows.flatMap((r) =>
    [r.cx, r.right].map((x) => line([x, r.bottom - 34], [x, r.bottom + 2], { stroke: 'yellow' })),
  );
  const segmentLegend = place(
    note('cyan: attempt 1 · green: attempt 2', { color: 'cyan' }),
    chargesArea,
    'top right',
  );
  const reserveLegend = place(
    note('A1 reserved + A2 reserved', { color: 'yellow' }),
    reserveArea,
    'top right',
  );
  const fallbackLegend = place(
    note('A1 reserved + A2 charged', { color: 'yellow' }),
    reserveArea,
    'top right',
  );
  const amounts = [s.value(0), s.value(0)],
    reservations = [s.value(0), s.value(0)];
  const names = ['known charges', 'amount counted toward task cap'].map((words, i) =>
    place(note(words, { color: i ? 'yellow' : 'cyan' }), barRows[i], 'top left'),
  );
  const bars = dynamic(() =>
    [amounts, reservations].flatMap((values, i) => {
      const row = barRows[i],
        y = row.bottom - 16,
        width = row.width;
      let offset = 0;
      return [
        rect(width, 28, { fill: 'surface', stroke: 'dim', radius: 4 }).moveTo([row.cx, y]),
        ...values.flatMap((value, j) => {
          const span = (value.value / CAP) * width,
            start = offset;
          offset += span;
          return span > 0.01
            ? [
                rect(span, 28, { fill: j ? 'green' : 'cyan', stroke: 'bg' }).moveTo([
                  row.left + start + span / 2,
                  y,
                ]),
              ]
            : [];
        }),
      ];
    }),
  );
  const fallbackHeader = place(label('fallback', { size: 30 }), boxOf(ledger.header('revision')));
  const cap = place(
    note(
      '$0.01 per generation  ·  $0.02 per ticket  ·  2 attempts  ·  2500 ms  ·  300 output tokens per call',
    ),
    FOOT,
  );
  const priceQuestion = place(label('Which draft costs less?', { color: 'yellow' }), summaryArea);
  const total = place(
    label('Token charges for both drafts   ' + dollars(bill), { color: 'yellow' }),
    summaryArea,
  );
  const time = place(
    label(
      '180 + 2 × (940 + 10) = ' +
        normalTime +
        ' ms   ·   ' +
        (TIME.deadline - normalTime) +
        ' ms left',
      { size: 35, color: 'cyan' },
    ),
    summaryArea,
  );
  const month = place(
    label(
      '50/day × 30 days × $' + revision.total.toFixed(6) + '/revision ≈ $' + monthly.toFixed(2),
      { color: 'yellow', size: 36 },
    ),
    summaryArea,
  );
  const unknown = place(
    label('Timeout usage unknown: keep ' + dollars(first.reserve), { color: 'yellow', size: 36 }),
    summaryArea,
  );
  const fallbackTotal = place(
    label('Reserved + charged = ' + dollars(reservedFallback), { color: 'yellow', size: 36 }),
    summaryArea,
  );
  const fallbackClock = place(
    label(fallbackTime + ' / ' + TIME.deadline + ' ms · both attempts used', {
      color: 'cyan',
      size: 36,
    }),
    summaryArea,
  );
  s.add(ledger, bars, names, cap, scale, ceilingMarks, segmentLegend, reserveLegend);
  const tokens = (column, model, input) =>
    s.play(
      ...[
        ['input', input[0] + ' − ' + input[1] + ' = ' + model.fresh],
        ['cached', input[1] + ' × ' + RATE.cached + ' = ' + input[1] * RATE.cached],
        ['fresh', model.fresh + ' × ' + RATE.fresh + ' = ' + model.fresh * RATE.fresh],
        ['output', input[2] + ' × ' + RATE.output + ' = ' + input[2] * RATE.output],
      ].map(([id, value]) => ledger.setCell(id, column, { value, state: null })),
    );
  c.on('budget-inputs', () => s.play(ledger.light(null, 'rate')));
  c.on('fresh-minus-cache', () => s.play(ledger.light('fresh')));
  c.show('multiply-products', productRule, { after: true });
  c.swap('add-products', productRule, sumRule, { after: true });
  c.after('first-tokens', () => tokens('first', first, INPUT.first));
  c.after('first-bill', () =>
    s.play(
      ledger.setCell('bill', 'first', { value: dollars(first.total), state: 'pass' }),
      amounts[0].to(first.total, { duration: 0.8 }),
    ),
  );
  c.after('revision-tokens', () => tokens('revision', revision, INPUT.revision));
  c.show('budget-question', priceQuestion);
  c.hide('revision-bill', priceQuestion);
  c.after('revision-bill', () =>
    s.play(
      ledger.setCell('bill', 'revision', { value: dollars(revision.total), state: 'pass' }),
      amounts[1].to(revision.total, { duration: 0.8 }),
    ),
  );
  c.show('total-bill', total, { after: true });
  c.after('reserve-bill', () =>
    s.play(
      ledger.setCell('reserve', 'first', { value: dollars(first.reserve), state: 'pass' }),
      ledger.setCell('reserve', 'revision', { value: dollars(revision.reserve), state: 'pass' }),
      reservations[0].to(first.reserve, { duration: 0.8 }),
      reservations[1].to(revision.reserve, { duration: 0.8 }),
    ),
  );
  c.swap('budget-time', total, time, { after: true });
  c.swap('monthly-bill', time, month, { after: true });
  c.swap('unknown-reserve', month, unknown, { after: true });
  c.swap('unknown-reserve', reserveLegend, fallbackLegend);
  c.swap('unknown-reserve', ledger.header('revision'), fallbackHeader);
  c.on('unknown-reserve', () =>
    s.play(
      ...['input', 'cached', 'fresh', 'output', 'bill'].map((id) =>
        ledger.setCell(id, 'revision', { value: '', state: 'pending' }),
      ),
      ...['cached', 'fresh', 'output'].map((id) =>
        ledger.setCell(id, 'first', { value: 'unknown', state: 'warn' }),
      ),
      ledger.setCell('input', 'first', { value: INPUT.first[0] + ' − ? = ?', state: null }),
      amounts[0].to(0),
      amounts[1].to(0),
      reservations[1].to(0),
      ledger.setCell('bill', 'first', { value: 'unknown', state: 'warn' }),
      ledger.setCell('reserve', 'revision', { value: '', state: 'pending' }),
    ),
  );
  c.after('fallback-bill', () => {
    tokens('revision', fallback, INPUT.fallback);
    s.play(
      ledger.setCell('bill', 'revision', { value: dollars(fallback.total), state: 'pass' }),
      amounts[1].to(fallback.total),
      reservations[1].to(fallback.total),
    );
  });
  c.swap('fallback-total', unknown, fallbackTotal, { after: true });
  c.swap('fallback-time', fallbackTotal, fallbackClock, { after: true });
}
