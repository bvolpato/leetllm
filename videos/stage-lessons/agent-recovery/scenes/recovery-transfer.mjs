// Scene `recovery-transfer`: the viewer decides, and then the results are counted.
//
// The final case changes write permission after a timeout. Trace the one authorized
// read through to a dated observation, then compare dispatches with the harness.
import {
  assertEqual,
  appear,
  circle,
  seq,
  vanish,
  beside,
  boxOf,
  column,
  dot,
  group,
  indicate,
  line,
  moveTo,
  place,
  rect,
  row,
  unitChart,
} from 'vizmatic/stage';
import { operationTrace } from '../operation-trace.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, OP, ageLine, secondsAxis, token, travel } from '../parts.mjs';

/** The numbers that the voice says. */
const WAIT = { minimum: 1.2, jitter: 0.3, left: 1.4 };
const RUNS = [
  { count: 60, name: 'complete the task', color: COLOR.sure },
  { count: 12, name: 'degraded answers', color: 'ink' },
  { count: 18, name: 'hand off', color: 'ink' },
  { count: 10, name: 'unresolved', color: 'dim' },
];
const BAR = 76;

export default function recoveryTransfer(s, c) {
  const combined = WAIT.minimum + WAIT.jitter;
  assertEqual(
    [Number(combined.toFixed(1)), combined > WAIT.left],
    [1.5, true],
    'the combined wait passes the time that is left',
  );
  const total = RUNS.reduce((sum, run) => sum + run.count, 0);
  const safe = total - RUNS[3].count;
  assertEqual([total, RUNS[0].count / total, safe / total], [100, 0.6, 0.9], 'the two rates');

  const [head, body] = area.rows([1, 6], 'normal');
  // The operation of the lesson is at the top of the first two pictures.
  const key = token(OP.key, COLOR.op);
  const contract = chip('replay contract: active', { color: COLOR.sure, stroke: COLOR.sure });
  place(row([key, contract]), head, 'left');

  // Picture 1. Two waits on a seconds axis, and the time that is left.
  const axis = secondsAxis(body.inset('normal', 'none'), {
    max: 2,
    rows: 3,
    step: 0.2,
    names: [1, 5],
  });
  // A wait is a bar with its length at its left end, so the line of the time left crosses no number.
  const wait = (seconds, color, index) => {
    const bar = rect(axis.span(seconds), BAR, {
      radius: 8,
      fill: color,
      stroke: null,
      opacity: 0.9,
    });
    const words = mono(`${seconds} s`, { size: 34, color: 'bg' });
    words.moveTo([-axis.span(seconds) / 2 + 14 + words.width / 2, 0]);
    return group(bar, words).moveTo([axis.x(seconds / 2), axis.rows[index].cy]);
  };
  // The track of each wait is on screen from the start.
  const tracks = [0, 1].map((index) =>
    rect(axis.plot.width, BAR + 20, {
      radius: 10,
      stroke: 'dim',
      fill: null,
      width: 2,
      dash: [8, 8],
    }).moveTo([axis.plot.cx, axis.rows[index].cy]),
  );
  const minimum = wait(WAIT.minimum, COLOR.controller, 0);
  const jitter = wait(WAIT.jitter, COLOR.attempt, 1);
  const names = ['minimum wait', 'jitter'].map((words, index) =>
    place(label(words), axis.side[index], 'left'),
  );
  // The line of the time left crosses the two rows of the waits, and stops over the row of the answer.
  const limit = line([axis.x(WAIT.left), axis.body.top], [axis.x(WAIT.left), axis.rows[1].bottom], {
    stroke: 'ink',
    width: 3,
    dash: [10, 8],
  });
  const limitName = beside(
    label(`time left: ${WAIT.left} s`),
    [axis.x(WAIT.left), axis.body.top],
    'above',
    'tight',
  );
  const joined = [axis.x(WAIT.minimum + WAIT.jitter / 2), axis.rows[0].cy];
  const over = rect(axis.span(combined - WAIT.left), BAR + 10, {
    radius: 8,
    stroke: COLOR.fail,
    fill: null,
    width: 4,
  }).moveTo([axis.x((combined + WAIT.left) / 2), axis.rows[0].cy]);
  const sum = beside(
    mono(`${combined.toFixed(1)} s`, { color: COLOR.fail }),
    over,
    'right',
    'normal',
  );
  const ask = place(chip('send?', { color: COLOR.mark, stroke: COLOR.mark }), axis.rows[2]);
  const stop = place(
    chip('stop: the wait ends after the time that is left', {
      color: COLOR.fail,
      stroke: COLOR.fail,
    }),
    axis.rows[2],
  );

  // Picture 2. An old observation on a line of time, and a window of one minute.
  const [lineRow, claimRow] = body.rows([3, 2], 'normal');
  const age = ageLine(lineRow.inset('wide', 'none'), { past: '40 minutes ago', fresh: 1 / 40 });
  const seen = beside(
    token(
      [
        [OP.job, COLOR.sure],
        ['completed', 'ink'],
      ],
      COLOR.sure,
    ),
    age.start,
    'above',
    'wide',
    'left',
  );
  const policy = beside(
    note('the policy: 1 minute', { color: COLOR.sure }),
    age.now,
    'above',
    'wide',
    'right',
  );
  const priorShell = place(
    rect(640, 190, { stroke: 'dim', fill: null, width: 2, dash: [10, 8] }),
    lineRow,
    'top left',
  );
  const policyShell = place(
    rect(640, 190, { stroke: 'dim', fill: null, width: 2, dash: [10, 8] }),
    lineRow,
    'top right',
  );
  const priorHead = place(note('prior observation'), boxOf(priorShell).inset('normal'), 'top left');
  const policyHead = place(
    note('current-status freshness window'),
    boxOf(policyShell).inset('normal'),
    'top left',
  );
  place(seen, boxOf(priorShell).inset('normal'), 'bottom left');
  const besideObservation = beside(token(OP.key, COLOR.op), seen, 'right', 'normal');
  const keyDot = dot(10, COLOR.op).moveTo(key.center);
  const freshnessFrame = [priorShell, policyShell, priorHead, policyHead];
  const claims = [
    chip('completed now?', { color: 'dim', stroke: 'dim', dash: [10, 8] }),
    chip('current status: unavailable', { color: COLOR.mark, stroke: COLOR.mark }),
  ].map((made) => beside(made, [age.now[0], boxOf(age.nodes[4]).bottom], 'under', 'wide', 'right'));
  const dated = beside(note('earlier: completed, 40 minutes ago'), claims[1], 'left', 'normal');
  const sameKey = place(
    label('the same key: no new one', { color: COLOR.op, size: 34 }),
    claimRow,
    'left',
  );

  // Picture 3. One mark for each run, and the two rates.
  const [chartBand, countBand] = area.rows([13, 5], 'normal');
  const [chartSide, legendSide] = chartBand.columns([7, 2], 'wide');
  const runs = place(
    unitChart(
      RUNS.map(({ count }) => ({ count, color: 'dim' })),
      { rows: 5, cell: 50, gap: 14, plain: true, plainColor: 'dim' },
    ),
    chartSide,
    'left',
  );
  const mark = (index) => runs.toWorld(...runs.p(index));
  const neutral = Array.from({ length: total }, (_, i) =>
    circle(25, { fill: 'dim', stroke: null }).moveTo(mark(i)),
  );
  const chartBox = boxOf(runs);
  const bracket = (count, y, tip) => {
    const from = chartBox.left;
    const to = mark(count - 1)[0] + 28;
    return group(
      ...[
        line([from, y], [to, y]),
        line([from, y], [from, y + tip]),
        line([to, y], [to, y + tip]),
      ].map((made) => made.stroke(COLOR.mark, 3)),
    );
  };
  const complete = bracket(RUNS[0].count, chartBox.top - 24, 14);
  const completeName = beside(
    row([
      mono(`${(RUNS[0].count / total) * 100}%`, { color: COLOR.sure }),
      label('task completion'),
    ]),
    complete,
    'above',
    'tight',
  );
  const disposed = bracket(safe, chartBox.bottom + 24, -14);
  const disposedName = beside(
    row([mono(`${(safe / total) * 100}%`, { color: COLOR.mark }), label('safe disposition')]),
    disposed,
    'under',
    'tight',
  );
  // Categories use shapes. The established colors keep their jobs.
  const shape = (kind, size) =>
    kind === 0
      ? circle(size / 2, { fill: COLOR.sure, stroke: null })
      : kind === 1
        ? rect(size, size, { radius: 2, fill: 'bg', stroke: 'ink', width: 3 })
        : kind === 2
          ? rect(size / Math.SQRT2, size / Math.SQRT2, {
              fill: 'bg',
              stroke: 'ink',
              width: 3,
            }).rotate(Math.PI / 4)
          : circle(size / 2, { fill: 'bg', stroke: 'dim', width: 3 });
  let offset = 0;
  const outcomeMarks = RUNS.map(({ count }, kind) => {
    const marks = Array.from({ length: count }, (_, i) => shape(kind, 50).moveTo(mark(offset + i)));
    offset += count;
    return marks;
  });
  const legend = RUNS.map(({ count, name }, kind) =>
    row([shape(kind, 28), label(count + ' ' + name, { size: 34 })], { gap: 'tight' }),
  );
  const unique = note('one mark is one run');
  place(column([...legend, unique], { gap: 'tight' }), legendSide, 'left');
  const apartName = note('counted apart:');
  const apart = [
    'retries',
    'deduplication',
    'reconcile time',
    'unknown writes',
    'cancellations',
  ].map((words) => chip(words, { color: 'ink', stroke: 'dim' }));
  const traceKey = token(OP.key, COLOR.op);
  const traces = [
    chip('in a protected trace', { color: COLOR.sure, stroke: COLOR.sure }),
    chip('not a metric label', { color: COLOR.fail, stroke: COLOR.fail, dash: [10, 8] }),
  ];
  place(
    column(
      [row([apartName, ...apart], { gap: 'tight' }), row([traceKey, ...traces], { gap: 'tight' })],
      { gap: 'normal' },
    ),
    countBand,
    'left',
  );

  const title = heading(c.title);
  const fresh = operationTrace('RUN-913', 4);
  const newKey = 'rb-913-1';
  const events = [
    { row: 0, kind: 'write', words: newKey + '    rollback → rev-22', style: { color: COLOR.op } },
    { row: 2, kind: 'read', words: 'look up ' + newKey },
    {
      row: 3,
      kind: 'reply',
      words: '14:08   job-7   running',
      style: { back: true, color: COLOR.sure },
    },
  ];
  const [dispatched, read, observed] = events.map(({ row, words, style }) =>
    fresh.message(row, words, style),
  );
  const countAfterTimeout = (kind) =>
    events.filter((event) => event.row > 1 && event.kind === kind).length;
  const reads = countAfterTimeout('read');
  const writes = countAfterTimeout('write');
  assertEqual([reads, writes], [1, 0], 'only the status read is dispatched after the timeout');
  const timedOut = fresh.marker(1, 'timeout', 0, COLOR.fail);
  beside(timedOut, timedOut.center, 'right', 'tight');
  const contractLive = fresh.annotation(1, 'Same-key replay contract active', COLOR.op);
  const priorApproval = fresh.annotation(2, 'Write approved for rev-22', COLOR.sure);
  const access = fresh.annotation(2, 'Write approval withdrawn', COLOR.fail);
  const readOK = beside(
    note('Status reads still permitted', { color: COLOR.sure }),
    access,
    'under',
    'normal',
  );
  const which = fresh.caption('Which call can the agent make now?', COLOR.mark);
  const lastQuestion = fresh.caption('What can you tell the operator?', COLOR.mark);
  const report = fresh.caption('At 14:08, job-7 was running.', COLOR.sure);
  report.moveTo([report.center[0], report.center[1] - 20]);
  const proof = beside(note('Next check: worker result for job-7'), report, 'under', 'tight');
  const [expectedSlot, actualSlot] = area.rows([1, 6, 1], 'normal')[2].columns(2, 'wide');
  const harness = place(
    label('Harness expects   1 read, 0 writes', { color: COLOR.mark }),
    expectedSlot,
  );
  const measured = place(
    label('Trace shows   ' + reads + ' read, ' + writes + ' writes', { color: COLOR.sure }),
    actualSlot,
  );
  s.add(title, key, axis.nodes, names[0], names[1], tracks);

  // The two waits, the time that is left, and the question.
  c.show('replay-allowed', contract);
  c.show('transfer-wait', minimum);
  c.show('sampled-jitter', jitter);
  c.show('remain', [limit, limitName]);
  c.show('predict', ask);
  // Join the two waits after the prediction pause, then mark where they cross the deadline.
  c.on('transfer-stop', () =>
    s.play(
      seq(vanish([...tracks, ask]), moveTo(jitter, joined, { duration: 1.4 }), appear(tracks)),
    ),
  );
  c.show('transfer-verdict', [over, sum, stop]);
  c.after(
    'separate-permission',
    () =>
      s.play(
        indicate(contract, { color: COLOR.mark, scale: 1.06 }),
        indicate(stop, { color: COLOR.mark, scale: 1.03 }),
      ),
    0.2,
  );

  // An old observation and a window of one minute.
  c.swap(
    2,
    [...axis.nodes, ...names, ...tracks, minimum, jitter, limit, limitName, over, sum, stop],
    [...age.nodes, ...freshnessFrame, claims[0]],
  );
  c.hide(2, contract, { lead: -0.6 });
  c.hide(2, key);
  c.onBeat(2, () =>
    s.play(seq(travel(keyDot, besideObservation.center, { duration: 0.6 }), vanish(keyDot))),
  );
  c.show(2, besideObservation, { lead: -0.7 });
  c.show('old-observation', seen);
  c.show('policy', [age.band, age.bandName, policy]);
  c.on('not-now', () => s.play(indicate(claims[0], { color: COLOR.mark, scale: 1 })));
  c.swap('transfer-stale', claims[0], claims[1], { after: true });
  c.show('dated', dated);
  c.show('no-new-key', sameKey);
  c.on('no-new-key', () => s.play(indicate(besideObservation, { color: COLOR.mark, scale: 1 })));

  // One hundred runs, their four results, and the two rates.
  c.swap(
    'hundred-runs',
    [
      besideObservation,
      ...age.nodes,
      ...freshnessFrame,
      seen,
      age.band,
      age.bandName,
      policy,
      claims[1],
      dated,
      sameKey,
    ],
    neutral,
    { fade: 0.6 },
  );
  let revealed = 0;
  ['outcomes', 'degraded-outcome', 'handoff-outcome', 'unresolved-outcome'].forEach((cue, i) => {
    const originals = neutral.slice(revealed, revealed + RUNS[i].count);
    revealed += RUNS[i].count;
    c.after(cue, () => s.play(vanish(originals), appear(outcomeMarks[i])));
    c.show(cue, legend[i], { after: true });
  });
  c.show('completion-rate', [complete, completeName], { after: true });
  c.show('disposition-rate', [disposed, disposedName], { after: true });
  c.on('not-erase', () =>
    s.play(
      indicate(legend[1], { color: COLOR.mark, scale: 1.05 }),
      indicate(legend[2], { color: COLOR.mark, scale: 1.05 }),
    ),
  );
  c.show('unique-runs', unique);
  c.show('track-separately', [apartName, ...apart], { stagger: true });
  c.show('protected-traces', [traceKey, ...traces]);

  c.swapAll('fresh-run', [fresh.base, priorApproval, dispatched.name], { keep: [title] });
  c.on('fresh-write', () => dispatched.send(s));
  c.show('fresh-timeout', timedOut);
  c.show('contract-live', contractLive);
  c.swap('withdrawn', priorApproval, access);
  c.show('can-read', readOK);
  c.show('choose-call', which);
  c.hide('read-key', [which, readOK]);
  c.swap('read-key', access, read.name);
  c.on('read-key', () => read.send(s));
  c.show('observed', observed.name);
  c.on('observed', () => observed.send(s));
  c.show('harness', harness);
  c.show('measured', measured);
  c.on('measured', () => s.play(indicate(read.name, { color: COLOR.mark, scale: 1 })));
  c.swap('tell-operator', [harness, measured], lastQuestion);
  c.swap('final-report', lastQuestion, report);
  c.show('worker-result', proof);
}
