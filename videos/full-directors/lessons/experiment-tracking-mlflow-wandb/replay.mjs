import { firstFrameAt } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import {
  C,
  stage,
  heading,
  txt,
  serif,
  mono,
  center,
  box,
  line,
  dot,
  chip,
  plate,
  slot,
  chassis,
  arrow,
  book,
  file,
  clamp,
  mix,
  smooth,
  cue,
  windowText,
  poly,
} from './bench.mjs';
import {
  CASES,
  caseNames,
  comparison,
  comparable,
  counted,
  evaluate,
  fingerprint,
  lossHistory,
  opening,
  prefix,
  reports,
  refusalCount,
  runs,
  saved,
  suiteSha,
} from './experiment.mjs';

function drawReplayRun(c, channel, x, received) {
  const width = 408;
  chassis(c, x, 180, width, 306);
  serif(c, channel.id, x + 23, 215, 35, C.light);
  mono(c, channel.id === 'run-1' ? 'Original' : 'First repair', x + width - 24, 216, 17, C.mint, { align: 'right' });
  plate(c, x + 19, 249, width - 38, 54, '#f5dfab');
  txt(c, channel.rule, x + 38, 276, 24, C.ink, { bold: true });

  // Each saved run prints only the case rows replayed on this channel.
  box(c, x + 18, 318, width - 36, 18, '#102c35', 6);
  const left = x + 28, right = x + width - 28;
  const paper = [[left, 326], [right, 326]];
  for (let i = 0; i <= 32; i++) {
    paper.push([mix(right, left, i / 32), 458 - (i % 2) * 4]);
  }
  poly(c, paper, C.light, C.line, 1);
  mono(c, 'CASE ID', left + 16, 344, 13, C.mid);
  mono(c, 'RETURNED ROUTE', right - 16, 344, 13, C.mid, { align: 'right' });
  line(c, left + 12, 358, right - 12, 358, C.line, 1);
  channel.rows.forEach((row, index) => {
    if (channel.receiving && !received && index === channel.rows.length - 1) return;
    const y = 379 + index * 50;
    mono(c, row.caseId, left + 16, y, 21, C.ink);
    if (row.route) {
      const ink = row.route === row.expected ? C.green : C.red;
      box(c, right - 146, y - 17, 128, 34, C.light, 4, ink, 2);
      center(c, row.route, right - 82, y, 20, ink, { face: 'Mono', bold: true });
    } else {
      mono(c, 'Awaiting return', right - 17, y, 16, C.mid, { align: 'right' });
    }
    if (!index) line(c, left + 12, 404, right - 12, 404, C.line, 1);
  });
}

export function replay(c, k) {
  const s = opening(k);
  stage(c);
  mono(c, 'SIMULATED EXPERIMENT', 40, 34, 15, C.green);
  serif(c, 'Paired replay', 38, 74, 36);
  const rollback = s.input.id === 'rollback';
  chip(c, 314, 23, 279, 82, s.input.caseId, C.ice, rollback ? 'Rollback steps' : 'Deployment approval');
  if (rollback) {
    book(c, 622, 14, 298, 99, s.open);
  } else {
    plate(c, 624, 17, 296, 93, C.paper);
    mono(c, 'Approval file', 644, 39, 16, C.mid);
    box(c, 641, 55, 262, 38, '#365057', 4);
    center(c, 'No release record', 772, 74, 19, C.light);
  }
  const origin = 453;
  line(c, origin, 106, origin, 132, C.mid, 3);
  // Send identical copies down the fork. On the second case only run-2 receives a copy.
  s.channels.forEach((channel, i) => {
    const x = 42 + i * 468;
    const contact = x + 204;
    if (channel.receiving) {
      line(c, origin, 132, contact, 132, C.mid, 3);
      line(c, contact, 132, contact, 180, C.mid, 3);
    }
    drawReplayRun(c, channel, x, s.feed === 1);
  });
  s.channels.forEach((channel, i) => {
    if (!channel.receiving) return;
    const contact = 246 + 468 * i;
    if (s.feed < 1) {
      const across = Math.min(s.feed / 0.76, 1);
      const down = Math.max((s.feed - 0.76) / 0.24, 0);
      const cx = mix(origin, contact, across), cy = mix(132, 166, down);
      dot(c, cx, cy, 9, C.ice, C.blue, 2);
      dot(c, cx, cy, 3, C.blue);
    } else {
      dot(c, contact, 175, 5, C.mint, C.ink);
    }
  });
}
export function runRecord(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  heading(
    c,
    'Experiment  /  deploy-claim-gate-repair',
    b < 3 ? 'Inside the two-request replay' : b === 3 ? 'What can change inside a run?' : 'Which loss values can you read back?',
  );
  if (b < 3) {
    const r = evaluate('first repair', [CASES[0], CASES[2]]);
    chassis(c, 44, 134, 865, 327);
    txt(c, 'Run 2  /  replay excerpt', 73, 170, 24, C.light, { bold: true });
    chip(c, 75, 206, 350, 64, 'Release record required', C.ice, 'chosen parameter');
    chip(c, 75, 309, 350, 64, 'req_205', C.paper, 'incident tag');
    if (b === 2) {
      file(
        c,
        489,
        201,
        381,
        174,
        'Saved report',
        ['req_205    ABSTAIN', 'hold_001   ABSTAIN'],
        '#fff2d5',
      );
      txt(c, refusalCount(r), 492, 411, 24, C.amber);
    } else {
      mono(c, 'Trace  →  incident  →  replay', 495, 257, 19, C.mint);
      txt(c, 'One execution', 495, 311, 28, C.light);
    }
  } else if (b === 3) {
    plate(c, 44, 136, 381, 304);
    mono(c, 'Chosen temperature', 66, 169, 18);
    chip(c, 73, 204, 154, 72, '0.0', C.ice);
    if (cue(k, 3, 'Try to log')) {
      chip(c, 239, 205, 144, 72, '0.7', C.paper);
      txt(
        c,
        cue(k, 3, 'Start another run') ? 'Conflict · start a new run' : 'Second write',
        73,
        331,
        23,
        C.red,
        { max: 320 },
      );
    }
  } else {
    const samples = lossHistory(k);
    const latest = samples.at(-1);
    plate(c, 44, 136, 381, 304);
    txt(c, 'Local teaching tracker', 66, 173, 23, C.ink, { bold: true });
    mono(c, 'Current metric value', 66, 211, 17, C.mid);
    mono(c, latest ? '{"loss": ' + latest.value + '}' : '{}', 66, 299, 27, C.blue);
    chassis(c, 462, 136, 449, 304);
    txt(c, 'MLflow metric history', 489, 173, 23, C.light, { bold: true });
    mono(c, 'Training loss by step', 489, 209, 17, C.metal);
    const height = (value) => 373 - 126 * value;
    for (const { step, value } of samples) {
      const x = 518 + step * 144, y = height(value);
      if (step) line(c, x - 144, height(samples[step - 1].value), x, y, C.mint, 3);
      dot(c, x, y, 6, C.amber);
      center(c, value.toFixed(2), x, y - 22, 18, C.light);
      center(c, 'step ' + step, x, 395, 16, C.metal);
    }
  }
}
export function suite(c, k) {
  stage(c);
  heading(c, 'Evaluation suite  /  four frozen cases', 'What did the run actually score?');
  const sorted = smooth(cue(k, 2, 'Sort the copy', 1.15));
  const edit = !!cue(k, 3, 'The copy gets');
  const rows = CASES.map((r, i) => (edit && i === 1 ? { ...r, expected: 'ABSTAIN' } : r));
  const order = [...rows].sort((a, b) => a.caseId.localeCompare(b.caseId));
  mono(c, 'Case ID', 62, 146);
  mono(c, 'Evidence in the fixture', 311, 146);
  mono(c, 'Expected route', 705, 146);
  if (k.beat.beatIndex === 0) {
    rows.forEach((r, i) => {
      const y = 170 + i * 54;
      box(c, 49, y, 862, 45, i % 2 ? C.deck : C.light, 4);
      mono(c, r.caseId, 64, y + 23, 20, C.ink);
      txt(c, r.evidence, 311, y + 23, 21, C.ink);
      mono(c, r.expected, 708, y + 23, 19, C.green);
    });
  } else {
    stage(c);
    heading(c, 'Four-case suite  /  canonical encoding', 'Follow each ID into the working copy');
    mono(c, 'Frozen rows', 57, 143);
    mono(c, 'Working copy', 571, 143);
    const ys = (i) => 195 + i * 54;
    for (const [i, r] of rows.entries()) {
      const right = sorted >= 0.5 ? order.indexOf(r) : i;
      const dark = edit && i === 1;
      const length = Math.abs(2 * sorted - 1);
      line(
        c,
        384,
        ys(i),
        384 + 162 * length,
        mix(ys(i), ys(right), length),
        dark ? C.red : C.line,
        2,
      );
      box(c, 50, ys(i) - 20, 325, 40, C.light, 4);
      mono(c, r.caseId, 60, ys(i), 18, C.ink);
      mono(c, CASES[i].expected, 224, ys(i), 17, C.mid);
      box(c, 559, ys(right) - 20, 346, 40, dark ? '#f7dcc4' : C.light, 4);
      mono(c, r.caseId, 570, ys(right), 18, C.ink);
      mono(c, r.expected, 740, ys(right), 17, dark ? C.red : C.mid);
    }
  }
  if (cue(k, 2, 'A fingerprint')) {
    chassis(c, 49, 405, 862, 77);
    mono(c, 'Frozen  ' + prefix(suiteSha), 73, 443, 17, C.mint);
    mono(c, 'Copy  ' + prefix(fingerprint(rows)), 485, 443, 17, edit ? C.amber : C.mint);
  }
}
export function insideHash(c, k) {
  stage(c);
  heading(c, 'Single-row SHA-256', 'Which bytes reach the hash?');
  const changed = cue(k, 1, 'The digest moves'),
    question = cue(k, 2, 'The digest stays');
  const row = { ...CASES[0], source: changed ? 'reviewed_copy' : CASES[0].source };
  chassis(c, 45, 128, 513, 316);
  const values = [
    ['case_id', row.caseId],
    ['evidence_state', 'no_approval_support'],
    ['expected_route', row.expected],
    ['slice_name', row.slice],
    ['source', row.source],
  ];
  values.forEach(([name, value], i) => {
    mono(c, name, 68, 168 + i * 41, 15, C.metal);
    mono(c, value, 259, 168 + i * 41, 16, i === 4 && changed ? C.amber : C.light);
  });
  windowText(c, 66, 374, 466, 47, prefix(fingerprint([row])), C.mint, 24);
  file(c, 593, 150, 319, 164, 'Question text', [
    question ? 'Who approved the deploy?' : 'May I deploy?',
    'Stored separately',
  ]);
  if (cue(k, 2, 'In a real run')) {
    txt(c, 'Archive with the run', 598, 366, 23, C.green, { bold: true });
    txt(c, 'Questions, evidence, label policy', 598, 401, 17, C.ink);
    txt(c, 'and actual model inputs', 598, 429, 17, C.ink);
  }
}
export function paired(c, k) {
  stage(c);
  heading(c, 'Run 2  /  release records only', 'Count the decisions as they return');
  const r = counted(k);
  mono(c, 'Case', 56, 147);
  mono(c, 'Expected', 375, 147);
  mono(c, 'Returned', 555, 147);
  CASES.forEach((row, i) => {
    const y = 177 + i * 67,
      actual = r.rows[i],
      bad = actual && actual.predicted !== row.expected;
    plate(c, 48, y, 670, 53, bad ? '#ffdfc5' : C.light);
    txt(c, caseNames[i], 63, y + 27, 21, C.ink);
    mono(c, row.expected, 375, y + 27, 18, C.mid);
    mono(c, actual?.predicted || '···', 555, y + 27, 19, bad ? C.red : C.green);
  });
  chassis(c, 742, 176, 172, 254);
  center(c, 'EXACT', 828, 213, 16, C.metal, { face: 'Mono' });
  const totalReady = [
    false,
    true,
    !!cue(k, 1, 'Two matches'),
    !!cue(k, 2, 'That leaves'),
    !!cue(k, 3, 'That makes'),
  ][r.count];
  center(c, totalReady ? r.exact + '/' + r.count : '· / ·', 828, 283, 50, C.amber, {
    face: 'Mono',
  });
  center(c, 'checked rows', 828, 352, 17, C.light);
  if (k.beat.beatIndex === 2 && cue(k, 3, 'Read the rollback'))
    txt(c, 'The miss is a supported request for rollback steps.', 56, 472, 21, C.red);
}
const xCase = [328, 498, 668, 838];
export function routes(c, k) {
  const beat = k.beat.beatIndex + 1;
  const firstRepair = !!cue(k, 1, 'In the first repair');
  const ruleIntroduced = !!cue(k, 2, 'The candidate sees');
  const factualReview = !!cue(k, 4, 'Checking whether');
  let motion = Number(beat > 3);
  let countSpoken = beat > 3;
  if (beat === 3) {
    // Start each answer caption on its first spoken word.
    k.reveal('Only rollback changes', 0);
    k.reveal('Four routes match', 0);
    const localFrame = firstFrameAt(k.elapsed);
    const moveStart = firstFrameAt(k.wordCue('The rule now serves the steps').end);
    const moveEnd = moveStart + firstFrameAt(0.6);
    const countEnd = firstFrameAt(k.wordCue('Four routes match').end);
    motion = smooth(clamp((localFrame - moveStart) / (moveEnd - moveStart)));
    countSpoken = localFrame >= countEnd;
  }
  const previous = reports[firstRepair ? 1 : 0];
  const revision = reports[2];
  const totalsReady = motion === 1 && countSpoken;
  const totals = totalsReady ? revision : previous;
  const previousRun = firstRepair ? 2 : 1;

  stage(c);
  heading(c, 'Four fixed labels  /  compare candidates', 'Compare routes on the same four cases');
  const routeY = (route) => (route === 'SERVE' ? 197 : 279);
  box(c, 46, 150, 866, 166, C.paper, 7, C.line);
  for (const route of ['SERVE', 'ABSTAIN']) {
    const y = routeY(route);
    mono(c, route, 67, y, 21, C.ink);
    line(c, 198, y, 880, y, C.line, 1.5);
  }

  previous.rows.forEach((row, i) => {
    const x = xCase[i];
    const from = routeY(row.predicted);
    const to = routeY(revision.rows[i].predicted);
    const y = mix(from, to, motion);
    dot(c, x, routeY(row.expected), 22, C.light, C.mid, 2);
    if (y !== from) {
      line(c, x, from, x, y, C.brass, 3);
      dot(c, x, from, 14, C.paper, C.brass, 3);
    }
    dot(c, x, y, 10, C.blue);
    center(c, caseNames[i], x, 342, 18, C.ink, { bold: true, max: 164 });
    center(c, CASES[i].evidence, x, 366, 16, C.mid, { max: 164 });
  });

  dot(c, 63, 126, 9, C.light, C.mid);
  txt(c, 'Expected', 81, 126, 18);
  dot(c, 205, 126, 6, C.blue);
  const routeLabel =
    motion === 0 ? 'Run ' + previousRun + ' route' : motion < 1 ? 'Route change' : 'Run 3 route';
  txt(c, routeLabel, 220, 126, 18);
  if (motion > 0) {
    dot(c, 385, 126, 8, null, C.brass, 3);
    txt(c, 'Previous route', 401, 126, 18);
  }

  line(c, 47, 386, 911, 386, C.line, 1);
  mono(c, 'Run ' + (totalsReady ? 3 : previousRun) + ' totals', 54, 405, 18);
  mono(c, totals.unsafe + ' unsafe serves', 225, 405, 20, totals.unsafe ? C.red : C.green);
  mono(c, refusalCount(totals), 435, 405, 20, totals.unnecessary ? C.red : C.green);
  mono(c, totals.exact + '/' + totals.count + ' exact', 775, 405, 22, C.ink);

  if (factualReview) {
    txt(c, 'Factual review needs the answer text and its evidence.', 54, 432, 20, C.blue);
  } else if (ruleIntroduced) {
    txt(c, 'Run 3 accepts a release record or a rollback runbook.', 54, 432, 20, C.blue);
  } else if (firstRepair) {
    txt(c, 'Run 2 requires a release record.', 54, 432, 20, C.blue);
  } else {
    txt(c, 'Run 1 serves every request.', 54, 432, 20, C.blue);
  }
}
export function auditRows(c, k) {
  stage(c);
  heading(c, 'Run 3  /  artifact readback', 'File the report by case ID');
  const damaged = cue(k, 2, 'Give these changed bytes') && !cue(k, 3, 'Its four rows');
  const snap = saved[Number(!!damaged)];
  const align = smooth(cue(k, 2, 'Now file that last row', 1));
  const y = 227;
  CASES.forEach((row, i) => {
    const x = 54 + i * 224;
    center(c, row.caseId, x + 88, 172, 22, C.ink, { face: 'Mono' });
    slot(c, x, y, 176, 78);
  });
  snap.report.forEach((r, i) => {
    const j = CASES.findIndex((v) => v.caseId === r.caseId);
    const dup = i !== j;
    const cross = Math.min(1, Math.max(0, (align - 0.2) / 0.65));
    const x = 54 + 224 * mix(i, j, dup ? cross : 1);
    const dy = dup ? 80 * Math.min(1, align / 0.2) - 12 * Math.max(0, (align - 0.85) / 0.15) : 0;
    chip(c, x, y + dy, 176, 75, r.caseId, dup ? C.amber : C.ice, r.predicted);
  });
  const verdict =
    (!damaged && cue(k, 1, 'The original report passes')) || (damaged && cue(k, 3, 'A checksum'));
  mono(c, 'Saved SHA  ' + prefix(snap.run.artifacts.report.digest), 54, 408, 17);
  mono(c, 'Logged exact  ' + snap.run.metrics.exact + '/4', 54, 445, 18);
  windowText(
    c,
    553,
    391,
    353,
    71,
    verdict
      ? snap.verification.valid
        ? 'Verifier passes'
        : 'Duplicate case ID'
      : 'Verify contents?',
    verdict && !snap.verification.valid ? C.pink : C.mint,
    22,
  );
}
export function storage(c, k) {
  stage(c);
  const b = k.beat.beatIndex + 1;
  heading(c, 'Local teaching tracker', b < 3 ? 'One run has two homes' : 'What survives cleanup?');
  const expired = !!cue(k, 3, 'those files disappear');
  const shared = !!cue(k, 3, 'For a shared project');
  const run = runs[1];
  chassis(c, 48, 134, 379, 254);
  txt(c, 'Run metadata', 72, 167, 25, C.light, { bold: true });
  mono(c, 'In memory', 72, 200, 18, C.mint);
  mono(c, run.id + '  /  release record only', 72, 249, 17, C.light);
  txt(c, refusalCount(run.metrics), 72, 295, 23, C.amber);
  txt(c, 'Owner + unique run ID', 72, 353, 17, C.metal);
  plate(c, 451, 134, 460, 254);
  txt(
    c,
    expired ? 'Temporary directory closed' : 'Temporary artifact directory',
    477,
    167,
    24,
    C.ink,
    { bold: true },
  );
  if (!expired) {
    file(c, 476, 201, 184, 118, 'report.json', [run.metrics.count + ' case rows']);
    file(c, 679, 201, 205, 118, 'manifest.json', ['simulation']);
    if (cue(k, 1, 'Exclusive creation'))
      mono(c, 'Repeat path → write rejected', 480, 353, 16, C.red);
  } else {
    box(c, 478, 201, 405, 118, C.deck, 4);
    center(c, 'No retained files', 681, 260, 24, C.mid);
    if (cue(k, 4, 'Redact the actual payload'))
      txt(c, 'Redact the payload before logging.', 478, 353, 19, C.ink);
  }
  if (shared) {
    txt(c, 'Shared project  /  Storage to configure', 51, 428, 22, C.ink, { bold: true });
    line(c, 51, 449, 910, 449, C.line, 1);
    txt(c, 'Metadata → persistent database', 52, 476, 20, C.green);
    txt(c, 'Approved files → artifact store', 462, 476, 20, C.green);
  }
}
export function conditions(c, k) {
  stage(c);
  heading(c, 'Controlled comparison', 'Line up the scoring conditions');
  const changed = !!cue(k, 2, 'Leave the logged score');
  const records = comparison[Number(changed)];
  const cols = [326, 525, 724];
  records.forEach((r, i) => {
    const x = cols[i];
    chip(c, x, 137, 170, 61, 'Run ' + (i + 1), C.ice);
    [
      prefix(r.context.suite).slice(0, 8),
      r.context.evidence,
      r.context.policy,
      r.context.evaluator,
    ].forEach((v, j) => {
      box(
        c,
        x,
        216 + j * 48,
        170,
        38,
        changed && i === 2 && j === 3 ? '#f9d5b8' : C.light,
        4,
        C.line,
        1,
      );
      center(c, v, x + 85, 235 + j * 48, 16, C.ink, { face: 'Mono', max: 159 });
    });
  });
  ['Suite SHA prefix', 'Evidence snapshot', 'Policy', 'Evaluator'].forEach((name, j) =>
    txt(c, name, 60, 235 + j * 48, 21, C.mid),
  );
  const ok = comparable(records);
  windowText(
    c,
    56,
    428,
    839,
    53,
    ok
      ? 'Same conditions · routing rule varies'
      : 'Comparison blocked · rerun with the same evaluator',
    ok ? C.mint : C.amber,
    21,
  );
}
export function saturation(c, k) {
  stage(c);
  const b = k.beat.beatIndex + 1;
  heading(
    c,
    'Suite coverage',
    b <= 2 ? 'Three perfect scores' : 'Change the judge, change the question',
  );
  if (b <= 2) {
    const extra = !!cue(k, 2, 'Add it to a new suite');
    ['Candidate X', 'Candidate Y', 'Candidate Z'].forEach((v, i) => {
      const y = 183 + i * 91;
      txt(c, v, 56, y + 24, 24);
      for (let j = 0; j < (extra ? 5 : 4); j++) {
        const x = 300 + j * 114;
        slot(c, x, y, 77, 48);
        if (j < 4) chip(c, x + 1, y - 3, 75, 49, '✓', C.mint);
      }
      mono(c, '4/4', 850, y + 24, 24, C.green);
    });
    if (extra) {
      center(c, 'New case', 795, 145, 18, C.ink);
      mono(
        c,
        'Fifth result pending for each candidate · old suite scored 4/4',
        57,
        458,
        18,
        C.brass,
      );
    }
  } else {
    file(c, 50, 163, 348, 203, 'Judge configuration', [
      'instructions',
      'model revision',
      'inference settings',
    ]);
    arrow(c, 423, 263, 520, 263);
    chassis(c, 546, 166, 360, 201);
    txt(c, b === 3 ? 'Evaluator version' : 'GenAI evaluation', 573, 210, 24, C.light);
    mono(c, b === 3 ? 'Bind the scorer' : 'predict → score', 573, 260, 20, C.mint);
    txt(
      c,
      b === 3 ? 'Rerun matched candidates' : 'Model judge calls can incur cost',
      573,
      317,
      17,
      C.amber,
    );
    mono(c, 'Same candidate  /  same cases', 55, 445, 21, C.green);
  }
}
