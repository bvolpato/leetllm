import {
  budget,
  check,
  chunks,
  claims,
  deadline,
  duplicate,
  evidence,
  grant,
  hashes,
  history,
  inputVerdict,
  inputs,
  lookups,
  manual,
  marker,
  metrics,
  newPolicy,
  oldPolicy,
  record,
  remote,
  requests,
  retained,
  routes,
  runbook,
  scans,
  sharedInputReadings,
  shifted,
  agreement,
  drafts,
  textRule,
  fareRecord,
} from './examples.mjs';
import {
  C,
  alpha,
  box,
  cue,
  dot,
  horizon,
  lerp,
  line,
  micro,
  monitor,
  page,
  paper,
  poly,
  reader,
  stamp,
  strip,
  tag,
  ticket,
  type,
} from './art.mjs';

const title = 'Checking an Action Before It Reaches the World';
const b = (c) => c.beat.beatIndex;
const count = (n) => n.toLocaleString('en-US');

function spokenProgress(clock, beat, from, through = from) {
  const current = b(clock);
  if (current !== beat) return Number(current > beat);
  const { start } = clock.wordCue(from);
  const { end } = clock.wordCue(through);
  return clock.reveal(from, end - start, { captionStart: false });
}

function booth(c, k) {
  const i = b(k),
    deploy = i >= 2,
    key = i === 4;
  page(c, 'Engineering booth', 'What reaches the pier?');
  horizon(c, 525, 125, 405, 306);
  reader(c, 536, 170, manual.liveBuild, 0.9);
  box(c, 525, 406, 405, 32, C.deep);
  micro(c, 'PIER 02   /   PRODUCTION FARE READER', 542, 428, C.paper);
  monitor(c, 30, 125, 478, 313, 'ENGINEERING ASSISTANT   /   PREVIEW');
  type(
    c,
    key
      ? 'May I see a production key?'
      : deploy
        ? 'Deploy build ' + manual.nextBuild + ' to production.'
        : 'Which command runs the unit tests?',
    54,
    208,
    23,
    C.white,
    'Serif',
  );
  if (!deploy) {
    micro(c, 'PROJECT GUIDE   /   payment-service', 54, 257, '#c4c8ae');
    type(c, 'Unit tests', 54, 292, 23, C.paper);
    type(c, manual.command, 248, 292, 23, C.gold, 'Mono');
    alpha(c, cue(k, 1, 'run make test', 0.35), () => {
      box(c, 53, 317, 428, 77, '#245753', 4);
      micro(c, 'ASSISTANT REPLY', 68, 340, C.mint);
      type(c, manual.command, 68, 372, 25, C.white, 'Mono');
    });
    strip(
      c,
      cue(k, 1, 'sends it to chat')
        ? 'Reviewed reply delivered to chat'
        : 'The engineer asked for a command.',
      'The live reader is running payment-service build 41.',
    );
  } else if (!key) {
    micro(c, 'HOST APPROVAL STORE', 54, 249, C.mint);
    box(c, 54, 268, 422, 63, '#173e44', 6);
    line(c, 73, 312, 457, 312, '#8ca59b', 1);
    type(c, 'No matching record', 72, 298, 22, C.paper);
    if (cue(k, 3, 'holds the deployment')) stamp(c, 'HELD', 55, 363, C.gold, 105);
    strip(
      c,
      cue(k, 3, 'holds the deployment') && routes[1].effect === 'approval-required'
        ? '0 deployments dispatched'
        : 'May this change reach production?',
      'Target  /  payment-service at the pier',
    );
  } else {
    micro(c, 'HOST CAPABILITIES', 54, 263, C.mint);
    type(c, 'Tests guide   ·   CI status', 54, 299, 23, C.white);
    type(c, 'Vault access', 54, 359, 22, C.white);
    tag(c, 'None', 264, 359, C.deep, C.gold);
    strip(
      c,
      cue(k, 4, 'Even if the request passed') && routes[2].generation === 'skipped'
        ? 'Input blocked   ·   0 model calls'
        : 'A third request enters the host.',
      cue(k, 4, 'The input filter')
        ? 'Supplied label   /   ' + requests[2].label.toUpperCase()
        : 'This message asks for a key.',
    );
  }
}

function input(c, k) {
  const i = b(k),
    missing = cue(k, 3, 'score is missing'),
    window = i === 4;
  page(
    c,
    'Input inspection',
    window ? 'How much of the note was checked?' : 'Which requests get past this check?',
  );
  if (window) {
    micro(c, 'ONE LONG SUPPORT NOTE', 45, 163);
    for (let j = 0; j < 12; j++) {
      const x = 45 + j * 73;
      box(c, x, 207, 62, 113, j < 8 ? C.blue : C.edge, 3);
      for (let d = 0; d < 4; d++)
        line(c, x + 9, 230 + d * 14, x + 49 - (d % 2) * 12, 230 + d * 14, j < 8 ? C.teal : C.grey, 2);
      type(c, String(j + 1), x + 31, 309, 15, C.ink, 'Mono', 500, 'center');
    }
    line(c, 45, 344, 618, 344, C.teal, 4);
    line(c, 629, 344, 911, 344, C.red, 4);
    type(c, 'Inspected window', 45, 386, 26, C.teal, 'Serif');
    type(c, 'Outside the window', 629, 386, 23, C.red, 'Serif');
    strip(
      c,
      'Coverage depends on the configured check.',
      'Language, modality and the available context all matter.',
    );
    return;
  }
  paper(c, 33, 127, 891, 303);
  micro(c, 'REQUEST', 54, 161);
  micro(c, 'FIXTURE LABEL', 352, 161);
  micro(c, 'SCORE', 553, 161);
  micro(c, 'INPUT GATE', 701, 161);
  const states = [cue(k, 1, 'They continue'), cue(k, 1, 'They continue'), cue(k, 1, 'It stops here')];
  requests.forEach((r, j) => {
    const y = 218 + 74 * j,
      invalid = missing && j === 2;
    line(c, 53, y - 35, 903, y - 35, C.edge);
    type(c, r.name, 54, y, 24, C.ink, 'Serif');
    type(c, r.label.toUpperCase(), 352, y, 20, C.ink, 'Mono');
    type(c, invalid ? 'Missing' : r.score.toFixed(2), 553, y, 20, invalid ? C.red : C.ink, 'Mono');
    const verdict = inputVerdict(invalid ? { ...r, score: undefined } : r, oldPolicy.threshold);
    type(
      c,
      states[j] ? verdict : '?',
      701,
      y,
      25,
      states[j] ? (verdict === 'Continue' ? C.teal : C.red) : C.grey,
      'Sans',
      600,
    );
  });
  let note = 'The fixture supplies each label and score.';
  if (i === 2 && cue(k, 2, 'Its personal-data stub')) {
    note = 'Supplied topic result for all three   /   ' + sharedInputReadings.topic;
    if (cue(k, 2, 'What else'))
      note += '       Personal-data stub   /   ' + sharedInputReadings.personalData;
  }
  if (missing) note = 'A missing required score holds this request before generation.';
  strip(c, 'Block when label = INJECTION and score ≥ ' + oldPolicy.threshold.toFixed(2), note);
}

function textCheck(c, k) {
  const i = b(k),
    held = cue(k, 1, 'holds a harmless definition'),
    miss = cue(k, 1, 'rule misses'),
    revised = cue(k, 2, 'Revise the answer', 0.45);
  page(
    c,
    'Fare office drafts',
    i === 2 ? 'What can the customer be told?' : 'Which draft does this phrase rule hold?',
  );
  if (i === 2) {
    ticket(c, 34, 140, 365, 266);
    micro(c, 'FARE RECORD', 56, 178);
    type(c, fareRecord.status, 56, 232, 29, C.ink, 'Serif');
    line(c, 55, 255, 373, 255, C.edge);
    micro(c, 'PAYMENT CONFIRMATION', 56, 299);
    type(c, fareRecord.paid === null ? 'None recorded' : 'Confirmed', 56, 343, 25, C.grey);
    monitor(c, 425, 140, 499, 266, 'ASSISTANT PREVIEW');
    type(c, revised ? 'We received your request.' : drafts[1].text, 447, 265, 25, C.white, 'Serif');
    if (revised) alpha(c, revised, () => stamp(c, 'SUPPORTED', 448, 323, C.mint, 177));
    strip(
      c,
      'The receipt establishes that the request arrived.',
      'The host must authorize any separate transfer of money.',
    );
    return;
  }
  tag(c, 'Match: “' + textRule + '”', 35, 155, C.ink, C.blue, 19);
  drafts.forEach((row, j) => {
    const y = 183 + j * 119;
    paper(c, 34, y, 890, 101);
    micro(c, j ? 'CUSTOMER REPLY' : 'GLOSSARY', 54, y + 30);
    type(c, row.text, 54, y + 74, 27, C.ink, 'Serif');
    if (j ? miss : held)
      stamp(c, row.held ? 'HELD' : 'PASSES RULE', 686, y + 31, row.held ? C.red : C.teal, 207);
  });
  strip(
    c,
    'Compare each match with the purpose of the rule.',
    'Policy requires evidence for claims that money has been refunded.',
  );
}

function proof(c, k) {
  const i = b(k);
  if (i < 2) {
    page(c, 'Draft review', 'Which claim do all three replies share?');
    claims.forEach((row, j) => {
      const x = 33 + j * 303;
      ticket(c, x, 147, 282, 244);
      micro(c, 'SAMPLE 0' + (j + 1), x + 21, 181);
      line(c, x + 20, 193, x + 262, 193, C.edge);
      row.forEach((s, n) => {
        const same = agreement.intersection.includes(s) && cue(k, 1, 'All three say two hours');
        if (same) box(c, x + 16, 207 + n * 55, 249, 44, C.blue, 2);
        type(c, s, x + 24, 238 + n * 55, 28, same ? C.teal : C.ink, 'Serif');
      });
    });
    strip(
      c,
      cue(k, 1, 'one third agreement')
        ? agreement.intersection.length +
            ' shared claim / ' +
            agreement.union.length +
            ' distinct claims = 1/3 agreement'
        : 'Compare the claims across the three slips.',
      'Window length, manager approval and rotation schedule',
    );
    return;
  }
  page(c, 'Evidence desk', 'Which claims does the runbook support?');
  paper(c, 33, 135, 383, 295, C.blue);
  micro(c, 'ENGINEERING   /   PERMITTED', 53, 166);
  type(c, 'Rollback runbook', 53, 213, 33, C.ink, 'Serif');
  micro(c, runbook.id + '   /   rev ' + runbook.version, 53, 245);
  line(c, 53, 262, 392, 262, '#8fa99b');
  type(c, 'Window: ' + runbook.window + ' minutes', 53, 302, 23);
  type(c, 'Manager approval required.', 53, 344, 22);
  if (i === 4) {
    micro(c, 'CONNECTOR ACCESS', 53, 382);
    type(c, runbook.canPublish ? 'Publish permitted' : 'Read only', 53, 411, 21, C.teal);
  }
  const reveals = [
    cue(k, 2, 'contradicts the passage'),
    cue(k, 3, 'Is approval alone enough'),
    cue(k, 3, 'What about a weekly rotation'),
    cue(k, 3, 'Both judgments depend'),
  ];
  const verdictColors = { Supported: C.teal, Contradicted: C.red, Neutral: C.ink };
  evidence.forEach(([s, v], j) => {
    const y = 165 + 67 * j;
    type(c, s, 451, y, 24, C.ink, 'Serif');
    type(
      c,
      reveals[j] ? v : 'Awaiting comparison',
      451,
      y + 24,
      17,
      reveals[j] ? verdictColors[v] : C.grey,
    );
    line(c, 451, y + 35, 924, y + 35, C.edge);
  });
  strip(
    c,
    i === 4
      ? 'Store the passage, version and access scope with the verdict.'
      : 'Check each claim against this version of the passage.',
    'An inference label is relative to the premise the reviewer received.',
  );
}

function badge(c, x, y, origin, id, fill) {
  box(c, x + 4, y + 5, 373, 134, '#c4baa5', 7);
  box(c, x, y, 373, 134, fill, 7);
  box(c, x + 145, y + 10, 83, 8, C.grey, 4);
  dot(c, x + 48, y + 67, 15, C.grey);
  poly(
    c,
    [
      [x + 18, y + 112],
      [x + 24, y + 93],
      [x + 41, y + 85],
      [x + 57, y + 85],
      [x + 73, y + 96],
      [x + 78, y + 112],
    ],
    C.grey,
  );
  micro(c, origin, x + 96, y + 58);
  type(c, id, x + 95, y + 101, 34, C.ink, 'Mono', 600);
}

function identity(c, k) {
  const i = b(k),
    seen = cue(k, 3, 'host denies this attempt');
  page(c, 'Tool admission', 'Whose approval is this?');
  micro(c, 'CHAT  /  REVIEWED REPLY', 34, 145);
  type(c, '“I can prepare the change.”', 34, 177, 23, C.teal, 'Serif');
  line(c, 32, 194, 928, 194, C.edge);
  if (i === 0) {
    monitor(c, 33, 215, 456, 209, 'PRIVATE TOOL PROPOSAL');
    type(c, 'deploy', 57, 302, 36, C.white, 'Mono');
    type(c, 'production/payment-service', 57, 352, 20, C.mint, 'Mono');
    horizon(c, 510, 215, 418, 209);
    reader(c, 523, 226, manual.liveBuild, 0.72);
    strip(c, 'A reviewed sentence can go to chat.', 'The proposal has a different destination.');
    return;
  }
  micro(c, 'PRODUCTION / payment-service   ·   rev42   ·   grant14   ·   action matches', 34, 225);
  const align = cue(k, 2, 'two identity badges', 0.55);
  badge(c, 44, 251, 'TRUSTED SESSION', grant.actor.id, C.blue);
  badge(c, 539, lerp(276, 251, align), 'APPROVAL RECORD', grant.approval.actor, '#eed4b1');
  type(c, seen ? '≠' : '?', 481, 332, 46, seen ? C.red : C.grey, 'Serif', 600, 'center');
  strip(
    c,
    seen
      ? 'Actor mismatch   ·   ' + grant.effects + ' deployments dispatched'
      : 'Compare the caller with the actor covered by grant 14.',
    i === 4 ? 'A required lookup timeout also leaves the executor idle.' : 'Live payment-service build 41',
  );
}

function retry(c, k) {
  const i = b(k),
    executed = cue(k, 1, 'executes it once'),
    replay = cue(k, 1, 'already executed'),
    changed = cue(k, 2, 'artifact to B'),
    denied = cue(k, 3, 'denies the changed action');
  page(
    c,
    'Deployment list',
    i === 5 ? 'What if the executor loses its reply?' : 'Does this retry add another deployment?',
  );
  if (i === 5) {
    paper(c, 32, 141, 896, 280);
    const xs = [84, 375, 692];
    for (let j = 0; j < 2; j++) line(c, xs[j] + 52, 253, xs[j + 1] - 12, 253, C.sea, 4);
    ['Reserve', 'Dispatch', 'Reconcile'].forEach((s, j) => {
      dot(c, xs[j] + 18, 253, 26, j === 2 ? C.gold : C.blue);
      type(c, j + 1, xs[j] + 18, 262, 23, C.ink, 'Mono', 600, 'center');
      type(c, s, xs[j] - 14, 196, 31, C.ink, 'Serif');
    });
    type(c, 'Durable, unique key', 56, 329, 20);
    type(c, 'Same key + payload', 348, 329, 20);
    type(c, 'Ask the executor', 666, 329, 20);
    strip(
      c,
      'Lost reply   ·   outcome unknown',
      'A durable reservation and executor-side idempotency protect different parts of a retry.',
    );
    return;
  }
  const reset = cue(k, 4, 'Put artifact A back'),
    newOp = cue(k, 4, 'Try operation forty three'),
    expired = cue(k, 4, 'at the grant’s expiry');
  const artifactB = changed && !reset;
  const op = newOp && !expired ? 43 : 42;
  let result = denied
    ? history[2]
    : replay && !changed
      ? history[1]
      : executed && !changed
        ? history[0]
        : null;
  if (reset) result = null;
  if (cue(k, 4, 'denies reuse') && !expired) result = history[3];
  if (cue(k, 4, 'exact retry is denied')) result = history[4];
  paper(c, 33, 139, 515, 285);
  micro(c, 'OPERATION ' + op + '   /   ENGINEER 7' + (expired ? '   /   EXPIRED' : ''), 56, 172);
  type(c, 'payment-service  /  prod', 55, 208, 27, C.ink, 'Serif');
  micro(c, 'ACTION HASH', 56, 255);
  type(c, 'Grant A', 57, 290, 20);
  type(c, hashes[0].slice(0, 12) + '…', 235, 290, 22, C.teal, 'Mono');
  type(c, 'Proposed ' + (artifactB ? 'B' : 'A'), 57, 329, 20);
  type(c, hashes[artifactB ? 1 : 0].slice(0, 12) + '…', 235, 329, 22, artifactB ? C.red : C.teal, 'Mono');
  if (result)
    stamp(
      c,
      result.result.replace('deny: ', 'Denied / '),
      56,
      365,
      denied ? C.red : C.teal,
      denied ? 445 : 230,
    );
  ticket(c, 575, 139, 348, 285);
  micro(c, 'COMPLETED DEPLOYMENTS', 596, 174);
  type(c, executed ? history[0].count : 0, 596, 263, 75, C.ink, 'Serif');
  line(c, 596, 278, 900, 278, C.edge);
  type(c, executed ? '42   ·   Artifact A' : 'List empty', 597, 326, 24, C.ink, 'Mono');
  if (executed) type(c, 'payment-service / prod', 597, 358, 20, C.grey);
  strip(
    c,
    denied
      ? 'The completed deployment stays in the list.'
      : changed
        ? 'Check the grant before consulting the replay record.'
        : 'The approval binds the actor, target and artifact.',
    i === 4
      ? 'Approval consumed by operation 42. Check expiry at each attempt.'
      : 'The host issued operation 42. The release manager approved artifact A.',
  );
}

function policy(c, k) {
  const score = cue(k, 1, 'score is point nine one'),
    bad = cue(k, 1, 'two entries'),
    rejected = cue(k, 2, 'Reject the ambiguous file'),
    switched = cue(k, 3, 'valid revision eight'),
    arrival = cue(k, 3, 'second request'),
    first = cue(k, 4, 'request one blocks'),
    second = cue(k, 4, 'Request two continues');
  page(c, 'Policy snapshots', 'Which threshold travels with the request?');
  const active = switched ? newPolicy : retained;
  micro(c, 'ACTIVE POLICY', 33, 152);
  type(
    c,
    'Rev ' + active.revision + '   /   ' + active.threshold.toFixed(2),
    33,
    188,
    25,
    C.teal,
    'Mono',
    600,
  );
  if (bad && !switched) {
    micro(c, 'CANDIDATE', 375, 150);
    type(
      c,
      duplicate.map(([name, value]) => name + ' ' + value.toFixed(2)).join('  /  '),
      375,
      185,
      20,
      C.ink,
      'Mono',
    );
    if (rejected) tag(c, 'Rejected', 827, 183, C.red, C.blush);
  } else {
    micro(c, 'MODEL CHECKPOINT', 710, 151);
    type(c, 'assistant-v4', 710, 185, 21);
  }
  function gauge(y, n, p, show, decided) {
    box(c, 32, y, 896, 96, C.white, 4);
    type(c, 'R' + n, 51, y + 47, 32, C.ink, 'Serif');
    micro(c, 'REV ' + p.revision, 111, y + 34);
    micro(c, 'INJECTION', 111, y + 67);
    const x = 275,
      w = 421,
      mark = x + w * requests[2].score,
      limit = x + w * p.threshold;
    line(c, x, y + 53, x + w, y + 53, '#b8b8a4', 5);
    line(c, limit, y + 46, limit, y + 69, C.red, 3);
    type(c, p.threshold.toFixed(2) + ' trigger', limit - 3, y + 87, 16, C.red, 'Mono', 400, 'right');
    if (show) {
      dot(c, mark, y + 53, 6, C.teal);
      type(c, '0.91', mark, y + 33, 20, C.teal, 'Mono', 600, 'center');
    }
    type(
      c,
      decided ? inputVerdict(requests[2], p.threshold) : 'Pending',
      752,
      y + 58,
      25,
      decided ? (n === 1 ? C.red : C.teal) : C.grey,
      'Sans',
      600,
    );
  }
  gauge(210, 1, oldPolicy, score, first);
  if (arrival) gauge(324, 2, newPolicy, true, second);
  else {
    line(c, 32, 351, 928, 351, C.edge);
    micro(c, 'NEXT ARRIVAL', 52, 396);
  }
  strip(
    c,
    second
      ? 'Two snapshots give two input decisions.'
      : arrival
        ? 'The new request captures revision 8.'
        : 'One request keeps its captured rules.',
    second
      ? 'Unknown privileged signal: route to approval. Recheck live authority at dispatch.'
      : 'A matching label blocks at or above its own revision’s trigger.',
  );
}

function privacy(c, k) {
  const i = b(k),
    masked = cue(k, 1, 'replaces the email and phone'),
    sent = cue(k, 2, 'Send the approved copy', 1.1);
  page(c, 'Support records', 'What can the remote reviewer receive?');
  function fields(x, y, data, allowName) {
    const rows = Object.entries(data);
    rows.forEach(([field, value], j) => {
      micro(c, field.toUpperCase(), x, y + j * 38);
      type(
        c,
        value,
        x + 83,
        y + j * 38,
        field === 'phone' || field === 'email' ? 17 : 19,
        allowName ? C.ink : C.teal,
        field === 'phone' || field === 'email' ? 'Mono' : 'Sans',
      );
    });
  }
  ticket(c, 31, 134, 394, 299);
  micro(c, 'RESTRICTED HOST ORIGINAL', 50, 166);
  line(c, 51, 181, 405, 181, C.edge);
  fields(50, 215, record, true);
  if (!masked) {
    ticket(c, 502, 134, 421, 299, C.blue);
    micro(c, 'REVIEW SERVICE AGREEMENT', 522, 167);
    type(c, 'Allowed fields', 522, 219, 29, C.ink, 'Serif');
    ['Incident and follow-up task', 'Email label', 'Phone label'].forEach((s, j) =>
      type(c, s, 522, 270 + 42 * j, 22),
    );
  } else if (i === 1 || sent === 1) {
    const x = 508;
    if (sent === 1) line(c, 469, 135, 469, 431, C.teal, 3);
    ticket(c, x, 134, 410, 299, sent === 1 ? C.white : C.blue);
    micro(c, sent === 1 ? 'REMOTE RECEIPT' : 'LOCAL EXPORT PREVIEW', x + 19, 166);
    line(c, x + 18, 181, x + 385, 181, C.edge);
    fields(x + 19, 217, remote, false);
    if (sent === 1) stamp(c, Object.keys(remote).length + ' FIELDS RECEIVED', x + 19, 371, C.teal, 237);
  } else {
    line(c, 469, 135, 469, 431, C.teal, 3);
    micro(c, 'REMOTE REVIEWER', 515, 174);
    type(c, 'Awaiting the copy', 515, 219, 27, C.grey, 'Serif');
    const x = lerp(145, 613, sent),
      y = 273;
    box(c, x - 2, y - 2, 234, 104, C.deep, 3);
    box(c, x, y, 230, 100, C.blue, 2);
    line(c, x, y, x + 115, y + 49, C.teal, 2);
    line(c, x + 115, y + 49, x + 230, y, C.teal, 2);
    type(c, remote.issue + '  /  4 fields', x + 112, y + 81, 17, C.deep, 'Mono', 600, 'center');
  }
  strip(
    c,
    sent === 1
      ? 'One minimized copy delivered.'
      : i === 2
        ? 'Transferring the approved copy.'
        : masked
          ? 'The host prepares the allowed fields.'
          : 'Raw contacts stay inside the host.',
    i === 3
      ? 'Review unsupported formats and residual identifiers before widening access.'
      : 'The service agreement permits issue, task and contact labels.',
  );
}

function schedule(c, k) {
  const i = b(k);
  page(
    c,
    'Response timing',
    i === 0 ? 'Where did the three seconds go?' : 'When can the remote check start?',
  );
  if (i === 0) {
    const stages = budget.stages.filter((s) => s.required),
      x = 47,
      w = 862;
    micro(c, 'ONE CONSTRUCTED RESPONSE   /   MILLISECONDS', x, 154);
    let t = 0;
    stages.forEach((stage, j) => {
      const col = [C.red, C.sea, '#947343', C.grey][j],
        sw = (w * stage.ms) / budget.responseTotal;
      box(c, x + (w * t) / budget.responseTotal, 188, sw - 1, 68, col);
      t += stage.ms;
      const xx = 46 + j * 229;
      box(c, xx, 298, 7, 58, col);
      type(c, stage.name, xx + 16, 317, 19);
      type(c, count(stage.ms) + ' ms', xx + 16, 350, 21, C.ink, 'Mono');
    });
    type(c, '0', x, 280, 17, C.grey, 'Mono');
    type(c, count(budget.responseTotal) + ' ms', x + w, 280, 18, C.ink, 'Mono', 500, 'right');
    strip(
      c,
      'Measure the path the user takes.',
      'Include queueing and transport when measuring end-to-end latency.',
    );
    return;
  }
  const start = spokenProgress(k, 2, 'Start the clock', 'At eight milliseconds the copy is ready');
  const finishLocal = spokenProgress(
    k,
    2,
    'Let both lanes run',
    'At twelve the independent local check finishes',
  );
  const finishRemote = spokenProgress(
    k,
    2,
    'Follow the remaining branch',
    'At eighteen the remote review finishes',
  );
  const serial = spokenProgress(k, 2, 'sum of all three durations') === 1;
  const t =
    inputs.redaction * start +
    (inputs.injection - inputs.redaction) * finishLocal +
    (inputs.end - inputs.injection) * finishRemote;
  const x = 260,
    w = 646,
    scale = w / 20;
  const lanes = [
    { y: 196, name: 'Local injection', dur: inputs.injection, at: 0, color: C.sea },
    { y: 259, name: 'Local redaction', dur: inputs.redaction, at: 0, color: C.sea },
    { y: 322, name: 'Remote review', dur: inputs.remoteDuration, at: inputs.redaction, color: C.red },
  ];
  micro(c, 'REQUIRED INPUT CHECKS', 35, 147);
  micro(c, 'TIME FROM ARRIVAL  /  ms', x, 147);
  for (const q of lanes) {
    type(c, q.name, 34, q.y + 15, 23, C.ink, 'Serif');
    micro(c, q.dur + ' ms', 34, q.y + 37);
    line(c, x, q.y + 14, x + w, q.y + 14, '#bfbfaa', 1);
    const len = Math.max(0, Math.min(q.dur, t - q.at)) * scale;
    if (len > 0) box(c, x + q.at * scale, q.y, len, 32, q.color, 2);
  }
  [0, 4, 8, 12, 16, 20].forEach((n) => {
    line(c, x + n * scale, 361, x + n * scale, 369, C.grey);
    micro(c, String(n), x + n * scale, 392, C.grey, 'center');
  });
  if (t > 0) {
    const cursor = x + t * scale;
    line(c, cursor, 169, cursor, 355, C.ink, 1.4);
    if (t === inputs.redaction || t === inputs.injection || t === inputs.end)
      type(c, t + ' ms', cursor, 161, 17, C.ink, 'Mono', 600, 'center');
  }
  if (start === 1) {
    const handoff = x + inputs.redaction * scale;
    line(c, handoff, 291, handoff, 317, C.teal, 2);
    poly(c, [[handoff - 5, 315], [handoff + 5, 315], [handoff, 322]], C.teal);
  }
  const parallel = `max(${inputs.injection}, ${inputs.redaction} + ${inputs.remoteDuration}) = ${inputs.end} ms`;
  const serialTotal = inputs.injection + inputs.remoteFinish;
  strip(
    c,
    finishRemote === 1
      ? parallel
      : start === 1
        ? 'Redaction finished at ' + inputs.redaction + ' ms. The remote branch can run.'
        : 'The remote call needs the sanitized copy.',
    i === 3
      ? 'Only work declared optional may move to a later audit.'
      : serial
        ? 'One check at a time would take ' + serialTotal + ' ms.'
        : 'The independent local check can run alongside redaction.',
  );
}

function stream(c, k) {
  const joined = cue(k, 1, 'Join them inside the buffer', 0.8),
    separate = cue(k, 1, 'Neither chunk contains'),
    carry = cue(k, 1, 'last three characters');
  page(c, 'Private reply buffer', 'Where does the marker appear?');
  micro(c, 'SEARCH TARGET', 40, 157);
  type(c, marker, 40, 202, 34, C.ink, 'Mono', 600);
  micro(c, 'GENERATED CHUNKS   /   PRIVATE', 274, 157);
  const width = 92,
    x = 277;
  chunks.forEach((chunk, j) => {
    const left = x + j * (width * 2 + lerp(89, 0, joined));
    for (let n = 0; n < chunk.length; n++) {
      const xx = left + n * width;
      box(c, xx, 202, width - 3, 99, joined === 1 && scans[1].found ? C.blue : C.white, 3);
      type(c, chunk[n], xx + width / 2, 273, 53, C.ink, 'Mono', 600, 'center');
    }
    if (joined === 0) {
      micro(c, 'CHUNK ' + (j + 1), left, 334);
      if (separate) type(c, chunk.includes(marker) ? 'Match' : 'No match', left, 373, 22, C.red);
    }
  });
  if (joined === 1) {
    line(c, x, 315, x + width * 4 - 3, 315, C.teal, 4);
    type(c, 'Joined match', x, 350, 24, C.teal, 'Serif');
    if (carry) {
      type(c, 'Worst split', 37, 396, 21);
      type(c, marker.slice(0, -1) + '  |  ' + marker.slice(-1), x, 399, 26, C.ink, 'Mono');
      micro(c, 'CARRY ' + (marker.length - 1), x, 426);
    }
  }
  strip(
    c,
    b(k) === 2 ? 'Required review keeps the whole draft private.' : 'What has reached chat?  0 characters',
    carry
      ? 'For a length-L exact marker, up to L − 1 previous characters can be needed.'
      : 'The two chunks arrive in order inside the private reply buffer.',
  );
}

function timeout(c, k) {
  const i = b(k);
  const input = spokenProgress(k, 0, 'input check takes twenty-five');
  const generation = spokenProgress(k, 0, 'generation takes eighty');
  const draftReady = spokenProgress(k, 0, 'A private draft exists at one hundred five') === 1;
  const reviewNeeded = spokenProgress(k, 0, 'Review needs thirty more') === 1;
  const review = spokenProgress(k, 1, 'At the deadline only fifteen milliseconds of review fit');
  const draftHeld = spokenProgress(k, 1, 'The draft stays private') === 1;
  const fallbackSent = spokenProgress(k, 1, 'The host returns its bounded timeout message') === 1;
  const reviewFits = Math.min(deadline.review, deadline.limit - deadline.draft);
  const reviewColor = '#937140';

  page(c, 'Shared deadline', 'Can this draft reach the caller in time?');
  const x = 54,
    w = 852,
    y = 222,
    h = 55;
  const at = (ms) => x + (w * ms) / 150;
  micro(c, 'TIME FROM ARRIVAL  /  MILLISECONDS', x, 161);
  line(c, x, y + h, x + w, y + h, C.edge, 2);

  const spans = [
    ['Input', 0, deadline.input, C.sea, input],
    ['Generation', deadline.input, deadline.draft, C.frame, generation],
    ['Review', deadline.draft, deadline.draft + reviewFits, reviewColor, review],
  ];
  for (const [label, start, end, color, progress] of spans) {
    if (progress === 0) continue;
    box(c, at(start), y, (at(end) - at(start)) * progress, h, color);
    type(c, label, at(start) + 8, y - 12, 19, C.ink, 'Sans', 600);
  }
  if (review === 1 && deadline.earliest > deadline.limit) {
    const start = at(deadline.limit),
      end = at(deadline.earliest);
    box(c, start, y, end - start, h, C.edge);
    for (let xx = start + 5; xx + 9 < end; xx += 12)
      line(c, xx, y + 40, xx + 9, y + 27, C.grey, 1.5);
  }

  const limit = at(deadline.limit);
  line(c, limit, 177, limit, 194, C.red, 3);
  line(c, limit, y - 1, limit, 287, C.red, 3);
  type(c, deadline.limit + ' ms deadline', limit, 167, 21, C.red, 'Mono', 600, 'center');
  const ticks = [0];
  if (input === 1) ticks.push(deadline.input);
  if (generation === 1) ticks.push(deadline.draft);
  if (review === 1) ticks.push(deadline.earliest);
  for (const tick of ticks) {
    line(c, at(tick), y + h, at(tick), 287, C.grey);
    type(c, tick, at(tick), 311, 19, C.ink, 'Mono', 500, 'center');
  }
  if (review === 1)
    type(c, 'Earliest finish', at(deadline.earliest), 332, 16, C.grey, 'Sans', 500, 'center');

  const draftStatus = draftHeld
    ? 'Held · stays private'
    : draftReady ? 'Ready · private' : 'Awaiting draft';
  const reviewStatus =
    review === 1
      ? reviewFits + ' of ' + deadline.review + ' ms fit'
      : reviewNeeded ? deadline.review + ' ms needed' : 'Pending';
  const cards = [
    ['HOST DRAFT', draftStatus, draftHeld ? C.red : C.frame],
    ['REQUIRED REVIEW', reviewStatus, reviewColor],
    ['CALLER', fallbackSent ? 'Timeout message' : 'Awaiting reply', fallbackSent ? C.red : C.grey],
  ];
  cards.forEach(([label, status, color], j) => {
    const left = x + j * 288;
    box(c, left, 344, 276, 84, C.white, 3);
    box(c, left, 344, 5, 84, color);
    micro(c, label, left + 19, 372);
    type(c, status, left + 19, 405, 24, color, 'Sans', 600);
  });
  strip(
    c,
    fallbackSent
      ? 'The caller receives the timeout message.'
      : draftHeld
        ? 'The unreviewed draft stays on the host.'
        : review === 1
          ? 'The deadline arrives before review can finish.'
          : 'One deadline covers all three stages.',
    i === 2
      ? 'Canceling the wait cannot establish the outcome of remote work.'
      : 'Review starts after the model produces a draft.',
  );
}

function grid(c, x, y, filled, fill, base) {
  for (let a = 0; a < 100; a++) {
    const xx = x + (a % 10) * 14.5,
      yy = y + Math.floor(a / 10) * 13;
    box(c, xx, yy, 12, 10, a < filled ? fill : base, 1);
  }
}
function errors(c, k) {
  const i = b(k),
    queue = i >= 2,
    shift = cue(k, 4, 'one hundred thousand'),
    computed = cue(k, 3, 'forty seven point four percent');
  const fp = shift ? shifted.falsePositive : metrics.falsePositive,
    tp = shift ? shifted.truePositive : metrics.truePositive,
    total = fp + tp;
  page(
    c,
    'Labeled traffic',
    queue ? 'Who is in the blocked queue?' : 'Which requests belong in the denominator?',
  );
  if (!queue) {
    [
      [metrics.safe, metrics.falsePositive, 100, 'Safe', C.sea],
      [metrics.harmful, metrics.truePositive, 1, 'Harmful', C.red],
    ].forEach(([n, blocks, per, name, col], j) => {
      const x = 34 + j * 455;
      type(c, count(n) + ' ' + name.toLowerCase(), x, 165, 30, C.ink, 'Serif');
      grid(c, x, 192, blocks / per, col, '#d7d8c2');
      micro(c, '1 square = ' + per, x, 347);
      const right = x + 166;
      type(c, count(blocks), right, 239, 36, col, 'Mono', 600);
      type(c, 'blocked', right, 263, 19);
      type(c, count(n - blocks) + ' allowed', right, 306, 19);
      if (cue(k, 1, j ? 'false negative rate is ten' : 'false positive rate is one')) {
        const numerator = j ? n - blocks : blocks,
          rate = j ? metrics.fnr : metrics.fpr;
        type(c, numerator + ' / ' + count(n) + ' = ' + rate * 100 + '%', x, 409, 23, C.ink, 'Mono', 600);
      }
    });
    strip(
      c,
      'Count mistakes within the ground-truth class.',
      'Shaded squares show blocked requests. Each grid uses its labeled unit.',
    );
    return;
  }
  micro(c, 'GROUND TRUTH IN THIS MIX', 35, 151);
  type(
    c,
    count(shift ? shifted.safe : metrics.safe) +
      ' safe   /   ' +
      count(shift ? shifted.harmful : metrics.harmful) +
      ' harmful',
    35,
    188,
    26,
    C.ink,
    'Serif',
  );
  const left = 42,
    w = 869,
    cut = (w * fp) / total;
  box(c, left, 241, cut, 74, C.sea, 2);
  box(c, left + cut, 241, w - cut, 74, C.red, 2);
  type(c, count(fp), left + cut / 2, 289, 28, C.white, 'Mono', 600, 'center');
  type(c, count(tp), left + cut + (w - cut) / 2, 289, 25, C.white, 'Mono', 600, 'center');
  type(c, 'Safe blocks', left, 349, 20, C.teal, 'Sans', 600);
  type(c, 'Harmful blocks', left + w, 349, 20, C.red, 'Sans', 600, 'right');
  const ratio = cue(k, 4, 'eleven point one');
  if (shift && ratio)
    type(
      c,
      fp + ' / ' + tp + ' = ' + shifted.falsePerTrue.toFixed(1) + ' false alarms per true detection',
      left,
      406,
      24,
      C.ink,
      'Serif',
    );
  else if (computed && !shift)
    type(
      c,
      tp + ' / ' + total + ' = ' + (100 * metrics.blockedPrecision).toFixed(1) + '% harmful among blocks',
      left,
      406,
      25,
      C.ink,
      'Serif',
    );
  else type(c, count(total) + ' blocked requests', left, 406, 23, C.ink, 'Serif');
  strip(
    c,
    shift ? 'Same class error rates   ·   different traffic mix' : 'Pick one request from this queue.',
    'Count requests. Appeals alone cannot supply the labeled population denominators.',
  );
}

function closing(c, k) {
  const i = b(k),
    baseline = cue(k, 0, 'review passes'),
    second = i >= 1,
    expired = cue(k, 2, 'check times out'),
    send = cue(k, 2, 'host sends'),
    denial = cue(k, 2, 'denies the forbidden export'),
    receipt = cue(k, 3, 'Read the receipt', 0.65),
    fresh = cue(k, 4, 'retry the benign lookup'),
    recovered = cue(k, 4, 'It passes');
  const pass = lookups[0],
    fail = lookups[1],
    again = lookups[2];
  page(
    c,
    'Support counter',
    receipt ? 'What does the timeout receipt explain?' : 'Which message reaches the caller?',
  );
  monitor(c, 31, 132, 493, 298, 'SUPPORT CHAT   /   DELIVERY STATUS');
  function message(y, ref, s, col) {
    micro(c, ref, 52, y, C.mint);
    type(c, s, 52, y + 29, 21, col, 'Serif');
    line(c, 52, y + 44, 499, y + 44, '#54776f');
  }
  message(210, 'LOOKUP 1', baseline ? pass.message : 'Awaiting review', baseline ? C.white : C.gold);
  if (second)
    message(
      281,
      'LOOKUP 2',
      send ? fail.message : expired ? 'Draft held' : 'Awaiting review',
      send ? C.white : C.gold,
    );
  if (fresh)
    message(
      352,
      'FRESH LOOKUP',
      recovered ? again.message : 'Awaiting review',
      recovered ? C.white : C.gold,
    );
  if (!receipt) {
    horizon(c, 546, 132, 381, 298);
    reader(c, 551, 169, manual.liveBuild, 0.84);
    box(c, 546, 389, 381, 41, C.deep);
    micro(c, 'DISPATCHED EFFECTS   ' + (denial ? fail.effects : 0), 562, 415, C.paper);
    if (second) {
      box(c, 546, 132, 381, 57, C.blue);
      micro(c, 'PRIVATE DRAFT', 560, 153);
      type(c, fail.privateDraft, 560, 178, 20, C.ink, 'Serif');
      const needed = spokenProgress(k, 1, 'Review needs seventy milliseconds');
      const time = (ms) => 696 + (202 * ms) / fail.reviewMs;
      const limit = time(fail.limit);
      box(c, 682, 242, 234, 138, C.deep, 5);
      micro(c, 'REVIEW · SAME DRAFT', 696, 266, C.mint);
      type(c, '1 · ' + pass.reviewMs + ' ms', 696, 289, 17, C.white, 'Mono');
      line(c, 696, 302, time(pass.reviewMs), 302, C.mint, 5);
      line(c, limit, 293, limit, 310, C.gold, 2);
      line(c, limit, 334, limit, 351, C.gold, 2);
      type(c, fail.limit + (expired ? ' ms · timeout' : ' ms limit'), 900, 368, 16, C.gold, 'Mono', 600, 'right');
      if (needed > 0) {
        type(c, '2 · needs ' + fail.reviewMs + ' ms', 696, 328, 17, C.white, 'Mono');
        line(c, 696, 343, time(fail.reviewMs * needed), 343, '#8ca59b', 3);
      }
      if (expired)
        line(c, 696, 343, time(fail.receipt.elapsed), 343, C.gold, 5);
    }
  } else {
    c.save();
    c.translate(0, lerp(10, 0, receipt));
    ticket(c, 548, 132, 378, 300);
    const e = fail.receipt;
    micro(c, 'DECISION RECEIPT  /  LOOKUP 2', 569, 160);
    type(c, e.trace, 568, 204, 38, C.ink, 'Mono', 600);
    line(c, 568, 219, 907, 219, C.edge);
    const rows = [
      ['POLICY', 'rev ' + e.policy],
      ['DETECTOR', e.detector],
      ['CHECK', e.outcome + '  ·  ' + e.elapsed + ' ms'],
      ['DELIVERY', e.delivery],
      ['ACTION', e.action],
    ];
    rows.forEach(([label, value], n) => {
      const y = 249 + n * 37;
      if (i === 5 && label === 'ACTION') box(c, 562, y - 23, 347, 32, C.blush, 2);
      micro(c, label, 569, y);
      type(c, value, 671, y, 20, label === 'ACTION' ? C.red : C.ink);
    });
    c.restore();
  }
  strip(
    c,
    denial
      ? 'Restricted export denied   ·   ' + fail.effects + ' effects'
      : second
        ? 'Forbidden export proposed   ·   executor idle'
        : 'Required output review   ·   ' + (baseline ? 'pass in 18 ms' : 'pending'),
    fresh
      ? 'Lookup 2 keeps its timeout receipt. The live fare reader remains on build 41.'
      : second
        ? 'Second lookup: a model-written approval ID cannot authorize a forbidden export.'
        : 'The host releases only a reviewed reply.',
  );
}

const scenes = {
  'c01': booth,
  'c02': input,
  'c02-text': textCheck,
  'c02-proof': proof,
  'c03': identity,
  'c03-retry': retry,
  'c04': policy,
  'c05': privacy,
  'c06': schedule,
  'c06-stream': stream,
  'c06-time': timeout,
  'c07': errors,
  'c08': closing,
};
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  scenes[clock.beat.chapterId](ctx, clock);
  ctx.restore();
}
export default { title, draw, check };
