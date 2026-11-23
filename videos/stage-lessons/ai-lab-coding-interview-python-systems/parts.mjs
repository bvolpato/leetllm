import {
  assertEqual,
  boxOf,
  codeBlock,
  column,
  dot,
  dynamic,
  graph,
  lanes,
  line,
  place,
  rect,
  row,
  table,
} from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../kit-narrated.mjs';
import { validateModel } from '../../films/ai-lab-coding-interview-python-systems/model.mjs';
export {
  BUCKET,
  CRAWL,
  LEDGER,
  SCHEDULE_RETRY,
  SCHEDULE_BLOCKED,
  expiryState,
  mixedWorkSchedule,
  parserTrace,
} from '../../films/ai-lab-coding-interview-python-systems/arithmetic.mjs';
validateModel();

export const COLOR = Object.freeze({
  workerA: 'blue',
  workerB: 'cyan',
  accepted: 'green',
  record: 'pink',
  focus: 'yellow',
  failure: 'red',
  inactive: 'dim',
});
export const [BOARD, FOOT] = area.rows([9, 1], 'normal');
export const STATE = Object.freeze({
  opening: 'Two calls to fetch leave one URL in the set.',
  'contract-loop': 'The duplicate-claim regression is isolated.',
  'state-objects': 'Each operation has a distinct owner.',
  frontier: 'Fetch order is start, guide, api, faq.',
  'url-policy': 'Identity is normalized before claim.',
  claim: 'Fetch occurs outside the claim lock.',
  'claim-failure': 'Ordered admission and cooperative publication checks are separate.',
  expiry: 'task:1 is removed on a read at 15.',
  'ttl-reads': 'The surviving record has no deadline.',
  'cas-boundary': 'The live value changes while an isolated snapshot stays ready.',
  scheduler: 'test failed and deploy remained blocked in the one-attempt branch.',
  'graph-validation': 'A dependency enters the heap only at zero.',
  'scheduler-workers': 'Completion is published before dependents are released.',
  limiter: 'The admitted request at one second leaves zero tokens.',
  'bucket-contract': 'Cleanup is permitted only at full-equivalent refill.',
  ledger: 'Current balance 70, original receipt 100, two events.',
  'ledger-lifetime': 'Volatile updates need a durable atomic boundary.',
  'lock-order': 'The acquired lock is released after a later lookup error.',
  'parser-state': 'The malformed header clears the continuation owner.',
  concurrency: 'Identified records cross an executor boundary and merge in the parent.',
  'worker-runtime': 'Worker mutation does not mutate the parent list.',
  'fresh-worker-plan': 'Both waits overlap. The parent admits /help, /help?v=2, then /tips.',
});

export function context(s, c) {
  s.add(heading(c.title));
}

export const CLAIM_CODE =
  'def claim(url):\n    with lock:\n        if url in seen:\n            return False\n        seen.add(url)\n    return True\n\nif claim(url): fetch(url)';

export function racePicture(region = BOARD) {
  const [codeArea, traceArea] = region.columns([5, 7], 'wide');
  const [timelineArea, cellArea] = traceArea.rows([3, 2], 'wide');
  const locked = place(
    codeBlock(CLAIM_CODE, { language: 'python', size: 34, leading: 1.5, panel: true }),
    codeArea,
  );
  const code = place(
    codeBlock(
      'def claim(url):\n    if url in seen:\n        return False\n    # another worker can enter\n    seen.add(url)\n    return True',
      { language: 'python', size: 34, leading: 1.5, panel: true },
    ),
    codeArea,
  );
  const names = [
    { name: 'A', color: 'blue' },
    { name: 'B', color: 'cyan' },
  ];
  const opts = {
    width: timelineArea.width * 0.83,
    size: 34,
    pitch: 150,
    barHeight: 50,
    domain: [0, 8],
    axisLabel: 'operation order',
    cursor: false,
  };
  const unsafe = place(
    lanes(
      names,
      [
        { lane: 'A', at: 1, label: 'read absent' },
        { lane: 'B', at: 2, label: 'read absent', labelSide: 'under' },
        { lane: 'A', at: 4, label: 'insert' },
        { lane: 'B', at: 5, label: 'insert', labelSide: 'under' },
        { lane: 'A', start: 5.3, end: 8, label: 'fetch' },
        { lane: 'B', start: 5.8, end: 8, label: 'fetch' },
      ],
      opts,
    ),
    timelineArea,
  );
  const safe = place(
    lanes(
      names,
      [
        { lane: 'A', start: 0.6, end: 2.4, label: 'claim', color: 'green' },
        { bracket: [0.6, 2.4], lane: 'A', label: 'lock', color: 'yellow' },
        { lane: 'B', at: 3.6, label: 'skip', color: 'dim', labelSide: 'under' },
        { lane: 'A', start: 3, end: 8, label: 'fetch outside lock', color: 'blue' },
      ],
      opts,
    ),
    timelineArea,
  );
  const cell = place(
    table(
      [
        { key: 'field', sample: 'fetch receipts' },
        { key: 'value', sample: 'unclaimed', marks: true },
      ],
      [
        { id: 'url', field: 'URL', value: '/guide' },
        { id: 'seen', field: 'seen', value: 'unclaimed' },
        { id: 'fetch', field: 'fetch receipts', value: null },
      ],
      { width: cellArea.width, maxRows: 3, size: 34 },
    ),
    cellArea,
  );
  return { code, locked, unsafe, safe, cell, cellArea };
}

export function storePicture(region = BOARD, initial = 'running', initialDeadline = '15.000') {
  const [top, middle, bottom] = region.rows([2.2, 3, 1], 'wide');
  const clock = place(
    lanes(['clock'], [], {
      width: top.width * 0.75,
      domain: [10, 15],
      ticks: [10, 15],
      format: (v) => `${v} s`,
      size: 34,
      deadline: { at: 15, label: 'expires_at', color: 'pink' },
    }),
    top,
  );
  const record = place(
    table(
      [
        { key: 'key', sample: 'task:2' },
        { key: 'value', sample: 'permanent', marks: true },
        { key: 'deadline', sample: '15.000' },
      ],
      [
        { id: 'one', key: 'task:1', value: initial, deadline: initialDeadline },
        { id: 'two', key: 'task:2', value: 'ready', deadline: 'None' },
      ],
      { size: 40, width: middle.width, maxRows: 2, leading: 2.4 },
    ),
    middle,
  );
  const now = place(mono('now = 10.000 s', { color: 'yellow' }), bottom, 'top');
  const live = place(label('task:1 → running', { color: 'green' }), bottom, 'bottom');
  const expired = place(label('task:1 → missing', { color: 'yellow' }), bottom, 'bottom');
  return { clock, record, now, live, expired, bottom, top };
}

export function schedulePicture(region = BOARD) {
  const [network, heapArea] = region.columns([7, 5], 'wide');
  const g = place(
    graph(
      [
        { id: 'docs', label: 'docs', width: 210, height: 90 },
        { id: 'test', label: 'test', width: 210, height: 90 },
        { id: 'deploy', label: 'deploy', value: 'remaining: 1', width: 290, height: 130 },
      ],
      [{ from: 'test', to: 'deploy' }],
      {
        fit: true,
        width: network.width * 0.94,
        height: network.height * 0.7,
        labelSize: 40,
        valueSize: 34,
        nodeGap: 150,
        rankGap: 150,
      },
    ),
    network,
  );
  const heap = place(
    table(
      [
        { key: 'priority', label: 'priority' },
        { key: 'task', sample: 'deploy' },
        { key: 'attempt', sample: 2 },
      ],
      [
        { id: 'docs', priority: 1, task: 'docs', attempt: 0 },
        { id: 'test', priority: 2, task: 'test', attempt: 0 },
      ],
      { width: heapArea.width, size: 34, maxRows: 3, leading: 2.5 },
    ),
    heapArea,
  );
  const title = place(note('ready heap: (priority, name)'), heapArea, 'top');
  return { g, heap, title };
}

export function bucketPicture(s, region = BOARD, start = 3, live = {}) {
  const [left, right] = region.columns([7, 5], 'wide');
  const [meterArea, timeArea] = left.rows([3, 1], 'wide');
  const amount = live.amount ?? s.value(start);
  const outline = place(
    rect(meterArea.width * 0.83, meterArea.height * 0.7, {
      stroke: 'grid',
      fill: 'surface',
      width: 3,
      radius: 12,
    }),
    meterArea,
  );
  const b = boxOf(outline).inset('normal');
  const divisions = [1, 2].map((i) =>
    line([b.left + (b.width * i) / 3, b.top], [b.left + (b.width * i) / 3, b.bottom], {
      stroke: 'grid',
      width: 2,
    }),
  );
  const fill = dynamic(() =>
    amount.value <= 0.001
      ? []
      : rect((b.width * amount.value) / 3, b.height, { fill: 'cyan', stroke: null }).moveTo([
          b.left + (b.width * amount.value) / 6,
          b.cy,
        ]),
  );
  const count = dynamic(() =>
    mono(Math.round(amount.value * 100) / 100 + ' tokens', { color: 'yellow' }).moveTo(
      timeArea.point('center'),
    ),
  );
  const events = place(
    table(
      [
        { key: 'request', sample: 'fourth' },
        { key: 'result', sample: 'wait 0.5 s', marks: true },
      ],
      [
        { id: 'cost', request: 'cost', result: '1 token' },
        { id: 'clock', request: 'clock', result: live.clock ? null : '0 s' },
        { id: 'decision', request: 'request', result: null },
      ],
      { width: right.width, size: 34, maxRows: 3, leading: 2.5 },
    ),
    right,
  );
  const clock = live.clock ? dynamic(() => mono(live.clock.value.toFixed(2) + ' s', { size: 34 }).moveTo(events.region('clock', 'result').point('center'))) : [];
  const scale = live.clock ? [0, 1, 2, 3].map(i => mono(String(i), { size: 34, color: 'dim' }).moveTo([b.left + b.width * i / 3, boxOf(outline).bottom + 32])) : [];
  const capacity = live.clock ? place(note('capacity 3 · refill 1 token/s'), meterArea, 'top') : [];
  return { amount, outline, divisions, fill, count, events, timeArea, clock, scale, capacity };
}

export function ledgerPicture(region = BOARD, initial = null) {
  const [eventsArea, records] = region.columns([7, 5], 'wide');
  const events = place(
    table(
      [
        { key: 'key', sample: 'withdraw-1' },
        { key: 'delta', sample: -30 },
        { key: 'balance', sample: 100 },
      ],
      initial
        ? initial.events.map((event, i) => ({
            id: i === 0 ? 'deposit' : 'withdraw',
            key: event.key,
            delta: event.delta,
            balance: i === 0 ? 100 : initial.balance,
          }))
        : [],
      { size: 34, width: eventsArea.width, maxRows: 3, leading: 2.5 },
    ),
    eventsArea,
  );
  const [liveArea, receiptArea] = records.rows(2, 'wide');
  const balance = place(
    table(
      [
        { key: 'field', sample: 'current balance' },
        { key: 'value', sample: 100 },
      ],
      [
        { id: 'balance', field: 'current balance', value: initial?.balance ?? 0 },
        { id: 'events', field: 'events', value: initial?.events.length ?? 0 },
      ],
      { width: liveArea.width, size: 34, maxRows: 2, leading: 2.4 },
    ),
    liveArea,
  );
  const receipt = place(
    table(
      [
        { key: 'key', sample: 'withdraw-1' },
        { key: 'result', sample: 'absent', marks: true },
      ],
      [{ id: 'deposit', key: 'deposit-1', result: initial?.returned ?? null }],
      { width: receiptArea.width, size: 34, maxRows: 2, leading: 2.5 },
    ),
    receiptArea,
  );
  return { events, balance, receipt };
}

export function workloadPicture(region = BOARD) {
  const [serialArea, overlapArea, resultsArea] = region.rows([2, 4, 1], 'wide');
  const spec = {
    width: region.width * 0.82,
    domain: [0, 8],
    ticks: [0, 3, 4, 5, 8],
    size: 34,
    barHeight: 40,
    pitch: 92,
    axisLabel: 'seconds',
  };
  const serial = place(
    lanes(
      ['serial'],
      [
        { lane: 0, start: 0, end: 3, label: 'A wait', color: 'blue' },
        { lane: 0, start: 3, end: 4, label: 'A', color: 'blue' },
        { lane: 0, start: 4, end: 7, label: 'B wait', color: 'cyan' },
        { lane: 0, start: 7, end: 8, label: 'B', color: 'cyan' },
      ],
      spec,
    ),
    serialArea,
  );
  const overlap = place(
    lanes(
      ['A wait', 'B wait', 'CPU'],
      [
        { lane: 0, start: 0, end: 3, label: 'wait', color: 'blue' },
        { lane: 1, start: 0, end: 3, label: 'wait', color: 'cyan' },
        { lane: 2, start: 3, end: 4, label: 'A', color: 'blue' },
        { lane: 2, start: 4, end: 5, label: 'B', color: 'cyan' },
      ],
      spec,
    ),
    overlapArea,
  );
  const question = place(
    label('A, B: wait 3 s + CPU 1 s. Totals: ? / ?', { color: 'yellow' }),
    resultsArea,
  );
  const serialResult = place(
    label('serial: 8 s     overlapped: ?', { color: 'yellow' }),
    resultsArea,
  );
  const answer = place(label('serial: 8 s     overlapped: 5 s', { color: 'yellow' }), resultsArea);
  return { serial, overlap, question, serialResult, answer, resultsArea, serialArea, overlapArea };
}
