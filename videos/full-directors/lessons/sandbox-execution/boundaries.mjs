import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  C,
  rect,
  line,
  label,
  mono,
  cap,
  panel,
  page,
  frame,
  tag,
  result,
  cue,
  spokenProgress,
  disk,
  arrow,
  clamp,
} from './art.mjs';

const routes = [
  ['Container', 'Shared host kernel', 'Scoped report mount', 'report.xml', 2, 'scoped mount'],
  ['gVisor', 'Sentry', 'Gofer', 'report.xml', 3, 'Sentry'],
  ['MicroVM', 'Guest kernel', 'Attached volume', 'report.xml', 3, 'guest kernel'],
  ['Wasm', 'Checked guest', 'Host import', 'report.xml', 4, 'host import'],
];
function grant(route, name) {
  return route[3] === name;
}
export function access(c, clock) {
  const b = clock.beat.beatIndex;
  if (b < 2) {
    frame(c, 'File probe   /   host permissions', 'What does this read establish?');
    page(c, 75, 271, 855, 495);
    cap(c, 'WORKER SETUP', 116, 344);
    [
      ['Current directory', '/tmp/job'],
      ['Environment', '{ }'],
    ].forEach(([k, v], i) => {
      label(c, k, 117, 436 + i * 160, 38);
      mono(c, v, 117, 505 + i * 160, 52, { color: C.blue });
    });
    const read = cue(clock, 0, 'can still read');
    panel(c, 990, 271, 852, 495, C.navy, C.navy);
    cap(c, 'ABSOLUTE FILE READ', 1031, 344, { color: '#bfdbcd' });
    mono(c, '/fixtures/notes.txt', 1032, 459, 55, { color: C.white, max: 750 });
    if (read) tag(c, 'Read succeeded', 1032, 527, 541);
    if (b === 1) label(c, 'Network probe: unmeasured', 1032, 695, 43, { color: C.white });
    result(
      c,
      b === 0
        ? 'A temporary directory changes relative lookup.'
        : 'Restrict the resource the worker can open.',
      b === 0 ? 'probe   /   file read' : 'next grant   /   report.xml',
    );
    return;
  }
  const other = cue(clock, 4, 'Now request notes'),
    file = other ? 'notes.txt' : 'report.xml';
  const resolved = other ? cue(clock, 5, 'All four refuse') : true;
  frame(c, 'Scoped file reads   /   four configurations', 'Which boundary answers the read?');
  cap(c, 'WORKLOAD', 110, 297);
  cap(c, 'REQUEST', 465, 297);
  cap(c, 'MEDIATION', 825, 297);
  cap(c, 'GRANT / PATH', 1236, 297);
  cap(c, 'RESULT', 1620, 297);
  routes.forEach((route, i) => {
    const y = 330 + 111 * i;
    const travel = cue(clock, route[4], route[5], 0.9);
    panel(c, 75, y, 1768, 96, travel ? C.paper : '#e6e8de');
    label(c, route[0], 110, y + 63, 42, { face: 'Serif' });
    mono(c, file, 465, y + 61, 34);
    if (travel) {
      const crossed = travel >= 1;
      arrow(c, 696, y + 48, 790, C.muted);
      disk(c, 704 + 73 * travel, y + 48, 10, C.teal);
      label(c, route[1], 825, y + 62, 37, { max: 353 });
      label(c, route[2], 1236, y + 62, 37, { max: 324 });
      if (crossed && resolved)
        tag(
          c,
          grant(route, file) ? 'Read' : 'Refused',
          1609,
          y + 18,
          204,
          grant(route, file) ? C.teal : C.red,
          grant(route, file) ? C.pale : C.blush,
        );
      else mono(c, '…', 1633, y + 64, 35);
    }
  });
  result(
    c,
    other ? 'Previous read: report.xml returned in all four.' : 'Read-only grant for report.xml',
    other ? 'new request   /   notes.txt' : 'requested   /   report.xml',
  );
}

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const cachedBytes = 'report-schema v1\n',
  approved = sha(cachedBytes);
const sample = { network: 'enforced deny', marker: 'AMBER' };
const budget = { period: 100, quota: 30, threads: [20, 10], deadlineMs: 3000, scratch: 64, tasks: 64 };
const cpuSharePhrase = 'Across the job that is three tenths of one logical CPU';
const renewalPhrase = 'The budget renews next period';
function accountingAt(elapsedMs) {
  const periodElapsed = Math.min(elapsedMs, budget.period);
  const usedA = Math.min(periodElapsed, budget.threads[0]);
  const usedB = Math.min(periodElapsed - usedA, budget.threads[1]);
  const waiting = periodElapsed - usedA - usedB;
  return { elapsedMs, renewed: periodElapsed === budget.period, usedA, usedB, waiting };
}
function accounting(clock) {
  const [a, b] = budget.threads;
  const wait = budget.period - budget.quota;
  const nearDeadline = budget.deadlineMs - budget.period;
  const elapsedMs =
    a * spokenProgress(clock, 4, 'One uses twenty') +
    b * spokenProgress(clock, 4, 'the other ten') +
    wait * spokenProgress(clock, 4, `${cpuSharePhrase}. ${renewalPhrase}`) +
    (nearDeadline - budget.period) * cue(clock, 5, 'supervisor clock keeps counting', 1.9) +
    (budget.deadlineMs - nearDeadline) * spokenProgress(clock, 5, 'At three seconds of wall time its deadline expires');
  return accountingAt(Math.floor(elapsedMs));
}
function accepts(used, increment, limit) {
  return used + increment <= limit;
}
export function controls(c, clock) {
  const b = clock.beat.beatIndex;
  if (!b) {
    const firstCheck = cue(clock, 0, 'different digest'),
      corrected = cue(clock, 0, 'Fetch the pinned copy'),
      checked = cue(clock, 0, 'Its digest matches'),
      accepted = cue(clock, 0, 'Admit those bytes');
    const got = sha(corrected ? cachedBytes : 'report-schema v2\n');
    frame(c, 'Dependency preparation   /   schema', 'Which bytes enter the offline cache?');
    const columns = [
      [75, 'Trusted lockfile', 'Pinned SHA-256', approved],
      [700, 'Scoped builder', 'Fetched SHA-256', got],
      [1325, 'Offline cache', 'Admitted artifact', accepted ? 'schema v1' : 'Awaiting check'],
    ];
    columns.forEach(([x, title, k, v], i) => {
      page(c, x, 289, 510, 442);
      cap(c, title.toUpperCase(), x + 29, 355);
      label(c, k, x + 29, 448, 38, { face: 'Serif' });
      mono(c, i < 2 ? v.slice(0, 16) + '…' : v, x + 29, 545, 35, { max: 451 });
      if (i === 1 && firstCheck && !corrected) tag(c, 'Digest differs', x + 29, 613, 400, C.red, C.blush);
      if (i === 1 && checked && got === approved) tag(c, 'Digest matches', x + 29, 613, 400);
      if (i === 2 && accepted) tag(c, 'Ready offline', x + 29, 613, 400);
    });
    arrow(c, 604, 487, 681);
    arrow(c, 1229, 487, 1306);
    result(c, 'Verify package identity before reuse.', 'build scripts run inside a boundary');
  } else if (b < 3) {
    const deny = cue(clock, 1, 'enforced denial'),
      injected = cue(clock, 1, 'contains a synthetic marker');
    const travel = cue(clock, 1, 'writes it into its returned file', 1);
    frame(c, 'Offline worker   /   two output paths', 'Which control held?');
    page(c, 76, 283, 547, 477);
    cap(c, 'WORKER ENVIRONMENT', 111, 350);
    label(c, 'Synthetic marker', 111, 442, 44, { face: 'Serif' });
    if (injected) tag(c, sample.marker, 111, 511, 320, C.ochre, '#f6e9c9');
    line(c, 623, 473, 757, 473, C.ink, 5);
    line(c, 757, 378, 757, 634, C.ink, 5);
    arrow(c, 758, 378, 982, C.ink);
    arrow(c, 758, 634, 982, C.ink);
    panel(c, 1002, 281, 838, 201);
    cap(c, 'OUTBOUND CONNECTION', 1041, 345);
    label(c, deny ? sample.network : 'Probe pending', 1041, 428, 52, { color: deny ? C.red : C.muted });
    panel(c, 1002, 535, 838, 224);
    cap(c, 'RETURNED ARTIFACT', 1041, 604);
    if (travel > 0 && travel < 1) disk(c, 770 + 218 * travel, 634, 15, C.ochre);
    if (travel === 1) mono(c, sample.marker, 1041, 694, 62, { color: C.ochre });
    else label(c, 'Awaiting output', 1041, 689, 40, { color: C.muted });
    result(
      c,
      b === 2 ? 'The file carried the marker out.' : 'Compare the connection record with the returned file.',
      b === 2 ? 'functional test   /   unmeasured' : 'secret-handling probe',
    );
  } else if (b === 3) {
    const write = cue(clock, 3, 'One extra write fails'),
      task = cue(clock, 3, 'a new task is refused');
    const scratchUsed = Math.round(budget.scratch * cue(clock, 3, 'Fill a sixty-four', 1.3));
    frame(c, 'Worker quotas   /   two requests', 'Does refusing a request stop the worker?');
    [
      [75, 'Scratch', budget.scratch, 'MiB', write, 'Write 1 MiB', 'ENOSPC'],
      [989, 'Task slots', budget.tasks, 'tasks', task, 'Start 1 task', 'EAGAIN'],
    ].forEach(([x, title, limit, unit, done, req, err]) => {
      panel(c, x, 278, 853, 484);
      cap(c, 'ENFORCED LIMIT', x + 37, 345);
      label(c, title, x + 37, 432, 55, { face: 'Serif' });
      const used = title === 'Scratch' ? scratchUsed : budget.tasks;
      for (let j = 0; j < 16; j++) {
        rect(c, x + 38 + j * 47, 480, 41, 40, '#dfe3d9');
        rect(c, x + 38 + j * 47, 480, 41 * clamp(used / 4 - j), 40, C.teal);
      }
      mono(c, used + ' / ' + limit + ' ' + unit, x + 37, 599, 43);
      if (done && !accepts(used, 1, limit)) tag(c, req + '    ' + err, x + 37, 649, 765, C.red, C.blush);
    });
    if (cue(clock, 3, 'Existing tasks can keep running'))
      result(c, 'Existing tasks remain alive.', 'failed operation   /   worker running');
  } else {
    const { elapsedMs, renewed, usedA, usedB, waiting } = accounting(clock);
    const expired = elapsedMs === budget.deadlineMs;
    const teardown = cue(clock, 5, 'It starts whole-job teardown');
    const showShare = spokenProgress(clock, 4, cpuSharePhrase) === 1;
    const keepsCounting = b === 5 && elapsedMs > budget.period;
    const cpuShare = budget.quota / budget.period;
    frame(c, 'Accounting   /   two clocks',
      b === 4 ? 'How do two threads share one CPU quota?' : 'Does renewal extend the deadline?');
    panel(c, 75, 272, 1083, 502);
    cap(c, 'FIRST PERIOD   /   THREADS RUN IN SEQUENCE', 114, 338);
    label(c, 'Wall time in the first period', 114, 422, 53, { face: 'Serif' });
    const periodX = 115;
    const periodY = 508;
    const periodWidth = 965;
    const msWidth = periodWidth / budget.period;
    const quotaX = periodX + budget.quota * msWidth;
    const renewalX = periodX + periodWidth;
    rect(c, periodX, periodY, periodWidth, 61, '#e4e7dd');
    rect(c, periodX, periodY, usedA * msWidth, 61, C.teal);
    rect(c, periodX + usedA * msWidth, periodY, usedB * msWidth, 61, C.blue);
    rect(c, quotaX, periodY, waiting * msWidth, 61, C.gold);
    line(c, quotaX, periodY - 15, quotaX, periodY + 73, C.ochre, 4);
    mono(c, budget.quota + ' ms quota', quotaX, periodY - 24, 32, { color: C.ochre, align: 'center' });
    line(c, renewalX, periodY - 15, renewalX, periodY + 73, C.muted, 4);
    mono(c, budget.period + ' ms', renewalX, periodY - 24, 32, { color: C.muted, align: 'right' });
    mono(c, 'A: ' + usedA + ' ms', periodX, 644, 38, { color: C.teal });
    mono(c, 'B: ' + usedB + ' ms', periodX + 285, 644, 38, { color: C.blue });
    if (waiting) mono(c, 'Waiting: ' + waiting + ' ms', periodX + 570, 644, 38, { color: C.ochre });
    if (renewed) {
      tag(c, 'Next period gets a fresh ' + budget.quota + ' ms quota', periodX, 685, periodWidth);
    }
    panel(c, 1202, 272, 640, 502, C.navy, C.navy);
    const jobX = 1240;
    const jobWidth = 558;
    const deadlineX = jobX + jobWidth;
    const deadlineSeconds = budget.deadlineMs / 1000;
    cap(c, 'SUPERVISOR CLOCK', jobX, 338, { color: '#c4dfd0' });
    label(c, 'Wall time for the whole job', jobX, 422, 53, { color: C.white, face: 'Serif', max: jobWidth });
    rect(c, jobX, periodY, jobWidth, 61, '#52656a');
    rect(c, jobX, periodY, jobWidth * (elapsedMs / budget.deadlineMs), 61, C.gold);
    line(c, deadlineX, periodY - 15, deadlineX, periodY + 73, C.gold, 4);
    mono(c, deadlineSeconds + ' s deadline', deadlineX, periodY - 24, 32, { color: C.gold, align: 'right' });
    mono(c, (elapsedMs / 1000).toFixed(3) + ' s elapsed', jobX, 644, 43, { color: C.white });
    if (teardown) tag(c, 'Whole-job teardown started', jobX, 685, jobWidth, C.ochre, '#f6e9c9');
    let takeaway = 'The two threads share a single quota.';
    if (expired) takeaway = 'Deadline reached.';
    else if (keepsCounting) takeaway = 'The job clock keeps counting past renewal.';
    else if (waiting && !renewed) takeaway = 'Both threads wait for the next period.';
    const detail = `${budget.quota} / ${budget.period} = ${cpuShare.toFixed(2)} logical CPU`;
    result(c, takeaway, expired ? 'termination   /   pending' : showShare ? detail : '');
  }
}
export function checkControls() {
  for (const route of routes) {
    assert(grant(route, 'report.xml'));
    assert(!grant(route, 'notes.txt'));
  }
  assert.equal(approved, sha(cachedBytes));
  assert.notEqual(approved, sha('report-schema v2\n'));
  assert.equal(sample.network, 'enforced deny');
  assert.equal(sample.marker, 'AMBER');
  for (const limit of [budget.scratch, budget.tasks]) {
    assert(accepts(limit - 1, 1, limit));
    assert(!accepts(limit, 1, limit));
  }
  assert.equal(budget.threads[0] + budget.threads[1], budget.quota);
  assert.equal(budget.quota / budget.period, 0.3);
  for (const [elapsedMs, renewed, usedA, usedB, waiting] of [
    [0, false, 0, 0, 0],
    [25, false, 20, 5, 0],
    [30, false, 20, 10, 0],
    [99, false, 20, 10, 69],
    [100, true, 20, 10, 70],
    [2900, true, 20, 10, 70],
    [3000, true, 20, 10, 70],
  ]) {
    assert.deepEqual(accountingAt(elapsedMs), { elapsedMs, renewed, usedA, usedB, waiting });
  }
}
