import { P, lerp, stepText } from './press.mjs';
import { scorecards } from './record-room.mjs';
import {
  service,
  eta,
  v1,
  v2,
  CURRENT_RECORD,
  draftClaims,
  cases,
  version,
  fresh,
  checkedIncidentClaim,
  renderIncident,
  baselineReview,
  candidateReview,
  silentReview,
  relabeledReview,
  support,
  total,
  release,
  released,
} from './edition-data.mjs';

const names = ['Clean update', 'Extra estimate', 'Wrong status', 'Unknown source'];
export function abstention(d) {
  d.stage('POLICY   /   THE COST OF A PASS');
  if (d.b <= 2) {
    d.headline('What did those three passes cost?');
    scorecards(d, true, true);
    if (d.b === 2)
      d.txt(
        'Questions 8–10: one useful answer forgone, two errors avoided.',
        80,
        721,
        34,
        P.ink,
        'Serif',
      );
    return;
  }
  d.headline('Which check gets to decide?');
  const full = d.b === 4;
  d.punchStrip(76, 218, 1281, 212);
  d.label('FIRST   /   VERIFY CLAIMS AGAINST THE SOURCE', 143, 273);
  d.txt(
    full ? 'All selected claims have support.' : 'Three fields match. The estimate is absent.',
    142,
    369,
    49,
    P.ink,
    'Serif',
  );
  if (full) {
    d.line(192, 434, 192, 496, P.teal, 4);
    d.paper(124, 492, 1190, 160, P.white);
    d.label('THEN   /   SAMPLE STABILITY', 158, 540);
    d.txt('Missing samples or disagreement > 0.25', 157, 611, 40, P.ink, 'Serif');
    d.result('Review', 1035, 599, false, { w: 220 });
  } else if (d.on(3, 'A missing estimate')) d.result('Shorten', 151, 548, true, { w: 230 });
  d.label('Set the cutoff on development data. Evaluate the policy on held-out requests.', 80, 722);
}
function ticketRows(d, review, answeredRows) {
  review.rows.forEach((row, i) => {
    const y = 217 + i * 98;
    d.punchStrip(70, y, 767, 80, P.white);
    d.txt(names[i], 128, y + 51, 32, P.ink, 'Serif');
    row.verdicts.forEach((v, k) => {
      const pass = v === 'supported',
        x = 481 + k * 77;
      d.dot(x, y + 40, 21, pass ? P.teal : P.red);
      d.txt(pass ? '✓' : '×', x, y + 50, 30, P.white, 'Sans', { align: 'center' });
    });
    if (i < answeredRows) {
      const col = row.served ? (row.unsafe ? P.red : P.teal) : P.dim;
      const word =
        row.route === 'abstain'
          ? 'Withhold'
          : row.route === 'shorten'
            ? 'Shorten'
            : row.unsafe
              ? 'Unsafe copy'
              : 'Send';
      d.line(840, y + 39, 908, y + 39, col, 3);
      d.txt(word, 936, y + 52, 36, col, 'Serif');
    }
  });
}
export function count(d) {
  d.stage('DISPATCH LOG   /   FOUR REQUESTS');
  const silent = d.on(4, 'If you withhold every answer'),
    gated = d.b >= 3;
  const review = silent ? silentReview : gated ? candidateReview : baselineReview;
  d.headline(
    silent ? 'Withhold every answer.' : gated ? 'Read the outgoing tray.' : 'Send every draft.',
  );
  d.label('REQUEST', 125, 191);
  d.label('ORIGINAL CLAIM CHECKS', 424, 191);
  d.label('READER', 936, 191);
  let answeredRows = d.b >= 2 || d.on(1, 'Send every draft') ? 4 : 0;
  if (d.b === 3)
    answeredRows = d.on(3, 'Withhold the wrong status')
      ? 4
      : d.on(3, 'Shorten the answer')
        ? 2
        : d.on(3, 'Send the clean answer')
          ? 1
          : 0;
  ticketRows(d, review, answeredRows);
  if (silent) {
    d.txt('Coverage   0 / 4', 74, 697, 39, P.ink, 'Serif');
    d.txt('Unsafe / served   undefined (0 served)', 698, 697, 37, P.dim, 'Serif');
  } else if (!gated && d.b === 2) {
    d.txt('Claim support   ' + support + ' / ' + total, 75, 695, 42, P.ink, 'Serif');
    d.txt(
      'Unsafe / served   ' + review.unsafe + ' / ' + review.served,
      762,
      695,
      42,
      P.red,
      'Serif',
    );
  } else if (gated && d.b === 4) {
    d.txt('Coverage   ' + review.served + ' / ' + cases.length, 75, 695, 42, P.ink, 'Serif');
    d.txt(
      'Unsafe / served   ' + review.unsafe + ' / ' + review.served,
      762,
      695,
      42,
      P.teal,
      'Serif',
    );
  } else if (gated) d.txt('How many readers received incident facts?', 73, 697, 40, P.ink, 'Serif');
}
export function releaseGate(d) {
  d.stage('RELEASE REVIEW   /   INCIDENT ANSWERER');
  if (d.b === 1) {
    d.headline('Compare the log with what arrived.');
    const silent = d.on(1, 'Withhold all four') && !d.on(1, 'This small grader');
    d.field('LOGGED ROUTE', silent ? 'abstain' : 'shorten', 79, 246, 474, { face: 'Mono' });
    d.printHead(635, 217, 698);
    d.paper(654, 243, 661, 295, P.white);
    d.label(silent ? 'READER’S COPY' : 'EXCERPT FROM READER’S COPY', 692, 294);
    stepText(d, silent ? 'Unable to provide a grounded update.' : eta.text, 692, 369, 584, {
      size: 42,
      face: 'Serif',
    });
    if (d.on(1, 'three are still unsafe')) {
      const test = silent ? silentReview : relabeledReview;
      d.txt(
        silent
          ? '0 of 4 substantive answers'
          : test.unsafe + ' unsafe / ' + test.served + ' served',
        79,
        613,
        52,
        P.red,
        'Serif',
      );
    }
    return;
  }
  if (d.b < 4) {
    d.headline(
      d.b === 2 ? 'Score the candidate’s payloads.' : 'Where did the four cases come from?',
    );
    d.label('DELIBERATELY SELECTED REGRESSIONS', 77, 222);
    candidateReview.rows.forEach((r, i) => {
      const y = 277 + 87 * i;
      d.line(78, y + 42, 775, y + 42, P.rule);
      d.txt(names[i], 80, y + 11, 35, P.ink, 'Serif');
      d.txt(
        r.route === 'abstain' ? 'withhold' : r.route,
        505,
        y + 11,
        30,
        r.served ? P.teal : P.dim,
        'Mono',
      );
    });
    d.punchStrip(817, 230, 518, 369);
    if (d.b === 2) {
      const clean = candidateReview.rows[0];
      [
        ['Clean cases kept', Number(clean.served && !clean.unsafe) + ' / 1'],
        ['Requests answered', candidateReview.served + ' / 4'],
        ['Unsafe / answered', candidateReview.unsafe + ' / ' + candidateReview.served],
      ].forEach(([name, v], i) => {
        d.label(name, 885, 282 + i * 105);
        d.txt(v, 885, 338 + i * 105, 45, P.teal, 'Mono');
      });
    } else {
      d.label('PRODUCTION REQUESTS', 883, 292);
      stepText(d, 'Sample the traffic readers actually send.', 883, 372, 401, {
        size: 43,
        face: 'Serif',
      });
    }
    return;
  }
  d.headline('Is the release record complete?');
  const gates = [
    ['Regression fixes + clean case', 'regressions'],
    ['Logged source versions', 'versions'],
    ['Representative holdout + audited grader', 'holdout'],
    ['Owner for monitoring alerts', 'owner'],
  ];
  d.paper(78, 188, 1285, 444, P.white);
  gates.forEach(([name, key], i) => {
    const y = 240 + i * 96;
    d.line(114, y + 52, 1317, y + 52, P.rule);
    d.txt(name, 128, y + 19, 35, P.ink, 'Serif');
    d.rect(953, y - 23, 295, 59, release[key] ? P.teal : P.sheet, 3);
    d.label(
      release[key] ? 'ON FILE' : 'MISSING',
      978,
      y + 15,
      release[key] ? P.white : P.ochre,
      23,
    );
  });
  if (d.b === 5) {
    d.result(released ? 'Release' : 'Hold release', 81, 706, released, { w: 300 });
    d.label('Four boolean results from trusted records', 431, 701);
  }
}
export function verificationPlan(d) {
  d.stage('VERIFICATION COPY   /   ONE QUESTION PER CLAIM', 'dark');
  d.txt('Which field supplies the estimate?', 74, 153, 60, P.white, 'Serif');
  const separation = d.cue(1, 'answers them separately', 0.95);
  const lx = lerp(111, 75, separation),
    rx = lerp(755, 731, separation);
  d.paper(lx, 239, 624, 303, '#ffdfc5');
  d.label('ORIGINAL DRAFT', lx + 33, 293, P.red);
  stepText(d, eta.text, lx + 33, 373, 548, { size: 46, color: P.red, face: 'Serif' });
  d.alpha(d.cue(1, 'ask which field'), () => {
    d.punchStrip(rx, 278, 626, 323);
    d.label('VERIFICATION QUESTION', rx + 60, 333);
    stepText(d, 'Does the admitted runbook give a recovery estimate?', rx + 60, 403, 520, {
      size: 38,
      face: 'Serif',
    });
  });
  if (d.on(2, 'has no estimate')) d.txt('v1   /   field absent', rx + 60, 554, 30, P.ochre, 'Mono');
  if (d.on(2, 'Revise the update') && d.b === 2)
    d.txt(
      'Revised: database failover completed May 26 at 08:14 UTC.',
      74,
      699,
      37,
      P.mint,
      'Serif',
    );
  if (d.b === 3) {
    d.txt(
      'No snapshot → inspect admission.   Guess in draft → inspect generation.',
      72,
      704,
      34,
      P.mint,
      'Serif',
      { w: 1300 },
    );
  }
}
const traces = [
  {
    id: 'req-missing',
    items: ['No snapshot', 'Citation in draft', 'Repeated answer'],
    failed: 0,
    diagnosis: 'Inspect feed response, caller permissions and provenance.',
  },
  {
    id: 'req-eta',
    items: ['INC-48291 / v1', 'ETA 14:30 in draft', 'Check skipped'],
    failed: 1,
    diagnosis: 'Retain the snapshot, claim verdict, route and exact payload.',
  },
  {
    id: 'req-vary',
    items: ['INC-48291 / v1', 'Selected claims pass', 'Disagreement 0.50'],
    failed: 2,
    diagnosis: 'Retain samples, prompt, model, temperature and policy versions.',
  },
];
export function replay(d) {
  d.stage('REQUEST REPLAY   /   EVIDENCE BEFORE INFERENCE', 'dark');
  if (d.b === 4) {
    d.txt('Compare two decisions with human review.', 74, 152, 58, P.white, 'Serif');
    [
      ['FALSE ACCEPT', '14:30 UTC', 'Reader saw an estimate absent from v1.'],
      ['FALSE REJECT', 'Failover finished', 'A reviewer accepts this paraphrase of completed.'],
    ].forEach(([k, v, why], i) => {
      const y = 216 + 211 * i;
      d.punchStrip(80, y, 1280, 173);
      d.label(k, 151, y + 44, P.red);
      d.txt(v, 149, y + 126, 46, P.ink, 'Serif');
      stepText(d, why, 707, y + 87, 592, { size: 32, face: 'Serif' });
    });
    d.label('Track coverage and usefulness alongside both error rates.', 80, 717, P.mint);
    return;
  }
  const tr = traces[d.b - 1],
    stage = ['Evidence admission', 'Claim generation', 'Generation stability'];
  const show = [
    d.on(1, 'Start at evidence admission'),
    d.on(2, 'claim generation failure'),
    d.on(3, 'Start with generation stability'),
  ][d.b - 1];
  d.txt(tr.id, 75, 154, 60, P.white, 'Mono');
  d.label('REQUEST TRACE', 75, 194, P.mint);
  d.line(151, 360, 1240, 360, P.steel, 6);
  tr.items.forEach((item, i) => {
    const x = 150 + i * 495,
      col = show && tr.failed === i ? P.rose : P.mint;
    d.dot(x, 360, 25, P.deep);
    d.dot(x, 360, 13, col);
    d.txt(stage[i], x - 65, 253, 31, P.white, 'Serif');
    d.txt(item, x - 65, 447, 31, col, 'Mono', { w: i === 2 ? 320 : 409 });
  });
  if (show) {
    d.cursor(150 + 495 * tr.failed, 328, P.gold);
    d.label('FIRST FAILED CHECK', 81, 577, P.gold);
    d.txt(tr.diagnosis, 80, 653, 39, P.white, 'Serif', { w: 1280 });
  }
}
export function nextEdition(d) {
  d.stage('', 'dark');
  const repair = d.after(4, 'Cite that version for the time', 0.8);
  const data = fresh(repair > 0);
  const [timeClaim, statusClaim] = data.claims;
  const admittedVersion = version(CURRENT_RECORD.version);
  d.label('INC-48291   /   NEXT EDITION', 76, 76, P.mint, 22);
  if (d.b === 5) {
    const trace = d.on(5, 'Open the trace');
    const [etaVerdict, statusVerdict] = data.verdicts.map(
      (value) => value[0].toUpperCase() + value.slice(1),
    );
    d.punchStrip(74, 175, 544, 456);
    d.label((trace ? 'CLAIM VERDICTS' : 'RUNBOOK') + '   /   ' + admittedVersion, 137, 230);
    d.field('Recovery estimate', trace ? etaVerdict : v2.recovery_eta, 137, 294, 437, {
      color: P.teal,
    });
    d.field('Recorded status', trace ? statusVerdict : v2.status, 137, 440, 437, { color: P.teal });
    d.printHead(649, 117, 711);
    d.paper(671, 143, 665, 525, P.white);
    d.label(trace ? 'TRACE   /   SENT PAYLOAD' : 'STATUS PAGE', 713, 210);
    d.txt('Embedding API', 712, 291, 61, P.ink, 'Serif');
    d.line(715, 319, 1291, 319, P.rule);
    const lines = data.text.match(/[^.]+\./g).map((s) => s.trim());
    d.alpha(d.after(5, 'Recorded recovery estimate, fifteen ten UTC', 0.35), () =>
      stepText(d, lines[0], 715, 392, 561, { size: 41, face: 'Serif' }),
    );
    d.alpha(d.after(5, 'Recorded status, mitigated', 0.35), () =>
      stepText(d, lines[1], 715, 528, 561, { size: 41, face: 'Serif' }),
    );
    d.label('INC-48291    ' + version(timeClaim.version), 715, 622, P.teal);
    return;
  }
  const aligned = d.cue(1, 'Line up its recorded estimate', 1.15);
  const withhold = d.after(3, 'Withhold this update') && data.route === 'abstain';
  const mismatch =
    d.after(3, 'the cited version differs from the admitted version') &&
    data.verdicts[0] === 'version_mismatch';
  const skipped = mismatch && d.after(3, 'The checker stops before comparing that value');
  const compare = d.after(4, 'Both typed values now match', 0.85);
  const left = 145;
  const valueX = 316;
  const versionX = 710;
  const statusX = 960;
  const runbookEdge = 321;
  const draftEdge = 474;
  const lookupY = 398;
  d.punchStrip(77, 151, 1289, runbookEdge - 151);
  d.label('ADMITTED RUNBOOK   /   RECOVERY ESTIMATE', left, 206);
  d.txt(v2.recovery_eta, left, 280, 65, P.teal, 'Mono');
  if (d.on(1, 'Version two also')) {
    d.label('VERSION', versionX, 206, P.dim, 24);
    d.txt(admittedVersion, versionX, 280, 58, P.teal, 'Mono');
  }
  if (d.on(1, 'status as mitigated')) {
    d.label('RECORDED STATUS', statusX, 206);
    d.txt(v2.status, statusX, 275, 47, P.teal, 'Serif');
  }
  d.paper(78, draftEdge, 1288, 214, '#ffdfc9');
  d.label('DRAFT   /   RECOVERY ESTIMATE', left, 520);
  d.txt(timeClaim.value, lerp(355, left, aligned), 599, 65, P.ink, 'Mono');
  if (d.on(2, 'Look at the citation')) d.label('CITED VERSION', versionX, 520, P.dim, 24);
  if (d.on(2, 'version one'))
    d.txt(
      version(timeClaim.version),
      versionX,
      599,
      58,
      mismatch ? P.red : repair === 1 ? P.teal : P.ink,
      'Mono',
    );
  if (d.on(2, 'The status claim cites')) {
    d.label('TYPED STATUS   /   ' + version(statusClaim.version), statusX, 520);
    d.txt(statusClaim.value, statusX, 587, 47, P.ink, 'Serif');
    if (d.on(2, 'fully recovered')) d.txt('Draft wording   “Fully recovered”', statusX, 647, 25);
  }

  const versionPin = versionX + 34;
  if (mismatch) {
    d.line(versionPin, draftEdge, versionPin, lookupY, P.rose, 5);
    d.txt('×', versionPin, lookupY - 8, 50, P.rose, 'Mono', { align: 'center' });
    d.txt('Version mismatch', versionPin + 33, lookupY, 39, P.rose, 'Serif');
    if (skipped) d.txt('Value unchecked', left, lookupY, 39, P.white, 'Serif');
  } else if (repair > 0) {
    d.line(versionPin, draftEdge, versionPin, lerp(draftEdge, runbookEdge, repair), P.mint, 5);
    if (repair === 1) d.txt('Version matches', versionPin + 33, lookupY, 39, P.mint, 'Serif');
    if (compare > 0) {
      const atValue = Math.min(1, compare * 1.5);
      const branch = Math.max(0, compare * 3 - 2);
      d.line(versionPin, lookupY, lerp(versionPin, valueX, atValue), lookupY, P.mint, 5);
      if (branch > 0) {
        d.line(valueX, lookupY, valueX, lerp(lookupY, runbookEdge, branch), P.mint, 5);
        d.line(valueX, lookupY, valueX, lerp(lookupY, draftEdge, branch), P.mint, 5);
      }
      if (compare === 1) d.txt('Value matches', valueX + 24, lookupY - 19, 39, P.mint, 'Serif');
    }
  }
  if (withhold) d.result('Withhold update', 1041, 115, false, { w: 310 });
  else if (compare === 1 && data.route === 'serve')
    d.txt('Which sentences can go into print?', 1350, 113, 32, P.mint, 'Serif', { align: 'right' });
}
