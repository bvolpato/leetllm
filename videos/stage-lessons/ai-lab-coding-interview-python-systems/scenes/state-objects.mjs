import { URLS } from '../../../films/ai-lab-coding-interview-python-systems/fixtures.mjs';
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

  const [left, right] = BOARD.columns(2, 'wide');
  const owners = place(
    table(
      [
        { key: 'operation', sample: 'FIFO work' },
        { key: 'owner', sample: 'OrderedDict' },
      ],
      [
        { id: 'fifo', operation: 'FIFO work', owner: 'deque' },
        { id: 'priority', operation: 'priority', owner: 'heap' },
        { id: 'counts', operation: 'counts', owner: 'Counter' },
        { id: 'recency', operation: 'recency', owner: 'OrderedDict' },
        { id: 'time', operation: 'elapsed time', owner: 'clock' },
      ],
      { width: left.width, size: 34, maxRows: 5 },
    ),
    left,
  );
  const state = place(
    table(
      [
        { key: 'field', sample: 'condition' },
        { key: 'value', sample: 'predicate false', marks: true },
      ],
      [
        { id: 'queue', field: 'queue head', value: '/start' },
        { id: 'count', field: 'fetch count', value: 0 },
        { id: 'lock', field: 'lock', value: 'claim' },
        { id: 'condition', field: 'condition', value: 'predicate false' },
        { id: 'event', field: 'stop event', value: 'clear' },
      ],
      { width: right.width, size: 34, maxRows: 5 },
    ),
    right,
  );
  const cost = place(note('Local graph: O(V + E) work, O(V) state'), BOARD, 'bottom');
  const crawl = place(
    graph(
      CRAWL.order.map((url) => ({ id: url, label: new URL(url).pathname, width: 180, height: 90 })),
      Object.entries(URLS.pages).flatMap(([from, links]) =>
        links
          .filter((link) => new URL(link, from).origin === new URL(from).origin)
          .map((link) => ({ from, to: new URL(link, from).href.split('#')[0] })),
      ),
      { fit: true, width: left.width * 0.88, height: left.height * 0.75, labelSize: 34 },
    ),
    left,
  );
  const visits = place(
    table(
      [
        { key: 'work', sample: 'retained URLs' },
        { key: 'count', sample: 6 },
      ],
      [
        { id: 'v', work: 'vertex pops', count: 0 },
        { id: 'e', work: 'link checks', count: 0 },
        { id: 'state', work: 'retained URLs', count: 1 },
      ],
      { width: right.width, size: 40, maxRows: 3, leading: 2.5 },
    ),
    right,
  );
  const scheduled = schedulePicture();
  const heapCost = place(note('Heap: O(A V log V). Graph: O(V + E).'), BOARD, 'bottom');
  s.add(owners, state);
  c.on('ci-state-objects-0-build', () => s.play(indicate(owners, { scale: 1, duration: 0.35 })));
  c.on('objects-deque', () =>
    s.play(
      owners.light('fifo', undefined, { duration: 0.3 }),
      state.setCell('queue', 'value', '/guide', { duration: 0.5 }),
    ),
  );
  c.on('objects-count', () =>
    s.play(
      owners.light('counts', undefined, { duration: 0.3 }),
      state.setCell('count', 'value', 1, { duration: 0.5 }),
    ),
  );
  c.on('objects-wake', () =>
    s.play(
      state.light('condition', undefined, { duration: 0.3 }),
      state.setCell('condition', 'value', 'recheck', { duration: 0.5 }),
    ),
  );
  c.on('objects-stop', () => s.play(state.setCell('event', 'value', 'set', { duration: 0.4 })));
  c.swap('objects-cost', [owners, state], [crawl, visits, cost]);
  c.on(
    'objects-cost',
    () => {
      let inspected = 0;
      CRAWL.order.forEach((url, index) => {
        inspected += URLS.pages[url].length;
        s.play(
          crawl.setState(url, 'done', { duration: 0.45 }),
          visits.setCell('v', 'count', index + 1, { duration: 0.45 }),
          visits.setCell('e', 'count', inspected, { duration: 0.45 }),
          visits.setCell('state', 'count', CRAWL.snapshots[index + 1].seen.length, {
            duration: 0.45,
          }),
        );
      });
    },
    0.55,
  );
  const more = place(mono('/guide returns   /api, /faq, /api', {size:42,color:'yellow'}), BOARD, 'top');
  const linkCount = CRAWL.order.reduce((n,url) => n + URLS.pages[url].length,0);
  assertEqual(linkCount,6,'original links inspected');
  c.show('objects-extra',more);
  c.after('objects-seven',()=>s.play(visits.setCell('e','count',linkCount+1),visits.light('e','count')));
  c.swap(
    'objects-attempts',
    [crawl, visits, cost, more],
    [scheduled.g, scheduled.heap, scheduled.title, heapCost],
  );
  c.on(
    'objects-attempts',
    () =>
      s.play(
        seq(
          scheduled.heap.remove(['test'], { duration: 0.6 }),
          scheduled.heap.append([{ id: 'retry', priority: 2, task: 'test', attempt: 1 }], {
            duration: 0.6,
          }),
          scheduled.heap.remove(['retry'], { duration: 0.6 }),
          scheduled.heap.append([{ id: 'again', priority: 2, task: 'test', attempt: 2 }], {
            duration: 0.6,
          }),
        ),
      ),
    0.6,
  );
}
