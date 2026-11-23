import { column, dot, dynamic, place, rect, row } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, CATALOG, BINARY_TRACE } from '../parts.mjs';
import { binarySearchTrace } from '../../../films/algorithm-complexity/fixtures.mjs';
export default function ordered(s, c) {
  const [catalog, work] = PICTURE.columns([1, 1], 'loose');
  const rows = catalog.rows(9, 'tight');
  const [target, formula, bounds, ledger, result] = work.rows([1, 1, 1, 2, 1], 'normal');
  const step = s.value(0),
    replay = s.value(0),
    narrowed = s.value(0),
    shift = s.value(0);
  const other = binarySearchTrace(CATALOG, CATALOG[0]);
  const current = () => {
    const trace = replay.value ? other : BINARY_TRACE;
    if (narrowed.value) {
      const previous = other[other.length - 2];
      return { lo: previous.nextLo, hi: previous.nextHi, mid: null };
    }
    return Math.round(step.value)
      ? trace[Math.min(trace.length - 1, Math.round(step.value) - 1)]
      : { lo: 0, hi: CATALOG.length, mid: null };
  };
  const keys = dynamic(() =>
    CATALOG.flatMap((key, i) => {
      const r = current(),
        offset = i >= 3 ? shift.value : 0;
      const center = rows[i].point('center');
      const y = center[1] + offset * (rows[1].cy - rows[0].cy);
      const active = shift.value > 0 ? i >= 3 : i >= r.lo && i < r.hi;
      return [
        rect(rows[i].width, rows[i].height, {
          fill: 'surface',
          stroke: active ? 'blue' : 'grid',
          width: 2,
        }).moveTo([center[0], y]),
        mono(i + (i >= 3 ? Math.floor(shift.value) : 0) + '  ' + key, {
          size: 34,
          color: active ? 'cyan' : 'dim',
        }).moveTo([center[0], y]),
      ];
    }),
  );
  const cursor = dynamic(() => {
    const r = current();
    if (r.mid === null || shift.value > 0) return [];
    const b = rows[r.mid];
    return [dot(11, 'yellow').moveTo([b.right + 22, b.cy])];
  });
  const q = dynamic(() => [
    place(mono('find ' + (replay.value ? CATALOG[0] : 'issuer-check'), { color: 'cyan' }), target),
  ]);
  const mid = place(mono('mid = floor((lo + hi) / 2)', { size: 36 }), formula);
  const values = dynamic(() => {
    const r = current();
    return place(
      row(
        [
          mono('lo ' + r.lo),
          mono('hi ' + r.hi),
          mono('mid ' + (r.mid ?? '?'), { color: 'yellow' }),
        ],
        { gap: 'wide' },
      ),
      bounds,
    ).nodes;
  });
  const trail = dynamic(() => {
    const trace = replay.value ? other : BINARY_TRACE;
    return place(
      column(
        [
          note(replay.value ? 'Separate search for index zero' : 'Issuer-note search'),
          mono(
            trace
              .slice(0, Math.round(step.value))
              .map((r) => r.mid)
              .join(' → ') || '?',
            { color: 'yellow' },
          ),
        ],
        { gap: 'wide' },
      ),
      ledger,
    ).nodes;
  });
  const count = dynamic(() => [
    place(mono(Math.round(step.value) + ' midpoint checks', { color: 'yellow' }), result),
  ]);
  const moveCount = dynamic(() => [
    place(
      mono(shift.value < 1 ? 'Moving 5 references' : '5 references moved', { color: 'yellow' }),
      result,
    ),
  ]);
  const incoming = place(mono('insert identity-provider', { color: 'green' }), target);
  const moveFrom = place(label('Old slots 3 through 7'), formula);
  const moveTo = place(label('New slots 4 through 8'), bounds);
  const filled = place(mono('Slot 3 is filled', { color: 'green' }), ledger);
  const added = [
    rect(rows[3].width, rows[3].height, { fill: 'surface', stroke: 'green', width: 2 }).moveTo(
      rows[3].point('center'),
    ),
    place(mono('3  identity-provider', { size: 34, color: 'green' }), rows[3]),
  ];
  const bound = place(label('Sorted + random access + bounded comparisons → O(log n)'), FOOT);
  const insertion = place(label('Array insertion shifts later references: O(n)'), FOOT);
  s.add(heading(c.title), keys, cursor, q, mid, values, trail, count);
  c.on('binary-first', () => s.play(step.to(1), { duration: 0.6 }));
  c.on('binary-rest', () => s.play(step.to(2), { duration: 0.5 }));
  c.on('binary-last', () => s.play(step.to(3), { duration: 0.5 }));
  c.show('binary-bound', bound);
  c.on('binary-replay', () => {
    replay.set(1);
    step.set(0);
    s.play(step.to(other.length - 1), { duration: 2.4 });
  });
  c.on('binary-narrow', () => narrowed.set(1));
  c.on('binary-final-key', () => {
    narrowed.set(0);
    step.set(other.length);
  });
  c.swap('binary-insert', q, incoming);
  c.swap('binary-insert', mid, moveFrom);
  c.swap('binary-insert', values, moveTo);
  c.swap('binary-insert', count, moveCount);
  c.hide('binary-insert', trail);
  c.on('binary-insert', () => s.play(shift.to(1), { duration: 2 }));
  c.show('binary-new', added, { after: true });
  c.show('binary-new', filled, { after: true });
  c.swap('binary-new', bound, insertion, { after: true });
}
