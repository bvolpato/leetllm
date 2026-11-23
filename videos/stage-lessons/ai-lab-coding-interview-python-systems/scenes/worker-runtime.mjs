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
  const loop = place(
    lanes(
      [
        { name: 'A', color: 'blue' },
        { name: 'B', color: 'cyan' },
      ],
      [
        { lane: 0, at: 1, label: 'start' },
        { lane: 1, at: 2, label: 'start', labelSide: 'under' },
        { lane: 0, at: 3, label: 'resume' },
        { lane: 1, at: 4, label: 'resume', labelSide: 'under' },
      ],
      {
        width: left.width * 0.8,
        domain: [0, 5],
        size: 34,
        pitch: 200,
        axisLabel: 'async event order',
        cursor: false,
      },
    ),
    left,
  );
  const blocked = place(
    lanes(
      [
        { name: 'A', color: 'blue' },
        { name: 'B', color: 'cyan' },
      ],
      [
        { lane: 0, at: 1, label: 'start' },
        { lane: 0, at: 2, label: 'resume' },
        { lane: 1, at: 3, label: 'start', labelSide: 'under' },
        { lane: 1, at: 4, label: 'resume', labelSide: 'under' },
      ],
      {
        width: left.width * 0.8,
        domain: [0, 5],
        size: 34,
        pitch: 200,
        axisLabel: 'blocking event order',
        cursor: false,
      },
    ),
    left,
  );
  const [parentArea, workerArea] = left.rows(2, 'loose');
  const columns = [
    { key: 'owner', sample: 'worker copy' },
    { key: 'zero', label: '[0]', sample: 'ERROR' },
    { key: 'one', label: '[1]', sample: 'INFO' },
    { key: 'two', label: '[2]', sample: 'ERROR' },
  ];
  const parent = place(
    table(columns, [{ id: 'parent', owner: 'parent list', zero: 'ERROR', one: 'INFO', two: '—' }], {
      size: 34,
      width: left.width,
      maxRows: 1,
      leading: 2.6,
    }),
    parentArea,
  );
  const worker = place(
    table(columns, [{ id: 'worker', owner: 'worker copy', zero: '—', one: '—', two: '—' }], {
      size: 34,
      width: left.width,
      maxRows: 1,
      leading: 2.6,
    }),
    workerArea,
  );
  const copyRadius = 9;
  const copyClearance = copyRadius * 2;
  const copyDots = ['zero', 'one'].map((key) =>
    dot(copyRadius, 'pink').moveTo([
      boxOf(parent.cell('parent', key)).cx,
      boxOf(parent).bottom + copyClearance,
    ]),
  );
  const destinations = ['zero', 'one'].map((key) => [
    boxOf(worker.cell('worker', key)).cx,
    boxOf(worker).top - copyClearance,
  ]);
  const state = place(
    table(
      [
        { key: 'owner', sample: 'worker copy' },
        { key: 'state', sample: 'GIL enabled', marks: true },
      ],
      [
        { id: 'parent', owner: 'parent list', state: 'isolated' },
        { id: 'worker', owner: 'worker copy', state: 'isolated' },
        { id: 'lambda', owner: 'lambda', state: 'pending' },
        { id: 'runtime', owner: 'runtime', state: 'GIL enabled' },
      ],
      { size: 34, width: right.width, maxRows: 4, leading: 2.6 },
    ),
    right,
  );
  const blocking = place(
    note('Blocking sleep holds the loop. Await does not always yield.'),
    BOARD,
    'bottom',
  );
  s.add(parent, worker, state);
  c.on('ci-worker-runtime-0-build', () => s.play(indicate(state, { scale: 1, duration: 0.35 })));
  c.on('ci-worker-runtime-1-build', () => s.play(indicate(state, { scale: 1, duration: 0.35 })));
  c.on('ci-worker-runtime-2-build', () => s.play(indicate(state, { scale: 1, duration: 0.35 })));
  c.on('runtime-lambda', () =>
    s.play(
      state.setCell('lambda', 'state', { value: 'rejected', state: 'fail' }, { duration: 0.4 }),
    ),
  );
  c.show('runtime-serialize', copyDots);
  c.on(
    'runtime-serialize',
    () =>
      s.play(
        ...copyDots.map((node, i) => to(node, (n) => n.moveTo(destinations[i]), { duration: 0.9 })),
      ),
    0.35,
  );
  c.on(
    'runtime-serialize',
    () =>
      s.play(
        fadeOut(copyDots, { duration: 0.2 }),
        worker.setCell('worker', 'zero', 'ERROR', { duration: 0.5 }),
        worker.setCell('worker', 'one', 'INFO', { duration: 0.5 }),
      ),
    1.35,
  );
  c.on('runtime-copy', () =>
    s.play(
      worker.setCell('worker', 'two', 'ERROR', { duration: 0.8 }),
      parent.light('parent', undefined, { duration: 0.4 }),
    ),
  );
  c.swap('runtime-interleave', [parent, worker], loop);
  c.on('runtime-interleave', () => s.play(loop.advance(4, { duration: 2.8 })), 0.55);
  c.show('ci-worker-runtime-blocking', blocking);
  c.swap('ci-worker-runtime-blocking', loop, blocked);
  c.on('ci-worker-runtime-blocking', () => s.play(blocked.advance(4, { duration: 1.4 })), 0.55);
}
