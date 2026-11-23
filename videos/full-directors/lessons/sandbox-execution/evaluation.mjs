import assert from 'node:assert/strict';
import { CANDIDATE_POOL } from '../../../films/sandbox-execution/construction.mjs';
import { passAtK } from '../../../films/sandbox-execution/arithmetic.mjs';
import { C, rect, line, label, mono, cap, panel, page, frame, tag, result, cue, disk } from './art.mjs';
import { fresh, scan, scanPage } from './parser.mjs';

const six = [...CANDIDATE_POOL, { id: 'C5', passed: false }];
function pairs(pool) {
  return pool.flatMap((a, i) => pool.slice(i + 1).map((b) => ({ a, b, success: a.passed || b.passed })));
}
function counts(pool) {
  const all = pairs(pool),
    win = all.filter((p) => p.success).length;
  return { total: all.length, win, miss: all.length - win, percent: (100 * win) / all.length };
}
const finalRun = {
  returned: scan(fresh).rows,
  expected: ['payments::retry'],
  network: 'Enforced deny',
  live: 0,
  files: 1,
  reset: false,
};
function decisions(run) {
  return {
    pass: run.returned.length === run.expected.length && run.expected.every((e, i) => e === run.returned[i]),
    admit: run.live === 0 && run.files === 0 && run.reset,
  };
}
function matrix(c, clock) {
  const b = clock.beat.beatIndex,
    expanded = b >= 2,
    pool = expanded ? six : CANDIDATE_POOL;
  const data = counts(pool);
  const misses = expanded ? cue(clock, 3, 'Six of fifteen') : cue(clock, 1, 'Three pairs');
  const total = expanded ? cue(clock, 3, 'Six of fifteen') : cue(clock, 1, 'ten possible pairs');
  const wins = expanded ? cue(clock, 3, 'Nine out of fifteen') : cue(clock, 1, 'Seven out of ten');
  const showEach = cue(clock, 0, 'two pass');
  frame(c, 'Functional evaluation   /   fixed candidate pool', 'Which pairs contain a passing candidate?');
  cap(c, 'TEST RESULTS', 81, 299);
  pool.forEach((s, i) => {
    const y = 343 + 72 * i;
    mono(c, s.id, 80, y + 31, 36);
    if (showEach)
      tag(
        c,
        s.passed ? 'Pass' : 'Fail',
        170,
        y - 12,
        156,
        s.passed ? C.teal : C.red,
        s.passed ? C.pale : C.blush,
      );
  });
  cap(c, 'PAIR OF DISTINCT INDICES', 443, 299);
  const dx = 130,
    dy = 81,
    x0 = 449,
    y0 = 371;
  pool.slice(1).forEach((s, j) => mono(c, s.id, x0 + (j + 1) * dx + 43, y0 - 16, 32, { align: 'center' }));
  pool.slice(0, -1).forEach((s, i) => mono(c, s.id, x0 + 38, y0 + i * dy + 46, 32, { align: 'center' }));
  for (const { a, b: right, success } of pairs(pool)) {
    const i = pool.indexOf(a),
      j = pool.indexOf(right),
      x = x0 + j * dx,
      y = y0 + i * dy;
    const prior = expanded && j < 5;
    const revealed = prior || (success ? wins : misses);
    panel(c, x, y, 89, 62, revealed ? (success ? C.pale : C.blush) : C.paper);
    if (revealed) {
      const color = success ? C.teal : C.red;
      if (success) {
        line(c, x + 26, y + 32, x + 39, y + 44, color, 6);
        line(c, x + 39, y + 44, x + 64, y + 18, color, 6);
      } else {
        line(c, x + 31, y + 18, x + 58, y + 45, color, 6);
        line(c, x + 58, y + 18, x + 31, y + 45, color, 6);
      }
    } else disk(c, x + 45, y + 31, 5, C.muted);
  }
  panel(c, 1314, 318, 530, 445, C.navy, C.navy);
  cap(c, 'AT LEAST ONE PASS', 1350, 385, { color: '#bfdbce' });
  mono(c, wins ? data.win + ' / ' + data.total : '?', 1350, 519, 91, { color: C.white, max: 453 });
  if (wins) label(c, data.percent + '%', 1350, 639, 92, { face: 'Serif', color: '#a6e5c5' });
  else if (misses) label(c, data.miss + ' all-failing pairs', 1350, 624, 40, { color: C.white, max: 449 });
  result(
    c,
    'Draw two different indices without replacement.',
    total ? data.total + ' possible pairs' : pool.length + ' candidates' + (showEach ? '   /   2 pass' : ''),
  );
}
export function evaluation(c, clock) {
  const b = clock.beat.beatIndex;
  if (b < 4) {
    matrix(c, clock);
    return;
  }
  if (b < 6) {
    frame(c, 'Transfer case   /   same parser, fresh report', 'What comes back from the payments report?');
    const answered = cue(clock, 5, 'Only payments');
    scanPage(c, fresh, answered ? fresh.length : 0, { freshCase: true });
    result(
      c,
      answered ? 'One identity survives all four cases.' : 'Predict the list before the parser returns.',
      'root namespace   /   urn:fresh',
    );
    return;
  }
  const q = decisions(finalRun),
    answered = cue(clock, 7, 'Keep the parser result'),
    held = cue(clock, 7, 'Hold the slot');
  const network = cue(clock, 6, 'recorded a deny'),
    exit = cue(clock, 6, 'verified zero live processes'),
    diskSeen = cue(clock, 6, 'holds one file');
  frame(c, 'Acceptance   /   two decisions', 'What can we accept from this job?');
  page(c, 75, 273, 844, 502);
  cap(c, 'PROTECTED VALIDATOR RECORD', 116, 344);
  mono(c, finalRun.returned[0], 116, 461, 54, { color: C.teal });
  label(c, 'Matches the expected output.', 116, 548, 41);
  if (answered && q.pass) tag(c, 'Parser result ready for review', 116, 644, 760);
  panel(c, 973, 273, 871, 502);
  cap(c, 'RUNTIME PROBE RECORD', 1012, 344);
  const rows = [
    ['Network', network ? finalRun.network : 'Awaiting record'],
    ['Live processes', exit ? String(finalRun.live) : 'Awaiting record'],
    ['Scratch files', diskSeen ? String(finalRun.files) : 'Awaiting record'],
  ];
  rows.forEach(([k, v], i) => {
    const y = 431 + i * 95;
    label(c, k, 1012, y, 39);
    mono(c, v, 1802, y, 38, {
      align: 'right',
      color: k === 'Scratch files' && diskSeen ? C.red : C.ink,
      max: 393,
    });
    line(c, 1012, y + 19, 1800, y + 19);
  });
  if (held && !q.admit) tag(c, 'Hold slot for verified reset', 1012, 670, 782, C.red, C.blush);
  result(
    c,
    held ? 'One fixture passed. One file still needs clearing.' : 'Read the two records before deciding.',
    held ? 'acceptance   /   independent of reuse' : 'test result   /   slot admission',
  );
}
export function checkEvaluation() {
  assert.deepEqual(counts(CANDIDATE_POOL), { total: 10, win: 7, miss: 3, percent: 70 });
  assert.deepEqual(counts(six), { total: 15, win: 9, miss: 6, percent: 60 });
  for (const pool of [CANDIDATE_POOL, six]) {
    assert.equal(new Set(pairs(pool).map((p) => p.a.id + '/' + p.b.id)).size, counts(pool).total);
    assert(Math.abs(passAtK(pool.length, 2, 2) - counts(pool).percent / 100) < 1e-12);
  }
  assert.deepEqual(decisions(finalRun), { pass: true, admit: false });
  assert.deepEqual(decisions({ ...finalRun, files: 0, reset: true }), { pass: true, admit: true });
}
