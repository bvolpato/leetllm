import { assertEqual, place, table } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, SCHEDULE_BLOCKED, SCHEDULE_RETRY, context } from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);
  const [budget, board, history] = BOARD.rows([0.65, 2.75, 1], 'normal');
  const status = place(
    table(
      [
        { key: 'task', label: 'task' },
        { key: 'priority', label: 'priority' },
        { key: 'remaining', label: 'unmet dependencies' },
        { key: 'calls', label: 'attempts' },
        { key: 'state', label: 'state', sample: 'retry available' },
      ],
      [
        { id: 'docs', task: 'docs', priority: 1, remaining: 0, calls: 0, state: 'ready' },
        { id: 'test', task: 'test', priority: 2, remaining: 0, calls: 0, state: 'ready' },
        { id: 'deploy', task: 'deploy', priority: 3, remaining: 1, calls: 0, state: 'waiting' },
      ],
      { width: board.width * 0.9, size: 41, maxRows: 3, leading: 2 },
    ),
    board,
  );
  const limit = (n) => place(mono('Attempt cap = ' + n, { size: 46, color: 'yellow' }), budget);
  const cap2 = limit(2),
    cap1 = limit(1);
  const log = (names) =>
    place(
      mono('Calls to run    ' + (names.join('  →  ') || '[]'), { color: 'cyan', size: 42 }),
      history,
    );
  const calls = SCHEDULE_RETRY.snapshots.map((snap) => log(snap.executed));
  assertEqual(SCHEDULE_BLOCKED.executed.join(' '), 'docs test', 'one-attempt run');
  assertEqual(SCHEDULE_RETRY.attempts.deploy, 1, 'dependent runs once');
  const cell = (id, field, value) => status.setCell(id, field, value, { duration: 0.3 });
  const question = place(label('Can deploy enter the ready heap?', { color: 'yellow' }), FOOT);
  s.add(status, cap2, calls[0]);
  c.after('sched-docs', () => s.play(cell('docs', 'state', 'done'), cell('docs', 'calls', 1)));
  c.swap('sched-docs', calls[0], calls[1], { after: true });
  c.after('sched-false', () =>
    s.play(cell('test', 'state', 'retry available'), cell('test', 'calls', 1)),
  );
  c.swap('sched-false', calls[1], calls[2], { after: true });
  c.show('sched-question', question);
  c.hide('sched-retry', question);
  c.on('sched-retry', () => s.play(cell('test', 'state', 'ready')));
  c.after('sched-success', () => s.play(cell('test', 'state', 'done'), cell('test', 'calls', 2)));
  c.swap('sched-success', calls[2], calls[3], { after: true });
  c.after('sched-release', () =>
    s.play(cell('deploy', 'remaining', 0), cell('deploy', 'state', 'ready')),
  );
  c.after('sched-deploy', () =>
    s.play(cell('deploy', 'state', 'done'), cell('deploy', 'calls', 1)),
  );
  c.swap('sched-deploy', calls[3], calls[4], { after: true });

  c.swap('sched-reset', [cap2, calls[4]], [cap1, calls[0]]);
  c.on('sched-reset', () =>
    s.play(
      ...['docs', 'test', 'deploy'].flatMap((id) => [
        cell(id, 'calls', 0),
        cell(id, 'state', id === 'deploy' ? 'waiting' : 'ready'),
      ]),
      cell('deploy', 'remaining', 1),
    ),
  );
  c.after('sched-docs-again', () =>
    s.play(cell('docs', 'state', 'done'), cell('docs', 'calls', 1)),
  );
  c.swap('sched-docs-again', calls[0], calls[1], { after: true });
  c.after('sched-last', () => s.play(cell('test', 'state', 'failed'), cell('test', 'calls', 1)));
  c.swap('sched-last', calls[1], calls[2], { after: true });
  c.after('sched-blocked', () =>
    s.play(cell('deploy', 'state', 'blocked'), status.light('deploy', 'calls', { duration: 0.4 })),
  );
}
