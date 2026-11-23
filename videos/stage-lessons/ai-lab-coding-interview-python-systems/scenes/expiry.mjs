import { assertEqual, dot, line, place, table, to } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, context, expiryState } from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);
  const before = expiryState(14.999);
  const at = expiryState(15);
  assertEqual(before.value, 'running', 'last millisecond');
  assertEqual(at.value, null, 'deadline equality');
  const [writeBand, stateBand, rulerBand] = BOARD.rows([1, 3.6, 2.3], 'wide');
  const write = place(mono('write at 10 s    +    lifetime 5 s', { size: 47 }), writeBand);
  const deadline = place(
    mono('10 s    +    5 s    =    ' + at.expiresAt + ' s', { size: 47 }),
    writeBand,
  );
  const [storeArea, readsArea] = stateBand.columns([1, 1], 'loose');
  const entry = place(
    table(
      [
        { key: 'key', label: 'stored key' },
        { key: 'value', label: 'value', sample: 'running' },
        { key: 'deadline', label: 'expires at', sample: '15.000' },
      ],
      [],
      { width: storeArea.width, maxRows: 2, size: 35, leading: 2.3 },
    ),
    storeArea,
  );
  const results = place(
    table(
      [
        { key: 'time', label: 'get at time', sample: '14.999 s' },
        { key: 'returns', label: 'returns', sample: 'running' },
      ],
      [],
      { width: readsArea.width, maxRows: 2, size: 36, leading: 2.25 },
    ),
    readsArea,
  );
  const [, rail, below] = rulerBand.rows([1, 0.5, 1], 'normal');
  const ticks = [before, at].map((read, i) => {
    const x = rail.left + rail.width * (i ? 0.69 : 0.31);
    return {
      read,
      x,
      tick: line([x, rail.cy - 22], [x, rail.cy + 22], { stroke: i ? 'pink' : 'dim', width: 4 }),
      text: mono(read.now.toFixed(3) + ' s' + (i ? '   deadline' : ''), {
        size: 40,
        color: i ? 'pink' : 'ink',
      }).moveTo([x, below.cy]),
    };
  });
  const scale = [
    line([rail.left + rail.width * 0.13, rail.cy], [rail.right - rail.width * 0.13, rail.cy], {
      stroke: 'grid',
      width: 5,
    }),
    ...ticks.flatMap((t) => [t.tick, t.text]),
  ];
  const marker = dot(14, 'yellow').moveTo([ticks[0].x, rail.cy]);
  const prompt = place(label('What does get("task:1") return now?', { color: 'yellow' }), FOOT);
  const rule = place(mono('expires_at <= now', { color: 'pink' }), FOOT);
  s.add(write, entry, results);
  c.after('expiry-write', () =>
    s.play(entry.append([{ id: 'task', key: 'task:1', value: 'running', deadline: '?' }])),
  );
  c.swap('expiry-deadline', write, deadline, { after: true });
  c.after('expiry-deadline', () =>
    s.play(entry.setCell('task', 'deadline', at.expiresAt.toFixed(3))),
  );
  c.show('expiry-before', [scale, marker]);
  c.after('expiry-first-read', () =>
    s.play(results.append([{ id: 'first', time: '14.999 s', returns: before.value }])),
  );
  c.on('expiry-step', () =>
    s.play(to(marker, (n) => n.moveTo([ticks[1].x, rail.cy]), { duration: 0.7 })),
  );
  c.after('expiry-step', () =>
    s.play(results.append([{ id: 'next', time: '15.000 s', returns: '?' }])),
  );
  c.show('expiry-question', prompt);
  c.hide('expiry-miss', prompt);
  c.after('expiry-miss', () =>
    s.play(entry.remove(['task']), results.setCell('next', 'returns', 'None')),
  );
  c.show('expiry-remove', rule);
}
