import { assertEqual, column, place, table } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function deployment(s, c) {
  const rows = 50_000_000,
    width = 768,
    gb = (bytes) => bytes / 1e9;
  const originals = gb(rows * width * 4),
    codes = gb(rows * width);
  assertEqual(originals + codes, 192, 'retained vectors and scalar codes in decimal GB');
  const [top, middle, bottom] = area.rows([1, 4, 1.5], 'wide');
  const [data, costs] = middle.columns([1.1, 1], 'loose');
  const setting = place(
    label('50 million rows    ·    768 coordinates    ·    p99 budget 60 ms'),
    top,
  );
  const contract = place(
    column(
      [
        label('Same in both runs', { size: 42 }),
        note('Encoder version and width'),
        note('Unit query and unit original vectors'),
        note('Allowed rows and judged queries'),
      ],
      { gap: 'normal' },
    ),
    data,
    'left',
  );
  const bill = place(
    table(
      [
        { key: 'store', label: 'Vector payload' },
        { key: 'size', label: 'GB', sample: '192.0' },
      ],
      [
        { id: 'orig', store: 'Retained FP32', size: originals.toFixed(1) },
        { id: 'code', store: 'Added INT8', size: null },
        { id: 'both', store: 'Both stores', size: null },
      ],
      { size: 39, width: costs.width },
    ),
    costs,
  );
  const first = place(note('Exact reference    ·    scan eligible originals'), bottom);
  const second = place(
    note('Candidate    ·    search eligible codes, then fetch and rescore survivors'),
    bottom,
  );
  const ask = place(label('Does this fit the 60 ms deadline?', { color: 'yellow' }), bottom);
  const missing = place(
    column(
      [
        label('Measure end-to-end p99', { color: 'yellow', size: 43 }),
        mono('search + fetch + rescore + other request time', { size: 34 }),
      ],
      { gap: 'tight' },
    ),
    bottom,
  );
  s.add(heading(c.title), setting, contract, bill, first);
  c.swap('candidate', first, second);
  c.after('code', () =>
    s.play(bill.setCell('code', 'size', { value: codes.toFixed(1) }), { duration: 0.4 }),
  );
  c.after('retained', () =>
    s.play(
      bill.setCell('both', 'size', {
        value: (originals + codes).toFixed(1),
      }),
      { duration: 0.4 },
    ),
  );
  c.swap('ask', second, ask);
  c.swap('time', ask, missing, { after: true });
}
