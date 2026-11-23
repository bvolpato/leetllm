import { assertEqual, place, table } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, context, expiryState } from '../parts.mjs';

function writerTrace(atomic) {
  const expected = null;
  const writes = { A: 'ready', B: 'queued' };
  let current = expiryState(15).value;
  const matched = {},
    success = {};
  const order = atomic ? ['A?', 'A!', 'B?', 'B!'] : ['A?', 'B?', 'B!', 'A!'];
  return order.map(([worker, op]) => {
    if (op === '?') matched[worker] = current === expected;
    else {
      success[worker] = matched[worker];
      if (success[worker]) current = writes[worker];
    }
    return { current, success: { ...success } };
  });
}

export default function scene(s, c) {
  context(s, c);
  const [top, middle, lower] = BOARD.rows([1, 3, 1], 'normal');
  const calls = [
    { id: 'first', expected: 'None', next: 'running' },
    { id: 'again', expected: 'None', next: 'ready' },
    { id: 'third', expected: 'running', next: 'ready' },
  ];
  const trial = place(
    table(
      [
        { key: 'expected', label: 'expected' },
        { key: 'next', label: 'replacement' },
        { key: 'result', label: 'returned' },
      ],
      calls,
      { width: middle.width * 0.76, size: 44, maxRows: 3, leading: 1.65 },
    ),
    middle,
  );
  const simple = place(label('AtomicStore    •    no expiry'), top);
  s.add(trial, simple);
  let previous = 'None';
  for (const [i, cue] of ['cas-first', 'cas-repeat', 'cas-third'].entries()) {
    const ok = previous === calls[i].expected;
    if (ok) previous = calls[i].next;
    c.after(cue, () =>
      s.play(trial.setCell(calls[i].id, 'result', ok ? 'True' : 'False', { duration: 0.4 })),
    );
  }

  const stamp = place(
    mono('TTL design    •    now 15 s    •    both writers expect None', { size: 40 }),
    top,
  );
  const writers = place(
    table(
      [
        { key: 'writer', label: 'writer' },
        { key: 'next', label: 'wants to write' },
        { key: 'read', label: 'saw', sample: 'missing' },
        { key: 'result', label: 'returned', sample: 'False' },
      ],
      [
        { id: 'A', writer: 'A', next: 'ready' },
        { id: 'B', writer: 'B', next: 'queued' },
      ],
      { width: middle.width * 0.78, size: 42, maxRows: 2, leading: 2.15 },
    ),
    middle,
  );
  const record = (word) => place(mono('task:1     ' + word, { size: 47, color: 'cyan' }), lower);
  const old = record('running     |     expires 15 s');
  const missing = record('missing');
  const split = writerTrace(false);
  const locked = writerTrace(true);
  assertEqual(Object.values(split.at(-1).success).filter(Boolean).length, 2, 'split comparison');
  assertEqual(Object.values(locked.at(-1).success).filter(Boolean).length, 1, 'atomic comparison');
  const bValue = record(split[2].current + '     |     permanent');
  const aValue = record(locked[1].current + '     |     permanent');
  const foot = (v, color) => place(label(v, { color }), FOOT);
  const gap = foot('Lock released after the comparison', 'yellow');
  const question = foot('Whose successful write will disappear?', 'yellow');
  const owner = foot('A holds the lock', 'yellow');
  c.swap('cas-reset', [trial, simple], [stamp, writers, old]);
  c.swap('cas-clean', old, missing, { after: true });
  c.after('cas-clean', () => s.play(writers.setCell('A', 'read', 'missing')));
  c.show('cas-gap', gap);
  c.swap('cas-b-write', missing, bValue, { after: true });
  c.after('cas-b-write', () =>
    s.play(writers.setCell('B', 'read', 'missing'), writers.setCell('B', 'result', 'True')),
  );
  c.swap('cas-question', gap, question);
  c.hide('cas-stale', question);
  c.swap('cas-stale', bValue, aValue, { after: true });
  c.after('cas-stale', () => s.play(writers.setCell('A', 'result', 'True')));

  c.swap('cas-replay', aValue, [old, owner]);
  c.on('cas-replay', () =>
    s.play(
      ...['A', 'B'].flatMap((id) =>
        ['read', 'result'].map((key) => writers.setCell(id, key, null, { duration: 0.25 })),
      ),
    ),
  );
  c.swap('cas-atomic-clean', old, missing, { after: true });
  c.after('cas-atomic-clean', () => s.play(writers.setCell('A', 'read', 'missing')));
  c.swap('cas-atomic-write', missing, aValue, { after: true });
  c.after('cas-atomic-write', () => s.play(writers.setCell('A', 'result', 'True')));
  c.hide('cas-atomic-write', owner, { after: true });
  c.after('cas-deny', () =>
    s.play(
      writers.setCell('B', 'read', locked[3].current),
      writers.setCell('B', 'result', 'False'),
    ),
  );

  const snap = place(mono('snapshot     ready', { size: 47, color: 'pink' }), middle);
  const heading = place(label('Read the same snapshot after a later write'), top);
  c.swap('cas-snapshot', [writers, stamp], [snap, heading]);
  c.swap('cas-later', aValue, record('running     |     permanent'), { after: true });
}
