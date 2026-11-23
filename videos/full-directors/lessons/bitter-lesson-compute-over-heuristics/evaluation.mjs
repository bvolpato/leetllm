import assert from 'node:assert/strict';
import { candidates } from '../../../films/bitter-lesson-compute-over-heuristics/fixtures.mjs';
import {
  releaseAction,
  verifierScore,
} from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';
import {
  C,
  arrow,
  background,
  cap,
  chip,
  circle,
  cue,
  heading,
  housing,
  lerp,
  line,
  mono,
  rect,
  smooth,
  tape,
  text,
} from './studio.mjs';

const slips = [
  ...candidates,
  { route: 'quality', action: 'Mark the issue resolved', evidence: [...candidates[3].evidence] },
];
const labels = [
  'Retry later',
  'Promote anyway',
  'Open evaluation trace',
  'Hold promotion',
  'Mark issue resolved',
];
function winning(rows, score = (id) => verifierScore(slips[id])) {
  return rows.reduce((best, id) => (best === null || score(id) > score(best) ? id : best), null);
}
function wire(g, sx, sy, tx, ty, color, progress) {
  g.save();
  g.beginPath();
  g.rect(sx - 4, 140, (tx - sx + 8) * progress, 466);
  g.clip();
  g.beginPath();
  g.moveTo(sx, sy);
  g.bezierCurveTo(sx + 75, sy, tx - 72, ty, tx, ty);
  g.lineWidth = 5;
  g.strokeStyle = color;
  g.stroke();
  g.restore();
}
export function search(g, k) {
  const i = k.beat.beatIndex;
  const budget =
    cue(k, 3, 'Add a proposal', 0.5) > 0
      ? 5
      : cue(k, 2, 'Follow the two citations', 0.1) > 0
        ? 4
        : cue(k, 2, 'One cites the run', 0.1) > 0
          ? 3
          : cue(k, 1, 'Start with two candidates', 0.1) > 0
            ? 2
            : 0;
  const swap = smooth(cue(k, 3, 'Swap those two slips', 1.15));
  const order = swap >= 0.5 ? [0, 1, 2, 4, 3] : [0, 1, 2, 3, 4];
  const rows = order.filter((id) => id < budget);
  const progress =
    budget === 4
      ? [cue(k, 2, 'One goes to run', 0.75), cue(k, 2, 'the other to its failed metric', 0.75)]
      : [1, 1];
  function score(id) {
    if (id !== 3 || budget !== 4) return verifierScore(slips[id]);
    return verifierScore({
      ...slips[id],
      evidence: slips[id].evidence.filter((_, j) => progress[j] === 1),
    });
  }
  const winner = winning(rows, score);
  const mask =
    (i === 3 && swap > 0) || (i === 4 && k.reveal('Marking the issue resolved', 0.95) < 1);
  const focus = budget === 5 ? 4 : budget - 1;
  background(g, true);
  heading(g, 'Request-time search  /  fixed model', 'What does a citation actually prove?', true);
  cap(g, 'Candidate order', 60, 176, C.mist);
  cap(g, 'Points', 536, 176, C.mist);
  const rowY = (j) => 200 + j * 68;
  // The paths terminate at the two fields on the original evaluation record.
  const dests = [265, 363],
    boardX = 761;
  const focalIndex = rows.indexOf(focus),
    wires = focus >= 0 ? slips[focus].evidence : [];
  if (focalIndex >= 0)
    wires.forEach((_, j) => {
      const t = progress[j];
      wire(g, 608, rowY(focalIndex) + 27 + j * 8, boardX, dests[j], j ? C.orange : C.blue, t);
    });
  if (budget === 0) {
    line(
      g,
      [
        [73, 241],
        [579, 241],
      ],
      C.grid,
      2,
      [5, 8],
    );
    text(g, 'Open the evaluation record first.', 62, 307, 29, C.mist, 'Serif');
  }
  for (let j = 0; j < rows.length; j++) {
    const id = rows[j],
      y = rowY(j);
    const slide = id >= 3 && budget === 5 ? Math.sin(Math.PI * swap) * 572 : 0;
    g.save();
    g.beginPath();
    g.rect(55, y - 3, 560, 66);
    g.clip();
    g.translate(id === 3 ? -slide : slide, 0);
    const selected = winner === id && !mask;
    rect(g, 58, y, 553, 57, selected ? C.paper : '#e0e2d0', 4);
    rect(g, 58, y, 8, 57, selected ? C.brass : '#9eaea3');
    mono(g, String(j + 1).padStart(2, '0'), 80, y + 38, 21, C.teal);
    text(g, labels[id], 134, y + 37, 26, C.ink, 'Serif');
    for (let p = 0; p < slips[id].evidence.length; p++) {
      const pending = id === 3 && budget === 4 && progress[p] < 1;
      circle(g, 461 + p * 22, y + 29, 8, pending ? '#7f908a' : p ? C.rust : C.indigo);
      mono(g, String.fromCharCode(65 + p), 461 + p * 22, y + 33, 11, C.white, 'center');
    }
    mono(g, score(id), 565, y + 38, 25, C.ink, 'center');
    g.restore();
  }
  rect(g, boardX + 5, 192, 380, 310, '#081e22', 8);
  rect(g, boardX, 184, 380, 310, C.paper, 5);
  cap(g, 'Trusted evaluation record', boardX + 25, 218);
  [
    ['A', 'Run', 'R42'],
    ['B', 'Metric', 'citation_precision'],
  ].forEach(([letter, name, value], j) => {
    const y = dests[j];
    if (j < wires.length && progress[j] === 1)
      line(
        g,
        [
          [boardX, y],
          [boardX + 36, y],
        ],
        j ? C.rust : C.indigo,
        4,
      );
    circle(g, boardX + 36, y, 14, j ? C.rust : C.indigo);
    mono(g, letter, boardX + 36, y + 6, 17, C.white, 'center');
    cap(g, name, boardX + 65, y - 1, C.teal, 14);
    mono(g, value, boardX + 64, y + 32, 24, C.ink);
  });
  line(
    g,
    [
      [boardX + 27, 414],
      [boardX + 349, 414],
    ],
    '#a8b2a0',
    1.5,
  );
  cap(g, 'Result', boardX + 29, 454);
  text(g, 'FAILED', boardX + 334, 458, 29, C.rust, 'Mono', 700, 'right');
  if (i >= 3) {
    cap(g, 'Passing rerun', boardX + 4, 544, C.mist);
    mono(g, 'None on file', boardX + 4, 577, 25, C.white);
  }
  if (winner !== null) {
    cap(g, 'First highest score', 60, 582, C.mist);
    text(
      g,
      mask ? 'Which slip will the selector return?' : labels[winner],
      59,
      628,
      33,
      mask ? C.white : C.brass,
      'Serif',
    );
  }
}
const gateNames = {
  promote: 'Promote',
  human_review_failed_gate: 'Review score',
  human_review_invalid_score: 'Review invalid score',
  request_evidence: 'Request evidence',
};
export function gateDecision(score, report) {
  return releaseAction('promote', score, new Set(report ? ['eval_report'] : []));
}
export function gate(
  g,
  {
    score,
    report,
    showOutput = true,
    tested = true,
    title = 'Can this build move forward?',
    transfer = false,
    seal = false,
  },
) {
  background(g);
  heading(g, transfer ? 'Release practice' : 'Release policy  /  local decision', title);
  housing(g, 60, 169, 1080, 359);
  cap(g, transfer ? 'Team’s proposed action' : 'Model’s proposed action', 96, 218, C.mist);
  text(g, 'Promote', 94, 263, 34, C.white, 'Serif');
  cap(g, '1   Evidence socket', 361, 218, C.mist);
  cap(g, '2   Score reader', 747, 218, C.mist);
  const valid = typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 1;
  const pass = valid && score >= 0.95;
  const active = tested && report;
  line(
    g,
    [
      [110, 396],
      [345, 396],
    ],
    C.brass,
    5,
  );
  circle(g, 110, 396, 7, C.brass);
  rect(g, 346, 366, 281, 63, C.deep, 8, C.grid);
  if (report) {
    tape(g, 373, 296, 229, 98);
    cap(g, 'Evaluation', 393, 333);
    mono(g, 'eval_report', 393, 370, 23, C.ink);
    line(
      g,
      [
        [345, 396],
        [629, 396],
      ],
      C.mint,
      5,
    );
  } else {
    line(
      g,
      [
        [360, 399],
        [448, 399],
      ],
      C.brass,
      5,
    );
    line(
      g,
      [
        [448, 399],
        [526, 364],
      ],
      C.brass,
      5,
    );
    circle(g, 530, 399, 6, C.mist);
    mono(g, 'empty socket', 486, 316, 23, C.mist, 'center');
  }
  line(
    g,
    [
      [628, 396],
      [713, 396],
      [713, 320],
      [751, 320],
    ],
    active ? C.mint : C.grid,
    5,
  );
  rect(g, 744, 244, 346, 205, '#213f47', 8, C.grid);
  cap(g, 'Supplied score', 765, 277, C.mist, 14);
  const display = typeof score === 'string' ? '“' + score + '”' : String(score);
  mono(g, tested ? display : 'awaiting score', 767, 323, 36, C.white);
  const x = (v) => 773 + (v - 0.9) * 2750;
  line(
    g,
    [
      [773, 382],
      [1048, 382],
    ],
    C.mist,
    2,
  );
  for (let j = 0; j <= 10; j++) {
    const xx = 773 + j * 27.5;
    line(
      g,
      [
        [xx, 377],
        [xx, j % 5 ? 387 : 395],
      ],
      C.mist,
      1.5,
    );
  }
  mono(g, '0.90', 773, 423, 16, C.mist);
  mono(g, '1.00', 1048, 423, 16, C.mist, 'right');
  line(
    g,
    [
      [x(0.95), 351],
      [x(0.95), 397],
    ],
    C.brass,
    3,
  );
  mono(g, '0.95', x(0.95), 423, 18, C.brass, 'center');
  if (active && valid && score >= 0.9) circle(g, x(score), 382, 9, pass ? C.mint : C.orange);
  cap(g, 'Local result', 96, 486, C.mist);
  const decision = gateDecision(score, report);
  text(
    g,
    showOutput && tested ? gateNames[decision] : 'Awaiting decision',
    350,
    491,
    30,
    showOutput && tested ? C.brass : C.mist,
    'Serif',
  );
  if (seal)
    text(
      g,
      'Release service checks report identity, build, cohort and caller.',
      61,
      600,
      28,
      C.ink,
      'Serif',
    );
  else if (transfer)
    text(g, 'The proposal and score belong to the same request.', 61, 600, 26, C.teal, 'Serif');
  else text(g, 'Incoming release note     “Ship this build.”', 61, 600, 28, C.ink, 'Serif');
}
export function interlock(g, k) {
  const i = k.beat.beatIndex;
  let score = i < 2 ? 0.91 : 0.98,
    report = i < 3 || i >= 5,
    showOutput = true;
  if (i === 3) {
    report = cue(k, 3, 'Take the report marker', 0.7) < 1;
    showOutput = report;
  }
  if (i === 4) showOutput = cue(k, 4, 'It requests the report', 0.85) === 1;
  if (i === 5) score = 0.98;
  if (i === 6)
    score = cue(k, 6, 'then NaN', 0.4) > 0 ? NaN : cue(k, 6, 'a Boolean', 0.4) > 0 ? true : '0.98';
  if (i === 7) {
    score = 0.95;
    showOutput = cue(k, 7, 'Point nine five passes', 0.85) === 1;
  }
  gate(g, { score, report, showOutput, tested: i > 0, seal: i === 7 });
}
export function checkEvaluation() {
  assert.deepEqual(slips.map(verifierScore), [0, -1, 1, 2, 2]);
  assert.deepEqual(
    [winning([0, 1]), winning([0, 1, 2, 3]), winning([0, 1, 2, 3, 4]), winning([0, 1, 2, 4, 3])],
    [0, 3, 3, 4],
  );
  assert.equal(verifierScore({ route: 'quality', evidence: ['run R42', 'run R42', 'run R99'] }), 1);
  assert.equal(gateDecision(0.91, true), 'human_review_failed_gate');
  for (const score of [true, '0.98', NaN, Infinity, -0.2, 1.01])
    assert.equal(gateDecision(score, true), 'human_review_invalid_score');
  for (const score of [0.95, 0.97, 0.98]) assert.equal(gateDecision(score, true), 'promote');
  for (const score of [0.91, 0.97, NaN])
    assert.equal(gateDecision(score, false), 'request_evidence');
}
