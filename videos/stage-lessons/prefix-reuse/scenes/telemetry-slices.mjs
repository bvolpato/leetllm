import { assertEqual, beside, boxOf, draw, polyline } from 'vizmatic/stage';
import { note } from '../../kit-narrated.mjs';
import { board, body, fmt, gauge, guide, ledger, readings } from '../parts.mjs';

export default function telemetrySlices(s, c) {
  board(s, c, 'How much did each hit actually read?', 'Telemetry · credited input tokens');
  const total = guide + ledger.rows[0].tail,
    small = 600;
  const percent = (n, d) => fmt((100 * n) / d) + '%';
  assertEqual(percent(guide + small, 2 * total), '54.6%', 'The v7 yield uses both requests.');
  const bands = body.rows(4, 'normal');
  const bars = bands.slice(0, 3).map((r, i) =>
    gauge(
      r,
      ['v6 · Trace A', 'v7 · Trace B', 'v7 · Trace C'][i],
      [
        ['read', 0, 'green'],
        ['fresh', 0, 'cyan'],
      ],
      total,
    ),
  );
  const combined = gauge(
    bands[3],
    'v7 combined',
    [
      ['read', 0, 'green'],
      ['fresh', 0, 'cyan'],
    ],
    2 * total,
    { height: 44 },
  );
  const start = boxOf(bars[1].legend),
    end = boxOf(bars[2].legend);
  const x = Math.max(start.right, end.right) + 26;
  const grouping = polyline(
    [
      [x, start.cy],
      [x + 14, start.cy],
      [x + 14, end.cy],
      [x, end.cy],
    ],
    { stroke: 'yellow', width: 4 },
  );
  const tally = beside(
    note(
      fmt(guide) +
        ' + ' +
        fmt(small) +
        ' = ' +
        fmt(guide + small) +
        ' read  /  ' +
        fmt(2 * total) +
        ' input',
    ),
    combined.bar,
    'under',
    'tight',
    'left',
  );
  const result = beside(
    note(percent(guide + small, 2 * total), { color: 'green', size: 36 }),
    combined.bar,
    'under',
    'tight',
    'right',
  );
  const shares = [guide, guide, small].map((n, i) =>
    beside(note(percent(n, total) + ' read', { color: 'green', size: 34 }),
      bars[i].bar, 'under', 'tight', 'right'));
  s.add(bars.map((g) => g.nodes));
  const measure = (i, n) => bars[i].bar.resize({ read: n, fresh: total - n });
  c.after('yield-large', () => s.play(measure(0, guide)));
  c.after('yield-small', () => s.play(measure(2, small)));
  c.show('yield-a-percent', shares[0], { after: true });
  c.show('yield-c-percent', shares[2], { after: true });
  c.on('yield-versions', () => s.play(measure(1, guide), draw(grouping), { duration: 0.65 }));
  c.show('yield-versions', shares[1], { after: true });
  c.show('yield-weighted', combined.nodes);
  c.on(
    'yield-weighted',
    () =>
      s.play(combined.bar.resize({ read: guide, fresh: total - guide }), {
        duration: 0.64,
      }),
    0.32,
  );
  c.on(
    'yield-weighted',
    () =>
      s.play(combined.bar.resize({ read: guide + small, fresh: 2 * total - guide - small }), {
        duration: 0.64,
      }),
    1.24,
  );
  c.show('yield-weighted', [tally, result], { after: true });
  readings(s, c, 'One sample contains ' + fmt(total) + ' input tokens.', [
    ['yield-large', 'Trace A · ' + fmt(guide) + ' read of ' + fmt(total)],
    ['yield-small', 'Trace C · ' + fmt(small) + ' read of ' + fmt(total)],
    ['yield-rule', 'Add the read tokens and divide by all input tokens in the group.', 'ink', 'yield-versions'],
    ['yield-versions', 'Version 7 combines traces B and C.'],
    [
      'yield-weighted',
      'v6 · 1 hit   ' +
        percent(guide, total) +
        '     /     v7 · 2 hits   ' +
        percent(guide + small, 2 * total),
    ],
    ['yield-slice', 'Group by route, model, version, scope, and worker.'],
    ['yield-phases', 'Compare yield with queue, prefill, decode, completion, and price.'],
    ['yield-accounting', 'Returned usage determines the credited read.'],
  ]);
}
