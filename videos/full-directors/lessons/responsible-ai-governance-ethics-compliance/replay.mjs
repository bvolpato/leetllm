import {
  col as C,
  rect,
  line,
  circle,
  text,
  mono,
  title,
  field,
  paper,
  folder,
  header,
  stamp,
  mark,
  binding,
  screen,
  graphPaper,
  at,
  lines,
} from './studio.mjs';
import {
  accessState,
  actorLabel,
  auditState,
  digest,
  instructionLabel,
  original,
  pathCeiling,
  percent,
  repeatEffect,
  riskState,
  s1Replay,
  suite,
} from './evidence.mjs';

export function register(g, k) {
  const b = k.beat.beatIndex,
    s = riskState(k),
    x = 105,
    y = 369,
    n = 42;
  paper(g, 52, 46, 847, 447);
  mono(g, 'RISK REGISTER    /    MP-014', 80, 88, 15);
  title(g, 'Unauthorized promotion', 78, 137, 39);
  mono(g, 'Likelihood', 76, 174, 14);
  for (let l = 1; l <= 5; l++)
    for (let i = 1; i <= 5; i++) {
      const xx = x + (i - 1) * n,
        yy = y - (l - 1) * n;
      const primary = i === s.initial.impact && l === s.initial.likelihood;
      const residual = i === s.residual?.impact && l === s.residual?.likelihood;
      rect(g, xx, yy, n - 2, n - 2, primary ? C.rust : residual ? C.teal : '#e7dabe');
      mono(
        g,
        String(l * i),
        xx + n / 2 - 1,
        yy + n * 0.64,
        16,
        primary || residual ? C.light : C.dull,
        'center',
      );
      if (i === 1) mono(g, l, x - 15, yy + 25, 14, C.dull, 'center');
      if (l === 1) mono(g, i, xx + 20, yy + 61, 14, C.dull, 'center');
    }
  mono(g, 'Impact →', 178, 459, 15);
  line(g, 348, 153, 348, 461);
  mono(g, 'OWNER / CONTROL', 375, 174);
  text(g, s.row.owner + ' · ' + s.row.control, 374, 203, 22);
  mono(g, 'SUPPORTING EVIDENCE', 375, 240);
  text(g, s.row.evidence.join('  +  ') || 'Awaiting test and replay', 374, 266, 19, {
    color: s.row.evidence.length ? C.teal : C.rust,
  });
  mono(g, 'REVIEWER ESTIMATE', 375, 302);
  text(
    g,
    s.residual ? '4 × 5 = 20    →    2 × 5 = 10' : '4 × 5 = 20    /    inherent risk',
    374,
    331,
    23,
  );
  mono(g, 'NEXT REVIEW     ' + s.row.reviewDate, 375, 374, 17);
  if (b >= 3 && !at(k, 3, 'It is due today') && s.errors.includes('review due'))
    mono(g, 'Compare with 2026-11-06', 375, 430, 18);
  else if (!s.errors.length) stamp(g, 'Ready for review', 375, 438, C.teal);
  else if (s.errors.includes('review due')) stamp(g, 'Review due today', 375, 438);
  else mono(g, 'Review open', 375, 437, 18, C.rust);
}

function pocket(g, x, y, w, label) {
  rect(g, x, y, w, 158, '#bd9862');
  g.beginPath();
  g.moveTo(x, y + 65);
  g.lineTo(x + w * 0.36, y + 85);
  g.lineTo(x + w * 0.64, y + 85);
  g.lineTo(x + w, y + 65);
  g.lineTo(x + w, y + 160);
  g.lineTo(x, y + 160);
  g.closePath();
  g.fillStyle = '#dcb985';
  g.fill();
  line(g, x + 5, y + 151, x + w - 4, y + 151, '#a88350', 1.3);
  mono(g, label, x + 18, y + 123, 16, C.ink);
}
function caseSlip(g, x, y, id, caption) {
  paper(g, x, y, 219, 91);
  mono(g, 'EVALUATION CASE', x + 15, y + 23, 11);
  title(g, id, x + 14, y + 62, 31, C.blue);
  text(g, caption, x + 71, y + 59, 15, { max: 137 });
}
export function evaluation(g, k) {
  const b = k.beat.beatIndex;
  if (b === 5) {
    header(g, 'C17  /  RELEASE EVIDENCE', 'What shipped, and how was it tested?');
    folder(g, 65, 191, 390, 240, 'SYSTEM CARD');
    title(g, 'Deployed behavior', 88, 242, 29);
    lines(
      g,
      [
        'Model M1  ·  prompt P3',
        'Policy G7  ·  tool: propose',
        'Authorization at the executor',
        'Rollback owner: release team',
      ],
      88,
      285,
      35,
      18,
    );
    if (at(k, 5, 'The dataset record')) {
      folder(g, 501, 191, 390, 240, 'DATASET RECORD');
      title(g, 'Evaluation cases', 525, 242, 29);
      lines(
        g,
        [
          'Dataset D4  ·  labeling guide L2',
          'Frozen evaluation split',
          'Document origin and sensitive fields.',
          'Retention: 90 days for this fixture',
        ],
        525,
        285,
        35,
        18,
      );
    }
    return;
  }
  if (b === 6) {
    header(g, 'REPRODUCE REPORT E7', 'Which cases produced the score?');
    const changed = at(k, 6, 'Replace the dataset record');
    folder(g, 66, 195, 395, 235, 'SIGNED REPORT');
    folder(g, 503, 195, 390, 235, 'DATASET ON FILE');
    title(g, 'Report E7', 90, 240, 31);
    title(g, changed ? 'D5 / L3' : 'D4 / L2', 527, 241, 31, changed ? C.rust : C.blue);
    lines(g, ['Cases   D4', 'Labels   L2', 'Split   frozen evaluation'], 92, 292, 36, 21);
    lines(
      g,
      [
        'Cases   ' + (changed ? 'D5' : 'D4'),
        'Labels   ' + (changed ? 'L3' : 'L2'),
        'Provenance · split · retention',
      ],
      527,
      292,
      36,
      21,
    );
    if (changed) stamp(g, 'Reconcile cases and labels', 527, 408, C.rust);
    return;
  }
  if (b < 2) {
    folder(g, 65, 62, 831, 421, 'EVALUATION INTEGRITY');
    mono(g, 'RELEASE RISK REGISTER', 94, 108, 15);
    title(g, 'Who owns the measurement?', 92, 159, 37);
    field(g, 'RISK 01', 'An unauthorized promotion reaches production.', 95, 209, 755);
    if (at(k, 0, 'A second row')) {
      field(g, 'RISK 02', 'Exposed cases or a compromised judge inflate the score.', 95, 295, 755);
    }
    if (b >= 1) stamp(g, 'Owner  /  evaluation and release', 94, 423, C.blue);
    return;
  }
  header(g, 'EVALUATION CUSTODY', 'Follow case H1');
  pocket(g, 89, 264, 330, 'Private holdout');
  pocket(g, 537, 264, 330, 'Regression suite');
  const moved = at(k, 2, 'Move H one', 1.3),
    x = 136 + 448 * moved;
  caseSlip(g, x, 184 - 45 * Math.sin(Math.PI * moved), 'H1', 'Missing signature');
  if (at(k, 3, 'fresh private case')) caseSlip(g, 137, 202, 'H2', 'Unseen request');
  if (b === 4)
    mono(g, 'Audit key access   ·   test answer order   ·   hold on leakage', 88, 465, 17, C.mist);
}
function endMark(g, x, y, failed, word) {
  mark(g, x, y, !failed, 10);
  text(g, word, x + 19, y + 6, 17, { max: 179, color: failed ? C.rust : C.teal });
}
export function results(g, k) {
  const b = k.beat.beatIndex,
    s = suite(k);
  if (b === 5) {
    const upper = 1 - 0.05 ** (1 / 3);
    header(
      g,
      'INDEPENDENT TRIALS  /  FIXED DISTRIBUTION',
      'What can zero failures in three trials rule out?',
    );
    const x = 74,
      w = 810,
      y = 313;
    line(g, x, y, x + w, y, C.mist, 2);
    for (let i = 0; i <= 4; i++) {
      line(g, x + (i * w) / 4, y - 8, x + (i * w) / 4, y + 8, C.mist, 2);
      mono(g, 25 * i + '%', x + (i * w) / 4, y + 38, 15, C.mist, 'center');
    }
    for (let i = 0; i < 3; i++) {
      circle(g, x + i * 47 + 15, 192, 11, C.mist);
      mono(g, 'T' + (i + 1), x + i * 47 + 15, 232, 14, C.mist, 'center');
    }
    text(g, '0 observed failures', 262, 206, 28, { color: C.light });
    if (at(k, 5, 'about sixty-three')) {
      const xx = x + w * upper;
      line(g, x, y - 4, xx, y - 4, C.gold, 9);
      circle(g, xx, y - 4, 8, C.gold);
      mono(g, percent(upper) + ' upper bound', xx, 278, 20, C.gold, 'center');
    }
    mono(g, 'One-sided 95% bound  ·  1 − 0.05^(1/3)', 76, 429, 21, C.light);
    mono(g, 'Curated attack cases have a different sampling basis.', 76, 466, 16, C.mist);
    return;
  }
  paper(g, 48, 48, 865, 449);
  const source = s.missing ? 'EXTRACT FROM SIGNED REPORT ' : 'SIGNED REPORT ';
  mono(g, source + s.report + '  /  ' + (s.retest ? 'RETEST' : 'ORIGINAL'), 78, 88, 14);
  mono(g, 'SUITE V1  ·  DATA D4  ·  LABELS L2', 880, 88, 14, C.blue, 'right');
  title(
    g,
    s.missing
      ? 'Report with eligible cases removed'
      : s.retest
        ? 'Repeat the five cases'
        : 'Read the five case records',
    76,
    134,
    34,
  );
  const groups = [
    {
      x: 78,
      name: 'Unauthorized requests',
      a: s.a,
      pre: 'A',
      fail: 'Forbidden effect',
      ok: 'No effect',
    },
    { x: 513, name: 'Eligible requests', a: s.r, pre: 'R', fail: 'False rejection', ok: 'Allowed' },
  ];
  groups.forEach(({ x, name, a, pre, fail, ok }, j) => {
    text(g, name, x, 184, 23);
    line(g, x, 198, x + 365, 198);
    a.forEach((v, i) => {
      const y = 239 + i * 47;
      mono(g, pre + (i + 1), x, y + 6, 19);
      line(g, x + 39, y, x + 115, y, C.rule, 2);
      if (i < s.visible[j]) endMark(g, x + 129, y, v, v ? fail : ok);
      else circle(g, x + 129, y, 8, null, C.dull);
    });
    if (!a.length) mono(g, 'No eligible cases', x, 250, 18);
    if (s.visible[j] === a.length && b >= 1 && (!j || !s.missing || b >= 3)) {
      const v = j ? s.frr : s.asr,
        count = a.filter(Boolean).length;
      mono(
        g,
        a.length ? (j ? 'FRR' : 'ASR') + '   ' + count + '/' + a.length + '   ' + percent(v)
          : 'FRR   unknown (0 eligible)',
        x,
        395,
        21,
        j && s.missing ? C.rust : C.blue,
      );
    }
  });
  if (b === 4 && at(k, 4, 'Even if A three')) {
    mono(g, 'If A3 had ' + repeatEffect.countOnA3 + ' effects, count ' + repeatEffect.hits + ' trace', 78, 365, 16, C.blue);
  }
  line(g, 77, 414, 881, 414);
  const judge = b >= 1 && (b !== 2 || at(k, 2, 'Both checks pass')) && (!s.missing || b >= 3);
  if (judge)
    stamp(
      g,
      s.ready
        ? 'Both checks pass this retest'
        : s.missing
          ? 'Hold  /  eligible coverage missing'
          : 'Hold  /  unsafe effect and excessive friction',
      79,
      463,
      s.ready ? C.teal : C.rust,
    );
  if (b >= 1)
    mono(g, 'Unsafe effects allowed: 0   /   FRR ceiling: 10%', 876, 457, 13, C.dull, 'right', 330);
}
function outcomeRow(g, item, x, y, highlight) {
  if (highlight) rect(g, x - 5, y - 15, 218, 24, C.pale);
  mono(g, item.id, x, y + 2, 15);
  line(g, x + 35, y - 3, x + 95, y - 3, item.tested ? (item.blocked ? C.rust : C.teal) : C.rule, 2);
  if (item.tested) {
    mark(g, x + 104, y - 3, !item.blocked, 7);
    text(g, item.blocked ? 'False rejection' : 'Allowed', x + 119, y + 2, 14, {
      color: item.blocked ? C.rust : C.teal,
    });
  } else circle(g, x + 104, y - 3, 6, null, C.dull);
}

function accessRates(g, s, addingWeb) {
  const scaleX = (rate) => 406 + rate * 690;
  const ceilingX = scaleX(pathCeiling);
  const pooledY = 376;
  const screenY = 412;
  const axisY = 431;
  const moving = s.pooledMove > 0 && s.pooledMove < 1;
  const showOriginal = addingWeb && s.pooledMove === 0;
  const pooled = showOriginal ? s.originalAggregate : s.aggregate;
  const combined = addingWeb
    ? (showOriginal ? 'Original combined' : 'With extra web')
    : 'Combined';

  mono(g, 'FALSE REJECTION RATE', 65, 351, 14);
  if (s.ceilingRead) {
    mono(g, percent(pathCeiling) + ' per-path ceiling', ceilingX, 351, 15, C.blue, 'center');
    for (let y = 359; y < axisY; y += 9) line(g, ceilingX, y, ceilingX, y + 5, C.blue, 1.5);
  }
  for (const [label, y] of [[combined, pooledY], ['Screen reader', screenY]]) {
    text(g, label, 65, y + 7, 20);
    line(g, scaleX(0), y, scaleX(0.6), y, C.rule, 2);
  }
  for (const tick of [0, 0.2, 0.4, 0.6]) {
    const x = scaleX(tick);
    line(g, x, axisY - 4, x, axisY + 3, C.dull);
    mono(g, percent(tick), x, 450, 14, C.dull, 'center');
  }

  if (s.pooledRead) {
    const from = scaleX(s.originalAggregate);
    const to = scaleX(pooled);
    if (addingWeb && !showOriginal) circle(g, from, pooledY, 6, C.paper, C.dull);
    if (!moving) {
      line(g, scaleX(0), pooledY, to, pooledY, C.blue, 4);
      const total = showOriginal ? s.total - s.extra : s.total;
      mono(g, s.blocked + ' / ' + total, 383, pooledY + 7, 19, C.blue, 'right');
      mono(g, percent(pooled), 888, pooledY + 7, 19, C.blue, 'right');
    }
    circle(g, moving ? from + (to - from) * s.pooledMove : to, pooledY, 6, C.blue);
  }
  if (s.screenRead) {
    const screenRate = s.rates[1];
    const x = scaleX(screenRate);
    const color = screenRate > pathCeiling ? C.rust : C.teal;
    line(g, scaleX(0), screenY, x, screenY, color, 5);
    circle(g, x, screenY, 7, color);
    mono(g, s.blocked + ' / ' + s.screen.length, 383, screenY + 7, 19, color, 'right');
    mono(g, percent(screenRate), 888, screenY + 7, 19, color, 'right');
  }
}

export function access(g, k) {
  const b = k.beat.beatIndex,
    s = accessState(k);
  paper(g, 39, 39, 882, 461);
  const run = s.pendingRetest || s.repaired
    ? 'RETEST   /   E8'
    : s.extra
      ? 'E7   /   ADDED WEB CASES'
      : 'ORIGINAL RUN   /   E7';
  mono(g, run, 64, 74, 13);
  title(g, 'Screen-reader requests', 63, 113, 31);
  title(g, 'Web console', 557, 113, 28);
  line(g, 521, 91, 521, 292);
  const traceOpen = at(k, 2, 'Open S one');
  s.ids.forEach((v, i) =>
    outcomeRow(
      g,
      v,
      68 + (i < 4 ? 0 : 226),
      162 + (i % 4) * 36,
      traceOpen && b <= 3 && v.id === s1Replay.id,
    ),
  );
  const totalWeb = s.web.length;
  if (s.extra) rect(g, 552, 190, 250, 47, C.sheet);
  for (let i = 0; i < totalWeb; i++) {
    const x = 565 + (i % 10) * 25,
      y = 153 + Math.floor(i / 10) * 24;
    if (s.webRead) mark(g, x, y, true, 7);
    else circle(g, x, y, 6.5, null, C.dull);
  }
  mono(g, totalWeb + ' eligible requests', 557, 253, 16);
  if (s.extra) mono(g, '+' + s.extra + ' added', 887, 253, 16, C.blue, 'right');
  if (s.webRead) mono(g, s.web.filter(Boolean).length + ' false rejections', 557, 276, 15, C.teal);
  mono(
    g,
    b === 1
      ? s.seen + ' / ' + s.screen.length + ' outcomes replayed'
      : s.screen.length + ' eligible requests',
    68,
    309,
    16,
  );
  line(g, 64, 326, 890, 326, C.rule);
  if (b === 3) {
    const trace = s1Replay;
    rect(g, 64, 360, 369, 113, C.sheet);
    rect(g, 493, 360, 396, 113, C.sheet);
    mono(g, trace.id + '  /  REQUEST FORM', 80, 388, 14);
    mono(g, trace.id + '  /  GATE INPUT', 509, 388, 14);
    if (s.step >= 1) text(g, 'Selected scope   ' + trace.selectedShare + '%', 79, 423, 22);
    if (s.step >= 2 && trace.confirmationOpened)
      mono(g, 'Confirmation opened', 80, 453, 15, C.teal);
    if (s.step === 3) {
      line(g, 434, 413, 484, 413, C.blue, 2);
      text(g, '›', 473, 420, 24, { color: C.blue });
      text(g, 'Candidate   ' + trace.gateInput.candidate, 509, 421, 20);
      mono(g, 'Submitted scope   ' + (trace.gateInput.share ?? '[empty]'), 509, 453, 17, C.rust);
    }
    return;
  }
  accessRates(g, s, b === 4 || (b === 5 && s.extra > 0));
  if (b >= 6)
    mono(
      g,
      b === 6
        ? '8 cases  ·  check other barriers with users'
        : 'Collect sensitive attributes only for a lawful, necessary purpose.',
      887,
      309,
      15,
      C.dull,
      'right',
      550,
    );
}

export function audit(g, k) {
  const s = auditState(k);
  header(g, 'AUDIT REPLAY  /  C17', 'Can a rewritten chain agree with itself?');
  s.live.forEach((event, i) => {
    const x = 52 + 296 * i,
      y = 172;
    paper(g, x, y, 265, 169);
    mono(g, 'EVENT 0' + (i + 1) + '  /  ' + event.event, x + 16, y + 28, 13);
    title(g, event.value, x + 15, y + 74, 25, i === 1 && s.edited ? C.rust : C.ink, 233);
    mono(g, 'prev  ' + event.previous.slice(0, 10), x + 16, y + 116, 14);
    mono(g, 'hash  ' + event.hash.slice(0, 10), x + 16, y + 145, 14, C.blue);
    if (i < 2) {
      line(g, x + 265, y + 125, x + 294, y + 125, C.gold, 2);
      text(g, '›', x + 283, y + 132, 24, { color: C.gold });
    }
  });
  mono(g, 'EVENTS + LINKS', 55, 404, 14, C.mist);
  text(g, s.internal ? 'Internally consistent' : 'Event digest mismatch', 55, 443, 24, {
    color: s.internal ? C.light : C.gold,
  });
  rect(g, 392, 378, 515, 101, '#c6b58c');
  rect(g, 399, 385, 501, 87, C.paper);
  for (const x of [407, 893]) for (const y of [393, 465]) circle(g, x, y, 2, C.dull);
  if (!at(k, 0, 'copies the original head')) {
    mono(g, 'PROTECTED ANCHOR', 422, 411, 16);
    return;
  }
  mono(g, 'PROTECTED ANCHOR     ' + s.anchor.slice(0, 12), 422, 411, 16);
  text(
    g,
    s.match ? 'Head matches protected copy' : 'New head differs from protected copy',
    421,
    450,
    22,
    { color: s.match ? C.teal : C.rust, max: 458 },
  );
}
function stub(g, x, y, id, label) {
  paper(g, x, y, 754, 92);
  for (let j = 0; j < 8; j++) line(g, x + 157, y + 4 + j * 11, x + 157, y + 9 + j * 11, C.dull);
  mono(g, 'REQUEST', x + 19, y + 28, 13);
  title(g, id, x + 18, y + 68, 30);
  mono(g, 'SCOPED ACTOR LABEL', x + 180, y + 29, 13);
  mono(g, label || 'reveal actor field', x + 180, y + 65, 21, label ? C.blue : C.dull);
}
export function privacy(g, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    folder(g, 65, 68, 825, 411, 'APPEAL  /  R86');
    mono(g, 'CONTROLLED REPLAY EXTRACT', 96, 111);
    title(g, 'Reconstruct the original request', 94, 159, 35);
    const rows = [
      ['Proposal', 'C17 · 10% of mock production'],
      ['At decision time', 'Model M1 · Prompt P3 · Policy G7'],
      ['Retrieved report', 'Restricted source reference · untrusted'],
      ['Policy input', instructionLabel(original.proposal)],
      ['Decision', 'Security receipt missing · held'],
      ['Observed effect', '0 traffic changes · appeal AP-17'],
    ];
    rows.forEach(([a, v], i) => {
      const y = 202 + i * 38;
      mono(g, a, 96, y, 15);
      text(g, v, 325, y, 19, { max: 531 });
      line(g, 96, y + 14, 855, y + 14);
    });
    if (b === 1) {
      mono(g, 'Private input', 97, 441, 15);
      rect(g, 327, 424, 245, 20, C.ink);
      text(g, 'restricted source', 593, 441, 16);
    }
    return;
  }
  if (b <= 3) {
    const compare = at(k, 3, 'They match'),
      rotate = at(k, 3, 'Change the key');
    header(
      g,
      'PSEUDONYMOUS AUDIT TRAIL',
      rotate ? 'Compare across key scopes' : 'Two requests, one actor?',
    );
    const old = actorLabel('owner-demo', 'scope-one'),
      next = actorLabel('owner-demo', rotate ? 'scope-two' : 'scope-one');
    stub(g, 90, 163, 'R86', old);
    stub(g, 90, 292, 'R87', next);
    if (compare)
      mono(
        g,
        rotate
          ? 'R86 uses the original key. R87 is shown with a rotated key.'
          : 'Same user + same scoped key → same 96-bit label',
        92,
        446,
        17,
        C.mist,
      );
    return;
  }
  if (b <= 6) {
    const edited = auditState({ beat: { beatIndex: 2 } }),
      mutable = b === 6 && at(k, 6, 'replace both chain and anchor');
    const hash = b === 4 ? digest({ candidate: 'C17', policy: 'G7' }) : edited.head;
    header(
      g,
      'INTEGRITY CHECK',
      b === 4 ? 'Agree on the bytes before hashing' : 'Who can replace the anchor?',
    );
    paper(g, 65, 164, 829, 244);
    if (b === 4) {
      mono(g, 'SERIALIZED UTF-8 INPUT', 94, 209);
      mono(g, '{"candidate":"C17","policy":"G7"}', 94, 261, 24, C.ink);
      line(g, 93, 286, 862, 286);
      mono(g, 'SHA-256   ' + hash.slice(0, 28) + '…', 94, 344, 21, C.blue);
    } else {
      mono(g, 'RECOMPUTED HEAD', 91, 204);
      mono(g, hash.slice(0, 24), 91, 253, 24, C.ink);
      mono(g, mutable ? 'ADMIN-WRITABLE ANCHOR' : 'EXTERNALLY PROTECTED ANCHOR', 91, 300);
      mono(
        g,
        (mutable ? edited.head : edited.anchor).slice(0, 24),
        91,
        350,
        24,
        mutable ? C.ink : C.rust,
      );
      stamp(g, mutable ? 'Match' : 'Mismatch', 667, 311, mutable ? C.blue : C.rust);
    }
    mono(
      g,
      b === 4
        ? 'Fix field order and encoding.'
        : mutable
          ? 'The same writer changed both copies.'
          : 'Bind the protected copy to sequence, scope and time.',
      67,
      459,
      16,
      C.mist,
    );
    return;
  }
  header(g, 'RETENTION SCHEDULE', 'What is the record for?');
  [
    ['Dataset fixture', '90 days', 'Evaluation cases · local policy'],
    [
      'Covered deployer logs',
      'At least 6 months',
      'Appropriate period unless applicable law provides otherwise',
    ],
  ].forEach(([name, term, purpose], i) => {
    const y = 149 + i * 146;
    paper(g, 68, y, 827, 119);
    title(g, name, 92, y + 43, 26);
    if (i === 0 || b >= 8) {
      text(g, term, 531, y + 45, 31, { color: C.blue });
      text(g, purpose, 92, y + 88, 18, { max: 751 });
    }
  });
}
