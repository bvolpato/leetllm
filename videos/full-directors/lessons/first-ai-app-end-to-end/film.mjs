import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';

import { createHmac } from 'node:crypto';
import evidence from './observations.json' with { type: 'json' };
import {
  checkPolicy,
  policyCandidate,
  trustedDecision,
  validateRequest,
} from '../../../films/first-ai-app-end-to-end/model.mjs';
import {
  C,
  box,
  line,
  circle,
  poly,
  txt,
  mono,
  serif,
  label,
  enamel,
  key,
  form,
  fileRow,
  shortId,
  human,
  stamp,
  packet,
  wire,
  stage,
  mix,
  cue,
} from './drawing.mjs';

const {
  request,
  main,
  cases,
  insert,
  update,
  negative,
  trials,
  invalid,
  extra,
  timeout,
  adapter,
  health,
} = evidence;
const saved = main[0].rows[0],
  during = main[0].observed[0][0];
const facts = saved.facts_json,
  eligible = policyCandidate(facts);
const blankReport = ' '.repeat(20);
const expectedDecisions = ['eligible', 'not_eligible', 'not_eligible', 'eligible', 'needs_review'];
const validatedRequest = {
  account_id: request.account_id,
  item: 'service-account-key',
  credential_report: request.credential_report,
};
const read = (run) => run.rows.at(-1);
const field = (c, x, y, name, value, color = C.light) => {
  label(c, name, x, y, C.muted, 23);
  mono(c, value, x, y + 50, 34, color);
};

function opening(c, t) {
  const sent = cue(t, 0, 'clicks Check policy'),
    reload = cue(t, 1, 'hits reload');
  const pending = sent > 0.4 && reload < 0.4;
  stage(c, 'Is this key due for rotation?');
  enamel(c, 98, 254, 603, 619);
  // The opening keeps the service key on its hook while only the page reloads.
  circle(c, 282, 389, 22, '#b69d5c', C.ink, 4);
  c.save();
  c.strokeStyle = '#c9c9a1';
  c.lineWidth = 9;
  c.beginPath();
  c.ellipse(319, 433, 34, 71, -0.58, 0, 2 * Math.PI);
  c.stroke();
  c.restore();
  key(c, 337, 493, 1.38, 0.59);
  label(c, 'SERVICE ACCOUNT', 158, 742, C.muted, 24);
  mono(c, request.account_id, 158, 802, 42, C.light);
  const behind = cue(t, 2, 'follow the report', 1.1);
  if (behind > 0) {
    enamel(c, 768, 247, 1047, 635);
    label(c, 'Find the first attempt in the server file', 824, 793, C.muted, 27);
    mono(c, 'rotation_tasks.sqlite3', 824, 844, 45, C.light);
  }
  c.save();
  c.translate(768 + 113 * behind, 241);
  c.scale(1 - 0.22 * behind, 1 - 0.22 * behind);
  form(c, 0, 0, 1047, 648, {
    status: pending ? 'Checking policy P-7…' : 'Ready',
    pending,
    showKey: false,
    click: sent > 0 && sent < 0.95,
    reload: reload > 0.04 && t.beat.beatIndex === 1,
  });
  c.restore();
  if (t.beat.beatIndex === 1 && cue(t, 1, 'Did the server finish') > 0.03)
    serif(c, 'Did the first check finish?', 1280, 969, 48, C.ink, 'center');
}

function assemble(c, t) {
  const b = t.beat.beatIndex;
  const launch = cue(t, 0, 'Run the command'),
    open = cue(t, 0, 'open the loopback address');
  const fact = cue(t, 1, 'looks up invented'),
    start = cue(t, 1, 'commits an attempt'),
    call = cue(t, 1, 'asks the fixture'),
    finish = cue(t, 1, 'checks and saves');
  stage(c, 'Where the click goes', true);
  box(c, 100, 293, 670, 551, C.paper, 16, C.ink, 3);
  label(c, 'On Luna’s machine', 140, 351);
  if (b === 3) {
    mono(c, 'POST /rotation/decide', 140, 437, 38, C.ok);
    label(c, 'Request body in the browser', 140, 521);
    line(c, 141, 555, 720, 555, C.rim, 2);
    mono(c, request.account_id, 140, 636, 37);
    txt(c, request.credential_report, 140, 713, 37);
  } else {
    mono(c, 'index.html', 140, 437, 42);
    mono(c, 'rotation_app.py', 140, 500, 42);
    line(c, 141, 535, 720, 535, C.rim, 2);
    mono(c, '$ uv run rotation_app.py', 140, 611, 35, launch > 0 ? C.ink : C.dim);
    if (open > 0) {
      mono(c, '127.0.0.1:8000', 140, 683, 38, C.ok);
      txt(c, 'Check policy', 140, 783, 37);
    }
  }
  const flow = cue(t, 0, 'sends an account');
  wire(c, 770, 600, 906, { progress: flow, color: C.muted });
  enamel(c, 906, 236, 907, 670);
  serif(c, 'FastAPI', 967, 335, 62, C.light);
  mono(c, 'POST /rotation/decide', 967, 390, 35, C.mint);
  const blocks = [
    ['Account lookup', fact ? '45 days  ·  stale' : 'FACTS'],
    ['SQLite insert', start ? 'running  ·  v1' : 'tasks'],
    ['Provider', call ? 'fixture@1' : 'FixtureProvider'],
    ['Check + update', finish ? 'completed  ·  v2' : 'verify_p7'],
  ];
  blocks.forEach(([name, value], i) => {
    const y = 461 + 88 * i,
      active = [fact, start, call, finish][i] > 0.05;
    circle(c, 982, y + 4, 12, active ? C.brass : C.wire);
    if (i < 3) line(c, 982, y + 20, 982, y + 71, C.wire, 3);
    txt(c, name, 1018, y + 17, 33, C.light);
    mono(c, value, 1740, y + 18, 30, active ? C.brass : C.muted, 'right');
  });
  if (b >= 2) {
    const credential = cue(t, 2, 'provider credential');
    box(c, 964, 805, 792, 65, credential ? C.paper : C.deep, 7);
    txt(
      c,
      credential ? 'Hosted credential stays here' : 'Provider can be replaced in a test',
      989,
      849,
      32,
      credential ? C.ink : C.muted,
    );
  } else if (cue(t, 1, 'prompt version') > 0) mono(c, saved.prompt_version, 1018, 839, 28, C.brass);
}

function input(c, t) {
  const b = t.beat.beatIndex,
    joined = cue(t, 1, 'Follow the account number'),
    rejected = cue(t, 2, 'route rejects'),
    strip = cue(t, 3, 'Strip the surrounding'),
    zero = cue(t, 3, 'The server requires', 0),
    invalidCode = cue(t, 3, 'four twenty-two');
  stage(c, b === 3 ? 'Does the stripped report meet the length limit?' : 'Whose key age is it?');
  if (b === 3) {
    enamel(c, 104, 292, 1712, 501);
    label(c, 'credential_report', 169, 377, C.muted, 30);
    const n = blankReport.length,
      left = 204,
      width = 1510;
    c.save();
    c.globalAlpha = 1 - strip;
    for (let i = 0; i < n; i++) {
      const x = left + (width * i) / n;
      line(c, x, 497, x, 519, C.brass, 4);
      line(c, x, 519, x + 46, 519, C.brass, 4);
      line(c, x + 46, 519, x + 46, 497, C.brass, 4);
    }
    c.restore();
    const stripped = strip === 1;
    if (stripped) mono(c, JSON.stringify(blankReport.trim()), 178, 528, 68, C.brass);
    line(c, 169, 579, 1740, 579, C.wire, 2);
    const afterLength = zero ? blankReport.trim().length + ' characters' : '?';
    const lengthLabel = stripped
      ? 'Length after stripping: ' + afterLength
      : 'Before stripping: ' + n + ' spaces';
    mono(c, lengthLabel, 168, 683, 44, C.light);
    txt(c, 'Accepted length: 10–500', 1742, 681, 36, C.muted, 'Sans', 'right');
    if (invalidCode > 0.12) {
      stamp(c, 121, 898, 'HTTP ' + invalid[1].http, false, 36);
      mono(
        c,
        invalid[1].observed.length + ' provider calls     ' + invalid[1].rows.length + ' new rows',
        593,
        901,
        41,
      );
    }
    return;
  }
  const y = 312;
  box(c, 106, y, 720, 474, C.paper, 18, C.ink, 3);
  label(c, 'Browser request', 145, 380);
  mono(c, request.account_id, 145, 472, 48);
  txt(c, request.credential_report, 145, 561, 36);
  if (b === 0) {
    line(c, 148, 616, 778, 616, C.rim);
    mono(c, 'acct_  +  five digits', 146, 694, 36, C.dim);
  }
  if (b === 2) {
    box(c, 138, 608, 650, 90, '#f0d5bc', 8);
    mono(c, 'credential_age_days: 999', 161, 668, 34, C.red);
  }
  wire(c, 827, 475, 1080, { progress: b === 1 ? joined : 0, color: b === 2 ? C.rim : C.wire });
  if (b === 2 && rejected > 0.1) {
    line(c, 930, 450, 965, 502, C.red, 8);
    line(c, 965, 450, 930, 502, C.red, 8);
  }
  enamel(c, 1080, y, 722, 474);
  label(c, 'Server-owned account record', 1134, 385, C.muted, 27);
  if (b === 1 && joined === 1) {
    mono(c, saved.account_id, 1137, 477, 48, C.light);
    field(c, 1139, 610, 'Key age', facts.credential_age_days + ' days', C.brass);
    field(c, 1512, 610, 'Stale', String(facts.key_stale), C.brass);
  } else {
    mono(c, b === 2 && rejected > 0.1 ? 'Lookup skipped' : 'FACTS', 1136, 513, 45, C.light);
    txt(
      c,
      b === 2 ? 'Extra field in the request' : 'Indexed by account ID',
      1137,
      618,
      31,
      C.muted,
    );
  }
  if (b === 1 && joined === 1)
    txt(
      c,
      'The account ID joins the request to these facts.',
      960,
      899,
      42,
      C.ink,
      'Sans',
      'center',
    );
  if (b === 2 && rejected > 0.3)
    stamp(c, 143, 764, 'HTTP ' + invalid[3].http + '  ·  invalid_request', false);
}

function ageScale(c, x, y, w, days) {
  const minimum = eligible.rotation_window_days;
  line(c, x, y, x + w, y, C.wire, 7);
  line(c, x + (w * minimum) / 60, y, x + w, y, C.ok, 10);
  for (let d = 0; d <= 60; d += 5) {
    const X = x + (w * d) / 60;
    line(c, X, y - 8, X, y + (d % 15 === 0 ? 18 : 7), C.dim, 2);
    if (d % 15 === 0) mono(c, String(d), X, y + 54, 25, C.dim, 'center');
  }
  const gate = x + (w * minimum) / 60;
  line(c, gate, y - 86, gate, y - 10, C.ok, 4);
  label(c, 'Minimum: 30 days', gate - 106, y - 101, C.ok, 26);
  if (days !== null) {
    const X = x + (w * days) / 60;
    poly(
      c,
      [
        [X - 12, y - 13],
        [X + 12, y - 13],
        [X, y + 1],
      ],
      C.gold,
    );
    mono(c, days + ' d', X + 18, y - 34, 30, C.gold);
  }
}
function policy(c, t) {
  const b = t.beat.beatIndex,
    move = cue(t, 2, 'move a stale key'),
    edge = cue(t, 3, 'exactly thirty'),
    missing = cue(t, 3, 'take away the account record');
  let record = cases[0],
    offered = eligible,
    known = true,
    showVerdict = false;
  if (b === 0 && cue(t, 0, 'Both conditions hold') > 0.04) showVerdict = true;
  if (b === 1 || b === 2) {
    const flip = cue(t, 1, 'stale flag to no');
    record = flip < 0.25 ? cases[0] : b === 2 && move === 1 ? cases[1] : cases[2];
    if (b === 2) showVerdict = true;
    if (b === 2 && cue(t, 2, 'provider that returns not eligible') > 0.1) {
      offered = policyCandidate(read(record).facts_json);
      showVerdict = true;
    }
  }
  if (b === 3) {
    record = edge === 1 ? cases[3] : cases[1];
    offered = policyCandidate(read(record).facts_json);
    showVerdict = edge < 1 || cue(t, 3, 'eligible passes') > 0.1;
    known = missing < 0.3;
  }
  if (b === 4) {
    record = cases[4];
    known = false;
    offered = policyCandidate(null);
    showVerdict = true;
  }
  if (b === 5) {
    record = cases[0];
    const extraId = cue(t, 5, 'adds P-eight');
    if (extraId > 0.15) offered = { ...eligible, source_line_ids: ['P-7', 'P-8'] };
    if (cue(t, 5, 'Look at the evidence list') > 0.15) {
      stage(c, 'Which citation fits the evidence contract?', true);
      mono(
        c,
        saved.account_id + '    45 days · stale    candidate: eligible',
        126,
        294,
        37,
        C.light,
      );
      enamel(c, 122, 375, 1051, 453);
      label(c, 'source_line_ids', 178, 462, C.muted, 30);
      txt(c, 'One allowed ID', 173, 574, 49, C.light);
      box(c, 691, 484, 374, 216, C.deep, 14, C.wire, 5);
      const seat = cue(t, 5, 'P-seven fills', 0.8);
      box(c, 720, 449 + seat * 62, 316, 155, C.brass, 9, C.ink, 3);
      mono(c, offered.source_line_ids[0], 878, 554 + seat * 62, 65, C.ink, 'center');
      if (offered.source_line_ids.length > 1) {
        const x = mix(1509, 1285, extraId);
        box(c, x, 510, 316, 155, C.coral, 9, C.ink, 3);
        mono(c, offered.source_line_ids[1], x + 158, 615, 65, C.ink, 'center');
        txt(c, 'Extra citation', x, 735, 36, C.light);
      }
      if (cue(t, 5, 'rejects the whole') > 0.1) {
        stamp(c, 1285, 819, 'Reject candidate', false, 39);
        mono(c, checkPolicy(offered, facts), 1285, 872, 41, C.coral);
      }
      return;
    }
  }
  if (b === 3 && !known) {
    record = cases[4];
    showVerdict = false;
  }
  const recordFacts = read(record).facts_json;
  stage(c, 'Test the candidate against P-7');
  box(c, 104, 272, 1000, 589, C.paper, 15, C.ink, 3);
  label(c, 'Trusted account facts', 153, 341);
  mono(c, read(record).account_id, 153, 419, 43);
  if (known) key(c, 912, 369, 0.49, -0.18);
  ageScale(c, 180, 644, 833, known ? recordFacts.credential_age_days : null);
  txt(c, known ? 'Stale flag' : 'Account lookup', 156, 803, 33, C.dim);
  mono(
    c,
    known ? String(recordFacts.key_stale) : 'missing',
    507,
    804,
    42,
    known && recordFacts.key_stale ? C.ok : C.ink,
  );
  enamel(c, 1150, 271, 663, 590);
  label(c, 'Provider dictionary', 1200, 343, C.muted, 26);
  field(c, 1200, 419, 'Decision', b === 3 && !known ? '?' : offered.decision, C.light);
  field(c, 1200, 552, 'Minimum age', offered.rotation_window_days + '  (integer)', C.light);
  label(c, 'Evidence list', 1200, 687, C.muted);
  offered.source_line_ids.forEach((id, i) => {
    box(c, 1200 + i * 155, 712, 135, 70, i ? C.coral : C.brass, 6);
    mono(c, id, 1268 + i * 155, 759, 37, C.ink, 'center');
  });
  const accepted = checkPolicy(offered, recordFacts) !== 'invalid_decision';
  if (showVerdict)
    stamp(
      c,
      124,
      959,
      (accepted ? 'Accept ' : 'Reject ') +
        (offered.source_line_ids.length > 1 ? 'candidate' : human(offered.decision)),
      accepted,
      39,
    );
  else if ((b === 1 || !known) && b !== 4)
    serif(c, 'Which decision fits these facts?', 123, 961, 47);
}

function timeChart(c, t) {
  const start = cue(t, 5, 'timer starts'),
    stop = cue(t, 5, 'stops after the checker'),
    writes = cue(t, 5, 'Both database writes');
  const xs = [156, 470, 745, 1160, 1470, 1760];
  const names = ['Click', 'First commit', 'Provider', 'Check ends', 'Final commit', 'Display'];
  const yy = 540;
  const [click, firstCommit, provider, checkEnd, finalCommit, display] = xs;
  line(c, xs[0], yy, xs.at(-1), yy, C.wire, 8);
  for (let i = 0; i < xs.length; i++) {
    circle(c, xs[i], yy, 14, C.brass, C.deep, 3);
    txt(c, names[i], xs[i], yy + 67, 32, C.light, 'Sans', 'center');
  }
  const waitY = 346;
  line(c, click, waitY, display, waitY, C.muted, 5);
  line(c, click, waitY, click, waitY + 24, C.muted, 5);
  line(c, display, waitY, display, waitY + 24, C.muted, 5);
  txt(c, 'Luna’s wait', (click + display) / 2, waitY - 26, 41, C.muted, 'Sans', 'center');
  txt(c, 'Schematic timeline', 960, 840, 30, C.muted, 'Sans', 'center');
  if (start > 0.05) {
    const timerY = yy - 67;
    const timerEnd = mix(provider, checkEnd, stop);
    line(c, provider, timerY, timerEnd, timerY, C.brass, 9);
    line(c, provider, timerY, provider, yy - 17, C.brass, 4);
    if (stop === 1) line(c, checkEnd, timerY, checkEnd, yy - 17, C.brass, 4);
    mono(c, 'latency_ms', (provider + timerEnd) / 2, timerY - 27, 39, C.brass, 'center');
  }
  if (writes > 0.05) {
    for (const x of [firstCommit, finalCommit]) {
      circle(c, x, yy, 26, C.deep, C.mint, 4);
      circle(c, x, yy, 10, C.mint);
    }
    txt(c, 'Both commits fall outside latency_ms.', 960, 754, 40, C.mint, 'Sans', 'center');
  }
}
function trace(c, t) {
  const b = t.beat.beatIndex;
  stage(
    c,
    b >= 4 ? 'What does the trace time?' : 'What survives the provider call?',
    true,
  );
  if (b >= 4) {
    timeChart(c, t);
    return;
  }
  const initial = cue(t, 0, 'insert commits'),
    finished = cue(t, 3, 'commit saves completed'),
    row = finished > 0.13 ? saved : during;
  box(c, 114, 285, 809, 578, C.panel, 12, C.wire, 2);
  label(c, 'At submission', 160, 356, C.muted, 26);
  field(c, 160, 435, 'Account', saved.account_id);
  field(c, 585, 435, 'Facts', facts.credential_age_days + ' d · stale');
  field(c, 160, 562, 'Policy / provider', saved.policy_version + '  /  ' + saved.provider);
  field(c, 160, 682, 'Configuration', saved.prompt_version);
  if (b >= 1) {
    mono(c, 'HMAC   ' + saved.input_fingerprint.slice(0, 12) + '…', 160, 804, 34, C.brass);
  }
  if (initial > 0.05) fileRow(c, 1032, 308, 744, 329, row);
  else {
    box(c, 1032, 308, 744, 329, C.deep, 10, C.wire);
    mono(c, 'INSERT INTO tasks', 1083, 410, 37, C.muted);
  }
  if (b === 2) {
    const returned = cue(t, 2, 'returns eligible');
    label(c, 'Provider call 1', 1060, 726, C.muted);
    mono(c, returned > 0.1 ? 'candidate: eligible' : 'working…', 1060, 787, 43, C.brass);
  } else if (b === 3) {
    mono(c, 'WHERE trace_id = ?', 1055, 698, 32, C.brass);
    mono(c, "  AND status = 'running'", 1055, 748, 32, C.brass);
    mono(c, '  AND version = 1', 1055, 798, 32, C.brass);
    if (cue(t, 3, 'matches zero') > 0.05) txt(c, 'Second update: 0 rows', 1055, 871, 37, C.light);
  }
}

function readback(c, t) {
  const b = t.beat.beatIndex,
    opened = cue(t, 0, 'Open a second connection'),
    first = cue(t, 0, 'It says running'),
    done = cue(t, 1, 'final write commits'),
    reopen = cue(t, 1, 'reopen the file'),
    second = cue(t, 1, 'same row now says completed');
  stage(c, 'Read the file from another connection', true);
  // Left, a timeline of the provider call. Right, the read head shows its separate connection.
  label(
    c,
    b === 0 ? 'Real route · provider callback' : 'Real route · saved trace',
    126,
    281,
    C.muted,
    29,
  );
  const phase =
    b === 0 ? 'Inside decide()' : done > 0.1 ? 'Final commit applied' : 'Candidate returned';
  serif(c, phase, 124, 383, 58, C.light);
  const row = done > 0.1 ? saved : during;
  fileRow(c, 120, 469, 660, 326, row, { title: 'SQLite  /  tasks' });
  const railY = 610;
  wire(c, 784, railY, 979, { progress: b === 0 ? opened : reopen, color: C.brass });
  box(c, 982, 268, 824, 532, C.deep, 15, C.wire, 3);
  label(c, 'Independent SQLite reader', 1022, 331, C.muted, 28);
  if (opened > 0.1) {
    mono(c, 'SELECT trace_id, status, version', 1021, 408, 30, C.mint);
    mono(c, 'FROM tasks', 1021, 454, 30, C.mint);
    line(c, 1024, 495, 1760, 495, C.wire, 2);
    const result = (r, y, when) => {
      label(c, when, 1026, y, C.muted, 24);
      mono(c, shortId(r.trace_id), 1025, y + 54, 34, C.light);
      mono(
        c,
        r.status + '   ' + r.version,
        1749,
        y + 54,
        37,
        r.version === 1 ? C.brass : C.mint,
        'right',
      );
    };
    if (first > 0.05) result(during, 553, 'During the provider call');
    if (second > 0.1) result(saved, 698, 'After reopening the file');
    else if (reopen > 0.1) txt(c, 'Reopening the file…', 1026, 728, 35, C.muted);
  } else mono(c, 'connection closed', 1025, 510, 36, C.muted);
  if (b === 0 && opened > 0 && t.beat.beatIndex === 0) {
    const fraction = (t.elapsed % 2) / 2;
    line(c, 133, 823, 743, 823, C.wire, 3);
    circle(c, 133 + fraction * 610, 823, 9, C.brass);
    label(c, 'Provider still working', 136, 855, C.muted, 25);
  }
  if (b === 2) {
    label(c, 'This trace', 127, 827, C.muted);
    mono(
      c,
      'HTTP ' + main[0].http + '   completed → ' + main[0].reply.decision,
      127,
      863,
      34,
      C.mint,
    );
    if (cue(t, 2, 'failed check carries') > 0.03) {
      label(c, 'A separate timeout test', 982, 827, C.muted);
      mono(
        c,
        'HTTP ' + timeout.http + '   failed → ' + timeout.reply.error_code,
        982,
        863,
        34,
        C.coral,
      );
    }
  }
}

function receipt(c, t) {
  const b = t.beat.beatIndex;
  const flight = cue(t, 1, 'response crosses back', 1.3),
    arrived = cue(t, 1, 'shows Eligible'),
    reset = cue(t, 2, 'Reload the page');
  const show = arrived > 0.2 && reset < 0.15;
  stage(c, 'Which trace answered Luna?');
  form(c, 94, 249, 813, 652, {
    pending: !show && reset < 0.15,
    status: reset > 0.15 ? 'Ready' : show ? 'Eligible under P-7' : 'Checking policy P-7…',
    trace: show ? saved.trace_id : null,
    reload: b === 2 && reset > 0.02 && reset < 0.97,
  });
  enamel(c, 1196, 313, 610, 490);
  fileRow(c, 1240, 383, 520, 320, saved, { title: 'SQLite  /  tasks' });
  wire(c, 1195, 554, 908, { progress: flight, color: C.ok });
  if (b === 1 && show) mono(c, '0 rotation jobs', 1250, 757, 32, C.light);
}

function faultRig(c, t) {
  const b = t.beat.beatIndex,
    start = cue(t, 0, 'SQLite reject the insert'),
    empty = cue(t, 0, "It's empty"),
    one = cue(t, 1, 'insert commit'),
    call = cue(t, 1, 'provider is called once'),
    stop = cue(t, 1, 'reject the update'),
    readBack = cue(t, 2, 'returns running'),
    recover = cue(t, 3, 'reconcile the attempt');
  stage(c, 'Which write stopped the request?', true);
  const xs = [355, 590, 830, 1080];
  ['POST', 'INSERT', 'Provider', 'UPDATE'].forEach((v, i) =>
    mono(c, v, xs[i], 300, 30, C.muted, 'center'),
  );
  label(c, 'Independent readback', 1262, 300, C.muted, 25);
  const experiment = (y, name, at, failed, result, attempt, calls, showHttp) => {
    label(c, name, 115, y - 85, C.light, 29);
    line(c, xs[0], y, xs[3], y, C.wire, 5);
    const pos = mix(xs[Math.floor(at)], xs[Math.ceil(at)], at % 1);
    line(c, xs[0], y, pos, y, C.brass, 7);
    xs.forEach((x, i) => circle(c, x, y, 16, i <= at ? C.brass : C.panel, C.deep, 3));
    if (failed) {
      circle(c, pos, y, 28, C.red, C.coral, 3);
      line(c, pos - 10, y - 10, pos + 10, y + 10, C.white, 5);
      line(c, pos - 10, y + 10, pos + 10, y - 10, C.white, 5);
    }
    if (calls !== null)
      mono(
        c,
        calls + (calls === 1 ? ' call' : ' calls'),
        xs[2],
        y + 81,
        60,
        C.light,
        'center',
      );
    if (result) {
      box(c, 1250, y - 62, 532, 126, C.paper, 9);
      mono(c, result, 1280, y - 5, 38, C.ink);
      if (showHttp) mono(c, 'HTTP ' + attempt.http, 1280, y + 43, 27, C.red);
    }
  };
  experiment(
    460,
    'A   Reject INSERT',
    start,
    start === 1,
    empty > 0.14 ? '0 rows' : null,
    insert,
    start === 1 ? insert.observed.length : null,
    empty > 0.2,
  );
  line(c, 110, 594, 1810, 594, C.wire, 2);
  const pos = stop > 0 ? 2 + stop : call > 0 ? 1 + call : one;
  experiment(
    720,
    'B   Reject UPDATE',
    pos,
    stop === 1,
    readBack > 0.1
      ? read(update).status + '  ·  v' + read(update).version
      : stop === 1
        ? 'query pending'
        : null,
    update,
    b >= 1 ? (call === 1 ? update.observed.length : 0) : null,
    stop === 1,
  );
  if (recover > 0.1)
    txt(
      c,
      'Reconcile B before repeating a provider call.',
      962,
      852,
      41,
      C.brass,
      'Sans',
      'center',
    );
}

function errors(c, t) {
  const b = t.beat.beatIndex;
  if (b <= 1) {
    stage(c, 'Which operation failed?');
    const rows = [
      [timeout, 'Adapter raises', 'TimeoutError', 'provider timeout'],
      [extra, 'Checker rejects', 'extra evidence', 'invalid decision'],
      [adapter, 'Adapter raises', 'ValueError', 'provider error'],
    ];
    label(c, 'Operation', 153, 296);
    label(c, 'Cause', 669, 296);
    label(c, 'Code in the failed trace', 1275, 296);
    rows.forEach(([run, name, why, phrase], i) => {
      const y = 343 + i * 129;
      const reveal = cue(t, 0, phrase);
      const active = b === 1 ? i === 0 : reveal > 0.08;
      box(
        c,
        109,
        y,
        1697,
        110,
        active ? C.paper : '#dfdabe',
        10,
        active ? C.ink : C.rim,
        active ? 3 : 1,
      );
      txt(c, name, 151, y + 75, 42);
      mono(c, why, 670, y + 75, 34, C.dim);
      if (b === 1 || active) mono(c, read(run).error_code, 1276, y + 75, 36, active ? C.red : C.dim);
    });
    if (b === 1) {
      const compare = cue(t, 1, 'Both carry');
      box(c, 111, 740, 1696, 106, C.forest, 10);
      if (compare) {
        mono(c, 'response.error_code', 152, 783, 28, C.muted);
        mono(c, timeout.reply.error_code, 152, 822, 35, C.light);
        mono(c, 'row.error_code', 955, 783, 28, C.muted);
        mono(c, read(timeout).error_code, 955, 822, 35, C.light);
      } else mono(c, 'TestClient  →  POST /rotation/decide', 152, 812, 37, C.light);
    }
    return;
  }
  if (b === 2) {
    stage(c, 'What goes into the fingerprint?');
    enamel(c, 110, 289, 1698, 568);
    label(c, 'Validated request', 162, 367, C.brass, 32);
    field(c, 163, 435, 'Account', validatedRequest.account_id);
    field(c, 650, 435, 'Item', validatedRequest.item);
    field(c, 163, 549, 'Report', validatedRequest.credential_report);
    const mac = cue(t, 2, 'digest made with a key');
    line(c, 167, 646, 1742, 646, C.wire, 3);
    label(c, 'Stored HMAC-SHA256', 162, 718, C.muted, 27);
    if (mac > 0.1) mono(c, saved.input_fingerprint, 163, 790, 36, C.brass);
    if (cue(t, 2, 'secret key') > 0.1)
      txt(c, 'Protect the key, fingerprints and account records.', 145, 952, 38, C.ink);
    return;
  }
  const repeated = cue(t, 3, 'same valid report twice'),
    two = cue(t, 3, 'Two traces');
  if (repeated < 0.05) {
    stage(c, 'What does the timeout stub prove?');
    enamel(c, 112, 318, 1694, 443);
    field(c, 181, 450, 'Timeout stub', 'Raises immediately → route records ' + read(timeout).error_code);
    if (cue(t, 3, 'Testing a network deadline') > 0)
      field(c, 181, 620, 'Transport deadline test', 'Stall the connection and measure the timeout', C.brass);
    return;
  }
  stage(c, 'Does a matching fingerprint reuse a result?');
  label(c, 'Same validated input', 129, 284, C.dim, 28);
  for (const [i, run] of main.entries()) {
    const x = 115 + i * 880;
    const row = read(run);
    if (i === 0 || two > 0.15) {
      fileRow(c, x, 345, 797, 325, row, { title: 'Submission ' + (i + 1) });
      mono(c, 'HMAC ' + row.input_fingerprint.slice(0, 14) + '…', x + 20, 743, 37);
    }
  }
  if (cue(t, 3, 'Their keyed fingerprints') > 0)
    stamp(c, 132, 831, main.length + ' traces   ·   ' + main.flatMap((run) => run.observed).length + ' provider calls', true, 40);
}

function browser(c, t) {
  const b = t.beat.beatIndex;
  const incoming = cue(t, 0, 'When a reply arrives'),
    firstLabel = cue(t, 0, 'writes that label');
  const accepted = cue(t, 1, 'Accept it'),
    gap = cue(t, 3, 'Drop a reply'),
    detected = cue(t, 3, 'detects the network error'),
    conflict = cue(t, 4, 'fields in conflict');
  let pending =
    b === 0
      ? firstLabel < 0.2
      : b === 1
        ? accepted < 1
        : b === 3
          ? detected < 0.2
          : b === 4
            ? conflict < 0.2
            : false;
  let state = pending
    ? 'Checking policy P-7…'
    : b >= 3
      ? 'Request unavailable'
      : b === 0
        ? 'Eligible under P-7'
        : 'Not eligible under P-7';
  stage(c, b >= 3 ? 'What evidence reached the page?' : 'What can Luna’s page show?');
  const row = b === 0 ? saved : read(negative);
  form(c, 98, 252, 854, 659, {
    pending,
    status: state,
    account: row.account_id,
    report: b === 0 ? request.credential_report : 'Please consider an exception.',
    trace: !pending && b < 3 ? row.trace_id : null,
  });
  const X = 1198;
  if (b === 0) {
    enamel(c, X, 303, 609, 499);
    label(c, 'Response checks', X + 49, 382, C.muted, 28);
    const yes = incoming === 1;
    for (const [i, s] of ['32 hex characters', 'Exactly [P-7]', 'Completed + decision'].entries()) {
      circle(c, X + 67, 469 + i * 76, 11, yes ? C.mint : C.wire);
      txt(c, s, X + 97, 480 + i * 76, 35, C.light);
    }
    if (!pending) mono(c, 'textContent', X + 51, 748, 39, C.brass);
  } else if (b === 4) {
    enamel(c, X, 311, 610, 484);
    label(c, 'Unusable response', X + 46, 388, C.muted, 29);
    field(c, X + 46, 465, 'status', 'failed', C.coral);
    field(c, X + 46, 612, 'decision', 'eligible', C.coral);
    if (!pending) txt(c, 'A failure requires a null decision.', 1183, 903, 32, C.red);
  } else {
    fileRow(c, X, 372, 609, 315, row, { title: 'SQLite  /  tasks' });
    txt(c, '45 days old  ·  stale = false', X + 10, 762, 34);
    if (b === 2) stamp(c, X + 10, 860, '0 rotation jobs', true, 32);
  }
  wire(c, X, 545, 954, {
    progress: b === 0 ? incoming : b === 1 ? accepted : 0,
    broken: b === 3 ? gap : 0,
    color: b === 3 ? C.red : C.wire,
  });
}

function container(c, x, y, w, h, name, hasFile) {
  box(c, x, y, w, h, C.panel, 8, C.wire, 3);
  for (let dx = 24; dx < w - 12; dx += 34) {
    line(c, x + dx, y + 22, x + dx, y + h - 18, '#30584e', 8);
  }
  box(c, x + 22, y + 23, w - 44, 60, C.deep, 6);
  mono(c, name, x + 43, y + 64, 28, C.light);
  if (hasFile) {
    box(c, x + 37, y + 123, w - 74, 88, C.paper, 7);
    mono(c, 'rotation_tasks.sqlite3', x + 56, y + 179, 27);
  } else mono(c, 'fresh filesystem', x + 45, y + 180, 31, C.muted);
}
function evaluation(c, t) {
  const b = t.beat.beatIndex;
  const matches = cases.filter((run, i) =>
    run.reply.decision === expectedDecisions[i] && read(run).result_json.decision === expectedDecisions[i],
  ).length;
  if (b === 0 || (b === 1 && cue(t, 1, 'try four malformed') < 0.05)) {
    stage(c, 'Which case catches the boundary error?', true);
    const start = cue(t, 0, 'Submit each account', 2.2),
      readAgain = cue(t, 0, 'reopen its trace', 1.5);
    const columns = [139, 516, 932, 1394];
    ['Fixture account', 'Trusted facts', 'Expected', 'SQLite readback'].forEach((s, i) =>
      label(c, s, columns[i], 298, C.muted, 26),
    );
    cases.forEach((run, i) => {
      const y = 379 + 104 * i,
        r = read(run),
        f = r.facts_json;
      const visible = b === 1 || start * 5 > i;
      if (
        (i === 3 && cue(t, 0, 'thirty-day case') > 0) ||
        (i === 4 && cue(t, 0, 'missing account') > 0)
      )
        box(c, 109, y - 49, 1694, 75, C.panel, 7);
      mono(c, r.account_id, columns[0], y, 33, C.light);
      txt(
        c,
        f ? f.credential_age_days + ' d · ' + (f.key_stale ? 'stale' : 'current') : 'No record',
        columns[1],
        y,
        36,
        C.light,
      );
      mono(c, expectedDecisions[i], columns[2], y, 33, C.light);
      mono(
        c,
        visible && readAgain * 5 > i ? r.result_json.decision : '…',
        columns[3],
        y,
        34,
        C.mint,
      );
      line(c, 134, y + 40, 1777, y + 40, C.wire, 1);
    });
    if (b === 1) txt(c, 'All five HTTP decisions match the saved outcomes.', 136, 956, 35, C.mint);
    return;
  }
  if (b === 1) {
    const stopped = cue(t, 1, 'All four stop'),
      probe = cue(t, 1, 'health route'),
      ok = cue(t, 1, 'returns okay'),
      counted = cue(t, 1, 'To test storage', 0),
      recap = cue(t, 1, 'With these results', 0);
    stage(c, recap ? 'What still needs a separate test?' : 'How far did each test go?', true);
    label(c, 'POST /rotation/decide', 125, 297, C.muted, 28);
    if (recap) {
      enamel(c, 117, 340, 974, 435);
      label(c, 'Five fixture accounts through the real route', 168, 437, C.muted, 30);
      serif(c, matches + ' of ' + cases.length + ' decisions match', 168, 565, 63, C.light);
      mono(c, matches + ' matching saved outcomes', 168, 678, 38, C.mint);
    } else {
      const names = ['Wrong account format', 'Whitespace only', 'Wrong item', 'Extra key age'];
      names.forEach((name, i) => {
        const y = 371 + 103 * i;
        box(c, 117, y - 36, 974, 81, C.panel, 6);
        txt(c, name, 145, y + 18, 38, C.light);
        if (stopped > 0.08) mono(c, 'HTTP ' + invalid[i].http, 1040, y + 18, 36, C.coral, 'right');
      });
      if (stopped > 0.08) mono(c, '0 calls  ·  0 new rows', 138, 861, 41, C.brass);
    }
    if (probe > 0.05) {
      enamel(c, 1193, 340, 605, 435);
      mono(c, 'GET /healthz', 1244, 439, 39, C.light);
      if (ok > 0.1) serif(c, health.status, 1244, 574, 93, C.mint);
      if (counted) {
        label(c, 'Calls recorded by provider spy', 1244, 642, C.muted, 26);
        mono(c, String(health.calls), 1244, 708, 52, C.light);
      }
    }
    return;
  }
  if (b < 4) {
    stage(
      c,
      b === 2
        ? 'What does a green fixture suite establish?'
        : 'Where would you change the minimum age?',
    );
    if (b === 3) {
      enamel(c, 113, 301, 1690, 496);
      label(c, 'P-7   /   policy code', 173, 388, C.muted, 28);
      mono(c, 'key_stale and credential_age_days >= 30', 173, 519, 48, C.brass);
      line(c, 172, 590, 1743, 590, C.wire, 2);
      txt(c, 'Boundary tests for stale keys', 170, 684, 38, C.light);
      mono(c, '29 d → no     30 d → yes', 797, 685, 43, C.mint);
      return;
    }
    const x1 = 117,
      x2 = 1007;
    label(c, 'Controlled provider', x1, 300);
    label(c, 'Hosted provider', x2, 300);
    box(c, x1, 347, 780, 384, C.paper, 11, C.ink, 3);
    enamel(c, x2, 347, 793, 384);
    serif(c, 'Fixture cases', x1 + 42, 439, 58);
    mono(c, matches + ' / ' + cases.length, x1 + 41, 571, 75, C.ok);
    txt(c, 'HTTP reply and stored result', x1 + 44, 666, 36, C.dim);
    serif(c, 'Labeled evaluation', x2 + 49, 444, 55, C.light);
    if (cue(t, 2, 'measure its errors') > 0.05) {
      ['Decision errors', 'Latency', 'Cost per attempt'].forEach((v, i) =>
        txt(c, v, x2 + 51, 525 + i * 63, 38, C.brass),
      );
    }
    if (cue(t, 2, 'one owner') > 0.06)
      mono(c, 'Bound the deadline, retry count and budget.', 127, 879, 37);
    else if (cue(t, 2, 'Before a public launch') > 0)
      txt(c, 'Test account access and concurrent load.', 127, 879, 42);
    else if (cue(t, 2, 'Stall the transport') > 0)
      txt(c, 'Stall the connection and measure the deadline.', 127, 879, 42);
    return;
  }
  stage(c, 'What survives a container replacement?', true);
  const replace = cue(t, 4, 'Replace that container'),
    volume = cue(t, 4, 'persistent storage');
  const mounted = volume > 0.05;
  container(c, 112, 348, 672, 308, 'Original container', !mounted);
  wire(c, 789, 508, 1122, { progress: replace, color: C.muted });
  if (replace > 0.08) container(c, 1126, 348, 674, 308, 'Replacement container', false);
  if (mounted) {
    box(c, 137, 766, 1647, 122, C.paper, 13, C.ink, 3);
    mono(c, 'Mounted persistent volume', 175, 843, 39);
    mono(c, 'rotation_tasks.sqlite3', 1744, 843, 36, C.ok, 'right');
    txt(c, 'File mounted from the start', 146, 296, 34, C.mint);
    line(c, 443, 657, 443, 766, C.mint, 6);
    line(c, 1422, 657, 1422, 766, C.mint, 6);
  } else label(c, 'File inside the original container', 130, 746, C.muted, 30);
}

function finalTrial(c, t) {
  const b = t.beat.beatIndex;
  function after(beat, phrase, captionStart) {
    if (b !== beat) return b > beat;
    if (captionStart) t.reveal(phrase, 0, { captionStart });
    return t.elapsed + 1e-9 >= t.wordCue(phrase).end;
  }
  const fixed = after(0, 'Both candidates say eligible, cite just P-seven, and give the integer thirty'),
    age29 = after(0, 'twenty-nine days old'),
    age30 = after(0, 'the other is thirty'),
    completed = after(1, 'Its final write saves completed with eligible', 'Its final write'),
    failed = after(1, 'The final write saves failed with invalid decision', 'The final write'),
    send = cue(t, 1, 'Each reply now carries', 1.2),
    drop = cue(t, 2, 'lose both replies', 1.2),
    prediction = cue(t, 2, 'what message'),
    unavailable = after(3, 'Request unavailable', 'Request unavailable'),
    retry = cue(t, 3, 'Submitting again'),
    lookup = after(3, 'authorized lookup for that attempt');

  const traceX = 461;
  const traceWidth = 465;
  const browserX = 1371;
  const browserWidth = 436;
  const wireStart = traceX + traceWidth;
  const gapX = (wireStart + browserX) / 2;
  const packetWidth = 80;
  const packetStart = wireStart + packetWidth / 2 + 6;
  const packetInFlight = wireStart + 113;
  const lost = drop === 1;
  const packetX = drop > 0
    ? mix(packetInFlight, gapX - packetWidth / 2 - 3, drop)
    : mix(packetStart, packetInFlight, send);

  stage(c, 'Two checks, one day apart', true);
  if (fixed) {
    const { decision, rotation_window_days, source_line_ids } = eligible;
    mono(
      c,
      `Candidate   ${decision} · min ${rotation_window_days} d · ${JSON.stringify(source_line_ids)}`,
      117, 257, 34, C.brass,
    );
  }
  let prompt;
  if (b === 2 && prediction > 0.1) prompt = 'What can either browser show?';
  if (retry > 0.1) prompt = 'Resubmitting starts a new check.';
  if (lookup) prompt = 'Recovery needs an authorized lookup.';
  if (prompt) txt(c, prompt, 1807, 257, 37, C.light, 'Sans', 'right');

  label(c, 'Trusted facts', 118, 341, C.muted, 28);
  label(c, 'SQLite trace', traceX, 341, C.muted, 28);
  txt(c, 'HTTP reply', gapX, 341, 28, C.muted, 'Sans', 'center', 600);
  label(c, 'Luna’s browser', browserX, 341, C.muted, 28);
  trials.forEach((run, i) => {
    const committed = i === 0 ? failed : completed;
    const showAge = i === 0 ? age29 : age30;
    const row = committed ? read(run) : run.observed[0][0];
    const y = 382 + i * 251;
    const replyY = y + 109;
    const rejected = row.status === 'failed';
    const statusColor = !committed ? C.gold : rejected ? C.red : C.ok;
    key(c, 155, y + 109, 0.49, -0.25);
    if (showAge) serif(c, row.facts_json.credential_age_days + ' days', 274, y + 123, 49, C.light);
    txt(c, row.facts_json.key_stale ? 'Stale key' : 'Current key', 135, y + 176, 34, C.muted);

    box(c, traceX, y, traceWidth, 212, C.paper, 12, C.ink, 2);
    const idX = traceX + 28;
    const prefix = shortId(row.trace_id);
    mono(c, prefix, idX, y + 52, 32, C.dim);
    if (lookup) line(c, idX, y + 64, idX + c.measureText(prefix).width, y + 64, C.ok, 4);
    mono(c, 'v' + row.version, wireStart - 28, y + 52, 32, C.dim, 'right');
    txt(c, row.status, idX, y + 120, 50, statusColor, 'Sans', 'left', 600);
    mono(c, row.error_code ?? row.result_json?.decision ?? 'result = NULL', idX, y + 177, 33);

    wire(c, wireStart, replyY, browserX, { broken: lost ? 1 : 0 });
    if (committed && send > 0 && !lost) {
      packet(c, packetX, replyY, packetWidth, rejected ? C.coral : C.mint);
    }

    box(c, browserX, y, browserWidth, 212, C.paper, 12, C.ink, 3);
    box(c, browserX + 1, y + 1, browserWidth - 2, 49, C.base, [11, 11, 0, 0]);
    circle(c, browserX + 26, y + 26, 7, C.rim);
    mono(c, '127.0.0.1', browserX + 50, y + 35, 23, C.dim);
    txt(
      c, unavailable ? 'Request unavailable' : 'Checking policy…', browserX + 24, y + 137,
      39, unavailable ? C.red : C.ink, 'Sans', 'left', 600,
    );
  });
}

const painters = [
  opening,
  assemble,
  input,
  policy,
  trace,
  readback,
  receipt,
  faultRig,
  errors,
  browser,
  evaluation,
  finalTrial,
];

function check() {
  assert.equal(cases.length, 5);
  assert.deepEqual(cases.map((run) => run.reply.decision), expectedDecisions);
  for (const run of [...cases, ...main, negative, extra, timeout, adapter, ...trials]) {
    const r = read(run),
      observed = run.observed[0][0];
    assert.equal(run.http, 200);
    assert.match(r.trace_id, /^[a-f0-9]{32}$/u);
    assert.equal(r.trace_id, observed.trace_id);
    assert.equal(r.trace_id, run.reply.trace_id);
    assert.deepEqual(
      [observed.status, observed.version, observed.result_json],
      ['running', 1, null],
    );
    assert.equal(r.version, 2);
    assert.equal(r.status, run.reply.status);
    assert.deepEqual(r.result_json, run.reply);
    if (r.status === 'completed') {
      assert.equal(run.reply.decision, trustedDecision(r.facts_json));
      assert.deepEqual(run.reply.source_line_ids, ['P-7']);
    }
  }
  assert.equal(
    checkPolicy({ ...eligible, source_line_ids: ['P-7', 'P-8'] }, facts),
    extra.reply.error_code,
  );
  assert.equal(checkPolicy({ ...eligible, rotation_window_days: '30' }, facts), 'invalid_decision');
  assert.deepEqual(
    trials.map((r) => [
      read(r).facts_json.credential_age_days,
      checkPolicy(eligible, read(r).facts_json),
    ]),
    [
      [29, 'invalid_decision'],
      [30, 'eligible'],
    ],
  );
  assert.deepEqual(
    trials.map((r) => r.reply.error_code || r.reply.decision),
    ['invalid_decision', 'eligible'],
  );
  assert.notEqual(trials[0].reply.trace_id, trials[1].reply.trace_id);
  assert.ok(trials.every((run) => read(run).facts_json.key_stale === true));
  assert.equal(saved.input_fingerprint, read(main[1]).input_fingerprint);
  assert.equal(
    createHmac('sha256', 'classroom-fixture-only').update(JSON.stringify(validatedRequest)).digest('hex'),
    saved.input_fingerprint,
  );
  assert.equal(blankReport.trim().length, 0);
  assert.equal(validateRequest({ ...request, credential_report: blankReport }), 'invalid_request');
  assert.notEqual(saved.trace_id, read(main[1]).trace_id);
  assert.deepEqual(
    invalid.map((r) => [r.http, r.observed.length, r.rows.length]),
    Array.from({ length: 4 }, () => [422, 0, 0]),
  );
  assert.deepEqual([insert.http, insert.observed.length, insert.rows.length], [503, 0, 0]);
  assert.deepEqual(
    [update.http, update.observed.length, read(update).status, read(update).version],
    [503, 1, 'running', 1],
  );
  assert.deepEqual(
    [timeout, extra, adapter].map((run) => [run.reply.error_code, read(run).error_code]),
    [['provider_timeout', 'provider_timeout'], ['invalid_decision', 'invalid_decision'], ['provider_error', 'provider_error']],
  );
  assert.deepEqual(Object.keys(timeout.reply).sort(), ['decision', 'error_code', 'source_line_ids', 'status', 'trace_id']);
  assert.equal(read(timeout).provider, saved.provider);
  assert.equal(read(timeout).input_fingerprint, saved.input_fingerprint);
  assert.equal(main.flatMap((run) => run.observed).length, 2);
  assert.equal(negative.reply.decision, 'not_eligible');
  assert.deepEqual(health, { status: 'ok', calls: 0 });
  assert.ok(!JSON.stringify([saved, timeout, adapter]).includes(request.credential_report));
}
export default {
  title: 'First AI App End-to-End',
  preparePicture: prepareCaptions,

  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check,
};
