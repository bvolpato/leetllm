import { column, indicate, pictogram, place } from 'vizmatic/stage';
import { label, namedBox, note } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'reconciliation-table');
  const [left, right] = VIEW.columns([4, 1], 'loose');
  const rows = left.rows([0.8, 1, 1, 1, 1, 1], 'tight');
  const fractions = [1, 1.3, 1.45];
  const headings = rows[0]
    .columns(fractions, 'normal')
    .map((r, i) =>
      place(label(['resource', 'observation', 'action'][i], { size: 34, color: 'dim' }), r),
    );
  const items = [
    'process / cgroup',
    'private pages',
    'fault handler',
    'capability',
    'cleanup objects',
  ];
  const observations = [
    'CPU / output growth',
    'resident-page growth',
    'fault progress stalled',
    'unauthorized operation',
    'checks incomplete',
  ];
  const actions = [
    'enforce guest limits',
    'hold admission / reserve',
    'retire execution first',
    'deny / revoke authority',
    'quarantined / allocated',
  ];
  const cells = items.map((name, i) => {
    const cols = rows[i + 1].columns(fractions, 'normal');
    const observation = (words, color) =>
      place(namedBox(words, { width: cols[1].width, height: 66, size: 29, color }), cols[1]);
    const action = (words, color) =>
      place(namedBox(words, { width: cols[2].width, height: 66, size: 29, color }), cols[2]);
    return {
      name: place(label(name, { size: 31, color: 'cyan' }), cols[0]),
      pending: observation('awaiting probe', 'dim'),
      held: action('retain owner', 'dim'),
      observed: observation(observations[i], 'red'),
      action: action(actions[i], i === 4 ? 'red' : 'yellow'),
    };
  });
  const runtime = place(
    column(
      [
        pictogram('vm', { size: 90, color: 'cyan' }),
        label('VMM running', { size: 31 }),
        note('heartbeat absent'),
        note('adopt or stop'),
        note('same J4 / g4 owner'),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  const caption = place(
    label('Separate failure case · same tenant + sandbox + generation', {
      color: 'yellow',
      size: 34,
    }),
    FOOT,
  );
  s.add(
    headings,
    cells.map((x) => [x.name, x.pending, x.held]),
    runtime,
    caption,
  );
  c.on('inventory', () => s.play(indicate(runtime, { scale: 1, color: 'yellow' })));
  for (const [i, cue] of ['process', 'memory', 'handler', 'credential', 'quarantine'].entries()) {
    c.swap(cue, [cells[i].pending, cells[i].held], [cells[i].observed, cells[i].action], {
      after: true,
    });
  }
}
