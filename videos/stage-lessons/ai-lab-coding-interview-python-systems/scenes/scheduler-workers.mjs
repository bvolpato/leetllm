import {
  appear,
  arrow,
  assertEqual,
  boxOf,
  codeBlock,
  column,
  dot,
  draw,
  dynamic,
  fade,
  fadeOut,
  graph,
  grid,
  indicate,
  lanes,
  line,
  morphCode,
  place,
  recolor,
  rect,
  row,
  seq,
  table,
  to,
} from 'vizmatic/stage';
import { chip, display, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import {
  BOARD,
  COLOR,
  context,
  racePicture,
  storePicture,
  schedulePicture,
  bucketPicture,
  ledgerPicture,
  workloadPicture,
  CRAWL,
  LEDGER,
  BUCKET,
  SCHEDULE_RETRY,
  SCHEDULE_BLOCKED,
  expiryState,
  parserTrace,
  mixedWorkSchedule,
} from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);

  const [left, right] = BOARD.columns([7, 5], 'wide');
  const [top, bottom] = left.rows([5, 2], 'wide');
  const code = place(
    codeBlock(
      'with condition:\n    while not ready:\n        condition.wait()\n    task = claim()\nresult = run(task)\nwith condition:\n    publish(result)',
      { language: 'python', size: 34, leading: 1.7, panel: true },
    ),
    right,
  );
  const flow = place(
    lanes(
      ['condition', 'worker', 'waiter'],
      [
        { lane: 0, start: 0, end: 1, label: 'claim', color: 'green' },
        { from: 0, to: 1, at: 1 },
        { lane: 1, start: 1, end: 4, label: 'run outside lock', color: 'blue' },
        { from: 1, to: 0, at: 4 },
        { lane: 0, start: 4, end: 6, label: 'publish', color: 'green' },
        { from: 0, to: 2, at: 6.5, label: 'notify', labelSide: 'right' },
      ],
      {
        width: top.width * 0.75,
        domain: [0, 8],
        size: 34,
        barHeight: 54,
        pitch: 130,
        cursor: false,
      },
    ),
    top,
  );
  const state = place(
    table(
      [
        { key: 'field', sample: 'remaining' },
        { key: 'value', sample: 'recheck', marks: true },
      ],
      [
        { id: 'deps', field: 'remaining', value: 1 },
        { id: 'waiter', field: 'waiter', value: 'waiting' },
      ],
      { size: 34, width: bottom.width * 0.7, maxRows: 2 },
    ),
    bottom,
  );
  const badge = place(note('PROPOSED: concurrent handoff'), BOARD, 'top');
  const failure = schedulePicture();
  const [, failureArea] = BOARD.columns([7, 5], 'wide');
  const outcomes = place(table([
    { key: 'owner', sample: 'deploy' }, { key: 'state', sample: 'not eligible', marks: true },
  ], [
    { id: 'test', owner: 'test', state: null },
    { id: 'deploy', owner: 'deploy', state: 'remaining: 1' },
    { id: 'worker', owner: 'worker', state: 'running' },
    { id: 'exception', owner: 'exception', state: null },
  ], { width: failureArea.width, size: 34, maxRows: 4, leading: 2.4 }), failureArea);
  const sequential = place(note('Article implementation: sequential'), BOARD, 'bottom');
  s.add(flow, state, code, badge);
  c.on('ci-scheduler-workers-0-build', () => s.play(indicate(state, { scale: 1, duration: 0.35 })));
  c.on('workers-claim', () => s.play(flow.advance(1, { duration: 0.8 })));
  c.on('workers-run', () => s.play(flow.advance(4, { duration: 1.2 })));
  c.on('workers-publish-outcome', () => s.play(flow.advance(6, { duration: c.cue('workers-publish-outcome').end - c.cue('workers-publish-outcome').start })));
  c.on('ci-scheduler-workers-publish', () => s.play(code.focus([5, 6], { duration: 0.3 })));
  c.after('workers-release', () => s.play(state.setCell('deps', 'value', { value: 0, state: 'pass' }, { duration: 0.3 })));
  c.on('workers-notify', () => s.play(flow.advance(8, { duration: c.cue('workers-notify').end - c.cue('workers-notify').start })));
  c.after('workers-recheck', () => s.play(state.setCell('waiter', 'value', 'recheck', { duration: 0.3 })));
  c.swap('ci-scheduler-workers-1-build', [flow, state, code], [failure.g, outcomes]);
  c.after('workers-failed', () => s.play(
    failure.g.setState('docs', 'done', { duration: 0.3 }),
    failure.g.setState('test', 'failed', { duration: 0.3 }),
    outcomes.setCell('test', 'state', { value: 'failed', state: 'fail' }, { duration: 0.3 }),
  ));
  c.after('workers-blocked', () => s.play(
    failure.g.setState('deploy', 'off', { duration: 0.3 }),
    outcomes.setCell('deploy', 'state', { value: 'remaining: 1', state: 'pending' }, { duration: 0.3 }),
  ));
  c.after('workers-lifecycle', () => s.play(
    outcomes.setCell('worker', 'state', 'stopped', { duration: 0.3 }),
    outcomes.setCell('exception', 'state', 'collected', { duration: 0.3 }),
  ));
  c.show('workers-sequential', sequential);
}
