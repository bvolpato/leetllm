import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import {
  P,
  box,
  line,
  poly,
  dot,
  txt,
  mono,
  title,
  small,
  page,
  sheet,
  at,
  handset,
  tag,
  strip,
  arrow,
} from './art.mjs';
import {
  pendingWindow,
  passingWindow,
  regressingHistory,
  matureQuality,
  canary,
  chain,
  delta,
  firstHour,
  seventh,
  boundary,
  day8,
  windowDecision,
  productionStep,
  day9state,
  day10state,
  lateState,
  probeRelease,
} from './lab.mjs';

function van(c, x, y, col) {
  poly(
    c,
    [
      [x, y],
      [x + 39, y],
      [x + 47, y + 10],
      [x + 53, y + 11],
      [x + 53, y + 24],
      [x, y + 24],
    ],
    col,
  );
  poly(
    c,
    [
      [x + 30, y + 3],
      [x + 37, y + 3],
      [x + 43, y + 12],
      [x + 30, y + 12],
    ],
    P.sky,
  );
  for (const xx of [x + 10, x + 42]) {
    dot(c, xx, y + 24, 6, P.black);
    dot(c, xx, y + 24, 2, P.pale);
  }
}
function afterPhrase(k, beat, phrase, duration = 0) {
  const current = k.beat.beatIndex + 1;
  if (current !== beat) return Number(current > beat);
  k.reveal(phrase, 0, { captionStart: phrase });
  const start = firstFrameAt(k.wordCue(phrase).end) / fps;
  if (duration === 0) return Number(k.elapsed >= start);
  return Math.max(0, Math.min(1, (k.elapsed - start) / duration));
}

function costHistory(c, rows) {
  const zero = 464;
  const x = (change) => zero + 1700 * change;
  small(c, 'COST CHANGE VS. BASELINE', 57, 448);
  for (const tick of [-0.15, 0, 0.15]) {
    const xx = x(tick);
    line(c, xx, 486, xx, 580, tick === 0 ? P.ink : P.line, tick === 0 ? 3 : 1);
    mono(c, tick === 0 ? '0% limit' : delta(tick), xx, 476, 20, P.ink, 'center');
  }
  for (const [i, { window, progress = 0, pending = false }] of rows.entries()) {
    const y = 510 + i * 49;
    txt(c, 'Day ' + window.day, 57, y + 7, 24, P.ink, { bold: true });
    line(c, x(-0.15), y, x(0.15), y, P.line, 1);
    if (pending) {
      box(c, x(-0.15) + 13, y - 15, 190, 30, P.ivory);
      txt(c, 'Labels pending', x(-0.15) + 21, y + 7, 22, P.ocean);
    }
    if (progress > 0) {
      const quality = matureQuality(window);
      const end = x(quality.delta);
      const col = quality.delta > 0 ? P.rust : P.teal;
      line(c, zero, y, zero + (end - zero) * progress, y, col, 7);
      if (progress === 1) {
        dot(c, end, y, 6, col);
        mono(c, delta(quality.delta), end, y + 25, 22, col, 'center');
      }
    }
  }
}

function cohortCard(c, x, window, { showCost, showHealth, breached = false }) {
  sheet(c, x, 181, 532, 222);
  title(c, 'Day ' + window.day, x + 21, 232, 38);
  txt(c, window.qualityRows.length + ' candidate requests', x + 23, 268, 23, P.mute);
  line(c, x + 22, 283, x + 510, 283, P.line);
  if (showCost) {
    const quality = matureQuality(window);
    small(c, 'CANDIDATE COST', x + 23, 312);
    small(c, 'BASELINE COST', x + 279, 312);
    mono(c, quality.candidateCost + ' units', x + 23, 350, 32, breached ? P.rust : P.ink);
    mono(c, quality.baselineCost + ' units', x + 279, 350, 32);
  }
  if (showHealth) {
    mono(
      c,
      'p95 ' + window.ms + ' ms  ·  ' + 100 * window.error + '% errors',
      x + 23, 384, 21, P.ocean,
    );
  }
}
export function canaryScene(c, k) {
  page(c, P.ivory);
  const alt = !!at(k, 6, 'Try a different history');
  const b = k.beat.beatIndex + 1;
  const windows = alt ? regressingHistory : [pendingWindow, passingWindow];
  let verdict;
  box(c, 0, 0, 1200, 148, P.deep);
  title(c, alt ? 'Canary history B' : 'Canary history A', 56, 78, 43, P.cream);
  small(c, alt ? 'PER REQUEST COHORT' : 'ORIGINAL REQUEST COHORT', 738, 42, P.mint);
  for (let i = 0; i < 20; i++) {
    dot(c, 747 + (i % 10) * 25, 65 + Math.floor(i / 10) * 19, 6, i < 16 ? '#acbcb2' : P.gold);
  }
  txt(c, '16 on v0   /   4 on v1', 735, 123, 20, P.cream);

  if (alt) {
    txt(c, 'Separate cohorts on days 7 and 8', 59, 122, 22, P.mint);
    const earlier = afterPhrase(
      k,
      7,
      'The earlier window crossed the cost limit by fourteen percent',
      0.65,
    );
    const later = afterPhrase(k, 7, 'The later saving', 0.65);
    const health = afterPhrase(k, 6, 'Both windows pass the service checks');
    cohortCard(c, 56, windows[0], {
      showCost: afterPhrase(k, 6, 'Its cost was a hundred and fourteen against a hundred'),
      showHealth: health,
      breached: earlier > 0,
    });
    cohortCard(c, 610, windows[1], {
      showCost: afterPhrase(k, 6, 'Day eight comes in at ninety-two against a hundred'),
      showHealth: health,
    });
    costHistory(c, [
      { window: windows[0], progress: earlier },
      { window: windows[1], progress: later },
    ]);
    if (afterPhrase(k, 7, 'Abort this canary')) verdict = canary(windows);
  } else {
    const done = at(k, 1, 'Watch all four finish', 1.2);
    const rows = passingWindow.qualityRows;
    const labeled = afterPhrase(k, 3, 'The other two arrived on time')
      ? rows.length
      : afterPhrase(k, 3, 'The first two arrived late')
        ? rows.filter((row) => row.late).length
        : 0;
    const showCosts = afterPhrase(
      k,
      3,
      'Each report supplies twenty-three cost units for the candidate and twenty-five for the baseline',
    );
    const totalSpoken = afterPhrase(k, 4, 'Ninety-two divided by one hundred');
    const pairCount = totalSpoken
      ? rows.length
      : Math.floor(at(k, 3, 'Add all four pairs', 1.4) * (rows.length - 1));
    txt(
      c,
      b >= 3
        ? 'Day 7 · carrier reports'
        : done === 1
          ? 'First hour · requests served'
          : 'First hour · requests in flight',
      59, 122, 22, P.mint,
    );
    rows.forEach((r, i) => {
      const x = 56 + i * 277;
      const y = 181;
      const slot = Math.min(1, Math.max(0, done * rows.length - i));
      sheet(c, x, y, 255, 222);
      mono(c, r.id, x + 17, y + 34, 20, P.ink);
      line(c, x + 18, y + 93, x + 229, y + 93, P.line, 2);
      van(c, x + 18 + slot * 155, y + 58, P.teal);
      if (slot === 1) small(c, 'Finished', x + 17, y + 78, P.teal);
      small(c, 'CARRIER OUTCOME', x + 17, y + 124);
      if (i < labeled) {
        title(c, r.late ? 'Late' : 'On time', x + 17, y + 161, 29, r.late ? P.rust : P.teal);
      }
      line(c, x + 17, y + 173, x + 232, y + 173, P.line, 1);
      if (i < pairCount) box(c, x + 12, y + 180, 228, 33, P.mint, 4);
      if (showCosts) mono(c, r.candidateCost + ' / ' + r.baselineCost + ' units', x + 17, y + 204, 20);
    });
    const history = [{ window: pendingWindow, pending: !!at(k, 1, "The carriers haven't reported") }];
    if (b >= 3) {
      history.push({
        window: passingWindow,
        progress: afterPhrase(k, 4, 'gives minus eight percent', 0.65),
      });
    }
    costHistory(c, history);
    const health = b < 3 ? pendingWindow : passingWindow;
    if (done === 1) {
      mono(c, 'p95 ' + health.ms + ' ms  ·  ' + 100 * health.error + '% errors', 795, 453, 21, P.ocean);
    }
    if (afterPhrase(k, 5, 'issue a ready receipt')) {
      verdict = canary(windows);
    } else if (b <= 2 && afterPhrase(k, 2, 'Hold the canary at its current exposure')) {
      verdict = canary([pendingWindow]);
    } else if (pairCount > 0) {
      const total = matureQuality({ ...passingWindow, qualityRows: rows.slice(0, pairCount) });
      small(c, 'CANDIDATE / BASELINE COST', 795, 490);
      mono(c, total.candidateCost + ' / ' + total.baselineCost + ' units', 795, 529, 28);
      txt(c, pairCount + ' of ' + rows.length + ' pairs added', 795, 563, 22, P.mute);
    } else if (history[0].pending && b <= 2) {
      txt(c, labeled + ' of ' + rows.length + ' outcomes', 795, 525, 27, P.ocean);
    }
  }
  line(c, 761, 439, 761, 582, P.line, 1);
  if (verdict) {
    const cleared = alt && afterPhrase(k, 7, 'Remove the candidate’s canary pointer');
    title(
      c,
      verdict === 'ABORT' ? 'Abort canary' : verdict === 'HOLD' ? 'Hold at 4 of 20' : 'Ready receipt',
      795,
      504,
      33,
      verdict === 'ABORT' ? P.rust : P.teal,
    );
    mono(c, 'production → v0', 795, 542, 21);
    mono(c, 'canary → ' + (cleared ? 'empty' : 'v1'), 795, 573, 21);
  } else if (alt && at(k, 6, 'Can this canary stay open')) {
    title(c, 'Can this canary', 795, 506, 32);
    title(c, 'stay open?', 795, 545, 32);
  }
}

function formRow(c, x, y, label, value, col = P.ink) {
  txt(c, label, x, y, 19, P.mute);
  mono(c, value, x + 340, y, 21, col, 'right');
  line(c, x, y + 15, x + 340, y + 15, P.line, 1);
}
function summaryForm(c, x, y, w, label) {
  sheet(c, x, y, 395, 322);
  small(c, label, x + 24, y + 38, P.ocean);
  for (const [i, key, value] of [
    [0, 'Requests', w.n === true ? 'True' : w.n.toLocaleString('en-US')],
    [1, 'Error rate', (w.errors * 100).toFixed(1) + '%'],
    [2, 'p95 latency', Number.isFinite(w.ms) ? w.ms + ' ms' : 'NaN'],
    [3, 'Carrier labels', w.ready ? 'Ready' : 'Pending'],
    [4, 'Measured cost', delta(w.cost)],
  ])
    formRow(
      c,
      x + 24,
      y + 83 + 47 * i,
      key,
      value,
      (w.n === true && i === 0) || (!Number.isFinite(w.ms) && i === 2) ? P.rust : P.ink,
    );
}
export function windowScene(c, k) {
  page(c);
  const b = k.beat.beatIndex + 1;
  const early = at(k, 3, 'A Boolean count') && b === 3;
  let last = early ? { ...seventh, n: true } : seventh;
  if ((b === 4 && at(k, 4, 'Set the second window')) || b === 5 || b === 6) last = boundary;
  if ((b === 5 && at(k, 5, 'Take away')) || (b === 6 && !at(k, 6, 'restore the complete pair')))
    last = { ...boundary, ready: false, cost: null };
  if (b === 6 && at(k, 6, 'nonfinite value')) last = { ...boundary, ms: NaN };
  if (b === 7) last = { ...boundary, cost: 0.03 };
  const wrong = b === 8;
  const verdict = windowDecision([firstHour, last]);
  const announce =
    early ||
    (b === 4 && at(k, 4, 'records ready')) ||
    (b === 6 && (!at(k, 6, 'restore the complete pair') || at(k, 6, 'Abort and remove'))) ||
    b === 7;
  title(c, b >= 9 ? 'What makes a window usable?' : 'Check the observation window');
  if (b >= 9) {
    summaryForm(c, 68, 175, seventh, 'DAY 7   /   VERSION ONE');
    if (b === 9) {
      small(c, 'VALID SUMMARY', 552, 194);
      const rules = [
        ['Count', 'Positive whole number'],
        ['Error rate', '0 to 1 inclusive'],
        ['p95 latency', 'Finite, at least 0 ms'],
        ['Cost change', 'If supplied, finite and ≥ −1'],
      ];
      rules.forEach(([a, v], i) => {
        small(c, a, 554, 247 + 75 * i);
        txt(c, v, 554, 278 + 75 * i, 24);
      });
    } else {
      small(c, 'JOIN TO THE REQUEST LOG', 553, 190);
      const fields = [
        'Request ID and served revision',
        'Prediction time and outcome time',
        'Label coverage and age',
        'Sample size and omitted windows',
      ];
      fields.forEach((v, i) => {
        dot(c, 563, 238 + 73 * i, 6, P.teal);
        txt(c, v, 587, 245 + 73 * i, 24);
      });
    }
    return;
  }
  summaryForm(c, 59, 173, firstHour, 'FIRST HOUR   /   DAY 0');
  if (!wrong) {
    summaryForm(c, 480, 173, last, 'LATEST   /   DAY 7');
  } else {
    sheet(c, 480, 173, 395, 322);
    small(c, 'INGESTION', 505, 215);
    mono(c, 'dict', 504, 282, 33, P.rust);
    txt(c, 'Expected CanaryWindow', 504, 346, 23);
    txt(c, 'ValueError before receipt', 504, 397, 22, P.rust);
  }
  small(c, 'LIMITS', 923, 204);
  mono(c, '≤ 1% errors', 923, 251, 21);
  mono(c, '≤ 250 ms', 923, 291, 21);
  mono(c, '≤ 0% cost', 923, 331, 21);
  txt(c, 'Two ordered', 923, 402, 20);
  txt(c, 'windows', 923, 432, 20);
  if (announce) {
    const other = b === 7 && at(k, 7, 'pointer belongs to another');
    strip(
      c,
      592,
      other ? 'Production v0 · canary belongs to v2' : 'Production v0 · candidate v1',
      verdict === 'Abort'
        ? other
          ? 'Abort v1  ·  v2 stays'
          : 'Abort  ·  remove v1'
        : verdict === 'Hold'
          ? 'Hold  ·  v1 stays'
          : 'Ready  ·  v1 stays',
      verdict === 'Abort' ? P.rust : P.teal,
    );
  } else if (wrong) {
    strip(c, 592, 'Reset: canary owned by v1', 'No receipt  ·  v1 stays', P.ocean);
  } else if (b === 5) {
    strip(c, 592, 'Production v0 · canary v1', 'What can the evaluator conclude?', P.ocean);
  } else if (b === 1) {
    strip(c, 592, 'Separate offline test: 4 / 50', 'Online summary: 4,200 requests', P.ocean);
  } else if (b === 2) {
    small(c, 'ACCEPTED ADMISSION   /   PRODUCTION v0   /   CANARY v1', 64, 552);
    mono(c, 'evaluate_canary("' + chain.evidence.candidate + '", "' + chain.admission.id + '", windows)', 64, 604, 22, P.ocean);
  }
}

export function recovery(c, k) {
  const b = k.beat.beatIndex + 1;
  const selected = at(k, 3, 'back to version zero') ? 'v0' : 'v1';
  const replay = selected === 'v0' ? at(k, 4, 'scores zero') : at(k, 1, 'scores point nine eight');
  const p = probeRelease(selected, 9);
  page(c, P.ivory);
  title(c, 'Two possible reports for day eight');
  small(c, 'OBSERVED ON V1   /   900 REQUESTS   /   p95 130 ms   /   0.4% ERRORS', 64, 140);
  const showA = at(k, 2, 'Report A'),
    showB = at(k, 2, 'In report B');
  for (const [i, shown, report] of [
    [0, showA, { ...day8, ready: false, cost: null }],
    [1, showB, day8],
  ]) {
    const x = 60 + i * 389;
    sheet(c, x, 173, 358, 171);
    small(c, 'REPORT ' + (i ? 'B' : 'A'), x + 20, 209);
    if (shown) {
      title(
        c,
        i ? delta(report.cost) + ' cost' : 'Labels pending',
        x + 20,
        263,
        34,
        i ? P.rust : P.mute,
      );
    }
    if (at(k, 3, i ? 'does justify recovery' : 'Keep version one')) {
      const action = productionStep({ latest: 7, validDay: 7 }, report).decision;
      txt(c, action, x + 20, 314, 23, i ? P.rust : P.ocean, { bold: true });
    }
  }
  small(c, 'REPLAY   /   DELIVERY 01', 64, 410);
  txt(c, '9 min', 65, 481, 53, P.ink, { family: 'Serif' });
  arrow(c, 218, 466, 310, 466);
  tag(c, 325, 447, 142, 'package ' + selected, P.deep);
  arrow(c, 478, 466, 563, 466);
  if (replay) {
    txt(c, p.score.toFixed(2), 580, 480, 44, p.warning ? P.teal : P.ocean, { family: 'Serif' });
    txt(c, p.warning ? 'Warn' : 'Silent', 580, 525, 24, p.warning ? P.teal : P.ocean);
  } else txt(c, 'Await replay', 580, 475, 22, P.mute);
  mono(c, 'Threshold 0.50', 65, 569, 21, P.mute);
  const sent = !!at(k, 1, 'and warns');
  handset(c, 900, 181, 189, {
    lit: sent,
    line1: 'Parcel post',
    line2: 'Delay alert',
    line3: 'Sent 12:00',
  });
  if (sent)
    txt(c, selected === 'v0' ? 'Original warning remains' : 'Customer inbox', 994, 542, 22, P.ink, {
      align: 'center',
    });
}
export function productionDates(c, k) {
  page(c, P.paper);
  const b = k.beat.beatIndex + 1;
  title(c, b <= 2 ? 'What can this report tell us about version one?' : 'Which date moves the monitor?');
  if (b <= 2) {
    const invalid = b === 2;
    const labelsArrived = !invalid && at(k, 1, 'the labels arrive');
    const w = invalid ? { ...day8, errors: NaN } : { ...day8, ready: Boolean(labelsArrived), cost: null };
    summaryForm(
      c,
      68,
      172,
      { ...w, errors: invalid ? NaN : w.errors },
      'INCOMING   /   V1   /   DAY 8',
    );
    small(c, 'CURRENT RELEASE', 545, 212);
    title(c, 'Production v1', 545, 277, 43);
    txt(
      c,
      invalid ? 'Invalid error rate' : labelsArrived ? 'Cost estimate missing' : 'Awaiting carrier labels',
      547,
      347,
      27,
      invalid ? P.rust : P.mute,
    );
    const action = productionStep({ latest: 7, validDay: 7 }, w);
    txt(c, action.decision, 547, 405, 29, P.ocean, { bold: true });
    txt(c, invalid ? 'Investigate the record.' : labelsArrived ? 'Follow up on the cost estimate.' : 'Set a label deadline.', 547, 463, 23);
    return;
  }
  const day10 = at(k, 3, 'Day ten brings'),
    late = at(k, 4, 'a day-eight report');
  const other = at(k, 4, 'different release');
  const state = other
    ? productionStep(lateState, { ...day8, day: 11, release: 'v0' })
    : late
      ? lateState
      : day10
        ? day10state
        : day9state;
  const incoming = other ? 11 : late ? 8 : day10 ? 10 : 9;
  const col = incoming === 9 ? P.teal : P.rust;
  for (const [i, h, day, sub] of [
    [0, 'LAST VALID OBSERVATION', state.validDay, 'Usable measurement'],
    [
      1,
      'LATEST MONITOR RECEIPT',
      state.latest,
      state.latest === 10 ? 'Held: invalid metrics' : 'Healthy: keep v1',
    ],
  ]) {
    const x = 63 + i * 364;
    sheet(c, x, 172, 318, 284);
    box(c, x, 172, 318, 67, i ? P.ocean : P.teal);
    for (const dx of [37, 263]) {
      box(c, x + dx, 161, 13, 24, P.ink, 5);
    }
    small(c, h, x + 18, 216, P.cream);
    title(c, String(day), x + 25, 370, 106);
    txt(c, sub, x + 19, 419, 21, P.mute);
  }
  sheet(c, 812, 197, 318, 243);
  small(c, 'INCOMING   /   ' + (other ? 'V0' : 'V1'), 836, 239);
  title(c, 'Day ' + incoming, 836, 304, 45, col);
  txt(c, late ? '+14% cost' : day10 ? 'Error rate is NaN' : '−1% cost', 836, 359, 25);
  txt(
    c,
    other
      ? 'Wrong release'
      : late
        ? 'Older than day 9'
        : day10
          ? 'Invalid measurement'
          : 'Healthy service',
    836,
    399,
    19,
    P.mute,
  );
  strip(c, 557, 'Production stays on v1', state.decision, late ? P.rust : P.ocean);
  if (b === 5)
    txt(
      c,
      'Before rollback: verify the current receipt, policy, previous package and reload.',
      66,
      624,
      22,
    );
}
