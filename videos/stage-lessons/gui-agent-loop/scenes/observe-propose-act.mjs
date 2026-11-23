import { assertEqual, dot, moveTo, place } from 'vizmatic/stage';
import { heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import { TRACE, footer } from '../parts.mjs';
import { aimAt, browserPane, button, outline, paperArea, screenArea } from '../inspection-desk.mjs';

export default function observeProposeAct(s, c) {
  const page = browserPane(screenArea, 'ci.example  /  session-9');
  const [run, stage, actions, detail] = page.body.rows(4, 'normal');
  const [left] = actions.columns([1, 1], 'wide');
  const field = place(mono('Run ID', { color: 'dim', size: 43 }), run, 'left');
  const value = place(mono(TRACE.searched.state.runId, { size: 43 }), run, 'left');
  const open = button(left, 'Open run');
  const failed = button(left, 'Failed tests');
  const [head, frame, task, count] = paperArea.inset('wide').rows(4, 'normal');
  const stamp = (id) => place(mono(id, { color: 'blue', size: 46 }), frame, 'left');
  const before = stamp(TRACE.firstObservation.frameId);
  const after = stamp(TRACE.searched.state.frameId);
  const request = place(
    note('Proposed: open this run', { color: 'yellow', size: 38 }),
    task,
    'left',
  );
  const receipt = place(
    note('Open run clicks sent   1', { color: 'green', size: 38 }),
    count,
    'left',
  );
  const cursor = dot(13, 'yellow').moveTo(page.body.point('bottom left'));
  assertEqual(TRACE.searched.decision, 'dispatched', 'one search dispatched');
  s.add(
    heading(c.title),
    page.shell,
    outline(paperArea, 'dim'),
    field,
    open,
    place(label('Host observation', { size: 42 }), head, 'left'),
    before,
  );
  c.swap('field', field, value);
  c.show('propose', request);
  c.on('check', () => s.play(tint(open, 'yellow')));
  c.show('send', cursor);
  c.on('send', () => s.play(moveTo(cursor, aimAt(open), { duration: 0.45 })), 0.15);
  c.show('sent', receipt, { after: true });
  c.swap(
    'result',
    [open, cursor],
    [failed, place(label('Test stage failed', { size: 44 }), stage, 'left')],
  );
  c.swap('capture', before, after, { after: true });
  c.show('capture', place(note('Failure details collapsed', { color: 'dim' }), detail, 'left'));
  c.show('stop', footer('Stop at verified completion, a deadline or a safety boundary.', 'blue'));
}
