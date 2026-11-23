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
import { serializedWorkerTrace } from '../../../films/ai-lab-coding-interview-python-systems/arithmetic.mjs';
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
  const flow = place(
    lanes(
      ['A wait', 'B wait', 'CPU'],
      [
        { lane: 0, start: 0, end: 3, label: 'wait', color: 'blue' },
        { lane: 1, start: 0, end: 3, label: 'wait', color: 'cyan' },
        { lane: 2, start: 3, end: 4, label: 'A', color: 'blue' },
        { lane: 2, start: 4, end: 5, label: 'B', color: 'cyan' },
      ],
      {
        width: left.width * 0.78,
        domain: [0, 5],
        size: 34,
        pitch: 160,
        barHeight: 54,
        cursor: false,
        axisLabel: 'thread baseline: GIL enabled',
      },
    ),
    left,
  );
  const model = serializedWorkerTrace();
  const input = JSON.parse(model.input);
  const output = JSON.parse(model.output);
  const [inputArea, inputGap, workerArea, resultGap, parentArea] = right.rows(
    [2, 1, 2, 1, 2],
    'normal',
  );
  const submitted = place(
    column(
      [
        note('Executor: serialized input'),
        namedBox(model.id + '   x=' + input.x, {
          width: right.width * 0.85,
          height: 90,
          color: 'pink',
          font: 'mono',
        }),
      ],
      { gap: 'normal' },
    ),
    inputArea,
  );
  const pending = place(
    column(
      [
        note('Serialized worker result'),
        namedBox('pending', { width: right.width * 0.85, height: 90, color: 'dim', dash: true }),
      ],
      { gap: 'normal' },
    ),
    workerArea,
  );
  const returned = place(
    column(
      [
        note('Serialized worker result'),
        namedBox(output.id + '   square=' + output.square, {
          width: right.width * 0.85,
          height: 90,
          color: 'pink',
          font: 'mono',
        }),
      ],
      { gap: 'normal' },
    ),
    workerArea,
  );
  const records = place(
    table(
      [
        { key: 'key', label: 'parent records', sample: 'parent records' },
        { key: 'value', sample: model.result },
      ],
      [{ id: model.id, key: model.id, value: null }],
      {
        width: right.width,
        size: 34,
        maxRows: 1,
        leading: 2.3,
      },
    ),
    parentArea,
  );
  const inputDot = dot(10, 'pink').moveTo(inputGap.point('top'));
  const resultDot = dot(10, 'pink').moveTo(resultGap.point('top'));
  const scope = place(note('Threads overlap waits. Python CPU is serial.'), left, 'bottom');
  s.add(flow, submitted, pending, records, scope);
  c.on('concurrency-network-waits', () => s.play(flow.advance(3, { duration: 2.2 })));
  c.on('concurrency-beat-1-focus-1', () => s.play(flow.advance(5, { duration: 2.2 })));
  c.show('concurrency-beat-2-focus-1', inputDot);
  c.on(
    'concurrency-beat-2-focus-1',
    () => s.play(to(inputDot, (n) => n.moveTo(inputGap.point('bottom')), { duration: 0.9 })),
    0.35,
  );
  c.on('concurrency-beat-2-focus-1', () => s.play(fadeOut(inputDot, { duration: 0.2 })), 1.3);
  c.swap('concurrency-return', pending, returned, { after: true });
  c.show('concurrency-parent-merge', resultDot, { after: true });
  c.after('concurrency-parent-merge', () => {
    s.play(to(resultDot, (n) => n.moveTo(resultGap.point('bottom')), { duration: 0.7 }));
    s.play(
      fadeOut(resultDot, { duration: 0.15 }),
      records.setCell(model.id, 'value', model.result, { duration: 0.35 }),
    );
  });
}
