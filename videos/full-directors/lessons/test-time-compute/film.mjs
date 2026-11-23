import assert from 'node:assert/strict';
import {
  seats,
  extras,
  candidates,
  scored,
  prune,
  budgets,
  quality,
  latency,
  kvPerToken,
  finalRequest,
} from '../../../films/test-time-compute/fixtures.mjs';
import {
  coverage,
  promptCoverage,
  rawKVBytes,
} from '../../../films/test-time-compute/arithmetic.mjs';
import {
  chooseBudget,
  chooseFeasible,
  plurality,
  retainedBranchLedger,
} from '../../../films/test-time-compute/model.mjs';
import { checkedRevisionLedger } from '../../../films/test-time-compute/construction.mjs';
import {
  C,
  limit,
  box,
  line,
  dot,
  type,
  title,
  label,
  mono,
  footer,
  arrow,
  room,
  roomPlaces,
  tableCount,
  roomCount,
  background,
} from './art.mjs';

// Register the first words of a spoken answer for the host caption boundary.
// Commit the result at the following clause or at the end of the take.
function cue(c, b, words, seconds = 0) {
  const i = c.beat.beatIndex;
  if (i !== b) return Number(i > b);
  return c.reveal(words, seconds);
}
function done(c, b, answer, following) {
  if (c.beat.beatIndex !== b) return c.beat.beatIndex > b;
  c.reveal(answer, 0);
  return following ? Boolean(c.reveal(following, 0)) : c.elapsed >= c.speechDuration;
}
const f3 = (n) => n.toFixed(3);
const pct = (n) => (100 * n).toFixed(1) + '%';
const group = (n) => n.toLocaleString('en-US');
const best = (rows) => rows.reduce((winner, row) => (row.score > winner.score ? row : winner));
const matches = (pool) => pool.findIndex((n) => n === roomCount);

function opening(g, c) {
  const b = c.beat.beatIndex;
  if (b === 3) {
    title(g, 'Training compute', 'What did two training passes cost?');
    const seen = done(c, 3, 'forty billion', 'With three');
    const cost = done(c, 3, 'seven point two', 'For a mixture');
    const pass = cue(c, 3, 'Two passes', 1.1);
    label(g, 'Dense non-embedding parameters', 80, 274);
    mono(g, '3 billion', 80, 374, 76);
    label(g, 'Processed tokens', 655, 274);
    for (let i = 0; i < 2; i++) {
      const show = i === 0 || pass > 0;
      if (show) {
        box(g, 655, 315 + i * 85, 485, 59, i ? C.blue : C.mint, 4);
        mono(g, '20 billion', 676, 358 + i * 85, 35, C.ink);
      }
    }
    if (seen) mono(g, '40 billion', 1172, 396, 44, C.mint);
    label(g, 'Dense training estimate', 80, 570);
    mono(g, '6 × parameters × processed tokens', 80, 634, 48);
    footer(g, cost ? 'About 7.2 × 10²⁰ FLOPs across both passes.' : 'Repeated passes count again.');
    return;
  }
  const counts = ['at the first', 'at the second', 'at the third', 'at the fourth'].map((s) =>
    cue(c, 0, s),
  );
  const counted = counts.filter(Boolean).length;
  const wall = Math.ceil(extras * cue(c, 1, 'along the wall', 1.4));
  const draft = done(c, 0, 'thirty-two', 'Before we ask');
  const sum = done(c, 1, 'gives forty-four', 'Now the organizer');
  title(g, 'The banquet room', 'How many chairs can we promise?');
  room(g, 67, 206, 728, { counted, wall });
  label(g, 'FIRST DRAFT', 920, 267);
  mono(g, draft ? tableCount : '…', 914, 415, 132, C.gold);
  label(g, 'Table chairs counted so far', 920, 472);
  mono(g, counted + ' × ' + seats + ' = ' + counted * seats, 920, 533, 47);
  if (wall === extras) {
    label(g, 'Chairs along the wall', 920, 611);
    mono(g, '+ ' + extras, 920, 680, 54, C.gold);
  }
  if (sum) {
    label(g, 'CHECKED COUNT', 1220, 267);
    mono(g, roomCount, 1214, 415, 132, C.mint);
  }
  if (b === 2) {
    const actions = [
      ['a longer attempt', 'Extend'],
      ['several candidates', 'Sample'],
      ['a revision', 'Revise'],
      ['or a check', 'Check'],
    ];
    actions.forEach(([phrase, name], i) => {
      if (cue(c, 2, phrase)) {
        const x = 76 + i * 177;
        box(g, x, 752, 153, 58, C.panel, 5);
        type(g, name, x + 76, 792, 30, C.white, 'Sans', 'center');
      }
    });
    label(g, 'Same weights throughout the request', 915, 790, C.gold);
  } else
    footer(
      g,
      sum
        ? 'One independent count includes the chairs along the wall.'
        : 'Check the whole room before asking for a second draft.',
    );
}

function ballot(g, c) {
  const edited = cue(c, 3, 'to forty');
  const pool = candidates.map((v, i) => (edited && i === 2 ? 40 : v));
  const vote = done(c, 1, 'Thirty-two wins', 'That is');
  const accepted = done(c, 2, 'third draft matches', 'A best');
  const absent = done(c, 4, 'no matching draft', 'A selector');
  title(g, 'Four drafts', 'Which reply survives each rule?');
  room(g, 69, 233, 583, { counted: 4, wall: 12 });
  mono(g, '4 × 8 + 12 = ' + roomCount, 80, 703, 42, C.gold);
  label(g, 'Draft', 735, 242);
  label(g, 'Chair count', 883, 242);
  label(g, 'Plurality', 1100, 242);
  label(g, 'Room check', 1312, 242);
  pool.forEach((n, i) => {
    const y = 319 + i * 90;
    line(g, 732, y + 22, 1510, y + 22);
    mono(g, 'D' + (i + 1), 741, y, 36, C.soft);
    mono(g, n, 903, y, 53);
    if (vote && n === plurality(pool)) dot(g, 1134, y - 14, 12, C.gold);
    if ((accepted && (!edited || i !== 2)) || absent)
      type(g, n === roomCount ? 'matches' : 'miss', 1315, y, 32, n === roomCount ? C.mint : C.soft);
  });
  if (vote) mono(g, 'Vote  ' + plurality(pool), 735, 703, 41, C.gold);
  if (accepted && !edited) mono(g, 'Checked  ' + pool[matches(pool)], 1100, 703, 41, C.mint);
  if (absent) mono(g, 'No match', 1100, 703, 41, C.red);
  footer(
    g,
    edited
      ? 'The room is unchanged. Draft three now says 40.'
      : 'Both rules receive exactly the same four replies.',
  );
}

const attemptCount = 4;
const tokensPerAttempt = 800;
const selectorRecall = 0.8;
const missShares = Array.from({ length: attemptCount + 1 }, (_, i) => 1 - coverage(i));
const coveredShare = coverage(attemptCount);
const returnedShare = coveredShare * selectorRecall;
const selectionMissShare = coveredShare - returnedShare;

function coverageScene(g, c) {
  const first = cue(c, 0, 'missed the first try', 0.75);
  const next = cue(c, 1, 'Take four tries', 2.4);
  const stage = first + (attemptCount - 1) * next;
  const show = done(c, 2, 'About sixty-eight percent', 'Subtract');
  const selected = done(c, 3, 'About fifty-five percent', 'The gap');
  const recallKnown = cue(c, 3, 'Multiply coverage');
  const perTryKnown = cue(c, 1, 'The narrow end');
  const tokensKnown = done(c, 2, 'thirty-two hundred generated tokens', 'whichever answer');
  title(g, 'A fixed prompt', 'Where do the all-miss pools go?');
  label(g, 'Independent tries  •  Same ' + Math.round(100 * coverage(1)) + '% hit rate per try', 73, 239);
  if (recallKnown) {
    type(
      g,
      'Selector recall given a hit  ' + Math.round(100 * selectorRecall) + '%',
      1512, 239, 27, C.blue, 'Sans', 'right',
    );
  } else if (show) {
    mono(g, 'Coverage = 1 − ' + missShares[1].toFixed(2) + '⁴', 1512, 239, 30, C.mint, 'right');
  }

  const left = 280;
  const right = 1512;
  const x = (share) => left + share * (right - left);
  const center = (a, b) => (a + b) / 2;
  const top = 304;
  const spacing = 65;
  const height = 43;
  const lastY = top + spacing * attemptCount;
  label(g, 'All-miss pools', 73, 283, C.gold);
  mono(g, '0%', left, 282, 26, C.soft, 'center');
  mono(g, '100%', right, 282, 26, C.soft, 'right');
  line(g, left, top - 9, left, lastY + height + 9);
  line(g, right, top - 9, right, lastY + height + 9);

  for (const [i, miss] of missShares.entries()) {
    if (i > 0 && stage <= i - 1) break;
    const y = top + i * spacing;
    const trim = limit(stage - i + 1);
    const previous = missShares[Math.max(0, i - 1)];
    const remaining = previous + trim * (miss - previous);
    label(g, i === 0 ? 'Start' : 'Try ' + i, 73, y + 31);
    box(g, left, y, right - left, height, C.panel, 4);
    box(g, left, y, x(remaining) - left, height, C.gold, 4);
    if (trim === 1) {
      const labelX = i === attemptCount ? center(left, x(miss)) : x(miss) - 14;
      mono(g, pct(miss), labelX, y + 32, 32, C.ink, i === attemptCount ? 'center' : 'right');
    }
  }

  if (show) {
    const coverageStart = x(missShares.at(-1));
    // Keep the coverage endpoints fixed while the selector splits those pools.
    box(g, coverageStart, lastY, right - coverageStart, height, C.mint);
    if (selected) {
      const returnedStart = x(1 - returnedShare);
      box(g, coverageStart, lastY, returnedStart - coverageStart, height, C.soft);
      box(g, returnedStart, lastY, right - returnedStart, height, C.blue);
      const missedCenter = center(coverageStart, returnedStart);
      const returnedCenter = center(returnedStart, right);
      mono(g, pct(selectionMissShare), missedCenter, lastY + 32, 32, C.ink, 'center');
      mono(g, pct(returnedShare), returnedCenter, lastY + 32, 32, C.ink, 'center');
      type(g, 'Selector miss', missedCenter, 645, 26, C.soft, 'Sans', 'center');
      type(g, 'Correct return', returnedCenter, 645, 28, C.blue, 'Sans', 'center');
    }
    type(g, 'No correct candidate', center(left, coverageStart), 645, 28, C.gold, 'Sans', 'center');
    line(g, coverageStart, 666, right, 666, C.mint, 3);
    for (const edge of [coverageStart, right]) line(g, edge, 654, edge, 666, C.mint, 3);
    type(
      g,
      'At least one correct candidate  ' + pct(coveredShare),
      center(coverageStart, right), 710, 33, C.mint, 'Sans', 'center',
    );
  }

  footer(
    g,
    tokensKnown
      ? attemptCount + ' tries × ' + tokensPerAttempt + ' tokens = ' +
          group(attemptCount * tokensPerAttempt) + ' generated tokens.'
      : perTryKnown
        ? tokensPerAttempt + ' generated tokens per try.'
        : 'Each try leaves three quarters of the previous misses.',
  );
}
const samples = [
  [0.7, 0.3],
  [0.95, 0.1],
];
const pairResults = samples.map((pair) => promptCoverage(pair, 3));
function distribution(g, c) {
  const before = done(c, 1, 'eighty-one point five', 'Keep that baseline');
  const after = cue(c, 1, 'After training');
  const newResults = done(c, 2, 'It falls', 'The easy prompt');
  title(g, 'Two equally weighted prompts', 'Does the training change help three tries?');
  label(g, 'Hit probability for one try', 75, 248);
  label(g, 'Coverage in three independent tries', 825, 248);
  function row(x, y, tag, p, cov, color, show) {
    type(g, tag, x, y, 29, C.white);
    mono(g, pct(p), x + 173, y, 39, color);
    box(g, x + 355, y - 32, 275, 30, C.panel, 3);
    box(g, x + 355, y - 32, 275 * p, 30, color, 3);
    if (show) {
      box(g, 829, y - 32, 395, 30, C.panel, 3);
      box(g, 829, y - 32, 395 * cov, 30, color, 3);
      mono(g, cov > 0.999 ? (100 * cov).toFixed(4) + '%' : pct(cov), 1245, y, 36, color);
    }
  }
  for (let j = 0; j < (after ? 2 : 1); j++) {
    const color = j ? C.gold : C.blue;
    label(g, j ? 'AFTER TRAINING' : 'BEFORE TRAINING', 75, 314 + j * 209, color);
    for (let i = 0; i < 2; i++)
      row(
        75,
        377 + j * 209 + i * 68,
        'Prompt ' + (i ? 'B' : 'A'),
        samples[j][i],
        pairResults[j].rows[i],
        color,
        j ? newResults : before,
      );
  }
  const means = samples.map((r) => (r[0] + r[1]) / 2);
  footer(
    g,
    newResults
      ? 'Mean hit rate  ' +
          pct(means[0]) +
          ' → ' +
          pct(means[1]) +
          '       Mean coverage  ' +
          pct(pairResults[0].mean) +
          ' → ' +
          pct(pairResults[1].mean)
      : before
        ? 'Three tries before training cover ' + pct(pairResults[0].mean) + ' on average.'
        : 'For each prompt, coverage = 1 − (1 − p)³.',
  );
}

function ranking(g, c) {
  const count =
    1 + Number(Boolean(cue(c, 0, 'Add a second'))) + Number(Boolean(cue(c, 1, 'Forty-eight gets')));
  const pool = scored.slice(0, count);
  const picked =
    count < 3 ? best(pool) : done(c, 2, 'Forty-eight', 'Put the last') ? best(pool) : null;
  const audited = done(c, 3, 'It returns forty-four', 'A bigger search');
  const reply = audited ? pool.find((r) => r.answer === roomCount) : picked;
  title(g, 'Scoring the room', 'Which chair count goes to the organizer?');
  room(g, 72, 230, 588, { counted: 4, wall: 12 });
  mono(g, 'Room count  ' + roomCount, 81, 701, 41, C.mint);
  label(g, 'Draft', 730, 253);
  label(g, 'Learned score', 915, 253);
  pool.forEach((r, i) => {
    const y = 322 + i * 93;
    mono(g, r.answer, 734, y, 54);
    box(g, 915, y - 29, 318, 27, C.panel, 3);
    box(g, 915, y - 29, 318 * r.score, 27, C.blue, 3);
    mono(g, r.score.toFixed(2), 1265, y, 42);
    if (audited)
      type(
        g,
        r.answer === roomCount ? 'pass' : 'miss',
        1413,
        y,
        30,
        r.answer === roomCount ? C.mint : C.soft,
      );
  });
  label(g, audited ? 'Room-checked reply' : 'Highest-score reply', 733, 608);
  mono(g, reply ? reply.answer : '?', 733, 694, 77, reply?.answer === roomCount ? C.mint : C.gold);
  if (reply?.answer > roomCount)
    for (let i = roomCount + 1; i <= reply.answer; i++) {
      const x = 936 + (i - roomCount - 1) * 118;
      box(g, x, 620, 92, 77, C.gold, 6);
      mono(g, i, x + 46, 673, 37, C.ink, 'center');
    }
  footer(
    g,
    audited
      ? 'The room check recovers the original draft.'
      : reply?.answer > roomCount
        ? 'Four surplus numbers have no chairs.'
        : 'Each draft answers for the same room.',
  );
}

const callCues = [
  [0, 'Our first draft'],
  [1, 'Pay for a critique'],
  [1, 'Pay for a rewrite'],
  [2, 'Buy another critique'],
  [2, 'then another rewrite'],
  [2, 'the next critique'],
  [2, 'and rewrite run'],
];
function revisionState(c) {
  const progress = callCues.map(([b, words]) => cue(c, b, words, 0.65));
  const calls = progress.filter((p) => p > 0).length;
  const complete = [
    done(c, 0, 'The room check fails'),
    done(c, 1, 'passes the room check', 'Pin that answer'),
    done(c, 2, 'room check fails', 'Keep the checked copy'),
    done(c, 3, 'point seven eight zero', 'Has the loop'),
  ].filter(Boolean).length;
  return {
    progress,
    calls,
    complete,
    ledger: complete ? checkedRevisionLedger(complete) : null,
    stop: done(c, 4, 'gain was one thousandth', 'That last round'),
  };
}
function revision(g, c) {
  const s = revisionState(c);
  title(g, 'Sequential revision', 'Which draft would you keep?');
  label(g, 'Draft', 73, 255);
  label(g, 'Chairs', 347, 255);
  label(g, 'Auxiliary score', 526, 255);
  label(g, 'Room check', 790, 255);
  const rows = checkedRevisionLedger(4).rows;
  const answerKnown = [
    cue(c, 0, 'with an auxiliary score'),
    cue(c, 1, 'and passes the room check'),
    cue(c, 2, 'Its score rose'),
    cue(c, 3, 'Its score is'),
  ];
  const scoreKnown = [
    cue(c, 0, 'The room check fails'),
    cue(c, 1, 'Continue while'),
    cue(c, 2, 'but the room check fails'),
    cue(c, 3, 'up from point'),
  ];
  for (const [i, row] of rows.entries()) {
    const y = 327 + i * 77;
    line(g, 72, y + 23, 976, y + 23);
    const inFlight = s.calls >= Math.max(1, 2 * i) && !answerKnown[i];
    mono(g, row.id, 75, y, 38, answerKnown[i] ? C.white : C.soft);
    if (answerKnown[i]) {
      mono(g, row.answer, 349, y, 43);
    } else if (inFlight) {
      const active = s.progress[s.calls - 1] < 1;
      const critique = s.calls === 2 * i;
      let status = critique ? 'feedback ready' : 'awaiting check';
      if (active) status = critique ? 'critiquing' : i === 0 ? 'drafting' : 'rewriting';
      label(g, status, 347, y);
    }
    if (scoreKnown[i]) mono(g, f3(row.score), 527, y, 42, C.gold);
    if (i < s.complete)
      type(g, row.passed ? 'pass' : 'miss', 793, y, 33, row.passed ? C.mint : C.red);
  }
  box(g, 1039, 228, 478, 309, C.panel, 10);
  label(g, 'Best checked answer', 1078, 284);
  mono(
    g,
    s.ledger?.best ? s.ledger.best.answer : '…',
    1074,
    417,
    104,
    s.ledger?.best ? C.mint : C.soft,
  );
  label(g, s.ledger?.best ? 'D2  •  4 × 8 + 12' : 'Awaiting a match', 1080, 484);
  label(g, 'Generation calls paid', 77, 652);
  for (let i = 0; i < 7; i++) {
    const x = 374 + i * 135;
    box(g, x, 608, 121, 62, C.panel, 5);
    if (s.progress[i] > 0) {
      box(g, x, 608, 121 * s.progress[i], 62, i === 0 ? C.white : i % 2 ? C.gold : C.blue, 4);
      if (s.progress[i] > 0.75)
        type(
          g,
          i === 0 ? 'draft' : i % 2 ? 'critique' : 'rewrite',
          x + 61,
          649,
          23,
          C.ink,
          'Sans',
          'center',
        );
    }
  }
  mono(g, s.calls, 1387, 659, 53, C.gold);
  footer(
    g,
    s.stop
      ? f3(s.ledger.latest.score) +
          ' − ' +
          f3(rows[2].score) +
          ' = ' +
          f3(s.ledger.gain) +
          '. Stop below 0.010. Return ' +
          s.ledger.best.id +
          '.'
      : s.complete >= 2
        ? 'Continue when the auxiliary score gains at least 0.010.'
        : 'Check each new answer against the same forty-four chairs.',
  );
}

function pathState(step) {
  const rows = prune.map((n) => Math.min(n, step));
  return { rows, total: rows.reduce((a, b) => a + b, 0), stopped: prune.map((n) => step >= n) };
}
function pathScene(g, c) {
  const one = cue(c, 1, 'Advance all four', 0.95),
    two = cue(c, 2, 'Advance the three', 0.9),
    three = cue(c, 2, 'C reaches', 0.9),
    tail = cue(c, 3, 'A runs to the end', 2.1);
  const stage = one + two + three + tail * 5;
  const s = pathState(Math.min(8, Math.floor(stage + 1e-8)));
  const result = done(c, 4, 'Fourteen generated steps', 'We also');
  title(g, 'Process checks', 'Which steps have we already paid for?');
  label(g, 'Path', 75, 248);
  for (let i = 0; i < 8; i++) mono(g, i + 1, 307 + i * 126, 249, 28, C.soft, 'center');
  s.rows.forEach((n, r) => {
    const y = 315 + r * 91;
    mono(g, 'ABCD'[r], 82, y + 37, 48);
    for (let i = 0; i < 8; i++) {
      const x = 256 + i * 126;
      box(g, x, y, 105, 53, C.panel, 5);
      if (i < n) box(g, x, y, 105, 53, r === 0 && n === 8 ? C.mint : C.blue, 5);
      if (i === n && stage > n && n < prune[r]) box(g, x, y, 105 * limit(stage - n), 53, C.blue, 4);
    }
    if (s.stopped[r]) {
      const x = 256 + (n - 1) * 126 + 111;
      line(g, x, y - 4, x, y + 57, r === 0 ? C.mint : C.gold, 6);
      type(
        g,
        (r === 0 ? 'finished' : 'cut') + ' at ' + n,
        1302,
        y + 37,
        31,
        r === 0 ? C.mint : C.gold,
      );
    }
  });
  const baseline = done(c, 0, 'thirty-two steps', 'A process');
  footer(
    g,
    result
      ? s.total +
          ' generated steps and ' +
          s.total +
          ' process checks. Full paths cost 32 steps and 4 outcome checks.'
      : baseline
        ? 'Full-length comparison: four paths of eight steps, one outcome check per path.'
        : 'Four paths can each run to eight steps.',
  );
}
const completions = [42, 43, 42, 41, 42];
const correctProduct = 6 * 7;
const hits = completions.filter((v) => v === correctProduct).length;
function targets(g, c) {
  const labels = done(c, 1, 'Three of the five', 'An any-success');
  const scores = done(c, 1, 'three fifths', 'The original');
  title(g, 'Step supervision', 'Can a wrong step have a successful continuation?');
  box(g, 88, 343, 390, 177, C.panel, 8);
  label(g, 'Prefix shared by all five', 116, 394);
  mono(g, '6 × 7 = 43', 114, 470, 46, labels ? C.red : C.white);
  const sx = 479,
    sy = 433;
  const expanded = cue(c, 0, 'a model finishes', 1.1);
  for (let i = 0; i < 5; i++) {
    const y = 278 + i * 80;
    if (expanded < (i + 1) / 5) continue;
    line(g, sx, sy, 675, y, C.line, 4);
    line(g, 675, y, 778, y, C.line, 4);
    dot(g, 782, y, 7, C.soft);
    mono(
      g,
      completions[i],
      817,
      y + 15,
      45,
      labels && completions[i] === correctProduct ? C.mint : C.white,
    );
    if (labels)
      type(
        g,
        completions[i] === correctProduct ? 'pass' : 'miss',
        924,
        y + 11,
        29,
        completions[i] === correctProduct ? C.mint : C.soft,
      );
  }
  if (scores) {
    label(g, 'Any success', 1152, 330);
    mono(g, Number(hits > 0), 1150, 415, 74, C.mint);
    label(g, 'Fraction successful', 1152, 524);
    mono(g, hits + ' / ' + completions.length, 1150, 611, 74, C.mint);
  }
  footer(
    g,
    labels
      ? 'Local check: the prefix is false. The rollout labels describe its possible continuations.'
      : 'Check each final answer against the product.',
  );
}
// Each proposed step extends exactly one retained prefix.
function extend(parent, text, stepScore, finished = false) {
  return { parent, text, stepScore, score: Math.min(parent.score, stepScore), finished };
}
const root = { text: '4 × 8 = ' + tableCount, score: 0.9 };
const choices = [
  extend(root, 'Recount one table', 0.64),
  extend(root, 'Add the wall chairs', 0.88),
];
const beamWidth = 1;
function retain(paths) {
  return paths.filter((p) => !p.finished).sort((a, b) => b.score - a.score).slice(0, beamWidth);
}
const [nextInput] = retain(choices);
const proposed = [
  extend(nextInput, tableCount + ' + ' + extras + ' = ' + roomCount, 0.81, true),
  extend(nextInput, 'Verify wall count', 0.79),
];
const completedPath = best(proposed.filter((p) => p.finished));
const [activePath] = retain(proposed);
const frontier = { finished: completedPath.score, active: activePath.score, next: 0.95 };

function expansion(g, c) {
  const parentScore = cue(c, 0, 'point nine');
  const selected = cue(c, 1, 'Drop the recount');
  const call = cue(c, 1, 'Feed the table count', 0.8);
  const childY = [315, 511];
  const inputY = childY[choices.indexOf(nextInput)];
  title(g, 'Guided tree search', 'Which prefix gets the next generation call?');
  label(g, 'Retained prefix', 75, 243);
  label(g, 'Proposed next steps', 479, 243);
  if (call) label(g, 'From the kept prefix', 1076, 243, C.gold);
  box(g, 75, 353, 294, 118, C.panel, 7);
  mono(g, root.text, 98, 403, 38);
  if (parentScore) label(g, 'Score  ' + root.score.toFixed(2), 100, 445, C.blue);
  const seen = [cue(c, 0, 'recount one table'), cue(c, 0, 'or add the wall chairs')];
  const rated = [cue(c, 0, 'point six four'), cue(c, 0, 'point eight eight')];
  choices.forEach((path, i) => {
    if (!seen[i]) return;
    const y = childY[i];
    const kept = path === nextInput;
    const color = selected ? (kept ? C.mint : C.soft) : C.blue;
    arrow(g, 369, 412, 476, y + 29, color);
    box(g, 479, y - 27, 346, 118, C.panel, 7);
    type(g, path.text, 500, y + 18, 34, C.white, 'Serif');
    if (rated[i]) mono(g, path.score.toFixed(2), 501, y + 67, 36, color);
    if (selected) label(g, kept ? 'keep' : 'prune', 645, y + 65, color);
  });
  if (call) {
    const x = 830 + 160 * call;
    line(g, 830, inputY + 29, x, inputY + 29, C.mint, 6);
    dot(g, x, inputY + 29, 9, C.gold);
    label(g, 'Generate', 856, inputY - 1, C.gold);
  }
  const answered = [cue(c, 1, 'equals forty-four'), cue(c, 1, 'verify the wall count')];
  const scoredChild = [cue(c, 1, 'point eight one'), cue(c, 1, 'point seven nine')];
  proposed.forEach((path, i) => {
    if (!answered[i]) return;
    const y = childY[i];
    const color = path.finished ? C.mint : C.blue;
    arrow(g, 991, inputY + 29, 1071, y + 29, color);
    box(g, 1076, y - 27, 445, 118, C.panel, 7);
    type(g, path.text, 1099, y + 18, 38, C.white, 'Serif');
    label(g, path.finished ? 'Finished answer' : 'Unfinished path', 1099, y + 65, color);
    if (scoredChild[i]) mono(g, path.score.toFixed(2), 1395, y + 66, 34, color);
  });
  if (cue(c, 0, 'Rank each path')) label(g, 'Path score = lowest step so far', 75, 675);
  footer(g, 'Beam width ' + beamWidth + '   •   One unfinished path can receive the next call.');
}

function frontierScene(g, c) {
  if (c.beat.beatIndex < 2) return expansion(g, c);
  const progress = (beat, first, last = first) => {
    if (c.beat.beatIndex !== beat) return Number(c.beat.beatIndex > beat);
    const start = c.wordCue(first).start;
    return c.reveal(first, c.wordCue(last).end - start, { captionStart: false });
  };
  cue(c, 3, 'point nine five');
  done(c, 3, 'minimum stays', 'Even a perfect');
  const latest = cue(c, 4, 'This time') > 0;
  done(c, 4, 'It rises', 'The old score');
  const extensionKnown = progress(3, 'point nine five') === 1;
  const minTest = progress(3, 'minimum stays', 'point seven nine');
  const latestTest = progress(4, 'It rises', 'point nine five');
  const { finished, active, next } = frontier;
  title(g, 'Retained search frontier', 'Can this path still beat the finished answer?');
  const lo = 0.65;
  const hi = 1;
  const x = (value) => 244 + ((value - lo) / (hi - lo)) * 1040;
  const finishedY = 291;
  const activeY = 431;
  const proposalY = 552;
  for (const tick of [0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1]) {
    const xx = x(tick);
    line(g, xx, 260, xx, 570, C.panel, 2);
    mono(g, tick.toFixed(2), xx, 617, 28, C.soft, 'center');
  }
  line(g, x(finished), finishedY, x(finished), proposalY, C.mint, 3);
  label(g, 'Finished answer   •   ' + completedPath.text, 75, 240);
  line(g, x(lo), finishedY, x(finished), finishedY, C.mint, 12);
  dot(g, x(finished), finishedY, 13, C.mint);
  mono(g, finished.toFixed(2), x(finished) + 25, finishedY + 12, 39, C.mint);
  label(g, 'Unfinished path   •   ' + activePath.text, 75, 379);
  line(g, x(lo), activeY, x(active), activeY, C.blue, 12);
  dot(g, x(active), activeY, 12, C.blue);
  if (!latest || latestTest === 0)
    mono(g, active.toFixed(2), x(active) - 23, activeY + 47, 33, C.blue, 'right');
  if (extensionKnown) {
    label(g, 'Same possible next step', 75, 520, C.gold);
    const px = x(next);
    line(g, px, proposalY, px, proposalY - 25, C.gold, 3);
    dot(g, px, proposalY, 11, C.gold);
    mono(g, next.toFixed(2), px + 22, proposalY + 11, 37, C.gold);
    if (latestTest > 0) {
      const at = x(active + (next - active) * latestTest);
      line(g, x(active), activeY, at, activeY, C.gold, 11);
      dot(g, at, activeY, 13, C.gold);
      if (latestTest === 1)
        mono(g, next.toFixed(2), at + 20, activeY + 12, 38, C.gold);
    } else if (!latest && minTest > 0) {
      const at = x(next + (active - next) * minTest);
      line(g, x(next), proposalY, at, proposalY, C.gold, 5);
      dot(g, at, proposalY, 7, C.gold);
      if (minTest === 1) {
        arrow(g, at, proposalY - 12, at, activeY + 17, C.blue);
        type(g, 'Minimum stays here', at - 24, proposalY - 31, 25, C.blue, 'Sans', 'right');
      }
    }
  }
  const takeaway = latest
    ? latestTest === 1
      ? '0.95 clears 0.81. Keep searching. The path is still unfinished.'
      : 'Latest-step rule: can the same step clear the finished score?'
    : minTest === 1
      ? progress(3, 'We can skip that call') === 1
        ? '0.79 bounds this retained path. Skip the call.'
        : 'This path stays below the finished score of 0.81.'
      : 'Could a retained unfinished path still beat 0.81?';
  line(g, 68, 645, 1532, 645);
  type(g, takeaway, 68, 683, 31, C.white, 'Serif');

}

function node(g, x, y, w, role, value, color) {
  box(g, x, y, w, 110, C.panel, 7);
  box(g, x, y, 7, 110, color, 2);
  label(g, role, x + 24, y + 39, color);
  type(g, value, x + 24, y + 84, 34, C.white, 'Serif');
}
function lineage(g, c) {
  const b = c.beat.beatIndex;
  if (b === 0 && !cue(c, 0, 'For R1')) {
    title(g, 'R1-Zero', 'What does a model learn from a checked answer?');
    node(g, 79, 309, 310, 'Starting weights', 'Pretrained base', C.blue);
    node(g, 557, 309, 430, 'Model output', 'Worked solution', C.white);
    arrow(g, 395, 361, 547, 361, C.blue);
    if (cue(c, 0, 'rule-based accuracy')) {
      node(g, 1104, 309, 410, 'Rule-based rewards', 'Accuracy and format', C.mint);
      arrow(g, 994, 361, 1095, 361, C.mint);
      line(g, 1310, 424, 1310, 550, C.mint, 4);
      line(g, 1310, 550, 233, 550, C.mint, 4);
      arrow(g, 233, 550, 233, 426, C.mint);
    }
    footer(g, 'Reinforcement learning uses the reward to update the policy.');
    return;
  }
  title(
    g,
    'Learning from search',
    b === 3
      ? 'What reaches the smaller student?'
      : 'Where do the weights and the examples come from?',
  );
  if (b === 3) {
    const sent = cue(c, 3, 'imitate the accepted text', 1);
    node(g, 80, 292, 380, 'Teacher search', 'Alternative solutions', C.blue);
    node(g, 610, 230, 370, 'Filter passes', 'Accepted trace text', C.mint);
    node(g, 610, 432, 370, 'Teacher retains', 'Failures and checker', C.gold);
    arrow(g, 463, 345, 604, 293, C.mint);
    arrow(g, 463, 347, 604, 488, C.gold);
    node(g, 1131, 230, 361, 'Student training', 'Smaller model', C.white);
    if (sent) arrow(g, 983, 285, 983 + 144 * sent, 285, C.mint);
    if (done(c, 3, 'fifty-five point five percent', 'That benchmark')) {
      label(g, 'AIME 2024  •  R1-Distill-Qwen-7B', 96, 651);
      mono(g, '55.5% estimated pass@1', 723, 653, 42, C.mint);
    }
    footer(g, 'Ordinary trace imitation gives the student examples of successful work.');
    return;
  }
  node(g, 73, 331, 285, 'Pretrained weights', 'V3-Base', C.blue);
  node(g, 553, 218, 434, 'Cold-start SFT + reasoning RL', 'Trace producer', C.blue);
  arrow(g, 360, 374, 546, 279, C.blue);
  const data = cue(c, 1, 'Filter the traces');
  if (data) {
    node(g, 1088, 218, 426, 'Training data', 'Traces + general data', C.mint);
    arrow(g, 990, 275, 1082, 275, C.mint);
  }
  if (b >= 1) {
    node(g, 744, 526, 480, 'Second supervised stage', 'Learn from filtered examples', C.white);
    if (data) arrow(g, 1299, 331, 1152, 518, C.mint);
    if (done(c, 2, 'original base weights', 'Follow the separate')) {
      line(g, 214, 446, 214, 580, C.blue, 4);
      arrow(g, 214, 580, 736, 580, C.blue);
    }
  }
  footer(
    g,
    b === 0
      ? 'R1 starts with examples before reasoning RL. R1-Zero used direct RL from a base.'
      : 'Blue carries weights. Green carries training examples.',
  );
}

const requestCounts = [4, 8];
const savedShare = (requests) => 1 / requests;
function computeExchange(g, c) {
  const matched = cue(c, 3, 'They matched');
  const splitFour = cue(c, 3, 'Suppose four');
  const quarter = cue(c, 3, 'a quarter');
  const splitEight = cue(c, 3, 'expect eight');
  const eighth = cue(c, 4, 'One eighth');
  title(g, 'Snell et al.  •  MATH benchmark', 'What compute budget did the two models share?');
  label(g, 'Larger model', 76, 256);
  label(g, 'Smaller model', 812, 256);
  type(g, 'About 14× the parameters, one answer', 76, 314, 38, C.white, 'Serif');
  type(g, 'Extra inference on each problem', 812, 314, 38, C.white, 'Serif');
  if (matched) {
    box(g, 75, 359, 1445, 73, C.panel, 6);
    type(g, 'Matched FLOPs  =  pretraining  +  expected lifetime inference', 103, 408, 38, C.mint);
  }
  if (splitFour) {
    label(g, 'One fixed pretraining saving, divided among equal requests', 78, 491, C.gold);
    for (const [i, requests] of requestCounts.entries()) {
      if (i === 1 && !splitEight) continue;
      const y = 527 + i * 91;
      label(g, requests + ' requests', 78, y + 36);
      const unit = savedShare(requests) * 805;
      const known = i === 0 ? quarter : eighth;
      for (let j = 0; j < requests; j++)
        box(g, 302 + j * unit, y, unit - 3, 47, known && j === 0 ? C.gold : C.blue, 3);
      mono(g, known ? '1/' + requests + ' per request' : '?', 1146, y + 38, 34,
        known ? C.gold : C.soft);
    }
  }
  footer(g, eighth ? 'Average allowance = one large-model answer + one share of the saved FLOPs.'
    : 'The study compares model sizes. The request counts illustrate the budget arithmetic.');
}

function budgetScene(g, c) {
  if (c.beat.beatIndex >= 3) return computeExchange(g, c);
  const tight = done(c, 1, 'four hundred milliseconds', 'Keep all four');
  const settled = tight
    ? done(c, 2, 'One hundred twenty-eight tokens', 'Its seventy-eight')
    : done(c, 1, 'Five hundred twelve tokens', 'It reached');
  const deadline = tight ? 400 : 1000,
    chosen = chooseBudget(deadline);
  title(g, 'Synthetic budget sweep', 'Which setting returns the highest accuracy in time?');
  const left = 304,
    span = 767,
    x = (n) => left + (n / 2000) * span;
  box(g, left, 280, x(deadline) - left, 334, '#294548');
  line(g, x(deadline), 272, x(deadline), 618, C.gold, 4);
  mono(g, deadline + ' ms', x(deadline), 247, 32, C.gold, 'center');
  label(g, 'Token budget', 69, 250);
  label(g, 'Latency', 1131, 250);
  label(g, 'Accuracy', 1354, 250);
  budgets.forEach((n, i) => {
    const y = 322 + i * 85,
      xx = x(latency[i]);
    mono(g, n, 77, y + 12, 41);
    line(g, left, y, xx, y, i === chosen && settled ? C.mint : C.line, 6);
    dot(g, xx, y, 12, i === chosen && settled ? C.mint : C.blue);
    mono(
      g,
      group(latency[i]) + ' ms',
      1131,
      y + 11,
      32,
      i === chosen && settled ? C.mint : C.white,
    );
    mono(
      g,
      Math.round(quality[i] * 100) + '%',
      1354,
      y + 11,
      37,
      i === chosen && settled ? C.mint : C.white,
    );
  });
  for (const n of [0, 500, 1000, 1500, 2000]) {
    line(g, x(n), 629, x(n), 640);
    mono(g, n, x(n), 676, 27, C.soft, 'center');
  }
  label(g, 'Latency (ms)', 927, 719);
  footer(
    g,
    settled
      ? budgets[chosen] +
          ' tokens   •   ' +
          Math.round(quality[chosen] * 100) +
          '% accuracy   •   ' +
          latency[chosen] +
          ' ms'
      : 'The shaded region admits every point up to the deadline.',
  );
}
const routes = [
  { id: 'A', quality: 0.87, latency: 300, cost: 0.003 },
  { id: 'B', quality: 0.9, latency: 850, cost: 0.015 },
  { id: 'C', quality: 0.92, latency: 1100, cost: 0.011 },
  { id: 'D', quality: 0.89, latency: 880, cost: 0.02 },
];
const fitRoute = (r) => r.quality >= 0.88 && r.latency <= 900;
const cheap = chooseFeasible(routes, 0.88, 900);
function routing(g, c) {
  const filter = done(c, 1, 'B and D survive', 'A is fast');
  const choose = done(c, 2, 'B costs less', 'A router');
  title(g, 'Routing worksheet', 'Which route clears both gates at the lowest cost?');
  const cols = [78, 346, 686, 1030, 1315];
  ['Route', 'Quality ≥ 0.88', 'p95 ≤ 900 ms', 'Cost / request', 'Decision'].forEach((a, i) =>
    label(g, a, cols[i], 270),
  );
  routes.forEach((r, i) => {
    const y = 352 + i * 100;
    if (choose && r.id === cheap.id) box(g, 67, y - 58, 1463, 82, C.panel, 5);
    line(g, 68, y + 27, 1532, y + 27);
    const color = (v) => (filter ? (v ? C.mint : C.red) : C.white);
    mono(g, r.id, cols[0], y, 52);
    mono(g, r.quality.toFixed(2), cols[1], y, 43, color(r.quality >= 0.88));
    mono(g, group(r.latency), cols[2], y, 43, color(r.latency <= 900));
    mono(g, r.cost.toFixed(3), cols[3], y, 43, choose && r === cheap ? C.gold : C.white);
    if (filter)
      type(
        g,
        choose && r === cheap ? 'route here' : fitRoute(r) ? 'eligible' : 'out',
        cols[4],
        y,
        30,
        fitRoute(r) ? C.mint : C.red,
      );
  });
  footer(g, 'The worksheet describes a workload. Individual requests can be slower.');
}
const usage = { total: 900, reasoning: 760, rate: 12 };
const visible = usage.total - usage.reasoning;
const charge = (usage.total * usage.rate) / 1e6;
function usageScene(g, c) {
  const cap = c.beat.beatIndex === 2;
  const used = cap ? Math.round(64 * cue(c, 2, 'In this sixty-four-token', 1.55)) : usage.reasoning;
  const n = cap ? 64 : usage.total;
  const bill = done(c, 1, 'One hundred forty were visible', 'At twelve');
  const price = done(c, 1, 'just over one cent', 'Bill the inclusive');
  title(
    g,
    'Generated-token ledger',
    cap ? 'What came back at the hard limit?' : 'How many tokens could the reader see?',
  );
  const w = 1360,
    x = 105,
    y = 403;
  const hiddenWidth = (w * used) / n;
  const visibleX = cap ? 981 : x + (hiddenWidth + w) / 2;
  const visibleColor = cap || bill ? C.mint : C.soft;
  label(g, cap ? 'Hard output cap' : 'Total reported output', x, 278);
  mono(g, group(n) + ' tokens', x, 353, 57);
  box(g, x, y, w, 86, C.panel, 6);
  if (used) box(g, x, y, hiddenWidth, 86, C.blue, 6);
  if (!cap && bill) box(g, x + hiddenWidth, y, w - hiddenWidth, 86, C.mint, 6);
  label(g, 'Hidden reasoning', x, 558);
  mono(g, used, x, 636, 66, C.blue);
  type(g, cap ? 'Visible so far' : 'Visible text', visibleX, 558, 25, C.soft, 'Sans', 'center');
  mono(g, cap ? 0 : bill ? visible : '?', visibleX, 636, 66, visibleColor, 'center');
  footer(
    g,
    cap
      ? used === n
        ? 'Output cap reached  •  incomplete  •  no visible reply'
        : 'Generating hidden tokens before the first visible word.'
      : price
        ? group(n) + ' × $' + usage.rate + ' / million = $' + charge.toFixed(5) + ' for output.'
        : 'Only reasoning and visible text are included in this example.',
  );
}
const delay = (n) => 150 + (1000 * n) / 100;
function delayScene(g, c) {
  const first = done(c, 1, 'two thousand one hundred fifty', 'Keep the same');
  const replay = cue(c, 1, 'This time');
  const revised = done(c, 2, 'At nineteen hundred fifty', 'A cap alone');
  title(g, 'Constant-rate worksheet', 'When can the reader see the first token?');
  label(g, 'Other delay = 150 ms     •     Hidden decode = 100 tokens/s', 78, 241);
  const left = 340,
    x = (n) => left + n * 0.49;
  line(g, x(2000), 301, x(2000), 635, C.gold, 5);
  mono(g, '2,000 ms limit', x(2000), 280, 31, C.gold, 'center');
  for (const [i, n] of (replay ? [200, 180] : [200]).entries()) {
    const y = 383 + i * 169,
      show = i ? revised : first;
    label(g, n + ' hidden tokens', 73, y + 29);
    box(g, left, y, 150 * 0.49, 48, C.gold, 3);
    if (show) {
      box(g, x(150), y, (delay(n) - 150) * 0.49, 48, C.blue, 3);
      dot(g, x(delay(n)), y + 24, 12, C.white);
      mono(
        g,
        group(delay(n)) + ' ms  •  ' + (delay(n) <= 2000 ? 'fits' : 'late'),
        x(150),
        y + 101,
        39,
        delay(n) <= 2000 ? C.mint : C.red,
      );
    } else {
      label(g, '150 ms + (' + n + ' / 100) seconds', x(150) + 20, y + 35, C.white);
    }
  }
  footer(g, 'Gold is other delay. Blue is the time spent generating hidden tokens.');
}
const shared = { prompt: 4000, private: 1000, branches: 8 };
const positions = (sharing) =>
  shared.prompt * (sharing ? 1 : shared.branches) + shared.private * shared.branches;
function cache(g, c) {
  const repeat = cue(c, 1, 'Remove prefix sharing', 1.25);
  const sharedKnown = done(c, 1, 'twelve thousand retained positions', 'Four thousand belong');
  const copies = repeat > 0;
  const unsharedKnown = done(c, 1, 'forty thousand', 'The generated');
  const geom = done(c, 2, 'one hundred twenty-eight kibibytes', 'Perfect sharing');
  const payload = done(c, 2, 'about four point eight eight', 'Allocator overhead');
  const b = c.beat.beatIndex;
  title(g, 'Key-value cache', 'Who owns the prompt and the eight continuations?');
  label(g, 'Each block = 1,000 retained positions', 72, 238);
  const ox = 96,
    oy = 267,
    dx = 92,
    dy = 49;
  const segment = (col, row, color) => box(g, ox + col * dx, oy + row * dy, dx - 8, 36, color, 4);
  for (let r = 0; r < 8; r++) {
    if (r === 0 || copies) {
      g.save();
      g.globalAlpha = r === 0 ? 1 : repeat;
      for (let i = 0; i < 4; i++) segment(i, r, C.blue);
      g.restore();
    }
    if (!copies) {
      line(g, ox + 4 * dx - 7, oy + 18, ox + 4 * dx + 35, oy + 18, C.soft, 3);
      line(g, ox + 4 * dx + 35, oy + 18, ox + 4 * dx + 35, oy + r * dy + 18, C.soft, 3);
    }
    line(
      g,
      ox + 4 * dx + (copies ? -7 : 35),
      oy + r * dy + 18,
      ox + 5 * dx,
      oy + r * dy + 18,
      C.soft,
      3,
    );
    segment(5, r, C.gold);
    mono(g, 'C' + (r + 1), ox + 6 * dx + 13, oy + r * dy + 30, 27, C.soft);
  }
  label(g, 'Prompt', ox, 691, C.blue);
  label(g, 'Private', ox + 5 * dx, 691, C.gold);
  label(g, copies ? 'Private prompt copies' : 'Perfect prefix sharing', 827, 279);
  mono(g, copies ? '8 × (4,000 + 1,000)' : '4,000 + 8 × 1,000', 827, 360, 47);
  if (copies ? unsharedKnown : sharedKnown)
    mono(g, group(positions(!copies)) + ' positions', 827, 448, 54, C.mint);
  if (copies && sharedKnown)
    label(g, 'Previously shared: ' + group(positions(true)) + ' positions', 827, 519);
  if (b === 2) {
    label(g, 'Uniform full attention • raw K and V', 827, 589);
    mono(g, '2 × 32 × 8 × 128 × 2 B', 827, 649, 41, C.blue);
    if (geom) label(g, kvPerToken / 1024 + ' KiB / position', 827, 703);
  }
  footer(
    g,
    payload
      ? 'Shared: ' +
          ((positions(true) * kvPerToken) / 2 ** 30).toFixed(2) +
          ' GiB     •     Separate: ' +
          ((positions(false) * kvPerToken) / 2 ** 30).toFixed(2) +
          ' GiB     •     raw payload'
      : 'One private continuation for each branch that generated it.',
  );
}
const labels = 'ABCDEF';
function releaseScene(g, c) {
  if (c.beat.id === 'close-room') {
    const final = retainedBranchLedger(4);
    title(g, 'The checked answer', 'What did the extra work buy?');
    room(g, 68, 222, 623, { counted: 4, wall: 12 });
    mono(g, tableCount + ' + ' + extras + ' = ' + roomCount + ' chairs', 77, 721, 42, C.mint);
    label(g, 'Checked answer to the original request', 811, 284);
    mono(g, group(final.verifiedAnswer) + ' positions', 805, 387, 64, C.mint);
    if (cue(c, 4, 'even after two caches')) {
      label(g, 'Still in memory', 811, 508);
      mono(g, group(final.positions) + ' positions', 808, 565, 45);
      label(g, 'Already generated', 811, 636);
      mono(g, group(final.spentTokens) + ' tokens', 808, 696, 45, C.gold);
    }
    footer(g, 'The checked answer still describes the request that produced it.');
    return;
  }
  const f = done(c, 2, 'Release F', 'It frees'),
    e = done(c, 3, 'Release E as well', 'Five thousand retained');
  const retained = 6 - Number(f) - Number(e);
  const s = retainedBranchLedger(retained),
    bestIndex = Number(s.selected.slice(1)) - 1;
  const checked = done(c, 1, 'Keep C', 'Six thousand');
  const showSize = done(c, 1, 'forty-eight kibibytes', 'The raw pool');
  title(g, 'Final practice', 'Which cache can go while the checked reply stays?');
  const prompt = finalRequest.prompt,
    continuation = finalRequest.continuation;
  label(g, 'Shared prompt  •  ' + retained + ' live continuations', 72, 242, C.blue);
  box(g, 76, 266, 552, 49, C.blue, 5);
  mono(g, group(prompt) + ' positions', 91, 301, 31, C.ink);
  label(g, 'Draft', 76, 367);
  label(g, 'Original answer', 203, 367);
  label(g, 'Private cache', 463, 367);
  finalRequest.answers.forEach((v, i) => {
    const y = 414 + i * 51;
    mono(g, labels[i], 83, y, 32, checked && i === bestIndex ? C.mint : C.soft);
    mono(g, group(v), 206, y, 32, checked && i === bestIndex ? C.mint : C.white);
    if (i < retained) {
      box(g, 462, y - 27, 148, 34, checked && i === bestIndex ? C.mint : C.gold, 4);
      mono(g, continuation, 537, y, 27, C.ink, 'center');
    } else label(g, 'released', 464, y, C.soft);
  });
  if (checked) {
    label(g, 'Answer to the original request', 804, 246);
    mono(g, labels[bestIndex] + '   ' + group(s.verifiedAnswer), 802, 334, 71, C.mint);
  } else {
    label(g, 'Original request', 804, 246);
    mono(g, '3,000 + 6 × 500', 802, 334, 61);
  }
  if (showSize) {
    label(g, 'Uniform full attention  •  raw K and V', 806, 412);
    mono(g, '2 × 24 × 4 × 128 × 2 B = 48 KiB', 806, 464, 33);
    const mib = s.bytes / 2 ** 20,
      capacity = finalRequest.poolBytes / 2 ** 20;
    const xx = 805,
      w = 590,
      scale = w / 300;
    box(g, xx, 545, w, 45, C.panel, 4);
    box(g, xx, 545, mib * scale, 45, s.fits ? C.mint : C.red, 4);
    line(g, xx + capacity * scale, 526, xx + capacity * scale, 605, C.gold, 4);
    label(g, capacity + ' MiB limit', xx + capacity * scale - 80, 514, C.gold);
    mono(g, group(s.positions) + ' positions', xx, 645, 39);
    mono(
      g,
      mib.toFixed(2) + ' MiB  •  ' + (s.fits ? 'fits' : 'over'),
      xx,
      700,
      41,
      s.fits ? C.mint : C.red,
    );
  }
  footer(
    g,
    'Already spent: ' +
      s.spentTokens.toLocaleString('en-US') +
      ' generated tokens and ' +
      s.spentScoreCalls +
      ' scoring calls.',
  );
}

const painters = {
  c01: opening,
  c02: ballot,
  c03: coverageScene,
  distribution,
  c04: ranking,
  c05: revision,
  c06: pathScene,
  targets,
  frontier: frontierScene,
  lineage,
  c07: budgetScene,
  router: routing,
  usage: usageScene,
  latency: delayScene,
  c08: cache,
  release: releaseScene,
};
function draw(g, c) {
  g.save();
  g.scale(1.2, 1.2);
  background(g);
  painters[c.beat.chapterId](g, c);
  g.restore();
}

function check() {
  assert.equal(new Set(roomPlaces.map((p) => p.x + ',' + p.y)).size, 44);
  assert.deepEqual([tableCount, roomCount], [32, 44]);
  assert.equal(plurality(candidates), 32);
  assert.equal(matches(candidates), 2);
  assert.equal(matches([32, 32, 40, 48]), -1);
  assert.deepEqual(
    [1, 2, 3].map((n) => best(scored.slice(0, n)).answer),
    [44, 44, 48],
  );
  assert.deepEqual(missShares.map(pct), ['100.0%', '75.0%', '56.3%', '42.2%', '31.6%']);
  assert.deepEqual(
    [pct(coveredShare), pct(returnedShare), pct(selectionMissShare)],
    ['68.4%', '54.7%', '13.7%'],
  );
  assert.equal(missShares.at(-1) + selectionMissShare + returnedShare, 1);
  assert.equal(attemptCount * tokensPerAttempt, 3200);
  assert.deepEqual(
    pairResults.map((r) => pct(r.mean)),
    ['81.5%', '63.5%'],
  );
  for (let i = 1; i <= 4; i++) {
    const s = checkedRevisionLedger(i);
    assert.equal(s.calls, 2 * i - 1);
    assert.equal(s.best?.answer, i === 1 ? undefined : 44);
    assert.equal(s.latest.passed, i === 2);
    if (i > 1) assert.equal(s.gain < 0.01, i === 4);
  }
  assert.equal(f3(checkedRevisionLedger(4).gain), '0.001');
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => pathState(n).total),
    [0, 4, 7, 9, 10, 11, 12, 13, 14],
  );
  assert.deepEqual(pathState(8).rows, [8, 2, 3, 1]);
  assert.deepEqual(
    [correctProduct, hits, Number(hits > 0), hits / completions.length],
    [42, 3, 1, 0.6],
  );
  assert.ok(choices.every((p) => p.parent === root));
  assert.deepEqual(choices.map((p) => p.score), [0.64, 0.88]);
  assert.deepEqual(retain(choices), [choices[1]]);
  assert.ok(proposed.every((p) => p.parent === nextInput));
  assert.deepEqual([completedPath.text, activePath.text], ['32 + 12 = 44', 'Verify wall count']);
  assert.deepEqual([frontier.finished, frontier.active], [0.81, 0.79]);
  assert.equal(extend(activePath, 'Check the twelve chairs', frontier.next).score, frontier.active);
  assert.ok(
    Math.min(frontier.active, frontier.next) < frontier.finished &&
      frontier.next > frontier.finished,
  );
  assert.deepEqual(
    [1000, 400].map((n) => budgets[chooseBudget(n)]),
    [512, 128],
  );
  assert.deepEqual(requestCounts.map(savedShare), [0.25, 0.125]);
  for (const requests of requestCounts) assert.equal(requests * savedShare(requests), 1);
  assert.deepEqual(
    routes.filter(fitRoute).map((r) => r.id),
    ['B', 'D'],
  );
  assert.equal(cheap.id, 'B');
  assert.deepEqual(
    [visible, charge.toFixed(5), delay(200), delay(180)],
    [140, '0.01080', 2150, 1950],
  );
  assert.deepEqual([positions(true), positions(false), kvPerToken], [12000, 40000, 131072]);
  assert.equal(rawKVBytes({ ...finalRequest.geometry, positions: 1 }), 48 * 1024);
  for (const [retained, mib, fits] of [
    [6, 281.25, false],
    [5, 257.8125, false],
    [4, 234.375, true],
  ]) {
    const s = retainedBranchLedger(retained);
    assert.deepEqual(
      [s.bytes / 2 ** 20, s.fits, s.selected, s.verifiedAnswer, s.spentTokens, s.spentScoreCalls],
      [mib, fits, 'C3', 6000, 3000, 6],
    );
  }
}
export default { title: 'Giving a Model More Time to Think', draw, check };
