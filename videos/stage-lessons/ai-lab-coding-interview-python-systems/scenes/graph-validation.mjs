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

  const [upper, returns] = BOARD.rows([5, 3], 'wide');
  const [left, right] = upper.columns([7, 5], 'wide');
  const g = place(
    graph(
      [
        { id: 'a', label: 'a', width: 150, height: 90 },
        { id: 'b', label: 'b', width: 150, height: 90 },
        { id: 'docs', label: 'docs', width: 180, height: 90 },
      ],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
      { fit: true, width: left.width * 0.85, height: left.height * 0.7, labelSize: 40, token: 'a' },
    ),
    left,
  );
  const heap = place(
    table(
      [
        { key: 'priority', sample: 2 },
        { key: 'name', sample: 'deploy' },
        { key: 'remaining', sample: 1, marks: true },
      ],
      [
        { id: 'test', priority: 2, name: 'test', remaining: 0 },
        { id: 'docs', priority: 1, name: 'docs', remaining: 0 },
        { id: 'deploy', priority: 3, name: 'deploy', remaining: 1 },
      ],
      { size: 34, width: right.width, maxRows: 3, leading: 2.5 },
    ),
    right,
  );
  const valid = place(
    graph(
      [
        { id: 'test', label: 'test', width: 200, height: 90 },
        { id: 'deploy', label: 'deploy', width: 230, height: 90 },
      ],
      [{ from: 'test', to: 'deploy' }],
      { fit: true, width: left.width * 0.8, height: left.height * 0.6, labelSize: 40 },
    ),
    left,
  );
  const candidates = place(
    note('Admission candidates: only remaining = 0 may enter the heap.'),
    BOARD,
    'bottom',
  );
  const verdict = place(label('cycle', { color: 'red' }), BOARD, 'bottom');
  const [resultArea, routeGap, outcomeArea] = returns.columns([5, 2, 5], 'wide');
  const running = place(
    namedBox('test: running', {
      width: resultArea.width,
      height: 100,
      color: 'pink',
      font: 'mono',
    }),
    resultArea,
  );
  const hint = place(note('Return type chooses the path.'), outcomeArea);
  const typed = place(
    namedBox('test: bool False', {
      width: resultArea.width,
      height: 100,
      color: 'pink',
      font: 'mono',
    }),
    resultArea,
  );
  const string = place(
    namedBox('test: str "False"', {
      width: resultArea.width,
      height: 100,
      color: 'red',
      font: 'mono',
    }),
    resultArea,
  );
  const raised = place(
    namedBox('test: exception', {
      width: resultArea.width,
      height: 100,
      color: 'red',
      font: 'mono',
    }),
    resultArea,
  );
  const retry = place(label('retry → same priority', { color: 'yellow' }), outcomeArea);
  const rejected = place(label('reject return type', { color: 'red' }), outcomeArea);
  const aborted = place(label('scheduler stopped', { color: 'red' }), outcomeArea);
  const transfer = dot(10, 'pink').moveTo(routeGap.point('left'));
  const badReturn = dot(10, 'red').moveTo(routeGap.point('left'));
  const exception = dot(10, 'red').moveTo(routeGap.point('left'));
  const heapEntry = [boxOf(heap).cx, boxOf(heap).bottom + 22];
  s.add(g, heap);
  c.on('ci-graph-validation-0-build', () => s.play(indicate(heap, { scale: 1, duration: 0.35 })));
  c.on('ci-graph-validation-1-build', () => s.play(indicate(heap, { scale: 1, duration: 0.35 })));
  c.on('graph-active', () =>
    s.play(g.setState('a', 'active', { duration: 0.4 }), g.go('b', { duration: 0.6 })),
  );
  c.on('ci-graph-validation-cycle', () =>
    s.play(g.setState('b', 'active', { duration: 0.4 }), g.go('a', { duration: 0.8 })),
  );
  c.show('ci-graph-validation-cycle', verdict, { after: true });
  c.swap(1, [g, verdict], [valid, candidates]);
  c.on('graph-priority', () => s.play(heap.sort('priority', { duration: 0.7 })));
  c.on('graph-tie', () => s.play(heap.setCell('docs', 'priority', 2, { duration: 0.3 })));
  c.on(
    'graph-tie',
    () =>
      s.play(
        heap.sort(
          (a, b) =>
            Number(a.values.priority) - Number(b.values.priority) ||
            String(a.values.name).localeCompare(String(b.values.name)),
          { duration: 0.6 },
        ),
      ),
    0.5,
  );
  c.on('ci-graph-validation-ready', () =>
    s.play(heap.setCell('deploy', 'remaining', { value: 0, state: 'pass' }, { duration: 0.5 })),
  );
  c.hide('ci-graph-validation-2-build', candidates);
  c.on('ci-graph-validation-2-build', () =>
    s.play(
      heap.remove(['test'], { duration: 0.3 }),
      heap.setCell('deploy', 'remaining', { value: 1, state: null }, { duration: 0.3 }),
    ),
  );
  c.show(2, [running, hint]);
  c.swap('graph-bool-false', [running, hint], typed);
  c.show('graph-bool-false', transfer, { after: true });
  c.after('graph-bool-false', () => {
    s.play(to(transfer, (n) => n.moveTo(heapEntry), { duration: 0.8 }));
    s.play(
      fadeOut(transfer, { duration: 0.15 }),
      heap.append([{ id: 'test', priority: 2, name: 'test', remaining: 0 }], { duration: 0.35 }),
    );
    s.play(heap.sort('priority', { duration: 0.4 }));
  });
  c.show('graph-bool-false', retry, { after: true });
  c.swap('graph-string-type', [typed, retry], string, { after: true });
  c.show('graph-string-type', badReturn, { after: true });
  c.after('graph-string-type', () => {
    s.play(heap.remove(['test'], { duration: 0.2 }));
    s.play(to(badReturn, (n) => n.moveTo(routeGap.point('right')), { duration: 0.7 }));
    s.play(fadeOut(badReturn, { duration: 0.15 }));
  });
  c.show('graph-string-false', rejected, { after: true });
  c.swap('graph-exception', [string, rejected], [raised, aborted], { after: true });
  c.show('graph-exception', exception, { after: true });
  c.after('graph-exception', () => {
    s.play(to(exception, (n) => n.moveTo(routeGap.point('right')), { duration: 0.6 }));
    s.play(
      fadeOut(exception, { duration: 0.15 }),
      valid.setState('test', 'failed', { duration: 0.3 }),
    );
  });
}
