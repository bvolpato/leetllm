import { arrow, boxOf, dot, draw, fitted, indicate, line, place, table, to } from 'vizmatic/stage';
import { label, namedBox, note, tint } from '../../kit-narrated.mjs';
import { MAIN, FOOT, open } from '../parts.mjs';

export default function channels(s, c) {
  open(s, c, 'intro');
  const [actorsBand, tracks, checksArea] = MAIN.rows([1, 2, 3], 'wide');
  const actorCells = actorsBand.columns(3, 'loose');
  const actors = ['client', 'supervisor', 'protected database'].map((name, i) =>
    place(
      namedBox(name, { width: actorCells[i].width, height: 100, color: i === 0 ? 'cyan' : 'dim' }),
      actorCells[i],
    ),
  );
  const trackRows = tracks.rows(3, 'normal');
  const ends = trackRows.map((r) => [
    [r.left, r.bottom],
    [r.right, r.bottom],
  ]);
  const rails = ends.map(([a, b], i) =>
    arrow(i === 1 ? b : a, i === 1 ? a : b, { stroke: 'grid', width: 3, pad: 10 }),
  );
  const names = [
    'HTTP turn → accepted case update',
    'SSE → client updates only',
    'worker → fencing check',
  ].map((words, i) => place(note(words), trackRows[i], 'top'));
  const packets = ends.map(([a]) => dot(14, 'cyan').moveTo(a));
  packets[1].moveTo(ends[1][1]);
  const checks = place(
    fitted(checksArea, (width) =>
      table(
        [
          { key: 'check', label: 'case clock' },
          { key: 'old', label: 'old worker', sample: 'REJECT', marks: true },
          { key: 'new', label: 'current owner', sample: 'accepted', marks: true },
        ],
        [
          { id: 'lease', check: 'lease', old: 'running', new: 'waiting' },
          { id: 'fence', check: 'token', old: 'older', new: 'newer' },
          {
            id: 'write',
            check: 'resource',
            old: { value: 'waiting', state: 'pending' },
            new: { value: 'waiting', state: 'pending' },
          },
        ],
        { width, size: 34 },
      ),
    ),
    checksArea,
  );
  const jobs = place(
    fitted(checksArea, (width) =>
      table(
        ['job', 'scope', { key: 'merge', sample: 'matched', marks: true }],
        [
          {
            id: 'policy',
            job: 'policy read',
            scope: 'region + version',
            merge: { value: 'waiting', state: 'pending' },
          },
          {
            id: 'invoice',
            job: 'invoice read',
            scope: 'customer + invoice',
            merge: { value: 'waiting', state: 'pending' },
          },
          {
            id: 'supervisor',
            job: 'supervisor',
            scope: 'accepted state',
            merge: { value: 'owner', state: 'pass' },
          },
        ],
        { width, size: 32 },
      ),
    ),
    checksArea,
  );
  const workers = [
    'old worker · older token',
    'new owner · newer token',
    'resource · no newer token',
  ].map((name, i) =>
    place(
      namedBox(name, { width: actorCells[i].width, height: 100, color: i === 2 ? 'blue' : 'cyan' }),
      actorCells[i],
    ),
  );
  const retained = place(
    namedBox('resource stores newer token', {
      width: actorCells[2].width,
      height: 100,
      color: 'blue',
    }),
    actorCells[2],
  );
  const tokenNames = [
    'newer token → resource',
    'lease expired · old worker still running',
    'older token → resource',
  ].map((words, i) => place(note(words, { color: i === 2 ? 'cyan' : 'dim' }), trackRows[i], 'top'));
  const compare = place(
    note('older token < retained newer token → reject', { color: 'red' }),
    trackRows[2],
    'top',
  );
  const newerPacket = dot(14, 'cyan').moveTo(ends[0][0]);
  const foot = place(note('Short transactions surround state transitions.'), FOOT);
  s.add(actors, rails, names, checks, foot);
  c.show('incoming-turn', packets[0]);
  c.on('incoming-turn', () =>
    s.play(to(packets[0], (n) => n.moveTo(ends[0][1]), { duration: 1.3 })),
  );
  c.show('outgoing-sse', packets[1]);
  c.on('outgoing-sse', () =>
    s.play(to(packets[1], (n) => n.moveTo(ends[1][0]), { duration: 1.3 })),
  );
  c.on('dedup-event', () => s.play(indicate(actors[1], { scale: 1, color: 'yellow' })));
  c.swap('lease-expiry', actors, workers);
  c.swap('lease-expiry', names, tokenNames);
  c.hide('lease-expiry', [packets[0], packets[1]]);
  c.on('lease-expiry', () =>
    s.play(
      checks.setCell('lease', 'old', { value: 'expired', state: 'fail' }),
      checks.setCell('lease', 'new', { value: 'acquired', state: 'pass' }),
    ),
  );
  c.on('fencing-token', () => s.play(checks.light('fence')));
  c.show('fencing-token', newerPacket);
  c.on('fencing-token', () =>
    s.play(to(newerPacket, (n) => n.moveTo(ends[0][1]), { duration: 0.6 })),
  );
  c.swap('fencing-token', workers[2], retained, { after: true });
  c.after('fencing-token', () =>
    s.play(checks.setCell('write', 'new', { value: 'accepted', state: 'pass' })),
  );
  c.show('reject-fence', packets[2]);
  c.on('reject-fence', () =>
    s.play(to(packets[2], (n) => n.moveTo(ends[2][1]), { duration: 0.8 })),
  );
  c.swap('reject-fence', tokenNames[2], compare, { after: true });
  c.after('reject-fence', () =>
    s.play(
      checks.setCell('write', 'old', { value: 'REJECT', state: 'fail' }),
      checks.setCell('write', 'new', { value: 'accepted', state: 'pass' }),
      to(packets[2], (n) => n.moveTo(ends[2][0]), { duration: 0.8 }),
    ),
  );
  c.swap('scoped-jobs', checks, jobs);
  c.swap(
    'scoped-jobs',
    [workers[0], workers[1], retained, tokenNames[0], tokenNames[1], compare],
    [actors, names],
  );
  c.hide('scoped-jobs', [newerPacket, packets[2]]);
  c.on('merge-jobs', () =>
    s.play(
      jobs.setCell('policy', 'merge', { value: 'matched', state: 'pass' }),
      jobs.setCell('invoice', 'merge', { value: 'matched', state: 'pass' }),
    ),
  );
  c.clear(rails, 0.46, 0.2);
}
